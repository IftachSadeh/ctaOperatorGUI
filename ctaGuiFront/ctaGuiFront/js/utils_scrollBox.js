/* global d3 */
/* global timeD */
/* global hasVar */
/* global deepCopy */
/* global bckPattern */
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
  function init (optIn) {
    if (hasVar(com.mainTag)) {
      console.error('trying to init more than once ...', optIn)
      return
    }

    com.mainTag = optIn.tag
    com.tagZoom = com.mainTag + 'zoom'
    com.tagDrag = com.mainTag + 'drag'
    com.tagScrollBar = com.mainTag + 'scrollBar'
    com.scrollBarRec = null

    com.canScroll = hasVar(optIn.canScroll) ? optIn.canScroll : true
    com.scrollHeight = hasVar(optIn.scrollHeight) ? optIn.scrollHeight : 0
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

    com.scrollTrans = {
      now: 0,
      min: 0,
      max: 0,
      frac: 0,
      active: false,
      drag: { y: 0, frac: 0 }
    }

    com.tagClipPath = optIn.tagClipPath
    if (!hasVar(com.tagClipPath)) {
      com.tagClipPath = {
        inner: com.mainTag + 'clipPathInner',
        outer: com.mainTag + 'clipPathOuter'
      }
    }

    com.zoomPause = 10
    com.isInDrag = false
    com.isInZoom = false
    com.inUserZoom = false
    com.prevUpdate = null

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------
    com.gBox = optIn.gBox
    com.outerBox = deepCopy(optIn.boxData)

    // com.fitToScrollW     = hasVar(optIn.fitToScrollW)     ? optIn.fitToScrollW     : false;
    // com.centreWithScroll = hasVar(optIn.centreWithScroll) ? optIn.centreWithScroll : false;
    //
    com.scrollRec = hasVar(optIn.scrollRec) ? optIn.scrollRec : {}
    if (!hasVar(com.scrollRec.w)) com.scrollRec.w = com.outerBox.w * 0.015
    if (!hasVar(com.scrollRec.h)) com.scrollRec.h = com.scrollRec.w
    if (!hasVar(com.scrollRec.marg)) com.scrollRec.marg = 0.6
    if (!hasVar(com.scrollRec.fontSize)) {
      com.scrollRec.fontSize = com.scrollRec.w
    }

    com.scrollRec.x = com.outerBox.x + com.outerBox.w - com.scrollRec.w

    com.lockTitle = !hasVar(optIn.title)
    if (!com.lockTitle) {
      com.titleData = deepCopy(optIn.title)
      com.titleG = com.gBox.append('g')

      setTitle()

      com.outerBox.h -= com.titleData.h
      com.outerBox.y += com.titleData.h
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
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

    com.scrollBarG = com.gBox.append('g')

    // bckPattern({
    //   com: com,
    //   gNow: com.outerG,
    //   gTag: com.mainTag + 'blockBoxBack',
    //   lenWH: [com.outerBox.w, com.outerBox.h],
    //   trans: [com.outerBox.x, com.outerBox.y], // opac:0.06, textureOrient:"2/8"
    //   opac: 0.06,
    //   circType: 'lighter',
    //   size: 10
    // })

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.innerBox = {}
    setScrollState()
    setBox()

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------

    setStyle(optIn.style)

    setupZoom()
    setupScrollBar()

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
  function setupZoom () {
    let zoomLen = [-1, 1e20, 1e4]
    // let deltaWH       = com.innerBox.h * 0.1;

    let tagZoom = com.tagZoom
    let tagDrag = com.tagDrag
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
      if (!com.scrollTrans.active) return

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
      if (!com.scrollTrans.active) return

      com.isInDrag = true

      // if(d3.event.x >= com.scrollRec.x) {
      //   let frac = (d3.event.y - com.innerBox.y) / (com.innerBox.h);
      //   frac = Math.min(1, Math.max(0, frac));
      //   let trans = (-1 * frac * (com.scrollTrans.max - com.scrollTrans.min)) - com.scrollTrans.now;

      //   com.doTrans({trans:trans}); //, duration:timeD.animArc/.2
      // }

      com.scrollTrans.drag.y = hasVar(d3.event) ? d3.event.y : com.innerBox.y
      com.scrollTrans.drag.frac = com.scrollTrans.frac

      locker.add({ id: lockerZoom.all, override: true })
    }

    com[tagDrag + 'dragDuring'] = function () {
      if (!com.scrollTrans.active) return
      if (!hasVar(d3.event)) return
      if (!hasVar(d3.event.dy)) return

      if (locker.isFreeV(lockerV.zoomDuring)) {
        locker.add({ id: lockerZoom.all, override: true })
        locker.add({ id: lockerZoom.during, override: true })

        let trans = -1 * d3.event.dy
        // let frac  = (d3.event.y - com.innerBox.y)/com.innerBox.h;
        let frac =
          com.scrollTrans.drag.frac +
          (d3.event.y - com.scrollTrans.drag.y) / com.innerBox.h
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
        let now = com.scrollTrans.now
        if (now >= com.scrollTrans.max && trans > 0) trans = null
        else if (now <= com.scrollTrans.min && trans < 0) trans = null
        else {
          now += trans
          com.scrollTrans.now = Math.max(
            com.scrollTrans.min,
            Math.min(com.scrollTrans.max, now)
          )
          com.scrollTrans.frac = Math.abs(
            com.scrollTrans.now / (com.scrollTrans.max - com.scrollTrans.min)
          )
        }
        isMoved = hasVar(trans)
      } else if (hasVar(frac)) {
        com.scrollTrans.frac = Math.max(0, Math.min(1, frac))
        com.scrollTrans.now =
          com.scrollTrans.max +
          com.scrollTrans.frac * (com.scrollTrans.min - com.scrollTrans.max)
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
                shift[0] +
                ',' +
                (com.scrollTrans.now + shift[1]) +
                ')'
              )
            })
          com.clipRecInner
            .transition('move')
            .duration(duration)
            .attr('transform', function (d, i) {
              return 'translate(0,' + -com.scrollTrans.now + ')'
            })
          com.clipRecOuter
            .transition('move')
            .duration(duration)
            .attr('transform', function (d, i) {
              let shift = posShift()
              return (
                'translate(' +
                -shift[0] +
                ',' +
                (-shift[1] - com.scrollTrans.now) +
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
              (com.scrollTrans.now + shift[1]) +
              ')'
            )
          })
          com.clipRecInner.attr('transform', function (d, i) {
            return 'translate(0,' + -com.scrollTrans.now + ')'
          })
          com.clipRecOuter.attr('transform', function (d, i) {
            let shift = posShift()
            return (
              'translate(' +
              -shift[0] +
              ',' +
              (-shift[1] - com.scrollTrans.now) +
              ')'
            )
          })
        }
        com.zoomScrollBarUpdate()
      }

      return delay
    }
    com.doTrans = doTrans

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
    com.scrollBarG.call(com[tagDrag])

    setZoomStatus()
  }

  // ---------------------------------------------------------------------------------------------------
  // activate/disable the zoom behaviour
  // ---------------------------------------------------------------------------------------------------
  function setZoomStatus () {
    if (com.scrollTrans.active) {
      com.innerBox.g.call(com[com.tagZoom]).on('dblclick.zoom', null)
    } else com.innerBox.g.on('.zoom', null)
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setupScrollBar () {
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function zoomScrollBarInit () {
      if (!com.locker.isFree(com.mainTag + 'zoomScrollBarInit')) return

      com.locker.add({
        id: com.mainTag + 'zoomScrollBarInit',
        override: true
      })
      com.scrollBarRec = null

      let nDone = 0
      let box = com.outerBox
      let dataBck = com.scrollTrans.active ? [{ id: 'zoomScrollBarBck' }] : []
      let recBck = com.scrollBarG
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
          recBckClickOnce({ coords: d3.mouse(this) })
        })
        .style('opacity', 1)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('x', com.scrollRec.x)
        .attr('width', com.scrollRec.w)
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
      setRecScroll()

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

            com.scrollBarRec = com.scrollBarG.selectAll(
              'rect.' + com.tagScrollBar + 'scroll'
            )
            com.locker.remove({ id: com.mainTag + 'zoomScrollBarInit' })
          }
          nTries += 1
        }, timeD.animArc / 5)
      }

      if (com.scrollTrans.active) {
        scrollBarRecSet()
      } else {
        com.locker.remove({ id: com.mainTag + 'zoomScrollBarInit' })
      }
    }
    com.zoomScrollBarInit = zoomScrollBarInit

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setRecScroll () {
      let box = com.outerBox
      let marg = com.scrollRec.w * com.scrollRec.marg / 2

      let dataScroll = com.scrollTrans.active
        ? [{ id: 'zoomScrollBarScroll' }]
        : []
      let recScroll = com.scrollBarG
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
        .attr('height', com.scrollRec.h - marg * 2)
        .attr('transform', zoomScrollBarTrans)
        .merge(recScroll)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('transform', zoomScrollBarTrans)
        .attr('x', box.x + box.w - com.scrollRec.w + marg)
        .attr('y', box.y + marg)
        .attr('width', com.scrollRec.w - marg * 2)
        .attr('height', com.scrollRec.h - marg * 2)

      recScroll
        .exit()
        // .transition("inOut").duration(timeD.animArc/4)
        // .attr("transform", "translate(0,0)")
        // .attr("height", ( com.outerBox.h - marg ))
        // .style("opacity","0.5")
        .transition('inOut')
        .duration(timeD.animArc * 3 / 4)
        .attr('x', box.x + box.w)
        .attr('y', box.y + marg)
        .attr('width', 0)
        .remove()
    }
    com.setRecScroll = setRecScroll

    // ---------------------------------------------------------------------------------------------------
    // instant transition in case of dragging
    // ---------------------------------------------------------------------------------------------------
    function zoomScrollBarUpdate () {
      if (!hasVar(com.scrollBarRec)) return

      if (com.isInDrag || com.inUserZoom) {
        com.scrollBarRec.attr('transform', zoomScrollBarTrans)
      } else {
        com.scrollBarRec
          .transition('move')
          .duration(timeD.animArc / 4)
          .attr('transform', zoomScrollBarTrans)
      }
    }
    com.zoomScrollBarUpdate = zoomScrollBarUpdate

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function zoomScrollBarTrans () {
      // let pos = com.scrollTrans.frac * (com.outerBox.h - com.scrollRec.w*2);
      // return "translate("+(com.outerBox.x)+","+(com.outerBox.y + pos)+")";
      let pos = com.scrollTrans.frac * (com.outerBox.h - com.scrollRec.h)
      return 'translate(0,' + pos + ')'
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.runLoop.init({
      tag: com.mainTag + 'recBckClick',
      func: recBckClickOnce,
      nKeep: 1
    })

    function recBckClick (dataIn) {
      com.runLoop.push({ tag: com.mainTag + 'recBckClick', data: dataIn })
    }
    com.recBckClick = recBckClick

    let nClickTries = 0
    function recBckClickOnce (dataIn) {
      if (
        com.isInZoom ||
        com.isInDrag ||
        (com.scrollTrans.active && !hasVar(com.scrollBarRec))
      ) {
        // console.log('delay recBckClickOnce',[com.isInZoom,com.isInDrag],[com.scrollTrans.active,hasVar(com.scrollBarRec)]);
        if (nClickTries < 100) {
          setTimeout(function () {
            nClickTries += 1
            recBckClick(dataIn)
          }, timeD.animArc / 2)
        } else console.error('cant do recBckClick ...', dataIn)
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
    if (com.scrollTrans.active) zoomScrollBarInit()

    resetScroller({ duration: 0 })
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function posShift () {
    if (com.useRelativeCoords) {
      return [com.outerBox.x, com.outerBox.y]
      // if(com.centreWithScroll) return [com.innerBox.x, com.innerBox.y];
      // else                     return [com.outerBox.x, com.outerBox.y];
    } else {
      return [0, 0]
    }
  }
  com.posShift = posShift

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function resetScroller (optIn) {
    if (!hasVar(optIn)) optIn = {}
    let duration = hasVar(optIn.duration) ? optIn.duration : timeD.animArc / 2

    if (hasVar(optIn.canScroll)) com.canScroll = optIn.canScroll
    if (hasVar(optIn.scrollHeight)) com.scrollHeight = optIn.scrollHeight

    let prevActive = com.scrollTrans.active
    setScrollState()

    if (prevActive !== com.scrollTrans.active) {
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

    if (prevActive !== com.scrollTrans.active) {
      setZoomStatus()
      com.zoomScrollBarInit()
    } else if (com.scrollTrans.active) {
      com.setRecScroll()
    }
  }
  this.resetScroller = resetScroller

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setScrollState () {
    let boxH = com.innerBox.h // com.outerBox.h - com.outerBox.marg * 2;

    com.scrollTrans.active = com.canScroll
    if (com.scrollTrans.active) {
      com.scrollTrans.active = Math.abs(com.scrollHeight) > boxH
    }

    com.scrollTrans.min = hasVar(com.scrollHeight)
      ? -1 * Math.abs(com.scrollHeight - boxH)
      : 0
    com.scrollTrans.max = 0
    com.scrollTrans.frac = 0
    com.scrollTrans.now = com.scrollTrans.max
    com.scrollRec.h = boxH * boxH / Math.abs(com.scrollHeight)
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setBox () {
    let boxMarg = com.outerBox.marg
    let scrollMarg = com.scrollRec.w
    if (!com.sameInnerBoxMarg && !com.scrollTrans.active) scrollMarg = 0
    // if(!com.fitToScrollW && !com.scrollTrans.active) boxMarg += com.scrollRec.w/2;

    com.innerBox.x = com.outerBox.x + boxMarg
    com.innerBox.y = com.outerBox.y + boxMarg
    com.innerBox.w = com.outerBox.w - boxMarg * 2 - scrollMarg
    com.innerBox.h = com.outerBox.h - boxMarg * 2
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

  // // ---------------------------------------------------------------------------------------------------
  // //
  // // ---------------------------------------------------------------------------------------------------
  // function update() {
  //   return;
  // }
  // this.update = update;
}
