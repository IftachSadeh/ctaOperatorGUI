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

window.load_script({source: main_script_tag, script: '/js/utils/PlotTimeSeriesV2.js'})
window.load_script({ source: main_script_tag, script: '/js/utils/ScrollBox.js' })
window.load_script({ source: main_script_tag, script: '/js/utils/PlotTimeBar.js' })
window.load_script({ source: main_script_tag, script: '/js/utils/PlotBrushZoom.js' })
window.load_script({ source: 'utils_scrollTable', script: '/js/utils/common_d3.js' })

// load additional js files:
// window.load_script({ source:main_script_tag, script:"/js/utils_scrollGrid.js"});

// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 12
    let w0 = 12
    let div_key = 'main'
    let content = '<div id=\'' + opt_in.base_name + div_key + '\'>' +
  // '<iframe width="600" height="500" id="gmap_canvas" src="https://maps.google.com/maps?q=la%20palma&t=&z=13&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>' +
  // '<iframe width="650" height="650" src="https://embed.windy.com/embed2.html?lat=28.718&lon=-17.849&zoom=11&level=surface&overlay=wind&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=48.683&detailLon=2.133&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1" frameborder="0"></iframe>' +
  '</div>'

    opt_in.widget_func = {
        sock_func: sock_weather_monitoring,
        main_func: main_weather_monitoring,
    }
    opt_in.widget_div_id = opt_in.widget_id + 'widget_div'
    opt_in.ele_props = {}
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
    // let my_unique_id = unique()
    window.colorPalette = get_color_theme('bright_grey')
    let is_south = window.__site_type__ === 'S'

    let widget_type = opt_in.widget_type
    let tag_arr_zoomerPlotsSvg = opt_in.base_name

    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele
    let icon_divs = opt_in.icon_divs

    let shared = {
        server: {},
        time: {
            current: undefined,
            from: undefined,
            range: undefined,
        },
        data: [],
    }
    let svg = {}
    let box = {}
    let svg_dims = {}

    // let this_sched_block_inspector = this
    // let is_south = window.__site_type__ === 'S'

    let sgv_tag = {}
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
    let run_loop = new RunLoop({ tag: widget_id })

    function init_data(data_in) {
        function initSvg() {
            svg_dims.w = {}
            svg_dims.h = {}
            svg_dims.w[0] = 1000
            svg_dims.h[0] = svg_dims.w[0] * 1.33 // / sgv_tag.main.whRatio

            d3.select(svg_div)
                .style('width', 'calc(100% - 200px)')
                .style('height', 'calc(100% - 175px)')
                .style('margin-top', '175px')
                .style('margin-left', '200px')
                .style('overflow', 'scroll')
                .style('max-height', ($(document).height() * 0.8 - 175) + 'px')
            svg.svg = d3
                .select(svg_div)
                .append('svg')
            // .attr('preserveAspectRatio', 'xMidYMid meet')
                .attr('viewBox', '0 0 ' + svg_dims.w[0] + ' ' + svg_dims.h[0])
                .style('position', 'relative')
                .style('width', '100%')
                .style('height', '100%')
                .style('top', '0%')
                .style('left', '0%')
            // .style('max-height', ($(document).height() * 0.8) + 'px')
                .on('dblclick.zoom', null)

            d3.select(svg_divFM)
                .style('position', 'absolute')
                .style('width', '200px')
                .style('height', '100%')
                .style('top', '0%')
                .style('left', '0%')
                .style('pointer-events', 'none')
            // .style('max-height', ($(document).height() * 0.8) + 'px')
            svg.floatingMenu = d3
                .select(svg_divFM)
                .append('svg')
            // .attr('preserveAspectRatio', 'xMidYMid meet')
            // .attr('viewBox', '0 0 ' + svg_dims.w[0] + ' ' + svg_dims.h[0])
                .style('width', '100%')
                .style('height', '100%')
                .style('top', '0%')
                .style('left', '0%')
                .style('pointer-events', 'none')
            svg.floatingMenu.append('rect')
                .attr('x', '98%')
                .attr('y', 0)
                .attr('width', '1px')
                .attr('height', '100%')
                .attr('fill', colorPalette.darkest.stroke)
                .attr('stroke', colorPalette.darkest.stroke)
                .attr('stroke-width', 0.0)

            d3.select(svg_divPL)
                .style('position', 'absolute')
                .style('width', 'calc(100% - 200px)')
                .style('height', '174px')
                .style('top', '0%')
                .style('left', '200px')
                .style('pointer-events', 'none')
            // .style('max-height', ($(document).height() * 0.8) + 'px')
            svg.plotList = d3
                .select(svg_divPL)
                .append('svg')
            // .attr('preserveAspectRatio', 'xMidYMid meet')
            // .attr('viewBox', '0 0 ' + svg_dims.w[0] + ' ' + svg_dims.h[0])
                .style('width', '100%')
                .style('height', '100%')
                .style('top', '0%')
                .style('left', '0%')
                .style('pointer-events', 'none')
            svg.plotList.append('rect')
                .attr('x', 0)
                .attr('y', '99%')
                .attr('width', '100%')
                .attr('height', '1px')
                .attr('fill', colorPalette.darkest.stroke)
                .attr('stroke', colorPalette.darkest.stroke)
                .attr('stroke-width', 0.0)

            function adjustDim() {
                box.pl = {
                    x: 0,
                    y: 0,
                    w: $(svg.plotList.node()).width(),
                    h: $(svg.plotList.node()).height(),
                }
                svgPL.adjustScrollBox()
                svgPL.adjustPlotDistribution()
            }

            $(window).resize(
                function() {
                    adjustDim()
                })

            svg.floatingMenuRoot = svg.floatingMenu.append('g')
            // .attr('transform', 'translate(' + -svg_dims.w[0] * 0.12 + ',' + 0 + ')')

            if (disable_scroll_svg) {
                svg.svg.on('wheel', function() {
                    d3.event.preventDefault()
                })
            }
            svg.back = svg.svg.append('g')
            svg.g = svg.svg.append('g')
        }
        function initBackground() {
            let pattern = {select: {}}
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

            svg.back.append('rect')
                .attr('x', svg_dims.w[0] * 0.0)
                .attr('y', svg_dims.h[0] * 0.0)
                .attr('width', svg_dims.w[0] * 0.26)
                .attr('height', 30)
                .attr('fill', colorPalette.darker.background)
            svg.back.append('rect')
                .attr('x', svg_dims.w[0] * 0.26 - 30)
                .attr('y', svg_dims.h[0] * 0.0)
                .attr('width', 30)
                .attr('height', svg_dims.h[0] * 1)
                .attr('fill', colorPalette.darker.background)
            svg.back.append('text')
                .text('Data tracking')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '22px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (4) + ',' + (20) + ')')

            // svg.back.append('rect')
            //   .attr('x', svg_dims.w[0] * 0.26)
            //   .attr('y', svg_dims.h[0] * 0.17)
            //   .attr('width', svg_dims.w[0] * 0.48)
            //   .attr('height', svg_dims.h[0] * 0.4)
            //   .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
            //   .attr('stroke', 'none')
            //   .attr('rx', 0)
            svg.back.append('text')
                .text('Big Plot')
                .style('fill', colorPalette.bright.background)
                .style('font-weight', 'bold')
                .style('font-size', '8px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (svg_dims.w[0] * 0.5) + ',' + (svg_dims.h[0] * 0.25) + ')')
            let fo = svg.back.append('foreignObject')
                .attr('x', svg_dims.w[0] * 0.5 + 'px')
                .attr('y', svg_dims.h[0] * 0.36 + 'px')
                .attr('width', svg_dims.w[0] * 0.48 + 'px')
                .attr('height', svg_dims.h[0] * 0.495 + 'px').node()

            let iframe = document.createElement('iframe')
            iframe.width = (svg_dims.w[0] * 0.48) + 'px'
            iframe.height = (svg_dims.h[0] * 0.3) + 'px'
            iframe.src = 'https://embed.windy.com/embed2.html?lat=28.718&lon=-17.849&zoom=11&level=surface&overlay=wind&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=48.683&detailLon=2.133&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1'

            fo.appendChild(iframe)
            // svg.svg._groups[0][0].appendChild(fo)

            // svg.back.append('rect')
            //   .attr('x', svg_dims.w[0] * 0.78)
            //   .attr('y', svg_dims.h[0] * 0.98)
            //   .attr('width', svg_dims.w[0] * 0.25)
            //   .attr('height', svg_dims.h[0] * 0.02)
            //   .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
            //   .attr('stroke', 'none')
            //   .attr('rx', 0)
            // svg.back.append('text')
            //   .text('Plots List')
            //   .style('fill', colorPalette.bright.background)
            //   .style('font-weight', 'bold')
            //   .style('font-size', '8px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(' + (svg_dims.w[0] * 0.875) + ',' + (svg_dims.h[0] * 0.995) + ')')

            // svg.back.append('rect')
            //   .attr('x', svg_dims.w[0] * 0.0)
            //   .attr('y', 0)
            //   .attr('width', svg_dims.w[0] * 0.32)
            //   .attr('height', svg_dims.h[0] * 0.14)
            //   .attr('fill', colorPalette.darker.stroke) // colorPalette.dark.background)
            //   .attr('stroke', 'none')
            //   .attr('rx', 0)
            // svg.back.append('text')
            //   .text('_information')
            //   .style('fill', colorPalette.bright.background)
            //   .style('font-weight', 'bold')
            //   .style('font-size', '8px')
            //   .attr('text-anchor', 'middle')
            //   .attr('transform', 'translate(' + (svg_dims.w[0] * 0.16) + ',' + (svg_dims.h[0] * 0.015) + ')')
        }
        function initBox() {
            box.block_queue_server = {
                x: svg_dims.w[0] * 0.374,
                y: svg_dims.h[0] * 0.155,
                w: svg_dims.w[0] * 0.59,
                h: svg_dims.h[0] * 0.47,
                marg: svg_dims.w[0] * 0.01,
            }
            box.pl = {
                x: 0,
                y: 0,
                w: $(svg.plotList.node()).width(),
                h: $(svg.plotList.node()).height(),
            }
        }
        function initDefaultStyle() {
            shared.style = {}
            shared.style.runRecCol = cols_blues[2]
            shared.style.blockCol = function(opt_in) {
                // let endTime = is_def(opt_in.endTime)
                //   ? opt_in.endTime
                //   : undefined
                // if (endTime < Number(shared.data.server.time_of_night.now)) return colorPalette.blocks.shutdown
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

        if (sock.multiple_inits({ id: widget_id, data: data_in })) {
            return
        }

        sock.set_icon_badge({ n_icon: data_in.n_icon, icon_divs: icon_divs })

        let svg_div_id = sgv_tag.main.id + 'svg'
        let svg_divFMId = sgv_tag.main.id + 'FM'
        let svg_divPLId = sgv_tag.main.id + 'PL'
        let parent = sgv_tag.main.widget.get_ele(sgv_tag.main.id)

        let svg_div = sgv_tag.main.widget.get_ele(svg_div_id)
        let svg_divFM = sgv_tag.main.widget.get_ele(svg_divFMId)
        let svg_divPL = sgv_tag.main.widget.get_ele(svg_divPLId)
        if (!is_def(svg_div)) {
            let svg_div = document.createElement('div')
            svg_div.id = svg_div_id
            dom_add(parent, svg_div)

            let svg_divFM = document.createElement('div')
            svg_divFM.id = svg_divFMId
            dom_add(parent, svg_divFM)

            let svg_divPL = document.createElement('div')
            svg_divPL.id = svg_divPLId
            dom_add(parent, svg_divPL)

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
        sock.emit_mouse_move({ eleIn: svg_div, data: { widget_id: widget_id } })

        initSvg()
        initDefaultStyle()
        initBackground()
        initBox()

        shared.server = data_in.data
        shared.time.current = new Date(shared.server.time_of_night.date_now)
        shared.time.range = 1000 * (3600 * parseInt(3) + 60 * parseInt(0))
        shared.time.from = new Date()
        shared.time.from.setTime(shared.time.current.getTime() - shared.time.range)
        loadMesures()

        svg_measured_data.init_data()
        svgHeathMapSensors.init_data()

        createUrgentList()

        svgFMDate.init_data()
        svgFMTimeline.init_data()
        svgFMSupervision.init_data()
        svgObservationSite.init_data()

        svgPL.init_data()

        svgPlotDisplay.init_data()
    }
    this.init_data = init_data
    function update_dataOnce(data_in) {
        if (shared.mode === 'standby') {
            return
        }
        if (!locker.are_free([ 'pushNewSchedule' ])) {
            setTimeout(function() {
                update_dataOnce(data_in)
            }, 10)
            return
        }

        locker.add('update_data')

        for (let key in data_in.data) {
            shared.server[key] = data_in.data[key]
        }
        // svgPlotDisplay.update_data()
        shared.time.current = new Date(shared.server.time_of_night.date_now)
        updateMesures()
        createUrgentList()

        svg_measured_data.update_data()
        svgPlotDisplay.update_data()
        svgFMDate.update_data()
        svgFMSupervision.update_data()

        locker.remove('update_data')
    }
    function update_data(data_in) {
        run_loop.push({ tag: 'update_data', data: data_in })
    }
    this.update_data = update_data
    run_loop.init({ tag: 'update_data', func: update_dataOnce, n_keep: 1 })

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
            boxData: {
                x: 0,
                y: 0,
                w: box.w,
                h: box.h,
            },
            useRelativeCoords: true,
            locker: new Locker(),
            lockerV: [ tag + 'update_data' ],
            lockerZoom: {
                all: tag + 'zoom',
                during: tag + 'zoomsuring',
                end: tag + 'zoomEnd',
            },
            run_loop: new RunLoop({tag: tag}),
            canScroll: true,
            scrollVertical: isVertical,
            scrollHorizontal: !isVertical,
            scrollHeight: 0,
            scrollWidth: 0,
            background: 'transparent',
            scrollRecH: {h: 4},
            scrollRecV: {w: 4},
        })
        return scrollBox
    }
    function addDataToPlot(data) {
        for (let i = 0; i < shared.data.length; i++) {
            if (shared.data[i].id === data.id) {
                shared.data.splice(i, 1)
                svgPlotDisplay.unbindData(data)
                svg_measured_data.unselectMeasure(data.id)
                return
            }
        }
        shared.data.push(data)
        svgPlotDisplay.bindData(data)
        svg_measured_data.selectMeasure(data.id)
    }
    function linearRegression(x, y) {
        var lr = {}
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
            let status = {current: '', previous: []}
            status.current = deep_copy(shared.server.data_out[Math.floor(index / 4)][index % 4].data[0])
            status.current.x = new Date(shared.server.time_of_night.date_now)
            for (let i = 0; i < (shared.time.range / 100 / 3600); i++) {
                if (shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2] === undefined ||
          shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2].y === undefined) {
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
            let status = {current: '', previous: []}
            status.current = deep_copy(shared.server.data_out[Math.floor(index / 4)][index % 4].data[0])
            status.current.x = new Date(shared.server.time_of_night.date_now)
            status.gradient = Math.floor((Math.random() * 20) - 10)
            for (let i = 0; i < (shared.time.range / 100 / 3600); i++) {
                if (shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2] === undefined ||
          shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2].y === undefined) {
                    break
                }
                status.previous.push(deep_copy(shared.server.data_out[Math.floor(index / 4)][index % 4].data[i * 2]))
                status.previous[i].x = new Date()
                status.previous[i].x.setTime(status.current.x.getTime() - i * 3600 * 100)
            }
            return status
        }
        shared.server.measures = [
            {id: 'id0', name: 'Measure1', status: fillfun(1), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: []},
            {id: 'id1', name: 'Measure2', status: fillfun(2), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: []},
            {id: 'id2', name: 'Measure3', status: fillfun(3), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: []},
            {id: 'id3', name: 'Measure4', status: fillfun(4), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: [
                {id: 'id4', name: 'subMeasure.14', status: fillfun(5), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
            ]},
            {id: 'id5', name: 'Measure5', status: fillfun(6), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: []},
            {id: 'id6', name: 'Measure6', status: fillfun(7), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: [
                {id: 'id7', name: 'subMeasure6.1', status: fillfun(8), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
            ]},
            {id: 'id8', name: 'Measure7', status: fillfun(9), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: [
                {id: 'id9', name: 'subMeasure7.1', status: fillfun(10), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
                {id: 'id10', name: 'subMeasure7.2', status: fillfun(11), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
            ]},
            {id: 'id11', name: 'Measure8', status: fillfun(12), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: [
                {id: 'id12', name: 'subMeasure8.1', status: fillfun(13), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
                {id: 'id13', name: 'subMeasure8.2', status: fillfun(14), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
                {id: 'id14', name: 'subMeasure8.3', status: fillfun(15), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
                {id: 'id15', name: 'subMeasure8.4', status: fillfun(16), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
                {id: 'id16', name: 'subMeasure8.5', status: fillfun(17), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
            ]},
            {id: 'id17', name: 'Measure9', status: fillfun(18), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: [
                {id: 'id18', name: 'subMeasure9.1', status: fillfun(19), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
                {id: 'id19', name: 'subMeasure9.2', status: fillfun(20), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
            ]},
            {id: 'id20', name: 'Measure10', status: fillfun(21), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: []},
            {id: 'id21', name: 'Measure11', status: fillfun(22), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))], subMeasures: [
                {id: 'id22', name: 'subMeasure11.1', status: fillfun(23), unit: [ 'C°', '%', 'µg', 'km/h' ][Math.floor((Math.random() * 3))]},
            ]},
        ]
    }
    function createUrgentList() {
        shared.server.urgent = []
        for (let i = 0; i < shared.server.sensors.length; i++) {
            for (let j = 0; j < shared.server.sensors[i].length; j++) {
                if (shared.server.sensors[i][j].status.current === 'ERROR') {
                    shared.server.urgent.push({type: 'sensor', data: shared.server.sensors[i][j]})
                }
            }
        }
        for (let i = 0; i < shared.server.measures.length; i++) {
            let d = shared.server.measures[i]
            if (d.status.current.y < 16.6 || d.status.current.y > 83.4) {
                shared.server.urgent.push({type: 'measure', data: d})
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
                            box: {x: 0, y: 0, w: 0, h: plotbox.h, marg: 0},
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
                            box: {x: 0, y: 0, w: 0, h: 0, marg: 0},
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
                            box: {x: plotbox.w, y: 0, w: 0, h: 0, marg: 0},
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
                content: {},
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
                            box: {x: 0, y: brushbox.h * 0.14, w: brushbox.w, h: brushbox.h * 0.2, marg: 0},
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
                            box: {x: 0, y: brushbox.h * 0.9, w: brushbox.w, h: brushbox.h * 0.0, marg: 0},
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
                        box: {x: 0, y: brushbox.h * 0.15, w: brushbox.w, h: brushbox.h * 0.65, marg: 0},
                        attr: {
                            fill: colorPalette.medium.background,
                        },
                    },
                },
                focus: {
                    enabled: true,
                    main: {
                        g: undefined,
                        box: {x: 0, y: brushbox.h * 0.5, w: brushbox.w, h: brushbox.h * 0.3, marg: 0},
                        attr: {
                            fill: colorPalette.darkest.background,
                            opacity: 1,
                            stroke: colorPalette.darkest.background,
                        },
                    },
                },
                brush: {
                    coef: {x: 0, y: 0},
                    callback: () => {},
                },
                zoom: {
                    coef: {kx: 1, ky: 1, x: 0, y: 0},
                    callback: function() {
                        plot.updateAxis({
                            id: 'bottom',
                            domain: brush.getAxis('top').scale.domain(),
                            range: [ 0, plotbox.w ],
                        })
                        plot.update_data()
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

        function bindData(data) {
            plot.bindData(data.id, [ data.status.current ].concat(data.status.previous), 'bottom', 'left')
        }
        this.bindData = bindData
        function unbindData(data) {
            plot.unbindData(data.id)
        }
        this.unbindData = unbindData

        function update_data() {
            let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
            let endTime = {date: new Date(shared.server.time_of_night.date_now), time: Number(shared.server.time_of_night.now)}
            plot.updateAxis({
                id: 'bottom',
                domain: [ startTime.date, endTime.date ],
                range: [ 0, plotbox.w ],
            })
            plot.updateAxis({
                id: 'left',
                domain: [ 0, 100 ],
                range: [ plotbox.h, 0 ],
            })
            plot.updateAxis({
                id: 'right',
                domain: [ 0, 100 ],
                range: [ plotbox.h, 0 ],
            })

            brush.updateAxis({
                id: 'top',
                domain: [ startTime.date, endTime.date ],
            })
            brush.updateAxis({
                id: 'middle',
                domain: [ startTime.date, endTime.date ],
            })
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let SvgHeathMapSensors = function() {
        let box
        let step = 20
        let currentState = 'default'
        let spaceSize = 6
        let lineSize
        let scrollbox
        // reserved.overview.modifications.scrollBox.get('innerG')
        function changeState(from, action) {
            if (from === 'heatmap') {
                if (currentState === 'default') {
                    currentState = 'expanded'
                    expandSensor()
                }
                else if (currentState === 'expanded') {
                    currentState = 'default'
                    defaultDisplay()
                }
                else if (currentState === 'shift') {
                    currentState = 'expanded'
                    expandSensor()
                }
            }
            else if (from === 'measured') {
                if (action === 'expanded') {
                    currentState = 'shift'
                    shrinkSensor()
                }
                else if (action === 'default') {
                    currentState = 'default'
                    defaultDisplay()
                }
            }
        }
        this.changeState = changeState
        function shrinkSensor() {
            svg.g.select('g#hardwareMonitoring').selectAll('g.sensor')
                .each(function(d) {
                    let g = d3.select(this)
                    g.on('mouseenter', () => {})
                    g.on('mouseleave', () => {})
                    g.selectAll('g.sensorline')
                        .transition()
                        .duration(600)
                        .attr('transform', function(d, i) {
                            return 'translate(' + 0 + ',' + 0 + ')'
                        })
                })
            svg.g.select('g#hardwareMonitoring').selectAll('rect#label').remove()
            svg.g.select('g#hardwareMonitoring').selectAll('text#label').remove()

            let count = svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline').size()
            svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline')
                .attr('opacity', 1)
                .transition()
                .duration(400)
                .delay((d, i) => i * (400 / count))
                .attr('opacity', 0)
                .on('end', function() {
                    d3.select(this).attr('visibility', 'hidden')
                })

            svg.g.select('g#hardwareMonitoring').selectAll('g.sensor')
                .transition()
                .duration(600)
                .delay((d, i) => i * (600 / count))
                .attr('transform', function(d, i) {
                    return 'translate(' + (-box.w * 0.7 + box.w * 0.25 * (i % 4)) + ',' + (parseInt(i / 4) * 30) + ')'
                })
        }
        // function unshift () {
        //
        //   let offset = 0
        //   svg.g.select('g#hardwareMonitoring').selectAll('g.sensor')
        //     .transition()
        //     .duration(400)
        //     .delay((d, i) => 400 - i * (400 / count))
        //     .attr('transform', (d, i) => {
        //       let trans = offset
        //       offset += 12 + d.length * (lineSize)
        //       return 'translate(' + 0 + ',' + trans + ')'
        //     })
        //
        //   // let offset = 0
        //   // svg.g.select('g#hardwareMonitoring').selectAll('g.sensor')
        //   //   .each(function (d, i) {
        //   //     let g = d3.select(this)
        //   //     g.transition()
        //   //       .duration(600)
        //   //       .delay((d, i) => 600 - i * (600 / count))
        //   //       .attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
        //   //     offset += 12 + d.length * (lineSize)
        //   //   })
        // }
        function display_onoff_button(g) {
            g.select('rect#background').attr('fill', d3.color(colorPalette.darker.background).darker(0.2))
            g.selectAll('g.sensorline').transition()
                .duration(300)
                .attr('transform', function(d, i) {
                    return 'translate(' + 28 + ',' + (i * 12) + ')'
                })

            let ig = g.selectAll('g.sensorline')
                .append('g')
                .attr('id', 'onoff_button')
                .on('click', function(d, i) {
                    if (d[i].running) {
                        d[i].running = false
                        ig.select('rect#slideback')
                            .transition()
                            .duration(200)
                            .attr('fill', (d, i) => {
                                return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
                            })
                        ig.select('circle#slidebutton')
                            .transition()
                            .duration(200)
                            .attr('cx', (d, i) => {
                                return d[i].running ? -12 : -22
                            })
                            .attr('fill', (d, i) => {
                                return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
                            })
                    }
                    else {
                        d[i].running = true
                        ig.select('rect#slideback')
                            .transition()
                            .duration(200)
                            .attr('fill', (d, i) => {
                                return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
                            })
                        ig.select('circle#slidebutton')
                            .transition()
                            .duration(200)
                            .attr('cx', (d, i) => {
                                return d[i].running ? -12 : -22
                            })
                            .attr('fill', (d, i) => {
                                return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
                            })
                    }
                    onOffSensor(d3.select(d3.select(this).node().parentNode), i)
                })
            ig.append('rect')
                .attr('id', 'slideback')
                .attr('x', -28)
                .attr('y', (d, i) => (i * 8.5) - 4)
                .attr('width', 22)
                .attr('height', 12)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.5)
                .attr('fill', (d, i) => {
                    return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
                })
                .style('opacity', 0.5)
                .attr('rx', 6)
            ig.append('circle')
                .attr('id', 'slidebutton')
                .attr('cx', (d, i) => {
                    return d[i].running ? -12 : -22
                })
                .attr('cy', (d, i) => (i * 8.5) + 2)
                .attr('r', 5.5)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.5)
                .attr('fill', (d, i) => {
                    return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
                })
            // ig.append('rect')
            //   .attr('id', 'slideoverlay')
            //   .attr('x', -28)
            //   .attr('y', (d, i) => (i * 8.5) - 4)
            //   .attr('width', 22)
            //   .attr('height', 12)
            //   .attr('stroke', 'none')
            //   .attr('fill', 'transparent')
            //   .attr('rx', 6)
            //   .on('click', function (d, i) {
            //     if (d[i].running) {
            //       d[i].running = false
            //       ig.select('rect#slideback')
            //         .attr('fill', (d, i) => {
            //           return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
            //         })
            //       ig.select('circle#slidebutton')
            //         .attr('cx', (d, i) => {
            //           return d[i].running ? -12 : -22
            //         })
            //         .attr('fill', (d, i) => {
            //           return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
            //         })
            //     } else {
            //       d[i].running = true
            //       ig.select('rect#slideback')
            //         .attr('fill', (d, i) => {
            //           return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
            //         })
            //       ig.select('circle#slidebutton')
            //         .attr('cx', (d, i) => {
            //           return d[i].running ? -12 : -22
            //         })
            //         .attr('fill', (d, i) => {
            //           return d[i].running ? colorPalette.blocks.run.background : colorPalette.darkest.stroke
            //         })
            //     }
            //   })
        }
        function hideOnOff_button(g) {
            g.selectAll('g.sensorline').selectAll('g#onoff_button').remove()
            g.select('rect#background').attr('fill', 'transparent')
            g.selectAll('g.sensorline').transition()
                .duration(300)
                .attr('transform', function(d, i) {
                    return 'translate(' + 0 + ',' + (i * 12) + ')'
                })
        }
        function expandSensor() {
            // svg_measured_data.shift()
            let offset = 0
            svg.g.select('g#hardwareMonitoring')
                .transition()
                .duration(600)
                .attr('transform', 'translate(' + 0 + ',' + -box.y * 0.00 + ')')
            svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline')
                .attr('visibility', 'visible')
                .transition()
                .duration(600)
                .attr('opacity', 1)
            svg.g.select('g#heatmapSensors').selectAll('g.sensor')
                .each(function(d, i) {
                    let g = d3.select(this)
                    g.on('mouseenter', function(d) {
                        display_onoff_button(g)
                    })
                    g.on('mouseleave', function(d) {
                        hideOnOff_button(g)
                    })
                    // g.on('click', () => {
                    //   console.log(d3.event);
                    //   console.log('click2')
                    // })
                    offset += 24
                    // let localCpOffset = offset
                    g.append('text')
                        .attr('id', 'label')
                        .text(d => d[0].name)
                        .attr('x', -6)
                        .attr('y', '-18px')
                        .style('font-weight', 'bold')
                        .style('font-size', '16px')
                    g.append('rect')
                        .attr('id', 'label')
                        .attr('x', -4)
                        .attr('y', -11)
                        .attr('width', 2)
                        .attr('height', d.length * (lineSize + 16))
                    g.select('rect#background')
                        .attr('x', -6)
                        .attr('y', -26)
                        .attr('width', box.w)
                        .attr('height', d.length * (lineSize + 12) + 8 + 16)
                        .attr('fill', 'transparent')
                    g.transition()
                        .duration(600)
                        .attr('transform', 'translate(' + 6 + ',' + (offset) + ')')

                    g.selectAll('g.sensorline')
                        .append('text')
                        .attr('id', 'label')
                        .text((d, i) => d[i].id)
                        .attr('x', 0)
                        .attr('y', -1)
                        .style('font-size', '14px')
                        .attr('transform', function(d, i) {
                            return 'translate(' + 0 + ',' + (i * 9) + ')'
                        })
                    g.selectAll('g.sensorline')
                        .transition()
                        .duration(600)
                        .attr('transform', function(d, i) {
                            return 'translate(' + 0 + ',' + (i * 18) + ')'
                        })
                    offset += d.length * (lineSize + 22)
                })

            scrollbox.updateBox({x: 0, y: 0, w: box.w, h: (box.y * 0.00 + box.h)})
            scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: (offset)})
        }
        function defaultDisplay() {
            // svg_measured_data.unshift()
            svg.g.select('g#hardwareMonitoring')
                .transition()
                .duration(200)
                .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
                .on('end', function() {
                    scrollbox.updateBox({x: 0, y: 0, w: box.w, h: box.h})
                    scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: 0})
                    let count = svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline').size()
                    svg.g.select('g#hardwareMonitoring').selectAll('g#timestampsline')
                        .attr('visibility', 'visible')
                        .transition()
                        .duration(600)
                        .delay((d, i) => i * (600 / count))
                        .attr('opacity', 1)
                    let offset = 0
                    svg.g.select('g#heatmapSensors').selectAll('g.sensor')
                        .each(function(d) {
                            let g = d3.select(this)
                            g.on('mouseenter', () => {})
                            g.on('mouseleave', () => {})
                            g.transition()
                                .duration(600)
                                .attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
                            g.selectAll('g.sensorline')
                                .transition()
                                .duration(600)
                                .attr('transform', function(d, i) {
                                    return 'translate(' + 0 + ',' + 0 + ')'
                                })
                            offset += spaceSize + d.length * (lineSize)
                        })
                    svg.g.select('g#heatmapSensors').selectAll('rect#label').remove()
                    svg.g.select('g#heatmapSensors').selectAll('text#label').remove()
                })
        }
        function onOffSensor(g, j) {
            g.selectAll('rect#timestamp')
                .attr('fill', (d, i) => {
                    if (d[j].status.previous[i] === 'RUNNING') {
                        return d[j].running === true ? d3.color(colorPalette.blocks.done.background) : d3.color(colorPalette.blocks.done.background).darker().darker()
                    }
                    if (d[j].status.previous[i] === 'ERROR') {
                        return d[j].running === true ? d3.color(colorPalette.blocks.fail.background) : d3.color(colorPalette.blocks.fail.background).darker().darker()
                    }
                    if (d[j].status.previous[i] === 'OFF') {
                        return d[j].running === true ? d3.color('#333333') : d3.color('#333333').darker().darker()
                    }
                })
            g.selectAll('rect#current')
                .attr('fill', (d, i) => {
                    if (d[j].status.current === 'RUNNING') {
                        return d[j].running === true ? d3.color(colorPalette.blocks.done.background) : d3.color(colorPalette.blocks.done.background).darker()
                    }
                    if (d[j].status.current === 'ERROR') {
                        return d[j].running === true ? d3.color(colorPalette.blocks.fail.background) : d3.color(colorPalette.blocks.fail.background).darker()
                    }
                    if (d[j].status.current === 'OFF') {
                        return d[j].running === true ? d3.color('#333333') : d3.color('#333333').darker()
                    }
                })
        }
        function SensorCore(sensors, g) {
            let rows = 0
            for (let el in sensors) {
                rows += sensors[el].length
            }
            lineSize = (box.h - sensors.length * spaceSize) / rows
            let current = g
                .selectAll('g.sensor')
                .data(sensors, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'sensor')

            enter.each(function(d, i) {
                let g = d3.select(this)
                g.append('rect').attr('id', 'background')
                for (let j = 0; j < d.length; j++) {
                    let ig = g.append('g').attr('class', 'sensorline')
                    let tg = ig.append('g').attr('id', 'timestampsline')
                    for (let i = 0; i < d[j].status.previous.length; i++) {
                        tg.append('rect')
                            .attr('id', 'timestamp')
                            .attr('x', 0 + (i * (box.w * 0.74) / d[j].status.previous.length))
                            .attr('y', j * lineSize)
                            .attr('width', (box.w * 0.74) / d[j].status.previous.length)
                            .attr('height', lineSize)
                            .attr('fill', () => {
                                if (d[j].status.previous[i] === 'RUNNING') {
                                    return d[j].running === true ? d3.color(colorPalette.blocks.done.background) : d3.color(colorPalette.blocks.done.background).darker().darker()
                                }
                                if (d[j].status.previous[i] === 'ERROR') {
                                    return d[j].running === true ? d3.color(colorPalette.blocks.fail.background) : d3.color(colorPalette.blocks.fail.background).darker().darker()
                                }
                                if (d[j].status.previous[i] === 'OFF') {
                                    return d[j].running === true ? d3.color('#333333') : d3.color('#333333').darker().darker()
                                }
                            }) // colorPalette.dark.background)
                            .attr('stroke', '#000000')
                            .attr('stroke-width', 0.1)
                        // .style('opacity', d[j].running === true ? 1 : 0.2)
                    }
                    ig.append('rect')
                        .attr('id', 'current')
                        .attr('x', box.w * 0.78)
                        .attr('y', j * lineSize)
                        .attr('width', (box.w * 0.05))
                        .attr('height', lineSize)
                        .attr('fill', () => {
                            if (d[j].status.current === 'RUNNING') {
                                return d[j].running === true ? d3.color(colorPalette.blocks.done.background) : d3.color(colorPalette.blocks.done.background).darker()
                            }
                            if (d[j].status.current === 'ERROR') {
                                return d[j].running === true ? d3.color(colorPalette.blocks.fail.background) : d3.color(colorPalette.blocks.fail.background).darker()
                            }
                            if (d[j].status.current === 'OFF') {
                                return d[j].running === true ? d3.color('#333333') : d3.color('#333333').darker()
                            }
                        }) // colorPalette.dark.background)
                        .attr('stroke', '#000000')
                        .attr('stroke-width', 0.2)
                        .attr('rx', 0)

                    let errorbox = ig.append('g').attr('id', 'errorbox')
                        .attr('display', 'auto')
                        .style('opacity', 1)
                    errorbox.append('rect')
                        .attr('id', 'background')
                        .attr('x', box.w * 0.89)
                        .attr('y', 0 + j * lineSize - lineSize * 0.5)
                        .attr('width', lineSize * 1.75)
                        .attr('height', lineSize * 1.75)
                        .attr('stroke', '#000000')
                        .attr('stroke-width', 1)
                    errorbox.append('text')
                        .text('!')
                        .attr('x', box.w * 0.9 + 9)
                        .attr('y', 16 + j * lineSize - lineSize * 0.5)
                        .style('font-size', '18px')
                        .style('text-anchor', 'middle')
                        .style('font-weight', 'bold')
                        .style('user-select', 'none')
                        .style('pointer-events', 'none')

                    // if (d[j].status.current === 'ERROR') {
                    //   ig.append('rect')
                    //     .attr('x', box.w * 0.88)
                    //     .attr('y', 0 + j * lineSize - lineSize * 0.5)
                    //     .attr('width', lineSize * 2.5)
                    //     .attr('height', lineSize * 2.5)
                    //     .attr('fill', 'gold')
                    //     .attr('stroke-width', 0)
                    //   ig.append('svg:image')
                    //     .attr('xlink:href', '/static/icons/warning-tri.svg')
                    //     .attr('x', box.w * 0.88)
                    //     .attr('y', 0 + j * lineSize - lineSize * 0.5)
                    //     .attr('width', lineSize * 2.5)
                    //     .attr('height', lineSize * 2.5)
                    //     .style('opacity', 0.5)
                    //     .style('pointer-events', 'none')
                    // }
                }
            })
            let merge = current.merge(enter)

            let offset = 0
            merge.each(function(d, i) {
                let g = d3.select(this)

                g.selectAll('g.sensorline').each(function(d, j) {
                    let g = d3.select(this)
                    if (d[j].status.current === 'ERROR') {
                        g.select('g#errorbox').attr('display', 'auto')
                        g.select('g#errorbox rect#background').attr('fill', colorPalette.blocks.fail.background)
                    }
                    else {
                        g.select('g#errorbox').attr('display', 'none')
                    }
                })

                g.attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
                offset += spaceSize + d.length * (lineSize)
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim_arc)
                .style('opacity', 0)
                .remove()
        }
        function init_data() {
            box = {
                x: svg_dims.w[0] * 0.0,
                y: svg_dims.h[0] * 0.7,
                w: svg_dims.w[0] * 0.265,
                h: svg_dims.h[0] * 0.28,
                marg: svg_dims.w[0] * 0.01,
            }

            let fillfun = function() {
                let status = {current: '', previous: []}
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
            shared.server.sensors = [
                [{id: 'id0', name: 'Illuminator', status: fillfun(), running: Math.random() < 0.5}],
                [{id: 'id1', name: 'Photometer', status: fillfun(), running: Math.random() < 0.5}],
                [{id: 'id2', name: 'All-sky-camera', status: fillfun(), running: Math.random() < 0.5}],
                [{id: 'id3', name: 'Ceilometer', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id4', name: 'Ceilometer', status: fillfun(), running: Math.random() < 0.5}],
                [{id: 'id5', name: 'FRAM', status: fillfun(), running: Math.random() < 0.5}],
                [{id: 'id6', name: 'LIDARs', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id7', name: 'LIDARs', status: fillfun(), running: Math.random() < 0.5}],
                [{id: 'id8', name: 'Weather-stations', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id9', name: 'Weather-stations', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id10', name: 'Weather-stations', status: fillfun(), running: Math.random() < 0.5}],
                [{id: 'id11', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id12', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id13', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id14', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id15', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id16', name: 'Anemometers', status: fillfun(), running: Math.random() < 0.5}],
                [{id: 'id17', name: 'Precipitation', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id18', name: 'Precipitation', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id19', name: 'Precipitation', status: fillfun(), running: Math.random() < 0.5}],
                [{id: 'id20', name: 'Dust', status: fillfun(), running: Math.random() < 0.5}],
                [{id: 'id21', name: 'Accelerometers', status: fillfun(), running: Math.random() < 0.5},
                    {id: 'id22', name: 'Accelerometers', status: fillfun(), running: true}],
            ]

            let main = svg.g.append('g').attr('id', 'hardwareMonitoring')
            scrollbox = initScrollBox('heatmapScrollbox', main.append('g').attr('id', 'heatmapSensors').attr('transform', 'translate(' + box.x + ',' + (box.y + box.h * 0.05) + ')'), box, {}, true)
            // main.append('rect')
            //   .attr('x', box.x)
            //   .attr('y', box.y)
            //   .attr('width', box.w)
            //   .attr('height', box.y)
            //   .attr('fill', colorPalette.darker.background)
            main.append('rect')
                .attr('x', box.x)
                .attr('y', (box.y - 18) + 'px')
                .attr('width', box.w * 0.87)
                .attr('height', '24px')
                .attr('fill', colorPalette.dark.background)
            main.append('text')
                .text('Hardware')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '18px')
                .style('user-select', 'none')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (box.x + 2) + ',' + (box.y) + ')')

            let gsens = scrollbox.get('innerG')
            main.append('rect')
                .attr('x', box.x + box.w * 0.78)
                .attr('y', (box.y - 14) + 'px')
                .attr('width', '16px')
                .attr('height', '16px')
                .attr('fill', 'transparent')
                .attr('stroke-width', 0)
                .style('boxShadow', '10px 20px 30px black')
                .on('click', function() {
                    changeState('heatmap')
                })
                .on('mouseover', function(d) {
                    d3.select(this).style('cursor', 'pointer')
                    d3.select(this).attr('fill', colorPalette.darker.background)
                })
                .on('mouseout', function(d) {
                    d3.select(this).style('cursor', 'default')
                    d3.select(this).attr('fill', 'transparent')
                })
            main.append('svg:image')
                .attr('xlink:href', '/static/icons/full-size.svg')
                .attr('x', box.x + box.w * 0.78)
                .attr('y', (box.y - 14) + 'px')
                .attr('width', '16px')
                .attr('height', '16px')
                .style('pointer-events', 'none')

            SensorCore(shared.server.sensors, gsens)
        }
        this.init_data = init_data

        function update_data() {}
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let SvgMeasuredis_data = function() {
        let box
        let expanded = false
        let scrollbox

        function shift() {
            svg.g.select('g#measured_data')
                .transition()
                .duration(600)
                .attr('transform', 'translate(' + 0 + ',' + box.h * 0.7 + ')')
        }
        this.shift = shift
        function unshift() {
            svg.g.select('g#measured_data')
                .transition()
                .duration(600)
                .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
        }
        this.unshift = unshift
        function expand(g) {
            // svgHeathMapSensors.changeState('measured', 'expanded')

            // svg.g.select('g#measured_data')
            //   .transition()
            //   .delay(250)
            //   .duration(600)
            //   .attr('transform', 'translate(' + 0 + ',' + -box.h * 0.35 + ')')
        }
        function shrink(g) {
            svgHeathMapSensors.changeState('measured', 'default')

            // svg.g.select('g#measured_data')
            //   .transition()
            //   .duration(600)
            //   .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
        }
        function selectMeasure(id) {
            let g = scrollbox.get('innerG').select('g#' + id)
            g.select('rect#background').attr('fill', colorPalette.darkest.background)
            g.data()[0].selected = true
        }
        this.selectMeasure = selectMeasure
        function unselectMeasure(id) {
            let g = scrollbox.get('innerG').select('g#' + id)
            g.select('rect#background').attr('fill', 'transparent')
            delete g.data()[0]['selected']
        }
        this.unselectMeasure = unselectMeasure
        function measuredCore() {
            let lineDim = {
                w: box.w,
                h: 30,
                marg: 6,
            }
            let current = scrollbox.get('innerG')
                .selectAll('g.measures')
                .data(shared.server.measures, function(d) {
                    return d.id
                })
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'measures')

            enter.each(function(d, i) {
                let g = d3.select(this)
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

                let main = g.attr('id', d.id)
                    .on('mouseenter', () => {
                        d3.select(this).style('cursor', 'pointer')
                        if (g.data()[0].selected) {
                            return
                        }
                        main.select('#background').attr('fill', colorPalette.darker.background)
                    })
                    .on('mouseleave', () => {
                        d3.select(this).style('cursor', 'default')
                        if (g.data()[0].selected) {
                            return
                        }
                        main.select('#background').attr('fill', 'transparent')
                    })
                    .on('click', () => {
                        addDataToPlot(d)
                    })
                main.append('rect')
                    .attr('id', 'background')
                    .attr('x', 0)
                    .attr('y', -18)
                    .attr('width', lineDim.w)
                    .attr('height', lineDim.h * 1.4)
                    .attr('fill', 'transparent')

                // main.append('defs')
                //   .append('clipPath')
                //   .attr('id', 'rect-clip' + d.id)
                //   .append('rect')
                //   .attr('x', 12 + (box.w * 0.45 / 50 * min))
                //   .attr('y', -12)
                //   .attr('width', (box.w * 0.45 / 50 * (max - min)))
                //   .attr('height', 12)
                //   .style('fill-opacity', 0)
                // main.append('rect')
                //   .attr('x', 0)
                //   .attr('y', -12)
                //   .attr('width', box.w * 0.075)
                //   .attr('height', 12)
                //   .attr('fill', colorPalette.blocks.fail.background)
                //   .attr('stroke', 'none')
                //   .attr('rx', 0)
                //   .style('opacity', 0.8)
                //   .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                // main.append('rect')
                //   .attr('x', 0 + box.w * 0.075)
                //   .attr('y', -12)
                //   .attr('width', box.w * 0.075)
                //   .attr('height', 12)
                //   .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
                //   .attr('stroke', 'none')
                //   .attr('rx', 0)
                //   .style('opacity', 0.8)
                //   .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                // main.append('rect')
                //   .attr('x', 0 + box.w * 0.15)
                //   .attr('y', -12)
                //   .attr('width', box.w * 0.15)
                //   .attr('height', 12)
                //   .attr('fill', colorPalette.blocks.done.background) // colorPalette.dark.background)
                //   .attr('stroke', 'none')
                //   .attr('rx', 0)
                //   .style('opacity', 0.8)
                //   .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                // main.append('rect')
                //   .attr('x', 0 + box.w * 0.3)
                //   .attr('y', -12)
                //   .attr('width', box.w * 0.075)
                //   .attr('height', 12)
                //   .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
                //   .attr('stroke', 'none')
                //   .attr('rx', 0)
                //   .style('opacity', 0.8)
                //   .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                // main.append('rect')
                //   .attr('x', 0 + box.w * 0.375)
                //   .attr('y', -12)
                //   .attr('width', box.w * 0.075)
                //   .attr('height', 12)
                //   .attr('fill', colorPalette.blocks.fail.background)
                //   .attr('stroke', 'none')
                //   .attr('rx', 0)
                //   .style('opacity', 0.8)
                //   .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                //
                // main.append('rect')
                //   .attr('x', 0 + (box.w * 0.45 / 50 * d.status.current))
                //   .attr('y', -12)
                //   .attr('width', 3)
                //   .attr('height', 12)
                //   .attr('fill', '#000000') // colorPalette.dark.background)
                //   .attr('stroke', 'none')
                //   .attr('rx', 0)
                //
                // main.append('text')
                //   .attr('id', 'measurelabel')
                //   .text(d.name + ':')
                //   .attr('x', box.w * 0.48)
                //   .attr('y', 0)
                //   .style('font-size', '12px')
                // main.append('text')
                //   .attr('id', 'valuelabel')
                //   .text(d.status.current)
                //   .attr('x', box.w * 0.75)
                //   .attr('y', 0)
                //   .style('font-size', '12px')
                //   .style('font-weight', 'bold')
                // main.append('text')
                //   .attr('id', 'unitlabel')
                //   .text(d.unit)
                //   .attr('x', box.w * 0.88)
                //   .attr('y', 0)
                //   .style('font-size', '9px')
                //   .style('font-weight', '')

                main.append('rect')
                    .attr('x', 12)
                    .attr('y', -13)
                    .attr('width', (lineDim.w * 0.36))
                    .attr('height', lineDim.h)
                    .attr('fill', 'none')
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 0.1)
                main.append('defs')
                    .append('clipPath')
                    .attr('id', 'rect-clip' + d.id)
                    .append('rect')
                    .attr('x', 12 + (lineDim.w * 0.36 / 100 * min))
                    .attr('y', -13)
                    .attr('width', (lineDim.w * 0.36 / 100 * (max - min)))
                    .attr('height', lineDim.h)
                    .style('fill-opacity', 0)
                let healthg = main.append('g').attr('id', 'healthGroup')
                    .style('opacity', 0.7)
                healthg.append('rect')
                    .attr('x', 12)
                    .attr('y', -13)
                    .attr('width', lineDim.w * 0.06)
                    .attr('height', lineDim.h)
                    .attr('fill', colorPalette.blocks.fail.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                    .style('opacity', 0.8)
                    .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                healthg.append('rect')
                    .attr('x', 12 + lineDim.w * 0.06)
                    .attr('y', -13)
                    .attr('width', lineDim.w * 0.06)
                    .attr('height', lineDim.h)
                    .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                    .style('opacity', 0.8)
                    .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                healthg.append('rect')
                    .attr('x', 12 + lineDim.w * 0.12)
                    .attr('y', -13)
                    .attr('width', lineDim.w * 0.12)
                    .attr('height', lineDim.h)
                    .attr('fill', colorPalette.blocks.done.background) // colorPalette.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                    .style('opacity', 0.8)
                    .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                healthg.append('rect')
                    .attr('x', 12 + lineDim.w * 0.24)
                    .attr('y', -13)
                    .attr('width', lineDim.w * 0.06)
                    .attr('height', lineDim.h)
                    .attr('fill', colorPalette.blocks.warning.background) // colorPalette.dark.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                    .style('opacity', 0.8)
                    .attr('clip-path', 'url(#rect-clip' + d.id + ')')
                healthg.append('rect')
                    .attr('x', 12 + lineDim.w * 0.3)
                    .attr('y', -13)
                    .attr('width', lineDim.w * 0.06)
                    .attr('height', lineDim.h)
                    .attr('fill', colorPalette.blocks.fail.background)
                    .attr('stroke', 'none')
                    .attr('rx', 0)
                    .style('opacity', 0.8)
                    .attr('clip-path', 'url(#rect-clip' + d.id + ')')

                // main.append('rect')
                //   .attr('x', 12 + (box.w * 0.36 / 100 * d.status.current.y))
                //   .attr('y', -13)
                //   .attr('width', 1)
                //   .attr('height', 30)
                //   .attr('fill', '#000000') // colorPalette.dark.background)
                //   .attr('stroke', 'none')
                //   .attr('rx', 0)
                let valueline = d3.line()
                    .curve(d3.curveBundle)
                    .x(function(d, j) {
                        return 12 + (box.w * 0.36 / 100 * d.y)
                    })
                    .y(function(dd, j) {
                        return -13 + 30 - (30 / d.status.previous.length) * j
                    })
                main.append('path')
                    .attr('d', valueline(d.status.previous))
                    .attr('fill', 'none')
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 1.5)
                main.append('polygon')
                    .attr('cx', 13 + (lineDim.w * 0.36 / 100 * d.status.current.y))
                    .attr('cy', 16)
                    .attr('points', (13 + (lineDim.w * 0.36 / 100 * d.status.current.y)) + ',' + 16 + ' ' +
            (6 + lineDim.w * 0.36 / 100 * d.status.current.y) + ',' + 24 + ' ' +
            (20 + (lineDim.w * 0.36 / 100 * d.status.current.y)) + ',' + 24)
                    .attr('r', 3)
                    .attr('fill', '#000000')
                    .attr('stroke', 'none')
                    .attr('rx', 0)

                main.append('text')
                    .attr('id', 'measurelabel')
                    .text(d.name)
                    .attr('x', box.w * 0.43)
                    .attr('y', -5)
                    .style('font-size', '16px')
                    .style('user-select', 'none')
                    .style('text-anchor', 'start')
                main.append('text')
                    .attr('id', 'valuelabel')
                    .text(d.status.current.y)
                    .attr('x', box.w * 0.62)
                    .attr('y', 16)
                    .style('font-size', '20px')
                    .style('font-weight', 'bold')
                    .style('user-select', 'none')
                    .style('text-anchor', 'end')
                main.append('text')
                    .attr('id', 'unitlabel')
                    .text('(' + d.unit + ')')
                    .attr('x', box.w * 0.86)
                    .attr('y', -7)
                    .style('font-size', '12px')
                    .style('font-weight', '')
                    .style('user-select', 'none')
                    .style('text-anchor', 'end')

                main.append('text')
                    .attr('id', 'gradient')
                    .text(d.status.gradient)
                    .attr('x', box.w * 0.68)
                    .attr('y', 16)
                    .style('font-size', '16px')
                    .style('text-anchor', 'start')
                    .style('font-weight', '')
                    .style('user-select', 'none')

                let errorbox = main.append('g').attr('id', 'errorbox')
                    .attr('display', 'none')
                    .style('opacity', 1)
                errorbox.append('rect')
                    .attr('id', 'background')
                    .attr('x', box.w * 0.9)
                    .attr('y', -6)
                    .attr('width', 22)
                    .attr('height', 22)
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 1)
                errorbox.append('rect')
                    .attr('id', 'pattern')
                    .attr('x', box.w * 0.9 + 4)
                    .attr('y', -2)
                    .attr('width', 14)
                    .attr('height', 14)
                errorbox.append('text')
                    .text('!')
                    .attr('x', box.w * 0.9 + 11)
                    .attr('y', 12)
                    .style('font-size', '18px')
                    .style('text-anchor', 'middle')
                    .style('font-weight', 'bold')
                    .style('user-select', 'none')
            })
            let merge = current.merge(enter)

            let offset = 18
            merge.each(function(d, i) {
                let min = Math.min(...d.status.previous.map((a) => a.y), d.status.current.y)
                let max = Math.max(...d.status.previous.map((a) => a.y), d.status.current.y)

                let g = d3.select(this)
                g.on('click', () => {
                    addDataToPlot(d)
                })
                g.select('clipPath#rect-clip' + d.id + ' rect')
                    .transition()
                    .duration(400)
                    .attr('x', 12 + (box.w * 0.36 / 100 * min))
                    .attr('width', (box.w * 0.36 / 100 * (max - min)))

                let valueline = d3.line()
                    .curve(d3.curveBundle)
                    .x(function(d, j) {
                        return 12 + (box.w * 0.36 / 100 * d.y)
                    })
                    .y(function(dd, j) {
                        return -13 + 30 - (30 / d.status.previous.length) * j
                    })
                g.select('path')
                    .transition()
                    .duration(400)
                    .attr('d', valueline(d.status.previous))
                g.select('polygon')
                    .transition()
                    .duration(400)
                    .attr('points', (13 + (lineDim.w * 0.36 / 100 * d.status.current.y)) + ',' + 16 + ' ' +
            (6 + lineDim.w * 0.36 / 100 * d.status.current.y) + ',' + 24 + ' ' +
            (20 + (lineDim.w * 0.36 / 100 * d.status.current.y)) + ',' + 24)
                g.select('text#valuelabel')
                    .text(d.status.current.y)
                g.select('text#gradient')
                    .text(d.status.gradient)

                if (d.status.current.y < 16.6 || d.status.current.y > 83.4) {
                    g.select('g#errorbox').attr('display', 'auto')
                    g.select('g#errorbox rect#background').attr('fill', colorPalette.blocks.fail.background)
                    g.select('g#errorbox rect#pattern').attr('fill', colorPalette.blocks.fail.background)
                }
                else if (d.status.current.y < 33.2 || d.status.current.y > 66) {
                    g.select('g#errorbox').attr('display', 'auto')
                    g.select('g#errorbox rect#background').attr('fill', colorPalette.blocks.warning.background)
                    if ((d.status.current.y + d.status.gradient) < 16.6 || (d.status.current.y + d.status.gradient) > 83.4) {
                        g.select('g#errorbox rect#pattern').attr('fill', colorPalette.blocks.fail.background)
                    }
                    else {
                        g.select('g#errorbox rect#pattern').attr('fill', colorPalette.blocks.warning.background)
                    }
                }
                else if ((d.status.current.y + d.status.gradient) < 33.2 || (d.status.current.y + d.status.gradient) > 66) {
                    g.select('g#errorbox').attr('display', 'auto')
                    g.select('g#errorbox rect#background').attr('fill', colorPalette.blocks.done.background)
                    g.select('g#errorbox rect#pattern').attr('fill', colorPalette.blocks.warning.background)
                }
                else {
                    g.select('g#errorbox').attr('display', 'none')
                }

                g.attr('transform', 'translate(' + 0 + ',' + (offset) + ')')
                offset += 50
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim_arc)
                .style('opacity', 0)
                .remove()
        }
        function init_data() {
            box = {
                x: svg_dims.w[0] * 0.0,
                y: 48,
                w: svg_dims.w[0] * 0.26,
                h: svg_dims.h[0] * 0.55,
                marg: svg_dims.w[0] * 0.01,
            }

            let main = svg.g.append('g').attr('id', 'measured_data')
            scrollbox = initScrollBox('measuredScrollbox', main.append('g').attr('id', 'measured').attr('transform', 'translate(' + box.x + ',' + (box.y + box.h * 0.03) + ')'), box, {}, true)

            main.append('rect')
                .attr('x', box.x)
                .attr('y', (box.y - 18) + 'px')
                .attr('width', box.w * 0.885)
                .attr('height', '24px')
                .attr('fill', colorPalette.dark.background)
            main.append('text')
                .text('Measures')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '18px')
                .style('user-select', 'none')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (box.x + 2) + ',' + (box.y) + ')')
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

            main.append('rect')
                .attr('x', box.x + box.w * 0.78)
                .attr('y', (box.y - 14) + 'px')
                .attr('width', '16px')
                .attr('height', '16px')
                .attr('fill', 'transparent')
                .attr('stroke-width', 0)
                .style('boxShadow', '10px 20px 30px black')
                .on('click', function() {
                    if (expanded) {
                        expanded = false
                        shrink(gmes)
                    }
                    else {
                        expanded = true
                        expand(gmes)
                    }
                })
                .on('mouseover', function(d) {
                    d3.select(this).style('cursor', 'pointer')
                    d3.select(this).attr('fill', colorPalette.darker.background)
                })
                .on('mouseout', function(d) {
                    d3.select(this).style('cursor', 'default')
                    d3.select(this).attr('fill', 'transparent')
                })
            main.append('svg:image')
                .attr('xlink:href', '/static/icons/full-size.svg')
                .attr('x', box.x + box.w * 0.78)
                .attr('y', (box.y - 14) + 'px')
                .attr('width', '16px')
                .attr('height', '16px')
                .style('pointer-events', 'none')

            measuredCore()
        }
        this.init_data = init_data

        function update_data() {
            measuredCore()
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let SvgFMSupervision = function() {
        let box
        let expanded = false
        let scrollbox

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
                g.append('rect')
                    .attr('x', box.x - 2)
                    .attr('y', size.y - 2)
                    .attr('width', box.w + 4)
                    .attr('height', size.h + 4)
                    .attr('fill', i % 2 === 1 ? colorPalette.dark.background : colorPalette.medium.background)
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 0.2)
                    .attr('stroke-dasharray', [ box.w + 4, box.w + 4 + (size.h + 4) * 2 ])
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

                g.append('text')
                    .attr('id', 'label')
                    .text(d.data.name)
                    .attr('x', size.x + size.w + 6)
                    .attr('y', size.y + size.h * 0.4)
                    .style('font-size', '12px')
                g.append('text')
                    .attr('id', 'label')
                    .text(d.data.id)
                    .attr('x', size.x + size.w + 6)
                    .attr('y', size.y + size.h * 0.85)
                    .style('font-size', '12px')
            }
            function drawMeasure(g, d, i) {
                g.append('rect')
                    .attr('x', box.x - 2)
                    .attr('y', size.y - 2)
                    .attr('width', box.w + 4)
                    .attr('height', size.h + 4)
                    .attr('fill', i % 2 === 1 ? colorPalette.dark.background : colorPalette.medium.background)
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 0.2)
                    .attr('stroke-dasharray', [ box.w + 4, box.w + 4 + (size.h + 4) * 2 ])
                g.append('rect')
                    .attr('x', size.x)
                    .attr('y', size.y)
                    .attr('width', size.w)
                    .attr('height', size.h)
                    .attr('fill', 'none')
                    .attr('stroke-width', 0)
                    .attr('stroke', '#000000')
                g.append('svg:image')
                    .attr('xlink:href', '/static/icons/speedometer.svg')
                    .attr('x', size.x)
                    .attr('y', size.y)
                    .attr('width', size.w * 0.8)
                    .attr('height', size.h * 0.8)
                    .style('opacity', 0.5)
                    .style('pointer-events', 'none')

                g.append('text')
                    .attr('id', 'label')
                    .text(d.data.name)
                    .attr('x', size.x + size.w + 6)
                    .attr('y', size.y + size.h * 0.4)
                    .style('font-size', '12px')
                g.append('text')
                    .attr('id', 'label')
                    .text(d.data.id)
                    .attr('x', size.x + size.w + 6)
                    .attr('y', size.y + size.h * 0.85)
                    .style('font-size', '12px')
                g.append('text')
                    .attr('id', 'label')
                    .text(d.data.status.current.y + ' >> ' + 84)
                    .attr('x', box.w * 0.95)
                    .attr('y', size.y + size.h * 0.66)
                    .style('font-weight', '')
                    .style('text-anchor', 'end')
                    .style('font-size', '11px')
            }
            let g = scrollbox.get('innerG')
            let size = {x: 6, y: 26, w: 30, h: 30, marg: 4}

            let current = g
                .selectAll('g.urgent')
                .data(shared.server.urgent)
            let enter = current
                .enter()
                .append('g')
                .attr('class', 'urgent')

            enter.each(function(d, i) {
                let g = d3.select(this)
                if (d.type === 'measure') {
                    drawMeasure(g, d, i)
                }
                else if (d.type === 'sensor') {
                    drawHardware(g, d, i)
                }
            })
            let merge = current.merge(enter)

            merge.each(function(d, i) {
                let g = d3.select(this)
                g.attr('transform', 'translate(' + ((i % 1) * (size.w + size.marg)) + ',' + (parseInt(i / 1) * (size.h + size.marg)) + ')')
            })
            current
                .exit()
                .transition('in_out')
                .duration(times.anim_arc)
                .style('opacity', 0)
                .remove()
        }
        function init_data() {
            box = {
                x: 8,
                y: svg_dims.h[0] * 0.2,
                w: svg_dims.w[0] * 0.18,
                h: svg_dims.h[0] * 0.4,
                marg: svg_dims.w[0] * 0.01,
            }

            let main = svg.floatingMenuRoot.append('g').attr('id', 'urgentSupervision')
                .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
            scrollbox = initScrollBox('supervisionScrollbox', main.append('g').attr('id', 'supervision').attr('transform', 'translate(' + 0 + ',' + 6 + ')'), box, {}, true)

            // main.append('rect')
            //   .attr('x', box.x)
            //   .attr('y', box.y)
            //   .attr('width', box.w)
            //   .attr('height', box.h)
            //   .attr('fill', 'none') // 'url(#patternLock)')
            //   .attr('stroke', colorPalette.dark.stroke)
            //   .attr('stroke-width', 0.2)
            //   .style('opacity', 0.2)
            main.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', box.w)
                .attr('height', '22px')
                .attr('fill', colorPalette.darkest.background)
            main.append('text')
                .text('Urgent supervision')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '15px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (4) + ',' + (16) + ')')

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
            serpervisionCore()
        }
        this.init_data = init_data

        function update_data() {
            serpervisionCore()
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let SvgFMDate = function() {
        let box

        function init_data() {
            box = {
                x: 8,
                y: 0,
                w: svg_dims.w[0] * 0.18,
                h: svg_dims.h[0] * 0.065,
            }

            let main = svg.floatingMenuRoot.append('g').attr('id', 'fmdate')

            main.append('rect')
                .attr('x', box.x)
                .attr('y', box.y)
                .attr('width', box.w)
                .attr('height', box.h)
                .attr('fill', colorPalette.darkest.stroke)
                .attr('stroke', colorPalette.darkest.stroke)
                .attr('stroke-width', 0.3)
                .attr('rx', 0)
            main.append('text')
                .attr('id', 'currentHourTop')
                .attr('stroke', colorPalette.bright.background)
                .attr('stroke-width', 0.0)
                .attr('fill', colorPalette.bright.background)
                .attr('x', box.w * 0.5)
                .attr('y', box.h * 0.4)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('font-size', '18px')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
            main.append('text')
                .attr('id', 'currentHourBottom')
                .attr('stroke', colorPalette.bright.background)
                .attr('stroke-width', 0.0)
                .attr('fill', colorPalette.bright.background)
                .attr('x', box.w * 0.5)
                .attr('y', box.h * 0.8)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('font-size', '20px')
                .style('pointer-events', 'none')
                .style('user-select', 'none')

            update_data()
        }
        this.init_data = init_data

        function update_data() {
            let currentTime = {date: new Date(shared.server.time_of_night.date_now)}
            svg.floatingMenuRoot.select('g#fmdate text#currentHourTop').text(d3.timeFormat('%b %a %d, %Y')(currentTime.date))
            svg.floatingMenuRoot.select('g#fmdate text#currentHourBottom').text(d3.timeFormat('%H:%M:%S UTC')(currentTime.date))
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let SvgFMTimeline = function() {
        let box
        let stock = {}

        function changeBlockTime(a, b) {
            shared.time.range = 1000 * (3600 * (parseInt(a)) + 60 * parseInt(b))
            shared.time.from.setTime(shared.time.current.getTime() - shared.time.range)
            loadMesures()
            svg_measured_data.update_data()
            svgPlotDisplay.update_data()
        }
        function createInput(type, g, innerbox) {
            stock[type + 'minus_button'] = new button_d3()
            stock[type + 'minus_button'].init({
                main: {
                    id: type + 'minus_button',
                    g: g,
                    box: {x: innerbox.x - 3, y: innerbox.y + 12, width: 9, height: 9},
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
                            attr: {},
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
                            y: innerbox.y + 12 + 7,
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
                        attr: {},
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
                    box: {x: innerbox.x + 6, y: innerbox.y + 12, width: 9, height: 9},
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
                            attr: {},
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
                            y: innerbox.y + 12 + 7,
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
                        attr: {},
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
            box = {
                x: 8,
                y: svg_dims.h[0] * 0.07,
                w: svg_dims.w[0] * 0.18,
                h: svg_dims.h[0] * 0.1,
            }

            let main = svg.floatingMenuRoot.append('g').attr('id', 'fmdate')
                .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
                .style('pointer-events', 'auto')

            main.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', box.w)
                .attr('height', '22px')
                .attr('fill', colorPalette.darkest.background)
            main.append('text')
                .text('Timeline range')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '15px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (4) + ',' + (16) + ')')
            main.append('rect')
                .attr('x', 0)
                .attr('y', box.h * 0.26)
                .attr('width', box.w * 0.96)
                .attr('height', box.h * 0.38)
                .attr('fill', colorPalette.dark.background)
                .attr('rx', 2)
            main.append('rect')
                .attr('x', 0)
                .attr('y', box.h * 0.68)
                .attr('width', box.w * 0.96)
                .attr('height', box.h * 0.42)
                .attr('fill', colorPalette.dark.background)
                .attr('rx', 2)

            let gDateSelector = main.append('g').attr('transform', 'translate(' + (box.w * 0.0) + ',' + (box.h * 0.28) + '), scale(1.5,1.5)')
            gDateSelector.append('text')
                .text('Last:')
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', '9px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (15) + ',' + (box.h * 0.12) + ')')

            let font_size = 11
            let time = new Date(1000 * (3600 * (parseInt(2)) + 60 * parseInt(0)))
            let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
            let hbox = {
                x: box.w * 0.3,
                y: 0,
                w: 14,
                h: 18,
            }
            let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
            let mbox = {
                x: box.w * 0.45,
                y: 0,
                w: 14,
                h: 18,
            }

            stock.hourOpts = {disabled: false, value: hour, min: 0, max: 23, step: 1}
            stock.hour = input_date_d3(gDateSelector,
                hbox,
                'hour',
                stock.hourOpts,
                {change: (d) => {
                    changeBlockTime(d, stock.minute.property('value'))
                }, enter: (d) => {
                    stock.minute.node().focus()
                }})
            createInput('hour', gDateSelector, hbox)
            gDateSelector.append('text')
                .text(':')
                .style('fill', colorPalette.dark.stroke)
                .style('font-size', font_size + 'px')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (hbox.x + hbox.w + 0.5 + 5) + ',' + (hbox.h * 0.5) + ')')
            stock.minuteOpts = {disabled: false, value: min, min: 0, max: 59, step: 1}
            stock.minute = input_date_d3(gDateSelector,
                mbox,
                'minute',
                stock.minuteOpts,
                {change: (d) => {
                    changeBlockTime(stock.hour.property('value'), d)
                }, enter: (d) => {
                    stock.second.node().focus()
                }})
            createInput('minute', gDateSelector, mbox)

            let gFromToSelector = main.append('g').attr('transform', 'translate(' + (box.w * 0.03) + ',' + (box.h * 0.7) + ')')
                .style('opacity', 0.2)
            gFromToSelector.append('text')
                .text('From:')
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', '13.5px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (15) + ',' + (box.h * 0.12) + ')')
            gFromToSelector.append('text')
                .text('To:')
                .style('fill', '#000000')
                .style('font-weight', '')
                .style('font-size', '13.5px')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(' + (15) + ',' + (box.h * 0.34) + ')')

            update_data()
        }
        this.init_data = init_data

        function update_data() {
            let currentTime = {date: new Date(shared.server.time_of_night.date_now)}
            svg.floatingMenuRoot.select('text#currentHourTop').text(d3.timeFormat('%b %a %d, %Y')(currentTime.date))
            svg.floatingMenuRoot.select('text#currentHourBottom').text(d3.timeFormat('%H:%M:%S UTC')(currentTime.date))
        }
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
            let nbperline = Math.floor(box.pl.w / (plotbox.w + 29))
            scrollbox.updateBox({x: 0, y: 0, w: box.pl.w, h: box.pl.h})
            scrollbox.resetVerticalScroller({canScroll: true, scrollHeight: (15 + plotbox.h * 0.15 + (plotbox.h + 20) * Math.ceil(plotList.length / nbperline))})
            // scrollbox.updateHorizontalScroller({canScroll: true, scrollWidth: 0})
        }
        this.adjustScrollBox = adjustScrollBox

        function adjustPlotDistribution() {
            let nbperline = Math.floor(box.pl.w / (plotbox.w + 29))
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
                            box: {x: 0, y: 0, w: 0, h: opt_in.box.h, marg: 0},
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
                            box: {x: 0, y: 0, w: 0, h: 0, marg: 0},
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
                content: {},
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

            scrollbox = initScrollBox('plotListScrollbox', plotlistg.append('g').attr('id', 'plotListscroll').attr('transform', 'translate(' + 0 + ',' + 0 + ')'), box.pl, {}, true)
            let pinnedPlot = scrollbox.get('innerG')

            let nbperline = Math.floor(box.pl.w / (plotbox.w + 29))
            for (var i = 0; i < 8; i++) {
                let opt_in = {g: pinnedPlot.append('g'),
                    box: plotbox,
                }
                opt_in.g.attr('transform', 'translate(' + (25 + (plotbox.w + 30) * (i % nbperline)) + ',' + (15 + plotbox.h * 0.15 + (plotbox.h + 20) * parseInt(i / nbperline)) + ')')
                opt_in.g = opt_in.g.append('g')
                let plot = createPlot(opt_in)
                plotList.push(plot)

                let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
                let endTime = {date: new Date(shared.server.time_of_night.date_now), time: Number(shared.server.time_of_night.now)}
                plot.updateAxis({
                    id: 'bottom',
                    domain: [ startTime.date, endTime.date ],
                    range: [ 0, opt_in.box.w ],
                })
                plot.updateAxis({
                    id: 'left',
                    domain: [ 0, 100 ],
                    range: [ opt_in.box.h, 0 ],
                })

                let data = shared.server.measures[Math.floor((Math.random() * 11))]
                // plot.bindData(data.id, [data.status.current].concat(data.status.previous), 'bottom', 'left')
            }

            adjustScrollBox()
            adjustPlotDistribution()

            plotlistg.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', '200px')
                .attr('height', '20px')
                .attr('fill', colorPalette.darkest.background) // colorPalette.dark.background)
                .attr('stroke', 'none')
                .attr('rx', 0)
            plotlistg.append('text')
                .text('Plots List')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '14px')
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
    let SvgObservationSite = function() {
        let obsbox

        function init_data() {
            obsbox = {
                x: svg_dims.w[0] * 0.55,
                y: svg_dims.h[0] * 0.68,
                w: svg_dims.h[0] * 0.32,
                h: svg_dims.h[0] * 0.32,
            }

            let maing = svg.g.append('g')
            maing.append('rect')
                .attr('x', obsbox.x)
                .attr('y', obsbox.y)
                .attr('width', obsbox.w)
                .attr('height', obsbox.h)
                .attr('fill', 'rgb(56, 59, 66)')
                .attr('stroke', '#000000')
                .attr('stroke-width', '0.4px')
            maing.append('circle')
                .attr('cx', obsbox.x + obsbox.w * 0.5)
                .attr('cy', obsbox.y + obsbox.h * 0.5)
                .attr('r', obsbox.w * 0.45)
                .attr('fill', '#FEFEFE')
                .attr('stroke', '#000000')
                .attr('stroke-width', '0.4px')
            bck_pattern({
                com: {},
                g_now: maing.append('g').attr('transform', 'translate(' + (obsbox.x + obsbox.w * 0.05) + ',' + (obsbox.y + obsbox.h * 0.05) + ')'),
                g_tag: 'hex',
                len_wh: [ obsbox.w * 0.9, obsbox.h * 0.9 ],
                opac: 0.15,
                hex_r: 18,
            })

            maing.append('rect')
                .attr('x', (obsbox.x + obsbox.w * 0.29))
                .attr('y', (obsbox.y + obsbox.h * 0.25))
                .attr('width', 30)
                .attr('height', 30)
                .attr('fill', colorPalette.blocks.done.background)
                .attr('stroke', '#000000')
                .attr('stroke-width', '0.4px')
                .attr('transform', 'rotate(45 ' + (15 + obsbox.x + obsbox.w * 0.29) + ' ' + (15 + obsbox.y + obsbox.h * 0.25) + ')')
            maing.append('text')
                .text('1')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '16px')
                .style('user-select', 'none')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (obsbox.x + obsbox.w * 0.29 + 15) + ',' + (obsbox.y + obsbox.h * 0.25 + 22) + ')')

            maing.append('rect')
                .attr('x', (obsbox.x + obsbox.w * 0.37))
                .attr('y', (obsbox.y + obsbox.h * 0.76))
                .attr('width', 30)
                .attr('height', 30)
                .attr('fill', colorPalette.blocks.fail.background)
                .attr('stroke', '#000000')
                .attr('stroke-width', '0.4px')
                .attr('transform', 'rotate(45 ' + (15 + obsbox.x + obsbox.w * 0.37) + ' ' + (15 + obsbox.y + obsbox.h * 0.76) + ')')
            maing.append('text')
                .text('2')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '16px')
                .style('user-select', 'none')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (obsbox.x + obsbox.w * 0.37 + 15) + ',' + (obsbox.y + obsbox.h * 0.76 + 22) + ')')

            maing.append('rect')
                .attr('x', (obsbox.x + obsbox.w * 0.5))
                .attr('y', (obsbox.y + obsbox.h * 0.57))
                .attr('width', 30)
                .attr('height', 30)
                .attr('fill', colorPalette.blocks.done.background)
                .attr('stroke', '#000000')
                .attr('stroke-width', '0.4px')
                .attr('transform', 'rotate(45 ' + (15 + obsbox.x + obsbox.w * 0.5) + ' ' + (15 + obsbox.y + obsbox.h * 0.57) + ')')
            maing.append('text')
                .text('3')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '16px')
                .style('user-select', 'none')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (obsbox.x + obsbox.w * 0.5 + 15) + ',' + (obsbox.y + obsbox.h * 0.57 + 22) + ')')

            maing.append('rect')
                .attr('x', (obsbox.x + obsbox.w * 0.72))
                .attr('y', (obsbox.y + obsbox.h * 0.33))
                .attr('width', 30)
                .attr('height', 30)
                .attr('fill', colorPalette.blocks.done.background)
                .attr('stroke', '#000000')
                .attr('stroke-width', '0.4px')
                .attr('transform', 'rotate(45 ' + (15 + obsbox.x + obsbox.w * 0.72) + ' ' + (15 + obsbox.y + obsbox.h * 0.33) + ')')
            maing.append('text')
                .text('4')
                .style('fill', '#000000')
                .style('font-weight', 'bold')
                .style('font-size', '16px')
                .style('user-select', 'none')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (obsbox.x + obsbox.w * 0.72 + 15) + ',' + (obsbox.y + obsbox.h * 0.33 + 22) + ')')

        }
        this.init_data = init_data

        function update_data() {
            let startTime = {date: new Date(shared.time.from), time: Number(shared.time.from.getTime())}
            let endTime = {date: new Date(shared.server.time_of_night.date_now), time: Number(shared.server.time_of_night.now)}
            plot.updateAxis({
                id: 'bottom',
                domain: [ startTime.date, endTime.date ],
                range: [ 0, plotbox.w ],
            })
            plot.updateAxis({
                id: 'left',
                domain: [ 0, 100 ],
                range: [ plotbox.h, 0 ],
            })
            plot.updateAxis({
                id: 'right',
                domain: [ 0, 100 ],
                range: [ plotbox.h, 0 ],
            })

            brush.updateAxis({
                id: 'top',
                domain: [ startTime.date, endTime.date ],
            })
            brush.updateAxis({
                id: 'middle',
                domain: [ startTime.date, endTime.date ],
            })
        }
        this.update_data = update_data

        function update() {}
        this.update = update
    }
    let svgObservationSite = new SvgObservationSite()
    let svgPL = new SvgPL()
    let svgFMTimeline = new SvgFMTimeline()
    let svgFMDate = new SvgFMDate()
    let svgFMSupervision = new SvgFMSupervision()
    let svg_measured_data = new SvgMeasuredis_data()
    let svgHeathMapSensors = new SvgHeathMapSensors()
    let svgPlotDisplay = new SvgPlotDisplay()
}
// -------------------------------------------------------------------
// -------------------------------------------------------------------
