/* global d3 */
/* global is_def */
/* global colorPalette */
var blockTemplate = {
  sched_block_id: undefined,
  obs_block_id: undefined,
  timestamp: undefined,
  time: {
    start: undefined,
    duration: undefined,
    end: undefined
  },
  exe_state: {
    state: undefined,
    can_run: undefined
  },
  metadata: {
    block_name: undefined,
    n_obs: undefined,
    n_sched: undefined
  },
  pointings: [], // {id:"", tel_ids:[], name:"", pos:[]}
  run_phase: [],
  target: [], // {id:"", observability:{maximal,optimal,minimal}, name:"", pos:[]}
  tel_ids: [],
  telescopes: {
    large: { min: 0, max: 0, ids: [] },
    medium: { min: 0, max: 0, ids: [] },
    small: { min: 0, max: 0, ids: [] }
  } // TO REPLACE WITH SUB-ARRAY
}
window.blockTemplate = blockTemplate

window.blockStyle = function (opt_in) {
  let state = is_def(opt_in.state)
    ? opt_in.state
    : opt_in.exe_state.state
  let can_run = is_def(opt_in.can_run)
    ? opt_in.can_run
    : opt_in.exe_state.can_run

  if (state === 'wait') {
    return {color: colorPalette.blocks.wait, opacity: 1, pattern: 'none'}
  } else if (state === 'done') {
    return {color: colorPalette.blocks.done, opacity: 1, pattern: 'none'}
  } else if (state === 'fail') {
    return {color: colorPalette.blocks.fail, opacity: 1, pattern: 'none'}
  } else if (state === 'run') {
    return {color: colorPalette.blocks.run, opacity: 1, pattern: 'none'}
  } else if (state === 'cancel') {
    if (is_def(can_run)) {
      if (!can_run) return {color: colorPalette.blocks.cancelOp, opacity: 1, pattern: 'none'}
    }
    return {color: colorPalette.blocks.cancelSys, opacity: 1, pattern: 'none'}
  } else return {color: colorPalette.blocks.shutdown, opacity: 1, pattern: 'none'}
}

window.block_icon = function (g, dim, name, events, color_theme) {
  let nameSize = 10
  g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', dim.w)
    .attr('height', dim.h)
    .attr('fill', color_theme.dark.background)
    .attr('stroke', color_theme.medium.stroke)
    .attr('stroke-width', 0.6)
    // .style('boxShadow', '10px 20px 30px black')
    .attr('rx', dim.w)
    .on('click', function () {
      events.click()
    })
    .on('mouseover', function (d) {
      d3.select(this).style('cursor', 'pointer')
      d3.select(this).attr('fill', color_theme.darker.background)
    })
    .on('mouseout', function (d) {
      d3.select(this).style('cursor', 'default')
      d3.select(this).attr('fill', color_theme.dark.background)
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
    .attr('fill', color_theme.dark.text)
    .attr('stroke', 'none')
}

window.removeTelescopeFromBlock = function (b, t) {
  if (b.tel_ids && b.tel_ids.indexOf(t.id) !== -1) b.tel_ids.splice(b.tel_ids.indexOf(t.id), 1)
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
    if (b.pointings[i].tel_ids.indexOf(t.id) !== -1) {
      b.pointings[i].tel_ids.splice(b.pointings[i].tel_ids.indexOf(t.id), 1)
      break
    }
  }
}

window.getTelescopePointing = function (b, t) {
  for (let i = 1; i < b.pointings.length; i++) {
    if (b.pointings[i].tel_ids.indexOf(t.id) !== -1) return b.pointings[i]
  }
  return null
}

window.addTelescopeToBlock = function (b, t, p) {
  // if (t === undefined) {
  //   b.tel_ids.push(t)
  //   return
  // }
  if (b.tel_ids) b.tel_ids.push(t.id)
  if (t.id.includes('L')) {
    b.telescopes.large.ids.push(t.id)
  } else if (t.id.includes('M')) {
    b.telescopes.medium.ids.push(t.id)
  } else if (t.id.includes('S')) {
    b.telescopes.small.ids.push(t.id)
  }
  if (p) {
    p.tel_ids.push(t.id)
  }
  // else {
  //   let min = b.pointings[0]
  //   for (let i = 1; i < b.pointings.length; i++) {
  //     if (b.pointings[i].tel_ids.length < min.tel_ids.length) min = b.pointings[i]
  //   }
  //   min.tel_ids.push(t.id)
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

window.get_blocksByTime = function (blocks, start, end) {
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
window.balanceTelescopesBetween_blocks = function (b, blocks) {
  function balance (type) {
    let data = b.telescopes[type]
    if (data.min <= data.ids.length) {
      return
    } else {
      for (let i = data.ids.length; i < data.min; i++) {
        let t = extractRandomTelsFromBlock(blocks.filter(d => d.obs_block_id !== b.obs_block_id), type)
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

let title_size = 11
let headerSize = 10
let txt_size = 9
window.inputDate = function (g, box, id, opt_in, events) {
  let fo = g.append('foreignObject')
    .attr('width', box.w + 'px')
    .attr('height', box.h + 'px')
    .attr('x', box.x + 'px')
    .attr('y', box.y + 'px')
  let root_div = fo.append('xhtml:div')
    .attr('class', 'quantity')
    .attr('id', id)
    .style('width', '100%')
    .style('height', '100%')
  let input = root_div.append('input')
    .attr('type', 'number')
    .attr('min', function (d) { return opt_in.min })
    .attr('max', function (d) { return opt_in.max })
    .attr('step', function (d) { return opt_in.step })
    .style('font-size', 11 + 'px')
    // .style('display', 'inline-block')
    // .style('color', '#000000')
    .style('background', 'transparent')
  input.property('value', function () {
    return opt_in.value
  })
  if (opt_in.disabled) {
    input.attr('disabled')
    return
  }
  input.on('change', function (d) {
    let new_val = parseInt(input.property('value'))
    if (new_val > opt_in.max) new_val = opt_in.max
    else if (new_val < opt_in.min) new_val = opt_in.min
    input.property('value', ('0' + new_val).slice(-2))
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
    let new_val = parseInt(input.property('value'))
    if (direction === 'up') new_val += 1
    else if (direction === 'down') new_val -= 1
    if (new_val > opt_in.max) new_val = opt_in.min
    else if (new_val < opt_in.min) new_val = opt_in.max
    input.property('value', ('0' + new_val).slice(-2))
    events.change(input.property('value'))
  })
  input.on('keyup', function () {
    let event = d3.event
    if (event.keyCode === 13) {
      event.preventDefault()
      events.enter(input.property('value'))
    }
  })
  let nav = root_div.append('div')
    .attr('class', 'quantity-nav')
  nav.append('div')
    .attr('class', 'quantity-button quantity-down')
    .html('-')
    .style('box-shadow', '0 0 0 0.3pt #000000 inset')
    .style('border-radius', '10px 0px 0px 10px')
    .style('font-size', headerSize + 'px')
    .on('click', function () {
      let oldValue = parseInt(input.property('value'))
      let new_val = oldValue
      if (oldValue > opt_in.min) {
        new_val = oldValue - 1
      } else {
        new_val = opt_in.max
      }
      input.property('value', ('0' + new_val).slice(-2))
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
      let new_val = oldValue
      if (oldValue < opt_in.max) {
        new_val = oldValue + 1
      } else {
        new_val = opt_in.min
      }
      input.property('value', ('0' + new_val).slice(-2))
      events.change(input.property('value'))
    })

  return input
}
window.inputNumber = function (g, box, id, opt_in, events) {
  let linker = {}
  let fo = g.append('foreignObject')
    .attr('width', box.w + 'px')
    .attr('height', box.h + 'px')
    .attr('x', box.x + 'px')
    .attr('y', box.y + 'px')
  let root_div = fo.append('xhtml:div')
    .attr('class', 'numberSelectorH')
    .attr('id', id)
    .style('width', '100%')
    .style('height', '100%')

  let navLeft = root_div.append('div')
    .attr('class', 'numberSelectorH-nav')
  if (!opt_in.disabled) {
    navLeft.append('div')
      .attr('class', 'numberSelectorH-button numberSelectorH-down')
      .html('-')
      .style('box-shadow', '0 0 0 0.3pt #000000 inset')
      .style('border-radius', '10px 0px 0px 10px')
      .style('font-size', headerSize + 'px')
      .on('click', function () {
        let oldValue = parseInt(linker.input.property('value'))
        let new_val = oldValue
        if (oldValue > opt_in.min) {
          new_val = oldValue - 1
        }
        linker.input.property('value', ('' + new_val).slice(-2))
        events.change(linker.input.property('value'))
      })
  }

  linker.input = root_div.append('input')
    .attr('type', 'number')
    .attr('min', function (d) { return opt_in.min })
    .attr('max', function (d) { return opt_in.max })
    .attr('step', function (d) { return opt_in.step })
    .style('font-size', 11 + 'px')
    // .style('display', 'inline-block')
    // .style('color', '#000000')
    .style('background', 'transparent')
  linker.input.property('value', function () {
    return opt_in.value
  })
  if (opt_in.disabled) {
    linker.input.attr('disabled')
    return
  }
  linker.input.on('change', function (d) {
    let new_val = parseInt(linker.input.property('value'))
    if (new_val > opt_in.max) new_val = opt_in.max
    else if (new_val < opt_in.min) new_val = opt_in.min
    linker.input.property('value', ('' + new_val).slice(-2))
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
    let new_val = parseInt(linker.input.property('value'))
    if (direction === 'up' && new_val < opt_in.max) new_val += 1
    else if (direction === 'down' && new_val > opt_in.min) new_val -= 1
    linker.input.property('value', ('' + new_val).slice(-2))
    events.change(linker.input.property('value'))
  })
  linker.input.on('keyup', function () {
    let event = d3.event
    if (event.keyCode === 13) {
      event.preventDefault()
      events.enter(linker.input.property('value'))
    }
  })

  let navRight = root_div.append('div')
    .attr('class', 'numberSelectorH-nav')
  navRight.append('div')
    .attr('class', 'numberSelectorH-button numberSelectorH-up')
    .html('+')
    .style('box-shadow', '0 0 0 0.3pt #000000 inset')
    .style('border-radius', '0px 10px 10px 0px')
    .style('font-size', headerSize + 'px')
    .on('click', function () {
      let oldValue = parseInt(linker.input.property('value'))
      let new_val = oldValue
      if (oldValue < opt_in.max) {
        new_val = oldValue + 1
      }
      linker.input.property('value', ('' + new_val).slice(-2))
      events.change(linker.input.property('value'))
    })

  return linker.input
}
window.dropDown_div = function (g, box, id, opt_in, events) {
  let fo = g.append('foreignObject')
    .attr('width', box.w + 'px')
    .attr('height', box.h + 'px')
    .attr('x', box.x + 'px')
    .attr('y', box.y + 'px')
  let root_div = fo.append('xhtml:div')
    .attr('id', id)
    .attr('class', 'dropdown')
    .style('color', '#000000')
    .style('font-size', '11px')
  if (opt_in.disabled) {
    root_div.html(opt_in.value)
    return root_div
  }
  // div.on('mouseover', function (d) {
  //   if (d.event.mouseover) {
  //     div.style('background', function (d) {
  //       return (d.style && d.style.color) ? d3.color(d.style.color).darker(0.4) : d3.color(color_theme.brighter.background).darker(0.4)
  //     })
  //     d.event.mouseover(d)
  //   }
  // })
  // div.on('mouseout', function (d) {
  //   if (d.event.mouseout) {
  //     div.style('background', function (d) {
  //       return (d.style && d.style.color) ? d.style.color : color_theme.brighter.background
  //     })
  //     d.event.mouseout(d)
  //   }
  // })

  // div.attr('class', 'divForm dropDown_div')
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

  let selector = root_div.append('select')
    .style('width', '100%')
    .style('height', '100%')
    .style('box-shadow', '0 0 0 0.1pt #eeeeee inset')
    .style('font-size', opt_in['font-size'])
    .on('change', function (d) {
      events.change(selector.property('value'))
    })
  selector.selectAll('option')
    .data(opt_in.options)
    .enter()
    .append('option')
    .text(function (d) { return d })
  selector.property('value', function () {
    return opt_in.value
  })
  return selector
  // if (!d.editable) selector.attr('disabled', true)
}

window.reassignTelescope = function (block) {
  let allTels = deep_copy(block.tel_ids)
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
    block.pointings[i].tel_ids = tels.ids
    block.pointings[i].tels_info = tels.stats
  }
  let tels = getRandom(allTels, allTels.length)
  block.pointings[block.pointings.length - 1].tel_ids = tels.ids
  block.pointings[block.pointings.length - 1].tels_info = tels.stats

  // initPointing_information()
}
