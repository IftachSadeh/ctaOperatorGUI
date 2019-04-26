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

window.TargetForm = function (optIn) {
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
    createTitle()
    createAssociatedBlocks()
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

  function createTitle () {
    let tar = com.data.target
    let box = com.tree.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.tree.g = g
    let height = box.h * 0.7

    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', height)
      .attr('height', height)
      .attr('fill', colorPalette.dark.background)
      .attr('stroke', colorPalette.medium.stroke)
      .attr('stroke-width', 0.6)
      // .style('boxShadow', '10px 20px 30px black')
      .attr('rx', height)
      .on('click', function () {
        com.tree.events.click('target', tar.id)
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
      .attr('x', height * 0.0)
      .attr('y', height * 0.5 - height * 0.5)
      .style('opacity', 0.5)
      .style('pointer-events', 'none')
    g.append('text')
      .text('T' + tar.name.split('_')[1])
      .attr('x', height * 0.5)
      .attr('y', height * 0.5 + txtSize * 0.3)
      .style('font-weight', '')
      .attr('text-anchor', 'middle')
      .style('font-size', headerSize + 'px')
      .attr('dy', 0)
      .style('pointer-events', 'none')
      .attr('fill', colorPalette.dark.text)
      .attr('stroke', 'none')
  }
  function createAssociatedBlocks () {
    let scheds = com.data.schedB
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
      {x: box.w * 0.01, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.17, text: 'Sched', anchor: 'start'},
      {x: box.w * 0.17, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.83, text: 'Obs', anchor: 'start'}
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
        .attr('height', box.h)
        .attr('fill', i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
        .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    }

    let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + (4 + headerSize) + ')')
    com.ressource.scrollBox = initScrollBox('targetRessourceScroll', blockg, box, {enabled: false})
    let innerg = com.ressource.scrollBox.get('innerG')

    let line = titleSize * 2.5
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
          .attr('x', box.w * 0.15)
          .attr('y', line * 0.1)
          .attr('width', line * 0.95)
          .attr('height', line * 0.8)
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
          .attr('transform', 'translate(' + (box.w * 0.19) + ',' + (line * 0.5 + txtSize * 0.3) + ')')
          .style('pointer-events', 'none')
      })
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', 'translate(' + (4 + line * i) + ',' + (offset) + ')')
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
        g.append('rect')
          .attr('x', -2)
          .attr('y', -2)
          .attr('width', box.w)
          .attr('height', line)
          .attr('fill', '#666666')
          .attr('opacity', i % 2 === 0 ? 0 : 0.1)
        let dimPoly = line * 0.9
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
        g.attr('transform', 'translate(' + (box.w * 0.02) + ',' + (offset + innerOffset + line * i) + ')')
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
    schedCore(scheds, innerg, 0)
    com.ressource.scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: scheds.length * line})
    blockg.append('line')
      .attr('x1', box.x)
      .attr('y1', box.h)
      .attr('x2', box.w)
      .attr('y2', box.h)
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.4)
  }
  function createPointingInformation () {
    let target = com.data.target
    let box = com.target.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.target.g = g

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
      id: target.name,
      pointing: []
    }
    let inter = com.data.schedB
    for (let key in inter) {
      if (inter[key].target.id !== target.id) continue
      for (let i = 0; i < inter[key].blocks.length; i++) {
        let p = {
          id: inter[key].blocks[i].pointingName.split('/')[1],
          position: inter[key].blocks[i].pointingPos
        }
        if (!targetData.pointing.includes(p)) targetData.pointing.push(p)
      }
    }

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

      let offX = (d.position[0] - target.pos[0]) * 12
      let offY = (d.position[1] - target.pos[1]) * 12
      g.append('text')
        .text('+')
        .style('fill', colorPalette.dark.stroke)
        .style('font-weight', 'bold')
        .style('font-size', txtSize * 1.4 + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (center.x + offX) + ',' + (center.y + offY + txtSize * 0.3) + ')')
      g.append('text')
        .text(d.id)
        .style('fill', colorPalette.dark.stroke)
        .style('font-weight', '')
        .style('font-size', txtSize * 0.8 + 'px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (center.x + offX) + ',' + ((offY < 0 ? -txtSize * 1.3 : txtSize * 1.3) + center.y + offY) + ')')
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
  }
}
