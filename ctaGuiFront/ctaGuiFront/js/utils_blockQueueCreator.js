/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global colPrime */
/* global colsReds */
/* global deepCopy */
/* global minMaxObj */
/* global colsPurples */
/* global colsBlues */
/* global colsGreens */
/* global colsYellows */
/* global colsPurplesBlues */
/* global BlockQueue */
/* global getColorTheme */

window.loadScript({ source: 'BlockQueueCreator', script: '/js/utils_blockQueue.js' })

window.BlockQueueCreator = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  let template = {
    main: {
      tag: 'blockQueueRootTag',
      g: undefined,
      box: {x: 0, y: 0, w: 1000, h: 300, marg: 0},
      background: {
        fill: colorTheme.brighter.background,
        stroke: colorTheme.brighter.stroke,
        strokeWidth: 0.5
      }
    },
    axis: {
      enabled: true,
      g: undefined,
      box: {x: 0, y: 300, w: 1000, h: 0, marg: 0},
      axis: undefined,
      scale: undefined,
      domain: [0, 1000],
      range: [0, 0],
      showText: true,
      orientation: 'axisTop',
      attr: {
        text: {
          stroke: colorTheme.medium.stroke,
          fill: colorTheme.medium.background
        },
        path: {
          stroke: colorTheme.medium.stroke,
          fill: colorTheme.medium.background
        }
      }
    },
    blocks: {
      enabled: true,
      run: {
        enabled: true,
        g: undefined,
        box: {x: 0, y: 300 * 0.66, w: 1000, h: 300 * 0.34, marg: 0},
        events: {
          click: () => {},
          mouseover: () => {},
          mouseout: () => {},
          drag: {
            start: () => {},
            tick: () => {},
            end: () => {}
          }
        },
        background: {
          fill: colorTheme.brighter.background,
          stroke: 'none',
          strokeWidth: 0
        }
      },
      cancel: {
        enabled: true,
        g: undefined,
        box: {x: 0, y: 0, w: 1000, h: 300 * 0.2, marg: 0},
        events: {
          click: () => {},
          mouseover: () => {},
          mouseout: () => {},
          drag: {
            start: () => {},
            tick: () => {},
            end: () => {}
          }
        },
        background: {
          fill: colorTheme.brighter.background,
          stroke: colorTheme.brighter.stroke,
          strokeWidth: 0
        }
      },
      modification: {
        enabled: true,
        g: undefined,
        box: {x: 0, y: 300 * 0.24, w: 1000, h: 300 * 0.36, marg: 0},
        events: {
          click: () => {},
          mouseover: () => {},
          mouseout: () => {},
          drag: {
            start: () => {},
            tick: () => {},
            end: () => {}
          }
        },
        background: {
          fill: colorTheme.brighter.background,
          stroke: 'none',
          strokeWidth: 0
        }
      },
      colorPalette: colorTheme.blocks
    },
    filters: {
      enabled: false,
      g: undefined,
      box: {x: 0, y: 300 * 0.15, w: 1000 * 0.12, h: 300 * 0.7, marg: 0},
      filters: []
    },
    timeBars: {
      enabled: true,
      g: undefined,
      box: {x: 0, y: 0, w: 1000, h: 300, marg: 0}
    },
    time: {
      currentTime: {date: new Date(), time: 0},
      startTime: {date: new Date(), time: 0},
      endTime: {date: new Date(), time: 1000}
    },
    data: {
      raw: {
        blocks: [],
        telIds: []
      },
      formated: undefined,
      modified: []
    },
    debug: {
      enabled: false
    },
    pattern: {},
    event: {
    },
    input: {
      selection: []
    }
  }
  let com = {}
  com = optIn


  function setDefaultStyle () {
    com.style = {}
    com.style.runRecCol = colsBlues[2]
    com.style.blockCol = function (optIn) {
      if (optIn.d.data.endTime < com.time.currentTime.time) return com.blocks.colorPalette.shutdown
      let state = hasVar(optIn.state)
        ? optIn.state
        : optIn.d.data.exeState.state
      let canRun = hasVar(optIn.canRun)
        ? optIn.canRun
        : optIn.d.data.exeState.canRun
      let modified = optIn.d.data.modifications ?
        !(Object.keys(optIn.d.data.modifications.userModifications).length === 0 && optIn.d.data.modifications.userModifications.constructor === Object) :
        false

      if (state === 'wait') {
        if (modified) return {background: 'transparent', stroke: '#666666', text: '#666666'}
        return com.blocks.colorPalette.wait
      } else if (state === 'done') {
        return com.blocks.colorPalette.done
      } else if (state === 'fail') {
        return com.blocks.colorPalette.fail
      } else if (state === 'run') {
        return com.blocks.colorPalette.run
      } else if (state === 'cancel') {
        if (hasVar(canRun)) {
          if (!canRun) return com.blocks.colorPalette.cancelOp
        }
        return com.blocks.colorPalette.cancelSys
      } else return com.blocks.colorPalette.shutdown
    }
    com.style.blockOpac = function (optIn) {
      if (optIn.d.data.endTime < com.time.currentTime.time) return com.blocks.colorPalette.shutdown
      let state = hasVar(optIn.state)
        ? optIn.state
        : optIn.d.data.exeState.state
      let canRun = hasVar(optIn.canRun)
        ? optIn.canRun
        : optIn.d.data.exeState.canRun
      let modified = optIn.d.data.modifications ?
        !(Object.keys(optIn.d.data.modifications.userModifications).length === 0 && optIn.d.data.modifications.userModifications.constructor === Object) :
        false

      if (state === 'wait') {
        if (modified) return 0.8
        return 1
      } else if (state === 'run') {
        return 1
      } else if (state === 'cancel') {
        if (hasVar(canRun)) {
          if (!canRun) return 1
        }
        return 1
      } else return 1
    }
  }
  setDefaultStyle()

  function dragBlockStart (d) {
    com.interaction.firstDrag = false
  }
  function dragBlockTick (d) {
    let timeScale = d3.scaleLinear()
      .range(com.axis.range)
      .domain([com.time.startTime.time, com.time.endTime.time])
    if (!com.interaction.firstDrag) {
      com.interaction.firstDrag = true
      com.interaction.g = com.blocks.cancel.g.append('g')
      com.interaction.box = deepCopy(com.blocks.cancel.box)
      com.interaction.box.h = com.main.box.h
      com.interaction.mode = 'general'

      com.interaction.position = {
        width: timeScale(d.data.endTime) - timeScale(d.data.startTime),
        left: timeScale(d.data.startTime),
        right: timeScale(d.data.endTime)
      }
      com.interaction.firstMousecursor = d3.event
      com.interaction.mousecursor = d3.event

      // com.interaction.g.append('circle')
      //   .attr('cx', com.interaction.position.center)
      //   .attr('cy', com.interaction.box.h * 0.5)
      //   .attr('r', 3)
      //   .attr('fill', '#000000')
      com.interaction.g.append('rect')
        .attr('class', 'area')
        .attr('x', com.interaction.position.left)
        .attr('y', 0) // - Number(com.interaction.oldRect.attr('height')))
        .attr('width', com.interaction.position.right - com.interaction.position.left)
        .attr('height', com.interaction.box.h)
        .attr('fill', '#ffffff')
        .attr('stroke', 'none')
        .attr('fill-opacity', 0.2)
      com.interaction.g.append('line')
        .attr('class', 'left')
        .attr('x1', com.interaction.position.left)
        .attr('y1', 0)
        .attr('x2', com.interaction.position.left)
        .attr('y2', com.interaction.box.h)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', [com.interaction.box.h * 0.02, com.interaction.box.h * 0.02])
      com.interaction.g.append('line')
        .attr('class', 'right')
        .attr('x1', com.interaction.position.right)
        .attr('y1', 0)
        .attr('x2', com.interaction.position.right)
        .attr('y2', com.interaction.box.h)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', [com.interaction.box.h * 0.02, com.interaction.box.h * 0.02])
      // com.interaction.g.append('line')
      //   .attr('class', 'center')
      //   .attr('x1', com.interaction.position.left)
      //   .attr('y1', com.interaction.box.h * 0.5)
      //   .attr('x2', com.interaction.position.right)
      //   .attr('y2', com.interaction.box.h * 0.5)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 1)

      com.interaction.newG = com.interaction.g.selectAll('g.modifG')
        .data([d])
      let enter = com.interaction.newG
        .enter()
        .append('g')
        .attr('class', 'modifG')
        .attr('transform', 'translate(0,' +
          (com.blocks.cancel.box.h + com.blocks.modification.box.h - Number(com.interaction.oldG.select('rect.back').attr('height'))) +
          ')')
      enter.append('rect')
        .attr('class', 'modified')
        .attr('x', com.interaction.position.left)
        .attr('y', 0) // com.blocks.modification.box.y - com.blocks.run.box.h - Number(com.interaction.oldG.select('rect.back').attr('height')))
        .attr('width', com.interaction.position.right - com.interaction.position.left)
        .attr('height', Number(com.interaction.oldG.select('rect.back').attr('height')))
        .attr('fill', com.interaction.oldG.select('rect.back').style('fill'))
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5)
      enter.append('text')
        .attr('class', 'modified')
        .text(function (d, i) {
          return d.data.metaData.blockName
        })
        .style('font-weight', 'normal')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', function (d) {
          return '#000000'
        })
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', function (d) {
          return '#000000'
        })
        .attr('x', function (d, i) {
          return com.interaction.position.left + com.interaction.position.width * 0.5
        })
        .attr('y', function (d, i) {
          return (Number(com.interaction.oldG.select('rect.back').attr('height')) * 0.5)
        })
        .attr('text-anchor', 'middle')
        .style('font-size', function (d) {
          let minTxtSize = 11
          return Math.max(minTxtSize, Math.min(d.w, d.h)) / 3 + 'px'
        })
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
      com.interaction.newG = com.interaction.newG.merge(enter)
      com.interaction.g.append('rect')
        .attr('class', 'timelineCursor')
        .attr('x', com.interaction.position.left)
        .attr('y', com.main.box.h) // - Number(com.interaction.oldRect.attr('height')))
        .attr('width', com.interaction.position.right - com.interaction.position.left)
        .attr('height', 2)
        .attr('fill', '#CFD8DC')
        .attr('stroke', '#333333')
        .attr('fill-opacity', 0.99)

      let timelineG = com.interaction.g.append('g')
        .attr('class', 'timeline')
        .attr('transform', 'translate(' + (com.interaction.position.left) + ',' + com.main.box.h + ')')
      timelineG.append('rect')
        .attr('class', 'timelineOpacity')
        .attr('x', 0)
        .attr('y', 0) // - Number(com.interaction.oldRect.attr('height')))
        .attr('width', 40)
        .attr('height', 10)
        .attr('fill', '#CFD8DC')
        .attr('stroke', '#ffffff')
        .attr('fill-opacity', 0.9)
        .on('mouseover', function () {
          if (com.interaction.mode === 'precision') return
          com.interaction.yLimit = com.interaction.mousecursor.y
          com.interaction.finalTime = new Date(com.axis.scale.invert(com.interaction.position.left))
          com.interaction.mode = 'precision'

          function changeMinute (date, hour, min) {
            com.interaction.finalTime.setDate(date)
            com.interaction.finalTime.setHours(hour)
            com.interaction.finalTime.setMinutes(min)
            timelineG.select('text.minute')
              .text(function () {
                return d3.timeFormat('%M')(com.interaction.finalTime)
              })
            changePosition()
          }
          function changeSecond (sec) {
            com.interaction.finalTime.setSeconds(sec)
            timelineG.select('text.second')
              .text(function () {
                return d3.timeFormat('%S')(com.interaction.finalTime)
              })
            changePosition()
          }
          function changePosition () {
            com.interaction.g.select('line.left')
              .attr('x1', com.axis.scale(com.interaction.finalTime))
              .attr('x2', com.axis.scale(com.interaction.finalTime))
            com.interaction.g.select('line.right')
              .attr('x1', com.axis.scale(com.interaction.finalTime) + com.interaction.position.width)
              .attr('x2', com.axis.scale(com.interaction.finalTime) + com.interaction.position.width)
            com.interaction.newG.select('rect.modified')
              .attr('x', com.axis.scale(com.interaction.finalTime))
            com.interaction.newG.select('text.modified')
              .attr('x', com.axis.scale(com.interaction.finalTime) + com.interaction.position.width * 0.5)
            com.interaction.g.select('rect.area')
              .attr('x', com.axis.scale(com.interaction.finalTime))
          }

          timelineG.select('text.hour')
            .transition()
            .duration(600)
            .text(function () {
              return d3.timeFormat('%H:')(com.axis.scale.invert(com.interaction.position.left))
            })
            .attr('x', 15)
            .attr('y', 10.5)
            .style('font-weight', 'bold')
          timelineG.select('text.minute')
            .transition()
            .duration(600)
            .text(function () {
              return d3.timeFormat('%M')(com.axis.scale.invert(com.interaction.position.left))
            })
            .attr('x', 29)
            .attr('y', 6.5)
            .style('font-weight', 'bold').style('font-size', '7px')
          timelineG.append('text')
            .attr('class', 'second')
            .text(function () {
              return d3.timeFormat('%S')(com.axis.scale.invert(com.interaction.position.left))
            })
            .attr('x', 29)
            .attr('y', 13) // - Number(com.interaction.oldRect.attr('height')))
            .style('font-weight', 'bold')
            .style('opacity', 1)
            .style('fill-opacity', 0.7)
            .style('fill', '#000000')
            .style('stroke-width', 0.3)
            .style('stroke-opacity', 1)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .style('stroke', 'none')
            .attr('text-anchor', 'middle')
            .style('font-size', '7px')
            .attr('dy', '0px')

          d3.select(this)
            .transition()
            .duration(600)
            .attr('x', -70)
            .attr('width', 180)
            .attr('height', 25)
            .attr('fill-opacity', 1)
          let hourMinG = timelineG.append('g').attr('class', 'hourMin')
          for (let i = 1; i < 6; i++) {
            hourMinG.append('rect')
              .attr('class', function (d) {
                let date = new Date(com.axis.scale.invert(com.interaction.position.left))
                date.setMinutes(date.getMinutes() - i)
                return 'hourMin:' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes()
              })
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', 0)
              .attr('height', 15)
              .attr('fill', (i % 2 === 1 ? '#78909C' : '#546E7A'))
              .attr('stroke', 'none')
              .attr('fill-opacity', 0.4)
              .on('mouseover', function (d) {
                let newDate = Number(d3.select(this).attr('class').split(':')[1].split('-')[0])
                let newHour = Number(d3.select(this).attr('class').split(':')[1].split('-')[1])
                let newMin = Number(d3.select(this).attr('class').split(':')[1].split('-')[2])
                changeMinute(newDate, newHour, newMin)
                d3.select(this).attr('fill-opacity', 0.9)
              })
              .on('mouseout', function () {
                d3.select(this).attr('fill-opacity', 0.4)
              })
              .transition()
              .duration(600)
              .attr('x', 5.5 - 15 * i)
              .attr('width', 15)
            hourMinG.append('text')
              .attr('class', 'hourMin-' + i)
              .text(function () {
                let date = new Date(com.axis.scale.invert(com.interaction.position.left))
                date.setMinutes(date.getMinutes() - i)
                return d3.timeFormat(':%M')(date)
              })
              .attr('x', 20)
              .attr('y', 10)
              .style('font-weight', 'normal')
              .style('opacity', 1)
              .style('fill-opacity', 0)
              .style('fill', '#000000')
              .attr('vector-effect', 'non-scaling-stroke')
              .style('pointer-events', 'none')
              .style('stroke', 'none')
              .attr('text-anchor', 'middle')
              .style('font-size', '7px')
              .attr('dy', '0px')
              .transition()
              .duration(600)
              .style('fill-opacity', 0.7)
              .attr('x', 13 - 15 * i)
          }
          for (let i = 1; i < 6; i++) {
            hourMinG.append('rect')
              .attr('class', function (d) {
                let date = new Date(com.axis.scale.invert(com.interaction.position.left))
                date.setMinutes(date.getMinutes() + (i - 1))
                return 'hourMin:' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes()
              })
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', 0)
              .attr('height', 15)
              .attr('fill', (i % 2 === 1 ? '#78909C' : '#546E7A'))
              .attr('stroke', 'none')
              .attr('fill-opacity', 0.4)
              .on('mouseover', function (d) {
                let newDate = Number(d3.select(this).attr('class').split(':')[1].split('-')[0])
                let newHour = Number(d3.select(this).attr('class').split(':')[1].split('-')[1])
                let newMin = Number(d3.select(this).attr('class').split(':')[1].split('-')[2])
                changeMinute(newDate, newHour, newMin)
                d3.select(this).attr('fill-opacity', 0.9)
              })
              .on('mouseout', function () {
                d3.select(this).attr('fill-opacity', 0.4)
              })
              .transition()
              .duration(600)
              .attr('x', 19.5 + 15 * i)
              .attr('width', 15)
            hourMinG.append('text')
              .attr('class', 'hourMin+' + (i - 1))
              .text(function () {
                let date = new Date(com.axis.scale.invert(com.interaction.position.left))
                date.setMinutes(date.getMinutes() + (i - 1))
                return d3.timeFormat(':%M')(date)
              })
              .attr('x', 27 + 15 * i)
              .attr('y', 10) // - Number(com.interaction.oldRect.attr('height')))
              .style('font-weight', 'normal')
              .style('opacity', 1)
              .style('fill-opacity', 0.7)
              .style('fill', '#000000')
              .style('stroke-width', 0.3)
              .style('stroke-opacity', 1)
              .attr('vector-effect', 'non-scaling-stroke')
              .style('pointer-events', 'none')
              .style('stroke', 'none')
              .attr('text-anchor', 'middle')
              .style('font-size', '7px')
              .attr('dy', '0px')
          }
          for (let i = 0; i < 12; i++) {
            hourMinG.append('rect')
              .attr('class', function (d) {
                let date = new Date()
                date.setSeconds(5 * i)
                return 'hourSec:' + date.getSeconds()
              })
              .attr('x', 20)
              .attr('y', 14)
              .attr('width', 0)
              .attr('height', 12)
              .attr('fill', (i % 2 === 1 ? '#78909C' : '#78909C'))
              .attr('stroke', '#222222')
              .attr('stroke-width', 0.3)
              .attr('stroke-dasharray', [0, 5, 5, 8, 6, 21, 6, 3])
              .attr('fill-opacity', 0.4)
              .on('mouseover', function (d) {
                changeSecond(Number(d3.select(this).attr('class').split(':')[1]))
                d3.select(this).attr('fill-opacity', 1)
              })
              .on('mouseout', function () {
                d3.select(this).attr('fill-opacity', 0.4)
              })
              .transition()
              .duration(600)
              .attr('x', -62 - 8 + 15 * i)
              .attr('width', 15)
            hourMinG.append('text')
              .attr('class', 'Min_sec' + i)
              .text(function () {
                let date = new Date()
                date.setSeconds(5 * i)
                return d3.timeFormat(':%S')(date)
              })
              .attr('x', -62 + 15 * i)
              .attr('y', 22) // - Number(com.interaction.oldRect.attr('height')))
              .style('font-weight', 'normal')
              .style('opacity', 1)
              .style('fill-opacity', 0.7)
              .style('fill', '#000000')
              .style('stroke-width', 0.3)
              .style('stroke-opacity', 1)
              .attr('vector-effect', 'non-scaling-stroke')
              .style('pointer-events', 'none')
              .style('stroke', 'none')
              .attr('text-anchor', 'middle')
              .style('font-size', '7px')
              .attr('dy', '0px')
          }
        })
      timelineG.append('text')
        .attr('class', 'hour')
        .text(function () {
          return d3.timeFormat('%H:')(com.axis.scale.invert(com.interaction.position.left))
        })
        .attr('x', 15)
        .attr('y', 9) // - Number(com.interaction.oldRect.attr('height')))
        .style('font-weight', 'normal')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .attr('dy', '0px')
      timelineG.append('text')
        .attr('class', 'minute')
        .text(function () {
          return d3.timeFormat('%M')(com.axis.scale.invert(com.interaction.position.left))
        })
        .attr('x', 27)
        .attr('y', 9) // - Number(com.interaction.oldRect.attr('height')))
        .style('font-weight', 'normal')
        .style('opacity', 1)
        .style('fill-opacity', 0.7)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .attr('dy', '0px')

      com.interaction.oldG.select('rect.back').style('fill-opacity', 1)
      com.interaction.oldG.select('rect.back').style('stroke-opacity', 1)

      com.pattern.moved = {}
      com.pattern.moved.defs = com.main.g.append('defs')
      com.pattern.moved.pattern = com.pattern.moved.defs.append('pattern')
        .attr('id', 'patternMoved')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 8)
        .attr('height', 5)
        .attr('fill', '#ffffff')
        .attr('patternUnits', 'userSpaceOnUse')
      com.pattern.moved.pattern.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 8)
        .attr('y2', 5)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.6)
        .attr('stroke-opacity', 0.5)
      com.interaction.oldG.select('rect.pattern').style('fill', 'url(#patternMoved)')
    } else {
      let delta = {
        x: d3.event.x - com.interaction.mousecursor.x,
        y: d3.event.y - com.interaction.mousecursor.y
      }
      com.interaction.mousecursor = d3.event
      com.interaction.position.left += delta.x

      if (com.interaction.mode === 'general') {
        com.axis.g.selectAll('g.tick line')
          .attr('y2', function (d) {
            if (Math.abs(com.axis.scale(d) - com.interaction.position.left) < 20) {
              return 13
            }
            return 4
          })
        com.axis.g.selectAll('g.tick text')
          .attr('y', function (d) {
            if (Math.abs(com.axis.scale(d) - com.interaction.position.left) < 20) {
              return 14
            }
            return 6
          })
        if (Number(com.interaction.g.select('line.left').attr('x1')) + delta.x > 0 &&
          Number(com.interaction.g.select('line.right').attr('x1')) + delta.x < com.interaction.box.w) {
          if (delta.x > 0 &&
            com.interaction.mousecursor.x < (Number(com.interaction.g.select('line.left').attr('x1')) + Number(com.interaction.g.select('line.left').attr('x2'))) * 0.5) return
          if (delta.x < 0 &&
            com.interaction.mousecursor.x > (Number(com.interaction.g.select('line.left').attr('x1')) + Number(com.interaction.g.select('line.left').attr('x2'))) * 0.5) return
          com.interaction.g.select('line.left')
            .attr('x1', Number(com.interaction.g.select('line.left').attr('x1')) + delta.x)
            .attr('x2', Number(com.interaction.g.select('line.left').attr('x2')) + delta.x)
          com.interaction.g.select('line.right')
            .attr('x1', Number(com.interaction.g.select('line.right').attr('x1')) + delta.x)
            .attr('x2', Number(com.interaction.g.select('line.right').attr('x2')) + delta.x)
          com.interaction.newG.select('g rect.modified')
            .attr('x', Number(com.interaction.newG.select('g rect.modified').attr('x')) + delta.x)
          com.interaction.newG.select('g text.modified')
            .attr('x', Number(com.interaction.newG.select('g text.modified').attr('x')) + delta.x)
          com.interaction.g.select('rect.area')
            .attr('x', Number(com.interaction.g.select('rect.area').attr('x')) + delta.x)

          com.interaction.g.select('rect.timelineCursor')
            .attr('x', Number(com.interaction.g.select('rect.timelineCursor').attr('x')) + delta.x)
          com.interaction.g.select('g.timeline')
            .attr('transform', function () {
              let t = com.interaction.g.select('g.timeline').attr('transform')
              t = t.split(',')
              t[0] = Number(t[0].split('(')[1])
              t[1] = Number(t[1].split(')')[0])
              return 'translate(' + Number(com.interaction.g.select('line.left').attr('x1')) + ',' + t[1] + ')'
            })
          com.interaction.g.select('g.timeline text.hour').text(function () {
            return d3.timeFormat('%H:')(com.axis.scale.invert(com.interaction.position.left))
          })
          com.interaction.g.select('g.timeline text.minute').text(function () {
            return d3.timeFormat('%M')(com.axis.scale.invert(com.interaction.position.left))
          })
        }
      } else if (com.interaction.mode === 'precision') {
        if (com.interaction.mousecursor.y > (com.interaction.yLimit - 1)) return
        com.interaction.mode = 'general'
        com.interaction.g.select('g.timeline text.hour')
          .transition()
          .duration(600)
          .text(function () {
            return d3.timeFormat('%H:')(com.axis.scale.invert(com.interaction.position.left))
          })
          .attr('x', 15)
          .attr('y', 9)
          .style('font-weight', 'normal')
        com.interaction.g.select('g.timeline text.minute')
          .transition()
          .duration(600)
          .text(function () {
            return d3.timeFormat('%M')(com.axis.scale.invert(com.interaction.position.left))
          })
          .attr('x', 27)
          .attr('y', 9)
          .style('font-weight', 'normal').style('font-size', '10px')
        com.interaction.g.select('g.timeline text.second')
          .transition()
          .duration(600)
          .style('font-size', '0px')
          .style('opacity', 0)
          .remove()
        com.interaction.g.select('g.timeline rect.timelineOpacity')
          .transition()
          .duration(600)
          .attr('x', 0)
          .attr('width', 40)
          .attr('height', 10)
          .attr('fill-opacity', 0.9)
        com.interaction.g.select('g.timeline g.hourMin').remove()
      }
    }
  }
  function dragBlockEnd (d) {
    if (!com.interaction.firstDrag) return

    let timeScale = d3.scaleLinear()
      .range(com.axis.range)
      .domain([com.time.startTime.time, com.time.endTime.time])
    let newBlock = deepCopy(d)
    let newStart = Math.floor(timeScale.invert(com.interaction.newG.select('g rect.modified').attr('x')))
    let modif = {prop: 'startTime', old: newBlock.data.startTime, new: newStart}
    blockQueue.saveModificationAndUpdateBlock(newBlock, modif)
    // if (isGeneratingTelsConflict(newBlock)) {
    //   com.data.modified.conflict.push(newBlock)
    // } else {
    //   com.data.modified.integrated.push(newBlock)
    // }

    // com.interaction.oldG.select('rect.back')
    //   .style('fill-opacity', 0.1)
    //   .style('stroke-opacity', 0.1)
    //   .style('pointer-events', 'none')
    // com.interaction.oldG.remove()
    com.interaction.g.remove()
    com.interaction = {}
  }
  com.blocks.run.events.drag = {
    start: dragBlockStart,
    tick: dragBlockTick,
    end: dragBlockEnd
  }

  let blockQueue = new BlockQueue(com)
  blockQueue.sendModification = function (newBlock) {
    com.event.modifications('blockQueueCreator', newBlock.data)
  }
  blockQueue.saveModificationAndUpdateBlock = function (block, modif) {
    let tot = []
    for (let key in com.data.filtered) {
      tot = tot.concat(com.data.filtered[key])
    }

    function applyAllModification (modifiedBlock, modifs) {
      for (var key in modifs) {
        if (key === 'startTime') {
          let len = modifs[key].length - 1
          modifiedBlock.data.startTime = modifs[key][len].new
          modifiedBlock.data.endTime = modifs[key][len].new + modifiedBlock.data.duration
        }
      }
      return modifiedBlock
    }
    for (let i = 0; i < tot.length; i++) {
      if (tot[i].obId === block.data.obId) {
        if (!tot[i].modifications.userModifications[modif.prop]) tot[i].modifications.userModifications[modif.prop] = [{new: modif.new, old: modif.old}]
        else tot[i].modifications.userModifications[modif.prop].push({new: modif.new, old: modif.old})
        block = applyAllModification(block, tot[i].modifications.userModifications)
        block.data.modifications.userModifications = tot[i].modifications.userModifications
        blockQueue.sendModification(block)
      }
    }

    let insert = false
    for (let i = 0; i < com.data.modified.length; i++) {
      if (com.data.modified[i].id === block.id) {
        com.data.modified[i] = block
        insert = true
        break
      }
    }
    if (!insert) {
      com.data.modified.push(block.data)
    }
    blockQueue.updateBlocks()
  }
  blockQueue.shrink = function () {
    // com.blocks.run.g
    //   .transition()
    //   .duration(1000)
    //   .attr('transform', 'translate(' + com.blocks.run.box.x + ',' + com.blocks.modification.box.y + ')')
    com.blocks.modification.g
      .transition()
      .duration(500)
      .style('opacity', '0')
    // com.main.g.select('rect.background')
    //   .transition()
    //   .duration(1000)
    //   .attr('height', (com.blocks.run.box.h + com.blocks.modification.box.y))
    // com.axis.g
    //   .transition()
    //   .duration(1000)
    //   .attr('transform', 'translate(' + com.axis.box.x + ',' + (com.blocks.run.box.h + com.blocks.modification.box.y) + ')')
    com.axis.g
      // .transition()
      // .duration(1000)
      .style('opacity', 0)
  }
  return blockQueue
}
