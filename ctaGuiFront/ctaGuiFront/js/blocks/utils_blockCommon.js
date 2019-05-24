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
    let index = b.telescopes.large.ids.indexOf(t.id)
    if (index !== -1) b.telescopes.large.ids.splice(index, 1)
  } else if (t.id.includes('M')) {
    let index = b.telescopes.medium.ids.indexOf(t.id)
    if (index !== -1) b.telescopes.medium.ids.splice(index, 1)
  } else if (t.id.includes('S')) {
    let index = b.telescopes.small.ids.indexOf(t.id)
    if (index !== -1) b.telescopes.small.ids.splice(index, 1)
  }
  for (let i = 0; i < b.pointings.length; i++) {
    if (b.pointings[i].telIds.indexOf(t.id) !== -1) {
      b.pointings[i].telIds.splice(b.pointings[i].telIds.indexOf(t.id), 1)
      break
    }
  }
}

window.getTelescopePointing = function (b, t) {
  for (let i = 1; i < b.pointings.length; i++) {
    if (b.pointings[i].telIds.indexOf(t.id) !== -1) return b.pointings[i]
  }
  return null
}

window.addTelescopeToBlock = function (b, t, p) {
  // if (t === undefined) {
  //   b.telIds.push(t)
  //   return
  // }
  if (b.telIds) b.telIds.push(t.id)
  if (t.id.includes('L')) {
    b.telescopes.large.ids.push(t.id)
  } else if (t.id.includes('M')) {
    b.telescopes.medium.ids.push(t.id)
  } else if (t.id.includes('S')) {
    b.telescopes.small.ids.push(t.id)
  }
  if (p) {
    p.telIds.push(t.id)
  }
  // else {
  //   let min = b.pointings[0]
  //   for (let i = 1; i < b.pointings.length; i++) {
  //     if (b.pointings[i].telIds.length < min.telIds.length) min = b.pointings[i]
  //   }
  //   min.telIds.push(t.id)
  // }
}

window.extractRandomTelsFromBlock = function (blocks, teltype) {
  function canExtract (tel) {
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].telescopes[teltype].ids.indexOf(tel) !== -1 && blocks[i].telescopes[teltype].ids.length <= blocks[i].telescopes[teltype].min) return false
    }
    for (let i = 0; i < blocks.length; i++) {
      removeTelescopeFromBlock(blocks[i], {id: tel})
    }
    return true
  }
  for (let i = 0; i < blocks.length; i++) {
    let b = blocks[i]
    if (b.telescopes[teltype].ids.length <= b.telescopes[teltype].min) continue
    for (let j = 0; j < (b.telescopes[teltype].ids.length - b.telescopes[teltype].min); j++) {
      let t = b.telescopes[teltype].ids[j]
      if (canExtract(t)) return t
    }
  }
  return undefined
}

window.forceExtractTelsFromBlock = function (blocks, tel) {
  for (let i = 0; i < blocks.length; i++) {
    removeTelescopeFromBlock(blocks[i], {id: tel})
  }
}

window.getBlocksByTime = function (blocks, start, end) {
  let ret = []
  if (Array.isArray(blocks)) {
    ret = blocks.filter(d => (d.time.start <= start && d.time.end >= start) || (d.time.start <= end && d.time.end >= end))
  } else {
    for (var key in blocks) {
      ret = ret.concat(blocks[key].filter(d => (d.time.start <= start && d.time.end >= start) || (d.time.start <= end && d.time.end >= end)))
    }
  }
  return ret
}
window.balanceTelescopesBetweenBlocks = function (b, blocks) {
  function balance (type) {
    let data = b.telescopes[type]
    if (data.min <= data.ids.length) {
      return
    } else {
      for (let i = data.ids.length; i < data.min; i++) {
        let t = extractRandomTelsFromBlock(blocks.filter(d => d.obId !== b.obId), type)
        if (t === undefined) break
        addTelescopeToBlock(b, {id: t})
      }
    }
  }
  balance('large')
  balance('medium')
  balance('small')
}
