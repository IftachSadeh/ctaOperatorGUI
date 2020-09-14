/* global d3 */
/* global times */
/* global is_def */
/* global deep_copy */
/* global cols_blues */
/* global PlotBrushZoom */
/* global PanZoomBox */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ScrollBox = function() {
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
            scroll: {
                can_scroll: true,
                vertical: {
                    enabled: true,
                    location: 'both', // left / both
                    cursor: {
                        size: 4,
                        color: '#000000',
                    },
                },
                horizontal: {
                    enabled: false,
                    location: 'bottom', // top / both
                    cursor: {
                        size: 4,
                        color: '#000000',
                    },
                },
            },
        }
    }
    this.get_default_template = get_default_template

    function get_background() {
        return reserved.pan_zoom_box.get_background()
    }
    this.get_background = get_background
    function get_content() {
        return reserved.pan_zoom_box.get_content()
    }
    this.get_content = get_content

    function init_pan_zoom_box() {
        reserved.pan_zoom_box = new PanZoomBox()
        reserved.pan_zoom_box.init({
            main: {
                tag: reserved.main.tag + '_pan_zoom_box',
                g: reserved.main.g,
                box: reserved.main.box,
            },
        })
    }
    function init_interaction() {
        if (!reserved.scroll.can_scroll) {
            return
        }
        // function computeDragFactor() {
        //     reserved.zoom.coef.x = reserved.zoom.coef.x + reserved.brush.meta.x
        //     if (reserved.zoom.coef.x < 0) {
        //         reserved.zoom.coef.x = 0
        //     }
        //     let right
        //   = reserved.zoom.coef.x
        //   + reserved.zoom.meta.x.max
        //   * (1 / reserved.zoom.meta.kx.now)
        //     if (right > reserved.zoom.meta.x.max) {
        //         reserved.zoom.coef.x
        //       = reserved.zoom.coef.x - (right - reserved.zoom.meta.x.max)
        //     }
        //
        //     reserved.zoom.coef.y = reserved.zoom.coef.y + reserved.brush.meta.y
        //     if (reserved.zoom.coef.y < 0) {
        //         reserved.zoom.coef.y = 0
        //     }
        //     let bottom
        //   = reserved.zoom.coef.y
        //   + reserved.zoom.meta.y.max
        //   * (1 / reserved.zoom.meta.ky.now)
        //     if (bottom > reserved.zoom.meta.y.max) {
        //         reserved.zoom.coef.y
        //       = reserved.zoom.coef.y - (bottom - reserved.zoom.meta.y.max)
        //     }
        // }
        //
        // reserved.clipping.maing
        //     .on('mouseover', function() {
        //         d3.select(this).style('cursor', 'crosshair')
        //     })
        //     .on('mouseout', function() {
        //         d3.select(this).style('cursor', 'default')
        //     })
        //
        // let rect_zoom = d3.drag()
        //     .on('start', function() {
        //         reserved.brush.meta.x = d3.event.x
        //         reserved.brush.meta.y = d3.event.y
        //         console.log(reserved.brush.meta)
        //         reserved.clipping.maing.append('rect')
        //             .attr('id', 'zoom_rect')
        //             .attr('x', reserved.brush.meta.x)
        //             .attr('y', reserved.brush.meta.y)
        //             .attr('width', 0)
        //             .attr('height', 0)
        //             .attr('fill', 'none')
        //             .attr('stroke', '#000000')
        //             .attr('stroke-width', 2)
        //             .attr('stroke-dasharray', [ 8, 2 ])
        //     })
        //     .on('drag', function() {
        //         reserved.clipping.maing.select('rect#zoom_rect')
        //             .attr('x', d3.event.x > reserved.brush.meta.x
        //                 ? reserved.brush.meta.x
        //                 : d3.event.x)
        //             .attr('y', d3.event.y > reserved.brush.meta.y
        //                 ? reserved.brush.meta.y
        //                 : d3.event.y)
        //             .attr('width', Math.abs(d3.event.x - reserved.brush.meta.x))
        //             .attr('height', Math.abs(d3.event.y - reserved.brush.meta.y))
        //     })
        //     .on('end', function() {
        //         reserved.clipping.maing.select('rect#zoom_rect')
        //             .remove()
        //
        //         let trans_percent = {
        //             x: (d3.event.x > reserved.brush.meta.x
        //                 ? reserved.brush.meta.x
        //                 : d3.event.x)
        //                 / reserved.main.box.w,
        //             y: (d3.event.y > reserved.brush.meta.y
        //                 ? reserved.brush.meta.y
        //                 : d3.event.y)
        //                 / reserved.main.box.h,
        //         }
        //         reserved.zoom.coef.x = reserved.zoom.coef.x
        //       + (trans_percent.x
        //           * reserved.main.box.w
        //           * reserved.zoom.coef.kx)
        //         reserved.zoom.coef.y = reserved.zoom.coef.y
        //       + (trans_percent.y
        //           * reserved.main.box.h
        //           * reserved.zoom.coef.ky)
        //
        //         let zoom_percent = {
        //             x: Math.abs(d3.event.x - reserved.brush.meta.x)
        //             / reserved.main.box.w,
        //             y: Math.abs(d3.event.y - reserved.brush.meta.y)
        //             / reserved.main.box.h,
        //         }
        //         reserved.zoom.coef.kx = zoom_percent.x * reserved.zoom.coef.kx
        //         reserved.zoom.coef.ky = zoom_percent.y * reserved.zoom.coef.ky
        //
        //         reserved.zoom.meta.kx.previous = reserved.zoom.meta.kx.now
        //         reserved.zoom.meta.kx.now = 1 / reserved.zoom.coef.kx
        //         reserved.zoom.meta.ky.previous = reserved.zoom.meta.ky.now
        //         reserved.zoom.meta.ky.now = 1 / reserved.zoom.coef.ky
        //
        //         brush_zoom_link('top-bottom', {
        //             brush: reserved.brush,
        //             zoom: reserved.zoom,
        //         })
        //         brush_zoom_link('left-right', {
        //             brush: reserved.brush,
        //             zoom: reserved.zoom,
        //         })
        //         reserved.brush.meta.x = 0
        //         reserved.brush.meta.y = 0
        //     })
        // let drag_trans = d3.drag()
        //     .on('start', function() {})
        //     .on('drag', function() {
        //         reserved.brush.meta.x = d3.event.dx
        //         reserved.brush.meta.y = d3.event.dy
        //
        //         computeDragFactor()
        //
        //         brush_zoom_link('top-bottom', {
        //             brush: reserved.brush,
        //             zoom: reserved.zoom,
        //         })
        //         brush_zoom_link('left-right', {
        //             brush: reserved.brush,
        //             zoom: reserved.zoom,
        //         })
        //     })
        //     .on('end', function() {
        //         reserved.brush.meta.x = 0
        //         reserved.brush.meta.y = 0
        //     })
        //
        // switch (reserved.brush.behavior) {
        // case 'zoom_rect':
        //     reserved.clipping.maing
        //         .call(rect_zoom)
        //     break
        // case 'drag_trans':
        //     reserved.clipping.maing
        //         .call(drag_trans)
        //     break
        // default:
        //     reserved.clipping.maing
        //         .call(drag_trans)
        //
        // }
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

        reserved.main.g
            .on('mouseover', function() {
                d3.select(this).style('cursor', 'crosshair')
            })
            .on('mouseout', function() {
                d3.select(this).style('cursor', 'default')
            })
        reserved.main.g
            .on('wheel', function() {
                d3.event.preventDefault()

                // VERTICAL ZOOM
                if (reserved.scroll.vertical.enabled
                  && !reserved.scroll.horizontal.enabled) {
                    reserved.zoom.meta.ky.point = d3.mouse(d3.select(this).node())
                    let sign = -Math.abs(d3.event.deltaY) / d3.event.deltaY
                    //   reserved.zoom.meta.ky.previous = reserved.zoom.meta.ky.now
                    //   reserved.zoom.meta.ky.now
                    // += sign * Math.log(Math.abs(d3.event.deltaY)) * 0.02
                    //   if (reserved.zoom.meta.ky.now < reserved.zoom.meta.ky.min) {
                    //       reserved.zoom.meta.ky.now = reserved.zoom.meta.ky.min
                    //   }
                    //   if (reserved.zoom.meta.ky.now > reserved.zoom.meta.ky.max) {
                    //       reserved.zoom.meta.ky.now = reserved.zoom.meta.ky.max
                    //   }
                    computeZoomFactorky()
                    // brush_zoom_link('left-right', {
                    //     brush: reserved.brush,
                    //     zoom: reserved.zoom,
                    // })
                }
                // HORIZONTAL ZOOM
                if (reserved.scroll.horizontal.enabled
                  && !reserved.scroll.vertical.enabled) {
                    reserved.zoom.meta.kx.point = d3.mouse(d3.select(this).node())
                    let sign = -Math.abs(d3.event.deltaY) / d3.event.deltaY
                    //   reserved.zoom.meta.kx.previous = reserved.zoom.meta.kx.now
                    //
                    //   reserved.zoom.meta.kx.now
                    // += sign * Math.log(Math.abs(d3.event.deltaY)) * 0.02
                    //   if (reserved.zoom.meta.kx.now < reserved.zoom.meta.kx.min) {
                    //       reserved.zoom.meta.kx.now = reserved.zoom.meta.kx.min
                    //   }
                    //   if (reserved.zoom.meta.kx.now > reserved.zoom.meta.kx.max) {
                    //       reserved.zoom.meta.kx.now = reserved.zoom.meta.kx.max
                    //   }
                    computeZoomFactorkx()
                    // brush_zoom_link('top-bottom', {
                    //     brush: reserved.brush,
                    //     zoom: reserved.zoom,
                    // })
                }
            })
    }

    function convert_to_brush_zoom_template(opt_in) {
        let axis_default = {
            g: undefined,
            box: {
                x: 0,
                y: 0,
                w: reserved.main.box.w,
                h: reserved.main.box.h,
                marg: 0,
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
        if (opt_in.location === 'bottom') {
            axis_default.box.y = reserved.main.box.h
              + ((axis_width * reserved.axis.bottom.length)
              + (marg * reserved.axis.bottom.length))
            axis_default.box.h = axis_width
            axis_default.style.axis.tickSize = -reserved.main.box.h
            axis_default.range = [ 0, axis_default.box.w ]
        }
        else if (opt_in.location === 'top') {
            axis_default.box.y = -(axis_width * (reserved.axis.top.length + 1))
              - (marg * reserved.axis.top.length)
            axis_default.box.h = axis_width
            axis_default.style.axis.tickSize = -reserved.main.box.h
            axis_default.range = [ 0, axis_default.box.w ]
        }
        else if (opt_in.location === 'left') {
            axis_default.box.x = -reserved.scroll.vertical.cursor.size
            axis_default.box.w = reserved.scroll.vertical.cursor.size
            axis_default.range = [ axis_default.box.h, 0 ]
        }
        else if (opt_in.location === 'right') {
            axis_default.box.x = reserved.main.box.w
            axis_default.box.w = reserved.scroll.vertical.cursor.size
            axis_default.range = [ axis_default.box.h, 0 ]
        }
        let merged_axis = window.merge_obj(axis_default, opt_in)
        return merged_axis
    }
    function init_scroll() {
        function create_scroller(type, location) {
            let converted_axis = convert_to_brush_zoom_template({
                g: reserved.scroll[type].g.append('g'),
                id: location,
                location: location,
                type: 'linear',
                profile: 'scrollbox',
                domain: [ 0, reserved.main.box[type === 'vertical' ? 'h' : 'w'] ],
                range: [ 0, reserved.main.box[type === 'vertical' ? 'h' : 'w'] ],
            })
            let scroller = new PlotBrushZoom()
            scroller.init(converted_axis)
            return scroller
        }
        function init_scroll_vertical() {
            reserved.scroll.vertical.g = reserved.main.g
                .append('g')
                .attr('id', reserved.main.tag + '_vertical')
                .attr('transform', 'translate('
                  + reserved.main.box.x
                  + ','
                  + reserved.main.box.y
                  + ')')
            if (reserved.scroll.vertical.location === 'both') {
                let left = create_scroller('vertical', 'left')
                let right = create_scroller('vertical', 'right')
                reserved.scroll.vertical.scroller = [
                    left,
                    right,
                ]
            }
            else if (reserved.scroll.vertical.location === 'left') {
                let left = create_scroller('vertical', 'left')
                reserved.scroll.vertical.scroller = [
                    left,
                ]
            }
            else if (reserved.scroll.vertical.location === 'right') {
                let right = create_scroller('vertical', 'right')
                reserved.scroll.vertical.scroller = [
                    right,
                ]
            }
        }
        function init_scroll_horizontal() {
            return
            reserved.scroll.horizontal.g = reserved.main.g
                .append('g')
                .attr('id', reserved.main.tag + 'horizontal')
                .attr('transform', 'translate('
                  + reserved.main.box.x
                  + ','
                  + reserved.main.box.y
                  + ')')
            if (reserved.scroll.horizontal.location === 'both') {
                let top = create_scroller('horizontal', 'top')
                let bottom = create_scroller('horizontal', 'bottom')
                reserved.scroll.horizontal.scroller = [
                    top,
                    bottom,
                ]
            }
            else if (reserved.scroll.horizontal.location === 'top') {
                let top = create_scroller('horizontal', 'top')
                reserved.scroll.horizontal.scroller = [
                    top,
                ]
            }
            else if (reserved.scroll.horizontal.location === 'bottom') {
                let bottom = create_scroller('horizontal', 'bottom')
                reserved.scroll.horizontal.scroller = [
                    bottom,
                ]
            }
        }

        init_scroll_vertical()
        init_scroll_horizontal()
    }
    function init_brush_zoom_factor() {
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
    function init(opt_in) {
        reserved = window.merge_obj(get_default_template(), opt_in)

        init_pan_zoom_box()

        init_scroll()
        // init_scroll_horizontal()
        // init_brush_zoom_factor()
        // init_interaction()
        // update_scroll_dim({
        //     height: reserved.scroll.vertical.height,
        // })
    }
    this.init = init

    function update_scroller() {
        for (var i = 0; i < reserved.scroll.vertical.scroller.length; i++) {
            console.log(reserved.scroll.vertical.scroller[i].get_focus())
            reserved.scroll.vertical.scroller[i]
                .update_focus(reserved.pan_zoom_box.get_focus())
            console.log(reserved.scroll.vertical.scroller[i].get_focus())
        }
    }

    // function brush_zoom_link() {
    //     if (reserved.scroll.horizontal.enabled) {
    //         for (let i = 0; i < reserved.scroll.horizontal.scroller.length; i++) {
    //             reserved.scroll.horizontal.scroller[i]
    //                 .set_brush_zoom_factor_horizontal({
    //                     brush: reserved.brush,
    //                     zoom: reserved.zoom,
    //                 })
    //         }
    //     }
    //     if (reserved.scroll.vertical.enabled) {
    //         for (let i = 0; i < reserved.scroll.vertical.scroller.length; i++) {
    //             reserved.scroll.vertical.scroller[i]
    //                 .set_brush_zoom_factor_vertical({
    //                     brush: reserved.brush,
    //                     zoom: reserved.zoom,
    //                 })
    //         }
    //         console.log({
    //             brush: reserved.brush,
    //             zoom: reserved.zoom,
    //         })
    //     }
    //     // update_data()
    // }
    //
    // function get_brush_zoom_factor() {
    //     return {
    //         zoom: reserved.zoom,
    //         brush: reserved.brush,
    //     }
    // }
    // this.get_brush_zoom_factor = get_brush_zoom_factor
    // function update_scroll_dim(opt_in) {
    //     if (opt_in.height) {
    //         let new_zoom = {
    //             coef: {
    //                 y: reserved.zoom.coef.y,
    //                 ky: reserved.main.box.h / opt_in.height,
    //             },
    //             meta: {
    //                 ky: {
    //                     now: 1 / (reserved.main.box.h / opt_in.height),
    //                     previous: reserved.zoom.meta.ky.now,
    //                     point: [ -1, -1 ],
    //                 },
    //             },
    //         }
    //         console.log(reserved.zoom, new_zoom)
    //         reserved.zoom = window.overwrite_obj(reserved.zoom, new_zoom)
    //     }
    //     if (opt_in.width) {
    //         let new_zoom = {
    //             coef: {
    //                 x: reserved.zoom.coef.x,
    //                 kx: opt_in.width / reserved.main.box.w,
    //             },
    //             meta: {
    //                 kx: {
    //                     now: 1 / (opt_in.width / reserved.main.box.w),
    //                     previous: reserved.zoom.meta.kx.now,
    //                     point: [ -1, -1 ],
    //                 },
    //             },
    //         }
    //         reserved.zoom = window.overwrite_obj(reserved.zoom, new_zoom)
    //     }
    //     brush_zoom_link()
    // }
    // this.update_scroll_dim = update_scroll_dim
    // function set_brush_zoom_factor(new_brush_zoom_factor) {
    //     reserved.zoom = window.overwrite_obj(reserved.zoom, new_brush_zoom_factor.zoom)
    //     reserved.brush = window.overwrite_obj(reserved.brush, new_brush_zoom_factor.brush)
    // }
    // this.set_brush_zoom_factor = set_brush_zoom_factor
    // function set_brush_zoom_factor_horizontal(new_brush_zoom_factor) {
    //     let merged_axis = window.overwrite_obj(axis_default, opt_in)
    //     reserved.zoom.coef.x = new_brush_zoom_factor.zoom.coef.x
    //     reserved.zoom.coef.kx = new_brush_zoom_factor.zoom.coef.kx
    //     reserved.zoom.meta.x = new_brush_zoom_factor.zoom.meta.x
    //     reserved.zoom.meta.kx = new_brush_zoom_factor.zoom.meta.kx
    //     reserved.brush.coef.x = new_brush_zoom_factor.brush.coef.x
    //     reserved.brush.meta.x = new_brush_zoom_factor.brush.meta.x
    // }
    // this.set_brush_zoom_factor_horizontal = set_brush_zoom_factor_horizontal
    // function set_brush_zoom_factor_vertical(new_brush_zoom_factor) {
    //     reserved.zoom = window.overwrite_obj(reserved.zoom, new_brush_zoom_factor.zoom)
    //     reserved.brush = window.overwrite_obj(reserved.brush, new_brush_zoom_factor.brush)
    //     // reserved.zoom.coef.y = new_brush_zoom_factor.zoom.coef.y
    //     // reserved.zoom.coef.ky = new_brush_zoom_factor.zoom.coef.ky
    //     // reserved.zoom.meta.y = new_brush_zoom_factor.zoom.meta.y
    //     // reserved.zoom.meta.ky = new_brush_zoom_factor.zoom.meta.ky
    //     // reserved.brush.coef.y = new_brush_zoom_factor.brush.coef.y
    //     // reserved.brush.meta.y = new_brush_zoom_factor.brush.meta.y
    // }
    // this.set_brush_zoom_factor_vertical = set_brush_zoom_factor_vertical

    function update_box(box) {
        reserved.main.box = box
        reserved.main.g.attr('transform',
            'translate(' + reserved.main.box.x + ',' + reserved.main.box.y + ')')
        reserved.clipping.g.select('#clip-rect')
            .attr('width', reserved.main.box.w)
            .attr('height', reserved.main.box.h)
    }
    this.update_box = update_box

    function updated_content() {
        reserved.pan_zoom_box.set_content_dim()
        // reserved.pan_zoom_box.use_content_shortcut('fit')
        // reserved.pan_zoom_box.set_content_trans_rel({
        //     x: 0,
        //     y: 0,
        // })
        // reserved.pan_zoom_box.set_content_zoom_rel({
        //     kx: 1,
        //     ky: 1,
        // })
        // console.log(reserved.pan_zoom_box.get_focus())
        // update_scroller()
    }
    this.updated_content = updated_content
}
