/* global d3 */
/* global get_d3_node_box */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.PanZoomBox = function() {
    let reserved

    function get_default_template() {
        return {
            main: {
                tag: 'tag',
                g: undefined,
                box: {
                    x: -1,
                    y: -1,
                    w: -1,
                    h: -1,
                },
            },
            interaction: {
                wheel: {
                    shiftKey: {
                        type: 'zoom',
                        end: () => {},
                    },
                    default: {
                        type: 'scroll_y',
                        end: () => {},
                    },
                },
                drag: {
                    default: {
                        type: 'drag_trans',
                        start: () => {
                            console.log('drag_trans_fun_callback-start')
                        },
                        drag: () => {
                            console.log('drag_trans_fun_callback-drag')
                        },
                        end: () => {
                            console.log('drag_trans_fun_callback-end')
                        },
                    },
                    shiftKey: {
                        type: 'zoom_rect',
                        start: () => {
                            console.log('drag_trans_fun_callback-start')
                        },
                        drag: () => {
                            console.log('drag_trans_fun_callback-drag')
                        },
                        end: () => {
                            console.log('drag_trans_fun_callback-end')
                        },
                    },
                },
                db_click: {
                    default: {
                        type: 'fit',
                        end: () => {},
                    },
                },
            },
        }
    }
    this.get_default_template = get_default_template

    function get_background() {
        return reserved.background
    }
    this.get_background = get_background
    function get_content() {
        return reserved.content
    }
    this.get_content = get_content
    function get_clipping() {
        return reserved.clipping.g
    }
    this.get_clipping = get_clipping
    function get_focus() {
        return reserved.focus.relative
    }
    this.get_focus = get_focus

    function init_background() {
        reserved.background = reserved.main.g
            .append('g')
            .attr('id', reserved.main.tag + '_background')
            .attr('transform', 'translate('
            + reserved.main.box.x
            + ','
            + reserved.main.box.y
            + ')')
    }
    function init_clipping() {
        reserved.clipping = {
        }
        reserved.clipping.g = reserved.main.g.append('g')
            .attr('transform', 'translate('
            + reserved.main.box.x
            + ','
            + reserved.main.box.y
            + ')')
        reserved.clipping.g
            .append('defs')
            .append('svg:clipPath')
            .attr('id', reserved.main.tag + '_clip')
            .append('svg:rect')
            .attr('id', reserved.main.tag + '_clip-rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', reserved.main.box.w)
            .attr('height', reserved.main.box.h)
        reserved.clipping.clipBody = reserved.clipping.g
            .append('g')
            .attr('clip-path', 'url(#' + reserved.main.tag + '_clip)')
    }
    function init_content() {
        reserved.content = reserved.clipping.clipBody
            .append('g')
            .attr('id', reserved.main.tag + '_content')
    }
    function init_focus() {
        reserved.focus = {
            dimension: {
                w: reserved.main.box.w,
                h: reserved.main.box.h,
            },
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
    function init(opt_in) {
        reserved = window.merge_obj(get_default_template(), opt_in)
        init_background()
        init_clipping()
        init_content()
        init_focus()
        interaction_drag()
        interaction_wheel()
        interaction_dbclick()
        // init_shortcut()

        update_focus()
    }
    this.init = init

    function interaction_dbclick() {
        reserved.main.g.on('dblclick', function() {
            d3.event.preventDefault()
            set_content_rel({
                zoom: {
                    kx: 1,
                    ky: 1,
                },
                trans: {
                    x: 0,
                    y: 0,
                },
            })
        })
    }
    function interaction_wheel() {
        let wheel_var = {
            x: 0,
            y: 0,
            key: undefined,
            coef_zoom: 1.2,
            coef_trans: 0.05,
        }
        let wheel_function_bib = {
            zoom: {
                end: function() {
                    var direction = d3.event.wheelDelta < 0 ? 'down' : 'up'
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
                    set_content_rel({
                        zoom: {
                            kx: new_zoom.kx,
                            ky: new_zoom.ky,
                        },
                        trans: {
                            x: reserved.focus.relative.translate.x
                            - (new_zoom.kx - reserved.focus.relative.zoom.kx) * 0.5,
                            y: reserved.focus.relative.translate.y
                            - (new_zoom.ky - reserved.focus.relative.zoom.ky) * 0.5,
                        },
                    })
                },
            },
            scroll_y: {
                end: function() {
                    var direction = d3.event.wheelDelta < 0 ? 'down' : 'up'
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
                    console.log(new_y)
                    set_content_rel({
                        trans: {
                            x: reserved.focus.relative.translate.x,
                            y: new_y,
                        },
                    })
                },
            },
        }

        reserved.main.g.on('wheel', function() {
            for (var key in reserved.interaction.wheel) {
                if (d3.event[key]) {
                    wheel_var.key = key
                    wheel_function_bib[reserved.interaction.wheel[key].type].end()
                    reserved.interaction.wheel[key].end()
                    return
                }
            }
            key = 'default'
            wheel_var.key = key
            wheel_function_bib[reserved.interaction.wheel[key].type].end()
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
            zoom_rect: {
                start: function() {
                    drag_var.x = d3.event.x
                    drag_var.y = d3.event.y
                    reserved.main.g.append('rect')
                        .attr('id', 'zoom_rect')
                        .attr('x', drag_var.x)
                        .attr('y', drag_var.y)
                        .attr('width', 0)
                        .attr('height', 0)
                        .attr('fill', 'none')
                        .attr('stroke', '#000000')
                        .attr('stroke-width', 2)
                        .attr('stroke-dasharray', [ 8, 2 ])
                },
                drag: function() {
                    reserved.main.g.select('rect#zoom_rect')
                        .attr('x', d3.event.x > drag_var.x
                            ? drag_var.x
                            : d3.event.x)
                        .attr('y', d3.event.y > drag_var.y
                            ? drag_var.y
                            : d3.event.y)
                        .attr('width', Math.abs(d3.event.x - drag_var.x))
                        .attr('height', Math.abs(d3.event.y - drag_var.y))
                },
                end: function() {
                    reserved.main.g.select('rect#zoom_rect')
                        .remove()
                    let vertical_values = {
                        y: (d3.event.y > drag_var.y
                            ? drag_var.y - reserved.main.box.y
                            : d3.event.y - reserved.main.box.y) / reserved.main.box.h,
                        ky: Math.abs(d3.event.y - drag_var.y) / reserved.main.box.h,
                    }
                    let horizontal_values = {
                        x: (d3.event.x > drag_var.x
                            ? drag_var.x - reserved.main.box.x
                            : d3.event.x - reserved.main.box.x) / reserved.main.box.w,
                        kx: Math.abs(d3.event.x - drag_var.x) / reserved.main.box.w,
                    }

                    // console.log(reserved.focus.relative.zoom)
                    // console.log(reserved.focus.relative.translate)
                    // console.log(vertical_values, horizontal_values)
                    set_content_rel({
                        zoom: {
                            kx: reserved.focus.relative.zoom.kx * horizontal_values.kx,
                            ky: reserved.focus.relative.zoom.ky * vertical_values.ky,
                        },
                        trans: {
                            x: reserved.focus.relative.translate.x
                            + (reserved.focus.relative.zoom.kx * horizontal_values.x),
                            y: reserved.focus.relative.translate.y
                            + (reserved.focus.relative.zoom.ky * vertical_values.y),
                        },
                    })

                    drag_var.x = 0
                    drag_var.y = 0
                    update_focus()
                },
            },
            drag_trans: {
                start: function(){
                    drag_var.x = d3.event.x
                    drag_var.y = d3.event.y
                },
                drag: function() {
                    set_content_abs({
                        trans: {
                            x: reserved.focus.absolute.translate.x
                            + (d3.event.x - drag_var.x),
                            y: reserved.focus.absolute.translate.y
                            + (d3.event.y - drag_var.y),
                        },
                    })
                    drag_var.x = d3.event.x
                    drag_var.y = d3.event.y
                },
                end: function() {
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
            .on('start', function() {
                for (var key in reserved.interaction.drag) {
                    if (d3.event.sourceEvent[key]) {
                        drag_var.key = key
                        drag_function_bib[reserved.interaction.drag[key].type].start()
                        reserved.interaction.drag[key].start()
                        return
                    }
                }
                key = 'default'
                drag_var.key = key
                drag_function_bib[reserved.interaction.drag[key].type].start()
                reserved.interaction.drag[key].start()
            })
            .on('drag', function() {
                drag_function_bib[reserved.interaction.drag[drag_var.key].type].drag()
                reserved.interaction.drag[drag_var.key].drag()

            })
            .on('end', function() {
                drag_function_bib[reserved.interaction.drag[drag_var.key].type].end()
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

    function set_content_rel(opt_in) {
        // console.log('opt_in', opt_in)
        if (opt_in.zoom) {
            reserved.focus.relative.zoom = opt_in.zoom
            reserved.focus.absolute.zoom = {
                kx: reserved.main.box.w
            / (reserved.focus.relative.zoom.kx
              * reserved.focus.dimension.w),
                ky: reserved.main.box.h
            / (reserved.focus.relative.zoom.ky
              * reserved.focus.dimension.h),
            }
        }
        if (opt_in.trans) {
            reserved.focus.relative.translate = opt_in.trans
            reserved.focus.absolute.translate = {
                x: -reserved.focus.dimension.w
            * reserved.focus.relative.translate.x,
                y: -reserved.focus.dimension.h
            * reserved.focus.relative.translate.y,
            }
        }
        // console.log(reserved.focus.relative)
        // console.log(reserved.focus.absolute)
        // console.log(reserved.main.box)
        // console.log('relative', reserved.focus.relative)
        update_focus()
    }
    this.set_content_rel = set_content_rel
    function set_content_abs(opt_in) {
        if (opt_in.zoom) {
            reserved.focus.absolute.zoom = opt_in.zoom
            reserved.focus.relative.zoom = {
                kx: reserved.focus.absolute.zoom.kx
          * (reserved.main.box.w / reserved.focus.dimension.w),
                ky: reserved.focus.absolute.zoom.ky
          * (reserved.main.box.h / reserved.focus.dimension.h),
            }
        }
        if (opt_in.trans) {
            reserved.focus.absolute.translate = opt_in.trans
            reserved.focus.relative.translate = {
                x: -reserved.focus.absolute.translate.x / reserved.focus.dimension.w,
                y: -reserved.focus.absolute.translate.y / reserved.focus.dimension.h,
            }
        }
        update_focus()
    }
    this.set_content_abs = set_content_abs

    function set_content_dim(dimension) {
        let old_dim = reserved.focus.dimension
        if (!dimension) {
            let content_box = get_d3_node_box(reserved.content)
            reserved.focus.dimension = {
                w: content_box.width,
                h: content_box.height,
            }
            if (old_dim.w === content_box.width
              && old_dim.h === content_box.height) {
                return
            }
        }
        else {
            reserved.focus.dimension = {
                w: dimension.w,
                h: dimension.h,
            }
        }

        set_content_rel({
            zoom: {
                kx: (reserved.focus.relative.zoom.kx * old_dim.w)
                / reserved.focus.dimension.w,
                ky: (reserved.focus.relative.zoom.ky * old_dim.h)
                / reserved.focus.dimension.h,
            },
            trans: {
                x: (reserved.focus.relative.translate.x * old_dim.w)
                / reserved.focus.dimension.w,
                y: (reserved.focus.relative.translate.y * old_dim.h)
                / reserved.focus.dimension.h,
            },
        })
    }
    this.set_content_dim = set_content_dim
}
