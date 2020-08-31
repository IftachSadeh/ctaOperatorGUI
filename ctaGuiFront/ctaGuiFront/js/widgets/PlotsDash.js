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
var main_script_tag = 'PlotsDash'
// -------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global sock */
/* global Locker */
/* global RunLoop */
/* global dom_add */
/* global run_when_ready */
/* global disable_scroll_svg */
/* global PlotTimeSeries */
/* global ScrollBox */
/* global PlotBrushZoom */

window.load_script({
    source: main_script_tag,
    script: '/js/utils/PlotTimeSeriesV2.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/ScrollBox.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/PlotTimeBar.js',
})
window.load_script({
    source: main_script_tag,
    script: '/js/utils/PlotBrushZoom.js',
})
window.load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/common_d3.js',
})
// // load additional js files:
// window.load_script({ source:main_script_tag, script:"/js/utils_scrollGrid.js"});

// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 12
    let w0 = 12
    let div_key = 'main'
    let content = '<div id=\'' + opt_in.base_name + div_key + '\'>'
  + '</div>'

    opt_in.widget_func = {
        sock_func: sock_plots_dash,
        main_func: main_plots_dash,
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
        content: content,
    }

    sock.add_to_table(opt_in)
}

// -------------------------------------------------------------------
// additional socket events for this particular widget type
// -------------------------------------------------------------------
let sock_plots_dash = function(opt_in) {
    // let widget_id = opt_in.widget_id
    let widget_type = opt_in.widget_type
    let widget_source = opt_in.widget_source

    // FUNCTION TO SEND DATA TO THE REDIS DATABASE (need eqivalent function in .py)
    this.pushNewHierachyKeys = function(opt_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        let data = {
        }
        data.widget_id = opt_in.widget_id
        data.newKeys = opt_in.newKeys

        let emit_data = {
            widget_source: widget_source,
            widget_name: widget_type,
            widget_id: data.widget_id,
            method_name: 'plotDash_push_new_hirch_keys',
            method_arg: data,
        }
        sock.socket.emit('widget', emit_data)
    }
}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// here we go with the content of this particular widget
// -------------------------------------------------------------------
let main_plots_dash = function(opt_in) {
    // let my_unique_id = unique()
    window.colorPalette = get_color_theme('bright_grey')
    let is_south = window.SITE_TYPE === 'S'

    let widget_type = opt_in.widget_type
    let tag_arr_zoomerPlotsSvg = opt_in.base_name

    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele
    let icon_divs = opt_in.icon_divs

    let shared = {
        server: {
        },
        time: {
            current: undefined,
            from: undefined,
            range: undefined,
        },
        data: [],
    }
    let svg = {
    }
    let box = {
    }
    let svg_dims = {
    }

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
    let middleSeparation = 0

    function pushNewHierachyKeys() {
    // locker.add('pushNewHierachyKeys')
        sock.all_widgets[widget_type].sock_func.pushNewHierachyKeys({
            widget_id: widget_id,
            newKeys: shared.server.hierarchy.keys,
        })
    }
    this.pushNewHierachyKeys = pushNewHierachyKeys

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

            function adjustDim() {
                box.urgentPlots = {
                    x: 0,
                    y: 0,
                    w: svg_dims.w[0],
                    h: middleSeparation - 20, // svg_dims.h[0] * 0.5
                }
                // svgUrgentPlots.adjustScrollBox()
                // svgUrgentPlots.update_data()

                box.pinnedPlots = {
                    x: 0,
                    y: svg_dims.h[0] * 0.5,
                    w: svg_dims.w[0] * 0.5,
                    h: svg_dims.h[0] * 0.5,
                }
                // svgPinnedPlots.adjustScrollBox()
                // svgPinnedPlots.adjustPlotDistribution()
            }

            $(window).resize(
                function() {
                    adjustDim()
                })

            svg.back = svg.svg.append('g')
            svg.g = svg.svg.append('g')

            middleSeparation = svg_dims.h[0] * 0.365
        }
        function initBackground() {
            // svg.svg.style('background', colorPalette.medium.background)
            let middleBarPos = {
                x: 0,
                y: middleSeparation,
            }
            function dragstarted(d) {}
            function dragged(d) {
                middleBarPos.y = middleBarPos.y + d3.event.dy
                gmiddle.attr('transform', 'translate(' + middleBarPos.x + ',' + middleBarPos.y + ')')
            }
            function dragended(d) {}

            let gmiddle = svg.back.append('g')
                .attr('transform', 'translate(' + middleBarPos.x + ',' + middleBarPos.y + ')')
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended))
            gmiddle.append('rect')
                .attr('x', 0)
                .attr('y', -10)
                .attr('width', svg_dims.w[0])
                .attr('height', 20)
                .style('opacity', 0)
                .style('cursor', 'pointer')
            gmiddle.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', svg_dims.w[0])
                .attr('y2', 0)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.4)
                .attr('stroke-opacity', 0.6)
                .style('pointer-events', 'none')
            gmiddle.append('svg:image')
                .attr('xlink:href', '/static/icons/up-triangle.svg')
                .attr('x', (svg_dims.w[0] - 18) + 'px')
                .attr('y', -14 + 'px')
                .attr('width', '12px')
                .attr('height', '12px')
                .style('pointer-events', 'none')
            gmiddle.append('svg:image')
                .attr('xlink:href', '/static/icons/down-triangle.svg')
                .attr('x', (svg_dims.w[0] - 18) + 'px')
                .attr('y', 2 + 'px')
                .attr('width', '12px')
                .attr('height', '12px')
                .style('pointer-events', 'none')
        }
        function initBox() {
            box.urgentPlots = {
                x: 0,
                y: 0,
                w: svg_dims.w[0],
                h: middleSeparation - 20,
            }
            box.pinnedPlots = {
                x: 0,
                y: middleSeparation + 20,
                w: svg_dims.w[0] * 1,
                h: svg_dims.h[0] - middleSeparation - 20,
            }
            box.focusPlots = {
                x: svg_dims.w[0] * 0.5,
                y: middleSeparation + 20,
                w: svg_dims.w[0] * 0.5,
                h: svg_dims.h[0] - middleSeparation - 20,
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
                // if (end_time_sec < Number(shared.data.server.time_of_night.now)) return colorPalette.blocks.shutdown
                let state = is_def(opt_in.exe_state.state)
                    ? opt_in.exe_state.state
                    : undefined
                let can_run = is_def(opt_in.exe_state.can_run)
                    ? opt_in.exe_state.can_run
                    : undefined
                if (state === 'wait') {
                    return colorPalette.blocks.wait
                }
                else if (state === 'done') {
                    return colorPalette.blocks.done
                }
                else if (state === 'fail') {
                    return colorPalette.blocks.fail
                }
                else if (state === 'run') {
                    return colorPalette.blocks.run
                }
                else if (state === 'cancel') {
                    if (is_def(can_run)) {
                        if (!can_run) {
                            return colorPalette.blocks.cancelOp
                        }
                    }
                    return colorPalette.blocks.cancelSys
                }
                else {
                    return colorPalette.blocks.shutdown
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

        let svg_div_id = sgv_tag.main.id + ''
        let parent = sgv_tag.main.widget.get_ele(sgv_tag.main.id)

        let svg_div = sgv_tag.main.widget.get_ele(svg_div_id)
        if (!is_def(svg_div)) {
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

        for (let key in data_in.data) {
            shared.server[key] = data_in.data[key]
        }
        // shared.server.urgent.urgentKey = shared.server.hierarchy.relationship[shared.server.hierarchy.key].children

        shared.time.current = new Date(shared.server.time_of_night.date_now)
        shared.time.range = 1000 * (3600 * parseInt(3) + 60 * parseInt(0))
        shared.time.from = new Date()
        shared.time.from.setTime(shared.time.current.getTime() - shared.time.range)

        // loadMesures()

        // svgUrgentPlots.init_data()

        svgPinnedPlots.init_data()

    // drawfakefocus()
    }
    this.init_data = init_data
    function update_dataOnce(data_in) {
        if (!locker.are_free([ 'pushNewHierachyKeys' ])) {
            setTimeout(function() {
                update_dataOnce(data_in)
            }, 10)
            return
        }
        locker.add('update_data')
        // let tempsavehierarchy =  shared.server.hierarchy
        for (let key in data_in.data) {
            shared.server[key] = data_in.data[key]
        }

        // shared.server.hierarchy.keys = tempsavehierarchy.keys
        // shared.server.urgent.urgentKey = shared.server.hierarchy.relationship[shared.server.hierarchy.key].children
        shared.time.current = new Date(shared.server.time_of_night.date_now)
        // updateMeasures()

        svgPinnedPlots.update_data()

        // svgUrgentPlots.update_data()

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

    function initScrollBox(tag, g, box, background, isVertical) {
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
            scrollVertical: isVertical,
            scroll_horizontal: !isVertical,
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
    let colorCategory = [ '#dddddd' ]
    // let colorCategory = ['#440154FF', '#482677FF', '#404788FF', '#33638DFF', '#287D8EFF', '#1F968BFF', '#29AF7FFF', '#55C667FF', '#95D840FF', '#DCE319FF']
    // let colorCategory = ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#dedede','#c7eae5','#80cdc1','#35978f','#01665e','#003c30']
    function updateMeasures() {
        function addPlot() {
            for (let z = 0; z < shared.server.urgent.urgentKey.length; z++) {
                if (Math.random() > 0.85) {
                    // let insert = true
                    let toadd = {
                        id: 'id' + Math.floor(Math.random() * 200),
                        added: shared.time.current,
                        type: shared.server.urgent.urgentKey[z],
                        name: shared.server.urgent.urgentKey[z],
                        status: fillfun(0),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                        subMeasures: [],
                    }
                    shared.server.fullList.push(toadd)
                    shared.server.urgent.urgent_current[z].data.push(toadd)
                    shared.server.category[z].data.push(toadd)
                    // insert = false
                    // if (insert) {
                    //   shared.server.urgent.urgent_current.push({key: shared.server.urgent.urgentKey[z], data: [toadd]})
                    // }

                    if (shared.server.history.timestamp.length === 0) {
                        shared.server.history.timestamp.push({
                            key: shared.time.current,
                        })
                    }
                    if (shared.server.history.timestamp.length > 0 && shared.server.history.timestamp[shared.server.history.timestamp.length - 1].key === shared.time.current) {
                        if (shared.server.history.timestamp[shared.server.history.timestamp.length - 1].hasOwnProperty(toadd.type)) {
                            shared.server.history.timestamp[shared.server.history.timestamp.length - 1][toadd.type].data.push(toadd)
                        }
                        else {
                            shared.server.history.timestamp[shared.server.history.timestamp.length - 1][toadd.type] = {
                                data: [ toadd ],
                                remove: [],
                            }
                        }
                        let tot = 0
                        $.each(shared.server.history.timestamp[shared.server.history.timestamp.length - 1], function(key, value) {
                            if (key !== 'key' && value.data.length > shared.server.history.max) {
                                shared.server.history.max = value.data.length
                            }
                        })
                        // if (tot > shared.server.history.max) {
                        //   shared.server.history.max = tot
                        // }
                    }
                    else {
                        let newt = deep_copy(shared.server.history.timestamp[shared.server.history.timestamp.length - 1])
                        newt.key = shared.time.current
                        if (newt.hasOwnProperty(toadd.type)) {
                            newt[toadd.type].data.push(toadd)
                        }
                        else {
                            newt[toadd.type] = {
                                data: [ toadd ],
                                remove: [],
                            }
                        }
                        shared.server.history.timestamp.push(newt)
                        let tot = 0
                        $.each(newt, function(key, value) {
                            if (key !== 'key' && value.data.length > shared.server.history.max) {
                                shared.server.history.max = value.data.length
                            }
                        })
                        // if (tot > shared.server.history.max) {
                        //   shared.server.history.max = tot
                        // }
                    }
                }
            }
        }
        function update() {
            // for (let z = shared.server.urgent.urgent_current.length - 1; z >= 0; z--) {
            //   let type = shared.server.urgent.urgent_current[z][0].type
            //   for (let i = shared.server.urgent.urgent_current[z].length - 1; i >= 0; i--) {
            //     let todelete = Math.random() > 0.95
            //     if (todelete && !shared.server.urgent.urgent_current[z][i].ended) {
            //       shared.server.urgent.urgent_current[z][i].ended = shared.time.current
            //       // shared.server.urgent.urgent_current[z].splice(i, 1)
            //       // continue
            //     }
            //     shared.server.urgent.urgent_current[z][i].status = fillfun(index)
            //     index += 1
            //     for (let j = 0; j < shared.server.urgent.urgent_current[z][i].subMeasures.length; j++) {
            //       shared.server.urgent.urgent_current[z][i].subMeasures[j].status = fillfun(index)
            //       index += 1
            //     }
            //   }
            //   for (let i = shared.server.urgent.urgent_current[z].length - 1; i >= 0; i--) {
            //     if (shared.server.urgent.urgent_current[z][i].ended) {
            //       if ((shared.time.current.getTime() - shared.server.urgent.urgent_current[z][i].ended.getTime()) > 400000) shared.server.urgent.urgent_current[z].splice(i, 1)
            //     }
            //   }
            // }
        }
        function removePlot() {
            for (let z = 0; z < shared.server.urgent.urgentKey.length; z++) {
                for (let i = shared.server.urgent.urgent_current[z].data.length - 1; i >= 0; i--) {
                    if (Math.random() > 0.95) {
                        let rem = shared.server.urgent.urgent_current[z].data.splice(i, 1)[0]
                        rem.ended = shared.time.current

                        // let insert = true
                        // for (let i = 0; i < shared.server.fullList.length; i++) {
                        //   if (shared.server.fullList[i].key === rem.type) {
                        //     shared.server.fullList[i].data.push(rem)
                        //     insert = false
                        //     continue
                        //   }
                        // }
                        // if (insert) {
                        //   shared.server.fullList.push({key: rem.type,
                        //     data: [rem]})
                        // }
                        // if (shared.server.urgent.urgent_current[z].data.length === 0) shared.server.urgent.urgent_current.splice(z, 1)

                        if (shared.server.history.timestamp.length > 0 && shared.server.history.timestamp[shared.server.history.timestamp.length - 1].key === shared.time.current) {
                            let index = shared.server.history.timestamp[shared.server.history.timestamp.length - 1][rem.type].data.indexOf(rem.id)
                            if (index !== -1) {
                                shared.server.history.timestamp[shared.server.history.timestamp.length - 1][rem.type].data.splice(index, 1)
                                shared.server.history.timestamp[shared.server.history.timestamp.length - 1][rem.type].remove.push(rem)
                            }
                        }
                        else {
                            let newt = deep_copy(shared.server.history.timestamp[shared.server.history.timestamp.length - 1])
                            Object.keys(newt).forEach(function(key) {
                                if (key !== 'key') {
                                    newt[key].remove = []
                                }
                            })
                            newt.key = shared.time.current
                            newt[rem.type].data.splice(newt[rem.type].data.indexOf(rem.id), 1)
                            newt[rem.type].remove.push(rem)
                            shared.server.history.timestamp.push(newt)
                        }
                    }
                }
            }
        }

        let fillfun = function(index) {
            let status = {
                current: '',
                previous: [],
            }
            status.current = deep_copy(shared.server.data_out[Math.floor(index / 4)][index % 4].data[0])
            status.current.x = new Date(shared.server.time_of_night.date_now)
            status.gradient = Math.floor((Math.random() * 20) - 10)
            for (let i = 0; i < (shared.time.range / 100 / 3600); i++) {
                if (shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2] === undefined
          || shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2].y === undefined) {
                    break
                }
                status.previous.push(deep_copy(shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2]))
                status.previous[i].x = new Date()
                status.previous[i].x.setTime(status.current.x.getTime() - i * 3600 * 100)
            }
            return status
        }

        removePlot()
        update()
        addPlot()
    }
    function loadMesures() {
        let fillfun = function(index) {
            index = 0
            let status = {
                current: '',
                previous: [],
            }
            status.current = deep_copy(shared.server.data_out[Math.floor(index / 4)][index % 4].data[0])
            status.current.x = new Date(shared.server.time_of_night.date_now)
            status.gradient = Math.floor((Math.random() * 20) - 10)
            for (let i = 0; i < (shared.time.range / 100 / 3600); i++) {
                if (shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2] === undefined
          || shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2].y === undefined) {
                    break
                }
                status.previous.push(deep_copy(shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2]))
                status.previous[i].x = new Date()
                status.previous[i].x.setTime(status.current.x.getTime() - i * 3600 * 100)
            }
            return status
        }
        shared.server.urgent.urgent_current = []
        shared.server.category = []
        for (let z = 0; z < shared.server.urgent.urgentKey.length; z++) {
            shared.server.urgent.urgent_current.push({
                key: shared.server.urgent.urgentKey[z],
                data: [],
            })
            shared.server.category.push({
                key: shared.server.urgent.urgentKey[z],
                data: [],
            })
        }
        shared.server.fullList = []

        // let index = 0
        // // let A = [
        // //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   {id: 'id2', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   {id: 'id3', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        // //     {id: 'id4', name: 'subMeasure.14', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
        // //   ]},
        // //   {id: 'id5', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure5', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   // {id: 'id6', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   // {id: 'id7', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   // {id: 'id8', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   // {id: 'id9', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        // //   //   {id: 'id10', name: 'subMeasure.14', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
        // //   // ]},
        // //   // {id: 'id11', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure5', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
        // // ]
        // // let B = [
        // //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // // ]
        // // index = 0
        // // let C = [
        // //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   {id: 'id2', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure10', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   {id: 'id3', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure11', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        // //     {id: 'id4', name: 'subMeasure.14', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
        // //   ]}
        // // ]
        // // let D = [
        // //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // // ]
        // // index = 0
        // // let E = [
        // //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index++), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        // // ]
        // // shared.server.urgent.urgent_current = [
        // //   A,
        // //   B,
        // //   C,
        // //   D,
        // //   E
        // // ]
        //
        // let weatherP = [
        //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id2', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id3', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        //     {id: 'id4', name: 'subMeasure.14', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
        //   ]},
        //   {id: 'id5', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure1', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id6', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure2', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id7', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure3', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id8', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure4', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: [
        //     {id: 'id9', name: 'subMeasure.14', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))]}
        //   ]},
        //   {id: 'id10', added: shared.time.current, ended: undefined, type: 'weather', name: 'Measure5', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
        // ]
        // index = 0
        // let telescopesP = [
        //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id2', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id3', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id4', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id5', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id6', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id7', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id8', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id9', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure6', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id10', added: shared.time.current, ended: undefined, type: 'telescopes', name: 'Measure7', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
        // ]
        // index = 0
        // let otherP = [
        //   {id: 'id0', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id1', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id2', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure8', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []},
        //   {id: 'id3', added: shared.time.current, ended: undefined, type: 'other', name: 'Measure9', status: fillfun(index), unit: ['C°', '%', 'µg', 'km/h'][Math.floor((Math.random() * 3))], subMeasures: []}
        // ]
        // shared.server.pinned = [
        //   weatherP,
        //   telescopesP,
        //   otherP
        // ]

        shared.server.history = {
            max: 0,
            min: 0,
            timestamp: [],
        }
    }

    function drawfakefocus() {
        let plotlistg = svg.svg.append('g')
            .attr('transform', 'translate(' + box.focusPlots.x + ',' + box.focusPlots.y + ')')
            .style('pointer-events', 'auto')
        let topg = plotlistg.append('g')
        let bottomg = plotlistg.append('g').attr('transform', 'translate(' + 0 + ',' + box.focusPlots.h * 0.6 + ')')

        function createPlot(opt_in) {
            let plot = new PlotTimeSeries()
            plot.init({
                main: {
                    g: opt_in.g,
                    box: opt_in.box,
                    clipping: true,
                },
                interaction: {
                    pinned: {
                        enabled: false,
                        event: () => {
                            console.log('pinned')
                        },
                    },
                    remove: {
                        enabled: false,
                        event: () => {
                            console.log('remove')
                        },
                    },
                },
                axis: [
                    // {
                    //   id: 'right',
                    //   showAxis: true,
                    //   main: {
                    //     g: undefined,
                    //     box: {x: plotbox.w, y: 0, w: 0, h: 0, marg: 0},
                    //     type: 'right',
                    //     mode: 'linear',
                    //     attr: {
                    //       text: {
                    //         enabled: true,
                    //         size: 11,
                    //         stroke: colorPalette.medium.stroke,
                    //         fill: colorPalette.medium.stroke
                    //       },
                    //       path: {
                    //         enabled: true,
                    //         stroke: colorPalette.medium.stroke,
                    //         fill: colorPalette.medium.stroke
                    //       },
                    //       tickSize: -plotbox.w
                    //     }
                    //   },
                    //   axis: undefined,
                    //   scale: undefined,
                    //   domain: [0, 1000],
                    //   range: [0, 0],
                    //   brush: {
                    //     zoom: true,
                    //     brush: true
                    //   }
                    // }
                ],
                content: [],
            })
            return plot
        }

        let plotb = {
            x: 0,
            y: 0,
            w: box.focusPlots.w * 0.9,
            h: box.focusPlots.h * 0.6,
        }
        let opt_in = {
            g: topg,
            box: plotb,
        }
        opt_in.g = opt_in.g.append('g') // .style('opacity', 0.8)
        let plotObject = createPlot(opt_in)
        plotObject.add_axis({
            id: 'bottom',
            showAxis: true,
            main: {
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: opt_in.box.h,
                    marg: 0,
                },
                type: 'bottom',
                attr: {
                    text: {
                        enabled: false,
                        size: 11,
                        stroke: colorPalette.medium.stroke,
                        fill: colorPalette.medium.stroke,
                    },
                    path: {
                        enabled: true,
                        stroke: colorPalette.medium.stroke,
                        fill: colorPalette.medium.stroke,
                    },
                    tickSize: -opt_in.box.h,
                },
            },
            axis: undefined,
            scale: undefined,
            domain: [ 0, 1000 ],
            range: [ 0, 0 ],
            brush: {
                zoom: true,
                brush: true,
            },
        })
        plotObject.add_axis({
            id: 'left',
            showAxis: true,
            main: {
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    marg: 0,
                },
                type: 'left',
                mode: 'linear',
                attr: {
                    text: {
                        enabled: false,
                        size: 11,
                        stroke: colorPalette.medium.stroke,
                        fill: colorPalette.medium.stroke,
                    },
                    path: {
                        enabled: true,
                        stroke: colorPalette.medium.stroke,
                        fill: colorPalette.medium.stroke,
                    },
                    tickSize: -opt_in.box.w,
                },
            },
            axis: undefined,
            scale: undefined,
            domain: [ 0, 1000 ],
            range: [ 0, 0 ],
            brush: {
                zoom: true,
                brush: true,
            },
        })
        let start_time_sec = {
            date: new Date(shared.time.from),
            time: Number(shared.time.from.getTime()),
        }
        let end_time_sec = {
            date: new Date(shared.server.time_of_night.date_now),
            time: Number(shared.server.time_of_night.now),
        }

        plotObject.update_axis({
            id: 'bottom',
            domain: [ start_time_sec.date, end_time_sec.date ],
            range: [ 0, plotb.w ],
        })
        plotObject.update_axis({
            id: 'left',
            domain: [ 0, 100 ],
            range: [ plotb.h, 0 ],
        })
        plotObject.bindData(shared.server.urgent.urgent_current[0][0].id, [ shared.server.urgent.urgent_current[0][0].status.current ].concat(shared.server.urgent.urgent_current[0][0].status.previous), 'bottom', 'left')
    }

    let SvgPinnedPlots = function() {
        let svgPinnedPlotsg
        let scrollPinnedList
        let scrollBoxList
        let scrollBoxBoard

        let displayMode = 'mosaic'
        let is_focused = false

        let focusedPlot

        function adjustScrollBox() {
            return
            if (!scrollbox) {
                return
            }
            let nbperline = Math.floor(box.pinnedPlots.w / (plotbox.w + 29))
            let tot = 0
            for (let i = 0; i < shared.server.urgent.urgent_current.length; i++) {
                tot += shared.server.urgent.urgent_current[i].length
            }
            scrollbox.update_box({
                x: 0,
                y: 40,
                w: box.pinnedPlots.w,
                h: box.pinnedPlots.h - 80,
            })
            scrollbox.reset_vertical_scroller({
                can_scroll: true,
                scroll_height: (15 + plotbox.h * 0.15 + (plotbox.h + 20) * Math.ceil(tot / nbperline)),
            })
            // scrollbox.update_horizontal_scroller({can_scroll: true, scroll_width: 0})
        }
        this.adjustScrollBox = adjustScrollBox

        function unfocusOnPlot() {
            svgPinnedPlotsg.select('g#pinnedBoard').selectAll('*').remove()
            focusedPlot = null
        }
        function focusOnPlot(plotData) {
            let currentDate = new Date(shared.server.time_of_night.date_now)
            let previousDate = new Date(new Date(shared.server.time_of_night.date_now).setHours(currentDate.getHours() - 1))
            let scrollBoxPlot = {
                x: scrollBoxBoard.x + scrollBoxBoard.w * 0.1,
                y: scrollBoxBoard.y + 50,
                w: scrollBoxBoard.w * 0.8,
                h: scrollBoxBoard.h * 0.5,
            }
            svgPinnedPlotsg.select('g#pinnedBoard')
                .style('opacity', 0)
                .transition()
                .delay(200)
                .duration(400)
                .style('opacity', 1)
            let opt_in = {
                g: svgPinnedPlotsg.select('g#pinnedBoard'),
                box: scrollBoxPlot,
            }
            focusedPlot = new PlotTimeSeries()
            focusedPlot.init({
                main: {
                    g: opt_in.g,
                    box: opt_in.box,
                    clipping: true,
                },
                interaction: {
                    pinned: {
                        enabled: false,
                        event: () => {
                            console.log('pinned')
                        },
                    },
                    remove: {
                        enabled: false,
                        event: () => {
                            console.log('remove')
                        },
                    },
                },
                axis: [],
                content: [],
                zoom: {
                    enabled: true,
                },
                brush: {
                    enabled: true,
                    behavior: 'zoom_rect',
                },
            })

            // let all_axis = plotData.get_all_axis()
            // for (let i = 0; i < all_axis.length; i++) {
            //     let axis = all_axis[i].axis.get_structure()
            //     focusedPlot.add_axis(axis)
            // }

            focusedPlot.add_axis({
                id: 'left',
                location: 'left',
                type: 'linear',
                profile: 'focus',
                // axis: {
                //     profile: 'focus',
                //     display: false,
                //     track: 'a1',
                //     orientation: 'out',
                // },
                // azerty: {
                //     profile: 'focus',
                //     display: false,
                // },
                domain: [ 0, 100 ],
                // domain: {
                //     context: [ 0, 100 ],
                //     focus: [ 0, 100 ],
                // },
                range: [ scrollBoxPlot.h, 0 ],
            })

            // focusedPlot.add_axis({
            //     id: 'bottom',
            //     location: 'bottom',
            //     type: 'band',
            //     profile: 'focus',
            //     // axis: {
            //     //     profile: 'context',
            //     //     display: false,
            //     //     track: 'a1',
            //     //     orientation: 'out',
            //     // },
            //     // azerty: {
            //     //     profile: 'context',
            //     //     display: false,
            //     // },
            //     domain: [ 'EUROPE', 'AMERIQUEWWWWWWWWWWWWWWW', 'AFRIQUEwwwwwwwwwwwwwwwwwwwwwwwww', 'ANTARTIQUEwwwwwwwwwwwwwwwwwwwwwwwww', 'ASIE' ],
            //     // domain: [ previousDate.getTime(), currentDate.getTime() ],
            //     // domain: {
            //     //     context: [ 0, 100 ],
            //     //     focus: [ 0, 100 ],
            //     // },
            //     range: [ 0, scrollBoxPlot.w ],
            //     // style: {
            //     //     text: {
            //     //         visible: true,
            //     //         size: 13,
            //     //         stroke: colorPalette.medium.stroke,
            //     //         fill: colorPalette.medium.stroke,
            //     //     },
            //     //     path: {
            //     //         visible: true,
            //     //         stroke: colorPalette.medium.stroke,
            //     //         fill: colorPalette.medium.stroke,
            //     //     },
            //     //     axis: {
            //     //         visible: true,
            //     //     },
            //     // },
            // })
            //
            // focusedPlot.add_axis({
            //     id: 'top',
            //     location: 'top',
            //     type: 'band',
            //     profile: 'context',
            //     // box: {
            //     //     x: 0,
            //     //     y: -55,
            //     //     w: scrollBoxPlot.w,
            //     //     h: 25,
            //     // },
            //     domain: [ 'EUROPE', 'REPUBLIQUE DEMOCARTIQUE DU CONGO', 'AFRIQUE', 'ANTARTIQUE', 'ASIE' ],
            //     //domain: [ previousDate.getTime(), currentDate.getTime() ],
            //     range: [ 0, scrollBoxPlot.w ],
            //
            // })
            // focusedPlot.add_axis({
            //     id: 'right',
            //     location: 'right',
            //     type: 'band',
            //     profile: 'context',
            //     // box: {
            //     //     x: scrollBoxPlot.w + 30,
            //     //     y: 0,
            //     //     w: 25,
            //     //     h: scrollBoxPlot.h,
            //     // },
            //     domain: [ 'EUROPE', 'REPUBLIQUE DEMOCARTIQUE DU CONGO', 'AFRIQUE', 'ANTARTIQUE', 'ASIE' ],
            //     //domain: [ previousDate.getTime(), currentDate.getTime() ],
            //     range: [ scrollBoxPlot.h, 0 ],
            //
            // })
            focusedPlot.add_axis({
                id: 'bottom',
                location: 'bottom',
                type: 'time',
                profile: 'context',
                domain: [ previousDate.getTime(), currentDate.getTime() ],
                range: [ 0, scrollBoxPlot.w ],
            })
            // focusedPlot.add_axis({
            //     id: 'left',
            //     scale_location: 'left',
            //     scale_type: 'linear',
            //     profile: 'full',
            //     domain: [ 0, 100 ],
            //     range: [ scrollBoxPlot.h, 0 ],
            // })
            // focusedPlot.add_axis({
            //     id: 'right',
            //     scale_location: 'right',
            //     scale_type: 'linear',
            //     domain: [ 0, 100 ],
            //     range: [ scrollBoxPlot.h, 0 ],
            //     profile: 'focus',
            // })

            // let all_data = plotData.get_data()
            // for (let i = 0; i < all_data.length; i++) {
            //     console.log(all_data[i])
            //     focusedPlot.add_data(all_data[i])
            // }

            let temp_batch = []
            for (let i = 0; i < 100; i++) {
                temp_batch.push(
                    {
                        x: previousDate.getTime() + (((currentDate.getTime() - previousDate.getTime()) / 100) * i),
                        y: Math.floor(Math.random() * Math.floor(60)),
                    }
                )
            }
            focusedPlot.add_data({
                id: 'temp',
                data: temp_batch,
                drawing_method: 'plotline',
                shape: 'circle',
                axis_x: 'bottom',
                axis_y: 'left',
            })


            // let scatter_batch = []
            // for (let i = 0; i < 800; i++) {
            //     scatter_batch.push(
            //         {
            //             x: previousDate.getTime() + Math.floor(Math.random() * Math.floor((currentDate.getTime() - previousDate.getTime()))),
            //             y: Math.floor(Math.random() * Math.floor(100)),
            //         }
            //     )
            // }
            // focusedPlot.add_data({
            //     id: 'scatter',
            //     data: scatter_batch,
            //     drawing_method: 'scatterplot',
            //     shape: 'triangle_up',
            //     axis_x: 'bottom',
            //     axis_y: 'left',
            // })
            // focusedPlot.add_data({
            //     id: 'heatmap',
            //     data: scatter_batch,
            //     drawing_method: 'heatmap',
            //     shape: 'circle',
            //     axis_x: 'bottom',
            //     axis_y: 'left',
            // })

            // focusedPlot.update_axis({
            //     id: 'bottom',
            //     domain: [ previousDate, currentDate ],
            //     range: [ 0, scrollBoxPlot.w ],
            // })
            // focusedPlot.update_axis({
            //     id: 'right',
            //     domain: [ 0, 100 ],
            //     range: [ scrollBoxPlot.h, 0 ],
            // })
            // focusedPlot.update_axis({
            //     id: 'left',
            //     domain: [ 0, 100 ],
            //     range: [ scrollBoxPlot.h, 0 ],
            // })
        }

        function initOptions() {
            // Left _button
            svgPinnedPlotsg.append('circle')
                .attr('id', 'personalPinned')
                .attr('cx', 20)
                .attr('cy', 60)
                .attr('r', 20)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.5)
                .attr('fill', 'none')
            svgPinnedPlotsg.append('circle')
                .attr('id', 'sharePinned')
                .attr('cx', 20)
                .attr('cy', 110)
                .attr('r', 20)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.5)
                .attr('fill', 'none')
            svgPinnedPlotsg.append('circle')
                .attr('id', 'globalPinned')
                .attr('cx', 20)
                .attr('cy', 160)
                .attr('r', 20)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.5)
                .attr('fill', 'none')

            // Left _button
            svgPinnedPlotsg.append('rect')
                .attr('id', 'mosaic')
                .attr('x', scrollBoxList.w - 200)
                .attr('y', 0)
                .attr('width', 30)
                .attr('height', 30)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.5)
                .attr('fill', colorPalette.medium.background)
                .on('click', setMosaicDisplay)
            svgPinnedPlotsg.append('rect')
                .attr('id', 'list')
                .attr('x', scrollBoxList.w - 150)
                .attr('y', 0)
                .attr('width', 30)
                .attr('height', 30)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.5)
                .attr('fill', colorPalette.medium.background)
                .on('click', setListDisplay)
            svgPinnedPlotsg.append('rect')
                .attr('id', 'full')
                .attr('x', scrollBoxList.w - 100)
                .attr('y', 0)
                .attr('width', 30)
                .attr('height', 30)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.5)
                .attr('fill', colorPalette.medium.background)
                .on('click', setFullDisplay)
        }
        function setMosaicDisplay() {
            displayMode = 'mosaic'
            updatePinnedList()
        }
        function setListDisplay() {
            displayMode = 'list'
            updatePinnedList()
        }
        function setFullDisplay() {
            displayMode = 'full'
        }
        function initPinnedList() {
            scrollBoxList = {
                x: 10 + 40,
                y: 40,
                w: box.pinnedPlots.w - 20 - 40,
                h: box.pinnedPlots.h - 50,
            }
            let g = svgPinnedPlotsg.append('g')
                .attr('id', 'pinned_eles')
                .attr('transform', 'translate(' + scrollBoxList.x + ',' + scrollBoxList.y + ')')
            scrollPinnedList = initScrollBox('pinned_elesScrollbox', g, scrollBoxList, {
            }, true)
            g.append('line')
                .attr('id', 'toplimit')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', scrollBoxList.w)
                .attr('y2', 0)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.4)
                .style('pointer-events', 'none')
            g.append('line')
                .attr('id', 'bottomlimit')
                .attr('x1', 0)
                .attr('y1', scrollBoxList.h)
                .attr('x2', scrollBoxList.w)
                .attr('y2', scrollBoxList.h)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.4)
                .style('pointer-events', 'none')
        }
        function initPinnedBoard() {
            scrollBoxBoard = {
                x: 10 + 40 + (box.pinnedPlots.w - 20 - 40) * 0.3 + 20,
                y: 40,
                w: (box.pinnedPlots.w - 20 - 40) * 0.7 - 40,
                h: box.pinnedPlots.h - 50,
            }
            let g = svgPinnedPlotsg.append('g')
                .attr('id', 'pinnedBoard')
                .attr('transform', 'translate(' + scrollBoxBoard.x + ',' + scrollBoxBoard.y + ')')
        }
        function init_data() {
            svgPinnedPlotsg = svg.svg.append('g')
                .attr('id', 'svgPinnedPlots')
                .attr('transform', 'translate(' + box.pinnedPlots.x + ',' + box.pinnedPlots.y + ')')
                .style('pointer-events', 'auto')

            initPinnedList()
            initPinnedBoard()
            initOptions()

            update_data()
            // adjustScrollBox()
        }
        this.init_data = init_data

        function get_transformation(transform) {
            // Create a dummy g for calculation purposes only. This will never
            // be appended to the DOM and will be discarded once this function
            // returns.
            var g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

            // Set the transform attribute to the provided string value.
            g.setAttributeNS(null, 'transform', transform)

            // consolidate the SVGTransformList containing all transformations
            // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
            // its SVGMatrix.
            var matrix = g.transform.baseVal.consolidate().matrix

            // Below calculations are taken and adapted from the private function
            // transform/decompose.js of D3's module d3-interpolate.
            var {
                a, b, c, d, e, f,
            } = matrix // ES6, if this doesn't work, use below assignment
            // var a=matrix.a, b=matrix.b, c=matrix.c, d=matrix.d, e=matrix.e, f=matrix.f; // ES5
            var scaleX, scaleY, skewX
            if (scaleX = Math.sqrt(a * a + b * b)) {
                a /= scaleX, b /= scaleX
            }
            if (skewX = a * c + b * d) {
                c -= a * skewX, d -= b * skewX
            }
            if (scaleY = Math.sqrt(c * c + d * d)) {
                c /= scaleY, d /= scaleY, skewX /= scaleY
            }
            if (a * d < b * c) {
                a = -a, b = -b, skewX = -skewX, scaleX = -scaleX
            }
            return {
                translateX: e,
                translateY: f,
                rotate: Math.atan2(b, a) * 180 / Math.PI,
                skewX: Math.atan(skewX) * 180 / Math.PI,
                scaleX: scaleX,
                scaleY: scaleY,
            }
        }

        function dragstarted(d) {
            d3.select(this).raise()
        }
        function dragged(d) {
            let transform = get_transformation(d3.select(this).attr('transform'))

            d3.select(this)
                .attr('transform', 'translate(' + (transform.translateX + d3.event.dx) + ',' + (transform.translateY + d3.event.dy) + ')')
        }
        function dragended(d) {}
        function createPinnedItem() {

        }

        function clickcancel() {
            // we want to a distinguish single/double click
            // details http://bl.ocks.org/couchand/6394506
            var dispatcher = d3.dispatch('click', 'dblclick')
            function cc(selection) {
                var down,
                    tolerance = 5,
                    last,
                    wait = null,
                    args
                // euclidean distance
                function dist(a, b) {
                    return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2))
                }
                selection.on('mousedown', function() {
                    d3.event.stopPropagation()
                    down = d3.mouse(document.body)
                    last = +new Date()
                    args = arguments
                })
                selection.on('mouseup', function() {
                    if (dist(down, d3.mouse(document.body)) > tolerance) {
                        return
                    }
                    else {
                        if (wait) {
                            window.clearTimeout(wait)
                            wait = null
                            dispatcher.apply('dblclick', this, args)
                        }
                        else {
                            wait = window.setTimeout((function() {
                                return function() {
                                    dispatcher.apply('click', this, args)
                                    wait = null
                                }
                            })(), 300)
                        }
                    }
                })
            }
            // Copies a variable number of methods from source to target.
            var d3rebind = function(target, source) {
                var i = 1,
                    n = arguments.length,
                    method
                while (++i < n) {
                    target[method = arguments[i]] = d3_rebind(target, source, source[method])
                }
                return target
            }

            // Method is assumed to be a standard D3 getter-setter:
            // If passed with no arguments, gets the value.
            // If passed with arguments, sets the value and returns the target.
            function d3_rebind(target, source, method) {
                return function() {
                    var value = method.apply(source, arguments)
                    return value === source ? target : value
                }
            }
            return d3rebind(cc, dispatcher, 'on')
        }

        function shrinkAndFocus(focus) {
            let shrinkFrac = 0.3
            // let trans = get_transformation(svgPinnedPlotsg.select('g#pinned_eles').attr('transform'))
            // svgPinnedPlotsg.select('g#pinned_eles')
            //   .transition()
            //   .duration(400)
            //   .attr('transform', 'translate(' + trans.translateX + ',' + trans.translateY + ') scale(' + (trans.scaleX < 1 ? 1 : shrinkFrac) + ',' + (trans.scaleY < 1 ? 1 : 1) + ')')
            // scrollPinnedList.update_box({x: 0, y: 0, w: scrollBoxList.w * (1 / shrinkFrac), h: scrollBoxList.h})
            // scrollPinnedList.reset_vertical_scroller({can_scroll: true, keepFrac: true, scroll_height: (trans.scaleY < 1 ? 1 : shrinkFrac) * (dim.h + dim.marg) * (Math.floor((shared.server.pinned.length) / perline) + 1)})
            is_focused = !is_focused
            if (is_focused) {
                scrollBoxList.w = scrollBoxList.w * shrinkFrac
                scrollPinnedList.update_box({
                    x: 0,
                    y: 0,
                    w: scrollBoxList.w,
                    h: scrollBoxList.h,
                }, 600)
                let gg = svgPinnedPlotsg.select('g#pinned_eles')
                gg.select('line#toplimit')
                    .transition()
                    .duration(600)
                    .attr('x2', scrollBoxList.w)
                gg.select('line#bottomlimit')
                    .transition()
                    .duration(600)
                    .attr('x2', scrollBoxList.w)
                if (focus) {
                    focusOnPlot(focus)
                }
            }
            else {
                unfocusOnPlot()
                scrollBoxList.w = scrollBoxList.w * (1 / shrinkFrac)
                scrollPinnedList.update_box({
                    x: 0,
                    y: 0,
                    w: scrollBoxList.w,
                    h: scrollBoxList.h,
                }, 600)
                let gg = svgPinnedPlotsg.select('g#pinned_eles')
                gg.select('line#toplimit').transition().duration(600).attr('x2', scrollBoxList.w)
                gg.select('line#bottomlimit').transition().duration(600).attr('x2', scrollBoxList.w)
            }
            updatePinnedList()
        }
        function mosaicBib(g, d, i, caller) {
            let dim = {
                w: 40,
                h: 40,
                marg: 4,
            }
            let max = shared.server.pinned.length
            let delay = 10
            let transition = 400
            let shrinkFrac = 0.3
            let perline = Math.floor(scrollBoxList.w / (dim.w + dim.marg))
            let offset = (scrollBoxList.w - (perline * (dim.w + dim.marg))) * 0.5

            // g.transition()
            //     .delay(max * delay - delay * (i - 1))
            //     .duration(transition)
            //     .attr('transform', 'translate('
            //     + (offset + (i % perline) * (dim.w + dim.marg)) + ','
            //     + (10 + (dim.marg + parseInt(i / perline) * (dim.h + dim.marg))) + ')'
            //     + ' scale(0.2,0.2)')
            //
            // scrollPinnedList.reset_vertical_scroller({
            //     can_scroll: true,
            //     keepFrac: true,
            //     scroll_height: (dim.h + dim.marg) * (Math.floor((shared.server.pinned.length) / perline) + 1),
            // })
            // return

            if (caller === 'enter') {
                g.append('rect')
                    .attr('id', 'back')
                    .attr('x', 4)
                    .attr('y', 4)
                    .attr('width', dim.w)
                    .attr('height', dim.h)
                    .attr('stroke-width', 0)
                    .style('fill-opacity', 0.4)
                    .attr('fill', colorPalette.darkest.background)
                g.append('rect')
                    .attr('id', 'front')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', dim.w)
                    .attr('height', dim.h)
                    .attr('stroke', colorPalette.bright.stroke)
                    .attr('stroke-width', 0.2)
                    .style('fill-opacity', 1)
                    .attr('fill', colorPalette.bright.background)
                g.append('svg:image')
                    .attr('id', 'chart')
                    .attr('xlink:href', '/static/icons/line-chart.svg')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', dim.w)
                    .attr('height', dim.h)
                    .style('pointer-events', 'none')
                    .style('opacity', 0.5)
                g.style('opacity', 0)
            }
            else if (caller === 'merge') {
                g.select('rect#back')
                    .transition()
                    .delay(delay * i)
                    .duration(transition)
                    .attr('width', dim.w)
                    .attr('height', dim.h)
                g.select('rect#front')
                    .transition()
                    .delay(delay * i)
                    .duration(transition)
                    .attr('width', dim.w)
                    .attr('height', dim.h)
                g.select('image#chart')
                    .transition()
                    .delay(delay * i)
                    .duration(transition)
                    .attr('width', dim.w * 0.75)
                    .attr('height', dim.h * 0.75)
                g.transition()
                    .delay(delay * i)
                    .duration(transition)
                    .attr('transform', 'translate(' + (offset + (i % perline) * (dim.w + dim.marg)) + ',' + (dim.marg + parseInt(i / perline) * (dim.h + dim.marg)) + ')')
                    .style('opacity', 1)
            }

            // let trans = get_transformation(svgPinnedPlotsg.select('g#pinned_eles').attr('transform'))
            scrollPinnedList.reset_vertical_scroller({
                can_scroll: true,
                keepFrac: true,
                scroll_height: (dim.h + dim.marg) * (Math.floor((shared.server.pinned.length) / perline) + 1),
            })
        }
        function listBib(g, d, i, caller) {
            let dim = {
                w: 200,
                h: 200,
                marg: 4,
            }
            let max = shared.server.pinned.length
            let delay = 10
            let transition = 400
            let shrinkFrac = 0.3
            let perline = Math.floor(scrollBoxList.w / dim.w)
            let offset = (scrollBoxList.w - (perline * dim.w)) * 0.5

            // g.transition()
            //     .delay(max * delay - delay * (i - 1))
            //     .duration(transition)
            //     .attr('transform', 'translate('
            //     + (offset + (i % perline) * (dim.w + dim.marg)) + ','
            //     + (10 + (dim.marg + parseInt(i / perline) * (dim.h + dim.marg))) + ')'
            //     + ' scale(0.85,0.85)')
            //
            // scrollPinnedList.reset_vertical_scroller({
            //     can_scroll: true,
            //     keepFrac: true,
            //     scroll_height: (dim.h + dim.marg) * (Math.floor((shared.server.pinned.length) / perline) + 1),
            // })
            //
            // return
            if (caller === 'enter') {
                g.append('rect')
                    .attr('id', 'back')
                    .attr('x', 4)
                    .attr('y', 4)
                    .attr('width', dim.w)
                    .attr('height', dim.h)
                    .attr('stroke-width', 0)
                    .style('fill-opacity', 0.4)
                    .attr('fill', colorPalette.darkest.background)
                g.append('rect')
                    .attr('id', 'front')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', dim.w)
                    .attr('height', dim.h)
                    .attr('stroke', colorPalette.bright.stroke)
                    .attr('stroke-width', 0.2)
                    .style('fill-opacity', 1)
                    .attr('fill', colorPalette.bright.background)
                g.style('opacity', 0)
            }
            else if (caller === 'merge') {
                g.select('rect#back')
                    .transition()
                    .delay(max * delay - delay * (i - 1))
                    .duration(transition)
                    .attr('width', dim.w)
                    .attr('height', dim.h)
                g.select('rect#front')
                    .transition()
                    .delay(max * delay - delay * (i - 1))
                    .duration(transition)
                    .attr('width', dim.w)
                    .attr('height', dim.h)
                g.transition()
                    .delay(max * delay - delay * (i - 1))
                    .duration(transition)
                    .attr('transform', 'translate(' + (offset + (i % perline) * (dim.w + dim.marg)) + ',' + (dim.marg + parseInt(i / perline) * (dim.h + dim.marg)) + ')')
                    .style('opacity', 1)
            }

            // let trans = get_transformation(svgPinnedPlotsg.select('g#pinned_eles').attr('transform'))
            scrollPinnedList.reset_vertical_scroller({
                can_scroll: true,
                keepFrac: true,
                scroll_height: (dim.h + dim.marg) * (Math.floor((shared.server.pinned.length) / perline) + 1),
            })
        }
        function dummy_plots(g, box, i) {
            focusedPlot = new PlotTimeSeries()
            focusedPlot.init({
                main: {
                    id: 'dummy_plot_' + i,
                    g: g,
                    box: box,
                    clipping: true,
                },
                interaction: {
                    pinned: {
                        enabled: false,
                        event: () => {
                            console.log('pinned')
                        },
                    },
                    remove: {
                        enabled: false,
                        event: () => {
                            console.log('remove')
                        },
                    },
                },
                axis: [],
                content: [],
                zoom: {
                    enabled: false,
                },
                brush: {
                    enabled: false,
                    behavior: 'zoom_rect',
                },
            })
            focusedPlot.add_axis({
                id: 'bottom',
                scale_location: 'bottom',
                scale_type: 'linear',
                profile: 'focus',
                domain: [ 0, 100 ],
                range: [ 0, box.w ],
            })

            let axisid = 'left'
            let rand = Math.round(Math.random() * (2))
            if (rand > 0.8) {
                focusedPlot.add_axis({
                    id: 'left',
                    scale_location: 'left',
                    scale_type: 'linear',
                    profile: 'focus',
                    domain: [ 0, 100 ],
                    range: [ box.h, 0 ],
                })
            }
            if (rand < 1.2) {
                axisid = 'right'
                focusedPlot.add_axis({
                    id: 'right',
                    scale_location: 'right',
                    scale_type: 'linear',
                    domain: [ 0, 100 ],
                    range: [ box.h, 0 ],
                    profile: 'focus',
                })
            }

            if (Math.round(Math.random() > 0.5)) {
                let temp_batch = []
                for (let i = 0; i < 100; i++) {
                    temp_batch.push(
                        {
                            x: i,
                            y: Math.floor(Math.random() * Math.floor(60)),
                        }
                    )
                }
                focusedPlot.add_data({
                    id: 'temp',
                    data: temp_batch,
                    drawing_method: 'plotline',
                    shape: 'circle',
                    axis_x: 'bottom',
                    axis_y: axisid,
                })
            }
            else {
                let scatter_batch = []
                for (let i = 0; i < 800; i++) {
                    scatter_batch.push(
                        {
                            x: Math.floor(Math.random() * Math.floor(100)),
                            y: Math.floor(Math.random() * Math.floor(100)),
                        }
                    )
                }

                rand = Math.round(Math.random() * (2))
                if (rand > 0.8) {
                    focusedPlot.add_data({
                        id: 'scatter',
                        data: scatter_batch,
                        drawing_method: 'scatterplot',
                        shape: 'triangle_up',
                        axis_x: 'bottom',
                        axis_y: axisid,
                    })
                }
                if (rand < 1.2) {
                    focusedPlot.add_data({
                        id: 'heatmap',
                        data: scatter_batch,
                        drawing_method: 'heatmap',
                        shape: 'circle',
                        axis_x: 'bottom',
                        axis_y: axisid,
                    })
                }
            }

            return focusedPlot
        }
        function updatePinnedList() {
            let dim = {
                x: 0,
                y: 0,
                w: 200,
                h: 200,
                marg: 4,
            }
            let shrinkFrac = 0.3
            let perline = Math.floor(scrollBoxList.w / dim.w)
            let allPinned = scrollPinnedList.get('inner_g').selectAll('g.pinned')
                .data(shared.server.pinned, function(d) {
                    return d.id
                })
            let enterPinned = allPinned.enter()
                .append('g')
                .attr('class', 'pinned')
            // .call(d3.drag()
            //   .on('start', dragstarted)
            //   .on('drag', dragged)
            //   .on('end', dragended))
            enterPinned.each(function(d, i) {
                // let focusplot = dummy_plots(d3.select(this), dim, i)
                var cc = clickcancel()
                d3.select(this).call(cc)
                cc.on('click', d => {
                    console.log(d)
                })
                cc.on('dblclick', d => {
                    // shrinkAndFocus(focusplot)
                    shrinkAndFocus(d)
                })


                if (displayMode === 'mosaic') {
                    mosaicBib(d3.select(this), d, i, 'enter')
                }
                else if (displayMode === 'list') {
                    listBib(d3.select(this), d, i, 'enter')
                }
            })

            let mergePinned = allPinned.merge(enterPinned)
            mergePinned.each(function(d, i) {
                if (displayMode === 'mosaic') {
                    mosaicBib(d3.select(this), d, i, 'merge')
                }
                else if (displayMode === 'list') {
                    listBib(d3.select(this), d, i, 'merge')
                }
            })
            allPinned
                .exit()
                .style('opacity', 0)
                .remove()

            // scrollbox.update_box({x: 0, y: 0, w: rightDim.w, h: rightDim.h})
        }
        function update_data() {
            updatePinnedList()
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let SvgUrgentPlots = function() {
        let leftg
        let leftDim
        let categoryBox
        let categoryDim
        let itemBox
        let itemDim

        let middleg
        let middleDim

        let rightg
        let rightCats
        let rightItems
        let scrollbox
        let rightDim
        let rightBox

        let topBox
        let topg

        let plotbox = {
            x: 0,
            y: 0,
            w: 90,
            h: 70,
        }
        let allPlots
        let miniPlotsVect = {
        }

        let middleplot
        let overlaymiddleplot
        let line
        let spaceline

        let categoryfocus = []
        let focusScrollbox

        // let telg
        // let telbox
        // let telplot

        function createPlot(opt_in) {
            let plot = new PlotTimeSeries()
            plot.init({
                main: {
                    tag: opt_in.tag,
                    g: opt_in.g,
                    box: opt_in.box,
                    clipping: true,
                },
                interaction: {
                    pinned: {
                        enabled: false,
                        event: () => {
                            console.log('pinned')
                        },
                    },
                    remove: {
                        enabled: false,
                        event: () => {
                            console.log('remove')
                        },
                    },
                },
                axis: [
                    {
                        id: 'bottom',
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: 0,
                                y: 0,
                                w: 0,
                                h: opt_in.box.h,
                                marg: 0,
                            },
                            type: 'bottom',
                            mode: 'time',
                            attr: {
                                text: {
                                    enabled: true,
                                    size: 11,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                tickSize: 10,
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        brush: {
                            zoom: true,
                            brush: true,
                        },
                    },
                    {
                        id: 'left',
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: 0,
                                y: 0,
                                w: 0,
                                h: 0,
                                marg: 0,
                            },
                            type: 'left',
                            mode: 'linear',
                            attr: {
                                text: {
                                    enabled: true,
                                    size: 11,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                tickSize: -opt_in.box.w,
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        brush: {
                            zoom: true,
                            brush: true,
                        },
                    },
                    {
                        id: 'right',
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: opt_in.box.w,
                                y: 0,
                                w: 0,
                                h: 0,
                                marg: 0,
                            },
                            type: 'right',
                            mode: 'linear',
                            attr: {
                                text: {
                                    enabled: true,
                                    size: 11,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                tickSize: -opt_in.box.w,
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        brush: {
                            zoom: true,
                            brush: true,
                        },
                    },
                ],
                content: [],
            })
            return plot
        }
        function createMiddlePlot(opt_in) {
            return
            let allGroup = opt_in.g.selectAll('g.group')
                .data(shared.server.urgent.urgent_current)
            let gEnterGroup = allGroup.enter()
                .append('g')
                .attr('class', 'group')
            gEnterGroup.each(function(d, i) {
                let g = d3.select(this)
                g.append('rect')
                    .attr('id', 'front')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', middleDim.w)
                    .attr('height', spaceline - 2)
                    .attr('stroke-width', 0.1)
                    .attr('stroke', '#000000')
                    .attr('fill', 'none')
            })
            let gMergeGroup = allGroup.merge(gEnterGroup)
            gMergeGroup.each(function(d, i) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('transform', 'translate(' + (0) + ',' + (i * (spaceline) + 2) + ')')
            })
            allGroup
                .exit()
                .style('opacity', 0)
                .remove()

            middleplot = new PlotTimeSeries()
            let opt_in2 = {
                main: {
                    g: opt_in.g,
                    box: opt_in.box,
                    clipping: true,
                },
                interaction: {
                    pinned: {
                        enabled: false,
                        event: () => {
                            console.log('pinned')
                        },
                    },
                    remove: {
                        enabled: false,
                        event: () => {
                            console.log('remove')
                        },
                    },
                },
                axis: [
                    {
                        id: 'bottom',
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: 0,
                                y: 0,
                                w: 0,
                                h: opt_in.box.h,
                                marg: 0,
                            },
                            type: 'bottom',
                            mode: 'time',
                            attr: {
                                text: {
                                    enabled: true,
                                    size: 11,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                tickSize: 10,
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        brush: {
                            zoom: true,
                            brush: true,
                        },
                    },
                ],
                content: [],
            }
            for (let i = 0; i < shared.server.urgent.urgentKey.length; i++) {
                opt_in2.axis.push(
                    {
                        id: 'left' + shared.server.urgent.urgentKey[i],
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: 0,
                                y: spaceline * i + 2,
                                w: 0,
                                h: 0,
                                marg: 0,
                            },
                            type: 'left',
                            mode: 'linear',
                            attr: {
                                text: {
                                    enabled: false,
                                    size: 11,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                tickSize: 4,
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        brush: {
                            zoom: true,
                            brush: true,
                        },
                    }
                )
            }
            for (let i = 0; i < shared.server.urgent.urgentKey.length; i++) {
                opt_in2.axis.push(
                    {
                        id: 'right' + shared.server.urgent.urgentKey[i],
                        showAxis: true,
                        main: {
                            g: undefined,
                            box: {
                                x: middleDim.w,
                                y: spaceline * i + 2,
                                w: 0,
                                h: 0,
                                marg: 0,
                            },
                            type: 'right',
                            mode: 'linear',
                            attr: {
                                text: {
                                    enabled: false,
                                    size: 11,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                tickSize: -6,
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, 0 ],
                        brush: {
                            zoom: true,
                            brush: true,
                        },
                    }
                )
            }
            middleplot.init(opt_in2)
            middleplot.getClipping().append('g').attr('id', 'timestampOverlay')
        }

        function initBox() {
            leftDim = {
                x: 4,
                y: 10,
                w: 200,
                h: box.urgentPlots.h - 20,
            }
            middleDim = {
                x: (leftDim.x + leftDim.w) + 5,
                y: 10,
                w: (box.urgentPlots.w * 0.5) - (leftDim.x + leftDim.w) + 5,
                h: box.urgentPlots.h - 20,
            }
            topBox = {
                x: leftDim.x,
                y: 10,
                w: leftDim.w + 5 + middleDim.w,
                h: 40,
            }
            rightDim = {
                x: box.urgentPlots.w * 0.5 + 10,
                y: 10,
                w: box.urgentPlots.w * 0.5 - 20,
                h: box.urgentPlots.h - 20,
            }
            // telbox = {x: box.urgentPlots.w * 0.66, y: 30, w: box.urgentPlots.w * 0.3, h: box.urgentPlots.h - 60}
        }
        function initLeftPart(g) {
            itemBox = {
                x: 100,
                y: leftDim.y,
                w: 200,
                h: leftDim.h,
            }
            itemDim = {
                offsetL: 2,
                offset_r: 0,
                offsetT: 2,
                offsetB: 0,
                w: 60,
                h: 60,
            }
            categoryBox = {
                x: 0,
                y: leftDim.y,
                w: 100,
                h: leftDim.h,
            }
            categoryDim = {
                offsetL: 0,
                offset_r: 0,
                offsetT: 0,
                offsetB: 0,
                w: categoryBox.w - 0,
                h: (categoryBox.h - 0 * shared.server.urgent.urgent_current.length) / shared.server.urgent.urgent_current.length,
            }
            leftg = g.append('g').attr('id', 'lefturgent').attr('transform', 'translate(' + leftDim.x + ',' + leftDim.y + ')')
            focusScrollbox = initScrollBox('focusScrollbox', leftg.append('g').attr('transform', 'translate(' + itemBox.x + ',' + 0 + ')'), itemBox, {
            }, true)
        }
        function initMiddlePart(g) {
            line = shared.server.urgent.urgentKey.length
            spaceline = middleDim.h / line
            middleg = g.append('g').attr('id', 'middleurgent').attr('transform', 'translate(' + middleDim.x + ',' + middleDim.y + ')')
            createMiddlePlot({
                g: middleg,
                box: middleDim,
            })
        }
        function initTopPart(g) {
            topg = g.append('g').attr('id', 'topurgent').attr('transform', 'translate(' + topBox.x + ',' + topBox.y + ')')
        }
        function initRightPart(g) {
            // rightDim = {x: (middleDim.x + middleDim.w) + 5, y: 20, w: (box.urgentPlots.w - leftDim.w) * 0.4, h: box.urgentPlots.h - 10}
            // rightBox = {x: spaceline, y: rightDim.y, w: rightDim.w - spaceline, h: rightDim.h}
            rightBox = {
                x: spaceline * 1.5,
                y: 0,
                w: rightDim.w - spaceline * 1.5,
                h: rightDim.h,
            }
            rightg = g.append('g').attr('id', 'righturgent').attr('transform', 'translate(' + rightDim.x + ',' + rightDim.y + ')')
            rightItems = rightg.append('g').attr('id', 'rightItems').attr('transform', 'translate(' + rightBox.x + ',' + rightBox.y + ')')
            rightCats = rightg.append('g').attr('id', 'rightCats').attr('transform', 'translate(' + 0 + ',' + 0 + ')')
            // rightItems.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', rightBox.w).attr('height', rightBox.h)
            //   .attr('stroke-width', 0)
            //   .style('opacity', 1)
            //   .attr('fill', 'black')
            scrollbox = initScrollBox('urgentPlotsScrollbox', rightg.append('g').attr('transform', 'translate(' + rightBox.x + ',' + 0 + ')'), rightBox, {
            }, true)
        }

        function initTelPart(g) {
            telg = g.append('g').attr('id', 'telurgent').attr('transform', 'translate(' + telbox.x + ',' + telbox.y + ')')
            telplot = createPlot({
                g: telg,
                box: telbox,
                tag: 'telUrgentPlot',
            })
        }
        function init_data() {
            let plotlistg = svg.svg.append('g').attr('id', 'plotList')
                .attr('transform', 'translate(' + box.urgentPlots.x + ',' + box.urgentPlots.y + ')')
                .style('pointer-events', 'auto')

            // middleplot = createMiddlePlot({g: plotlistg.append('g'), box: {x: (box.urgentPlots.w * 0.35 - 41), y: 20, w: box.urgentPlots.w * 0.36, h: box.urgentPlots.h - 40}})
            //
            // overlaymiddleplot = plotlistg.append('g').attr('transform', 'translate(' + (box.urgentPlots.w * 0.35 - 41) + ',' + (20) + ')')
            // leftg.on('mouseleave', function () {
            //   categoryfocus = []
            //   leftg.selectAll('rect#extendBack').attr('width', categoryDim.w)
            //   drawLeftPart()
            // })

            initBox()
            // initTelPart(plotlistg)
            initMiddlePart(plotlistg)
            initLeftPart(plotlistg)
            initTopPart(plotlistg)
            initRightPart(plotlistg)

            update_data()
            drawLeftPart()
            // adjustScrollBox()
        }
        this.init_data = init_data

        function update_data() {
            // drawTelPart()
            // drawTopPart()
            drawMiddlePart()
            drawRightPart()
            drawLeftPart()
        }
        this.update_data = update_data

        function drawTelPart() {
            let currentDate = new Date(shared.server.time_of_night.date_now)
            let previousDate = new Date(shared.server.time_of_night.date_now).setHours(currentDate.getHours() - 1)
            telplot.update_axis({
                id: 'bottom',
                domain: [ previousDate, currentDate ],
                range: [ 0, telbox.w ],
            })
            let max = 100
            telplot.update_axis({
                id: 'right',
                domain: [ 0, max ],
                range: [ telbox.h, 0 ],
            })
            telplot.update_axis({
                id: 'left',
                domain: [ 0, max ],
                range: [ telbox.h, 0 ],
            })

            function drawCurve() {
                let allGroup = telplot.getClipping().selectAll('g.telescopes')
                    .data(shared.server.urgent.telescopes, function(d) {
                        return d.id
                    })
                let gEnterGroup = allGroup.enter()
                    .append('g')
                    .attr('class', 'telescopes')
                gEnterGroup.each(function(d, i) {
                    // d3.select(this).append('path')
                    //   .attr('fill', 'none')
                    //   .attr('stroke-width', 1)
                    //   .attr('stroke', '#000000')
                })
                let gMergeGroup = allGroup.merge(gEnterGroup)
                gMergeGroup.each(function(d, i) {
                    // let linefunction = d3.line()
                    //   .x(function (d, i) { return telplot.getAxis('bottom').scale(new Date(d.x - 100000 * i)) })
                    //   .y(function (d, i) { return telplot.getAxis('right').scale(d.y) })
                    //   .curve(d3.curveLinear)
                    // d3.select(this).select('path')
                    //   .attr('d', linefunction(d.data))

                    let allTimestamp = d3.select(this).selectAll('circle.timestamp')
                        .data(d.data, function(dd, ii) {
                            return dd.x
                        })
                    let gEnterTimestamp = allTimestamp.enter()
                        .append('circle')
                        .attr('class', 'timestamp')
                    gEnterTimestamp
                        .attr('fill', '#000000')
                        .attr('r', 2)
                        .on('mouseenter', function(dd) {
                            console.log(dd.y)
                        })
                    let gMergeTimestamp = allTimestamp.merge(gEnterTimestamp)
                    gMergeTimestamp
                        .attr('cx', function(dd, ii) {
                            return (d.data.length > 2 && ii < d.data.length - 1)
                                ? telplot.getAxis('bottom').scale(new Date(dd.x - 100000 * i))
                                : 4
                        })
                        .attr('cy', function(dd, ii) {
                            return telplot.getAxis('right').scale(dd.y)
                        })
                    allTimestamp
                        .exit()
                        .style('opacity', 0)
                        .remove()
                })
                allGroup
                    .exit()
                    .style('opacity', 0)
                    .remove()
                console.log(allGroup)
            }
            drawCurve()
        }

        function drawTopPart() {
            function drawBlock(g, key, tree, depth, dim) {
                if (tree.length === 0) {
                    return
                }

                let allGroup = g.selectAll('g.' + key)
                    .data(tree)
                let gEnterGroup = allGroup.enter()
                    .append('g')
                    .attr('class', key)
                gEnterGroup.each(function(d, i) {
                    let g = d3.select(this)
                    g.append('rect')
                        .attr('x', dim.w * 0.2)
                        .attr('y', dim.h * 0.2)
                        .attr('width', dim.w * 0.6)
                        .attr('height', dim.h * 0.6)
                        .attr('stroke-width', 0.2)
                        .attr('stroke', '#000000')
                        .attr('fill', colorCategory[i % colorCategory.length])
                        .on('click', function() {
                            console.log(d.keys)
                        })
                    g.append('text')
                        .text(d.id)
                        .style('fill', '#000000')
                        .style('font-weight', 'bold')
                        .style('font-size', '11px')
                        .style('user-select', 'none')
                        .style('pointer-events', 'none')
                        .attr('text-anchor', 'middle')
                        .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + (dim.h * 0.5 + 4) + ')')
                })
                let gMergeGroup = allGroup.merge(gEnterGroup)
                gMergeGroup.each(function(d, i) {
                    drawBlock(d3.select(this), d.id, d.children, depth + 1, {
                        x: dim.w,
                        y: 0,
                        w: dim.w,
                        h: dim.h / d.children.length,
                    })
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('transform', 'translate(' + dim.x + ',' + (dim.y + i * dim.h) + ')')
                })
                allGroup
                    .exit()
                    .style('opacity', 0)
                    .remove()
            }
            drawBlock(topg, 'rootroot', [ shared.server.hierarchy.tree ], 1, {
                x: 0,
                y: 0,
                w: topBox.w / shared.server.hierarchy.depth,
                h: topBox.h,
            })
        }

        function drawMiddlePart() {
            let currentDate = new Date(shared.server.time_of_night.date_now)
            let previousDate = new Date(shared.server.time_of_night.date_now).setHours(currentDate.getHours() - 1)
            // middleplot.update_axis({
            //     id: 'bottom',
            //     domain: [ previousDate, currentDate ],
            //     range: [ 0, middleDim.w ],
            // })
            let max = 0
            for (let i = 0; i < shared.server.urgent.urgentTimestamp.length; i++) {
                for (let j = 0; j < shared.server.urgent.urgentTimestamp[i].data.length; j++) {
                    if (max < shared.server.urgent.urgentTimestamp[i].data[j].data.length) {
                        max = shared.server.urgent.urgentTimestamp[i].data[j].data.length
                    }
                }
            }
            // max = 100 / shared.server.urgent.urgentKey.length
            // for (let i = 0; i < shared.server.urgent.urgentKey.length; i++) {
            //     middleplot.update_axis({
            //         id: 'right' + shared.server.urgent.urgentKey[i],
            //         domain: [ 0, max ],
            //         range: [ spaceline - 4, 0 ],
            //     })
            // }
            // for (let i = 0; i < shared.server.urgent.urgentKey.length; i++) {
            //     middleplot.update_axis({
            //         id: 'left' + shared.server.urgent.urgentKey[i],
            //         domain: [ 0, max ],
            //         range: [ spaceline - 4, 0 ],
            //     })
            // }

            function drawCurve() {
                return
                let allGroup = middleplot.getClipping().select('g#timestampOverlay').selectAll('g.group')
                    .data(shared.server.urgent.urgentTimestamp)
                let gEnterGroup = allGroup.enter()
                    .append('g')
                    .attr('class', 'group')
                let gMergeGroup = allGroup.merge(gEnterGroup)
                gMergeGroup.each(function(d, i) {
                    let allTimestamp = d3.select(this).selectAll('g.timestamp')
                        .data(d.data, function(dd, ii) {
                            return dd.timestamp
                        })
                    let gEnterTimestamp = allTimestamp.enter()
                        .append('g')
                        .attr('class', 'timestamp')
                    gEnterTimestamp.each(function(dd, ii) {
                        let g = d3.select(this)
                        g.append('rect')
                            .attr('id', d.key + dd.timestamp)
                        // .attr('x', 0)
                        // .attr('y', middleDim.h - offset - height)
                        // .attr('width', width + 1)
                        // .attr('height', height)
                            .attr('fill', '#000000')
                        // if (d[key].remove.length > 0) {
                        //   g.append('circle')
                        //     .attr('id', key)
                        //     .attr('cx', -0)
                        //     .attr('cy', middleDim.h - offset - height - 0)
                        //     .attr('r', 4)
                        // }
                            .on('mouseenter', function() {
                                console.log(dd.data)
                            })
                    })
                    let gMergeTimestamp = allTimestamp.merge(gEnterTimestamp)
                    gMergeTimestamp.each(function(dd, ii) {
                        let width = (d.data.length > 2 && ii < d.data.length - 1)
                            ? middleplot.getAxis('bottom').scale(new Date(d.data[ii + 1].timestamp)) - middleplot.getAxis('bottom').scale(new Date(dd.timestamp))
                            : 4
                        let g = d3.select(this)
                        let height = -middleplot.getAxis('right' + d.key).scale(dd.data.length) + middleplot.getAxis('right' + d.key).scale(0)
                        // height = spaceline
                        g.select('rect#' + d.key + dd.timestamp)
                            .attr('x', 0)
                            .attr('y', 0 + (spaceline * 0.5 - (height * 0.5)))
                            .attr('width', width + 1)
                            .attr('height', height)
                        // g.select('circle#' + key).attr('cy', middleDim.h - offset - height - 4)

                        g.attr('transform', 'translate(' + (middleplot.getAxis('bottom').scale(new Date(dd.timestamp))) + ',' + 0 + ')')
                    })
                    allTimestamp
                        .exit()
                        .style('opacity', 0)
                        .remove()

                    d3.select(this).attr('transform', 'translate(' + (0) + ',' + (i * (categoryDim.offsetT + categoryDim.h) + 2) + ')')
                })
                allGroup
                    .exit()
                    .style('opacity', 0)
                    .remove()
            }
            function drawMiddleg() {
                let allGroup = overlaymiddleplot.selectAll('g.group')
                    .data(shared.server.fullList, function(d) {
                        return d.key
                    })
                let gEnterGroup = allGroup.enter()
                    .append('g')
                    .attr('class', 'group')
                gEnterGroup.each(function(d, i) {})
                let gMergeGroup = allGroup.merge(gEnterGroup)
                gMergeGroup.each(function(d, i) {
                    allPlots = d3.select(this).selectAll('g.plot')
                        .data(d.data, function(dd) {
                            return dd.id
                        })
                    let gEnter = allPlots.enter()
                        .append('g')
                        .attr('class', 'plot')
                    gEnter.each(function(dd, ii) {
                        d3.select(this).append('rect')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('width', 2)
                            .attr('height', 2)
                            .attr('stroke', colorPalette.bright.stroke)
                            .style('fill-opacity', 1)
                            .attr('fill', colorPalette.bright.background)
                            .attr('stroke-width', 0.4)
                        // d3.select(this).append('text')
                        //   .text(dd.name)
                        //   .style('fill', '#000000')
                        //   .style('font-weight', 'bold')
                        //   .style('font-size', '12px')
                        //   .style('user-select', 'none')
                        //   .attr('text-anchor', 'middle')
                        //   .attr('transform', 'translate(' + (x) + ',' + (0) + ')')
                        // d3.select(this).append('text')
                        //   .text(dd.status.current.y + '' + dd.unit + '')
                        //   .style('fill', '#000000')
                        //   .style('font-weight', 'bold')
                        //   .style('font-size', '16px')
                        //   .style('user-select', 'none')
                        //   .attr('text-anchor', 'middle')
                        //   .attr('transform', 'translate(' + (x) + ',' + (0) + ')')
                    })
                    let gMerge = allPlots.merge(gEnter)
                    gMerge.each(function(dd, ii) {
                        d3.select(this)
                            .attr('transform', 'translate(' + (middleplot.getAxis('bottom').scale(new Date(dd.added))) + ',' + (middleDim.h) + ')')
                    })
                    allPlots
                        .exit()
                        .style('opacity', 0)
                        .remove()
                })
                allGroup
                    .exit()
                    .style('opacity', 0)
                    .remove()
            }

            drawCurve()
            // drawMiddleg()
        }

        function addFilterKey(key) {
            if (shared.server.hierarchy.keys.indexOf(key) === -1) {
                shared.server.hierarchy.keys.push(key)
            }
            pushNewHierachyKeys()
            // drawLeftPart()
            update_data()
        }
        function removeFilterKey(key) {
            let index = shared.server.hierarchy.keys.indexOf(key)
            if (index > 0) {
                shared.server.hierarchy.keys.splice(index)
            }
            pushNewHierachyKeys()
            // drawLeftPart()
            update_data()
        }
        function drawLeftPart() {
            // function drawBlock (g, tree, depth, dim) {
            //   if (depth === 1 || depth === 2) depth += 1
            //   if (shared.server.hierarchy.key === tree.id) depth += 1
            //
            //   let allGroup = g.selectAll('g.' + tree.id)
            //     .data(tree.keys)
            //   let gEnterGroup = allGroup.enter()
            //     .append('g')
            //     .attr('class', tree.id)
            //   gEnterGroup.each(function (d, i) {
            //     let g = d3.select(this)
            //     g.append('rect')
            //       .attr('id', d)
            //       .attr('x', 0)
            //       .attr('y', i * (dim.h / tree.keys.length))
            //       .attr('width', dim.w)
            //       .attr('height', dim.h / tree.keys.length)
            //       .attr('stroke-width', 0.2)
            //       .attr('stroke', '#000000')
            //       .attr('fill', colorCategory[i % colorCategory.length])
            //       .on('click', function () {
            //         console.log(d.keys);
            //       })
            //     g.append('text')
            //       .attr('id', tree.id + i)
            //       .text(d)
            //       .style('fill', '#000000')
            //       .style('font-size', '11px')
            //       .style('user-select', 'none')
            //       .style('pointer-events', 'none')
            //       .attr('text-anchor', 'middle')
            //       .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + ((i + 0.5) * (dim.h / tree.keys.length) + 4) + ')')
            //     for (let j = 0; j < tree.children.length; j++) {
            //       drawBlock(g, tree.children[j], depth, {x: dim.w, y: (dim.h / tree.children.length) * j, w: dim.w, h: dim.h / tree.children.length})
            //     }
            //   })
            //   let gMergeGroup = allGroup.merge(gEnterGroup)
            //   gMergeGroup.each(function (d, i) {
            //     let g = d3.select(this)
            //     // g.select('rect#' + key + i)
            //     //   .attr('x', depth === 0 ? dim.w * 0 : (depth === 1 ? dim.w * 0.1 : (depth === 2 ? dim.w * 0.9 : dim.w * 1)))
            //     //   .attr('width', depth === 0 ? dim.w * 1 : (depth === 1 ? dim.w * 0.8 : (depth === 2 ? dim.w * 0.1 : dim.w * 0)))
            //     // if (depth === 0) {
            //     //   g.select('text#' + key + i)
            //     //     .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + (dim.h * 0.5 + 4) + ')')
            //     //     .style('visibility', 'visible')
            //     // } else if (depth === 1) {
            //     //   g.select('text#' + key + i)
            //     //     .attr('transform', 'translate(' + (dim.w * 0.45) + ',' + (dim.h * 0.5 + 4) + ')')
            //     //     .style('visibility', 'visible')
            //     // } else if (depth === 2) {
            //     //   g.select('text#' + key + i)
            //     //     .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + (dim.h * 0.5 + 4) + ')')
            //     //     .style('visibility', 'visible')
            //     // } else if (depth === 3) {
            //     //   g.select('text#' + key + i)
            //     //     .style('visibility', 'hidden')
            //     // }
            //     // g.select('text')
            //     //   .style('visibility', (depth === 0 || depth ) ? 'visible' : 'hidden')
            //     // drawBlock(g, d.id, d.children, depth, {x: 0, y: 0, w: dim.w, h: dim.h / d.children.length})
            //
            //     d3.select(this)
            //       .transition()
            //       .duration(200)
            //       .attr('transform', 'translate(' + dim.x + ',' + (dim.y) + ')')
            //   })
            //   allGroup
            //     .exit()
            //     .style('opacity', 0)
            //     .remove()
            // }
            // drawBlock(leftg, shared.server.hierarchy.tree, 0, {x: 0, y: 0, w: leftDim.w, h: leftDim.h})
            function drawBlock(g, key, tree, dim, mode) {
                let allGroup = g.selectAll('g.' + key)
                    .data(tree)
                let gEnterGroup = allGroup.enter()
                    .append('g')
                    .attr('class', key)
                gEnterGroup.each(function(d, i) {
                    let g = d3.select(this)
                    // let cat = shared.server.hierarchy.categories[d]
                    g.append('rect')
                        .attr('x', dim.x)
                        .attr('y', dim.y + i * (dim.h / tree.length))
                        .attr('width', dim.w)
                        .attr('height', dim.h / tree.length)
                        .attr('stroke-width', 0.2)
                        .attr('stroke', '#000000')
                        .attr('fill', colorCategory[i % colorCategory.length])
                    // .attr('rx', cat === 'group' ? dim.w * 0.4 : 0)
                        .on('click', function() {
                            addFilterKey(d)
                        })
                    g.append('text')
                        .text(d)
                        .style('fill', '#000000')
                        .style('font-size', '11px')
                        .style('user-select', 'none')
                        .style('pointer-events', 'none')
                        .attr('text-anchor', 'middle')
                        .attr('transform', 'translate(' + (dim.x + dim.w * 0.5) + ',' + (dim.y + (i + 0.5) * (dim.h / tree.length) + 4) + ')')
                })
                let gMergeGroup = allGroup.merge(gEnterGroup)
                gMergeGroup.each(function(d, i) {
                    let g = d3.select(this)
                    // let cat = shared.server.hierarchy.categories[d]

                    g.select('rect')
                        .attr('x', dim.x)
                        .attr('y', dim.y + i * (dim.h / tree.length))
                        .attr('width', dim.w)
                        .attr('height', dim.h / tree.length)
                        .attr('stroke-width', 0.2)
                    // .attr('rx', cat === 'group' ? dim.w * 0.4 : 0)
                        .on('click', function() {
                            addFilterKey(d)
                        })
                    g.select('text')
                        .text(d)
                        .attr('transform', 'translate(' + (dim.x + dim.w * 0.5) + ',' + (dim.y + (i + 0.5) * (dim.h / tree.length) + 4) + ')')
                    // g.select('rect#' + key + i)
                    //   .attr('x', depth === 0 ? dim.w * 0 : (depth === 1 ? dim.w * 0.1 : (depth === 2 ? dim.w * 0.9 : dim.w * 1)))
                    //   .attr('width', depth === 0 ? dim.w * 1 : (depth === 1 ? dim.w * 0.8 : (depth === 2 ? dim.w * 0.1 : dim.w * 0)))
                    // if (depth === 0) {
                    //   g.select('text#' + key + i)
                    //     .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + (dim.h * 0.5 + 4) + ')')
                    //     .style('visibility', 'visible')
                    // } else if (depth === 1) {
                    //   g.select('text#' + key + i)
                    //     .attr('transform', 'translate(' + (dim.w * 0.45) + ',' + (dim.h * 0.5 + 4) + ')')
                    //     .style('visibility', 'visible')
                    // } else if (depth === 2) {
                    //   g.select('text#' + key + i)
                    //     .attr('transform', 'translate(' + (dim.w * 0.5) + ',' + (dim.h * 0.5 + 4) + ')')
                    //     .style('visibility', 'visible')
                    // } else if (depth === 3) {
                    //   g.select('text#' + key + i)
                    //     .style('visibility', 'hidden')
                    // }
                    // g.select('text')
                    //   .style('visibility', (depth === 0 || depth ) ? 'visible' : 'hidden')
                    // drawBlock(g, d.id, d.children, depth, {x: 0, y: 0, w: dim.w, h: dim.h / d.children.length})

                    // d3.select(this)
                    //   .transition()
                    //   .duration(200)
                    //   .attr('transform', 'translate(' + dim.x + ',' + (dim.y) + ')')
                })
                allGroup
                    .exit()
                    .style('opacity', 0)
                    .remove()
            }

            // let dimParent = {x: leftDim.w * 0.8, y: 0, w: leftDim.w * 0.2, h: leftDim.h}
            // let dimChildren = {x: leftDim.w * 0, y: 0, w: leftDim.w * 0.78, h: leftDim.h}

            let allGroup = leftg.selectAll('g.hierarchy')
                .data(shared.server.hierarchy.keys)
            let gEnterGroup = allGroup.enter()
                .append('g')
                .attr('class', 'hierarchy')
            gEnterGroup.each(function(d, i) {
                let data = shared.server.hierarchy.relationship[d]
                let g = d3.select(this)
                let gdim = {
                    x: (20 * i),
                    y: 0,
                    w: leftDim.w - (20 * i),
                    h: leftDim.h - (20 * i),
                }
                let dim = {
                    x: gdim.x,
                    y: gdim.y,
                    w: 20,
                    h: gdim.h,
                }
                g.append('rect')
                    .attr('id', d)
                    .attr('x', dim.x)
                    .attr('y', dim.y)
                    .attr('width', dim.w)
                    .attr('height', dim.h)
                    .attr('stroke-width', 0.2)
                    .attr('stroke', '#000000')
                    .attr('fill', colorCategory[i % colorCategory.length])
                    .on('click', function() {
                        removeFilterKey(d)
                    })
                g.append('text')
                    .attr('id', d)
                    .style('fill', '#000000')
                    .style('font-size', '11px')
                    .style('user-select', 'none')
                    .style('pointer-events', 'none')
                    .attr('text-anchor', 'middle')
                    .attr('transform', 'translate(' + (dim.x + dim.w * 0.5) + ',' + (4) + ')')
                    .selectAll('tspan')
                    .data(data.name.toUpperCase().split(''))
                    .enter()
                    .append('tspan')
                    .style('font-size', '11px')
                    .attr('x', 0)
                    .attr('dy', '0.9em')
                    .text(function(d) {
                        return d
                    })
            })
            let gMergeGroup = allGroup.merge(gEnterGroup)
            gMergeGroup.each(function(d, i) {
                let g = d3.select(this)
                let data = shared.server.hierarchy.relationship[d]
                let gdim = {
                    x: (20 * i),
                    y: 0,
                    w: leftDim.w - (20 * i),
                    h: leftDim.h - (20 * i),
                }

                if (i < shared.server.hierarchy.keys.length - 1) {
                    let dim = {
                        x: gdim.x + 20,
                        y: gdim.y + gdim.h - 20,
                        w: gdim.w - 20,
                        h: 20,
                    }
                    let tree = ''
                    for (let j = 0; j < data.children.length; j++) {
                        tree += shared.server.hierarchy.keys[i + 1] === data.children[j] ? '' : (j < data.children.length - 1 ? data.children[j] + '-' : data.children[j])
                    }
                    drawBlock(g, d, [ tree ], dim, 1)
                    // g.style('visibility', 'hidden')
                }
                else {
                    let dim = {
                        x: gdim.x + 20,
                        y: gdim.y,
                        w: gdim.w - 20,
                        h: gdim.h,
                    }
                    let tree = []
                    for (let j = 0; j < data.children.length; j++) {
                        let index = shared.server.hierarchy.keys.indexOf(data.children[j])
                        if (index === -1 || index > i) {
                            tree.push(data.children[j])
                        }
                    }
                    drawBlock(g, d, tree, dim, 2)
                    // g.style('visibility', 'visible')
                }
                // g.transition()
                //   .duration(200)
                //   .attr('transform', 'translate(' + dimParent.x + ',' + dimParent.y + ')')
            })
            allGroup
                .exit()
                .style('opacity', 0)
                .remove()

            // function drawItem () {
            //   let nbperline = Math.floor((itemBox.w) / (itemDim.w + itemDim.offsetL))
            //   allPlots = focusScrollbox.get('inner_g').selectAll('g.plot')
            //     .data(categoryfocus, function (d) {
            //       return d.id
            //     })
            //   let gEnter = allPlots.enter()
            //     .append('g')
            //     .attr('class', 'plot')
            //   gEnter.each(function (d, i) {
            //     d3.select(this).append('rect')
            //       .attr('x', 0)
            //       .attr('y', 0)
            //       .attr('width', itemDim.w)
            //       .attr('height', itemDim.h)
            //       .attr('stroke', colorPalette.bright.stroke)
            //       .attr('stroke-width', 0.2)
            //       .style('fill-opacity', 1)
            //       .attr('fill', colorPalette.bright.background)
            //     d3.select(this).append('text')
            //       .text(d.id)
            //       .style('fill', '#000000')
            //       .style('font-weight', 'bold')
            //       .style('font-size', '12px')
            //       .attr('text-anchor', 'middle')
            //       .attr('transform', 'translate(' + (itemDim.w * 0.5) + ',' + (12) + ')')
            //     // d3.select(this).append('text')
            //     //   .text('80')
            //     //   .style('fill', '#000000')
            //     //   .style('font-weight', 'bold')
            //     //   .style('font-size', '11px')
            //     //   .attr('text-anchor', 'start')
            //     //   .attr('transform', 'translate(' + (itemDim.x + itemDim.w) + ',' + (itemDim.y + itemDim.h) + ')')
            //     // d3.select(this).append('text')
            //     //   .text(d.status.current.y + '' + d.unit + '')
            //     //   .style('fill', '#000000')
            //     //   .style('font-weight', 'bold')
            //     //   .style('font-size', '11px')
            //     //   .attr('text-anchor', 'start')
            //     //   .attr('transform', 'translate(' + (itemDim.x + itemDim.w) + ',' + (itemDim.y + itemDim.h * 0.2) + ')')
            //     // d3.select(this).append('text')
            //     //   .text(d3.timeFormat('%H:%M')(new Date(shared.time.from)))
            //     //   .style('fill', '#000000')
            //     //   .style('font-weight', 'bold')
            //     //   .style('font-size', '11px')
            //     //   .attr('text-anchor', 'start')
            //     //   .attr('transform', 'translate(' + (2) + ',' + (itemDim.h - 22) + ')')
            //     // d3.select(this).append('text')
            //     //   .text(d3.timeFormat('%H:%M')(new Date(shared.server.time_of_night.date_now)))
            //     //   .style('fill', '#000000')
            //     //   .style('font-weight', 'bold')
            //     //   .style('font-size', '11px')
            //     //   .attr('text-anchor', 'start')
            //     //   .attr('transform', 'translate(' + (2) + ',' + (itemDim.h - 12) + ')')
            //
            //     // let opt_in = {g: d3.select(this),
            //     //   box: plotb
            //     // }
            //     // opt_in.g = opt_in.g.append('g') // .style('opacity', 0.8)
            //     // dd.plotObject = createPlot(opt_in)
            //   })
            //
            //   let gMerge = allPlots.merge(gEnter)
            //   let generalIndex = [0, 0]
            //   gMerge.each(function (d, i) {
            //     // let start_time_sec = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
            //     // let end_time_sec = {date: new Date(shared.server.time_of_night.date_now), time: Number(shared.server.time_of_night.now)}
            //     //
            //     // dd.plotObject.update_axis({
            //     //   id: 'bottom',
            //     //   domain: [start_time_sec.date, end_time_sec.date],
            //     //   range: [0, plotb.w]
            //     // })
            //     // dd.plotObject.update_axis({
            //     //   id: 'left',
            //     //   domain: [0, 100],
            //     //   range: [plotb.h, 0]
            //     // })
            //     // dd.plotObject.bindData(dd.id, [dd.status.current].concat(dd.status.previous), 'bottom', 'left')
            //
            //     // if (dd.ended) {
            //     //   let percent = (shared.time.current.getTime() - dd.ended.getTime()) / 400000
            //     //   d3.select(this).style('opacity', 1 - percent)
            //     //   d3.select(this).select('rect#disapearingBar')
            //     //     .attr('width', (plotbox.w - offset) * ((1 - percent) < 0 ? 0 : (1 - percent)))
            //     // }
            //
            //     // let xlim = xlimArray[i]
            //     d3.select(this)
            //       // .transition()
            //       // .duration(800)
            //       // .attr('transform', 'translate(' + (itemDim.offsetL) + ',' + (itemDim.offsetT + i * (itemDim.offsetT + itemDim.h)) + ')')
            //       .attr('transform', 'translate(' + (itemDim.offsetL + generalIndex[0] * (itemDim.offsetL + itemDim.w)) + ',' + (itemDim.offsetT + (generalIndex[1] * (itemDim.offsetT + itemDim.h))) + ')')
            //     generalIndex[0] = (generalIndex[0] + 1)
            //     if (generalIndex[0] >= nbperline) {
            //       generalIndex[0] = 0
            //       generalIndex[1] += 1
            //     }
            //   })
            //
            //   allPlots
            //     .exit()
            //     .style('opacity', 0)
            //     .remove()
            // }
            // function drawCategory () {
            //   let allGroup = leftg.selectAll('g.group')
            //     .data(shared.server.urgent_past)
            //   let gEnterGroup = allGroup.enter()
            //     .append('g')
            //     .attr('class', 'group')
            //   gEnterGroup.each(function (d, i) {
            //     let g = d3.select(this)
            //     // g.append('rect')
            //     //   .attr('id', 'extendBack')
            //     //   .attr('x', 0)
            //     //   .attr('y', 0)
            //     //   .attr('width', categoryDim.w)
            //     //   .attr('height', categoryDim.h - 2)
            //     //   .attr('stroke-width', 0.4)
            //     //   .attr('stroke', '#000000')
            //     //   .attr('fill', 'none')
            //     g.append('rect')
            //       .attr('id', 'front')
            //       .attr('x', 0)
            //       .attr('y', 0)
            //       .attr('width', categoryDim.w)
            //       .attr('height', categoryDim.h - 2)
            //       .attr('stroke-width', 0.2)
            //       .attr('stroke', '#000000')
            //       .style('opacity', d.data.length > 0 ? 1 : 0.1)
            //       .attr('fill', colorCategory[i % colorCategory.length])
            //     g.append('text')
            //       .text(d.key)
            //       .style('fill', '#000000')
            //       .style('font-weight', 'bold')
            //       .style('font-size', '14px')
            //       .style('user-select', 'none')
            //       .attr('text-anchor', 'middle')
            //       .attr('transform', 'translate(' + (categoryDim.w * 0.5) + ',' + (categoryDim.h * 0.5 + 4) + ')')
            //     g.transition()
            //       .duration(400)
            //       .attr('transform', 'translate(' + (categoryDim.offsetL) + ',' + (i * (categoryDim.offsetT + categoryDim.h)) + ')')
            //     g.on('mouseenter', function () {
            //       categoryfocus = d.data
            //       leftg.selectAll('rect#extendBack').attr('width', categoryDim.w)
            //       g.select('rect#extendBack')
            //         .attr('width', categoryDim.w + middleDim.w + 40)
            //       drawItem()
            //     })
            //   })
            //   let gMergeGroup = allGroup.merge(gEnterGroup)
            //   gMergeGroup.each(function (d, i) {
            //     d3.select(this).select('rect#front')
            //       .style('opacity', d.data.length > 0 ? 1 : 0.1)
            //     // .attr('fill', d.data.length > 0 ? colorCategory[i] : '#dddddd')
            //     d3.select(this)
            //       .transition()
            //       .duration(800)
            //       .attr('transform', 'translate(' + (categoryBox.x + categoryDim.offsetL) + ',' + (i * (categoryDim.offsetT + categoryDim.h) + 2) + ')')
            //   })
            //   allGroup
            //     .exit()
            //     .style('opacity', 0)
            //     .remove()
            // }
            // drawCategory()
            // drawItem()
        }
        this.drawLeftPart = drawLeftPart

        // function adjustScrollBox () {
        //   if (!scrollbox) return
        //   let tot = 0
        //   let offset = 2
        //   for (let i = 0; i < shared.server.urgent.urgent_current.length; i++) {
        //     tot += shared.server.urgent.urgent_current[i].data.length
        //   }
        //   let nbperline = Math.floor(rightDim.w / (plotbox.w + offset))
        //   scrollbox.update_box({x: 0, y: 0, w: rightDim.w, h: rightDim.h})
        //   scrollbox.reset_vertical_scroller({can_scroll: true, scroll_height: (plotbox.h + offset) * Math.floor(tot / nbperline)})
        // }
        function findnbperline() {
            let line = []
            for (let i = 0; i < shared.server.urgent.urgent_current.length; i++) {
                line.push(shared.server.urgent.urgent_current[i].data.length)
            }
            let glob = line.reduce((acc, cur) => acc + cur, 0)
            let maxiter = 100
            function bestFitPerLine(index) {
                if (maxiter < 0) {
                    return {
                        w: 0,
                        h: 0,
                    }
                }
                let max = rightBox.w * rightBox.h
                let dim = {
                    w: rightBox.w / index,
                    h: rightBox.h / index,
                }
                let tot = 0
                for (let i = 0; i < line.length; i++) {
                    tot += Math.ceil(line[i] / index) * index * (dim.w * dim.h)
                }
                maxiter -= 1
                if ((max - tot) < 0) {
                    return bestFitPerLine(index += 1)
                }
                else {
                    return index
                }
            }
            function bestFitGlobal(index) {
                if (maxiter < 0) {
                    return {
                        w: 0,
                        h: 0,
                    }
                }
                let dim = {
                    w: rightBox.w / index,
                    h: rightBox.h / (glob / index),
                }
                maxiter -= 1
                if (dim.h < dim.w) {
                    return bestFitGlobal(index += 1)
                }
                else {
                    return index
                }
            }

            let bestF = bestFitPerLine(1)
            let dim = {
                w: (rightBox.w / bestF),
                h: (rightBox.h / bestF),
            }
            if (dim.h < 6 || dim.w < 6) {
                maxiter = 100
                bestF = bestFitGlobal(1)
            }
            return bestF
        }
        function drawRightPart() {
            function chooseDrawingMode() {
                function bestFitPerLine(index) {
                    if (maxiter < 0) {
                        return {
                            w: 0,
                            h: 0,
                        }
                    }
                    let dim = {
                        w: rightBox.w / index,
                        h: rightBox.h / index,
                    }
                    let tot = 0
                    for (let i = 0; i < line.length; i++) {
                        tot += Math.ceil(line[i] / index) * index * (dim.w * dim.h)
                    }
                    maxiter -= 1
                    if ((max - tot) < 0) {
                        return bestFitPerLine(index += 1)
                    }
                    else {
                        return index
                    }
                }
                function bestFitGlobal(index) {
                    if (maxiter < 0) {
                        return {
                            w: 0,
                            h: 0,
                        }
                    }

                    let sqrtGlob = Math.floor(Math.sqrt(glob)) + 1
                    // dim = {w: rightBox.w / sqrtGlob, h: rightBox.h / sqrtGlob}
                    maxiter -= 1
                    // if (dim.h < dim.w) return bestFitGlobal(index += 1)
                    return sqrtGlob
                }

                let line = []
                for (let i = 0; i < shared.server.urgent.urgent_current.length; i++) {
                    line.push(shared.server.urgent.urgent_current[i].data.length)
                }
                let max = rightBox.w * rightBox.h
                let maxiter = 100
                let glob = line.reduce((acc, cur) => acc + cur, 0)

                nbperline = bestFitPerLine(1)
                dim = {
                    w: (rightBox.w / nbperline),
                    h: (rightBox.h / nbperline),
                }
                return
                if ((dim.w * dim.h * glob) / max < 0.8) {
                    nbperline = bestFitGlobal(1)
                    dim = {
                        w: (rightBox.w / nbperline),
                        h: (rightBox.h / nbperline),
                    }
                    mode = 2
                }
                else {
                    mode = 1
                }
            }
            function adjustTemplate(dim, temp) {
                return {
                    x: (temp.x * dim.w) / basicDim.w,
                    y: (temp.y * dim.h) / basicDim.h,
                    w: (temp.w * dim.w) / basicDim.w,
                    h: (temp.h * dim.h) / basicDim.h,
                    display: temp.display,
                }
            }
            function chooseTemplateDim(dim) {
                let basicTemplate = {
                    title1: {
                        display: true,
                        x: 4 * factor.x,
                        y: 4 * factor.y,
                        w: 192 * factor.x,
                        h: 46 * factor.y,
                    },
                    title2: {
                        display: true,
                        x: 4 * factor.x,
                        y: 50 * factor.y,
                        w: 192 * factor.x,
                        h: 46 * factor.y,
                    },
                    plot: {
                        display: true,
                        x: 4 * factor.x,
                        y: 104 * factor.y,
                        w: 92 * factor.x,
                        h: 92 * factor.y,
                    },
                    value1: {
                        display: true,
                        x: 104 * factor.x,
                        y: 104 * factor.y,
                        w: 92 * factor.x,
                        h: 46 * factor.y,
                    },
                    value2: {
                        display: true,
                        x: 104 * factor.x,
                        y: 150 * factor.y,
                        w: 92 * factor.x,
                        h: 46 * factor.y,
                    },
                    dim: {
                        w: 140,
                        h: 140,
                    },
                }
                let mediumTemplate = {
                    title1: {
                        display: true,
                        x: 4 * factor.x,
                        y: 4 * factor.y,
                        w: 192 * factor.x,
                        h: 46 * factor.y,
                    },
                    title2: {
                        display: true,
                        x: 4 * factor.x,
                        y: 50 * factor.y,
                        w: 192 * factor.x,
                        h: 46 * factor.y,
                    },
                    plot: {
                        display: true,
                        x: 4 * factor.x,
                        y: 104 * factor.y,
                        w: 22 * factor.x,
                        h: 92 * factor.y,
                    },
                    value1: {
                        display: true,
                        x: 34 * factor.x,
                        y: 104 * factor.y,
                        w: 162 * factor.x,
                        h: 46 * factor.y,
                    },
                    value2: {
                        display: true,
                        x: 34 * factor.x,
                        y: 150 * factor.y,
                        w: 162 * factor.x,
                        h: 46 * factor.y,
                    },
                    dim: {
                        w: dim.w > 100 ? 100 : dim.w,
                        h: dim.h,
                    },
                }
                let smallTemplate = {
                    title1: {
                        display: true,
                        x: 4 * factor.x,
                        y: 4 * factor.y,
                        w: 192 * factor.x,
                        h: 96 * factor.y,
                    },
                    title2: {
                        display: true,
                        x: 4 * factor.x,
                        y: 104 * factor.y,
                        w: 192 * factor.x,
                        h: 96 * factor.y,
                    },
                    plot: {
                        display: false,
                        x: 4 * factor.x,
                        y: 104 * factor.y,
                        w: 22 * factor.x,
                        h: 92 * factor.y,
                    },
                    value1: {
                        display: false,
                        x: 34 * factor.x,
                        y: 104 * factor.y,
                        w: 162 * factor.x,
                        h: 46 * factor.y,
                    },
                    value2: {
                        display: false,
                        x: 34 * factor.x,
                        y: 150 * factor.y,
                        w: 162 * factor.x,
                        h: 46 * factor.y,
                    },
                    dim: {
                        w: dim.w,
                        h: dim.h,
                    },
                }
                let miniTemplate = {
                    title1: {
                        display: true,
                        x: 4 * factor.x,
                        y: 4 * factor.y,
                        w: 192 * factor.x,
                        h: 192 * factor.y,
                    },
                    title2: {
                        display: false,
                        x: 4 * factor.x,
                        y: 50 * factor.y,
                        w: 192 * factor.x,
                        h: 46 * factor.y,
                    },
                    plot: {
                        display: false,
                        x: 4 * factor.x,
                        y: 104 * factor.y,
                        w: 22 * factor.x,
                        h: 92 * factor.y,
                    },
                    value1: {
                        display: false,
                        x: 34 * factor.x,
                        y: 104 * factor.y,
                        w: 162 * factor.x,
                        h: 46 * factor.y,
                    },
                    value2: {
                        display: false,
                        x: 34 * factor.x,
                        y: 150 * factor.y,
                        w: 162 * factor.x,
                        h: 46 * factor.y,
                    },
                    dim: {
                        w: dim.w,
                        h: dim.h,
                    },
                }
                let microTemplate = {
                    title1: {
                        display: false,
                        x: 4 * factor.x,
                        y: 4 * factor.y,
                        w: 192 * factor.x,
                        h: 192 * factor.y,
                    },
                    title2: {
                        display: false,
                        x: 4 * factor.x,
                        y: 50 * factor.y,
                        w: 192 * factor.x,
                        h: 46 * factor.y,
                    },
                    plot: {
                        display: false,
                        x: 4 * factor.x,
                        y: 104 * factor.y,
                        w: 22 * factor.x,
                        h: 92 * factor.y,
                    },
                    value1: {
                        display: false,
                        x: 34 * factor.x,
                        y: 104 * factor.y,
                        w: 162 * factor.x,
                        h: 46 * factor.y,
                    },
                    value2: {
                        display: false,
                        x: 34 * factor.x,
                        y: 150 * factor.y,
                        w: 162 * factor.x,
                        h: 46 * factor.y,
                    },
                    dim: {
                        w: dim.w,
                        h: dim.h,
                    },
                }
                if (dim.h > 140) {
                    return basicTemplate
                }
                if (dim.h > 90) {
                    return mediumTemplate
                }
                if (dim.h > 40) {
                    return smallTemplate
                }
                if (dim.h > 25) {
                    return miniTemplate
                }
                return microTemplate
            }

            let mode = 1
            let offset = 0
            let factor = {
                x: 1,
                y: 1,
            }
            let basicDim = {
                w: 200 * factor.x,
                h: 200 * factor.y,
            }
            let dim = {
                w: 0,
                h: 0,
            }
            let nbperline = 0

            chooseDrawingMode()

            dim.w -= offset
            dim.h -= offset
            let choosenTemplateDim = chooseTemplateDim(dim)
            dim = choosenTemplateDim.dim

            let offsetLine = 0
            let tot = 0
            for (let i = 0; i < shared.server.urgent.urgent_current.length; i++) {
                tot += shared.server.urgent.urgent_current[i].data.length
                offsetLine += Math.ceil(shared.server.urgent.urgent_current[i].data.length / nbperline)
            }
            offsetLine = (rightBox.h - (offsetLine * (dim.h + offset))) / (shared.server.urgent.urgent_current.length)

            let xlimArray = []
            let limit = 0
            for (let i = 0; i < shared.server.urgent.urgent_current.length; i++) {
                let inter = Math.round((shared.server.urgent.urgent_current[i].data.length * nbperline) / tot)
                if (inter < 1) {
                    inter = 1
                }
                xlimArray.push(inter)
                limit += inter
            }
            while (limit > nbperline) {
                xlimArray[xlimArray.indexOf(Math.max(...xlimArray))] -= 1
                limit -= 1
            }

            let generalIndex = [ 0, 0 ]
            let font_size = '16px'

            function drawCategory() {
                let allGroup = rightCats.selectAll('g.labelCategory')
                    .data(shared.server.urgent.urgentKey)
                let gEnterGroup = allGroup.enter()
                    .append('g')
                    .attr('class', 'labelCategory')
                    .attr('id', d => d)
                gEnterGroup.each(function(d, i) {
                    let g = d3.select(this)
                    // scrollbox.get('inner_g').append('g').attr('id', d => d)
                    g.style('opacity', 0.2)
                    g.append('rect')
                        .attr('id', 'front')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', spaceline - 2)
                        .attr('height', spaceline - 2)
                        .attr('stroke-width', 0.2)
                        .attr('stroke', '#000000')
                        .attr('fill', colorCategory[i % colorCategory.length])
                        .style('fill-opacity', 1)
                    g.append('text')
                        .text('0')
                        .attr('x', spaceline * 0.5)
                        .attr('y', spaceline * 0.5 + 2)
                        .style('fill', '#000000')
                        .style('font-weight', 'bold')
                        .style('font-size', '11px')
                        .style('user-select', 'none')
                        .attr('text-anchor', 'middle')
                    g.on('mouseenter', function() {

                    })

                    let gext = g.append('g').attr('id', 'extension').style('opacity', 0)
                    gext.append('circle')
                        .attr('cx', rightDim.w - spaceline * 0.4)
                        .attr('cy', spaceline * 0.5)
                        .attr('r', spaceline * 0.4)
                        .attr('stroke-width', 0.4)
                        .attr('stroke', '#000000')
                        .attr('fill', '#dddddd')
                    gext.append('text')
                        .text('')
                        .attr('x', rightDim.w - spaceline * 0.4)
                        .attr('y', spaceline * 0.5 + 3)
                        .style('fill', '#000000')
                        .style('font-weight', 'bold')
                        .style('font-size', '12px')
                        .style('user-select', 'none')
                        .attr('text-anchor', 'middle')
                })
                let gMergeGroup = allGroup.merge(gEnterGroup)
                gMergeGroup.each(function(d, i) {
                    // drawItem(d, i)
                    // d3.select(this).select('text').text(d.data.length)
                    // d3.select(this).style('opacity', d.data.length > 0 ? 1 : 0.2)
                    // if (mode === 1) d3.select(this).select('g#extension').style('opacity', 0)
                    // else if (mode === 2) d3.select(this).select('g#extension').style('opacity', 1)
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('transform', 'translate(' + (0) + ',' + (i * (spaceline) + 2) + ')')
                })
                allGroup
                    .exit()
                    .style('opacity', 0)
                    .remove()
            }
            function drawItem() {
                let allGroup = rightItems.selectAll('g.category') // scrollbox.get('inner_g').selectAll('g.category')
                    .data(shared.server.urgent.urgent_current)
                let gEnterGroup = allGroup.enter()
                    .append('g')
                    .attr('class', 'category')
                    .attr('id', d => d.key)
                gEnterGroup.each(function(d, i) {
                    d3.select(this).append('path')
                        .attr('id', 'visualLinker')
                        .attr('fill', 'none')
                        .attr('stroke-width', 6)
                        .attr('stroke', '#000000')
                })
                let gMergeGroup = allGroup.merge(gEnterGroup)

                gMergeGroup.each(function(d, i) {
                    let labelCat = rightCats.selectAll('g.labelCategory').filter('g#' + d.key)
                    labelCat.style('opacity', d.data.length > 0 ? 1 : 0.2)
                    labelCat.select('text').text(d.data.length)

                    let points = [
                        {
                            x: -spaceline,
                            y: spaceline * 0.5 + (shared.server.urgent.urgentKey.indexOf(d.key) * (spaceline)) - (offsetLine * (i + 1)),
                        },
                        {
                            x: 0,
                            y: spaceline * 0.5 + (shared.server.urgent.urgentKey.indexOf(d.key) * (spaceline)) - (offsetLine * (i + 1)),
                        },
                    ]
                    // if (d.data.length > nbperline) {
                    //   if (mode === 1) labelCat.select('g#extension').style('opacity', 0)
                    //   else if (mode === 2) labelCat.select('g#extension').style('opacity', 1)
                    //   labelCat.select('g#extension text').text('+' + (d.data.length - nbperline))
                    // }
                    allPlots = d3.select(this).selectAll('g.plot')
                        .data(d.data, function(dd) {
                            return dd.id
                        })
                    let gEnter = allPlots.enter()
                        .append('g')
                        .attr('class', 'plot')
                    gEnter.each(function(dd, ii) {
                        d3.select(this).append('rect')
                            .attr('id', 'back')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('stroke', '#000000')
                            .attr('stroke-width', 0.4)
                            .attr('fill', colorPalette.dark.background)
                        // .attr('rx', 4)
                        // .attr('ry', 4)

                        d3.select(this).append('text')
                            .attr('id', 'name1')
                            .text(dd.name)
                            .style('fill', '#000000')
                            .style('font-size', font_size)
                            .style('font-weight', '')
                            .style('user-select', 'none')
                            .attr('text-anchor', 'middle')
                        d3.select(this).append('text')
                            .attr('id', 'name2')
                            .text(dd.data.type.name)
                            .style('fill', '#000000')
                            .style('font-size', font_size)
                            .style('font-weight', '')
                            .style('user-select', 'none')
                            .attr('text-anchor', 'middle')
                        d3.select(this).append('text')
                            .attr('id', 'currentvalue')
                            .text(dd.data.measures[0].value + '' + (dd.unit ? dd.unit : '%') + '+3')
                            .style('fill', '#000000')
                            .style('font-size', font_size)
                            .style('font-weight', '')
                            .style('user-select', 'none')
                            .attr('text-anchor', 'middle')
                        d3.select(this).append('text')
                            .attr('id', 'treshold')
                            .text('30')
                            .style('font-size', font_size)
                            .style('fill', '#000000')
                            .style('font-weight', '')
                            .style('user-select', 'none')
                            .attr('text-anchor', 'middle')

                        let opt_in = {
                            g: d3.select(this).append('g'),
                            box: choosenTemplateDim.plot,
                        }
                        miniPlotsVect[dd.id] = createPlot(opt_in)

                        // let gtresh = d3.select(this).append('g').attr('id', 'treshold')
                        // gtresh.append('rect')
                        //   .attr('id', 'column')
                        //   .attr('x', 0)
                        //   .attr('y', 0)
                        //   .attr('width', plotbox.w * 0.1)
                        //   .attr('height', plotbox.h - offset)
                        //   .attr('stroke', colorPalette.bright.stroke)
                        //   .attr('stroke-width', 0.2)
                        //   .style('opacity', 1)
                        //   .attr('fill', colorPalette.medium.background)

                        // let tempg = d3.select(this).append('g')
                        // tempg.append('circle')
                        //   .attr('id', 'tempCirc')
                        //   .attr('cx', plotbox.w * 0.9)
                        //   .attr('cy', plotbox.h * 0.8 + 2)
                        //   .attr('r', 10)
                        //   .style('fill', 'none')
                        //   .attr('stroke', '#000000')
                        //   .attr('stroke-width', 4)
                        //   .attr('stroke-dasharray', [2 * Math.PI * 10, 0])
                        //   .transition()
                        //   .delay(8000)
                        //   .duration(8000)
                        //   .attr('stroke-dasharray', [0, 2 * Math.PI * 10])
                        //   .on('end', () => tempg.remove())
                        // tempg.append('text')
                        //   .attr('id', 'tempText')
                        //   .text('+')
                        //   .style('fill', '#000000')
                        //   .style('font-weight', 'bold')
                        //   .style('font-size', '26px')
                        //   .style('user-select', 'none')
                        //   .attr('text-anchor', 'middle')
                        //   .attr('transform', 'translate(' + (plotbox.w * 0.9) + ',' + (plotbox.h * 0.8 + 11) + ')')

                        d3.select(this).on('mouseenter', function() {
                            // middleplot.bindData(dd.id, [dd.status.current].concat(dd.status.previous), 'bottom', 'right')
                            // let linefunction = d3.line()
                            //   .x(function (d) { return xscale(d.x) })
                            //   .y(function (d) { return yscale(d.y) })
                            // overlaymiddleplot.append('path')
                            //   .attr('d', linefunction([dd.status.current].concat(dd.status.previous)))
                            //   .attr('fill', 'none')
                            //   .attr('stroke-width', 2)
                            //   .attr('stroke', '#000000')
                            overlaymiddleplot.selectAll('.finished')
                                .style('opacity', 0.1)
                        })
                        d3.select(this).on('mouseleave', function() {
                            // middleplot.unbindData(dd.id)
                            // overlaymiddleplot.select('path').remove()
                            overlaymiddleplot.selectAll('.finished')
                                .style('opacity', 1)
                        })
                    })
                    let gMerge = allPlots.merge(gEnter)
                    gMerge.each(function(dd, ii) {
                        let g = d3.select(this)
                        function drawBody() {
                            g.select('g#treshold').style('opacity', 1)
                            g.select('rect#back')
                                .attr('width', dim.w)
                                .attr('height', dim.h)

                            let newtitle1box = adjustTemplate(dim, choosenTemplateDim.title1)
                            g.select('text#name1')
                                .attr('transform', 'translate(' + (newtitle1box.x + newtitle1box.w * 0.5) + ',' + (newtitle1box.y + newtitle1box.h * 0.5) + ')')
                                .attr('dy', newtitle1box.h * 0.5 * 0.33)
                                .style('visibility', newtitle1box.display ? 'visible' : 'hidden')

                            let newtitle2box = adjustTemplate(dim, choosenTemplateDim.title2)
                            g.select('text#name2')
                                .attr('transform', 'translate(' + (newtitle2box.x + newtitle2box.w * 0.5) + ',' + (newtitle2box.y + newtitle2box.h * 0.5) + ')')
                                .attr('dy', newtitle1box.h * 0.5 * 0.33)
                                .style('visibility', newtitle2box.display ? 'visible' : 'hidden')

                            let newvalue1box = adjustTemplate(dim, choosenTemplateDim.value1)
                            g.select('text#currentvalue')
                                .text(dd.data.measures[0].value + '' + (dd.unit ? dd.unit : '%') + '+3')
                                .attr('transform', 'translate(' + (newvalue1box.x + newvalue1box.w * 0.5) + ',' + (newvalue1box.y + newvalue1box.h * 0.5) + ')')
                                .attr('dy', newtitle1box.h * 0.5 * 0.33)
                                .style('visibility', newvalue1box.display ? 'visible' : 'hidden')

                            let newvalue2box = adjustTemplate(dim, choosenTemplateDim.value2)
                            g.select('text#treshold')
                                .text('30')
                                .attr('transform', 'translate(' + (newvalue2box.x + newvalue2box.w * 0.5) + ',' + (newvalue2box.y + newvalue2box.h * 0.5) + ')')
                                .attr('dy', newtitle2box.h * 0.5 * 0.33)
                                .style('visibility', newvalue2box.display ? 'visible' : 'hidden')

                            let newplotbox = adjustTemplate(dim, choosenTemplateDim.plot)
                            miniPlotsVect[dd.id].get('main').g.style('visibility', newplotbox.display ? 'visible' : 'hidden')
                            let start_time_sec = {
                                date: new Date(shared.time.from),
                                time: Number(shared.time.from.getTime()),
                            }
                            let end_time_sec = {
                                date: new Date(shared.server.time_of_night.date_now),
                                time: Number(shared.server.time_of_night.now),
                            }

                            // newplotbox.h -= offset
                            miniPlotsVect[dd.id].update_box(newplotbox)
                            miniPlotsVect[dd.id].update_axis({
                                id: 'bottom',
                                domain: [ start_time_sec.date, end_time_sec.date ],
                                range: [ 0, newplotbox.w ],
                                box: {
                                    x: 0,
                                    y: 0,
                                    w: newplotbox.w,
                                    h: newplotbox.h,
                                },
                                tickSize: -newplotbox.h,
                            })
                            miniPlotsVect[dd.id].update_axis({
                                id: 'left',
                                domain: [ 0, 100 ],
                                range: [ newplotbox.h, 0 ],
                                box: {
                                    x: 0,
                                    y: 0,
                                    w: newplotbox.w,
                                    h: newplotbox.h,
                                },
                                tickSize: -newplotbox.w,
                            })
                        }
                        drawBody()

                        if (mode === 1) {
                            if (generalIndex[0] >= nbperline) {
                                generalIndex[0] = 0
                                generalIndex[1] += 1
                            }
                            let cap = d.data.length % nbperline
                            let offleft = (ii >= (d.data.length - cap))
                                ? (rightBox.w - (offset * (cap - 1) + dim.w * cap)) * 0.5
                                : (rightBox.w - (offset * (nbperline - 1) + dim.w * nbperline)) * 0.5
                            d3.select(this)
                                .transition()
                                .duration(200)
                                .attr('transform', 'translate(' + (offleft + generalIndex[0] * (offset + (dim.w))) + ',' + ((generalIndex[1] * (offset + (dim.h)))) + ')')
                            points.push({
                                x: (offleft + generalIndex[0] * (offset + (dim.w))) - dim.w * 0.1,
                                y: (generalIndex[1] * (offset + (dim.h))) + dim.h * 0.5,
                            })
                            points.push({
                                x: (offleft + generalIndex[0] * (offset + (dim.w))) + dim.w * 1.1,
                                y: (generalIndex[1] * (offset + (dim.h))) + dim.h * 0.5,
                            })
                            generalIndex[0] = (generalIndex[0] + 1)
                        }
                        else if (mode === 2) {
                            if (generalIndex[0] >= nbperline) {
                                generalIndex[0] = 0
                                generalIndex[1] += 1
                            }
                            d3.select(this)
                                .transition()
                                .duration(200)
                                .attr('transform', 'translate(' + (generalIndex[0] * (offset + (dim.w))) + ',' + ((generalIndex[1] * (offset + (dim.h)))) + ')')
                            points.push({
                                x: (generalIndex[0] * (offset + (dim.w))) - dim.w * 0.1,
                                y: (generalIndex[1] * (offset + (dim.h))) + dim.h * 0.5,
                            })
                            points.push({
                                x: (generalIndex[0] * (offset + (dim.w))) + dim.w * 1.1,
                                y: (generalIndex[1] * (offset + (dim.h))) + dim.h * 0.5,
                            })
                            generalIndex[0] = (generalIndex[0] + 1)
                        }
                    })
                    allPlots
                        .exit()
                        .style('opacity', 0)
                        .remove()
                    if (mode === 1) {
                        if (d.data.length > 0) {
                            generalIndex[0] = 0
                            generalIndex[1] += 1
                        }
                        let linefunction = d3.line()
                            .x(function(d) {
                                return d.x
                            })
                            .y(function(d) {
                                return d.y
                            })
                            .curve(d3.curveStepBefore)
                        d3.select(this).select('path#visualLinker')
                            .attr('d', linefunction(points))
                            .style('opacity', d.data.length > 0 ? 0.7 : 0)
                    }
                    else {
                        d3.select(this).select('path#visualLinker')
                            .style('opacity', 0)
                    }
                    // if (mode === 1) {
                    //   d3.select(this)
                    //     .transition()
                    //     .duration(200)
                    //     .attr('transform', 'translate(' + (0) + ',' + (offsetLine * (i + 1)) + ')')
                    // } else if (mode === 2) {
                    //   d3.select(this)
                    //     .transition()
                    //     .duration(200)
                    //     .attr('transform', 'translate(' + (0) + ',' + (shared.server.urgent.urgentKey.indexOf(d.key) * (spaceline) + 2) + ')')
                    // }

                })
                allGroup
                    .exit()
                    .style('opacity', 0)
                    .remove()
            }

            drawItem()
            drawCategory()

            // adjustScrollBox()
        }
        this.drawRightPart = drawRightPart

        function update() {}
        this.update = update
    }
    let svgUrgentPlots = new SvgUrgentPlots()
    let svgPinnedPlots = new SvgPinnedPlots()
}
// -------------------------------------------------------------------
// -------------------------------------------------------------------
