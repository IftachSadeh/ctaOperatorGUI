/* global d3 */
/* global times */
/* global is_def */
/* global deep_copy */
/* global cols_blues */
/* global PlotBrushZoom */
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
                    default: {
                        type: 'default',
                        start: () => {},
                        drag: () => {},
                        end: () => {},
                    },
                },
                drag: {
                    default: {
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
                        type: 'default',
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
    // function get_focus_percent() {
    //     return {
    //         zoom: {
    //             kx: reserved.focus.zoom,
    //             ky: reserved.focus.zoom,
    //         },
    //         translate: {
    //             x: 0,
    //             y: 0,
    //         },
    //     }
    // }

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
        reserved.content.on('click', () => {
            console.log('click')
        })
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
        // interaction_drag()
        // init_shortcut()

        update_focus()
    }
    this.init = init

    function init_db_click() {

    }
    function interaction_wheel() {

    }
    function interaction_drag() {
        let drag_function_bib = {
            zoom_rect: {
                start: function() {
                    console.log('drag_zoom_fun_core-start')
                    // reserved.brush.meta.x = d3.event.x
                    // reserved.brush.meta.y = d3.event.y
                    // reserved.clipping.maing.append('rect')
                    //     .attr('id', 'zoom_rect')
                    //     .attr('x', reserved.brush.meta.x)
                    //     .attr('y', reserved.brush.meta.y)
                    //     .attr('width', 0)
                    //     .attr('height', 0)
                    //     .attr('fill', 'none')
                    //     .attr('stroke', '#000000')
                    //     .attr('stroke-width', 2)
                    //     .attr('stroke-dasharray', [ 8, 2 ])
                },
                drag: function() {
                    console.log('drag_zoom_fun_core-drag')
                    // reserved.clipping.maing.select('rect#zoom_rect')
                    //     .attr('x', d3.event.x > reserved.brush.meta.x
                    //         ? reserved.brush.meta.x
                    //         : d3.event.x)
                    //     .attr('y', d3.event.y > reserved.brush.meta.y
                    //         ? reserved.brush.meta.y
                    //         : d3.event.y)
                    //     .attr('width', Math.abs(d3.event.x - reserved.brush.meta.x))
                    //     .attr('height', Math.abs(d3.event.y - reserved.brush.meta.y))
                },
                end: function() {
                    console.log('drag_zoom_fun_core-end')
                    //               reserved.clipping.maing.select('rect#zoom_rect')
                    //                   .remove()
                    //
                    //               let trans_percent = {
                    //                   x: (d3.event.x > reserved.brush.meta.x
                    //                       ? reserved.brush.meta.x
                    //                       : d3.event.x)
                    //           / reserved.main.box.w,
                    //                   y: (d3.event.y > reserved.brush.meta.y
                    //                       ? reserved.brush.meta.y
                    //                       : d3.event.y)
                    //           / reserved.main.box.h,
                    //               }
                    //               reserved.zoom.coef.x = reserved.zoom.coef.x
                    // + (trans_percent.x
                    //     * reserved.main.box.w
                    //     * reserved.zoom.coef.kx)
                    //               reserved.zoom.coef.y = reserved.zoom.coef.y
                    // + (trans_percent.y
                    //     * reserved.main.box.h
                    //     * reserved.zoom.coef.ky)
                    //
                    //               let zoom_percent = {
                    //                   x: Math.abs(d3.event.x - reserved.brush.meta.x)
                    //       / reserved.main.box.w,
                    //                   y: Math.abs(d3.event.y - reserved.brush.meta.y)
                    //       / reserved.main.box.h,
                    //               }
                    //               reserved.zoom.coef.kx = zoom_percent.x * reserved.zoom.coef.kx
                    //               reserved.zoom.coef.ky = zoom_percent.y * reserved.zoom.coef.ky
                    //
                    //               reserved.zoom.meta.kx.previous = reserved.zoom.meta.kx.now
                    //               reserved.zoom.meta.kx.now = 1 / reserved.zoom.coef.kx
                    //               reserved.zoom.meta.ky.previous = reserved.zoom.meta.ky.now
                    //               reserved.zoom.meta.ky.now = 1 / reserved.zoom.coef.ky
                    //
                    //               brush_zoom_link('top-bottom', {
                    //                   brush: reserved.brush,
                    //                   zoom: reserved.zoom,
                    //               })
                    //               brush_zoom_link('left-right', {
                    //                   brush: reserved.brush,
                    //                   zoom: reserved.zoom,
                    //               })
                    //               reserved.brush.meta.x = 0
                    //               reserved.brush.meta.y = 0
                },
            },
            drag_trans: {
                start: function(){
                    console.log('drag_trans_fun_core-start')
                },
                drag: function() {
                    console.log('drag_trans_fun_core-drag')
                },
                end: function() {
                    console.log('drag_trans_fun_core-end')
                },
            },
        }

        reserved.content
            .on('mouseover', function() {
                d3.select(this).style('cursor', 'crosshair')
            })
            .on('mouseout', function() {
                d3.select(this).style('cursor', 'default')
            })

        let interactions = d3.drag()
            .on('start', function() {
                for (var key in reserved.interaction.drag) {
                    if (d3.event.sourceEvent[key] || key === 'default'){
                        drag_function_bib[reserved.interaction.drag[key].type].start()
                        reserved.interaction.drag[key].start()
                    }
                }
            })
            .on('drag', function() {
                for (var key in reserved.interaction.drag) {
                    if (d3.event.sourceEvent[key] || key === 'default'){
                        drag_function_bib[reserved.interaction.drag[key].type].drag()
                        reserved.interaction.drag[key].drag()
                    }
                }
            })
            .on('end', function() {
                for (var key in reserved.interaction.drag) {
                    if (d3.event.sourceEvent[key] || key === 'default'){
                        drag_function_bib[reserved.interaction.drag[key].type].end()
                        reserved.interaction.drag[key].end()
                    }
                }
            })

        reserved.content
            .call(interactions)
        console.log(reserved.content)
    }

    // function init_shortcut() {
    //     reserved.shortcut = {
    //         'fit': function() {
    //             reserved.focus.absolute.zoom.kx
    //               = reserved.main.box.w / reserved.focus.dimension.w
    //             reserved.focus.absolute.zoom.ky
    //               = reserved.main.box.h / reserved.focus.dimension.h
    //             // let content_box = get_d3_node_box(reserved.content)
    //             // reserved.focus.absolute.translate.x
    //             //   = -content_box.x * (reserved.focus.absolute.zoom.kx - 1)
    //             // reserved.focus.absolute.translate.y
    //             //   = -content_box.y * (reserved.focus.absolute.zoom.ky - 1)
    //
    //             reserved.focus.relative.zoom = {
    //                 kx: 1,
    //                 ky: 1,
    //             }
    //             reserved.focus.relative.translate = {
    //                 x: 0,
    //                 y: 0,
    //             }
    //             update_focus()
    //         },
    //         'start': function() {
    //             reserved.focus.zoom.kx = 1
    //             reserved.focus.zoom.ky = 1
    //             reserved.focus.translate.x = 0
    //             reserved.focus.translate.y = 0
    //             update_focus()
    //         },
    //         'end': function() {
    //             reserved.focus.zoom.kx = 1
    //             reserved.focus.zoom.ky = 1
    //             reserved.focus.translate.x = -(reserved.focus.dimension.w
    //               - reserved.main.box.w)
    //             reserved.focus.translate.y = -(reserved.focus.dimension.h
    //               - reserved.main.box.h)
    //             update_focus()
    //         },
    //     }
    // }
    // function use_content_shortcut(short_name) {
    //     reserved.shortcut[short_name]()
    // }
    // this.use_content_shortcut = use_content_shortcut
    // function add_content_zoom_shortcut() {
    //
    // }
    // this.add_content_zoom_shortcut = add_content_zoom_shortcut

    function update_focus() {
        reserved.content
            .attr('transform', 'translate('
              + reserved.focus.absolute.translate.x
              + ','
              + reserved.focus.absolute.translate.y
              + '),scale('
              + reserved.focus.absolute.zoom.kx
              + ','
              + reserved.focus.absolute.zoom.ky
              + ')')
    }

    // function compute_content_zoom() {
    //     reserved.focus.absolute.zoom = {
    //         kx: reserved.focus.absolute.zoom.kx
    //           * (reserved.main.box.w / reserved.focus.dimension.w),
    //         ky: reserved.focus.absolute.zoom.ky
    //           * (reserved.main.box.h / reserved.focus.dimension.h),
    //     }
    // }
    // this.compute_content_zoom = compute_content_zoom
    // function compute_content_trans() {
    //     reserved.focus.translate.x
    //       = reserved.focus.translate.x
    //       * (reserved.focus.zoom.kx - 1)
    //     reserved.focus.translate.y
    //       = reserved.focus.translate.y
    //       * (reserved.focus.zoom.ky - 1)
    // }
    // this.compute_content_trans = compute_content_trans

    function set_content_zoom_rel(zoom) {
        reserved.focus.relative.zoom = zoom
        reserved.focus.absolute.zoom = {
            kx: reserved.main.box.w
              / (reserved.focus.relative.zoom.kx
                * reserved.focus.dimension.w),
            ky: reserved.main.box.h
              / (reserved.focus.relative.zoom.ky
                * reserved.focus.dimension.h),
        }
        update_focus()
    }
    this.set_content_zoom_rel = set_content_zoom_rel
    function set_content_zoom_abs(zoom) {
        reserved.focus.absolute.zoom = zoom
        reserved.focus.relative.zoom = {
            kx: reserved.focus.absolute.zoom.kx
            * (reserved.main.box.w / reserved.focus.dimension.w),
            ky: reserved.focus.absolute.zoom.ky
            * (reserved.main.box.h / reserved.focus.dimension.h),
        }
    }
    this.set_content_zoom_abs = set_content_zoom_abs

    function set_content_trans_rel(trans) {
        reserved.focus.relative.translate = trans
        reserved.focus.absolute.translate = {
            x: -reserved.focus.dimension.w
              * reserved.focus.relative.translate.x,
            y: -reserved.focus.dimension.h
              * reserved.focus.relative.translate.y,
        }
        update_focus()
    }
    this.set_content_trans_rel = set_content_trans_rel
    function set_content_trans_abs(trans) {
        reserved.focus.absolute.translate = trans
        reserved.focus.relative.translate = {
            x: -reserved.focus.absolute.translate.x / reserved.focus.dimension.w,
            y: -reserved.focus.absolute.translate.y / reserved.focus.dimension.h,
        }
        update_focus()
    }
    this.set_content_trans_abs = set_content_trans_abs
    function set_content_dim(dimension) {
        if (!dimension) {
            let content_box = get_d3_node_box(reserved.content)
            reserved.focus.dimension = {
                w: content_box.width,
                h: content_box.height,
            }
        }
        else {
            reserved.focus.dimension = {
                w: dimension.w,
                h: dimension.h,
            }
        }

        // reserved.focus.zoom.absolute
        reserved.focus.relative.zoom = {
            kx: reserved.focus.absolute.zoom.kx
          * (reserved.main.box.w / reserved.focus.dimension.w),
            ky: reserved.focus.absolute.zoom.ky
          * (reserved.main.box.h / reserved.focus.dimension.h),
        }

        // compute_content_zoom()
        update_focus()
    }
    this.set_content_dim = set_content_dim
}
