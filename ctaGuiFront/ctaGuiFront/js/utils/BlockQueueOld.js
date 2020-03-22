/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global col_prime */
/* global cols_reds */
/* global deep_copy */
/* global min_max_obj */
/* global cols_blues */
/* global load_script */
/* global ScrollBox */
/* global cols_greens */
/* global cols_yellows */
/* global cols_purples_blues */

load_script({ source: 'utils_scrollTable', script: '/js/utils/ScrollBox.js' })

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.BlockQueueOld = function () {
  let com = {}

  this.set = function (opt_in) {
    if (is_def(opt_in.data)) com[opt_in.tag] = opt_in.data
    else if (is_def(opt_in.def)) com[opt_in.tag] = opt_in.def
    else com[opt_in.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function init (opt_in) {
    if (is_def(com.mainTag)) {
      console.error('trying to init more than once ...', opt_in)
      return
    }

    com.mainTag = opt_in.tag
    com.locker = opt_in.locker
    com.run_loop = opt_in.run_loop

    let lockerZoom = opt_in.lockerZoom
    if (!is_def(lockerZoom)) {
      lockerZoom = {
        all: com.mainTag + 'zoom',
        during: com.mainTag + 'zoomDuring',
        end: com.mainTag + 'zoomEnd'
      }
    }
    com.lockerZoom = lockerZoom

    let lockerV = {}
    lockerV.lockerV = is_def(opt_in.lockerV) ? opt_in.lockerV : []
    lockerV.zoomDuring = lockerV.lockerV.slice().concat([lockerZoom.during])
    lockerV.zoomEnd = lockerV.lockerV.slice().concat([lockerZoom.end])
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
    com.tel_ids = ['placeholder']

    com.click = is_def(opt_in.click) ? opt_in.click : null
    com.doText = is_def(opt_in.doText) ? opt_in.doText : true
    com.doPhase = is_def(opt_in.doPhase) ? opt_in.doPhase : true
    com.doRunRect = is_def(opt_in.doRunRect) ? opt_in.doRunRect : true
    com.doTimeRect = is_def(opt_in.doTimeRect) ? opt_in.doTimeRect : true

    com.tagClipPath = opt_in.tagClipPath
    if (!is_def(com.tagClipPath)) {
      com.tagClipPath = {
        inner: com.mainTag + 'clipPathInner',
        outer: com.mainTag + 'clipPathOuter'
      }
    }

    if (is_def(opt_in.futureCanceled)) com.futureCanceled = opt_in.futureCanceled
    else {
      com.futureCanceled = { hide: false, shiftY: true }
    }

    com.prevUpdate = null

    // ------------------------------------------------------------------
    // box definition
    // ------------------------------------------------------------------
    let gBox = opt_in.gBox
    com.outerBox = deep_copy(opt_in.boxData)
    com.outerG = gBox.append('g')
    com.scrollBoxG = com.outerG.append('g')

    com.scrollBox = new ScrollBox()
    com.scrollBox.init({
      tag: com.mainTag,
      gBox: com.scrollBoxG,
      boxData: com.outerBox,
      useRelativeCoords: false,
      title: opt_in.title,
      locker: opt_in.locker,
      lockerV: opt_in.lockerV,
      lockerZoom: opt_in.lockerZoom,
      run_loop: opt_in.run_loop
    })

    com.innerG = com.scrollBox.get('innerG')
    com.innerBox = com.scrollBox.get('innerBox')

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    setStyle(opt_in.style)

    update()
  }
  this.init = init

  // ------------------------------------------------------------------
  // styling
  // ------------------------------------------------------------------
  function setStyle (opt_in) {
    if (!is_def(opt_in)) opt_in = {}

    com.style = {}

    com.style.runRecCol = opt_in.runRecCol
    if (!is_def(com.style.runRecCol)) {
      com.style.runRecCol = cols_blues[2]
    }

    com.style.recCol = opt_in.recCol
    if (!is_def(com.style.recCol)) {
      com.style.recCol = function (opt_in) {
        // let cols_purples_blues = cols_mix;
        let n_obs = is_def(opt_in.n_obs) ? opt_in.n_obs : opt_in.d.n_block
        let state = is_def(opt_in.state)
          ? opt_in.state
          : opt_in.d.data.exe_state.state
        let can_run = is_def(opt_in.can_run)
          ? opt_in.can_run
          : opt_in.d.data.exe_state.can_run

        if (state === 'wait') return cols_yellows[2]
        else if (state === 'done') return cols_greens[4]
        else if (state === 'run') {
          return cols_purples_blues[n_obs % cols_purples_blues.length]
        } else if (state === 'cancel') {
          if (is_def(can_run)) {
            if (!can_run) return cols_yellows[1]
          }
          return cols_yellows[4]
        } else if (state === 'fail') return cols_reds[0]
        else return col_prime
      }
    }

    com.style.recFillOpac = opt_in.recFillOpac
    if (!is_def(com.style.recFillOpac)) {
      com.style.recFillOpac = function (d, state) {
        // return (d.data.exe_state.state == 'wait') ? 0.1 : ((d.data.exe_state.state == 'run') ? 0.4 : 0.2);
        return state === 'run' ? 0.4 : 0.15
      }
    }

    com.style.recStrokeOpac = opt_in.recStrokeOpac
    if (!is_def(com.style.recStrokeOpac)) {
      com.style.recStrokeOpac = function (d) {
        return 0.7
      }
    }

    com.style.textOpac = opt_in.textOpac
    if (!is_def(com.style.textOpac)) {
      com.style.textOpac = function (d) {
        return 1
      }
    }
  }
  this.setStyle = setStyle

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function filterBlocks (data_in) {
    if (!is_def(data_in)) data_in = {}
    $.each(['done', 'run', 'wait'], function (index, type_now) {
      if (!is_def(data_in[type_now])) data_in[type_now] = []
    })

    if (com.futureCanceled.hide) {
      $.each(data_in, function (type_now, blocksNow) {
        data_in[type_now] = blocksNow.filter(function (d) {
          return d.exe_state.can_run
        })
      })
    }

    // take care of future cancelled blocks - make sure they are in the correct phase
    // ------------------------------------------------------------------
    if (com.doPhase) {
      $.each(data_in.done, function (index, data_now) {
        if (data_now.startTime > com.time.now) {
          data_in.wait.push(data_now)
          data_in.done[index] = null
        }
      })

      data_in.done = data_in.done.filter(function (d) {
        return is_def(d)
      })
    }

    return data_in
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function update (data_in) {
    data_in = filterBlocks(data_in)

    com.blocksIn = data_in

    let this_update = { ids: [], props: {} }

    $.each(data_in, function (type_now, blocksNow) {
      $.each(blocksNow, function (i, d) {
        // the list of properties which will be monitored for change
        this_update.props[d.obs_block_id] = {
          startTime: Math.floor(d.startTime),
          endTime: Math.floor(d.endTime),
          type: type_now,
          can_run: d.exe_state.can_run,
          state: d.exe_state.state
        }

        this_update.ids.push(d.obs_block_id)
      })
    })

    let hasBlockUpdate = true
    if (is_def(com.prevUpdate)) {
      let hasSameIds = true
      let intersect = this_update.ids.filter(n => com.prevUpdate.ids.includes(n))
      if (intersect.length !== com.prevUpdate.ids.length) hasSameIds = false

      if (hasSameIds) {
        hasBlockUpdate = false
        $.each(this_update.props, function (obs_block_id_now, data_now) {
          if (!is_def(com.prevUpdate.props[obs_block_id_now])) {
            hasBlockUpdate = true
          }
          if (hasBlockUpdate) return

          $.each(data_now, function (prop_name, prop_value) {
            if (com.prevUpdate.props[obs_block_id_now][prop_name] !== prop_value) {
              hasBlockUpdate = true
            }
          })
        })
      }
    }

    com.prevUpdate = this_update

    // // ====================================================
    // // for debugging scroll
    // // ====================================================
    if (is_def(window.debugScroll)) {
      hasBlockUpdate = 1
    }
    // // ====================================================

    if (hasBlockUpdate) {
      get_blocks()
      setBlockRect()
      set_runRect()
    }
    setTimeRect()
  }
  this.update = update

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function get_blocks () {
    // // ------------------------------------------------------------------
    // // test edge cases:
    // // ------------------------------------------------------------------
    // com.blocksIn.doneNow = com.blocksIn.done
    // com.blocksIn.runNow  = com.blocksIn.run
    // com.blocksIn.waitNow = com.blocksIn.wait
    // // com.blocksIn.done  = com.blocksIn.doneNow.slice(0, 2);
    // // com.blocksIn.run   = []//com.blocksIn.doneNow.slice(2, 3);
    // com.blocksIn.wait  = com.blocksIn.waitNow.slice(0, 13);
    // // ------------------------------------------------------------------
    // com.blocksIn.done  = com.blocksIn.done.slice(0, 10);
    // com.blocksIn.run   = []//com.blocksIn.doneNow.slice(2, 3);
    // com.blocksIn.wait  = []//com.blocksIn.wait.slice(0, 7);
    // // ------------------------------------------------------------------
    let box = com.innerBox
    let runFrac = com.blocksIn.run.length === 0 ? 0 : 0.2
    let runMarg =
      com.blocksIn.run.length === 0 ? 0 : 2 * (box.x - com.outerBox.x)

    let maxDone = min_max_obj({
      minMax: 'max',
      data: com.blocksIn.done,
      func: 'endTime',
      default_val: 0
    })
    // let minRun = min_max_obj({
    //   minMax: 'min',
    //   data: com.blocksIn.run,
    //   func: 'startTime',
    //   default_val: 0
    // })
    // let maxRun = min_max_obj({
    //   minMax: 'max',
    //   data: com.blocksIn.run,
    //   func: 'endTime',
    //   default_val: 0
    // })
    let minWait = min_max_obj({
      minMax: 'min',
      data: com.blocksIn.wait,
      func: 'startTime',
      default_val: 0
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
    $.each(['done', 'run', 'wait'], function (index, type_now) {
      let data_in = com.blocksIn[type_now]

      if (!com.doPhase) {
        if (index > 0) return

        com.blockRow.run = []
        com.blockRow.wait = []

        data_in = []
          .concat(com.blocksIn.done)
          .concat(com.blocksIn.run)
          .concat(com.blocksIn.wait)
      }

      com.blockRow[type_now] = calcBlockRow({
        type_now: type_now,
        start: com.time.start,
        end: com.time.end,
        data: data_in
      })

      if (!com.doPhase) return
      if (com.blockRow[type_now].length === 0) return

      let xMin = min_max_obj({
        minMax: 'min',
        data: com.blockRow[type_now],
        func: 'x'
      })
      let xMax = min_max_obj({
        minMax: 'max',
        data: com.blockRow[type_now],
        func: function (d, i) {
          return d.x + d.w
        }
      })
      let scale = frac[type_now] / ((xMax - xMin) / box.w)

      let xShift = null
      let xShiftType = 0
      if (type_now === 'run') xShiftType = frac.done * box.w + runMarg
      if (type_now === 'wait') {
        xShiftType = (frac.done + frac.run) * box.w + 2 * runMarg
      }
      // if(type_now=='run')console.log('----',xMin,xMax,scale,xShiftType);

      $.each(com.blockRow[type_now], function (index, data_now) {
        data_now.x = (data_now.x - box.x) * scale + box.x
      })

      $.each(com.blockRow[type_now], function (index, data_now) {
        if (!is_def(xShift)) {
          let xMinNow = min_max_obj({
            minMax: 'min',
            data: com.blockRow[type_now],
            func: 'x'
          })
          xShift = box.x - xMinNow + xShiftType
          // xShift = box.x - com.blockRow[type_now][0].x + xShiftType;
        }

        data_now.x += xShift
        data_now.w = data_now.w * scale
      })
    })

    com.blocksAll = []
      .concat(com.blockRow.done)
      .concat(com.blockRow.run)
      .concat(com.blockRow.wait)

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let yMin = min_max_obj({
      minMax: 'min',
      data: com.blocksAll,
      func: 'y'
    })
    let yMax = min_max_obj({
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
  this.get_blocks = get_blocks

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function calcBlockRow (opt_in) {
    let data_in = opt_in.data
    let box = com.innerBox
    let xScale = box.w / (opt_in.end - opt_in.start)
    let yScale = box.h / com.tel_ids.length

    let blocks = []
    let n_blocksType = {}
    $.each(data_in, function (index, data_now) {
      let id = data_now.obs_block_id
      let state = data_now.exe_state.state
      let n_tels = data_now.tel_ids.length
      let start = data_now.startTime * xScale
      let end = data_now.endTime * xScale
      let overlap = data_now.duration * xScale * 0.2 // allow small overlap in x between blocks
      let x0 = box.x + start
      let w0 = end - start
      let h0 = n_tels * yScale
      let y0 = box.y

      if (
        !com.futureCanceled.hide &&
        com.futureCanceled.shiftY &&
        !data_now.exe_state.can_run
      ) {
        y0 += box.h + 2 * box.marg
      }

      // // ====================================================
      // // for debugging scroll
      // // ====================================================
      // if(!is_def(window.debugScroll)){window.debugScroll=0}if(index==0&&opt_in.data[0].exe_state.state=='wait'){debugScroll+=1;}if(debugScroll%3==0){w0=w0*3;}
      // w0 = w0*2
      // // ====================================================

      if (!is_def(n_blocksType[state])) n_blocksType[state] = 0
      else n_blocksType[state] += 1

      blocks.push({
        id: id,
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        o: overlap,
        n_block: n_blocksType[state],
        // nTel: n_tels,
        data: data_now
      })
    })

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let wMin = min_max_obj({ minMax: 'min', data: blocks, func: 'w' })
    let hMin = min_max_obj({ minMax: 'min', data: blocks, func: 'h' })
    if (!is_def(hMin) || !is_def(wMin)) return []

    let margX = wMin * 0.2
    let margY = blocks.length === 1 ? 0 : Math.min(hMin * 0.5, box.h * 0.05)
    $.each(blocks, function (index0, data_now0) {
      data_now0.x += margX / 2
      data_now0.w -= margX
      data_now0.h -= margY / 2

      // precaution against negative width values
      data_now0.w = Math.max(data_now0.w, box.marg / 10)
      data_now0.h = Math.max(data_now0.h, box.marg)
    })

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let sortedIds = []
    $.each(blocks, function (index0, data_now0) {
      // if(type_now=='run') return
      // if(sortedIds.indexOf(data_now0.id) >= 0) console.log('will skip sorted',index0,data_now0.data.metadata.block_name);
      if (sortedIds.indexOf(data_now0.id) >= 0) return
      sortedIds.push(data_now0.id)

      let x0 = data_now0.x
      let y0 = data_now0.y
      let w0 = data_now0.w
      let h0 = data_now0.h
      // let o0 = data_now0.o

      let telV = [].concat(data_now0.data.tel_ids)
      let minMax = { minX: x0, minY: y0, maxX: x0 + w0, maxY: y0 + h0 }

      let ovelaps = [{ index: index0, data: data_now0 }]

      for (let n_tries = 0; n_tries < 10; n_tries++) {
        let nOver = ovelaps.length

        $.each(blocks, function (index1, data_now1) {
          if (sortedIds.indexOf(data_now1.id) >= 0) return
          if (
            ovelaps
              .map(function (d) {
                return d.data.id
              })
              .indexOf(data_now1.id) >= 0
          ) {
            return
          }

          let x1 = data_now1.x
          let y1 = data_now1.y
          let w1 = data_now1.w
          let h1 = data_now1.h
          let o01 = Math.max(data_now0.o, data_now1.o)

          let hasOverlap =
            x1 < minMax.maxX - o01 &&
            x1 + w1 > minMax.minX + o01 &&
            y1 < minMax.maxY &&
            y1 + h1 > minMax.minY
          // if(x1 > minMax.maxX-o1 && x1 < minMax.maxX) console.log([index0,data_now0.data.metadata.block_name],[index1,data_now1.data.metadata.block_name]);

          // XXXXXXXXXXXXXXXXXX
          // let hasOverlap = (
          //   (x1 < minMax.maxX+margX/2) && (x1+w1 > minMax.minX) &&
          //   (y1 < minMax.maxY)         && (y1+h1 > minMax.minY)
          // );
          // XXXXXXXXXXXXXXXXXX

          if (hasOverlap) {
            let intersect = telV.filter(n => data_now1.data.tel_ids.includes(n))
            if (intersect.length === 0) {
              sortedIds.push(data_now1.id)
            }
            telV = telV.concat(data_now1.data.tel_ids)

            minMax = {
              minX: Math.min(minMax.minX, x1),
              minY: Math.min(minMax.minY, y1),
              maxX: Math.max(minMax.maxX, x1 + w1),
              maxY: Math.max(minMax.maxY, y1 + h1)
            }

            ovelaps.push({ index: index1, data: data_now1 })
          }
        })
        // console.log('xxxxxxxxxxxxxxx',n_tries,ovelaps,ovelaps.map(function(d){return d.data.data.metadata.block_name;}));
        if (nOver === ovelaps.length) break
      }

      if (ovelaps.length > 1) {
        let origIndices = ovelaps.map(function (d) {
          return d.index
        })

        ovelaps.sort(function (a, b) {
          let diffTime = a.data.data.startTime - b.data.data.startTime
          let diffTel = b.data.data.tel_ids.length - a.data.data.tel_ids.length
          return diffTel !== 0 ? diffTel : diffTime
        })

        // if(type_now=='run') console.log('will sort',ovelaps.map(function(d){return d.data.data.metadata.block_name;}));
        $.each(ovelaps, function (index1, data_now1) {
          // if(type_now=='run') console.log('-=-=-',index1,origIndices[index1], data_now1.index);
          let origIndex = origIndices[index1]
          // if(canSort) blocks[origIndex] = data_now1.data;
          blocks[origIndex] = data_now1.data
        })
      }
    })

    $.each(blocks, function (index0, data_now0) {
      let x0 = data_now0.x
      let y0 = data_now0.y
      let w0 = data_now0.w
      let h0 = data_now0.h

      // let telV = [].concat(data_now0.data.tel_ids)

      let isSkip = false
      $.each(blocks, function (index1, data_now1) {
        if (index0 >= index1 || isSkip) return

        let x1 = data_now1.x
        let y1 = data_now1.y
        let w1 = data_now1.w
        let h1 = data_now1.h

        // XXXXXXXXXXXXXXXXXX
        // let hasOverlap = ((x1 < x0+w0+margX/2) && (x1+w1 > x0) && (y1 < y0+h0) && (y1+h1 > y0));
        // XXXXXXXXXXXXXXXXXX
        let hasOverlap =
          x1 < x0 + w0 && x1 + w1 > x0 && y1 < y0 + h0 && y1 + h1 > y0
        if (hasOverlap) {
          data_now1.y = y0 + h0 + margY / 2
          // data_now1.y += h0 + margY/2;
        }
        // if(hasOverlap) console.log([index0,data_now0.data.metadata.block_name],[index1,data_now1.data.metadata.block_name],(h0 + margY/2));
      })
    })

    return blocks
  }
  this.calcBlockRow = calcBlockRow

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setBlockRect () {
    let box = com.innerBox
    let minTxtSize = box.w * 0.03
    let rect = com.innerG
      .selectAll('rect.' + com.mainTag + 'blocks')
      .data(com.blocksAll, function (d) {
        return d.id
      })

    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
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
    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
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
        return com.style.recFillOpac(d, d.data.exe_state.state)
      })
      .attr('stroke-width', 1)
      .style('stroke-opacity', com.style.recStrokeOpac)
      // .style("pointer-events", "none")
      .attr('vector-effect', 'non-scaling-stroke')
      .on('click', com.click)
      // .attr("clip-path", "url(#"+com.tagClipPath.inner+")")
      .merge(rect)
      .transition('inOut')
      .duration(times.anim_arc)
      .style('opacity', 1)
      .attr('stroke', function (d, i) {
        return d3.rgb(com.style.recCol({ d: d })).darker(1.0)
      })
      .style('fill', function (d, i) {
        return com.style.recCol({ d: d })
      })
      .style('fill-opacity', function (d) {
        return com.style.recFillOpac(d, d.data.exe_state.state)
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
      .duration(times.anim_arc / 2)
      .attr('width', 0)
      .style('opacity', 0)
      .remove()

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
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
        return d.data.metadata.block_name
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
        if (!is_def(d.size)) {
          console.error('_blockQueue_ERROR:', com.mainTag, minTxtSize, d.w, d.h)
        } // should not happen....
        if (!is_def(d.size)) d.size = 0
        // d.size = d.w/3;
        return d.size + 'px'
      })
      .attr('dy', function (d) {
        return d.size / 3 + 'px'
      })
      .transition('inOut')
      .duration(times.anim_arc)
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
      .duration(times.anim_arc)
      .style('opacity', 0)
      .remove()
  }
  this.setBlockRect = setBlockRect

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function set_runRect () {
    // let box = com.innerBox

    let recRunData = []
    if (com.blockRow.run.length > 0 && com.doPhase && com.doRunRect) {
      let xMin = min_max_obj({
        minMax: 'min',
        data: com.blockRow.run,
        func: 'x'
      })
      let xMax = min_max_obj({
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

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
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
      .duration(times.anim_arc)
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
      .duration(times.anim_arc / 2)
      .attr('x', function (d, i) {
        return d.x + d.w / 2
      })
      .attr('width', 0)
      .style('opacity', 0)
      .remove()
  }
  this.set_runRect = set_runRect

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setTimeRect () {
    let box = com.innerBox
    let time_frac = -1
    let rectNowData = []
    let refData = null

    if (com.doTimeRect) {
      if (com.blockRow.run.length > 0 && com.doPhase) {
        refData = com.blockRow.run

        let time_min = min_max_obj({
          minMax: 'min',
          data: com.blockRow.run,
          func: function (d, i) {
            return d.data.startTime
          }
        })
        let time_max = min_max_obj({
          minMax: 'max',
          data: com.blockRow.run,
          func: function (d, i) {
            return d.data.endTime
          }
        })

        time_frac = (com.time.now - time_min) / (time_max - time_min)
        // console.log('-----',time_min,time_max,time_frac);
      } else if (time_frac < 0 || time_frac > 1) {
        // refData = [].concat(com.blockRow.done).concat(com.blockRow.run).concat(com.blockRow.wait);

        time_frac = com.time.now - com.time.start
        time_frac /= com.time.end - com.time.start
      }
    }

    if (time_frac >= 0 && time_frac <= 1) {
      let xMin = box.x
      let xMax = box.x + box.w
      if (is_def(refData)) {
        xMin = min_max_obj({ minMax: 'min', data: refData, func: 'x' })
        xMax = min_max_obj({
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
          x: xMin + time_frac * (xMax - xMin) - com.outerBox.marg / 2,
          y: com.outerBox.y - com.outerBox.marg,
          w: com.outerBox.marg,
          h: com.outerBox.h + com.outerBox.marg * 2
        }
      ]
    }

    // console.log('time_frac',time_frac,rectNowData);
    // console.log('rectNowData',(com.blockRow.run.length > 0),com.time.now,time_frac,rectNowData[0]);

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
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
      .duration(times.anim_arc)
      .attr('x', function (d, i) {
        return d.x
      })
      // .attr("y", function(d,i) { return d.y; })
      .attr('width', function (d, i) {
        return d.w
      })
    // .attr("height", function(d,i) { return d.h; })

    // rectNow.exit()
    //   .transition("inOut").duration(times.anim_arc/2)
    //   .attr("width", 0)
    //   .style("opacity", 0)
    //   .remove()
  }
  this.setTimeRect = setTimeRect
}