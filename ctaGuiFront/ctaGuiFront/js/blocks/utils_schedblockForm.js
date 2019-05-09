/* global d3 */
/* global blockStyle */
/* global loadScript */
/* global colorPalette */
/* global hasVar */
/* global timeD */
/* global ScrollBox */
/* global Locker */
/* global RunLoop */
/* global targetIcon */
/* global pointingIcon */

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
    g.selectAll('polygon.new')
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

    dimPoly = box.h * 0.5
    poly = [
      {x: dimPoly * 0.3, y: dimPoly * 0.0},
      {x: dimPoly * 0.7, y: dimPoly * 0.0},

      {x: dimPoly * 1, y: dimPoly * 0.3},
      {x: dimPoly * 1, y: dimPoly * 0.7},

      {x: dimPoly * 0.7, y: dimPoly * 1},
      {x: dimPoly * 0.3, y: dimPoly * 1},

      {x: dimPoly * 0.0, y: dimPoly * 0.7},
      {x: dimPoly * 0.0, y: dimPoly * 0.3}
    ]
    g.selectAll('polygon.new')
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
      .attr('stroke-width', 2)
      .attr('transform', 'translate(' + (box.w * 0.5 - dimPoly * 0.5) + ',' + (box.h * 0.5 - dimPoly) + ')')
      .on('click', function () {
        // com.tree.events.click('schedBlock', data.sbId)
      })
      .on('mouseover', function (d) {
        // d3.select(this).style('cursor', 'pointer')
        // d3.select(this).attr('fill', colorPalette.darker.background)
      })
      .on('mouseout', function (d) {
        // d3.select(this).style('cursor', 'default')
        // d3.select(this).attr('fill', colorPalette.dark.background)
      })
    g.append('text')
      .text('S' + schedB.blocks[0].metaData.nSched)
      .style('fill', colorPalette.dark.text)
      .style('font-weight', '')
      .style('font-size', txtSize * 1.2 + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (box.w * 0.5) + ',' + (box.h * 0.5 - dimPoly * 0.5 + txtSize * 0.4) + ')')
      .style('pointer-events', 'none')

    for (let i = 0; i < schedB.blocks.length; i++) {
      let palette = blockStyle(schedB.blocks[i])
      g.append('rect')
        .attr('x', 2 + (box.w * 0.5 - (schedB.blocks.length * dimPoly) * 0.5) + (dimPoly * i))
        .attr('y', box.h * 0.9 - dimPoly * 0.7)
        .attr('width', dimPoly * 0.8)
        .attr('height', dimPoly * 0.8)
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
        .attr('transform', 'translate(' + (2 + (box.w * 0.5 - (schedB.blocks.length * dimPoly) * 0.5) + (dimPoly * i) + (dimPoly * 0.4)) + ',' + (box.h * 0.9 - dimPoly * 0.3 + txtSize * 0.3) + ')')
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
      {x: box.w * 0.0, y: 0 + headerSize * 0.5 + titleSize * 0.6, w: box.w * 0.1, text: 'Blocks', anchor: 'middle'},
      {x: box.w * 0.1, y: 0 + headerSize * 0.5 + titleSize * 0.6, w: box.w * 0.2, text: 'State', anchor: 'middle'},
      {x: box.w * 0.3, y: 0 + headerSize * 0.5 + titleSize * 0.6, w: box.w * 0.233, text: 'Start', anchor: 'middle'},
      {x: box.w * 0.533, y: 0 + headerSize * 0.5 + titleSize * 0.6, w: box.w * 0.233, text: 'Duration', anchor: 'middle'},
      {x: box.w * 0.766, y: 0 + headerSize * 0.5 + titleSize * 0.6, w: box.w * 0.233, text: 'End', anchor: 'middle'}
      // {x: box.w * 0.63, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.36, text: 'Pointing', anchor: 'middle'}
    ]

    box.h -= headerSize + 3
    let line = Math.max(Math.min(titleSize * 2, box.h / schedB.blocks.length), titleSize * 2)
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
        .attr('height', Math.min(box.h, (line + 2) * schedB.blocks.length))
        .attr('fill', i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.05)
        .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    }

    let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + (headerSize + 3) + ')')
    com.schedule.scrollBox = initScrollBox('targetRessourceScroll', blockg, box, {enabled: false})
    let innerg = com.schedule.scrollBox.get('innerG')
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
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.05)
        .attr('fill-opacity', i % 2 === 0 ? 0 : 0)

      g.append('rect')
        .attr('x', (label[0].w - line * 0.8) * 0.5 - 2)
        .attr('y', line * 0.1)
        .attr('width', line * 0.8)
        .attr('height', line * 0.8)
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
        .attr('transform', 'translate(' + (label[0].w * 0.5 - 2) + ',' + (line * 0.5 + txtSize * 0.3) + ')')
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
      startTime.setSeconds(startTime.getSeconds() + d.time.start)
      let endTime = new Date(com.data.timeOfNight.date_start)
      endTime.setSeconds(endTime.getSeconds() + d.time.start + d.time.duration)
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
      drawTime('duration', label[3].x, label[3].w, 0, duration)
      drawTime('endTime', label[4].x, label[4].w, 0, endTime)

      // let tbox = {
      //   x: label[5].x,
      //   y: 0,
      //   w: label[5].w * 0.5,
      //   h: headerSize * 2
      // }
      // dropDownDiv(g,
      //   tbox,
      //   'target',
      //   {disabled: !com.schedule.editabled, value: d.pointingName.split('/')[0], options: ['trg_1', 'trg_2', 'trg_3', 'trg_4', 'trg_5', 'trg_6', 'trg_7']},
      //   {change: (e) => { changeTarget(d, e) }, enter: (e) => { changeTarget(d, e) }})
      // let pbox = {
      //   x: label[5].x + label[5].w * 0.5,
      //   y: 0,
      //   w: label[5].w * 0.5,
      //   h: headerSize * 2
      // }
      // dropDownDiv(g,
      //   pbox,
      //   'pointing',
      //   {disabled: !com.schedule.editabled, value: d.pointingName.split('/')[1], options: ['p_0', 'p_1', 'p_2', 'p_3', 'p_4', 'p_5', 'p_6', 'p_7']},
      //   {change: (e) => { changePointing(d, e) }, enter: (e) => { changePointing(d, e) }})
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

    // if (box.h - headerSize - 3 > (line + 2) * schedB.blocks.length) return
    g.append('line')
      .attr('x1', box.x)
      .attr('y1', Math.min(box.h, headerSize + 4 + (line + 2) * schedB.blocks.length))
      .attr('x2', box.w)
      .attr('y2', Math.min(box.h, headerSize + 4 + (line + 2) * schedB.blocks.length))
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.4)
  }
  function createPointingInformation () {
    // let target = com.data.target
    let schedB = com.data.schedB
    let box = com.target.box
    let line = 20
    let spaceBlock = ((box.w * 0.85) - (schedB.blocks.length * line)) / (schedB.blocks.length)
    let tbox = {x: 0, y: headerSize + 4 + line, w: box.w, h: box.h * 0.45 - headerSize - 4 - line}
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.schedule.g = g

    g.append('text')
      .text('Targets:')
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
      .attr('x', 0)
      .attr('y', 3)
      .attr('width', tbox.w)
      .attr('height', headerSize)
      .attr('fill', colorPalette.dark.stroke)
    let label = [
      {x: box.w * 0.0, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.15, text: 'Target', anchor: 'middle'},
      {x: box.w * 0.15, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.85, text: 'Blocks & Pointings', anchor: 'middle'}
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
      // g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', label[i].w)
      //   .attr('height', tbox.h + line)
      //   .attr('fill', i % 2 === 1 ? colorPalette.dark.background : colorPalette.darker.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.05)
      //   .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    }

    let pntsPos = {}
    function blockCore (blocks, g, offset) {
      let current = g
        .selectAll('g.block')
        .data(blocks, function (d) {
          return d.obId
        })
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'block')
      enter.each(function (d, i) {
        let g = d3.select(this)
        let palette = blockStyle(d)
        g.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', line * 1)
          .attr('height', line * 1)
          .attr('fill', palette.color.background)
          .attr('stroke', palette.color.stroke)
          .attr('stroke-width', 0.1)
          .on('click', function () {
            com.tree.events.click('block', d.obId)
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
          .style('fill', '#000000')
          .style('font-weight', 'bold')
          .style('font-size', headerSize + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (line * 0.5) + ',' + (line * 0.5 + txtSize * 0.3) + ')')
          .style('pointer-events', 'none')
      })
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        pntsPos[d.obId] = (box.w * 0.15 + (spaceBlock + line) * i)
        g.attr('transform', 'translate(' + (box.w * 0.15 + spaceBlock * 0.5 + (spaceBlock + line) * i) + ',' + (offset) + ')')
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
      // offsetY += line * 1
    }
    blockCore(schedB.blocks, g, headerSize + 5)

    let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + tbox.y + ')')
    let scrollBox = initScrollBox('targetListScroll', blockg, tbox, {enabled: false})
    let innerg = scrollBox.get('innerG')

    let trgtPnt = []
    for (let j = 0; j < schedB.blocks.length; j++) {
      let data = schedB.blocks[j]
      for (let i = 0; i < data.pointings.length; i++) {
        let tar = trgtPnt.find(t => t.name === data.pointings[i].name.split('/')[0])
        if (tar) {
          if (!(data.obId in tar.pointings)) tar.pointings[data.obId] = []
          tar.pointings[data.obId].push(data.pointings[i])
        } else {
          tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
          // allTar.push(tar)
          tar.pointings = {}
          tar.pointings[data.obId] = [data.pointings[i]]
          trgtPnt.push(tar)
        }
        // allPoint.push(data.pointings[i])
      }
    }

    let marg = line * 0.2
    let interOffset = 0
    let scrollHeight = 0

    let squareTemplate = {
      '1': [{x: 0.5, y: 0.5}],
      '2': [{x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}],
      '3': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.7}],
      '4': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
      '5': [{x: 0.3, y: 0.16}, {x: 0.7, y: 0.16}, {x: 0.5, y: 0.5}, {x: 0.3, y: 0.84}, {x: 0.7, y: 0.84}],
      '6': [],
      '7': [],
      '8': [],
      '9': []
    }
    function pointingCore (pointings, pg, x, y, w, h) {
      pg.attr('transform', 'translate(' + x + ',' + y + ')')
      pg.append('rect')
        .attr('x', 4)
        .attr('y', 4)
        .attr('width', w - 8)
        .attr('height', h - 8)
        .attr('fill', colorPalette.darker.background)
        .attr('stroke', colorPalette.darker.stroke)
        .attr('stroke-width', 0.2)
      let psize = {
        w: Math.min(w / 3, 25),
        h: Math.min(h / 3, 20)
      }
      let current = pg
        .selectAll('g.pointing')
        .data(pointings, function (d) {
          return d.id
        })
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'pointing')
      enter.each(function (d, i) {
        let g = d3.select(this)
        let pevents = {
          click: function () {},
          over: function () {},
          out: function () {}
        }
        pointingIcon(g, {w: psize.w, h: psize.h}, '' + d.name.split('/')[1].split('_')[1], pevents, colorPalette)
        scrollHeight += (marg + line * 0.9)
        // g.append('rect')
        //   .attr('x', 0)
        //   .attr('y', 0)
        //   .attr('width', w)
        //   .attr('height', h)
        //   .attr('fill', '#888888')
      })
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        let pos = squareTemplate[pointings.length][i]
        g.attr('transform', 'translate(' + ((pos.x * w) - (psize.w * 0.5)) + ',' + ((pos.y * h) - (psize.h * 0.5)) + ')')
        interOffset += marg + line * 0.9
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
      // offsetY += line * 1
    }
    function targetCore (targets, g, offset) {
      let space = ((tbox.h * 1) - (targets.length * line)) / (targets.length)
      let current = g
        .selectAll('g.target')
        .data(targets, function (d) {
          return d.id
        })
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'target')
      enter.each(function (d, i) {
        let g = d3.select(this)
        let tevents = {
          click: function () { com.target.events.click('target', d.id) },
          over: function () {

          },
          out: function () {}
        }
        targetIcon(g, {w: line * 1.1, h: line * 1.1}, '' + d.name.split('_')[1], tevents, colorPalette)
        scrollHeight += marg + line + 4
      })
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        let offX = (label[0].x + label[0].w * 0.5 - line * 0.5)
        g.attr('transform', 'translate(' + offX + ',' + (space * 0.5 + (space + line) * i) + ')')
        // innerOffset += line
        for (var key in d.pointings) {
          pointingCore(d.pointings[key], g.append('g').attr('id', 'pointings' + key), pntsPos[key] - offX, -space * 0.5, spaceBlock + line, space + line)
        }
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    targetCore(trgtPnt, innerg, 0)

    // g.append('rect')
    //   .attr('x', box.w * 0.15)
    //   .attr('y', 3 + box.w * 0.19)
    //   .attr('width', box.w * 0.7)
    //   .attr('height', box.w * 0.7)
    //   .attr('fill', colorPalette.bright.background)
    //   .attr('stroke', colorPalette.bright.stroke)
    //   .attr('stroke-width', 0.2)
    // let center = {
    //   x: box.w * 0.15 + box.w * 0.35,
    //   y: 3 + box.w * 0.19 + box.w * 0.35
    // }
    // g.append('text')
    //   .text('+')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', 'bold')
    //   .style('font-size', txtSize * 1.4 + 'px')
    //   .attr('text-anchor', 'middle')
    //   .attr('transform', 'translate(' + center.x + ',' + (center.y + txtSize * 0.3) + ')')
    // g.append('text')
    //   .text('trg')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'middle')
    //   .attr('transform', 'translate(' + center.x + ',' + (center.y + txtSize * 1.3) + ')')
    //
    // for (let i = 0; i < schedB.blocks.length; i++) {
    //   let offX = (schedB.blocks[i].pointingPos[0] - target.pos[0]) * 12
    //   let offY = (schedB.blocks[i].pointingPos[1] - target.pos[1]) * 12
    //   g.append('text')
    //     .text('+')
    //     .style('fill', colorPalette.dark.stroke)
    //     .style('font-weight', 'bold')
    //     .style('font-size', txtSize * 1.4 + 'px')
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', 'translate(' + (center.x + offX) + ',' + (center.y + offY + txtSize * 0.3) + ')')
    //   g.append('text')
    //     .text('ptg-' + schedB.blocks[i].metaData.nObs)
    //     .style('fill', colorPalette.dark.stroke)
    //     .style('font-weight', '')
    //     .style('font-size', txtSize * 0.8 + 'px')
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', 'translate(' + (center.x + offX) + ',' + ((schedB.blocks[i].pointingPos[1] < target.pos[1] ? -txtSize * 1.3 : txtSize * 1.3) + center.y + offY) + ')')
    // }

    // g.append('text')
    //   .attr('id', 'targetName')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', 'bold')
    //   .style('font-style', '')
    //   .style('font-size', headerSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.01) + ',' + (box.w * 0.075) + ')')
    // g.append('text')
    //   .attr('id', 'targetPosX')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.01) + ',' + ((box.w * 0.075) + txtSize * 1.6) + ')')
    // g.append('text')
    //   .attr('id', 'targetPosY')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.01) + ',' + ((box.w * 0.075) + txtSize * 3.2) + ')')
    //
    // g.append('text')
    //   .attr('id', 'pointingName')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', 'bold')
    //   .style('font-style', '')
    //   .style('font-size', headerSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.33) + ',' + (box.w * 0.075) + ')')
    // g.append('text')
    //   .attr('id', 'pointingPosX')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.33) + ',' + ((box.w * 0.075) + txtSize * 1.6) + ')')
    // g.append('text')
    //   .attr('id', 'pointingPosY')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.33) + ',' + ((box.w * 0.075) + txtSize * 3.2) + ')')
    //
    // g.append('text')
    //   .attr('id', 'offsetX')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.66) + ',' + ((box.w * 0.075) + txtSize * 1.6) + ')')
    // g.append('text')
    //   .attr('id', 'offsetY')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.66) + ',' + ((box.w * 0.075) + txtSize * 3.2) + ')')

    // g.append('rect')
    //   .attr('id', 'headerStrip')
    //   .attr('x', 0)
    //   .attr('y', headerSize * 6)
    //   .attr('width', box.w * 0.14)
    //   .attr('height', headerSize)
    //   .attr('fill', colorPalette.dark.stroke)
    // g.append('text')
    //   .text('Link list')
    //   .style('fill', colorPalette.medium.background)
    //   .style('font-weight', 'bold')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'middle')
    //   .attr('transform', 'translate(' + (box.w * 0.14 * 0.5) + ',' + (headerSize * 6.5 + txtSize * 0.33) + ')')

    // let tbox = {x: 0, y: headerSize * 6 + headerSize, w: box.w * 0.14, h: box.h - headerSize * 7.5}
    // let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + tbox.y + ')')
    // let scrollBox = initScrollBox('targetListScroll', blockg, tbox, {enabled: false})
    // let innerg = scrollBox.get('innerG')
    //
    // let trgtPnt = []
    // let allTar = []
    // let allPoint = []
    // for (let j = 0; j < schedB.blocks.length; j++) {
    //   let data = schedB.blocks[j]
    //   for (let i = 0; i < data.pointings.length; i++) {
    //     let tar = trgtPnt.find(t => t.name === data.pointings[i].name.split('/')[0])
    //     if (tar) {
    //       tar.pointings.push(data.pointings[i])
    //     } else {
    //       tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
    //       allTar.push(tar)
    //       tar.pointings = [data.pointings[i]]
    //       trgtPnt.push(tar)
    //     }
    //     allPoint.push(data.pointings[i])
    //   }
    // }
    //
    // let line = 20
    // let marg = line * 0.2
    // let interOffset = 0
    // let scrollHeight = headerSize * 0.2
    // function pointingCore (pointings, pg, offset) {
    //   let current = pg
    //     .selectAll('g.pointing')
    //     .data(pointings, function (d) {
    //       return d.id
    //     })
    //   let enter = current
    //     .enter()
    //     .append('g')
    //     .attr('class', 'pointing')
    //   enter.each(function (d, i) {
    //     let g = d3.select(this)
    //     let pevents = {
    //       click: function () { com.target.events.click('target', d.targetId) },
    //       over: function () {
    //         com.schedule.g.select('text#targetName').text(pg.data()[0].name)
    //         com.schedule.g.select('text#targetPosX').text(pg.data()[0].pos[0])
    //         com.schedule.g.select('text#targetPosY').text(pg.data()[0].pos[1])
    //
    //         com.schedule.g.select('text#pointingName').text(d.name)
    //         com.schedule.g.select('text#pointingPosX').text(d.pos[0])
    //         com.schedule.g.select('text#pointingPosY').text(d.pos[1])
    //
    //         com.schedule.g.select('text#offsetX').text(d.pos[0] - pg.data()[0].pos[0])
    //         com.schedule.g.select('text#offsetY').text(d.pos[1] - pg.data()[0].pos[1])
    //       },
    //       out: function () {}
    //     }
    //     pointingIcon(g, {w: line * 1.4, h: line * 0.9}, 'P' + d.name.split('/')[1].split('_')[1], pevents, colorPalette)
    //     scrollHeight += (marg + line * 0.9)
    //   })
    //   let merge = current.merge(enter)
    //   merge.each(function (d, i) {
    //     let g = d3.select(this)
    //     g.attr('transform', 'translate(' + (line * 0.4) + ',' + (offset + (marg + line * 0.9) * i) + ')')
    //     interOffset += marg + line * 0.9
    //   })
    //   current
    //     .exit()
    //     .transition('inOut')
    //     .duration(timeD.animArc)
    //     .style('opacity', 0)
    //     .remove()
    //   // offsetY += line * 1
    // }
    // function targetCore (targets, g, offset) {
    //   let current = g
    //     .selectAll('g.target')
    //     .data(targets, function (d) {
    //       return d.id
    //     })
    //   let enter = current
    //     .enter()
    //     .append('g')
    //     .attr('class', 'target')
    //   enter.each(function (d, i) {
    //     let g = d3.select(this)
    //     let tevents = {
    //       click: function () { com.target.events.click('target', d.id) },
    //       over: function () {
    //         com.schedule.g.select('text#targetName').text(d.name)
    //         com.schedule.g.select('text#targetPosX').text(d.pos[0])
    //         com.schedule.g.select('text#targetPosY').text(d.pos[1])
    //         if (com.schedule.g.select('text#pointingName').text().includes(d.name)) return
    //         com.schedule.g.select('text#pointingName').text('')
    //         com.schedule.g.select('text#pointingPosX').text('')
    //         com.schedule.g.select('text#pointingPosY').text('')
    //
    //         com.schedule.g.select('text#offsetX').text('')
    //         com.schedule.g.select('text#offsetY').text('')
    //       },
    //       out: function () {}
    //     }
    //     targetIcon(g, {w: line * 1.1, h: line * 1.1}, 'T' + d.name.split('_')[1], tevents, colorPalette)
    //     scrollHeight += marg + line + 4
    //   })
    //   let merge = current.merge(enter)
    //   merge.each(function (d, i) {
    //     let g = d3.select(this)
    //     g.attr('transform', 'translate(' + (label[0].x + line * 0.0) + ',' + (offset + interOffset + (marg + line + 4) * i) + ')')
    //     // innerOffset += line
    //     pointingCore(d.pointings, g, line * 1.1 + marg)
    //   })
    //   current
    //     .exit()
    //     .transition('inOut')
    //     .duration(timeD.animArc)
    //     .style('opacity', 0)
    //     .remove()
    // }
    // targetCore(trgtPnt, innerg, headerSize * 0.2)
    //
    // g.append('line')
    //   .attr('x1', 0)
    //   .attr('y1', box.h - headerSize * 0.5)
    //   .attr('x2', box.w * 0.14)
    //   .attr('y2', box.h - headerSize * 0.5)
    //   .attr('stroke', colorPalette.dark.stroke)
    //   .attr('stroke-width', 0.4)
    //   .style('opacity', scrollHeight > tbox.h ? 1 : 0)
    // scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: scrollHeight})
    //
    // let gt = g.append('g')
    //   .attr('id', 'telsDisplayer')
    //   .attr('transform', 'translate(' + (box.w * 0.15) + ',' + (headerSize * 6) + ')')
    // com.targetBlock = new TargetDisplayer({
    //   main: {
    //     tag: 'targetRootTag',
    //     g: gt,
    //     scroll: {},
    //     box: {x: 0, y: 0, w: box.w * 0.7, h: box.h - headerSize * 6.5, marg: 0},
    //     background: {
    //       fill: colorPalette.brighter.background,
    //       stroke: colorPalette.brighter.stroke,
    //       strokeWidth: 0.5
    //     }
    //   },
    //
    //   displayer: 'defaultBib',
    //   defaultBib: {
    //     quickmap: {
    //       enabled: false,
    //       target: {
    //         events: {
    //           click: () => {},
    //           over: () => {},
    //           out: () => {}
    //         }
    //       },
    //       pointing: {
    //         events: {
    //           click: () => {},
    //           over: () => {},
    //           out: () => {}
    //         }
    //       }
    //     },
    //     skymap: {
    //       enabled: true,
    //       g: undefined,
    //       box: {x: 0, y: 0, w: box.w * 0.7, h: box.h - headerSize * 6.5, marg: 0},
    //       mainTarget: undefined
    //     },
    //     legend: {
    //       enabled: false
    //     }
    //   },
    //
    //   filters: {
    //     targetFilters: [],
    //     filtering: []
    //   },
    //   data: {
    //     raw: {
    //       targets: []
    //     },
    //     filtered: {},
    //     modified: []
    //   },
    //   debug: {
    //     enabled: false
    //   },
    //   pattern: {
    //     select: {}
    //   },
    //   input: {
    //     over: {
    //       target: undefined
    //     },
    //     focus: {
    //       target: undefined
    //     }
    //   }
    // })
    // com.targetBlock.init()
    // com.targetBlock.updateData({
    //   data: {
    //     raw: {
    //       targets: allTar,
    //       pointings: allPoint
    //     },
    //     modified: []
    //   }
    // })

    // let targetData = {
    //   id: schedB.target.name,
    //   pointing: []
    // }
    // for (let i = 0; i < schedB.blocks.length; i++) {
    //   let p = {
    //     id: schedB.blocks[i].pointingName.split('/')[1],
    //     position: schedB.blocks[i].pointingPos
    //   }
    //   if (!targetData.pointing.includes(p)) targetData.pointing.push(p)
    // }
    //
    // // g.append('rect')
    // //   .attr('x', 0)
    // //   .attr('y', box.w * 0.19 + 3)
    // //   .attr('width', box.w * 0.14)
    // //   .attr('height', headerSize + 4)
    // //   .attr('fill', colorPalette.dark.background)
    // //   .attr('stroke', colorPalette.dark.stroke)
    // //   .attr('stroke-width', 0.05)
    // //   .on('click', function () {
    // //     focusManager.focusOn('target', target.id)
    // //   })
    // //   .on('mouseover', function (d) {
    // //     d3.select(this).style('cursor', 'pointer')
    // //     d3.select(this).attr('fill', colorPalette.darker.background)
    // //   })
    // //   .on('mouseout', function (d) {
    // //     d3.select(this).style('cursor', 'default')
    // //     d3.select(this).attr('fill', colorPalette.dark.background)
    // //   })
    // // g.append('text')
    // //   .text(targetData.id)
    // //   .style('fill', colorPalette.dark.stroke)
    // //   .style('font-weight', '')
    // //   .style('font-size', headerSize + 'px')
    // //   .attr('text-anchor', 'start')
    // //   .attr('transform', 'translate(' + 2 + ',' + (3 + box.w * 0.19 + headerSize * 1) + ')')
    // //   .style('pointer-events', 'none')
    // // g.append('rect')
    // //   .attr('x', headerSize * 5)
    // //   .attr('y', box.w * 0.075 - headerSize)
    // //   .attr('width', headerSize * 2)
    // //   .attr('height', headerSize * 2)
    // //   .attr('fill', colorPalette.dark.background)
    // //   .attr('stroke', colorPalette.medium.stroke)
    // //   .attr('stroke-width', 0.2)
    // //   // .style('boxShadow', '10px 20px 30px black')
    // //   .attr('rx', 0)
    // //   .on('click', function () {
    // //     focusManager.focusOn('target', target.id)
    // //   })
    // //   .on('mouseover', function (d) {
    // //     d3.select(this).style('cursor', 'pointer')
    // //     d3.select(this).attr('fill', colorPalette.darker.background)
    // //   })
    // //   .on('mouseout', function (d) {
    // //     d3.select(this).style('cursor', 'default')
    // //     d3.select(this).attr('fill', colorPalette.dark.background)
    // //   })
    //
    // let height = box.w * 0.09
    // g.append('rect')
    //   .attr('x', box.w * 0.01)
    //   .attr('y', box.w * 0.19 + 3)
    //   .attr('width', height)
    //   .attr('height', height)
    //   .attr('fill', colorPalette.dark.background)
    //   .attr('stroke', colorPalette.medium.stroke)
    //   .attr('stroke-width', 0.6)
    //   // .style('boxShadow', '10px 20px 30px black')
    //   .attr('rx', height)
    //   .on('click', function () {
    //     com.target.events.click('target', targetData.id)
    //   })
    //   .on('mouseover', function (d) {
    //     d3.select(this).style('cursor', 'pointer')
    //     d3.select(this).attr('fill', colorPalette.darker.background)
    //   })
    //   .on('mouseout', function (d) {
    //     d3.select(this).style('cursor', 'default')
    //     d3.select(this).attr('fill', colorPalette.dark.background)
    //   })
    // g.append('svg:image')
    //   .attr('xlink:href', '/static/icons/round-target.svg')
    //   .attr('width', height * 1)
    //   .attr('height', height * 1)
    //   .attr('x', box.w * 0.01)
    //   .attr('y', box.w * 0.19 + 3)
    //   .style('opacity', 0.5)
    //   .style('pointer-events', 'none')
    // g.append('text')
    //   .text('T' + targetData.id.split('/')[0].split('_')[1])
    //   .attr('x', box.w * 0.01 + height * 0.5)
    //   .attr('y', box.w * 0.19 + 3 + height * 0.5 + txtSize * 0.3)
    //   .style('font-weight', 'bold')
    //   .attr('text-anchor', 'middle')
    //   .style('font-size', headerSize + 'px')
    //   .attr('dy', 0)
    //   .style('pointer-events', 'none')
    //   .attr('fill', colorPalette.dark.text)
    //   .attr('stroke', 'none')
    //
    // g.append('line')
    //   .attr('x1', 0)
    //   .attr('y1', 3 + box.w * 0.19 + height + 4)
    //   .attr('x2', box.w * 0.14)
    //   .attr('y2', 3 + box.w * 0.19 + height + 4)
    //   .attr('stroke', colorPalette.dark.stroke)
    //   .attr('stroke-width', 0.2)
    //
    // let offsetY = 3 + box.w * 0.19 + height + 6
    // let current = g
    //   .selectAll('g.pointing')
    //   .data(targetData.pointing, function (d) {
    //     return d.id
    //   })
    // let enter = current
    //   .enter()
    //   .append('g')
    //   .attr('class', 'pointing')
    // enter.each(function (d, i) {
    //   let ig = d3.select(this)
    //   ig.attr('transform', 'translate(' + (headerSize * 3) + ',' + (offsetY + titleSize * 2 * i) + ')')
    //
    //   ig.append('rect')
    //     .attr('x', -box.w * 0.025)
    //     .attr('y', 0)
    //     .attr('width', headerSize * 2)
    //     .attr('height', headerSize * 2)
    //     .attr('fill', colorPalette.dark.background)
    //     .attr('stroke', colorPalette.medium.stroke)
    //     .attr('stroke-width', 0.6)
    //     // .style('boxShadow', '10px 20px 30px black')
    //     .attr('rx', 0)
    //     .on('click', function () {
    //       com.target.events.click('target', targetData.id)
    //     })
    //     .on('mouseover', function () {
    //       g.select('text#pointingName').text(d.id)
    //       g.select('text#pointingPosX').text(d.position[0])
    //       g.select('text#pointingPosY').text(d.position[1])
    //
    //       g.select('text#offsetX').text(d.position[0] - target.pos[0])
    //       g.select('text#offsetY').text(d.position[1] - target.pos[1])
    //       d3.select(this).style('cursor', 'pointer')
    //       d3.select(this).attr('fill', colorPalette.darker.background)
    //     })
    //     .on('mouseout', function () {
    //       d3.select(this).style('cursor', 'default')
    //       d3.select(this).attr('fill', colorPalette.dark.background)
    //     })
    //   ig.append('svg:image')
    //     .attr('xlink:href', '/static/icons/square-target.svg')
    //     .attr('width', headerSize * 2)
    //     .attr('height', headerSize * 2)
    //     .attr('x', -box.w * 0.025)
    //     .attr('y', 0)
    //     .style('opacity', 0.5)
    //     .style('pointer-events', 'none')
    //   ig.append('text')
    //     .text('P' + d.id.split('_')[1])
    //     .attr('x', -box.w * 0.025 + headerSize * 2 * 0.5)
    //     .attr('y', 0 + headerSize * 2 * 0.5 + txtSize * 0.3)
    //     .style('font-weight', 'bold')
    //     .attr('text-anchor', 'middle')
    //     .style('font-size', headerSize + 'px')
    //     .attr('dy', 0)
    //     .style('pointer-events', 'none')
    //     .attr('fill', colorPalette.dark.text)
    //     .attr('stroke', 'none')
    // })
    // let merge = current.merge(enter)
    // merge.each(function (d, i) {
    // })
    // current
    //   .exit()
    //   .transition('inOut')
    //   .duration(timeD.animArc)
    //   .style('opacity', 0)
    //   .remove()

    // g.append('text')
    //   .text('Pointing:')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', 'bold')
    //   .style('font-style', '')
    //   .style('font-size', headerSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.w * 0.33) + ',' + (box.w * 0.075) + ')')

    trgtPnt = []
    let allTar = []
    let allPoint = []
    for (let j = 0; j < schedB.blocks.length; j++) {
      let data = schedB.blocks[j]
      for (let i = 0; i < data.pointings.length; i++) {
        let tar = trgtPnt.find(t => t.name === data.pointings[i].name.split('/')[0])
        if (tar) {
          tar.pointings.push(data.pointings[i])
        } else {
          tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
          allTar.push(tar)
          tar.pointings = [data.pointings[i]]
          trgtPnt.push(tar)
        }
        allPoint.push(data.pointings[i])
      }
    }

    let gt = g.append('g')
      .attr('id', 'telsDisplayer')
      .attr('transform', 'translate(' + (box.w * 0.25) + ',' + (box.h * 0.48) + ')')
    com.targetBlock = new TargetDisplayer({
      main: {
        tag: 'targetRootTag',
        g: gt,
        scroll: {},
        box: {x: 0, y: 0, w: box.w * 0.5, h: box.h * 0.5, marg: 0},
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
          box: {x: 0, y: 0, w: box.w * 0.4, h: box.h * 0.5, marg: 0},
          mainTarget: undefined
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
          targets: allTar,
          pointings: allPoint
        },
        modified: []
      }
    })
  }

  function createPointingInformationOld () {
    // let target = com.data.target
    let schedB = com.data.schedB
    console.log(schedB);
    let box = com.target.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.schedule.g = g

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
        .attr('height', headerSize * 4.5)
        .attr('fill', i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.05)
        .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    }

    // g.append('rect')
    //   .attr('x', box.w * 0.15)
    //   .attr('y', 3 + box.w * 0.19)
    //   .attr('width', box.w * 0.7)
    //   .attr('height', box.w * 0.7)
    //   .attr('fill', colorPalette.bright.background)
    //   .attr('stroke', colorPalette.bright.stroke)
    //   .attr('stroke-width', 0.2)
    // let center = {
    //   x: box.w * 0.15 + box.w * 0.35,
    //   y: 3 + box.w * 0.19 + box.w * 0.35
    // }
    // g.append('text')
    //   .text('+')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', 'bold')
    //   .style('font-size', txtSize * 1.4 + 'px')
    //   .attr('text-anchor', 'middle')
    //   .attr('transform', 'translate(' + center.x + ',' + (center.y + txtSize * 0.3) + ')')
    // g.append('text')
    //   .text('trg')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'middle')
    //   .attr('transform', 'translate(' + center.x + ',' + (center.y + txtSize * 1.3) + ')')
    //
    // for (let i = 0; i < schedB.blocks.length; i++) {
    //   let offX = (schedB.blocks[i].pointingPos[0] - target.pos[0]) * 12
    //   let offY = (schedB.blocks[i].pointingPos[1] - target.pos[1]) * 12
    //   g.append('text')
    //     .text('+')
    //     .style('fill', colorPalette.dark.stroke)
    //     .style('font-weight', 'bold')
    //     .style('font-size', txtSize * 1.4 + 'px')
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', 'translate(' + (center.x + offX) + ',' + (center.y + offY + txtSize * 0.3) + ')')
    //   g.append('text')
    //     .text('ptg-' + schedB.blocks[i].metaData.nObs)
    //     .style('fill', colorPalette.dark.stroke)
    //     .style('font-weight', '')
    //     .style('font-size', txtSize * 0.8 + 'px')
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', 'translate(' + (center.x + offX) + ',' + ((schedB.blocks[i].pointingPos[1] < target.pos[1] ? -txtSize * 1.3 : txtSize * 1.3) + center.y + offY) + ')')
    // }

    g.append('text')
      .attr('id', 'targetName')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', 'bold')
      .style('font-style', '')
      .style('font-size', headerSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.01) + ',' + (box.w * 0.075) + ')')
    g.append('text')
      .attr('id', 'targetPosX')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', '')
      .style('font-size', txtSize + 'px')
      .attr('text-anchor', 'start')
      .attr('transform', 'translate(' + (box.w * 0.01) + ',' + ((box.w * 0.075) + txtSize * 1.6) + ')')
    g.append('text')
      .attr('id', 'targetPosY')
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

    g.append('rect')
      .attr('id', 'headerStrip')
      .attr('x', 0)
      .attr('y', headerSize * 6)
      .attr('width', box.w * 0.14)
      .attr('height', headerSize)
      .attr('fill', colorPalette.dark.stroke)
    g.append('text')
      .text('Link list')
      .style('fill', colorPalette.medium.background)
      .style('font-weight', 'bold')
      .style('font-size', txtSize + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (box.w * 0.14 * 0.5) + ',' + (headerSize * 6.5 + txtSize * 0.33) + ')')

    let tbox = {x: 0, y: headerSize * 6 + headerSize, w: box.w * 0.14, h: box.h - headerSize * 7.5}
    let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + tbox.y + ')')
    let scrollBox = initScrollBox('targetListScroll', blockg, tbox, {enabled: false})
    let innerg = scrollBox.get('innerG')

    let trgtPnt = []
    let allTar = []
    let allPoint = []
    for (let j = 0; j < schedB.blocks.length; j++) {
      let data = schedB.blocks[j]
      for (let i = 0; i < data.pointings.length; i++) {
        let tar = trgtPnt.find(t => t.name === data.pointings[i].name.split('/')[0])
        if (tar) {
          tar.pointings.push(data.pointings[i])
        } else {
          tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
          allTar.push(tar)
          tar.pointings = [data.pointings[i]]
          trgtPnt.push(tar)
        }
        allPoint.push(data.pointings[i])
      }
    }

    let line = 20
    let marg = line * 0.2
    let interOffset = 0
    let scrollHeight = headerSize * 0.2
    function pointingCore (pointings, pg, offset) {
      let current = pg
        .selectAll('g.pointing')
        .data(pointings, function (d) {
          return d.id
        })
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'pointing')
      enter.each(function (d, i) {
        let g = d3.select(this)
        let pevents = {
          click: function () { com.target.events.click('target', d.targetId) },
          over: function () {
            com.schedule.g.select('text#targetName').text(pg.data()[0].name)
            com.schedule.g.select('text#targetPosX').text(pg.data()[0].pos[0])
            com.schedule.g.select('text#targetPosY').text(pg.data()[0].pos[1])

            com.schedule.g.select('text#pointingName').text(d.name)
            com.schedule.g.select('text#pointingPosX').text(d.pos[0])
            com.schedule.g.select('text#pointingPosY').text(d.pos[1])

            com.schedule.g.select('text#offsetX').text(d.pos[0] - pg.data()[0].pos[0])
            com.schedule.g.select('text#offsetY').text(d.pos[1] - pg.data()[0].pos[1])
          },
          out: function () {}
        }
        pointingIcon(g, {w: line * 1.4, h: line * 0.9}, 'P' + d.name.split('/')[1].split('_')[1], pevents, colorPalette)
        scrollHeight += (marg + line * 0.9)
      })
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', 'translate(' + (line * 0.4) + ',' + (offset + (marg + line * 0.9) * i) + ')')
        interOffset += marg + line * 0.9
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
      // offsetY += line * 1
    }
    function targetCore (targets, g, offset) {
      let current = g
        .selectAll('g.target')
        .data(targets, function (d) {
          return d.id
        })
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'target')
      enter.each(function (d, i) {
        let g = d3.select(this)
        let tevents = {
          click: function () { com.target.events.click('target', d.id) },
          over: function () {
            com.schedule.g.select('text#targetName').text(d.name)
            com.schedule.g.select('text#targetPosX').text(d.pos[0])
            com.schedule.g.select('text#targetPosY').text(d.pos[1])
            if (com.schedule.g.select('text#pointingName').text().includes(d.name)) return
            com.schedule.g.select('text#pointingName').text('')
            com.schedule.g.select('text#pointingPosX').text('')
            com.schedule.g.select('text#pointingPosY').text('')

            com.schedule.g.select('text#offsetX').text('')
            com.schedule.g.select('text#offsetY').text('')
          },
          out: function () {}
        }
        targetIcon(g, {w: line * 1.1, h: line * 1.1}, 'T' + d.name.split('_')[1], tevents, colorPalette)
        scrollHeight += marg + line + 4
      })
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', 'translate(' + (label[0].x + line * 0.0) + ',' + (offset + interOffset + (marg + line + 4) * i) + ')')
        // innerOffset += line
        pointingCore(d.pointings, g, line * 1.1 + marg)
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    targetCore(trgtPnt, innerg, headerSize * 0.2)

    g.append('line')
      .attr('x1', 0)
      .attr('y1', box.h - headerSize * 0.5)
      .attr('x2', box.w * 0.14)
      .attr('y2', box.h - headerSize * 0.5)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.4)
      .style('opacity', scrollHeight > tbox.h ? 1 : 0)
    scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: scrollHeight})

    let gt = g.append('g')
      .attr('id', 'telsDisplayer')
      .attr('transform', 'translate(' + (box.w * 0.15) + ',' + (headerSize * 6) + ')')
    com.targetBlock = new TargetDisplayer({
      main: {
        tag: 'targetRootTag',
        g: gt,
        scroll: {},
        box: {x: 0, y: 0, w: box.w * 0.7, h: box.h - headerSize * 6.5, marg: 0},
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
          box: {x: 0, y: 0, w: box.w * 0.7, h: box.h - headerSize * 6.5, marg: 0},
          mainTarget: undefined
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
          targets: allTar,
          pointings: allPoint
        },
        modified: []
      }
    })

    // let targetData = {
    //   id: schedB.target.name,
    //   pointing: []
    // }
    // for (let i = 0; i < schedB.blocks.length; i++) {
    //   let p = {
    //     id: schedB.blocks[i].pointingName.split('/')[1],
    //     position: schedB.blocks[i].pointingPos
    //   }
    //   if (!targetData.pointing.includes(p)) targetData.pointing.push(p)
    // }
    //
    // // g.append('rect')
    // //   .attr('x', 0)
    // //   .attr('y', box.w * 0.19 + 3)
    // //   .attr('width', box.w * 0.14)
    // //   .attr('height', headerSize + 4)
    // //   .attr('fill', colorPalette.dark.background)
    // //   .attr('stroke', colorPalette.dark.stroke)
    // //   .attr('stroke-width', 0.05)
    // //   .on('click', function () {
    // //     focusManager.focusOn('target', target.id)
    // //   })
    // //   .on('mouseover', function (d) {
    // //     d3.select(this).style('cursor', 'pointer')
    // //     d3.select(this).attr('fill', colorPalette.darker.background)
    // //   })
    // //   .on('mouseout', function (d) {
    // //     d3.select(this).style('cursor', 'default')
    // //     d3.select(this).attr('fill', colorPalette.dark.background)
    // //   })
    // // g.append('text')
    // //   .text(targetData.id)
    // //   .style('fill', colorPalette.dark.stroke)
    // //   .style('font-weight', '')
    // //   .style('font-size', headerSize + 'px')
    // //   .attr('text-anchor', 'start')
    // //   .attr('transform', 'translate(' + 2 + ',' + (3 + box.w * 0.19 + headerSize * 1) + ')')
    // //   .style('pointer-events', 'none')
    // // g.append('rect')
    // //   .attr('x', headerSize * 5)
    // //   .attr('y', box.w * 0.075 - headerSize)
    // //   .attr('width', headerSize * 2)
    // //   .attr('height', headerSize * 2)
    // //   .attr('fill', colorPalette.dark.background)
    // //   .attr('stroke', colorPalette.medium.stroke)
    // //   .attr('stroke-width', 0.2)
    // //   // .style('boxShadow', '10px 20px 30px black')
    // //   .attr('rx', 0)
    // //   .on('click', function () {
    // //     focusManager.focusOn('target', target.id)
    // //   })
    // //   .on('mouseover', function (d) {
    // //     d3.select(this).style('cursor', 'pointer')
    // //     d3.select(this).attr('fill', colorPalette.darker.background)
    // //   })
    // //   .on('mouseout', function (d) {
    // //     d3.select(this).style('cursor', 'default')
    // //     d3.select(this).attr('fill', colorPalette.dark.background)
    // //   })
    //
    // let height = box.w * 0.09
    // g.append('rect')
    //   .attr('x', box.w * 0.01)
    //   .attr('y', box.w * 0.19 + 3)
    //   .attr('width', height)
    //   .attr('height', height)
    //   .attr('fill', colorPalette.dark.background)
    //   .attr('stroke', colorPalette.medium.stroke)
    //   .attr('stroke-width', 0.6)
    //   // .style('boxShadow', '10px 20px 30px black')
    //   .attr('rx', height)
    //   .on('click', function () {
    //     com.target.events.click('target', targetData.id)
    //   })
    //   .on('mouseover', function (d) {
    //     d3.select(this).style('cursor', 'pointer')
    //     d3.select(this).attr('fill', colorPalette.darker.background)
    //   })
    //   .on('mouseout', function (d) {
    //     d3.select(this).style('cursor', 'default')
    //     d3.select(this).attr('fill', colorPalette.dark.background)
    //   })
    // g.append('svg:image')
    //   .attr('xlink:href', '/static/icons/round-target.svg')
    //   .attr('width', height * 1)
    //   .attr('height', height * 1)
    //   .attr('x', box.w * 0.01)
    //   .attr('y', box.w * 0.19 + 3)
    //   .style('opacity', 0.5)
    //   .style('pointer-events', 'none')
    // g.append('text')
    //   .text('T' + targetData.id.split('/')[0].split('_')[1])
    //   .attr('x', box.w * 0.01 + height * 0.5)
    //   .attr('y', box.w * 0.19 + 3 + height * 0.5 + txtSize * 0.3)
    //   .style('font-weight', 'bold')
    //   .attr('text-anchor', 'middle')
    //   .style('font-size', headerSize + 'px')
    //   .attr('dy', 0)
    //   .style('pointer-events', 'none')
    //   .attr('fill', colorPalette.dark.text)
    //   .attr('stroke', 'none')
    //
    // g.append('line')
    //   .attr('x1', 0)
    //   .attr('y1', 3 + box.w * 0.19 + height + 4)
    //   .attr('x2', box.w * 0.14)
    //   .attr('y2', 3 + box.w * 0.19 + height + 4)
    //   .attr('stroke', colorPalette.dark.stroke)
    //   .attr('stroke-width', 0.2)
    //
    // let offsetY = 3 + box.w * 0.19 + height + 6
    // let current = g
    //   .selectAll('g.pointing')
    //   .data(targetData.pointing, function (d) {
    //     return d.id
    //   })
    // let enter = current
    //   .enter()
    //   .append('g')
    //   .attr('class', 'pointing')
    // enter.each(function (d, i) {
    //   let ig = d3.select(this)
    //   ig.attr('transform', 'translate(' + (headerSize * 3) + ',' + (offsetY + titleSize * 2 * i) + ')')
    //
    //   ig.append('rect')
    //     .attr('x', -box.w * 0.025)
    //     .attr('y', 0)
    //     .attr('width', headerSize * 2)
    //     .attr('height', headerSize * 2)
    //     .attr('fill', colorPalette.dark.background)
    //     .attr('stroke', colorPalette.medium.stroke)
    //     .attr('stroke-width', 0.6)
    //     // .style('boxShadow', '10px 20px 30px black')
    //     .attr('rx', 0)
    //     .on('click', function () {
    //       com.target.events.click('target', targetData.id)
    //     })
    //     .on('mouseover', function () {
    //       g.select('text#pointingName').text(d.id)
    //       g.select('text#pointingPosX').text(d.position[0])
    //       g.select('text#pointingPosY').text(d.position[1])
    //
    //       g.select('text#offsetX').text(d.position[0] - target.pos[0])
    //       g.select('text#offsetY').text(d.position[1] - target.pos[1])
    //       d3.select(this).style('cursor', 'pointer')
    //       d3.select(this).attr('fill', colorPalette.darker.background)
    //     })
    //     .on('mouseout', function () {
    //       d3.select(this).style('cursor', 'default')
    //       d3.select(this).attr('fill', colorPalette.dark.background)
    //     })
    //   ig.append('svg:image')
    //     .attr('xlink:href', '/static/icons/square-target.svg')
    //     .attr('width', headerSize * 2)
    //     .attr('height', headerSize * 2)
    //     .attr('x', -box.w * 0.025)
    //     .attr('y', 0)
    //     .style('opacity', 0.5)
    //     .style('pointer-events', 'none')
    //   ig.append('text')
    //     .text('P' + d.id.split('_')[1])
    //     .attr('x', -box.w * 0.025 + headerSize * 2 * 0.5)
    //     .attr('y', 0 + headerSize * 2 * 0.5 + txtSize * 0.3)
    //     .style('font-weight', 'bold')
    //     .attr('text-anchor', 'middle')
    //     .style('font-size', headerSize + 'px')
    //     .attr('dy', 0)
    //     .style('pointer-events', 'none')
    //     .attr('fill', colorPalette.dark.text)
    //     .attr('stroke', 'none')
    // })
    // let merge = current.merge(enter)
    // merge.each(function (d, i) {
    // })
    // current
    //   .exit()
    //   .transition('inOut')
    //   .duration(timeD.animArc)
    //   .style('opacity', 0)
    //   .remove()

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
      .style('font-size', '11px')
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
