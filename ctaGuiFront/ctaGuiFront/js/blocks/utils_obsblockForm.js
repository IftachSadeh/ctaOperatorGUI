/* global d3 */
/* global blockStyle */
/* global loadScript */
/* global colorPalette */
/* global hasVar */
/* global targetIcon */
/* global pointingIcon */
/* global TargetDisplayer */
/* global TelescopeDisplayer */

loadScript({ source: 'utils_scrollTable', script: '/js/blocks/utils_blockCommon.js' })

window.ObsblockForm = function (optIn) {
  let com = {
    main: {
      tag: 'blockFormTag',
      g: undefined,
      scroll: {},
      box: {x: 0, y: 0, w: 1000, h: 300, marg: 0},
      background: {
        fill: colorPalette.brighter.background,
        stroke: colorPalette.brighter.stroke,
        strokeWidth: 0.5
      }
    },
    tree: {
      box: {},
      events: {
        click: undefined,
        over: undefined,
        out: undefined
      }
    },
    schedule: {
      box: {},
      events: {
        click: undefined,
        over: undefined,
        out: undefined
      }
    },
    target: {
      box: {},
      events: {
        click: undefined,
        over: undefined,
        out: undefined
      }
    },
    telescope: {
      box: {},
      events: {
        click: undefined,
        over: undefined,
        out: undefined
      }
    },
    data: {
      block: undefined,
      schedB: undefined
    },
    debug: {
      enabled: false
    },
    input: {
      over: {
        schedBlocks: undefined,
        block: undefined
      },
      focus: {
        schedBlocks: undefined,
        block: undefined
      }
    }
  }
  com = optIn

  let titleSize = 11
  let headerSize = 10
  let txtSize = 9

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function init () {
    initSchedulingObservingBlocksTree()
    initTimeInformation()
    initPointingInformation()
    initTelescopeInformation()
  }
  this.init = init

  function update () {
    // initSchedulingObservingBlocksTree()
    // initTimeInformation()
    // initPointingInformation()
    // initTelescopeInformation()
  }
  this.update = update

  function changeBlockTime (type, hour, min, sec) {
    let startTime = new Date(com.data.timeOfNight.date_start)
    let endTime = new Date(com.data.timeOfNight.date_end)
    switch (type) {
      case 'startTime':
        if (Number(hour) > 0 && Number(hour) <= endTime.getHours()) {
          endTime.setHours(Number(hour))
          endTime.setMinutes(Number(min))
          endTime.setSeconds(Number(sec))
        } else {
          endTime = new Date(com.data.timeOfNight.date_start)
          endTime.setHours(Number(hour))
          endTime.setMinutes(Number(min))
          endTime.setSeconds(Number(sec))
        }
        com.data.block.startTime = (endTime - startTime) / 1000
        com.data.block.endTime = com.data.block.startTime + com.data.block.duration
        break
      case 'duration':
        com.data.block.duration = Number(hour) * 3600 + Number(min) * 60 + Number(sec) * 60
        com.data.block.endTime = com.data.block.startTime + com.data.block.duration
        break
      case 'endTime':
        if (Number(hour) > 0 && Number(hour) <= endTime.getHours()) {
          endTime.setHours(Number(hour))
          endTime.setMinutes(Number(min))
          endTime.setSeconds(Number(sec))
        } else {
          endTime = new Date(com.data.timeOfNight.date_start)
          endTime.setHours(Number(hour))
          endTime.setMinutes(Number(min))
          endTime.setSeconds(Number(sec))
        }
        com.data.block.endTime = (endTime - startTime) / 1000
        com.data.block.duration = com.data.block.endTime + com.data.block.startTime
        break
      default:
        return
    }
    console.log(type, hour, min, sec)
  }

  function initSchedulingObservingBlocksTree () {
    let data = com.data.block
    let schedB = com.data.schedB
    let box = com.tree.box
    let palette = blockStyle(data)

    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.tree.g = g
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', box.h)
      .attr('height', box.h)
      .attr('fill', palette.color.background)
      .attr('stroke', palette.color.stroke)
      .attr('stroke-width', 0.2)
      .on('click', function () {
        com.tree.events.click('block', data.obId)
      })
      .on('mouseover', function (d) {
        d3.select(this).style('cursor', 'pointer')
        d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
      })
      .on('mouseout', function (d) {
        d3.select(this).style('cursor', 'default')
        d3.select(this).attr('fill', palette.color.background)
      })
    g.append('text')
      .text(data.metaData.blockName)
      .style('fill', palette.color.text)
      .style('font-weight', '')
      .style('font-size', titleSize + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (box.w * 0.075) + ',' + (box.h * 0.5 + titleSize * 0.3) + ')')
      .style('pointer-events', 'none')

    // g.append('text')
    //   .text('sched. block:')
    //   .style('fill', color.text)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize * 1.2)
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.25) + ',' + (box.h * 0.25 + txtSize * 0.3) + ')')
    let dimPoly = box.h * 0.5
    let poly = [
      {x: dimPoly * 0.3, y: dimPoly * 0.0},
      {x: dimPoly * 0.7, y: dimPoly * 0.0},

      {x: dimPoly * 1, y: dimPoly * 0.3},
      {x: dimPoly * 1, y: dimPoly * 0.7},

      {x: dimPoly * 0.7, y: dimPoly * 1},
      {x: dimPoly * 0.3, y: dimPoly * 1},

      {x: dimPoly * 0.0, y: dimPoly * 0.7},
      {x: dimPoly * 0.0, y: dimPoly * 0.3}
    ]
    g.selectAll('polygon')
      .data([poly])
      .enter()
      .append('polygon')
      .attr('points', function (d) {
        return d.map(function (d) {
          return [d.x, d.y].join(',')
        }).join(' ')
      })
      .attr('fill', colorPalette.dark.background)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.2)
      .attr('transform', 'translate(' + (box.w * 0.2) + ',' + (box.h * 0.9 - dimPoly) + ')')
      .on('click', function () {
        com.tree.events.click('schedBlock', data.sbId)
      })
      .on('mouseover', function (d) {
        d3.select(this).style('cursor', 'pointer')
        d3.select(this).attr('fill', colorPalette.darker.background)
      })
      .on('mouseout', function (d) {
        d3.select(this).style('cursor', 'default')
        d3.select(this).attr('fill', colorPalette.dark.background)
      })
    g.append('text')
      .text('S' + data.metaData.nSched)
      .style('fill', colorPalette.dark.text)
      .style('font-weight', '')
      .style('font-size', txtSize * 1.2 + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (box.w * 0.2 + dimPoly * 0.5) + ',' + (box.h * 0.9 - dimPoly * 0.5 + txtSize * 0.3) + ')')
      .style('pointer-events', 'none')

    // g.append('text')
    //   .text('obs. blocks:')
    //   .style('fill', color.text)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize * 1.2)
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.25) + ',' + (box.h * 0.75 + txtSize * 0.3) + ')')
    for (let i = 0; i < schedB.blocks.length; i++) {
      let palette = blockStyle(schedB.blocks[i])
      g.append('rect')
        .attr('x', (box.w * 0.3) + (dimPoly * i))
        .attr('y', box.h * 0.9 - dimPoly * 0.8)
        .attr('width', dimPoly * 0.8)
        .attr('height', dimPoly * 0.8)
        .attr('fill', palette.color.background)
        .attr('stroke', palette.color.stroke)
        .attr('stroke-width', data.obId === schedB.blocks[i].obId ? 1 : 0.2)
        .attr('stroke-dasharray', data.obId === schedB.blocks[i].obId ? [2, 2] : [])
        .on('click', function () {
          com.tree.events.click('block', schedB.blocks[i].obId)
        })
        .on('mouseover', function (d) {
          d3.select(this).style('cursor', 'pointer')
          d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
        })
        .on('mouseout', function (d) {
          d3.select(this).style('cursor', 'default')
          d3.select(this).attr('fill', palette.color.background)
        })
      g.append('text')
        .text(schedB.blocks[i].metaData.nObs)
        .style('fill', palette.color.text)
        .style('font-weight', '')
        .style('font-size', txtSize + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + ((box.w * 0.3) + (dimPoly * i) + (dimPoly * 0.4)) + ',' + (box.h * 0.9 - dimPoly * 0.4 + txtSize * 0.3) + ')')
        .style('pointer-events', 'none')
    }
  }
  function initTimeInformation () {
    let data = com.data.block
    let box = com.schedule.box

    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.schedule.g = g
    g.append('text')
      .text('Schedule')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', 'bold')
      .style('font-size', titleSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (0) + ',' + (0) + ')')
    g.append('line')
      .attr('x1', 0)
      .attr('y1', 2)
      .attr('x2', box.w)
      .attr('y2', 2)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.2)

    g.append('rect')
      .attr('id', 'headerStrip')
      .attr('x', 0)
      .attr('y', 3)
      .attr('width', box.w)
      .attr('height', headerSize)
      .attr('fill', colorPalette.dark.stroke)
    let label = [
      {x: box.w * 0.01, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.15, text: 'State', anchor: 'start'},
      {x: box.w * 0.15, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.20, text: 'Start', anchor: 'start'},
      {x: box.w * 0.35, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.20, text: 'Duration', anchor: 'start'},
      {x: box.w * 0.55, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.20, text: 'End', anchor: 'start'},
      {x: box.w * 0.75, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.45, text: 'Pointing', anchor: 'start'}
    ]
    for (let i = 0; i < label.length; i++) {
      g.append('text')
        .text(label[i].text)
        .style('fill', colorPalette.medium.background)
        .style('font-weight', 'bold')
        .style('font-size', txtSize + 'px')
        .attr('text-anchor', label[i].anchor)
        .attr('transform', 'translate(' + (label[i].x) + ',' + (label[i].y) + ')')
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', label[i].w)
        .attr('height', box.h - headerSize - 4)
        .attr('fill', i % 2 === 1 ? colorPalette.dark.background : colorPalette.darker.background)
        .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    }

    function drawTime (id, x, y, time) {
      let stock = {}
      let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
      let hbox = {
        x: x,
        y: y,
        w: 12.5,
        h: headerSize * 2
      }
      let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
      let mbox = {
        x: x + 16,
        y: y,
        w: 12.5,
        h: headerSize * 2
      }
      let sec = ('0' + d3.timeFormat('%S')(time)).slice(-2)
      let sbox = {
        x: x + 32,
        y: y,
        w: 12.5,
        h: headerSize * 2
      }
      stock.hour = inputDate(g,
        hbox,
        {value: hour, min: 0, max: 23, step: 1},
        {change: (d) => { changeBlockTime(id, d, stock.minute.property('value'), stock.second.property('value')) }, enter: (d) => { stock.minute.node().focus() }})
      g.append('text')
        .text(':')
        .style('fill', colorPalette.dark.stroke)
        .style('font-size', headerSize + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (hbox.x + hbox.w + 0.5) + ',' + (y + headerSize * 1.1) + ')')
      stock.minute = inputDate(g,
        mbox,
        {value: min, min: 0, max: 60, step: 1},
        {change: (d) => { changeBlockTime(id, stock.hour.property('value'), d, stock.second.property('value')) }, enter: (d) => { stock.second.node().focus() }})
      g.append('text')
        .text(':')
        .style('fill', colorPalette.dark.stroke)
        .style('font-size', headerSize + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (mbox.x + mbox.w + 0.5) + ',' + (y + headerSize * 1.1) + ')')
      stock.second = inputDate(g,
        sbox,
        {value: sec, min: 0, max: 60, step: 1},
        {change: (d) => { changeBlockTime(id, stock.hour.property('value'), stock.minute.property('value'), d) }, enter: (d) => { stock.second.node().blur() }})
    }

    let startTime = new Date(com.data.timeOfNight.date_start)
    startTime.setSeconds(startTime.getSeconds() + data.startTime)
    let endTime = new Date(com.data.timeOfNight.date_start)
    endTime.setSeconds(endTime.getSeconds() + data.startTime + data.duration)
    let duration = new Date(endTime)
    duration.setHours(duration.getHours() - startTime.getHours())
    duration.setMinutes(duration.getMinutes() - startTime.getMinutes())
    duration.setSeconds(duration.getSeconds() - startTime.getSeconds())

    g.append('text')
      .text(data.exeState.state)
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', titleSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.02) + ',' + (3 + headerSize * 1.5 + txtSize * 1.3) + ')')

    drawTime('startTime', label[1].x, 3 + headerSize * 1.5, startTime)
    drawTime('duration', label[2].x, 3 + headerSize * 1.5, duration)
    drawTime('endTime', label[3].x, 3 + headerSize * 1.5, endTime)

    g.append('text')
      .text(data.pointingName)
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', headerSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (label[4].x) + ',' + (3 + headerSize * 1.5 + headerSize * 1.3) + ')')
  }
  function inputDate (g, box, optIn, events) {
    com.component = {}
    com.component.fo = g.append('foreignObject')
      .attr('width', box.w + 'px')
      .attr('height', box.h + 'px')
      .attr('x', box.x + 'px')
      .attr('y', box.y + 'px')
    com.component.rootDiv = com.component.fo.append('xhtml:div')
      .attr('class', 'quantity')
      // .style('display', 'inline-block')
      // .style('border', 0 + 'px solid #78909C')
      // .style('background-color', 'transparent')
      .style('width', '100%')
      .style('height', '100%')
    // div.append('label')
    //   .html(function (d) { return d.key })
    //   .attr('class', 'key')
    //   .attr('id', 'key')
    //   .style('display', 'inline-block')
    //   .style('color', '#000000')
    //   // .style('font-size', 10 + 'px')
    //   .style('background', 'transparent')
    // div.append('label')
    //   .attr('id', 'dot')
    //   .attr('class', 'dot')
    //   .html(' : ')
    //   .style('display', 'inline-block')
    //   .style('color', '#000000')
    //   // .style('font-size', 10 + 'px')
    //   .style('background', 'transparent')
    let input = com.component.rootDiv.append('input')
      .attr('type', 'number')
      .attr('min', function (d) { return optIn.min })
      .attr('max', function (d) { return optIn.max })
      .attr('step', function (d) { return optIn.step })
      .style('font-size', headerSize + 'px')
      // .style('display', 'inline-block')
      // .style('color', '#000000')
      .style('background', 'transparent')
    input.property('value', function () {
      return optIn.value
    })
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
    let nav = com.component.rootDiv.append('div')
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
  function inputNumber (g, box, optIn, events) {
    com.component = {}
    com.component.fo = g.append('foreignObject')
      .attr('width', box.w + 'px')
      .attr('height', box.h + 'px')
      .attr('x', box.x + 'px')
      .attr('y', box.y + 'px')
    com.component.rootDiv = com.component.fo.append('xhtml:div')
      .attr('class', 'quantity')
      .style('width', '100%')
      .style('height', '100%')
    let input = com.component.rootDiv.append('input')
      .attr('type', 'number')
      .attr('min', function (d) { return optIn.min })
      .attr('max', function (d) { return optIn.max })
      .attr('step', function (d) { return optIn.step })
      .style('font-size', headerSize + 'px')
      // .style('display', 'inline-block')
      // .style('color', '#000000')
      .style('background', 'transparent')
    input.property('value', function () {
      return optIn.value
    })
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
    let nav = com.component.rootDiv.append('div')
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

  function initPointingInformation () {
    let box = com.target.box
    let data = com.data.block
    let target = com.data.target
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.target.g = g
    g.append('text')
      .text('Targets & pointings')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', 'bold')
      .style('font-size', titleSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    g.append('line')
      .attr('x1', 0)
      .attr('y1', 2)
      .attr('x2', box.w * 1.0)
      .attr('y2', 2)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.2)

    g.append('rect')
      .attr('id', 'headerStrip')
      .attr('x', box.h + headerSize * 0)
      .attr('y', 3)
      .attr('width', box.w - box.h - headerSize * 0)
      .attr('height', headerSize)
      .attr('fill', colorPalette.dark.stroke)
    let label = [
      {x: (box.h + ((box.w - box.h) * 0.02)), y: 3 + headerSize * 0.5 + txtSize * 0.3, w: ((box.w - box.h) * 0.25), text: 'Links', anchor: 'start'},
      {x: (box.h + ((box.w - box.h) * 0.25)), y: 3 + headerSize * 0.5 + txtSize * 0.3, w: ((box.w - box.h) * 0.75), text: 'Positions', anchor: 'start'}
    ]
    for (let i = 0; i < label.length; i++) {
      g.append('text')
        .text(label[i].text)
        .style('fill', colorPalette.medium.background)
        .style('font-weight', 'bold')
        .style('font-size', txtSize + 'px')
        .attr('text-anchor', label[i].anchor)
        .attr('transform', 'translate(' + (label[i].x) + ',' + (label[i].y) + ')')
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', label[i].w)
        .attr('height', box.h - headerSize)
        .attr('fill', i % 2 === 1 ? colorPalette.dark.background : colorPalette.darker.background)
        .attr('transform', 'translate(' + (i === 0 ? box.h : label[i].x) + ',' + (headerSize + 3) + ')')
    }

    let height = box.w * 0.09

    let tg = g.append('g').attr('transform', 'translate(' + (box.w * 0.48) + ',' + (box.h * 0.15) + ')')
    let tevents = {
      click: function () { com.target.events.click('target', data.targetId) }
    }
    targetIcon(tg, {w: height, h: height}, 'T' + data.pointingName.split('/')[0].split('_')[1], tevents, colorPalette)

    let pg = g.append('g').attr('transform', 'translate(' + (box.w * 0.48) + ',' + (box.h * 0.5) + ')')
    let pevents = {
      click: function () { com.target.events.click('target', data.targetId) }
    }
    pointingIcon(pg, {w: height, h: height}, 'P' + data.pointingName.split('/')[1].split('_')[1], pevents, colorPalette)

    g.append('text')
      .text(target.pos[0])
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', headerSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.175 + headerSize * 0.5) + ')')
    g.append('text')
      .text(target.pos[1])
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', headerSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.175 + headerSize * 2) + ')')

    g.append('text')
      .text(data.pointingPos[0])
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', headerSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.55 + headerSize * 0.5) + ')')
    g.append('text')
      .text(data.pointingPos[1])
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', headerSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.55 + headerSize * 2) + ')')

    let gt = g.append('g')
      .attr('id', 'telsDisplayer')
      .attr('transform', 'translate(' + 0 + ',' + 3 + ')')

    com.targetBlock = new TargetDisplayer({
      main: {
        tag: 'targetRootTag',
        g: gt,
        scroll: {},
        box: {x: 0, y: 0, w: box.w * 0.45, h: box.h, marg: 0},
        background: {
          fill: colorPalette.brighter.background,
          stroke: colorPalette.brighter.stroke,
          strokeWidth: 0.5
        }
      },

      displayer: 'defaultBib',
      defaultBib: {
        quickmap: {
          enabled: false,
          target: {
            events: {
              click: () => {},
              over: () => {},
              out: () => {}
            }
          },
          pointing: {
            events: {
              click: () => {},
              over: () => {},
              out: () => {}
            }
          }
        },
        skymap: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: 0, w: box.w * 0.45, h: box.h, marg: 0},
          mainTarget: target
        },
        legend: {
          enabled: false
        }
      },

      filters: {
        targetFilters: [],
        filtering: []
      },
      data: {
        raw: {
          targets: []
        },
        filtered: {},
        modified: []
      },
      debug: {
        enabled: false
      },
      pattern: {
        select: {}
      },
      input: {
        over: {
          target: undefined
        },
        focus: {
          target: undefined
        }
      }
    })
    com.targetBlock.init()
    com.targetBlock.updateData({
      data: {
        raw: {
          targets: [{id: data.pointingId, name: data.pointingName, pos: data.pointingPos}]
        },
        modified: []
      }
    })
  }
  function initTelescopeInformation () {
    let box = com.telescope.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.telescope.g = g
    box.y = 0
    g.append('text')
      .text('Telescopes')
      .attr('x', box.w * 0.01)
      .attr('y', box.y + box.h)
      .style('font-weight', 'bold')
      .attr('text-anchor', 'start')
      .style('font-size', titleSize + 'px')
      .style('pointer-events', 'none')
      .attr('fill', colorPalette.dark.text)
      .attr('stroke', 'none')
    box.y -= 2 + titleSize
    g.append('line')
      .attr('x1', 0)
      .attr('y1', box.y + box.h)
      .attr('x2', box.w)
      .attr('y2', box.y + box.h)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.2)

    box.y -= 1
    // g.append('rect')
    //   .attr('id', 'headerStrip')
    //   .attr('x', 0)
    //   .attr('y', box.y)
    //   .attr('width', box.w)
    //   .attr('height', headerSize)
    //   .attr('fill', colorPalette.dark.stroke)
    // let label = [
    //   {x: box.w * 0.5, y: box.y + headerSize * 0.5 + txtSize * 0.3, text: 'Minimal < Current < Maximal', anchor: 'middle'}
    // ]
    // for (let i = 0; i < label.length; i++) {
    //   g.append('text')
    //     .text(label[i].text)
    //     .style('fill', colorPalette.medium.background)
    //     .style('font-weight', 'bold')
    //     .style('font-size', txtSize + 'px')
    //     .attr('text-anchor', label[i].anchor)
    //     .attr('transform', 'translate(' + (label[i].x) + ',' + (label[i].y) + ')')
    // }

    // box.y += 21
    // box.h -= 21
    let xx = box.w * 0.02
    let ww = box.w * 0.98
    box.h -= titleSize * 1.5
    let largeBox = {
      x: xx,
      y: 0,
      w: ww * 0.1,
      h: box.h
    }
    let mediumBox = {
      x: xx + ww * 0.13,
      y: 0,
      w: ww * 0.3,
      h: box.h
    }
    let smallBox = {
      x: xx + ww * 0.46,
      y: 0,
      w: ww * 0.54,
      h: box.h
    }
    let gt = g.append('g')
      .attr('id', 'telsDisplayer')
      .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
    com.telescopeRunningBlock = new TelescopeDisplayer({
      main: {
        tag: 'telescopeRootTag',
        g: gt,
        scroll: {},
        box: box,
        background: {
          fill: colorPalette.medium.background,
          stroke: colorPalette.medium.stroke,
          strokeWidth: 0
        },
        isSouth: false,
        colorPalette: colorPalette
      },

      displayer: 'gridBib',
      gridBib: {
        header: {
          text: {
            size: headerSize,
            color: colorPalette.medium.background
          },
          background: {
            height: headerSize + 2,
            color: colorPalette.dark.stroke
          }
        },
        telescope: {
          enabled: true,
          centering: true,
          large: {
            g: undefined,
            opt: {
              telsPerRow: 1,
              nbl: 0,
              size: 2,
              ratio: 1
            },
            box: largeBox
          },
          medium: {
            g: undefined,
            opt: {
              telsPerRow: 4,
              nbl: 0,
              size: 1,
              ratio: 1
            },
            box: mediumBox
          },
          small: {
            g: undefined,
            opt: {
              telsPerRow: 8,
              nbl: 0,
              size: 0.5,
              ratio: 1
            },
            box: smallBox
          }
        },
        idle: {
          txtSize: 0,
          enabled: true,
          background: {
            middle: {
              color: colorPalette.darker.background,
              opacity: 1
            },
            side: {
              color: colorPalette.dark.background,
              opacity: 1
            }
          }
        },
        blocks: {
          txtSize: 0,
          right: {
            enabled: false
          },
          left: {
            enabled: false
          }
        }
      },

      filters: {
        telescopeFilters: [],
        filtering: []
      },
      data: {
        raw: {
          telescopes: []
        },
        filtered: {},
        modified: []
      },
      debug: {
        enabled: false
      },
      pattern: {
        select: {}
      },
      events: {
        block: {
          click: (d) => { com.telescope.events.click('block', d.obId) },
          mouseover: (d) => {},
          mouseout: (d) => {},
          drag: {
            start: () => {},
            tick: () => {},
            end: () => {}
          }
        },
        telescope: {
          click: (d) => { com.telescope.events.click('telescope', d.id) },
          mouseover: (d) => {},
          mouseout: (d) => {},
          drag: {
            start: () => {},
            tick: () => {},
            end: () => {}
          }
        }
      },
      input: {
        over: {
          telescope: undefined
        },
        focus: {
          telescope: undefined
        }
      }
    })
    com.telescopeRunningBlock.init()

    g.append('text')
      .text(com.data.tels.large.length)
      .style('fill', colorPalette.medium.text)
      .style('font-weight', 'bold')
      .style('font-size', titleSize + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (largeBox.x + largeBox.w * 0.5) + ',' + (box.y + box.h + headerSize + titleSize * 0.33) + ')')
    g.append('text')
      .text(com.data.tels.medium.length)
      .style('fill', colorPalette.medium.text)
      .style('font-weight', 'bold')
      .style('font-size', titleSize + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (mediumBox.x + mediumBox.w * 0.5) + ',' + (box.y + box.h + headerSize + titleSize * 0.33) + ')')
    g.append('text')
      .text(com.data.tels.small.length)
      .style('fill', colorPalette.medium.text)
      .style('font-weight', 'bold')
      .style('font-size', titleSize + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (smallBox.x + smallBox.w * 0.5) + ',' + (box.y + box.h + headerSize + titleSize * 0.33) + ')')

    com.telescopeRunningBlock.updateData({
      data: {
        raw: {
          telescopes: [].concat(com.data.tels.small).concat(com.data.tels.medium).concat(com.data.tels.large),
          blocks: []// shared.data.server.blocks.run
        },
        modified: []
      }
    })
  }
}
