/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global getColorTheme */
/* global deepCopy */
/* global loadScript */
/* global colsBlues */
/* global ButtonPanel */
/* global telInfo */
/* global ScrollBox */

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
    title: {
      g: undefined,
      box: {x: 0, y: 0, w: 0, h: 0}
    },
    states: {
      g: undefined,
      box: {x: 0, y: 0, w: 0, h: 0}
    },
    tels: {
      g: undefined,
      box: {x: 0, y: 0, w: 0, h: 0}
    },
    targets: {
      g: undefined,
      box: {x: 0, y: 0, w: 0, h: 0}
    },
    time: {
      g: undefined,
      box: {x: 0, y: 0, w: 0, h: 0}
    },
    result: {
      g: undefined,
      box: {x: 0, y: 0, w: 0, h: 0}
    },
    filters: [], // [{key: [], value: ''}]
    tokenFocus: {},
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
  function recCol (state) {
    if (state === 'wait') return com.blocks.colorPalette.wait
    else if (state === 'done') return com.blocks.colorPalette.done
    else if (state === 'run') {
      return com.blocks.colorPalette.run
    } else if (state === 'cancelO') {
      return com.blocks.colorPalette.cancelSys
    } else if (state === 'cancelS') {
      return com.blocks.colorPalette.cancelOp
    } else if (state === 'fail') return com.blocks.colorPalette.fail
    else return com.blocks.colorPalette.shutdown
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
    // if (com.main.mode === 'expert') {
    //   initEnabled()
    //   initContent()
    //   initDisabled()
    // } else
    if (com.main.mode === 'beginner') {
      initMiddle()
      initState()
      initTels()
      initTargets()
      initTime()
    }
  }
  this.init = init

  function initMiddle () {
    let b = com.beginner.middle.box
    com.beginner.middle.g.append('rect')
      .attr('x', b.x + (b.w * 0.5) - (b.w * 0.0725))
      .attr('y', b.y + (b.h * 0.5) - (b.w * 0.0725))
      .attr('width', (b.w * 0.15))
      .attr('height', (b.w * 0.15))
      .attr('fill', com.main.colorTheme.dark.background)
      .attr('stroke', com.main.colorTheme.dark.stroke)
      .attr('stroke-width', 0.4)
  }
  function initState () {
    function createButton (newButton, type, filter) {
      newButton.attr('status', 'disabled')
      if (com.beginner.states.token) {
        for (let i = 0; i < com.beginner.states.token.filtering.length; i++) {
          if (com.beginner.states.token.filtering[i].name === type) newButton.attr('status', 'enabled')
        }
      }

      let checkFunction = function (rect) {
        if (newButton.attr('status') === 'enabled') {
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
          newButton.selectAll('line.checkboxBar').remove()
          rect.attr('stroke', function (d, i) {
            return '#000000'
          })
            .attr('stroke-width', 0.2)
            .style('stroke-opacity', 1)
        }
      }
      let clickFunction = function (rect) {
        if (newButton.attr('status') === 'enabled') {
          newButton.attr('status', 'disabled')
          removeFiltering(filter)
          updateBlockQueue()
        } else {
          newButton.attr('status', 'enabled')
          addFiltering(filter)
          updateBlockQueue()
        }
      }
      function addFiltering (filter) {
        com.beginner.states.token.filtering.push(filter)
      }
      function removeFiltering (filter) {
        let index = com.beginner.states.token.filtering.indexOf(filter)
        com.beginner.states.token.filtering.splice(index, 1)
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
          checkFunction(d3.select(this))
        })
        .on('mouseover', function () {
          newButton.attr('status-over', newButton.attr('status'))
          if (newButton.attr('status') === 'enabled') {
            removeFiltering(filter)
            updateBlockQueue()
          } else if (newButton.attr('status') === 'disabled') {
            addFiltering(filter)
            updateBlockQueue()
          }
        })
        .on('mouseout', function () {
          // com.filters.g.select('g.info').remove()
          if (newButton.attr('status') === 'disabled') {
            removeFiltering(filter)
            updateBlockQueue()
          } else if (newButton.attr('status') === 'enabled') {
            addFiltering(filter)
            updateBlockQueue()
          }
        })
        // clickFunction(newRect)
      checkFunction(newRect)
      return newButton
    }
    com.beginner.states.g.append('text')
      .text('States')
      .attr('x', com.beginner.states.box.w * 0.5)
      .attr('y', com.beginner.states.box.h * 0.25)
      .attr('dy', 0)
      .attr('stroke', com.main.colorTheme.darker.stroke)
      .attr('stroke-width', 0.0)
      .attr('fill', com.main.colorTheme.darker.stroke)
      .style('font-weight', 'normal')
      .attr('text-anchor', 'middle')
      .style('font-size', '9')
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    let bBox = {x: com.beginner.states.box.w * 0.18, y: com.beginner.states.box.h * 0.5, w: (com.beginner.states.box.w * 0.98) / 6, h: (com.beginner.states.box.w * 0.98) / 6}
    let failG = com.beginner.states.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 0) + ',' + (bBox.y - bBox.h * 0.7) + ')')
    let doneG = com.beginner.states.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 1.5) + ',' + (bBox.y - bBox.h * 0.7) + ')')
    let runG = com.beginner.states.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 3) + ',' + (bBox.y - bBox.h * 0.7) + ')')
    let cancelOG = com.beginner.states.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 0) + ',' + (bBox.y + com.beginner.states.box.h * 0.2 - bBox.h * 0.5) + ')')
    let cancelSG = com.beginner.states.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 1.5) + ',' + (bBox.y + com.beginner.states.box.h * 0.2 - bBox.h * 0.5) + ')')
    let waitG = com.beginner.states.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 3) + ',' + (bBox.y + com.beginner.states.box.h * 0.2 - bBox.h * 0.5) + ')')
    com.beginner.states.button = {
      Fail: createButton(failG, 'fail', {name: 'fail', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'fail'}]}),
      Done: createButton(doneG, 'done', {name: 'done', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'done'}]}),
      Run: createButton(runG, 'run', {name: 'run', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'run'}]}),
      'Cancel.canrun': createButton(cancelOG, 'cancelO', {name: 'cancelO', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'cancel'}, {keys: ['exeState', 'canRun'], value: true}]}),
      Cancel: createButton(cancelSG, 'cancelS', {name: 'cancelS', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'cancel'}, {keys: ['exeState', 'canRun'], value: false}]}),
      Wait: createButton(waitG, 'wait', {name: 'wait', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'wait'}]})
    }
  }
  function initTels () {

  }
  function initTargets () {

  }
  function initTime () {

  }

  // function initBackground () {
  //   com.main.g.append('rect')
  //     .attr('class', 'background')
  //     .attr('x', 0)
  //     .attr('y', 0)
  //     .attr('width', com.main.box.w)
  //     .attr('height', com.main.box.h)
  //     .style('fill', com.main.background.fill)
  //     .style('stroke', com.main.background.stroke)
  //     .style('stroke-width', com.main.background.strokeWidth)
  // }
  // function initTitle () {
  //   if (!com.title.g) com.title.g = com.main.g.append('g')
  //
  //   // com.title.g.append('rect')
  //   //   .attr('x', com.title.box.x)
  //   //   .attr('y', com.title.box.y)
  //   //   .attr('width', com.title.box.w)
  //   //   .attr('height', com.title.box.h)
  //   //   .style('fill', '#bbbbbb')
  //
  //   com.title.g.append('text')
  //     .text('Blocks filtering')
  //     .attr('x', com.title.box.w * 0.025)
  //     .attr('y', com.title.box.y + com.title.box.h * 0.75)
  //     .attr('dy', 0)
  //     .attr('stroke', com.main.colorTheme.darker.stroke)
  //     .attr('stroke-width', 0.0)
  //     .attr('fill', com.main.colorTheme.darker.stroke)
  //     .style('font-weight', 'normal')
  //     .attr('text-anchor', 'start')
  //     .style('font-size', '10px')
  //     .style('pointer-events', 'none')
  //     .style('user-select', 'none')
  // }
  // function initEnabled () {
  //   com.enabled.g.attr('transform', 'translate(' + com.enabled.box.x + ',' + com.enabled.box.y + ')')
  //
  //   let scrollBox = {
  //     x: com.enabled.box.w * 0.0,
  //     y: com.enabled.box.h * 0.0,
  //     w: com.enabled.box.w * 1,
  //     h: com.enabled.box.h * 1
  //   }
  //   function initScrollBox () {
  //     com.enabled.scroll.scrollBoxG = com.enabled.g.append('g')
  //     com.enabled.scroll.scrollBoxG.append('rect')
  //       .attr('class', 'background')
  //       .attr('x', scrollBox.x)
  //       .attr('y', scrollBox.y)
  //       .attr('width', scrollBox.w)
  //       .attr('height', scrollBox.h)
  //       .style('fill', colorTheme.dark.background)
  //       .style('stroke', com.main.background.stroke)
  //       .style('stroke-width', 0.4)
  //     com.enabled.scroll.scrollBoxG.append('rect')
  //       .attr('class', 'background')
  //       .attr('x', scrollBox.x + 1)
  //       .attr('y', scrollBox.y + 1)
  //       .attr('width', scrollBox.w - 2)
  //       .attr('height', scrollBox.h - 2)
  //       .style('fill', colorTheme.medium.background)
  //       .style('stroke', com.main.background.stroke)
  //       .style('stroke-width', 0.4)
  //
  //     com.enabled.scroll.scrollBox = new ScrollBox()
  //     com.enabled.scroll.scrollBox.init({
  //       tag: 'blocksFiltersScroll',
  //       gBox: com.enabled.scroll.scrollBoxG,
  //       boxData: {
  //         x: scrollBox.x,
  //         y: scrollBox.y,
  //         w: scrollBox.w,
  //         h: scrollBox.h,
  //         marg: 0
  //       },
  //       useRelativeCoords: true,
  //       locker: new Locker(),
  //       lockerV: ['blocksFiltersScroll' + 'updateData'],
  //       lockerZoom: {
  //         all: 'ScrollBox' + 'zoom',
  //         during: 'ScrollBox' + 'zoomDuring',
  //         end: 'ScrollBox' + 'zoomEnd'
  //       },
  //       runLoop: new RunLoop({tag: 'blocksFiltersScroll'}),
  //       canScroll: true,
  //       scrollVertical: com.enabled.scroll.direction === 'vertical',
  //       scrollHorizontal: com.enabled.scroll.direction === 'horizontal',
  //       scrollHeight: scrollBox.h + 0.01,
  //       scrollWidth: scrollBox.w + 0.01,
  //       background: 'transparent',
  //       scrollRecH: {h: 2},
  //       scrollRecV: {w: 2}
  //     })
  //     com.enabled.scroll.scrollG = com.enabled.scroll.scrollBox.get('innerG')
  //   }
  //   initScrollBox()
  //   updateEnabled()
  // }
  // function updateEnabled () {
  //   let dim = {
  //     x: com.enabled.box.h * 0.15,
  //     y: com.enabled.box.h * 0.15,
  //     w: com.enabled.box.h * 0.7,
  //     h: com.enabled.box.h * 0.7
  //   }
  //   let tokens = com.enabled.scroll.scrollG
  //     .selectAll('g.token')
  //     .data(com.filters, function (d) {
  //       return d.id
  //     })
  //   let enterTokens = tokens
  //     .enter()
  //     .append('g')
  //     .attr('class', 'token')
  //     .attr('transform', function (d, i) {
  //       let nLine = parseInt(com.enabled.box.w / (dim.x + dim.w))
  //       let translate = {
  //         y: dim.y + (dim.h + dim.y) * parseInt(i / nLine),
  //         x: dim.x + ((dim.w + dim.x) * (i % nLine))
  //       }
  //       return 'translate(' + translate.x + ',' + translate.y + ')'
  //     })
  //   enterTokens.each(function (d, i) {
  //     d3.select(this).append('rect')
  //       .attr('x', 0)
  //       .attr('y', 0)
  //       .attr('width', dim.w)
  //       .attr('height', dim.h)
  //       .attr('fill', com.main.colorTheme.darker.background)
  //       .attr('fill-opacity', 1)
  //       .attr('stroke', colorTheme.darker.stroke)
  //       .attr('stroke-width', 0.4)
  //       .on('click', function () {
  //         com.tokenFocus = d
  //         if (d.type === 'states') createStatesFilters({token: d})
  //         else if (d.type === 'tels') createTelsFilters({token: d})
  //         else if (d.type === 'targets') createTargetsFilter({token: d})
  //         else if (d.type === 'tume') createTimeFilters({token: d})
  //       })
  //     d3.select(this).append('text')
  //       .text(function (d) {
  //         return d.type
  //       })
  //       .attr('x', dim.w * 0.5)
  //       .attr('y', dim.h * 0.75)
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', '6.5px')
  //       .style('pointer-events', 'none')
  //       .attr('fill', colorTheme.darker.text)
  //       .attr('stroke', 'none')
  //   })
  //
  //   let mergeTokens = enterTokens.merge(tokens)
  //   mergeTokens.each(function (d, i) {
  //     d3.select(this)
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('transform', function (d) {
  //         let nLine = parseInt(com.enabled.box.w / (dim.x + dim.w))
  //         let translate = {
  //           y: dim.y + (dim.h + dim.y) * parseInt(i / nLine),
  //           x: dim.x + ((dim.w + dim.x) * (i % nLine))
  //         }
  //         return 'translate(' + translate.x + ',' + translate.y + ')'
  //       })
  //   })
  //
  //   com.enabled.scroll.scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: 0})
  // }

  // function initDisabled () {
  //   com.disabled.g.attr('transform', 'translate(' + com.disabled.box.x + ',' + com.disabled.box.y + ')')
  //
  //   let scrollBox = {
  //     x: com.disabled.box.w * 0.0,
  //     y: com.disabled.box.h * 0.0,
  //     w: com.disabled.box.w * 1,
  //     h: com.disabled.box.h * 1
  //   }
  //   function initScrollBox () {
  //     com.disabled.scroll.scrollBoxG = com.disabled.g.append('g')
  //     com.disabled.scroll.scrollBoxG.append('rect')
  //       .attr('class', 'background')
  //       .attr('x', scrollBox.x)
  //       .attr('y', scrollBox.y)
  //       .attr('width', scrollBox.w)
  //       .attr('height', scrollBox.h)
  //       .style('fill', com.main.colorTheme.dark.background)
  //       .style('stroke', com.main.colorTheme.dark.stroke)
  //       .style('stroke-width', 0.4)
  //     com.disabled.scroll.scrollBoxG.append('rect')
  //       .attr('class', 'background')
  //       .attr('x', scrollBox.x + 1)
  //       .attr('y', scrollBox.y + 1)
  //       .attr('width', scrollBox.w - 2)
  //       .attr('height', scrollBox.h - 2)
  //       .style('fill', com.main.colorTheme.medium.background)
  //       .style('stroke', com.main.colorTheme.darker.stroke)
  //       .style('stroke-width', 0.4)
  //
  //     com.disabled.scroll.scrollBox = new ScrollBox()
  //     com.disabled.scroll.scrollBox.init({
  //       tag: 'blocksFiltersScroll',
  //       gBox: com.disabled.scroll.scrollBoxG,
  //       boxData: {
  //         x: scrollBox.x,
  //         y: scrollBox.y,
  //         w: scrollBox.w,
  //         h: scrollBox.h,
  //         marg: 0
  //       },
  //       useRelativeCoords: true,
  //       locker: new Locker(),
  //       lockerV: ['blocksFiltersScroll' + 'updateData'],
  //       lockerZoom: {
  //         all: 'ScrollBox' + 'zoom',
  //         during: 'ScrollBox' + 'zoomDuring',
  //         end: 'ScrollBox' + 'zoomEnd'
  //       },
  //       runLoop: new RunLoop({tag: 'blocksFiltersScroll'}),
  //       canScroll: true,
  //       scrollVertical: com.disabled.scroll.direction === 'vertical',
  //       scrollHorizontal: com.disabled.scroll.direction === 'horizontal',
  //       scrollHeight: scrollBox.h + 0.01,
  //       scrollWidth: scrollBox.w + 0.01,
  //       background: 'transparent',
  //       scrollRecH: {h: 2},
  //       scrollRecV: {w: 2}
  //     })
  //     com.disabled.scroll.scrollG = com.disabled.scroll.scrollBox.get('innerG')
  //   }
  //   initScrollBox()
  //   updateDisabled()
  // }
  // function updateDisabled () {
  //   let dim = {
  //     x: com.enabled.box.w * 0.0,
  //     y: com.enabled.box.w * 0.9,
  //     w: com.enabled.box.w * 0.8,
  //     h: com.enabled.box.w * 0.8
  //   }
  //   let tokens = com.enabled.scroll.scrollG
  //     .selectAll('g.token')
  //     .data(com.filters, function (d) {
  //       return d.id
  //     })
  //   let enterTokens = tokens
  //     .enter()
  //     .append('g')
  //     .attr('class', 'token')
  //     .attr('transform', function (d, i) {
  //       let translate = {
  //         y: dim.y * i,
  //         x: dim.x
  //       }
  //       return 'translate(' + translate.x + ',' + translate.y + ')'
  //     })
  //   enterTokens.each(function (d, i) {
  //     d3.select(this).append('rect')
  //       .attr('x', 0)
  //       .attr('y', 0)
  //       .attr('width', dim.w)
  //       .attr('height', dim.h)
  //       .attr('fill', '#999999')
  //       .attr('fill-opacity', 1)
  //       .attr('stroke', colorTheme.dark.stroke)
  //       .attr('stroke-width', 0.2)
  //       .on('click', function () {
  //         com.tokenFocus = d
  //         if (d.type === 'states') createStatesFilters({token: d})
  //         else if (d.type === 'tels') createTelsFilters({token: d})
  //         else if (d.type === 'targets') createTargetsFilter({token: d})
  //         else if (d.type === 'tume') createTimeFilters({token: d})
  //       })
  //     d3.select(this).append('text')
  //       .text(function (d) {
  //         return d.type
  //       })
  //       .attr('x', dim.w * 0.5)
  //       .attr('y', dim.h * 0.75)
  //       .style('font-weight', 'normal')
  //       .attr('text-anchor', 'middle')
  //       .style('font-size', '6.5px')
  //       .style('pointer-events', 'none')
  //       .attr('fill', colorTheme.darker.text)
  //       .attr('stroke', 'none')
  //   })
  //
  //   let mergeTokens = enterTokens.merge(tokens)
  //   mergeTokens.each(function (d, i) {
  //     d3.select(this)
  //       .transition()
  //       .duration(timeD.animArc)
  //       .attr('transform', function () {
  //         let translate = {
  //           y: dim.y * i,
  //           x: dim.x
  //         }
  //         return 'translate(' + translate.x + ',' + translate.y + ')'
  //       })
  //   })
  //
  //   com.enabled.scroll.scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: 0})
  // }
  // function initContent () {
  //   com.content.g.attr('transform', 'translate(' + (com.content.box.x) + ',' + (com.content.box.y) + ')')
  //   com.content.g.append('rect')
  //     .attr('x', 0)
  //     .attr('y', 0)
  //     .attr('width', com.content.box.w)
  //     .attr('height', com.content.box.h)
  //     .style('fill', com.main.colorTheme.dark.background)
  //     .style('stroke', com.main.colorTheme.dark.stroke)
  //     .style('stroke-width', 0.4)
  //   com.content.g.append('rect')
  //     .attr('x', 1.5)
  //     .attr('y', 1.5)
  //     .attr('width', com.content.box.w - 3)
  //     .attr('height', com.content.box.h - 3)
  //     .style('fill', com.main.colorTheme.medium.background)
  //     .style('stroke', com.main.colorTheme.medium.stroke)
  //     .style('stroke-width', 0.4)
  //
  //   com.content.panel.g = com.content.g.append('g')
  //   com.content.button.g = com.content.g.append('g')
  //   let addButtonBox = {
  //     x: com.content.box.w * 0.0 + 1,
  //     y: com.content.box.w * 0.0,
  //     w: com.content.box.w * 0.1,
  //     h: com.content.box.w * 0.1
  //   }
  //   com.content.button.g.append('rect')
  //     .attr('x', addButtonBox.x + 1.5 + 0.5)
  //     .attr('y', addButtonBox.y + 1.5 + 0.5)
  //     .attr('width', addButtonBox.w + 0.5)
  //     .attr('height', addButtonBox.h + 0.5)
  //     .style('fill', com.main.colorTheme.darker.background)
  //   com.content.button.g.append('rect')
  //     .attr('x', addButtonBox.x + 1.5)
  //     .attr('y', addButtonBox.y + 1.5)
  //     .attr('width', addButtonBox.w)
  //     .attr('height', addButtonBox.h)
  //     .style('fill', com.main.colorTheme.medium.background)
  //     .style('stroke', com.main.colorTheme.medium.stroke)
  //     .style('stroke-width', 0.4)
  //     .on('click', createFiltersSelection)
  //   com.content.button.g.append('text')
  //     .text('+')
  //     .attr('x', addButtonBox.x + addButtonBox.w * 0.5 + 1.5)
  //     .attr('y', addButtonBox.y + addButtonBox.h * 0.8 + 1.5)
  //     .attr('dy', 0)
  //     .attr('stroke', com.main.colorTheme.darker.stroke)
  //     .attr('stroke-width', 0.5)
  //     .attr('fill', com.main.colorTheme.darker.stroke)
  //     .style('font-weight', 'normal')
  //     .attr('text-anchor', 'middle')
  //     .style('font-size', '12px')
  //     .style('pointer-events', 'none')
  //     .style('user-select', 'none')
  // }
  // function initResult () {
  //   if (!com.result.g) com.result.g = com.main.g.append('g')
  //
  //   com.result.g.append('rect')
  //     .attr('x', com.result.box.x)
  //     .attr('y', com.result.box.y)
  //     .attr('width', com.result.box.w)
  //     .attr('height', com.result.box.h)
  //     .style('fill', '#666666')
  // }

  function createFiltersSelection () {
    function addFilterToken (type) {
      let filterToken = {
        id: type + '_' + Date.now(),
        type: type,
        filtering: []
      }
      com.filters.unshift(filterToken)
      com.tokenFocus = filterToken
      updateEnabled()
    }
    com.content.panel.g.selectAll('*').remove()
    let dim = com.content.box.w * 0.2
    let statesBox = {
      x: com.content.box.w * 0.33 - dim * 0.5,
      y: com.content.box.h * 0.33 - dim * 0.5,
      w: dim,
      h: dim
    }
    let telsBox = {
      x: com.content.box.w * 0.66 - dim * 0.5,
      y: com.content.box.h * 0.33 - dim * 0.5,
      w: dim,
      h: dim
    }
    let targetsBox = {
      x: com.content.box.w * 0.33 - dim * 0.5,
      y: com.content.box.h * 0.66 - dim * 0.5,
      w: dim,
      h: dim
    }
    let timeBox = {
      x: com.content.box.w * 0.66 - (dim * 0.5),
      y: com.content.box.h * 0.66 - (dim * 0.5),
      w: dim,
      h: dim
    }

    com.content.panel.g.append('rect')
      .attr('x', statesBox.x + 0.5)
      .attr('y', statesBox.y + 0.5)
      .attr('width', statesBox.w + 1.5)
      .attr('height', statesBox.h + 1.5)
      .style('fill', com.main.colorTheme.darker.background)
      .style('stroke', com.main.colorTheme.darker.stroke)
      .style('stroke-width', 0)
    com.content.panel.g.append('rect')
      .attr('x', statesBox.x + 0.5)
      .attr('y', statesBox.y + 0.5)
      .attr('width', statesBox.w + 1.5)
      .attr('height', statesBox.h + 1.5)
      .style('fill', com.main.colorTheme.medium.background)
      .style('stroke', com.main.colorTheme.medium.stroke)
      .style('stroke-width', 0)
      .on('click', function (d) {
        d3.select(this)
          .transition()
          .duration(timeD.animArc)
          .attr('x', statesBox.x + 0.5)
          .attr('y', statesBox.y + 0.5)
          .attr('width', statesBox.w + 1.5)
          .attr('height', statesBox.h + 1.5)
          .style('stroke-width', 0.0)
          .on('end', function () {
            addFilterToken('states')
            createStatesFilters({})
          })
      })
      .transition()
      .duration(timeD.animArc)
      .style('stroke-width', 0.4)
      .attr('x', statesBox.x)
      .attr('y', statesBox.y)
      .attr('width', statesBox.w)
      .attr('height', statesBox.h)

    com.content.panel.g.append('rect')
      .attr('x', telsBox.x + 0.5)
      .attr('y', telsBox.y + 0.5)
      .attr('width', telsBox.w + 1.5)
      .attr('height', telsBox.h + 1.5)
      .style('fill', com.main.colorTheme.darker.background)
      .style('stroke', com.main.colorTheme.darker.stroke)
      .style('stroke-width', 0.0)
    com.content.panel.g.append('rect')
      .attr('x', telsBox.x + 0.5)
      .attr('y', telsBox.y + 0.5)
      .attr('width', telsBox.w + 1.5)
      .attr('height', telsBox.h + 1.5)
      .style('fill', com.main.colorTheme.medium.background)
      .style('stroke', com.main.colorTheme.medium.stroke)
      .style('stroke-width', 0.0)
      .on('click', function (d) {
        d3.select(this)
          .transition()
          .duration(timeD.animArc)
          .attr('x', telsBox.x + 0.5)
          .attr('y', telsBox.y + 0.5)
          .attr('width', telsBox.w + 1.5)
          .attr('height', telsBox.h + 1.5)
          .style('stroke-width', 0.0)
          .on('end', function () {
            addFilterToken('tels')
            createTelsFilters({})
          })
      })
      .transition()
      .duration(timeD.animArc)
      .style('stroke-width', 0.4)
      .attr('x', telsBox.x)
      .attr('y', telsBox.y)
      .attr('width', telsBox.w)
      .attr('height', telsBox.h)

    com.content.panel.g.append('rect')
      .attr('x', targetsBox.x + 0.5)
      .attr('y', targetsBox.y + 0.5)
      .attr('width', targetsBox.w + 1.5)
      .attr('height', targetsBox.h + 1.5)
      .style('fill', com.main.colorTheme.darker.background)
      .style('stroke', com.main.colorTheme.darker.stroke)
      .style('stroke-width', 0.0)
    com.content.panel.g.append('rect')
      .attr('x', targetsBox.x + 0.5)
      .attr('y', targetsBox.y + 0.5)
      .attr('width', targetsBox.w + 1.5)
      .attr('height', targetsBox.h + 1.5)
      .style('fill', com.main.colorTheme.medium.background)
      .style('stroke', com.main.colorTheme.medium.stroke)
      .style('stroke-width', 0.0)
      .on('click', function (d) {
        addFilterToken('target')
        createTargetsFilter({})
      })
      .transition()
      .duration(timeD.animArc)
      .style('stroke-width', 0.4)
      .attr('x', targetsBox.x)
      .attr('y', targetsBox.y)
      .attr('width', targetsBox.w)
      .attr('height', targetsBox.h)

    com.content.panel.g.append('rect')
      .attr('x', timeBox.x + 0.5)
      .attr('y', timeBox.y + 0.5)
      .attr('width', timeBox.w + 1.5)
      .attr('height', timeBox.h + 1.5)
      .style('fill', com.main.colorTheme.darker.background)
      .style('stroke', com.main.colorTheme.darker.stroke)
      .style('stroke-width', 0.0)
    com.content.panel.g.append('rect')
      .attr('x', timeBox.x + 0.5)
      .attr('y', timeBox.y + 0.5)
      .attr('width', timeBox.w + 1.5)
      .attr('height', timeBox.h + 1.5)
      .style('fill', com.main.colorTheme.medium.background)
      .style('stroke', com.main.colorTheme.medium.stroke)
      .style('stroke-width', 0.0)
      .on('click', function (d) {
        addFilterToken('time')
        createTimeFilters({})
      })
      .transition()
      .duration(timeD.animArc)
      .style('stroke-width', 0.4)
      .attr('x', timeBox.x)
      .attr('y', timeBox.y)
      .attr('width', timeBox.w)
      .attr('height', timeBox.h)
  }
  function createStatesFilters (optIn) {
    let token = optIn.token

    com.content.panel.g.selectAll('*').remove()

    function createButton (newButton, type, filter) {
      newButton.attr('status', 'disabled')
      if (token) {
        for (let i = 0; i < token.filtering.length; i++) {
          if (token.filtering[i].name === type) newButton.attr('status', 'enabled')
        }
      }

      let checkFunction = function (rect) {
        if (newButton.attr('status') === 'enabled') {
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
          newButton.selectAll('line.checkboxBar').remove()
          rect.attr('stroke', function (d, i) {
            return '#000000'
          })
            .attr('stroke-width', 0.2)
            .style('stroke-opacity', 1)
        }
      }
      let clickFunction = function (rect) {
        if (newButton.attr('status') === 'enabled') {
          newButton.attr('status', 'disabled')
          removeFiltering(filter)
          updateBlockQueue()
        } else {
          newButton.attr('status', 'enabled')
          addFiltering(filter)
          updateBlockQueue()
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
          checkFunction(d3.select(this))
        })
        .on('mouseover', function () {
          // let ginfo = com.filters.g.append('g')
          //   .attr('class', 'info')
          //   .attr('transform', newButton.attr('transform'))
          // ginfo.append('rect')
          //   .attr('x', -Number(newButton.attr('width')) * 0.5)
          //   .attr('y', -20)
          //   .attr('width', Number(newButton.attr('width')) * 2)
          //   .attr('height', 18)
          //   .attr('rx', 3)
          //   .attr('ry', 3)
          //   .attr('fill', '#eeeeee')
          //   .style('fill-opacity', 0.82)
          // ginfo.append('text')
          //   .text(type)
          //   .attr('x', Number(newButton.attr('width')) * 0.5)
          //   .attr('y', -5)
          //   .style('fill-opacity', 0.82)
          //   .style('font-weight', 'normal')
          //   .attr('text-anchor', 'middle')
          //   .style('font-size', 16)
          //   .style('pointer-events', 'none')
          //   .style('user-select', 'none')

          newButton.attr('status-over', newButton.attr('status'))
          if (newButton.attr('status') === 'enabled') {
            removeFiltering(filter)
            updateBlockQueue()
          } else if (newButton.attr('status') === 'disabled') {
            addFiltering(filter)
            updateBlockQueue()
          }
        })
        .on('mouseout', function () {
          // com.filters.g.select('g.info').remove()
          if (newButton.attr('status') === 'disabled') {
            removeFiltering(filter)
            updateBlockQueue()
          } else if (newButton.attr('status') === 'enabled') {
            addFiltering(filter)
            updateBlockQueue()
          }
        })
        // clickFunction(newRect)
      checkFunction(newRect)
      return newButton
    }
    com.content.panel.g.append('text')
      .text('States')
      .attr('x', com.content.box.w * 0.5)
      .attr('y', com.content.box.h * 0.25)
      .attr('dy', 0)
      .attr('stroke', com.main.colorTheme.darker.stroke)
      .attr('stroke-width', 0.0)
      .attr('fill', com.main.colorTheme.darker.stroke)
      .style('font-weight', 'normal')
      .attr('text-anchor', 'middle')
      .style('font-size', '9')
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    let bBox = {x: com.content.box.w * 0.18, y: com.content.box.h * 0.5, w: (com.content.box.w * 0.98) / 6, h: (com.content.box.w * 0.98) / 6}
    let failG = com.content.panel.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 0) + ',' + (bBox.y - bBox.h * 0.7) + ')')
    let doneG = com.content.panel.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 1.5) + ',' + (bBox.y - bBox.h * 0.7) + ')')
    let runG = com.content.panel.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 3) + ',' + (bBox.y - bBox.h * 0.7) + ')')
    let cancelOG = com.content.panel.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 0) + ',' + (bBox.y + com.content.box.h * 0.2 - bBox.h * 0.5) + ')')
    let cancelSG = com.content.panel.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 1.5) + ',' + (bBox.y + com.content.box.h * 0.2 - bBox.h * 0.5) + ')')
    let waitG = com.content.panel.g.append('g')
      .attr('width', bBox.w * 0.8)
      .attr('height', bBox.h * 0.8)
      .attr('transform', 'translate(' + (bBox.x + bBox.w * 3) + ',' + (bBox.y + com.content.box.h * 0.2 - bBox.h * 0.5) + ')')
    com.content.panel.button = {
      Fail: createButton(failG, 'fail', {name: 'fail', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'fail'}]}),
      Done: createButton(doneG, 'done', {name: 'done', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'done'}]}),
      Run: createButton(runG, 'run', {name: 'run', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'run'}]}),
      'Cancel.canrun': createButton(cancelOG, 'cancelO', {name: 'cancelO', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'cancel'}, {keys: ['exeState', 'canRun'], value: true}]}),
      Cancel: createButton(cancelSG, 'cancelS', {name: 'cancelS', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'cancel'}, {keys: ['exeState', 'canRun'], value: false}]}),
      Wait: createButton(waitG, 'wait', {name: 'wait', operation: 'exclude', filters: [{keys: ['exeState', 'state'], value: 'wait'}]})
    }
  }
  function createTelsFilters (optIn) {
    let token = optIn.token

    com.content.panel.g.selectAll('*').remove()

    com.content.panel.g.append('text')
      .text('Tels')
      .attr('x', com.content.box.w * 0.5)
      .attr('y', com.content.box.h * 0.15)
      .attr('dy', 0)
      .attr('stroke', com.main.colorTheme.darker.stroke)
      .attr('stroke-width', 0.0)
      .attr('fill', com.main.colorTheme.darker.stroke)
      .style('font-weight', 'normal')
      .attr('text-anchor', 'middle')
      .style('font-size', '9')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
    com.content.panel.g.append('text')
      .text('')
      .attr('x', com.content.box.w * 0.25)
      .attr('y', com.content.box.h * 0.15)
      .attr('dy', 0)
      .attr('stroke', com.main.colorTheme.darker.stroke)
      .attr('stroke-width', 0.0)
      .attr('fill', com.main.colorTheme.darker.stroke)
      .style('font-weight', 'normal')
      .attr('text-anchor', 'middle')
      .style('font-size', '6px')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
    com.content.panel.g.append('text')
      .text('Show')
      .attr('x', com.content.box.w * 0.75)
      .attr('y', com.content.box.h * 0.15)
      .attr('dy', 0)
      .attr('stroke', com.main.colorTheme.darker.stroke)
      .attr('stroke-width', 0.0)
      .attr('fill', com.main.colorTheme.darker.stroke)
      .style('font-weight', 'normal')
      .attr('text-anchor', 'middle')
      .style('font-size', '6px')
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    let tels = telInfo.getIds()
    tels = tels.map(function (d) {
      let filtered = false
      if (token) {
        for (let i = 0; i < token.filtering.length; i++) {
          let f = token.filtering[i]
          if (f.filters[0].value === d) filtered = true
        }
      }
      return {id: d, filtered: filtered}
    })

    let localScroll = {}
    let left = {
      x: com.content.box.w * 0.05,
      y: com.content.box.h * 0.175,
      w: com.content.box.w * 0.44,
      h: com.content.box.h * 0.68
    }
    let right = {
      x: com.content.box.w * 0.51,
      y: com.content.box.h * 0.175,
      w: com.content.box.w * 0.44,
      h: com.content.box.h * 0.68
    }
    function initScrollBox () {
      localScroll.scrollBoxG = com.content.panel.g.append('g')
      localScroll.scrollBoxG.append('rect')
        .attr('class', 'background')
        .attr('x', left.x)
        .attr('y', left.y)
        .attr('width', left.w)
        .attr('height', left.h)
        .style('fill', colorTheme.darker.background)
        .style('stroke', com.main.background.stroke)
        .style('stroke-width', 0.4)
      localScroll.scrollBoxG.append('rect')
        .attr('class', 'background')
        .attr('x', right.x)
        .attr('y', right.y)
        .attr('width', right.w)
        .attr('height', right.h)
        .style('fill', colorTheme.darker.background)
        .style('stroke', com.main.background.stroke)
        .style('stroke-width', 0.4)

      localScroll.scrollBox = new ScrollBox()
      localScroll.scrollBox.init({
        tag: 'telsFiltersScroll',
        gBox: localScroll.scrollBoxG,
        boxData: {
          x: com.content.box.w * 0.05,
          y: com.content.box.h * 0.175,
          w: com.content.box.w * 0.9,
          h: com.content.box.h * 0.68,
          marg: 0
        },
        useRelativeCoords: true,
        locker: new Locker(),
        lockerV: ['telsFiltersScroll' + 'updateData'],
        lockerZoom: {
          all: 'ScrollBox' + 'zoom',
          during: 'ScrollBox' + 'zoomDuring',
          end: 'ScrollBox' + 'zoomEnd'
        },
        runLoop: new RunLoop({tag: 'telsFiltersScroll'}),
        canScroll: true,
        scrollVertical: true,
        scrollHorizontal: false,
        scrollHeight: 0,
        scrollWidth: 0,
        background: 'transparent',
        scrollRecH: {h: 1},
        scrollRecV: {w: 1}
      })
      localScroll.scrollG = localScroll.scrollBox.get('innerG')
    }
    initScrollBox()

    let labelBox = {
      x: com.content.box.w * 0.46,
      y: 0,
      w: com.content.box.w * 0.44,
      h: 12
    }

    let allTels = localScroll.scrollG
      .selectAll('g.tel')
      .data(tels, function (d) {
        return d.id
      })
    let enterTels = allTels
      .enter()
      .append('g')
      .attr('class', 'tel')
      .attr('transform', function (d, i) {
        let translate = {
          y: labelBox.h * i,
          x: labelBox.x * d.filtered
        }
        return 'translate(' + translate.x + ',' + translate.y + ')'
      })
    enterTels.each(function (d, i) {
      let gg = d3.select(this)
      d3.select(this).append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', labelBox.w)
        .attr('height', labelBox.h)
        .style('fill', colorTheme.dark.background)
        .style('stroke', com.main.background.stroke)
        .style('stroke-width', com.main.background.strokeWidth)
        .on('click', function () {
          if (d.filtered) {
            d.filtered = false
            gg
              .attr('transform', function (d) {
                let translate = {
                  y: labelBox.h * i,
                  x: labelBox.x * d.filtered
                }
                return 'translate(' + translate.x + ',' + translate.y + ')'
              })
            removeFiltering({name: 'tels', operation: 'include', filters: [{keys: ['telIds'], value: d.id}]})
            updateBlockQueue()
          } else {
            d.filtered = true
            gg
              .attr('transform', function (d) {
                let translate = {
                  y: labelBox.h * i,
                  x: labelBox.x * d.filtered
                }
                return 'translate(' + translate.x + ',' + translate.y + ')'
              })
            addFiltering({name: 'tels', operation: 'include', filters: [{keys: ['telIds'], value: d.id}]})
            updateBlockQueue()
          }
        })
      d3.select(this).append('text')
        .text(d.id)
        .attr('x', labelBox.w * 0.5)
        .attr('y', labelBox.h * 0.7)
        .attr('fill', com.main.colorTheme.darker.stroke)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', '8px')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
    })
    let mergeTels = enterTels.merge(allTels)

    com.content.panel.g.append('rect')
      .attr('class', 'toRight')
      .attr('x', com.content.box.w * 0.25 - 5)
      .attr('y', com.content.box.h * 0.92 - 5)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', colorTheme.darker.background)
      .style('stroke', com.main.background.stroke)
      .style('stroke-width', 0.4)
      .on('click', function () {
        mergeTels.each(function (d, i) {
          if (!d.filtered) {
            d.filtered = true
            d3.select(this)
              .attr('transform', function (d) {
                let translate = {
                  y: labelBox.h * i,
                  x: labelBox.x * d.filtered
                }
                return 'translate(' + translate.x + ',' + translate.y + ')'
              })
            addFiltering({name: 'tels', operation: 'include', filters: [{keys: ['telIds'], value: d.id}]})
          }
        })
        updateBlockQueue()
      })
    com.content.panel.g.append('rect')
      .attr('class', 'switch')
      .attr('x', com.content.box.w * 0.5 - 7.5)
      .attr('y', com.content.box.h * 0.92 - 5)
      .attr('width', 15)
      .attr('height', 10)
      .style('fill', colorTheme.darker.background)
      .style('stroke', com.main.background.stroke)
      .style('stroke-width', 0.4)
      .on('click', function () {
        mergeTels.each(function (d, i) {
          if (d.filtered) {
            d.filtered = false
            d3.select(this)
              .attr('transform', function (d) {
                let translate = {
                  y: labelBox.h * i,
                  x: labelBox.x * d.filtered
                }
                return 'translate(' + translate.x + ',' + translate.y + ')'
              })
            removeFiltering({name: 'tels', operation: 'include', filters: [{keys: ['telIds'], value: d.id}]})
          } else {
            d.filtered = true
            d3.select(this)
              .attr('transform', function (d) {
                let translate = {
                  y: labelBox.h * i,
                  x: labelBox.x * d.filtered
                }
                return 'translate(' + translate.x + ',' + translate.y + ')'
              })
            addFiltering({name: 'tels', operation: 'include', filters: [{keys: ['telIds'], value: d.id}]})
          }
        })
        updateBlockQueue()
      })
    com.content.panel.g.append('rect')
      .attr('class', 'toLeft')
      .attr('x', com.content.box.w * 0.75 - 5)
      .attr('y', com.content.box.h * 0.92 - 5)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', colorTheme.darker.background)
      .style('stroke', com.main.background.stroke)
      .style('stroke-width', 0.4)
      .on('click', function () {
        mergeTels.each(function (d, i) {
          if (d.filtered) {
            d.filtered = false
            d3.select(this)
              .attr('transform', function (d) {
                let translate = {
                  y: labelBox.h * i,
                  x: labelBox.x * d.filtered
                }
                return 'translate(' + translate.x + ',' + translate.y + ')'
              })
            removeFiltering({name: 'tels', operation: 'include', filters: [{keys: ['telIds'], value: d.id}]})
          }
        })
        updateBlockQueue()
      })
    localScroll.scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: labelBox.h * tels.length})
  }
  function createTargetsFilter (optIn) {
    if (!com.targets.g) com.targets.g = com.main.g.append('g')

    com.targets.g.append('rect')
      .attr('x', com.targets.box.x)
      .attr('y', com.targets.box.y)
      .attr('width', com.targets.box.w)
      .attr('height', com.targets.box.h)
      .style('fill', '#666666')
  }
  function createTimeFilters (optIn) {
    if (!com.time.g) com.time.g = com.main.g.append('g')

    com.time.g.append('rect')
      .attr('x', com.time.box.x)
      .attr('y', com.time.box.y)
      .attr('width', com.time.box.w)
      .attr('height', com.time.box.h)
      .style('fill', '#666666')
  }

  // function addFiltering (filter) {
  //   com.tokenFocus.filtering.push(filter)
  // }
  // function removeFiltering (filter) {
  //   let index = com.tokenFocus.filtering.indexOf(filter)
  //   com.tokenFocus.filtering.splice(index, 1)
  // }
  function getFilters () {
    let allFilters = []
    if (com.main.mode === 'expert') {
      for (let i = 0; i < com.filters.length; i++) {
        for (let j = 0; j < com.filters[i].filtering.length; j++) {
          allFilters.push(com.filters[i].filtering[j])
        }
      }
    } else if (com.main.mode === 'beginner') {
      for (let j = 0; j < com.beginner.states.token.filtering.length; j++) {
        allFilters.push(com.beginner.states.token.filtering[j])
      }
    }
    return allFilters
  }
  this.getFilters = getFilters

  function updateBlockQueue () {
    for (let i = com.blockQueue.length - 1; i > -1; i--) {
      com.blockQueue[i].update()
    }
  }
  function plugBlockQueue (blockQueue, propagate) {
    com.blockQueue.push(blockQueue)
    if (propagate) blockQueue.plugBlockFilters(this, !propagate)
    for (let i = 0; i < com.filters.length; i++) {
      blockQueue.updateFilters(com.filters[i])
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
    for (let i = 0; i < com.filters.length; i++) {
      blockQueue.updateFilters(com.filters[i])
    }
  }
  this.unplugBlockQueue = unplugBlockQueue
}
