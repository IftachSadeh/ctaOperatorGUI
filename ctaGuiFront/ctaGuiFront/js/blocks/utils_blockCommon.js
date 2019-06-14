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
window.blocksIntersect = function (b1, b2) {
  if (b1.time.start <= b2.time.start && b1.time.end >= b2.time.end) return true
  if (b1.time.end >= b2.time.start && b1.time.end <= b2.time.end) return true
  if (b1.time.start >= b2.time.start && b1.time.end <= b2.time.end) return true
  if (b1.time.start <= b2.time.end && b1.time.end >= b2.time.end) return true
  return false
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
window.clusterBlocksByTime = function (blocks) {
  function checkDuplicata (c1, c2) {
    let count = 0
    c2.map(function (d) {
      if (c1.indexOf(d) !== -1) count += 1
    })
    if (count === c2.length && count === c1.length) return true
    return false
  }
  let clusters = blocks.map(d => [d])
  for (let i = 0; i < blocks.length; i++) {
    for (let j = 0; j < clusters.length; j++) {
      if (i === j) continue
      let inter = true
      for (let z = 0; z < clusters[j].length; z++) {
        if (!blocksIntersect(clusters[j][z], blocks[i])) {
          inter = false
          break
        }
      }
      if (inter) clusters[j].push(blocks[i])
    }
  }
  for (let i = clusters.length - 1; i >= 0; i--) {
    for (let j = i - 1; j >= 0; j--) {
      if (checkDuplicata(clusters[i], clusters[j])) clusters.splice(i, 1)
      break
    }
  }
  return clusters
}

let titleSize = 11
let headerSize = 10
let txtSize = 9
window.inputDate = function (g, box, id, optIn, events) {
  let fo = g.append('foreignObject')
    .attr('width', box.w + 'px')
    .attr('height', box.h + 'px')
    .attr('x', box.x + 'px')
    .attr('y', box.y + 'px')
  let rootDiv = fo.append('xhtml:div')
    .attr('class', 'quantity')
    .attr('id', id)
    .style('width', '100%')
    .style('height', '100%')
  let input = rootDiv.append('input')
    .attr('type', 'number')
    .attr('min', function (d) { return optIn.min })
    .attr('max', function (d) { return optIn.max })
    .attr('step', function (d) { return optIn.step })
    .style('font-size', 11 + 'px')
    // .style('display', 'inline-block')
    // .style('color', '#000000')
    .style('background', 'transparent')
  input.property('value', function () {
    return optIn.value
  })
  if (optIn.disabled) {
    input.attr('disabled')
    return
  }
  input.on('change', function (d) {
    let newVal = parseInt(input.property('value'))
    if (newVal > optIn.max) newVal = optIn.max
    else if (newVal < optIn.min) newVal = optIn.min
    input.property('value', ('0' + newVal).slice(-2))
    events.change(input.property('value'))
  })
  input.on('focus', function () {
    $(this).select()
  })
  input.on('wheel', function (d) {
    if (!$(this).is(':focus')) {
      return
    }
    d3.event.preventDefault()
    let direction = d3.event.wheelDelta < 0 ? 'down' : 'up'
    let newVal = parseInt(input.property('value'))
    if (direction === 'up') newVal += 1
    else if (direction === 'down') newVal -= 1
    if (newVal > optIn.max) newVal = optIn.min
    else if (newVal < optIn.min) newVal = optIn.max
    input.property('value', ('0' + newVal).slice(-2))
    events.change(input.property('value'))
  })
  input.on('keyup', function () {
    let event = d3.event
    if (event.keyCode === 13) {
      event.preventDefault()
      events.enter(input.property('value'))
    }
  })
  let nav = rootDiv.append('div')
    .attr('class', 'quantity-nav')
  nav.append('div')
    .attr('class', 'quantity-button quantity-down')
    .html('-')
    .style('box-shadow', '0 0 0 0.3pt #000000 inset')
    .style('border-radius', '10px 0px 0px 10px')
    .style('font-size', headerSize + 'px')
    .on('click', function () {
      let oldValue = parseInt(input.property('value'))
      let newVal = oldValue
      if (oldValue > optIn.min) {
        newVal = oldValue - 1
      } else {
        newVal = optIn.max
      }
      input.property('value', ('0' + newVal).slice(-2))
      events.change(input.property('value'))
    })
  nav.append('div')
    .attr('class', 'quantity-button quantity-up')
    .html('+')
    .style('box-shadow', '0 0 0 0.3pt #000000 inset')
    .style('border-radius', '0px 10px 10px 0px')
    .style('font-size', headerSize + 'px')
    .on('click', function () {
      let oldValue = parseInt(input.property('value'))
      let newVal = oldValue
      if (oldValue < optIn.max) {
        newVal = oldValue + 1
      } else {
        newVal = optIn.min
      }
      input.property('value', ('0' + newVal).slice(-2))
      events.change(input.property('value'))
    })

  return input
}
window.inputNumber = function (g, box, id, optIn, events) {
  let linker = {}
  let fo = g.append('foreignObject')
    .attr('width', box.w + 'px')
    .attr('height', box.h + 'px')
    .attr('x', box.x + 'px')
    .attr('y', box.y + 'px')
  let rootDiv = fo.append('xhtml:div')
    .attr('class', 'numberSelectorH')
    .attr('id', id)
    .style('width', '100%')
    .style('height', '100%')

  let navLeft = rootDiv.append('div')
    .attr('class', 'numberSelectorH-nav')
  if (!optIn.disabled) {
    navLeft.append('div')
      .attr('class', 'numberSelectorH-button numberSelectorH-down')
      .html('-')
      .style('box-shadow', '0 0 0 0.3pt #000000 inset')
      .style('border-radius', '10px 0px 0px 10px')
      .style('font-size', headerSize + 'px')
      .on('click', function () {
        let oldValue = parseInt(linker.input.property('value'))
        let newVal = oldValue
        if (oldValue > optIn.min) {
          newVal = oldValue - 1
        }
        linker.input.property('value', ('' + newVal).slice(-2))
        events.change(linker.input.property('value'))
      })
  }

  linker.input = rootDiv.append('input')
    .attr('type', 'number')
    .attr('min', function (d) { return optIn.min })
    .attr('max', function (d) { return optIn.max })
    .attr('step', function (d) { return optIn.step })
    .style('font-size', 11 + 'px')
    // .style('display', 'inline-block')
    // .style('color', '#000000')
    .style('background', 'transparent')
  linker.input.property('value', function () {
    return optIn.value
  })
  if (optIn.disabled) {
    linker.input.attr('disabled')
    return
  }
  linker.input.on('change', function (d) {
    let newVal = parseInt(linker.input.property('value'))
    if (newVal > optIn.max) newVal = optIn.max
    else if (newVal < optIn.min) newVal = optIn.min
    linker.input.property('value', ('' + newVal).slice(-2))
    events.change(linker.input.property('value'))
  })
  linker.input.on('focus', function () {
    $(this).select()
  })
  linker.input.on('wheel', function (d) {
    if (!$(this).is(':focus')) {
      return
    }
    d3.event.preventDefault()
    d3.event.stopPropagation()
    let direction = d3.event.wheelDelta < 0 ? 'down' : 'up'
    let newVal = parseInt(linker.input.property('value'))
    if (direction === 'up' && newVal < optIn.max) newVal += 1
    else if (direction === 'down' && newVal > optIn.min) newVal -= 1
    linker.input.property('value', ('' + newVal).slice(-2))
    events.change(linker.input.property('value'))
  })
  linker.input.on('keyup', function () {
    let event = d3.event
    if (event.keyCode === 13) {
      event.preventDefault()
      events.enter(linker.input.property('value'))
    }
  })

  let navRight = rootDiv.append('div')
    .attr('class', 'numberSelectorH-nav')
  navRight.append('div')
    .attr('class', 'numberSelectorH-button numberSelectorH-up')
    .html('+')
    .style('box-shadow', '0 0 0 0.3pt #000000 inset')
    .style('border-radius', '0px 10px 10px 0px')
    .style('font-size', headerSize + 'px')
    .on('click', function () {
      let oldValue = parseInt(linker.input.property('value'))
      let newVal = oldValue
      if (oldValue < optIn.max) {
        newVal = oldValue + 1
      }
      linker.input.property('value', ('' + newVal).slice(-2))
      events.change(linker.input.property('value'))
    })

  return linker.input
}
window.dropDownDiv = function (g, box, id, optIn, events) {
  let fo = g.append('foreignObject')
    .attr('width', box.w + 'px')
    .attr('height', box.h + 'px')
    .attr('x', box.x + 'px')
    .attr('y', box.y + 'px')
  let rootDiv = fo.append('xhtml:div')
    .attr('id', id)
    .attr('class', 'dropdown')
    .style('color', '#000000')
    .style('font-size', '11px')
  if (optIn.disabled) {
    rootDiv.html(optIn.value)
    return rootDiv
  }
  // div.on('mouseover', function (d) {
  //   if (d.event.mouseover) {
  //     div.style('background', function (d) {
  //       return (d.style && d.style.color) ? d3.color(d.style.color).darker(0.4) : d3.color(colorTheme.brighter.background).darker(0.4)
  //     })
  //     d.event.mouseover(d)
  //   }
  // })
  // div.on('mouseout', function (d) {
  //   if (d.event.mouseout) {
  //     div.style('background', function (d) {
  //       return (d.style && d.style.color) ? d.style.color : colorTheme.brighter.background
  //     })
  //     d.event.mouseout(d)
  //   }
  // })

  // div.attr('class', 'divForm dropDownDiv')
  // let d = div.data()[0]
  // div.append('label')
  //   .attr('class', 'key')
  //   .html(function (d) { return d.key })
  //   .attr('id', 'key')
  //   .style('display', 'inline-block')
  //   .style('color', '#000000')
  //   // .style('font-size', 10 + 'px')
  //   .style('background', 'transparent')
  //   // .style('margin-left', '6px')
  // div.append('label')
  //   .attr('class', 'dot')
  //   .attr('id', 'dot')
  //   .html(' : ')
  //   .style('display', 'inline-block')
  //   .style('color', '#000000')
  //   // .style('font-size', 10 + 'px')
  //   .style('background', 'transparent')

  let selector = rootDiv.append('select')
    .style('width', '100%')
    .style('height', '100%')
    .style('box-shadow', '0 0 0 0.1pt #eeeeee inset')
    .style('font-size', optIn['font-size'])
    .on('change', function (d) {
      events.change(selector.property('value'))
    })
  selector.selectAll('option')
    .data(optIn.options)
    .enter()
    .append('option')
    .text(function (d) { return d })
  selector.property('value', function () {
    return optIn.value
  })
  return selector
  // if (!d.editable) selector.attr('disabled', true)
}

window.reassignTelescope = function (block) {
  let allTels = deepCopy(block.telIds)
  let sizeChunk = allTels.length / block.pointings.length
  function getRandom (arr, size) {
    let rand = []
    let stats = {large: 0, medium: 0, small: 0}
    for (let i = 0; i < size && arr.length > 0; i++) {
      let index = Math.floor(Math.random() * arr.length)
      let tt = arr.splice(index, 1)[0]
      if (tt.includes('L')) stats.large += 1
      if (tt.includes('M')) stats.medium += 1
      if (tt.includes('S')) stats.small += 1
      rand.push(tt)
    }
    return {ids: rand, stats: stats}
  }
  for (let i = 0; i < block.pointings.length - 1; i++) {
    let tels = getRandom(allTels, sizeChunk)
    block.pointings[i].telIds = tels.ids
    block.pointings[i].telsInfo = tels.stats
  }
  let tels = getRandom(allTels, allTels.length)
  block.pointings[block.pointings.length - 1].telIds = tels.ids
  block.pointings[block.pointings.length - 1].telsInfo = tels.stats

  // initPointingInformation()
}
