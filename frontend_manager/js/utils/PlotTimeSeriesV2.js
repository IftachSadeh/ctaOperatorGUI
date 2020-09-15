// ------------------------------------------------------------------
//
// ------------------------------------------------------------------

/* global d3 */
/* global times */
/* global is_def */
/* global PlotBrushZoom */

window.PlotTimeSeries = function() {
    let color_theme = get_color_theme('bright_grey')
    let reserved = {
        main: {
            g: undefined,
            box: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            },
        },
        axis: [],
        interaction: {
        },
        content: [],
    }
    this.set = function(opt_in) {
        if (is_def(opt_in.data)) {
            reserved[opt_in.tag] = opt_in.data
        }
        else if (is_def(opt_in.def)) {
            reserved[opt_in.tag] = opt_in.def
        }
        else {
            reserved[opt_in.tag] = null
        }
    }
    this.get = function(type) {
        return reserved[type]
    }

    function set_style(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        reserved.style = {
        }

        reserved.style.hasOutline = is_def(opt_in.hasOutline)
            ? opt_in.hasOutline
            : false
    }
    this.set_style = set_style
    function init(opt_in) {
        reserved = opt_in
        reserved.main.g.attr(
            'transform',
            'translate(' + reserved.main.box.x + ',' + reserved.main.box.y + ')'
        )

        init_full_options()
        init_axis()
        init_interaction()
        init_clipping()
        // init_brush()
        // init_zoom()

        reserved.clipping.maing.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', reserved.main.box.w)
            .attr('height', reserved.main.box.h)
            .style('opacity', '0')
        reserved.clipping.maing.append('g').attr('id', 'bindedData')
    }
    this.init = init
    function init_axis() {
        reserved.axis = {
            top: [],
            bottom: [],
            left: [],
            right: [],
        }
    }
    function init_clipping() {
        if (!reserved.main.clipping) {
            reserved.clipping = {
                maing: reserved.main.g,
            }
            return
        }
        reserved.clipping = {
        }
        reserved.clipping.g = reserved.main.g.append('g')
        reserved.clipping.g
            .append('defs')
            .append('svg:clipPath')
            .attr('id', 'clip' + reserved.main.id)
            .append('svg:rect')
            .attr('id', 'clip-rect' + reserved.main.id)
            .attr('x', '0')
            .attr('y', '0')
            .attr('width', reserved.main.box.w)
            .attr('height', reserved.main.box.h)
        reserved.clipping.clipBody = reserved.clipping.g
            .append('g')
            .attr('clip-path', 'url(#clip' + reserved.main.id + ')')
        reserved.clipping.maing = reserved.clipping.clipBody.append('g')
    }
    function init_interaction() {
        function create_delete_button() {
            let remg = reserved.main.g
                .append('g')
                .attr('id', 'removeGroup')
                .style('cursor', 'pointer')
            remg
                .append('rect')
                .attr('x', reserved.main.box.w - 15)
                .attr('y', -15)
                .attr('width', 15)
                .attr('height', 15)
                .attr('stroke', colorPalette.dark.stroke)
                .attr('stroke-width', 0.2)
                .attr('fill', colorPalette.blocks.run.background)
                .style('opacity', '0')
            remg
                .append('svg:image')
                .attr('xlink:href', '/static/icons/cross.svg')
                .attr('x', reserved.main.box.w - 12.5 + 'px')
                .attr('y', -12.5 + 'px')
                .attr('width', 10 + 'px')
                .attr('height', 10 + 'px')
                .style('pointer-events', 'none')
        }
        function create_pinned_button() {
            let remg = reserved.main.g
                .append('g')
                .attr('id', 'removeGroup')
                .style('cursor', 'pointer')
            remg
                .append('rect')
                .attr('x', reserved.main.box.w - 36)
                .attr('y', -15)
                .attr('width', 15)
                .attr('height', 15)
                .attr('stroke', colorPalette.dark.stroke)
                .attr('stroke-width', 0.2)
                .attr('fill', colorPalette.blocks.run.background)
                .style('opacity', '0')
            remg
                .append('svg:image')
                .attr('xlink:href', '/static/icons/pin.svg')
                .attr('x', reserved.main.box.w - 33.5 + 'px')
                .attr('y', -12.5 + 'px')
                .attr('width', 10 + 'px')
                .attr('height', 10 + 'px')
                .style('pointer-events', 'none')
        }
        for (let key in reserved.interaction) {
            switch (key) {
            case 'pinned':
                if (reserved.interaction[key].enabled) {
                    create_pinned_button()
                }
                break
            case 'remove':
                if (reserved.interaction[key].enabled) {
                    create_delete_button()
                }
                break
            default:
                break
            }
        }
    }

    function init_full_options() {
        let default_brush = {
            enabled: false,
            coef: {
                x: 0,
                y: 0,
            },
            meta: {
                x: 0,
                y: 0,
            },
            behavior: 'zoom-rect',
        }
        reserved.brush = window.merge_obj(default_brush, reserved.brush
            ? reserved.brush
            : {
            })
        let default_zoom = {
            enabled: false,
            coef: {
                kx: 1,
                ky: 1,
                x: 0,
                y: 0,
            },
            meta: {
                kx: {
                    min: 1,
                    max: 20,
                    previous: 1,
                    now: 1,
                    point: [ 0, 0 ],
                },
                ky: {
                    min: 1,
                    max: 20,
                    previous: 1,
                    now: 1,
                    point: [ 0, 0 ],
                },
                x: {
                    min: 0,
                    max: reserved.main.box.w,
                    now: 0,
                },
                y: {
                    min: 0,
                    max: reserved.main.box.h,
                    now: 0,
                },
            },
        }
        reserved.zoom = window.merge_obj(default_zoom, reserved.zoom
            ? reserved.zoom
            : {
            })
    }
    function init_brush() {
        if (!reserved.brush.enabled) {
            return
        }

        function computeDragFactor() {
            reserved.zoom.coef.x = reserved.zoom.coef.x + reserved.brush.meta.x
            if (reserved.zoom.coef.x < 0) {
                reserved.zoom.coef.x = 0
            }
            let right
          = reserved.zoom.coef.x
          + reserved.zoom.meta.x.max
          * (1 / reserved.zoom.meta.kx.now)
            if (right > reserved.zoom.meta.x.max) {
                reserved.zoom.coef.x
              = reserved.zoom.coef.x - (right - reserved.zoom.meta.x.max)
            }

            reserved.zoom.coef.y = reserved.zoom.coef.y + reserved.brush.meta.y
            if (reserved.zoom.coef.y < 0) {
                reserved.zoom.coef.y = 0
            }
            let bottom
          = reserved.zoom.coef.y
          + reserved.zoom.meta.y.max
          * (1 / reserved.zoom.meta.ky.now)
            if (bottom > reserved.zoom.meta.y.max) {
                reserved.zoom.coef.y
              = reserved.zoom.coef.y - (bottom - reserved.zoom.meta.y.max)
            }
        }


        reserved.clipping.maing
            .on('mouseover', function() {
                d3.select(this).style('cursor', 'crosshair')
            })
            .on('mouseout', function() {
                d3.select(this).style('cursor', 'default')
            })

        let rect_zoom = d3.drag()
            .on('start', function() {
                reserved.brush.meta.x = d3.event.x
                reserved.brush.meta.y = d3.event.y
                console.log(reserved.brush.meta)
                reserved.clipping.maing.append('rect')
                    .attr('id', 'zoom_rect')
                    .attr('x', reserved.brush.meta.x)
                    .attr('y', reserved.brush.meta.y)
                    .attr('width', 0)
                    .attr('height', 0)
                    .attr('fill', 'none')
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', [ 8, 2 ])
            })
            .on('drag', function() {
                reserved.clipping.maing.select('rect#zoom_rect')
                    .attr('x', d3.event.x > reserved.brush.meta.x
                        ? reserved.brush.meta.x
                        : d3.event.x)
                    .attr('y', d3.event.y > reserved.brush.meta.y
                        ? reserved.brush.meta.y
                        : d3.event.y)
                    .attr('width', Math.abs(d3.event.x - reserved.brush.meta.x))
                    .attr('height', Math.abs(d3.event.y - reserved.brush.meta.y))
            })
            .on('end', function() {
                reserved.clipping.maing.select('rect#zoom_rect')
                    .remove()

                let trans_percent = {
                    x: (d3.event.x > reserved.brush.meta.x
                        ? reserved.brush.meta.x
                        : d3.event.x)
                        / reserved.main.box.w,
                    y: (d3.event.y > reserved.brush.meta.y
                        ? reserved.brush.meta.y
                        : d3.event.y)
                        / reserved.main.box.h,
                }
                reserved.zoom.coef.x = reserved.zoom.coef.x
              + (trans_percent.x
                  * reserved.main.box.w
                  * reserved.zoom.coef.kx)
                reserved.zoom.coef.y = reserved.zoom.coef.y
              + (trans_percent.y
                  * reserved.main.box.h
                  * reserved.zoom.coef.ky)

                let zoom_percent = {
                    x: Math.abs(d3.event.x - reserved.brush.meta.x)
                    / reserved.main.box.w,
                    y: Math.abs(d3.event.y - reserved.brush.meta.y)
                    / reserved.main.box.h,
                }
                reserved.zoom.coef.kx = zoom_percent.x * reserved.zoom.coef.kx
                reserved.zoom.coef.ky = zoom_percent.y * reserved.zoom.coef.ky

                reserved.zoom.meta.kx.previous = reserved.zoom.meta.kx.now
                reserved.zoom.meta.kx.now = 1 / reserved.zoom.coef.kx
                reserved.zoom.meta.ky.previous = reserved.zoom.meta.ky.now
                reserved.zoom.meta.ky.now = 1 / reserved.zoom.coef.ky

                brush_zoom_link('top-bottom', {
                    brush: reserved.brush,
                    zoom: reserved.zoom,
                })
                brush_zoom_link('left-right', {
                    brush: reserved.brush,
                    zoom: reserved.zoom,
                })
                reserved.brush.meta.x = 0
                reserved.brush.meta.y = 0
            })
        let drag_trans = d3.drag()
            .on('start', function() {})
            .on('drag', function() {
                reserved.brush.meta.x = d3.event.dx
                reserved.brush.meta.y = d3.event.dy

                computeDragFactor()

                brush_zoom_link('top-bottom', {
                    brush: reserved.brush,
                    zoom: reserved.zoom,
                })
                brush_zoom_link('left-right', {
                    brush: reserved.brush,
                    zoom: reserved.zoom,
                })
            })
            .on('end', function() {
                reserved.brush.meta.x = 0
                reserved.brush.meta.y = 0
            })

        switch (reserved.brush.behavior) {
        case 'zoom_rect':
            reserved.clipping.maing
                .call(rect_zoom)
            break
        case 'drag_trans':
            reserved.clipping.maing
                .call(drag_trans)
            break
        default:
            reserved.clipping.maing
                .call(drag_trans)

        }
    }
    function init_zoom() {
        if (!reserved.zoom.enabled) {
            return
        }

        function computeZoomFactorkx() {
            reserved.zoom.coef.kx = 1 / reserved.zoom.meta.kx.now

            let ratio = [ reserved.zoom.meta.kx.point[0] / reserved.zoom.meta.x.max, 0 ]
            let offset = {
                x:
        (reserved.zoom.meta.x.max
          - reserved.zoom.meta.x.max * (1 / reserved.zoom.meta.kx.now)
          - (reserved.zoom.meta.x.max
          - reserved.zoom.meta.x.max * (1 / reserved.zoom.meta.kx.previous)))
        * ratio[0],
            }

            reserved.zoom.coef.x = reserved.zoom.coef.x + offset.x + reserved.brush.meta.x
            if (reserved.zoom.coef.x < 0) {
                reserved.zoom.coef.x = 0
            }
            let right
          = reserved.zoom.coef.x
          + reserved.zoom.meta.x.max * (1 / reserved.zoom.meta.kx.now)
            if (right > reserved.zoom.meta.x.max) {
                reserved.zoom.coef.x
              = reserved.zoom.coef.x - (right - reserved.zoom.meta.x.max)
            }
        }
        function computeZoomFactorky() {
            reserved.zoom.coef.ky = 1 / reserved.zoom.meta.ky.now

            let ratio = [ 0, reserved.zoom.meta.ky.point[1] / reserved.zoom.meta.y.max ]
            let offset = {
                y:
              (reserved.zoom.meta.y.max
              - reserved.zoom.meta.y.max * (1 / reserved.zoom.meta.ky.now)
              - (reserved.zoom.meta.y.max
              - reserved.zoom.meta.y.max
              * (1 / reserved.zoom.meta.ky.previous)))
              * ratio[1],
            }

            reserved.zoom.coef.y = reserved.zoom.coef.y + offset.y + reserved.brush.meta.y
            if (reserved.zoom.coef.y < 0) {
                reserved.zoom.coef.y = 0
            }
            let bottom
          = reserved.zoom.coef.y
          + reserved.zoom.meta.y.max
          * (1 / reserved.zoom.meta.ky.now)
            if (bottom > reserved.zoom.meta.y.max) {
                reserved.zoom.coef.y
              = reserved.zoom.coef.y - (bottom - reserved.zoom.meta.y.max)
            }
        }

        reserved.clipping.maing
            .on('mouseover', function() {
                d3.select(this).style('cursor', 'crosshair')
            })
            .on('mouseout', function() {
                d3.select(this).style('cursor', 'default')
            })

        reserved.clipping.maing
            .on('wheel', function() {
                d3.event.preventDefault()

                // VERTICAL ZOOM
                reserved.zoom.meta.ky.point = d3.mouse(d3.select(this).node())
                let sign = -Math.abs(d3.event.deltaY) / d3.event.deltaY
                reserved.zoom.meta.ky.previous = reserved.zoom.meta.ky.now
                reserved.zoom.meta.ky.now
                  += sign * Math.log(Math.abs(d3.event.deltaY)) * 0.02
                if (reserved.zoom.meta.ky.now < reserved.zoom.meta.ky.min) {
                    reserved.zoom.meta.ky.now = reserved.zoom.meta.ky.min
                }
                if (reserved.zoom.meta.ky.now > reserved.zoom.meta.ky.max) {
                    reserved.zoom.meta.ky.now = reserved.zoom.meta.ky.max
                }
                computeZoomFactorky()

                // HORIZONTAL ZOOM
                reserved.zoom.meta.kx.point = d3.mouse(d3.select(this).node())
                sign = -Math.abs(d3.event.deltaY) / d3.event.deltaY
                reserved.zoom.meta.kx.previous = reserved.zoom.meta.kx.now

                reserved.zoom.meta.kx.now
                  += sign * Math.log(Math.abs(d3.event.deltaY)) * 0.02
                if (reserved.zoom.meta.kx.now < reserved.zoom.meta.kx.min) {
                    reserved.zoom.meta.kx.now = reserved.zoom.meta.kx.min
                }
                if (reserved.zoom.meta.kx.now > reserved.zoom.meta.kx.max) {
                    reserved.zoom.meta.kx.now = reserved.zoom.meta.kx.max
                }
                computeZoomFactorkx()

                brush_zoom_link('top-bottom', {
                    brush: reserved.brush,
                    zoom: reserved.zoom,
                })
                brush_zoom_link('left-right', {
                    brush: reserved.brush,
                    zoom: reserved.zoom,
                })

                console.log(reserved.zoom, reserved.brush)
            })
    }
    function set_brush_zoom_factor(new_brush_zoom_factor) {
        reserved.zoom.coef = new_brush_zoom_factor.zoom.coef
        reserved.zoom.meta = new_brush_zoom_factor.zoom.meta
        reserved.brush.coef = new_brush_zoom_factor.brush.coef
        reserved.brush.meta = new_brush_zoom_factor.brush.meta
    }
    this.set_brush_zoom_factor = set_brush_zoom_factor
    function set_brush_zoom_factor_horizontal(new_brush_zoom_factor) {
        reserved.zoom.coef.x = new_brush_zoom_factor.zoom.coef.x
        reserved.zoom.coef.kx = new_brush_zoom_factor.zoom.coef.kx
        reserved.zoom.meta.x = new_brush_zoom_factor.zoom.meta.x
        reserved.zoom.meta.kx = new_brush_zoom_factor.zoom.meta.kx
        reserved.brush.coef.x = new_brush_zoom_factor.brush.coef.x
        reserved.brush.meta.x = new_brush_zoom_factor.brush.meta.x
    }
    this.set_brush_zoom_factor_horizontal = set_brush_zoom_factor_horizontal
    function set_brush_zoom_factor_vertical(new_brush_zoom_factor) {
        console.log(new_brush_zoom_factor)
        reserved.zoom.coef.y = new_brush_zoom_factor.zoom.coef.y
        reserved.zoom.coef.ky = new_brush_zoom_factor.zoom.coef.ky
        reserved.zoom.meta.y = new_brush_zoom_factor.zoom.meta.y
        reserved.zoom.meta.ky = new_brush_zoom_factor.zoom.meta.ky
        reserved.brush.coef.y = new_brush_zoom_factor.brush.coef.y
        reserved.brush.meta.y = new_brush_zoom_factor.brush.meta.y
    }
    this.set_brush_zoom_factor_vertical = set_brush_zoom_factor_vertical

    function init_plotline(data) {
        {
            let default_plotline = {
                shape: [ 'circle', 'triangle_up', 'triangle_down', 'square', 'diamond', 'cross' ],
                shape_size: Math.round(Math.random() * 4),
                shape_color: [ '#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2' ][Math.round(Math.random() * 10)],
                line_color: [ '#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2' ][Math.round(Math.random() * 10)],
            }
            return window.merge_obj(default_plotline, data)
        }
    }
    function init_scatterplot(data) {
        let default_scatterplot = {
            shape: [ 'circle', 'triangle_up', 'triangle_down', 'square', 'diamond', 'cross' ],
            shape_size: Math.round(Math.random() * 4),
            shape_color: [ '#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2' ][Math.round(Math.random() * 10)],
        }
        return window.merge_obj(default_scatterplot, data)
    }
    function init_barchart(data) {
        let default_barchart = {
            shape: 'circle',
            shape_size: 3,
        }
        return window.merge_obj(default_barchart, data)
    }
    function init_heatmap(data) {
        let default_heatmap = {
            shape: 'circle',
            shape_size: 3,
        }
        return window.merge_obj(default_heatmap, data)
    }

    function draw_plotline(data) {
        function draw_caption() {

        }

        let current = reserved.main.g
            .select('#bindedData')
            .select('g#' + data.id)
        if (current.empty()) {
            current = reserved.main.g
                .select('#bindedData')
                .append('g')
                .attr('id', data.id)
        }
        if (current.select('path#plot_path').empty()) {
            current.append('path')
                .attr('id', 'plot_path')
                .attr('fill', 'none')
                .attr('stroke', data.line_color)
                .attr('stroke-width', 1.5)
        }
        if (current.select('g#inner_dots').empty()) {
            current.append('g')
                .attr('id', 'inner_dots')
        }
        let axis_x = get_axis(data.axis_x).axis.get_axis().scale
        let axis_y = get_axis(data.axis_y).axis.get_axis().scale
        current.select('path#plot_path')
            .attr('d', function() {
                let line_function = d3
                    .line()
                    .x(function(d) {
                        return axis_x(d.x)
                    })
                    .y(function(d) {
                        return axis_y(d.y)
                    })
                return line_function(data.data)
            })

        let all_dots = current.select('g#inner_dots')
            .selectAll('path.inner_dot')
            .data(data.data)
        let enter_dots = all_dots.enter()
            .append('path')
            .attr('class', 'inner_dot')
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.2)
            .attr('fill', data.shape_color)
        all_dots.merge(enter_dots)
            .attr('d', function(d) {
                return dot_fun[data.shape](
                    axis_x(d.x),
                    axis_y(d.y),
                    data.shape_size)
            })
    }
    function draw_scatterplot(data) {
        function draw_caption() {

        }

        let current = reserved.main.g
            .select('#bindedData')
            .select('g#' + data.id)
        if (current.empty()) {
            current = reserved.main.g
                .select('#bindedData')
                .append('g')
                .attr('id', data.id)
        }
        if (current.select('g#inner_dots').empty()) {
            current.append('g')
                .attr('id', 'inner_dots')
        }

        let axis_x = get_axis(data.axis_x).axis.get_axis().scale
        let axis_y = get_axis(data.axis_y).axis.get_axis().scale

        let all_dots = current.select('g#inner_dots')
            .selectAll('path.inner_dot')
            .data(data.data)
        let enter_dots = all_dots.enter()
            .append('path')
            .attr('class', 'inner_dot')
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.2)
            .attr('fill', data.shape_color)
        all_dots.merge(enter_dots)
            .attr('d', function(d) {
                let axis = {
                    x: axis_x(d.x),
                    y: axis_y(d.y),
                }
                if (axis.x < 0) {
                    axis.x = 0
                }
                else if (axis.x > reserved.main.box.w) {
                    axis.x = reserved.main.box.w
                }
                if (axis.y < 0) {
                    axis.y = 0
                }
                else if (axis.y > reserved.main.box.h) {
                    axis.y = reserved.main.box.h
                }
                return dot_fun[data.shape](
                    axis.x,
                    axis.y,
                    data.shape_size * reserved.zoom.meta.kx.now)
            })
            //.attr('transform', 'scale(' + reserved.zoom.meta.kx.now + ',' + reserved.zoom.meta.ky.now + ')')
    }
    function draw_barchart(data) {
        function draw_caption() {

        }
    }
    function draw_heatmap(data) {
        function draw_caption() {

        }

        let current = reserved.main.g
            .select('#bindedData')
            .select('g#' + data.id)
        if (current.empty()) {
            current = reserved.main.g
                .select('#bindedData')
                .append('g')
                .attr('id', data.id)
        }
        if (current.select('g#inner_rects').empty()) {
            current.append('g')
                .attr('id', 'inner_rects')
        }

        let axis_x = get_axis(data.axis_x).axis.get_axis().scale
        let axis_y = get_axis(data.axis_y).axis.get_axis().scale

        let ticks_values_X = get_axis(data.axis_x).axis.get_axis().axis.tickValues()
        let ticks_values_Y = get_axis(data.axis_y).axis.get_axis().axis.tickValues()

        var merge_ticks = []
        for (let i = 0; i < ticks_values_X.length; i++) {
            for (let j = 0; j < ticks_values_Y.length; j++) {
                merge_ticks.push({
                    x: ticks_values_X[i],
                    y: ticks_values_Y[j],
                })
            }
        }

        let all_rects = current.select('g#inner_rects')
            .selectAll('rect.inner_rect')
            .data(data.data)
        let enter_rects = all_rects.enter()
            .append('rect')
            .attr('class', 'inner_rect')
            .attr('fill', 'blue')
            .attr('stroke-width', 0)
            .style('opacity', 0.05)
        all_rects.merge(enter_rects)
            // .attr('x', d => axis_x(d.x) - (axis_x(d.x) % tickDistanceX))
            .attr('x', function(d) {
                for (let i = 0; i < ticks_values_X.length - 1; i++) {
                    if (d.x > ticks_values_X[i] && d.x < ticks_values_X[i + 1]) {
                        return axis_x(ticks_values_X[i])
                    }
                }
                return 0
            })
            .attr('y', function(d) {
                for (let i = 0; i < ticks_values_Y.length - 1; i++) {
                    if (d.y > ticks_values_Y[i] && d.y < ticks_values_Y[i + 1]) {
                        return axis_y(ticks_values_Y[i + 1])
                    }
                }
                return 0
            })
            .attr('width', function(d) {
                for (let i = 0; i < ticks_values_X.length - 1; i++) {
                    if (d.x > ticks_values_X[i] && d.x < ticks_values_X[i + 1]) {
                        return Math.abs(axis_x(ticks_values_X[i]) - axis_x(ticks_values_X[i + 1]))
                    }
                }
                return 0
            })
            .attr('height', function(d) {
                for (let i = 0; i < ticks_values_Y.length - 1; i++) {
                    if (d.y > ticks_values_Y[i] && d.y < ticks_values_Y[i + 1]) {
                        return Math.abs(axis_y(ticks_values_Y[i]) - axis_y(ticks_values_Y[i + 1]))
                    }
                }
                return 0
            })

    }
    let plot_fun = {
        scatterplot: {
            init: init_scatterplot,
            draw: draw_scatterplot,
        },
        plotline: {
            init: init_plotline,
            draw: draw_plotline,
        },
        heatmap: {
            init: init_heatmap,
            draw: draw_heatmap,
        },
        barchart: {
            init: init_barchart,
            draw: draw_barchart,
        },
    }

    function add_data(data) {
        let toBind = true
        if (!data || !data.drawing_method) {
            return
        }
        data = plot_fun[data.drawing_method].init(data)

        for (let i = 0; i < reserved.content.length; i++) {
            if (reserved.content[i].id === data.id) {
                reserved.content[i] = data
                toBind = false
                break
            }
        }
        if (toBind) {
            reserved.content.push(data)
        }

        plot_fun[data.drawing_method].draw(data)
    }
    this.add_data = add_data
    function remove_data(id) {
        for (let i = 0; i < reserved.content.length; i++) {
            if (reserved.content[i].id === id) {
                reserved.content.splice(i, 1)
                break
            }
        }
        reserved.clipping.maing
            .select('#bindedData')
            .select('g#' + id)
            .remove()
    }
    this.remove_data = remove_data
    function update_data(opt_in) {
        for (let i = 0; i < reserved.content.length; i++) {
            plot_fun[reserved.content[i].drawing_method].draw(reserved.content[i])
        }
    }
    this.update_data = update_data
    function get_data() {
        return reserved.content
    }
    this.get_data = get_data

    let dot_fun = {
        circle: dot_circle,
        triangle_up: dot_triangle_up,
        triangle_down: dot_triangle_down,
        square: dot_square,
        diamond: dot_diamond,
        cross: dot_cross,
    }
    function dot_circle(cx, cy, r) {
        return 'M' + cx + ',' + cy + ' '
             + 'm' + -r + ', 0 '
             + 'a' + r + ',' + r + ' 0 1,0 ' + r * 2 + ',0 '
             + 'a' + r + ',' + r + ' 0 1,0 ' + -r * 2 + ',0Z'
    }
    function dot_triangle_up(x, y, s) {
        return 'M ' + x + ' ' + (y - s)
        + ' l ' + s + ' ' + (2 * s)
        + ' l ' + (-2 * s) + ' ' + 0
        + ' z '
    }
    function dot_triangle_down(x, y, s) {
        return 'M ' + x + ' ' + (y + s)
        + ' l ' + s + ' ' + (-2 * s)
        + ' l ' + (-2 * s) + ' ' + 0
        + ' z '
    }
    function dot_square(x, y, s) {
        return 'M ' + (x - s) + ' ' + (y - s)
        + ' l ' + (2 * s) + ' ' + 0
        + ' l ' + 0 + ' ' + (2 * s)
        + ' l ' + (-2 * s) + ' ' + 0
        + ' z '
    }
    function dot_diamond(x, y, s) {
        return 'M ' + x + ' ' + (y - s)
        + ' l ' + s + ' ' + s
        + ' l ' + -s + ' ' + s
        + ' l ' + -s + ' ' + -s
        + ' z '
    }
    function dot_cross(x, y, s) {
        return 'M ' + (x - s * 0.66) + ' ' + (y - s)
        + ' l ' + (s * 0.66) + ' ' + 0
        + ' l ' + 0 + ' ' + (s * 0.66)
        + ' l ' + (s * 0.66) + ' ' + 0
        + ' l ' + 0 + ' ' + (s * 0.66)
        + ' l ' + (-s * 0.66) + ' ' + 0
        + ' l ' + 0 + ' ' + (s * 0.66)
        + ' l ' + (-s * 0.66) + ' ' + 0
        + ' l ' + 0 + ' ' + (-s * 0.66)
        + ' l ' + (-s * 0.66) + ' ' + 0
        + ' l ' + 0 + ' ' + (-s * 0.66)
        + ' l ' + (s * 0.66) + ' ' + 0
        + ' z '
    }

    function brush_zoom_link(group, factor) {
        if (group === 'top-bottom') {
            for (let i = 0; i < reserved.axis.top.length; i++) {
                reserved.axis.top[i].axis.set_brush_zoom_factor_horizontal(factor)
            }
            for (let i = 0; i < reserved.axis.bottom.length; i++) {
                reserved.axis.bottom[i].axis.set_brush_zoom_factor_horizontal(factor)
            }
        }
        else if (group === 'left-right') {
            for (let i = 0; i < reserved.axis.left.length; i++) {
                reserved.axis.left[i].axis.set_brush_zoom_factor_vertical(factor)
            }
            for (let i = 0; i < reserved.axis.right.length; i++) {
                reserved.axis.right[i].axis.set_brush_zoom_factor_vertical(factor)
            }
        }
        update_data()
    }
    function convert_to_brush_zoom_template(axis) {
        let axis_default = {
            main: {
                g: reserved.main.g.append('g'),
                box: {
                    x: 0,
                    y: 0,
                    w: reserved.main.box.w,
                    h: reserved.main.box.h,
                    marg: 0,
                },
            },
            style: {
                axis: {

                },
            },
            brush: {
                enabled: true,
                coef: {
                    x: 0,
                    y: 0,
                },
                callback: function() {
                    console.log('callback function brush')
                },
            },
            zoom: {
                enabled: true,
                coef: {
                    kx: 1,
                    ky: 1,
                    x: 0,
                    y: 0,
                },
                callback: function() {
                    console.log('callback function zoom')
                },
            },
        }
        let axis_width = 25
        let marg = 5
        if (axis.main.location === 'bottom') {
            axis_default.main.box.y = reserved.main.box.h
              + ((axis_width * reserved.axis.bottom.length)
              + (marg * reserved.axis.bottom.length))
            axis_default.main.box.h = axis_width
            axis_default.style.axis.tickSize = -reserved.main.box.h
        }
        else if (axis.main.location === 'top') {
            axis_default.main.box.y = -(axis_width * (reserved.axis.top.length + 1))
              - (marg * reserved.axis.top.length)
            axis_default.main.box.h = axis_width
            axis_default.style.axis.tickSize = -reserved.main.box.h
        }
        else if (axis.main.location === 'left') {
            axis_default.main.box.x = -(axis_width * (reserved.axis.left.length + 1))
              - (marg * reserved.axis.left.length)
            axis_default.main.box.w = axis_width
            axis_default.style.axis.tickSize = -reserved.main.box.w
        }
        else if (axis.main.location === 'right') {
            axis_default.main.box.x = reserved.main.box.w
              + (axis_width * reserved.axis.right.length
              + marg * reserved.axis.right.length)
            axis_default.main.box.w = axis_width
            axis_default.style.axis.tickSize = -reserved.main.box.w
        }
        let merged_axis = window.merge_obj(axis_default, axis)
        return merged_axis
    }
    function add_axis(axis) {
        let converted_axis = convert_to_brush_zoom_template(axis)
        let brush_zoom_axis = new PlotBrushZoom()
        console.log(converted_axis)
        if (converted_axis.main.location === 'top') {
            converted_axis.zoom.callback = function() {
                let new_brush_zoom = brush_zoom_axis.get_brush_zoom_factor()
                set_brush_zoom_factor_horizontal(new_brush_zoom)
                brush_zoom_link('top-bottom', new_brush_zoom)
            }
            brush_zoom_axis.init(converted_axis)
            reserved.axis.top.push({
                id: converted_axis.main.id,
                axis: brush_zoom_axis,
            })
        }
        else if (converted_axis.main.location === 'bottom') {
            converted_axis.zoom.callback = function() {
                let new_brush_zoom = brush_zoom_axis.get_brush_zoom_factor()
                set_brush_zoom_factor_horizontal(new_brush_zoom)
                brush_zoom_link('top-bottom', new_brush_zoom)
            }
            brush_zoom_axis.init(converted_axis)
            reserved.axis.bottom.push({
                id: converted_axis.main.id,
                axis: brush_zoom_axis,
            })
        }
        else if (converted_axis.main.location === 'left') {
            converted_axis.zoom.callback = function() {
                let new_brush_zoom = brush_zoom_axis.get_brush_zoom_factor()
                set_brush_zoom_factor_vertical(new_brush_zoom)
                brush_zoom_link('left-right', new_brush_zoom)
            }
            brush_zoom_axis.init(converted_axis)
            reserved.axis.left.push({
                id: converted_axis.main.id,
                axis: brush_zoom_axis,
            })
        }
        else if (converted_axis.main.location === 'right') {
            converted_axis.zoom.callback = function() {
                let new_brush_zoom = brush_zoom_axis.get_brush_zoom_factor()
                set_brush_zoom_factor_vertical(new_brush_zoom)
                brush_zoom_link('left-right', new_brush_zoom)
            }
            brush_zoom_axis.init(converted_axis)
            reserved.axis.right.push({
                id: converted_axis.main.id,
                axis: brush_zoom_axis,
            })
        }
    }
    this.add_axis = add_axis
    function remove_axis(axis_id) {}
    this.remove_axis = remove_axis
    function get_axis(axis_id) {
        for (let index = 0; index < reserved.axis.bottom.length; index++) {
            if (reserved.axis.bottom[index].id === axis_id) {
                return reserved.axis.bottom[index]
            }
        }
        for (let index = 0; index < reserved.axis.left.length; index++) {
            if (reserved.axis.left[index].id === axis_id) {
                return reserved.axis.left[index]
            }
        }
        for (let index = 0; index < reserved.axis.top.length; index++) {
            if (reserved.axis.top[index].id === axis_id) {
                return reserved.axis.top[index]
            }
        }
        for (let index = 0; index < reserved.axis.right.length; index++) {
            if (reserved.axis.right[index].id === axis_id) {
                return reserved.axis.right[index]
            }
        }
        return undefined
    }
    this.get_axis = get_axis
    function get_all_axis() {
        return reserved.axis.bottom
            .concat(reserved.axis.top)
            .concat(reserved.axis.left)
            .concat(reserved.axis.right)
    }
    this.get_all_axis = get_all_axis
    function update_axis(axis) {
        let index = 0
        for (index; index < reserved.axis.length; index++) {
            if (reserved.axis[index].id === axis.id) {
                if (axis.range) {
                    reserved.axis[index].range = axis.range
                }
                if (axis.domain) {
                    reserved.axis[index].domain = axis.domain
                }
                if (axis.box) {
                    reserved.axis[index].box = axis.box
                }
                if (axis.tickSize) {
                    reserved.axis[index].style.axis.tickSize = axis.tickSize
                }
                break
            }
        }
        reserved.axis[index].meta.scale
            .domain(reserved.axis[index].domain)
            .range(reserved.axis[index].range)

        if (reserved.axis[index].location === 'bottom') {
            reserved.axis[index].meta.g.attr(
                'transform',
                'translate('
              + reserved.axis[index].box.x
              + ','
              + (reserved.axis[index].box.y
                + reserved.axis[index].box.h)
                + ')'
            )
        }
        else if (reserved.axis[index].location === 'top') {
            reserved.axis[index].meta.g.attr(
                'transform',
                'translate('
              + reserved.axis[index].box.x
              + ','
              + reserved.axis[index].box.y
              + ')'
            )
        }
        else if (reserved.axis[index].location === 'right') {
            reserved.axis[index].meta.g.attr(
                'transform',
                'translate('
              + (reserved.axis[index].box.x
                + reserved.axis[index].box.w)
                + ','
                + reserved.axis[index].box.y
                + ')'
            )
        }
        else if (reserved.axis[index].location === 'left') {
            reserved.axis[index].meta.g.attr(
                'transform',
                'translate('
              + (reserved.axis[index].box.x)
              + ','
              + reserved.axis[index].box.y
              + ')'
            )
        }

        // core_axis(index)
        // applyZoomBrush(reserved.axis[index])

        // if (!reserved.axis[index].enabled) return
    }
    this.update_axis = update_axis

    function getClipping() {
        return reserved.clipping.maing
    }
    this.getClipping = getClipping
    function update_box(box) {
        reserved.main.box = box
        reserved.main.g.attr('transform',
            'translate(' + reserved.main.box.x + ',' + reserved.main.box.y + ')')
        reserved.clipping.g.select('#clip-rect')
            .attr('width', reserved.main.box.w)
            .attr('height', reserved.main.box.h)
    }
    this.update_box = update_box
}
