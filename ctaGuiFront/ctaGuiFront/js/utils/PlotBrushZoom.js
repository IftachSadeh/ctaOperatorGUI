/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global get_color_theme */
/* global deep_copy */

window.PlotBrushZoom = function() {
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
        axis: [
            {
                id: 'top',
                enabled: true,
                main: {
                    g: undefined,
                    box: {
                        x: 0,
                        y: 0,
                        w: 0,
                        h: 0,
                        marg: 0,
                    },
                    type: 'top',
                    attr: {
                        text: {
                            enabled: true,
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
                range: [ 0, 0 ],
                brush: {
                    zoom: true,
                    brush: true,
                },
            },
            {
                id: 'bottom',
                enabled: true,
                main: {
                    g: undefined,
                    box: {
                        x: 0,
                        y: 0,
                        w: 0,
                        h: 0,
                        marg: 0,
                    },
                    type: 'bottom',
                    attr: {
                        text: {
                            enabled: true,
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
                range: [ 0, 0 ],
                brush: {
                    zoom: true,
                    brush: true,
                },
            },
        ],
        content: {
            main: {
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    marg: 0,
                },
            },
        },
        focus: {
            enabled: true,
            main: {
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    marg: 0,
                },
                attr: {
                    fill: '#999999',
                    stroke: '#000000',
                },
            },
        },
        brush: {
            position: {
                x: 0,
                y: 0,
            },
            callback: () => {},
        },
        zoom: {
            coef: {
                x: 1,
                y: 1,
            },
            callback: () => {},
        },
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
        reserved.g.attr(
            'transform',
            'translate(' + reserved.box.x + ',' + reserved.box.y + ')'
        )

        init_clipping()
        init_axis_brush_boxes()
        initFocus()
        initContent()
        init_zoom()
        initAxis()
    }
    this.init = init

    function init_clipping() {
        if (!reserved.clipping.enabled) {
            return
        }
        reserved.clipping.g = reserved.g.append('g')
        reserved.clipping.g
            .append('defs')
            .append('svg:clipPath')
            .attr('id', 'clip')
            .append('svg:rect')
            .attr('id', 'clip-rect')
            .attr('x', '0')
            .attr('y', '0')
            .attr('width', reserved.box.w)
            .attr('height', reserved.box.h)
        reserved.clipping.clipBody = reserved.clipping.g
            .append('g')
            .attr('clip-path', 'url(#clip)')
        reserved.g = reserved.clipping.clipBody.append('g')
    }
    function init_axis_brush_boxes() {
        function left_boxes() {
            reserved.boxes.a1 = {
                x: reserved.box.w,
                y: 0,
                w: 0,
                h: reserved.box.h,
            }
            reserved.boxes.a2 = {
                x: reserved.box.w * 0.5,
                y: 0,
                w: 0,
                h: reserved.box.h,
            }
            reserved.boxes.a3 = {
                x: 0,
                y: 0,
                w: 0,
                h: reserved.box.h,
            }
            reserved.boxes.b1 = {
                x: reserved.box.w * 0.5,
                y: 0,
                w: reserved.box.w * 0.5,
                h: reserved.box.h,
            }
            reserved.boxes.b2 = {
                x: 0,
                y: 0,
                w: reserved.box.w * 0.5,
                h: reserved.box.h,
            }
        }
        function right_boxes() {
            reserved.boxes.a1 = {
                x: 0,
                y: 0,
                w: 0,
                h: reserved.box.h,
            }
            reserved.boxes.a2 = {
                x: reserved.box.w * 0.5,
                y: 0,
                w: 0,
                h: reserved.box.h,
            }
            reserved.boxes.a3 = {
                x: reserved.box.w,
                y: 0,
                w: 0,
                h: reserved.box.h,
            }
            reserved.boxes.b1 = {
                x: 0,
                y: 0,
                w: reserved.box.w * 0.5,
                h: reserved.box.h,
            }
            reserved.boxes.b2 = {
                x: reserved.box.w * 0.5,
                y: 0,
                w: reserved.box.w * 0.5,
                h: reserved.box.h,
            }
        }
        function top_boxes() {
            reserved.boxes.a1 = {
                x: 0,
                y: reserved.box.h,
                w: reserved.box.w,
                h: 0,
            }
            reserved.boxes.a2 = {
                x: 0,
                y: reserved.box.h * 0.5,
                w: reserved.box.w,
                h: 0,
            }
            reserved.boxes.a3 = {
                x: 0,
                y: 0,
                w: reserved.box.w,
                h: 0,
            }
            reserved.boxes.b1 = {
                x: 0,
                y: reserved.box.h * 0.5,
                w: reserved.box.w,
                h: reserved.box.h * 0.5,
            }
            reserved.boxes.b2 = {
                x: 0,
                y: 0,
                w: reserved.box.w,
                h: reserved.box.h * 0.5,
            }
        }
        function bottom_boxes() {
            reserved.boxes.a1 = {
                x: 0,
                y: 0,
                w: reserved.box.w,
                h: 0,
            }
            reserved.boxes.a2 = {
                x: 0,
                y: reserved.box.h * 0.5,
                w: reserved.box.w,
                h: 0,
            }
            reserved.boxes.a3 = {
                x: 0,
                y: reserved.box.h,
                w: reserved.box.w,
                h: 0,
            }
            reserved.boxes.b1 = {
                x: 0,
                y: 0,
                w: reserved.box.w,
                h: reserved.box.h * 0.5,
            }
            reserved.boxes.b2 = {
                x: 0,
                y: reserved.box.h * 0.5,
                w: reserved.box.w,
                h: reserved.box.h * 0.5,
            }
        }

        reserved.boxes = {
        }

        if (reserved.scale_location === 'left') {
            left_boxes()
        }
        else if (reserved.scale_location === 'right') {
            right_boxes()
        }
        else if (reserved.scale_location === 'top') {
            top_boxes()
        }
        else if (reserved.scale_location === 'bottom') {
            bottom_boxes()
        }
    }

    function initFocus() {
        if (!reserved.focus.enabled) {
            return
        }
        reserved.focus.g = reserved.g
            .append('g')
            .attr(
                'transform',
                'translate('
          + reserved.boxes[reserved.focus.track].x
          + ','
          + reserved.boxes[reserved.focus.track].y
          + ')'
            )

        reserved.focus.g
            .append('rect')
            .attr('id', 'brush')
            .attr('transform', function() {
                let scale = {
                    x: reserved.zoom.coef.kx,
                    y: reserved.zoom.coef.ky,
                }
                let trans = {
                    x: reserved.zoom.coef.x,
                    y: reserved.zoom.coef.y,
                }
                return (
                    'translate('
          + trans.x
          + ','
          + trans.y
          + ') '
          + 'scale('
          + scale.x
          + ','
          + scale.y
          + ')'
                )
            })
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', reserved.boxes[reserved.focus.track].w)
            .attr('height', reserved.boxes[reserved.focus.track].h)
            .attr('fill', reserved.focus.style.fill)
            .attr('opacity', reserved.focus.style.opacity)
            .attr('stroke', reserved.focus.style.stroke)
            .attr('stroke-width', 0.4)
            .on('mouseover', function() {
                d3.select(this).style('cursor', 'crosshair')
            })
            .on('mouseout', function() {
                d3.select(this).style('cursor', 'default')
            })

        reserved.focus.g.on('wheel', function() {
            d3.event.preventDefault()
        })
    }
    function updateFocus() {
        if (!reserved.focus.enabled) {
            return
        }
        reserved.focus.g.select('rect#brush').attr('transform', function() {
            let scale = {
                x: reserved.zoom.coef.kx,
                y: reserved.zoom.coef.ky,
            }
            let trans = {
                x: reserved.zoom.coef.x,
                y: reserved.zoom.coef.y,
            }
            return (
                'translate('
        + trans.x
        + ','
        + trans.y
        + ') '
        + 'scale('
        + scale.x
        + ','
        + scale.y
        + ')'
            )
        })
    }

    function initContent() {
        if (!reserved.content.enabled) {
            return
        }
        reserved.content.g = reserved.g
            .append('g')
            .attr(
                'transform',
                'translate('
                + reserved.boxes[reserved.content.track].x
                + ','
                + reserved.boxes[reserved.content.track].y
                + ')'
            )

        reserved.content.g
            .append('rect')
            .attr('id', 'brush')
            .attr('transform', function() {
                let scale = {
                    x: reserved.zoom.coef.kx,
                    y: reserved.zoom.coef.ky,
                }
                let trans = {
                    x: reserved.zoom.coef.x,
                    y: reserved.zoom.coef.y,
                }
                return (
                    'translate('
          + trans.x
          + ','
          + trans.y
          + ') '
          + 'scale('
          + scale.x
          + ','
          + scale.y
          + ')'
                )
            })
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', reserved.boxes[reserved.content.track].w)
            .attr('height', reserved.boxes[reserved.content.track].h)
            .attr('fill', reserved.focus.style.fill)
            .attr('opacity', reserved.focus.style.opacity)
            .attr('stroke', reserved.focus.style.stroke)
            .on('mouseover', function() {
                d3.select(this).style('cursor', 'crosshair')
            })
            .on('mouseout', function() {
                d3.select(this).style('cursor', 'default')
            })

        reserved.content.g.on('wheel', function() {
            d3.event.preventDefault()
        })
    }

    function init_zoom() {
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
                max: reserved.box.w,
                now: 0,
            },
            y: {
                min: 0,
                max: reserved.box.h,
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

        reserved.g
            .on('wheel', function() {
                d3.event.preventDefault()
                if (reserved.scale_location === 'left'
                || reserved.scale_location === 'right') { // d3.event.ctrlKey
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
                }
                else {
                    reserved.zoom.meta.kx.point = d3.mouse(d3.select(this).node())

                    let sign = -Math.abs(d3.event.deltaY) / d3.event.deltaY

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
                }

                updateFocus()
                updateAxis()
                reserved.zoom.callback()
            })
            .call(
                d3
                    .drag()
                    .on('start', function() {})
                    .on('drag', function() {
                        reserved.brush.meta.x = d3.event.dx
                        reserved.brush.meta.y = d3.event.dy

                        computeDragFactor()
                        updateFocus()
                        updateAxis()
                        reserved.zoom.callback()
                    })
                    .on('end', function() {
                        reserved.brush.meta.x = 0
                        reserved.brush.meta.y = 0
                    })
            )
    }
    function get_brush_zoom_factor() {
        return {
            brush: reserved.brush,
            zoom: reserved.zoom,
        }
    }
    this.get_brush_zoom_factor = get_brush_zoom_factor
    function set_brush_zoom_factor(new_brush_zoom_factor) {
        reserved.zoom = new_brush_zoom_factor.zoom
        reserved.brush = new_brush_zoom_factor.brush

        updateAxis()
    }
    this.set_brush_zoom_factor = set_brush_zoom_factor

    function core_axis(axis) {
        if (!axis.enabled) {
            return
        }
        let minTxtSize = reserved.style.text.size
            ? reserved.style.text.size
            : reserved.box.w * 0.04

        axis.axis.scale(axis.scale)
        axis.axis.tickValues([ axis.scale.domain()[0] ].concat(axis.scale.ticks(8)).concat([ axis.scale.domain()[1] ]))
        axis.g.call(axis.axis)


        axis.g
            .select('path')
            .attr('stroke-width', 0.6)
            .attr('stroke', reserved.style.path.stroke)
            .attr('opacity', reserved.style.path.visible ? 1 : 0)
        axis.g
            .selectAll('g.tick')
            .selectAll('line')
            .attr('stroke-width', 0.6)
            .attr('stroke', reserved.style.path.stroke)
            .attr('opacity', reserved.style.path.visible ? 1 : 0)
        axis.g
            .selectAll('g.tick')
            .selectAll('text')
            .attr('stroke', reserved.style.text.stroke)
            .attr('stroke-width', 0.6)
            .attr('fill', reserved.style.text.fill)
            .style('font-size', minTxtSize + 'px')
            .attr('opacity', reserved.style.text.visible ? 1 : 0)
    }
    function initAxis() {
        add_axis(reserved.axis1)
        add_axis(reserved.axis2)
    }
    function add_axis(axis) {
        if (!axis.enabled) {
            return
        }

        if (reserved.scale_type === 'time') {
            axis.scale = d3.scaleLinear()
        }
        else if (reserved.scale_type === 'line') {
            axis.scale = d3.scaleLinear()
        }
        else {
            axis.scale = d3.scaleLinear()
        }

        axis.scale
            .range(reserved.range)
            .domain(reserved.domain)

        if (reserved.scale_location === 'top') {
            if (axis.orientation === 'in') {
                axis.axis = d3.axisBottom(axis.scale)
            }
            if (axis.orientation === 'out') {
                axis.axis = d3.axisTop(axis.scale)
            }
        }
        else if (reserved.scale_location === 'bottom') {
            if (axis.orientation === 'in') {
                axis.axis = d3.axisTop(axis.scale)
            }
            if (axis.orientation === 'out') {
                axis.axis = d3.axisBottom(axis.scale)
            }
        }
        else if (reserved.scale_location === 'left') {
            if (axis.orientation === 'in') {
                axis.axis = d3.axisRight(axis.scale)
            }
            if (axis.orientation === 'out') {
                axis.axis = d3.axisLeft(axis.scale)
            }
        }
        else if (reserved.scale_location === 'right') {
            if (axis.orientation === 'in') {
                axis.axis = d3.axisLeft(axis.scale)
            }
            if (axis.orientation === 'out') {
                axis.axis = d3.axisRight(axis.scale)
            }
        }

        if (reserved.scale_type === 'time') {
            axis.axis.tickFormat(d3.timeFormat('%H:%M'))
        }

        axis.g = reserved.g.append('g')
        axis.g.attr(
            'transform',
            'translate('
        + reserved.boxes[axis.location].x
        + ','
        + reserved.boxes[axis.location].y
        + ')'
        )
        axis.g
            .attr('class', 'axis')
            .call(axis.axis)
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        axis.g.style('opacity', 1)

        core_axis(axis)
    }
    function getAxis() {
        return {
            axis1: reserved.axis1,
            axis2: reserved.axis2,
        }
    }
    this.getAxis = getAxis
    function updateAxis() {
        applyZoomBrush(reserved.axis1)

        core_axis(reserved.axis1)
        core_axis(reserved.axis2)

        updateFocus()
    }
    this.updateAxis = updateAxis

    function applyZoomBrush(axis) {
        if (!axis.enabled) {
            return
        }
        axis.scale.domain(reserved.domain).range(reserved.range)
        // .nice()

        let newDomain = deep_copy(reserved.domain)
        if (reserved.scale_location === 'top'
        || reserved.scale_location === 'bottom') {
            newDomain[0] = axis.scale.invert(reserved.zoom.coef.x)
            newDomain[1] = axis.scale.invert(
                reserved.zoom.coef.x + reserved.box.w * reserved.zoom.coef.kx
            )
        }
        else if (reserved.scale_location === 'left'
        || reserved.scale_location === 'right') {
            newDomain[1] = axis.scale.invert(reserved.zoom.coef.y)
            newDomain[0] = axis.scale.invert(
                reserved.zoom.coef.y + reserved.box.h * reserved.zoom.coef.ky
            )
        }
        axis.scale.domain(newDomain)
    }
}
