/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global colPrime */
/* global colsReds */
/* global deepCopy */
/* global minMaxObj */
/* global colsBlues */
/* global loadScript */
/* global ScrollBox */
/* global colsGreens */
/* global colsYellows */
/* global colsPurplesBlues */

loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollBox.js' })

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.BlockQueue = function () {
  let com = {}

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function init (optIn) {
    if (hasVar(com.mainTag)) {
      console.error('trying to init more than once ...', optIn)
      return
    }

    com.mainTag = optIn.tag
    com.locker = optIn.locker
    com.runLoop = optIn.runLoop

    let lockerZoom = optIn.lockerZoom
    if (!hasVar(lockerZoom)) {
      lockerZoom = {
        all: com.mainTag + 'zoom',
        during: com.mainTag + 'zoomDuring',
        end: com.mainTag + 'zoomEnd'
      }
    }
    com.lockerZoom = lockerZoom

    let lockerV = {}
    lockerV.lockerV = hasVar(optIn.lockerV) ? optIn.lockerV : []
    lockerV.zoomDuring = lockerV.lockerV
      .slice()
      .concat([lockerZoom.during])
    lockerV.zoomEnd = lockerV.lockerV
      .slice()
      .concat([lockerZoom.end])
    // console.log(lockerV.zoomDuring);
    com.lockerV = lockerV

    com.scrollTrans = {
      now: 0,
      min: 0,
      max: 0,
      frac: 0,
      active: false,
      drag: { y: 0, frac: 0 }
    }
    com.time = { start: 0, now: 1, end: 1000 }
    com.telIds = ['placeholder']

    com.click = hasVar(optIn.click) ? optIn.click : null
    com.doText = hasVar(optIn.doText) ? optIn.doText : true
    com.doPhase = hasVar(optIn.doPhase) ? optIn.doPhase : true
    com.doRunRect = hasVar(optIn.doRunRect) ? optIn.doRunRect : true
    com.doTimeRect = hasVar(optIn.doTimeRect) ? optIn.doTimeRect : true

    com.tagClipPath = optIn.tagClipPath
    if (!hasVar(com.tagClipPath)) {
      com.tagClipPath = {
        inner: com.mainTag + 'clipPathInner',
        outer: com.mainTag + 'clipPathOuter'
      }
    }

    if (hasVar(optIn.futureCanceled)) com.futureCanceled = optIn.futureCanceled
    else {
      com.futureCanceled = { hide: false, shiftY: true }
    }

    com.prevUpdate = null

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------
    let gBox = optIn.gBox
    com.outerBox = deepCopy(optIn.boxData)
    com.outerG = gBox.append('g')
    com.scrollBoxG = com.outerG.append('g')

    com.scrollBox = new ScrollBox()
    com.scrollBox.init({
      tag: com.mainTag,
      gBox: com.scrollBoxG,
      boxData: com.outerBox,
      useRelativeCoords: false,
      title: optIn.title,
      locker: optIn.locker,
      lockerV: optIn.lockerV,
      lockerZoom: optIn.lockerZoom,
      runLoop: optIn.runLoop
    })

    com.innerG = com.scrollBox.get('innerG')
    com.innerBox = com.scrollBox.get('innerBox')

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    setStyle(optIn.style)

    update()
  }
  this.init = init

  // ---------------------------------------------------------------------------------------------------
  // styling
  // ---------------------------------------------------------------------------------------------------
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
        // let colsPurplesBlues = colsMix;
        let nObs = hasVar(optIn.nObs) ? optIn.nObs : optIn.d.nBlock
        let state = hasVar(optIn.state)
          ? optIn.state
          : optIn.d.data.exeState.state
        let canRun = hasVar(optIn.canRun)
          ? optIn.canRun
          : optIn.d.data.exeState.canRun

        if (state === 'wait') return colsYellows[2]
        else if (state === 'done') return colsGreens[4]
        else if (state === 'run') {
          return colsPurplesBlues[nObs % colsPurplesBlues.length]
        } else if (state === 'cancel') {
          if (hasVar(canRun)) {
            if (!canRun) return colsYellows[1]
          }
          return colsYellows[4]
        } else if (state === 'fail') return colsReds[0]
        else return colPrime
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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function filterBlocks (dataIn) {
    if (!hasVar(dataIn)) dataIn = {}
    $.each(['done', 'run', 'wait'], function (index, typeNow) {
      if (!hasVar(dataIn[typeNow])) dataIn[typeNow] = []
    })

    if (com.futureCanceled.hide) {
      $.each(dataIn, function (typeNow, blocksNow) {
        dataIn[typeNow] = blocksNow.filter(function (d) {
          return d.exeState.canRun
        })
      })
    }

    // take care of future cancelled blocks - make sure they are in the correct phase
    // ---------------------------------------------------------------------------------------------------
    if (com.doPhase) {
      $.each(dataIn.done, function (index, dataNow) {
        if (dataNow.startTime > com.time.now) {
          dataIn.wait.push(dataNow)
          dataIn.done[index] = null
        }
      })

      dataIn.done = dataIn.done.filter(function (d) {
        return hasVar(d)
      })
    }

    return dataIn
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function update (dataIn) {
    dataIn = filterBlocks(dataIn)

    com.blocksIn = dataIn

    let thisUpdate = { ids: [], props: {} }

    $.each(dataIn, function (typeNow, blocksNow) {
      $.each(blocksNow, function (i, d) {
        // the list of properties which will be monitored for change
        thisUpdate.props[d.obId] = {
          startTime: Math.floor(d.startTime),
          endTime: Math.floor(d.endTime),
          type: typeNow,
          canRun: d.exeState.canRun,
          state: d.exeState.state
        }

        thisUpdate.ids.push(d.obId)
      })
    })

    let hasBlockUpdate = true
    if (hasVar(com.prevUpdate)) {
      let hasSameIds = true
      let intersect = thisUpdate.ids.filter(n => com.prevUpdate.ids.includes(n))
      if (intersect.length !== com.prevUpdate.ids.length) hasSameIds = false

      if (hasSameIds) {
        hasBlockUpdate = false
        $.each(thisUpdate.props, function (obIdNow, dataNow) {
          if (!hasVar(com.prevUpdate.props[obIdNow])) {
            hasBlockUpdate = true
          }
          if (hasBlockUpdate) return

          $.each(dataNow, function (propName, propVal) {
            if (com.prevUpdate.props[obIdNow][propName] !== propVal) {
              hasBlockUpdate = true
            }
          })
        })
      }
    }

    com.prevUpdate = thisUpdate

    // // ====================================================
    // // for debugging scroll
    // // ====================================================
    if (hasVar(window.debugScroll)) {
      hasBlockUpdate = 1
    }
    // // ====================================================

    if (hasBlockUpdate) {
      getBlocks()
      setBlockRect()
      setRunRect()
    }
    setTimeRect()
  }
  this.update = update

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function getBlocks () {
    // // ---------------------------------------------------------------------------------------------------
    // // test edge cases:
    // // ---------------------------------------------------------------------------------------------------
    // com.blocksIn.doneNow = com.blocksIn.done
    // com.blocksIn.runNow  = com.blocksIn.run
    // com.blocksIn.waitNow = com.blocksIn.wait
    // // com.blocksIn.done  = com.blocksIn.doneNow.slice(0, 2);
    // // com.blocksIn.run   = []//com.blocksIn.doneNow.slice(2, 3);
    // com.blocksIn.wait  = com.blocksIn.waitNow.slice(0, 13);
    // // ---------------------------------------------------------------------------------------------------
    // com.blocksIn.done  = com.blocksIn.done.slice(0, 10);
    // com.blocksIn.run   = []//com.blocksIn.doneNow.slice(2, 3);
    // com.blocksIn.wait  = []//com.blocksIn.wait.slice(0, 7);
    // // ---------------------------------------------------------------------------------------------------
    let box = com.innerBox
    let runFrac = com.blocksIn.run.length === 0 ? 0 : 0.2
    let runMarg =
      com.blocksIn.run.length === 0 ? 0 : 2 * (box.x - com.outerBox.x)

    let maxDone = minMaxObj({
      minMax: 'max',
      data: com.blocksIn.done,
      func: 'endTime',
      defVal: 0
    })
    // let minRun = minMaxObj({
    //   minMax: 'min',
    //   data: com.blocksIn.run,
    //   func: 'startTime',
    //   defVal: 0
    // })
    // let maxRun = minMaxObj({
    //   minMax: 'max',
    //   data: com.blocksIn.run,
    //   func: 'endTime',
    //   defVal: 0
    // })
    let minWait = minMaxObj({
      minMax: 'min',
      data: com.blocksIn.wait,
      func: 'startTime',
      defVal: 0
    })

    let doneWaitW = com.time.end - minWait + maxDone - com.time.start

    let frac = {}
    frac.done = (1 - runFrac) * (maxDone - com.time.start) / doneWaitW
    frac.run = runFrac - 2 * runMarg / box.w
    frac.wait = (1 - runFrac) * (com.time.end - minWait) / doneWaitW

    if (com.blocksIn.done.length === 0) {
      frac.done = 0
      frac.wait = 1 - runFrac
    }
    if (com.blocksIn.wait.length === 0) {
      frac.done = 1 - runFrac
      frac.wait = 0
    }

    com.blockRow = {}
    $.each(['done', 'run', 'wait'], function (index, typeNow) {
      let dataIn = com.blocksIn[typeNow]

      if (!com.doPhase) {
        if (index > 0) return

        com.blockRow.run = []
        com.blockRow.wait = []

        dataIn = []
          .concat(com.blocksIn.done)
          .concat(com.blocksIn.run)
          .concat(com.blocksIn.wait)
      }

      com.blockRow[typeNow] = calcBlockRow({
        typeNow: typeNow,
        start: com.time.start,
        end: com.time.end,
        data: dataIn
      })

      if (!com.doPhase) return
      if (com.blockRow[typeNow].length === 0) return

      let xMin = minMaxObj({
        minMax: 'min',
        data: com.blockRow[typeNow],
        func: 'x'
      })
      let xMax = minMaxObj({
        minMax: 'max',
        data: com.blockRow[typeNow],
        func: function (d, i) {
          return d.x + d.w
        }
      })
      let scale = frac[typeNow] / ((xMax - xMin) / box.w)

      let xShift = null
      let xShiftType = 0
      if (typeNow === 'run') xShiftType = frac.done * box.w + runMarg
      if (typeNow === 'wait') {
        xShiftType = (frac.done + frac.run) * box.w + 2 * runMarg
      }
      // if(typeNow=='run')console.log('----',xMin,xMax,scale,xShiftType);

      $.each(com.blockRow[typeNow], function (index, dataNow) {
        dataNow.x = (dataNow.x - box.x) * scale + box.x
      })

      $.each(com.blockRow[typeNow], function (index, dataNow) {
        if (!hasVar(xShift)) {
          let xMinNow = minMaxObj({
            minMax: 'min',
            data: com.blockRow[typeNow],
            func: 'x'
          })
          xShift = box.x - xMinNow + xShiftType
          // xShift = box.x - com.blockRow[typeNow][0].x + xShiftType;
        }

        dataNow.x += xShift
        dataNow.w = dataNow.w * scale
      })
    })

    com.blocksAll = []
      .concat(com.blockRow.done)
      .concat(com.blockRow.run)
      .concat(com.blockRow.wait)

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let yMin = minMaxObj({
      minMax: 'min',
      data: com.blocksAll,
      func: 'y'
    })
    let yMax = minMaxObj({
      minMax: 'max',
      data: com.blocksAll,
      func: function (d, i) {
        return d.y + d.h
      }
    })
    let yDif = yMax - yMin

    let hasScroll = yDif > com.innerBox.h + 0.01

    com.scrollBox.resetScroller({ canScroll: hasScroll, scrollHeight: yDif })
  }
  this.getBlocks = getBlocks

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function calcBlockRow (optIn) {
    let dataIn = optIn.data
    let box = com.innerBox
    let xScale = box.w / (optIn.end - optIn.start)
    let yScale = box.h / com.telIds.length

    let blocks = []
    let nBlocksType = {}
    $.each(dataIn, function (index, dataNow) {
      let id = dataNow.obId
      let state = dataNow.exeState.state
      let nTels = dataNow.telIds.length
      let start = dataNow.startTime * xScale
      let end = dataNow.endTime * xScale
      let overlap = dataNow.duration * xScale * 0.2 // allow small overlap in x between blocks
      let x0 = box.x + start
      let w0 = end - start
      let h0 = nTels * yScale
      let y0 = box.y

      if (
        !com.futureCanceled.hide &&
        com.futureCanceled.shiftY &&
        !dataNow.exeState.canRun
      ) {
        y0 += box.h + 2 * box.marg
      }

      // // ====================================================
      // // for debugging scroll
      // // ====================================================
      // if(!hasVar(window.debugScroll)){window.debugScroll=0}if(index==0&&optIn.data[0].exeState.state=='wait'){debugScroll+=1;}if(debugScroll%3==0){w0=w0*3;}
      // w0 = w0*2
      // // ====================================================

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
    //
    // ---------------------------------------------------------------------------------------------------
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

      for (let nTries = 0; nTries < 10; nTries++) {
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
        let hasOverlap =
          x1 < x0 + w0 && x1 + w1 > x0 && y1 < y0 + h0 && y1 + h1 > y0
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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setBlockRect () {
    let box = com.innerBox
    let minTxtSize = box.w * 0.03
    let rect = com.innerG
      .selectAll('rect.' + com.mainTag + 'blocks')
      .data(com.blocksAll, function (d) {
        return d.id
      })

    // ---------------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------------
    let hasErr = 0
    $.each(com.blocksAll, function (i, d) {
      if (d.w <= 0 || d.h <= 0) {
        console.error(i, d)
        hasErr = 1
      }
    })
    if (hasErr) {
      console.error(com.blocksAll)
    }
    // ---------------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------------
    // console.log('-----------------------------------------------------');

    rect
      .enter()
      .append('rect')
      .attr('class', com.mainTag + 'blocks')
      .style('opacity', 0)
      .attr('x', function (d, i) {
        return d.x
      })
      .attr('y', function (d, i) {
        return d.y
      })
      .attr('width', function (d, i) {
        return d.w
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
      .on('click', com.click)
      // .attr("clip-path", "url(#"+com.tagClipPath.inner+")")
      .merge(rect)
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 1)
      .attr('stroke', function (d, i) {
        return d3.rgb(com.style.recCol({ d: d })).darker(1.0)
      })
      .style('fill', function (d, i) {
        return com.style.recCol({ d: d })
      })
      .style('fill-opacity', function (d) {
        return com.style.recFillOpac(d, d.data.exeState.state)
      })
      .style('stroke-opacity', com.style.recStrokeOpac)
      .attr('x', function (d, i) {
        return d.x
      })
      .attr('y', function (d, i) {
        return d.y
      })
      .attr('width', function (d, i) {
        return d.w
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
    let txtData = com.doText ? com.blocksAll : []
    let text = com.innerG
      .selectAll('text.' + com.mainTag + 'blocks')
      .data(txtData, function (d) {
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
      .style('fill', '#383b42')
      .style('stroke-width', 0.3)
      .style('stroke-opacity', 1)
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .style('stroke', function (d) {
        return '#383b42'
      })
      .attr('x', function (d, i) {
        return d.x + d.w / 2
      })
      .attr('y', function (d, i) {
        return d.y + d.h / 2
      })
      .attr('text-anchor', 'middle')
      // .attr("clip-path", "url(#"+com.tagClipPath.inner+")")
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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setRunRect () {
    // let box = com.innerBox

    let recRunData = []
    if (com.blockRow.run.length > 0 && com.doPhase && com.doRunRect) {
      let xMin = minMaxObj({
        minMax: 'min',
        data: com.blockRow.run,
        func: 'x'
      })
      let xMax = minMaxObj({
        minMax: 'max',
        data: com.blockRow.run,
        func: function (d, i) {
          return d.x + d.w
        }
      })

      recRunData = [
        {
          id: com.mainTag + 'run',
          x: xMin - com.outerBox.marg / 2,
          y: com.outerBox.y - com.outerBox.marg / 2,
          w: xMax - xMin + com.outerBox.marg,
          h: com.outerBox.h + com.outerBox.marg
        }
      ]
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let rectRun = com.outerG
      .selectAll('rect.' + com.mainTag + 'runRange')
      .data(recRunData, function (d) {
        return d.id
      })

    rectRun
      .enter()
      .append('rect')
      .attr('class', com.mainTag + 'runRange')
      .style('opacity', 1)
      .attr('x', function (d, i) {
        return d.x + d.w / 2
      })
      .attr('y', function (d, i) {
        return d.y
      })
      .attr('width', 0)
      .attr('height', function (d, i) {
        return d.h
      })
      // .attr("stroke", "#383B42")
      .attr('stroke', d3.rgb(com.style.runRecCol).darker(1.0))
      .attr('fill', 'transparent')
      .attr('fill-opacity', 0.2)
      .attr('stroke-width', 1)
      .style('stroke-opacity', 0.8)
      .style('pointer-events', 'none')
      .attr('vector-effect', 'non-scaling-stroke')
      // .attr("clip-path", "url(#"+com.tagClipPath.outer+")")
      .merge(rectRun)
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

    rectRun
      .exit()
      .transition('inOut')
      .duration(timeD.animArc / 2)
      .attr('x', function (d, i) {
        return d.x + d.w / 2
      })
      .attr('width', 0)
      .style('opacity', 0)
      .remove()
  }
  this.setRunRect = setRunRect

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

        timeFrac = com.time.now - com.time.start
        timeFrac /= com.time.end - com.time.start
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
}
