/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global get_color_theme */
/* global deep_copy */

window.PlotBrushZoom = function() {
    let color_theme = get_color_theme('bright_grey')
    let reserved = {
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

        reserved.axis.style = {
        }

        reserved.axis.style.hasOutline = is_def(opt_in.hasOutline)
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

        init_default()
        setup_profile()

        init_clipping()
        init_axis_brush_boxes()
        initAzerty()
        init_zoom()
        initAxis()

    }
    this.init = init
    function get_structure() {
        return {
            id: reserved.id,
            location: reserved.location,
            type: reserved.type,
            profile: reserved.profile,
            domain: reserved.domain,
        }
    }
    this.get_structure = get_structure

    function init_default() {
        let reserved_default = {
            g: undefined,
            id: undefined,
            location: undefined,
            type: 'linear',
            profile: 'default',
            box: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                marg: 0,
            },
            domain: {
                context: [ 0, 100 ],
                focus: [ 0, 100 ],
            },
            range: [ 0, 0 ],
            clipping: {
                max_characters: 5,
                enabled: false,
            },
            axis: {
                profile: 'focus',
                visibility: false,
                track: 'a1',
                orientation: 'out',
                text_rotation: true,
                ticks_min_max: true,
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
            },
            azerty: {
                profile: 'focus',
                visibility: false,
                track: 'b1',
                style: {
                    fill: '#AAAAAA',
                    opacity: 0.5,
                    stroke: 'none',
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
        reserved = window.merge_obj(reserved_default, reserved)
    }
    function setup_profile() {
        if (reserved.profile === 'default') {
            return
        }

        switch (reserved.profile) {
        case 'focus':
            reserved.azerty = window.merge_obj(
                reserved.azerty,
                {
                    visibility: false,
                })
            reserved.axis = window.merge_obj(
                reserved.axis,
                {
                    visibility: true,
                    track: 'a1',
                    orientation: 'out',
                    zoom: true,
                })
            break
        case 'context':
            reserved.azerty = window.merge_obj(
                reserved.azerty,
                {
                    visibility: true,
                    zoom: true,
                })
            reserved.axis = window.merge_obj(
                reserved.axis,
                {
                    visibility: true,
                    track: 'a1',
                    orientation: 'out',
                    zoom: false,
                })
            break
        case 'hybrid':
            reserved.azerty = window.merge_obj(
                reserved.azerty,
                {
                    visibility: true,
                    zoom: true,
                })
            reserved.axis = window.merge_obj(
                reserved.axis,
                {
                    visibility: true,
                    track: 'a1',
                    orientation: 'out',
                    zoom: true,
                })
            break
        default:

        }
    }

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
                x: reserved.box.w,
                y: 0,
                w: 0,
                h: reserved.box.h,
            }
            // reserved.boxes.a3 = {
            //     x: 0,
            //     y: 0,
            //     w: 0,
            //     h: reserved.box.h,
            // }
            reserved.boxes.b1 = {
                x: reserved.box.w,
                y: 0,
                w: reserved.box.w,
                h: reserved.box.h,
            }
            // reserved.boxes.b2 = {
            //     x: 0,
            //     y: 0,
            //     w: reserved.box.w ,
            //     h: reserved.box.h,
            // }
        }
        function right_boxes() {
            reserved.boxes.a1 = {
                x: 0,
                y: 0,
                w: 0,
                h: reserved.box.h,
            }
            reserved.boxes.a2 = {
                x: reserved.box.w,
                y: 0,
                w: 0,
                h: reserved.box.h,
            }
            // reserved.boxes.a3 = {
            //     x: reserved.box.w,
            //     y: 0,
            //     w: 0,
            //     h: reserved.box.h,
            // }
            reserved.boxes.b1 = {
                x: 0,
                y: 0,
                w: reserved.box.w,
                h: reserved.box.h,
            }
            // reserved.boxes.b2 = {
            //     x: reserved.box.w ,
            //     y: 0,
            //     w: reserved.box.w ,
            //     h: reserved.box.h,
            // }
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
                y: 0,
                w: reserved.box.w,
                h: 0,
            }
            // reserved.boxes.a3 = {
            //     x: 0,
            //     y: 0,
            //     w: reserved.box.w,
            //     h: 0,
            // }
            reserved.boxes.b1 = {
                x: 0,
                y: 0,
                w: reserved.box.w,
                h: reserved.box.h,
            }
            // reserved.boxes.b2 = {
            //     x: 0,
            //     y: 0,
            //     w: reserved.box.w,
            //     h: reserved.box.h ,
            // }
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
                y: reserved.box.h,
                w: reserved.box.w,
                h: 0,
            }
            // reserved.boxes.a3 = {
            //     x: 0,
            //     y: reserved.box.h,
            //     w: reserved.box.w,
            //     h: 0,
            // }
            reserved.boxes.b1 = {
                x: 0,
                y: 0,
                w: reserved.box.w,
                h: reserved.box.h,
            }
            // reserved.boxes.b2 = {
            //     x: 0,
            //     y: reserved.box.h ,
            //     w: reserved.box.w,
            //     h: reserved.box.h ,
            // }
        }

        reserved.boxes = {
        }

        if (reserved.location === 'left') {
            left_boxes()
        }
        else if (reserved.location === 'right') {
            right_boxes()
        }
        else if (reserved.location === 'top') {
            top_boxes()
        }
        else if (reserved.location === 'bottom') {
            bottom_boxes()
        }
    }

    function initAzerty() {
        if (!reserved.azerty.visibility) {
            return
        }
        reserved.azerty.g = reserved.g
            .append('g')
            .attr(
                'transform',
                'translate('
          + reserved.boxes[reserved.azerty.track].x
          + ','
          + reserved.boxes[reserved.azerty.track].y
          + ')'
            )

        reserved.azerty.g
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
            .attr('width', reserved.boxes[reserved.azerty.track].w)
            .attr('height', reserved.boxes[reserved.azerty.track].h)
            .attr('fill', reserved.azerty.style.fill)
            .attr('opacity', reserved.azerty.style.opacity)
            .attr('stroke', reserved.azerty.style.stroke)
            .attr('stroke-width', 0.4)
            .on('mouseover', function() {
                d3.select(this).style('cursor', 'crosshair')
            })
            .on('mouseout', function() {
                d3.select(this).style('cursor', 'default')
            })

        reserved.azerty.g.on('wheel', function() {
            d3.event.preventDefault()
        })
    }
    function updateAzerty() {
        if (!reserved.azerty.visibility || !reserved.azerty.zoom) {
            return
        }
        reserved.azerty.g.select('rect#brush').attr('transform', function() {
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
                if (reserved.location === 'left'
                || reserved.location === 'right') { // d3.event.ctrlKey
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

                update()
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
                        update()
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
        reserved.zoom.coef = new_brush_zoom_factor.zoom.coef
        reserved.zoom.meta = new_brush_zoom_factor.zoom.meta

        reserved.brush.coef = new_brush_zoom_factor.brush.coef
        reserved.brush.meta = new_brush_zoom_factor.brush.meta

        update()
    }
    this.set_brush_zoom_factor = set_brush_zoom_factor
    function set_brush_zoom_factor_horizontal(new_brush_zoom_factor) {
        reserved.zoom.coef.x = new_brush_zoom_factor.zoom.coef.x
        reserved.zoom.coef.kx = new_brush_zoom_factor.zoom.coef.kx
        reserved.zoom.meta.x = new_brush_zoom_factor.zoom.meta.x
        reserved.zoom.meta.kx = new_brush_zoom_factor.zoom.meta.kx

        reserved.brush.coef.x = new_brush_zoom_factor.brush.coef.x
        reserved.brush.meta.x = new_brush_zoom_factor.brush.meta.x

        update()
    }
    this.set_brush_zoom_factor_horizontal = set_brush_zoom_factor_horizontal
    function set_brush_zoom_factor_vertical(new_brush_zoom_factor) {
        reserved.zoom.coef.y = new_brush_zoom_factor.zoom.coef.y
        reserved.zoom.coef.ky = new_brush_zoom_factor.zoom.coef.ky
        reserved.zoom.meta.y = new_brush_zoom_factor.zoom.meta.y
        reserved.zoom.meta.ky = new_brush_zoom_factor.zoom.meta.ky

        reserved.brush.coef.y = new_brush_zoom_factor.brush.coef.y
        reserved.brush.meta.y = new_brush_zoom_factor.brush.meta.y

        update()
    }
    this.set_brush_zoom_factor_vertical = set_brush_zoom_factor_vertical

    function compute_overlap(axis, all_ticks, key) {
        let begin = [ 1 ]
        let end = [ 1 ]

        for (let i = 1; i < Math.floor(all_ticks.length * 0.5); i++) {
            // COMPUTE START OF ARRAY
            let prev_text = d3.select(all_ticks[i - 1]).select('text')
            let previous = [
                d3.select(all_ticks[i - 1]).data(),
                prev_text.node().getBBox()[key],
            ]
            let actual_text = d3.select(all_ticks[i]).select('text')
            let actual = [
                d3.select(all_ticks[i]).data(),
                actual_text.node().getBBox()[key],
            ]
            if ((previous[1] + actual[1]) * 0.5
            > Math.abs(axis.scale(previous[0]) - axis.scale(actual[0]))) {
                begin.push(0)
            }
            else {
                begin.push(1)
            }

            // COMPUTE END OF ARRAY
            actual_text = d3.select(all_ticks[all_ticks.length - i - 1]).select('text')
            actual = [
                d3.select(all_ticks[all_ticks.length - i - 1]).data(),
                actual_text.node().getBBox()[key],
            ]
            prev_text = d3.select(all_ticks[all_ticks.length - i]).select('text')
            previous = [
                d3.select(all_ticks[all_ticks.length - i]).data(),
                prev_text.node().getBBox()[key],
            ]
            if ((previous[1] + actual[1]) * 0.5
            > Math.abs(axis.scale(previous[0]) - axis.scale(actual[0]))) {
                end = [ 0 ].concat(end)
            }
            else {
                end = [ 1 ].concat(end)
            }
        }
        if (all_ticks.length % 2 === 1) {
            return begin.concat([ 1 ]).concat(end)
        }
        return begin.concat(end)
    }
    function format_ticks_linear(axis) {
        let minTxtSize = reserved.axis.style.text.size
            ? reserved.axis.style.text.size
            : reserved.box.w * 0.04
        let all_ticks = axis.g.selectAll('g.tick')._groups[0]
        let overlap_array = []
        if (reserved.location === 'left' || reserved.location === 'right') {
            overlap_array = compute_overlap(axis, all_ticks, 'height')
        }
        else {
            overlap_array = compute_overlap(axis, all_ticks, 'width')
        }
        axis.g
            .selectAll('g.tick')
            .each(function(d, i) {
                let line = d3.select(this).select('line')
                let text = d3.select(this).select('text')
                line.attr('stroke-width', 0.6)
                    .attr('stroke', reserved.axis.style.path.stroke)
                    .attr('opacity', reserved.axis.style.path.visible ? 1 : 0)
                text.attr('stroke', reserved.axis.style.text.stroke)
                    .attr('stroke-width', 0.6)
                    .attr('fill', reserved.axis.style.text.fill)
                    .style('font-size', minTxtSize + 'px')
                    .style('opacity', overlap_array[i])
            })
    }
    function format_ticks_band(axis) {
        let percent_before_rotate = 0.66

        let rotate = false
        let minTxtSize = reserved.axis.style.text.size
            ? reserved.axis.style.text.size
            : reserved.box.w * 0.04
        let max = axis.g.selectAll('g.tick').size()
        let all_ticks = axis.g.selectAll('g.tick')._groups[0]
        let overlap_array = []
        if (reserved.location === 'left' || reserved.location === 'right') {
            overlap_array = compute_overlap(axis, all_ticks, 'height')
            if (reserved.type === 'band') {
                console.log(axis.g.selectAll('g.tick>text').nodes().map(function(t){
                    return t.innerHTML
                }).reduce((a, b) => a + (b.length < reserved.clipping.max_characters), 0))
                if (axis.g.selectAll('g.tick>text').nodes().map(function(t){
                    return t.innerHTML
                }).reduce((a, b) => a + (b.length < reserved.clipping.max_characters), 0)
                / max < percent_before_rotate ) {
                    rotate = true
                }
            }
        }
        else {
            let overlap_array_width = compute_overlap(axis, all_ticks, 'width')
            if (overlap_array_width.reduce((a, b) => a + b, 0)
              / max < percent_before_rotate ) {
                overlap_array = compute_overlap(axis, all_ticks, 'height')
                rotate = true
            }
            else {
                overlap_array = overlap_array_width
            }
        }
        axis.g
            .selectAll('g.tick')
            .each(function(d, i) {
                let line = d3.select(this).select('line')
                let text = d3.select(this).select('text')
                line.attr('stroke-width', 0.6)
                    .attr('stroke', reserved.axis.style.path.stroke)
                    .attr('opacity', reserved.axis.style.path.visible ? 1 : 0)
                text.attr('stroke', reserved.axis.style.text.stroke)
                    .attr('stroke-width', 0.6)
                    .attr('fill', reserved.axis.style.text.fill)
                    .style('font-size', minTxtSize + 'px')
                    .style('opacity', 1)
                    .text(function() {
                        if (overlap_array[i]) {
                            return d.substring(0, reserved.clipping.max_characters)
                              + (d.length > reserved.clipping.max_characters
                                  ? ' [+]'
                                  : '')
                        }
                        return d.substring(0, 8) + ' [+]'
                    })
                if (rotate) {
                    if (reserved.location === 'left') {
                        text.attr('x', minTxtSize)
                            .attr('transform', 'rotate(70)')
                            .style('text-anchor', 'end')
                    }
                    if (reserved.location === 'right') {
                        text.attr('x', minTxtSize)
                            .attr('transform', 'rotate(70)')
                            .style('text-anchor', 'start')
                    }
                    if (reserved.location === 'bottom') {
                        text.attr('y', minTxtSize)
                            .attr('transform', 'rotate(20)')
                            .style('text-anchor', 'start')
                    }
                    else if (reserved.location === 'top') {
                        text.attr('y', -minTxtSize)
                            .attr('transform', 'rotate(20)')
                            .style('text-anchor', 'end')
                    }
                }

            })
    }
    function core_axis(axis) {

        axis.axis.scale(axis.scale)
        if (axis.ticks_min_max && reserved.type !== 'band') {
            if (reserved.location === 'left' || reserved.location === 'right') {
                axis.axis.tickValues(
                    [ axis.scale.invert(reserved.box.h) ]
                        .concat(axis.scale.ticks(8))
                        .concat([ axis.scale.invert(0) ]))
            }
            else {
                axis.axis.tickValues(
                    [ axis.scale.invert(0) ]
                        .concat(axis.scale.ticks(8))
                        .concat([ axis.scale.invert(reserved.box.w) ]))
            }

        }

        axis.g.call(axis.axis)

        axis.g
            .select('path')
            .attr('stroke-width', 0.6)
            .attr('stroke', reserved.axis.style.path.stroke)
            .attr('opacity', reserved.axis.style.path.visible ? 1 : 0)

        if (reserved.type === 'linear') {
            format_ticks_linear(axis)
        }
        else if (reserved.type === 'time') {
            format_ticks_linear(axis)
        }
        else if (reserved.type === 'band') {
            format_ticks_band(axis)
        }

        if (!axis.visibility) {
            axis.g.style('visibility', 'hidden')
            return
        }
        axis.g.style('visibility', 'visible')
    }
    function initAxis() {
        add_axis(reserved.axis)
    }
    function add_axis(axis) {
        // if (!axis.enabled) {
        //     return
        // }

        if (reserved.type === 'time') {
            axis.scale = d3.scaleLinear()
        }
        else if (reserved.type === 'line') {
            axis.scale = d3.scaleLinear()
        }
        else if (reserved.type === 'band') {
            axis.scale = d3.scaleBand()
        }
        else {
            axis.scale = d3.scaleLinear()
        }

        axis.scale
            .range(reserved.range)
            .domain(reserved.domain)

        if (reserved.location === 'top') {
            if (axis.orientation === 'in') {
                axis.axis = d3.axisBottom(axis.scale)
            }
            if (axis.orientation === 'out') {
                axis.axis = d3.axisTop(axis.scale)
            }
        }
        else if (reserved.location === 'bottom') {
            if (axis.orientation === 'in') {
                axis.axis = d3.axisTop(axis.scale)
            }
            if (axis.orientation === 'out') {
                axis.axis = d3.axisBottom(axis.scale)
            }
        }
        else if (reserved.location === 'left') {
            if (axis.orientation === 'in') {
                axis.axis = d3.axisRight(axis.scale)
            }
            if (axis.orientation === 'out') {
                axis.axis = d3.axisLeft(axis.scale)
            }
        }
        else if (reserved.location === 'right') {
            if (axis.orientation === 'in') {
                axis.axis = d3.axisLeft(axis.scale)
            }
            if (axis.orientation === 'out') {
                axis.axis = d3.axisRight(axis.scale)
            }
        }

        if (reserved.type === 'time') {
            axis.axis.tickFormat(d3.timeFormat('%H:%M'))
        }

        axis.g = reserved.g.append('g')
        axis.g.attr(
            'transform',
            'translate('
        + reserved.boxes[axis.track].x
        + ','
        + reserved.boxes[axis.track].y
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
    function get_axis() {
        return reserved.axis
    }
    this.get_axis = get_axis
    function update_axis(opt_in) {
        reserved = window.merge_obj(reserved, opt_in)
        applyZoomBrush()
        core_axis(reserved.axis)
        updateAzerty()
    }
    this.update_axis = update_axis

    function update() {
        applyZoomBrush()

        if (reserved.axis.zoom) {
            core_axis(reserved.axis)
        }
        if (reserved.azerty.zoom) {
            updateAzerty()
        }
    }
    this.update = update

    function applyZoomBrush() {
        reserved.axis.scale.domain(reserved.domain).range(reserved.range)

        let newDomain = deep_copy(reserved.domain)
        if (reserved.location === 'top'
        || reserved.location === 'bottom') {
            newDomain[0] = reserved.axis.scale.invert(reserved.zoom.coef.x)
            newDomain[1] = reserved.axis.scale.invert(
                reserved.zoom.coef.x + reserved.box.w * reserved.zoom.coef.kx
            )
        }
        else if (reserved.location === 'left'
        || reserved.location === 'right') {
            newDomain[1] = reserved.axis.scale.invert(reserved.zoom.coef.y)
            newDomain[0] = reserved.axis.scale.invert(
                reserved.zoom.coef.y + reserved.box.h * reserved.zoom.coef.ky
            )
        }
        reserved.axis.scale.domain(newDomain)
    }
}
