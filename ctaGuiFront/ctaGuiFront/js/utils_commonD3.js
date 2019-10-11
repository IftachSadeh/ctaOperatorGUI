'use strict'
/* global $ */
/* global d3 */
/* global createD3Node */

window.createD3Node = function (g, type, attr, style) {
  let ret = g.append(type)
  for (let key in attr) {
    ret.attr(key, attr[key])
  }
  for (let key in style) {
    ret.style(key, style[key])
  }
  return ret
}

window.inputDateD3 = function (g, box, id, optIn, events) {
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
    .style('font-size', (optIn.fontSize ? optIn.fontSize : 11) + 'px')
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

  // .on('click', function () {
  //   let oldValue = parseInt(input.property('value'))
  //   let newVal = oldValue
  //   if (oldValue > optIn.min) {
  //     newVal = oldValue - 1
  //   } else {
  //     newVal = optIn.max
  //   }
  //   input.property('value', ('0' + newVal).slice(-2))
  //   events.change(input.property('value'))
  // })

  // .on('click', function () {
  //   let oldValue = parseInt(input.property('value'))
  //   let newVal = oldValue
  //   if (oldValue < optIn.max) {
  //     newVal = oldValue + 1
  //   } else {
  //     newVal = optIn.min
  //   }
  //   input.property('value', ('0' + newVal).slice(-2))
  //   events.change(input.property('value'))
  // })

  return input
}

window.inputNumberD3 = function (g, box, id, optIn, events) {
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

  linker.input = rootDiv.append('input')
    .attr('type', 'number')
    .attr('min', function (d) { return optIn.min })
    .attr('max', function (d) { return optIn.max })
    .attr('step', function (d) { return optIn.step })
    .style('font-size', 11 + 'px')
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

  // .on('click', function () {
  //   let oldValue = parseInt(linker.input.property('value'))
  //   let newVal = oldValue
  //   if (oldValue < optIn.max) {
  //     newVal = oldValue + 1
  //   }
  //   linker.input.property('value', ('' + newVal).slice(-2))
  //   events.change(linker.input.property('value'))
  // })

  // .on('click', function () {
  //   let oldValue = parseInt(linker.input.property('value'))
  //   let newVal = oldValue
  //   if (oldValue > optIn.min) {
  //     newVal = oldValue - 1
  //   }
  //   linker.input.property('value', ('' + newVal).slice(-2))
  //   events.change(linker.input.property('value'))
  // })

  return linker.input
}

window.buttonD3 = function () {
  let reserved = {
    main: {
      id: undefined,
      g: undefined,
      dim: undefined,
      background: {
        style: {},
        attr: {}
      }
    },
    foreground: {
      type: 'image/text',
      style: {},
      attr: {}
    },
    events: {
      click: undefined
    }
  }
  let back
  let fore

  function drawImage () {
    // g.append('svg:image')
    //   .attr('xlink:href', '/static/icons/cross.svg')
    fore = createD3Node(reserved.main.g,
      'svg:image',
      reserved.foreground.common.attr,
      reserved.foreground.common.style)
    fore.text(reserved.options.value)
  }

  function drawText () {
    fore = createD3Node(reserved.main.g,
      'text',
      reserved.foreground.common.attr,
      reserved.foreground.common.style)
    fore.text(reserved.foreground.value)
  }

  function init (optIn) {
    reserved = optIn

    back = createD3Node(reserved.main.g,
      'rect',
      mergeObject(reserved.main.box, reserved.main.background.common.attr),
      reserved.main.background.common.style)
    back.on('click', (d) => { reserved.events.click(d) })
      .on('mouseover', () => { applyAttrToNode(back.transition().duration(100), reserved.main.background.hovered.attr); applyStyleToNode(back.transition().duration(100), reserved.main.background.hovered.style) })
      .on('mouseout', () => { applyAttrToNode(back.transition().duration(100), reserved.main.background.common.attr); applyStyleToNode(back.transition().duration(100), reserved.main.background.common.style) })
    if (reserved.foreground.type === 'text') drawText()
    else if (reserved.foreground.type === 'image') drawImage()
  }
  this.init = init
}

window.dropDownD3 = function () {
  let reserved = {
    main: {
      id: undefined,
      g: undefined,
      dim: undefined,
      background: {
        style: {},
        attr: {}
      },
      text: {
        style: {},
        attr: {}
      }
    },
    options: {
      value: undefined,
      list: undefined,
      dim: undefined,
      nb: undefined,
      background: {
        style: {},
        attr: {}
      },
      text: {
        style: {},
        attr: {}
      }
    },
    events: {
      change: undefined
    }
  }
  let back
  let currentValue
  let arrow
  let scrollg
  let deployed = false

  function drawArrowDown () {
    let arrowBox = [
      {x: reserved.main.dim.w * 0.8, y: reserved.main.dim.h * 0.4},
      {x: reserved.main.dim.w * 0.9, y: reserved.main.dim.h * 0.4},
      {x: reserved.main.dim.w * 0.85, y: reserved.main.dim.h * 0.6}
    ]
    drawArrowCore(arrowBox)
  }
  function drawArrowUp () {
    let arrowBox = [
      {x: reserved.main.dim.w * 0.8, y: reserved.main.dim.h * 0.6},
      {x: reserved.main.dim.w * 0.9, y: reserved.main.dim.h * 0.6},
      {x: reserved.main.dim.w * 0.85, y: reserved.main.dim.h * 0.4}
    ]
    drawArrowCore(arrowBox)
  }
  function drawArrowCore (arrowBox) {
    reserved.main.g.selectAll('polygon.arrow')
      .data([arrowBox])
      .enter()
      .append('polygon')
      .attr('class', 'arrow')
      .attr('points', function (d) {
        return d.map(function (d) {
          return [d.x, d.y].join(',')
        }).join(' ')
      })
      .attr('fill', '#000000')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .merge(reserved.main.g.selectAll('polygon.arrow').data([arrowBox]))
      .attr('points', function (d) {
        return d.map(function (d) {
          return [d.x, d.y].join(',')
        }).join(' ')
      })
  }

  function init (optIn) {
    reserved = optIn

    back = createD3Node(reserved.main.g,
      'rect',
      mergeObject({x: 0, y: 0, width: reserved.main.dim.w, height: reserved.main.dim.h}, reserved.main.background.common.attr),
      reserved.main.background.common.style)
    back.on('click', drop)
      .on('mouseover', () => { applyAttrToNode(back.transition().duration(100), reserved.main.background.hovered.attr); applyStyleToNode(back.transition().duration(100), reserved.main.background.hovered.style) })
      .on('mouseout', () => { applyAttrToNode(back.transition().duration(100), reserved.main.background.common.attr); applyStyleToNode(back.transition().duration(100), reserved.main.background.common.style) })

    currentValue = createD3Node(reserved.main.g,
      'text',
      mergeObject({x: 4, y: reserved.main.dim.h * 0.5}, reserved.main.text.common.attr),
      reserved.main.text.common.style)
    currentValue.text(reserved.options.value)
    let bboxt = currentValue.node().getBBox()
    currentValue.attr('y', (bboxt.height * 0.5 + reserved.main.dim.h) * 0.5)

    drawArrowDown()
  }
  this.init = init

  function initScrollBox (tag, g, box) {
    let scrollBox = new ScrollBox()
    scrollBox.init({
      tag: tag,
      gBox: g,
      boxData: box,
      useRelativeCoords: true,
      locker: new Locker(),
      lockerV: [tag + 'updateData'],
      lockerZoom: {
        all: tag + 'zoom',
        during: tag + 'zoomDuring',
        end: tag + 'zoomEnd'
      },
      runLoop: new RunLoop({tag: tag}),
      canScroll: true,
      scrollVertical: true,
      scrollHorizontal: false,
      scrollHeight: 0,
      scrollWidth: 0,
      background: 'black',
      scrollRecH: {h: 4},
      scrollRecV: {w: 4}
    })
    return scrollBox
  }

  function changeSelected (d) {
    if (!reserved.options.blocked) {
      reserved.options.value = d
      currentValue.text(reserved.options.value)
    }

    reserved.events.change(d)

    if (!reserved.options.keepDropOpen) closeDrop()
  }

  function closeDrop () {
    deployed = false
    scrollg.remove()
    drawArrowDown()
  }

  function drop () {
    if (deployed) {
      closeDrop()
      return
    }
    deployed = true
    drawArrowUp()
    let max = reserved.options.nb < reserved.options.list.length ? reserved.options.nb : reserved.options.list.length
    let scrollbox = {x: 0, y: reserved.main.dim.h, w: reserved.options.dim.w, h: reserved.options.dim.h * max}
    scrollg = reserved.main.g.append('g')
    moveNodeUp(scrollg.node())
    let scrollBox = initScrollBox('dropScroll', scrollg, scrollbox)
    let g = scrollBox.get('innerG')

    let current = g
      .selectAll('g.option')
      .data(reserved.options.list.filter(d => d !== reserved.options.value))
    let enter = current
      .enter()
      .append('g')
      .attr('class', 'option')
    enter.each(function (d, i) {
      let g = d3.select(this)
      let back = createD3Node(g,
        'rect',
        mergeObject({x: 0, y: 0, width: reserved.options.dim.w, height: reserved.options.dim.h}, reserved.options.background.common.attr),
        reserved.options.background.common.style)
      back.on('click', (d) => { changeSelected(d) })
        .on('mouseover', () => { applyAttrToNode(back.transition().duration(100), reserved.options.background.hovered.attr); applyStyleToNode(back.transition().duration(100), reserved.options.background.hovered.style) })
        .on('mouseout', () => { applyAttrToNode(back.transition().duration(100), reserved.options.background.common.attr); applyStyleToNode(back.transition().duration(100), reserved.options.background.common.style) })

      let value = createD3Node(g,
        'text',
        mergeObject({x: 4, y: reserved.options.dim.h * 0.5}, reserved.options.text.common.attr),
        reserved.options.text.common.style)
      value.text(d)
      let bboxt = value.node().getBBox()
      value.attr('y', (bboxt.height * 0.5 + reserved.options.dim.h) * 0.5)
    })
    let merge = current.merge(enter)
    merge.each(function (d, i) {
      let g = d3.select(this)
      let offX = 0
      let offY = reserved.options.dim.h * i
      g.attr('transform', 'translate(' + offX + ',' + offY + ')')
    })
    current
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()
  }
}
