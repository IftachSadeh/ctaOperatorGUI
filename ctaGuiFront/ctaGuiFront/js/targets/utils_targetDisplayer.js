/* global $ */
/* global d3 */
/* global hasVar */
/* global getColorTheme */
/* global loadScript */
/* global ScrollBox */
/* global Locker */
/* global RunLoop */
/* global targetIcon */
/* global pointingIcon */

loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollBox.js' })

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.TargetDisplayer = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  let com = {
    main: {
      tag: 'targetRootTag',
      g: undefined,
      scroll: {},
      box: {x: 0, y: 0, w: 1000, h: 300, marg: 0},
      background: {
        fill: colorTheme.brighter.background,
        stroke: colorTheme.brighter.stroke,
        strokeWidth: 0.5
      }
    },

    displayer: 'default',
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
        enabled: false
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
  }

  let DefaultBib = function () {
    function init () {
      function initQuickMap () {
        if (!com.defaultBib.quickmap.enabled) return
      }
      function initSkyMap () {
        if (!com.defaultBib.skymap.enabled) return
        let txtSize = 10
        com.defaultBib.skymap.g = com.main.g.append('g')
          .attr('id', 'skymap')
          .attr('transform', 'translate(' + com.defaultBib.skymap.box.x + ',' + com.defaultBib.skymap.box.y + ')')
        com.defaultBib.skymap.g.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', com.defaultBib.skymap.box.w)
          .attr('height', com.defaultBib.skymap.box.h)
          .attr('fill', colorTheme.bright.background)
          .attr('stroke', colorTheme.bright.stroke)
          .attr('stroke-width', 0.1)
        for (let i = 0; i < 10; i++) {
          com.defaultBib.skymap.g.append('line')
            .attr('x1', 0)
            .attr('y1', (com.defaultBib.skymap.box.h / 10) * i)
            .attr('x2', com.defaultBib.skymap.box.w)
            .attr('y2', (com.defaultBib.skymap.box.h / 10) * i)
            .attr('stroke', colorTheme.bright.stroke)
            .attr('stroke-width', 0.1)
        }
        for (let i = 0; i < 10; i++) {
          com.defaultBib.skymap.g.append('line')
            .attr('x1', (com.defaultBib.skymap.box.w / 10) * i)
            .attr('y1', 0)
            .attr('x2', (com.defaultBib.skymap.box.w / 10) * i)
            .attr('y2', com.defaultBib.skymap.box.h)
            .attr('stroke', colorTheme.bright.stroke)
            .attr('stroke-width', 0.1)
        }
        com.defaultBib.skymap.g.append('text')
          .attr('id', 'mainTargetCross')
          .text('+')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize * 1.4 + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (com.defaultBib.skymap.box.w * 0.5) + ',' + (com.defaultBib.skymap.box.h * 0.5 + txtSize * 0.33) + ')')
        com.defaultBib.skymap.g.append('text')
          .attr('id', 'mainTargetName')
          // .text(com.defaultBib.skymap.mainTarget.id)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (com.defaultBib.skymap.box.w * 0.5) + ',' + (com.defaultBib.skymap.box.h * 0.5 + txtSize * 1.33) + ')')
        // let offX = (data.pointingPos[0] - target.pos[0]) * 4
        // let offY = (data.pointingPos[1] - target.pos[1]) * 4
        // com.defaultBib.skymap.g.append('text')
        //   .text('+')
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', 'bold')
        //   .style('font-size', txtSize * 1.4 + 'px')
        //   .attr('text-anchor', 'middle')
        //   .attr('transform', 'translate(' + (box.h * 0.5 + 3 + offX) + ',' + (box.h * 0.5 + offY + txtSize * 0.3) + ')')
        // com.defaultBib.skymap.g.append('text')
        //   .text('ptg')
        //   .style('fill', colorTheme.dark.stroke)
        //   .style('font-weight', '')
        //   .style('font-size', txtSize + 'px')
        //   .attr('text-anchor', 'middle')
        //   .attr('transform', 'translate(' + (box.h * 0.5 + 3 + offX) + ',' + ((data.pointingPos[1] < target.pos[1] ? -txtSize * 1.3 : txtSize * 1.3) + box.h * 0.5 + offY) + ')')
      }
      function initLegend () {
        if (!com.defaultBib.legend.enabled) return
      }
      initQuickMap()
      initSkyMap()
      initLegend()
    }
    this.init = init

    function update () {
      if (com.data.filtered.targets.length === 0) return

      let txtSize = 10

      if (!com.defaultBib.skymap.mainTarget) {
        com.defaultBib.skymap.mainTarget = com.data.filtered.targets[0]
        com.defaultBib.skymap.g.select('text#mainTargetName')
          .text(com.defaultBib.skymap.mainTarget.id)
      }

      for (let i = 0; i < com.data.filtered.pointings.length; i++) {
        let data = com.data.filtered.pointings[i]
        let offX = (data.pos[0] - com.defaultBib.skymap.mainTarget.pos[0]) * 6
        let offY = (data.pos[1] - com.defaultBib.skymap.mainTarget.pos[1]) * 6
        com.defaultBib.skymap.g.append('text')
          .text('+')
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', 'bold')
          .style('font-size', txtSize * 1.4 + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (com.defaultBib.skymap.box.h * 0.5 + offX) + ',' + (com.defaultBib.skymap.box.h * 0.5 + offY + txtSize * 0.3) + ')')
        com.defaultBib.skymap.g.append('text')
          .text(data.name)
          .style('fill', colorTheme.dark.stroke)
          .style('font-weight', '')
          .style('font-size', txtSize + 'px')
          .attr('text-anchor', 'middle')
          .attr('transform', 'translate(' + (com.defaultBib.skymap.box.h * 0.5 + offX) + ',' + ((data.pos[1] < com.defaultBib.skymap.mainTarget.pos[1] ? -txtSize * 1.3 : txtSize * 1.3) + com.defaultBib.skymap.box.h * 0.5 + offY) + ')')
      }
    }
    this.update = update

    function remove () {
      if (com.target.axis.enabled) com.target.axis.g.remove()
      if (com.target.targets.enabled) com.target.targets.clipping.g.remove()
      if (com.target.timeBars.enabled) com.target.timeBars.g.remove()
    }
    this.remove = remove
  }
  let defaultBib = new DefaultBib()
  let LinkMapBib = function () {
    function init () {
      function initMap () {
        if (!com.linkMap.map.enabled) return
        let txtSize = 10
        com.linkMap.map.g = com.main.g.append('g')
          .attr('id', 'map')
          .attr('transform', 'translate(' + com.linkMap.map.box.x + ',' + com.linkMap.map.box.y + ')')
        com.linkMap.map.g.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', com.linkMap.map.box.w)
          .attr('height', com.linkMap.map.box.h)
          .attr('fill', colorTheme.bright.background)
          .attr('stroke', colorTheme.bright.stroke)
          .attr('stroke-width', 0.1)
      }
      initMap()
    }
    this.init = init

    function update () {
      if (com.data.filtered.targets.length === 0 && com.data.filtered.pointings.length === 0) return

      let sizeTarget = 22
      let sizePointing = 22
      let max = 24

      let data = {nodes: [], links: []}
      for (let i = 0; i < com.data.filtered.targets.length; i++) {
        data.nodes.push({type: 'target', id: com.data.filtered.targets[i].id, data: com.data.filtered.targets[i], x: com.linkMap.map.box.w * 0.5, y: com.linkMap.map.box.h * 0.5})
      }
      for (let i = 0; i < com.data.filtered.pointings.length; i++) {
        data.nodes.push({type: 'pointing', id: com.data.filtered.pointings[i].name, data: com.data.filtered.pointings[i], x: com.linkMap.map.box.w * 0.5, y: com.linkMap.map.box.h * 0.5})
        data.links.push({type: 'link', source: com.data.filtered.pointings[i].name, target: getPointingTarget(com.data.filtered.pointings[i])})
      }

      let simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(function (d) { return d.id }))
        .force('collide', d3.forceCollide(function (d) {
          if (d.type === 'target') return sizeTarget * 0.65
          else if (d.type === 'pointing') return sizePointing * 0.65
        }).iterations(32))
        .force('charge', d3.forceManyBody().strength(function (d) {
          return -500
        }))
        .force('center', d3.forceCenter((com.linkMap.map.box.w / 2), (com.linkMap.map.box.h / 2)))
        .force('y', d3.forceY())
        .force('x', d3.forceX())
        // .alphaDecay(0.0005)
        .velocityDecay(0.6)
        // .alpha(0.1).restart()
      simulation.nodes(data.nodes)
      simulation.force('link').links(data.links).distance(function (d) {
        return 4
      })
      var link = com.linkMap.map.g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links)
        .enter()
        .append('line')
        .attr('stroke', 'black')
        .attr('stroke-width', 0.4)

      var node = com.linkMap.map.g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(data.nodes)
        .enter().append('g')
        .attr('id', function (d) { return d.id })
        .each(function (d) {
          let g = d3.select(this)
          if (d.type === 'target') targetIcon(g, {w: sizeTarget, h: sizeTarget}, getTargetShort(d.data), {}, colorPalette)
          else if (d.type === 'pointing') pointingIcon(g, {w: sizePointing, h: sizePointing * 0.8}, getPointingNumber(d.data), {}, colorPalette)
        })
        .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')

      let simulationDurationInMs = 1000
      let startTime = Date.now()
      let endTime = startTime + simulationDurationInMs
      simulation.on('tick', function () {
        // if (Date.now() > endTime) {
        //   simulation.stop()
        //   return
        // }
        link
          .attr('x1', function (d) { return Math.max(max, Math.min(com.linkMap.map.box.w - max, d.source.x)) })
          .attr('y1', function (d) { return Math.max(max, Math.min(com.linkMap.map.box.h - max, d.source.y)) })
          .attr('x2', function (d) { return Math.max(max, Math.min(com.linkMap.map.box.w - max, d.target.x)) })
          .attr('y2', function (d) { return Math.max(max, Math.min(com.linkMap.map.box.h - max, d.target.y)) })

        node.attr('transform', function (d) {
          if (d.type === 'target') {
            d.x = Math.max(sizeTarget, Math.min(com.linkMap.map.box.w - sizeTarget, d.x)) - sizeTarget / 2
            d.y = Math.max(sizeTarget, Math.min(com.linkMap.map.box.h - sizeTarget, d.y)) - sizeTarget / 2
          } else if (d.type === 'pointing') {
            d.x = Math.max(sizePointing, Math.min(com.linkMap.map.box.w - sizePointing, d.x)) - sizePointing / 2
            d.y = Math.max(sizePointing, Math.min(com.linkMap.map.box.h - sizePointing, d.y)) - sizePointing / 2
          }
          return 'translate(' + d.x + ',' + d.y + ')'
        })
        // .attr('cx', function (d) {
        //   d.x = Math.max(10, Math.min(com.linkMap.map.box.w - 10, d.x))
        //   return d.x
        // })
        // .attr('cy', function (d) {
        //   d.y = Math.max(10, Math.min(com.linkMap.map.box.h - 10, d.y))
        //   return d.y
        // })
      })
    }
    this.update = update

    function remove () {
      if (com.target.axis.enabled) com.target.axis.g.remove()
      if (com.target.targets.enabled) com.target.targets.clipping.g.remove()
      if (com.target.timeBars.enabled) com.target.timeBars.g.remove()
    }
    this.remove = remove
  }
  let linkMapBib = new LinkMapBib()

  function init () {
    setDefaultStyle()
    initScrollBox()

    if (com.displayer === 'defaultBib') {
      defaultBib.init()
    } else if (com.displayer === 'linkMap') {
      linkMapBib.init()
    }
  }
  this.init = init
  function initScrollBox () {
    com.main.scroll.scrollBoxG = com.main.g.append('g')
    // com.main.scroll.scrollBoxG.append('rect')
    //   .attr('class', 'background')
    //   .attr('x', 0)
    //   .attr('y', 0)
    //   .attr('width', com.main.box.w)
    //   .attr('height', com.main.box.h)
    //   .style('fill', com.main.background.fill)
    //   .style('stroke', com.main.background.stroke)
    //   .style('stroke-width', com.main.background.strokeWidth)

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
    return {data: {targets: com.data.raw.targets, pointings: com.data.raw.pointings}}
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
    stats.tot = com.data.raw.targets.done.length + com.data.raw.targets.wait.length + com.data.raw.targets.run.length
    // separate target according to states
    for (var z = 0; z < com.data.raw.targets.done.length; z++) {
      let dataNow = com.data.raw.targets.done[z]
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

    filtered.wait = com.data.raw.targets.wait.map(function (dataNow) {
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
    filtered.run = com.data.raw.targets.run.map(function (dataNow) {
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
  function createTargetsGroup () {
    let all = [].concat(com.data.filtered.targets)

    let rect = com.main.foreground
      .selectAll('g.' + com.main.tag + 'targets')
      .data(all, function (d) {
        return d.id
      })
    let enter = rect
      .enter()
      .append('g')
      .attr('class', com.main.tag + 'targets')
      .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    enter.each(function (d, i) {
      let parent = d3.select(this)
      // d3.select(this).append('ellipse')
      //   .on('click', function (d) {
      //     let event = d3.event
      //     let node = d3.select(this)
      //     node.attr('clicked', 1)
      //
      //     setTimeout(function () {
      //       if (node.attr('clicked') === '2') return
      //       if (event.ctrlKey) {
      //         // com.input.selection.push(that)
      //       } else {
      //         // com.input.selection = [that]
      //       }
      //       com.events.target.click(d)
      //     }, 250)
      //   })
      //   .on('dblclick', function (d) {
      //     let node = d3.select(this)
      //     node.attr('clicked', 2)
      //   })
      //   .on('mouseover', function (d) {
      //     d3.select(this).style('cursor', 'pointer')
      //     com.events.target.mouseover('target', d.obId)
      //   })
      //   .on('mouseout', function (d) {
      //     d3.select(this).style('cursor', 'default')
      //     com.events.target.mouseout('target', d.obId)
      //   })
    })
  }
  function updateData (dataIn) {
    com.data.raw = dataIn.data.raw
    // com.filters.filtering = updateFiltering()
    com.data.filtered = filterData({}).data
    createTargetsGroup()

    if (com.displayer === 'defaultBib') {
      defaultBib.update()
    } else if (com.displayer === 'linkMap') {
      linkMapBib.update()
    }
  }
  this.updateData = updateData
  function update () {
    // com.filters.filtering = updateFiltering()
    com.data.filtered = filterData({}).data
    createTargetsGroup()
    if (com.displayer === 'defaultBib') {
      defaultBib.update()
    } else if (com.displayer === 'linkMap') {
      linkMapBib.update()
    }
  }
  this.update = update

  function changeDisplayer (newDisplayer) {
    if (com.displayer === newDisplayer) return

    if (com.displayer === 'defaultBib') {
      defaultBib.remove()
    } else if (com.displayer === 'linkMap') {
      linkMapBib.remove()
    }

    com.displayer = newDisplayer
    if (com.displayer === 'defaultBib') {
      defaultBib.init()
      defaultBib.update()
    } else if (com.displayer === 'linkMap') {
      linkMapBib.init()
      linkMapBib.update()
    }
  }
  this.changeDisplayer = changeDisplayer

  function overTarget (id) {
    com.input.over.target = id
    if (com.displayer === 'defaultBib') {
      defaultBib.update()
    } else if (com.displayer === 'linkMap') {
      linkMapBib.update()
    }
  }
  this.overTarget = overTarget
  function outTarget (id) {
    com.input.over.target = undefined
    if (com.displayer === 'defaultBib') {
      defaultBib.update()
    } else if (com.displayer === 'linkMap') {
      linkMapBib.update()
    }
  }
  this.outTarget = outTarget

  function focusOnTarget (id) {
    com.input.focus.target = id
    if (com.displayer === 'defaultBib') {
      defaultBib.update()
    } else if (com.displayer === 'linkMap') {
      linkMapBib.update()
    }
  }
  this.focusOnTarget = focusOnTarget
  function unfocusOnTarget (id) {
    com.input.focus.target = undefined
    if (com.displayer === 'defaultBib') {
      defaultBib.update()
    } else if (com.displayer === 'linkMap') {
      linkMapBib.update()
    }
  }
  this.unfocusOnTarget = unfocusOnTarget

  function updateFiltering () {
    let allFilters = []
    for (let i = com.filters.targetFilters.length - 1; i > -1; i--) {
      let filters = com.filters.targetFilters[i].getFilters()
      allFilters = allFilters.concat(filters)
    }
    return allFilters
  }
  function plugTargetFilters (targetFilters, propagate) {
    com.filters.targetFilters.push(targetFilters)
    if (propagate) targetFilters.plugTarget(this, !propagate)
  }
  this.plugTargetFilters = plugTargetFilters
  function unplugTargetFilters (targetFilters, propagate) {
    for (let i = com.filters.targetFilters.length - 1; i > -1; i--) {
      if (com.filters.targetFilters[i] === targetFilters) {
        com.filters.targetFilters[i].remove()
      }
    }
    if (propagate) targetFilters.unplugTarget(this, !propagate)
  }
  this.unplugTargetFilters = unplugTargetFilters
}
