/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global colPrime */
/* global colsReds */
/* global deepCopy */
/* global minMaxObj */
/* global colsBlues */
/* global colsPurples */
/* global loadScript */
/* global colsGreens */
/* global colsYellows */
/* global colsPurplesBlues */

loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollBox.js' })

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.BlockQueueOptimizer = function () {
  let template = {
    tag: 'blockQueueDefaultTag',
    g: undefined,
    box: {x: 0, y: 0, w: 0, h: 0},
    axis: {
      enabled: true,
      group: {
        g: undefined,
        box: {x: 0, y: 0, w: 0, h: 0}
      },
      main: undefined,
      scale: undefined,
      domain: [0, 1000],
      range: [0,0],
      showText: true,
      orientation: 'axisBottom'
    },
    blocks: {
      enabled: true,
      group: {
        run: {
          g: undefined,
          box: {x: 0, y: 0, w: 0, h: 0}
        },
        cancel: {
          g: undefined,
          box: {x: 0, y: 0, w: 0, h: 0}
        }
      },
      events: {
        click: () => {},
        mouseover: () => {},
        mouseout: () => {}
      }
    },
    filters: {
      enabled: false,
      group: {
        g: undefined,
        box: {x: 0, y: 0, w: 0, h: 0}
      },
      filters: []
    },
    timeBars: {
      enabled: true,
      group: {
        g: undefined,
        box: {x: 0, y: 0, w: 0, h: 0}
      }
    },
    data: {
      currentTime: {date: undefined, time: undefined},
      startTime: {date: undefined, time: undefined},
      endTime: {date: undefined, time: undefined},
      lastRawData: undefined,
      formatedData: undefined
    },
    debug: {
      enabled: false
    }
  }
  let com = deepCopy(template)

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function init (optIn) {
    com = optIn

    setStyle()
    initAxis()
    initBlocks()
    initFilters()
    initTimeBars()
  }
  this.init = init

  function setStyle (optIn) {
    if (!hasVar(optIn)) optIn = {}

    com.style = {}

    com.style.runRecCol = optIn.runRecCol
    if (!hasVar(com.style.runRecCol)) {
      com.style.runRecCol = colsBlues[2]
    }

    com.style.recCol = optIn.recCol
    if (!hasVar(com.style.recCol)) {
      com.style.recCol = function (optIn) {
        if (optIn.d.data.endTime < com.data.currentTime.time) return '#424242'
        let state = hasVar(optIn.state)
          ? optIn.state
          : optIn.d.data.exeState.state
        let canRun = hasVar(optIn.canRun)
          ? optIn.canRun
          : optIn.d.data.exeState.canRun
        let userModifs = (optIn.d.data.modifications.userModifications.length > 0)
        let optiModifs = (optIn.d.data.modifications.optimizerModifications.length > 0)

        if (state === 'wait') {
          if (userModifs && optiModifs) return '#E65100'
          if (userModifs) return '#C6FF00'
          if (optiModifs) return '#FFCC80'
          return '#e6e6e6'
        } else if (state === 'run') {
          return d3.color(colsPurplesBlues[0]).brighter()
        } else if (state === 'cancel') {
          if (hasVar(canRun)) {
            if (!canRun) return d3.color(colsPurples[3]).brighter()
          }
          return d3.color(colsPurples[4])
        } else return d3.color(colPrime).brighter()
      }
    }

    com.style.txtCol = optIn.txtCol
    if (!hasVar(com.style.txtCol)) {
      com.style.txtCol = function (optIn) {
        if (optIn.d.data.endTime < com.data.currentTime.time) return '#010101'
        else return '#111111'
      }
    }

    com.style.recFillOpac = optIn.recFillOpac
    if (!hasVar(com.style.recFillOpac)) {
      com.style.recFillOpac = function (d, state) {
        // return (d.data.exeState.state == 'wait') ? 0.1 : ((d.data.exeState.state == 'run') ? 0.4 : 0.2);
        return state === 'run' ? 0.4 : 0.15
      }
    }

    com.style.recStrokeOpac = optIn.recStrokeOpac
    if (!hasVar(com.style.recStrokeOpac)) {
      com.style.recStrokeOpac = function (d) {
        return 0.7
      }
    }

    com.style.textOpac = optIn.textOpac
    if (!hasVar(com.style.textOpac)) {
      com.style.textOpac = function (d) {
        return 1
      }
    }
  }
  this.setStyle = setStyle

  function initAxis () {
    if (!com.axis.enabled) return
    com.axis.group.g = com.g.append('g')
      .attr('transform', 'translate(' + com.axis.group.box.x + ',' + com.axis.group.box.y + ')')

    com.axis.scale = d3.scaleTime()
      .range(com.axis.range)
      .domain(com.axis.domain)
    com.axis.main = d3.axisBottom(com.axis.scale)
      .tickFormat(d3.timeFormat('%H:%M'))
    com.axis.group.g
      .attr('class', 'axis')
      .call(com.axis.main)
    com.axis.group.g.select('path').attr('stroke-width', 2).attr('stroke', '#CFD8DC')
    com.axis.group.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 2).attr('stroke', '#CFD8DC')
    com.axis.group.g.selectAll('g.tick').selectAll('text').attr('stroke', '#CFD8DC').attr('fill', '#CFD8DC')
  }
  function initBlocks () {
    if (!com.blocks.enabled) return
    com.blocks.group.run.g = com.g.append('g')
      .attr('transform', 'translate(' + com.blocks.group.run.box.x + ',' + com.blocks.group.run.box.y + ')')
    com.blocks.group.cancel.g = com.g.append('g')
      .attr('transform', 'translate(' + com.blocks.group.cancel.box.x + ',' + com.blocks.group.cancel.box.y + ')')
  }
  function initFilters () {
    if (!com.filters.enabled) return

    function recCol (state) {
      if (state === 'Wait') return '#e6e6e6'
      else if (state === 'Done') return d3.color(colsGreens[0]).brighter()
      else if (state === 'Run') {
        return d3.color(colsPurplesBlues[0]).brighter()
      } else if (state === 'Cancel.canrun') {
        return d3.color(colsPurples[3]).brighter()
      } else if (state === 'Cancel') {
        return d3.color(colsPurples[4])
      } else if (state === 'Fail') return d3.color(colsReds[3]).brighter()
      else return d3.color(colPrime).brighter()
    }
    function createButton (position, type, filter) {
      let newButton = buttonPanel.addButton(position)
      newButton.attr('status', 'disabled')

      let clickFunction = function (rect, filter) {
        if (newButton.attr('status') === 'enabled') {
          newButton.attr('status', 'disabled')
          rect.attr('stroke', function (d, i) {
            return '#000000'
          })
            .attr('stroke-width', 4.5)
            .style('stroke-opacity', 0.6)
          newButton.append('line')
            .attr('class', 'checkboxBar')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', (Number(newButton.attr('width'))))
            .attr('y2', (Number(newButton.attr('height'))))
            .attr('stroke', '#000000')
            .style('stroke-opacity', 0.9)
            .attr('stroke-width', 3)
            .style('pointer-events', 'none')
          newButton.append('line')
            .attr('class', 'checkboxBar')
            .attr('x1', 0)
            .attr('y1', (Number(newButton.attr('height'))))
            .attr('x2', (Number(newButton.attr('width'))))
            .attr('y2', 0)
            .attr('stroke', '#000000')
            .style('stroke-opacity', 0.9)
            .attr('stroke-width', 3)
            .style('pointer-events', 'none')
          // if (filter !== undefined) {
          //   com.filters.filters.push(filter)
          //   updateBlocks()
          // }
        } else {
          newButton.attr('status', 'enabled')
          newButton.selectAll('line.checkboxBar').remove()
          rect.attr('stroke', function (d, i) {
            return '#000000'
          })
            .attr('stroke-width', 0.5)
            .style('stroke-opacity', 1)
          // if (filter !== undefined) {
          //   let index = com.filters.filters.indexOf(filter)
          //   com.filters.filters.splice(index, 1)
          //   updateBlocks()
          // }
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
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('stroke', function (d, i) {
          return 'black'
        })
        .attr('stroke-width', 0.5)
        .style('fill', function (d, i) {
          return recCol(type)
        })
        .style('fill-opacity', function (d, i) {
          return 1
        })
        .on('click', function () {
          clickFunction(d3.select(this), filter)
        })
        .on('mouseover', function () {
          let ginfo = com.filters.group.g.append('g')
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
            if (filter !== undefined) {
              com.filters.filters.push(filter)
              updateBlocks()
            }
          } else if (newButton.attr('status') === 'disabled') {
            if (filter !== undefined) {
              let index = com.filters.filters.indexOf(filter)
              com.filters.filters.splice(index, 1)
              updateBlocks()
            }
          }
        })
        .on('mouseout', function () {
          com.filters.group.g.select('g.info').remove()
          if (newButton.attr('status') !== newButton.attr('status-over')) {
            return
          } else if (newButton.attr('status') === 'disabled') {
            if (filter !== undefined) {
              com.filters.filters.push(filter)
              updateBlocks()
            }
          } else if (newButton.attr('status') === 'enabled') {
            if (filter !== undefined) {
              let index = com.filters.filters.indexOf(filter)
              com.filters.filters.splice(index, 1)
              updateBlocks()
            }
          }
        })

      clickFunction(newRect, type)
    }

    com.filters.group.g = com.g.append('g')
      .attr('transform', 'translate(' + com.filters.group.box.x + ',' + com.filters.group.box.y + ')')

    let margin = {
      inner: 5,
      extern: 5
    }
    let buttonPanel = new ButtonPanel()

    buttonPanel.init({
      g: com.filters.group.g,
      box: com.filters.group.box,
      margin: margin,
      rows: 3,
      cols: 3,
      background: 'none',
      stroke: '#CFD8DC'
    })

    let newButton = buttonPanel.addButton({row: 0, col: 1})
    newButton.append('text')
      .text('SBs Filters')
      .attr('x', Number(newButton.attr('width')) * 0.5)
      .attr('y', Number(newButton.attr('height')) * 0.35)
      .attr('dy', 6)
      .attr('stroke', '#CFD8DC')
      .attr('fill', '#CFD8DC')
      .style('font-weight', 'normal')
      .attr('text-anchor', 'middle')
      .style('font-size', 18)
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    createButton({row: 1, col: 0}, 'Fail', [{keys: ['exeState', 'state'], value: 'fail'}])
    createButton({row: 1, col: 1}, 'Done', [{keys: ['exeState', 'state'], value: 'done'}])
    createButton({row: 1, col: 2}, 'Run', [{keys: ['exeState', 'state'], value: 'run'}])
    createButton({row: 2, col: 0}, 'Cancel.canrun', [{keys: ['exeState', 'state'], value: 'cancel'}, {keys: ['exeState', 'canRun'], value: true}])
    createButton({row: 2, col: 1}, 'Cancel', [{keys: ['exeState', 'state'], value: 'cancel'}, {keys: ['exeState', 'canRun'], value: false}])
    createButton({row: 2, col: 2}, 'Wait', [{keys: ['exeState', 'state'], value: 'wait'}])
  }

  function initTimeBars () {
    if (!com.timeBars.enabled) return
    com.timeBars.group.g = com.g.append('g')
      .attr('transform', 'translate(' + com.timeBars.group.box.x + ',' + com.timeBars.group.box.y + ')')
  }

  function filterData () {
    function checkPropertiesValue (d, keys, value) {
      let target = d
      for (var i = 0; i < keys.length; i++) {
        target = target[keys[i]]
      }
      if (target === value) return true
      return false
    }
    let filtered = {done: [], run: [], cancel: [], wait: [], fail: []}
    for (var z = 0; z < com.data.raw.done.length; z++) {
      let dataNow = com.data.raw.done[z]
      if (com.filters.filters.length === 0) {
        if (dataNow.exeState.state === 'done') filtered.done.push(dataNow)
        if (dataNow.exeState.state === 'fail') filtered.fail.push(dataNow)
        if (dataNow.exeState.state === 'cancel') filtered.cancel.push(dataNow)
      } else {
        let insert = true
        for (var i = 0; i < com.filters.filters.length; i++) {
          let filterNow = com.filters.filters[i]
          let allPropValidate = true
          for (var j = 0; j < filterNow.length; j++) {
            if (!checkPropertiesValue(dataNow, filterNow[j].keys, filterNow[j].value)) allPropValidate = false
          }
          if (allPropValidate) insert = false
        }
        if (insert) {
          if (dataNow.exeState.state === 'done') filtered.done.push(dataNow)
          if (dataNow.exeState.state === 'fail') filtered.fail.push(dataNow)
          if (dataNow.exeState.state === 'cancel') filtered.cancel.push(dataNow)
        }
      }
    }
    filtered.wait = com.data.raw.wait.filter(function (d) {
      if (com.filters.filters.length === 0) return true
      for (var i = 0; i < com.filters.filters.length; i++) {
        let filterNow = com.filters.filters[i]
        let ok = true
        for (var j = 0; j < filterNow.length; j++) {
          if (!checkPropertiesValue(d, filterNow[j].keys, filterNow[j].value)) ok = false
        }
        if (ok) return false
      }
      return true
    })
    filtered.run = com.data.raw.run.filter(function (d) {
      if (com.filters.filters.length === 0) return true
      let ok = true
      for (var i = 0; i < com.filters.filters.length; i++) {
        let filterNow = com.filters.filters[i]
        let ok = true
        for (var j = 0; j < filterNow.length; j++) {
          if (!checkPropertiesValue(d, filterNow[j].keys, filterNow[j].value)) ok = false
        }
        if (ok) return false
      }
      return true
    })
    return filtered
  }

  function updateAxis () {
    com.axis.domain = [com.data.startTime.date, com.data.endTime.date]
    com.axis.range = [0, com.axis.group.box.w]

    com.axis.scale
      .domain(com.axis.domain)
      .range(com.axis.range)

    // console.log(com.axis.domain, com.axis.range);
    com.axis.main.scale(com.axis.scale)
    com.axis.group.g.call(com.axis.main)
    com.axis.group.g.select('path').attr('stroke-width', 2).attr('stroke', '#CFD8DC')
    com.axis.group.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 2).attr('stroke', '#CFD8DC')
    com.axis.group.g.selectAll('g.tick').selectAll('text').style('font-size', 14).attr('stroke', '#CFD8DC').attr('fill', '#CFD8DC')
  }

  function updateBlocks () {
    if (com.data.raw === undefined) return
    com.data.filtered = filterData()
    let dataBottom = []
      .concat(com.data.filtered.done)
      .concat(com.data.filtered.fail)
      .concat(com.data.filtered.run)
      .concat(com.data.filtered.wait)

    let bottomRow = calcBlockRow({
      typeNow: 'bottom',
      start: com.data.startTime.time,
      end: com.data.endTime.time,
      data: dataBottom,
      box: {x: 0, y: 0, w: com.blocks.group.run.box.w, h: com.blocks.group.run.box.h, marg: com.blocks.group.run.box.marg},
      yScale: true
    })
    setBlockRect(bottomRow, com.blocks.group.run)

    let dataTop = []
      .concat(com.data.filtered.cancel)
    let topRow = calcBlockRow({
      typeNow: 'top',
      start: com.data.startTime.time,
      end: com.data.endTime.time,
      data: dataTop,
      box: {x: 0, y: 0, w: com.blocks.group.cancel.box.w, h: com.blocks.group.cancel.box.h, marg: com.blocks.group.cancel.box.marg},
      yScale: false
    })
    setBlockRect(topRow, com.blocks.group.cancel)
  }

  function update (dataIn) {
    com.data.lastRawData = com.data.raw
    com.data.currentTime = dataIn.currentTime
    com.data.startTime = dataIn.startTime
    com.data.endTime = dataIn.endTime
    com.data.raw = dataIn.data
    com.data.telIds = dataIn.telIds

    if (com.axis.enabled) updateAxis()
    if (com.blocks.enabled) updateBlocks()
    if (com.timeBars.enabled) setTimeRect()
  }
  this.update = update

  function calcBlockRow (optIn) {
    let dataIn = optIn.data
    let box = optIn.box
    let xScale = box.w / (optIn.end - optIn.start)
    let yScale = box.h / (com.data.telIds.length + 2)

    let blocks = []
    let nBlocksType = {}
    // console.log(dataIn);
    // compute width/height/x/y of blocks, only y need to be modified (so far)
    $.each(dataIn, function (index, dataNow) {

      let id = dataNow.obId
      let state = dataNow.exeState.state
      let nTels = dataNow.telIds.length
      let start = (dataNow.startTime - optIn.start) * xScale
      let end = (dataNow.endTime - optIn.start) * xScale
      let overlap = (dataNow.endTime - dataNow.startTime) * xScale * 0.2 // allow small overlap in x between blocks
      let x0 = box.x + start
      let w0 = end - start
      let h0 = optIn.yScale ? (nTels * yScale) : (box.h * 0.3)
      let y0 = box.y

      if (!hasVar(nBlocksType[state])) nBlocksType[state] = 0
      else nBlocksType[state] += 1

      blocks.push({
        id: id,
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        o: overlap,
        nBlock: nBlocksType[state],
        // nTel: nTels,
        data: dataNow
      })
    })
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let wMin = minMaxObj({ minMax: 'min', data: blocks, func: 'w' })
    let hMin = minMaxObj({ minMax: 'min', data: blocks, func: 'h' })
    if (!hasVar(hMin) || !hasVar(wMin)) return []

    let margX = wMin * 0.2
    let margY = blocks.length === 1 ? 0 : Math.min(hMin * 0.5, box.h * 0.05)
    $.each(blocks, function (index0, dataNow0) {
      dataNow0.x += margX / 2
      dataNow0.w -= margX
      dataNow0.h -= margY / 2

      // precaution against negative width values
      dataNow0.w = Math.max(dataNow0.w, box.marg / 10)
      dataNow0.h = Math.max(dataNow0.h, box.marg)
    })
    // ---------------------------------------------------------------------------------------------------
    let sortedIds = []

    $.each(blocks, function (index0, dataNow0) {
      if (sortedIds.indexOf(dataNow0.id) >= 0) return
      sortedIds.push(dataNow0.id)

      let x0 = dataNow0.x
      let y0 = dataNow0.y
      let w0 = dataNow0.w
      let h0 = dataNow0.h
      // let o0 = dataNow0.o

      let telV = [].concat(dataNow0.data.telIds)
      let minMax = { minX: x0, minY: y0, maxX: x0 + w0, maxY: y0 + h0 }

      let ovelaps = [{ index: index0, data: dataNow0 }]

      for (let nTries = 0; nTries < 1; nTries++) {
        let nOver = ovelaps.length

        $.each(blocks, function (index1, dataNow1) {
          if (sortedIds.indexOf(dataNow1.id) >= 0) return
          if (
            ovelaps
              .map(function (d) {
                return d.data.id
              })
              .indexOf(dataNow1.id) >= 0
          ) {
            return
          }

          let x1 = dataNow1.x
          let y1 = dataNow1.y
          let w1 = dataNow1.w
          let h1 = dataNow1.h
          let o01 = Math.max(dataNow0.o, dataNow1.o)

          let hasOverlap =
                            x1 < minMax.maxX - o01 &&
                            x1 + w1 > minMax.minX + o01 &&
                            y1 < minMax.maxY &&
                            y1 + h1 > minMax.minY
          // if(x1 > minMax.maxX-o1 && x1 < minMax.maxX) console.log([index0,dataNow0.data.metaData.blockName],[index1,dataNow1.data.metaData.blockName]);

          // XXXXXXXXXXXXXXXXXX
          // let hasOverlap = (
          //   (x1 < minMax.maxX+margX/2) && (x1+w1 > minMax.minX) &&
          //   (y1 < minMax.maxY)         && (y1+h1 > minMax.minY)
          // );
          // XXXXXXXXXXXXXXXXXX

          if (hasOverlap) {
            let intersect = telV.filter(n => dataNow1.data.telIds.includes(n))
            if (intersect.length === 0) {
              sortedIds.push(dataNow1.id)
            }
            telV = telV.concat(dataNow1.data.telIds)

            minMax = {
              minX: Math.min(minMax.minX, x1),
              minY: Math.min(minMax.minY, y1),
              maxX: Math.max(minMax.maxX, x1 + w1),
              maxY: Math.max(minMax.maxY, y1 + h1)
            }

            ovelaps.push({ index: index1, data: dataNow1 })
          }
        })
        // console.log('xxxxxxxxxxxxxxx',nTries,ovelaps,ovelaps.map(function(d){return d.data.data.metaData.blockName;}));
        if (nOver === ovelaps.length) break
      }

      if (ovelaps.length > 1) {
        let origIndices = ovelaps.map(function (d) {
          return d.index
        })

        ovelaps.sort(function (a, b) {
          let diffTime = a.data.data.startTime - b.data.data.startTime
          let diffTel = b.data.data.telIds.length - a.data.data.telIds.length
          return diffTel !== 0 ? diffTel : diffTime
        })

        // if(typeNow=='run') console.log('will sort',ovelaps.map(function(d){return d.data.data.metaData.blockName;}));
        $.each(ovelaps, function (index1, dataNow1) {
          // if(typeNow=='run') console.log('-=-=-',index1,origIndices[index1], dataNow1.index);
          let origIndex = origIndices[index1]
          // if(canSort) blocks[origIndex] = dataNow1.data;
          blocks[origIndex] = dataNow1.data
        })
      }
    })
    $.each(blocks, function (index0, dataNow0) {
      let x0 = dataNow0.x
      let y0 = dataNow0.y
      let w0 = dataNow0.w
      let h0 = dataNow0.h

      // let telV = [].concat(dataNow0.data.telIds)

      let isSkip = false
      $.each(blocks, function (index1, dataNow1) {
        if (index0 >= index1 || isSkip) return

        let x1 = dataNow1.x
        let y1 = dataNow1.y
        let w1 = dataNow1.w
        let h1 = dataNow1.h

        // XXXXXXXXXXXXXXXXXX
        // let hasOverlap = ((x1 < x0+w0+margX/2) && (x1+w1 > x0) && (y1 < y0+h0) && (y1+h1 > y0));
        // XXXXXXXXXXXXXXXXXX
        let hasOverlap = x1 < x0 + w0 && x1 + w1 > x0 && y1 < y0 + h0 && y1 + h1 > y0
        if (hasOverlap) {
          dataNow1.y = y0 + h0 + margY / 2
          // dataNow1.y += h0 + margY/2;
        }
        // if(hasOverlap) console.log([index0,dataNow0.data.metaData.blockName],[index1,dataNow1.data.metaData.blockName],(h0 + margY/2));
      })
    })
    $.each(blocks, function (index0, dataNow0) {
      dataNow0.y = (2 * box.y + box.h) - dataNow0.y - dataNow0.h
    })
    return blocks
  }
  this.calcBlockRow = calcBlockRow

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setBlockRect (data, group) {
    let box = group.box
    let minTxtSize = box.w * 0.016
    let timeScale = d3.scaleLinear()
      .range(com.axis.range)
      .domain([com.data.startTime.time, com.data.endTime.time])

    let rect = group.g
      .selectAll('rect.' + com.mainTag + 'blocks')
      .data(data, function (d) {
        return d.id
      })
    rect
      .enter()
      .append('rect')
      .attr('class', com.mainTag + 'blocks')
      .style('opacity', 0)

      .attr('x', function (d, i) {
        return timeScale(d.data.startTime)
      })
      .attr('y', function (d, i) {
        return d.y - 2
      })
      .attr('width', function (d, i) {
        return timeScale(d.data.endTime) - timeScale(d.data.startTime)
      })
      .attr('height', function (d, i) {
        return d.h
      })

      .attr('stroke', function (d, i) {
        return d3.rgb(com.style.recCol({ d: d })).darker(1.0)
      })
      .style('fill', function (d, i) {
        return com.style.recCol({ d: d })
      })
      .style('fill-opacity', function (d) {
        return com.style.recFillOpac(d, d.data.exeState.state)
      })
      .attr('stroke-width', 1)
      .style('stroke-opacity', com.style.recStrokeOpac)
      // .style("pointer-events", "none")
      .attr('vector-effect', 'non-scaling-stroke')
      .on('click', function (d) {
        console.log(d.data.modifications);
        console.log(d.data.telIds);
        com.blocks.events.click()
      })
      .on('mouseover', function (d) {
        d3.select(this).attr('stroke-width', 4)
        d3.select(this).style('stroke-opacity', 1)
        com.blocks.events.mouseover(d)
      })
      .on('mouseout', function (d) {
        d3.select(this).attr('stroke-width', 1)
        d3.select(this).style('stroke-opacity', function (d) {
          return 0.7
          // if (filters.states.length === 0 && filters.errors.length === 0) return 0.7
          // else {
          //   let inState, inError
          //   filters.states.length === 0 ? inState = true : inState = false
          //   filters.errors.length === 0 ? inError = true : inError = false
          //   for (var i = 0; i < filters.states.length; i++) {
          //     if (d.data.exeState.state === filters.states[i].id) inState = true
          //   }
          //   for (var j = 0; j < filters.errors.length; j++) {
          //     if (d.data.exeState.error === filters.errors[j].id) inError = true
          //   }
          //
          //   if (inState && inError) return 0.7
          //   return 0.05
          // }
          // return 0.6// com.style.recFillOpac(d, d.data.exeState.state)
        })
        com.blocks.events.mouseout(d)
      })
      .merge(rect)
      .transition('inOut')
      .duration(timeD.animArc)

      .style('opacity', 1)
      .attr('stroke', function (d, i) {
        return '#111111'
      })
      .style('fill', function (d, i) {
        return com.style.recCol({ d: d })
      })
      .style('fill-opacity', function (d) {
        return 0.7
      })
      .style('stroke-opacity', function (d) {
        return 1
      })

      .attr('x', function (d, i) {
        return timeScale(d.data.startTime)
      })
      .attr('y', function (d, i) {
        return d.y - 2
      })
      .attr('width', function (d, i) {
        return timeScale(d.data.endTime) - timeScale(d.data.startTime)
      })
      .attr('height', function (d, i) {
        return d.h
      })
    rect
      .exit()
      .transition('inOut')
      .duration(timeD.animArc / 2)
      .attr('width', 0)
      .style('opacity', 0)
      .remove()

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let text = group.g
      .selectAll('text.' + com.mainTag + 'blocks')
      .data(data, function (d) {
        return d.id
      })
    text
      .enter()
      .append('text')
      .attr('class', com.mainTag + 'blocks')
      .text(function (d, i) {
        return d.data.metaData.blockName
      })
      .style('font-weight', 'normal')
      .style('opacity', 0)
      .style('fill-opacity', 0.7)
      .style('fill', '#111111')
      .style('stroke-width', 0.3)
      .style('stroke-opacity', 1)
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .style('stroke', function (d) {
        return '#111111'
      })
      .attr('x', function (d, i) {
        return d.x + d.w / 2
      })
      .attr('y', function (d, i) {
        return d.y + d.h / 2
      })
      .attr('text-anchor', 'middle')
      .merge(text)
      .style('font-size', function (d) {
        d.size = Math.max(minTxtSize, Math.min(d.w, d.h)) / 3
        if (!hasVar(d.size)) {
          console.error('_blockQueue_ERROR:', com.mainTag, minTxtSize, d.w, d.h)
        } // should not happen....
        if (!hasVar(d.size)) d.size = 0
        // d.size = d.w/3;
        return d.size + 'px'
      })
      .attr('dy', function (d) {
        return d.size / 3 + 'px'
      })
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', com.style.textOpac)
      .attr('x', function (d, i) {
        return d.x + d.w / 2
      })
      .attr('y', function (d, i) {
        return d.y + d.h / 2
      })
    text
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()
  }
  this.setBlockRect = setBlockRect

  function addExtraBar (date) {
    let data = []
    if (date === null) {
      let rectNow = com.g
        .selectAll('rect.' + com.mainTag + 'extra')
        .data(data)
      rectNow.exit().remove()
    } else {
      data = [date]
      let rectNow = com.g
        .selectAll('rect.' + com.mainTag + 'extra')
        .data(data)
        .attr('transform', 'translate(' + com.axis.group.box.x + ',' + 0 + ')')

      rectNow
        .enter()
        .append('rect')
        .attr('class', com.mainTag + 'extra')
        .style('opacity', 1)
        .attr('x', function (d, i) {
          if (d > com.axis.scale.domain()[1]) return com.axis.scale(com.axis.scale.domain()[1])
          else if (d < com.axis.scale.domain()[0]) return com.axis.scale(com.axis.scale.domain()[0])
          return com.axis.scale(d)
        })
        .attr('y', function (d, i) {
          return com.box.y - 1 * com.box.marg
        })
        .attr('width', 0)
        .attr('height', function (d, i) {
          return com.box.h + 1 * com.box.marg
        })
        .attr('stroke', d3.rgb(com.style.runRecCol).darker(1.0))
        .attr('fill', colsYellows[0])
        .attr('fill-opacity', 0.3)
        .style('stroke-opacity', 0.15)
        .attr('stroke-width', 3)
        .style('pointer-events', 'none')
        .attr('vector-effect', 'non-scaling-stroke')
        .merge(rectNow)
        .transition('inOut')
        .duration(50)
        .attr('x', function (d, i) {
          if (d > com.axis.scale.domain()[1]) return com.axis.scale(com.axis.scale.domain()[1])
          else if (d < com.axis.scale.domain()[0]) return com.axis.scale(com.axis.scale.domain()[0])
          return com.axis.scale(d)
        })
        // .attr("y", function(d,i) { return d.y; })
        .attr('width', function (d, i) {
          return com.box.marg
        })
    }
  }
  this.addExtraBar = addExtraBar
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setTimeRect () {
    let rectNowData = []

    rectNowData = [
      {
        id: com.mainTag + 'now',
        x: com.axis.scale(com.data.currentTime.date),
        y: com.timeBars.group.box.y,
        w: com.timeBars.group.box.marg,
        h: com.timeBars.group.box.h + com.timeBars.group.box.marg * 2
      }
    ]
    // console.log('timeFrac',timeFrac,rectNowData);
    // console.log('rectNowData',(com.blockRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let rectNow = com.timeBars.group.g
      .selectAll('rect.' + com.mainTag + 'now')
      .data(rectNowData, function (d) {
        return d.id
      })

    rectNow
      .enter()
      .append('rect')
      .attr('class', com.mainTag + 'now')
      .style('opacity', 1)
      .attr('x', function (d, i) {
        return d.x
      })
      .attr('y', function (d, i) {
        return d.y - 1 * com.box.marg
      })
      .attr('width', 0)
      .attr('height', function (d, i) {
        return d.h
      })
      .attr('fill', com.style.runRecCol)
      .attr('fill-opacity', 0.3)
      .style('stroke-opacity', 0.15)
      .attr('stroke-width', 3)
      .style('pointer-events', 'none')
      .attr('vector-effect', 'non-scaling-stroke')
      .merge(rectNow)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('x', function (d, i) {
        return d.x
      })
      // .attr("y", function(d,i) { return d.y; })
      .attr('width', function (d, i) {
        return d.w
      })
    // .attr("height", function(d,i) { return d.h; })

    // rectNow.exit()
    //   .transition("inOut").duration(timeD.animArc/2)
    //   .attr("width", 0)
    //   .style("opacity", 0)
    //   .remove()
  }
  this.setTimeRect = setTimeRect
}