/* global d3 */
/* global timeD */
/* global hasVar */
/* global deepCopy */
/* global colsBlues */

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.ScrollBox = function () {
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

  function initClipping (optIn) {
    com.tagClipPath = optIn.tagClipPath
    if (!hasVar(com.tagClipPath)) {
      com.tagClipPath = {
        inner: com.mainTag + 'clipPathInner',
        outer: com.mainTag + 'clipPathOuter'
      }
    }

    com.gBox = optIn.gBox
    com.outerBox = deepCopy(optIn.boxData)
    let defs = com.gBox.append('defs')
    let clipPathInner = defs
      .append('clipPath')
      .attr('id', com.tagClipPath.inner)
    com.clipRecInner = clipPathInner
      .append('rect')
      .attr('x', com.outerBox.x)
      .attr('y', com.outerBox.y)
      .attr('width', com.outerBox.w)
      .attr('height', com.outerBox.h)
    let clipPathOuter = defs
      .append('clipPath')
      .attr('id', com.tagClipPath.outer)
    com.clipRecOuter = clipPathOuter
      .append('rect')
      .attr('x', com.outerBox.x)
      .attr('y', com.outerBox.y)
      .attr('width', com.outerBox.w)
      .attr('height', com.outerBox.h)

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.outerG = com.gBox.append('g')

    com.outerG
      .selectAll('rect.' + com.mainTag + 'blockBoxOuter')
      .data([com.outerBox], function (d) {
        return d.id
      })
      .enter()
      .append('rect')
      .attr('class', com.mainTag + 'blockBoxOuter')
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
      .attr('stroke', '#383B42')
      .attr('stroke-width', '1')
      .attr('stroke-opacity', 0)
      .attr('fill', optIn.background ? optIn.background : '#F2F2F2')
      .attr('fill-opacity', 1)
      .style('pointer-events', 'none')

    com.scrollOuterG = com.gBox.append('g')

    com.scrollRecInner = com.scrollOuterG
      .selectAll('rect.' + com.mainTag + 'blockBoxInner')
      .data([com.outerBox], function (d) {
        return d.id
      })
      .enter()
      .append('rect')

    com.scrollRecInner
      .attr('class', com.mainTag + 'blockBoxInner')
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
      .attr('opacity', 0)

    com.innerG = com.scrollOuterG
      .append('g')
      .attr('class', 'clipping')
      .attr('clip-path', 'url(#' + com.tagClipPath.outer + ')')

    com.scrollBarVG = com.gBox.append('g')
    com.scrollBarHG = com.gBox.append('g')
  }
  function init (optIn) {
    if (hasVar(com.mainTag)) {
      console.error('trying to init more than once ...', optIn)
      return
    }

    com.mainTag = optIn.tag
    com.tagZoom = com.mainTag + 'zoom'
    com.tagDrag = com.mainTag + 'drag'
    com.tagScrollBar = com.mainTag + 'scrollBar'

    com.canScroll = hasVar(optIn.canScroll) ? optIn.canScroll : true
    com.useRelativeCoords = hasVar(optIn.useRelativeCoords)
      ? optIn.useRelativeCoords
      : false

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
    com.lockerV = lockerV

    com.sameInnerBoxMarg = hasVar(optIn.sameInnerBoxMarg)
      ? optIn.sameInnerBoxMarg
      : true

    com.zoomPause = 10
    com.isInDrag = false
    com.isInZoom = false
    com.inUserZoom = false
    com.prevUpdate = null

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------

    initClipping(optIn)
    initHorizontalScroll(optIn)
    initVerticalScroll(optIn)

    com.lockTitle = !hasVar(optIn.title)
    if (!com.lockTitle) {
      com.titleData = deepCopy(optIn.title)
      com.titleG = com.gBox.append('g')

      setTitle()

      com.outerBox.h -= com.titleData.h
      com.outerBox.y += com.titleData.h
    }

    // ---------------------------------------------------------------------------------------------------
    //  CREATE CLIP
    // ---------------------------------------------------------------------------------------------------

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.innerBox = {}
    setBox()
    setHorizontalScrollState()
    setVerticalScrollState()

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------

    setStyle(optIn.style)

    setupVerticalZoom()
    setupVerticalScrollBar()

    setupHorizontalZoom()
    setupHorizontalScrollBar()

    // update();
  }
  this.init = init

  // ---------------------------------------------------------------------------------------------------
  // styling
  // ---------------------------------------------------------------------------------------------------
  function setStyle (optIn) {
    if (!hasVar(optIn)) optIn = {}

    com.style = {}
  }
  this.setStyle = setStyle

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function posShift () {
    if (com.useRelativeCoords) {
      return [com.outerBox.x, com.outerBox.y]
    } else {
      return [0, 0]
    }
  }
  com.posShift = posShift

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setBox () {
    let boxMarg = com.outerBox.marg ? com.outerBox.marg : 0

    let scrollMargV = com.scrollRecV.w
    if (!com.sameInnerBoxMarg && !com.scrollTransV.active) scrollMargV = 0

    let scrollMargH = com.scrollRecH.w
    if (!com.sameInnerBoxMarg && !com.scrollTransH.active) scrollMargH = 0

    com.innerBox.x = com.outerBox.x + boxMarg
    com.innerBox.y = com.outerBox.y + boxMarg
    com.innerBox.w = com.outerBox.w - boxMarg * 2 //  - scrollMargV
    com.innerBox.h = com.outerBox.h - boxMarg * 2 //  - scrollMargH
    com.innerBox.marg = boxMarg
    com.innerBox.g = com.gBox

    let debugInnerBox = false
    if (debugInnerBox) {
      let rect = com.innerG.selectAll('rect.' + 'innerBoxOutline').data([{}])
      rect
        .enter()
        .append('rect')
        .attr('class', 'innerBoxOutline')
        .attr('fill', colsBlues[1])
        .attr('stroke', colsBlues[0])
        .attr('stroke-width', '1')
        .attr('stroke-opacity', 0.5)
        .attr('fill-opacity', 0.05)
        .style('pointer-events', 'none')
        .merge(rect)
        .attr('x', 0) // com.innerBox.marg)
        .attr('y', 0) // com.innerBox.marg)
        .attr('width', com.innerBox.w)
        .attr('height', com.innerBox.h)
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setTitle () {
    if (com.lockTitle) return
    if (!hasVar(com.titleData)) return

    if (!hasVar(com.titleData.id)) com.titleData.id = com.mainTag + 'title'
    if (!hasVar(com.titleData.h)) com.titleData.h = com.outerBox.w * 0.05
    if (!hasVar(com.titleData.marg)) com.titleData.marg = com.outerBox.marg
    if (!hasVar(com.titleData.size)) com.titleData.size = com.titleData.h * 0.5
    if (!hasVar(com.titleData.x)) {
      com.titleData.x = com.outerBox.x + com.titleData.marg
    }
    if (!hasVar(com.titleData.y)) com.titleData.y = com.outerBox.y
    if (!hasVar(com.titleData.weight)) com.titleData.weight = 'bold'

    let tagTitle = com.titleData.id
    let text = com.titleG
      .selectAll('text.' + tagTitle)
      .data([com.titleData], function (d) {
        return d.id
      })

    text
      .enter()
      .append('text')
      .attr('class', tagTitle)
      .style('font-weight', 'normal')
      .style('opacity', 0)
      .style('stroke-width', 0)
      .style('fill', '#383b42')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('text-anchor', 'left')
      .style('font-weight', com.titleData.weight)
      .attr('x', function (d) {
        return d.x + d.marg
      })
      .attr('y', function (d) {
        return d.y + d.h / 2
      })
      .style('font-size', function (d) {
        return d.size + 'px'
      })
      .attr('dy', function (d) {
        return d.size / 3 + 'px'
      })
      .merge(text)
      .transition('inOut')
      .duration(timeD.animTxt)
      .attr('x', function (d) {
        return d.x + d.marg
      })
      .attr('y', function (d) {
        return d.y + d.h / 2
      })
      .style('font-size', function (d) {
        return d.size + 'px'
      })
      .attr('dy', function (d) {
        return d.size / 3 + 'px'
      })
      .text(function (d) {
        return d.text
      })
      .style('opacity', 1)

    text
      .exit()
      .transition('inOut')
      .duration(timeD.animTxt)
      .style('opacity', 0)
      .remove()
  }
  this.setTitle = setTitle

  function initVerticalScroll (optIn) {
    com.scrollVertical = hasVar(optIn.scrollVertical) ? optIn.scrollVertical : true
    com.scrollHeight = hasVar(optIn.scrollHeight) ? optIn.scrollHeight : 0
    com.scrollTransV = {
      now: 0,
      min: 0,
      max: 0,
      frac: 0,
      active: false,
      drag: { y: 0, frac: 0 }
    }
    com.scrollBarRecV = null

    com.scrollRecV = hasVar(optIn.scrollRecV) ? optIn.scrollRecV : {}
    if (!hasVar(com.scrollRecV.w)) com.scrollRecV.w = com.outerBox.w * 0.015
    if (!hasVar(com.scrollRecV.h)) com.scrollRecV.h = com.outerBox.h * 0.015
    if (!hasVar(com.scrollRecV.marg)) com.scrollRecV.marg = 0.6
    if (!hasVar(com.scrollRecV.fontSize)) {
      com.scrollRecV.fontSize = com.scrollRecV.w
    }
    com.scrollRecV.x = com.outerBox.x + com.outerBox.w - com.scrollRecV.w
  }
  function setupVerticalZoom () {
    let zoomLen = [-1, 1e20, 1e4]
    // let deltaWH       = com.innerBox.h * 0.1;

    let tagZoom = com.tagZoom + 'Vertical'
    let tagDrag = com.tagDrag + 'Vertical'
    let locker = com.locker
    let lockerV = com.lockerV
    let lockerZoom = com.lockerZoom

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com[tagZoom + 'zoomStart'] = function () {
      com.isInZoom = true
    }

    com[tagZoom + 'zoomDuring'] = function () {
      if (!com.scrollTransV.active) return

      com.inUserZoom = hasVar(d3.event.sourceEvent)

      if (locker.isFreeV(lockerV.zoomDuring)) {
        locker.add({ id: lockerZoom.all, override: true })
        locker.add({ id: lockerZoom.during, override: true })

        let trans = null
        if (com.inUserZoom) {
          let wdX = d3.event.sourceEvent.deltaX * 0.4
          let wdY = d3.event.sourceEvent.deltaY * 0.4
          let wdXY = Math.abs(wdX) > Math.abs(wdY) ? -1 * wdX : wdY

          // trans = hasVar(wdXY) ? (((wdXY < 0)?1:-1) * deltaWH) : 0;
          trans = hasVar(wdXY) ? -1 * wdXY : 0
        }

        let delay = doTrans({ trans: trans, duration: 0 })

        locker.remove({ id: lockerZoom.during, delay: delay })
      }
    }

    com[tagZoom + 'zoomEnd'] = function () {
      com.isInZoom = false
      locker.remove({ id: lockerZoom.all, override: true })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com[tagDrag + 'dragStart'] = function () {
      if (!com.scrollTransV.active) return

      com.isInDrag = true

      // if(d3.event.x >= com.scrollRec.x) {
      //   let frac = (d3.event.y - com.innerBox.y) / (com.innerBox.h);
      //   frac = Math.min(1, Math.max(0, frac));
      //   let trans = (-1 * frac * (com.scrollTransV.max - com.scrollTransV.min)) - com.scrollTransV.now;

      //   com.doTrans({trans:trans}); //, duration:timeD.animArc/.2
      // }

      com.scrollTransV.drag.y = hasVar(d3.event) ? d3.event.y : com.innerBox.y
      com.scrollTransV.drag.frac = com.scrollTransV.frac

      locker.add({ id: lockerZoom.all, override: true })
    }

    com[tagDrag + 'dragDuring'] = function () {
      if (!com.scrollTransV.active) return
      if (!hasVar(d3.event)) return
      if (!hasVar(d3.event.dy)) return

      if (locker.isFreeV(lockerV.zoomDuring)) {
        locker.add({ id: lockerZoom.all, override: true })
        locker.add({ id: lockerZoom.during, override: true })

        let trans = -1 * d3.event.dy
        // let frac  = (d3.event.y - com.innerBox.y)/com.innerBox.h;
        let frac =
          com.scrollTransV.drag.frac +
          (d3.event.y - com.scrollTransV.drag.y) / com.innerBox.h
        let delay =
          Math.abs(trans) > 0 ? doTrans({ frac: frac, duration: 0 }) : 0

        locker.remove({ id: lockerZoom.during, delay: delay })
      }
    }

    com[tagDrag + 'dragEnd'] = function () {
      com.isInDrag = false
      locker.remove({ id: lockerZoom.all, override: true })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function doTrans (optIn) {
      let trans = optIn.trans
      let frac = optIn.frac
      let duration = hasVar(optIn.duration) ? optIn.duration : timeD.animArc
      duration = duration === 0 ? timeD.animArc : duration
      let isMoved = false
      let delay = 0

      if (hasVar(trans)) {
        let now = com.scrollTransV.now
        if (now >= com.scrollTransV.max && trans > 0) trans = null
        else if (now <= com.scrollTransV.min && trans < 0) trans = null
        else {
          now += trans
          com.scrollTransV.now = Math.max(
            com.scrollTransV.min,
            Math.min(com.scrollTransV.max, now)
          )
          com.scrollTransV.frac = Math.abs(
            com.scrollTransV.now / (com.scrollTransV.max - com.scrollTransV.min)
          )
        }
        isMoved = hasVar(trans)
      } else if (hasVar(frac)) {
        com.scrollTransV.frac = Math.max(0, Math.min(1, frac))
        com.scrollTransV.now =
          com.scrollTransV.max +
          com.scrollTransV.frac * (com.scrollTransV.min - com.scrollTransV.max)
        isMoved = true
      }

      if (isMoved) {
        delay = com.zoomPause

        if (duration > 0) {
          com.innerG
            .transition('move')
            .duration(duration)
            .ease(d3.easeLinear)
            .attr('transform', function (d, i) {
              let shift = posShift()
              return (
                'translate(' +
                shift[0] +
                ',' +
                (com.scrollTransV.now + shift[1]) +
                ')'
              )
            })
          com.clipRecInner
            .transition('move')
            .duration(duration)
            .ease(d3.easeLinear)
            .attr('transform', function (d, i) {
              return 'translate(0,' + -com.scrollTransV.now + ')'
            })
          com.clipRecOuter
            .transition('move')
            .duration(duration)
            .ease(d3.easeLinear)
            .attr('transform', function (d, i) {
              let shift = posShift()
              return (
                'translate(' +
                -shift[0] +
                ',' +
                (-shift[1] - com.scrollTransV.now) +
                ')'
              )
            })
        } else {
          com.innerG.attr('transform', function (d, i) {
            let shift = posShift()
            return (
              'translate(' +
              shift[0] +
              ',' +
              (com.scrollTransV.now + shift[1]) +
              ')'
            )
          })
          com.clipRecInner.attr('transform', function (d, i) {
            return 'translate(0,' + -com.scrollTransV.now + ')'
          })
          com.clipRecOuter.attr('transform', function (d, i) {
            let shift = posShift()
            return (
              'translate(' +
              -shift[0] +
              ',' +
              (-shift[1] - com.scrollTransV.now) +
              ')'
            )
          })
        }
        com.zoomVerticalScrollBarUpdate()
      }

      return delay
    }
    com.doVerticalTrans = doTrans

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com[tagZoom] = d3.zoom().scaleExtent([zoomLen['0'], zoomLen['1']])
    com[tagZoom]
      .on('start', com[tagZoom + 'zoomStart'])
      .on('zoom', com[tagZoom + 'zoomDuring'])
      .on('end', com[tagZoom + 'zoomEnd'])

    // needed for auotomatic zoom
    com[tagZoom + 'zoomNode'] = com.innerBox.g.nodes()[0]
    com[tagZoom + 'zoomed'] = com.innerBox.g.append('g')

    com[tagDrag] = d3
      .drag()
      .on('start', com[tagDrag + 'dragStart'])
      .on('drag', com[tagDrag + 'dragDuring'])
      .on('end', com[tagDrag + 'dragEnd'])
    // .on("start", function(d) { com[tagDrag+"dragStart"](); })
    // .on("drag",  function(d) { let coords = d3.mouse(this); com[tagDrag+"_dragDuring"](coords); })
    // .on("end",   function(d) { com[tagDrag+"dragEnd"](); })

    com.scrollOuterG.call(com[tagDrag])
    com.scrollBarVG.call(com[tagDrag])

    setVerticalZoomStatus()
  }
  function setVerticalZoomStatus () {
    if (com.scrollTransV.active) {
      com.innerBox.g.call(com[com.tagZoom + 'Vertical']).on('dblclick.zoom', null)
    } else com.innerBox.g.on('.zoom', null)
  }
  function setupVerticalScrollBar () {
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function zoomVerticalScrollBarInit () {
      if (!com.locker.isFree(com.mainTag + 'zoomVerticalScrollBarInit')) return

      com.locker.add({
        id: com.mainTag + 'zoomVerticalScrollBarInit',
        override: true
      })
      com.scrollBarRecV = null

      let nDone = 0
      let box = com.outerBox
      let dataBck = com.scrollTransV.active ? [{ id: 'zoomScrollBarBck' }] : []
      let recBck = com.scrollBarVG
        .selectAll('rect.' + com.tagScrollBar + 'bck')
        .data(dataBck, function (d) {
          return d.id
        })

      // ---------------------------------------------------------------------------------------------------
      recBck
        .enter()
        .append('rect')
        .attr('class', com.tagScrollBar + 'bck')
        .attr('stroke', '#383B42')
        .attr('stroke-width', '0.5')
        .style('stroke-opacity', '0.5')
        .style('fill', '#383B42')
        .style('fill-opacity', '0.05')
        // .attr("stroke","#383B42").attr("stroke-width","0.5").style("stroke-opacity","0.5").style("fill", "#383B42").style("fill-opacity","0.8")
        .attr('x', box.x + box.w)
        .attr('y', box.y)
        .attr('width', 0)
        .attr('height', box.h)
        // click also does dragStart, but we need it for the smooth transition
        .on('click', function (d) {
          recVerticalBckClickOnce({ coords: d3.mouse(this) })
        })
        .style('opacity', 1)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('x', com.scrollRecV.x)
        .attr('width', com.scrollRecV.w)
        .on('end', function (d) {
          nDone += 1
        })

      recBck
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('x', box.x + box.w)
        .attr('width', 0)
        .remove()
        .on('end', function (d) {
          nDone += 1
        })

      // ---------------------------------------------------------------------------------------------------
      setVerticalRecScroll()

      //
      // ---------------------------------------------------------------------------------------------------
      let nTries = 0
      let maxTries = 500
      function scrollBarRecSet () {
        setTimeout(function () {
          // console.log('ndone/nTries: ',nDone,nTries);

          if (nDone < 1 && nTries < maxTries) {
            scrollBarRecSet()
          } else {
            if (nTries >= maxTries) {
              console.error('cant seem to init zoomScrollBar ...')
            }

            com.scrollBarRecV = com.scrollBarVG.selectAll(
              'rect.' + com.tagScrollBar + 'scroll'
            )
            com.locker.remove({ id: com.mainTag + 'zoomVerticalScrollBarInit' })
          }
          nTries += 1
        }, timeD.animArc / 5)
      }

      if (com.scrollTransV.active) {
        scrollBarRecSet()
      } else {
        com.locker.remove({ id: com.mainTag + 'zoomVerticalScrollBarInit' })
      }
    }
    com.zoomVerticalScrollBarInit = zoomVerticalScrollBarInit

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setVerticalRecScroll () {
      let box = com.outerBox
      let marg = com.scrollRecV.w * com.scrollRecV.marg / 2

      let dataScroll = com.scrollTransV.active
        ? [{ id: 'zoomScrollBarScroll' }]
        : []
      let recScroll = com.scrollBarVG
        .selectAll('rect.' + com.tagScrollBar + 'scroll')
        .data(dataScroll, function (d) {
          return d.id
        })

      recScroll
        .enter()
        .append('rect')
        .attr('class', com.tagScrollBar + 'scroll')
        .attr('stroke', '#383B42')
        .attr('stroke-width', '1')
        .style('stroke-opacity', '0.5')
        .style('fill', '#383B42')
        .style('fill-opacity', '0.9')
        .style('pointer-events', 'none')
        .attr('x', box.x + box.w)
        .attr('y', box.y + marg)
        .attr('width', 0)
        .attr('height', com.scrollRecV.h - marg * 2)
        .attr('transform', zoomVerticalScrollBarTrans)
        .merge(recScroll)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('transform', zoomVerticalScrollBarTrans)
        .attr('x', box.x + box.w - com.scrollRecV.w + marg)
        .attr('y', box.y + marg)
        .attr('width', com.scrollRecV.w - marg * 2)
        .attr('height', com.scrollRecV.h - marg * 2)

      recScroll
        .exit()
        .transition('inOut')
        .duration(timeD.animArc * 3 / 4)
        .attr('x', box.x + box.w)
        .attr('y', box.y + marg)
        .attr('width', 0)
        .remove()
    }
    com.setVerticalRecScroll = setVerticalRecScroll

    // ---------------------------------------------------------------------------------------------------
    // instant transition in case of dragging
    // ---------------------------------------------------------------------------------------------------
    function zoomVerticalScrollBarUpdate () {
      if (!hasVar(com.scrollBarRecV)) return

      if (com.isInDrag || com.inUserZoom) {
        com.scrollBarRecV.attr('transform', zoomVerticalScrollBarTrans)
      } else {
        com.scrollBarRecV
          .transition('move')
          .duration(timeD.animArc / 4)
          .attr('transform', zoomVerticalScrollBarTrans)
      }
    }
    com.zoomVerticalScrollBarUpdate = zoomVerticalScrollBarUpdate

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function zoomVerticalScrollBarTrans () {
      // let pos = com.scrollTrans.frac * (com.outerBox.h - com.scrollRec.w*2);
      // return "translate("+(com.outerBox.x)+","+(com.outerBox.y + pos)+")";
      let pos = com.scrollTransV.frac * (com.outerBox.h - com.scrollRecV.h)
      return 'translate(0,' + pos + ')'
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.runLoop.init({
      tag: com.mainTag + 'recVerticalBckClick',
      func: recVerticalBckClickOnce,
      nKeep: 1
    })

    function recVerticalBckClick (dataIn) {
      com.runLoop.push({ tag: com.mainTag + 'recVerticalBckClick', data: dataIn })
    }
    com.recVerticalBckClick = recVerticalBckClick

    let nClickTries = 0
    function recVerticalBckClickOnce (dataIn) {
      if (
        com.isInZoom ||
        com.isInDrag ||
        (com.scrollTransV.active && !hasVar(com.scrollBarRecV))
      ) {
        // console.log('delay recVerticalBckClickOnce',[com.isInZoom,com.isInDrag],[com.scrollTrans.active,hasVar(com.scrollBarRec)]);
        if (nClickTries < 100) {
          setTimeout(function () {
            nClickTries += 1
            recVerticalBckClick(dataIn)
          }, timeD.animArc / 2)
        } else console.error('cant do recVerticalBckClick ...', dataIn)
        return
      }
      nClickTries = 0

      let frac = dataIn.frac
      if (!hasVar(frac) && hasVar(dataIn.coords)) {
        frac = (dataIn.coords[1] - com.outerBox.y) / com.outerBox.h
      }

      if (hasVar(frac)) {
        frac = Math.min(1, Math.max(0, frac))
        let trans =
          -1 * frac * (com.scrollTrans.max - com.scrollTrans.min) -
          com.scrollTrans.now

        com.doTrans({ trans: trans })
      }
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    if (com.scrollTransV.active) zoomVerticalScrollBarInit()

    resetVerticalScroller({ duration: 0 })
  }
  function resetVerticalScroller (optIn) {
    if (!hasVar(optIn)) optIn = {}
    let duration = hasVar(optIn.duration) ? optIn.duration : timeD.animArc / 2

    if (hasVar(optIn.canScroll)) com.canScroll = optIn.canScroll
    if (hasVar(optIn.scrollVertical)) com.scrollVertical = optIn.scrollVertical
    if (hasVar(optIn.scrollHeight)) com.scrollHeight = optIn.scrollHeight

    let prevActive = com.scrollTransV.active
    setVerticalScrollState()

    if (prevActive !== com.scrollTransV.active) {
      setBox()
    }

    com.innerG
      .transition('move')
      .duration(duration)
      .attr('transform', function (d, i) {
        let shift = posShift()
        return 'translate(' + shift[0] + ',' + shift[1] + ')'
      })

    com.clipRecInner
      .transition('move')
      .duration(duration)
      .attr('transform', 'translate(0,0)')

    com.clipRecOuter
      .transition('move')
      .duration(duration)
      .attr('transform', function (d, i) {
        let shift = posShift()
        return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
      })

    if (prevActive !== com.scrollTransV.active) {
      setVerticalZoomStatus()
      com.zoomVerticalScrollBarInit()
    } else if (com.scrollTransV.active) {
      com.setVerticalRecScroll()
    }
  }
  this.resetVerticalScroller = resetVerticalScroller
  function setVerticalScrollState () {
    let boxH = com.innerBox.h // com.outerBox.h - com.outerBox.marg * 2;

    if (com.canScroll && com.scrollVertical) {
      com.scrollTransV.active = Math.abs(com.scrollHeight) > boxH
    }

    com.scrollTransV.min = hasVar(com.scrollHeight)
      ? -1 * Math.abs(com.scrollHeight - boxH)
      : 0
    com.scrollTransV.max = 0
    com.scrollTransV.frac = 0
    com.scrollTransV.now = com.scrollTransV.max
    com.scrollRecV.h = boxH * boxH / Math.abs(com.scrollHeight)
  }
  function updateVerticalScrollState (keepFrac) {
    let boxH = com.innerBox.h // com.outerBox.h - com.outerBox.marg * 2;
    if (com.canScroll && com.scrollVertical) {
      com.scrollTransV.active = Math.abs(com.scrollHeight) > boxH
    }

    com.scrollTransV.min = hasVar(com.scrollHeight)
      ? -1 * Math.abs(com.scrollHeight - boxH)
      : 0
    com.scrollTransV.max = 0
    if (!keepFrac) com.scrollTransV.frac = 0
    if (com.scrollTransV.now < com.scrollTransV.min) com.scrollTransV.now = com.scrollTransV.min
    else if (com.scrollTransV.now > com.scrollTransV.max) com.scrollTransV.now = com.scrollTransV.max
    com.scrollRecV.h = boxH * boxH / Math.abs(com.scrollHeight)
  } // NO

  function initHorizontalScroll (optIn) {
    com.scrollHorizontal = hasVar(optIn.scrollHorizontal) ? optIn.scrollHorizontal : true
    com.scrollWidth = hasVar(optIn.scrollWidth) ? optIn.scrollWidth : 0
    com.scrollTransH = {
      now: 0,
      min: 0,
      max: 0,
      frac: 0,
      active: false,
      drag: { y: 0, frac: 0 }
    }
    com.scrollBarRecH = null

    com.scrollRecH = hasVar(optIn.scrollRecH) ? optIn.scrollRecH : {}
    if (!hasVar(com.scrollRecH.w)) com.scrollRecH.w = com.outerBox.w * 0.015
    if (!hasVar(com.scrollRecH.h)) com.scrollRecH.h = com.outerBox.h * 0.015
    if (!hasVar(com.scrollRecH.marg)) com.scrollRecH.marg = 0.6
    if (!hasVar(com.scrollRecH.fontSize)) {
      com.scrollRecH.fontSize = com.scrollRecH.w
    }
    com.scrollRecH.y = com.outerBox.y + com.outerBox.h - com.scrollRecH.h
  }
  function setupHorizontalZoom () {
    let zoomLen = [-1, 1e20, 1e4]
    // let deltaWH       = com.innerBox.h * 0.1;

    let tagZoom = com.tagZoom + 'Horizontal'
    let tagDrag = com.tagDrag + 'Horizontal'
    let locker = com.locker
    let lockerV = com.lockerV
    let lockerZoom = com.lockerZoom

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com[tagZoom + 'zoomStart'] = function () {
      com.isInZoom = true
    }
    com[tagZoom + 'zoomDuring'] = function () {
      if (!com.scrollTransH.active) return

      com.inUserZoom = hasVar(d3.event.sourceEvent)

      if (locker.isFreeV(lockerV.zoomDuring)) {
        locker.add({ id: lockerZoom.all, override: true })
        locker.add({ id: lockerZoom.during, override: true })

        let trans = null
        if (com.inUserZoom) {
          let wdX = d3.event.sourceEvent.deltaX
          let wdY = d3.event.sourceEvent.deltaY
          let wdXY = Math.abs(wdX) > Math.abs(wdY) ? -1 * wdX : wdY

          // trans = hasVar(wdXY) ? (((wdXY < 0)?1:-1) * deltaWH) : 0;
          trans = hasVar(wdXY) ? -1 * wdXY : 0
        }
        let delay = doTrans({ trans: trans, duration: 0 })

        locker.remove({ id: lockerZoom.during, delay: delay })
      }
    }
    com[tagZoom + 'zoomEnd'] = function () {
      com.isInZoom = false
      locker.remove({ id: lockerZoom.all, override: true })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com[tagDrag + 'dragStart'] = function () {
      if (!com.scrollTransH.active) return

      com.isInDrag = true

      // if(d3.event.x >= com.scrollRec.x) {
      //   let frac = (d3.event.y - com.innerBox.y) / (com.innerBox.h);
      //   frac = Math.min(1, Math.max(0, frac));
      //   let trans = (-1 * frac * (com.scrollTransV.max - com.scrollTransV.min)) - com.scrollTransV.now;

      //   com.doTrans({trans:trans}); //, duration:timeD.animArc/.2
      // }

      com.scrollTransH.drag.x = hasVar(d3.event) ? d3.event.x : com.innerBox.x
      com.scrollTransH.drag.frac = com.scrollTransH.frac

      locker.add({ id: lockerZoom.all, override: true })
    }
    com[tagDrag + 'dragDuring'] = function () {
      if (!com.scrollTransH.active) return
      if (!hasVar(d3.event)) return
      if (!hasVar(d3.event.dy)) return

      if (locker.isFreeV(lockerV.zoomDuring)) {
        locker.add({ id: lockerZoom.all, override: true })
        locker.add({ id: lockerZoom.during, override: true })

        let trans = -1 * d3.event.dx
        // let frac  = (d3.event.y - com.innerBox.y)/com.innerBox.h;
        let frac =
          com.scrollTransH.drag.frac +
          (d3.event.x - com.scrollTransH.drag.x) / com.innerBox.w
        let delay =
          Math.abs(trans) > 0 ? doTrans({ frac: frac, duration: 0 }) : 0

        locker.remove({ id: lockerZoom.during, delay: delay })
      }
    }
    com[tagDrag + 'dragEnd'] = function () {
      com.isInDrag = false
      locker.remove({ id: lockerZoom.all, override: true })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function doTrans (optIn) {
      let trans = optIn.trans
      let frac = optIn.frac
      let duration = hasVar(optIn.duration) ? optIn.duration : timeD.animArc
      let isMoved = false
      let delay = 0

      if (hasVar(trans)) {
        let now = com.scrollTransH.now
        if (now >= com.scrollTransH.max && trans > 0) trans = null
        else if (now <= com.scrollTransH.min && trans < 0) trans = null
        else {
          now += trans
          com.scrollTransH.now = Math.max(
            com.scrollTransH.min,
            Math.min(com.scrollTransH.max, now)
          )
          com.scrollTransH.frac = Math.abs(
            com.scrollTransH.now / (com.scrollTransH.max - com.scrollTransH.min)
          )
        }
        isMoved = hasVar(trans)
      } else if (hasVar(frac)) {
        com.scrollTransH.frac = Math.max(0, Math.min(1, frac))
        com.scrollTransH.now =
          com.scrollTransH.max +
          com.scrollTransH.frac * (com.scrollTransH.min - com.scrollTransH.max)
        isMoved = true
      }

      if (isMoved) {
        delay = com.zoomPause

        if (duration > 0) {
          com.innerG
            .transition('move')
            .duration(duration)
            .attr('transform', function (d, i) {
              let shift = posShift()
              return (
                'translate(' +
                (com.scrollTransH.now + shift[0]) +
                ',' +
                shift[1] +
                ')'
              )
            })
          com.clipRecInner
            .transition('move')
            .duration(duration)
            .attr('transform', function (d, i) {
              return 'translate(' + -com.scrollTransH.now + ',0)'
            })
          com.clipRecOuter
            .transition('move')
            .duration(duration)
            .attr('transform', function (d, i) {
              let shift = posShift()
              return (
                'translate(' +
                (-shift[0] - com.scrollTransH.now) +
                ',' +
                -shift[1] +
                ')'
              )
            })
        } else {
          com.innerG.attr('transform', function (d, i) {
            let shift = posShift()
            return (
              'translate(' +
              (com.scrollTransH.now + shift[0]) +
              ',' +
              shift[1] +
              ')'
            )
          })
          com.clipRecInner.attr('transform', function (d, i) {
            return 'translate(' + -com.scrollTransH.now + ',0)'
          })
          com.clipRecOuter.attr('transform', function (d, i) {
            let shift = posShift()
            return (
              'translate(' +
              (-shift[0] - com.scrollTransH.now) +
              ',' +
              -shift[1] +
              ')'
            )
          })
        }
        com.zoomHorizontalScrollBarUpdate()
      }

      return delay
    }
    com.doHorizontalTrans = doTrans

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com[tagZoom] = d3.zoom().scaleExtent([zoomLen['0'], zoomLen['1']])
    com[tagZoom]
      .on('start', com[tagZoom + 'zoomStart'])
      .on('zoom', com[tagZoom + 'zoomDuring'])
      .on('end', com[tagZoom + 'zoomEnd'])

    // needed for auotomatic zoom
    com[tagZoom + 'zoomNode'] = com.innerBox.g.nodes()[0]
    com[tagZoom + 'zoomed'] = com.innerBox.g.append('g')

    com[tagDrag] = d3
      .drag()
      .on('start', com[tagDrag + 'dragStart'])
      .on('drag', com[tagDrag + 'dragDuring'])
      .on('end', com[tagDrag + 'dragEnd'])
    // .on("start", function(d) { com[tagDrag+"dragStart"](); })
    // .on("drag",  function(d) { let coords = d3.mouse(this); com[tagDrag+"_dragDuring"](coords); })
    // .on("end",   function(d) { com[tagDrag+"dragEnd"](); })

    com.scrollOuterG.call(com[tagDrag])
    com.scrollBarHG.call(com[tagDrag])

    setHorizontalZoomStatus()
  }
  function setHorizontalZoomStatus () {
    if (com.scrollTransV.active) return
    if (com.scrollTransH.active) {
      com.innerBox.g.call(com[com.tagZoom + 'Horizontal']).on('dblclick.zoom', null)
    } else com.innerBox.g.on('.zoom', null)
  } // NO
  function setupHorizontalScrollBar () {
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function zoomHorizontalScrollBarInit () {
      if (!com.locker.isFree(com.mainTag + 'zoomHorizontalScrollBarInit')) return

      com.locker.add({
        id: com.mainTag + 'zoomHorizontalScrollBarInit',
        override: true
      })
      com.scrollBarRecH = null

      let nDone = 0
      let box = com.outerBox
      let dataBck = com.scrollTransH.active ? [{ id: 'zoomScrollBarBck' }] : []
      let recBck = com.scrollBarHG
        .selectAll('rect.' + com.tagScrollBar + 'bck')
        .data(dataBck, function (d) {
          return d.id
        })

      // ---------------------------------------------------------------------------------------------------
      recBck
        .enter()
        .append('rect')
        .attr('class', com.tagScrollBar + 'bck')
        .attr('stroke', '#383B42')
        .attr('stroke-width', '0.5')
        .style('stroke-opacity', '0.5')
        .style('fill', '#383B42')
        .style('fill-opacity', '0.05')
        // .attr("stroke","#383B42").attr("stroke-width","0.5").style("stroke-opacity","0.5").style("fill", "#383B42").style("fill-opacity","0.8")
        .attr('x', box.x)
        .attr('y', box.y + box.h)
        .attr('width', box.w)
        .attr('height', 0)
        // click also does dragStart, but we need it for the smooth transition
        .on('click', function (d) {
          recHorizontalBckClickOnce({ coords: d3.mouse(this) })
        })
        .style('opacity', 1)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('y', com.scrollRecH.y)
        .attr('height', com.scrollRecH.h)
        .on('end', function (d) {
          nDone += 1
        })

      recBck
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('y', box.y + box.h)
        .attr('height', 0)
        .remove()
        .on('end', function (d) {
          nDone += 1
        })

      // ---------------------------------------------------------------------------------------------------
      setHorizontalRecScroll()

      //
      // ---------------------------------------------------------------------------------------------------
      let nTries = 0
      let maxTries = 500
      function scrollBarRecSet () {
        setTimeout(function () {
          // console.log('ndone/nTries: ',nDone,nTries);

          if (nDone < 1 && nTries < maxTries) {
            scrollBarRecSet()
          } else {
            if (nTries >= maxTries) {
              console.error('cant seem to init zoomScrollBar ...')
            }

            com.scrollBarRecH = com.scrollBarHG.selectAll(
              'rect.' + com.tagScrollBar + 'scroll'
            )
            com.locker.remove({ id: com.mainTag + 'zoomHorizontalScrollBarInit' })
          }
          nTries += 1
        }, timeD.animArc / 5)
      }

      if (com.scrollTransH.active) {
        scrollBarRecSet()
      } else {
        com.locker.remove({ id: com.mainTag + 'zoomHorizontalScrollBarInit' })
      }
    }
    com.zoomHorizontalScrollBarInit = zoomHorizontalScrollBarInit

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setHorizontalRecScroll () {
      let box = com.outerBox
      let marg = com.scrollRecH.h * com.scrollRecH.marg / 2

      let dataScroll = com.scrollTransH.active
        ? [{ id: 'zoomScrollBarScroll' }]
        : []
      let recScroll = com.scrollBarHG
        .selectAll('rect.' + com.tagScrollBar + 'scroll')
        .data(dataScroll, function (d) {
          return d.id
        })

      recScroll
        .enter()
        .append('rect')
        .attr('class', com.tagScrollBar + 'scroll')
        .attr('stroke', '#383B42')
        .attr('stroke-width', '1')
        .style('stroke-opacity', '0.5')
        .style('fill', '#383B42')
        .style('fill-opacity', '0.9')
        .style('pointer-events', 'none')
        .attr('y', box.y + box.h)
        .attr('x', box.x + marg)
        .attr('width', com.scrollRecH.w)
        .attr('height', 0)
        .attr('transform', zoomHorizontalScrollBarTrans)
        .merge(recScroll)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('transform', zoomHorizontalScrollBarTrans)
        .attr('y', box.y + box.h - com.scrollRecH.h + marg)
        .attr('x', box.x + marg)
        .attr('width', com.scrollRecH.w)
        .attr('height', com.scrollRecH.h - marg * 2)
      recScroll
        .exit()
        .transition('inOut')
        .duration(timeD.animArc * 3 / 4)
        .attr('y', box.y + box.y)
        .attr('x', box.x + marg)
        .attr('height', 0)
        .remove()
    }
    com.setHorizontalRecScroll = setHorizontalRecScroll

    // ---------------------------------------------------------------------------------------------------
    // instant transition in case of dragging
    // ---------------------------------------------------------------------------------------------------
    function zoomHorizontalScrollBarUpdate () {
      if (!hasVar(com.scrollBarRecH)) return
      if (com.isInDrag || com.inUserZoom) {
        com.scrollBarRecH.attr('transform', zoomHorizontalScrollBarTrans)
      } else {
        com.scrollBarRecH
          .transition('move')
          .duration(timeD.animArc / 4)
          .attr('transform', zoomHorizontalScrollBarTrans)
      }
    }
    com.zoomHorizontalScrollBarUpdate = zoomHorizontalScrollBarUpdate

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function zoomHorizontalScrollBarTrans () {
      // let pos = com.scrollTrans.frac * (com.outerBox.h - com.scrollRec.w*2);
      // return "translate("+(com.outerBox.x)+","+(com.outerBox.y + pos)+")";
      let pos = com.scrollTransH.frac * (com.outerBox.w - com.scrollRecH.w)
      return 'translate(' + pos + ', 0)'
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.runLoop.init({
      tag: com.mainTag + 'recHorizontalBckClick',
      func: recHorizontalBckClickOnce,
      nKeep: 1
    })

    function recHorizontalBckClick (dataIn) {
      com.runLoop.push({ tag: com.mainTag + 'recHorizontalBckClick', data: dataIn })
    }
    com.recHorizontalBckClick = recHorizontalBckClick

    let nClickTries = 0
    function recHorizontalBckClickOnce (dataIn) {
      if (
        com.isInZoom ||
        com.isInDrag ||
        (com.scrollTransH.active && !hasVar(com.scrollBarRecH))
      ) {
        // console.log('delay recHorizontalBckClickOnce',[com.isInZoom,com.isInDrag],[com.scrollTrans.active,hasVar(com.scrollBarRec)]);
        if (nClickTries < 100) {
          setTimeout(function () {
            nClickTries += 1
            recHorizontalBckClick(dataIn)
          }, timeD.animArc / 2)
        } else console.error('cant do recHorizontalBckClick ...', dataIn)
        return
      }
      nClickTries = 0

      let frac = dataIn.frac
      if (!hasVar(frac) && hasVar(dataIn.coords)) {
        frac = (dataIn.coords[1] - com.outerBox.y) / com.outerBox.h
      }

      if (hasVar(frac)) {
        frac = Math.min(1, Math.max(0, frac))
        let trans =
          -1 * frac * (com.scrollTrans.max - com.scrollTrans.min) -
          com.scrollTrans.now

        com.doTrans({ trans: trans })
      }
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    if (com.scrollTransH.active) zoomHorizontalScrollBarInit()

    resetHorizontalScroller({ duration: 0 })
  } // NO
  function resetHorizontalScroller (optIn) {
    if (!hasVar(optIn)) optIn = {}
    let duration = hasVar(optIn.duration) ? optIn.duration : timeD.animArc / 2

    if (hasVar(optIn.canScroll)) com.canScroll = optIn.canScroll
    if (hasVar(optIn.scrollHorizontal)) com.scrollHorizontal = optIn.scrollHorizontal
    if (hasVar(optIn.scrollWidth)) com.scrollWidth = optIn.scrollWidth

    let prevActive = com.scrollTransH.active
    setHorizontalScrollState()

    if (prevActive !== com.scrollTransH.active) {
      setBox()
    }

    com.innerG
      .transition('move')
      .duration(duration)
      .attr('transform', function (d, i) {
        let shift = posShift()
        return 'translate(' + shift[0] + ',' + shift[1] + ')'
      })
    com.clipRecInner
      .transition('move')
      .duration(duration)
      .attr('transform', 'translate(0,0)')
    com.clipRecOuter
      .transition('move')
      .duration(duration)
      .attr('transform', function (d, i) {
        let shift = posShift()
        return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
      })

    if (prevActive !== com.scrollTransH.active) {
      setHorizontalZoomStatus()
      com.zoomHorizontalScrollBarInit()
    } else if (com.scrollTransH.active) {
      com.setHorizontalRecScroll()
    }
  }
  this.resetHorizontalScroller = resetHorizontalScroller
  function setHorizontalScrollState () {
    let boxW = com.innerBox.w // com.outerBox.h - com.outerBox.marg * 2;
    if (com.canScroll && com.scrollHorizontal) {
      com.scrollTransH.active = Math.abs(com.scrollWidth) > boxW
    }

    com.scrollTransH.min = hasVar(com.scrollWidth)
      ? -1 * Math.abs(com.scrollWidth - boxW)
      : 0
    com.scrollTransH.max = 0
    com.scrollTransH.frac = 0
    com.scrollTransH.now = com.scrollTransH.max
    com.scrollRecH.w = boxW * boxW / Math.abs(com.scrollWidth)
  } // NO
  function updateHorizontalScrollState (keepFrac) {
    let boxW = com.innerBox.w // com.outerBox.h - com.outerBox.marg * 2;
    if (com.canScroll && com.scrollHorizontal) {
      com.scrollTransH.active = Math.abs(com.scrollWidth) > boxW
    }

    com.scrollTransH.min = hasVar(com.scrollWidth)
      ? -1 * Math.abs(com.scrollWidth - boxW)
      : 0
    com.scrollTransH.max = 0
    if (!keepFrac) com.scrollTransH.frac = 0
    if (com.scrollTransH.now < com.scrollTransH.min) com.scrollTransH.now = com.scrollTransH.min
    else if (com.scrollTransH.now > com.scrollTransH.max) com.scrollTransH.now = com.scrollTransH.max
    com.scrollRecH.w = boxW * boxW / Math.abs(com.scrollWidth)
  } // NO

  function resetScroller (optIn) {
    if (!hasVar(optIn)) optIn = {}
    let duration = hasVar(optIn.duration) ? optIn.duration : timeD.animArc / 2

    if (hasVar(optIn.canScroll)) com.canScroll = optIn.canScroll
    if (hasVar(optIn.scrollVertical)) com.scrollVertical = optIn.scrollVertical
    if (hasVar(optIn.scrollHeight)) com.scrollHeight = optIn.scrollHeight

    let prevActive = com.scrollTransV.active
    setVerticalScrollState()

    if (prevActive !== com.scrollTransV.active) {
      setBox()
    }

    com.innerG
      .transition('move')
      .duration(duration)
      .attr('transform', function (d, i) {
        let shift = posShift()
        return 'translate(' + shift[0] + ',' + shift[1] + ')'
      })

    com.clipRecInner
      .transition('move')
      .duration(duration)
      .attr('transform', 'translate(0,0)')

    com.clipRecOuter
      .transition('move')
      .duration(duration)
      .attr('transform', function (d, i) {
        let shift = posShift()
        return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
      })

    if (prevActive !== com.scrollTransV.active) {
      setVerticalZoomStatus()
      com.zoomVerticalScrollBarInit()
    } else if (com.scrollTransV.active) {
      com.setVerticalRecScroll()
    }
  }
  this.resetScroller = resetScroller

  function moveHorizontalScrollerTo (target) {
    com.scrollTransH.frac = target
    com.zoomHorizontalScrollBarUpdate()
    com.doHorizontalTrans({ frac: target, duration: 400 })
  }
  this.moveHorizontalScrollerTo = moveHorizontalScrollerTo

  function moveVerticalScrollerTo (target) {
    com.scrollTransV.frac = target
    com.zoomVerticalScrollBarUpdate()
    com.doVerticalTrans({ frac: target, duration: 400 })
  }
  this.moveVerticalScrollerTo = moveVerticalScrollerTo

  function updateHorizontalScroller (optIn) {
    if (!com.scrollTransH.active) return

    if (!hasVar(optIn)) optIn = {}

    if (hasVar(optIn.scrollWidth)) com.scrollWidth = optIn.scrollWidth
    // if (hasVar(optIn.boxWidth)) com.scrollWidth = optIn.boxWidth
    // if (hasVar(optIn.frac)) com.scrollWidth = optIn.frac

    updateHorizontalScrollState(true)
    com.setHorizontalRecScroll()
    com.doHorizontalTrans({ frac: com.scrollTransH.frac, duration: 0 })
    // setHorizontalZoomStatus()
    // if (prevActive !== com.scrollTransH.active) {
    //   setHorizontalZoomStatus()
    //   com.zoomHorizontalScrollBarInit()
    // }

    // if (prevActive !== com.scrollTransH.active) {
    //   setBox()
    // }
    //
    // com.innerG
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', function (d, i) {
    //     let shift = posShift()
    //     return 'translate(' + shift[0] + ',' + shift[1] + ')'
    //   })
    // com.clipRecInner
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', 'translate(0,0)')
    // com.clipRecOuter
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', function (d, i) {
    //     let shift = posShift()
    //     return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
    //   })
    //
  }
  this.updateHorizontalScroller = updateHorizontalScroller

  function updateVerticalScroller (optIn) {
    if (!com.scrollTransV.active) return

    if (!hasVar(optIn)) optIn = {}

    if (hasVar(optIn.scrollHeight)) com.scrollHeight = optIn.scrollHeight
    // if (hasVar(optIn.boxWidth)) com.scrollWidth = optIn.boxWidth
    // if (hasVar(optIn.frac)) com.scrollWidth = optIn.frac
    console.log(com.scrollHeight);
    updateVerticalScrollState(true)
    com.setVerticalRecScroll()
    com.doVerticalTrans({ frac: com.scrollTransV.frac, duration: 0 })
    // setHorizontalZoomStatus()
    // if (prevActive !== com.scrollTransH.active) {
    //   setHorizontalZoomStatus()
    //   com.zoomHorizontalScrollBarInit()
    // }

    // if (prevActive !== com.scrollTransH.active) {
    //   setBox()
    // }
    //
    // com.innerG
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', function (d, i) {
    //     let shift = posShift()
    //     return 'translate(' + shift[0] + ',' + shift[1] + ')'
    //   })
    // com.clipRecInner
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', 'translate(0,0)')
    // com.clipRecOuter
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', function (d, i) {
    //     let shift = posShift()
    //     return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
    //   })
    //
  }
  this.updateVerticalScroller = updateVerticalScroller
  // function updateScrollerSize (optIn) {
  //   if (!hasVar(optIn)) optIn = {}
  //   let duration = hasVar(optIn.duration) ? optIn.duration : timeD.animArc / 2
  //
  //   if (hasVar(optIn.canScroll)) com.canScroll = optIn.canScroll
  //   if (hasVar(optIn.scrollVertical)) com.scrollVertical = optIn.scrollVertical
  //   if (hasVar(optIn.scrollHeight)) com.scrollHeight = optIn.scrollHeight
  //
  //   let prevActive = com.scrollTransV.active
  //   setVerticalScrollState()
  //
  //   if (prevActive !== com.scrollTransV.active) {
  //     setBox()
  //   }
  //
  //   com.innerG
  //     .transition('move')
  //     .duration(duration)
  //     .attr('transform', function (d, i) {
  //       let shift = posShift()
  //       return 'translate(' + shift[0] + ',' + shift[1] + ')'
  //     })
  //
  //   com.clipRecInner
  //     .transition('move')
  //     .duration(duration)
  //     .attr('transform', 'translate(0,0)')
  //
  //   com.clipRecOuter
  //     .transition('move')
  //     .duration(duration)
  //     .attr('transform', function (d, i) {
  //       let shift = posShift()
  //       return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
  //     })
  //
  //   if (prevActive !== com.scrollTransV.active) {
  //     setVerticalZoomStatus()
  //     com.zoomVerticalScrollBarInit()
  //   } else if (com.scrollTransV.active) {
  //     com.setVerticalRecScroll()
  //   }
  // }
  // this.updateScrollerSize = updateScrollerSize
}
