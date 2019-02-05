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
/* global ScrollBox */
/* global Locker */
/* global RunLoop */
/* global BlockForm */

loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollBox.js' })
loadScript({ source: 'utils_scrollTable', script: '/js/utils_blockForm.js' })

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.BlockDisplayer = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  let template = {
    main: {
      tag: 'blockQueueRootTag',
      g: undefined,
      scroll: {},
      box: {x: 0, y: 0, w: 1000, h: 300, marg: 0},
      background: {
        fill: colorTheme.brighter.background,
        stroke: colorTheme.brighter.stroke,
        strokeWidth: 0.5
      }
    },

    displayer: 'blockQueue',
    blockQueue: {
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
      timeBars: {
        enabled: true,
        g: undefined,
        box: {x: 0, y: 0, w: 1000, h: 300, marg: 0}
      },
    },
    blockQueue2: {
      g: undefined,
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
      timeBars: {
        enabled: true,
        g: undefined,
        box: {x: 0, y: 0, w: 1000, h: 300, marg: 0}
      },
    },
    blockList: {
      g: undefined
    },
    blockForm: {
      mosaic: {
        box: {}
      },
      forms: {
        box: {},
        display: 'focus'
      }
    },

    filters: {
      blockFilters: [],
      filtering: []
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
        schedBlocks: undefined,
        block: undefined
      },
      focus: {
        schedBlocks: undefined,
        block: undefined
      }
    }
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
        : optIn.d.exeState.state
      let canRun = hasVar(optIn.canRun)
        ? optIn.canRun
        : optIn.d.exeState.canRun
      let modified = optIn.d.modifications ? optIn.d.modifications.userModifications.length > 0 : false

      if (state === 'wait') {
        if (modified) return com.blockQueue.blocks.colorPalette.wait
        return com.blockQueue.blocks.colorPalette.wait
      } else if (state === 'done') {
        return com.blockQueue.blocks.colorPalette.done
      } else if (state === 'fail') {
        return com.blockQueue.blocks.colorPalette.fail
      } else if (state === 'run') {
        return com.blockQueue.blocks.colorPalette.run
      } else if (state === 'cancel') {
        if (hasVar(canRun)) {
          if (!canRun) return com.blockQueue.blocks.colorPalette.cancelOp
        }
        return com.blockQueue.blocks.colorPalette.cancelSys
      } else return com.blockQueue.blocks.colorPalette.shutdown
    }
    com.style.blockOpac = function (optIn) {
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

  let BlockQueueBib = function () {
    function init () {
      initAxis()
      initBlocks()
      initTimeBars()
    }
    this.init = init
    function initAxis () {
      com.blockQueue.axis.scale = d3.scaleTime()
        .range(com.blockQueue.axis.range)
        .domain(com.blockQueue.axis.domain)
      com.blockQueue.axis.main = d3.axisBottom(com.blockQueue.axis.scale)
        .tickFormat(d3.timeFormat('%H:%M'))

      if (!com.blockQueue.axis.enabled) return
      com.blockQueue.axis.g = com.main.g.append('g')
        .attr('transform', 'translate(' + com.blockQueue.axis.box.x + ',' + com.blockQueue.axis.box.y + ')')
      com.blockQueue.axis.g
        .attr('class', 'axis')
        .call(com.blockQueue.axis.main)

      com.blockQueue.axis.g.style('opacity', 1)
    }
    function initBlocks () {
      if (!com.blockQueue.blocks.enabled) return

      com.blockQueue.blocks.clipping = {}
      com.blockQueue.blocks.clipping.g = com.main.g.append('g')
      com.blockQueue.blocks.clipping.g.append('defs').append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('id', 'clip-rect')
        .attr('x', '0')
        .attr('y', '0')
        .attr('width', com.main.box.w)
        .attr('height', com.main.box.h)
      com.blockQueue.blocks.clipping.clipBody = com.blockQueue.blocks.clipping.g.append('g')
        .attr('clip-path', 'url(#clip)')
      if (com.blockQueue.blocks.run.enabled) {
        com.blockQueue.blocks.run.g = com.blockQueue.blocks.clipping.clipBody.append('g')
        com.blockQueue.blocks.run.g.attr('transform', 'translate(' + com.blockQueue.blocks.run.box.x + ',' + com.blockQueue.blocks.run.box.y + ')')
          .style('opacity', 0)
          .transition()
          .duration(1000)
          .delay(1000)
          .style('opacity', 1)
      }
      if (com.blockQueue.blocks.cancel.enabled) {
        com.blockQueue.blocks.cancel.g = com.blockQueue.blocks.clipping.clipBody.append('g')
        com.blockQueue.blocks.cancel.g.attr('transform', 'translate(' + com.blockQueue.blocks.cancel.box.x + ',' + com.blockQueue.blocks.cancel.box.y + ')')
          .style('opacity', 0)
          .transition()
          .duration(1000)
          .delay(1000)
          .style('opacity', 1)
      }
      if (com.blockQueue.blocks.modification.enabled) {
        com.blockQueue.blocks.modification.g = com.blockQueue.blocks.clipping.clipBody.append('g')
        com.blockQueue.blocks.modification.g.attr('transform', 'translate(' + com.blockQueue.blocks.modification.box.x + ',' + com.blockQueue.blocks.modification.box.y + ')')
          .style('opacity', 0)
          .transition()
          .duration(1000)
          .delay(1000)
          .style('opacity', 1)
      }
    }
    function initTimeBars () {
      if (!com.blockQueue.timeBars.enabled) return
      com.blockQueue.timeBars.g = com.main.g.append('g')
        .attr('transform', 'translate(' + com.blockQueue.timeBars.box.x + ',' + com.blockQueue.timeBars.box.y + ')')
      com.blockQueue.timeBars.g
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay(1000)
        .style('opacity', 1)
    }

    function adjustBlockRow (blocks, box, direction) {
      $.each(blocks, function (index0, dataNow0) {
        dataNow0.x = dataNow0.display.x
        dataNow0.y = dataNow0.display.y
        dataNow0.w = dataNow0.display.w
        dataNow0.h = dataNow0.display.h
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

        let telV = [].concat(dataNow0.telIds)
        let minMax = { minX: x0, minY: y0, maxX: x0 + w0, maxY: y0 + h0 }

        let ovelaps = [{ index: index0, data: dataNow0 }]

        for (let nTries = 0; nTries < 1; nTries++) {
          let nOver = ovelaps.length

          $.each(blocks, function (index1, dataNow1) {
            if (sortedIds.indexOf(dataNow1.id) >= 0) return
            if (
              ovelaps
                .map(function (d) {
                  return d.id
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
              let intersect = telV.filter(n => dataNow1.telIds.includes(n))
              if (intersect.length === 0) {
                sortedIds.push(dataNow1.id)
              }
              telV = telV.concat(dataNow1.telIds)

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
            console.log(a);
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
      if (direction === 'toTop') {
        $.each(blocks, function (index0, dataNow0) {
          dataNow0.y = (2 * box.y + box.h) - dataNow0.y - dataNow0.h
        })
      }

      $.each(blocks, function (index0, dataNow0) {
        dataNow0.display.x = dataNow0.x
        dataNow0.display.y = dataNow0.y
        dataNow0.display.w = dataNow0.w
        dataNow0.display.h = dataNow0.h
      })
      return blocks
    }
    function calcBlockRow (optIn) {
      let dataIn = optIn.data
      let box = optIn.box
      let xScale = box.w / (optIn.end - optIn.start)
      let yScale = box.h / (com.data.raw.telIds.length + 2)

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

        dataNow.display = {
          id: id,
          x: x0,
          y: y0,
          w: w0,
          h: h0,
          newH: h0,
          o: overlap,
          nBlock: nBlocksType[state]
        }
      })

      // let groups = groupByTime(blocks)
      // $.each(groups, function (index, group) {
      //   let tot = 0
      //   $.each(group, function (index, dataNow) {
      //     tot += dataNow.h
      //   })
      //   if (isGeneratingTelsConflict(group)) {
      //     let coef = (box.h * 1) / tot
      //     let x = group[0].x
      //     let x2 = x + group[0].w
      //     $.each(group, function (index, dataNow) {
      //       dataNow.newH = ((dataNow.h * coef) < dataNow.newH ? (dataNow.h * coef) : dataNow.newH)
      //       if (dataNow.x < x) x = dataNow.x
      //       if (dataNow.x + dataNow.w > x2) x2 = dataNow.x + dataNow.w
      //     })
      //     com.background.child.runOverflow.back.append('rect')
      //       .attr('class', 'conflictRect')
      //       .attr('x', x)
      //       .attr('y', com.blockQueue.blocks.run.box.y - com.blockQueue.blocks.run.box.h * 0.25 - com.blockQueue.blocks.run.box.marg)
      //       .attr('width', x2 - x)
      //       .attr('height', com.blockQueue.blocks.run.box.h * 0.12)
      //       .attr('fill', com.background.child.runOverflow.fill)
      //       .attr('fill-opacity', com.background.child.runOverflow.fillOpacity)
      //   } else if (tot > box.h) {
      //     let coef = box.h / tot
      //     $.each(group, function (index, dataNow) {
      //       dataNow.newH = ((dataNow.h * coef) > dataNow.newH ? (dataNow.h * coef) : dataNow.newH)
      //     })
      //   }
      // })
      // $.each(groups, function (index, group) {
      //   $.each(group, function (index, dataNow) {
      //     dataNow.h = dataNow.newH ? dataNow.newH : dataNow.h
      //   })
      // })
      return dataIn
    }
    function setDefaultStyleForBlocks (blocks) {
      let timeScale = d3.scaleLinear()
        .range(com.blockQueue.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])
      for (let index in blocks) {
        let b = blocks[index]
        let bDisplay = b.display

        let cols = com.style.blockCol({ d: b })

        bDisplay.w = timeScale(b.endTime) - timeScale(b.startTime)
        bDisplay.stroke = cols.stroke
        bDisplay.strokeWidth = 0.5
        bDisplay.fill = cols.background
        bDisplay.fillOpacity = com.style.blockOpac({ d: b })
        bDisplay.strokeOpacity = com.style.blockOpac({ d: b })
        bDisplay.strokeDasharray = []

        bDisplay.text = cols.text
        bDisplay.patternFill = ''
        bDisplay.patternOpacity = 0
        if (b.sbId === com.input.focus.schedBlocks) {
          if (!(com.input.over.schedBlocks !== undefined && com.input.over.schedBlocks !== com.input.focus.schedBlocks)) { // b.stroke = colorTheme.blocks.critical.background
            // b.patternFill = 'url(#patternHover)'
            bDisplay.patternFill = 'url(#patternSelect)'
            bDisplay.patternOpacity = 1
          }
          bDisplay.strokeWidth = 1
          bDisplay.strokeOpacity = 1
          // b.strokeDasharray = [2, 2]
        }
        if (b.sbId === com.input.over.schedBlocks) {
          bDisplay.strokeWidth = 1
          bDisplay.strokeOpacity = 1
          // b.strokeDasharray = [2, 2]
          bDisplay.patternFill = 'url(#patternSelect)'
          bDisplay.patternOpacity = 1
        }
        if (b.obId === com.input.focus.block) {
          if (com.input.over.block !== undefined && com.input.over.block !== com.input.focus.block) bDisplay.strokeDasharray = [8, 4]
          bDisplay.strokeWidth = 6
          bDisplay.strokeOpacity = 1
        }
        if (b.obId === com.input.over.block) {
          bDisplay.strokeWidth = 6
          bDisplay.strokeOpacity = 1
          bDisplay.strokeDasharray = []
        }
      }
      return blocks
    }
    // function groupByTime (blocks) {
    //   let groups = []
    //   for (var i = 0; i < blocks.length; i++) {
    //     let newGroup = [blocks[i]]
    //     for (var j = 0; j < blocks.length; j++) {
    //       if (i !== j && isSameTimeBeginAfter(blocks[i].x, blocks[i].x + blocks[i].w, blocks[j].x, blocks[j].x + blocks[j].w)) newGroup.push(blocks[j])
    //     }
    //     groups.push(newGroup)
    //   }
    //   return groups
    // }
    //
    // function isSameTimeBeginAfter (s1, e1, s2, e2) {
    //   if (s1 > s2 && s1 < e2) return true
    //   return false
    // }
    //
    // function isGeneratingTelsConflict (group) {
    //   function useSameTels (tel1, tel2) {
    //     for (var i = 0; i < tel1.length; i++) {
    //       for (var j = 0; j < tel2.length; j++) {
    //         if (tel1[i] === tel2[j]) {
    //           return true
    //         }
    //       }
    //     }
    //     return false
    //   }
    //   for (let i = 0; i < length; i++) {
    //     for (let j = 0; j < length; j++) {
    //       if (i !== j && useSameTels(group[i].data.telIds, group[j].data.telIds)) {
    //         return true
    //       }
    //     }
    //   }
    //   return false
    // }

    function update () {
      if (com.blockQueue.axis.enabled) updateAxis()
      if (com.blockQueue.blocks.enabled) updateBlocks()
      if (com.blockQueue.timeBars.enabled) setTimeRect()
    }
    this.update = update
    function updateAxis () {
      com.blockQueue.axis.domain = [com.time.startTime.date, com.time.endTime.date]
      com.blockQueue.axis.range = [0, com.blockQueue.axis.box.w]

      com.blockQueue.axis.scale
        .domain(com.blockQueue.axis.domain)
        .range(com.blockQueue.axis.range)

      if (!com.blockQueue.axis.enabled) return
      let minTxtSize = com.main.box.w * 0.02
      // console.log(com.blockQueue.axis.domain, com.blockQueue.axis.range);
      com.blockQueue.axis.main.scale(com.blockQueue.axis.scale)
      com.blockQueue.axis.main.tickSize(4)
      com.blockQueue.axis.g.call(com.blockQueue.axis.main)
      com.blockQueue.axis.g.select('path').attr('stroke-width', 1.5).attr('stroke', com.blockQueue.axis.attr.path.stroke)
      com.blockQueue.axis.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 1.5).attr('stroke', com.blockQueue.axis.attr.path.stroke)
      com.blockQueue.axis.g.selectAll('g.tick').selectAll('text')
        .attr('stroke', com.blockQueue.axis.attr.text.stroke)
        .attr('stroke-width', 0.5)
        .attr('fill', com.blockQueue.axis.attr.text.fill)
        .style('font-size', minTxtSize + 'px')
    }
    function updateBlocks () {
      if (com.data.filtered === undefined) return

      if (com.blockQueue.blocks.run.enabled) {
        let dataBottom = []
          .concat(com.data.filtered.done)
          .concat(com.data.filtered.fail)
          .concat(com.data.filtered.run)
          .concat(com.data.filtered.wait)
        let bottomRow = calcBlockRow({
          typeNow: 'bottom',
          start: com.time.startTime.time,
          end: com.time.endTime.time,
          data: dataBottom,
          box: {x: 0, y: 0, w: com.blockQueue.blocks.run.box.w, h: com.blockQueue.blocks.run.box.h, marg: com.blockQueue.blocks.run.box.marg},
          yScale: true
        })
        bottomRow = adjustBlockRow(bottomRow, {x: 0, y: 0, w: com.blockQueue.blocks.run.box.w, h: com.blockQueue.blocks.run.box.h, marg: com.blockQueue.blocks.run.box.marg}, 'toTop')
        bottomRow = setDefaultStyleForBlocks(bottomRow)
        setBlockRect(bottomRow, com.blockQueue.blocks.run)
      }
      if (com.blockQueue.blocks.cancel.enabled) {
        let dataTop = []
          .concat(com.data.filtered.cancel)
        let topRow = calcBlockRow({
          typeNow: 'top',
          start: com.time.startTime.time,
          end: com.time.endTime.time,
          data: dataTop,
          box: {x: 0, y: 0, w: com.blockQueue.blocks.cancel.box.w, h: com.blockQueue.blocks.cancel.box.h, marg: com.blockQueue.blocks.cancel.box.marg},
          yScale: false
        })
        topRow = adjustBlockRow(topRow, {x: 0, y: 0, w: com.blockQueue.blocks.cancel.box.w, h: com.blockQueue.blocks.cancel.box.h, marg: com.blockQueue.blocks.cancel.box.marg}, 'toTop')
        topRow = setDefaultStyleForBlocks(topRow)
        setBlockRect(topRow, com.blockQueue.blocks.cancel)
      }
      if (com.blockQueue.blocks.modification.enabled && com.data.modified.length > 0) {
        let middleRow = calcBlockRow({
          typeNow: 'top',
          start: com.time.startTime.time,
          end: com.time.endTime.time,
          data: com.data.modified,
          box: {x: 0, y: 0, w: com.blockQueue.blocks.run.box.w, h: com.blockQueue.blocks.run.box.h, marg: com.blockQueue.blocks.run.box.marg},
          yScale: true
        })
        middleRow = adjustBlockRow(middleRow, {x: 0, y: 0, w: com.blockQueue.blocks.modification.box.w, h: com.blockQueue.blocks.modification.box.h, marg: com.blockQueue.blocks.modification.box.marg}, 'toBottom')
        middleRow = setDefaultStyleForBlocks(middleRow)
        setBlockRect(middleRow, com.blockQueue.blocks.modification)
      }
    }
    function setBlockRect (data, group) {
      let box = group.box
      // let g = group.g

      let minTxtSize = box.w * 0.016
      let timeScale = d3.scaleLinear()
        .range(com.blockQueue.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])

      let rect = com.main.scroll.scrollG
        .selectAll('g.' + com.main.tag + 'blocks')
        .data(data, function (d) {
          return d.obId
        })

      rect
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('transform', 'translate(' + box.x + ',' + box.y + ')')
      rect.each(function (d, i) {
        d3.select(this).select('rect.back')
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('stroke', d.display.stroke)
          .style('fill', d.display.fill)
          .style('fill-opacity', d.display.fillOpacity)
          .attr('x', timeScale(d.startTime))
          .attr('y', d.display.y - 2)
          .attr('width', timeScale(d.endTime) - timeScale(d.startTime))
          .attr('height', d.display.h)
          .attr('stroke-width', d.display.strokeWidth)
          .style('stroke-opacity', d.display.strokeOpacity)
          .style('stroke-dasharray', d.display.strokeDasharray)
        d3.select(this).select('rect.pattern')
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('x', timeScale(d.startTime))
          .attr('y', d.display.y - 2)
          .attr('width', timeScale(d.endTime) - timeScale(d.startTime))
          .attr('height', d.display.h)
          .style('fill', d.display.patternFill)
          .style('fill-opacity', d.display.patternOpacity)
        d3.select(this).select('text')
          .transition('inOut')
          .duration(timeD.animArc)
          .text(d.metaData.blockName)
          .style('font-size', function (d) {
            d.display.size = Math.max(minTxtSize, Math.min(d.display.w, d.display.h)) / 3
            if (!hasVar(d.display.size)) {
              console.error('_blockQueue_ERROR:', com.main.tag, minTxtSize, d.display.w, d.display.h)
            } // should not happen....
            if (!hasVar(d.display.size)) d.display.size = 0
            return d.display.size + 'px'
          })
          .attr('dy', d.display.size / 3 + 'px')
          .style('opacity', d.display.fillOpacity)
          .style('stroke-opacity', d.display.fillOpacity)
          .style('fill-opacity', d.display.fillOpacity)
          .attr('x', timeScale(d.startTime + d.duration * 0.5))
          .attr('y', d.display.y + d.display.h / 2)
      })
    }

    function addExtraBar (date) {
      let data = []
      if (date === null) {
        let rectNow = com.main.g
          .selectAll('rect.' + com.main.tag + 'extra')
          .data(data)
        rectNow.exit().remove()
      } else {
        data = [date]
        let rectNow = com.main.g
          .selectAll('rect.' + com.main.tag + 'extra')
          .data(data)
          .attr('transform', 'translate(' + com.blockQueue.axis.box.x + ',' + 0 + ')')

        rectNow
          .enter()
          .append('rect')
          .attr('class', com.main.tag + 'extra')
          .style('opacity', 1)
          .attr('x', function (d, i) {
            if (d > com.blockQueue.axis.scale.domain()[1]) return com.blockQueue.axis.scale(com.blockQueue.axis.scale.domain()[1])
            else if (d < com.blockQueue.axis.scale.domain()[0]) return com.blockQueue.axis.scale(com.blockQueue.axis.scale.domain()[0])
            return com.blockQueue.axis.scale(d)
          })
          .attr('y', function (d, i) {
            return com.main.box.y - 1 * com.main.box.marg
          })
          .attr('width', 0)
          .attr('height', function (d, i) {
            return com.main.box.h + 1 * com.main.box.marg
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
            if (d > com.blockQueue.axis.scale.domain()[1]) return com.blockQueue.axis.scale(com.blockQueue.axis.scale.domain()[1])
            else if (d < com.blockQueue.axis.scale.domain()[0]) return com.blockQueue.axis.scale(com.blockQueue.axis.scale.domain()[0])
            return com.blockQueue.axis.scale(d)
          })
          // .attr("y", function(d,i) { return d.y; })
          .attr('width', function (d, i) {
            return com.main.box.marg
          })
      }
    }
    function setTimeRect () {
      let rectNowData = []

      rectNowData = [
        {
          id: com.main.tag + 'now',
          x: com.blockQueue.axis.scale(com.time.currentTime.date),
          y: com.blockQueue.timeBars.box.y,
          w: com.blockQueue.timeBars.box.marg,
          h: com.blockQueue.timeBars.box.h + com.blockQueue.timeBars.box.marg * 2
        }
      ]
      // console.log('timeFrac',timeFrac,rectNowData);
      // console.log('rectNowData',(com.blockRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let rectNow = com.blockQueue.timeBars.g
        .selectAll('rect.' + com.main.tag + 'now')
        .data(rectNowData, function (d) {
          return d.id
        })

      rectNow
        .enter()
        .append('rect')
        .attr('class', com.main.tag + 'now')
        .style('opacity', 1)
        .attr('x', function (d, i) {
          return d.x
        })
        .attr('y', function (d, i) {
          return d.y - 1 * com.main.box.marg
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

    function remove () {
      if (com.blockQueue.axis.enabled) com.blockQueue.axis.g.remove()
      if (com.blockQueue.blocks.enabled) com.blockQueue.blocks.clipping.g.remove()
      if (com.blockQueue.timeBars.enabled) com.blockQueue.timeBars.g.remove()
    }
    this.remove = remove
  }
  let blockQueueBib = new BlockQueueBib()
  let BlockListBib = function () {
    function init () {
      com.blockList.g = com.main.g.append('g')
      com.main.scroll.scrollBoxG.select('rect.background')
        .style('fill', 'transparent')
        .style('stroke', 'transparent')
    }
    this.init = init

    function setDefaultStyleForBlocks (blocks) {
      let timeScale = d3.scaleLinear()
        .range(com.blockQueue.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])
      for (let index in blocks) {
        let b = blocks[index]
        let bDisplay = b.display

        let cols = com.style.blockCol({ d: b })

        bDisplay.w = timeScale(b.endTime) - timeScale(b.startTime)
        bDisplay.stroke = cols.stroke
        bDisplay.strokeWidth = 0.5
        bDisplay.fill = cols.background
        bDisplay.fillOpacity = com.style.blockOpac({ d: b })
        bDisplay.strokeOpacity = com.style.blockOpac({ d: b })
        bDisplay.strokeDasharray = []

        bDisplay.text = cols.text
        bDisplay.patternFill = ''
        bDisplay.patternOpacity = 0
        if (b.sbId === com.input.focus.schedBlocks) {
          if (!(com.input.over.schedBlocks !== undefined && com.input.over.schedBlocks !== com.input.focus.schedBlocks)) { // b.stroke = colorTheme.blocks.critical.background
            // b.patternFill = 'url(#patternHover)'
            bDisplay.patternFill = 'url(#patternSelect)'
            bDisplay.patternOpacity = 1
          }
          bDisplay.strokeWidth = 1
          bDisplay.strokeOpacity = 1
          // b.strokeDasharray = [2, 2]
        }
        if (b.sbId === com.input.over.schedBlocks) {
          bDisplay.strokeWidth = 1
          bDisplay.strokeOpacity = 1
          // b.strokeDasharray = [2, 2]
          bDisplay.patternFill = 'url(#patternSelect)'
          bDisplay.patternOpacity = 1
        }
        if (b.obId === com.input.focus.block) {
          if (com.input.over.block !== undefined && com.input.over.block !== com.input.focus.block) bDisplay.strokeDasharray = [8, 4]
          bDisplay.strokeWidth = 6
          bDisplay.strokeOpacity = 1
        }
        if (b.obId === com.input.over.block) {
          bDisplay.strokeWidth = 6
          bDisplay.strokeOpacity = 1
          bDisplay.strokeDasharray = []
        }
      }
      return blocks
    }
    function groupBlocksBySchedule (blocks) {
      let res = {}
      for (var key in blocks) {
        for (var i = 0; i < blocks[key].length; i++) {
          let ns = blocks[key][i].metaData.nSched
          if (ns in res) res[ns].push(blocks[key][i])
          else res[ns] = [blocks[key][i]]
        }
      }
      let ret = []
      Object.keys(res).map(function (key, index) {
        ret.push({schedName: key, scheduleId: res[key][0].sbId, blocks: res[key]})
      })
      return ret
    }

    function update () {
      let scheds = groupBlocksBySchedule(com.data.filtered)
      let nLine = parseInt(scheds.length / 8) + (scheds.length % 8 === 0 ? 0 : 1)
      let width = com.main.box.w / 8
      let height = com.main.box.h / nLine

      updateSchedulingBlocks(scheds)
      for (let i = 0; i < scheds.length; i++) {
        let offsetX = (parseInt(i / 8) + (scheds.length % 8 === 0 ? 0 : 1)) === nLine
        offsetX = offsetX * (com.main.box.w - ((scheds.length % 8) * width)) * 0.5
        let box = {
          x: offsetX + width * (i % 8),
          y: (height * parseInt(i / 8)) + height * 0.2,
          w: width,
          h: height * 0.75
        }
        setBlockRect(scheds[i].blocks, box)
      }
    }
    this.update = update
    function updateSchedulingBlocks (scheds) {
      let nLine = parseInt(scheds.length / 8) + (scheds.length % 8 === 0 ? 0 : 1)
      let width = com.main.box.w / 8
      let height = com.main.box.h / nLine

      let allScheds = com.blockList.g
        .selectAll('g.allScheds')
        .data(scheds, function (d) {
          return d.scheduleId
        })
      let enterAllScheds = allScheds
        .enter()
        .append('g')
        .attr('class', 'allScheds')
        .attr('transform', function (d, i) {
          let offsetX = (parseInt(i / 8) + (scheds.length % 8 === 0 ? 0 : 1)) === nLine
          offsetX = offsetX * (com.main.box.w - ((scheds.length % 8) * width)) * 0.5
          let translate = {
            y: height * parseInt(i / 8),
            x: offsetX + width * (i % 8)
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      enterAllScheds.each(function (d, i) {
        d3.select(this).append('rect')
          .attr('class', 'background')
          .attr('x', 0 + width * 0.02)
          .attr('y', 0)
          .attr('width', width * 0.96)
          .attr('height', height * 0.96)
          .attr('fill', 'transparent')
          .attr('fill-opacity', 1)
          .attr('stroke', colorTheme.medium.stroke)
          .attr('stroke-width', 0.5)
          .attr('stroke-dasharray', [])
          .style('pointer-events', 'none')
        d3.select(this).append('rect')
          .attr('class', 'titleBackground')
          .attr('x', 0 + width * 0.02)
          .attr('y', 0)
          .attr('width', width * 0.96)
          .attr('height', height * 0.18)
          .attr('fill', colorTheme.darker.background)
          .attr('fill-opacity', 0.5)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.5)
          .attr('stroke-dasharray', [])
          .on('click', function (d) {
            com.events.sched.click(d)
          })
          .on('mouseover', function (d) {
            com.events.sched.mouseover(d)
          })
          .on('mouseout', function (d) {
            com.events.sched.mouseout(d)
          })
        d3.select(this).append('text')
          .attr('class', 'schedId')
          .text(d.schedName)
          .attr('x', width * 0.5)
          .attr('y', height * 0.15)
          .style('font-weight', 'normal')
          .attr('text-anchor', 'middle')
          .style('font-size', (height * 0.2 * 0.75) + 'px')
          .attr('dy', 0)
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.darker.text)
          .attr('stroke', 'none')
      })
      enterAllScheds.merge(allScheds)
        .transition()
        .duration(timeD.animArc)
        .attr('transform', function (d, i) {
          let offsetX = (parseInt(i / 8) + (scheds.length % 8 === 0 ? 0 : 1)) === nLine
          offsetX = offsetX * (com.main.box.w - ((scheds.length % 8) * width)) * 0.5
          let translate = {
            y: height * parseInt(i / 8),
            x: offsetX + width * (i % 8)
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
    }
    function setBlockRect (blocks, box) {
      let blocksTemplate = {
        '1': [{x: 0.5, y: 0.5}],
        '2': [{x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}],
        '3': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.7}],
        '4': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
        '5': [{x: 0.3, y: 0.16}, {x: 0.7, y: 0.16}, {x: 0.5, y: 0.5}, {x: 0.3, y: 0.84}, {x: 0.7, y: 0.84}],
        '6': [],
        '7': [],
        '8': [],
        '9': []
      }
      let dim = Math.min(box.w, box.h) * 0.28
      let minTxtSize = dim * 0.7

      let rect = com.main.scroll.scrollG
        .selectAll('g.' + com.main.tag + 'blocks')
        .data(blocks, function (d) {
          return d.obId
        })

      rect.each(function (d, i) {
        d3.select(this)
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
        d3.select(this).select('rect.back')
          .transition('inOut')
          .duration(timeD.animArc)
          // .attr('stroke', d.display.stroke)
          // .style('fill', d.display.fill)
          // .style('fill-opacity', 1)
          .attr('x', box.w * blocksTemplate['' + blocks.length][i].x - (dim * 0.5))
          .attr('y', box.h * blocksTemplate['' + blocks.length][i].y - (dim * 0.5))
          .attr('width', dim)
          .attr('height', dim)
          // .attr('stroke-width', 0.2)
          // .style('stroke-opacity', 1)
          // .style('stroke-dasharray', [])
        // d3.select(this).select('rect.pattern')
        //   .transition('inOut')
        //   .duration(timeD.animArc)
        //   .attr('x', timeScale(d.startTime))
        //   .attr('y', d.display.y - 2)
        //   .attr('width', timeScale(d.endTime) - timeScale(d.startTime))
        //   .attr('height', d.display.h)
        //   .style('fill', d.display.patternFill)
        //   .style('fill-opacity', d.display.patternOpacity)
        d3.select(this).select('text')
          .transition('inOut')
          .duration(timeD.animArc)
          .text(d.metaData.nObs)
          .style('font-size', minTxtSize + 'px')
          // .attr('dy', d.display.size / 3 + 'px')
          // .style('opacity', d.display.fillOpacity)
          // .style('stroke-opacity', d.display.fillOpacity)
          // .style('fill-opacity', d.display.fillOpacity)
          .attr('dy', minTxtSize * 0.25)
          .attr('x', box.w * blocksTemplate['' + blocks.length][i].x)
          .attr('y', box.h * blocksTemplate['' + blocks.length][i].y)
      })
    }

    function remove () {
      com.main.scroll.scrollBoxG.select('rect.background')
        .style('stroke', com.main.background.stroke)
        .style('fill', com.main.background.fill)
      com.blockList.g.remove()
    }
    this.remove = remove
  }
  let blockListBib = new BlockListBib()
  let BlockFormBib = function () {
    function initScrollBox () {
      com.blockForm.forms.scroll.scrollBoxG = com.blockForm.forms.g.append('g')
      com.blockForm.forms.scroll.scrollBoxG.append('rect')
        .attr('class', 'background')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', com.blockForm.forms.box.w)
        .attr('height', com.blockForm.forms.box.h)
        .style('fill', colorTheme.dark.background)
        .style('stroke', com.main.background.stroke)
        .style('stroke-width', com.main.background.strokeWidth)

      com.blockForm.forms.scroll.scrollBox = new ScrollBox()
      com.blockForm.forms.scroll.scrollBox.init({
        tag: 'blockDisplayerFormScroll',
        gBox: com.blockForm.forms.scroll.scrollBoxG,
        boxData: {
          x: 0,
          y: 0,
          w: com.blockForm.forms.box.w,
          h: com.blockForm.forms.box.h,
          marg: 0
        },
        useRelativeCoords: true,
        locker: new Locker(),
        lockerV: ['blockDisplayerFormScroll' + 'updateData'],
        lockerZoom: {
          all: 'ScrollBox' + 'zoom',
          during: 'ScrollBox' + 'zoomDuring',
          end: 'ScrollBox' + 'zoomEnd'
        },
        runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
        canScroll: true,
        scrollVertical: false,
        scrollHorizontal: true,
        scrollHeight: 0,
        scrollWidth: com.blockForm.forms.box.w + 0.01,
        background: 'transparent',
        scrollRecH: {h: 4},
        scrollRecV: {w: 2}
      })
      com.blockForm.forms.scroll.scrollG = com.blockForm.forms.scroll.scrollBox.get('innerG')
    }
    function init () {
      com.blockForm.forms.g = com.main.g.append('g')
        .attr('class', 'formsList')
        .attr('transform', 'translate(' + com.blockForm.forms.box.x + ',' + com.blockForm.forms.box.y + ')')
      if (com.blockForm.forms.display === 'list') initScrollBox()
      com.main.scroll.scrollBoxG.select('rect.background')
        .style('fill', 'transparent')
        .style('stroke', 'transparent')
      let blocks = []
      if (com.blockForm.mosaic.order === 'nSched') {
        let inter = groupBlocksBySchedule(com.data.filtered)
        for (let i = 0; i < inter.length; i++) { blocks = blocks.concat(inter[i].blocks) }
      } else {
        for (var key in com.data.filtered) { blocks = blocks.concat(com.data.filtered[key]) }
      }
      setBlocksForm(blocks)
    }
    this.init = init

    function setDefaultStyleForBlocks (blocks) {
      let timeScale = d3.scaleLinear()
        .range(com.blockQueue.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])
      for (let index in blocks) {
        let b = blocks[index]
        let bDisplay = b.display

        let cols = com.style.blockCol({ d: b })

        bDisplay.w = timeScale(b.endTime) - timeScale(b.startTime)
        bDisplay.stroke = cols.stroke
        bDisplay.strokeWidth = 0.5
        bDisplay.fill = cols.background
        bDisplay.fillOpacity = com.style.blockOpac({ d: b })
        bDisplay.strokeOpacity = com.style.blockOpac({ d: b })
        bDisplay.strokeDasharray = []

        bDisplay.text = cols.text
        bDisplay.patternFill = ''
        bDisplay.patternOpacity = 0
        if (b.sbId === com.input.focus.schedBlocks) {
          if (!(com.input.over.schedBlocks !== undefined && com.input.over.schedBlocks !== com.input.focus.schedBlocks)) { // b.stroke = colorTheme.blocks.critical.background
            // b.patternFill = 'url(#patternHover)'
            bDisplay.patternFill = 'url(#patternSelect)'
            bDisplay.patternOpacity = 1
          }
          bDisplay.strokeWidth = 1
          bDisplay.strokeOpacity = 1
          // b.strokeDasharray = [2, 2]
        }
        if (b.sbId === com.input.over.schedBlocks) {
          bDisplay.strokeWidth = 1
          bDisplay.strokeOpacity = 1
          // b.strokeDasharray = [2, 2]
          bDisplay.patternFill = 'url(#patternSelect)'
          bDisplay.patternOpacity = 1
        }
        if (b.obId === com.input.focus.block) {
          if (com.input.over.block !== undefined && com.input.over.block !== com.input.focus.block) bDisplay.strokeDasharray = [8, 4]
          bDisplay.strokeWidth = 6
          bDisplay.strokeOpacity = 1
        }
        if (b.obId === com.input.over.block) {
          bDisplay.strokeWidth = 6
          bDisplay.strokeOpacity = 1
          bDisplay.strokeDasharray = []
        }
      }
      return blocks
    }
    function groupBlocksBySchedule (blocks) {
      let res = {}
      for (var key in blocks) {
        for (var i = 0; i < blocks[key].length; i++) {
          let ns = blocks[key][i].metaData.nSched
          if (ns in res) res[ns].push(blocks[key][i])
          else res[ns] = [blocks[key][i]]
        }
      }
      let ret = []
      Object.keys(res).map(function (key, index) {
        ret.push({schedName: key, scheduleId: res[key][0].sbId, blocks: res[key]})
      })
      return ret
    }

    function update () {
      let blocks = []
      if (com.blockForm.mosaic.order === 'nSched') {
        let inter = groupBlocksBySchedule(com.data.filtered)
        for (let i = 0; i < inter.length; i++) { blocks = blocks.concat(inter[i].blocks) }
      } else {
        for (var key in com.data.filtered) { blocks = blocks.concat(com.data.filtered[key]) }
      }
      let mobox = deepCopy(com.blockForm.mosaic.box)
      mobox.y = mobox.y + mobox.h * 0.15
      mobox.h = mobox.h * 0.85
      setBlockRect(blocks, mobox)
    }
    this.update = update

    function setBlocksForm (blocks) {
      for (var i = 0; i < blocks.length; i++) {
        let bform = new BlockForm({
          main: {
            tag: 'blockFormTag' + blocks[i].obId,
            g: com.blockForm.forms.scroll.scrollG.append('g'),
            scroll: {},
            box: {x: 200 * i, y: 0, w: 190, h: com.blockForm.forms.box.h * 1.0, marg: 0},
            background: {
              fill: colorTheme.brighter.background,
              stroke: colorTheme.brighter.stroke,
              strokeWidth: 0.5
            }
          },
          data: {
            block: blocks[i]
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
        })
        bform.update()
      }
      com.blockForm.forms.scroll.scrollBox.resetHorizontalScroller({canScroll: true, scrollWidth: 200 * blocks.length})
    }

    function setBlockRect (blocks, box) {
      let cube = Math.sqrt((box.w * box.h) / blocks.length)
      let column = parseInt(box.w / cube)
      let dim = {
        w: box.w / column,
        h: box.h / (parseInt(blocks.length / column) + 1)
      }
      let minTxtSize = dim.h * 0.7

      let rect = com.main.scroll.scrollG
        .selectAll('g.' + com.main.tag + 'blocks')
        .data(blocks, function (d) {
          return d.obId
        })

      rect.each(function (d, i) {
        d3.select(this)
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
        d3.select(this).select('rect.back')
          .on('click', function () {
            let t = (1.0 / parseFloat(blocks.length - 1)) * parseFloat(i)
            com.blockForm.forms.scroll.scrollBox.moveHorizontalScrollerTo(t)
          })
          .transition('inOut')
          .duration(timeD.animArc)
          // .attr('stroke', d.display.stroke)
          // .style('fill', d.display.fill)
          // .style('fill-opacity', 1)
          .attr('x', dim.w * (i % column) + (dim.w * 0.05))
          .attr('y', dim.h * parseInt(i / column) + (dim.h * 0.05))
          .attr('width', dim.w * 0.9)
          .attr('height', dim.h * 0.9)
          // .attr('stroke-width', 0.2)
          // .style('stroke-opacity', 1)
          // .style('stroke-dasharray', [])
        // d3.select(this).select('rect.pattern')
        //   .transition('inOut')
        //   .duration(timeD.animArc)
        //   .attr('x', timeScale(d.startTime))
        //   .attr('y', d.display.y - 2)
        //   .attr('width', timeScale(d.endTime) - timeScale(d.startTime))
        //   .attr('height', d.display.h)
        //   .style('fill', d.display.patternFill)
        //   .style('fill-opacity', d.display.patternOpacity)
        d3.select(this).select('text')
          .transition('inOut')
          .duration(timeD.animArc)
          .text(d.metaData.nObs)
          .style('font-size', minTxtSize + 'px')
          // .attr('dy', d.display.size / 3 + 'px')
          // .style('opacity', d.display.fillOpacity)
          // .style('stroke-opacity', d.display.fillOpacity)
          // .style('fill-opacity', d.display.fillOpacity)
          .attr('dy', minTxtSize * 0.33)
          .attr('x', dim.w * (i % column) + dim.w * 0.5)
          .attr('y', dim.h * parseInt(i / column) + dim.h * 0.5)
      })
    }

    function remove () {
      com.blockForm.forms.g.remove()
      com.main.scroll.scrollBoxG.select('rect.background')
        .style('fill', com.main.background.fill)
        .style('stroke', com.main.background.stroke)
    }
    this.remove = remove
  }
  let blockFormBib = new BlockFormBib()
  let BlockQueue2Bib = function () {
    function init () {
      com.blockQueue2.g = com.main.g.append('g')
      initAxis()
      initTimeBars()
    }
    this.init = init
    function initAxis () {
      com.blockQueue2.axis.scale = d3.scaleTime()
        .range(com.blockQueue2.axis.range)
        .domain(com.blockQueue2.axis.domain)
      com.blockQueue2.axis.main = d3.axisBottom(com.blockQueue2.axis.scale)
        .tickFormat(d3.timeFormat('%H:%M'))

      if (!com.blockQueue2.axis.enabled) return
      com.blockQueue2.axis.g = com.main.g.append('g')
        .attr('transform', 'translate(' + com.blockQueue2.axis.box.x + ',' + com.blockQueue2.axis.box.y + ')')
      com.blockQueue2.axis.g
        .attr('class', 'axis')
        .call(com.blockQueue2.axis.main)

      com.blockQueue2.axis.g.style('opacity', 1)
    }
    function initTimeBars () {
      if (!com.blockQueue2.timeBars.enabled) return
      com.blockQueue2.timeBars.g = com.main.g.append('g')
        .attr('transform', 'translate(' + com.blockQueue2.timeBars.box.x + ',' + com.blockQueue2.timeBars.box.y + ')')
      com.blockQueue2.timeBars.g
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay(1000)
        .style('opacity', 1)
    }

    function groupBlocksBySchedule (blocks) {
      let res = {}
      for (var key in blocks) {
        for (var i = 0; i < blocks[key].length; i++) {
          let ns = blocks[key][i].metaData.nSched
          if (ns in res) res[ns].push(blocks[key][i])
          else res[ns] = [blocks[key][i]]
        }
      }
      let ret = []
      Object.keys(res).map(function (key, index) {
        ret.push({schedName: key, scheduleId: res[key][0].sbId, blocks: res[key]})
      })
      return ret
    }
    function setDefaultStyleForBlocks (blocks) {
      let timeScale = d3.scaleLinear()
        .range(com.blockQueue2.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])
      for (let index in blocks) {
        let b = blocks[index]
        let bDisplay = b.display

        let cols = com.style.blockCol({ d: b })

        bDisplay.w = timeScale(b.endTime) - timeScale(b.startTime)
        bDisplay.stroke = cols.stroke
        bDisplay.strokeWidth = 0.5
        bDisplay.fill = cols.background
        bDisplay.fillOpacity = com.style.blockOpac({ d: b })
        bDisplay.strokeOpacity = com.style.blockOpac({ d: b })
        bDisplay.strokeDasharray = []

        bDisplay.text = cols.text
        bDisplay.patternFill = ''
        bDisplay.patternOpacity = 0
        if (b.sbId === com.input.focus.schedBlocks) {
          if (!(com.input.over.schedBlocks !== undefined && com.input.over.schedBlocks !== com.input.focus.schedBlocks)) { // b.stroke = colorTheme.blocks.critical.background
            // b.patternFill = 'url(#patternHover)'
            bDisplay.patternFill = 'url(#patternSelect)'
            bDisplay.patternOpacity = 1
          }
          bDisplay.strokeWidth = 1
          bDisplay.strokeOpacity = 1
          // b.strokeDasharray = [2, 2]
        }
        if (b.sbId === com.input.over.schedBlocks) {
          bDisplay.strokeWidth = 1
          bDisplay.strokeOpacity = 1
          // b.strokeDasharray = [2, 2]
          bDisplay.patternFill = 'url(#patternSelect)'
          bDisplay.patternOpacity = 1
        }
        if (b.obId === com.input.focus.block) {
          if (com.input.over.block !== undefined && com.input.over.block !== com.input.focus.block) bDisplay.strokeDasharray = [8, 4]
          bDisplay.strokeWidth = 6
          bDisplay.strokeOpacity = 1
        }
        if (b.obId === com.input.over.block) {
          bDisplay.strokeWidth = 6
          bDisplay.strokeOpacity = 1
          bDisplay.strokeDasharray = []
        }
      }
      return blocks
    }

    function update () {
      if (com.blockQueue2.axis.enabled) updateAxis()
      if (com.blockQueue2.timeBars.enabled) setTimeRect()

      updateSchedulingBlocks()
    }
    this.update = update
    function updateAxis () {
      com.blockQueue2.axis.domain = [com.time.startTime.date, com.time.endTime.date]
      com.blockQueue2.axis.range = [0, com.blockQueue2.axis.box.w]

      com.blockQueue2.axis.scale
        .domain(com.blockQueue2.axis.domain)
        .range(com.blockQueue2.axis.range)

      if (!com.blockQueue2.axis.enabled) return
      let minTxtSize = com.main.box.w * 0.02
      // console.log(com.blockQueue2.axis.domain, com.blockQueue2.axis.range);
      com.blockQueue2.axis.main.scale(com.blockQueue2.axis.scale)
      com.blockQueue2.axis.main.tickSize(4)
      com.blockQueue2.axis.g.call(com.blockQueue2.axis.main)
      com.blockQueue2.axis.g.select('path').attr('stroke-width', 1.5).attr('stroke', com.blockQueue2.axis.attr.path.stroke)
      com.blockQueue2.axis.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 1.5).attr('stroke', com.blockQueue2.axis.attr.path.stroke)
      com.blockQueue2.axis.g.selectAll('g.tick').selectAll('text')
        .attr('stroke', com.blockQueue2.axis.attr.text.stroke)
        .attr('stroke-width', 0.5)
        .attr('fill', com.blockQueue2.axis.attr.text.fill)
        .style('font-size', minTxtSize + 'px')
    }
    function updateSchedulingBlocks () {
      let scheds = groupBlocksBySchedule(com.data.filtered)
      let nLine = scheds.length
      let height = com.main.box.h / nLine

      let allScheds = com.main.g
        .selectAll('g.allScheds')
        .data(scheds, function (d) {
          return d.scheduleId
        })
      let enterAllScheds = allScheds
        .enter()
        .append('g')
        .attr('class', 'allScheds')
        .attr('transform', function (d, i) {
          let translate = {
            y: height * i,
            x: 0
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      enterAllScheds.each(function (d, i) {
        d3.select(this).append('line')
          .attr('class', 'background')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', com.main.box.w)
          .attr('y2', 0)
          .attr('fill', 'transparent')
          .attr('fill-opacity', 1)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)
          .attr('stroke-dasharray', [])
        d3.select(this).append('text')
          .attr('class', 'schedId')
          .text(d.schedName)
          .attr('x', com.main.box.w + 2)
          .attr('y', height * 0.75)
          .style('font-weight', 'normal')
          .attr('text-anchor', 'start')
          .style('font-size', (height * 0.85) + 'px')
          .attr('dy', 0)
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.darker.text)
          .attr('stroke', 'none')
      })
      enterAllScheds.merge(allScheds)
        .transition()
        .duration(timeD.animArc)
        .attr('transform', function (d, i) {
          let translate = {
            y: height * i,
            x: 0
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
        .each(function (d, i) {
          setBlockRect(d.blocks, {x: 0, y: (height * i), w: com.main.box.w, h: height})
        })
    }
    function setBlockRect (blocks, box) {
      let timeScale = d3.scaleLinear()
        .range(com.blockQueue.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])

      let rect = com.main.scroll.scrollG
        .selectAll('g.' + com.main.tag + 'blocks')
        .data(blocks, function (d) {
          return d.obId
        })

      rect.each(function (d, i) {
        d3.select(this)
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
        d3.select(this).select('rect.back')
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('x', timeScale(d.startTime))
          .attr('y', 0)
          .attr('width', timeScale(d.endTime) - timeScale(d.startTime))
          .attr('height', box.h)
        d3.select(this).select('rect.pattern')
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('x', timeScale(d.startTime))
          .attr('y', 0)
          .attr('width', timeScale(d.endTime) - timeScale(d.startTime))
          .attr('height', box.h)
          // .style('fill', d.display.patternFill)
          // .style('fill-opacity', d.display.patternOpacity)
        d3.select(this).select('text')
          .transition('inOut')
          .duration(timeD.animArc)
          .text(d.metaData.nObs)
          .style('font-size', (box.h * 0.5) + 'px')
          .attr('dy', 1)
          .attr('x', timeScale(d.startTime) + (timeScale(d.endTime) - timeScale(d.startTime)) * 0.5)
          .attr('y', (box.h * 0.5))
      })
    }

    function addExtraBar (date) {
      let data = []
      if (date === null) {
        let rectNow = com.main.g
          .selectAll('rect.' + com.main.tag + 'extra')
          .data(data)
        rectNow.exit().remove()
      } else {
        data = [date]
        let rectNow = com.main.g
          .selectAll('rect.' + com.main.tag + 'extra')
          .data(data)
          .attr('transform', 'translate(' + com.blockQueue2.axis.box.x + ',' + 0 + ')')

        rectNow
          .enter()
          .append('rect')
          .attr('class', com.main.tag + 'extra')
          .style('opacity', 1)
          .attr('x', function (d, i) {
            if (d > com.blockQueue2.axis.scale.domain()[1]) return com.blockQueue2.axis.scale(com.blockQueue2.axis.scale.domain()[1])
            else if (d < com.blockQueue2.axis.scale.domain()[0]) return com.blockQueue2.axis.scale(com.blockQueue2.axis.scale.domain()[0])
            return com.blockQueue2.axis.scale(d)
          })
          .attr('y', function (d, i) {
            return com.main.box.y - 1 * com.main.box.marg
          })
          .attr('width', 0)
          .attr('height', function (d, i) {
            return com.main.box.h + 1 * com.main.box.marg
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
            if (d > com.blockQueue2.axis.scale.domain()[1]) return com.blockQueue2.axis.scale(com.blockQueue2.axis.scale.domain()[1])
            else if (d < com.blockQueue2.axis.scale.domain()[0]) return com.blockQueue2.axis.scale(com.blockQueue2.axis.scale.domain()[0])
            return com.blockQueue2.axis.scale(d)
          })
          // .attr("y", function(d,i) { return d.y; })
          .attr('width', function (d, i) {
            return com.main.box.marg
          })
      }
    }
    function setTimeRect () {
      let rectNowData = []

      rectNowData = [
        {
          id: com.main.tag + 'now',
          x: com.blockQueue2.axis.scale(com.time.currentTime.date),
          y: com.blockQueue2.timeBars.box.y,
          w: com.blockQueue2.timeBars.box.marg,
          h: com.blockQueue2.timeBars.box.h + com.blockQueue2.timeBars.box.marg * 2
        }
      ]
      // console.log('timeFrac',timeFrac,rectNowData);
      // console.log('rectNowData',(com.blockRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let rectNow = com.blockQueue2.timeBars.g
        .selectAll('rect.' + com.main.tag + 'now')
        .data(rectNowData, function (d) {
          return d.id
        })

      rectNow
        .enter()
        .append('rect')
        .attr('class', com.main.tag + 'now')
        .style('opacity', 1)
        .attr('x', function (d, i) {
          return d.x
        })
        .attr('y', function (d, i) {
          return d.y - 1 * com.main.box.marg
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

    function remove () {
      com.blockQueue2.g.remove()
      com.main.g.selectAll('g.allScheds').remove()
      if (com.blockQueue2.axis.enabled) com.blockQueue2.axis.g.remove()
      if (com.blockQueue2.timeBars.enabled) com.blockQueue2.timeBars.g.remove()
    }
    this.remove = remove
  }
  let blockQueue2Bib = new BlockQueue2Bib()

  function init () {
    setDefaultStyle()
    initScrollBox()
    // this.initBackground()

    if (com.displayer === 'blockQueue') {
      blockQueueBib.init()
    } else if (com.displayer === 'blockList') {
      blockQueueBib.init()
    } else if (com.displayer === 'blockForm') {
      blockFormBib.init()
    } else if (com.displayer === 'blockQueue2') {
      blockQueue2Bib.init()
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
    com.main.scroll.scrollBox.init({
      tag: 'blockDisplayerScroll',
      gBox: com.main.scroll.scrollBoxG,
      boxData: {
        x: 0,
        y: 0,
        w: com.main.box.w,
        h: com.main.box.h
      },
      useRelativeCoords: true,
      locker: new Locker(),
      lockerV: ['blockDisplayerScroll' + 'updateData'],
      lockerZoom: {
        all: 'blockDisplayerScroll' + 'zoom',
        during: 'blockDisplayerScroll' + 'zoomDuring',
        end: 'blockDisplayerScroll' + 'zoomEnd'
      },
      runLoop: new RunLoop({tag: 'blockDisplayerScroll'}),
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
    for (var z = 0; z < com.data.raw.blocks.done.length; z++) {
      let dataNow = com.data.raw.blocks.done[z]
      if (com.filters.filtering.length === 0) {
        if (dataNow.exeState.state === 'done') filtered.done.push(dataNow)
        if (dataNow.exeState.state === 'fail') filtered.fail.push(dataNow)
        if (dataNow.exeState.state === 'cancel') filtered.cancel.push(dataNow)
      } else {
        let insert = true
        for (var i = 0; i < com.filters.filtering.length; i++) {
          let filterNow = com.filters.filtering[i]
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
    filtered.wait = com.data.raw.blocks.wait.filter(function (d) {
      if (com.filters.filtering.length === 0) return true
      for (var i = 0; i < com.filters.filtering.length; i++) {
        let filterNow = com.filters.filtering[i]
        let ok = true
        for (var j = 0; j < filterNow.length; j++) {
          if (!checkPropertiesValue(d, filterNow[j].keys, filterNow[j].value)) ok = false
        }
        if (ok) return false
      }
      return true
    })
    filtered.run = com.data.raw.blocks.run.filter(function (d) {
      if (com.filters.filtering.length === 0) return true
      for (var i = 0; i < com.filters.filtering.length; i++) {
        let filterNow = com.filters.filtering[i]
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
  function createBlocksGroup () {
    let allBlocks = [].concat(com.data.filtered.done)
      .concat(com.data.filtered.run)
      .concat(com.data.filtered.cancel)
      .concat(com.data.filtered.wait)
      .concat(com.data.filtered.fail)

    let rect = com.main.scroll.scrollG
      .selectAll('g.' + com.main.tag + 'blocks')
      .data(allBlocks, function (d) {
        return d.obId
      })
    let rectEnter = rect
      .enter()
      .append('g')
      .attr('class', com.main.tag + 'blocks')
      .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    rectEnter.each(function (d, i) {
      let parent = d3.select(this)
      d3.select(this).append('rect')
        .attr('class', 'back')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0)
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
          let that = this

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
          com.events.block.mouseover(d)
        })
        .on('mouseout', function (d) {
          com.events.block.mouseout(d)
        })
        .call(d3.drag()
          .on('start', function (d) {
            com.interaction = {}
            com.interaction.oldG = parent
            com.events.block.drag.start(d)
          })
          .on('drag', function (d) {
            com.events.block.drag.tick(d)
          })
          .on('end', function (d) {
            com.events.block.drag.end(d)
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
        .attr('class', 'name')
        .text(d.metaData.blockName)
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
    })
    rect = rectEnter.merge(rect)
  }
  function updateData (dataIn) {
    com.main.g.select('text.name')
      .transition()
      .duration(400)
      .style('opacity', 0)
    com.time.currentTime = dataIn.time.currentTime
    com.time.startTime = dataIn.time.startTime
    com.time.endTime = dataIn.time.endTime
    com.data.raw = dataIn.data.raw
    com.data.modified = dataIn.data.modified

    com.data.filtered = filterData()
    createBlocksGroup()

    if (com.displayer === 'blockQueue') {
      blockQueueBib.update()
    } else if (com.displayer === 'blockList') {
      blockListBib.update()
    } else if (com.displayer === 'blockForm') {
      blockFormBib.update()
    } else if (com.displayer === 'blockQueue2') {
      blockQueue2Bib.update()
    }
  }
  this.updateData = updateData
  function update (dataIn) {
    com.time.currentTime = dataIn.time.currentTime
    com.time.startTime = dataIn.time.startTime
    com.time.endTime = dataIn.time.endTime

    if (com.displayer === 'blockQueue') {
      blockQueueBib.update()
    } else if (com.displayer === 'blockList') {
      blockListBib.update()
    } else if (com.displayer === 'blockForm') {
      blockFormBib.update()
    } else if (com.displayer === 'blockQueue2') {
      blockQueue2Bib.update()
    }
  }
  this.update = update

  function changeDisplayer (newDisplayer) {
    if (com.displayer === newDisplayer) return

    if (com.displayer === 'blockQueue') {
      blockQueueBib.remove()
    } else if (com.displayer === 'blockList') {
      blockListBib.remove()
    } else if (com.displayer === 'blockForm') {
      blockFormBib.remove()
    } else if (com.displayer === 'blockQueue2') {
      blockQueue2Bib.remove()
    }

    com.displayer = newDisplayer
    if (com.displayer === 'blockQueue') {
      blockQueueBib.init()
      blockQueueBib.update()
    } else if (com.displayer === 'blockList') {
      blockListBib.init()
      blockListBib.update()
    } else if (com.displayer === 'blockForm') {
      blockFormBib.init()
      blockFormBib.update()
    } else if (com.displayer === 'blockQueue2') {
      blockQueue2Bib.init()
      blockQueue2Bib.update()
    }
  }
  this.changeDisplayer = changeDisplayer

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  // function blocksMouseOver (data) {
  //   let totBlocks = com.blockQueue.blocks.run.g.selectAll('g.' + com.main.tag + 'blocks')
  //   if (com.blockQueue.blocks.cancel.g) totBlocks.merge(com.blockQueue.blocks.cancel.g.selectAll('g.' + com.main.tag + 'blocks'))
  //
  //   totBlocks.each(function (d) {
  //     if (d.data.metaData.nSched === data.data.metaData.nSched && d.data.metaData.nObs !== data.data.metaData.nObs) {
  //       d3.select(this).select('rect.back').attr('stroke-width', 6)
  //         .style('stroke-opacity', 1)
  //         .attr('stroke-dasharray', [4, 2])
  //     }
  //   })
  // }
  // function blocksMouseOut (data) {
  //   let totBlocks = com.blockQueue.blocks.run.g.selectAll('g.' + com.main.tag + 'blocks')
  //   if (com.blockQueue.blocks.cancel.g) totBlocks.merge(com.blockQueue.blocks.cancel.g.selectAll('g.' + com.main.tag + 'blocks'))
  //
  //   totBlocks.each(function (d) {
  //     if (d.data.metaData.nSched === data.data.metaData.nSched && d.data.metaData.nObs !== data.data.metaData.nObs) {
  //       d3.select(this).select('rect.back').attr('stroke-width', 1)
  //         .style('stroke-opacity', 0.4)
  //         .attr('stroke-dasharray', [])
  //     }
  //   })
  // }

  function overSchedBlocks (id) {
    com.input.over.schedBlocks = id
    blockQueueBib.update()
  }
  this.overSchedBlocks = overSchedBlocks
  function outSchedBlocks (id) {
    com.input.over.schedBlocks = undefined
    blockQueueBib.update()
  }
  this.outSchedBlocks = outSchedBlocks
  function overBlock (id) {
    com.input.over.block = id
    blockQueueBib.update()
  }
  this.overBlock = overBlock
  function outBlock (id) {
    com.input.over.block = undefined
    blockQueueBib.update()
  }
  this.outBlock = outBlock

  function focusOnSchedBlocks (id) {
    com.input.focus.schedBlocks = id
    blockQueueBib.update()
  }
  this.focusOnSchedBlocks = focusOnSchedBlocks
  function unfocusOnSchedBlocks (id) {
    com.input.focus.schedBlocks = undefined
    blockQueueBib.update()
  }
  this.unfocusOnSchedBlocks = unfocusOnSchedBlocks
  function focusOnBlock (id) {
    com.input.focus.block = id
    blockQueueBib.update()
  }
  this.focusOnBlock = focusOnBlock
  function unfocusOnBlock (id) {
    com.input.focus.block = undefined
    blockQueueBib.update()
  }
  this.unfocusOnBlock = unfocusOnBlock

  // function dragBlockStart (d) {}
  // function dragBlockTick (d) {}
  // function dragBlockEnd (d) {}

  function addFiltering (filter) {
    com.filters.filtering.push(filter)
  }
  this.addFiltering = addFiltering
  function removeFiltering (filter) {
    let index = com.filters.filtering.indexOf(filter)
    com.filters.filtering.splice(index, 1)
  }
  this.removeFiltering = removeFiltering
  function plugBlockFilters (blockFilters, propagate) {
    com.filters.blockFilters.push(blockFilters)
    if (propagate) blockFilters.plugBlockQueue(this, !propagate)
  }
  this.plugBlockFilters = plugBlockFilters
  function unplugBlockFilters (blockFilters, propagate) {
    for (let i = com.filters.blockFilters.length - 1; i > -1; i--) {
      if (com.filters.blockFilters[i] === blockFilters) {
        com.filters.blockFilters[i].remove()
      }
    }
    if (propagate) blockFilters.unplugBlockQueue(this, !propagate)
  }
  this.unplugBlockFilters = unplugBlockFilters
}
