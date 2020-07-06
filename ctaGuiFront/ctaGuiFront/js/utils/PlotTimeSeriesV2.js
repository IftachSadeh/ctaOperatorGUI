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


        init_axis()
        init_interaction()
        init_clipping()
        init_zoom()

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
            return
        }
        reserved.clipping = {
        }
        reserved.clipping.g = reserved.main.g.append('g')
        reserved.clipping.g
            .append('defs')
            .append('svg:clipPath')
            .attr('id', 'clip')
            .append('svg:rect')
            .attr('id', 'clip-rect')
            .attr('x', '0')
            .attr('y', '0')
            .attr('width', reserved.main.box.w)
            .attr('height', reserved.main.box.h)
        reserved.clipping.clipBody = reserved.clipping.g
            .append('g')
            .attr('clip-path', 'url(#clip)')
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
    function init_zoom() {
        if (!reserved.zoom) {
            reserved.zoom = {
                enabled: true,
                coef: {
                    kx: 1,
                    ky: 1,
                    x: 0,
                    y: 0,
                },
            }
        }
        if (!reserved.brush) {
            reserved.brush = {
                enabled: true,
                coef: {
                    x: 0,
                    y: 0,
                },
            }
        }
        reserved.zoom.meta = {
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
        }
        reserved.brush.meta = {
            x: 0,
            y: 0,
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

            })
            // .call(
            //     d3
            //         .drag()
            //         .on('start', function() {})
            //         .on('drag', function() {
            //             reserved.brush.meta.x = d3.event.dx
            //             reserved.brush.meta.y = d3.event.dy
            //
            //             computeDragFactor()
            //             updateFocus()
            //             updateAxis()
            //             reserved.zoom.callback()
            //         })
            //         .on('end', function() {
            //             reserved.brush.meta.x = 0
            //             reserved.brush.meta.y = 0
            //         })
            // )
    }

    function add_data(id, data, axisX, axisY) {
        let toBind = true
        for (let i = 0; i < reserved.content.length; i++) {
            if (reserved.content[i].id === id) {
                reserved.content[i] = {
                    id: id,
                    data: data,
                    axisX: axisX,
                    axisY: axisY,
                }
                toBind = false
                break
            }
        }
        if (toBind) {
            let new_bind = {
                id: id,
                data: data,
                axisX: axisX,
                axisY: axisY,
            }
            reserved.content.push(new_bind)
        }
        switch (reserved.content[reserved.content.length - 1].data.drawing_method) {
        case 'scatterplot':
            reserved.content[reserved.content.length - 1].data.scatterplot = {
                shape: 'circle',
                shape_size: 3,
            }
            draw_scatterplot(reserved.content[reserved.content.length - 1])
            break
        case 'plotline':
            reserved.content[reserved.content.length - 1].data.plotline = {
                shape: 'diamond',
                shape_size: 3,
            }
            draw_plotline(reserved.content[reserved.content.length - 1])
            break
        case 'barchart':
            reserved.content[reserved.content.length - 1].data.barchart = {
                shape: 'circle',
                shape_size: 3,
            }
            draw_barchart(reserved.content[reserved.content.length - 1])
            break
        case 'heatmap':
            // reserved.content[reserved.content.length - 1].data.heatmap = {
            //     shape: 'circle',
            //     shape_size: 3,
            // }
            draw_heatmap(reserved.content[reserved.content.length - 1])
            break
        default:

        }
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
            switch (reserved.content[i].data.drawing_method) {
            case 'scatterplot':
                draw_scatterplot(reserved.content[i])
                break
            case 'plotline':
                draw_plotline(reserved.content[i])
                break
            case 'barchart':
                draw_barchart(reserved.content[i])
                break
            case 'heatmap':
                draw_heatmap(reserved.content[i])
                break
            default:

            }
        }
        return
        for (let i = 0; i < reserved.content.length; i++) {
            let binded = reserved.content[i]
            let axisX = get_axis(binded.axisX).axis.getAxis().axis1.scale
            let axisY = get_axis(binded.axisY).axis.getAxis().axis1.scale
            reserved.clipping.maing
                .select('g#' + binded.id)
                .select('path')
                .attr('d', function(d) {
                    let line_function = d3
                        .line()
                        .x(function(d) {
                            return axisX(d.x)
                        })
                        .y(function(d) {
                            return axisY(d.y)
                        })
                    return line_function(d.data.data)
                }
                )
            reserved.clipping.maing
                .select('g#' + binded.id)
                .selectAll('circle')
                .attr('cx', d => axisX(d.x))
                .attr('cy', d => axisY(d.y))
        }
    }
    this.update_data = update_data

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
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 1.5)
        }
        if (current.select('g#inner_dots').empty()) {
            current.append('g')
                .attr('id', 'inner_dots')
        }

        let axisX = get_axis(data.axisX).axis.getAxis().axis1.scale
        let axisY = get_axis(data.axisY).axis.getAxis().axis1.scale
        current.select('path#plot_path')
            .attr('d', function() {
                let line_function = d3
                    .line()
                    .x(function(d) {
                        return axisX(d.x)
                    })
                    .y(function(d) {
                        return axisY(d.y)
                    })
                return line_function(data.data.data)
            })

        let all_dots = current.select('g#inner_dots')
            .selectAll('path.inner_dot')
            .data(data.data.data)
        let enter_dots = all_dots.enter()
            .append('path')
            .attr('class', 'inner_dot')
            .attr('fill', colorPalette.dark.stroke)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.2)
        all_dots.merge(enter_dots)
            .attr('d', function(d) {
                switch (data.data.plotline.shape) {
                case 'circle':
                    return dot_circle(
                        axisX(d.x),
                        axisY(d.y),
                        data.data.plotline.shape_size)
                case 'square':
                    return dot_square(
                        axisX(d.x),
                        axisY(d.y),
                        data.data.plotline.shape_size)
                case 'triangle_up':
                    return dot_triangle_up(
                        axisX(d.x),
                        axisY(d.y),
                        data.data.plotline.shape_size)
                case 'triangle_down':
                    return dot_triangle_down(
                        axisX(d.x),
                        axisY(d.y),
                        data.data.plotline.shape_size)
                case 'diamond':
                    return dot_diamond(
                        axisX(d.x),
                        axisY(d.y),
                        data.data.plotline.shape_size)
                default:
                    return ''
                }
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

        let axisX = get_axis(data.axisX).axis.getAxis().axis1.scale
        let axisY = get_axis(data.axisY).axis.getAxis().axis1.scale

        let all_dots = current.select('g#inner_dots')
            .selectAll('path.inner_dot')
            .data(data.data.data)
        let enter_dots = all_dots.enter()
            .append('path')
            .attr('class', 'inner_dot')
            .attr('fill', colorPalette.dark.stroke)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.2)
        all_dots.merge(enter_dots)
            .attr('d', function(d) {
                switch (data.data.scatterplot.shape) {
                case 'circle':
                    return dot_circle(
                        axisX(d.x),
                        axisY(d.y),
                        data.data.scatterplot.shape_size)
                case 'square':
                    return dot_square(
                        axisX(d.x),
                        axisY(d.y),
                        data.data.scatterplot.shape_size)
                case 'triangle_up':
                    return dot_triangle_up(
                        axisX(d.x),
                        axisY(d.y),
                        data.data.scatterplot.shape_size)
                case 'triangle_down':
                    return dot_triangle_down(
                        axisX(d.x),
                        axisY(d.y),
                        data.data.scatterplot.shape_size)
                case 'diamond':
                    return dot_diamond(
                        axisX(d.x),
                        axisY(d.y),
                        data.data.scatterplot.shape_size)
                default:
                    return ''
                }
            })
    }
    function draw_barchart() {
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

        let axisX = get_axis(data.axisX).axis.getAxis().axis1.scale
        let axisY = get_axis(data.axisY).axis.getAxis().axis1.scale

        let ticks_values_X = get_axis(data.axisX).axis.getAxis().axis1.axis.tickValues()
        let ticks_values_Y = get_axis(data.axisY).axis.getAxis().axis1.axis.tickValues()

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
            .data(data.data.data)
        let enter_rects = all_rects.enter()
            .append('rect')
            .attr('class', 'inner_rect')
            .attr('fill', 'blue')
            .attr('stroke-width', 0)
            .style('opacity', 0.05)
        all_rects.merge(enter_rects)
            // .attr('x', d => axisX(d.x) - (axisX(d.x) % tickDistanceX))
            .attr('x', function(d) {
                for (let i = 0; i < ticks_values_X.length - 1; i++) {
                    if (d.x > ticks_values_X[i] && d.x < ticks_values_X[i + 1]) {
                        return axisX(ticks_values_X[i])
                    }
                }
                return 0
            })
            .attr('y', function(d) {
                for (let i = 0; i < ticks_values_Y.length - 1; i++) {
                    if (d.y > ticks_values_Y[i] && d.y < ticks_values_Y[i + 1]) {
                        return axisY(ticks_values_Y[i + 1])
                    }
                }
                return 0
            })
            .attr('width', function(d) {
                for (let i = 0; i < ticks_values_X.length - 1; i++) {
                    if (d.x > ticks_values_X[i] && d.x < ticks_values_X[i + 1]) {
                        return Math.abs(axisX(ticks_values_X[i]) - axisX(ticks_values_X[i + 1]))
                    }
                }
                return 0
            })
            .attr('height', function(d) {
                for (let i = 0; i < ticks_values_Y.length - 1; i++) {
                    if (d.y > ticks_values_Y[i] && d.y < ticks_values_Y[i + 1]) {
                        return Math.abs(axisY(ticks_values_Y[i]) - axisY(ticks_values_Y[i + 1]))
                    }
                }
                return 0
            })

    }

    function brush_zoom_link(group, factor) {
        if (group === 'top-bottom') {
            for (let i = 0; i < reserved.axis.top.length; i++) {
                reserved.axis.top[i].axis.set_brush_zoom_factor(factor)
            }
            for (let i = 0; i < reserved.axis.bottom.length; i++) {
                reserved.axis.bottom[i].axis.set_brush_zoom_factor(factor)
            }
        }
        else if (group === 'left-right') {
            for (let i = 0; i < reserved.axis.left.length; i++) {
                reserved.axis.left[i].axis.set_brush_zoom_factor(factor)
            }
            for (let i = 0; i < reserved.axis.right.length; i++) {
                reserved.axis.right[i].axis.set_brush_zoom_factor(factor)
            }
        }
        update_data()
    }
    function convert_to_brush_zoom_template(axis) {
        let axis_default = {
            g: reserved.main.g.append('g'),
            id: 'bottom',
            scale_location: 'bottom',
            scale_type: 'time',
            box: {
                x: 0,
                y: 0,
                w: reserved.main.box.w,
                h: reserved.main.box.h,
                marg: 0,
            },
            style: {
                text: {
                    visible: true,
                    size: 11,
                    stroke: colorPalette.medium.stroke,
                    fill: colorPalette.medium.stroke,
                },
                path: {
                    visible: true,
                    stroke: colorPalette.medium.stroke,
                    fill: colorPalette.medium.stroke,
                },
                axis: {
                    visible: true,
                    tickSize: 0,
                },
            },
            domain: [ 0, 1000 ],
            range: [ 0, 0 ],
            clipping: {
                enabled: false,
            },
            content: {
                enabled: false,
                track: 'b2',
                style: {
                    fill: colorPalette.medium.background,
                    opacity: 1,
                    stroke: colorPalette.medium.background,
                },
            },
            focus: {
                enabled: true,
                track: 'b1',
                style: {
                    fill: colorPalette.darkest.background,
                    opacity: 1,
                    stroke: colorPalette.darkest.background,
                },
            },
            axis1: {
                enabled: true,
                location: 'a1',
                orientation: 'out',
            },
            axis2: {
                enabled: false,
                location: 'a3',
                orientation: 'in',
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
        let axis_width = 50
        let marg = 5
        if (axis.scale_location === 'bottom') {
            axis_default.box.y = reserved.main.box.h + ((axis_width * reserved.axis.bottom.length) + (marg * reserved.axis.bottom.length))
            axis_default.box.h = axis_width
            axis_default.style.axis.tickSize = -reserved.main.box.h
        }
        else if (axis.scale_location === 'top') {
            axis_default.box.y = -(axis_width * (reserved.axis.top.length + 1)) - (marg * reserved.axis.top.length)
            axis_default.box.h = axis_width
            axis_default.style.axis.tickSize = -reserved.main.box.h
        }
        else if (axis.scale_location === 'left') {
            axis_default.box.x = -(axis_width * (reserved.axis.left.length + 1)) - (marg * reserved.axis.left.length)
            axis_default.box.w = axis_width
            axis_default.style.axis.tickSize = -reserved.main.box.w
        }
        else if (axis.scale_location === 'right') {
            axis_default.box.x = reserved.main.box.w + (axis_width * reserved.axis.right.length + marg * reserved.axis.right.length)
            axis_default.box.w = axis_width
            axis_default.style.axis.tickSize = -reserved.main.box.w
        }
        let merged_axis = window.merge_obj(axis_default, axis)
        return merged_axis
    }
    function add_axis(axis) {
        let converted_axis = convert_to_brush_zoom_template(axis)

        let brush_zoom_axis = new PlotBrushZoom()

        if (axis.scale_location === 'top') {
            converted_axis.zoom.callback = function() {
                brush_zoom_link('top-bottom', brush_zoom_axis.get_brush_zoom_factor())
            }
            brush_zoom_axis.init(converted_axis)
            reserved.axis.top.push({
                id: axis.id,
                axis: brush_zoom_axis,
            })
        }
        else if (axis.scale_location === 'bottom') {
            converted_axis.zoom.callback = function() {
                brush_zoom_link('top-bottom', brush_zoom_axis.get_brush_zoom_factor())
            }
            brush_zoom_axis.init(converted_axis)
            reserved.axis.bottom.push({
                id: axis.id,
                axis: brush_zoom_axis,
            })
        }
        else if (axis.scale_location === 'left') {
            converted_axis.zoom.callback = function() {
                brush_zoom_link('left-right', brush_zoom_axis.get_brush_zoom_factor())
            }
            brush_zoom_axis.init(converted_axis)
            reserved.axis.left.push({
                id: axis.id,
                axis: brush_zoom_axis,
            })
        }
        else if (axis.scale_location === 'right') {
            converted_axis.zoom.callback = function() {
                brush_zoom_link('left-right', brush_zoom_axis.get_brush_zoom_factor())
            }
            brush_zoom_axis.init(converted_axis)
            reserved.axis.right.push({
                id: axis.id,
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
    function updateAxis(axis) {
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

        if (reserved.axis[index].scale_location === 'bottom') {
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
        else if (reserved.axis[index].scale_location === 'top') {
            reserved.axis[index].meta.g.attr(
                'transform',
                'translate('
              + reserved.axis[index].box.x
              + ','
              + reserved.axis[index].box.y
              + ')'
            )
        }
        else if (reserved.axis[index].scale_location === 'right') {
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
        else if (reserved.axis[index].scale_location === 'left') {
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
    this.updateAxis = updateAxis

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
