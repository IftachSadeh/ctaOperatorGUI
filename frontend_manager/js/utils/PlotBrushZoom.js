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

    function set_style(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        reserved.axis_parameters.style = {
        }

        reserved.axis_parameters.style.hasOutline = is_def(opt_in.hasOutline)
            ? opt_in.hasOutline
            : false
    }
    this.set_style = set_style

    function setup_default() {
        let reserved_default = {
            main: {
                id: undefined,
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    marg: 0,
                },
                location: undefined,
                drawing: 'linear',
                profile: 'default',
            },
            domain: {
                raw: [ 0, 100 ],
                focus: [ 0, 100 ],
            },
            clipping: {
                max_characters: 5,
                enabled: false,
            },
            axis_parameters: {
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
            brush_parameters: {
                profile: 'focus',
                visibility: false,
                track: 'b1',
                style: {
                    fill: '#AAAAAA',
                    opacity: 0.5,
                    stroke: 'none',
                },
            },
            focus: {
                zoom: {
                    kx: 1,
                    ky: 1,
                },
                translate: {
                    x: 0,
                    y: 0,
                },
            },
            interaction: {
                wheel: {
                    default: {
                        type: 'zoom',
                        end: () => {},
                    },
                    shiftKey: {
                        type: 'scroll',
                        end: () => {},
                    },
                },
                drag: {
                    default: {
                        type: 'drag_trans',
                        start: () => {
                        },
                        drag: () => {
                        },
                        end: () => {
                        },
                    },
                },
            },
        }
        reserved = window.merge_obj(reserved_default, reserved)
    }
    function setup_profile() {
        if (reserved.main.profile === 'default') {
            return
        }
        switch (reserved.main.profile) {
        case 'scrollbox':
            reserved.brush_parameters = window.merge_obj(
                reserved.brush_parameters,
                {
                    visibility: true,
                    zoom: true,
                })
            reserved.axis_parameters = window.merge_obj(
                reserved.axis_parameters,
                {
                    visibility: false,
                    track: 'a1',
                    orientation: 'out',
                    zoom: true,
                })
            break
        case 'focus':
            reserved.brush_parameters = window.merge_obj(
                reserved.brush_parameters,
                {
                    visibility: false,
                })
            reserved.axis_parameters = window.merge_obj(
                reserved.axis_parameters,
                {
                    visibility: true,
                    track: 'a1',
                    orientation: 'out',
                    zoom: true,
                })
            break
        case 'context':
            reserved.brush_parameters = window.merge_obj(
                reserved.brush_parameters,
                {
                    visibility: true,
                    zoom: true,
                })
            reserved.axis_parameters = window.merge_obj(
                reserved.axis_parameters,
                {
                    visibility: true,
                    track: 'a1',
                    orientation: 'out',
                    zoom: false,
                })
            break
        case 'hybrid':
            reserved.brush_parameters = window.merge_obj(
                reserved.brush_parameters,
                {
                    visibility: true,
                    zoom: true,
                })
            reserved.axis_parameters = window.merge_obj(
                reserved.axis_parameters,
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
    function setup_axis_brush_boxes() {
        function left_boxes() {
            reserved.boxes.a1 = {
                x: reserved.main.box.w,
                y: 0,
                w: 0,
                h: reserved.main.box.h,
            }
            reserved.boxes.a2 = {
                x: reserved.main.box.w,
                y: 0,
                w: 0,
                h: reserved.main.box.h,
            }
            // reserved.boxes.a3 = {
            //     x: 0,
            //     y: 0,
            //     w: 0,
            //     h: reserved.main.box.h,
            // }
            reserved.boxes.b1 = {
                x: reserved.main.box.w,
                y: 0,
                w: reserved.main.box.w,
                h: reserved.main.box.h,
            }
            // reserved.boxes.b2 = {
            //     x: 0,
            //     y: 0,
            //     w: reserved.main.box.w ,
            //     h: reserved.main.box.h,
            // }
        }
        function right_boxes() {
            reserved.boxes.a1 = {
                x: 0,
                y: 0,
                w: 0,
                h: reserved.main.box.h,
            }
            reserved.boxes.a2 = {
                x: reserved.main.box.w,
                y: 0,
                w: 0,
                h: reserved.main.box.h,
            }
            // reserved.boxes.a3 = {
            //     x: reserved.main.box.w,
            //     y: 0,
            //     w: 0,
            //     h: reserved.main.box.h,
            // }
            reserved.boxes.b1 = {
                x: 0,
                y: 0,
                w: reserved.main.box.w,
                h: reserved.main.box.h,
            }
            // reserved.boxes.b2 = {
            //     x: reserved.main.box.w ,
            //     y: 0,
            //     w: reserved.main.box.w ,
            //     h: reserved.main.box.h,
            // }
        }
        function top_boxes() {
            reserved.boxes.a1 = {
                x: 0,
                y: reserved.main.box.h,
                w: reserved.main.box.w,
                h: 0,
            }
            reserved.boxes.a2 = {
                x: 0,
                y: 0,
                w: reserved.main.box.w,
                h: 0,
            }
            // reserved.boxes.a3 = {
            //     x: 0,
            //     y: 0,
            //     w: reserved.main.box.w,
            //     h: 0,
            // }
            reserved.boxes.b1 = {
                x: 0,
                y: 0,
                w: reserved.main.box.w,
                h: reserved.main.box.h,
            }
            // reserved.boxes.b2 = {
            //     x: 0,
            //     y: 0,
            //     w: reserved.main.box.w,
            //     h: reserved.main.box.h ,
            // }
        }
        function bottom_boxes() {
            reserved.boxes.a1 = {
                x: 0,
                y: 0,
                w: reserved.main.box.w,
                h: 0,
            }
            reserved.boxes.a2 = {
                x: 0,
                y: reserved.main.box.h,
                w: reserved.main.box.w,
                h: 0,
            }
            // reserved.boxes.a3 = {
            //     x: 0,
            //     y: reserved.main.box.h,
            //     w: reserved.main.box.w,
            //     h: 0,
            // }
            reserved.boxes.b1 = {
                x: 0,
                y: 0,
                w: reserved.main.box.w,
                h: reserved.main.box.h,
            }
            // reserved.boxes.b2 = {
            //     x: 0,
            //     y: reserved.main.box.h ,
            //     w: reserved.main.box.w,
            //     h: reserved.main.box.h ,
            // }
        }

        reserved.boxes = {
        }

        if (reserved.main.location === 'left') {
            left_boxes()
        }
        else if (reserved.main.location === 'right') {
            right_boxes()
        }
        else if (reserved.main.location === 'top') {
            top_boxes()
        }
        else if (reserved.main.location === 'bottom') {
            bottom_boxes()
        }
    }
    function get_structure() {
        return reserved.main
    }
    this.get_structure = get_structure

    function init(opt_in) {
        reserved = opt_in
        reserved.main.g.attr(
            'transform',
            'translate(' + reserved.main.box.x + ',' + reserved.main.box.y + ')'
        )

        setup_default()
        setup_profile()
        setup_axis_brush_boxes()

        init_focus()
        init_background()
        // init_clipping()
        init_brush()
        init_axis()
        // init_interaction()
        interaction_wheel()
        interaction_drag()

        apply_focus()
        core_axis()
        updateBrush()
    }
    this.init = init
    // function init_clipping() {
    //     if (!reserved.clipping.enabled) {
    //         return
    //     }
    //     reserved.clipping.g = reserved.main.g.append('g')
    //     reserved.clipping.g
    //         .append('defs')
    //         .append('svg:clipPath')
    //         .attr('id', 'clip')
    //         .append('svg:rect')
    //         .attr('id', 'clip-rect')
    //         .attr('x', '0')
    //         .attr('y', '0')
    //         .attr('width', reserved.main.box.w)
    //         .attr('height', reserved.main.box.h)
    //     reserved.clipping.clipBody = reserved.clipping.g
    //         .append('g')
    //         .attr('clip-path', 'url(#clip)')
    //     reserved.main.g = reserved.clipping.clipBody.append('g')
    // }
    function init_background() {
        reserved.background = reserved.main.g
            .append('g')
            .attr('id', reserved.main.id + '_background')
            .attr('transform', 'translate('
            + reserved.main.box.x
            + ','
            + reserved.main.box.y
            + ')')
    }
    function init_axis() {
        reserved.axis = {
        }
        if (reserved.main.drawing === 'time') {
            reserved.axis.scale = d3.scaleLinear()
        }
        else if (reserved.main.drawing === 'line') {
            reserved.axis.scale = d3.scaleLinear()
        }
        else if (reserved.main.drawing === 'band') {
            reserved.axis.scale = d3.scaleBand()
        }
        else {
            reserved.axis.scale = d3.scaleLinear()
        }

        if (reserved.main.location === 'top' || reserved.main.location === 'bottom') {
            reserved.axis.scale
                .range([ 0, reserved.main.box.w ])
                .domain(reserved.domain.raw)
        }
        else if (reserved.main.location === 'left' || reserved.main.location === 'right') {
            reserved.axis.scale
                .range([ 0, reserved.main.box.h ])
                .domain(reserved.domain.raw)
        }

        if (reserved.main.location === 'top') {
            if (reserved.axis_parameters.orientation === 'in') {
                reserved.axis.axis = d3.axisBottom(reserved.axis.scale)
            }
            if (reserved.axis_parameters.orientation === 'out') {
                reserved.axis.axis = d3.axisTop(reserved.axis.scale)
            }
        }
        else if (reserved.main.location === 'bottom') {
            if (reserved.axis_parameters.orientation === 'in') {
                reserved.axis.axis = d3.axisTop(reserved.axis.scale)
            }
            if (reserved.axis_parameters.orientation === 'out') {
                reserved.axis.axis = d3.axisBottom(reserved.axis.scale)
            }
        }
        else if (reserved.main.location === 'left') {
            if (reserved.axis_parameters.orientation === 'in') {
                reserved.axis.axis = d3.axisRight(reserved.axis.scale)
            }
            if (reserved.axis_parameters.orientation === 'out') {
                reserved.axis.axis = d3.axisLeft(reserved.axis.scale)
            }
        }
        else if (reserved.main.location === 'right') {
            if (reserved.axis_parameters.orientation === 'in') {
                reserved.axis.axis = d3.axisLeft(reserved.axis.scale)
            }
            if (reserved.axis_parameters.orientation === 'out') {
                reserved.axis.axis = d3.axisRight(reserved.axis.scale)
            }
        }

        if (reserved.main.drawing === 'time') {
            reserved.axis.axis.tickFormat(d3.timeFormat('%H:%M'))
        }

        reserved.axis.g = reserved.main.g.append('g')
        reserved.axis.g.attr(
            'transform',
            'translate('
      + reserved.boxes[reserved.axis_parameters.track].x
      + ','
      + reserved.boxes[reserved.axis_parameters.track].y
      + ')'
        )
        reserved.axis.g
            .attr('class', 'axis')
            .call(reserved.axis.axis)
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        reserved.axis.g.style('opacity', 1)

        core_axis()
    }
    function init_brush() {
        reserved.brush = {
        }
        if (!reserved.brush_parameters.visibility) {
            return
        }
        reserved.brush.g = reserved.main.g
            .append('g')
            .attr(
                'transform',
                'translate('
        + reserved.boxes[reserved.brush_parameters.track].x
        + ','
        + reserved.boxes[reserved.brush_parameters.track].y
        + ')'
            )

        reserved.brush.g
            .append('rect')
            .attr('id', 'brush')
            .attr('transform', function() {
                let scale = {
                    x: reserved.focus.relative.zoom.kx,
                    y: reserved.focus.relative.zoom.ky,
                }
                let trans = {
                    x: reserved.focus.relative.translate.x * reserved.main.box.w,
                    y: reserved.focus.relative.translate.y * reserved.main.box.h,
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
            .attr('width', reserved.boxes[reserved.brush_parameters.track].w)
            .attr('height', reserved.boxes[reserved.brush_parameters.track].h)
            .attr('fill', reserved.brush_parameters.style.fill)
            .attr('opacity', reserved.brush_parameters.style.opacity)
            .attr('stroke', reserved.brush_parameters.style.stroke)
            .attr('stroke-width', 0.4)
            .on('mouseover', function() {
                d3.select(this).style('cursor', 'crosshair')
            })
            .on('mouseout', function() {
                d3.select(this).style('cursor', 'default')
            })

        reserved.brush.g.on('wheel', function(event) {
            event.preventDefault()
        })
    }
    function init_focus() {
        reserved.focus = {
            // PX
            absolute: {
                zoom: {
                    kx: 1,
                    ky: 1,
                },
                translate: {
                    x: 0,
                    y: 0,
                },
            },
            //PERCENT
            relative: {
                zoom: {
                    kx: 1,
                    ky: 1,
                },
                translate: {
                    x: 0,
                    y: 0,
                },
            },
            olds: [],
        }
    }

    // function init_interaction() {
    //     function computeZoomFactorkx() {
    //         reserved.focus.zoom.kx = 1 / reserved.zoom.meta.kx.now
    //
    //         let ratio = [ reserved.zoom.meta.kx.point[0] / reserved.zoom.meta.x.max, 0 ]
    //         let offset = {
    //             x:
    //       (reserved.zoom.meta.x.max
    //         - reserved.zoom.meta.x.max * (1 / reserved.zoom.meta.kx.now)
    //         - (reserved.zoom.meta.x.max
    //         - reserved.zoom.meta.x.max * (1 / reserved.zoom.meta.kx.previous)))
    //       * ratio[0],
    //         }
    //
    //         reserved.focus.translate.x = reserved.focus.translate.x + offset.x + reserved.focus.translate.x
    //         if (reserved.focus.translate.x < 0) {
    //             reserved.focus.translate.x = 0
    //         }
    //         let right
    //         = reserved.focus.translate.x
    //         + reserved.zoom.meta.x.max * (1 / reserved.zoom.meta.kx.now)
    //         if (right > reserved.zoom.meta.x.max) {
    //             reserved.focus.translate.x
    //             = reserved.focus.translate.x - (right - reserved.zoom.meta.x.max)
    //         }
    //     }
    //     function computeZoomFactorky() {
    //         reserved.focus.zoom.ky = 1 / reserved.zoom.meta.ky.now
    //
    //         let ratio = [ 0, reserved.zoom.meta.ky.point[1] / reserved.zoom.meta.y.max ]
    //         let offset = {
    //             y:
    //             (reserved.zoom.meta.y.max
    //             - reserved.zoom.meta.y.max * (1 / reserved.zoom.meta.ky.now)
    //             - (reserved.zoom.meta.y.max
    //             - reserved.zoom.meta.y.max
    //             * (1 / reserved.zoom.meta.ky.previous)))
    //             * ratio[1],
    //         }
    //
    //         reserved.focus.translate.y = reserved.focus.translate.y + offset.y + reserved.focus.translate.y
    //         if (reserved.focus.translate.y < 0) {
    //             reserved.focus.translate.y = 0
    //         }
    //         let bottom
    //         = reserved.focus.translate.y
    //         + reserved.zoom.meta.y.max
    //         * (1 / reserved.zoom.meta.ky.now)
    //         if (bottom > reserved.zoom.meta.y.max) {
    //             reserved.focus.translate.y
    //             = reserved.focus.translate.y - (bottom - reserved.zoom.meta.y.max)
    //         }
    //     }
    //     function computeDragFactor() {
    //         reserved.focus.translate.x = reserved.focus.translate.x + reserved.focus.translate.x
    //         if (reserved.focus.translate.x < 0) {
    //             reserved.focus.translate.x = 0
    //         }
    //         let right
    //         = reserved.focus.translate.x
    //         + reserved.zoom.meta.x.max
    //         * (1 / reserved.zoom.meta.kx.now)
    //         if (right > reserved.zoom.meta.x.max) {
    //             reserved.focus.translate.x
    //             = reserved.focus.translate.x - (right - reserved.zoom.meta.x.max)
    //         }
    //
    //         reserved.focus.translate.y = reserved.focus.translate.y + reserved.focus.translate.y
    //         if (reserved.focus.translate.y < 0) {
    //             reserved.focus.translate.y = 0
    //         }
    //         let bottom
    //         = reserved.focus.translate.y
    //         + reserved.zoom.meta.y.max
    //         * (1 / reserved.zoom.meta.ky.now)
    //         if (bottom > reserved.zoom.meta.y.max) {
    //             reserved.focus.translate.y
    //             = reserved.focus.translate.y - (bottom - reserved.zoom.meta.y.max)
    //         }
    //     }
    //
    //     reserved.main.g
    //         .on('wheel', function() {
    //             event.preventDefault()
    //             if (reserved.main.location === 'left'
    //             || reserved.main.location === 'right') { // event.ctrlKey
    //                 reserved.zoom.meta.ky.point = d3.mouse(d3.select(this).node())
    //
    //                 let sign = -Math.abs(event.deltaY) / event.deltaY
    //
    //                 reserved.zoom.meta.ky.previous = reserved.zoom.meta.ky.now
    //
    //                 reserved.zoom.meta.ky.now
    //                 += sign * Math.log(Math.abs(event.deltaY)) * 0.02
    //                 if (reserved.zoom.meta.ky.now < reserved.zoom.meta.ky.min) {
    //                     reserved.zoom.meta.ky.now = reserved.zoom.meta.ky.min
    //                 }
    //                 if (reserved.zoom.meta.ky.now > reserved.zoom.meta.ky.max) {
    //                     reserved.zoom.meta.ky.now = reserved.zoom.meta.ky.max
    //                 }
    //                 computeZoomFactorky()
    //             }
    //             else {
    //                 reserved.zoom.meta.kx.point = d3.mouse(d3.select(this).node())
    //
    //                 let sign = -Math.abs(event.deltaY) / event.deltaY
    //
    //                 reserved.zoom.meta.kx.previous = reserved.zoom.meta.kx.now
    //
    //                 reserved.zoom.meta.kx.now
    //                 += sign * Math.log(Math.abs(event.deltaY)) * 0.02
    //                 if (reserved.zoom.meta.kx.now < reserved.zoom.meta.kx.min) {
    //                     reserved.zoom.meta.kx.now = reserved.zoom.meta.kx.min
    //                 }
    //                 if (reserved.zoom.meta.kx.now > reserved.zoom.meta.kx.max) {
    //                     reserved.zoom.meta.kx.now = reserved.zoom.meta.kx.max
    //                 }
    //                 computeZoomFactorkx()
    //             }
    //
    //             update()
    //             reserved.zoom.callback()
    //         })
    //         .call(
    //             d3
    //                 .drag()
    //                 .on('start', function() {})
    //                 .on('drag', function() {
    //                     reserved.focus.translate.x = event.dx
    //                     reserved.focus.translate.y = event.dy
    //
    //                     computeDragFactor()
    //                     update()
    //                     reserved.zoom.callback()
    //                 })
    //                 .on('end', function() {
    //                     reserved.focus.translate.x = 0
    //                     reserved.focus.translate.y = 0
    //                 })
    //         )
    // }
    function interaction_wheel() {
        // console.error('BUG - upgrade to d3.pointer(event) - https://observablehq.com/@d3/d3v6-migration-guide#pointer')

        let wheel_var = {
            x: 0,
            y: 0,
            key: undefined,
            coef_zoom: 1.1,
            coef_trans: 0.05,
        }
        let wheel_function_bib = {
            zoom: {
                end: function(event) {
                    var direction = event.wheelDelta < 0 ? 'down' : 'up'
                    let new_zoom = {
                        kx: reserved.focus.relative.zoom.kx
                        * (direction === 'down'
                            ? wheel_var.coef_zoom
                            : (1 / wheel_var.coef_zoom)),
                        ky: reserved.focus.relative.zoom.ky
                        * (direction === 'down'
                            ? wheel_var.coef_zoom
                            : (1 / wheel_var.coef_zoom)),
                    }

                    if (reserved.main.location === 'left' || reserved.main.location === 'right') {
                        if (new_zoom.ky < 0) {
                            new_zoom.yx = 0
                        }
                        else if (new_zoom.ky > 1) {
                            new_zoom.ky = 1
                        }
                        reserved.focus.relative.translate.y = reserved.focus.relative.translate.y
                          - (new_zoom.ky - reserved.focus.relative.zoom.ky) * 0.5
                        reserved.focus.relative.zoom.ky = new_zoom.ky
                        if (reserved.focus.relative.translate.y < 0) {
                            reserved.focus.relative.translate.y = 0
                        }
                        if (reserved.focus.relative.translate.y > (1 - reserved.focus.relative.zoom.ky)) {
                            reserved.focus.relative.translate.y = (1 - reserved.focus.relative.zoom.ky)
                        }
                    }
                    else {
                        if (new_zoom.kx < 0) {
                            new_zoom.kx = 0
                        }
                        else if (new_zoom.kx > 1) {
                            new_zoom.kx = 1
                        }
                        reserved.focus.relative.translate.x = reserved.focus.relative.translate.x
                          - (new_zoom.kx - reserved.focus.relative.zoom.kx) * 0.5
                        reserved.focus.relative.zoom.kx = new_zoom.kx
                        if (reserved.focus.relative.translate.x < 0) {
                            reserved.focus.relative.translate.x = 0
                        }
                        if (reserved.focus.relative.translate.x > (1 - reserved.focus.relative.zoom.kx)) {
                            reserved.focus.relative.translate.x = (1 - reserved.focus.relative.zoom.kx)
                        }
                    }
                    apply_focus()
                    core_axis()
                    updateBrush()
                },
            },
            scroll: {
                end: function(event) {
                    var direction = event.wheelDelta < 0 ? 'down' : 'up'
                    if (reserved.main.location === 'left' || reserved.main.location === 'right') {
                        let new_y = reserved.focus.relative.translate.y
                      + (direction === 'down'
                          ? wheel_var.coef_trans
                          : (-wheel_var.coef_trans))
                        if (new_y < 0) {
                            new_y = 0
                        }
                        if (new_y > (1 - reserved.focus.relative.zoom.ky)) {
                            new_y = (1 - reserved.focus.relative.zoom.ky)
                        }
                        reserved.focus.relative.translate.y = new_y
                    }
                    else {
                        let new_x = reserved.focus.relative.translate.x
                    + (direction === 'down'
                        ? wheel_var.coef_trans
                        : (-wheel_var.coef_trans))
                        if (new_x < 0) {
                            new_x = 0
                        }
                        if (new_x > (1 - reserved.focus.relative.zoom.kx)) {
                            new_x = (1 - reserved.focus.relative.zoom.kx)
                        }
                        reserved.focus.relative.translate.x = new_x
                    }
                },
            },
        }

        reserved.main.g.on('wheel', function(event) {
            for (var key in reserved.interaction.wheel) {
                if (event[key]) {
                    wheel_var.key = key
                    wheel_function_bib[reserved.interaction.wheel[key].type].end(event)
                    reserved.interaction.wheel[key].end()
                    return
                }
            }
            key = 'default'
            wheel_var.key = key
            wheel_function_bib[reserved.interaction.wheel[key].type].end(event)
            reserved.interaction.wheel[key].end()
        })
    }
    function interaction_drag() {
        let drag_var = {
            x: 0,
            y: 0,
            key: undefined,
        }
        let drag_function_bib = {
            drag_trans: {
                start: function(event){
                    drag_var.x = event.x
                    drag_var.y = event.y
                },
                drag: function(event) {
                    if (reserved.main.location === 'left' || reserved.main.location === 'right') {
                        reserved.focus.relative.translate.y += (event.y - drag_var.y) / reserved.main.box.h
                        if (reserved.focus.relative.translate.y < 0) {
                            reserved.focus.relative.translate.y = 0
                        }
                        if (reserved.focus.relative.translate.y > (1 - reserved.focus.relative.zoom.ky)) {
                            reserved.focus.relative.translate.y = (1 - reserved.focus.relative.zoom.ky)
                        }
                    }
                    else {
                        reserved.focus.relative.translate.x += (event.x - drag_var.x) / reserved.main.box.w
                        if (reserved.focus.relative.translate.x < 0) {
                            reserved.focus.relative.translate.x = 0
                        }
                        if (reserved.focus.relative.translate.x > (1 - reserved.focus.relative.zoom.kx)) {
                            reserved.focus.relative.translate.x = (1 - reserved.focus.relative.zoom.kx)
                        }
                    }
                    drag_var.x = event.x
                    drag_var.y = event.y

                    apply_focus()
                    core_axis()
                    updateBrush()
                },
                end: function(event) {
                    drag_var.x = 0
                    drag_var.y = 0
                },
            },
        }

        reserved.main.g
            .on('mouseover', function() {
                d3.select(this).style('cursor', 'crosshair')
            })
            .on('mouseout', function() {
                d3.select(this).style('cursor', 'default')
            })

        let interactions = d3.drag()
            .on('start', function(event) {
                for (var key in reserved.interaction.drag) {
                    if (event.sourceEvent[key]) {
                        drag_var.key = key
                        drag_function_bib[reserved.interaction.drag[key].type].start()
                        reserved.interaction.drag[key].start()
                        return
                    }
                }
                key = 'default'
                drag_var.key = key
                drag_function_bib[reserved.interaction.drag[key].type].start(event)
                reserved.interaction.drag[key].start()
            })
            .on('drag', function() {
                drag_function_bib[reserved.interaction.drag[drag_var.key].type].drag(event)
                reserved.interaction.drag[drag_var.key].drag()

            })
            .on('end', function() {
                drag_function_bib[reserved.interaction.drag[drag_var.key].type].end(event)
                reserved.interaction.drag[drag_var.key].end()

            })

        reserved.main.g
            .call(interactions)
    }
    function update_focus() {
        // console.log('absolute', reserved.focus.absolute)
        reserved.content
            .transition()
            .duration(100)
            .attr('transform', 'scale('
              + reserved.focus.absolute.zoom.kx
              + ','
              + reserved.focus.absolute.zoom.ky
              + '),translate('
              + reserved.focus.absolute.translate.x
              + ','
              + reserved.focus.absolute.translate.y
              + ')')
    }

    function updateBrush() {
        if (!reserved.brush_parameters.visibility || !reserved.brush_parameters.zoom) {
            return
        }
        reserved.brush.g.select('rect#brush') .attr('transform', function() {
            let scale = {
                x: reserved.focus.relative.zoom.kx,
                y: reserved.focus.relative.zoom.ky,
            }
            let trans = {
                x: reserved.focus.relative.translate.x * reserved.main.box.w,
                y: reserved.focus.relative.translate.y * reserved.main.box.h,
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

    function get_focus() {
        return reserved.focus
    }
    this.get_focus = get_focus
    function set_focus(new_focus) {
        reserved.focus = new_focus
        update()
    }
    this.set_focus = set_focus


    function compute_overlap(axis, all_ticks, key) {
        // ??????????????????????????????????????????????????????????
        // DL_FIXME -
        // profiling shows this function is a bootleneck...
        // what's going on here and how can you simplify it?
        // ??????????????????????????????????????????????????????????

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
        let minTxtSize = reserved.axis_parameters.style.text.size
            ? reserved.axis_parameters.style.text.size
            : reserved.main.box.w * 0.04
        let all_ticks = axis.g.selectAll('g.tick')._groups[0]
        let overlap_array = []
        if (reserved.main.location === 'left' || reserved.main.location === 'right') {
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
                    .attr('stroke', reserved.axis_parameters.style.path.stroke)
                    .attr('opacity', reserved.axis_parameters.style.path.visible ? 1 : 0)
                text.attr('stroke', reserved.axis_parameters.style.text.stroke)
                    .attr('stroke-width', 0.6)
                    .attr('fill', reserved.axis_parameters.style.text.fill)
                    .style('font-size', minTxtSize + 'px')
                    .style('opacity', overlap_array[i])
            })
    }
    function format_ticks_band(axis) {
        let percent_before_rotate = 0.66

        let rotate = false
        let minTxtSize = reserved.axis_parameters.style.text.size
            ? reserved.axis_parameters.style.text.size
            : reserved.main.box.w * 0.04
        let max = axis.g.selectAll('g.tick').size()
        let all_ticks = axis.g.selectAll('g.tick')._groups[0]
        let overlap_array = []
        if (reserved.main.location === 'left' || reserved.main.location === 'right') {
            overlap_array = compute_overlap(axis, all_ticks, 'height')
            if (reserved.main.drawing === 'band') {
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
                    .attr('stroke', reserved.axis_parameters.style.path.stroke)
                    .attr('opacity', reserved.axis_parameters.style.path.visible ? 1 : 0)
                text.attr('stroke', reserved.axis_parameters.style.text.stroke)
                    .attr('stroke-width', 0.6)
                    .attr('fill', reserved.axis_parameters.style.text.fill)
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
                    if (reserved.main.location === 'left') {
                        text.attr('x', minTxtSize)
                            .attr('transform', 'rotate(70)')
                            .style('text-anchor', 'end')
                    }
                    if (reserved.main.location === 'right') {
                        text.attr('x', minTxtSize)
                            .attr('transform', 'rotate(70)')
                            .style('text-anchor', 'start')
                    }
                    if (reserved.main.location === 'bottom') {
                        text.attr('y', minTxtSize)
                            .attr('transform', 'rotate(20)')
                            .style('text-anchor', 'start')
                    }
                    else if (reserved.main.location === 'top') {
                        text.attr('y', -minTxtSize)
                            .attr('transform', 'rotate(20)')
                            .style('text-anchor', 'end')
                    }
                }

            })
    }
    function core_axis() {
        reserved.axis.axis.scale(reserved.axis.scale)
        if (reserved.axis_parameters.ticks_min_max && reserved.main.drawing !== 'band') {
            if (reserved.main.location === 'left' || reserved.main.location === 'right') {
                reserved.axis.axis.tickValues(
                    [ reserved.axis.scale.invert(reserved.main.box.h) ]
                        .concat(reserved.axis.scale.ticks(8))
                        .concat([ reserved.axis.scale.invert(0) ]))
            }
            else {
                reserved.axis.axis.tickValues(
                    [ reserved.axis.scale.invert(0) ]
                        .concat(reserved.axis.scale.ticks(8))
                        .concat([ reserved.axis.scale.invert(reserved.main.box.w) ]))
            }

        }

        reserved.axis.g.call(reserved.axis.axis)

        reserved.axis.g
            .select('path')
            .attr('stroke-width', 0.6)
            .attr('stroke', reserved.axis_parameters.style.path.stroke)
            .attr('opacity', reserved.axis_parameters.style.path.visible ? 1 : 0)

        if (reserved.main.drawing === 'linear') {
            format_ticks_linear(reserved.axis)
        }
        else if (reserved.main.drawing === 'time') {
            format_ticks_linear(reserved.axis)
        }
        else if (reserved.main.drawing === 'band') {
            format_ticks_band(reserved.axis)
        }
        if (!reserved.axis_parameters.visibility) {
            reserved.axis.g.style('visibility', 'hidden')
            return
        }
        reserved.axis.g.style('visibility', 'visible')
    }

    function update_domain(new_domain) {
        reserved.domain.raw = new_domain
        apply_focus()
        core_axis()
        updateBrush()
    }
    this.update_domain = update_domain
    function get_domain() {
        return reserved.domain
    }
    this.get_domain = get_domain

    function get_axis() {
        return reserved.axis
    }
    this.get_axis = get_axis
    function update_axis(opt_in) {
        reserved = window.merge_obj(reserved, opt_in)
        apply_focus()
        core_axis(reserved.axis_parameters)
        updateBrush()
    }
    this.update_axis = update_axis

    // function update() {
    //     apply_focus()
    //
    //     if (reserved.axis_parameters.zoom) {
    //         core_axis(reserved.axis_parameters)
    //     }
    //     if (reserved.brush_parameters.zoom) {
    //         updateBrush()
    //     }
    // }
    // this.update = update

    function apply_focus() {
        reserved.axis.scale.domain(reserved.domain.raw)

        reserved.domain.focus = deep_copy(reserved.domain.raw)
        if (reserved.main.location === 'top' || reserved.main.location === 'bottom') {
            reserved.domain.focus[0]
            = reserved.axis.scale.invert( reserved.focus.relative.translate.x
              * reserved.main.box.w)
            reserved.domain.focus[1]
            = reserved.axis.scale.invert((reserved.focus.relative.translate.x
              + reserved.focus.relative.zoom.kx)
              * reserved.main.box.w)
        }
        else if (reserved.main.location === 'left' || reserved.main.location === 'right') {
            reserved.domain.focus[0]
            = reserved.axis.scale.invert( reserved.focus.relative.translate.y
              * reserved.main.box.h)
            reserved.domain.focus[1]
            = reserved.axis.scale.invert((reserved.focus.relative.translate.y
              + reserved.focus.relative.zoom.ky)
              * reserved.main.box.h)
        }
        // reserved.axis.scale.domain(reserved.domain.focus)
    }
}
