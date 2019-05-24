/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global getColorTheme */
/* global deepCopy */
/* global minMaxObj */
/* global loadScript */
/* global colsBlues */
/* global ScrollBox */
/* global Locker */
/* global RunLoop */
/* global telHealthCol */

loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollBox.js' })

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.TelescopeDisplayer = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  let com = {
    main: {
      tag: 'telescopeQueueRootTag',
      g: undefined,
      scroll: {},
      box: {x: 0, y: 0, w: 1000, h: 300, marg: 0},
      background: {
        fill: colorTheme.brighter.background,
        stroke: colorTheme.brighter.stroke,
        strokeWidth: 0.5
      }
    },

    displayer: 'telescopeQueue',
    gridBib: {
      telescopes: {
      }
    },

    filters: {
      telescopeFilters: [],
      filtering: []
    },
    data: {
      raw: {
        telescopes: [],
        blocks: []
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
        telescope: undefined
      },
      focus: {
        telescope: undefined
      }
    }
  }
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
    com.style.telescopeCol = function (optIn) {
      let state = hasVar(optIn.state)
        ? optIn.state
        : optIn.d.exeState.state
      let canRun = hasVar(optIn.canRun)
        ? optIn.canRun
        : optIn.d.exeState.canRun
      let modified = optIn.d.modifications ? optIn.d.modifications.userModifications.length > 0 : false

      if (state === 'wait') {
        if (modified) return com.telescopeQueue.telescopes.colorPalette.wait
        return com.telescopeQueue.telescopes.colorPalette.wait
      } else if (state === 'done') {
        return com.telescopeQueue.telescopes.colorPalette.done
      } else if (state === 'fail') {
        return com.telescopeQueue.telescopes.colorPalette.fail
      } else if (state === 'run') {
        return com.telescopeQueue.telescopes.colorPalette.run
      } else if (state === 'cancel') {
        if (hasVar(canRun)) {
          if (!canRun) return com.telescopeQueue.telescopes.colorPalette.cancelOp
        }
        return com.telescopeQueue.telescopes.colorPalette.cancelSys
      } else return com.telescopeQueue.telescopes.colorPalette.shutdown
    }
    com.style.telescopeOpac = function (optIn) {
      let state = hasVar(optIn.state)
        ? optIn.state
        : optIn.d.exeState.state
      let canRun = hasVar(optIn.canRun)
        ? optIn.canRun
        : optIn.d.exeState.canRun
      let modified = optIn.d.modifications ? optIn.d.modifications.userModifications.length > 0 : false

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

    com.pattern.select = {}
    com.pattern.select.defs = com.main.g.append('defs')
    // com.pattern.select.patternHover = com.pattern.select.defs.append('pattern')
    //   .attr('id', 'patternHover')
    //   .attr('x', 0)
    //   .attr('y', 0)
    //   .attr('width', 5)
    //   .attr('height', 5)
    //   .attr('fill', '#ffffff')
    //   .attr('patternUnits', 'userSpaceOnUse')
    // com.pattern.select.patternHover.append('line')
    //   .attr('x1', 0)
    //   .attr('y1', 0)
    //   .attr('x2', 5)
    //   .attr('y2', 5)
    //   .attr('stroke', '#000000')
    //   .attr('stroke-width', 0.8)
    //   .attr('stroke-opacity', 0.4)
    // com.pattern.select.patternHover.append('line')
    //   .attr('x1', 5)
    //   .attr('y1', 0)
    //   .attr('x2', 0)
    //   .attr('y2', 5)
    //   .attr('stroke', '#000000')
    //   .attr('stroke-width', 0.8)
    //   .attr('stroke-opacity', 0.4)

    com.pattern.select.patternSelect = com.pattern.select.defs.append('pattern')
      .attr('id', 'patternSelect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 3)
      .attr('height', 3)
      .attr('fill', '#ffffff')
      .attr('patternUnits', 'userSpaceOnUse')
    com.pattern.select.patternSelect.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 3)
      .attr('y2', 3)
      .attr('stroke', '#000000')
      .attr('stroke-width', 0.4)
      .attr('stroke-opacity', 0.6)
    com.pattern.select.patternSelect.append('line')
      .attr('x1', 3)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 3)
      .attr('stroke', '#000000')
      .attr('stroke-width', 0.4)
      .attr('stroke-opacity', 0.6)
  }

  let GridBib = function () {
    function init () {
      com.gridBib.back = com.main.background.append('g')
      com.gridBib.gBlockBox = com.main.background.append('g')
      com.gridBib.telescope.large.g = com.gridBib.gBlockBox.append('g')
        .attr('transform', 'translate(' + com.gridBib.telescope.large.box.x + ',' + com.gridBib.telescope.large.box.y + ')')
      com.gridBib.telescope.medium.g = com.gridBib.gBlockBox.append('g')
        .attr('transform', 'translate(' + com.gridBib.telescope.medium.box.x + ',' + com.gridBib.telescope.medium.box.y + ')')
      com.gridBib.telescope.small.g = com.gridBib.gBlockBox.append('g')
        .attr('transform', 'translate(' + com.gridBib.telescope.small.box.x + ',' + com.gridBib.telescope.small.box.y + ')')

      let side = com.gridBib.idle.background.side
      let middle = com.gridBib.idle.background.middle
      com.gridBib.back.append('rect')
        .attr('id', 'idle')
        .attr('fill', side.color ? side.color : colorTheme.dark.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.1)
        .attr('stroke', colorTheme.dark.stroke)
        .style('opacity', side.hasOwnProperty('opacity') ? side.opacity : 1)
      com.gridBib.back.append('rect')
        .attr('id', 'idleMiddle')
        .attr('fill', middle.color ? middle.color : colorTheme.dark.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.05)
        .attr('stroke', colorTheme.dark.stroke)
        .style('opacity', middle.hasOwnProperty('opacity') ? middle.opacity : 1)
      com.gridBib.back.append('text')
        .attr('id', 'idle')
        .text('Idle')
        .style('font-weight', 'bold')
        .style('font-size', com.gridBib.idle.txtSize + 'px')
        .attr('text-anchor', 'middle')
        .attr('opacity', 0)

      let transY = !com.gridBib.header.top ? 0 : (-com.gridBib.header.background.height + com.gridBib.telescope.large.box.h * 1.0)
      com.gridBib.back.append('rect')
        .attr('id', 'name')
        .attr('x', 0)
        .attr('y', transY)
        .attr('width', com.main.box.w)
        .attr('height', com.gridBib.header.background.height)
        .attr('fill', com.gridBib.header.background.color)

      com.gridBib.telescope.large.g.append('text')
        .attr('id', 'title')
        .text('Large')
        .style('fill', com.gridBib.header.text.color)
        .style('font-weight', 'bold')
        .style('font-size', com.gridBib.header.text.size + 'px')
        .attr('text-anchor', 'middle')
        .attr('y', com.gridBib.header.background.height * 0.5 + com.gridBib.header.text.size * 0.33)
        .attr('transform', 'translate(' + (com.gridBib.telescope.large.box.w * 0.5) + ',' + transY + ')')
      com.gridBib.telescope.medium.g.append('text')
        .attr('id', 'title')
        .text('Medium')
        .style('fill', com.gridBib.header.text.color)
        .style('font-weight', 'bold')
        .style('font-size', com.gridBib.header.text.size + 'px')
        .attr('text-anchor', 'middle')
        .attr('y', com.gridBib.header.background.height * 0.5 + com.gridBib.header.text.size * 0.33)
        .attr('transform', 'translate(' + (com.gridBib.telescope.medium.box.w * 0.5) + ',' + transY + ')')
      if (com.main.isSouth) {
        com.gridBib.telescope.small.g.append('text')
          .attr('id', 'title')
          .text('Small')
          .style('fill', com.gridBib.header.text.color)
          .style('font-weight', 'bold')
          .style('font-size', com.gridBib.header.text.size + 'px')
          .attr('text-anchor', 'middle')
          .attr('y', com.gridBib.header.background.height * 0.5 + com.gridBib.header.text.size * 0.33)
          .attr('transform', 'translate(' + (com.gridBib.telescope.small.box.w * 0.5) + ',' + transY + ')')
      }
    }
    this.init = init

    function setDefaultStyleForTelescopes (telescopes) {
      let timeScale = d3.scaleLinear()
        .range(com.telescopeQueue.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])
      for (let index in telescopes) {
        let b = telescopes[index]
        let bDisplay = b.display

        let cols = com.style.telescopeCol({ d: b })

        bDisplay.w = timeScale(b.endTime) - timeScale(b.startTime)
        bDisplay.stroke = cols.stroke
        bDisplay.strokeWidth = 0.5
        bDisplay.fill = cols.background
        bDisplay.fillOpacity = com.style.telescopeOpac({ d: b })
        bDisplay.strokeOpacity = com.style.telescopeOpac({ d: b })
        bDisplay.strokeDasharray = []
        bDisplay.opacity = b.filtered === true ? 0.05 : 1

        bDisplay.text = cols.text
        bDisplay.patternFill = ''
        bDisplay.patternOpacity = 0
        if (b.sbId === com.input.focus.schedTelescopes) {
          if (!(com.input.over.schedTelescopes !== undefined && com.input.over.schedTelescopes !== com.input.focus.schedTelescopes)) { // b.stroke = colorTheme.telescopes.critical.background
            // b.patternFill = 'url(#patternHover)'
            bDisplay.patternFill = 'url(#patternSelect)'
            bDisplay.patternOpacity = 1
          }
          bDisplay.strokeWidth = 1
          bDisplay.strokeOpacity = 1
          // b.strokeDasharray = [2, 2]
        }
        if (b.sbId === com.input.over.schedTelescopes) {
          bDisplay.strokeWidth = 1
          bDisplay.strokeOpacity = 1
          // b.strokeDasharray = [2, 2]
          bDisplay.patternFill = 'url(#patternSelect)'
          bDisplay.patternOpacity = 1
        }
        if (b.obId === com.input.focus.telescope) {
          if (com.input.over.telescope !== undefined && com.input.over.telescope !== com.input.focus.telescope) bDisplay.strokeDasharray = [8, 4]
          bDisplay.strokeWidth = 6
          bDisplay.strokeOpacity = 1
        }
        if (b.obId === com.input.over.telescope) {
          bDisplay.strokeWidth = 6
          bDisplay.strokeOpacity = 1
          bDisplay.strokeDasharray = []
        }
      }
      return telescopes
    }

    let click, cloned, hoveredStart, hoveredEnd, action
    function dragstarted (d) {
      click = true
      cloned = clone(d3.select(this.parentNode))
      cloned.style('pointer-events', 'none')
      d3.select(this.parentNode).style('opacity', 0.5)

      com.main.foreground.selectAll('g.' + com.main.tag + 'telescopes').style('pointer-events', 'none')
      com.main.background.append('rect')
        .attr('id', 'trash')
        .attr('x', com.main.box.w - 20)
        .attr('y', com.main.box.h - 20 - (!com.gridBib.header.top ? 0 : com.gridBib.header.background.height))
        .attr('width', 20)
        .attr('height', 20)
        .on('mouseover', function () {
          action = 'trash'
        })
        .on('mouseout', function () {
          action = undefined
        })
      com.main.background.append('rect')
        .attr('id', 'switch')
        .attr('x', com.main.box.w - 20)
        .attr('y', com.main.box.h - 40 - (!com.gridBib.header.top ? 0 : com.gridBib.header.background.height))
        .attr('width', 20)
        .attr('height', 20)
        .on('mouseover', function () {
          action = 'switch'
          console.log('over');
        })
        .on('mouseout', function () {
          action = undefined
          console.log('out');
        })
    }
    function dragged (d) {
      click = false
      let trans = cloned.attr('transform')
      trans = {
        x: Number(trans.split('(')[1].split(',')[0]) + d3.event.dx,
        y: Number(trans.split(',')[1].split(')')[0]) + d3.event.dy
      }
      // let r = {
      //   rx: Number(cloned.attr('rx')),
      //   ry: Number(cloned.attr('ry'))
      // }
      // if (trans.x - (r.rx * 2) < 0) trans.x = (r.rx * 2)
      // if (trans.y - (r.ry * 2) < 0) trans.y = (r.ry * 2)
      // if (trans.x + (r.rx * 2) > com.main.box.w) trans.x = com.main.box.w - (r.rx * 2)
      // if (trans.y + (r.ry * 2) > com.main.box.h) trans.y = com.main.box.h - (r.ry * 2)
      cloned.attr('transform', 'translate(' + trans.x + ',' + trans.y + ')')
    }
    function dragended (d) {
      if (click) {
        console.log(d);
        com.events.telescope.click(d)
        return
      }
      function removeCloneP1 () {
        cloned.remove()
        cloned = undefined
        com.gridBib.back.selectAll('rect#stripLeft').attr('fill', com.gridBib.blocks.background.side.color)
        com.gridBib.back.selectAll('rect#stripMiddle').attr('fill', com.gridBib.blocks.background.middle.color)
        com.gridBib.back.selectAll('rect#stripRight').attr('fill', com.gridBib.blocks.background.side.color)
        com.main.foreground.selectAll('g.' + com.main.tag + 'telescopes').style('pointer-events', 'auto')

        com.main.background.select('rect#trash').remove()
        com.main.background.select('rect#switch').remove()
      }
      function removeCloneP2 () {
        hoveredStart = undefined
        hoveredEnd = undefined
        action = undefined
      }
      d3.select(this.parentNode).style('opacity', 1)
      removeCloneP1()
      if (action) {
        if (action === 'trash') {
          com.events.other.delTel(d)
          // let tel = hoveredStart.telIds.splice(hoveredStart.telIds.indexOf(d.id), 1)
          // if (tel.includes('L')) {
          //   hoveredStart.telsInfo.large -= 1
          // }
          // if (tel.includes('M')) {
          //   hoveredStart.telsInfo.medium -= 1
          // }
          // if (tel.includes('S')) {
          //   hoveredStart.telsInfo.small -= 1
          // }
          // for (let i = 0; i < com.data.raw.telescopes.length; i++) {
          //   if (com.data.raw.telescopes[i].id === tel[0]) {
          //     console.log(com.data.raw.telescopes.splice(i, 1))
          //     break
          //   }
          // }
          // for (let i = 0; i < com.data.filtered.telescopes.length; i++) {
          //   if (com.data.filtered.telescopes[i].id === tel[0]) {
          //     console.log(com.data.filtered.telescopes.splice(i, 1))
          //     break
          //   }
          // }
        } else if (action === 'switch') {
          com.events.other.switchTel(hoveredStart, d)
        }
      } else if (hoveredEnd) {
        let tel = hoveredStart.telIds.splice(hoveredStart.telIds.indexOf(d.id), 1)
        hoveredEnd.telIds.push(tel[0])
        if (tel.includes('L')) {
          hoveredStart.telsInfo.large -= 1
          hoveredEnd.telsInfo.large += 1
        }
        if (tel.includes('M')) {
          hoveredStart.telsInfo.medium -= 1
          hoveredEnd.telsInfo.medium += 1
        }
        if (tel.includes('S')) {
          hoveredStart.telsInfo.small -= 1
          hoveredEnd.telsInfo.small += 1
        }
      }
      removeCloneP2()
      createTelescopesGroup()
      update()
    }

    function mouseover (elem, d) {
      elem.style('cursor', 'pointer')
      com.events.telescope.mouseover('telescope', d.obId)
      // let parent = d3.select(elem.node().parentNode)
      // let dim = {
      //   cx: Number(elem.attr('cx')),
      //   cy: Number(elem.attr('cy')),
      //   rx: Number(elem.attr('rx')),
      //   ry: Number(elem.attr('ry'))
      // }
      // parent.append('rect')
      //   .attr('id', 'switch')
      //   .attr('x', dim.cx - 25)
      //   .attr('y', dim.cy - 22)
      //   .attr('width', 20)
      //   .attr('height', 20)
      // parent.append('rect')
      //   .attr('id', 'switch')
      //   .attr('x', dim.cx - 25)
      //   .attr('y', dim.cy + 2)
      //   .attr('width', 20)
      //   .attr('height', 20)

      // let p = 2 * Math.PI * Math.sqrt((dim.rx * dim.rx + dim.ry * dim.ry) / 2)
      // elem.attr('stroke-dasharray', [0, p])
      //   .attr('stroke-width', 4)
      //   .transition()
      //   .duration(1000)
      //   .attrTween('stroke-dasharray', function (d) {
      //     let interpolate = d3.interpolate(0, p)
      //     return function (t) {
      //       let int = interpolate(t)
      //       return [int, p - int]
      //     }
      //   })
    }
    this.mouseover = mouseover
    function mouseout (elem, d) {
      elem.style('cursor', 'default')
      com.events.telescope.mouseout('telescope', d.obId)
      elem.attr('stroke-width', 0.2)
    }
    this.mouseout = mouseout

    function computeSizeRows () {
      com.gridBib.telescope.large.opt.size = com.gridBib.telescope.large.box.w / com.gridBib.telescope.large.opt.telsPerRow
      com.gridBib.telescope.medium.opt.size = com.gridBib.telescope.medium.box.w / com.gridBib.telescope.medium.opt.telsPerRow
      com.gridBib.telescope.small.opt.size = com.gridBib.telescope.small.box.w / com.gridBib.telescope.small.opt.telsPerRow
      com.gridBib.telescope.large.opt.ratio = 0
      com.gridBib.telescope.medium.opt.ratio = 0
      com.gridBib.telescope.small.opt.ratio = 0

      if (com.gridBib.telescope.enabled) {
        for (let i = 0; i < com.data.raw.blocks.length; i++) {
          let b = com.data.raw.blocks[i]
          com.gridBib.runTels = com.gridBib.runTels.concat(b.telIds)
          let largeT = []
          let mediumT = []
          let smallT = []
          for (let j = 0; j < b.telIds.length; j++) {
            let t = b.telIds[j]
            if (t[0] === 'L') largeT.push(t)
            if (t[0] === 'M') mediumT.push(t)
            if (t[0] === 'S') smallT.push(t)
          }
          let l = com.gridBib.telescope.large.opt.size * (parseInt(largeT.length / com.gridBib.telescope.large.opt.telsPerRow) + (largeT.length % com.gridBib.telescope.large.opt.telsPerRow !== 0 ? 1 : 0))
          let m = com.gridBib.telescope.medium.opt.size * (parseInt(mediumT.length / com.gridBib.telescope.medium.opt.telsPerRow) + (mediumT.length % com.gridBib.telescope.medium.opt.telsPerRow !== 0 ? 1 : 0))
          let s = com.gridBib.telescope.small.opt.size * (parseInt(smallT.length / com.gridBib.telescope.small.opt.telsPerRow) + (smallT.length % com.gridBib.telescope.small.opt.telsPerRow !== 0 ? 1 : 0))

          b.telsInfo = {
            large: largeT.length,
            medium: mediumT.length,
            small: smallT.length
          }
          let max = Math.max(Math.max(l, m), s)
          if (max === 0) max = com.gridBib.telescope.small.opt.size
          b.rowHeight = max
          com.gridBib.ratio += max
        }
      }
      if (com.gridBib.idle.enabled) {
        com.gridBib.freeTels = com.gridBib.freeTels.filter(value => !com.gridBib.runTels.includes(value.id)).map(o => o.id)
        let largeT = []
        let mediumT = []
        let smallT = []
        for (let i = 0; i < com.gridBib.freeTels.length; i++) {
          let t = com.gridBib.freeTels[i]
          if (t[0] === 'L') largeT.push(t)
          if (t[0] === 'M') mediumT.push(t)
          if (t[0] === 'S') smallT.push(t)
        }
        let l = com.gridBib.telescope.large.opt.size * (parseInt(largeT.length / com.gridBib.telescope.large.opt.telsPerRow) + (largeT.length % com.gridBib.telescope.large.opt.telsPerRow !== 0 ? 1 : 0))
        let m = com.gridBib.telescope.medium.opt.size * (parseInt(mediumT.length / com.gridBib.telescope.medium.opt.telsPerRow) + (mediumT.length % com.gridBib.telescope.medium.opt.telsPerRow !== 0 ? 1 : 0))
        let s = com.gridBib.telescope.small.opt.size * (parseInt(smallT.length / com.gridBib.telescope.small.opt.telsPerRow) + (smallT.length % com.gridBib.telescope.small.opt.telsPerRow !== 0 ? 1 : 0))
        let max = Math.max(Math.max(l, m), s)
        // max = com.data.raw.blocks.length === 0 ? 9 : max
        com.gridBib.ratio += max
        com.gridBib.idleRow = max / com.gridBib.ratio
      }
      if (com.gridBib.telescope.enabled) {
        for (let i = 0; i < com.data.raw.blocks.length; i++) {
          com.data.raw.blocks[i].rowHeight = com.data.raw.blocks[i].rowHeight / com.gridBib.ratio
        }
      }
      com.gridBib.telescope.large.opt.ratio = com.gridBib.telescope.large.box.h / com.gridBib.ratio
      com.gridBib.telescope.medium.opt.ratio = com.gridBib.telescope.medium.box.h / com.gridBib.ratio
      com.gridBib.telescope.small.opt.ratio = com.gridBib.telescope.small.box.h / com.gridBib.ratio
    }
    function drawTels (tels, g, box, opt) {
      if (tels.length === 0) return
      let nbline = parseInt(tels.length / opt.telsPerRow) + (tels.length % opt.telsPerRow !== 0 ? 1 : 0)
      let size = {
        w: (opt.size * 0.5) * 0.9,
        h: (opt.ratio > 1 ? opt.size * 0.5 : opt.size * 0.5 * opt.ratio) * 0.9
      }
      if (opt.max && size.w > opt.max) size.w = opt.max
      if (opt.max && size.h > opt.max) size.h = opt.max

      let fontsize = opt.size * 0.4
      let offset = {
        x: (box.w - (opt.telsPerRow * size.w * 2)) * 0.5,
        y: com.gridBib.telescope.centering ? (box.h - (nbline * size.h * 2)) * 0.5 : 0
      }
      let lastLineOffset = {
        index: parseInt(((nbline - 1) * opt.telsPerRow)) - 1,
        x: (tels.length % opt.telsPerRow !== 0) ? (box.w - ((tels.length % opt.telsPerRow) * size.w * 2)) * 0.5 : offset.x
      }
      let rect = com.main.foreground
        .selectAll('g.' + com.main.tag + 'telescopes')
        .filter(function (d) { return tels.includes(d.id) })
      if (com.interaction && com.interaction.drag.enabled) {
        rect.select('ellipse#back').call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))
      }
      rect.each(function (d, i) {
        let g = d3.select(this)
        g.transition()
          .duration(timeD.animArc)
          .attr('transform', function (d) {
            let tx = box.x + size.w * 0.5 + (size.w * 2) * (i % opt.telsPerRow) + (i > lastLineOffset.index ? lastLineOffset.x : offset.x)
            let ty = box.y + offset.y + (size.h * 2) * parseInt(i / opt.telsPerRow) + size.h * 0.5
            return 'translate(' + tx + ',' + ty + ')'
          })
        g.select('ellipse#back')
          .style('fill-opacity', 1)
          .style('stroke-opacity', 1)
          .attr('stroke', colorTheme.dark.stroke)
          .transition()
          .duration(timeD.animArc)
          .style('fill', telHealthCol(d.health))
          .attr('cx', size.w * 0.5)
          .attr('cy', size.h * 0.5)
          .attr('rx', size.w)
          .attr('ry', size.h)
        g.select('text#name')
          .text(function (d) {
            return d.id.split('_')[1]
          })
          .attr('x', size.w * 0.5)
          .attr('y', size.h * 0.5 + fontsize * 0.33)
          .style('font-size', fontsize + 'px')
          .style('opacity', 1)
          .style('stroke', '#000000')
        // if (com.interaction) {
        //   if (com.interaction.delete.enabled) {
        //     console.log(d3.select('rect#deleteBack'))
        //     g.select('rect#deleteBack')
        //       .attr('x', size.w - size.h * 0.5)
        //       .attr('y', -size.h * 0.75)
        //       .attr('width', size.h)
        //       .attr('height', size.h)
        //       .style('opacity', 0)
        //     g.select('text#delete')
        //       .style('opacity', 1)
        //       .style('font-size', (size.h * 1) + 'px')
        //       .attr('x', size.w)
        //       .attr('y', 0)
        //   }
        // }
      })

      rect
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
      // console.log(rect);
      // return
      // let current = g
      //   .selectAll('g.tel')
      //   .data(tels, function (d) {
      //     return d.id
      //   })
      // let enter = current
      //   .enter()
      //   .append('g')
      //   .attr('class', 'tel')
      // enter.each(function (d, i) {
      //   d3.select(this).attr('transform', function (d) {
      //     let tx = offset.x + (size.w) * (i % opt.telsPerRow) + (i > lastLineOffset.index ? lastLineOffset.x : 0)
      //     let ty = box.y + offset.y + (size.h) * parseInt((i / opt.telsPerRow))
      //     return 'translate(' + tx + ',' + ty + ')'
      //   })
      //   d3.select(this).append('ellipse')
      //     .attr('cx', size.w * 0.5)
      //     .attr('cy', size.h * 0.5)
      //     .attr('rx', size.w)
      //     .attr('ry', size.h)
      //     .attr('fill', telHealthCol(d.val))
      //     .attr('fill-opacity', 1)
      //     .attr('stroke-width', 0.2)
      //     .attr('stroke', colorTheme.dark.stroke)
      //   d3.select(this).append('text')
      //     .attr('x', size.w * 0.5)
      //     .attr('y', size.h * 0.5 + fontsize * 0.33)
      //     .text(function (d) {
      //       return d.id.split('_')[1]
      //     })
      //     .style('fill', colorTheme.blocks.run.text)
      //     .style('stroke', colorTheme.blocks.run.text)
      //     .style('font-weight', '')
      //     .style('font-size', size.w * 0.1)
      //     .style('stroke-width', 0.2)
      //     .attr('text-anchor', 'middle')
      // })
      //
      // let merge = current.merge(enter)
      // merge.each(function (d, i) {
      //   d3.select(this)
      //     .transition()
      //     .duration(timeD.animArc)
      //     .attr('transform', function (d) {
      //       let tx = size.w * 0.5 + (size.w * 2) * (i % opt.telsPerRow) + (i > lastLineOffset.index ? lastLineOffset.x : offset.x)
      //       let ty = box.y + offset.y + (size.h * 2) * parseInt(i / opt.telsPerRow) + size.h * 0.5
      //       return 'translate(' + tx + ',' + ty + ')'
      //     })
      //   d3.select(this).select('ellipse')
      //     .transition()
      //     .duration(timeD.animArc)
      //     .attr('fill', telHealthCol(d.val))
      //     .attr('cx', size.w * 0.5)
      //     .attr('cy', size.h * 0.5)
      //     .attr('rx', size.w)
      //     .attr('ry', size.h)
      //   d3.select(this).select('text')
      //     .text(function (d) {
      //       return d.id.split('_')[1]
      //     })
      //     .attr('x', size.w * 0.5)
      //     .attr('y', size.h * 0.5 + fontsize * 0.33)
      //     .style('font-size', fontsize)
      // })
      //
      // current
      //   .exit()
      //   .transition('inOut')
      //   .duration(timeD.animArc)
      //   .style('opacity', 0)
      //   .remove()
    }

    function update () {
      com.gridBib.runTels = []
      com.gridBib.freeTels = deepCopy(com.data.filtered.telescopes)
      com.gridBib.ratio = 0
      com.gridBib.idleRow = 0
      com.gridBib.maxHeight = com.main.box.h - com.gridBib.header.background.height
      computeSizeRows()

      let transY = !com.gridBib.header.top ? com.gridBib.header.background.height : 0
      let offset = {
        x: 0,
        y: transY
      }
      if (com.gridBib.telescope.enabled) {
        let current = com.gridBib.back
          .selectAll('g.block')
          .data(com.data.raw.blocks, function (d) {
            return d.obId ? d.obId : d.name
          })
        let enter = current
          .enter()
          .append('g')
          .attr('class', 'block')
        enter.each(function (d, i) {
          let sizeRow = com.gridBib.maxHeight * d.rowHeight
          d3.select(this).attr('transform', function (d) {
            let tx = offset.x
            let ty = offset.y
            offset.y += sizeRow
            return 'translate(' + tx + ',' + ty + ')'
          })
          function enter (d) {
            if (!cloned) return
            if (!hoveredStart) hoveredStart = d
            hoveredEnd = d
            left.attr('fill', d3.color(com.gridBib.blocks.background.side.color).darker(0.4))
            middle.attr('fill', d3.color(com.gridBib.blocks.background.middle.color).darker(0.9))
            right.attr('fill', d3.color(com.gridBib.blocks.background.side.color).darker(0.4))
          }
          function leave (d) {
            if (!cloned) return
            hoveredEnd = undefined
            left.attr('fill', com.gridBib.blocks.background.side.color)
            middle.attr('fill', com.gridBib.blocks.background.middle.color)
            right.attr('fill', com.gridBib.blocks.background.side.color)
          }
          let left = d3.select(this).append('rect')
            .attr('id', 'stripLeft')
            .attr('x', 0) // com.gridBib.telescope.large.box.x)
            .attr('y', sizeRow * 0.08)
            .attr('width', com.gridBib.telescope.medium.box.x)
            .attr('height', sizeRow * 0.84)
            .attr('fill', com.gridBib.blocks.background.side.color)
            .attr('fill-opacity', com.gridBib.blocks.background.side.opacity)
            .attr('stroke-width', 0.0)
            .attr('stroke', colorTheme.dark.stroke)
            .on('mouseenter', enter)
            .on('mouseleave', leave)
          let middle = d3.select(this).append('rect')
            .attr('id', 'stripMiddle')
            .attr('x', com.gridBib.telescope.medium.box.x)
            .attr('y', sizeRow * 0.08)
            .attr('width', com.gridBib.telescope.medium.box.w)
            .attr('height', sizeRow * 0.84)
            .attr('fill', com.gridBib.blocks.background.middle.color) // colorTheme.blocks.run.background)
            .attr('fill-opacity', com.gridBib.blocks.background.middle.opacity)
            .attr('stroke-width', 0.0)
            .attr('stroke', colorTheme.dark.stroke)
            .on('mouseenter', enter)
            .on('mouseleave', leave)
          let right = d3.select(this).append('rect')
            .attr('id', 'stripRight')
            .attr('x', com.gridBib.telescope.medium.box.x + com.gridBib.telescope.medium.box.w)
            .attr('y', sizeRow * 0.08)
            .attr('width', com.main.box.w - (com.gridBib.telescope.medium.box.x + com.gridBib.telescope.medium.box.w))
            .attr('height', sizeRow * 0.84)
            .attr('fill', com.gridBib.blocks.background.side.color)
            .attr('fill-opacity', com.gridBib.blocks.background.side.opacity)
            .attr('stroke-width', 0.0)
            .attr('stroke', colorTheme.dark.stroke)
            .on('mouseenter', enter)
            .on('mouseleave', leave)

          let fontSize = com.gridBib.blocks.txtSize ? com.gridBib.blocks.txtSize : Math.max(Math.min(sizeRow * 0.24, 18), 18)

          if (com.gridBib.blocks.left.enabled) {
            d3.select(this).append('rect')
              .attr('id', 'blockleft')
              .attr('x', 0)
              .attr('y', sizeRow * 0.05)
              .attr('width', com.main.box.w * 0.08)
              .attr('height', sizeRow * 0.9)
              .attr('fill', colorTheme.blocks.run.background)
              .attr('fill-opacity', 1)
              .attr('stroke-width', 0.4)
              .attr('stroke', colorTheme.dark.stroke)
              .on('click', function (d) {
                let event = d3.event
                let node = d3.select(this)
                node.attr('clicked', 1)

                setTimeout(function () {
                  if (node.attr('clicked') === '2') return
                  if (event.ctrlKey) {
                    // com.input.selection.push(that)
                  } else {
                    // com.input.selection = [that]
                  }
                  com.events.block.click(d)
                }, 250)
              })
              .on('dblclick', function (d) {
                let node = d3.select(this)
                node.attr('clicked', 2)
              })
              .on('mouseover', function (d) {
                d3.select(this).style('cursor', 'pointer')
                com.events.block.mouseover('telescope', d.obId)
              })
              .on('mouseout', function (d) {
                d3.select(this).style('cursor', 'default')
                com.events.block.mouseout('telescope', d.obId)
              })
            d3.select(this).append('text')
              .attr('id', 'name')
              .attr('x', com.main.box.w * 0.04)
              .attr('y', sizeRow * 0.5 + 0.5 * fontSize)
              .text(function (d) {
                return d.metaData ? d.metaData.blockName : d.name.split('_')[2]
              })
              .style('fill', colorTheme.blocks.run.text)
              .style('font-weight', 'bold')
              .style('font-size', fontSize + 'px')
              .attr('text-anchor', 'middle')
              .style('pointer-events', 'none')
          }
          if (com.gridBib.blocks.right.enabled) {
            d3.select(this).append('rect')
              .attr('id', 'blockright')
              .attr('x', com.main.box.w - com.main.box.w * 0.08)
              .attr('y', sizeRow * 0.05)
              .attr('width', com.main.box.w * 0.08)
              .attr('height', sizeRow * 0.9)
              .attr('fill', colorTheme.blocks.run.background)
              .attr('fill-opacity', 1)
              .attr('stroke-width', 0.4)
              .attr('stroke', colorTheme.dark.stroke)
            d3.select(this).append('text')
              .attr('id', 'target')
              .text(d.pointings[0].name.split('/')[0])
              .attr('x', com.main.box.w - com.main.box.w * 0.04)
              .attr('y', sizeRow * 0.5 + 0.5 * fontSize)
              .style('fill', colorTheme.blocks.run.text)
              .style('font-weight', 'normal')
              .style('font-size', fontSize + 'px')
              .attr('text-anchor', 'middle')
              .style('pointer-events', 'none')
          }
        })
        offset = {
          x: 0,
          y: transY
        }
        let merge = current.merge(enter)
        merge.each(function (d, i) {
          let sizeRow = com.gridBib.maxHeight * d.rowHeight
          d3.select(this).attr('transform', function (d) {
            let tx = offset.x
            let ty = offset.y
            offset.y += sizeRow
            return 'translate(' + tx + ',' + ty + ')'
          })
          d3.select(this).select('rect#blockleft')
            .transition()
            .duration(timeD.animArc)
            .attr('x', 0)
            .attr('y', 1)
            .attr('width', com.main.box.w * 0.08)
            .attr('height', sizeRow - 2)
          d3.select(this).select('rect#blockright')
            .transition()
            .duration(timeD.animArc)
            .attr('x', com.main.box.w - com.main.box.w * 0.08)
            .attr('y', 1)
            .attr('width', com.main.box.w * 0.08)
            .attr('height', sizeRow - 2)
          d3.select(this).select('rect#stripLeft')
            .transition()
            .duration(timeD.animArc)
            .attr('y', 2)
            .attr('height', sizeRow - 4)
          d3.select(this).select('rect#stripMiddle')
            .transition()
            .duration(timeD.animArc)
            .attr('y', 2)
            .attr('height', sizeRow - 4)
          d3.select(this).select('rect#stripRight')
            .transition()
            .duration(timeD.animArc)
            .attr('y', 2)
            .attr('height', sizeRow - 4)

          let fontSize = com.gridBib.blocks.txtSize ? com.gridBib.blocks.txtSize : Math.max(Math.min(sizeRow * 0.24, 18), 10)
          d3.select(this).select('text#name')
            .attr('y', sizeRow * 0.5 + 0.35 * fontSize)
            .style('font-size', fontSize + 'px')
          d3.select(this).select('text#target')
            .attr('y', sizeRow * 0.5 + 0.35 * fontSize)
            .style('font-size', fontSize + 'px')
        })
        current
          .exit()
          .transition('inOut')
          .duration(timeD.animArc)
          .style('opacity', 0)
          .remove()

        offset = {
          x: 0,
          y: transY
        }
        for (let i = 0; i < com.data.raw.blocks.length; i++) {
          let sizeRow = com.gridBib.maxHeight * com.data.raw.blocks[i].rowHeight
          let largeT = []
          let mediumT = []
          let smallT = []
          for (let j = 0; j < com.data.raw.blocks[i].telIds.length; j++) {
            let t = com.data.raw.blocks[i].telIds[j]
            if (t[0] === 'L') largeT.push(t)
            if (t[0] === 'M') mediumT.push(t)
            if (t[0] === 'S') smallT.push(t)
          }
          largeT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
          mediumT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
          smallT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
          let lb = {x: com.gridBib.telescope.large.box.x, y: offset.y, w: com.gridBib.telescope.large.box.w, h: sizeRow}
          let mb = {x: com.gridBib.telescope.medium.box.x, y: offset.y, w: com.gridBib.telescope.medium.box.w, h: sizeRow}
          let sb = {x: com.gridBib.telescope.small.box.x, y: offset.y, w: com.gridBib.telescope.small.box.w, h: sizeRow}
          drawTels(largeT, com.gridBib.telescope.large.g, lb, com.gridBib.telescope.large.opt)
          drawTels(mediumT, com.gridBib.telescope.medium.g, mb, com.gridBib.telescope.medium.opt)
          drawTels(smallT, com.gridBib.telescope.small.g, sb, com.gridBib.telescope.small.opt)
          offset.y += sizeRow
        }
      }
      if (com.gridBib.idle.enabled) {
        let sizeRow = com.gridBib.maxHeight * com.gridBib.idleRow
        let largeT = []
        let mediumT = []
        let smallT = []
        for (let i = 0; i < com.gridBib.freeTels.length; i++) {
          let t = com.gridBib.freeTels[i]
          if (t[0] === 'L') largeT.push(t)
          if (t[0] === 'M') mediumT.push(t)
          if (t[0] === 'S') smallT.push(t)
        }
        largeT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
        mediumT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
        smallT.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })
        let lb = {x: com.gridBib.telescope.large.box.x, y: offset.y, w: com.gridBib.telescope.large.box.w, h: sizeRow}
        let mb = {x: com.gridBib.telescope.medium.box.x, y: offset.y, w: com.gridBib.telescope.medium.box.w, h: sizeRow}
        let sb = {x: com.gridBib.telescope.small.box.x, y: offset.y, w: com.gridBib.telescope.small.box.w, h: sizeRow}
        drawTels(largeT, com.gridBib.telescope.large.g, lb, com.gridBib.telescope.large.opt)
        drawTels(mediumT, com.gridBib.telescope.medium.g, mb, com.gridBib.telescope.medium.opt)
        drawTels(smallT, com.gridBib.telescope.small.g, sb, com.gridBib.telescope.small.opt)

        let fontSize = com.gridBib.idle.txtSize !== undefined ? com.gridBib.idle.txtSize : Math.max(Math.min(sizeRow * 0.24, 18), 10)
        com.gridBib.back.select('text#idle')
          .transition()
          .duration(timeD.animArc)
          .attr('x', com.main.box.w * 0.04)
          .attr('y', (sizeRow * 0.5) + (fontSize * 0.4) + offset.y)
          .attr('opacity', com.gridBib.freeTels.length === 0 ? 0 : 1)
          .style('font-size', fontSize + 'px')
        com.gridBib.back.select('rect#idle')
          .transition()
          .duration(timeD.animArc)
          .attr('x', 0)
          .attr('y', offset.y)
          .attr('width', com.main.box.w * 1.0)
          .attr('height', sizeRow)
        com.gridBib.back.select('rect#idleMiddle')
          .transition()
          .duration(timeD.animArc)
          .attr('x', com.gridBib.telescope.medium.box.x)
          .attr('y', offset.y)
          .attr('width', com.gridBib.telescope.medium.box.w)
          .attr('height', sizeRow)
      }
    }
    this.update = update

    function remove () {
      if (com.telescopeQueue.axis.enabled) com.telescopeQueue.axis.g.remove()
      if (com.telescopeQueue.telescopes.enabled) com.telescopeQueue.telescopes.clipping.g.remove()
      if (com.telescopeQueue.timeBars.enabled) com.telescopeQueue.timeBars.g.remove()
    }
    this.remove = remove
  }
  let gridBib = new GridBib()

  function init () {
    setDefaultStyle()
    initScrollBox()
    // this.initBackground()

    if (com.displayer === 'gridBib') {
      gridBib.init()
    }
  }
  this.init = init
  function initScrollBox () {
    com.main.scroll.scrollBoxG = com.main.g.append('g')
    com.main.scroll.scrollBoxG.append('rect')
      .attr('class', 'background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', com.main.box.w)
      .attr('height', com.main.box.h)
      .style('fill', com.main.background.fill)
      .style('stroke', com.main.background.stroke)
      .style('stroke-width', com.main.background.strokeWidth)

    com.main.scroll.scrollBox = new ScrollBox()
    let ntag = com.main.tag + 'Scroll'
    com.main.scroll.scrollBox.init({
      tag: ntag,
      gBox: com.main.scroll.scrollBoxG,
      boxData: {
        x: 0,
        y: 0,
        w: com.main.box.w,
        h: com.main.box.h
      },
      useRelativeCoords: true,
      locker: new Locker(),
      lockerV: [ntag + 'updateData'],
      lockerZoom: {
        all: ntag + 'zoom',
        during: ntag + 'zoomDuring',
        end: ntag + 'zoomEnd'
      },
      runLoop: new RunLoop({tag: ntag}),
      canScroll: true,
      scrollVertical: false,
      scrollHorizontal: true,
      scrollHeight: 0,
      scrollWidth: 0,
      background: 'transparent',
      scrollRecH: {h: 2},
      scrollRecV: {w: 2}
    })
    com.main.scroll.scrollG = com.main.scroll.scrollBox.get('innerG')
    console.log(com.main.scroll.scrollG);
    com.main.background = com.main.scroll.scrollG.append('g')
    com.main.foreground = com.main.scroll.scrollG.append('g')
  }
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
  this.initBackground = initBackground

  function filterData (optIn) {
    return {data: com.data.raw.telescopes}
    function checkFilter (d, f) {
      let op = f.operation
      let co = f.contains
      let filters = f.filters

      if (co === 'all') {
        for (let i = 0; i < filters.length; i++) {
          let target = d
          for (let j = 0; j < filters[i].keys.length; j++) {
            target = target[filters[i].keys[j]]
          }
          if (Array.isArray(target)) {
            if (target.indexOf(filters[i].value) === -1) {
              if (op === 'exclude') return false
              if (op === 'include') return true
            }
          } else if (target !== filters[i].value) {
            if (op === 'exclude') return false
            if (op === 'include') return true
          }
        }
        if (op === 'exclude') return true
        if (op === 'include') return false
      } else if (co === 'one') {
        for (let i = 0; i < filters.length; i++) {
          let target = d
          for (let j = 0; j < filters[i].keys.length; j++) {
            target = target[filters[i].keys[j]]
          }
          if (Array.isArray(target)) {
            if (target.indexOf(filters[i].value) !== -1) {
              if (op === 'exclude') return true
              if (op === 'include') return false
            }
          } else if (target === filters[i].value) {
            if (op === 'exclude') return true
            if (op === 'include') return false
          }
        }
        if (op === 'exclude') return false
        if (op === 'include') return true
      }
      return false
    }

    let filters = optIn.filters ? optIn.filters : com.filters.filtering

    let filtered = {done: [], run: [], cancel: [], wait: [], fail: []}
    let stats = {tot: 0, filtered: 0}
    stats.tot = com.data.raw.telescopes.done.length + com.data.raw.telescopes.wait.length + com.data.raw.telescopes.run.length
    // separate telescope according to states
    for (var z = 0; z < com.data.raw.telescopes.done.length; z++) {
      let dataNow = com.data.raw.telescopes.done[z]
      dataNow.filtered = false
      if (filters.length === 0) {
        if (dataNow.exeState.state === 'done') filtered.done.push(dataNow)
        if (dataNow.exeState.state === 'fail') filtered.fail.push(dataNow)
        if (dataNow.exeState.state === 'cancel') filtered.cancel.push(dataNow)
      } else {
        for (var i = 0; i < filters.length; i++) {
          let filterNow = filters[i]
          let allPropChecked = true
          if (!checkFilter(dataNow, filterNow)) allPropChecked = false
          if (allPropChecked) {
            dataNow.filtered = true
          }
        }
        if (dataNow.exeState.state === 'done') filtered.done.push(dataNow)
        if (dataNow.exeState.state === 'fail') filtered.fail.push(dataNow)
        if (dataNow.exeState.state === 'cancel') filtered.cancel.push(dataNow)
      }
      if (dataNow.filtered) stats.filtered += 1
    }

    filtered.wait = com.data.raw.telescopes.wait.map(function (dataNow) {
      dataNow.filtered = false
      if (filters.length === 0) return dataNow
      for (var i = 0; i < filters.length; i++) {
        let filterNow = filters[i]
        let allPropChecked = true
        if (!checkFilter(dataNow, filterNow)) allPropChecked = false
        if (allPropChecked) {
          dataNow.filtered = true
        }
      }
      if (dataNow.filtered) stats.filtered += 1
      return dataNow
    })
    filtered.run = com.data.raw.telescopes.run.map(function (dataNow) {
      dataNow.filtered = false
      if (filters.length === 0) return dataNow
      for (var i = 0; i < filters.length; i++) {
        let filterNow = filters[i]
        let allPropChecked = true
        if (!checkFilter(dataNow, filterNow)) allPropChecked = false
        if (allPropChecked) {
          dataNow.filtered = true
        }
      }
      if (dataNow.filtered) stats.filtered += 1
      return dataNow
    })
    return {data: filtered, stats: stats}
  }
  this.filterData = filterData

  function clone (d3obj) {
    var node = d3obj.node()
    return d3.select(node.parentNode.insertBefore(node.cloneNode(true), node.nextSibling))
  }

  function defaultclick () {

  }
  function defaultdblclick () {

  }
  function defaultmouseover (elem, d) {
    if (com.displayer === 'gridBib') {
      gridBib.mouseover(elem, d)
    } else {
      elem.style('cursor', 'pointer')
      com.events.telescope.mouseover('telescope', d.obId)
    }
  }
  function defaultmouseout (elem, d) {
    if (com.displayer === 'gridBib') {
      gridBib.mouseout(elem, d)
    } else {
      elem.style('cursor', 'default')
      com.events.telescope.mouseout('telescope', d.obId)
    }
  }
  function createTelescopesGroup () {
    let all = [].concat(com.data.filtered.telescopes)

    let rect = com.main.foreground
      .selectAll('g.' + com.main.tag + 'telescopes')
      .data(all, function (d, i) {
        return d.id
      })
    let enter = rect
      .enter()
      .append('g')
      .attr('class', com.main.tag + 'telescopes')
      .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    enter.each(function (d, i) {
      let parent = d3.select(this)
      d3.select(this).append('ellipse')
        .attr('id', 'back')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('stroke', '#000000')
        .style('fill', '#000000')
        .style('fill-opacity', 0)
        .attr('stroke-width', 0)
        .style('stroke-opacity', 0)
        .style('stroke-dasharray', [])
        .attr('vector-effect', 'non-scaling-stroke')
        .on('click', function (d) {
          let event = d3.event
          let node = d3.select(this)
          node.attr('clicked', 1)

          setTimeout(function () {
            if (node.attr('clicked') === '2') return
            if (event.ctrlKey) {
              // com.input.selection.push(that)
            } else {
              // com.input.selection = [that]
            }
            com.events.telescope.click(d)
          }, 250)
        })
        .on('dblclick', function (d) {
          let node = d3.select(this)
          node.attr('clicked', 2)
        })
        .on('mouseover', function (d) {
          defaultmouseover(d3.select(this), d)
        })
        .on('mouseout', function (d) {
          defaultmouseout(d3.select(this), d)
        })
        .call(d3.drag()
          .on('start', function (d) {
            com.events.telescope.drag.start(d)
          })
          .on('drag', function (d) {
            com.events.telescope.drag.tick(d)
          })
          .on('end', function (d) {
            com.events.telescope.drag.end(d)
          }))
      d3.select(this).append('rect')
        .attr('class', 'pattern')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0)
        .attr('stroke', 'none')
        .style('fill', 'none')
        .style('fill-opacity', 1)
        .style('stroke-opacity', 0)
        .style('pointer-events', 'none')
        .attr('vector-effect', 'non-scaling-stroke')
      d3.select(this).append('text')
        .attr('id', 'name')
        .text(d.id)
        .style('font-weight', 'normal')
        .style('opacity', 0)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', '#000000')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')

      // if (com.interaction) {
      //   if (com.interaction.delete.enabled) {
      //     d3.select(this).append('rect')
      //       .attr('id', 'deleteBack')
      //       .attr('x', 0)
      //       .attr('y', 0)
      //       .attr('width', 0)
      //       .attr('height', 0)
      //       .attr('stroke', colorTheme.darker.stroke)
      //       .style('fill', colorTheme.darker.background)
      //       .style('opacity', 0)
      //       .attr('vector-effect', 'non-scaling-stroke')
      //     d3.select(this).append('text')
      //       .attr('id', 'delete')
      //       .text('x')
      //       .attr('x', 0)
      //       .attr('y', 0)
      //       .style('font-size', 8 + 'px')
      //       .style('font-weight', 'bold')
      //       .style('opacity', 0)
      //       .style('fill', '#000000')
      //       .attr('vector-effect', 'non-scaling-stroke')
      //       .style('pointer-events', 'none')
      //       .attr('text-anchor', 'middle')
      //   }
      // }
    })
    // let merged = enter
    //   .merge(rect)
    rect
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()
  }
  function updateData (dataIn) {
    com.data.raw = dataIn.data.raw
    // com.filters.filtering = updateFiltering()
    com.data.filtered.telescopes = filterData({}).data
    createTelescopesGroup()

    if (com.displayer === 'gridBib') {
      gridBib.update()
    }
  }
  this.updateData = updateData
  function update () {
    // com.filters.filtering = updateFiltering()
    com.data.filtered = filterData({}).data
    createTelescopesGroup()
    if (com.displayer === 'gridBib') {
      gridBib.update()
    }
  }
  this.update = update

  function changeDisplayer (newDisplayer) {
    if (com.displayer === newDisplayer) return

    if (com.displayer === 'gridBib') {
      gridBib.remove()
    }

    com.displayer = newDisplayer
    if (com.displayer === 'gridBib') {
      gridBib.init()
      gridBib.update()
    }
  }
  this.changeDisplayer = changeDisplayer

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  // function telescopesMouseOver (data) {
  //   let totTelescopes = com.telescopeQueue.telescopes.run.g.selectAll('g.' + com.main.tag + 'telescopes')
  //   if (com.telescopeQueue.telescopes.cancel.g) totTelescopes.merge(com.telescopeQueue.telescopes.cancel.g.selectAll('g.' + com.main.tag + 'telescopes'))
  //
  //   totTelescopes.each(function (d) {
  //     if (d.data.metaData.nSched === data.data.metaData.nSched && d.data.metaData.nObs !== data.data.metaData.nObs) {
  //       d3.select(this).select('rect.back').attr('stroke-width', 6)
  //         .style('stroke-opacity', 1)
  //         .attr('stroke-dasharray', [4, 2])
  //     }
  //   })
  // }
  // function telescopesMouseOut (data) {
  //   let totTelescopes = com.telescopeQueue.telescopes.run.g.selectAll('g.' + com.main.tag + 'telescopes')
  //   if (com.telescopeQueue.telescopes.cancel.g) totTelescopes.merge(com.telescopeQueue.telescopes.cancel.g.selectAll('g.' + com.main.tag + 'telescopes'))
  //
  //   totTelescopes.each(function (d) {
  //     if (d.data.metaData.nSched === data.data.metaData.nSched && d.data.metaData.nObs !== data.data.metaData.nObs) {
  //       d3.select(this).select('rect.back').attr('stroke-width', 1)
  //         .style('stroke-opacity', 0.4)
  //         .attr('stroke-dasharray', [])
  //     }
  //   })
  // }

  function overTelescope (id) {
    com.input.over.telescope = id
    if (com.displayer === 'gridBib') {
      gridBib.update()
    }
  }
  this.overTelescope = overTelescope
  function outTelescope (id) {
    com.input.over.telescope = undefined
    if (com.displayer === 'gridBib') {
      gridBib.update()
    }
  }
  this.outTelescope = outTelescope

  function focusOnTelescope (id) {
    com.input.focus.telescope = id
    if (com.displayer === 'gridBib') {
      gridBib.update()
    }
  }
  this.focusOnTelescope = focusOnTelescope
  function unfocusOnTelescope (id) {
    com.input.focus.telescope = undefined
    if (com.displayer === 'gridBib') {
      gridBib.update()
    }
  }
  this.unfocusOnTelescope = unfocusOnTelescope

  function updateFiltering () {
    let allFilters = []
    for (let i = com.filters.telescopeFilters.length - 1; i > -1; i--) {
      let filters = com.filters.telescopeFilters[i].getFilters()
      allFilters = allFilters.concat(filters)
    }
    return allFilters
  }
  function plugTelescopeFilters (telescopeFilters, propagate) {
    com.filters.telescopeFilters.push(telescopeFilters)
    if (propagate) telescopeFilters.plugTelescopeQueue(this, !propagate)
  }
  this.plugTelescopeFilters = plugTelescopeFilters
  function unplugTelescopeFilters (telescopeFilters, propagate) {
    for (let i = com.filters.telescopeFilters.length - 1; i > -1; i--) {
      if (com.filters.telescopeFilters[i] === telescopeFilters) {
        com.filters.telescopeFilters[i].remove()
      }
    }
    if (propagate) telescopeFilters.unplugTelescopeQueue(this, !propagate)
  }
  this.unplugTelescopeFilters = unplugTelescopeFilters
}
