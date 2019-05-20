/* global d3 */
/* global $ */
/* global blockStyle */
/* global loadScript */
/* global colorPalette */
/* global hasVar */
/* global targetIcon */
/* global pointingIcon */
/* global TargetDisplayer */
/* global TelescopeDisplayer */
/* global deepCopy */

loadScript({ source: 'utils_scrollTable', script: '/js/blocks/utils_blockCommon.js' })
loadScript({ source: 'utils_scrollTable', script: '/js/blocks/utils_telescopeCommon.js' })

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
    console.log(com.data.block);
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
      .attr('stroke-width', 0.4)
      .attr('transform', 'translate(' + (box.w * 0.5 - dimPoly * 0.5) + ',' + (box.h * 0.5 - dimPoly) + ')')
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
      .attr('transform', 'translate(' + (box.w * 0.5) + ',' + (box.h * 0.5 - dimPoly * 0.5 + txtSize * 0.4) + ')')
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
        .attr('x', 2 + (box.w * 0.5 - ((schedB.blocks.length + (com.schedule.editabled ? 1 : 0)) * dimPoly) * 0.5) + (dimPoly * i))
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
        .attr('transform', 'translate(' + (2 + (box.w * 0.5 - ((schedB.blocks.length + (com.schedule.editabled ? 1 : 0)) * dimPoly) * 0.5) + (dimPoly * i) + (dimPoly * 0.4)) + ',' + (box.h * 0.9 - dimPoly * 0.3 + txtSize * 0.3) + ')')
        .style('pointer-events', 'none')
    }
    if (com.schedule.editabled) {
      g.append('rect')
        .attr('x', 2 + (box.w * 0.5 - ((schedB.blocks.length + (com.schedule.editabled ? 1 : 0)) * dimPoly) * 0.5) + (dimPoly * schedB.blocks.length))
        .attr('y', box.h * 0.9 - dimPoly * 0.7)
        .attr('width', dimPoly * 0.8)
        .attr('height', dimPoly * 0.8)
        .attr('fill', colorPalette.dark.background)
        .attr('stroke', colorPalette.dark.stroke)
        .attr('stroke-width', 0.2)
        .attr('stroke-dasharray', [])
        .on('click', function () {
          com.tree.events.change(com.data.schedB)
        })
        .on('mouseover', function (d) {
          d3.select(this).style('cursor', 'pointer')
          d3.select(this).attr('fill', d3.color(colorPalette.dark.background).darker(0.9))
        })
        .on('mouseout', function (d) {
          d3.select(this).style('cursor', 'default')
          d3.select(this).attr('fill', colorPalette.dark.background)
        })
      g.append('text')
        .text('+')
        .style('fill', colorPalette.dark.text)
        .style('font-weight', 'bold')
        .style('font-size', txtSize + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (2 + (box.w * 0.5 - ((schedB.blocks.length + (com.schedule.editabled ? 1 : 0)) * dimPoly) * 0.5) + (dimPoly * schedB.blocks.length) + (dimPoly * 0.4)) + ',' + (box.h * 0.9 - dimPoly * 0.3 + txtSize * 0.3) + ')')
        .style('pointer-events', 'none')
    }
  }

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
        com.data.block.time.start = (endTime - startTime) / 1000
        com.data.block.time.end = com.data.block.time.start + com.data.block.time.duration
        break
      case 'duration':
        com.data.block.time.duration = Number(hour) * 3600 + Number(min) * 60 + Number(sec)
        com.data.block.time.end = com.data.block.time.start + com.data.block.time.duration
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
        com.data.block.time.end = (endTime - startTime) / 1000
        com.data.block.time.duration = com.data.block.endTime - com.data.block.time.start
        break
      default:
        return
    }

    function updateTime (id, time) {
      let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
      let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
      let sec = ('0' + d3.timeFormat('%S')(time)).slice(-2)

      let g = com.main.g.select('g#' + id)

      g.select('#hour').select('input').property('value', hour)
      g.select('#minute').select('input').property('value', min)
      g.select('#second').select('input').property('value', sec)
    }

    startTime = new Date(com.data.timeOfNight.date_start)
    startTime.setSeconds(startTime.getSeconds() + com.data.block.time.start)
    endTime = new Date(com.data.timeOfNight.date_start)
    endTime.setSeconds(endTime.getSeconds() + com.data.block.time.start + com.data.block.time.duration)
    let duration = new Date(endTime)
    duration.setHours(duration.getHours() - startTime.getHours())
    duration.setMinutes(duration.getMinutes() - startTime.getMinutes())
    duration.setSeconds(duration.getSeconds() - startTime.getSeconds())
    updateTime('startTime', startTime)
    updateTime('duration', duration)
    updateTime('endTime', endTime)

    com.schedule.events.click()
  }
  function changeState (newState) {
    com.schedule.events.change(com.data.block, newState)
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
      {x: box.w * 0.0, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.2, text: 'State', anchor: 'middle'},
      {x: box.w * 0.2, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.266, text: 'Start', anchor: 'middle'},
      {x: box.w * 0.466, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.266, text: 'Duration', anchor: 'middle'},
      {x: box.w * 0.732, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.266, text: 'End', anchor: 'middle'}
      // {x: box.w * 0.69, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.31, text: 'Target & pointing', anchor: 'middle'}
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
        .attr('fill', i % 2 === 1 ? colorPalette.dark.background : colorPalette.darker.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.05)
        .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    }

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
        {disabled: !com.schedule.editabled, value: hour, min: 0, max: 23, step: 1},
        {change: (d) => { changeBlockTime(id, d, stock.minute.property('value'), stock.second.property('value')) }, enter: (d) => { stock.minute.node().focus() }})
      ig.append('text')
        .text(':')
        .style('fill', colorPalette.dark.stroke)
        .style('font-size', headerSize + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (hbox.x + hbox.w + 0.5) + ',' + (y + headerSize * 1.1 + (com.schedule.editabled ? 0 : headerSize * 0.35)) + ')')
      stock.minute = inputDate(ig,
        mbox,
        'minute',
        {disabled: !com.schedule.editabled, value: min, min: 0, max: 60, step: 1},
        {change: (d) => { changeBlockTime(id, stock.hour.property('value'), d, stock.second.property('value')) }, enter: (d) => { stock.second.node().focus() }})
      ig.append('text')
        .text(':')
        .style('fill', colorPalette.dark.stroke)
        .style('font-size', headerSize + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (mbox.x + mbox.w + 0.5) + ',' + (y + headerSize * 1.1 + (com.schedule.editabled ? 0 : headerSize * 0.35)) + ')')
      stock.second = inputDate(ig,
        sbox,
        'second',
        {disabled: !com.schedule.editabled, value: sec, min: 0, max: 60, step: 1},
        {change: (d) => { changeBlockTime(id, stock.hour.property('value'), stock.minute.property('value'), d) }, enter: (d) => { stock.second.node().blur() }})
    }

    let startTime = new Date(com.data.timeOfNight.date_start)
    startTime.setSeconds(startTime.getSeconds() + data.time.start)
    let endTime = new Date(com.data.timeOfNight.date_start)
    endTime.setSeconds(endTime.getSeconds() + data.time.start + data.time.duration)
    let duration = new Date(endTime)
    duration.setHours(duration.getHours() - startTime.getHours())
    duration.setMinutes(duration.getMinutes() - startTime.getMinutes())
    duration.setSeconds(duration.getSeconds() - startTime.getSeconds())

    let sbox = {
      x: label[0].x,
      y: 3 + headerSize,
      w: label[0].w,
      h: box.h - headerSize - 4
    }

    let options = []
    if (data.exeState.state === 'wait') options = ['cancel', 'wait']
    if (data.exeState.state === 'cancel') options = ['cancel', 'wait']
    if (data.exeState.state === 'run') options = ['run', 'cancel']

    dropDownDiv(g,
      sbox,
      'state',
      {disabled: !com.schedule.editabled, value: data.exeState.state, options: options},
      {change: (d) => { changeState(d) }, enter: (d) => { changeState(d) }})

    drawTime('startTime', label[1].x + txtSize * 0.5, label[1].w, 2 + headerSize * 1.5, startTime)
    drawTime('duration', label[2].x + txtSize * 0.5, label[2].w, 2 + headerSize * 1.5, duration)
    drawTime('endTime', label[3].x + txtSize * 0.5, label[3].w, 2 + headerSize * 1.5, endTime)

    // let tbox = {
    //   x: label[4].x,
    //   y: 3 + headerSize * 1.5,
    //   w: label[4].w * 0.5,
    //   h: headerSize * 2
    // }
    // dropDownDiv(g,
    //   tbox,
    //   'target',
    //   {disabled: !com.schedule.editabled, value: data.pointingName.split('/')[0], options: ['trg_1', 'trg_2', 'trg_3', 'trg_4', 'trg_5', 'trg_6', 'trg_7']},
    //   {change: (d) => { changeTarget(d) }, enter: (d) => { changeTarget(d) }})
    // let pbox = {
    //   x: label[4].x + label[4].w * 0.5,
    //   y: 3 + headerSize * 1.5,
    //   w: label[4].w * 0.5,
    //   h: headerSize * 2
    // }
    // dropDownDiv(g,
    //   pbox,
    //   'pointing',
    //   {disabled: !com.schedule.editabled, value: data.pointingName.split('/')[1], options: ['p_0', 'p_1', 'p_2', 'p_3', 'p_4', 'p_5', 'p_6', 'p_7']},
    //   {change: (d) => { changePointing(d) }, enter: (d) => { changePointing(d) }})
  }

  function addNewTarget (trgName) {
    for (let i = 0; i < com.data.target.length; i++) {
      if (com.data.target[i].name === trgName) {
        com.data.block.targets.push(com.data.target[i])
        initPointingInformation()
        // addNewPointing(com.data.target[i])
      }
    }
  }
  function addNewPointing (type) {
    let box = {
      x: com.target.box.x + com.target.box.w * 0.2,
      y: com.target.box.y + com.target.box.h * 0.1,
      w: com.target.box.w * 0.8,
      h: com.target.box.h * 0.9
    }
    let line = 20
    if (type === 'coordinates') {
      let target
      let pointing
      let g = com.main.g.append('g')
        .attr('id', 'pointing')
        .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.w)
        .attr('height', box.h)
        .attr('fill', colorPalette.dark.background)
        .attr('stroke', colorPalette.dark.stroke)
        .attr('stroke-width', 0.4)

      {
        let tevents = {
          click: function () {},
          over: function () {},
          out: function () {}
        }
        let sizeNewPointing = line * 0.8
        let addPointingg = g.append('g').attr('transform', 'translate(' + (4) + ',' + (4) + ')')
        targetIcon(addPointingg, {w: sizeNewPointing, h: sizeNewPointing}, '+', tevents, colorPalette)
        dropDownDiv(addPointingg,
          {x: -2, y: -2, w: sizeNewPointing * 2, h: sizeNewPointing * 1.3},
          'trg',
          {disabled: !com.schedule.editabled, value: '', options: com.data.target.map(x => x.name)},
          {change: (d) => {
            let chooseTarget = g.select('g#chooseTarget')
            chooseTarget.selectAll('*').remove()
            for (let i = 0; i < com.data.target.length; i++) {
              if (com.data.target[i].name === d) {
                target = com.data.target[i]
                targetIcon(chooseTarget, {w: sizeNewPointing * 1.2, h: sizeNewPointing * 1.2}, target.name.split('_')[1], tevents, colorPalette)
                return
              }
            }
            target = undefined
          },
          enter: (d) => {
          }})
        g.append('g').attr('id', 'chooseTarget').attr('transform', 'translate(' + (4) + ',' + (box.h * 0.5) + ')')

        g.append('text')
          .text('Coordinates')
          .style('fill', colorPalette.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', 10 + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (box.w * 0.6) + ',' + 10 + ')')
        g.append('rect')
          .attr('x', -box.w * 0.2)
          .attr('y', 0)
          .attr('width', box.w * 0.55)
          .attr('height', 18)
          .attr('fill', colorPalette.bright.background)
          .attr('stroke', colorPalette.bright.stroke)
          .attr('stroke-width', 0.2)
          .attr('transform', 'translate(' + (box.w * 0.6) + ',' + (box.h * 0.2) + ')')
        g.append('rect')
          .attr('x', -box.w * 0.2)
          .attr('y', 0)
          .attr('width', box.w * 0.55)
          .attr('height', 18)
          .attr('fill', colorPalette.bright.background)
          .attr('stroke', colorPalette.bright.stroke)
          .attr('stroke-width', 0.2)
          .attr('transform', 'translate(' + (box.w * 0.6) + ',' + (box.h * 0.4) + ')')

        g.append('rect')
          .attr('x', -20)
          .attr('y', -10)
          .attr('width', 40)
          .attr('height', 13)
          .attr('fill', colorPalette.darker.background)
          .attr('stroke', colorPalette.darker.stroke)
          .attr('stroke-width', 0.4)
          .attr('transform', 'translate(' + (box.w * 0.7) + ',' + (box.h * 0.95) + ')')
          .on('click', function () {
            g.remove()
          })
          .on('mouseover', function (d) {
            d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
          })
          .on('mouseout', function (d) {
            d3.select(this).attr('fill', colorPalette.darker.background)
          })
        g.append('text')
          .text('Cancel')
          .style('fill', colorPalette.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', 10 + 'px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .attr('transform', 'translate(' + (box.w * 0.7) + ',' + (box.h * 0.95) + ')')

        g.append('rect')
          .attr('x', -20)
          .attr('y', -10)
          .attr('width', 40)
          .attr('height', 13)
          .attr('fill', colorPalette.darker.background)
          .attr('stroke', colorPalette.darker.stroke)
          .attr('stroke-width', 0.4)
          .attr('transform', 'translate(' + (box.w * 0.9) + ',' + (box.h * 0.95) + ')')
          .on('click', function () {
            if (!target) target = com.data.block.targets[0]
            pointing = {id: com.data.block.sbId + '_' + com.data.block.obId}
            pointing.name = target.name + '/p_' + com.data.block.metaData.nObs + '-' + com.data.block.pointings.length
            pointing.pos = [target.pos[0], target.pos[1]]
            pointing.telIds = []
            pointing.telsInfo = {large: 0, medium: 0, small: 0}
            com.data.block.pointings.push(pointing)
            com.data.block.targets.push(target)
            reassignTelescope()
            g.remove()
          })
          .on('mouseover', function (d) {
            d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
          })
          .on('mouseout', function (d) {
            d3.select(this).attr('fill', colorPalette.darker.background)
          })
        g.append('text')
          .text('Ok')
          .style('fill', colorPalette.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', 10 + 'px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .attr('transform', 'translate(' + (box.w * 0.9) + ',' + (box.h * 0.95) + ')')

        // let tbox = {x: label[0].x, y: 3 + headerSize + (com.target.editable ? (headerSize * 2) : 0), w: label[0].w, h: com.target.editable ? (box.h - headerSize * 3) : (box.h - headerSize * 1)}
        // let blocktg = g.append('g').attr('transform', 'translate(' + tbox.x + ',' + tbox.y + ')')
        // let scrollBoxt = initScrollBox('targetListScroll', blocktg, tbox, {enabled: false})
        // let innertg = scrollBoxt.get('innerG')
        // function targetCore (targets, g, offset) {
        //   let space = ((tbox.h * 1) - (targets.length * line)) / (targets.length)
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
        //       over: function () {},
        //       out: function () {}
        //     }
        //     targetIcon(g, {w: line * 1.1, h: line * 1.1}, '' + d.name.split('_')[1], tevents, colorPalette)
        //   })
        //   let merge = current.merge(enter)
        //   merge.each(function (d, i) {
        //     let g = d3.select(this)
        //     let offX = (label[0].x + label[0].w * 0.5 - line * 0.5)
        //     let offY = (space * 0.5 + (space + line) * i)
        //     if (line * targets.length > tbox.h) offY = line * i
        //     g.attr('transform', 'translate(' + offX + ',' + offY + ')')
        //   })
        //   current
        //     .exit()
        //     .transition('inOut')
        //     .duration(timeD.animArc)
        //     .style('opacity', 0)
        //     .remove()
        // }
        // targetCore(data.targets, innertg, 0)
        // scrollBoxt.resetVerticalScroller({canScroll: true, scrollHeight: line * data.targets.length})
      }
    }
  }
  function initPointingInformation () {
    let box = com.target.box
    let data = com.data.block

    if (com.main.g.select('g#pointing')) com.main.g.select('g#pointing').remove()

    let g = com.main.g.append('g')
      .attr('id', 'pointing')
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
      .attr('x', 0)
      .attr('y', 3)
      .attr('width', box.w * 1)
      .attr('height', headerSize)
      .attr('fill', colorPalette.dark.stroke)
    let label = [
      {x: 0, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 1, text: 'Targets & pointings mapping', anchor: 'middle'}
      // {x: 0, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.10, text: 'Tgts', anchor: 'middle'},
      // {x: box.w * 0.10, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.10, text: 'Ptgs', anchor: 'middle'},
      // {x: box.w * 0.2, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.8, text: 'Mapping', anchor: 'middle'}
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
    }

    let line = 20
    let tbox = {x: label[0].x, y: 3 + headerSize + (com.target.editable ? (headerSize * 2) : 0), w: label[0].w, h: com.target.editable ? (box.h - headerSize * 3) : (box.h - headerSize * 1)}
    // let blocktg = g.append('g').attr('transform', 'translate(' + tbox.x + ',' + tbox.y + ')')
    // let scrollBoxt = initScrollBox('targetListScroll', blocktg, tbox, {enabled: false})
    // let innertg = scrollBoxt.get('innerG')
    // let trgtPnt = []
    // for (let i = 0; i < data.pointings.length; i++) {
    //   let tar = trgtPnt.find(t => t.name === data.pointings[i].name.split('/')[0])
    //   if (tar) {
    //     if (!(data.obId in tar.pointings)) tar.pointings[data.obId] = []
    //     tar.pointings[data.obId].push(data.pointings[i])
    //   } else {
    //     tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
    //     tar.pointings = {}
    //     tar.pointings[data.obId] = [data.pointings[i]]
    //     trgtPnt.push(tar)
    //   }
    // }
    // let squareTemplate = {
    //   '1': [{x: 0.5, y: 0.5}],
    //   '2': [{x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}],
    //   '3': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.7}],
    //   '4': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
    //   '5': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.5}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
    //   '6': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.3}, {x: 0.5, y: 0.7}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
    //   '7': [],
    //   '8': [],
    //   '9': []
    // }

    // function targetCore (targets, g, offset) {
    //   let space = ((tbox.h * 1) - (targets.length * line)) / (targets.length)
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
    //       over: function () {},
    //       out: function () {}
    //     }
    //     targetIcon(g, {w: line * 1.1, h: line * 1.1}, '' + d.name.split('_')[1], tevents, colorPalette)
    //   })
    //   let merge = current.merge(enter)
    //   merge.each(function (d, i) {
    //     let g = d3.select(this)
    //     let offX = (label[0].x + label[0].w * 0.5 - line * 0.5)
    //     let offY = (space * 0.5 + (space + line) * i)
    //     if (line * targets.length > tbox.h) offY = line * i
    //     g.attr('transform', 'translate(' + offX + ',' + offY + ')')
    //   })
    //   current
    //     .exit()
    //     .transition('inOut')
    //     .duration(timeD.animArc)
    //     .style('opacity', 0)
    //     .remove()
    // }
    // targetCore(data.targets, innertg, 0)
    // scrollBoxt.resetVerticalScroller({canScroll: true, scrollHeight: line * data.targets.length})

    // let pbox = {x: label[1].x, y: 3 + headerSize + (com.target.editable ? (headerSize * 2) : 0), w: label[1].w, h: com.target.editable ? (box.h - headerSize * 3) : (box.h - headerSize * 1)}
    // let blockpg = g.append('g').attr('transform', 'translate(' + pbox.x + ',' + pbox.y + ')')
    // let scrollBoxp = initScrollBox('pointingListScroll', blockpg, pbox, {enabled: false})
    // let innerpg = scrollBoxp.get('innerG')
    // let trgtPnt = []
    // for (let i = 0; i < data.pointings.length; i++) {
    //   let tar = trgtPnt.find(t => t.name === data.pointings[i].name.split('/')[0])
    //   if (tar) {
    //     if (!(data.obId in tar.pointings)) tar.pointings[data.obId] = []
    //     tar.pointings[data.obId].push(data.pointings[i])
    //   } else {
    //     tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
    //     tar.pointings = {}
    //     tar.pointings[data.obId] = [data.pointings[i]]
    //     trgtPnt.push(tar)
    //   }
    // }
    // let squareTemplate = {
    //   '1': [{x: 0.5, y: 0.5}],
    //   '2': [{x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}],
    //   '3': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.7}],
    //   '4': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
    //   '5': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.5}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
    //   '6': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.3}, {x: 0.5, y: 0.7}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
    //   '7': [],
    //   '8': [],
    //   '9': []
    // }

    // function pointingCore (pointings, g, offset) {
    //   let space = ((tbox.h * 1) - (pointings.length * line)) / (pointings.length)
    //   let current = g
    //     .selectAll('g.target')
    //     .data(pointings, function (d) {
    //       return d.id
    //     })
    //   let enter = current
    //     .enter()
    //     .append('g')
    //     .attr('class', 'target')
    //   enter.each(function (d, i) {
    //     let g = d3.select(this)
    //     let pevents = {
    //       click: function () {},
    //       over: function () {},
    //       out: function () {}
    //     }
    //     pointingIcon(g, {w: box.w * 0.07, h: line}, '' + d.name.split('/')[1].split('_')[1].split('-')[1], pevents, colorPalette)
    //   })
    //   let merge = current.merge(enter)
    //   merge.each(function (d, i) {
    //     let g = d3.select(this)
    //     let offX = (label[0].x + label[0].w * 0.5 - line * 0.5)
    //     let offY = (space * 0.5 + (space + line) * i)
    //     if (line * pointings.length > pbox.h) offY = line * i
    //     g.attr('transform', 'translate(' + offX + ',' + offY + ')')
    //   })
    //   current
    //     .exit()
    //     .transition('inOut')
    //     .duration(timeD.animArc)
    //     .style('opacity', 0)
    //     .remove()
    // }
    // pointingCore(data.pointings, innerpg, 0)
    // scrollBoxp.resetVerticalScroller({canScroll: true, scrollHeight: line * data.pointings.length})
    // function pointingCore (trg, pointings, pg, x, y, w, h) {
    //   if (com.target.editable) {
    //     pointings.push({id: 'newPointing'})
    //   }
    //   pg.attr('transform', 'translate(' + x + ',' + y + ')')
    //   pg.append('rect')
    //     .attr('x', 4)
    //     .attr('y', 4)
    //     .attr('width', w - 8)
    //     .attr('height', h - 8)
    //     .attr('fill', colorPalette.darker.background)
    //     .attr('stroke', colorPalette.darker.stroke)
    //     .attr('stroke-width', 0.2)
    //   let psize = {
    //     w: Math.min(w / 3, 25),
    //     h: Math.min(h / 3, 20)
    //   }
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
    //     if (i === (pointings.length - 1) && com.target.editable) {
    //       let pevents = {
    //         click: function () { addNewPointing(trg) },
    //         over: function () {},
    //         out: function () {}
    //       }
    //       pointingIcon(g, {w: psize.w * 0.66, h: psize.h * 0.66}, '+', pevents, colorPalette)
    //     } else {
    //       let pevents = {
    //         click: function () {},
    //         over: function () {},
    //         out: function () {}
    //       }
    //       pointingIcon(g, {w: psize.w, h: psize.h}, '' + d.name.split('/')[1].split('_')[1].split('-')[1], pevents, colorPalette)
    //     }
    //   })
    //   let merge = current.merge(enter)
    //   merge.each(function (d, i) {
    //     let g = d3.select(this)
    //     if (i === (pointings.length - 1) && com.target.editable) {
    //       let index = pointings.length
    //       let pos = squareTemplate[index][i]
    //       g.attr('transform', 'translate(' + ((pos.x * w) - (psize.w * 0.66 * 0.5)) + ',' + ((pos.y * h) - (psize.h * 0.66 * 0.5)) + ')')
    //     } else {
    //       let index = pointings.length
    //       let pos = squareTemplate[index][i]
    //       g.attr('transform', 'translate(' + ((pos.x * w) - (psize.w * 0.5)) + ',' + ((pos.y * h) - (psize.h * 0.5)) + ')')
    //     }
    //   })
    //   current
    //     .exit()
    //     .transition('inOut')
    //     .duration(timeD.animArc)
    //     .style('opacity', 0)
    //     .remove()
    // }
    // addPointingg.append('rect')
    //   .attr('x', (label[0].w * 0.5) + sizeNewPointing * 0.5 + 4)
    //   .attr('y', 4)
    //   .attr('width', label[1].w - 8)
    //   .attr('height', sizeNewPointing - 8)
    //   .attr('fill', colorPalette.darker.background)
    //   .attr('stroke', colorPalette.darker.stroke)
    //   .attr('stroke-width', 0.2)
    // let trgtPnt = []
    // for (let i = 0; i < data.pointings.length; i++) {
    //   let tar = trgtPnt.find(t => t.name === data.pointings[i].name.split('/')[0])
    //   if (tar) {
    //     tar.pointings.push(data.pointings[i])
    //   } else {
    //     tar = data.targets.find(t => t.name === data.pointings[i].name.split('/')[0])
    //     tar.pointings = [data.pointings[i]]
    //     trgtPnt.push(tar)
    //   }
    // }
    //
    // let tbox = {x: 0, y: 3 + headerSize, w: box.w * 0.54, h: box.h - headerSize}
    // let blockg = g.append('g').attr('transform', 'translate(' + tbox.x + ',' + tbox.y + ')')
    // let scrollBox = initScrollBox('targetListScroll', blockg, tbox, {enabled: false})
    // let innerg = scrollBox.get('innerG')
    //
    // let line = box.h * 0.15
    // let marg = line * 0.2
    // let interOffset = 0
    // let scrollHeight = headerSize * 0.2
    // function pointingCore (pointings, g, offset) {
    //   let current = g
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
    //     g.append('rect')
    //       .attr('x', -line * 0.58)
    //       .attr('y', -marg * 0.5)
    //       .attr('width', box.w * 0.535)
    //       .attr('height', line + marg) // Math.min(box.h, (line + 2) * schedB.blocks.length))
    //       .attr('fill', 'none') // i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
    //       .attr('stroke', '#000000')
    //       .attr('stroke-width', 0.05)
    //       // .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    //     g.attr('transform', 'translate(' + (line * 0.35) + ',' + (offset + (marg + line) * i) + ')')
    //     let pevents = {
    //       click: function () { com.target.events.click('target', d.targetId) }
    //     }
    //     pointingIcon(g, {w: line, h: line}, 'P' + d.name.split('/')[1].split('-')[1], pevents, colorPalette)
    //     g.append('text')
    //       .text(d.pos[0])
    //       .style('fill', colorPalette.dark.stroke)
    //       .style('font-weight', '')
    //       .style('font-size', headerSize + 'px')
    //       .attr('text-anchor', 'start')
    //       .attr('transform', 'translate(' + (line * 2) + ',' + (line * 0.2 + headerSize * 0.5) + ')')
    //     g.append('text')
    //       .text(d.pos[1])
    //       .style('fill', colorPalette.dark.stroke)
    //       .style('font-weight', '')
    //       .style('font-size', headerSize + 'px')
    //       .attr('text-anchor', 'start')
    //       .attr('transform', 'translate(' + (line * 2) + ',' + (line * 0.2 + headerSize * 1.4) + ')')
    //   })
    //   let merge = current.merge(enter)
    //   merge.each(function (d, i) {
    //     let g = d3.select(this)
    //     g.attr('transform', 'translate(' + (line * 0.35) + ',' + (offset + (marg + line) * i) + ')')
    //     interOffset += marg + line
    //     scrollHeight += marg + line
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
    //     g.attr('transform', 'translate(' + (label[0].x + line * 0.25) + ',' + (offset + interOffset + (marg + line) * i) + ')')
    //     let tevents = {
    //       click: function () { com.target.events.click('target', d.id) }
    //     }
    //     targetIcon(g, {w: line * 1.1, h: line * 1.1}, 'T' + d.name.split('_')[1], tevents, colorPalette)
    //
    //     g.append('text')
    //       .text(d.pos[0])
    //       .style('fill', colorPalette.dark.stroke)
    //       .style('font-weight', '')
    //       .style('font-size', headerSize + 'px')
    //       .attr('text-anchor', 'start')
    //       .attr('transform', 'translate(' + (label[0].w) + ',' + (line * 0.2 + headerSize * 0.5) + ')')
    //     g.append('text')
    //       .text(d.pos[1])
    //       .style('fill', colorPalette.dark.stroke)
    //       .style('font-weight', '')
    //       .style('font-size', headerSize + 'px')
    //       .attr('text-anchor', 'start')
    //       .attr('transform', 'translate(' + (label[0].w) + ',' + (line * 0.2 + headerSize * 1.4) + ')')
    //   })
    //   let merge = current.merge(enter)
    //   merge.each(function (d, i) {
    //     let g = d3.select(this)
    //     g.attr('transform', 'translate(' + (0 + line * 0.25) + ',' + (offset + interOffset + (marg + line + 4) * i) + ')')
    //     scrollHeight += marg + line + 4
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
    // targetCore(trgtPnt, innerg, headerSize * 0.5)
    // g.append('line')
    //   .attr('x1', tbox.x)
    //   .attr('y1', tbox.y + tbox.h)
    //   .attr('x2', tbox.x + tbox.w)
    //   .attr('y2', tbox.y + tbox.h)
    //   .attr('stroke', colorPalette.dark.stroke)
    //   .attr('stroke-width', 0.4)
    //   .style('opacity', scrollHeight > tbox.h ? 1 : 0)
    // scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: scrollHeight})
    // let height = box.w * 0.09
    // for (let i = 0; i < data.pointings.length; i++) {
    //   let pg = g.append('g').attr('transform', 'translate(' + (box.w * 0.48) + ',' + (box.h * 0.5) + ')')
    //   let pevents = {
    //     click: function () { com.target.events.click('target', data.targetId) }
    //   }
    //   pointingIcon(pg, {w: height, h: height}, 'P' + data.pointingName.split('/')[1].split('_')[1], pevents, colorPalette)
    //   g.append('text')
    //     .text(data.pointingPos[0])
    //     .style('fill', colorPalette.dark.stroke)
    //     .style('font-weight', '')
    //     .style('font-size', headerSize + 'px')
    //     .attr('text-anchor', 'start')
    //     .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.55 + headerSize * 0.5) + ')')
    //   g.append('text')
    //     .text(data.pointingPos[1])
    //     .style('fill', colorPalette.dark.stroke)
    //     .style('font-weight', '')
    //     .style('font-size', headerSize + 'px')
    //     .attr('text-anchor', 'start')
    //     .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.55 + headerSize * 2) + ')')
    // }
    // let tg = g.append('g').attr('transform', 'translate(' + (box.w * 0.48) + ',' + (box.h * 0.15) + ')')
    // let tevents = {
    //   click: function () { com.target.events.click('target', data.targetId) }
    // }
    // targetIcon(tg, {w: height, h: height}, 'T' + data.pointingName.split('/')[0].split('_')[1], tevents, colorPalette)
    // g.append('text')
    //   .text(target.pos[0])
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', headerSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.175 + headerSize * 0.5) + ')')
    // g.append('text')
    //   .text(target.pos[1])
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', '')
    //   .style('font-size', headerSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (box.h + height * 1.6) + ',' + (box.h * 0.175 + headerSize * 2) + ')')

    let gt = g.append('g')
      .attr('id', 'targetDisplayer')
      .attr('transform', 'translate(' + label[0].x + ',' + (label[0].y + 3) + ')')
    com.targetBlock = new TargetDisplayer({
      main: {
        tag: 'targetRootTag',
        g: gt,
        scroll: {},
        box: {x: 0, y: 0, w: box.w, h: box.h * 0.9, marg: 0},
        background: {
          fill: colorPalette.brighter.background,
          stroke: colorPalette.brighter.stroke,
          strokeWidth: 0.5
        }
      },

      displayer: 'linkMap',
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
          box: {x: 0, y: 0, w: label[0].w, h: box.h * 0.9, marg: 0},
          mainTarget: undefined
        },
        legend: {
          enabled: false
        }
      },
      linkMap: {
        map: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: 0, w: box.w, h: box.h * 0.9, marg: 0}
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
          targets: com.data.block.targets,
          pointings: com.data.block.pointings
        },
        modified: []
      }
    })

    if (com.target.editable) {
      let pevents = {
        click: function (d) {},
        over: function () {},
        out: function () {}
      }
      let sizeNewPointing = line * 0.8
      let addPointingg = g.append('g').attr('transform', 'translate(' + (label[0].x + 2) + ',' + (tbox.y + 4 - headerSize * 2) + ')')
      dropDownDiv(addPointingg,
        {x: -2, y: -4, w: sizeNewPointing * 2, h: sizeNewPointing * 1.3},
        'trg',
        {disabled: !com.schedule.editabled, value: '', options: ['coordinates', 'divergentes']},
        {change: (d) => { addNewPointing(d) }, enter: (d) => { addNewPointing(d) }})
      pointingIcon(addPointingg, {w: sizeNewPointing * 0.8, h: sizeNewPointing * 0.8}, '+', pevents, colorPalette)
    }
  }

  function switchTel (elem, tel) {
    let allTel = com.events.allTel()
    let trueBlockReference = []
    let trueBlock = []
    for (let i = 0; i < allTel.blocks.length; i++) {
      if (allTel.blocks[i].obId !== com.data.block.obId) {
        trueBlockReference.push(allTel.blocks[i])
        trueBlock.push(deepCopy(allTel.blocks[i]))
      }
    }

    let box = {
      x: com.telescope.box.x,
      y: com.telescope.box.y - com.telescope.box.h * 0.08,
      w: com.telescope.box.w,
      h: com.telescope.box.h
    }
    let g = com.main.g.append('g')
      .attr('id', 'pointing')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', box.w)
      .attr('height', box.h)
      .attr('fill', colorPalette.dark.background)
      .attr('stroke', colorPalette.medium.stroke)
      .attr('stroke-width', 0.4)
      .attr('rx', 2)

    let ibox = {
      x: 4,
      y: 4,
      w: box.w * 0.8,
      h: box.h - 16
    }
    let largeBox = {x: 0, y: 0, w: 0, h: 0}
    let mediumBox = {x: 0, y: 0, w: 0, h: 0}
    let smallBox = {x: 0, y: 0, w: 0, h: 0}

    function duplicateTels () {
      for (let i = 0; i < trueBlock.length; i++) {
        let b1 = trueBlock[i]
        let newBlock = {metaData: {nObs: '', nSched: '', blockName: '+'}, obId: '+', name: '+', telIds: []}
        for (let z = b1.telIds.length - 1; z >= 0; z--) {
          let dupli = false
          for (let j = i + 1; j < trueBlock.length; j++) {
            let b2Index = trueBlock[j].telIds.indexOf(b1.telIds[z])
            if (b2Index !== -1) {
              dupli = true
              trueBlock[j].telIds.splice(b2Index, 1)
            }
          }
          if (dupli) newBlock.telIds.push(b1.telIds.splice(z, 1)[0])
        }
        if (newBlock.telIds.length > 0) trueBlock.push(newBlock)
      }
    }

    if (tel.id.includes('L')) {
      largeBox = {x: ibox.w * 0.35, y: 0, w: ibox.w * 0.16, h: ibox.h * 0.9}
      allTel.allTels = allTel.allTels.filter(d => d.id.includes('L'))
      trueBlock = trueBlock.filter(d => d.telescopes.large.ids.length > 0)
      duplicateTels()
    } else if (tel.id.includes('M')) {
      mediumBox = {x: ibox.w * 0.2, y: 0, w: ibox.w * 0.5, h: ibox.h * 0.9}
      allTel.allTels = allTel.allTels.filter(d => d.id.includes('M'))
      trueBlock = trueBlock.filter(d => d.telescopes.medium.ids.length > 0)
      duplicateTels()
    } else if (tel.id.includes('S')) {
      smallBox = {x: ibox.w * 0.08, y: 0, w: ibox.w * 0.7, h: ibox.h * 0.9}
      allTel.allTels = allTel.allTels.filter(d => d.id.includes('S'))
      trueBlock = trueBlock.filter(d => d.telescopes.small.ids.length > 0)
      duplicateTels()
    }

    let choosenTel
    let gt = g.append('g')
      .attr('id', 'telsDisplayer')
      .attr('transform', 'translate(' + ibox.x + ',' + ibox.y + ')')
    com.telescopeSwitch = new TelescopeDisplayer({
      main: {
        tag: 'telescopeRootTag',
        g: gt,
        scroll: {},
        box: ibox,
        background: {
          fill: 'none',
          stroke: colorPalette.medium.stroke,
          strokeWidth: 0
        },
        isSouth: true,
        colorPalette: colorPalette
      },

      displayer: 'gridBib',
      gridBib: {
        header: {
          top: false,
          text: {
            size: 0,
            color: colorPalette.medium.background
          },
          background: {
            height: 0,
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
              telsPerRow: 12,
              nbl: 0,
              size: 0.5,
              ratio: 1
            },
            box: smallBox
          }
        },
        idle: {
          txtSize: 10,
          enabled: true,
          background: {
            enabled: false,
            middle: {
              color: colorPalette.dark.background,
              opacity: 0
            },
            side: {
              color: colorPalette.dark.background,
              opacity: 0
            }
          }
        },
        blocks: {
          txtSize: 8,
          right: {
            enabled: false
          },
          left: {
            enabled: true
          },
          background: {
            middle: {
              color: colorPalette.darkest.background,
              opacity: 0.0
            },
            side: {
              color: colorPalette.darker.background,
              opacity: 0
            }
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
          click: (d) => {},
          mouseover: (d) => {},
          mouseout: (d) => {},
          drag: {
            start: () => {},
            tick: () => {},
            end: () => {}
          }
        },
        telescope: {
          click: (d) => {
            if (choosenTel && d.id === choosenTel.id) {
              g.select('circle#choosenTelCircle')
                .attr('fill', colorPalette.dark.background)
                .attr('stroke-dasharray', [2, 2])
              g.select('text#choosenTelName')
                .text('Click')
              choosenTel = undefined
            } else {
              choosenTel = d
              g.select('circle#choosenTelCircle')
                .attr('stroke-dasharray', [])
                .attr('fill', telHealthCol(choosenTel.val))
              g.select('text#choosenTelName')
                .text(choosenTel.id.split('_')[1])
            }
          },
          mouseover: (d) => {},
          mouseout: (d) => {},
          drag: {
            start: () => {},
            tick: () => {},
            end: () => {}
          }
        }
      }
    })
    com.telescopeSwitch.init()
    com.telescopeSwitch.updateData({
      data: {
        raw: {
          telescopes: allTel.allTels,
          blocks: trueBlock
        },
        modified: []
      }
    })

    g.append('g').attr('id', 'chooseTarget').attr('transform', 'translate(' + (4) + ',' + (box.h * 0.5) + ')')

    // g.append('text')
    //   .text('Exchange')
    //   .attr('x', box.w * 0.8)
    //   .attr('y', box.h * 0.35)
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', 'bold')
    //   .style('font-size', 10 + 'px')
    //   .attr('text-anchor', 'middle')
    //   .style('pointer-events', 'none')
    g.append('circle')
      .attr('id', 'choosenTelCircle')
      .attr('cx', box.w * 0.7)
      .attr('cy', box.h * 0.4)
      .attr('r', box.h * 0.075)
      .attr('fill', colorPalette.dark.background)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.4)
      .attr('stroke-dasharray', [2, 2])
    g.append('text')
      .attr('id', 'choosenTelName')
      .text('Click')
      .attr('x', box.w * 0.7)
      .attr('y', box.h * 0.4 + txtSize * 0.33)
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', 'bold')
      .style('font-size', 9 + 'px')
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
    g.append('circle')
      .attr('cx', box.w * 0.9)
      .attr('cy', box.h * 0.4)
      .attr('r', box.h * 0.075)
      .attr('fill', telHealthCol(tel.health))
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.4)
    g.append('text')
      .text(tel.id.split('_')[1])
      .attr('x', box.w * 0.9)
      .attr('y', box.h * 0.4 + txtSize * 0.33)
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', 'bold')
      .style('font-size', 10 + 'px')
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none')

    g.append('rect')
      .attr('x', -16)
      .attr('y', -10)
      .attr('width', 32)
      .attr('height', 13)
      .attr('fill', colorPalette.dark.background)
      .attr('stroke', colorPalette.darker.stroke)
      .attr('stroke-width', 0.0)
      .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.36) + ')')
      .on('click', function () {
        if (!choosenTel) return
        for (let i = 0; i < trueBlockReference.length; i++) {
          if (trueBlockReference[i].telIds.indexOf(choosenTel.id) !== -1) removeTelescopeFromBlock(trueBlockReference[i], choosenTel)
        }
        removeTel(tel)
        g.remove()
        updateTelescopeInformation()
      })
      .on('mouseover', function (d) {
        d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
      })
      .on('mouseout', function (d) {
        d3.select(this).attr('fill', colorPalette.dark.background)
      })
      .attr('rx', 4)
    g.append('svg:image')
      .attr('xlink:href', '/static/icons/arrow-right.svg')
      .attr('width', 50)
      .attr('height', 13)
      .attr('x', -25)
      .attr('y', -10)
      .style('opacity', 0.5)
      .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.36) + ')')
      .style('pointer-events', 'none')
    // g.append('text')
    //   .text('Exchange')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', 'bold')
    //   .style('font-size', 10 + 'px')
    //   .attr('text-anchor', 'middle')
    //   .style('pointer-events', 'none')
    //   .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.25) + ')')

    g.append('rect')
      .attr('x', -16)
      .attr('y', -10)
      .attr('width', 32)
      .attr('height', 13)
      .attr('fill', colorPalette.dark.background)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.0)
      .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.5) + ')')
      .on('click', function () {
        if (!choosenTel) return
        for (let i = 0; i < trueBlockReference.length; i++) {
          if (trueBlockReference[i].telIds.indexOf(choosenTel.id) !== -1) removeTelFromBlock(trueBlockReference[i], choosenTel)
        }
        removeTelFromBlock(com.data.block, tel)
        g.remove()
        updateTelescopeInformation()
      })
      .on('mouseover', function (d) {
        d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
      })
      .on('mouseout', function (d) {
        d3.select(this).attr('fill', colorPalette.dark.background)
      })
      .attr('rx', 4)
    g.append('svg:image')
      .attr('xlink:href', '/static/icons/arrow-left.svg')
      .attr('width', 50)
      .attr('height', 13)
      .attr('x', -25)
      .attr('y', -10)
      .style('opacity', 0.5)
      .attr('transform', 'translate(' + (box.w * 0.78) + ',' + (box.h * 0.5) + ')')
      .style('pointer-events', 'none')
    g.append('svg:image')
      .attr('xlink:href', '/static/icons/arrow-right.svg')
      .attr('width', 50)
      .attr('height', 13)
      .attr('x', -25)
      .attr('y', -10)
      .style('opacity', 0.5)
      .attr('transform', 'translate(' + (box.w * 0.82) + ',' + (box.h * 0.5) + ')')
      .style('pointer-events', 'none')

    g.append('rect')
      .attr('x', -20)
      .attr('y', -10)
      .attr('width', 40)
      .attr('height', 13)
      .attr('fill', colorPalette.darker.background)
      .attr('stroke', colorPalette.darker.stroke)
      .attr('stroke-width', 0.4)
      .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.95) + ')')
      .on('click', function () {
        g.remove()
      })
      .on('mouseover', function (d) {
        d3.select(this).attr('fill', d3.color(colorPalette.darker.background).darker(0.9))
      })
      .on('mouseout', function (d) {
        d3.select(this).attr('fill', colorPalette.darker.background)
      })
    g.append('text')
      .text('Cancel')
      .style('fill', colorPalette.dark.stroke)
      .style('font-weight', 'bold')
      .style('font-size', 10 + 'px')
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .attr('transform', 'translate(' + (box.w * 0.8) + ',' + (box.h * 0.95) + ')')
  }
  function changeTelescopeNumber (type, d) {
    let data = com.data.block.telescopes[type]
    function removeTelFromList () {
      let diff = data.ids.length - d
      for (let i = 0; i < diff; i++) {
        removeTelescope({id: data.ids[0]})
      }
    }
    function addTelToList () {

    }
    if (data.ids.length < d) addTelToList()
    if (data.ids.length > d) removeTelFromList()

    updateInput()
    reassignTelescope()
  }
  function reassignTelescope () {
    let allTels = deepCopy(com.data.block.telIds)
    let sizeChunk = allTels.length / com.data.block.pointings.length
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
    for (let i = 0; i < com.data.block.pointings.length - 1; i++) {
      let tels = getRandom(allTels, sizeChunk)
      com.data.block.pointings[i].telIds = tels.ids
      com.data.block.pointings[i].telsInfo = tels.stats
    }
    let tels = getRandom(allTels, allTels.length)
    com.data.block.pointings[com.data.block.pointings.length - 1].telIds = tels.ids
    com.data.block.pointings[com.data.block.pointings.length - 1].telsInfo = tels.stats

    // initPointingInformation()
    updateTelescopeInformation()
  }
  function addTelescope (t) {
    console.log(t);
  }
  function removeTel (t) {
    removeTelescope(t)
    updateInput()
    reassignTelescope()
  }
  function removeTelescope (t) {
    removeTelescopeFromBlock(com.data.block, {id: t.id})
  }
  function updateInput () {
    com.telescope.tels.large.property('value', function () {
      return com.data.block.telescopes.large.ids.length
    })
    com.telescope.tels.medium.property('value', function () {
      return com.data.block.telescopes.medium.ids.length
    })
    com.telescope.tels.small.property('value', function () {
      return com.data.block.telescopes.small.ids.length
    })
  }
  function initTelescopeInformation () {
    let box = {
      x: com.telescope.box.x,
      y: com.telescope.box.y,
      w: com.telescope.box.w,
      h: com.telescope.box.h
    }
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
    let xx = box.w * 0.11
    let ww = box.w * 0.86
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

    // let tels = {
    //   large: [],
    //   medium: [],
    //   small: []
    // }
    // for (let i = 0; i < data.telIds.length; i++) {
    //   let id = data.telIds[i]
    //   if (id[0] === 'S') {
    //     tels.small.push(getTelescopeById(id))
    //   } else if (id[0] === 'M') {
    //     tels.medium.push(getTelescopeById(id))
    //   } else if (id[0] === 'L') {
    //     tels.large.push(getTelescopeById(id))
    //   }
    // }

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
        isSouth: true,
        colorPalette: colorPalette
      },

      displayer: 'gridBib',
      gridBib: {
        header: {
          top: true,
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
          enabled: false,
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
          txtSize: 10,
          right: {
            enabled: false
          },
          left: {
            enabled: true
          },
          background: {
            middle: {
              color: colorPalette.darkest.background,
              opacity: 0.3
            },
            side: {
              color: colorPalette.darker.background,
              opacity: 1
            }
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
          click: (d) => {},
          mouseover: (d) => {},
          mouseout: (d) => {},
          drag: {
            start: () => {},
            tick: () => {},
            end: () => {}
          }
        },
        other: {
          delTel: (d) => { removeTel(d) },
          switchTel: (elem, t) => { switchTel(elem, t) }
        }
      },
      interaction: {
        delete: {
          enabled: true,
          event: () => {}
        },
        drag: {
          enabled: true,
          event: () => {}
        },
        switch: {
          enabled: true,
          event: () => {}
        }
      }
    })
    com.telescopeRunningBlock.init()

    com.telescope.tels = {}
    com.telescope.tels.large = inputNumber(g,
      {x: (largeBox.x + largeBox.w * 0.5 - 25), y: (box.y + box.h + 1), w: 50, h: 15},
      'large',
      {disabled: !com.schedule.editabled, value: com.data.block.telescopes.large.ids.length, min: com.data.block.telescopes.large.min, max: com.data.block.telescopes.large.max, step: 1},
      {change: (d) => { changeTelescopeNumber('large', d) }, enter: (d) => { changeTelescopeNumber('large', d) }})

    com.telescope.tels.medium = inputNumber(g,
      {x: (mediumBox.x + mediumBox.w * 0.5 - 25), y: (box.y + box.h + 1), w: 50, h: 15},
      'small',
      {disabled: !com.schedule.editabled, value: com.data.block.telescopes.medium.ids.length, min: com.data.block.telescopes.medium.min, max: com.data.block.telescopes.medium.max, step: 1},
      {change: (d) => { changeTelescopeNumber('medium', d) }, enter: (d) => { changeTelescopeNumber('medium', d) }})

    com.telescope.tels.small = inputNumber(g,
      {x: (smallBox.x + smallBox.w * 0.5 - 25), y: (box.y + box.h + 1), w: 50, h: 15},
      'small',
      {disabled: !com.schedule.editabled, value: com.data.block.telescopes.small.ids.length, min: com.data.block.telescopes.small.min, max: com.data.block.telescopes.small.max, step: 1},
      {change: (d) => { changeTelescopeNumber('small', d) }, enter: (d) => { changeTelescopeNumber('small', d) }})

    updateTelescopeInformation()
  }
  function updateTelescopeInformation () {
    let tels = []
    for (let i = 0; i < com.data.block.telescopes.large.ids.length; i++) {
      tels.push({id: com.data.block.telescopes.large.ids[i], health: com.data.tels.find(x => x.id === com.data.block.telescopes.large.ids[i]).val})
    }
    for (let i = 0; i < com.data.block.telescopes.medium.ids.length; i++) {
      tels.push({id: com.data.block.telescopes.medium.ids[i], health: com.data.tels.find(x => x.id === com.data.block.telescopes.medium.ids[i]).val})
    }
    for (let i = 0; i < com.data.block.telescopes.small.ids.length; i++) {
      tels.push({id: com.data.block.telescopes.small.ids[i], health: com.data.tels.find(x => x.id === com.data.block.telescopes.small.ids[i]).val})
    }
    console.log(tels);
    com.telescopeRunningBlock.updateData({
      data: {
        raw: {
          telescopes: tels,
          blocks: com.data.block.pointings
        },
        modified: []
      }
    })
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
  function inputNumber (g, box, id, optIn, events) {
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
}
