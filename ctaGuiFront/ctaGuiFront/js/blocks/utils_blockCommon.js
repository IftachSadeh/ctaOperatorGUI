/* global d3 */
/* global hasVar */
/* global colorPalette */

window.blockStyle = function (optIn) {
  let state = hasVar(optIn.state)
    ? optIn.state
    : optIn.exeState.state
  let canRun = hasVar(optIn.canRun)
    ? optIn.canRun
    : optIn.exeState.canRun

  if (state === 'wait') {
    return {color: colorPalette.blocks.wait, opacity: 1, pattern: 'none'}
  } else if (state === 'done') {
    return {color: colorPalette.blocks.done, opacity: 1, pattern: 'none'}
  } else if (state === 'fail') {
    return {color: colorPalette.blocks.fail, opacity: 1, pattern: 'none'}
  } else if (state === 'run') {
    return {color: colorPalette.blocks.run, opacity: 1, pattern: 'none'}
  } else if (state === 'cancel') {
    if (hasVar(canRun)) {
      if (!canRun) return {color: colorPalette.blocks.cancelOp, opacity: 1, pattern: 'none'}
    }
    return {color: colorPalette.blocks.cancelSys, opacity: 1, pattern: 'none'}
  } else return {color: colorPalette.blocks.shutdown, opacity: 1, pattern: 'none'}
}

window.blockIcon = function (g, dim, name, events, colorTheme) {
  let nameSize = 10
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
      events.click()
    })
    .on('mouseover', function (d) {
      d3.select(this).style('cursor', 'pointer')
      d3.select(this).attr('fill', colorTheme.darker.background)
    })
    .on('mouseout', function (d) {
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

window.removeTelescopeFromBlock = function (b, t) {
  if (b.telIds && b.telIds.indexOf(t.id) !== -1) b.telIds.splice(b.telIds.indexOf(t.id), 1)
  if (t.id.includes('L')) {
    b.telescopes.large.ids.splice(b.telescopes.large.ids.indexOf(t.id), 1)
  } else if (t.id.includes('M')) {
    b.telescopes.medium.ids.splice(b.telescopes.medium.ids.indexOf(t.id), 1)
  } else if (t.id.includes('S')) {
    b.telescopes.small.ids.splice(b.telescopes.small.ids.indexOf(t.id), 1)
  }
  for (let i = 0; i < b.pointings.length; i++) {
    if (b.pointings[i].telIds.indexOf(t.id) !== -1) {
      b.pointings[i].telIds.splice(b.pointings[i].telIds.indexOf(t.id), 1)
      break
    }
  }
}
