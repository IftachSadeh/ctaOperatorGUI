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

window.loadScript({
  source: 'BlockQueueCreator',
  script: '/js/utils_blockQueue.js'
})

window.BlockQueueCreator = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  let template = {
    main: {
      tag: 'blockQueueRootTag',
      g: undefined,
      box: { x: 0, y: 0, w: 1000, h: 300, marg: 0 },
      background: {
        fill: colorTheme.brighter.background,
        stroke: colorTheme.brighter.stroke,
        strokeWidth: 0.5
      }
    },
    axis: {
      enabled: true,
      g: undefined,
      box: { x: 0, y: 300, w: 1000, h: 0, marg: 0 },
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
        box: { x: 0, y: 300 * 0.66, w: 1000, h: 300 * 0.34, marg: 0 },
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
        box: { x: 0, y: 0, w: 1000, h: 300 * 0.2, marg: 0 },
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
        box: { x: 0, y: 300 * 0.24, w: 1000, h: 300 * 0.36, marg: 0 },
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
      box: { x: 0, y: 300 * 0.15, w: 1000 * 0.12, h: 300 * 0.7, marg: 0 },
      filters: []
    },
    timeBars: {
      enabled: true,
      g: undefined,
      box: { x: 0, y: 0, w: 1000, h: 300, marg: 0 }
    },
    time: {
      currentTime: { date: new Date(), time: 0 },
      startTime: { date: new Date(), time: 0 },
      endTime: { date: new Date(), time: 1000 }
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
    event: {},
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
      if (optIn.d.data.endTime < com.time.currentTime.time) { return com.blocks.colorPalette.shutdown }
      let state = hasVar(optIn.state)
        ? optIn.state
        : optIn.d.data.exeState.state
      let canRun = hasVar(optIn.canRun)
        ? optIn.canRun
        : optIn.d.data.exeState.canRun
      let modified = optIn.d.data.modifications
        ? !(
          Object.keys(optIn.d.data.modifications.userModifications).length ===
              0 &&
            optIn.d.data.modifications.userModifications.constructor === Object
        )
        : false

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
      if (optIn.d.data.endTime < com.time.currentTime.time) { return com.blocks.colorPalette.shutdown }
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
  let blockQueue = new BlockQueue(com)
  blockQueue.initBackground = function () {
    com.main.g
      .append('rect')
      .attr('class', 'background')
      .attr('x', com.main.background.box ? com.main.background.box.x : 0)
      .attr('y', com.main.background.box ? com.main.background.box.y : 0)
      .attr(
        'width',
        com.main.background.box ? com.main.background.box.w : com.main.box.w
      )
      .attr(
        'height',
        com.main.background.box ? com.main.background.box.h : com.main.box.h
      )
      .style('fill', com.main.background.fill)
      .style('stroke', com.main.background.stroke)
      .style('stroke-width', com.main.background.strokeWidth)
    com.main.g
      .append('text')
      .attr('class', 'name')
      .text('SERVER SCHEDULE')
      .style('text-anchor', 'middle')
      .attr(
        'x',
        com.main.background.box
          ? com.main.background.box.x + com.main.background.box.w * 0.5
          : com.main.box.w * 0.5
      )
      .attr(
        'y',
        com.main.background.box
          ? com.main.background.box.y + com.main.background.box.h * 0.46 * 0.5
          : com.main.box.h * 0.46 * 0.5
      )
      .attr('dy', com.main.box.h * 0.1)
      .style('font-weight', 'bold')
      .style(
        'font-size',
        com.main.background.box
          ? com.main.background.box.x
          : com.main.box.h * 0.2
      )
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('fill', com.main.colorTheme.medium.background)
      .style('opacity', 1)
  }
  blockQueue.sendModification = function (blockId, modifs) {
    com.event.modifications('blockQueueCreator', blockId, modifs)
  }
  return blockQueue
}
