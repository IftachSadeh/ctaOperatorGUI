/* global d3 */
/* global blockStyle */
/* global loadScript */
/* global colorPalette */
/* global hasVar */
/* global timeD */
/* global ScrollBox */
/* global Locker */
/* global RunLoop */

loadScript({ source: 'utils_scrollTable', script: '/js/blocks/utils_blockCommon.js' })

window.SchedblockForm = function (optIn) {
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
    createSchedulingObservingBlocksTree()
    createTimeInformation()
    createPointingInformation()
  }
  this.init = init

  function update () {
    // initSchedulingObservingBlocksTree()
    // initTimeInformation()
    // initPointingInformation()
    // initTelescopeInformation()
  }
  this.update = update

  function changeBlockTime (block, type, hour, min, sec) {
    console.log('change', type);
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
        block.startTime = (endTime - startTime) / 1000
        block.endTime = block.startTime + block.duration
        break
      case 'duration':
        block.duration = Number(hour) * 3600 + Number(min) * 60 + Number(sec)
        block.endTime = block.startTime + block.duration
        console.log(block);
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
        block.endTime = (endTime - startTime) / 1000
        block.duration = block.endTime - block.startTime
        break
      default:
        return
    }

    function updateTime (id, time) {
      let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
      let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
      let sec = ('0' + d3.timeFormat('%S')(time)).slice(-2)

      let current = com.schedule.scrollBox.get('innerG')
        .selectAll('g.block')
        .data([block], function (d) {
          return d.obId
        })
      current.each(function () {
        let g = d3.select(this).select('g#' + id)
        g.select('#hour').select('input').property('value', hour)
        g.select('#minute').select('input').property('value', min)
        g.select('#second').select('input').property('value', sec)
      })
    }

    startTime = new Date(com.data.timeOfNight.date_start)
    startTime.setSeconds(startTime.getSeconds() + block.startTime)
    endTime = new Date(com.data.timeOfNight.date_start)
    endTime.setSeconds(endTime.getSeconds() + block.startTime + block.duration)
    let duration = new Date(endTime)
    duration.setHours(duration.getHours() - startTime.getHours())
    duration.setMinutes(duration.getMinutes() - startTime.getMinutes())
    duration.setSeconds(duration.getSeconds() - startTime.getSeconds())

    updateTime('startTime', startTime)
    updateTime('duration', duration)
    updateTime('endTime', endTime)
  }
  function changeState (newState) {
    com.data.block.exeState.state = newState
  }
  function changeTarget (newTarget) {
    let save = com.data.block.pointingName.split('/')[1]
    com.data.block.pointingName = newTarget + '/' + save
  }
  function changePointing (newPointing) {
    let save = com.data.block.pointingName.split('/')[0]
    com.data.block.pointingName = save + '/' + newPointing
  }

  function initScrollBox (tag, g, box, background) {
    if (background.enabled) {
      g.append('rect')
        .attr('class', 'background')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.w)
        .attr('height', box.h)
        .style('fill', background.fill)
        .style('stroke', background.stroke)
        .style('stroke-width', background.strokeWidth)
    }

    let scrollBox = new ScrollBox()
    scrollBox.init({
      tag: tag,
      gBox: g,
      boxData: {
        x: 0,
        y: 0,
        w: box.w,
        h: box.h
      },
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
      background: 'transparent',
      scrollRecH: {h: 4},
      scrollRecV: {w: 4}
    })
    return scrollBox
  }

  function createSchedulingObservingBlocksTree () {
    let schedB = com.data.schedB
    let box = com.tree.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.tree.g = g

    let dimPoly = box.h * 0.8
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
      .attr('transform', 'translate(' + (box.w * 0.0) + ',' + (box.h * 0.1) + ')')
      .on('click', function () {
        com.tree.events.click('schedBlock', schedB.blocks[0].sbId)
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
      .text('S' + schedB.blocks[0].metaData.nSched)
      .style('fill', colorPalette.dark.text)
      .style('font-weight', '')
      .style('font-size', txtSize * 1.4 + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (box.w * 0.0 + dimPoly * 0.5) + ',' + (box.h * 0.1 + dimPoly * 0.5 + txtSize * 0.3) + ')')
      .style('pointer-events', 'none')

    let height = dimPoly * 0.5
    for (let i = 0; i < schedB.blocks.length; i++) {
      let palette = blockStyle(schedB.blocks[i])
      g.append('rect')
        .attr('x', (box.w * 0.2) + ((height + 4) * i))
        .attr('y', box.h * 0.9 - height)
        .attr('width', height)
        .attr('height', height)
        .attr('fill', palette.color.background)
        .attr('stroke', palette.color.stroke)
        .attr('stroke-width', 0.2)
        .attr('stroke-dasharray', [])
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
        .attr('transform', 'translate(' + ((box.w * 0.2) + ((height + 4) * i) + height * 0.5) + ',' + (box.h * 0.9 - height * 0.5 + txtSize * 0.3) + ')')
        .style('pointer-events', 'none')
    }
  }
  function createTimeInformation () {
    let schedB = com.data.schedB
    let box = com.schedule.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.schedule.g = g

    g.append('text')
      .text('Schedule:')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', 'bold')
      .style('font-size', titleSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    g.append('line')
      .attr('x1', box.w * 0.0)
      .attr('y1', 2)
      .attr('x2', box.w * 1.0)
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
      {x: box.w * 0.0, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.09, text: 'Blocks', anchor: 'middle'},
      {x: box.w * 0.09, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.19, text: 'State', anchor: 'middle'},
      {x: box.w * 0.28, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.17, text: 'Start', anchor: 'middle'},
      {x: box.w * 0.45, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.0, text: '', anchor: 'middle'},
      {x: box.w * 0.45, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.18, text: 'End', anchor: 'middle'},
      {x: box.w * 0.63, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.36, text: 'Pointing', anchor: 'middle'}
    ]
    for (let i = 0; i < label.length; i++) {
      let off = label[i].anchor === 'middle' ? label[i].w * 0.5 : (label[i].anchor === 'end' ? label[i].w * 0.5 : 0)
      g.append('text')
        .text(label[i].text)
        .style('fill', colorPalette.medium.background)
        .style('font-weight', 'bold')
        .style('font-size', txtSize + 'px')
        .attr('text-anchor', label[i].anchor)
        .attr('transform', 'translate(' + (label[i].x + off) + ',' + (label[i].y) + ')')
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', label[i].w)
        .attr('height', box.h - headerSize - 4)
        .attr('fill', i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
        .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    }

    box.h -= headerSize + 3
    let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + (headerSize + 3) + ')')
    com.schedule.scrollBox = initScrollBox('targetRessourceScroll', blockg, box, {enabled: false})
    let innerg = com.schedule.scrollBox.get('innerG')

    let line = Math.max(Math.min(titleSize * 2, box.h / schedB.blocks.length), titleSize * 2)
    let current = innerg
      .selectAll('g.block')
      .data(schedB.blocks, function (d) {
        return d.obId
      })
    let enter = current
      .enter()
      .append('g')
      .attr('class', 'block')
    enter.each(function (d, i) {
      let palette = blockStyle(schedB.blocks[i])

      let g = d3.select(this)
      g.attr('transform', 'translate(' + (2) + ',' + (2 + (line + 2) * (i)) + ')')
      g.append('rect')
        .attr('x', -2)
        .attr('y', -1)
        .attr('width', box.w)
        .attr('height', line + 2)
        .attr('fill', '#000000')
        .attr('opacity', i % 2 === 1 ? 0 : 0.05)

      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', line)
        .attr('height', line)
        .attr('fill', palette.color.background)
        .attr('stroke', palette.color.stroke)
        .attr('stroke-width', 0.2)
        .on('click', function () {
          com.schedule.events.click('block', schedB.blocks[i].obId)
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
        .text(d.metaData.nObs)
        .style('fill', palette.color.stroke)
        .style('font-weight', '')
        .style('font-size', txtSize + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (line * 0.5) + ',' + (line * 0.5 + txtSize * 0.3) + ')')
        .style('pointer-events', 'none')

      function drawTime (id, x, w, y, time) {
        let stock = {}
        let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
        let hbox = {
          x: x,
          y: y + (com.schedule.editabled ? 0 : headerSize * 0.35),
          w: 14,
          h: headerSize * 2
        }
        let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
        let mbox = {
          x: x + 16,
          y: y + (com.schedule.editabled ? 0 : headerSize * 0.35),
          w: 14,
          h: headerSize * 2
        }
        let sec = ('0' + d3.timeFormat('%S')(time)).slice(-2)
        let sbox = {
          x: x + 32,
          y: y + (com.schedule.editabled ? 0 : headerSize * 0.35),
          w: 14,
          h: headerSize * 2
        }

        let ig = g.append('g').attr('id', id)
          .attr('transform', 'translate(' + ((w - (14 * 3)) * 0.33) + ',0)')

        stock.hour = inputDate(ig,
          hbox,
          'hour',
          {disabled: !com.schedule.editabled, value: hour, min: 0, max: 23, step: 1, 'button-disabled': false},
          {change: (e) => { changeBlockTime(d, id, e, stock.minute.property('value'), stock.second.property('value')) }, enter: (d) => { stock.minute.node().focus() }})
        ig.append('text')
          .text(':')
          .style('fill', colorPalette.dark.stroke)
          .style('font-size', headerSize + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (hbox.x + hbox.w + 0.5) + ',' + (y + headerSize * 1.1 + (com.schedule.editabled ? 0 : headerSize * 0.35)) + ')')
        stock.minute = inputDate(ig,
          mbox,
          'minute',
          {disabled: !com.schedule.editabled, value: min, min: 0, max: 60, step: 1, 'button-disabled': false},
          {change: (e) => { changeBlockTime(d, id, stock.hour.property('value'), e, stock.second.property('value')) }, enter: (d) => { stock.second.node().focus() }})
        ig.append('text')
          .text(':')
          .style('fill', colorPalette.dark.stroke)
          .style('font-size', headerSize + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (mbox.x + mbox.w + 0.5) + ',' + (y + headerSize * 1.1 + (com.schedule.editabled ? 0 : headerSize * 0.35)) + ')')
        stock.second = inputDate(ig,
          sbox,
          'second',
          {disabled: !com.schedule.editabled, value: sec, min: 0, max: 60, step: 1, 'button-disabled': false},
          {change: (e) => { changeBlockTime(d, id, stock.hour.property('value'), stock.minute.property('value'), e) }, enter: (d) => { stock.second.node().blur() }})
      }

      let startTime = new Date(com.data.timeOfNight.date_start)
      startTime.setSeconds(startTime.getSeconds() + d.startTime)
      let endTime = new Date(com.data.timeOfNight.date_start)
      endTime.setSeconds(endTime.getSeconds() + d.startTime + d.duration)
      let duration = new Date(endTime)
      duration.setHours(duration.getHours() - startTime.getHours())
      duration.setMinutes(duration.getMinutes() - startTime.getMinutes())
      duration.setSeconds(duration.getSeconds() - startTime.getSeconds())

      let sbox = {
        x: label[1].x,
        y: 0,
        w: label[1].w,
        h: headerSize * 2
      }
      dropDownDiv(g,
        sbox,
        'state',
        {disabled: !com.schedule.editabled, value: d.exeState.state, options: ['done', 'fail', 'cancel', 'wait', 'run']},
        {change: (e) => { changeState(d, e) }, enter: (e) => { changeState(d, e) }})

      drawTime('startTime', label[2].x, label[2].w, 0, startTime)
      // drawTime('duration', label[3].x, label[3].w, 0, duration)
      drawTime('endTime', label[4].x, label[4].w, 0, endTime)

      let tbox = {
        x: label[5].x,
        y: 0,
        w: label[5].w * 0.5,
        h: headerSize * 2
      }
      dropDownDiv(g,
        tbox,
        'target',
        {disabled: !com.schedule.editabled, value: d.pointingName.split('/')[0], options: ['trg_1', 'trg_2', 'trg_3', 'trg_4', 'trg_5', 'trg_6', 'trg_7']},
        {change: (e) => { changeTarget(d, e) }, enter: (e) => { changeTarget(d, e) }})
      let pbox = {
        x: label[5].x + label[5].w * 0.5,
        y: 0,
        w: label[5].w * 0.5,
        h: headerSize * 2
      }
      dropDownDiv(g,
        pbox,
        'pointing',
        {disabled: !com.schedule.editabled, value: d.pointingName.split('/')[1], options: ['p_0', 'p_1', 'p_2', 'p_3', 'p_4', 'p_5', 'p_6', 'p_7']},
        {change: (e) => { changePointing(d, e) }, enter: (e) => { changePointing(d, e) }})
    })
    let merge = current.merge(enter)
    merge.each(function (d, i) {
    })
    current
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()

    com.schedule.scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: (line + 2) * schedB.blocks.length})
    box.h += headerSize + 3
    g.append('line')
      .attr('x1', box.x)
      .attr('y1', box.h)
      .attr('x2', box.w)
      .attr('y2', box.h)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.4)
  }
  function createPointingInformation () {
    let target = com.data.target
    let schedB = com.data.schedB
    let box = com.target.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.schedule.g = g

    g.append('rect')
      .attr('id', 'headerStrip')
      .attr('x', 0)
      .attr('y', 3)
      .attr('width', box.w)
      .attr('height', headerSize)
      .attr('fill', colorPalette.dark.stroke)
    let label = [
      {x: box.w * 0.01, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.33, text: 'Target', anchor: 'start'},
      {x: box.w * 0.33, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.33, text: 'Pointing', anchor: 'start'},
      {x: box.w * 0.66, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.34, text: 'offset', anchor: 'start'}
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
        .attr('height', box.w * 0.19 - headerSize - 4)
        .attr('fill', i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
        .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    }

    g.append('text')
      .text('Pointing:')
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
      .attr('x', box.w * 0.15)
      .attr('y', 3 + box.w * 0.19)
      .attr('width', box.w * 0.7)
      .attr('height', box.w * 0.7)
      .attr('fill', colorPalette.bright.background)
      .attr('stroke', colorPalette.bright.stroke)
      .attr('stroke-width', 0.2)
    let center = {
      x: box.w * 0.15 + box.w * 0.35,
      y: 3 + box.w * 0.19 + box.w * 0.35
    }
    g.append('text')
      .text('+')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', 'bold')
      .style('font-size', txtSize * 1.4 + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + center.x + ',' + (center.y + txtSize * 0.3) + ')')
    g.append('text')
      .text('trg')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', txtSize + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + center.x + ',' + (center.y + txtSize * 1.3) + ')')

    for (let i = 0; i < schedB.blocks.length; i++) {
      let offX = (schedB.blocks[i].pointingPos[0] - target.pos[0]) * 12
      let offY = (schedB.blocks[i].pointingPos[1] - target.pos[1]) * 12
      g.append('text')
        .text('+')
        .style('fill', colorPalette.dark.stroke)
        .style('font-weight', 'bold')
        .style('font-size', txtSize * 1.4 + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (center.x + offX) + ',' + (center.y + offY + txtSize * 0.3) + ')')
      g.append('text')
        .text('ptg-' + schedB.blocks[i].metaData.nObs)
        .style('fill', colorPalette.dark.stroke)
        .style('font-weight', '')
        .style('font-size', txtSize * 0.8 + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (center.x + offX) + ',' + ((schedB.blocks[i].pointingPos[1] < target.pos[1] ? -txtSize * 1.3 : txtSize * 1.3) + center.y + offY) + ')')
    }

    g.append('text')
      .text(target.name)
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', 'bold')
      .style('font-style', '')
      .style('font-size', headerSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.01) + ',' + (box.w * 0.075) + ')')
    g.append('text')
      .text(target.pos[0])
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', txtSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.01) + ',' + ((box.w * 0.075) + txtSize * 1.6) + ')')
    g.append('text')
      .text(target.pos[1])
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', txtSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.01) + ',' + ((box.w * 0.075) + txtSize * 3.2) + ')')

    g.append('text')
      .attr('id', 'pointingName')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', 'bold')
      .style('font-style', '')
      .style('font-size', headerSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.33) + ',' + (box.w * 0.075) + ')')
    g.append('text')
      .attr('id', 'pointingPosX')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', txtSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.33) + ',' + ((box.w * 0.075) + txtSize * 1.6) + ')')
    g.append('text')
      .attr('id', 'pointingPosY')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', txtSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.33) + ',' + ((box.w * 0.075) + txtSize * 3.2) + ')')

    g.append('text')
      .attr('id', 'offsetX')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', txtSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.66) + ',' + ((box.w * 0.075) + txtSize * 1.6) + ')')
    g.append('text')
      .attr('id', 'offsetY')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', txtSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.66) + ',' + ((box.w * 0.075) + txtSize * 3.2) + ')')

    let targetData = {
      id: schedB.target.name,
      pointing: []
    }
    for (let i = 0; i < schedB.blocks.length; i++) {
      let p = {
        id: schedB.blocks[i].pointingName.split('/')[1],
        position: schedB.blocks[i].pointingPos
      }
      if (!targetData.pointing.includes(p)) targetData.pointing.push(p)
    }

    // g.append('rect')
    //   .attr('x', 0)
    //   .attr('y', box.w * 0.19 + 3)
    //   .attr('width', box.w * 0.14)
    //   .attr('height', headerSize + 4)
    //   .attr('fill', colorPalette.dark.background)
    //   .attr('stroke', colorPalette.dark.stroke)
    //   .attr('stroke-width', 0.1)
    //   .on('click', function () {
    //     focusManager.focusOn('target', target.id)
    //   })
    //   .on('mouseover', function (d) {
    //     d3.select(this).style('cursor', 'pointer')
    //     d3.select(this).attr('fill', colorPalette.darker.background)
    //   })
    //   .on('mouseout', function (d) {
    //     d3.select(this).style('cursor', 'default')
    //     d3.select(this).attr('fill', colorPalette.dark.background)
    //   })
    // g.append('text')
    //   .text(targetData.id)
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', headerSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + 2 + ',' + (3 + box.w * 0.19 + headerSize * 1) + ')')
    //   .style('pointer-events', 'none')
    // g.append('rect')
    //   .attr('x', headerSize * 5)
    //   .attr('y', box.w * 0.075 - headerSize)
    //   .attr('width', headerSize * 2)
    //   .attr('height', headerSize * 2)
    //   .attr('fill', colorPalette.dark.background)
    //   .attr('stroke', colorPalette.medium.stroke)
    //   .attr('stroke-width', 0.2)
    //   // .style('boxShadow', '10px 20px 30px black')
    //   .attr('rx', 0)
    //   .on('click', function () {
    //     focusManager.focusOn('target', target.id)
    //   })
    //   .on('mouseover', function (d) {
    //     d3.select(this).style('cursor', 'pointer')
    //     d3.select(this).attr('fill', colorPalette.darker.background)
    //   })
    //   .on('mouseout', function (d) {
    //     d3.select(this).style('cursor', 'default')
    //     d3.select(this).attr('fill', colorPalette.dark.background)
    //   })

    let height = box.w * 0.09
    g.append('rect')
      .attr('x', box.w * 0.01)
      .attr('y', box.w * 0.19 + 3)
      .attr('width', height)
      .attr('height', height)
      .attr('fill', colorPalette.dark.background)
      .attr('stroke', colorPalette.medium.stroke)
      .attr('stroke-width', 0.6)
      // .style('boxShadow', '10px 20px 30px black')
      .attr('rx', height)
      .on('click', function () {
        com.target.events.click('target', targetData.id)
      })
      .on('mouseover', function (d) {
        d3.select(this).style('cursor', 'pointer')
        d3.select(this).attr('fill', colorPalette.darker.background)
      })
      .on('mouseout', function (d) {
        d3.select(this).style('cursor', 'default')
        d3.select(this).attr('fill', colorPalette.dark.background)
      })
    g.append('svg:image')
      .attr('xlink:href', '/static/icons/round-target.svg')
      .attr('width', height * 1)
      .attr('height', height * 1)
      .attr('x', box.w * 0.01)
      .attr('y', box.w * 0.19 + 3)
      .style('opacity', 0.5)
      .style('pointer-events', 'none')
    g.append('text')
      .text('T' + targetData.id.split('/')[0].split('_')[1])
      .attr('x', box.w * 0.01 + height * 0.5)
      .attr('y', box.w * 0.19 + 3 + height * 0.5 + txtSize * 0.3)
      .style('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .style('font-size', headerSize + 'px')
      .attr('dy', 0)
      .style('pointer-events', 'none')
      .attr('fill', colorPalette.dark.text)
      .attr('stroke', 'none')

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 3 + box.w * 0.19 + height + 4)
      .attr('x2', box.w * 0.14)
      .attr('y2', 3 + box.w * 0.19 + height + 4)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.2)

    let offsetY = 3 + box.w * 0.19 + height + 6
    let current = g
      .selectAll('g.pointing')
      .data(targetData.pointing, function (d) {
        return d.id
      })
    let enter = current
      .enter()
      .append('g')
      .attr('class', 'pointing')
    enter.each(function (d, i) {
      let ig = d3.select(this)
      ig.attr('transform', 'translate(' + (headerSize * 3) + ',' + (offsetY + titleSize * 2 * i) + ')')

      ig.append('rect')
        .attr('x', -box.w * 0.025)
        .attr('y', 0)
        .attr('width', headerSize * 2)
        .attr('height', headerSize * 2)
        .attr('fill', colorPalette.dark.background)
        .attr('stroke', colorPalette.medium.stroke)
        .attr('stroke-width', 0.6)
        // .style('boxShadow', '10px 20px 30px black')
        .attr('rx', 0)
        .on('click', function () {
          com.target.events.click('target', targetData.id)
        })
        .on('mouseover', function () {
          g.select('text#pointingName').text(d.id)
          g.select('text#pointingPosX').text(d.position[0])
          g.select('text#pointingPosY').text(d.position[1])

          g.select('text#offsetX').text(d.position[0] - target.pos[0])
          g.select('text#offsetY').text(d.position[1] - target.pos[1])
          d3.select(this).style('cursor', 'pointer')
          d3.select(this).attr('fill', colorPalette.darker.background)
        })
        .on('mouseout', function () {
          d3.select(this).style('cursor', 'default')
          d3.select(this).attr('fill', colorPalette.dark.background)
        })
      ig.append('svg:image')
        .attr('xlink:href', '/static/icons/square-target.svg')
        .attr('width', headerSize * 2)
        .attr('height', headerSize * 2)
        .attr('x', -box.w * 0.025)
        .attr('y', 0)
        .style('opacity', 0.5)
        .style('pointer-events', 'none')
      ig.append('text')
        .text('P' + d.id.split('_')[1])
        .attr('x', -box.w * 0.025 + headerSize * 2 * 0.5)
        .attr('y', 0 + headerSize * 2 * 0.5 + txtSize * 0.3)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', headerSize + 'px')
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', colorPalette.dark.text)
        .attr('stroke', 'none')
    })
    let merge = current.merge(enter)
    merge.each(function (d, i) {
    })
    current
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()

    // g.append('text')
    //   .text('Pointing:')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', 'bold')
    //   .style('font-style', '')
    //   .style('font-size', headerSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.33) + ',' + (box.w * 0.075) + ')')
  }

  function inputDate (g, box, id, optIn, events) {
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
  function dropDownDiv (g, box, id, optIn, events) {
    let fo = g.append('foreignObject')
      .attr('width', box.w + 'px')
      .attr('height', box.h + 'px')
      .attr('x', box.x + 'px')
      .attr('y', box.y + 'px')
    let rootDiv = fo.append('xhtml:div')
      .attr('id', id)
      .attr('class', 'dropdown')
      .style('color', '#000000')
    if (optIn.disabled) {
      rootDiv.html(optIn.value)
      return
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
    // if (!d.editable) selector.attr('disabled', true)
  }
}
