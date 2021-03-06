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
var main_script_tag = 'WeatherMonitoring'
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
/* global ArrZoomerBase */

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
window.load_script({
    source: main_script_tag,
    script: '/js/utils/ArrZoomerUtil/ArrZoomerBase.js',
})

// load additional js files:
// window.load_script({ source:main_script_tag, script:"/js/utils_scrollGrid.js"});

// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 12
    let w0 = 12
    let div_key = 'main'
    let content = '<div id=\'' + opt_in.base_name + div_key + '\'>'
  // '<iframe width="600" height="500" id="gmap_canvas" src="https://maps.google.com/maps?q=la%20palma&t=&z=13&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>' +
  // '<iframe width="650" height="650" src="https://embed.windy.com/embed2.html?lat=28.718&lon=-17.849&zoom=11&level=surface&overlay=wind&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=48.683&detailLon=2.133&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1" frameborder="0"></iframe>' +
  + '</div>'

    opt_in.widget_func = {
        sock_func: sock_weather_monitoring,
        main_func: main_weather_monitoring,
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
let sock_weather_monitoring = function(opt_in) {}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// here we go with the content of this particular widget
// -------------------------------------------------------------------
let main_weather_monitoring = function(opt_in) {
    let this_top = this
    let my_unique_id = unique()
    let widget_type = opt_in.widget_type
    let widget_source = opt_in.widget_source

    window.colorPalette = get_color_theme('bright_grey')
    let is_south = window.SITE_TYPE === 'S'

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

    // -1 for value => fit 100% of remaining space
    let box = {
        time_information: {
            x: 0,
            y: 0,
            w: 200,
            h: 65,
        },
        urgent: {
            x: 0,
            y: 65,
            w: 200,
            h: -1,
        },
        overview: {
            x: 260,
            y: 0,
            w: 250,
            h: -1,
        },
        external: {
            x: 400,
            y: 0,
            w: -1,
            h: 50,
        },
    }
    box.focus = {
        x: box.overview.x + box.overview.w,
        y: 0,
        w: -1,
        h: -1,
    }
    let svg_dims = {
    }
    let screen_unit = 'px'

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


    // TO MOVE TO COMMON
    function format_to_date_on_site(millisec) {
        return new Date(millisec)
    }
    function format_to_date_local(millisec) {
        return new Date(millisec)
    }
    function first_letter_upper(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
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
                .style('top', '0' + screen_unit)
                .style('left', '0' + screen_unit)
                .on('dblclick.zoom', null)

            if (disable_scroll_svg) {
                svg.svg.on('wheel', function(event) {
                    event.preventDefault()
                })
            }

            function adjustDim() {
                box.urgent.h = svg_dims.h[0] - box.time_information.h
                box.overview.h = svg_dims.h[0] - box.external.h
                box.external.w = svg_dims.w[0] - box.urgent.w
                box.focus = {
                    x: box.overview.x + box.overview.w,
                    y: 0,
                    w: svg_dims.w[0] - (box.overview.x + box.overview.w),
                    h: svg_dims.h[0] - (box.external.y + box.external.h),
                }
            }

            $(window).resize(
                function() {
                    adjustDim()
                })
            adjustDim()


            svg.back = svg.svg.append('g')
            svg.g = svg.svg.append('g')

            svg.svg.append('g').attr('id', 'time_information')
                .attr('transform', 'translate('
            + box.time_information.x
            + ','
            + box.time_information.y
            + ')')
            svg.svg.append('g').attr('id', 'urgent')
                .attr('transform', 'translate('
            + box.urgent.x
            + ','
            + box.urgent.y
            + ')')
            svg.svg.append('g').attr('id', 'overview')
                .attr('transform', 'translate('
            + box.overview.x
            + ','
            + box.overview.y
            + ')')
            svg.svg.append('g').attr('id', 'external')
                .attr('transform', 'translate('
            + box.external.x
            + ','
            + box.external.y
            + ')')
            svg.svg.append('g').attr('id', 'focus')
                .attr('transform', 'translate('
            + box.focus.x
            + ','
            + box.focus.y
            + ')')
        }
        function initBackground() {
            let pattern = {
                select: {
                },
            }
            pattern.select.defs = svg.g.append('defs')
            pattern.select.patternLock = pattern.select.defs.append('pattern')
                .attr('id', 'patternLock')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 20)
                .attr('height', 20)
                .attr('fill', 'none')
                .attr('patternUnits', 'userSpaceOnUse')
            pattern.select.patternLock.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 20)
                .attr('y2', 20)
                .attr('stroke', 'gold')
                .attr('stroke-width', 8)
                .attr('stroke-opacity', 0.6)

            pattern.select.warningGrid = pattern.select.defs.append('pattern')
                .attr('id', 'warningGrid')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 22)
                .attr('height', 22)
                .attr('fill', 'none')
            pattern.select.warningGrid.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 22)
                .attr('y2', 22)
                .attr('stroke', colorPalette.blocks.fail.background)
                .attr('stroke-width', 6)
                .attr('stroke-opacity', 6)
            pattern.select.warningGrid.append('line')
                .attr('x1', 22)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', 22)
                .attr('stroke', colorPalette.blocks.fail.background)
                .attr('stroke-width', 6)
                .attr('stroke-opacity', 6)

            // svg.back.append('rect')
            //     .attr('x', svg_dims.w[0] * 0.0)
            //     .attr('y', svg_dims.h[0] * 0.0)
            //     .attr('width', svg_dims.w[0] * 0.26)
            //     .attr('height', 30)
            //     .attr('fill', colorPalette.darker.background)
            // svg.back.append('rect')
            //     .attr('x', svg_dims.w[0] * 0.26 - 30)
            //     .attr('y', svg_dims.h[0] * 0.0)
            //     .attr('width', 30)
            //     .attr('height', svg_dims.h[0] * 1)
            //     .attr('fill', colorPalette.darker.background)
            // svg.back.append('text')
            //     .text('Data tracking')
            //     .style('fill', '#000000')
            //     .style('font-weight', 'bold')
            //     .style('font-size', '22' + screen_unit)
            //     .attr('text-anchor', 'start')
            //     .attr('transform', 'translate(' + (4) + ',' + (20) + ')')

            // svg.back.append('rect')
            //   .attr('x', svg_dims.w[0] * 0.26)
            //   .attr('y', svg_dims.h[0] * 0.17)
            //   .attr('width', svg_dims.w[0] * 0.48)
            //   .attr('height', svg_dims.h[0] * 0.4)
            //   .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
            //   .attr('stroke', 'none')
            //   .attr('rx', 0)
            // svg.back.append('text')
            //     .text('Big Plot')
            //     .style('fill', colorPalette.bright.background)
            //     .style('font-weight', 'bold')
            //     .style('font-size', '8' + screen_unit)
            //     .attr('text-anchor', 'middle')
            //     .attr('transform', 'translate(' + (svg_dims.w[0] * 0.5) + ',' + (svg_dims.h[0] * 0.25) + ')')
            // let fo = svg.back.append('foreignObject')
            //     .attr('x', svg_dims.w[0] * 0.5 + screen_unit)
            //     .attr('y', svg_dims.h[0] * 0.36 + screen_unit)
            //     .attr('width', svg_dims.w[0] * 0.48 + screen_unit)
            //     .attr('height', svg_dims.h[0] * 0.495 + screen_unit).node()
            //
            // let iframe = document.createElement('iframe')
            // iframe.width = (svg_dims.w[0] * 0.48) + screen_unit
            // iframe.height = (svg_dims.h[0] * 0.3) + screen_unit
            // iframe.src = 'https://embed.windy.com/embed2.html?lat=28.718&lon=-17.849&zoom=11&level=surface&overlay=wind&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=48.683&detailLon=2.133&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1'
            //
            // fo.appendChild(iframe)
        }
        function initBox() {
            // box.urgent_supervision = {
            //     x: 0,
            //     y: 0,
            //     w: box.urgent.w,
            //     h: box.urgent.h,
            // }

            box.overview_time_options = {
                x: 0,
                y: 0, // y: box.overview_date.y + box.overview_date.h,
                w: box.overview.w,
                h: 100,
            }
            box.overview_measures = {
                x: 0,
                y: box.overview_time_options.y + box.overview_time_options.h,
                w: box.overview.w,
                h: (box.overview.h
                - box.overview_time_options.h)
                * 0.5,
            }
            box.overview_sensors = {
                x: 0,
                y: box.overview.h * 0.6,
                w: box.overview.w,
                h: box.overview.h * 0.4,
            }
            box.overview_horizontal_dispatch = {
                warning: {
                    x: 0,
                    w: 20,
                },
                old_values: {
                    x: 25,
                    w: (box.overview.w - 30) * 0.5,
                },
                current_values: {
                    x: 30 + (box.overview.w - 20) * 0.5,
                    w: (box.overview.w - 30) * 0.5,
                },
            }

            box.focus_measures = {
                x: box.focus.w * 0.2,
                y: box.focus.h * 0.1,
                w: box.focus.w * 0.6,
                h: box.focus.h * 0.4,
            }
            box.focus_sensors = {
                x: 0,
                y: box.focus.h * 0.6,
                w: box.focus.w,
                h: box.focus.h * 0.4,
            }

            box.block_queue_server = {
                x: svg_dims.w[0] * 0.374,
                y: svg_dims.h[0] * 0.155,
                w: svg_dims.w[0] * 0.59,
                h: svg_dims.h[0] * 0.47,
                marg: svg_dims.w[0] * 0.01,
            }
        }
        function initDefaultStyle() {
            shared.style = {
            }
            shared.style.runRecCol = cols_blues[2]
            shared.style.blockCol = function(opt_in) {
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
            data: data_in,
            icon_divs: icon_divs,
        })

        let svg_div_id = sgv_tag.main.id + 'svg'
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

        shared.server = data_in.data
        loadMesures()

        svg_main_measures_tracking.init_data()
        svgHeathMapSensors.init_data()

        createUrgentList()

        svg_time_information.init_data()
        svgFMTimeline.init_data()
        svgFMSupervision.init_data()
        svgObservationSite.init_data()
        svg_measures_plots.init_data()

        // svgPL.init_data()

        // svgPlotDisplay.init_data()
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

        for (let key in data_in.data) {
            shared.server[key] = data_in.data[key]
        }
        // svgPlotDisplay.update_data()
        updateMesures()
        createUrgentList()

        svg_main_measures_tracking.update_data()
        // svgPlotDisplay.update_data()
        svg_time_information.update_data()
        svgFMSupervision.update_data()

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

    // TO REMOVE TO USE REAL DATA
    function addDataToPlot(data) {
        for (let i = 0; i < shared.data.length; i++) {
            if (shared.data[i].id === data.id) {
                shared.data.splice(i, 1)
                svg_measures_plots.unbind_data(data)
                svg_main_measures_tracking.unselectMeasure(data.id)
                return
            }
        }
        shared.data.push(data)
        svg_measures_plots.bind_data(data)
        svg_main_measures_tracking.selectMeasure(data.id)
    }
    function linearRegression(x, y) {
        var lr = {
        }
        var n = y.length
        var sumx = 0
        var sumy = 0
        var sumxy = 0
        var sumxx = 0
        var sumyy = 0

        for (let i = 0; i < y.length; i++) {
            sumx += x[i]
            sumy += y[i]
            sumxy += (x[i] * y[i])
            sumxx += (x[i] * x[i])
            sumyy += (y[i] * y[i])
        }

        lr['slope'] = (n * sumxy - sumx * sumy) / (n * sumxx - sumx * sumx)
        lr['intercept'] = (sumy - lr.slope * sumx) / n
        lr['r2'] = Math.pow((n * sumxy - sumx * sumy) / Math.sqrt((n * sumxx - sumx * sumx) * (n * sumyy - sumy * sumy)), 2)

        return lr
    }
    function updateMesures() {
        let fillfun = function(index) {
            let status = {
                current: '',
                previous: [],
            }
            status.current = deep_copy(shared.server.data_out[Math.floor(index / 4)][index % 4].data[0])
            status.current.x = new Date(shared.server.time_information.time_now_sec)
            for (let i = 0; i < (shared.server.time_information.history_duration_sec / shared.server.time_information.history_step_sec); i++) {
                if (shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2] === undefined
          || shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2].y === undefined) {
                    break
                }
                status.previous.push(deep_copy(shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2]))
                status.previous[i].x = new Date()
                status.previous[i].x.setTime(status.current.x.getTime() - i * 3600 * 100)
            }
            status.gradient = (linearRegression(status.previous.map((a) => a.x.getTime()), status.previous.map((a) => a.y)).slope * 1000000).toFixed(1)
            return status
        }
        let index = 0
        for (var i = 0; i < shared.server.measures.length; i++) {
            index += 1
            shared.server.measures[i].status = fillfun(index)
            for (var j = 0; j < shared.server.measures[i].subMeasures.length; j++) {
                index += 1
                shared.server.measures[i].subMeasures[j].status = fillfun(index)
            }
        }
    }
    function loadMesures() {
        let fillfun = function(index) {
            let status = {
                current: '',
                previous: [],
            }
            status.current = deep_copy(shared.server.data_out[Math.floor(index / 4)][index % 4].data[0])
            status.current.x = new Date(shared.server.time_information.time_now_sec)
            status.gradient = Math.floor((Math.random() * 20) - 10)
            for (let i = 0; i < (shared.server.time_information.history_duration_sec / shared.server.time_information.history_step_sec); i++) {
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
        shared.server.measures = [
            {
                id: 'id0',
                name: 'Measure1',
                status: fillfun(1),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [],
            },
            {
                id: 'id1',
                name: 'Measure2',
                status: fillfun(2),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [],
            },
            {
                id: 'id2',
                name: 'Measure3',
                status: fillfun(3),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [],
            },
            {
                id: 'id3',
                name: 'Measure4',
                status: fillfun(4),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [
                    {
                        id: 'id4',
                        name: 'subMeasure.14',
                        status: fillfun(5),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                ],
            },
            {
                id: 'id5',
                name: 'Measure5',
                status: fillfun(6),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [],
            },
            {
                id: 'id6',
                name: 'Measure6',
                status: fillfun(7),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [
                    {
                        id: 'id7',
                        name: 'subMeasure6.1',
                        status: fillfun(8),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                ],
            },
            {
                id: 'id8',
                name: 'Measure7',
                status: fillfun(9),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [
                    {
                        id: 'id9',
                        name: 'subMeasure7.1',
                        status: fillfun(10),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                    {
                        id: 'id10',
                        name: 'subMeasure7.2',
                        status: fillfun(11),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                ],
            },
            {
                id: 'id11',
                name: 'Measure8',
                status: fillfun(12),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [
                    {
                        id: 'id12',
                        name: 'subMeasure8.1',
                        status: fillfun(13),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                    {
                        id: 'id13',
                        name: 'subMeasure8.2',
                        status: fillfun(14),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                    {
                        id: 'id14',
                        name: 'subMeasure8.3',
                        status: fillfun(15),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                    {
                        id: 'id15',
                        name: 'subMeasure8.4',
                        status: fillfun(16),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                    {
                        id: 'id16',
                        name: 'subMeasure8.5',
                        status: fillfun(17),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                ],
            },
            {
                id: 'id17',
                name: 'Measure9',
                status: fillfun(18),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [
                    {
                        id: 'id18',
                        name: 'subMeasure9.1',
                        status: fillfun(19),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                    {
                        id: 'id19',
                        name: 'subMeasure9.2',
                        status: fillfun(20),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                ],
            },
            {
                id: 'id20',
                name: 'Measure10',
                status: fillfun(21),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [],
            },
            {
                id: 'id21',
                name: 'Measure11',
                status: fillfun(22),
                unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                subMeasures: [
                    {
                        id: 'id22',
                        name: 'subMeasure11.1',
                        status: fillfun(23),
                        unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))],
                    },
                ],
            },
        ]
    }
    function createUrgentList() {
        shared.server.urgent = []
        for (let i = 0; i < shared.server.sensors.length; i++) {
            for (let j = 0; j < shared.server.sensors[i].length; j++) {
                if (Math.random() > 0.85) {
                    shared.server.urgent.push({
                        type: 'sensor',
                        data: shared.server.sensors[i][j],
                    })
                }
            }
        }
        for (let i = 0; i < shared.server.measures.length; i++) {
            let d = shared.server.measures[i]
            if (Math.random() > 0.85) {
                shared.server.urgent.push({
                    type: 'measure',
                    data: d,
                })
            }
            // else if (d.status.current.y < 33.2 || d.status.current.y > 66) {
            //
            //   if ((d.status.current.y + d.status.gradient) < 16.6 || (d.status.current.y + d.status.gradient) > 83.4) {
            //
            //   } else {
            //
            //   }
            // } else if ((d.status.current.y + d.status.gradient) < 33.2 || (d.status.current.y + d.status.gradient) > 66) {
            //
            // }
        }
    }
    // TO REMOVE TO USE REAL DATA

    let SvgPlotDisplay = function() {
        let maing
        let plotbox
        let plot
        let brushbox
        let brush

        function addPlot(opt_in) {
            let plotg = maing.append('g')

            plot = new PlotTimeSeries()
            plot.init({
                main: {
                    g: plotg,
                    box: plotbox,
                    clipping: true,
                },
                interaction: {
                    pinned: {
                        enabled: true,
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
                                h: plotbox.h,
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
                                tickSize: -plotbox.h,
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
                                tickSize: -plotbox.w,
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
                                x: plotbox.w,
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
                                tickSize: -plotbox.w,
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
                content: {
                },
            })
        }
        function addBrush(opt_in) {
            let brushg = maing.append('g')

            brush = new PlotBrushZoom({
                main: {
                    g: brushg,
                    box: brushbox,
                },
                clipping: {
                    enabled: false,
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
                                y: brushbox.h * 0.14,
                                w: brushbox.w,
                                h: brushbox.h * 0.2,
                                marg: 0,
                            },
                            type: 'bottom',
                            attr: {
                                text: {
                                    enabled: true,
                                    size: 14,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                path: {
                                    enabled: true,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, brushbox.w ],
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
                                y: brushbox.h * 0.9,
                                w: brushbox.w,
                                h: brushbox.h * 0.0,
                                marg: 0,
                            },
                            type: 'top',
                            attr: {
                                text: {
                                    enabled: true,
                                    size: 11,
                                    stroke: colorPalette.medium.stroke,
                                    fill: colorPalette.medium.stroke,
                                },
                                path: {
                                    enabled: false,
                                    stroke: colorPalette.medium.background,
                                    fill: colorPalette.medium.background,
                                },
                            },
                        },
                        axis: undefined,
                        scale: undefined,
                        domain: [ 0, 1000 ],
                        range: [ 0, brushbox.w ],
                        brush: {
                            zoom: false,
                            brush: false,
                        },
                    },
                ],
                content: {
                    enabled: true,
                    main: {
                        g: undefined,
                        box: {
                            x: 0,
                            y: brushbox.h * 0.15,
                            w: brushbox.w,
                            h: brushbox.h * 0.65,
                            marg: 0,
                        },
                        attr: {
                            fill: colorPalette.medium.background,
                        },
                    },
                },
                focus: {
                    enabled: true,
                    main: {
                        g: undefined,
                        box: {
                            x: 0,
                            y: brushbox.h * 0.5,
                            w: brushbox.w,
                            h: brushbox.h * 0.3,
                            marg: 0,
                        },
                        attr: {
                            fill: colorPalette.darkest.background,
                            opacity: 1,
                            stroke: colorPalette.darkest.background,
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
                        // plot.updateAxis({
                        //     id: 'bottom',
                        //     domain: brush.getAxis('top').scale.domain(),
                        //     range: [ 0, plotbox.w ],
                        // })
                        // plot.update_data()
                    },
                },
            })
            brush.init()
        }

        function init_data() {
            plotbox = {
                x: svg_dims.w[0] * 0.5 + 20,
                y: svg_dims.h[0] * 0.05 + 20,
                w: svg_dims.w[0] * 0.48 - 40,
                h: svg_dims.h[0] * 0.27 - 40,
            }
            brushbox = {
                x: svg_dims.w[0] * 0.5 + 20,
                y: svg_dims.h[0] * 0.32 - 26,
                w: svg_dims.w[0] * 0.48 - 40,
                h: svg_dims.h[0] * 0.05,
            }

            maing = svg.g.append('g')
            // maing.append('rect')
            //   .attr('x', plotbox.x - 30)
            //   .attr('y', plotbox.y - 22)
            //   .attr('width', plotbox.w + 60)
            //   .attr('height', plotbox.h + 44)
            //   .attr('fill', colorPalette.darker.background)
            // maing.append('rect')
            //   .attr('x', plotbox.x)
            //   .attr('y', plotbox.y)
            //   .attr('width', plotbox.w)
            //   .attr('height', plotbox.h)
            //   .attr('fill', colorPalette.dark.background)

            addPlot()
            addBrush()

            update_data()
        }
        this.init_data = init_data

        function bind_data(data) {
            plot.bind_data(data.id, [ data.status.current ].concat(data.status.previous), 'bottom', 'left')
        }
        this.bind_data = bind_data
        function unbind_data(data) {
            plot.unbind_data(data.id)
        }
        this.unbind_data = unbind_data

        function update_data() {
            let start_time_sec = {
                date: new Date(shared.time_information.history_start_sec),
                time: Number(shared.server.time_information.history_start_sec),
            }
            let end_time_sec = {
                date: new Date(shared.server.time_information.time_now_sec),
                time: Number(shared.server.time_information.time_now_sec),
            }
            // plot.updateAxis({
            //     id: 'bottom',
            //     domain: [ start_time_sec.date, end_time_sec.date ],
            //     range: [ 0, plotbox.w ],
            // })
            // plot.updateAxis({
            //     id: 'left',
            //     domain: [ 0, 100 ],
            //     range: [ plotbox.h, 0 ],
            // })
            // plot.updateAxis({
            //     id: 'right',
            //     domain: [ 0, 100 ],
            //     range: [ plotbox.h, 0 ],
            // })
            //
            // brush.updateAxis({
            //     id: 'top',
            //     domain: [ start_time_sec.date, end_time_sec.date ],
            // })
            // brush.updateAxis({
            //     id: 'middle',
            //     domain: [ start_time_sec.date, end_time_sec.date ],
            // })
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }

    let Svg_time_information = function() {
        let inner_boxes = {
            default: {
                box: {
                    x: 0,
                    y: 0,
                },
                day_month: {
                    x: box.time_information.h,
                    y: 0,
                    w: box.time_information.w - box.time_information.h,
                    h: box.time_information.h / 3,
                },
                hour_minute: {
                    x: box.time_information.h,
                    y: box.time_information.h / 3,
                    w: box.time_information.w - box.time_information.h,
                    h: box.time_information.h / 3 * 2,
                },
                weather_icon: {
                    x: 0,
                    y: 0,
                    w: box.time_information.h,
                    h: box.time_information.h,
                },
            },
            on_site: {
                box: {
                    x: 0,
                    y: 0,
                },
                day_month: {
                    x: 0,
                    y: 0,
                    w: box.time_information.w / 3,
                    h: box.time_information.h / 2,
                },
                hour_minute: {
                    x: box.time_information.w / 3 * 1,
                    y: 0,
                    w: box.time_information.w / 3,
                    h: box.time_information.h / 2,
                },
                weather_icon: {
                    x: box.time_information.w / 3 * 2,
                    y: 0,
                    w: box.time_information.w / 3,
                    h: box.time_information.h / 2,
                },
            },
            local: {
                box: {
                    x: 0,
                    y: box.time_information.h / 2,
                },
                day_month: {
                    x: box.time_information.w / 3 * 2,
                    y: box.time_information.h / 2,
                    w: box.time_information.w / 3,
                    h: box.time_information.h / 2,
                },
                hour_minute: {
                    x: box.time_information.w / 3 * 1,
                    y: box.time_information.h / 2,
                    w: box.time_information.w / 3,
                    h: box.time_information.h / 2,
                },
                weather_icon: {
                    x: 0,
                    y: box.time_information.h / 2,
                    w: box.time_information.w / 3,
                    h: box.time_information.h / 2,
                },
            },
        }

        function init_date(localization) {
            let g = svg.svg.select('#time_information')
                .append('g')
                .attr('id', 'date_' + localization)
                .attr('transform', 'translate('
                + inner_boxes.on_site.box.x
                + ','
                + inner_boxes.on_site.box.y
                + ')')
            g.append('text')
                .attr('id', 'current_day_month')
                .attr('transform', 'translate('
                + (inner_boxes[localization].day_month.x
                + inner_boxes[localization].day_month.w * 0.5)
                + ','
                + (inner_boxes[localization].day_month.y
                + inner_boxes[localization].day_month.h * 0.5)
                + ')')
                .attr('stroke', colorPalette.bright.stroke)
                .attr('stroke-width', 0.0)
                .attr('fill', colorPalette.bright.stroke)
                .attr('x', 0)
                .attr('y', (inner_boxes[localization].hour_minute.h / 3) * 0.5)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('font-size', (inner_boxes[localization].hour_minute.h / 3) + screen_unit)
                .style('pointer-events', 'none')
                .style('user-select', 'none')
            g.append('text')
                .attr('id', 'current_hour_minute')
                .attr('transform', 'translate('
                + (inner_boxes[localization].hour_minute.x
                + inner_boxes[localization].hour_minute.w * 0.5)
                + ','
                + (inner_boxes[localization].hour_minute.y
                + inner_boxes[localization].hour_minute.h * 0.5)
                + ')')
                .attr('stroke', colorPalette.bright.stroke)
                .attr('stroke-width', 0.0)
                .attr('fill', colorPalette.bright.stroke)
                .attr('x', 0)
                .attr('y', (inner_boxes[localization].hour_minute.h / 3 * 2) * 0.5)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('font-size', (inner_boxes[localization].hour_minute.h / 3 * 2) + screen_unit)
                .style('pointer-events', 'none')
                .style('user-select', 'none')
            g.append('rect')
                .attr('x', inner_boxes[localization].weather_icon.x)
                .attr('y', inner_boxes[localization].weather_icon.y)
                .attr('width', inner_boxes[localization].weather_icon.w)
                .attr('height', inner_boxes[localization].weather_icon.h)
                .attr('fill', 'none')
                .attr('stroke-width', 0)
                .attr('stroke', '#000000')
            g.append('svg:image')
                .attr('xlink:href', './frontend_manager/static/icons/moon.svg')
                .attr('x', inner_boxes[localization].weather_icon.x)
                .attr('y', inner_boxes[localization].weather_icon.y)
                .attr('width', inner_boxes[localization].weather_icon.w)
                .attr('height', inner_boxes[localization].weather_icon.h)
                .style('opacity', 0.5)
                .style('pointer-events', 'none')
        }
        function update_date(localization) {
            let currentTime
            = format_to_date_on_site(
                shared.server.time_information.time_now_sec
              * 1000)
            svg.svg.select('#time_information')
                .select('#date_' + localization)
                .select('#current_day_month')
                .text(
                    d3.timeFormat('%m/%d/%Y')(currentTime)
                    // d3.timeFormat('%b %a %d, %Y')(currentTime.date)
                )
            svg.svg.select('#time_information')
                .select('#date_' + localization)
                .select('#current_hour_minute')
                .text(
                    d3.timeFormat('%H:%M:%S')(currentTime)
                )
        }
        function init_data() {
            svg.svg.select('g#time_information').append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', box.time_information.w)
                .attr('height', box.time_information.h)
                .attr('fill', colorPalette.bright.background)
                .attr('stroke', colorPalette.bright.background)
                .attr('stroke-width', 0.3)
                .attr('rx', 0)
            init_date('default')
            update_data()
        }
        this.init_data = init_data

        function update_data() {
            update_date('default')
        }
        this.update_data = update_data

        function debug() {

        }
        this.debug = debug
    }
    let SvgFMSupervision = function() {
        let scrollbox
        let header_height = 60
        let inner_boxes
        // function expand (g) {
        //   // svgHeathMapSensors.changeState('measured', 'expanded')
        //
        //   // svg.g.select('g#measured_data')
        //   //   .transition()
        //   //   .delay(250)
        //   //   .duration(600)
        //   //   .attr('transform', 'translate(' + 0 + ',' + -box.h * 0.35 + ')')
        // }
        // function shrink (g) {
        //   svgHeathMapSensors.changeState('measured', 'default')
        //
        //   // svg.g.select('g#measured_data')
        //   //   .transition()
        //   //   .duration(600)
        //   //   .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
        // }
        function serpervisionCore() {
            function drawHardware(g, d, i) {
                // g.append('rect')
                //     .attr('x', box.urgent_supervision.x - 2)
                //     .attr('y', size.y - 2)
                //     .attr('width', box.urgent_supervision.w + 4)
                //     .attr('height', size.h + 4)
                //     .attr('fill', i % 2 === 1 ? colorPalette.dark.background : colorPalette.medium.background)
                //     .attr('stroke', '#000000')
                //     .attr('stroke-width', 0.2)
                //     .attr('stroke-dasharray', [ box.urgent_supervision.w + 4, box.urgent_supervision.w + 4 + (size.h + 4) * 2 ])
                g.append('rect')
                    .attr('x', size.x)
                    .attr('y', size.y)
                    .attr('width', size.w)
                    .attr('height', size.h)
                    .attr('fill', 'none')
                    .attr('stroke-width', 0)
                    .attr('stroke', '#000000')
                g.append('svg:image')
                    .attr('xlink:href', '/static/icons/gears.svg')
                    .attr('x', size.x)
                    .attr('y', size.y)
                    .attr('width', size.w)
                    .attr('height', size.h)
                    .style('opacity', 0.5)
                    .style('pointer-events', 'none')

                // g.append('text')
                //     .attr('id', 'label')
                //     .text(d.data.name)
                //     .attr('x', size.x + size.w + 6)
                //     .attr('y', size.y + size.h * 0.4)
                //     .style('font-size', '12px')
                // g.append('text')
                //     .attr('id', 'label')
                //     .text(d.data.id)
                //     .attr('x', size.x + size.w + 6)
                //     .attr('y', size.y + size.h * 0.85)
                //     .style('font-size', '12px')
            }
            function draw_time_token(g, d) {
                let name = 'time'
                let inner_g = g.append('g')
                    .attr('id', 'time_token')
                    .attr('transform', 'translate('
                    + (inner_boxes.scroll[name].x)
                    + ','
                    + (inner_boxes.scroll[name].y)
                    + ')')
                inner_g.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', inner_boxes.scroll[name].w)
                    .attr('height', inner_boxes.scroll[name].h)
                    .attr('fill', 'none')
                    .attr('stroke-width', 0.1)
                    .attr('stroke', '#000000')
            }
            function draw_origin_token(g, d) {
                let name = 'origin'
                let inner_g = g.append('g')
                    .attr('id', 'time_token')
                    .attr('transform', 'translate('
                    + (inner_boxes.scroll[name].x)
                    + ','
                    + (inner_boxes.scroll[name].y)
                    + ')')
                inner_g.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', inner_boxes.scroll[name].w)
                    .attr('height', inner_boxes.scroll[name].h)
                    .attr('fill', 'none')
                    .attr('stroke-width', 0.1)
                    .attr('stroke', '#000000')
            }
            function draw_type_token(g, d, i) {
                let name = 'type'
                let inner_g = g.append('g')
                    .attr('id', 'time_token')
                    .attr('transform', 'translate('
                    + (inner_boxes.scroll[name].x)
                    + ','
                    + (inner_boxes.scroll[name].y)
                    + ')')
                inner_g.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', inner_boxes.scroll[name].w)
                    .attr('height', inner_boxes.scroll[name].h)
                    .attr('fill', 'none')
                    .attr('stroke-width', 0.1)
                    .attr('stroke', '#000000')
            }
            function draw_text_token(g, d) {
                return
                let inner_g = g.append('g')
                    .attr('id', 'time_token')
                    .attr('transform', 'translate('
                    + (inner_boxes.header[name].x + inner_boxes.header[name].w / 2)
                    + ','
                    + (inner_boxes.header[name].y + inner_boxes.header[name].h / 2)
                    + ')')
            }

            let g = scrollbox.get_content()

            let current = g
                .selectAll('g.urgent_token')
                .data(shared.server.urgent)
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'urgent_token')

            enter.each(function(d, i) {
                let g = d3.select(this)
                draw_time_token(g, d)
                draw_origin_token(g, d)
                draw_type_token(g, d)
                draw_text_token(g, d)
                g.append('text')
                    .text(i)
            })
            let merge = current.merge(enter)

            merge.each(function(d, i) {
                let g = d3.select(this)
                g.attr('transform', 'translate(' + 0 + ',' + (i * (inner_boxes.scroll.time.h + 4)) + ')')
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()

            scrollbox.updated_content()
            // scrollbox.update_scroll_dim({
            //     height: (inner_boxes.scroll.time.h + 4) * shared.server.urgent.length,
            // })
        }

        function init_inner_boxes() {
            inner_boxes = {
                header: {
                    box: {
                        x: 0,
                        y: 0,
                        w: box.urgent.w,
                        h: header_height,
                    },
                    title: {
                        x: 0,
                        y: 0,
                        w: box.urgent.w,
                        h: header_height * 0.5,
                    },
                    time: {
                        x: 0,
                        y: header_height * 0.5,
                        w: box.urgent.w / 3,
                        h: header_height * 0.5,
                    },
                    origin: {
                        x: box.urgent.w / 3,
                        y: header_height * 0.5,
                        w: box.urgent.w / 3,
                        h: header_height * 0.5,
                    },
                    type: {
                        x: box.urgent.w / 3 * 2,
                        y: header_height * 0.5,
                        w: box.urgent.w / 3,
                        h: header_height * 0.5,
                    },
                },
                scroll: {
                    box: {
                        x: 0,
                        y: header_height,
                        w: box.urgent.w,
                        h: box.urgent.h - header_height,
                    },
                    time: {
                        x: 0,
                        y: 0,
                        w: box.urgent.w / 3,
                        h: header_height,
                    },
                    origin: {
                        x: box.urgent.w / 3,
                        y: 0,
                        w: box.urgent.w / 3,
                        h: header_height,
                    },
                    type: {
                        x: box.urgent.w / 3 * 2,
                        y: 0,
                        w: box.urgent.w / 3,
                        h: header_height,
                    },
                },
            }
        }
        function init_header() {
            function create_header_category(g, name, fun) {
                let inner_g = g
                    .append('g')
                    .attr('id', name)
                    .attr('transform', 'translate('
                    + (inner_boxes.header[name].x + inner_boxes.header[name].w / 2)
                    + ','
                    + (inner_boxes.header[name].y + inner_boxes.header[name].h / 2)
                    + ')')
                let background_title = inner_g.append('rect')
                    .attr('fill', colorPalette.darkest.background)
                    .on('click', fun)
                let title = inner_g.append('text')
                    .text(first_letter_upper(name))
                    .attr('id', name)
                    .attr('class', 'body_subsubtitle')
                    .attr('dy', '.33em')
                let title_box = get_d3_node_box(title)
                background_title
                    .attr('x', title_box.x)
                    .attr('y', title_box.y)
                    .attr('width', title_box.width)
                    .attr('height', title_box.height)
            }

            let g = svg.svg.select('#urgent')
                .append('g')
                .attr('id', 'urgent_supervision_header')
                .attr('transform', 'translate('
              + inner_boxes.header.box.x
              + ','
              + inner_boxes.header.box.y
              + ')')

            let g_title = g
                .append('g')
                .attr('id', 'title')
                .attr('transform', 'translate('
                + (inner_boxes.header.title.x + inner_boxes.header.title.w / 2)
                + ','
                + (inner_boxes.header.title.y + inner_boxes.header.title.h / 2)
                + ')')
            let background_title = g_title.append('rect')
                .attr('fill', colorPalette.darkest.background)
            let title = g_title.append('text')
                .attr('id', 'title')
                .attr('class', 'body_title')
                .attr('dy', '.33em')
                .text('Urgent')
            let title_box = get_d3_node_box(title)
            background_title
                .attr('x', title_box.x)
                .attr('y', title_box.y)
                .attr('width', title_box.width)
                .attr('height', title_box.height)

            create_header_category(g, 'time', () => {
                console.log('test')
            })
            create_header_category(g, 'origin', () => {
                console.log('test')
            })
            create_header_category(g, 'type', () => {
                console.log('test')
            })
        }
        function init_scrollbox() {
            let scrollbox_g = svg.svg.select('#urgent')
                .append('g')
                .attr('id', 'urgent_supervision_scrollbox')
                // .attr('transform', 'translate('
                // + inner_boxes.scroll.box.x
                // + ','
                // + inner_boxes.scroll.box.y
                // + ')')
            scrollbox = new ScrollBox()
            scrollbox.init({
                main: {
                    tag: 'urgent_supervision_scrollbox',
                    g: scrollbox_g,
                    box: inner_boxes.scroll.box,
                },
            })
            scrollbox.get_background().append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', inner_boxes.scroll.box.w)
                .attr('height', inner_boxes.scroll.box.h)
                .attr('fill', 'transparent')
                .attr('stroke', '#000000')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', [
                    inner_boxes.scroll.box.w,
                    inner_boxes.scroll.box.h,
                    inner_boxes.scroll.box.w,
                    inner_boxes.scroll.box.h,
                ])
            serpervisionCore()

            // let pan_zoom_g = svg.svg.select('#urgent')
            //     .append('g')
            //     .attr('id', 'urgent_supervision_pan_zoom')
            //     // .attr('transform', 'translate('
            //     // + inner_boxes.scroll.box.x
            //     // + ','
            //     // + inner_boxes.scroll.box.y
            //     // + ')')
            // let pan_zoom = new PanZoomBox()
            // pan_zoom.init({
            //     main: {
            //         tag: 'pan_zoom_test',
            //         g: pan_zoom_g,
            //         box: inner_boxes.scroll.box,
            //     },
            // })
            // pan_zoom.get_background().append('rect')
            //     .attr('x', 0)
            //     .attr('y', 0)
            //     .attr('width', inner_boxes.scroll.box.w)
            //     .attr('height', inner_boxes.scroll.box.h)
            //     .attr('fill', 'transparent')
            //     .attr('stroke', '#000000')
            //     .attr('stroke-width', 1)
            //     .attr('stroke-dasharray', [
            //         inner_boxes.scroll.box.w,
            //         inner_boxes.scroll.box.h,
            //         inner_boxes.scroll.box.w,
            //         inner_boxes.scroll.box.h,
            //     ])
            //
            // pan_zoom.get_content().append('rect')
            //     .attr('x', 0)
            //     .attr('y', 0)
            //     .attr('width', 10)
            //     .attr('height', 10)
            // pan_zoom.get_content().append('rect')
            //     .attr('x', 1000)
            //     .attr('y', 1000)
            //     .attr('width', 10)
            //     .attr('height', 10)
            // pan_zoom.update_content_dim()
            // pan_zoom.use_content_shortcut('end')
            // console.log(pan_zoom.get_content())
            // console.log(pan_zoom.get_focus())
        }
        function init_data() {
            box.urgent.h /= 2
            init_inner_boxes()
            init_header()
            init_scrollbox()
            // main.append('rect')
            //   .attr('x', box.x + box.w * 0.9)
            //   .attr('y', (box.y - 14) + 'px')
            //   .attr('width', '16px')
            //   .attr('height', '16px')
            //   .attr('fill', 'transparent')
            //   .attr('stroke-width', 0)
            //   .style('boxShadow', '10px 20px 30px black')
            //   .on('click', function () {
            //     if (expanded) {
            //       expanded = false
            //       shrink(gmes)
            //     } else {
            //       expanded = true
            //       expand(gmes)
            //     }
            //   })
            //   .on('mouseover', function (d) {
            //     d3.select(this).style('cursor', 'pointer')
            //     d3.select(this).attr('fill', colorPalette.darker.background)
            //   })
            //   .on('mouseout', function (d) {
            //     d3.select(this).style('cursor', 'default')
            //     d3.select(this).attr('fill', 'transparent')
            //   })
            // main.append('svg:image')
            //   .attr('xlink:href', '/static/icons/full-size.svg')
            //   .attr('x', box.x + box.w * 0.9)
            //   .attr('y', (box.y - 14) + 'px')
            //   .attr('width', '16px')
            //   .attr('height', '16px')
            //   .style('pointer-events', 'none')
        }
        this.init_data = init_data

        function update_data() {
            serpervisionCore()
        }
        this.update_data = update_data
    }

    let SvgFMTimeline = function() {
        let stock = {
        }

        function changeBlockTime(a, b) {
            loadMesures()
            svg_main_measures_tracking.update_data()
            svg_measures_plots.update_data()
        }
        function createInput(type, g, innerbox) {
            stock[type + 'minus_button'] = new button_d3()
            stock[type + 'minus_button'].init({
                main: {
                    id: type + 'minus_button',
                    g: g,
                    box: {
                        x: innerbox.x - 3,
                        y: innerbox.y + 12,
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
                            'font-size': '9' + screen_unit,
                            fill: colorPalette.medium.text,
                            anchor: 'middle',
                            'pointer-events': 'none',
                            'user-select': 'none',
                        },
                        attr: {
                            x: innerbox.x - 3 + 3,
                            y: innerbox.y + 12 + 7,
                        },
                    },
                    hovered: {
                        style: {
                            font: 'bold',
                            'font-size': '14' + screen_unit,
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
                        changeBlockTime(stock.hour.property('value'), stock.minute.property('value'))
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
                        y: innerbox.y + 12,
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
                            'font-size': '9' + screen_unit,
                            fill: colorPalette.medium.text,
                            anchor: 'middle',
                            'pointer-events': 'none',
                            'user-select': 'none',
                        },
                        attr: {
                            x: innerbox.x + 6 + 2,
                            y: innerbox.y + 12 + 7,
                        },
                    },
                    hovered: {
                        style: {
                            font: 'bold',
                            'font-size': '14' + screen_unit,
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
                        changeBlockTime(stock.hour.property('value'), stock.minute.property('value'))
                    },
                },
            })
        }
        function init_data() {

            let main = svg.svg.select('#overview').append('g').attr('id', 'fmdate')
                .attr('transform', 'translate('
                + box.overview_time_options.x
                + ','
                + box.overview_time_options.y
                + ')')
                .style('pointer-events', 'auto')

            main.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', box.overview_time_options.w)
                .attr('height', '22' + screen_unit)
                .attr('fill', colorPalette.darkest.background)
            main.append('text')
                .text('Timeline range')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '15' + screen_unit)
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (4) + ',' + (16) + ')')
            main.append('rect')
                .attr('x', 0)
                .attr('y', '22' + screen_unit)
                .attr('width', box.overview_time_options.w)
                .attr('height', box.overview_time_options.h * 0.38)
                .attr('fill', colorPalette.dark.background)
                .attr('rx', 2)
            // main.append('rect')
            //     .attr('x', 0)
            //     .attr('y', box.overview_time_options.h * 0.68)
            //     .attr('width', box.overview_time_options.w * 0.96)
            //     .attr('height', box.overview_time_options.h * 0.32)
            //     .attr('fill', colorPalette.dark.background)
            //     .attr('rx', 2)

            let gDateSelector = main.append('g').attr('transform', 'translate(' + (box.overview_time_options.w * 0.0) + ',' + (box.overview_time_options.h * 0.28) + '), scale(1.5,1.5)')
            gDateSelector.append('text')
                .text('Last:')
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', '9' + screen_unit)
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (15) + ',' + (box.overview_time_options.h * 0.12) + ')')

            let font_size = 11
            let time = new Date(1000 * (3600 * (parseInt(2)) + 60 * parseInt(0)))
            let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
            let hbox = {
                x: box.overview_time_options.w * 0.3,
                y: 0,
                w: 14,
                h: 18,
            }
            let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
            let mbox = {
                x: box.overview_time_options.w * 0.45,
                y: 0,
                w: 14,
                h: 18,
            }

            stock.hourOpts = {
                disabled: false,
                value: hour,
                min: 0,
                max: 23,
                step: 1,
            }
            stock.hour = input_date_d3(gDateSelector,
                hbox,
                'hour',
                stock.hourOpts,
                {
                    change: (d) => {
                        changeBlockTime(d, stock.minute.property('value'))
                    },
                    enter: (d) => {
                        stock.minute.node().focus()
                    },
                })
            createInput('hour', gDateSelector, hbox)
            gDateSelector.append('text')
                .text(':')
                .style('fill', colorPalette.dark.stroke)
                .style('font-size', font_size + screen_unit)
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (hbox.x + hbox.w + 0.5 + 5) + ',' + (hbox.h * 0.5) + ')')
            stock.minuteOpts = {
                disabled: false,
                value: min,
                min: 0,
                max: 59,
                step: 1,
            }
            stock.minute = input_date_d3(gDateSelector,
                mbox,
                'minute',
                stock.minuteOpts,
                {
                    change: (d) => {
                        changeBlockTime(stock.hour.property('value'), d)
                    },
                    enter: (d) => {
                        stock.second.node().focus()
                    },
                })
            createInput('minute', gDateSelector, mbox)

            // let gFromToSelector = main.append('g').attr('transform', 'translate(' + (box.overview_time_options.w * 0.03) + ',' + (box.overview_time_options.h * 0.7) + ')')
            //     .style('opacity', 0.2)
            // gFromToSelector.append('text')
            //     .text('From:')
            //     .style('fill', '#000000')
            //     .style('font-weight', '')
            //     .style('font-size', '13.5' + screen_unit)
            //     .attr('text-anchor', 'start')
            //     .attr('transform', 'translate(' + (15) + ',' + (box.overview_time_options.h * 0.12) + ')')
            // gFromToSelector.append('text')
            //     .text('To:')
            //     .style('fill', '#000000')
            //     .style('font-weight', '')
            //     .style('font-size', '13.5' + screen_unit)
            //     .attr('text-anchor', 'start')
            //     .attr('transform', 'translate(' + (15) + ',' + (box.overview_time_options.h * 0.34) + ')')

            update_data()
        }
        this.init_data = init_data

        function update_data() {

        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let Svg_main_measures_tracking = function() {

        function selectMeasure(id) {
            // let g = scrollbox.overview_measures.get('inner_g').select('g#' + id)
            // g.select('rect#background').attr('fill', colorPalette.darkest.background)
            // g.data()[0].selected = true
        }
        this.selectMeasure = selectMeasure
        function unselectMeasure(id) {
            // let g = scrollbox.overview_measures.get('inner_g').select('g#' + id)
            // g.select('rect#background').attr('fill', 'transparent')
            // delete g.data()[0]['selected']
        }
        this.unselectMeasure = unselectMeasure
        function measuredCore() {
            let line_dim = {
                w: box.overview_measures.w,
                h: 35,
                marg: 4,
            }
            let inner_box = {
                warning: {
                    x: box.overview_horizontal_dispatch.warning.x,
                    y: 0,
                    w: box.overview_horizontal_dispatch.warning.w,
                    h: line_dim.h,
                },
                path: {
                    x: box.overview_horizontal_dispatch.old_values.x,
                    y: 0,
                    w: box.overview_horizontal_dispatch.old_values.w,
                    h: line_dim.h * 0.8,
                },
                text: {
                    x: box.overview_horizontal_dispatch.current_values.x,
                    y: 0,
                    w: box.overview_horizontal_dispatch.current_values.w,
                    h: line_dim.h,
                },
            }
            let current = svg.svg.select('#measured_data')
                .selectAll('g.measures')
                .data(shared.server.measures, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'measures')

            enter.each(function(d) {
                let g = d3.select(this)
                g.append('rect')
                    .attr('id', 'background')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', line_dim.w)
                    .attr('height', line_dim.h)
                    .attr('fill', 'transparent')

                let text_g = g.append('g').attr('id', 'text_g')
                    .attr('transform',
                        'translate('
                    + inner_box.text.x
                    + ','
                    + inner_box.text.y
                    + ')')
                let path_g = g.append('g').attr('id', 'path_g')
                    .attr('transform',
                        'translate('
                    + inner_box.path.x
                    + ','
                    + inner_box.path.y
                    + ')')
                    .style('opacity', 0.7)
                let warning_g = g.append('g').attr('id', 'warning_g')
                    .attr('transform',
                        'translate('
                        + inner_box.warning.x
                        + ','
                        + inner_box.warning.y
                        + ')')
                    .attr('display', 'none')
                    .style('opacity', 1)

                let min = d.status.current.y
                let max = d.status.current.y
                for (let j = 0; j < d.status.previous.length; j++) {
                    if (d.status.previous[j].y < min) {
                        min = d.status.previous[j].y
                    }
                    if (d.status.previous[j].y > max) {
                        max = d.status.previous[j].y
                    }
                }

                g.attr('id', d.id)
                    .on('mouseenter', () => {
                        d3.select(this).style('cursor', 'pointer')
                        if (g.data()[0].selected) {
                            return
                        }
                        g.select('#background').attr('fill', colorPalette.darker.background)
                    })
                    .on('mouseleave', () => {
                        d3.select(this).style('cursor', 'default')
                        if (g.data()[0].selected) {
                            return
                        }
                        g.select('#background').attr('fill', 'transparent')
                    })
                    .on('click', () => {
                        addDataToPlot(d)
                    })

                path_g.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', inner_box.path.w)
                    .attr('height', inner_box.path.h)
                    .attr('fill', 'none')
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 0.1)
                path_g.append('defs')
                    .append('clipPath')
                    .attr('id', 'rect-clip' + d.id)
                    .append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', inner_box.path.w)
                    .attr('height', inner_box.path.h)
                    .style('fill-opacity', 0)

                path_g.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', inner_box.path.w * 0.1)
                    .attr('height', inner_box.path.h)
                    .attr('fill', colorPalette.blocks.fail.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                    .style('opacity', 0.2)
                    .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                path_g.append('rect')
                    .attr('x', 0 + inner_box.path.w * 0.1)
                    .attr('y', 0)
                    .attr('width', inner_box.path.w * 0.1)
                    .attr('height', inner_box.path.h)
                    .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                    .style('opacity', 0.2)
                    .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                // path_g.append('rect')
                //     .attr('x', 0 + inner_box.path.w * 0.2)
                //     .attr('y', 0)
                //     .attr('width', inner_box.path.w * 0.6)
                //     .attr('height', inner_box.path.h)
                //     .attr('fill', colorPalette.blocks.done.background) // colorPalette.dark.background)
                //     .attr('stroke', 'none')
                //     .attr('rx', 0)
                //     .style('opacity', 0.4)
                //     .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                path_g.append('rect')
                    .attr('x', 0 + inner_box.path.w * 0.8)
                    .attr('y', 0)
                    .attr('width', inner_box.path.w * 0.1)
                    .attr('height', inner_box.path.h)
                    .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                    .style('opacity', 0.2)
                    .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                path_g.append('rect')
                    .attr('x', 0 + inner_box.path.w * 0.9)
                    .attr('y', 0)
                    .attr('width', inner_box.path.w * 0.1)
                    .attr('height', inner_box.path.h)
                    .attr('fill', colorPalette.blocks.fail.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                    .style('opacity', 0.2)
                    .attr('clip-path', 'url(#rect-clip' + d.id + ')')

                let valueline = d3.line()
                    .curve(d3.curveBundle)
                    .x(function(d, j) {
                        return 0 + (inner_box.path.w / 100 * d.y)
                    })
                    .y(function(dd, j) {
                        return 0 + inner_box.path.h - (inner_box.path.h / d.status.previous.length) * j
                    })
                path_g.append('path')
                    .attr('d', valueline(d.status.previous))
                    .attr('fill', 'none')
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 1.5)
                path_g.append('polygon')
                    .attr('r', 3)
                    .attr('fill', '#000000')
                    .attr('stroke', 'none')
                    .attr('rx', 0)

                text_g.append('text')
                    .attr('id', 'measurelabel')
                    .text(d.name)
                    .attr('x', inner_box.text.w * 0)
                    .attr('y', inner_box.text.h * 0.3)
                    .style('font-size', '16' + screen_unit)
                    .style('user-select', 'none')
                    .style('text-anchor', 'start')
                text_g.append('text')
                    .attr('id', 'valuelabel')
                    .text(d.status.current.y)
                    .attr('x', inner_box.text.w * 0.0)
                    .attr('y', inner_box.text.h * 0.8)
                    .style('font-size', '20' + screen_unit)
                    .style('font-weight', 'bold')
                    .style('user-select', 'none')
                    .style('text-anchor', 'start')
                text_g.append('text')
                    .attr('id', 'unitlabel')
                    .text('(' + d.unit + ')')
                    .attr('x', inner_box.text.w * 1)
                    .attr('y', inner_box.text.h * 0.3)
                    .style('font-size', '12' + screen_unit)
                    .style('font-weight', '')
                    .style('user-select', 'none')
                    .style('text-anchor', 'end')

                text_g.append('text')
                    .attr('id', 'gradient')
                    .text(d.status.gradient)
                    .attr('x', inner_box.text.w * 1)
                    .attr('y', inner_box.text.h * 0.8)
                    .style('font-size', '16' + screen_unit)
                    .style('text-anchor', 'end')
                    .style('font-weight', '')
                    .style('user-select', 'none')

                // warning_g.append('rect')
                //     .attr('id', 'background')
                //     .attr('x', inner_box.warning.x + inner_box.warning.w * 0.5 - 11)
                //     .attr('y', inner_box.warning.y + inner_box.warning.h * 0.5 - 11)
                //     .attr('width', 22)
                //     .attr('height', 22)
                //     .attr('stroke', '#000000')
                //     .attr('stroke-width', 1)
                warning_g.append('rect')
                    .attr('id', 'pattern')
                    .attr('x', inner_box.warning.x + inner_box.warning.w * 0.5 - 11)
                    .attr('y', inner_box.warning.y + inner_box.warning.h * 0.5 - 11)
                    .attr('width', 22)
                    .attr('height', 22)
                    // .attr('x', inner_box.warning.x + inner_box.warning.w * 0.5 - 7)
                    // .attr('y', inner_box.warning.y + inner_box.warning.h * 0.5 - 7)
                    // .attr('width', 14)
                    // .attr('height', 14)
                warning_g.append('text')
                    .text('!')
                    .attr('x', inner_box.warning.x + inner_box.warning.w * 0.5)
                    .attr('y', inner_box.warning.y + inner_box.warning.h * 0.5 + 7)
                    .style('font-size', '18' + screen_unit)
                    .style('text-anchor', 'middle')
                    .style('font-weight', 'bold')
                    .style('user-select', 'none')
            })
            let merge = current.merge(enter)

            merge.each(function(d, i) {
                // let min = Math.min(...d.status.previous.map((a) => a.y), d.status.current.y)
                // let max = Math.max(...d.status.previous.map((a) => a.y), d.status.current.y)

                let g = d3.select(this)
                g.on('click', () => {
                    addDataToPlot(d)
                })
                g.select('clipPath#rect-clip' + d.id + ' rect')
                    .transition()
                    .duration(400)
                    .attr('x', 0)
                    .attr('width', inner_box.path.w)

                let valueline = d3.line()
                    .curve(d3.curveBundle)
                    .x(function(d, j) {
                        return 0 + (inner_box.path.w / 100 * d.y)
                    })
                    .y(function(dd, j) {
                        return 0 + inner_box.path.h - (inner_box.path.h / d.status.previous.length) * j
                    })
                g.select('path')
                    .transition()
                    .duration(400)
                    .attr('d', valueline(d.status.previous))
                g.select('polygon')
                    .transition()
                    .duration(400)
                    .attr('points', (0 + (inner_box.path.w / 100 * d.status.current.y)) + ',' + (inner_box.path.h) + ' '
                      + (-6 + inner_box.path.w / 100 * d.status.current.y) + ',' + (inner_box.path.h + 8) + ' '
                      + (6 + (inner_box.path.w / 100 * d.status.current.y)) + ',' + (inner_box.path.h + 8))
                g.select('text#valuelabel')
                    .text(d.status.current.y)
                g.select('text#gradient')
                    .text(d.status.gradient)

                if (d.status.current.y < 16.6 || d.status.current.y > 83.4) {
                    g.select('g#warning_g').attr('display', 'auto')
                    g.select('g#warning_g rect#background').attr('fill', colorPalette.blocks.fail.background)
                    g.select('g#warning_g rect#pattern').attr('fill', colorPalette.blocks.fail.background)
                }
                else if (d.status.current.y < 33.2 || d.status.current.y > 66) {
                    g.select('g#warning_g').attr('display', 'auto')
                    g.select('g#warning_g rect#background').attr('fill', colorPalette.blocks.warning.background)
                    if ((d.status.current.y + d.status.gradient) < 16.6 || (d.status.current.y + d.status.gradient) > 83.4) {
                        g.select('g#warning_g rect#pattern').attr('fill', colorPalette.blocks.fail.background)
                    }
                    else {
                        g.select('g#warning_g rect#pattern').attr('fill', colorPalette.blocks.warning.background)
                    }
                }
                else if ((d.status.current.y + d.status.gradient) < 33.2 || (d.status.current.y + d.status.gradient) > 66) {
                    g.select('g#warning_g').attr('display', 'auto')
                    g.select('g#warning_g rect#background').attr('fill', colorPalette.blocks.done.background)
                    g.select('g#warning_g rect#pattern').attr('fill', colorPalette.blocks.warning.background)
                }
                else {
                    g.select('g#warning_g').attr('display', 'none')
                }
                g.attr('transform', 'translate(' + 0 + ',' + ((line_dim.h + line_dim.marg) * i) + ')')
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        function init_data() {
            let main = svg.svg.select('#overview').append('g').attr('id', 'measured_data')
                .attr('transform', 'translate('
                + box.overview_measures.x
                + ','
                + box.overview_measures.y
                + ')')

            main.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', box.overview_measures.w)
                .attr('height', '24' + screen_unit)
                .attr('fill', colorPalette.dark.background)
            main.append('text')
                .text('Measures')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '18' + screen_unit)
                .style('user-select', 'none')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(2 , 0)')
            // let startY = svg_dims.h[0] * 0.4
            // let endY = svg_dims.h[0] * 0.6
            // svg.g.append('rect')
            //   .attr('x', svg_dims.w[0] * 0.0)
            //   .attr('y', startY)
            //   .attr('width', svg_dims.w[0] * 0.015)
            //   .attr('height', endY)
            //   .attr('fill', '#0288D1')
            //   .attr('stroke', 'none')
            //   .attr('rx', 0)
            // svg.g.append('rect')
            //   .attr('x', svg_dims.w[0] * 0.015)
            //   .attr('y', startY)
            //   .attr('width', svg_dims.w[0] * 0.015)
            //   .attr('height', endY)
            //   .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
            //   .attr('stroke', 'none')
            //   .attr('rx', 0)
            // svg.g.append('rect')
            //   .attr('x', svg_dims.w[0] * 0.03)
            //   .attr('y', startY)
            //   .attr('width', svg_dims.w[0] * 0.03)
            //   .attr('height', endY)
            //   .attr('fill', colorPalette.blocks.done.background) // colorPalette.dark.background)
            //   .attr('stroke', 'none')
            //   .attr('rx', 0)
            // svg.g.append('rect')
            //   .attr('x', svg_dims.w[0] * 0.06)
            //   .attr('y', startY)
            //   .attr('width', svg_dims.w[0] * 0.015)
            //   .attr('height', endY)
            //   .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
            //   .attr('stroke', 'none')
            //   .attr('rx', 0)
            // svg.g.append('rect')
            //   .attr('x', svg_dims.w[0] * 0.075)
            //   .attr('y', startY)
            //   .attr('width', svg_dims.w[0] * 0.015)
            //   .attr('height', endY)
            //   .attr('fill', '#0288D1')
            //   .attr('stroke', 'none')
            //   .attr('rx', 0)

            measuredCore()
        }
        this.init_data = init_data

        function update_data() {
            measuredCore()
        }
        this.update_data = update_data
    }
    let SvgHeathMapSensors = function() {
        let step = 20
        let marg = 6
        let line_height = 4

        function SensorCore(sensors, g) {
            let current = g
                .selectAll('g.sensor')
                .data(sensors, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'sensor')

            enter.each(function(d) {
                let weather_station_box_height = line_height * d.length
                let g = d3.select(this)

                let translate_y = {
                    warning: 0,
                    old_values: 0,
                    current_values: 0,
                }
                if (weather_station_box_height
                  < box.overview_horizontal_dispatch.old_values.w) {
                    translate_y.warning
                    = box.overview_horizontal_dispatch.old_values.w
                    * 0.5
                    translate_y.old_values
                    = (box.overview_horizontal_dispatch.old_values.w
                      - weather_station_box_height)
                      * 0.5
                }
                else if (weather_station_box_height
                  > box.overview_horizontal_dispatch.old_values.w) {
                    translate_y.warning
                    = weather_station_box_height
                    * 0.5
                    translate_y.current_values
                    = (weather_station_box_height
                    - box.overview_horizontal_dispatch.old_values.w)
                    * 0.5
                }

                let warning_g = g.append('g').attr('id', 'warning_g')
                    .attr('transform', 'translate('
                    + box.overview_horizontal_dispatch.warning.x
                    + ','
                    + translate_y.warning
                    + ')')
                    .attr('display', 'none')
                    .style('opacity', 1)
                let old_values_g = g.append('g').attr('id', 'old_values_g')
                    .attr('transform', 'translate('
                    + box.overview_horizontal_dispatch.old_values.x
                    + ','
                    + translate_y.old_values
                    + ')')
                let current_values_g = g.append('g').attr('id', 'current_values_g')
                    .attr('transform', 'translate('
                    + box.overview_horizontal_dispatch.current_values.x
                    + ','
                    + translate_y.current_values
                    + ')')

                for (let j = 0; j < d.length; j++) {
                    let ig = old_values_g.append('g').attr('class', 'sensorline')
                    let tg = ig.append('g').attr('id', 'timestampsline')
                    for (let i = 0; i < d[j].status.previous.length; i++) {
                        tg.append('rect')
                            .attr('id', 'timestamp')
                            .attr('x',
                                i
                                * (box.overview_horizontal_dispatch.current_values.w)
                                / d[j].status.previous.length
                            )
                            .attr('y', j * line_height)
                            .attr('width',
                                (box.overview_horizontal_dispatch.current_values.w)
                                / d[j].status.previous.length
                            )
                            .attr('height', line_height)
                            .attr('fill', () => {
                                if (d[j].status.previous[i] === 'RUNNING') {
                                    return d3.color(colorPalette.blocks.done.background)
                                }
                                else if (d[j].status.previous[i] === 'ERROR') {
                                    return d3.color(colorPalette.blocks.fail.background)
                                }
                                else if (d[j].status.previous[i] === 'OFF') {
                                    return d3.color('#333333')
                                }

                                return 1
                            })
                            .attr('stroke', '#000000')
                            .attr('stroke-width', 0.1)
                    }
                }

                let arr_zoomer_ele_opts_weather1 = {
                    do_ele: {
                        main: true,
                        // ches: true,
                        // mini: true,
                        tree: false,
                        // lens: !true,
                        // more: false,
                    },
                    trans: {
                        // main: 'translate(85,85)scale(3)',
                        main: 'translate('
                  + (0)
                  + ','
                  + (0)
                  + ')scale(1)',
                        // ches: 'translate(110,0)scale(8)',
                        tree: 'translate('
                  + (0)
                  + ','
                  + (0)
                  + ')scale(1)',
                        // mini: 'translate(5,0)scale(1)',
                        // lens: 'translate(10,5)scale(0.18)',
                    },
                    inst_filter: {
                        // inst_ids: [ 'Lx01', 'Mx04', 'Mx10' ],
                        // inst_types: [ 'AUX', 'PROC' ],
                    },
                    main: {
                        // dblclick_zoom_in_out: false,
                    },
                    ches: {
                        // myOpt: 0,
                    },
                    mini: {
                        // static_zoom: false,
                    },
                    tree: {
                        // aspect_ratio: 6/5,
                    },
                    lens: {
                        // aspect_ratio: 4,
                        // has_titles: true,
                        // pointerEvents: true,
                    },
                    more: {
                        aspect_ratio: 0.5,
                        // has_title: false,
                    },
                    base_ele_width: box.overview_horizontal_dispatch.old_values.w,
                }
                init_arr_zoomer(current_values_g, arr_zoomer_ele_opts_weather1, 'Ax00')

                warning_g.append('rect')
                    .attr('id', 'background')
                    .attr('x', box.overview_horizontal_dispatch.warning.w * 0.5 - 11)
                    .attr('y', -11)
                    .attr('width', 22)
                    .attr('height', 22)
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 1)
                    .attr('fill', colorPalette.blocks.fail.background)
                warning_g.append('text')
                    .text('!')
                    .attr('x', box.overview_horizontal_dispatch.warning.w * 0.5)
                    .attr('y', 9)
                    .style('font-size', '18' + screen_unit)
                    .style('text-anchor', 'middle')
                    .style('font-weight', 'bold')
                    .style('user-select', 'none')
            })
            let merge = current.merge(enter)

            let offset = 0
            merge.each(function(d) {
                let g = d3.select(this)
                let error = false
                g.selectAll('g.sensorline').each(function(d, j) {
                    if (d[j].status.current === 'ERROR') {
                        error = true
                    }
                })

                if (error) {
                    g.select('#warning_g')
                        .attr('display', 'auto')
                }
                else {
                    g.select('#warning_g').attr('display', 'none')
                }

                g.attr('transform', 'translate(' + 0 + ',' + (offset) + ')')

                let weather_station_box_height = line_height * d.length
                offset
                += marg
                + d.length
                * (weather_station_box_height
                  < box.overview_horizontal_dispatch.old_values.w)
                        ? box.overview_horizontal_dispatch.old_values.w
                        : weather_station_box_height
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        }
        function init_data() {

            let fillfun = function() {
                let status = {
                    current: '',
                    previous: [],
                }
                let rand = Math.random()
                if (rand < 0.75) {
                    status.current = 'RUNNING'
                }
                else if (rand < 0.9) {
                    status.current = 'ERROR'
                }
                else if (rand <= 1) {
                    status.current = 'OFF'
                }
                for (let i = 0; i < step; i++) {
                    let rand = Math.random()
                    if (rand < 0.92) {
                        status.previous.push('RUNNING')
                    }
                    else if (rand < 0.96) {
                        status.previous.push('ERROR')
                    }
                    else if (rand <= 1) {
                        status.previous.push('OFF')
                    }
                }
                return status
            }

            let weather_stations = [ 'Ax00', 'Ax01', 'Ax00', 'Ax01', 'Ax00', 'Ax01' ]
            shared.server.sensors = []
            let array = [
                {
                    id: 'id0',
                    name: 'Illuminator',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id1',
                    name: 'Photometer',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id2',
                    name: 'All-sky-camera',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id3',
                    name: 'Ceilometer',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id4',
                    name: 'Ceilometer',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id5',
                    name: 'FRAM',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id6',
                    name: 'LIDARs',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id7',
                    name: 'LIDARs',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id8',
                    name: 'Weather-stations',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id9',
                    name: 'Weather-stations',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id10',
                    name: 'Weather-stations',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id11',
                    name: 'Anemometers',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id12',
                    name: 'Anemometers',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id13',
                    name: 'Anemometers',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id14',
                    name: 'Anemometers',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id15',
                    name: 'Anemometers',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id16',
                    name: 'Anemometers',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id17',
                    name: 'Precipitation',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id18',
                    name: 'Precipitation',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id19',
                    name: 'Precipitation',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id20',
                    name: 'Dust',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id21',
                    name: 'Accelerometers',
                    status: fillfun(),
                    running: Math.random() < 0.5,
                },
                {
                    id: 'id22',
                    name: 'Accelerometers',
                    status: fillfun(),
                    running: true,
                },
            ]
            for (var i = 0; i < weather_stations.length; i++) {
                let rand = Math.floor(Math.random() * (array.length - 7))
                shared.server.sensors.push(array.slice(0, 6 + rand))
            }

            let main = svg.svg.select('#overview')
                .append('g')
                .attr('id', 'hardware_overview')
                .attr('transform', 'translate('
                + box.overview_sensors.x
                + ','
                + box.overview_sensors.y
                + ')')
            // main.append('rect')
            //   .attr('x', box.overview_sensors.x)
            //   .attr('y', box.overview_sensors.y)
            //   .attr('width', box.overview_sensors.w)
            //   .attr('height', box.overview_sensors.y)
            //   .attr('fill', colorPalette.darker.background)
            // main.append('rect')
            //     .attr('x', 0)
            //     .attr('y', 0)
            //     .attr('width', box.overview_sensors.w)
            //     .attr('height', '24' + screen_unit)
            //     .attr('fill', colorPalette.dark.background)
            // main.append('text')
            //     .text('Hardware')
            //     .style('fill', '#000000')
            //     .style('font-weight', 'bold')
            //     .style('font-size', '18' + screen_unit)
            //     .style('user-select', 'none')
            //     .attr('text-anchor', 'start')
            //     .attr('transform', 'translate(' + 0 + ',' + 0 + ')')

            SensorCore(shared.server.sensors, main)

        }
        this.init_data = init_data

        function update_data() {}
        this.update_data = update_data

        function update() {}
        this.update = update
    }

    let SvgPL = function() {
        let scrollbox
        let plotbox
        let plotList = []

        function adjustScrollBox() {
            if (!scrollbox) {
                return
            }
            let nbperline = Math.floor(box.external.w / (plotbox.w + 29))
            scrollbox.update_box({
                x: 0,
                y: 0,
                w: box.external.w,
                h: box.external.h,
            })
            scrollbox.reset_vertical_scroller({
                can_scroll: true,
                scroll_height: (15 + plotbox.h * 0.15 + (plotbox.h + 20) * Math.ceil(plotList.length / nbperline)),
            })
            // scrollbox.update_horizontal_scroller({can_scroll: true, scroll_width: 0})
        }
        this.adjustScrollBox = adjustScrollBox

        function adjustPlotDistribution() {
            let nbperline = Math.floor(box.external.w / (plotbox.w + 29))
            for (let i = 0; i < plotList.length; i++) {
                d3.select(plotList[i].get('main').g.node().parentNode.parentNode.parentNode.parentNode)
                    .transition()
                    .duration(400)
                    .attr('transform', 'translate(' + (25 + (plotbox.w + 30) * (i % nbperline)) + ',' + (15 + plotbox.h * 0.15 + (plotbox.h + 20) * parseInt(i / nbperline)) + ')')
            }
        }
        this.adjustPlotDistribution = adjustPlotDistribution
        function createPlot(opt_in) {
            let plot = new PlotTimeSeries()
            plot.init({
                main: {
                    g: opt_in.g,
                    box: opt_in.box,
                    clipping: true,
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
                content: {
                },
            })
            return plot
        }
        function init_data() {
            plotbox = {
                x: 0,
                y: 0,
                w: svg_dims.w[0] * 0.18,
                h: svg_dims.h[0] * 0.16 * 0.58,
            }

            let plotlistg = svg.plotList.append('g').attr('id', 'plotList')
                .style('pointer-events', 'auto')

            scrollbox = initScrollBox('plotListScrollbox', plotlistg.append('g').attr('id', 'plotListscroll').attr('transform', 'translate(' + 0 + ',' + 0 + ')'), box.external, {
            }, true)
            let pinnedPlot = scrollbox.get('inner_g')

            let nbperline = Math.floor(box.external.w / (plotbox.w + 29))
            for (var i = 0; i < 8; i++) {
                let opt_in = {
                    g: pinnedPlot.append('g'),
                    box: plotbox,
                }
                opt_in.g.attr('transform', 'translate(' + (25 + (plotbox.w + 30) * (i % nbperline)) + ',' + (15 + plotbox.h * 0.15 + (plotbox.h + 20) * parseInt(i / nbperline)) + ')')
                opt_in.g = opt_in.g.append('g')
                let plot = createPlot(opt_in)
                plotList.push(plot)

                let start_time_sec = {
                    date: new Date(shared.time_information.history_start_sec),
                    time: Number(shared.server.time_information.history_start_sec),
                }
                let end_time_sec = {
                    date: new Date(shared.server.time_information.time_now_sec),
                    time: shared.server.time_information.time_now_sec,
                }
                // plot.updateAxis({
                //     id: 'bottom',
                //     domain: [ start_time_sec.date, end_time_sec.date ],
                //     range: [ 0, opt_in.box.w ],
                // })
                // plot.updateAxis({
                //     id: 'left',
                //     domain: [ 0, 100 ],
                //     range: [ opt_in.box.h, 0 ],
                // })

                let data = shared.server.measures[Math.floor((Math.random() * 11))]
                // plot.bind_data(data.id, [data.status.current].concat(data.status.previous), 'bottom', 'left')
            }

            adjustScrollBox()
            adjustPlotDistribution()

            plotlistg.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', '200' + screen_unit)
                .attr('height', '20' + screen_unit)
                .attr('fill', colorPalette.darkest.background) // colorPalette.dark.background)
                .attr('stroke', 'none')
                .attr('rx', 0)
            plotlistg.append('text')
                .text('Plots List')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '14' + screen_unit)
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (10) + ',' + (16) + ')')
        }
        this.init_data = init_data

        function update_data() {
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    function init_arr_zoomer(g, arr_zoomer_ele_opts, target) {
        let arr_zoomer_lock_init_key = 'in_init_arr_zoomer' + my_unique_id

        let arr_zoomer_base = new ArrZoomerBase({
            run_loop: run_loop,
            svg_dims: {
                w: svg_dims.w[0],
                h: svg_dims.h[0],
            },
            widget_id: widget_id,
            widget_source: widget_source,
            locker: locker,
            is_south: is_south,
            widget_type: widget_type,
            sock: sock,
            user_opts: arr_zoomer_ele_opts,
            lock_init_key: arr_zoomer_lock_init_key,
            svg: g.append('g'),
        })

        // ------------------------------------------------------------------
        // expose the sync function
        // ------------------------------------------------------------------
        function get_sync_state(data_sync_in) {
            arr_zoomer_base.get_sync_tel_focus(data_sync_in)

            if (data_sync_in.type == 'sync_arr_zoomer_prop') {
                // check if this came from myself (even for the same widget_id one
                // can have multiple zoomers, but util_id is completely unique)
                let is_own_sync = (
                    arr_zoomer_base.util_id
                  === data_sync_in.data.util_id
                )
                console.log(' - example - got sync: ', is_own_sync, data_sync_in.data)
            }
        }
        this_top.get_sync_state = get_sync_state


        // ------------------------------------------------------------------
        // examples of optional customisations
        // ------------------------------------------------------------------
        function set_user_styles() {
            if (!locker.is_free(arr_zoomer_lock_init_key)) {
                setTimeout(function() {
                    set_user_styles()
                }, times.wait_loop)
                return
            }

            let bck_rect_main = arr_zoomer_base.get_ele('main')
            if (bck_rect_main) {
                bck_rect_main.get_bck_rect()
                    .style('fill', 'transparent' )
                    .style('stroke', window.cols_blues[0] )
                    .style('stroke-width', 1)
                    .attr('opacity', 0.5)
            }

            let bck_rect_tree = arr_zoomer_base.get_ele('tree')
            if (bck_rect_tree) {
                bck_rect_tree.get_bck_rect()
                    .style('stroke', window.cols_reds[0] )
                    .style('stroke-width', 1)
                    .attr('opacity', 0.8)
            }
            return
        }
        set_user_styles()

        if (target) {
            auto_trans_test(arr_zoomer_base, target)
        }

        return
    }
    function auto_trans_test(arr_zoomer, target) {
        if (!is_def(arr_zoomer.get_ele('main'))) {
            setTimeout(function() {
                auto_trans_test(arr_zoomer, target)
            }, 20)
            return
        }
        arr_zoomer.get_ele('main').zoom_to_target_main({
            // target: 'init',
            target: target,
            // scale: arr_zoomer_base.zooms.len['0.1.5'],
            scale: arr_zoomer.zooms.len['1.2'],
            // scale: arr_zoomer_base.zooms.len['0.0'],
            duration_scale: 0.5,
            // duration_scale: 1.5,
        })
        return
    }
    let SvgObservationSite = function() {
        let maing
        let weather_stations = [ 'Ax00', 'Ax01' ]

        function init_data() {
            maing = svg.svg.select('#focus')
                .append('g')
                .attr('id', 'weather_station_panel')
                .attr('transform', 'translate('
                + box.focus_sensors.x
                + ','
                + box.focus_sensors.y
                + ')')
            // ------------------------------------------------------------------
            //
            // ------------------------------------------------------------------
            let arr_zoomer_ele_opts_map = {
                do_ele: {
                    main: true,
                    // ches: true,
                    // mini: true,
                    tree: false,
                    // lens: !true,
                    // more: false,
                },
                trans: {
                    // main: 'translate(85,85)scale(3)',
                    main: 'translate('
                  + (box.focus_sensors.w * 0.5 - box.focus_sensors.h * 0.25) * 0.5
                  + ','
                  + (14)
                  + ')scale(1)',
                    // ches: 'translate(110,0)scale(8)',
                    tree: 'translate('
                  + (box.focus_sensors.h * 0.25)
                  + ','
                  + (14)
                  + ')scale(1)',
                    // mini: 'translate(5,0)scale(1)',
                    // lens: 'translate(10,5)scale(0.18)',
                },
                inst_filter: {
                    // inst_ids: [ 'Lx01', 'Mx04', 'Mx10' ],
                    // inst_types: [ 'AUX', 'PROC' ],
                },
                main: {
                    // dblclick_zoom_in_out: false,
                },
                ches: {
                    // myOpt: 0,
                },
                mini: {
                    // static_zoom: false,
                },
                tree: {
                    // aspect_ratio: 6/5,
                },
                lens: {
                    // aspect_ratio: 4,
                    // has_titles: true,
                    // pointerEvents: true,
                },
                more: {
                    aspect_ratio: 0.5,
                    // has_title: false,
                },
                base_ele_width: box.focus_sensors.h,
            }
            init_arr_zoomer(maing, arr_zoomer_ele_opts_map)

            return
        }
        this.init_data = init_data

        function update_data() {
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let Svg_measures_plots = function() {
        let focusedPlot

        function init_data() {
            let g = svg.svg.select('#focus')
                .append('g')
                .attr('id', 'measures_plots_panel')
                .attr('transform', 'translate('
                + box.focus_measures.x
                + ','
                + box.focus_measures.y
                + ')')

            focusedPlot = new PlotTimeSeries()
            focusedPlot.init({
                main: {
                    g: g,
                    box: box.focus_measures,
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

            focusedPlot.add_axis({
                main: {
                    id: 'left',
                    location: 'left',
                    type: 'linear',
                    profile: 'focus',
                },
                domain: {
                    raw: [ 0, 100 ],
                },
            })
            focusedPlot.add_axis({
                main: {
                    id: 'bottom',
                    location: 'bottom',
                    drawing: 'time',
                    profile: 'context',
                },
                domain: {
                    raw: [ shared.server.time_information.history_start_sec, shared.server.time_information.time_now_sec ],
                },
            })

            return
        }
        this.init_data = init_data

        function bind_data(data) {
            focusedPlot.add_data({
                id: data.id,
                data: data.status.previous,
                drawing_method: 'plotline',
                shape: 'circle',
                axis_x: 'bottom',
                axis_y: 'left',
            })
        }
        this.bind_data = bind_data

        function unbind_data(data) {
            focusedPlot.remove_data(data.id)
        }
        this.unbind_data = unbind_data

        function update_data() {
            focusedPlot.update_axis({
                id: 'bottom',
                location: 'bottom',
                type: 'time',
                profile: 'context',
                domain: [ shared.server.time_information.history_start_sec, shared.server.time_information.time_now_sec ],
                range: [ 0, box.focus_measures.w ],
            })
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }

    let svg_measures_plots = new Svg_measures_plots()
    let svgObservationSite = new SvgObservationSite()
    let svgPL = new SvgPL()
    let svgFMTimeline = new SvgFMTimeline()
    let svg_time_information = new Svg_time_information()
    let svgFMSupervision = new SvgFMSupervision()
    let svg_main_measures_tracking = new Svg_main_measures_tracking()
    let svgHeathMapSensors = new SvgHeathMapSensors()
    let svgPlotDisplay = new SvgPlotDisplay()
}
// -------------------------------------------------------------------
// -------------------------------------------------------------------
