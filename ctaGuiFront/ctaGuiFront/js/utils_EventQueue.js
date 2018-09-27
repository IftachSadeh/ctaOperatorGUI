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
/* global ScrollBox */
/* global colsGreens */
/* global colsYellows */
/* global colsPurplesBlues */

loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollBox.js' })

window.EventQueue = function () {
  let template = {
    tag: 'eventQueueDefaultTag',
    g: undefined,
    box: {x:0, y:0, w:0, h:0},
    axis: {
      enabled: true,
      group: {
        g: undefined,
        box: {x:0, y:0, w:0, h:0}
      },
      main: undefined,
      scale: undefined,
      domain: [0, 1000],
      range: [0,0],
      showText: true,
      orientation: 'axisTop'
    },
    blocks: {
      enabled: true,
      group: {
        g: undefined,
        box: {x:0, y:0, w:0, h:0}
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
        box: {x:0, y:0, w:0, h:0}
      },
      filters: []
    },
    timeBars: {
      enabled: true,
      group: {
        g: undefined,
        box: {x:0, y:0, w:0, h:0}
      }
    },
    data: {
      currentTime: 0,
      startTime: 0,
      endTime: 0,
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
    initAxis()
    initBlocks()
    initFilters()
    initTimeBars()
  }
  this.init = init

  function initAxis () {
    if (!com.axis.enabled) return
    com.axis.group.g = com.g.append('g')
      .attr('transform', 'translate(' + com.axis.group.box.x + ',' + com.axis.group.box.y + ')')

    com.axis.scale = d3.scaleTime()
      .range(com.axis.range)
      .domain(com.axis.domain)
    com.axis.main = d3.axisTop(com.axis.scale)
      .tickFormat('')
    com.axis.group.g
      .attr('class', 'axis')
      .call(com.axis.main)
    com.axis.group.g.select('path').attr('stroke-width', 2).attr('stroke', '#CFD8DC')
    com.axis.group.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 2).attr('stroke', '#CFD8DC')
    com.axis.group.g.selectAll('g.tick').selectAll('text').attr('stroke', '#CFD8DC').attr('fill', '#CFD8DC')
  }
  function initBlocks () {
    if (!com.blocks.enabled) return
    com.blocks.group.g = com.g.append('g')
      .attr('transform', 'translate(' + com.blocks.group.box.x + ',' + com.blocks.group.box.y + ')')
  }
  function initFilters () {
    if (!com.filters.enabled) return
    function createButton (position, type, priority, filter) {
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
          if (filter !== undefined) {
            com.filters.filters.push(filter)
            updateBlocks()
          }
        } else {
          newButton.attr('status', 'enabled')
          newButton.selectAll('line.checkboxBar').remove()
          rect.attr('stroke', function (d, i) {
            return '#000000'
          })
            .attr('stroke-width', 0.5)
            .style('stroke-opacity', 1)
          if (newButton.attr('status', 'disabled')) {
            let index = com.filters.filters.indexOf(filter)
            com.filters.filters.splice(index, 1)
            updateBlocks()
          }
        }
      }

      let newRect = newButton.append('rect')
        .attr('x', (Number(newButton.attr('width')) - ((Number(newButton.attr('width'))) * (priority) / 3)) / 2)
        .attr('y', (Number(newButton.attr('height')) - ((Number(newButton.attr('height'))) * (priority) / 3)) / 2)
        .attr('width', function (d, i) {
          return ((Number(newButton.attr('width'))) * (priority) / 3)
        })
        .attr('height', function (d, i) {
          return ((Number(newButton.attr('height'))) * (priority) / 3)
        })
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('stroke', function (d, i) {
          return 'black'
        })
        .attr('stroke-width', 0.5)
        .style('fill', function (d, i) {
          return '#efefef'// colsYellows[0]
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
          if (filter !== undefined) {
            com.filters.filters.push(filter)
            updateBlocks()
          }
        })
        .on('mouseout', function () {
          com.filters.group.g.select('g.info').remove()
          if (newButton.attr('status', 'disabled')) {
            let index = com.filters.filters.indexOf(filter)
            com.filters.filters.splice(index, 1)
            updateBlocks()
          }
        })


      if (type === 'Alarm') drawAlarm(newButton, 0, 0, 27, 27)
      if (type === 'GRB') drawGrb(newButton, 0, 0, 27, 27)
      if (type === 'Hardw.') drawHardware(newButton, 0, 0, 27, 27)

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

    createButton({row: 0, col: 0}, 'Low', 1, [{keys: ['priority'], value: 1}])
    createButton({row: 0, col: 1}, 'Medium', 2, [{keys: ['priority'], value: 2}])
    createButton({row: 0, col: 2}, 'High', 3, [{keys: ['priority'], value: 3}])
    createButton({row: 1, col: 0}, 'Alarm', 3, [{keys: ['name'], value: 'alarm'}])
    createButton({row: 1, col: 1}, 'GRB', 3, [{keys: ['name'], value: 'grb'}])
    createButton({row: 1, col: 2}, 'Hardw.', 3, [{keys: ['name'], value: 'hardware'}])

    let newButton = buttonPanel.addButton({row: 2, col: 1})
    newButton.append('text')
      .text('Events Filters')
      .attr('x', Number(newButton.attr('width')) * 0.5)
      .attr('y', Number(newButton.attr('height')) * 0.35)
      .attr('dy', 8)
      .attr('stroke', '#CFD8DC')
      .attr('fill', '#CFD8DC')
      .style('font-weight', 'normal')
      .attr('text-anchor', 'middle')
      .style('font-size', 18)
      .style('pointer-events', 'none')
      .style('user-select', 'none')
  }
  function initTimeBars () {
    if (!com.timeBars.enabled) return
    com.timeBars.group.g = com.g.append('g')
      .attr('transform', 'translate(' + com.timeBars.group.box.x + ',' + com.timeBars.group.box.y + ')')
  }
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function filterData () {
    function checkPropertiesValue (d, keys, value) {
      let target = d
      for (var i = 0; i < keys.length; i++) {
        target = target[keys[i]]
      }
      if (target === value) return true
      return false
    }
    if (com.filters.filters.length === 0) return com.data.raw
    let filtered = com.data.raw.filter(function (d) {
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
    com.data.filtered = filterData()
    com.data.formatedData = calcBlockRow({
      typeNow: 'events',
      start: com.data.startTime.time,
      end: com.data.endTime.time,
      data: com.data.filtered,
      box: com.blocks.group.box
    })
    setBlockRect()
  }
  function mergeOptIn (newOptIn) {}

  function update (dataIn) {
    com.data.lastRawData = com.data.raw
    com.data.currentTime = dataIn.currentTime
    com.data.startTime = dataIn.startTime
    com.data.endTime = dataIn.endTime
    com.data.raw = dataIn.data


    if (com.axis.enabled) updateAxis()
    if (com.blocks.enabled) updateBlocks()

    // setTimeRect()
  }
  this.update = update

  function calcBlockRow (optIn) {
    let dataIn = optIn.data
    let box = optIn.box
    let xScale = box.w / (optIn.end - optIn.start)

    let blocks = []

    // compute width/height/x/y of blocks, only y need to be modified (so far)
    $.each(dataIn, function (index, dataNow) {
      let sizeBlocks = (12 * (4.5 + 1) / 2.2)
      let start = new Date(dataNow.time) * xScale
      let x0 = box.x + start - (sizeBlocks / 2)
      let w0 = sizeBlocks
      let h0 = sizeBlocks / 1.3
      let y0 = box.y

      blocks.push({
        x: x0,
        y: y0,
        w: w0,
        h: h0,
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
    let sortedIds = []
    $.each(blocks, function (index0, dataNow0) {
      // if(typeNow=='run') return
      // if(sortedIds.indexOf(dataNow0.id) >= 0) console.log('will skip sorted',index0,dataNow0.data.metaData.blockName);
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

    return blocks
  }
  this.calcBlockRow = calcBlockRow

  function setBlockRect () {
    let rect = com.blocks.group.g
      .selectAll('g.events')
      .data(com.data.formatedData, function (d) {
        return d.data.id
      })
    // console.log(com.blocks.group.g);
    let newRect = rect
      .enter()
      .append('g')
      .attr('class', 'events')
    newRect.append('rect')
      .attr('x', function (d, i) {
        return com.axis.scale(new Date(d.data.date)) + d.w / 2
      })
      .attr('y', function (d, i) {
        return d.y + 2 + d.h / 2
      })
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('width', function (d, i) {
        return 0
      })
      .attr('height', function (d, i) {
        return 0
      })
      .attr('stroke', function (d, i) {
        return '#000000'
      })
      .attr('stroke-width', 0.5)
      .style('stroke-opacity', function (d) {
        return 0.7
      })
      // .style('fill', function (d, i) {
      //   return '#CFD8DC'
      // })
      .style('fill', function (d, i) {
        return '#CFD8DC'
        // if (d.data.priority === 1) { return '#FFECB3' }
        // if (d.data.priority === 2) { return '#FFCA28' }
        // if (d.data.priority === 3) { return '#FFA000' }
      })
      .on('mouseover', function (d) {
        d3.select(this).attr('stroke-width', 3.5)
          .style('stroke-opacity', 1)
          .style('stroke', '#000000')
          .style('fill', '#ffffff')
          .style('fill-opacity', '1')
      })
      .on('mouseout', function (d) {
        d3.select(this).attr('stroke-width', 0.5)
          .style('stroke-opacity', 0.7)
          .style('stroke', '#000000')
          // .style('fill', '#CFD8DC')
          .style('fill', function (d, i) {
            return '#CFD8DC'
            // if (d.data.priority === 1) { return '#FFECB3' }
            // if (d.data.priority === 2) { return '#FFCA28' }
            // if (d.data.priority === 3) { return '#FFA000' }
          })
      })
      .on('click', function (d) {
        com.blocks.events.click()
      })
      .merge(rect)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('x', function (d, i) {
        return com.axis.scale(new Date(d.data.date))
      })
      .attr('y', function (d, i) {
        return d.y + 2
      })
      .attr('width', function (d, i) {
        return d.w
      })
      .attr('height', function (d, i) {
        return d.h
      })
    newRect.each(function (d) {
      if (d.data.name === 'grb') drawGrb(d3.select(this), com.axis.scale(new Date(d.data.date)), d.y, d.w, d.h, d.data.priority)
      if (d.data.name === 'hardware') drawHardware(d3.select(this), com.axis.scale(new Date(d.data.date)), d.y, d.w, d.h, d.data.priority)
      if (d.data.name === 'alarm') drawAlarm(d3.select(this), com.axis.scale(new Date(d.data.date)), d.y, d.w, d.h, d.data.priority)
    })

    rect.exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('width', 0)
      .style('opacity', 0)
      .remove()
  }
  this.setBlockRect = setBlockRect

  function addExtraBar (date) {
    let data = []
    if (date === null) {
      let rectNow = com.outerG
        .selectAll('rect.' + com.mainTag + 'extra')
        .data(data)
      rectNow.exit().remove()
    } else {
      data = [date]
      let rectNow = com.outerG
        .selectAll('rect.' + com.mainTag + 'extra')
        .data(data)
        .attr('transform', 'translate(' + com.outerBox.x + ',' + 0 + ')')

      rectNow
        .enter()
        .append('rect')
        .attr('class', com.mainTag + 'extra')
        .style('opacity', 1)
        .attr('x', function (d, i) {
          if (d > com.axis.scaleX.domain()[1]) return com.axis.scaleX(com.axis.scaleX.domain()[1])
          else if (d < com.axis.scaleX.domain()[0]) return com.axis.scaleX(com.axis.scaleX.domain()[0])
          return com.axis.scaleX(d)
        })
        .attr('y', function (d, i) {
          return com.outerBox.y - com.outerBox.marg
        })
        .attr('width', 0)
        .attr('height', function (d, i) {
          return com.outerBox.h + com.outerBox.marg * 2
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
          if (d > com.axis.scaleX.domain()[1]) return com.axis.scaleX(com.axis.scaleX.domain()[1])
          else if (d < com.axis.scaleX.domain()[0]) return com.axis.scaleX(com.axis.scaleX.domain()[0])
          return com.axis.scaleX(d)
        })
        // .attr("y", function(d,i) { return d.y; })
        .attr('width', function (d, i) {
          return com.outerBox.marg
        })
    }
  }
  this.addExtraBar = addExtraBar
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setTimeRect () {
    let box = com.innerBox
    let timeFrac = -1
    let rectNowData = []
    let refData = null

    if (com.doTimeRect) {
      if (com.blockRow.run.length > 0 && com.doPhase) {
        refData = com.blockRow.run

        let timeMin = minMaxObj({
          minMax: 'min',
          data: com.blockRow.run,
          func: function (d, i) {
            return d.data.startTime
          }
        })
        let timeMax = minMaxObj({
          minMax: 'max',
          data: com.blockRow.run,
          func: function (d, i) {
            return d.data.endTime
          }
        })

        timeFrac = (com.time.now - timeMin) / (timeMax - timeMin)
        // console.log('-----',timeMin,timeMax,timeFrac);
      } else if (timeFrac < 0 || timeFrac > 1) {
        // refData = [].concat(com.blockRow.done).concat(com.blockRow.run).concat(com.blockRow.wait);

        timeFrac = new Date(com.time.date_now) - new Date(com.time.date_start)
        timeFrac /= new Date(com.time.date_end) - new Date(com.time.date_start)
      }
    }

    if (timeFrac >= 0 && timeFrac <= 1) {
      let xMin = box.x
      let xMax = box.x + box.w
      if (hasVar(refData)) {
        xMin = minMaxObj({ minMax: 'min', data: refData, func: 'x' })
        xMax = minMaxObj({
          minMax: 'max',
          data: refData,
          func: function (d, i) {
            return d.x + d.w
          }
        })
      }
      rectNowData = [
        {
          id: com.mainTag + 'now',
          x: xMin + timeFrac * (xMax - xMin) - com.outerBox.marg / 2,
          y: com.outerBox.y - com.outerBox.marg,
          w: com.outerBox.marg,
          h: com.outerBox.h + com.outerBox.marg * 2
        }
      ]
    }

    // console.log('timeFrac',timeFrac,rectNowData);
    // console.log('rectNowData',(com.blockRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let rectNow = com.outerG
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
        return d.y
      })
      .attr('width', 0)
      .attr('height', function (d, i) {
        return d.h
      })
      .attr('stroke', d3.rgb(com.style.runRecCol).darker(1.0))
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

  function drawAlarm (g, x, y, w, h, priority) {
    g.append('svg:image')
      .attr('class', 'icon')
      .attr('xlink:href', '/static/alarm.svg')
      .attr('width', 0)
      .attr('height', 0)
      .attr('x', x + w * 0.5)
      .attr('y', y + h * 0.5)
      .style('pointer-events', 'none')
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('width', w * 0.8)
      .attr('height', h * 0.8)
      .attr('x', x + w * 0.1)
      .attr('y', y + h * 0.1)
  }
  function drawGrb (g, x, y, w, h, priority) {
    g.append('svg:image')
      .attr('class', 'icon')
      .attr('xlink:href', '/static/grb.svg')
      .attr('width', 0)
      .attr('height', 0)
      .attr('x', x + w * 0.5)
      .attr('y', y + h * 0.5)
      .style('pointer-events', 'none')
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('width', w * 0.8)
      .attr('height', h * 0.8)
      .attr('x', x + w * 0.1)
      .attr('y', y + h * 0.1)
  }
  function drawHardware (g, x, y, w, h, priority) {
    g.append('svg:image')
      .attr('class', 'icon')
      .attr('xlink:href', '/static/hardwareBreak.svg')
      .attr('width', 0)
      .attr('height', 0)
      .attr('x', x + w * 0.5)
      .attr('y', y + h * 0.5)
      .style('pointer-events', 'none')
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('width', w * 0.8)
      .attr('height', h * 0.8)
      .attr('x', x + w * 0.1)
      .attr('y', y + h * 0.1)
  }
}
