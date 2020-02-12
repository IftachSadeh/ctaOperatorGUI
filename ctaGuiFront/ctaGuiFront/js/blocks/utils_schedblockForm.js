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
        if (Number(hour) >= 0 && Number(hour) <= endTime.getHours()) {
          endTime.setHours(Number(hour))
          endTime.setMinutes(Number(min))
          endTime.setSeconds(Number(sec))
        } else {
          endTime = new Date(com.data.timeOfNight.date_start)
          endTime.setHours(Number(hour))
          endTime.setMinutes(Number(min))
          endTime.setSeconds(Number(sec))
        }
        block.time.start = (endTime - startTime) / 1000
        block.time.end = block.time.start + block.time.duration
        break
      case 'duration':
        block.time.duration = Number(hour) * 3600 + Number(min) * 60 + Number(sec)
        block.time.end = block.time.start + block.time.duration
        break
      case 'endTime':
        if (Number(hour) >= 0 && Number(hour) <= endTime.getHours()) {
          endTime.setHours(Number(hour))
          endTime.setMinutes(Number(min))
          endTime.setSeconds(Number(sec))
        } else {
          endTime = new Date(com.data.timeOfNight.date_start)
          endTime.setHours(Number(hour))
          endTime.setMinutes(Number(min))
          endTime.setSeconds(Number(sec))
        }
        block.time.end = (endTime - startTime) / 1000
        block.time.duration = block.time.end - block.time.start
        break
      default:
        return
    }
    function updateTime (id, time) {
      let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
      let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
      let sec = ('0' + d3.timeFormat('%S')(time)).slice(-2)

      let g = com.main.g.select('g#' + block.obId + id)

      g.select('#hour').select('input').property('value', hour)
      g.select('#minute').select('input').property('value', min)
      g.select('#second').select('input').property('value', sec)
    }

    startTime = new Date(com.data.timeOfNight.date_start)
    startTime.setSeconds(startTime.getSeconds() + block.time.start)
    endTime = new Date(com.data.timeOfNight.date_start)
    endTime.setSeconds(endTime.getSeconds() + block.time.start + block.time.duration)
    let duration = new Date(endTime)
    duration.setHours(duration.getHours() - startTime.getHours())
    duration.setMinutes(duration.getMinutes() - startTime.getMinutes())
    duration.setSeconds(duration.getSeconds() - startTime.getSeconds())
    updateTime('startTime', startTime)
    updateTime('duration', duration)
    updateTime('endTime', endTime)

    com.schedule.events.click()
    com.events.conflict(block)
    com.events.modification(block, false, (type === 'startTime' ? 'startTime' : 'duration'))
  }
  function changeState (block, newState) {
    com.schedule.events.change(block, newState)
    com.events.modification(block, false, 'state')
    updateSchedulingObservingBlocksTree()
    updateTimeInformation()
  }
  // function changeTarget (newTarget) {
  //   let save = getPointingName(com.data.block.pointingName)
  //   com.data.block.pointingName = newTarget + '/' + save
  // }
  // function changePointing (newPointing) {
  //   let save = getPointingTarget(com.data.block.pointingName)
  //   com.data.block.pointingName = save + '/' + newPointing
  // }

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
        .style('stroke-width', background['stroke-width'])
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

    let dimPoly = box.h * 0.6
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
      .attr('transform', 'translate(' + (box.w * 0.053) + ',' + (box.h * 0.375) + ')')
    g.append('text')
      .text('S' + schedB.blocks[0].metaData.nSched)
      .style('fill', colorPalette.medium.stroke)
      .style('font-weight', '')
      .style('font-size', titleSize + 'px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (box.h * 0.7) + ',' + (box.h * 0.7 + titleSize * 0.3) + ')')
      .style('pointer-events', 'none')
    g.append('circle')
      .attr('cx', box.h * 0.7)
      .attr('cy', box.h * 0.4)
      .attr('r', box.h * 0.2)
      .attr('fill', 'transparent')
      .attr('stroke', 'none')
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
    g.append('svg:image')
      .attr('xlink:href', '/static/icons/cross.svg')
      .attr('x', box.h * 0.7 - box.h * 0.13)
      .attr('y', box.h * 0.4 - box.h * 0.13)
      .attr('width', box.h * 0.26)
      .attr('height', box.h * 0.26)
      .style('opacity', 0.5)
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
        .attr('id', schedB.blocks[i].obId)
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
  function updateSchedulingObservingBlocksTree () {
    let schedB = com.data.schedB
    for (let i = 0; i < schedB.blocks.length; i++) {
      let palette = blockStyle(schedB.blocks[i])
      com.tree.g.selectAll('rect#' + schedB.blocks[i].obId)
        .attr('fill', palette.color.background)
    }
  }
  function createTimeInformation () {
    let schedB = com.data.schedB
    let box = com.schedule.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.schedule.g = g

    // g.append('text')
    //   .text('Schedule:')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', 'bold')
    //   .style('font-size', titleSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    // g.append('line')
    //   .attr('x1', box.w * 0.0)
    //   .attr('y1', 2)
    //   .attr('x2', box.w * 1.0)
    //   .attr('y2', 2)
    //   .attr('stroke', colorPalette.dark.stroke)
    //   .attr('stroke-width', 0.2)

    // g.append('rect')
    //   .attr('id', 'headerStrip')
    //   .attr('x', 0)
    //   .attr('y', 3)
    //   .attr('width', box.w)
    //   .attr('height', headerSize)
    //   .attr('fill', colorPalette.dark.stroke)
    let label = [
      {x: box.w * 0.0, y: -2 + headerSize * 0.5 + titleSize * 0.6, w: box.w * 0.1, text: 'Blocks', anchor: 'middle'},
      {x: box.w * 0.1, y: -2 + headerSize * 0.5 + titleSize * 0.6, w: box.w * 0.2, text: 'State', anchor: 'middle'},
      {x: box.w * 0.3, y: -2 + headerSize * 0.5 + titleSize * 0.6, w: box.w * 0.233, text: 'Start', anchor: 'middle'},
      {x: box.w * 0.533, y: -2 + headerSize * 0.5 + titleSize * 0.6, w: box.w * 0.233, text: 'Duration', anchor: 'middle'},
      {x: box.w * 0.766, y: -2 + headerSize * 0.5 + titleSize * 0.6, w: box.w * 0.233, text: 'End', anchor: 'middle'}
      // {x: box.w * 0.63, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w * 0.36, text: 'Pointing', anchor: 'middle'}
    ]

    box.h -= headerSize + 3
    let line = titleSize * 2.5
    for (let i = 0; i < label.length; i++) {
      let off = label[i].anchor === 'middle' ? label[i].w * 0.5 : (label[i].anchor === 'end' ? label[i].w * 0.5 : 0)
      g.append('text')
        .text(label[i].text)
        .style('fill', colorPalette.medium.stroke)
        .style('font-weight', 'bold')
        .style('font-size', txtSize + 'px')
        .attr('text-anchor', label[i].anchor)
        .attr('transform', 'translate(' + (label[i].x + off) + ',' + (label[i].y) + ')')
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', label[i].w)
        .attr('height', Math.min(box.h, line * schedB.blocks.length)) //  Math.min(box.h, line * schedB.blocks.length))
        .attr('fill', i % 2 === 0 ? colorPalette.dark.background : colorPalette.darker.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.1)
        .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    }

    let blockg = g.append('g').attr('transform', 'translate(' + 0 + ',' + (headerSize + 3) + ')')
    com.schedule.scrollBox = initScrollBox(com.main.tag + 'targetRessourceScroll', blockg, box, {enabled: false})
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
      let palette = blockStyle(d)
      let options = []
      let stillEditable = true

      let g = d3.select(this)
      g.attr('transform', 'translate(' + (0) + ',' + (line * i) + ')')
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.w)
        .attr('height', line)
        .attr('fill', colorPalette.darkest.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.1)
        .attr('stroke-dasharray', [0, box.w + line, box.w, line])
        .attr('fill-opacity', (com.schedule.editabled && !stillEditable) ? 0.7 : 0)

      g.append('rect')
        .attr('id', 'back')
        .attr('x', (label[0].w - line * 0.6) * 0.5 - 2)
        .attr('y', line * (1 - 0.6) * 0.5)
        .attr('width', line * 0.6)
        .attr('height', line * 0.6)
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
        function createInput (type, g, innerbox) {
          stock[type + 'MinusButton'] = new buttonD3()
          stock[type + 'MinusButton'].init({
            main: {
              id: type + 'MinusButton',
              g: g,
              box: {x: innerbox.x - 3, y: innerbox.y + 18, width: 9, height: 9},
              background: {
                common: {
                  style: {
                    fill: colorPalette.medium.background,
                    stroke: colorPalette.medium.stroke,
                    'stroke-width': 0.1
                  },
                  attr: {
                    rx: 2
                  }
                },
                hovered: {
                  style: {
                    fill: colorPalette.darkest.background,
                    stroke: colorPalette.darkest.stroke,
                    'stroke-width': 0.1
                  },
                  attr: {}
                }
              }
            },
            foreground: {
              type: 'text',
              value: '-',
              common: {
                style: {
                  font: 'bold',
                  'font-size': '9px',
                  fill: colorPalette.medium.text,
                  anchor: 'middle',
                  'pointer-events': 'none',
                  'user-select': 'none'
                },
                attr: {
                  x: innerbox.x - 3 + 3,
                  y: innerbox.y + 18 + 7
                }
              },
              hovered: {
                style: {
                  font: 'bold',
                  'font-size': '14px',
                  fill: colorPalette.medium.text,
                  anchor: 'start',
                  'pointer-events': 'none',
                  'user-select': 'none'
                },
                attr: {}
              }
            },
            events: {
              click: () => {
                let oldValue = parseInt(stock[type].property('value'))
                let newVal = oldValue
                if (oldValue > stock[type + 'Opts'].min) {
                  newVal = oldValue - 1
                } else {
                  newVal = stock[type + 'Opts'].max
                }
                stock[type].property('value', ('0' + newVal).slice(-2))
                changeBlockTime(d, id, stock.hour.property('value'), stock.minute.property('value'), stock.second.property('value'))
              }
            }
          })

          stock[type + 'PlusButton'] = new buttonD3()
          stock[type + 'PlusButton'].init({
            main: {
              id: type + 'PlusButton',
              g: g,
              box: {x: innerbox.x + 6, y: innerbox.y + 18, width: 9, height: 9},
              background: {
                common: {
                  style: {
                    fill: colorPalette.medium.background,
                    stroke: colorPalette.medium.stroke,
                    'stroke-width': 0.1
                  },
                  attr: {
                    rx: 2
                  }
                },
                hovered: {
                  style: {
                    fill: colorPalette.darkest.background,
                    stroke: colorPalette.darkest.stroke,
                    'stroke-width': 0.1
                  },
                  attr: {}
                }
              }
            },
            foreground: {
              type: 'text',
              value: '+',
              common: {
                style: {
                  font: 'bold',
                  'font-size': '9px',
                  fill: colorPalette.medium.text,
                  anchor: 'middle',
                  'pointer-events': 'none',
                  'user-select': 'none'
                },
                attr: {
                  x: innerbox.x + 6 + 2,
                  y: innerbox.y + 18 + 7
                }
              },
              hovered: {
                style: {
                  font: 'bold',
                  'font-size': '14px',
                  fill: colorPalette.medium.text,
                  anchor: 'start',
                  'pointer-events': 'none',
                  'user-select': 'none'
                },
                attr: {}
              }
            },
            events: {
              click: () => {
                let oldValue = parseInt(stock[type].property('value'))
                let newVal = oldValue
                if (oldValue < stock[type + 'Opts'].max) {
                  newVal = oldValue + 1
                } else {
                  newVal = stock[type + 'Opts'].min
                }
                stock[type].property('value', ('0' + newVal).slice(-2))
                changeBlockTime(d, id, stock.hour.property('value'), stock.minute.property('value'), stock.second.property('value'))
              }
            }
          })
        }

        let stock = {}
        let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
        let hbox = {
          x: x - 2,
          y: y + (com.schedule.editabled ? headerSize * 0.05 : headerSize * 0.35),
          w: 14,
          h: headerSize * 2
        }
        let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
        let mbox = {
          x: x + 20,
          y: y + (com.schedule.editabled ? headerSize * 0.05 : headerSize * 0.35),
          w: 14,
          h: headerSize * 2
        }
        let sec = ('0' + d3.timeFormat('%S')(time)).slice(-2)
        let sbox = {
          x: x + 42,
          y: y + (com.schedule.editabled ? headerSize * 0.05 : headerSize * 0.35),
          w: 14,
          h: headerSize * 2
        }

        let ig = g.append('g').attr('id', id)
          .attr('transform', 'translate(' + ((w - (14 * 3)) * 0.33) + ',0)')
        ig.append('rect')
          .attr('x', label[(id === 'startTime' ? 2 : (id === 'duration' ? 3 : 4))].x)
          .attr('y', 0)
          .attr('width', label[(id === 'startTime' ? 2 : (id === 'duration' ? 3 : 4))].w)
          .attr('height', line)
          .style('opacity', 0)
        let buttong = ig.append('g').style('opacity', 0.1)
        if (!(!com.schedule.editabled || !stillEditable)) {
          ig.on('mouseenter', function (d) {
            buttong.transition().duration(100).style('opacity', 1)
          })
            .on('mouseleave', function (d) {
              buttong.transition().duration(100).style('opacity', 0.1)
            })
        }
        stock.hourOpts = {disabled: !com.schedule.editabled, value: hour, min: 0, max: 23, step: 1}
        stock.hour = inputDateD3(ig,
          hbox,
          'hour',
          stock.hourOpts,
          {change: (dd) => { changeBlockTime(d, id, dd, stock.minute.property('value'), stock.second.property('value')) }, enter: (dd) => { stock.minute.node().focus() }})
        createInput('hour', buttong, hbox)
        ig.append('text')
          .text(':')
          .style('fill', colorPalette.dark.stroke)
          .style('font-size', headerSize + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (hbox.x + hbox.w + 0.5 + 2) + ',' + (y + headerSize * 1.1 + (com.schedule.editabled ? 0 : headerSize * 0.35)) + ')')
        stock.minuteOpts = {disabled: !com.schedule.editabled, value: min, min: 0, max: 60, step: 1}
        stock.minute = inputDateD3(ig,
          mbox,
          'minute',
          stock.minuteOpts,
          {change: (dd) => { changeBlockTime(d, id, stock.hour.property('value'), dd, stock.second.property('value')) }, enter: (d) => { stock.second.node().focus() }})
        createInput('minute', buttong, mbox)
        ig.append('text')
          .text(':')
          .style('fill', colorPalette.dark.stroke)
          .style('font-size', headerSize + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (mbox.x + mbox.w + 0.5 + 2) + ',' + (y + headerSize * 1.1 + (com.schedule.editabled ? 0 : headerSize * 0.35)) + ')')
        stock.secondOpts = {disabled: !com.schedule.editabled, value: sec, min: 0, max: 60, step: 1}
        stock.second = inputDateD3(ig,
          sbox,
          'second',
          stock.secondOpts,
          {change: (dd) => { changeBlockTime(d, id, stock.hour.property('value'), stock.minute.property('value'), dd) }, enter: (d) => { stock.second.node().blur() }})
        createInput('second', buttong, sbox)
      }
      // function drawTime (id, x, w, y, time) {
      //   let stock = {}
      //   let offY = y + ((!com.schedule.editabled || !stillEditable) ? line * 0.25 : 0)
      //   let hour = ('0' + d3.timeFormat('%H')(time)).slice(-2)
      //   let hbox = {
      //     x: x,
      //     y: offY,
      //     w: 14,
      //     h: headerSize * 2
      //   }
      //   let min = ('0' + d3.timeFormat('%M')(time)).slice(-2)
      //   let mbox = {
      //     x: x + 16,
      //     y: offY,
      //     w: 14,
      //     h: headerSize * 2
      //   }
      //   let sec = ('0' + d3.timeFormat('%S')(time)).slice(-2)
      //   let sbox = {
      //     x: x + 32,
      //     y: offY,
      //     w: 14,
      //     h: headerSize * 2
      //   }
      //
      //   let backg = g.append('g')
      //   if (!(!com.schedule.editabled || !stillEditable)) {
      //     backg.on('mouseenter', function (d) {
      //       stock.hour.nav.transition().duration(200).style('opacity', 1)
      //       stock.minute.nav.transition().duration(200).style('opacity', 1)
      //       stock.second.nav.transition().duration(200).style('opacity', 1)
      //     })
      //       .on('mouseleave', function (d) {
      //         stock.hour.nav.transition().duration(200).style('opacity', 0.1)
      //         stock.minute.nav.transition().duration(200).style('opacity', 0.1)
      //         stock.second.nav.transition().duration(200).style('opacity', 0.1)
      //       })
      //     backg.append('rect')
      //       .attr('x', label[(id === 'startTime' ? 2 : (id === 'duration' ? 3 : 4))].x)
      //       .attr('y', 0)
      //       .attr('width', label[(id === 'startTime' ? 2 : (id === 'duration' ? 3 : 4))].w)
      //       .attr('height', line)
      //       .style('opacity', 0)
      //   }
      //
      //   let ig = backg.append('g').attr('id', d.obId + id)
      //     .attr('transform', 'translate(' + ((w - (14 * 3)) * 0.33) + ',0)')
      //
      //   stock.hour = inputDate(ig,
      //     hbox,
      //     'hour',
      //     {disabled: (!com.schedule.editabled || !stillEditable), value: hour, min: 0, max: 23, step: 1, 'button-disabled': false},
      //     {change: (e) => { changeBlockTime(d, id, e, stock.minute.input.property('value'), stock.second.input.property('value')) }, enter: (d) => { stock.minute.input.node().focus() }})
      //   ig.append('text')
      //     .text(':')
      //     .style('fill', colorPalette.dark.stroke)
      //     .style('font-size', headerSize + 'px')
      //     .attr('text-anchor', 'middle')
      //     .attr('transform', 'translate(' + (hbox.x + hbox.w + 0.5) + ',' + (offY + line * 0.35) + ')')
      //   stock.minute = inputDate(ig,
      //     mbox,
      //     'minute',
      //     {disabled: (!com.schedule.editabled || !stillEditable), value: min, min: 0, max: 60, step: 1, 'button-disabled': false},
      //     {change: (e) => { changeBlockTime(d, id, stock.hour.input.property('value'), e, stock.second.input.property('value')) }, enter: (d) => { stock.second.input.node().focus() }})
      //   ig.append('text')
      //     .text(':')
      //     .style('fill', colorPalette.dark.stroke)
      //     .style('font-size', headerSize + 'px')
      //     .attr('text-anchor', 'middle')
      //     .attr('transform', 'translate(' + (mbox.x + mbox.w + 0.5) + ',' + (offY + line * 0.35) + ')')
      //   stock.second = inputDate(ig,
      //     sbox,
      //     'second',
      //     {disabled: (!com.schedule.editabled || !stillEditable), value: sec, min: 0, max: 60, step: 1, 'button-disabled': false},
      //     {change: (e) => { changeBlockTime(d, id, stock.hour.input.property('value'), stock.minute.input.property('value'), e) }, enter: (d) => { stock.second.input.node().blur() }})
      // }

      // let sbox = {
      //   x: label[1].x - 1,
      //   y: (com.schedule.editabled && !stillEditable) ? line * 0.15 : 0,
      //   w: label[1].w + 1,
      //   h: line
      // }
      // dropDownDiv(g,
      //   sbox,
      //   'state',
      //   {disabled: (!com.schedule.editabled || !stillEditable), value: d.exeState.state, options: options},
      //   {change: (e) => { changeState(d, e) }, enter: (e) => { changeState(d, e) }})
      if (d.exeState.state === 'wait') options = ['cancel', 'wait']
      if (d.exeState.state === 'cancel') options = ['cancel', 'wait']
      if (d.exeState.state === 'run') options = ['run', 'cancel']
      if (d.exeState.state === 'fail') {
        options = ['fail']
        stillEditable = false
      }
      if (d.exeState.state === 'done') {
        options = ['done']
        stillEditable = false
      }
      let gdropstate = g.append('g').attr('transform', 'translate(' + label[1].x + ',' + (0) + ')')
      let dropState = new dropDownD3()
      dropState.init({
        main: {
          id: 'dropState',
          g: gdropstate,
          dim: {w: label[1].w, h: line},
          background: {
            common: {
              style: {
                fill: colorPalette.medium.background,
                stroke: colorPalette.medium.stroke,
                'stroke-width': 0.2
              },
              attr: {}
            },
            hovered: {
              style: {
                fill: colorPalette.darkest.background,
                stroke: colorPalette.darkest.stroke,
                'stroke-width': 0.2
              },
              attr: {}
            }
          },
          text: {
            common: {
              style: {
                font: 'bold',
                'font-size': '14px',
                fill: colorPalette.medium.text,
                anchor: 'start',
                'pointer-events': 'none',
                'user-select': 'none'
              },
              attr: {}
            },
            hovered: {
              style: {
                font: 'bold',
                'font-size': '14px',
                fill: colorPalette.medium.text,
                anchor: 'start',
                'pointer-events': 'none',
                'user-select': 'none'
              },
              attr: {}
            }
          }
        },
        options: {
          value: d.exeState.state,
          blocked: false,
          keepDropOpen: false,
          list: options,
          dim: {w: label[1].w, h: line * 0.75},
          nb: 1,
          background: {
            common: {
              style: {
                fill: colorPalette.medium.background,
                stroke: colorPalette.medium.stroke,
                'stroke-width': 0.2
              },
              attr: {}
            },
            hovered: {
              style: {
                fill: colorPalette.darkest.background,
                stroke: colorPalette.darkest.stroke,
                'stroke-width': 0.2
              },
              attr: {}
            }
          },
          text: {
            common: {
              style: {
                font: 'bold',
                'font-size': '12px',
                fill: colorPalette.medium.text,
                anchor: 'start',
                'pointer-events': 'none',
                'user-select': 'none'
              },
              attr: {}
            },
            hovered: {
              style: {
                font: 'bold',
                'font-size': '12px',
                fill: colorPalette.medium.text,
                anchor: 'start',
                'pointer-events': 'none',
                'user-select': 'none'
              },
              attr: {}
            }
          }
        },
        events: {
          change: (dd) => { changeState(d, dd) }
        }
      })

      let startTime = new Date(com.data.timeOfNight.date_start)
      startTime.setSeconds(startTime.getSeconds() + d.time.start)
      let endTime = new Date(com.data.timeOfNight.date_start)
      endTime.setSeconds(endTime.getSeconds() + d.time.start + d.time.duration)
      let duration = new Date(endTime)
      duration.setHours(duration.getHours() - startTime.getHours())
      duration.setMinutes(duration.getMinutes() - startTime.getMinutes())
      duration.setSeconds(duration.getSeconds() - startTime.getSeconds())
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

    com.schedule.scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: line * schedB.blocks.length})
    box.h += headerSize + 3

    // if (box.h - headerSize - 3 > (line + 2) * schedB.blocks.length) return
    g.append('line')
      .attr('x1', box.x)
      .attr('y1', Math.min(box.h, headerSize + 3 + line * schedB.blocks.length))
      .attr('x2', box.w)
      .attr('y2', Math.min(box.h, headerSize + 3 + line * schedB.blocks.length))
      .attr('stroke', colorPalette.dark.stroke)
      .attr('stroke-width', 0.4)
  }
  function updateTimeInformation () {
    let schedB = com.data.schedB
    com.schedule.scrollBox.get('innerG')
      .selectAll('g.block')
      .each(function (d, i) {
        let palette = blockStyle(d)
        d3.select(this).select('rect#back')
          .attr('fill', palette.color.background)
      })
  }
  function createPointingInformation () {
    // let target = com.data.target
    let schedB = com.data.schedB
    let box = com.target.box
    let g = com.main.g.append('g')
      .attr('transform', 'translate(' + (box.x) + ',' + (box.y) + ')')
    com.schedule.g = g
    let line = 20
    let back = {enabled: false, fill: colorPalette.darker.background, stroke: colorPalette.darker.stroke, 'stroke-width': 0.2}

    // g.append('text')
    //   .text('Targets and pointings')
    //   .style('fill', colorPalette.dark.stroke)
    //   .style('font-weight', 'bold')
    //   .style('font-size', titleSize + 'px')
    //   .attr('text-anchor', 'start')
    //   .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    // g.append('line')
    //   .attr('x1', 0)
    //   .attr('y1', 2)
    //   .attr('x2', box.w * 1.0)
    //   .attr('y2', 2)
    //   .attr('stroke', colorPalette.dark.stroke)
    //   .attr('stroke-width', 0.2)

    // let label = [
    //   {x: 40, y: 3 + headerSize * 0.5 + txtSize * 0.3, w: box.w - 40, text: 'Targets', anchor: 'middle'}
    // ]
    // g.append('rect')
    //   .attr('id', 'headerStrip')
    //   .attr('x', label[0].x)
    //   .attr('y', 3)
    //   .attr('width', label[0].w)
    //   .attr('height', headerSize)
    //   .attr('fill', colorPalette.dark.stroke)
    // for (let i = 0; i < label.length; i++) {
    //   let off = label[i].anchor === 'middle' ? label[i].w * 0.5 : (label[i].anchor === 'end' ? label[i].w * 0.5 : 0)
    //   g.append('text')
    //     .text(label[i].text)
    //     .style('fill', colorPalette.medium.background)
    //     .style('font-weight', 'bold')
    //     .style('font-size', txtSize + 'px')
    //     .attr('text-anchor', label[i].anchor)
    //     .attr('transform', 'translate(' + (label[i].x + off) + ',' + (label[i].y) + ')')
    //   // g.append('rect')
    //   //   .attr('x', 0)
    //   //   .attr('y', 0)
    //   //   .attr('width', label[i].w)
    //   //   .attr('height', tbox.h + line)
    //   //   .attr('fill', i % 2 === 1 ? colorPalette.dark.background : colorPalette.darker.background)
    //   //   .attr('stroke', '#000000')
    //   //   .attr('stroke-width', 0.05)
    //   //   .attr('transform', 'translate(' + (i === 0 ? 0 : label[i].x) + ',' + (headerSize + 3) + ')')
    // }
    let trgtPnt = []
    let allTar = []
    let allPoint = []
    for (let j = 0; j < schedB.blocks.length; j++) {
      let data = schedB.blocks[j]
      for (let i = 0; i < data.pointings.length; i++) {
        let tar = trgtPnt.find(t => t.name === getPointingTarget(data.pointings[i]))
        if (tar) {
          tar.pointings.push(data.pointings[i])
        } else {
          tar = data.targets.find(t => t.name === getPointingTarget(data.pointings[i]))
          allTar.push(tar)
          tar.pointings = [data.pointings[i]]
          trgtPnt.push(tar)
        }
        allPoint.push(data.pointings[i])
      }
    }
    let gt = g.append('g')
      .attr('id', 'telsDisplayer')
      .attr('transform', 'translate(' + (42) + ',' + (headerSize + line + 14) + ')')
    com.targetBlock = new TargetDisplayer({
      main: {
        tag: 'targetRootTag',
        g: gt,
        scroll: {},
        box: {x: 0, y: 0, w: box.w - 43, h: box.h - (line + 20 + headerSize), marg: 0},
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
          box: {x: 0, y: 0, w: box.w - 43, h: box.h - (line + 20 + headerSize), marg: 0},
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

    let tbox = {x: 40, y: headerSize + line * 1.6, w: box.w - 40, h: line * 1.5}
    let blocktg = g.append('g').attr('transform', 'translate(' + tbox.x + ',' + tbox.y + ')')
    let scrollBoxt = initScrollBox(com.main.tag + 'targetListScroll', blocktg, tbox, back)
    let innertg = scrollBoxt.get('innerG')

    trgtPnt = []
    for (let j = 0; j < schedB.blocks.length; j++) {
      let data = schedB.blocks[j]
      for (let i = 0; i < data.pointings.length; i++) {
        let tar = trgtPnt.find(t => t.name === getPointingTarget(data.pointings[i]))
        if (tar) {
          if (!(data.obId in tar.pointings)) tar.pointings[data.obId] = []
          tar.pointings[data.obId].push(data.pointings[i])
        } else {
          tar = data.targets.find(t => t.name === getPointingTarget(data.pointings[i]))
          tar.pointings = {}
          tar.pointings[data.obId] = [data.pointings[i]]
          trgtPnt.push(tar)
        }
      }
    }
    function targetCore (targets, g, offset) {
      // let space = ((tbox.w * 1) - (targets.length * line)) / (targets.length)
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
        g.style('opacity', 0.5)
        let tevents = {
          click: function () { com.target.events.click('target', d.id) },
          over: function () {
            g.style('opacity', 1)
          },
          out: function () {
            g.style('opacity', 0.5)
          }
        }
        targetIcon(g, {w: line * 1, h: line * 1}, 'T' + getTargetShort(d), tevents, colorPalette)
      })
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        let offY = (tbox.h - line * 1.2) * 0.5
        g.attr('transform', 'translate(' + (tbox.w - (line + 2) * (i + 1)) + ',' + offY + ')')
        // g.attr('transform', 'translate(' + (space * 0.5 + (space + line) * i) + ',' + offY + ')')
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    targetCore(trgtPnt, innertg, 0)

    //
    //
    // let marg = line * 0.2
    // let interOffset = 0
    // let scrollHeight = 0
    //
    // let squareTemplate = {
    //   '1': [{x: 0.5, y: 0.5}],
    //   '2': [{x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}],
    //   '3': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.7}],
    //   '4': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
    //   '5': [{x: 0.3, y: 0.25}, {x: 0.7, y: 0.25}, {x: 0.5, y: 0.5}, {x: 0.3, y: 0.75}, {x: 0.7, y: 0.75}],
    //   '6': [{x: 0.3, y: 0.25}, {x: 0.7, y: 0.25}, {x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}, {x: 0.3, y: 0.75}, {x: 0.7, y: 0.75}],
    //   '7': [{x: 0.3, y: 0.25}, {x: 0.7, y: 0.25}, {x: 0.2, y: 0.5}, {x: 0.5, y: 0.5}, {x: 0.8, y: 0.5}, {x: 0.3, y: 0.75}, {x: 0.7, y: 0.75}],
    //   '8': [],
    //   '9': []
    // }
    // function pointingCore (pointings, pg, x, y, w, h) {
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
    //     w: Math.min(w / 3, 15),
    //     h: Math.min(h / 3, 10)
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
    //     let pevents = {
    //       click: function () {},
    //       over: function () {},
    //       out: function () {}
    //     }
    //     pointingIcon(g, {w: psize.w, h: psize.h}, '' + d.name.split('/')[1].split('_')[1].split('-')[1], pevents, colorPalette)
    //     scrollHeight += (marg + line * 0.9)
    //     // g.append('rect')
    //     //   .attr('x', 0)
    //     //   .attr('y', 0)
    //     //   .attr('width', w)
    //     //   .attr('height', h)
    //     //   .attr('fill', '#888888')
    //   })
    //   let merge = current.merge(enter)
    //   merge.each(function (d, i) {
    //     let g = d3.select(this)
    //     let pos = squareTemplate[pointings.length][i]
    //     g.attr('transform', 'translate(' + ((pos.x * w) - (psize.w * 0.5)) + ',' + ((pos.y * h) - (psize.h * 0.5)) + ')')
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
    //       over: function () {
    //
    //       },
    //       out: function () {}
    //     }
    //     targetIcon(g, {w: line * 1.1, h: line * 1.1}, '' + d.name.split('_')[1], tevents, colorPalette)
    //     scrollHeight += marg + line + 4
    //   })
    //   let merge = current.merge(enter)
    //   merge.each(function (d, i) {
    //     let g = d3.select(this)
    //     let offX = (label[0].x + label[0].w * 0.5 - line * 0.5)
    //     g.attr('transform', 'translate(' + offX + ',' + (space * 0.5 + (space + line) * i) + ')')
    //     // innerOffset += line
    //     for (var key in d.pointings) {
    //       pointingCore(d.pointings[key], g.append('g').attr('id', 'pointings' + key), pntsPos[key] - offX, -space * 0.5, spaceBlock + line, space + line)
    //     }
    //   })
    //   current
    //     .exit()
    //     .transition('inOut')
    //     .duration(timeD.animArc)
    //     .style('opacity', 0)
    //     .remove()
    // }
    // targetCore(trgtPnt, innerg, 0)
    // g.append('rect')
    //   .attr('id', 'headerStrip')
    //   .attr('x', 0)
    //   .attr('y', headerSize + line + 5)
    //   .attr('width', 40)
    //   .attr('height', headerSize)
    //   .attr('fill', colorPalette.dark.stroke)
    // g.append('text')
    //   .text('Pointings')
    //   .style('fill', colorPalette.medium.background)
    //   .style('font-weight', 'bold')
    //   .style('font-size', txtSize + 'px')
    //   .attr('text-anchor', 'middle')
    //   .attr('transform', 'translate(' + (20) + ',' + (headerSize * 1.5 + line + 5 + txtSize * 0.33) + ')')

    let pbox = {x: 0, y: headerSize * 2 + line + 5, w: 40, h: box.h - (headerSize * 2 + 10 + line)}
    let blockpg = g.append('g').attr('transform', 'translate(' + 0 + ',' + pbox.y + ')')
    let scrollBoxp = initScrollBox(com.main.tag + 'pointingListScroll', blockpg, pbox, back)
    let innerpg = scrollBoxp.get('innerG')

    let marg = 2
    let innerOffset = 0
    let scrollHeight = 0
    function pointingCore (block, pg, offset) {
      let pointings = block.pointings
      // let pointings = []
      // let linkbetween = {}
      // for (let i = 0; i < blocks.length; i++) {
      //   for (let j = 0; j < blocks[i].pointings.length; j++) {
      //     if (blocks[i].pointings[j].name.includes(target.name)) {
      //       pointings.push(blocks[i].pointings[j])
      //       linkbetween[blocks[i].pointings[j].name] = blocks[i].obId
      //     }
      //   }
      // }
      // allPoint = allPoint.concat(pointings)
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
          click: function () { com.schedule.events.click('block', block.obId) },
          over: function () {},
          out: function () {}
        }
        pointingIcon(g, {w: line * 1.2, h: line * 0.8}, 'P' + getPointingNumber(d), pevents, colorPalette)
      })
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', 'translate(' + (-line * 0.6) + ',' + (offset + (marg + line * 0.9) * i) + ')')
        innerOffset += marg + line * 0.9
        scrollHeight += marg + line * 0.9
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
      // offsetY += line * 1
    }
    function blockCore (blocks, maing, offset) {
      let current = maing
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
          .attr('width', line)
          .attr('height', line)
          .attr('fill', function () {
            return palette.color.background
          })
          .attr('stroke', palette.color.stroke)
          .attr('stroke-width', 0.1)
          .on('click', function () {
            com.schedule.events.click('block', d.obId)
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
        // g.append('rect')
        //   .attr('width', 12)
        //   .attr('height', 12)
        //   .attr('x', -line * 0.7)
        //   .attr('y', line * 0.4)
        //   .attr('fill', function () {
        //     return 'transparent'
        //   })
        //   .on('click', function () {
        //
        //   })
        //   .on('mouseover', function (d) {
        //     d3.select(this).attr('fill', d3.color(palette.color.background).darker(0.9))
        //   })
        //   .on('mouseout', function (d) {
        //     d3.select(this).attr('fill', 'transparent')
        //   })
        // g.append('svg:image')
        //   .attr('xlink:href', '/static/icons/up-triangle.svg')
        //   .attr('width', 10)
        //   .attr('height', 10)
        //   .attr('x', -line * 0.65)
        //   .attr('y', line * 0.44)
        //   .style('opacity', 1)
        //   .style('pointer-events', 'none')
      })
      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', 'translate(' + (line * 0.8) + ',' + (offset + innerOffset + line * i) + ')')
        innerOffset += line
        pointingCore(d, g, line + marg * 2)
        scrollHeight = (offset + innerOffset + line * i) + marg * 2
      })
      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    blockCore(com.data.schedB.blocks, innerpg, marg)
    scrollBoxp.resetVerticalScroller({canScroll: true, scrollHeight: scrollHeight})
  }
}
