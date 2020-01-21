// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
// window.loadScript({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global deepCopy */
/* global PlotTimeBar */

window.PlotTimeSeries = function () {
  let reserved = {
    main: {
      g: undefined,
      box: { x: 0, y: 0, w: 0, h: 0 }
    },
    axis: [
      {
        id: 'top',
        showAxis: true,
        main: {
          g: undefined,
          box: { x: 0, y: 0, w: 0, h: 0, marg: 0 },
          type: 'top',
          attr: {
            text: {
              enabled: true,
              size: 14,
              stroke: colorPalette.medium.stroke,
              fill: colorPalette.medium.stroke
            },
            path: {
              enabled: true,
              stroke: colorPalette.medium.stroke,
              fill: colorPalette.medium.stroke
            }
          }
        },
        axis: undefined,
        scale: undefined,
        domain: [0, 1000],
        range: [0, 0],
        brush: {
          zoom: true,
          brush: true
        }
      }
    ],
    interaction: {},
    content: []
  }

  this.set = function (optIn) {
    if (hasVar(optIn.data)) reserved[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) reserved[optIn.tag] = optIn.def
    else reserved[optIn.tag] = null
  }
  this.get = function (type) {
    return reserved[type]
  }

  function setStyle (optIn) {
    if (!hasVar(optIn)) optIn = {}

    reserved.style = {}

    reserved.style.hasOutline = hasVar(optIn.hasOutline)
      ? optIn.hasOutline
      : false
  }
  this.setStyle = setStyle
  function init (optIn) {
    reserved = optIn
    reserved.main.g.attr(
      'transform',
      'translate(' + reserved.main.box.x + ',' + reserved.main.box.y + ')'
    )

    initAxis()
    initInteraction()
    initClipping()

    reserved.main.g.append('g').attr('id', 'bindedData')
  }
  this.init = init

  function bindData (id, data, axisX, axisY) {
    let toBind = true
    for (let i = 0; i < reserved.content.length; i++) {
      if (reserved.content[i].id === id) {
        reserved.content[i] = { id: id, data: data, axisX: axisX, axisY: axisY }
        toBind = false
        break
      }
    }
    if (toBind) { reserved.content.push({ id: id, data: data, axisX: axisX, axisY: axisY }) }

    let current = reserved.main.g
      .select('#bindedData')
      .selectAll('g.binded')
      .data(reserved.content, function (d, i) {
        return d.id
      })
    let enter = current
      .enter()
      .append('g')
      .attr('class', 'binded')

    enter.each(function (d, i) {
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

    merge.each(function (d, i) {
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
            .x(function (d) {
              return axisX.scale(d.x)
            })
            .y(function (d) {
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
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    })
    current
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()
  }
  this.bindData = bindData
  function unbindData (id) {
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

  function initClipping () {
    if (!reserved.main.clipping) return
    reserved.clipping = {}
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
  function initAxis () {
    for (let i = 0; i < reserved.axis.length; i++) {
      if (reserved.axis[i].main.mode === 'time') { reserved.axis[i].scale = d3.scaleTime() } else if (reserved.axis[i].main.mode === 'line') { reserved.axis[i].scale = d3.scaleLinear() } else reserved.axis[i].scale = d3.scaleLinear()
      reserved.axis[i].scale
        .range(reserved.axis[i].range)
        .domain(reserved.axis[i].domain)

      if (reserved.axis[i].main.type === 'top') { reserved.axis[i].axis = d3.axisTop(reserved.axis[i].scale) } else if (reserved.axis[i].main.type === 'bottom') { reserved.axis[i].axis = d3.axisBottom(reserved.axis[i].scale) } else if (reserved.axis[i].main.type === 'left') { reserved.axis[i].axis = d3.axisLeft(reserved.axis[i].scale) } else if (reserved.axis[i].main.type === 'right') { reserved.axis[i].axis = d3.axisRight(reserved.axis[i].scale) }

      if (reserved.axis[i].main.mode === 'time') { reserved.axis[i].axis.tickFormat(d3.timeFormat('%H:%M')) }

      reserved.axis[i].main.g = reserved.main.g.append('g')
      if (reserved.axis[i].main.type === 'bottom') {
        reserved.axis[i].main.g.attr(
          'transform',
          'translate(' +
            reserved.axis[i].main.box.x +
            ',' +
            (reserved.axis[i].main.box.y + reserved.axis[i].main.box.h) +
            ')'
        )
      } else if (reserved.axis[i].main.type === 'top') {
        reserved.axis[i].main.g.attr(
          'transform',
          'translate(' +
            reserved.axis[i].main.box.x +
            ',' +
            reserved.axis[i].main.box.y +
            ')'
        )
      } else if (reserved.axis[i].main.type === 'right') {
        reserved.axis[i].main.g.attr(
          'transform',
          'translate(' +
            (reserved.axis[i].main.box.x + reserved.axis[i].main.box.w) +
            ',' +
            reserved.axis[i].main.box.y +
            ')'
        )
      }

      if (!reserved.axis[i].showAxis) continue
      reserved.axis[i].main.g
        .attr('class', 'axis')
        .call(reserved.axis[i].axis)
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      reserved.axis[i].main.g.style('opacity', 1)
    }
  }
  function initInteraction () {
    function createDeleteButton () {
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
    function createPinnedButton () {
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
          if (reserved.interaction[key].enabled) createPinnedButton()
          break
        case 'remove':
          if (reserved.interaction[key].enabled) createDeleteButton()
          break
        default:
          break
      }
    }
  }
  // function addAxis (axis) {
  //   if (!axis.enabled) return
  //
  //   reserved.axis.push(axis)
  //   axis.scale = d3.scaleTime()
  //     .range(axis.range)
  //     .domain(axis.domain)
  //   if (axis.main.type === 'top') axis.axis = d3.axisTop(axis.scale)
  //   if (axis.main.type === 'bottom') axis.axis = d3.axisBottom(axis.scale)
  //   axis.axis.tickFormat(d3.timeFormat('%H:%M'))
  //   axis.g = main.g.append('g')
  //     .attr('transform', 'translate(' + axis.main.box.x + ',' + axis.main.box.y + ')')
  //   axis.g
  //     .attr('class', 'axis')
  //     .call(axis.axis)
  //   axis.g.style('opacity', 1)
  // }
  // this.addAxis = addAxis
  // function removeAxis (axis) {}
  function getAxis (id) {
    for (let index = 0; index < reserved.axis.length; index++) {
      if (reserved.axis[index].id === id) {
        return reserved.axis[index]
      }
    }
  }
  this.getAxis = getAxis
  function updateAxis (axis) {
    let index = 0
    for (index; index < reserved.axis.length; index++) {
      if (reserved.axis[index].id === axis.id) {
        if (axis.range) reserved.axis[index].range = axis.range
        if (axis.domain) reserved.axis[index].domain = axis.domain
        break
      }
    }
    reserved.axis[index].scale
      .domain(reserved.axis[index].domain)
      .range(reserved.axis[index].range)
    // applyZoomBrush(reserved.axis[index])

    // if (!reserved.axis[index].enabled) return
    let minTxtSize = reserved.axis[index].main.attr.text.size
      ? reserved.axis[index].main.attr.text.size
      : reserved.main.box.w * 0.04
    // console.log(reserved.axis[index].domain, reserved.axis[index].range);
    reserved.axis[index].axis.scale(reserved.axis[index].scale)
    reserved.axis[index].axis.ticks(5)
    reserved.axis[index].axis.tickSize(reserved.axis[index].main.attr.tickSize)
    if (!reserved.axis[index].showAxis) return
    reserved.axis[index].main.g.call(reserved.axis[index].axis)
    reserved.axis[index].main.g
      .select('path')
      .attr('stroke-width', 0.3)
      .attr('stroke', reserved.axis[index].main.attr.path.stroke)
      .attr('opacity', reserved.axis[index].main.attr.path.enabled ? 1 : 0)
    reserved.axis[index].main.g
      .selectAll('g.tick')
      .selectAll('line')
      .attr('stroke-width', 0.2)
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
  // function updateAxes () {
  //   for (let i = 0; i < reserved.axis.length; i++) {
  //     updateAxis(reserved.axis[i])
  //   }
  // }
  // function applyZoomBrush (axis) {
  //   axis.scale
  //     .domain(axis.domain)
  //     .range(axis.range)
  //
  //   let newDomain = deepCopy(axis.domain)
  //   if (axis.main.type === 'top' || axis.main.type === 'bottom') {
  //     newDomain[0] = axis.scale.invert(reserved.zoom.coef.x)
  //     newDomain[1] = axis.scale.invert(reserved.zoom.coef.x + (reserved.focus.main.box.w * reserved.zoom.coef.kx))
  //   } else if (axis.main.type === 'left' || axis.main.type === 'right') {
  //     newDomain[0] = axis.scale.invert(reserved.zoom.coef.y)
  //     newDomain[1] = axis.scale.invert(reserved.zoom.coef.y + (reserved.focus.main.box.h * reserved.zoom.coef.ky))
  //   }
  //   if (axis.brush.zoom) axis.scale.domain(newDomain)
  // }
  function updateData (optIn) {
    for (let id in reserved.content) {
      let binded = reserved.content[id]
      reserved.main.g
        .select('g#' + id)
        .select('path')
        .attr(
          'd',
          d3
            .line()
            .x(function (d) {
              return getAxis(binded.axisX).scale(d.x)
            })
            .y(function (d) {
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
  this.updateData = updateData
}
