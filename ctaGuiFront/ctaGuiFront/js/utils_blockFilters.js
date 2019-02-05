/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global getColorTheme */
/* global deepCopy */
/* global minMaxObj */
/* global loadScript */
/* global colsBlues */
/* global colsYellows */
/* global ButtonPanel */

loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollBox.js' })

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.BlockFilters = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  let template = {
    main: {
      tag: 'blockQueueFilterTag',
      g: undefined,
      box: {x: 0, y: 0, w: 1000, h: 300, marg: 0},
      background: {
        fill: colorTheme.brighter.background,
        stroke: colorTheme.brighter.stroke,
        strokeWidth: 0.5
      }
    },
    blocks: {
      colorPalette: {}
    },
    filters: {
      g: undefined,
      box: {},
      mode: 'states',
      top: {},
      middle: {},
      bottom: {}
    },
    filtering: [], // [{key: [], value: ''}]
    blockQueue: []
  }

  let com = {}
  com = optIn

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function setDefaultStyle () {
    if (com.style) return
    com.style = {}
    com.style.runRecCol = colsBlues[2]
    com.style.blockCol = function (optIn) {
      let state = hasVar(optIn.state)
        ? optIn.state
        : optIn.d.data.exeState.state
      let canRun = hasVar(optIn.canRun)
        ? optIn.canRun
        : optIn.d.data.exeState.canRun
      let modified = optIn.d.data.modifications ? optIn.d.data.modifications.userModifications.length > 0 : false

      if (state === 'wait') {
        if (modified) return com.blocks.colorPalette.wait
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
      let state = hasVar(optIn.state)
        ? optIn.state
        : optIn.d.data.exeState.state
      let canRun = hasVar(optIn.canRun)
        ? optIn.canRun
        : optIn.d.data.exeState.canRun
      let modified = optIn.d.data.modifications ? optIn.d.data.modifications.userModifications.length > 0 : false

      if (state === 'wait') {
        if (modified) return 0.2
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
  function init () {
    setDefaultStyle()
    initBackground()
    initFilters()
  }
  this.init = init

  function initBackground () {
    com.main.g.append('rect')
      .attr('class', 'background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', com.main.box.w)
      .attr('height', com.main.box.h)
      .style('fill', com.main.background.fill)
      .style('stroke', com.main.background.stroke)
      .style('stroke-width', com.main.background.strokeWidth)
  }
  function initFilters () {
    function changeMode (newMode) {
      if (newMode === 'states') {
        com.filters.mode = 'states'
        createStatesFilters()
      } else if (newMode === 'tels') {
        com.filters.mode = 'tels'
        createTelsFilters()
      } else if (newMode === 'targets') {
        com.filters.mode = 'targets'
        createTargetsFilsters()
      }
    }

    function recCol (state) {
      if (state === 'Wait') return com.blocks.colorPalette.wait
      else if (state === 'Done') return com.blocks.colorPalette.done
      else if (state === 'Run') {
        return com.blocks.colorPalette.run
      } else if (state === 'Cancel.canrun') {
        return com.blocks.colorPalette.cancelSys
      } else if (state === 'Cancel') {
        return com.blocks.colorPalette.cancelOp
      } else if (state === 'Fail') return com.blocks.colorPalette.fail
      else return com.blocks.colorPalette.shutdown
    }

    function createTop () {
      com.filters.top = {
        g: com.filters.g.append('g'),
        box: deepCopy(com.filters.box),
        childs: {}
      }
      com.filters.top.box.y = com.filters.top.box.y
      com.filters.top.box.h *= 0.15

      // com.filters.top.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', com.filters.top.box.y)
      //   .attr('width', com.filters.top.box.w)
      //   .attr('height', com.filters.top.box.h)
      //   .attr('fill', com.main.colorTheme.dark.background)
      //   .attr('stroke', com.main.colorTheme.dark.stroke)
      //   .attr('stroke-width', 0.2)

      com.filters.top.g.append('rect')
        .attr('x', 0)
        .attr('y', com.filters.top.box.y)
        .attr('width', com.filters.top.box.w * 0.32)
        .attr('height', com.filters.top.box.h * 0.9)
        .attr('fill', com.main.colorTheme.darker.background)
        .attr('stroke', com.main.colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
      com.filters.top.g.append('rect')
        .attr('x', com.filters.top.box.w * 0.34)
        .attr('y', com.filters.top.box.y)
        .attr('width', com.filters.top.box.w * 0.32)
        .attr('height', com.filters.top.box.h * 0.9)
        .attr('fill', com.main.colorTheme.darker.background)
        .attr('stroke', com.main.colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
      com.filters.top.g.append('rect')
        .attr('x', com.filters.top.box.w * 0.68)
        .attr('y', com.filters.top.box.y)
        .attr('width', com.filters.top.box.w * 0.32)
        .attr('height', com.filters.top.box.h * 0.9)
        .attr('fill', com.main.colorTheme.darker.background)
        .attr('stroke', com.main.colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
    }
    function createMiddle () {
      com.filters.middle = {
        g: com.filters.g.append('g'),
        box: deepCopy(com.filters.box),
        states: {},
        tels: {},
        targets: {}
      }
      com.filters.middle.box.x = 0
      com.filters.middle.box.y = com.filters.middle.box.y + com.filters.middle.box.h * 0.15
      com.filters.middle.box.h *= 0.67

      // com.filters.middle.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', com.filters.middle.box.w)
      //   .attr('height', com.filters.middle.box.h)
      //   .attr('fill', com.main.colorTheme.dark.background)
      //   .attr('stroke', com.main.colorTheme.dark.stroke)
      //   .attr('stroke-width', 0.2)
    }
    function createBottom () {
      com.filters.bottom = {
        g: com.filters.g.append('g'),
        box: deepCopy(com.filters.box),
        childs: {}
      }
      com.filters.bottom.box.y = com.filters.bottom.box.y + com.filters.bottom.box.h * 0.85
      com.filters.bottom.box.h *= 0.15

      com.filters.bottom.g.append('rect')
        .attr('x', 0)
        .attr('y', com.filters.bottom.box.y)
        .attr('width', com.filters.bottom.box.w * 0.2)
        .attr('height', com.filters.bottom.box.h)
        .attr('fill', com.main.colorTheme.dark.background)
        .attr('stroke', com.main.colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
    }
    function createGeneral () {
      com.filters.general = {
        g: com.filters.g.append('g'),
        box: deepCopy(com.filters.box),
        states: {},
        tels: {},
        targets: {}
      }
      com.filters.general.box.x = 0
      com.filters.general.box.y = com.filters.general.box.y + com.filters.general.box.h * 0.15
      com.filters.general.box.h *= 0.67

      // com.filters.general.g.append('rect')
      //   .attr('x', com.filters.general.box.w * 0.56)
      //   .attr('y', com.filters.general.box.w * 0.36)
      //   .attr('width', com.filters.general.box.w * 0.45)
      //   .attr('height', com.filters.general.box.w * 0.47)
      //   .attr('fill', com.main.colorTheme.medium.background)
      //   .attr('stroke', com.main.colorTheme.medium.stroke)
      //   .attr('stroke-width', 0.2)
      //   .attr('stroke-dasharray', [com.filters.general.box.w * 0.45, com.filters.general.box.w * 0.47, com.filters.general.box.w * 0.92])
      com.filters.general.g.append('rect')
        .attr('x', com.filters.general.box.w * 0.65)
        .attr('y', com.filters.general.box.w * 0.45)
        .attr('width', com.filters.general.box.w * 0.3)
        .attr('height', com.filters.general.box.w * 0.3)
        .attr('fill', com.main.colorTheme.medium.background)
        .attr('stroke', com.main.colorTheme.medium.stroke)
        .attr('stroke-width', 0.2)
      com.filters.general.g.append('rect')
        .attr('x', com.filters.general.box.w * 0.65)
        .attr('y', com.filters.general.box.w * 0.45)
        .attr('width', com.filters.general.box.w * 0.3)
        .attr('height', com.filters.general.box.w * 0.3)
        .attr('fill', 'transparent')
        .attr('stroke', com.main.colorTheme.medium.stroke)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', []) // [0, com.filters.middle.box.w * 0.15, com.filters.middle.box.w * 0.4, com.filters.middle.box.w * 0.65])
      com.filters.general.g.append('text')
        .text('20/20')
        .attr('x', com.filters.general.box.w * 0.8)
        .attr('y', com.filters.general.box.w * 0.6)
        .attr('dy', 7)
        .attr('stroke', com.main.colorTheme.darker.stroke)
        .attr('stroke-width', 0.0)
        .attr('fill', com.main.colorTheme.darker.stroke)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', '7px')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      com.filters.general.g.append('text')
        .text('100%')
        .attr('x', com.filters.middle.box.w * 0.8)
        .attr('y', com.filters.middle.box.w * 0.6)
        .attr('dy', -3)
        .attr('stroke', com.main.colorTheme.darker.stroke)
        .attr('stroke-width', 0.0)
        .attr('fill', com.main.colorTheme.darker.stroke)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', '8px')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
    }

    function createStatesFilters () {
      function createButton (position, type, filter) {
        let newButton = buttonPanel.addButton(position)
        newButton.attr('status', 'disabled')

        let clickFunction = function (rect) {
          if (newButton.attr('status') === 'enabled') {
            newButton.attr('status', 'disabled')
            rect.attr('stroke', function (d, i) {
              return '#000000'
            })
              .attr('stroke-width', 1.5)
            newButton.append('line')
              .attr('class', 'checkboxBar')
              .attr('x1', 0)
              .attr('y1', 0)
              .attr('x2', (Number(newButton.attr('width'))))
              .attr('y2', (Number(newButton.attr('height'))))
              .attr('stroke', '#000000')
              .style('stroke-opacity', 0.9)
              .attr('stroke-width', 2)
              .style('pointer-events', 'none')
            newButton.append('line')
              .attr('class', 'checkboxBar')
              .attr('x1', 0)
              .attr('y1', (Number(newButton.attr('height'))))
              .attr('x2', (Number(newButton.attr('width'))))
              .attr('y2', 0)
              .attr('stroke', '#000000')
              .style('stroke-opacity', 0.9)
              .attr('stroke-width', 2)
              .style('pointer-events', 'none')
          } else {
            newButton.attr('status', 'enabled')
            newButton.selectAll('line.checkboxBar').remove()
            rect.attr('stroke', function (d, i) {
              return '#000000'
            })
              .attr('stroke-width', 0.2)
              .style('stroke-opacity', 1)
          }
        }

        let newRect = newButton.append('rect')
          .attr('x', (Number(newButton.attr('width')) - ((Number(newButton.attr('width'))) * (3) / 3)) / 2)
          .attr('y', (Number(newButton.attr('height')) - ((Number(newButton.attr('height'))) * (3) / 3)) / 2)
          .attr('width', function (d, i) {
            return ((Number(newButton.attr('width'))) * (3) / 3)
          })
          .attr('height', function (d, i) {
            return ((Number(newButton.attr('height'))) * (3) / 3)
          })
          .attr('rx', 0)
          .attr('ry', 0)
          .attr('stroke', function (d, i) {
            return 'black'
          })
          .attr('stroke-width', 0.2)
          .style('fill', function (d, i) {
            return recCol(type).background
          })
          .style('fill-opacity', function (d, i) {
            return 1
          })
          .on('click', function () {
            clickFunction(d3.select(this))
          })
          .on('mouseover', function () {
            let ginfo = com.filters.g.append('g')
              .attr('class', 'info')
              .attr('transform', newButton.attr('transform'))
            ginfo.append('rect')
              .attr('x', -Number(newButton.attr('width')) * 0.5)
              .attr('y', -20)
              .attr('width', Number(newButton.attr('width')) * 2)
              .attr('height', 18)
              .attr('rx', 3)
              .attr('ry', 3)
              .attr('fill', '#eeeeee')
              .style('fill-opacity', 0.82)
            ginfo.append('text')
              .text(type)
              .attr('x', Number(newButton.attr('width')) * 0.5)
              .attr('y', -5)
              .style('fill-opacity', 0.82)
              .style('font-weight', 'normal')
              .attr('text-anchor', 'middle')
              .style('font-size', 16)
              .style('pointer-events', 'none')
              .style('user-select', 'none')

            newButton.attr('status-over', newButton.attr('status'))
            if (newButton.attr('status') === 'enabled') {
              addFiltering(filter)
            } else if (newButton.attr('status') === 'disabled') {
              removeFiltering(filter)
            }
          })
          .on('mouseout', function () {
            com.filters.g.select('g.info').remove()
            if (newButton.attr('status') !== newButton.attr('status-over')) {
              return
            } else if (newButton.attr('status') === 'disabled') {
              addFiltering(filter)
            } else if (newButton.attr('status') === 'enabled') {
              removeFiltering(filter)
            }
          })

        clickFunction(newRect, type)

        return newButton
      }
      let margin = {
        inner: 0.1,
        extern: 0.1
      }
      let buttonPanel = new ButtonPanel()
      buttonPanel.init({
        g: com.filters.middle.g,
        box: com.filters.middle.box,
        margin: margin,
        rows: 7,
        cols: 7,
        background: 'transparent',
        stroke: 'transparent'
      })

      com.filters.middle.g.append('text')
        .text('States filters')
        .attr('x', com.filters.middle.box.w * 0.5)
        .attr('y', com.filters.middle.box.h * 0.05)
        .attr('dy', 4)
        .attr('stroke', com.main.colorTheme.darker.stroke)
        .attr('stroke-width', 0.0)
        .attr('fill', com.main.colorTheme.darker.stroke)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', '8px')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      // for (let i = 0; i < 6; i++) {
      //   let newButton = buttonPanel.addButton({row: 4, col: i})
      //   newButton.append('text')
      //     .text('0')
      //     .attr('x', Number(newButton.attr('width')) * 0.5)
      //     .attr('y', Number(newButton.attr('height')) * 0.5)
      //     .attr('dy', 2)
      //     .style('font-weight', 'normal')
      //     .attr('text-anchor', 'middle')
      //     .style('font-size', '8px')
      // }
      // for (let i = 0; i < 5; i++) {
      //   com.filters.middle.g.append('text')
      //     .text('+')
      //     .attr('x', com.filters.middle.box.w * (0.14 * (i + 1) + 0.01))
      //     .attr('y', com.filters.middle.box.h * 0.92)
      //     .attr('dy', 0)
      //     .attr('stroke', com.main.colorTheme.darker.stroke)
      //     .attr('stroke-width', 0.0)
      //     .attr('fill', com.main.colorTheme.darker.stroke)
      //     .style('font-weight', 'normal')
      //     .attr('text-anchor', 'middle')
      //     .style('font-size', '8px')
      //     .style('pointer-events', 'none')
      //     .style('user-select', 'none')
      // }

      com.filters.middle.button = {
        Fail: createButton({row: 1, col: 3}, 'Fail', [{keys: ['exeState', 'state'], value: 'fail'}]),
        Done: createButton({row: 2, col: 3}, 'Done', [{keys: ['exeState', 'state'], value: 'done'}]),
        Run: createButton({row: 3, col: 3}, 'Run', [{keys: ['exeState', 'state'], value: 'run'}]),
        'Cancel.canrun': createButton({row: 4, col: 3}, 'Cancel.canrun', [{keys: ['exeState', 'state'], value: 'cancel'}, {keys: ['exeState', 'canRun'], value: true}]),
        Cancel: createButton({row: 5, col: 3}, 'Cancel', [{keys: ['exeState', 'state'], value: 'cancel'}, {keys: ['exeState', 'canRun'], value: false}]),
        Wait: createButton({row: 6, col: 3}, 'Wait', [{keys: ['exeState', 'state'], value: 'wait'}])
      }

      updateStatesFilters()
    }
    function updateStatesFilters () {
      for (let key in com.filters.middle.button) {
        let button = com.filters.middle.button[key]
        let box = {
          x: 0,
          y: 0,
          w: (Math.random() * 3) * Number(button.attr('width')),
          h: Number(button.attr('height'))
        }
        button.append('rect')
          .attr('x', -box.w)
          .attr('y', box.y + box.h * 0.1)
          .attr('width', box.w)
          .attr('height', box.h * 0.8)
          .attr('fill', recCol(key).background)
          .attr('stroke', com.main.colorTheme.medium.stroke)
          .attr('stroke-width', 0.2)
      }
    }
    function createTelsFilters () {

    }
    function createTargetsFilsters () {

    }

    com.filters.g = com.main.g.append('g')
      .attr('transform', 'translate(' + com.filters.box.x + ',' + com.filters.box.y + ')')

    createTop()
    createMiddle()
    createBottom()
    createGeneral()

    changeMode('states')
  }

  function addFiltering (filter) {
    com.filtering.push(filter)
    for (let i = com.blockQueue.length - 1; i > -1; i--) {
      com.blockQueue[i].addFiltering(filter)
    }
  }
  function removeFiltering (filter) {
    let index = com.filtering.indexOf(filter)
    com.filtering.splice(index, 1)
    for (let i = com.blockQueue.length - 1; i > -1; i--) {
      com.blockQueue[i].removeFiltering(filter)
    }
  }

  function plugBlockQueue (blockQueue, propagate) {
    com.blockQueue.push(blockQueue)
    if (propagate) blockQueue.plugBlockFilters(this, !propagate)
    for (let i = 0; i < com.filtering.length; i++) {
      blockQueue.addFiltering(com.filtering[i])
    }
  }
  this.plugBlockQueue = plugBlockQueue
  function unplugBlockQueue (blockQueue, propagate) {
    for (let i = com.blockQueue.length - 1; i > -1; i--) {
      if (com.blockQueue[i] === blockQueue) {
        com.blockQueue[i].remove()
      }
    }
    if (propagate) blockQueue.unplugBlockFilters(this, !propagate)
    for (let i = 0; i < com.filtering.length; i++) {
      blockQueue.removeFiltering(com.filtering[i])
    }
  }
  this.unplugBlockQueue = unplugBlockQueue
}
