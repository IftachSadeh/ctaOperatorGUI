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
      {x: box.w * 0.0, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.12, text: 'Blocks', anchor: 'start'},
      {x: box.w * 0.12, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.15, text: 'State', anchor: 'start'},
      {x: box.w * 0.25, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.18, text: 'Start', anchor: 'start'},
      {x: box.w * 0.42, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.18, text: 'Duration', anchor: 'start'},
      {x: box.w * 0.6, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.18, text: 'End', anchor: 'start'},
      {x: box.w * 0.78, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.22, text: 'Pointing', anchor: 'start'}
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
        .attr('opacity', i % 2 === 1 ? 0 : 0.1)

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
        stock.hour = inputNumber(g,
          hbox,
          {value: hour, min: 0, max: 23, step: 1},
          {change: (d) => { changeBlockTime(id, 'hour', d) }, enter: (d) => { stock.minute.node().focus() }})
        g.append('text')
          .text(':')
          .style('fill', colorPalette.dark.stroke)
          .style('font-size', headerSize + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (hbox.x + hbox.w + 0.5) + ',' + (y + headerSize * 1.1) + ')')
        stock.minute = inputNumber(g,
          mbox,
          {value: min, min: 0, max: 60, step: 1},
          {change: (d) => { changeBlockTime(id, 'minute', d) }, enter: (d) => { stock.second.node().focus() }})
        g.append('text')
          .text(':')
          .style('fill', colorPalette.dark.stroke)
          .style('font-size', headerSize + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (mbox.x + mbox.w + 0.5) + ',' + (y + headerSize * 1.1) + ')')
        stock.second = inputNumber(g,
          sbox,
          {value: sec, min: 0, max: 60, step: 1},
          {change: (d) => { changeBlockTime(id, 'second', d) }, enter: (d) => { stock.second.node().blur() }})
      }

      let startTime = new Date(com.data.timeOfNight.date_start)
      startTime.setSeconds(startTime.getSeconds() + d.startTime)
      let endTime = new Date(com.data.timeOfNight.date_start)
      endTime.setSeconds(endTime.getSeconds() + d.startTime + d.duration)
      let duration = new Date(endTime)
      duration.setHours(duration.getHours() - startTime.getHours())
      duration.setMinutes(duration.getMinutes() - startTime.getMinutes())
      duration.setSeconds(duration.getSeconds() - startTime.getSeconds())

      g.append('text')
        .text(d.exeState.state)
        .style('fill', colorPalette.dark.stroke)
        .style('font-weight', '')
        .style('font-size', titleSize + 'px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (label[1].x) + ',' + (0 + txtSize * 1.3) + ')')

      drawTime('startTime', label[2].x, 0, startTime)
      drawTime('duration', label[3].x, 0, duration)
      drawTime('endTime', label[4].x, 0, endTime)

      g.append('text')
        .text(d.pointingName)
        .style('fill', colorPalette.dark.stroke)
        .style('font-weight', '')
        .style('font-size', headerSize + 'px')
        .attr('text-anchor', 'start')
        .attr('transform', 'translate(' + (label[5].x) + ',' + (line * 0.5 + headerSize * 0.3) + ')')
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
      .style('opacity', 0.1)
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
}
