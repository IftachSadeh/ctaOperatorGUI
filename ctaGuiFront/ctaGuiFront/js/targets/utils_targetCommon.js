/* global d3 */

let nameSize = 8

window.targetIcon = function (g, dim, name, events, colorTheme) {
  g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', dim.w)
    .attr('height', dim.h)
    .attr('fill', colorTheme.dark.background)
    .attr('stroke', colorTheme.medium.stroke)
    .attr('stroke-width', 0.6)
    // .style('boxShadow', '10px 20px 30px black')
    .attr('rx', dim.w)
    .on('click', function () {
      if (events.click) events.click()
    })
    .on('mouseover', function (d) {
      if (events.over) events.over()
      d3.select(this).style('cursor', 'pointer')
      d3.select(this).attr('fill', colorTheme.darker.background)
    })
    .on('mouseout', function (d) {
      if (events.out) events.out()
      d3.select(this).style('cursor', 'default')
      d3.select(this).attr('fill', colorTheme.dark.background)
    })
  g.append('svg:image')
    .attr('xlink:href', '/static/icons/round-target.svg')
    .attr('width', dim.w)
    .attr('height', dim.h)
    .attr('x', 0)
    .attr('y', 0)
    .style('opacity', 0.5)
    .style('pointer-events', 'none')
  g.append('text')
    .text(name)
    .attr('x', dim.w * 0.5)
    .attr('y', dim.h * 0.5 + nameSize * 0.3)
    .style('font-weight', 'bold')
    .attr('text-anchor', 'middle')
    .style('font-size', nameSize + 'px')
    .attr('dy', 0)
    .style('pointer-events', 'none')
    .attr('fill', colorTheme.dark.text)
    .attr('stroke', 'none')
}

window.pointingIcon = function (g, dim, name, events, colorTheme) {
  g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', dim.w)
    .attr('height', dim.h)
    .attr('fill', colorTheme.dark.background)
    .attr('stroke', colorTheme.medium.stroke)
    .attr('stroke-width', 0.6)
    // .style('boxShadow', '10px 20px 30px black')
    .on('click', function () {
      if (events.click) events.click()
    })
    .on('mouseover', function (d) {
      if (events.over) events.over()
      d3.select(this).style('cursor', 'pointer')
      d3.select(this).attr('fill', colorTheme.darker.background)
    })
    .on('mouseout', function (d) {
      if (events.out) events.out()
      d3.select(this).style('cursor', 'default')
      d3.select(this).attr('fill', colorTheme.dark.background)
    })
    .attr('rx', 4)
  g.append('svg:image')
    .attr('xlink:href', '/static/icons/square-target.svg')
    .attr('width', dim.w)
    .attr('height', dim.h)
    .attr('x', 0)
    .attr('y', 0)
    .style('opacity', 0.5)
    .style('pointer-events', 'none')
    .attr('transform', function () {
      let scale = {w: 1, h: 1}
      if (dim.h < dim.w) scale.w = dim.w / dim.h
      if (dim.w < dim.h) scale.h = dim.h / dim.w
      return 'translate(' + (-((scale.w * dim.w) - dim.w) * 0.5) + ',' + (-((scale.h * dim.h) - dim.h) * 0.5) + ') scale(' + scale.w + ',' + scale.h + ')'
    })
  g.append('text')
    .text(name)
    .attr('x', dim.w * 0.5)
    .attr('y', dim.h * 0.5 + nameSize * 0.3)
    .style('font-weight', 'bold')
    .attr('text-anchor', 'middle')
    .style('font-size', nameSize + 'px')
    .attr('dy', 0)
    .style('pointer-events', 'none')
    .attr('fill', colorTheme.dark.text)
    .attr('stroke', 'none')
}
