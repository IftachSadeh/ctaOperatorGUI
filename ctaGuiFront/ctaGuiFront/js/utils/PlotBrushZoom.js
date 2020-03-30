/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global get_color_theme */
/* global deep_copy */

window.PlotBrushZoom = function(opt_in) {
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
    reserved = opt_in

    function setStyle(opt_in) {
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
    this.setStyle = setStyle
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

    function init(opt_in) {
        reserved.main.g.attr(
            'transform',
            'translate(' + reserved.main.box.x + ',' + reserved.main.box.y + ')'
        )

        initClipping()
        initFocus()
        initContent()
        // initBrush()
        init_zoom()
        initAxis()
    // setupZoomBrush()
    }
    this.init = init

    function initClipping() {
        if (!reserved.clipping.enabled) {
            return
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
        reserved.main.g = reserved.clipping.clipBody.append('g')
    }
    function initAxis() {
        for (let i = 0; i < reserved.axis.length; i++) {
            if (!reserved.axis[i].enabled) {
                return
            }

            reserved.axis[i].scale = d3
                .scaleTime()
                .range(reserved.axis[i].range)
                .domain(reserved.axis[i].domain)
            if (reserved.axis[i].main.type === 'top') {
                reserved.axis[i].axis = d3.axisTop(reserved.axis[i].scale)
            }
            if (reserved.axis[i].main.type === 'bottom') {
                reserved.axis[i].axis = d3.axisBottom(reserved.axis[i].scale)
            }
            // if (reserved.axis[i].main.type === 'left') d3.axisTop(reserved.axis[i].scale)
            // if (reserved.axis[i].main.type === 'right') d3.axisTop(reserved.axis[i].scale)
            reserved.axis[i].axis.tickFormat(d3.timeFormat('%H:%M'))
            reserved.axis[i].main.g = reserved.main.g.append('g')
            if (reserved.axis[i].main.type === 'top') {
                reserved.axis[i].main.g.attr(
                    'transform',
                    'translate('
            + reserved.axis[i].main.box.x
            + ','
            + (reserved.axis[i].main.box.y + reserved.axis[i].main.box.h)
            + ')'
                )
            }
            if (reserved.axis[i].main.type === 'bottom') {
                reserved.axis[i].main.g.attr(
                    'transform',
                    'translate('
            + reserved.axis[i].main.box.x
            + ','
            + reserved.axis[i].main.box.y
            + ')'
                )
            }
            if (!reserved.axis[i].showAxis) {
                continue
            }
            reserved.axis[i].main.g
                .attr('class', 'axis')
                .call(reserved.axis[i].axis)
                .style('pointer-events', 'none')
                .style('user-select', 'none')
            reserved.axis[i].main.g.style('opacity', 1)
        }
    }
    function addAxis(axis) {
        if (!axis.enabled) {
            return
        }

        reserved.axis.push(axis)
        axis.scale = d3
            .scaleTime()
            .range(axis.range)
            .domain(axis.domain)
        if (axis.main.type === 'top') {
            axis.axis = d3.axisTop(axis.scale)
        }
        if (axis.main.type === 'bottom') {
            axis.axis = d3.axisBottom(axis.scale)
        }
        axis.axis.tickFormat(d3.timeFormat('%H:%M'))
        axis.g = main.g
            .append('g')
            .attr(
                'transform',
                'translate(' + axis.main.box.x + ',' + axis.main.box.y + ')'
            )
        axis.g.attr('class', 'axis').call(axis.axis)
        axis.g.style('opacity', 1)
    }
    this.addAxis = addAxis
    function removeAxis(axis) {}
    function getAxis(id) {
        for (let index = 0; index < reserved.axis.length; index++) {
            if (reserved.axis[index].id === id) {
                return reserved.axis[index]
            }
        }
    }
    this.getAxis = getAxis
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
                break
            }
        }

        applyZoomBrush(reserved.axis[index])

        if (!reserved.axis[index].enabled) {
            return
        }
        let minTxtSize = reserved.axis[index].main.attr.text.size
            ? reserved.axis[index].main.attr.text.size
            : reserved.main.box.w * 0.04
        // console.log(reserved.axis[index].domain, reserved.axis[index].range);
        reserved.axis[index].axis.scale(reserved.axis[index].scale)
        reserved.axis[index].axis.ticks(5)
        reserved.axis[index].axis.tickSize(4)
        if (!reserved.axis[index].showAxis) {
            return
        }
        reserved.axis[index].main.g.call(reserved.axis[index].axis)
        reserved.axis[index].main.g
            .select('path')
            .attr('stroke-width', 0.5)
            .attr('stroke', reserved.axis[index].main.attr.path.stroke)
            .attr('opacity', reserved.axis[index].main.attr.path.enabled ? 1 : 0)
        reserved.axis[index].main.g
            .selectAll('g.tick')
            .selectAll('line')
            .attr('stroke-width', 0.5)
            .attr('stroke', reserved.axis[index].main.attr.path.stroke)
            .attr('opacity', reserved.axis[index].main.attr.path.enabled ? 1 : 0)
        reserved.axis[index].main.g
            .selectAll('g.tick')
            .selectAll('text')
            .attr('stroke', reserved.axis[index].main.attr.text.stroke)
            .attr('stroke-width', 0.2)
            .attr('fill', reserved.axis[index].main.attr.text.fill)
            .style('font-size', minTxtSize + 'px')
            .attr('opacity', reserved.axis[index].main.attr.text.enabled ? 1 : 0)
    }
    this.updateAxis = updateAxis
    function updateAxes() {
        for (let i = 0; i < reserved.axis.length; i++) {
            updateAxis(reserved.axis[i])
        }
    }

    function initContent() {
        if (!reserved.content.enabled) {
            return
        }
        reserved.content.main.g = reserved.main.g
            .append('g')
            .attr(
                'transform',
                'translate('
          + reserved.content.main.box.x
          + ','
          + reserved.content.main.box.y
          + ')'
            )

        reserved.content.main.g
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
            .attr('y', -10)
            .attr('width', reserved.content.main.box.w)
            .attr('height', reserved.content.main.box.h + 20)
            .attr('fill', reserved.content.main.attr.fill)
            .attr('opacity', 0)
            .on('mouseover', function(d) {
                d3.select(this).style('cursor', 'crosshair')
            })
            .on('mouseout', function(d) {
                d3.select(this).style('cursor', 'default')
            })
        // .attr('stroke', reserved.focus.main.attr.stroke)
        // .attr('stroke-width', 0.4)

        reserved.content.main.g.on('wheel', function() {
            d3.event.preventDefault()
        })
    }

    // function initBrush () {
    //   let brushStart = function () {
    //     reserved.brush.isInBrush = true
    //   }
    //   let brushDuring = function () {
    //     if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return // ignore brush-by-zoom
    //     // console.log('brushDuring');
    //     console.log('brushduring');
    //     let s = d3.event.selection || reserved.brush.scale.x.range()
    //     reserved.brush.coef = d3.event.selection
    //
    //     // Update Top Axis
    //     reserved.brush.scale.x.domain(s.map(reserved.brush.scale.x.invert, reserved.brush.scale.x))
    //     reserved.brush.domain = reserved.brush.scale.x.domain()
    //
    //     let k = reserved.brush.box.w / (s[1] - s[0])
    //     let x = -s[0]
    //     let t = d3.zoomIdentity.scale(k).translate(x, 0)
    //     $.each(reserved.brush.zoom.sel, function (selName, selFunc) {
    //       selFunc().call(reserved.brush.zoom.fun.transform, t)
    //     })
    //
    //     updateFocus()
    //     updateAxes()
    //     // if (locker.are_free(lockers.zoom_during)) {
    //     //   locker.add({ id: lock_zoom.all, override: true })
    //     //   locker.add({ id: lock_zoom.during, override: true })
    //     //
    //     //   if (d3.event.sourceEvent) {
    //     //     let s = d3.event.selection || reserved.brush.scale.x.range()
    //     //
    //     //     // Update Top Axis
    //     //     reserved.brush.scale.x.domain(s.map(reserved.brush.scale.x.invert, reserved.brush.scale.x))
    //     //     reserved.brush.domain = reserved.brush.scale.x.domain()
    //     //     updateFocus()
    //     //     updateAxes()
    //     //
    //     //     // Keep Track of brush position to prevent jump when zoom
    //     //     let k = reserved.brush.box.w / (s[1] - s[0])
    //     //     let x = -s[0]
    //     //     let t = d3.zoomIdentity.scale(k).translate(x, 0)
    //     //     $.each(reserved.brush.zoom.sel, function (selName, selFunc) {
    //     //       selFunc().call(reserved.brush.zoom.fun.transform, t)
    //     //     })
    //     //   }
    //     //
    //     //   locker.remove({ id: lock_zoom.during })
    //     // }
    //   }
    //   let brushEnd = function () {
    //     if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return // ignore brush-by-zoom
    //
    //     // // check if we are zoomed out (full range shown)
    //     // if (reserved.brush.domain) {
    //     //   let is_same0 = reserved.brush.domain[0] - reserved.brush.scale.x.domain()[0] <= 0
    //     //   let is_same1 = reserved.brush.domain[1] - reserved.brush.scale.x.domain()[1] >= 0
    //     //   if (is_same0 && is_same1) reserved.brush.domain = null
    //     // }
    //     // updateTopAxis()
    //
    //     reserved.brush.isInBrush = false
    //     // locker.remove({
    //     //   id: lock_zoom.all,
    //     //   override: true,
    //     //   delay: times.anim
    //     // })
    //   }
    //
    //   reserved.brush.fun = d3
    //     .brushX()
    //     .extent([[0, 0], [reserved.focus.main.box.w, reserved.focus.main.box.h]])
    //   reserved.brush.fun
    //     .on('start', brushStart)
    //     .on('brush', brushDuring)
    //     .on('end', brushEnd)
    //   reserved.focus.g.select('rect#brush')
    //     .call(reserved.brush.fun)
    // }

    function initFocus() {
        if (!reserved.focus.enabled) {
            return
        }
        reserved.focus.main.g = reserved.main.g
            .append('g')
            .attr(
                'transform',
                'translate('
          + reserved.focus.main.box.x
          + ','
          + reserved.focus.main.box.y
          + ')'
            )

        reserved.focus.main.g
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
            .attr('width', reserved.focus.main.box.w)
            .attr('height', reserved.focus.main.box.h)
            .attr('fill', reserved.focus.main.attr.fill)
            .attr('opacity', reserved.focus.main.attr.opacity)
            .attr('stroke', reserved.focus.main.attr.stroke)
            .attr('stroke-width', 0.4)

        reserved.focus.main.g.on('wheel', function() {
            d3.event.preventDefault()
        })
    }
    function updateFocus() {
        if (!reserved.focus.enabled) {
            return
        }
        reserved.focus.main.g.select('rect#brush').attr('transform', function() {
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
        let zoom = {
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
                max: reserved.focus.main.box.w,
                now: 0,
            },
            y: {
                min: 0,
                max: reserved.focus.main.box.h,
                now: 0,
            },
        }
        let drag = {
            x: 0,
            y: 0,
        }
        function computeZoomFactorkx() {
            reserved.zoom.coef.kx = 1 / zoom.kx.now

            let ratio = [ zoom.kx.point[0] / zoom.x.max, 0 ]
            let offset = {
                x:
          (zoom.x.max
            - zoom.x.max * (1 / zoom.kx.now)
            - (zoom.x.max - zoom.x.max * (1 / zoom.kx.previous)))
          * ratio[0],
            }

            reserved.zoom.coef.x = reserved.zoom.coef.x + offset.x + drag.x
            if (reserved.zoom.coef.x < 0) {
                reserved.zoom.coef.x = 0
            }
            let right = reserved.zoom.coef.x + zoom.x.max * (1 / zoom.kx.now)
            if (right > zoom.x.max) {
                reserved.zoom.coef.x = reserved.zoom.coef.x - (right - zoom.x.max)
            }
        }
        function computeZoomFactorky() {
            reserved.zoom.coef.ky = 1 / zoom.ky.now

            let ratio = [ 0, zoom.ky.point[1] / zoom.y.max ]
            let offset = {
                y:
          (zoom.y.max
            - zoom.y.max * (1 / zoom.ky.now)
            - (zoom.y.max - zoom.y.max * (1 / zoom.ky.previous)))
          * ratio[1],
            }

            reserved.zoom.coef.y = reserved.zoom.coef.y + offset.y + drag.y
            if (reserved.zoom.coef.y < 0) {
                reserved.zoom.coef.y = 0
            }
            let bottom = reserved.zoom.coef.y + zoom.y.max * (1 / zoom.ky.now)
            if (bottom > zoom.y.max) {
                reserved.zoom.coef.y = reserved.zoom.coef.y - (bottom - zoom.y.max)
            }
        }
        function computeDragFactor() {
            reserved.zoom.coef.x = reserved.zoom.coef.x + drag.x
            if (reserved.zoom.coef.x < 0) {
                reserved.zoom.coef.x = 0
            }
            let right = reserved.zoom.coef.x + zoom.x.max * (1 / zoom.kx.now)
            if (right > zoom.x.max) {
                reserved.zoom.coef.x = reserved.zoom.coef.x - (right - zoom.x.max)
            }

            reserved.zoom.coef.y = reserved.zoom.coef.y + drag.y
            if (reserved.zoom.coef.y < 0) {
                reserved.zoom.coef.y = 0
            }
            let bottom = reserved.zoom.coef.y + zoom.y.max * (1 / zoom.ky.now)
            if (bottom > zoom.y.max) {
                reserved.zoom.coef.y = reserved.zoom.coef.y - (bottom - zoom.y.max)
            }
        }
        // let zoom_start = function (ele) {
        //   reserved.zoom.isInZoom = true
        // }
        // let zoom_during = function (ele) {
        //   if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return // ignore zoom-by-brush
        //   // if (reserved.zoom.coef.k - d3.event.transform.k !== 0) {
        //   //   reserved.zoom.coef.k = d3.event.transform.k
        //   //   reserved.zoom.coef.x = d3.event.transform.x
        //   //   reserved.zoom.coef.y = d3.event.transform.y
        //   //
        //   //   let tot = (reserved.focus.main.box.w - (reserved.focus.main.box.w * (1 / reserved.zoom.coef.k)))
        //   //   let ratio = 1 - (-(reserved.zoom.coef.x / reserved.zoom.coef.k) / tot)
        //   //   console.log((reserved.zoom.coef.x / reserved.zoom.coef.k), tot, ratio, -tot * ratio);
        //   //   reserved.zoom.coef.x = (-tot * ratio) * reserved.zoom.coef.k
        //   // } else {
        //   //   reserved.zoom.coef.k = d3.event.transform.k
        //   //   reserved.zoom.coef.x = d3.event.transform.x
        //   //   reserved.zoom.coef.y = d3.event.transform.y
        //   // // }
        //   // console.log(d3.event.transform);
        //   // let copy = d3.zoomIdentity
        //   // copy.x = d3.event.transform.x
        //   // copy.y = d3.event.transform.y
        //   // copy.k = d3.event.transform.k
        //   // let inv = 1 / copy.k
        //   // let ratio = copy.x / (reserved.focus.main.box.w - (reserved.focus.main.box.w * copy.k))
        //   // let offset = reserved.focus.main.box.w - (reserved.focus.main.box.w * inv)
        //   // console.log(inv, ratio, offset);
        //   //
        //   // reserved.zoom.coef.k = inv
        //   // reserved.zoom.coef.y = copy.y
        //   // reserved.zoom.coef.x = offset * (1 - Math.abs(ratio))
        //
        //   // reserved.zoom.coef.k = d3.event.transform.k
        //   // reserved.zoom.coef.x = d3.event.transform.x
        //   // reserved.zoom.coef.y = d3.event.transform.y
        //
        //   updateFocus()
        //   updateAxes()
        //
        //   // reserved.brush.g.brush.call(
        //   //   reserved.brush.brush.move,
        //   //   reserved.brush.scale.x.range().map(trans.invertX, trans)
        //   // )
        //
        //   // reserved.brush.in_user_zoom = is_def(d3.event.sourceEvent)
        //
        //   // if (locker.are_free(lockers.zoom_during)) {
        //   //   locker.add({ id: lock_zoom.all, override: true })
        //   //   locker.add({ id: lock_zoom.during, override: true })
        //   //
        //   //   // Update top Axis
        //   //   let trans = d3.event.transform
        //   //   reserved.brush.domain = trans.rescaleX(reserved.brush.scale.x).domain()
        //   //   reserved.brush.scale.x.domain(reserved.brush.domain)
        //   //   updateTopAxis()
        //   //
        //   //   // Update Grey Brush Position and Size
        //   //   reserved.brush.g.brush.call(
        //   //     reserved.brush.brush.move,
        //   //     reserved.brush.scale.x.range().map(trans.invertX, trans)
        //   //   )
        //   //
        //   //   locker.remove({ id: lock_zoom.during })
        //   // }
        // }
        // let zoom_end = function (ele) {
        //   if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return // ignore zoom-by-brush
        //
        //   // let trans = d3.event.transform
        //   // let srcClass = d3.select(ele).attr('class')
        //   //
        //   // reserved.brush.zoom.trans[srcClass] = trans
        //
        //   // check if we are zoomed out (full range shown)
        //   // if (reserved.brush.domain) {
        //   //   let is_same0 = reserved.brush.domain[0] - reserved.brush.scale.x.domain()[0] <= 0
        //   //   let is_same1 = reserved.brush.domain[1] - reserved.brush.scale.x.domain()[1] >= 0
        //   //   if (is_same0 && is_same1) reserved.brush.domain = null
        //   // }
        //   // updateAxis()
        //   reserved.zoom.isInZoom = false
        //   // locker.remove({
        //   //   id: lock_zoom.all,
        //   //   override: true,
        //   //   delay: times.anim
        //   // })
        //
        //   // let sel = Object.keys(reserved.brush.zoom.sel).filter(function (d) {
        //   //   return reserved.brush.zoom.trans[d] !== trans
        //   // })
        //
        //   // doDomainTrans({ trans: trans, sel: sel })
        // }

        // reserved.zoom.fun = d3
        //   .zoom()
        //   .scaleExtent([1, 20])
        //   .translateExtent([[0, 0], [reserved.focus.main.box.w, reserved.focus.main.box.h]])
        //   .extent([[0, 0], [reserved.focus.main.box.w, reserved.focus.main.box.h]])
        // reserved.zoom.fun
        //   .on('start', function (d) {
        //     zoom_start(this)
        //   })
        //   .on('zoom', function (d) {
        //     zoom_during(this)
        //   })
        //   .on('end', function (d) {
        //     zoom_end(this)
        //   })
        reserved.content.main.g
            .on('wheel', function() {
                d3.event.preventDefault()
                if (d3.event.ctrlKey) {
                    zoom.ky.point = d3.mouse(d3.select(this).node())

                    let sign = -Math.abs(d3.event.deltaY) / d3.event.deltaY

                    zoom.ky.previous = zoom.ky.now

                    zoom.ky.now += sign * Math.log(Math.abs(d3.event.deltaY)) * 0.02
                    if (zoom.ky.now < zoom.ky.min) {
                        zoom.ky.now = zoom.ky.min
                    }
                    if (zoom.ky.now > zoom.ky.max) {
                        zoom.ky.now = zoom.ky.max
                    }
                    computeZoomFactorky()
                }
                else {
                    zoom.kx.point = d3.mouse(d3.select(this).node())

                    let sign = -Math.abs(d3.event.deltaY) / d3.event.deltaY

                    zoom.kx.previous = zoom.kx.now

                    zoom.kx.now += sign * Math.log(Math.abs(d3.event.deltaY)) * 0.02
                    if (zoom.kx.now < zoom.kx.min) {
                        zoom.kx.now = zoom.kx.min
                    }
                    if (zoom.kx.now > zoom.kx.max) {
                        zoom.kx.now = zoom.kx.max
                    }
                    computeZoomFactorkx()
                }

                updateFocus()
                updateAxes()
                reserved.zoom.callback()
            })
            .call(
                d3
                    .drag()
                    .on('start', function(d) {})
                    .on('drag', function(d) {
                        drag.x = d3.event.dx
                        drag.y = d3.event.dy

                        computeDragFactor()
                        updateFocus()
                        updateAxes()
                        reserved.zoom.callback()
                    })
                    .on('end', function(d) {
                        drag.x = 0
                        drag.y = 0
                    })
            )
    // .call(reserved.zoom.fun)
    }

    function update_data(opt_in) {
        return
        if (opt_in.axis) {
            if (opt_in.axis.top) {
                updateAxis('top', opt_in.axis.top)
            }
            if (opt_in.axis.bottom) {
                updateAxis('bottom', opt_in.axis.bottom)
            }
        }
        updateBrush()
    }
    this.update_data = update_data
    function applyZoomBrush(axis) {
        axis.scale.domain(axis.domain).range(axis.range)
        // .nice()

        let newDomain = deep_copy(axis.domain)
        if (axis.main.type === 'top' || axis.main.type === 'bottom') {
            newDomain[0] = axis.scale.invert(reserved.zoom.coef.x)
            newDomain[1] = axis.scale.invert(
                reserved.zoom.coef.x + reserved.focus.main.box.w * reserved.zoom.coef.kx
            )
        }
        else if (axis.main.type === 'left' || axis.main.type === 'right') {
            newDomain[0] = axis.scale.invert(reserved.zoom.coef.y)
            newDomain[1] = axis.scale.invert(
                reserved.zoom.coef.y + reserved.focus.main.box.h * reserved.zoom.coef.ky
            )
        }
        if (axis.brush.zoom) {
            axis.scale.domain(newDomain)
        }
    }
    function updateBrush() {}
}
