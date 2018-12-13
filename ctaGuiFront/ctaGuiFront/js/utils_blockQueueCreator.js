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
        if (modified) return com.blocks.colorPalette.critical
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
      let modified = optIn.d.data.modifications.modified

      if (state === 'wait') {
        if (modified) return 0.15
        return 1
      } else if (state === 'run') {
        if (modified) return 0.35
        return 1
      } else if (state === 'cancel') {
        if (hasVar(canRun)) {
          if (!canRun) return 1
        }
        return 1
      } else return 1
    }
  }
  // setDefaultStyle()
  // let dragCopy = deepCopy(com.blocks.run.events.drag)
  // function dragBlockStart (d) {
  //   if (d.data.endTime < com.time.currentTime.time) return
  //   com.interaction.firstDrag = false
  //   blockQueue.focusOnBlock(d.id)
  // }

  // function dragBlockTick (d) {
  //   if (d.data.endTime < com.time.currentTime.time) return
  //   let timeScale = d3.scaleLinear()
  //     .range(com.axis.range)
  //     .domain([com.time.startTime.time, com.time.endTime.time])
  //   if (!com.interaction.firstDrag) {
  //     dragCopy.start(d)
  //     com.interaction.firstDrag = true
  //     com.interaction.g = com.blocks.cancel.g.append('g')
  //     com.interaction.box = deepCopy(com.blocks.cancel.box)
  //     com.interaction.box.h = com.main.box.h
  //     com.interaction.mode = {}
  //     com.interaction.mode.current = 'general'
  //     com.interaction.mode.previous = 'general'
  //     com.interaction.topLimit = (com.blocks.cancel.box.y + com.blocks.cancel.box.h)
  //     com.interaction.bottomLimit = (com.blocks.run.box.y + com.blocks.run.box.h)
  //
  //     com.interaction.position = {
  //       width: timeScale(d.data.endTime) - timeScale(d.data.startTime),
  //       left: timeScale(d.data.startTime),
  //       right: timeScale(d.data.endTime)
  //     }
  //     com.interaction.mousecursor = d3.mouse(com.main.g._groups[0][0]) // [x, y]
  //     com.interaction.offset = com.interaction.mousecursor[0] - com.interaction.position.left
  //
  //     // com.interaction.g.append('circle')
  //     //   .attr('cx', com.interaction.position.center)
  //     //   .attr('cy', com.interaction.box.h * 0.5)
  //     //   .attr('r', 3)
  //     //   .attr('fill', '#000000')
  //     com.interaction.g.append('rect')
  //       .attr('class', 'area')
  //       .attr('x', com.interaction.position.left)
  //       .attr('y', 0) // - Number(com.interaction.oldRect.attr('height')))
  //       .attr('width', com.interaction.position.right - com.interaction.position.left)
  //       .attr('height', com.interaction.box.h)
  //       .attr('fill', '#ffffff')
  //       .attr('stroke', 'none')
  //       .attr('fill-opacity', 0.2)
  //     com.interaction.g.append('line')
  //       .attr('class', 'left')
  //       .attr('x1', com.interaction.position.left)
  //       .attr('y1', 0)
  //       .attr('x2', com.interaction.position.left)
  //       .attr('y2', com.interaction.box.h)
  //       .attr('stroke', '#000000')
  //       .attr('stroke-width', 0.5)
  //       .attr('stroke-dasharray', [com.interaction.box.h * 0.02, com.interaction.box.h * 0.02])
  //     com.interaction.g.append('line')
  //       .attr('class', 'right')
  //       .attr('x1', com.interaction.position.right)
  //       .attr('y1', 0)
  //       .attr('x2', com.interaction.position.right)
  //       .attr('y2', com.interaction.box.h)
  //       .attr('stroke', '#000000')
  //       .attr('stroke-width', 0.5)
  //       .attr('stroke-dasharray', [com.interaction.box.h * 0.02, com.interaction.box.h * 0.02])
  //
  //     com.interaction.newG = com.interaction.g.selectAll('g.modifG')
  //       .data([d])
  //     let enter = com.interaction.newG
  //       .enter()
  //       .append('g')
  //       .attr('class', 'modifG')
  //       .attr('transform', 'translate(0,' +
  //         (com.blocks.cancel.box.h + com.blocks.modification.box.h) +
  //         ')')
  //     enter.append('rect')
  //       .attr('class', 'modified')
  //       .attr('x', com.interaction.position.left)
  //       .attr('y', 0) // com.blocks.modification.box.y - com.blocks.run.box.h - Number(com.interaction.oldG.select('rect.back').attr('height')))
  //       .attr('width', com.interaction.position.right - com.interaction.position.left)
  //       .attr('height', Number(com.interaction.oldG.select('rect.back').attr('height')))
  //       .attr('fill', com.interaction.oldG.select('rect.back').style('fill'))
  //       .attr('stroke', '#000000')
  //       .attr('stroke-width', 0.5)
  //     enter.append('text')
  //       .attr('class', 'modified')
  //       .text(function (d, i) {
  //         return d.data.metaData.blockName
  //       })
  //       .style('font-weight', 'normal')
  //       .style('opacity', 1)
  //       .style('fill-opacity', 0.7)
  //       .style('fill', function (d) {
  //         return '#000000'
  //       })
  //       .style('stroke-width', 0.3)
  //       .style('stroke-opacity', 1)
  //       .attr('vector-effect', 'non-scaling-stroke')
  //       .style('pointer-events', 'none')
  //       .style('stroke', function (d) {
  //         return '#000000'
  //       })
  //       .attr('x', function (d, i) {
  //         return com.interaction.position.left + com.interaction.position.width * 0.5
  //       })
  //       .attr('y', function (d, i) {
  //         return (Number(com.interaction.oldG.select('rect.back').attr('height')) * 0.5)
  //       })
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', function (d) {
  //         let minTxtSize = 11
  //         return Math.max(minTxtSize, Math.min(d.w, d.h)) / 3 + 'px'
  //       })
  //       .attr('dy', function (d) {
  //         return d.size / 3 + 'px'
  //       })
  //     com.interaction.newG = com.interaction.newG.merge(enter)
  //     com.interaction.g.append('rect')
  //       .attr('class', 'timelineCursor')
  //       .attr('x', com.interaction.position.left)
  //       .attr('y', com.main.box.h) // - Number(com.interaction.oldRect.attr('height')))
  //       .attr('width', com.interaction.position.right - com.interaction.position.left)
  //       .attr('height', 2)
  //       .attr('fill', com.main.colorTheme.brighter.background)
  //       .attr('stroke', '#333333')
  //       .attr('fill-opacity', 0.99)
  //
  //     com.interaction.timelineG = com.interaction.g.append('g')
  //       .attr('class', 'timeline')
  //       .attr('transform', 'translate(' + (com.interaction.position.left) + ',' + (com.blocks.run.box.y + com.blocks.run.box.h) + ')')
  //     com.interaction.timelineG.append('rect')
  //       .attr('class', 'timelineOpacity')
  //       .attr('x', 0)
  //       .attr('y', 0) // - Number(com.interaction.oldRect.attr('height')))
  //       .attr('width', 40)
  //       .attr('height', 10)
  //       .attr('fill', com.main.colorTheme.brighter.background)
  //       .attr('stroke', '#ffffff')
  //       .attr('fill-opacity', 0.9)
  //       .on('mouseover', function () {})
  //     com.interaction.timelineG.append('text')
  //       .attr('class', 'hour')
  //       .text(function () {
  //         return d3.timeFormat('%H:')(com.axis.scale.invert(com.interaction.position.left))
  //       })
  //       .attr('x', 15)
  //       .attr('y', 9) // - Number(com.interaction.oldRect.attr('height')))
  //       .style('font-weight', 'normal')
  //       .style('opacity', 1)
  //       .style('fill-opacity', 0.7)
  //       .style('fill', '#000000')
  //       .style('stroke-width', 0.3)
  //       .style('stroke-opacity', 1)
  //       .attr('vector-effect', 'non-scaling-stroke')
  //       .style('pointer-events', 'none')
  //       .style('stroke', 'none')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', '10px')
  //       .attr('dy', '0px')
  //     com.interaction.timelineG.append('text')
  //       .attr('class', 'minute')
  //       .text(function () {
  //         return d3.timeFormat('%M')(com.axis.scale.invert(com.interaction.position.left))
  //       })
  //       .attr('x', 27)
  //       .attr('y', 9) // - Number(com.interaction.oldRect.attr('height')))
  //       .style('font-weight', 'normal')
  //       .style('opacity', 1)
  //       .style('fill-opacity', 0.7)
  //       .style('fill', '#000000')
  //       .style('stroke-width', 0.3)
  //       .style('stroke-opacity', 1)
  //       .attr('vector-effect', 'non-scaling-stroke')
  //       .style('pointer-events', 'none')
  //       .style('stroke', 'none')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', '10px')
  //       .attr('dy', '0px')
  //
  //     com.interaction.oldG.select('rect.back').style('fill-opacity', 1)
  //     com.interaction.oldG.select('rect.back').style('stroke-opacity', 1)
  //   }
  //   else {
  //     // let delta = {
  //     //   x: d3.mouse(com.main.g._groups[0][0])[0] - com.interaction.mousecursor[0],
  //     //   y: d3.mouse(com.main.g._groups[0][0])[1] - com.interaction.mousecursor[1]
  //     // }
  //     com.interaction.mousecursor = d3.mouse(com.main.g._groups[0][0])
  //     com.interaction.position.left = com.interaction.mousecursor[0] - com.interaction.offset
  //     com.interaction.position.right = com.interaction.position.left + com.interaction.position.width
  //
  //     com.interaction.mode.previous = com.interaction.mode.current
  //     com.interaction.mode.current = 'general'
  //     if (com.interaction.mousecursor[1] > (com.interaction.bottomLimit - 1)) com.interaction.mode.current = 'precision'
  //     else if (com.interaction.mousecursor[1] < (com.interaction.topLimit - 1)) com.interaction.mode.current = 'cancel'
  //
  //     if (com.interaction.mode.current === 'general' || com.interaction.mode.current === 'cancel') {
  //       if (com.interaction.mode.current === 'general' && com.interaction.mode.previous === 'cancel') {
  //         com.interaction.newG.select('g rect.modified').attr('fill', com.interaction.oldG.select('rect.back').style('fill'))
  //         com.interaction.newG.select('g rect.modified').attr('y', 0)
  //         com.interaction.newG.select('g rect.modified').attr('height', com.interaction.oldG.select('rect.back').attr('height'))
  //
  //         let text = {}
  //         text.y = Number(com.interaction.oldG.select('rect.back').attr('height')) * 0.5
  //         com.interaction.newG.select('g text.modified').attr('y', text.y)
  //         com.interaction.newG.select('g text.modified').style('font-size', '12px')
  //       } else if (com.interaction.mode.current === 'cancel' && com.interaction.mode.previous === 'general') {
  //         // com.interaction.newG.select('g rect.modified').attr('x', com.interaction.oldG.select('rect.back').attr('x'))
  //         com.interaction.newG.select('g rect.modified').attr('y', -com.blocks.run.box.h * 0.4)
  //         com.interaction.newG.select('g rect.modified').attr('height', 10)
  //         com.interaction.newG.select('g rect.modified').attr('fill', colorTheme.blocks.cancelOp.background)
  //
  //         let text = {}
  //         text.x = Number(com.interaction.oldG.select('rect.back').attr('x')) + Number(com.interaction.oldG.select('rect.back').attr('width')) * 0.5
  //         text.y = -com.blocks.run.box.h * 0.4 + 5
  //         // com.interaction.newG.select('g text.modified').attr('x', text.x)
  //         com.interaction.newG.select('g text.modified').attr('y', text.y)
  //         com.interaction.newG.select('g text.modified').style('font-size', '8px')
  //       }
  //
  //       if (d.data.exeState.state === 'run') return
  //
  //       if (com.interaction.mode.current === 'general' && com.interaction.mode.previous === 'precision') {
  //         com.interaction.offset = com.interaction.position.width * 0.5
  //         com.interaction.g.select('g.timeline text.hour')
  //           .transition()
  //           .duration(600)
  //           .text(function () {
  //             return d3.timeFormat('%H:')(com.axis.scale.invert(com.interaction.position.left))
  //           })
  //           .attr('x', 15)
  //           .attr('y', 9)
  //           .style('font-weight', 'normal')
  //         com.interaction.g.select('g.timeline text.minute')
  //           .transition()
  //           .duration(600)
  //           .text(function () {
  //             return d3.timeFormat('%M')(com.axis.scale.invert(com.interaction.position.left))
  //           })
  //           .attr('x', 27)
  //           .attr('y', 9)
  //           .style('font-weight', 'normal').style('font-size', '10px')
  //         com.interaction.g.select('g.timeline text.second')
  //           .transition()
  //           .duration(600)
  //           .style('font-size', '0px')
  //           .style('opacity', 0)
  //           .remove()
  //         com.interaction.g.select('g.timeline rect.timelineOpacity')
  //           .transition()
  //           .duration(600)
  //           .attr('x', 0)
  //           .attr('width', 40)
  //           .attr('height', 10)
  //           .attr('fill-opacity', 0.9)
  //         com.interaction.g.select('g.timeline g.hourMin').remove()
  //       }
  //       if (com.interaction.position.left > 0 &&
  //         com.interaction.position.right < com.interaction.box.w) {
  //         com.interaction.g.select('line.left')
  //           .attr('x1', com.interaction.position.left)
  //           .attr('x2', com.interaction.position.left)
  //         com.interaction.g.select('line.right')
  //           .attr('x1', com.interaction.position.right)
  //           .attr('x2', com.interaction.position.right)
  //         com.interaction.newG.select('g rect.modified')
  //           .attr('x', com.interaction.position.left)
  //         com.interaction.newG.select('g text.modified')
  //           .attr('x', com.interaction.position.left + com.interaction.position.width * 0.5)
  //         com.interaction.g.select('rect.area')
  //           .attr('x', com.interaction.position.left)
  //
  //         com.interaction.g.select('rect.timelineCursor')
  //           .attr('x', com.interaction.position.left)
  //         com.interaction.g.select('g.timeline')
  //           .attr('transform', function () {
  //             let t = com.interaction.g.select('g.timeline').attr('transform')
  //             t = t.split(',')
  //             t[0] = Number(t[0].split('(')[1])
  //             t[1] = Number(t[1].split(')')[0])
  //             return 'translate(' + Number(com.interaction.g.select('line.left').attr('x1')) + ',' + t[1] + ')'
  //           })
  //         com.interaction.g.select('g.timeline text.hour').text(function () {
  //           return d3.timeFormat('%H:')(com.axis.scale.invert(com.interaction.position.left))
  //         })
  //         com.interaction.g.select('g.timeline text.minute').text(function () {
  //           return d3.timeFormat('%M')(com.axis.scale.invert(com.interaction.position.left))
  //         })
  //       }
  //     }
  //     else if (com.interaction.mode.current === 'precision') {
  //       if (d.data.exeState.state === 'run') return
  //       if (com.interaction.mode.previous === 'general') {
  //         // com.interaction.yLimit = com.interaction.mousecursor.y
  //         com.interaction.finalTime = new Date(com.axis.scale.invert(com.interaction.position.left))
  //
  //         function changeMinute (date, hour, min) {
  //           com.interaction.finalTime.setDate(date)
  //           com.interaction.finalTime.setHours(hour)
  //           com.interaction.finalTime.setMinutes(min)
  //           com.interaction.timelineG.select('text.minute')
  //             .text(function () {
  //               return d3.timeFormat('%M')(com.interaction.finalTime)
  //             })
  //           changePosition()
  //         }
  //         function changeSecond (sec) {
  //           com.interaction.finalTime.setSeconds(sec)
  //           com.interaction.timelineG.select('text.second')
  //             .text(function () {
  //               return d3.timeFormat('%S')(com.interaction.finalTime)
  //             })
  //           changePosition()
  //         }
  //         function changePosition () {
  //           com.interaction.g.select('line.left')
  //             .attr('x1', com.axis.scale(com.interaction.finalTime))
  //             .attr('x2', com.axis.scale(com.interaction.finalTime))
  //           com.interaction.g.select('line.right')
  //             .attr('x1', com.axis.scale(com.interaction.finalTime) + com.interaction.position.width)
  //             .attr('x2', com.axis.scale(com.interaction.finalTime) + com.interaction.position.width)
  //           com.interaction.newG.select('rect.modified')
  //             .attr('x', com.axis.scale(com.interaction.finalTime))
  //           com.interaction.newG.select('text.modified')
  //             .attr('x', com.axis.scale(com.interaction.finalTime) + com.interaction.position.width * 0.5)
  //           com.interaction.g.select('rect.area')
  //             .attr('x', com.axis.scale(com.interaction.finalTime))
  //         }
  //
  //         com.interaction.timelineG.select('text.hour')
  //           .transition()
  //           .duration(600)
  //           .text(function () {
  //             return d3.timeFormat('%H:')(com.axis.scale.invert(com.interaction.position.left))
  //           })
  //           .attr('x', 15)
  //           .attr('y', 10.5)
  //           .style('font-weight', 'bold')
  //         com.interaction.timelineG.select('text.minute')
  //           .transition()
  //           .duration(600)
  //           .text(function () {
  //             return d3.timeFormat('%M')(com.axis.scale.invert(com.interaction.position.left))
  //           })
  //           .attr('x', 29)
  //           .attr('y', 6.5)
  //           .style('font-weight', 'bold').style('font-size', '7px')
  //         com.interaction.timelineG.append('text')
  //           .attr('class', 'second')
  //           .text(function () {
  //             return d3.timeFormat('%S')(com.axis.scale.invert(com.interaction.position.left))
  //           })
  //           .attr('x', 29)
  //           .attr('y', 13) // - Number(com.interaction.oldRect.attr('height')))
  //           .style('font-weight', 'bold')
  //           .style('opacity', 1)
  //           .style('fill-opacity', 0.7)
  //           .style('fill', '#000000')
  //           .style('stroke-width', 0.3)
  //           .style('stroke-opacity', 1)
  //           .attr('vector-effect', 'non-scaling-stroke')
  //           .style('pointer-events', 'none')
  //           .style('stroke', 'none')
  //           .attr('text-anchor', 'middle')
  //           .style('font-size', '7px')
  //           .attr('dy', '0px')
  //
  //         com.interaction.timelineG
  //           .transition()
  //           .duration(600)
  //           .attr('x', -70)
  //           .attr('width', 180)
  //           .attr('height', 25)
  //           .attr('fill-opacity', 1)
  //         let hourMinG = com.interaction.timelineG.append('g').attr('class', 'hourMin')
  //         for (let i = 1; i < 6; i++) {
  //           hourMinG.append('rect')
  //             .attr('class', function (d) {
  //               let date = new Date(com.axis.scale.invert(com.interaction.position.left))
  //               date.setMinutes(date.getMinutes() - i)
  //               return 'hourMin:' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes()
  //             })
  //             .attr('x', 0)
  //             .attr('y', 0)
  //             .attr('width', 0)
  //             .attr('height', 15)
  //             .attr('fill', (i % 2 === 1 ? com.main.colorTheme.darker.background : com.main.colorTheme.darker.background))
  //             .attr('stroke', 'none')
  //             .attr('fill-opacity', 0.4)
  //             .on('mouseover', function (d) {
  //               let newDate = Number(d3.select(this).attr('class').split(':')[1].split('-')[0])
  //               let newHour = Number(d3.select(this).attr('class').split(':')[1].split('-')[1])
  //               let newMin = Number(d3.select(this).attr('class').split(':')[1].split('-')[2])
  //               changeMinute(newDate, newHour, newMin)
  //               d3.select(this).attr('fill-opacity', 0.9)
  //             })
  //             .on('mouseout', function () {
  //               d3.select(this).attr('fill-opacity', 0.4)
  //             })
  //             .transition()
  //             .duration(600)
  //             .attr('x', 5.5 - 15 * i)
  //             .attr('width', 15)
  //           hourMinG.append('text')
  //             .attr('class', 'hourMin-' + i)
  //             .text(function () {
  //               let date = new Date(com.axis.scale.invert(com.interaction.position.left))
  //               date.setMinutes(date.getMinutes() - i)
  //               return d3.timeFormat(':%M')(date)
  //             })
  //             .attr('x', 20)
  //             .attr('y', 10)
  //             .style('font-weight', 'normal')
  //             .style('opacity', 1)
  //             .style('fill-opacity', 0)
  //             .style('fill', '#000000')
  //             .attr('vector-effect', 'non-scaling-stroke')
  //             .style('pointer-events', 'none')
  //             .style('stroke', 'none')
  //             .attr('text-anchor', 'middle')
  //             .style('font-size', '7px')
  //             .attr('dy', '0px')
  //             .transition()
  //             .duration(600)
  //             .style('fill-opacity', 0.7)
  //             .attr('x', 13 - 15 * i)
  //         }
  //         for (let i = 1; i < 6; i++) {
  //           hourMinG.append('rect')
  //             .attr('class', function (d) {
  //               let date = new Date(com.axis.scale.invert(com.interaction.position.left))
  //               date.setMinutes(date.getMinutes() + (i - 1))
  //               return 'hourMin:' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes()
  //             })
  //             .attr('x', 0)
  //             .attr('y', 0)
  //             .attr('width', 0)
  //             .attr('height', 15)
  //             .attr('fill', (i % 2 === 1 ? com.main.colorTheme.darker.background : com.main.colorTheme.darker.background))
  //             .attr('stroke', 'none')
  //             .attr('fill-opacity', 0.4)
  //             .on('mouseover', function (d) {
  //               let newDate = Number(d3.select(this).attr('class').split(':')[1].split('-')[0])
  //               let newHour = Number(d3.select(this).attr('class').split(':')[1].split('-')[1])
  //               let newMin = Number(d3.select(this).attr('class').split(':')[1].split('-')[2])
  //               changeMinute(newDate, newHour, newMin)
  //               d3.select(this).attr('fill-opacity', 0.9)
  //             })
  //             .on('mouseout', function () {
  //               d3.select(this).attr('fill-opacity', 0.4)
  //             })
  //             .transition()
  //             .duration(600)
  //             .attr('x', 19.5 + 15 * i)
  //             .attr('width', 15)
  //           hourMinG.append('text')
  //             .attr('class', 'hourMin+' + (i - 1))
  //             .text(function () {
  //               let date = new Date(com.axis.scale.invert(com.interaction.position.left))
  //               date.setMinutes(date.getMinutes() + (i - 1))
  //               return d3.timeFormat(':%M')(date)
  //             })
  //             .attr('x', 27 + 15 * i)
  //             .attr('y', 10) // - Number(com.interaction.oldRect.attr('height')))
  //             .style('font-weight', 'normal')
  //             .style('opacity', 1)
  //             .style('fill-opacity', 0.7)
  //             .style('fill', '#000000')
  //             .style('stroke-width', 0.3)
  //             .style('stroke-opacity', 1)
  //             .attr('vector-effect', 'non-scaling-stroke')
  //             .style('pointer-events', 'none')
  //             .style('stroke', 'none')
  //             .attr('text-anchor', 'middle')
  //             .style('font-size', '7px')
  //             .attr('dy', '0px')
  //         }
  //         for (let i = 0; i < 12; i++) {
  //           hourMinG.append('rect')
  //             .attr('class', function (d) {
  //               let date = new Date()
  //               date.setSeconds(5 * i)
  //               return 'hourSec:' + date.getSeconds()
  //             })
  //             .attr('x', 20)
  //             .attr('y', 14)
  //             .attr('width', 0)
  //             .attr('height', 12)
  //             .attr('fill', (i % 2 === 1 ? com.main.colorTheme.darker.background : com.main.colorTheme.darker.background))
  //             .attr('stroke', '#222222')
  //             .attr('stroke-width', 0.3)
  //             .attr('stroke-dasharray', [0, 5, 5, 8, 6, 21, 6, 3])
  //             .attr('fill-opacity', 0.4)
  //             .on('mouseover', function (d) {
  //               changeSecond(Number(d3.select(this).attr('class').split(':')[1]))
  //               d3.select(this).attr('fill-opacity', 1)
  //             })
  //             .on('mouseout', function () {
  //               d3.select(this).attr('fill-opacity', 0.4)
  //             })
  //             .transition()
  //             .duration(600)
  //             .attr('x', -62 - 8 + 15 * i)
  //             .attr('width', 15)
  //           hourMinG.append('text')
  //             .attr('class', 'Min_sec' + i)
  //             .text(function () {
  //               let date = new Date()
  //               date.setSeconds(5 * i)
  //               return d3.timeFormat(':%S')(date)
  //             })
  //             .attr('x', -62 + 15 * i)
  //             .attr('y', 22) // - Number(com.interaction.oldRect.attr('height')))
  //             .style('font-weight', 'normal')
  //             .style('opacity', 1)
  //             .style('fill-opacity', 0.7)
  //             .style('fill', '#000000')
  //             .style('stroke-width', 0.3)
  //             .style('stroke-opacity', 1)
  //             .attr('vector-effect', 'non-scaling-stroke')
  //             .style('pointer-events', 'none')
  //             .style('stroke', 'none')
  //             .attr('text-anchor', 'middle')
  //             .style('font-size', '7px')
  //             .attr('dy', '0px')
  //         }
  //       }
  //     }
  //   }
  //   dragCopy.tick(d)
  // }
  // function dragBlockEnd (d) {
  //   if (d.data.endTime < com.time.currentTime.time) return
  //   if (!com.interaction.firstDrag) return
  //
  //   let timeScale = d3.scaleLinear()
  //     .range(com.axis.range)
  //     .domain([com.time.startTime.time, com.time.endTime.time])
  //   let newBlock = deepCopy(d)
  //   let newStart = Math.floor(timeScale.invert(com.interaction.newG.select('g rect.modified').attr('x')))
  //   let modif = [{prop: 'startTime', old: newBlock.data.startTime, new: newStart}]
  //
  //   if (com.interaction.mode.current === 'cancel') {
  //     modif.push({prop: 'state', old: d.data.exeState.state, new: 'cancel'})
  //   }
  //
  //   blockQueue.sendModification(d.data.obId, modif)
  //   // blockQueue.saveModificationAndUpdateBlock(newBlock, modif)
  //   // if (isGeneratingTelsConflict(newBlock)) {
  //   //   com.data.modified.conflict.push(newBlock)
  //   // } else {
  //   //   com.data.modified.integrated.push(newBlock)
  //   // }
  //
  //   // com.interaction.oldG.select('rect.back')
  //   //   .style('fill-opacity', 0.1)
  //   //   .style('stroke-opacity', 0.1)
  //   //   .style('pointer-events', 'none')
  //   // com.interaction.oldG.remove()
  //   com.interaction.g.remove()
  //   com.interaction = {}
  //   dragCopy.end(d)
  // }
  // com.blocks.run.events.drag = {
  //   start: dragBlockStart,
  //   tick: dragBlockTick,
  //   end: dragBlockEnd
  // }

  let blockQueue = new BlockQueue(com)
  blockQueue.initBackground = function () {
    com.main.g.append('rect')
      .attr('class', 'background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', com.main.box.w)
      .attr('height', com.main.box.h)
      .style('fill', com.main.background.fill)
      .style('stroke', com.main.background.stroke)
      .style('stroke-width', com.main.background.strokeWidth)
    com.main.g.append('text')
      .attr('class', 'name')
      .text('CURRENT SCHEDULE')
      .style('text-anchor', 'middle')
      .attr('x', com.main.box.w * 0.5)
      .attr('y', com.main.box.h * 0.46 * 0.5)
      .attr('dy', com.main.box.h * 0.1)
      .style('font-weight', 'bold')
      .style('font-size', com.main.box.h * 0.2)
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('fill', com.main.colorTheme.medium.background)
      .style('opacity', 1)
  }
  blockQueue.sendModification = function (blockId, modifs) {
    com.event.modifications('blockQueueCreator', blockId, modifs)
  }
  // blockQueue.saveModificationAndUpdateBlock = function (block, modifs) {
  //   let tot = []
  //   for (let key in com.data.filtered) {
  //     tot = tot.concat(com.data.filtered[key])
  //   }
  //
  //   for (let i = 0; i < tot.length; i++) {
  //     if (tot[i].obId === block.data.obId) {
  //       for (let j = 0; j < modifs.length; j++) {
  //         if (!tot[i].modifications.userModifications[modifs[j].prop]) tot[i].modifications.userModifications[modifs[j].prop] = [{new: modifs[j].new, old: modifs[j].old}]
  //         else tot[i].modifications.userModifications[modifs[j].prop].push({new: modifs[j].new, old: modifs[j].old})
  //       }
  //       block = applyAllModification(block, tot[i].modifications.userModifications)
  //       block.data.modifications.userModifications = tot[i].modifications.userModifications
  //       console.log(block);
  //       blockQueue.sendModification(block)
  //     }
  //   }
  //   blockQueue.updateBlocks()
  // }
  return blockQueue
}
