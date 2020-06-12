// ------------------------------------------------------------------
//
// ------------------------------------------------------------------

/* global d3 */
/* global times */
/* global is_def */

window.PlotTimeSeries = function() {
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
                showAxis: true,
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
                range: [ 0, 0 ],
                brush: {
                    zoom: true,
                    brush: true,
                },
            },
        ],
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

        initAxis()
        initInteraction()
        init_clipping()

        reserved.main.g.append('g').attr('id', 'bindedData')
    }
    this.init = init
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

    function to_axis_template(axis) {
        if (! axis.meta) {
            axis.meta = {
            }
        }
    }
    function initAxis() {
        for (let i = 0; i < reserved.axis.length; i++) {
            to_axis_template(reserved.axis[i])

            if (reserved.axis[i].scale_type === 'time') {
                reserved.axis[i].meta.scale = d3.scaleTime()
            }
            else if (reserved.axis[i].scale_type === 'line') {
                reserved.axis[i].meta.scale = d3.scaleLinear()
            }
            else {
                reserved.axis[i].meta.scale = d3.scaleLinear()
            }

            reserved.axis[i].meta.scale
                .range(reserved.axis[i].range)
                .domain(reserved.axis[i].domain)

            if (reserved.axis[i].scale_location === 'top') {
                reserved.axis[i].meta.axis = d3.axisTop(reserved.axis[i].meta.scale)
            }
            else if (reserved.axis[i].scale_location === 'bottom') {
                reserved.axis[i].meta.axis = d3.axisBottom(reserved.axis[i].meta.scale)
            }
            else if (reserved.axis[i].scale_location === 'left') {
                reserved.axis[i].meta.axis = d3.axisLeft(reserved.axis[i].meta.scale)
            }
            else if (reserved.axis[i].scale_location === 'right') {
                reserved.axis[i].meta.axis = d3.axisRight(reserved.axis[i].meta.scale)
            }

            if (reserved.axis[i].scale_type === 'time') {
                reserved.axis[i].meta.axis.tickFormat(d3.timeFormat('%H:%M'))
            }

            reserved.axis[i].meta.g = reserved.main.g.append('g')
            if (reserved.axis[i].scale_location === 'bottom') {
                reserved.axis[i].meta.g.attr(
                    'transform',
                    'translate('
            + reserved.axis[i].box.x
            + ','
            + (reserved.axis[i].box.y + reserved.axis[i].box.h)
            + ')'
                )
            }
            else if (reserved.axis[i].scale_location === 'top') {
                reserved.axis[i].meta.g.attr(
                    'transform',
                    'translate('
            + reserved.axis[i].box.x
            + ','
            + reserved.axis[i].box.y
            + ')'
                )
            }
            else if (reserved.axis[i].scale_location === 'right') {
                reserved.axis[i].meta.g.attr(
                    'transform',
                    'translate('
            + (reserved.axis[i].box.x + reserved.axis[i].box.w)
            + ','
            + reserved.axis[i].box.y
            + ')'
                )
            }
            else if (reserved.axis[i].scale_location === 'left') {
                reserved.axis[i].meta.g.attr(
                    'transform',
                    'translate('
            + reserved.axis[i].box.x
            + ','
            + reserved.axis[i].box.y
            + ')'
                )
            }

            reserved.axis[i].meta.g
                .attr('class', 'axis')
                .call(reserved.axis[i].meta.axis)
                .style('pointer-events', 'none')
                .style('user-select', 'none')
            reserved.axis[i].meta.g.style('opacity', 1)
        }
    }
    function initInteraction() {
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

    function bindData(id, data, axisX, axisY) {
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
            reserved.content.push({
                id: id,
                data: data,
                axisX: axisX,
                axisY: axisY,
            })
        }

        let current = reserved.main.g
            .select('#bindedData')
            .selectAll('g.binded')
            .data(reserved.content, function(d, i) {
                return d.id
            })
        let enter = current
            .enter()
            .append('g')
            .attr('class', 'binded')
            .attr('id', id)

        enter.each(function(d, i) {
            let g = d3.select(this)
            g
                .append('path')
                .attr('fill', 'none')
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 1.5)
            g.append('g').attr('id', 'innerCircles')
            // g.append('circle')
            //   .attr('r', 1.5)
            //   .attr('fill', colorPalette.dark.stroke)
            //   .attr('stroke', '#000000')
            //   .attr('stroke-width', 0.2)
        })
        let merge = current.merge(enter)

        merge.each(function(d, i) {
            axisX = getAxis(d.axisX)
            axisY = getAxis(d.axisY)

            d3
                .select(this)
                .select('path')
                .datum(d.data)
                .attr(
                    'd',
                    d3
                        .line()
                        .x(function(d) {
                            return axisX.scale(d.x)
                        })
                        .y(function(d) {
                            return axisY.scale(d.y)
                        })
                )

            let currentIC = d3
                .select(this)
                .select('g#innerCircles')
                .selectAll('circle.innerCircle')
                .data(d.data)
            let enterIC = currentIC
                .enter()
                .append('circle')
                .attr('class', 'innerCircle')
                .attr('r', 1.5)
                .attr('fill', colorPalette.dark.stroke)
                .attr('stroke', '#000000')
                .attr('stroke-width', 0.2)
            let mergeIC = currentIC.merge(enterIC)
            mergeIC
                .attr('cx', d => axisX.scale(d.x))
                .attr('cy', d => axisY.scale(d.y))
            currentIC
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()
        })
        current
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .style('opacity', 0)
            .remove()
    }
    this.bindData = bindData
    function unbindData(id) {
        for (let i = 0; i < reserved.content.length; i++) {
            if (reserved.content[i].id === id) {
                reserved.content.splice(i, 1)
                break
            }
        }
        reserved.main.g
            .select('#bindedData')
            .select('g#' + id)
            .remove()
    }
    this.unbindData = unbindData
    function update_data(opt_in) {
        for (let id in reserved.content) {
            let binded = reserved.content[id]
            reserved.main.g
                .select('g#' + id)
                .select('path')
                .attr(
                    'd',
                    d3
                        .line()
                        .x(function(d) {
                            return getAxis(binded.axisX).scale(d.x)
                        })
                        .y(function(d) {
                            return getAxis(binded.axisY).scale(d.y)
                        })
                )
            reserved.main.g
                .select('g#' + id)
                .selectAll('circle')
                .attr('cx', d => getAxis(binded.axisX).scale(d.x))
                .attr('cy', d => getAxis(binded.axisY).scale(d.y))
        }
    }
    this.update_data = update_data

    function add_axis(axis) {
    }
    this.add_axis = add_axis
    function remove_axis(axis_id) {}
    this.remove_axis = remove_axis
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
            reserved.axis[index].meta.g.attr('transform', 'translate(' + reserved.axis[index].box.x + ',' + (reserved.axis[index].box.y + reserved.axis[index].box.h) + ')')
        }
        else if (reserved.axis[index].scale_location === 'top') {
            reserved.axis[index].meta.g.attr('transform', 'translate(' + reserved.axis[index].box.x + ',' + reserved.axis[index].box.y + ')')
        }
        else if (reserved.axis[index].scale_location === 'right') {
            reserved.axis[index].meta.g.attr('transform', 'translate(' + (reserved.axis[index].box.x + reserved.axis[index].box.w) + ',' + reserved.axis[index].box.y + ')')
        }
        else if (reserved.axis[index].scale_location === 'left') {
            reserved.axis[index].meta.g.attr('transform', 'translate(' + (reserved.axis[index].box.x) + ',' + reserved.axis[index].box.y + ')')
        }
        // applyZoomBrush(reserved.axis[index])

        // if (!reserved.axis[index].enabled) return
        let minTxtSize = reserved.axis[index].style.text.size
            ? reserved.axis[index].style.text.size
            : reserved.main.box.w * 0.04
        // console.log(reserved.axis[index].domain, reserved.axis[index].range);
        reserved.axis[index].meta.axis.scale(reserved.axis[index].meta.scale)
        reserved.axis[index].meta.axis.ticks(5)
        reserved.axis[index].meta.axis.tickSize(reserved.axis[index].style.axis.tickSize)

        reserved.axis[index].meta.g.call(reserved.axis[index].meta.axis)
        reserved.axis[index].meta.g
            .select('path')
            .attr('stroke-width', 0.3)
            .attr('stroke', reserved.axis[index].style.path.stroke)
            .attr('opacity', reserved.axis[index].style.path.visible ? 1 : 0)
        reserved.axis[index].meta.g
            .selectAll('g.tick')
            .selectAll('line')
            .attr('stroke-width', 0.2)
            .attr('stroke', reserved.axis[index].style.path.stroke)
            .attr('opacity', reserved.axis[index].style.path.visible ? 1 : 0)
        reserved.axis[index].meta.g
            .selectAll('g.tick')
            .selectAll('text')
            .attr('stroke', reserved.axis[index].style.text.stroke)
            .attr('stroke-width', 0.2)
            .attr('fill', reserved.axis[index].style.text.fill)
            .style('font-size', minTxtSize + 'px')
            .attr('opacity', reserved.axis[index].style.text.visible ? 1 : 0)
        console.log(reserved.main.g)
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
