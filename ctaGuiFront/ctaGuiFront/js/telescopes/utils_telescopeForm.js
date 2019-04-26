/* global d3 */
/* global telHealthCol */
/* global getTelState */
/* global loadScript */
/* global colorPalette */
/* global hasVar */
/* global timeD */
/* global ScrollBox */
/* global Locker */
/* global RunLoop */
/* global blockStyle */

loadScript({ source: 'utils_scrollTable', script: '/js/blocks/utils_blockCommon.js' })

window.TelescopeForm = function (optIn) {
  let com = {
    main: {
      tag: 'telescopeFormTag',
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
    createTitle()
    createAssociatedBlocks()
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

  function createTitle () {
    function drawHealthBar () {
      let health = [
        {min: 0, max: 30, color: telHealthCol(15)},
        {min: 30, max: 55, color: telHealthCol(40)},
        {min: 55, max: 100, color: telHealthCol(80)}
      ]
      let ba = {
        x: box.w * 0.25,
        w: box.w * 0.3
      }
      for (let i = 0; i < health.length; i++) {
        g.append('rect')
          .attr('x', ba.x + (ba.w / 100) * health[i].min)
          .attr('y', box.h * 0.3)
          .attr('width', (ba.w / 100) * (health[i].max - health[i].min))
          .attr('height', box.h * 0.1)
          .attr('fill', health[i].color)
          .attr('stroke', '#000000')
          .attr('stroke-width', 0.1)
      }
      g.append('rect')
        .attr('x', ba.x + (ba.w / 100) * tel.val)
        .attr('y', box.h * 0.3)
        .attr('width', 2)
        .attr('height', box.h * 0.15)
        .attr('fill', '#000000')
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.1)
    }
    let tel = com.data.telescope
    let box = com.tree.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.tree.g = g

    let color = telHealthCol(tel.val)
    let telState = getTelState(tel.val)
    g.append('circle')
      .attr('cx', box.w * 0.1)
      .attr('cy', box.h * 0.35)
      .attr('r', box.h * 0.3)
      .attr('fill', color)
      .attr('stroke', '#000000')
      .attr('stroke-width', 0.2)
    g.append('text')
      .text(tel.id)
      .style('fill', color.text)
      .style('font-weight', 'bold')
      .style('font-size', headerSize + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (box.w * 0.1) + ',' + (box.h * 0.35 + txtSize * 0.3) + ')')
    // g.append('circle')
    //   .attr('cx', box.w * 0.38)
    //   .attr('cy', box.h * 0.5)
    //   .attr('r', box.h * 0.35)
    //   .attr('fill', colorPalette.medium.background)
    //   .attr('stroke', '#000000')
    //   .attr('stroke-width', 0.2)
    // g.append('text')
    //   .text((tel.id[0] === 'S' ? 'Small' : tel.id[0] === 'M' ? 'Medium' : 'Large') + ' telescope number: ' + tel.id.substring(2))
    //   .style('fill', color.text)
    //   .style('font-weight', '')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + (innerbox.w * 0.225) + ',' + (innerbox.w * 0.1 - txtSize * 0.2) + ')')
    g.append('text')
      .text('Health indicator:')
      .style('fill', color.text)
      .style('font-weight', '')
      .style('font-size', headerSize + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (box.w * 0.4) + ',' + (box.h * 0.2 + txtSize * 0.2) + ')')
    drawHealthBar()
    g.append('text')
      .text(tel.val + '%: ' + (telState === 0 ? 'Error' : telState === 1 ? 'Warning' : 'Good'))
      .style('fill', color.text)
      .style('font-weight', 'bold')
      .style('font-size', titleSize + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (box.w * 0.4) + ',' + (box.h * 0.6 + txtSize * 0.2) + ')')
  }
  function createAssociatedBlocks () {
    let box = com.ressource.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.ressource.g = g

    g.append('text')
      .text('Associated ressources:')
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
      {x: box.w * 0.01, y: 3 + headerSize * 0.5 + txtSize * 0.3, text: 'Targets', anchor: 'start'},
      {x: box.w * 0.12, y: 3 + headerSize * 0.5 + txtSize * 0.3, text: 'Sched', anchor: 'start'},
      {x: box.w * 0.23, y: 3 + headerSize * 0.5 + txtSize * 0.3, text: 'Obs', anchor: 'start'}
    ]
    for (let i = 0; i < label.length; i++) {
      g.append('text')
        .text(label[i].text)
        .style('fill', colorPalette.medium.background)
        .style('font-weight', 'bold')
        .style('font-size', txtSize + 'px')
        .attr('text-anchor', label[i].anchor)
        .attr('transform', 'translate(' + (label[i].x) + ',' + (label[i].y) + ')')
    }

    let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    com.ressource.scrollBox = initScrollBox('targetRessourceScroll', blockg, box, {enabled: false})
    let innerg = com.ressource.scrollBox.get('innerG')

    let scheds = com.data.schedB
    let inter = {}
    for (let key in scheds) {
      if (!inter[scheds[key].target.id]) inter[scheds[key].target.id] = {target: scheds[key].target, scheds: []}
      scheds[key].id = key
      inter[scheds[key].target.id].scheds.push(scheds[key])
    }
    let targs = []
    for (let key in inter) {
      targs.push(inter[key])
    }

    let line = titleSize * 3
    let offsetY = titleSize * 1.5
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
          .attr('width', line * 0.95)
          .attr('height', line * 0.95)
          .attr('fill', palette.color.background)
          .attr('stroke', palette.color.stroke)
          .attr('stroke-width', 0.1)
          .on('click', function () {
            com.ressource.events.click('block', d.obId)
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
        g.attr('transform', 'translate(' + (2 + line * (i + 1)) + ',' + (offset) + ')')
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
      // offsetY += line * 1
    }
    function schedCore (scheds, g, offset) {
      let innerOffset = 0
      let current = g
        .selectAll('g.sched')
        .data(scheds, function (d) {
          return d.id
        })
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'sched')
      enter.each(function (d, i) {
        let g = d3.select(this)
        let dimPoly = line * 0.95
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
          .attr('stroke-width', 0.8)
          .on('click', function () {
            com.ressource.events.click('schedBlock', d.id)
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
          .text('S' + d.blocks[0].metaData.nSched)
          .style('fill', colorPalette.dark.text)
          .style('font-weight', 'bold')
          .style('font-size', titleSize + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (dimPoly * 0.5) + ',' + (dimPoly * 0.5 + txtSize * 0.3) + ')')
          .style('pointer-events', 'none')
      })
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', 'translate(' + (box.w * 0.12) + ',' + (offset + innerOffset + line * i) + ')')
        offsetY += line * 0.85
        // innerOffset += line
        blockCore(d.blocks, g, 0)
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }

    let current = innerg
      .selectAll('g.targ')
      .data(targs, function (d) {
        return d.target.id
      })
    let enter = current
      .enter()
      .append('g')
      .attr('class', 'targ')
    enter.each(function (d, i) {
      let g = d3.select(this)

      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', line)
        .attr('height', line)
        .attr('fill', colorPalette.dark.background)
        .attr('stroke', colorPalette.medium.stroke)
        .attr('stroke-width', 0.6)
        // .style('boxShadow', '10px 20px 30px black')
        .attr('rx', line)
        .on('click', function () {
          com.ressource.events.click('target', d.target.id)
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
        .attr('width', line * 1)
        .attr('height', line * 1)
        .attr('x', line * 0.0)
        .attr('y', line * 0.5 - line * 0.5)
        .style('opacity', 0.5)
        .style('pointer-events', 'none')
      g.append('text')
        .text('T' + d.target.name.split('_')[1])
        .attr('x', line * 0.5)
        .attr('y', line * 0.5 + txtSize * 0.3)
        .style('font-weight', '')
        .attr('text-anchor', 'middle')
        .style('font-size', headerSize + 'px')
        .attr('dy', 0)
        .style('pointer-events', 'none')
        .attr('fill', colorPalette.dark.text)
        .attr('stroke', 'none')
    })
    let merge = current.merge(enter)
    merge.each(function (d, i) {
      let g = d3.select(this)
      g.attr('transform', 'translate(' + 0 + ',' + (offsetY) + ')')
      schedCore(d.scheds, g, 0)
      offsetY += line * 0.33
    })
    current
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()

    com.ressource.scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: line * inter.length})
    blockg.append('line')
      .attr('x1', box.x)
      .attr('y1', box.h)
      .attr('x2', box.w)
      .attr('y2', box.h)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.4)
  }
}
