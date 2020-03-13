// ------------------------------------------------------------------
//
// ------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global timeD */
/* global hasVar */
/* global appendToDom */
/* global runWhenReady */
/* global doZoomToTarget */
/* global telHealthCol */
/* global bckPattern */
/* global telInfo */
/* global vorPloyFunc */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerMain = function (optIn0) {
  let thisTop = this
  let runLoop = optIn0.runLoop
  let sgvTag = optIn0.sgvTag
  let widgetId = optIn0.widgetId
  let locker = optIn0.locker
  let isSouth = optIn0.isSouth
  let myUniqueId = unique()
  let parentUniqueId = optIn0.myUniqueId
  let widgetType = optIn0.widgetType

  let svgBase = optIn0.svgBase
  svgBase.elements.main = thisTop
  
  let instruments = svgBase.instruments
  let zoomD = svgBase.zoomD
  
  let rScale = instruments.rScale

  let getPropPosShift = svgBase.getPropPosShift
  let interpolate01 = svgBase.interpolate01
  let setZoomState = svgBase.setZoomState
  let propsS1 = svgBase.propsS1
  let setState = svgBase.setState
  let isStateUp = svgBase.isStateUp
  let isStateDown = svgBase.isStateDown
  let isStateChange = svgBase.isStateChange
  let syncStateSend = svgBase.syncStateSend


  let noRender = false
  
  // need to use access function, as these may not yet
  // be defined when this function is first initialised
  function getSvgMini() {
    return svgBase.elements.mini
  }
  function getSvgChes() {
    return svgBase.elements.ches
  }


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  thisTop.hasInit = false
  // thisTop.svgQuick = null

  let com = {}
  thisTop.com = com
  let s10V = []
  let syncD = {}
  thisTop.syncD = syncD
  com.vor = {}
  com.s00 = {}
  com.s01 = {}
  com.s10 = {}
  instruments.data.vor = {}

  let dblclickZoomInOut = true
  let lenWH = 500
  
  let focusD = {}

  let s1LblXY = {}
  let arcFunc = {}

  let links2V = {}

  let arcPrev = {}
  arcPrev.ang = {}
  arcPrev.rad = {}

  let siteScale = isSouth ? 4 / 9 : 1

  let lenD = { w: [lenWH], h: [lenWH] }
  thisTop.lenD = lenD
  
  lenD.r = {}
  lenD.r.s00 = [12, 13, 14]
  if (isSouth) lenD.r.s00 = [12 * siteScale, 13 * siteScale, 14 * siteScale]

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  let gMainD = svgBase.svgD.main
  gMainD.g = svgBase.svgD.gSvg.append('g')
  gMainD.gOuter = gMainD.g.append('g')

  let uniqueClipId = 'clip' + myUniqueId
  
  gMainD.gOuter.append('defs')
    .append('clipPath')
    .attr('id', uniqueClipId)
    .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width',lenWH)
      .attr('height',lenWH)

  gMainD.gClipped = gMainD.gOuter.append('g')
  gMainD.gClipped.attr('class', 'gClipped')
    .attr('clip-path', 'url(#'+uniqueClipId+')');

  // ------------------------------------------------------------------
  // initial scale to 100x100 px
  // ------------------------------------------------------------------
  gMainD.gOuter.attr('transform', function (d) {
    return 'translate(0,0)scale('+ (100 / lenWH) +')'
  })

  // ------------------------------------------------------------------
  // to avoid bugs, this is the g which should be used
  // for translations and sacling of this element
  // ------------------------------------------------------------------
  thisTop.setTransform = function (trans) {
    if (hasVar(trans)) gMainD.g.attr('transform', trans)
    return gMainD.g
  }

  gMainD.gBase = gMainD.gClipped.append('g')
  gMainD.gBack = gMainD.gBase.append('g')
  com.vor.g = gMainD.gBase.append('g')
  com.s00.g = gMainD.gBase.append('g')
  com.s01.g = gMainD.gBase.append('g')

  if (noRender) {
    gMainD.g
      .style('opacity', 0)
      .style('pointer-events', 'none')
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function initData (dataIn) {
    let arrInit = dataIn.arrInit
    let subArr = dataIn.subArr

    if (thisTop.hasInit) return
    thisTop.hasInit = true

    initVor()

    // ------------------------------------------------------------------
    // add one circle as background
    // ------------------------------------------------------------------
    if (!noRender) {
      gMainD.gOuter
        .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width',lenD.w[0])
          .attr('height',lenD.h[0])
          .style("fill",'transparent' )
          .style("stroke",'#383B42' )
          // .style("stroke",'#F2F2F2' )
          // .style("stroke",'#2196F3' )
          .style("stroke-width", 1)
          .attr("pointer-events",'none')
          .attr("opacity",1)

      gMainD.gBack
        .append('circle')
        .attr('r', 0)
        .attr('cx', lenD.w[0] / 2)
        .attr('cy', lenD.h[0] / 2)
        .attr('fill', '#F2F2F2')
        .transition('inOut')
        .duration(timeD.animArc / 3)
        .attr('r', lenD.w[0] / 2.1)

      // the background grid
      bckPattern({
        com: com,
        gNow: gMainD.gBack,
        gTag: 'hex',
        lenWH: [lenD.w[0], lenD.h[0]],
        opac: thisTop.getScale() < zoomD.len['1.0'] ? 0.15 : 0.07,
        hexR: 18
      })
    }


    // ------------------------------------------------------------------
    // run all variations, just to initialize all the variables
    // (but only the last one will take affect - this will be the default value)
    // ------------------------------------------------------------------
    instruments.data.layout = 'physical' // physical layout as default
    // instruments.data.layout = "subArr";  // sub-array layout as default

    thisTop.setLayoutSubArr(subArr)
    thisTop.setLayoutPhysical(arrInit)

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    setState()

    locker.remove('inInitMain')
  }
  thisTop.initData = initData


  // // ------------------------------------------------------------------
  // // 
  // // ------------------------------------------------------------------
  // function setupZoom () {
  //   // initialize a global function (to be overriden below)
  //   thisTop.zoomToTrgMain = function (optIn) {
  //     if (!locker.isFree('inInit')) {
  //       setTimeout(function () {
  //         thisTop.zoomToTrgMain(optIn)
  //       }, timeD.waitLoop)
  //     }
  //   }

  //   // initialize a couple of functions to be overriden below
  //   thisTop.getScale = function () { return zoomD.len['0.0'] }
  //   thisTop.getTrans = function () { return [0, 0] }
  //   thisTop.getZoomS = function () { return 0 }

  //   return
  // }
  // setupZoom()


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function initZoom () {
    let scaleStart = 0
    function svgZoomStart () {
      if (!locker.isFreeV(['zoomSyncMain', 'zoomSyncMini', 'inZoomMini'])) return

      scaleStart = d3.event.transform.k
      locker.add({ id: 'zoom', override: true })
      locker.add({ id: 'inZoomMain', override: true })
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svgZoomDuring () {
      if (!locker.isFreeV(['zoomSyncMain', 'zoomSyncMini', 'inZoomMini'])) return
      gMainD.gBase.attr('transform', d3.event.transform)

      let svgMini = getSvgMini()
      if (svgMini) {
        if(!svgMini.staticZoom) {
          svgBase.svgD.mini.gBase.attr('transform', d3.event.transform)
        }
      }

      svgZoomUpdState()
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svgZoomEnd () {
      if (!locker.isFreeV(['zoomSyncMain', 'zoomSyncMini', 'inZoomMini'])) return
      
      svgZoomUpdState()
      setZoomState()

      focusD.target = zoomD.target
      focusD.scale = d3.event.transform.k

      // common actions (after releasing locker)
      let svgMini = getSvgMini()
      if(svgMini) {
        svgMini.miniZoomViewRec()
        svgMini.zoomSyncMini(d3.event.transform)
      }

      locker.remove('zoom')
      locker.remove('inZoomMain')

      // ------------------------------------------------------------------
      // if on minimal zoom, center
      // ------------------------------------------------------------------
      if (Math.abs(d3.event.transform.k - scaleStart) > 0.00001) {
        if (Math.abs(d3.event.transform.k - zoomD.len['0.0']) < 0.00001) {
          if (locker.isFreeV(['autoZoomTarget'])) {
            thisTop.zoomToTrgMain({
              target: 'init',
              scale: d3.event.transform.k,
              durFact: 0.5
            })
          }

          // syncroniz changes with other panels
          syncStateSend({
            type: 'syncTelFocus',
            syncTime: Date.now(),
            zoomState: 0,
            target: 'init'
          })
        }
      }

      return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function zoomSyncMain(trans) {
      locker.add({ id: 'zoomSyncMain', override: true })
      function funcEnd() {
        locker.remove('zoomSyncMain')
      }

      let x = (lenD.w[0] / 2 - trans.x) / trans.k
      let y = (lenD.h[0] / 2 - trans.y) / trans.k
      let transTo = [x, y]

      let outD = {
        trgScale: trans.k,
        durFact: 0,
        baseTime: 300,
        transTo: transTo,
        wh: [lenD.w[0], lenD.h[0]],
        cent: null,
        // funcStart: funcStart,
        funcEnd: funcEnd,
        // funcDuring: funcDuring,
        svg: gMainD.gOuter,
        svgZoom: com.svgZoom,
        svgBox: gMainD.gBase,
        svgZoomNode: gMainD.zoomNode
      }

      doZoomToTarget(outD)
    }
    thisTop.zoomSyncMain = zoomSyncMain

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    com.svgZoom = d3.zoom()
    com.svgZoom.scaleExtent(zoomD.scaleExtent)
    com.svgZoom.on('start', svgZoomStart)
    com.svgZoom.on('zoom', svgZoomDuring)
    com.svgZoom.on('end', svgZoomEnd)

    gMainD.gOuter.call(com.svgZoom)
      .on('dblclick.zoom', null)
      .on('wheel', function () {
        d3.event.preventDefault()
      })

    // save the svg node to use for d3.zoomTransform() later
    gMainD.zoomNode = gMainD.gOuter.nodes()[0]


    // ------------------------------------------------------------------
    // programatic zoom to some target and scale - only use the
    // last of any set of ovelapping zoom requests
    // ------------------------------------------------------------------
    runLoop.init({
      tag: 'zoomToTargetMain',
      func: doZoomToTarget,
      nKeep: -1
    })

    // ------------------------------------------------------------------
    // the actual function to be called when a
    // zoom needs to be put in the queue
    // ------------------------------------------------------------------
    thisTop.zoomToTrgMain = function (optIn) {
      if (!locker.isFree('inInit')) {
        setTimeout(function () {
          thisTop.zoomToTrgMain(optIn)
        }, timeD.waitLoop)
        return
      }
      if (!locker.isFreeV(['autoZoomTarget'])) return
      
      let targetName = optIn.target
      let targetScale = optIn.scale
      let durFact = optIn.durFact
      let endFunc = optIn.endFunc

      if (targetScale < zoomD.len['0.0']) targetScale = thisTop.getScale()

      let transTo = null
      if (targetName === 'init') {
        transTo = [lenD.w[0] / 2, lenD.h[0] / 2]
      } 
      else if (
        targetName === '' || 
        !hasVar(instruments.data.mini[targetName])) 
      {
        let scale = thisTop.getScale()
        let trans = thisTop.getTrans()
        let x = (lenD.w[0] / 2 - trans[0]) / scale
        let y = (lenD.h[0] / 2 - trans[1]) / scale
        transTo = [x, y]

        let diffMin = -1
        targetName = zoomD.target
        $.each(instruments.data.xyr, function (idNow, dataNow) {
          if (dataNow.isTel) {
            let diffNow =
              Math.pow(x - dataNow.x, 2) + Math.pow(y - dataNow.y, 2)
            if (diffNow < diffMin || diffMin < 0) {
              diffMin = diffNow
              targetName = idNow
            }
          }
        })
      } else {
        transTo = [
          instruments.data.xyr[targetName].x,
          instruments.data.xyr[targetName].y
        ]
      }

      let funcStart = function () {
        locker.add({ id: 'autoZoomTarget', override: true })
        if (targetName !== '' && targetName !== 'init') {
          zoomD.target = targetName
        }
      }
      
      let funcDuring = function () {}
      
      let funcEnd = function () {
        locker.remove('autoZoomTarget')

        let isDone = true
        if (Math.abs(thisTop.getScale() - zoomD.len['0.0']) < 0.00001) {
          let trans = thisTop.getTrans()
          if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
            isDone = false
            thisTop.zoomToTrgMain({
              target: 'init',
              scale: zoomD.len['0.0'],
              durFact: 1
            })
          }
        }
        if (durFact > 0 && isDone) setState()

        if (hasVar(endFunc)) endFunc(optIn)
      }

      let outD = {
        trgScale: targetScale,
        durFact: durFact,
        baseTime: 300,
        transTo: transTo,
        wh: [lenD.w[0], lenD.h[0]],
        cent: null,
        funcStart: funcStart,
        funcEnd: funcEnd,
        funcDuring: funcDuring,
        svg: gMainD.gOuter,
        svgZoom: com.svgZoom,
        svgBox: gMainD.gBase,
        svgZoomNode: gMainD.zoomNode
      }

      if (durFact < 0) {
        outD.durFact = 0
        doZoomToTarget(outD)
      } else {
        runLoop.push({ tag: 'zoomToTargetMain', data: outD })
      }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    thisTop.getScale = function () {
      return d3.zoomTransform(gMainD.zoomNode).k
    }
    thisTop.getTrans = function () {
      return [
        d3.zoomTransform(gMainD.zoomNode).x,
        d3.zoomTransform(gMainD.zoomNode).y
      ]
    }
    thisTop.getZoomS = function () {
      return thisTop.getScale() < zoomD.len['1.0'] ? 0 : 1
    }

    return
  }
  initZoom()

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function initVor() {
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let vorFunc = d3
      .voronoi()
      .x(function (d) {
        return d.x
      })
      .y(function (d) {
        return d.y
      })
      .extent([[0, 0], [lenD.w[0], lenD.h[0]]])

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setTelDataPhysical (dataIn) {
      // console.log("dataphyzoom", dataIn);
      instruments.data.xyrPhysical = {}
      instruments.data.vor.dataPhysical = []

      // ------------------------------------------------------------------
      // get the width of the initial data (should be most inclusive)
      // ------------------------------------------------------------------
      let keys = Object.keys(dataIn)
      let minDataX = dataIn[keys[0]].x
      let maxDataX = dataIn[keys[0]].x
      let minDataY = dataIn[keys[0]].y
      let maxDataY = dataIn[keys[0]].y

      $.each(dataIn, function (id, dataNow) {
        minDataX = Math.min(minDataX, dataNow.x)
        maxDataX = Math.max(maxDataX, dataNow.x)
        minDataY = Math.min(minDataY, dataNow.y)
        maxDataY = Math.max(maxDataY, dataNow.y)
      })

      let dataInWH = [maxDataX - minDataX, maxDataY - minDataY]
      if (!isSouth) {
        dataInWH[0] *= 1.1
        dataInWH[1] *= 1.1
      }

      $.each(dataIn, function (id, dataNow) {
        let eleR
        if (dataNow.t === 'LST') eleR = lenD.r.s00[2]
        else if (dataNow.t === 'MST') eleR = lenD.r.s00[1]
        else eleR = lenD.r.s00[0]

        // coordinate transform on the original values (which are also used elsewhere)
        let x =
          1 * dataNow.x * lenD.w[0] / (1.2 * dataInWH[0]) + lenD.w[0] / 2
        let y =
          -1 * dataNow.y * lenD.h[0] / (1.2 * dataInWH[1]) + lenD.h[0] / 2

        // translate to the center of the respective hex-cell
        // let xy = com.svgBck.trans([x,y]);  x = xy[0]; y = xy[1];

        instruments.data.xyrPhysical[id] = { x: x, y: y, r: eleR, isTel: true }
        instruments.data.vor.dataPhysical.push({ id: id, x: x, y: y, r: eleR })
      })

      // ------------------------------------------------------------------
      // use delaunay links to get the closest neighbours of each data-point
      // see: http://christophermanning.org/projects/voronoi-diagram-with-force-directed-nodes-and-delaunay-links/
      // ------------------------------------------------------------------
      let linksV = {}
      $.each(vorFunc.links(instruments.data.vor.dataPhysical), function (
        index,
        linkNow
      ) {
        let idS = linkNow.source.id
        let idT = linkNow.target.id

        if (!linksV[idS]) linksV[idS] = [idT]
        else linksV[idS].push(idT)
        if (!linksV[idT]) linksV[idT] = [idS]
        else linksV[idT].push(idS)
      })

      links2V.physical = deepCopy(linksV) // deep copy
      $.each(linksV, function (idS, linkNow0) {
        $.each(linkNow0, function (index0, idT0) {
          $.each(linksV[idT0], function (index1, idT1) {
            if (links2V.physical[idS].indexOf(idT1) === -1) {
              links2V.physical[idS].push(idT1)
            }
            // console.log(index1,links2V.physical[idS],idT0,idT1)
          })
        })
      })

      instruments.data.mini = instruments.data.xyrPhysical
    }
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setTelDataSubArr (dataIn) {
      instruments.data.xyrSubArr = {}
      instruments.data.vor.dataSubArr = []
      instruments.data.xyrSubArrGrp = []
      let hirchScale = 0.9
      let hirch = d3.hierarchy(dataIn).sum(function (d) {
        return 1
      })
      let packNode = d3
        .pack()
        .size([lenD.w[0] * hirchScale, lenD.h[0] * hirchScale])
        .padding(10)
      packNode(hirch)

      $.each(hirch.descendants(), function (index, dataNow) {
        let isTel = dataNow.height === 0
        if (dataNow.height < 2) {
          let id = dataNow.data.id
          // if(!isTel) {
          //   if(id == -1) id = telInfo.noSubArrName();
          //   else         id = telInfo.subArrayPrefix()+id;
          //   console.log('-------',id);
          // }

          let x = dataNow.x + lenD.w[0] * (1 - hirchScale) / 2
          let y = dataNow.y + lenD.h[0] * (1 - hirchScale) / 2

          let eleR = dataNow.r
          if (isTel) {
            if (dataNow.t === 'LST') eleR = lenD.r.s00[2]
            else if (dataNow.t === 'MST') eleR = lenD.r.s00[1]
            else eleR = lenD.r.s00[0]
          }

          instruments.data.xyrSubArr[id] = { x: x, y: y, r: eleR, isTel: isTel }

          if (isTel) {
            instruments.data.vor.dataSubArr.push({ id: id, x: x, y: y, r: eleR })
          } else {
            let ttl = hasVar(dataNow.data.N)
              ? dataNow.data.N
              : telInfo.noSubArrTitle()
            instruments.data.xyrSubArrGrp.push({
              id: id,
              N: ttl,
              x: x,
              y: y,
              r: eleR
            })
          }
        } else if (dataNow.height === 1) {
          console.log(index, dataNow)
        }
      })

      links2V.subArr = {}
      $.each(hirch.descendants(), function (index0, dataNow0) {
        if (dataNow0.height === 1) {
          $.each(dataNow0.children, function (index1, dataNow1) {
            if (dataNow1.height === 0) {
              let allIds = dataNow0.children.map(function (d) {
                return d.data.id
              })
              links2V.subArr[dataNow1.data.id] = []
              $.each(allIds, function (index2, dataNow2) {
                if (dataNow2 !== dataNow1.data.id) {
                  links2V.subArr[dataNow1.data.id].push(dataNow2)
                }
              })
            }
          })
        }
      })
    }

    // ------------------------------------------------------------------
    // create voronoi cells for the dataset. see: https://bl.ocks.org/mbostock/4060366
    // ------------------------------------------------------------------
    instruments.data.vorHov = function (d) {
      if (zoomD.target === d.data.id) return
      if (!locker.isFreeV(['zoom', 'autoZoomTarget'])) return

      let scale = thisTop.getScale()
      if (scale >= zoomD.len['1.0']) return

      zoomD.target = d.data.id
      setState()
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    runLoop.init({ tag: 'vorClickOnce', func: vorClickOnce, nKeep: 1 })

    instruments.data.vorClick = function (optIn) {
      if (locker.isFreeV(['zoom', 'autoZoomTarget'])) {
        runLoop.push({ tag: 'vorClickOnce', data: optIn })
      }
    }

    function vorClickOnce (d) {
      if (!locker.isFree('vorZoomClick')) {
        setTimeout(function () {
          instruments.data.vorClick(d)
        }, timeD.waitLoop / 2)
        return
      }
      locker.add({ id: 'vorZoomClick', override: true })

      let scale = thisTop.getScale()
      // console.log((scale >= zoomD.len["1.0"]),(zoomD.target == d.data.id))

      if (scale < zoomD.len['1.0']) {
        instruments.data.vorDblclick({ d: d, isInOut: dblclickZoomInOut })
      } else if (scale >= zoomD.len['1.0'] && zoomD.target !== d.data.id) {
        instruments.data.vorDblclick({ d: d, isInOut: false })
      } else {
        zoomD.target = d.data.id
        setState()
      }

      locker.remove({ id: 'vorZoomClick', delay: timeD.animArc })
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    runLoop.init({ tag: 'vorDblclickOnce', func: vorDblclickOnce, nKeep: 1 })

    instruments.data.vorDblclick = function (optIn) {
      // console.log( optIn.source);
      if (locker.isFreeV(['zoom', 'autoZoomTarget'])) {
        runLoop.push({ tag: 'vorDblclickOnce', data: optIn })
      }
    }

    function vorDblclickOnce (optIn) {
      if (!locker.isFree('vorZoomDblclick')) {
        setTimeout(function () {
          instruments.data.vorDblclick(optIn)
        }, timeD.waitLoop / 2)
        return
      }
      locker.add({ id: 'vorZoomDblclick', override: true })

      let d = optIn.d
      let zoomInOut = optIn.isInOut
      let scale = thisTop.getScale()
      let isOnTarget = zoomD.target === d.data.id
      // console.log('vorClick',d.data.id,(scale >= zoomD.len["1.0"]),!isOnTarget)

      zoomD.target = d.data.id

      let scaleToZoom = 1
      if (zoomInOut) {
        if (scale < zoomD.len['1.2']) scaleToZoom = zoomD.len['1.2'] + 0.001
        else scaleToZoom = zoomD.len['0.0']
      } else {
        if (scale < zoomD.len['0.2'] * 0.999) scaleToZoom = zoomD.len['0.2']
        else if (scale < zoomD.len['1.0'] * 1.001) scaleToZoom = zoomD.len['1.1']
        else scaleToZoom = zoomD.len['1.2']
      }

      thisTop.zoomToTrgMain({
        target: zoomD.target,
        scale: scaleToZoom,
        durFact: 1.25
      })

      if (scale >= zoomD.len['1.0'] && !isOnTarget) {
        setState()

        askDataS1()
        propsS1({ telId: zoomD.target, clickIn: false, propIn: '' })
      }

      locker.remove({ id: 'vorZoomDblclick', delay: timeD.animArc })
    }

    function setVor () {
      let tagVor = 'vor'
      let vorShowLines = false

      let vor = com.vor.g
        .selectAll('path.' + tagVor)
        .data(vorFunc.polygons(instruments.data.vor.data), function (d) {
          return d.data.id
        })

      vor
        .enter()
        .append('path')
        .attr('class', tagVor)
        .style('fill', 'transparent')
        .style('opacity', '0')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('stroke-width', 0)
        .style('opacity', 0)
        .style('stroke', '#383B42')
        .style('stroke-width', '1')
        .style('opacity', vorShowLines ? 1 : 0)
        .style('stroke', '#4F94CD')
        .on('mouseover', instruments.data.vorHov)
        .on('click', instruments.data.vorClick)
        .on('dblclick', function (d) {
          instruments.data.vorDblclick({ d: d, isInOut: dblclickZoomInOut })
        })
        // .on("mouseover", function(d) { console.log(d.data.id);  }) // debugging
        .merge(vor)
        .call(function (d) {
          d.attr('d', vorPloyFunc)
        })

      vor.exit().remove()

      // ------------------------------------------------------------------
      // calculation of coordinates for labels, added next
      // ------------------------------------------------------------------
      $.each(instruments.data.vor.data, function (index_, dataNow) {
        $.each(instruments.props[dataNow.id], function (index, porpNow) {
          let angle = (index + 0.5) * instruments.tauFracs[dataNow.id] + tau / 4
          let labelX = dataNow.r * Math.cos(angle)
          let labelY = dataNow.r * Math.sin(angle)

          if (s1LblXY[porpNow] === undefined) {
            s1LblXY[porpNow] = {}
          }
          s1LblXY[porpNow][dataNow.id] = [labelX, labelY]
        })
      })
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setLayoutPhysical (dataIn) {
      if (hasVar(dataIn)) setTelDataPhysical(dataIn)

      if (instruments.data.layout === 'physical') {
        instruments.data.xyr = instruments.data.xyrPhysical
        instruments.data.vor.data = instruments.data.vor.dataPhysical
        links2V.xyz = links2V.physical

        setVor()
        thisTop.subArrGrpCirc([])

        if (locker.isFree('inInit')) {
          if (hasVar(focusD.target)) {
            if (hasVar(instruments.data.xyr[focusD.target])) {
              thisTop.zoomToTrgMain({
                target: focusD.target,
                scale: focusD.scale,
                durFact: 1
              })
            }
          }
          // thisArrZoomer.setState();
        }

      }
    }
    thisTop.setLayoutPhysical = setLayoutPhysical

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function setLayoutSubArr (dataIn) {
      if (hasVar(dataIn)) setTelDataSubArr(dataIn)

      if (instruments.data.layout === 'subArr') {
        instruments.data.xyr = instruments.data.xyrSubArr
        instruments.data.vor.data = instruments.data.vor.dataSubArr
        links2V.xyz = links2V.subArr

        setVor()

        thisTop.subArrGrpCirc(instruments.data.xyrSubArrGrp)

        if (locker.isFree('inInit')) {
          if (hasVar(focusD.target)) {
            if (hasVar(instruments.data.xyr[focusD.target])) {
              // console.log('222222222222');
              if (Math.abs(thisTop.getScale() - zoomD.len['0.0']) > 0.00001) {
                let trans = thisTop.getTrans()
                if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
                  thisTop.zoomToTrgMain({
                    target: focusD.target,
                    scale: focusD.scale,
                    durFact: 1
                  })
                }
              }
            }
          }
        }

      }
    }
    thisTop.setLayoutSubArr = setLayoutSubArr

    return
  }

  // ------------------------------------------------------------------
  // see: http://bl.ocks.org/mbostock/5100636
  // ------------------------------------------------------------------
  com.arcTween = function (transition, optIn) {
    // if(optIn.skip != undefined && optIn.skip) return null;
    transition.attrTween('d', function (d) {
      if (hasVar(optIn.incIdV)) {
        if (optIn.incIdV.indexOf(d.id) === -1) return null
      }
      if (hasVar(optIn.excIdV)) {
        if (optIn.excIdV.indexOf(d.id) >= 0) return null
      }

      let tagNow = optIn.tagNow
      let angStr0 = optIn.angStr0
        ? arcFunc[tagNow][optIn.angStr0](d)
        : optIn.arcPrev[tagNow].ang[d.id][0]
      let angStr1 = optIn.angStr1
        ? arcFunc[tagNow][optIn.angStr1](d)
        : optIn.arcPrev[tagNow].ang[d.id][0]
      let angEnd0 = optIn.angEnd0
        ? arcFunc[tagNow][optIn.angEnd0](d)
        : optIn.arcPrev[tagNow].ang[d.id][1]
      let angEnd1 = optIn.angEnd1
        ? arcFunc[tagNow][optIn.angEnd1](d)
        : optIn.arcPrev[tagNow].ang[d.id][1]
      let radInr0 = optIn.radInr0
        ? arcFunc[tagNow][optIn.radInr0](d)
        : optIn.arcPrev[tagNow].rad[d.id][0]
      let radInr1 = optIn.radInr1
        ? arcFunc[tagNow][optIn.radInr1](d)
        : optIn.arcPrev[tagNow].rad[d.id][0]
      let radOut0 = optIn.radOut0
        ? arcFunc[tagNow][optIn.radOut0](d)
        : optIn.arcPrev[tagNow].rad[d.id][1]
      let radOut1 = optIn.radOut1
        ? arcFunc[tagNow][optIn.radOut1](d)
        : optIn.arcPrev[tagNow].rad[d.id][1]
      // console.log(tagNow,[angStr0,angStr1],[angEnd0,angEnd1],[radInr0,radInr1],[radOut0,radOut1])

      let needUpd = 0
      if (Math.abs(angStr0 - angStr1) / angStr0 > 1e-5) needUpd++
      if (Math.abs(angEnd0 - angEnd1) / angEnd0 > 1e-5) needUpd++
      if (Math.abs(radInr0 - radInr1) / radInr0 > 1e-5) needUpd++
      if (Math.abs(radOut0 - radOut1) / radOut0 > 1e-5) needUpd++
      if (needUpd === 0) return null

      let arc = d3.arc()
      return function (t) {
        let intrNow = interpolate01(t)
        d.startAngle = angStr0 + (angStr1 - angStr0) * intrNow
        d.endAngle = angEnd0 + (angEnd1 - angEnd0) * intrNow
        d.innerRadius = radInr0 + (radInr1 - radInr0) * intrNow
        d.outerRadius = radOut0 + (radOut1 - radOut0) * intrNow

        optIn.arcPrev[tagNow].ang[d.id][0] = d.startAngle
        optIn.arcPrev[tagNow].ang[d.id][1] = d.endAngle
        optIn.arcPrev[tagNow].rad[d.id][0] = d.innerRadius
        optIn.arcPrev[tagNow].rad[d.id][1] = d.outerRadius

        return arc(d)
      }
    })
  }

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function svgZoomUpdState () {
    let scale = thisTop.getScale()
    let zoomS = thisTop.getZoomS()

    let change01 = isStateChange(scale, '0.1')
    let change10 = isStateChange(scale, '1.0')

    if (zoomS === 0) syncD.zoomTarget = ''

    if (change01 || change10) {
      setState()

      // update the opacity of the background grid
      if (change10) {
        bckPattern({
          com: com,
          gNow: gMainD.gBase,
          gTag: 'hex',
          lenWH: [lenD.w[0], lenD.h[0]],
          opac: thisTop.getScale() < zoomD.len['1.0'] ? 0.15 : 0.07,
          hexR: 18
        })
      }
      if (isStateUp(scale, '1.0')) askDataS1()

      zoomD.len.prev = scale
    }
  }


  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setTelLayout (optIn) {
    if (
      !locker.isFreeV([
        'setStateLock',
        'dataChange',
        'zoom',
        'autoZoomTarget',
        's1propsChange'
      ])
    ) {
      setTimeout(function () {
        setTelLayout(optIn)
      }, timeD.animArc / 2)
      return
    }

    let id = optIn.id
    let updtId = optIn.updtId
    let data = optIn.data

    // check if we are about to change the id
    let isChange = instruments.data.layout !== id

    if (isChange || hasVar(data)) {
      locker.expires({ id: 'setStateLock', duration: timeD.animArc / 2 })
    }

    if (id === 'physical') {
      if (updtId) instruments.data.layout = id
      thisTop.setLayoutPhysical(data)
    } 
    else if (id === 'subArr') {
      if (updtId) instruments.data.layout = id
      thisTop.setLayoutSubArr(data)
    } 
    else {
      console.error(' - trying to set undefined layout', id)
      return
    }

    if ((updtId && isChange) || hasVar(data)) {
      setState()

      if (thisTop.getZoomS() === 1) {
        $.each(s10V, function (index, eleNow) {
          eleNow.s10.updatePosG(timeD.animArc)
        })
      }
    }
  }
  thisTop.setTelLayout = setTelLayout

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function subArrGrpCirc (dataV) {
    if (noRender) return

    if (!locker.isFree('inInit')) {
      setTimeout(function () {
        subArrGrpCirc(dataV)
      }, timeD.waitLoop)
      return
    }

    let tagNow = 'subArrGrp'
    let fontSize = 23 * siteScale

    // operate on new elements only
    let circ = com.s00.g
      .selectAll('circle.' + tagNow)
      .data(dataV, function (d) {
        return d.id
      })

    circ
      .enter()
      .append('circle')
      .attr('class', tagNow)
      .attr('r', 0)
      .style('stroke-width', 1)
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .style('fill', function (d) {
        return '#383b42'
      })
      .style('stroke', function (d) {
        return '#383b42'
      })
      .style('fill-opacity', 0.02)
      .style('stroke-opacity', 0.3)
      .attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
      .merge(circ)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
      .attr('r', function (d) {
        return d.r
      })

    circ
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('r', 0)
      .remove()

    let text = com.s00.g.selectAll('text.' + tagNow).data(dataV, function (d) {
      return d.id
    })

    text
      .enter()
      .append('text')
      .text(function (d) {
        return d.N
      })
      .attr('class', tagNow)
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .style('fill', '#383b42')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('transform', txtTrans)
      .style('fill-opacity', 0.4)
      .style('stroke-width', 0.7)
      .attr('text-anchor', 'middle')
      .style('stroke', '#383b42')
      .attr('font-size', fontSize + 'px')
      // .attr("dy", (fontSize/3)+'px' )
      .attr('dy', '0px')
      .merge(text)
      .transition('in')
      .duration(timeD.animArc)
      .attr('transform', txtTrans)
      .style('opacity', 1)

    text
      .exit()
      .transition('out')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()

    function txtTrans (d) {
      return 'translate(' + d.x + ',' + (d.y - d.r) + ')'
    }
  }
  thisTop.subArrGrpCirc = subArrGrpCirc

  // ------------------------------------------------------------------
  // add a lable with the
  // ------------------------------------------------------------------
  function s00title (focusV0, focusV1) {
    if (noRender) return
    
    let focusIdV = [
      focusV0.map(function (d) {
        return d.id
      }),
      focusV1.map(function (d) {
        return d.id
      })
    ]
    function isFocused (d, nFocus) {
      return focusIdV[nFocus].indexOf(d.id) >= 0
    }

    let tagLbl = 'lbls00title'
    // let tagState = 'state_00'
    // let tagTxt = tagState + tagLbl
    let fontSize0 = 11 * siteScale

    function fontSize (d) {
      if (isFocused(d, 1)) return fontSize0 * 0.5
      else if (isFocused(d, 0)) return fontSize0 * 0.6
      else return fontSize0 * 1.0
    }

    if (!hasVar(com[tagLbl])) {
      com[tagLbl] = {}
      com[tagLbl].g = gMainD.gBase.append('g')
    }

    let text = com[tagLbl].g
      .selectAll('text.' + tagLbl)
      .data(instruments.data.tel, function (d) {
        return d.id
      })

    text
      .enter()
      .append('text')
      .text(function (d) {
        return telInfo.getTitle(d.id)
      })
      .attr('class', tagLbl)
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .style('fill', '#383b42')
      .style('stroke-width', '0.3')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .style('stroke', '#383b42')
      .style('font-size', function (d) {
        return fontSize(d) + 'px'
      })
      .attr('dy', function (d) {
        return fontSize(d) / 3 + 'px'
      })
      .attr('transform', function (d, i) {
        return (
          'translate(' + instruments.data.xyr[d.id].x + ',' + instruments.data.xyr[d.id].y + ')'
        )
      })
      .attr('text-anchor', 'middle')
      .merge(text)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('transform', function (d, i) {
        let shiftVal = 0
        if (isFocused(d, 1)) {
          shiftVal = instruments.data.xyr[d.id].r * (rScale[1].health1 + 0.5)
        }
        return (
          'translate(' +
          instruments.data.xyr[d.id].x +
          ',' +
          (instruments.data.xyr[d.id].y - shiftVal) +
          ')'
        )
      })
      .style('font-size', function (d) {
        return fontSize(d) + 'px'
      })
      .attr('dy', function (d) {
        return fontSize(d) / 3 + 'px'
      })
      .style('opacity', 1)

    text
      .exit()
      .transition('exit')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()
  }

  // ------------------------------------------------------------------
  // innner arcs for the different properties
  // ------------------------------------------------------------------
  function s01inner (dataV, focusV) {
    if (noRender) return

    let tagState = 'state01'

    if (!hasVar(com.s01.inner)) {
      com.s01.inner = true

      // let telProps = Object.keys(instruments.props)
      $.each(instruments.allIds, function (n_ele, key) {
        // $.each(instruments.props, function (key, telProps) {
        $.each(instruments.props[key], function (index, porpNow) {
          // console.log('+', key, index, porpNow)
          $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
            // let tagNow = porpNow + nArcDrawNow
            let tagNow = key + porpNow + nArcDrawNow
            let is0 = nArcDrawNow === 0

            arcFunc[tagNow] = {}
            arcFunc[tagNow].rad00 = function (d) {
              return instruments.data.xyr[d.id].r * (is0 ? 0.85 : 0.81)
            }
            arcFunc[tagNow].rad01 = function (d) {
              return instruments.data.xyr[d.id].r * (is0 ? 0.95 : 0.99)
            }
            arcFunc[tagNow].rad10 = function (d) {
              return (
                instruments.data.xyr[d.id].r * rScale[1].innerH0 * (is0 ? 1 : 0.97)
              )
            }
            arcFunc[tagNow].rad11 = function (d) {
              return (
                instruments.data.xyr[d.id].r * rScale[1].innerH1 * (is0 ? 1 : 1.03)
              )
            }
            arcFunc[tagNow].ang00 = function (d) {
              return index * instruments.tauFracs[key] + instruments.tauSpace
            }
            arcFunc[tagNow].ang01 = function (d) {
              return (
                index * instruments.tauFracs[key] +
                instruments.tauSpace +
                (instruments.tauFracs[key] - instruments.tauSpace * 2) *
                  (is0 ? 1 : telHealthFrac(d[porpNow]))
              )
            }
          })
        })
      })
    }

    // ------------------------------------------------------------------
    // innner arcs for the different properties
    // ------------------------------------------------------------------
    let focusIdV = []
    if (focusV !== undefined && focusV != null) {
      $.each(focusV, function (index, dataNow) {
        focusIdV.push(dataNow.id)
      })
    }
    // let telId = dataV.id
    // let telId = zoomD.target
    // DDFF

    $.each(instruments.allIds, function (n_ele, telId) {
      $.each(instruments.props[telId], function (index, porpNow) {
        $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
          let tagNow = telId + porpNow + nArcDrawNow
          let is0 = nArcDrawNow === 0

          if (!hasVar(arcPrev[tagNow])) {
            arcPrev[tagNow] = {}
            arcPrev[tagNow].ang = {}
            arcPrev[tagNow].rad = {}
          }

          let dataVnow = dataV
          if (dataV.length > 0) {
            if (dataV[0].id != telId) {
              dataVnow = []
            }
          }

          let path = com.s01.g
            .selectAll('path.' + tagNow)
            .data(dataVnow, function (d, i) {
              return d.id
            })

          // operate on new elements only
          path
            .enter()
            .append('path')
            .style('stroke-width', '0.05')
            .style('pointer-events', 'none')
            .attr('vector-effect', 'non-scaling-stroke')
            .attr('id', function (d) {
              return myUniqueId + d.id + tagNow
            })
            .attr('class', tagState + ' ' + tagNow)
            // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
            .style('opacity', function (d) {
              return is0 ? '0.5' : '1'
            })
            .attr('transform', function (d) {
              return (
                'translate(' +
                instruments.data.xyr[d.id].x +
                ',' +
                instruments.data.xyr[d.id].y +
                ')'
              )
            })
            .each(function (d, i) {
              // console.log(i,d,tagNow)
              arcPrev[tagNow].ang[d.id] = [
                arcFunc[tagNow].ang00(d),
                arcFunc[tagNow].ang00(d)
              ]
              arcPrev[tagNow].rad[d.id] = [
                arcFunc[tagNow].rad00(d),
                arcFunc[tagNow].rad01(d)
              ]
            })
            .merge(path)
            .transition('in')
            .duration(timeD.animArc) // .delay(timeD.animArc)
            .attr('transform', function (d) {
              return (
                'translate(' +
                instruments.data.xyr[d.id].x +
                ',' +
                instruments.data.xyr[d.id].y +
                ')'
              )
            })
            .style('stroke', function (d) {
              return is0 ? null : telHealthCol(d[porpNow])
            })
            .style('fill', function (d) {
              return telHealthCol(d[porpNow])
            }) // return is0 ? "#383b42" : telHealthCol(d[porpNow]); })
            .call(com.arcTween, {
              tagNow: tagNow,
              arcPrev: arcPrev,
              angStr0: null,
              angStr1: null,
              angEnd0: null,
              angEnd1: 'ang01',
              radInr0: null,
              radInr1: null,
              radOut0: null,
              radOut1: null
            })
            // angStr0:"ang00", angStr1:"ang00", angEnd0:"ang00", angEnd1:"ang01",
            // radInr0:"rad00", radInr1:"rad00", radOut0:"rad01", radOut1:"rad01"
            .transition('update')
            .duration(timeD.animArc)
            .call(com.arcTween, {
              tagNow: tagNow,
              arcPrev: arcPrev,
              incIdV: focusIdV,
              angStr0: null,
              angStr1: null,
              angEnd0: null,
              angEnd1: null,
              radInr0: null,
              radInr1: 'rad10',
              radOut0: null,
              radOut1: 'rad11'
            })
            .transition('update')
            .duration(timeD.animArc)
            .call(com.arcTween, {
              tagNow: tagNow,
              arcPrev: arcPrev,
              excIdV: focusIdV,
              angStr0: null,
              angStr1: null,
              angEnd0: null,
              angEnd1: null,
              radInr0: null,
              radInr1: 'rad00',
              radOut0: null,
              radOut1: 'rad01'
            })

          // operate on exiting elements only
          path
            .exit()
            .transition('out')
            // .each(function (d, i) {console.log('qquq', i, d); })
            .duration(timeD.animArc)
            .call(com.arcTween, {
              tagNow: tagNow,
              arcPrev: arcPrev,
              angStr0: null,
              angStr1: 'ang00',
              angEnd0: null,
              angEnd1: 'ang00',
              radInr0: null,
              radInr1: 'rad00',
              radOut0: null,
              radOut1: 'rad01'
            })
            .remove()
        })
      })
    })

    focusIdV = null
  }

  
  // ------------------------------------------------------------------
  // outer rings for the instruments.prop0 (equivalent of s00_D metric in s01_D)
  // ------------------------------------------------------------------
  function s01outer (dataV, focusV) {
    if (noRender) return

    let tagState = 'state01'
    let porpNow = instruments.prop0

    if (!hasVar(com.s01.outer)) {
      com.s01.outer = true

      $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
        let tagNow = porpNow + nArcDrawNow
        let is0 = nArcDrawNow === 0

        arcFunc[tagNow] = {}
        arcFunc[tagNow].rad00 = function (d) {
          return instruments.data.xyr[d.id].r * rScale[0].health0 * (is0 ? 1 : 0.95)
        }
        arcFunc[tagNow].rad01 = function (d) {
          return instruments.data.xyr[d.id].r * rScale[0].health1 * (is0 ? 1 : 1.05)
        }
        arcFunc[tagNow].rad10 = function (d) {
          return instruments.data.xyr[d.id].r * rScale[1].health0 * (is0 ? 1 : 0.98)
        }
        arcFunc[tagNow].rad11 = function (d) {
          return instruments.data.xyr[d.id].r * rScale[1].health1 * (is0 ? 1 : 1.02)
        }
        arcFunc[tagNow].ang00 = function (d) {
          return 0
        }
        arcFunc[tagNow].ang01 = function (d) {
          return is0 ? tau : tau * telHealthFrac(d[instruments.prop0])
        }
      })
    }

    // ------------------------------------------------------------------
    // innner arcs for the different properties
    // ------------------------------------------------------------------
    let focusIdV = []
    if (focusV !== undefined && focusV != null) {
      $.each(focusV, function (index, dataNow) {
        focusIdV.push(dataNow.id)
      })
    }

    $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
      let tagNow = porpNow + nArcDrawNow
      let is0 = nArcDrawNow === 0

      if (!hasVar(arcPrev[tagNow])) {
        arcPrev[tagNow] = {}
        arcPrev[tagNow].ang = {}
        arcPrev[tagNow].rad = {}
      }

      let path = com.s01.g
        .selectAll('path.' + tagNow)
        .data(dataV, function (d) {
          return d.id
        })

      // operate on new elements only
      path
        .enter()
        .append('path')
        .style('stroke-width', 0.05)
        .style('pointer-events', 'none')
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('id', function (d) {
          return myUniqueId + d.id + tagNow
        })
        .attr('class', tagState + ' ' + tagNow)
        // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
        .style('opacity', function (d) {
          return is0 ? '0.5' : '1'
        })
        .attr('transform', function (d) {
          return (
            'translate(' +
            instruments.data.xyr[d.id].x +
            ',' +
            instruments.data.xyr[d.id].y +
            ')'
          )
        })
        .each(function (d, i) {
          arcPrev[tagNow].ang[d.id] = [
            arcFunc[tagNow].ang00(d),
            arcFunc[tagNow].ang00(d)
          ]
          arcPrev[tagNow].rad[d.id] = [
            arcFunc[tagNow].rad00(d),
            arcFunc[tagNow].rad01(d)
          ]
        })
        .merge(path)
        .transition('in')
        .duration(timeD.animArc) // .delay(timeD.animArc)
        .attr('transform', function (d) {
          return (
            'translate(' +
            instruments.data.xyr[d.id].x +
            ',' +
            instruments.data.xyr[d.id].y +
            ')'
          )
        })
        .style('stroke', function (d) {
          return is0 ? null : telHealthCol(d[porpNow])
        })
        .style('fill', function (d) {
          return telHealthCol(d[porpNow])
        }) // return is0 ? "#383b42" : telHealthCol(d[porpNow]); })
        .call(com.arcTween, {
          tagNow: tagNow,
          arcPrev: arcPrev,
          angStr0: null,
          angStr1: null,
          angEnd0: null,
          angEnd1: 'ang01',
          radInr0: null,
          radInr1: null,
          radOut0: null,
          radOut1: null
        })
        // angStr0:"ang00", angStr1:"ang00", angEnd0:"ang00", angEnd1:"ang01",
        // radInr0:"rad00", radInr1:"rad00", radOut0:"rad01", radOut1:"rad01"
        .transition('update')
        .duration(timeD.animArc)
        .call(com.arcTween, {
          tagNow: tagNow,
          arcPrev: arcPrev,
          incIdV: focusIdV,
          angStr0: null,
          angStr1: null,
          angEnd0: null,
          angEnd1: null,
          radInr0: null,
          radInr1: 'rad10',
          radOut0: null,
          radOut1: 'rad11'
        })
        .transition('update')
        .duration(timeD.animArc)
        .call(com.arcTween, {
          tagNow: tagNow,
          arcPrev: arcPrev,
          excIdV: focusIdV,
          angStr0: null,
          angStr1: null,
          angEnd0: null,
          angEnd1: null,
          radInr0: null,
          radInr1: 'rad00',
          radOut0: null,
          radOut1: 'rad01'
        })

      // operate on exiting elements only
      path
        .exit()
        .transition('out')
        .duration(timeD.animArc)
        .call(com.arcTween, {
          tagNow: tagNow,
          arcPrev: arcPrev,
          angStr0: null,
          angStr1: 'ang00',
          angEnd0: null,
          angEnd1: 'ang00',
          radInr0: null,
          radInr1: 'rad00',
          radOut0: null,
          radOut1: 'rad01'
        })
        .remove()
    })

    focusIdV = null
  }

  // function hasS10main(targetId) {
  //   let hasId = false;
  //   $.each(s10V, function(index,eleNow) {
  //     if(eleNow.id == zoomD.target) hasId = true;
  //   })
  //   return hasId;
  // }
  // thisTop.hasS10main = hasS10main;

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function s10main (dataIn) {
    // console.log('s10main',zoomD.target,dataIn);

    let maxEleKeep = 1
    let childV = hasVar(dataIn) ? dataIn.data : null

    if (childV) {
      let telId = dataIn.id

      $.each(instruments.props[telId], function (index, porpNow) {
        instruments.data.propDataS1[telId] = {}
        instruments.data.propDataS1[telId][porpNow] = null
        instruments.data.propParentS1[telId] = {}
        instruments.data.propParentS1[telId][porpNow] = ''
        instruments.data.propTitleS1[telId] = {}
        instruments.data.propTitleS1[telId][porpNow] = ''
      })

      // construct the dataBase object b hand, as
      // some properties may not be included in instruments.props[telId]
      instruments.data.dataBaseS1[telId] = {}
      instruments.data.dataBaseS1[telId].id = instruments.prop0
      instruments.data.dataBaseS1[telId].val = dataIn[instruments.prop0]
      instruments.data.dataBaseS1[telId].children = []
      // console.log('qqqqqqqq',telId,dataIn.data.val,dataIn.data)

      $.each(childV, function (indexData, childNow) {
        let porpNow = childNow.id
        if (instruments.props[telId].indexOf(porpNow) >= 0) {
          // add a reference to each property
          instruments.data.propDataS1[telId][porpNow] = childNow
          instruments.data.propParentS1[telId][porpNow] = porpNow

          // also add a reference for each level of the hierarchy which has a sub-hierarchy of its own
          addChildren(childNow, telId, porpNow)

          // build up the baseData object
          instruments.data.dataBaseS1[telId].children.push(childNow)
        }
      })
    }

    function addChildren (dataNow, telId, porpNow) {
      if (dataNow.children) {
        dataNow.children.forEach(function (d, i) {
          if (d.children) {
            instruments.data.propDataS1[telId][d.id] = d
            addChildren(d, telId, porpNow)
          }
          instruments.data.propParentS1[telId][d.id] = porpNow
          instruments.data.propTitleS1[telId][d.id] = d.ttl
        })
      }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    if (!childV) {
      $.each(s10V, function (index, eleNow) {
        // console.log('clean -',index,eleNow);
        let s10 = eleNow.s10

        s10.bckArcRemove() // console.log('clickBckArc s10 000')
      })
      return
    } else {
      $.each(s10V, function (index, eleNow) {
        let id = eleNow.id
        let s10 = eleNow.s10

        if (id !== zoomD.target) {
          // s10.clickBckArc(null);
          s10.bckArcRemove() // console.log('clickBckArc s10 111')
        }
      })
    }

    let s10 = null
    $.each(s10V, function (index, eleNow) {
      if (eleNow.id === zoomD.target) s10 = eleNow.s10
    })
    if (!s10) {
      // ------------------------------------------------------------------
      //
      // ------------------------------------------------------------------
      let S10obj = function (telId) {
        let thisS10 = this
        thisS10.telId = telId
        thisS10.instruments = {}
        thisS10.instruments.props = instruments.props[telId]
        thisS10.tauFrac = instruments.tauFracs[telId]
        thisS10.instruments.propTitles = instruments.propTitles[telId]

        let myDate = Date.now()
        let gBase = null
        let gBckArc = null
        let gHirch = null
        let gPropLbl = null
        let gTrans = null
        let arcs = null
        let depthClick = null
        let parentV = null
        let hirchDataV = null

        thisS10.hirchData = {}
        $.each(thisS10.instruments.props, function (index, porpNow) {
          thisS10.hirchData[porpNow] = null
        })

        thisS10.getDate = function () {
          return myDate
        }

        let wh = instruments.data.xyr[telId].r * rScale[1].innerH1 * 1.6

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function init () {
          if (gBase) {
            myDate = Date.now()
          } else {
            gBase = gMainD.gBase.append('g')

            updatePosG(0)

            gBckArc = gBase.append('g')
            gPropLbl = gBase.append('g')
            // gBckArc.append("rect").attr("width",wh).attr("height",wh).style("stroke",'#2196F3' ).style("fill",'transparent' ).style("stroke-width", 0.1).attr("pointer-events",'none').attr("opacity",0.5);

            parentV = {}
            depthClick = {}

            arcs = {}
            arcs.arc = {}
            arcs.tween = {}
            arcs.isOpen = false
            arcs.inProp = ''

            gHirch = {}
            gTrans = {}
            hirchDataV = {}
            $.each(childV, function (indexData, dataBase) {
              let porpNow = dataBase.id

              if (thisS10.instruments.props.indexOf(porpNow) >= 0) {
                gTrans[porpNow] = {}
                gHirch[porpNow] = {}
                gHirch[porpNow].hirch = gBase.append('g')
                hirchDataV[porpNow] = {}
              }
            })

            // // expose the objects (must come after their initialization!)
            thisS10.gBase = gBase
            thisS10.arcs = arcs

            // initBckArc();
            initHirch()
          }

          // console.log('clickBckArc init')
          // initBckArc(); // called from bckArcClick on init anyway...
        }
        thisS10.init = init

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function updatePosG (duration) {
          let gBaseTrans = [
            instruments.data.xyr[telId].x - wh / 2,
            instruments.data.xyr[telId].y - wh / 2
          ]

          gBase
            .transition('updtPos')
            .duration(duration)
            .attr('transform', function (d) {
              return 'translate(' + gBaseTrans[0] + ',' + gBaseTrans[1] + ')'
            })
        }
        thisS10.updatePosG = updatePosG

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function cleanup () {
          gBase.remove()

          gBase = null
          gBckArc = null
          gHirch = null
          gPropLbl = null
          gTrans = null
          arcs = null
          depthClick = null
          parentV = null
          hirchDataV = null
        }
        thisS10.cleanup = cleanup

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function setPropLbl (optIn) {
          if (noRender) return

          // due to delays from locker, this function could be called after the S10obj has
          // been removed - make a safety check using gBase...
          if (!hasVar(gBase)) return

          let baseTag = 's10arc'
          let tagLbl = baseTag + '_propLbl'
          let propIn = hasVar(optIn.propIn) ? optIn.propIn : ''
          let remove = hasVar(optIn.remove) ? optIn.remove : false

          if (propIn !== '') {
            if (thisS10.instruments.props.indexOf(propIn) < 0) {
              if (hasVar(instruments.data.propParentS1[telId][propIn])) {
                propIn = instruments.data.propParentS1[telId][propIn]
              }
            }
          }

          let textD = []
          if (thisTop.getZoomS() === 1 && !remove) {
            $.each(thisS10.instruments.props, function (index, porpNow) {
              let state = 0
              if (propIn !== '') {
                state = propIn === porpNow ? 1 : 2
              }

              let txtR = instruments.data.xyr[telId].r * rScale[1].innerH1 * 1.45
              let xy = getPropPosShift(
                'xy',
                txtR,
                index,
                thisS10.instruments.props.length
              )

              textD.push({
                id: tagLbl + porpNow,
                text: thisS10.instruments.propTitles[porpNow],
                h: 30 / zoomD.len['1.3'],
                xy: xy,
                x: wh / 2 - xy[0],
                y: wh / 2 - xy[1],
                strkW: state === 1 ? 3 : 0,
                opac: state === 1 ? 0.9 : state === 2 ? 0.1 : 0.7,
                anch:
                  Math.abs(xy[0] / instruments.data.xyr[telId].r) < 0.001
                    ? 'middle'
                    : xy[0] < 0 ? 'start' : 'end'
              })
            })
          }

          let eleH = null

          let title = gPropLbl
            .selectAll('text.' + tagLbl)
            .data(textD, function (d) {
              return d.id
            })

          title
            .enter()
            .append('text')
            // .attr("id", function(d) { return myUniqueId+d.id; })
            .text(function (d) {
              return d.text
            })
            .attr('class', baseTag + ' ' + tagLbl) // class list for easy selection
            .style('opacity', '0')
            .style('fill', '#383b42')
            .attr('stroke-width', function (d) {
              return d.strkW
            })
            .style('stroke', function (d) {
              return '#383b42'
            })
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .style('font-weight', 'normal')
            .attr('transform', function (d) {
              return 'translate(' + d.x + ',' + d.y + ')'
            })
            .merge(title)
            .style('font-size', function (d) {
              return d.h + 'px'
            })
            .transition('update1')
            .duration(timeD.animArc)
            .attr('stroke-width', function (d) {
              return d.strkW
            })
            .attr('transform', function (d) {
              return 'translate(' + d.x + ',' + d.y + ')'
            })
            .attr('text-anchor', function (d) {
              return d.anch
            })
            .attr('dy', function (d) {
              if (!hasVar(eleH)) {
                eleH = getNodeHeightById({
                  selction: gPropLbl.selectAll('text.' + tagLbl),
                  id: d.id,
                  txtScale: true
                })
              }
              return eleH + 'px'
            })
            .style('opacity', function (d) {
              return d.opac
            })

          title
            .exit()
            .transition('exit')
            .duration(timeD.animArc)
            .style('opacity', '0')
            .remove()
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function initBckArc () {
          if (noRender) return

          // due to delays from locker, this function could be called after the S10obj has
          // been removed - make a safety check using gBase...
          if (!hasVar(gBase)) return

          // console.log('initBckArc')
          let propsNow = instruments.data.propDataS1[telId]
          $.each(propsNow, function (porpNow, dataNow) {
            if (dataNow) {
              let baseTag = 's10arc'
              let tagNow = baseTag + porpNow
              // let is0 = 1

              let nProp = thisS10.instruments.props.indexOf(porpNow)
              if (nProp >= 0) {
                if (!hasVar(arcs[tagNow])) {
                  arcs[tagNow] = {}
                  arcs[tagNow].ang = {}
                  arcs[tagNow].rad = {}

                  arcFunc[tagNow] = {}
                  arcFunc[tagNow].radN1 = function (d) {
                    return 0
                  }
                  arcFunc[tagNow].rad00 = function (d) {
                    return instruments.data.xyr[telId].r * rScale[1].innerH1 * 0.1
                  }
                  arcFunc[tagNow].rad01 = function (d) {
                    return instruments.data.xyr[telId].r * rScale[1].innerH1 * 0.8
                  }
                  arcFunc[tagNow].rad10 = function (d) {
                    return instruments.data.xyr[telId].r * rScale[1].innerH1 * 0.85
                  }
                  arcFunc[tagNow].rad11 = function (d) {
                    return instruments.data.xyr[telId].r * rScale[1].innerH1 * 1.35
                  }
                  arcFunc[tagNow].ang00 = function (d) {
                    return nProp * thisS10.tauFrac + instruments.tauSpace
                  }
                  arcFunc[tagNow].ang01 = function (d) {
                    return (nProp + 1) * thisS10.tauFrac - instruments.tauSpace
                  }
                  arcFunc[tagNow].ang10 = function (d) {
                    return 0
                  }
                  arcFunc[tagNow].ang11 = function (d) {
                    return tau
                  }
                  arcFunc[tagNow].ang20 = function (d) {
                    return nProp * thisS10.tauFrac
                  }
                  arcFunc[tagNow].ang21 = function (d) {
                    return (nProp + 1) * thisS10.tauFrac
                  }
                }

                let path = gBckArc.selectAll('path.' + tagNow).data([
                  {
                    id: tagNow + '0',
                    porpNow: porpNow,
                    nArc: 0,
                    isFull: false,
                    col: ''
                  },
                  {
                    id: tagNow + '1',
                    porpNow: porpNow,
                    nArc: 1,
                    isFull: false,
                    col: ''
                  }
                ])

                // operate on new elements only
                path
                  .enter()
                  .append('path')
                  .style('stroke-width', '1')
                  // .attr("id",        function(d) { return myUniqueId+d.id; })
                  .attr('class', function (d) {
                    return baseTag + ' ' + tagNow + ' ' + d.id
                  })
                  .each(function (d, i) {
                    arcs[tagNow].ang[d.id] = [
                      arcFunc[tagNow].ang00(d),
                      arcFunc[tagNow].ang01(d)
                    ]
                    arcs[tagNow].rad[d.id] = [
                      arcFunc[tagNow].rad00(d),
                      arcFunc[tagNow].rad00(d)
                    ]
                  })
                  .style('stroke', '#383b42')
                  .attr('vector-effect', 'non-scaling-stroke')
                  .attr('transform', function (d) {
                    return 'translate(' + wh / 2 + ',' + wh / 2 + ')'
                  })
                  .on('click', click)
                  // .on("mouseover", mouseover)
                  .style('fill', getCol)
                  .style('opacity', 0)
                  .style('fill-opacity', 0)
                  .merge(path)
                  .each(function (d) {
                    d.isFull = false
                  })
                  .transition('inOut')
                  .duration(timeD.animArc)
                  .delay(timeD.animArc)
                  .style('opacity', function (d) {
                    return d.nArc === 0 ? 1 : 0
                  })
                  .style('fill', getCol)
                  .style('fill-opacity', function (d) {
                    return d.nArc === 0 ? 0.5 : 0
                  })
                  .style('stroke-opacity', function (d) {
                    return d.nArc === 0 ? 0 : 0.3
                  })
                  .call(com.arcTween, {
                    tagNow: tagNow,
                    arcPrev: arcs,
                    angStr0: null,
                    angStr1: 'ang00',
                    angEnd0: null,
                    angEnd1: 'ang01',
                    radInr0: null,
                    radInr1: 'rad00',
                    radOut0: null,
                    radOut1: 'rad01'
                  })
              }
            }

            //
            function getCol (d) {
              d.col =
                d.nArc === 0
                  ? telHealthCol(instruments.data.propDataS1[telId][d.porpNow].val)
                  : '#383b42'
              return d.col
            }

            //
            function click (d) {
              bckArcClick({
                clickIn: isClickIn(d.porpNow),
                propIn: d.porpNow
              })
            }
          })

          setPropLbl({ propIn: '' })
        }
        thisS10.initBckArc = initBckArc

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let prevFocusedProp = ''
        function isClickIn (propIn) {
          return prevFocusedProp !== propIn
        }
        
        function setPrevProp (propIn) {
          prevFocusedProp = propIn
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function bckArcRemove () {
          if (noRender) return

          // due to delays from locker, this function could 
          // be called after the S10obj has been removed
           // - make a safety check using gBase...
          if (!hasVar(gBase)) return

          locker.add('s10bckArcChange')

          //
          hirchStyleClick({ propIn: '', id: '', isOpen: false })

          //
          $.each(thisS10.instruments.props, function (index, porpNow) {
            let baseTag = 's10arc'
            let tagNow = baseTag + porpNow
            let path = gBckArc.selectAll('path.' + tagNow)

            path
              .transition('inOut')
              .duration(timeD.animArc)
              .style('opacity', 0)
              .call(com.arcTween, {
                tagNow: tagNow,
                arcPrev: arcs,
                angStr0: null,
                angStr1: 'ang00',
                angEnd0: null,
                angEnd1: null,
                radInr0: null,
                radInr1: 'rad00',
                radOut0: null,
                radOut1: 'rad00'
              })
              .remove()
          })

          setPrevProp('')
          locker.remove('s10bckArcChange')

          setPropLbl({ propIn: '', remove: true })

          hirchHovTitleOut(null)
        }
        thisS10.bckArcRemove = bckArcRemove

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function bckArcClick (optIn) {
          // due to delays from locker, this function could be 
          // called after the S10obj has been removed 
          // - make a safety check using gBase...
          if (!hasVar(gBase)) return

          let clickIn = optIn.clickIn
          let propIn = optIn.propIn
          let onlyOpen = hasVar(optIn.onlyOpen) ? optIn.onlyOpen : false
          let canIgnore = hasVar(optIn.canIgnore) ? optIn.canIgnore : true

          if (thisS10.instruments.props.indexOf(propIn) < 0 && propIn != '') return

          if (
            !locker.isFreeV([
              's10bckArcChange',
              'dataChange',
              's10clickHirch'
            ])
          ) {
            if (!canIgnore) {
              setTimeout(function () {
                bckArcClick(optIn)
              }, timeD.animArc / 3)
            }
            return
          }

          locker.add({ id: 's10bckArcChange', override: true })
          function freeMe (doDelay) {
            locker.remove({
              id: 's10bckArcChange',
              delay: doDelay ? timeD.animArc * 1.5 : 0,
              override: true
            })
          }

          setPropLbl({ propIn: propIn })

          setPrevProp(propIn)

          // ------------------------------------------------------------------
          //
          // ------------------------------------------------------------------
          $.each(thisS10.instruments.props, function (index, porpNow) {
            let baseTag = 's10arc'
            let tagNow = baseTag + porpNow
            let path0 = gBckArc.selectAll('path.' + tagNow + '0')
            let path1 = gBckArc.selectAll('path.' + tagNow + '1')

            if (propIn === porpNow) {
              fullArcs(path0, path1, tagNow, clickIn)
            } else {
              hideArcs(path0, tagNow)
              hideArcs(path1, tagNow)
            }
          })

          if (onlyOpen && clickIn) {
            freeMe(true)
            return
          }

          if (!clickIn && depthClick[propIn] > 0) {
            let parentName = ''
            $.each(hirchDataV[propIn], function (idNow, dataNow) {
              if (dataNow.childDepth === depthClick[propIn]) {
                parentName = dataNow.parentName
              }
            })

            hirchStyleClick({ propIn: propIn, id: parentName, isOpen: true })
            
            propsS1({
              telId: telId,
              clickIn: true,
              propIn: parentName,
              doFunc: ['telHirch'],
              debug: 'bckArcClick'
            })

            freeMe(true)
            
            return
          } 
          else {
            // console.log('openCloseHirch',propIn,'--',depthClick[propIn],clickIn)

            hirchStyleClick({ propIn: propIn, id: propIn, isOpen: clickIn })

            propsS1({
              telId: telId,
              clickIn: clickIn,
              propIn: propIn,
              doFunc: ['telHirch'],
              debug: 'bckArcClick'
            })
          }

          if (!clickIn) {
            initBckArc()
            setPrevProp('')
            freeMe(true)
            return
          }

          //
          if (clickIn) {
            thisTop.zoomToTrgMain({
              target: telId,
              scale: zoomD.len['1.2'],
              durFact: 1
            })
          }

          freeMe(true)
        }
        thisS10.bckArcClick = bckArcClick

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function fullArcs (path0, path1, tagNow, isOpen) {
          if (noRender) return

          path0
            .transition('inOut')
            .duration(timeD.animArc)
            .style('opacity', 1)
            .style('fill', '#383b42')
            .style('fill-opacity', 0.06)
            // .style("fill-opacity", 0.2)
            .each(function (d) {
              d.isFull = true
            })
            .call(com.arcTween, {
              tagNow: tagNow,
              arcPrev: arcs,
              angStr0: null,
              angStr1: 'ang10',
              angEnd0: null,
              angEnd1: 'ang11',
              radInr0: null,
              radInr1: 'radN1',
              radOut0: null,
              radOut1: 'rad01'
            })

          path1
            .transition('inOut')
            .duration(timeD.animArc / 2)
            .call(com.arcTween, {
              tagNow: tagNow,
              arcPrev: arcs,
              angStr0: null,
              angStr1: null,
              angEnd0: null,
              angEnd1: null,
              radInr0: null,
              radInr1: 'rad10',
              radOut0: null,
              radOut1: 'rad11'
            })
            .style('fill-opacity', 0.07)
            .style('opacity', 1)
            .transition('inOut')
            .duration(timeD.animArc / 2)
            .call(com.arcTween, {
              tagNow: tagNow,
              arcPrev: arcs,
              angStr0: null,
              angStr1: 'ang20',
              angEnd0: null,
              angEnd1: 'ang21',
              radInr0: null,
              radInr1: null,
              radOut0: null,
              radOut1: null
            })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function hideArcs (path, tagNow) {
          if (noRender) return

          path
            .transition('inOut')
            .duration(timeD.animArc / 2)
            .style('opacity', 0)
            .call(com.arcTween, {
              tagNow: tagNow,
              arcPrev: arcs,
              angStr0: null,
              angStr1: null,
              angEnd0: null,
              angEnd1: null,
              radInr0: null,
              radInr1: 'radN1',
              radOut0: null,
              radOut1: 'radN1'
            })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function hirchHovTitleIn (dIn) {
          if (noRender) return

          if (
            !locker.isFreeV([
              's10bckArcChange',
              'dataChange',
              's10clickHirch'
            ])
          ) {
            return
          }

          hirchHovTitleOut(null)

          let r = lenD.r.s00[2] * rScale[1].innerH1 / 3.5
          let dx = wh / 2
          let dy = wh + 2 * r * instruments.data.xyr[telId].r / lenD.r.s00[2]

          gBase
            .selectAll('text.' + 'hovTitle')
            .data([{ id: dIn.data.id }], function (d) {
              return d.id
            })
            .enter()
            .append('text')
            .attr('class', 'hovTitle')
            .text(dIn.data.ttl)
            .style('opacity', 0)
            .style('fill-opacity', 0.8)
            .style('fill', '#383b42')
            .style('stroke', d3.rgb('#383b42').brighter(0.25))
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .style('stroke-width', 2)
            .style('font-weight', 'bold')
            .attr('font-size', r + 'px')
            .attr('transform', function (d, i) {
              return 'translate(' + dx + ',' + dy + ')'
            })
            .attr('dy', function (d) {
              let eleH =
                -0.5 *
                getNodeHeightById({
                  selction: gBase.selectAll('text.' + 'hovTitle'),
                  id: d.id
                })
              return eleH + 'px'
            })
            .transition('update1')
            .duration(timeD.animArc)
            .style('opacity', 1)
        }

        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        function hirchHovTitleOut (dIn) {
          if (noRender) return

          gBase
            .selectAll('text.' + 'hovTitle')
            .filter(function (d) {
              return hasVar(dIn) ? d.id === dIn.data.id : true
            })
            .transition('update1')
            .duration(timeD.animArc)
            .style('opacity', '0')
            .remove()

          return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function initHirch () {
          if (noRender) return

          // due to delays from locker, this function could be 
          // called after the S10obj has been removed 
          // - make a safety check using gBase...
          if (!hasVar(gBase)) return

          $.each(childV, function (indexData, dataBase) {
            let porpNow = dataBase.id

            let getChild = {}
            let hirchV = {}
            let maxDepth = 0

            function getAllChildren (d) {
              return d['child' + String(d.childDepth)]
            }

            function renameChildren (dataNow, depthIn, parentName) {
              if (!hasVar(depthIn)) depthIn = -1
              if (!hasVar(parentName)) parentName = null

              let depthNow = depthIn
              depthNow++
              maxDepth = Math.max(depthNow, maxDepth)

              let childName = 'child' + String(depthNow)

              // access function
              if (!hasVar(getChild[childName])) {
                getChild[childName] = function (d) {
                  return d[childName]
                }
              }

              // internal variables to keep track of the depth, name of the parent
              dataNow.childDepth = depthNow
              dataNow.parentName = parentName
              parentName = dataNow.id

              // modify children names and go one level deeper if needed
              if (dataNow.children) {
                // console.log('+++++',dataNow.id,childName,dataNow);
                if (!hasVar(gHirch[porpNow][dataNow.id])) {
                  // the baseline g element (parent g from the hirch, or else the first one)
                  let parentNameNow = dataNow.parentName
                    ? dataNow.parentName
                    : 'hirch'

                  // new baseline g element which may get child-g elements from the hirch
                  let gNow
                  gNow = gHirch[porpNow][parentNameNow].append('g')
                  gHirch[porpNow][dataNow.id] = gNow
                  // the first g elelment into which all circles will be appended (so that they
                  // are  always at the top of the g element, before any child-g elements)
                  gNow = gHirch[porpNow][dataNow.id].append('g')
                  gHirch[porpNow][dataNow.id + 'circ'] = gNow
                }

                dataNow[childName] = dataNow.children
                // dataNow.children   = null;
                dataNow[childName].forEach(function (d) {
                  renameChildren(d, depthNow, parentName)
                })

                hirchV[dataNow.id] = d3
                  .hierarchy(dataNow, getChild[childName])
                  .sum(function (d) {
                    return 1
                  })
                hirchDataV[porpNow][dataNow.id] = dataNow
                // console.log('--',dataNow.id,childName,dataNow)
              }
            }

            if (thisS10.instruments.props.indexOf(porpNow) >= 0) {
              renameChildren(dataBase)

              thisS10.hirchData[porpNow] = dataBase
              // console.log(dataBase)

              $.each(hirchV, function (hirchName, hirchNow) {
                let packNode = d3
                  .pack()
                  .size([wh, wh])
                  .padding(1.5 * siteScale)
                packNode(hirchNow)
              })

              parentV[porpNow] = {}
              depthClick[porpNow] = 0

              let hirchAll = d3.hierarchy(dataBase, getAllChildren)
              $.each(hirchAll.descendants(), function (index, dataNow) {
                let nameNow = dataNow.data.id
                if (!hasVar(parentV[porpNow][nameNow])) {
                  parentV[porpNow][nameNow] = [nameNow]
                }

                let parentNow = dataNow.parent
                while (parentNow) {
                  parentV[porpNow][nameNow].push(parentNow.data.id)
                  parentNow = parentNow.parent
                }
              })
              hirchAll = null
              // console.log('parentV -',parentV)

              for (let depthNow = 0; depthNow < maxDepth; depthNow++) {
                $.each(hirchV, function (hirchName, hirchNow) {
                  if (hirchNow.data.childDepth !== depthNow) return
                  // console.log(hirchName,hirchNow.data.childDepth,hirchNow)

                  let parentName = hirchNow.data.parentName
                  if (parentName != null) {
                    let parent = hirchV[parentName]
                    $.each(parent.children, function (index, childNow) {
                      // console.log('---- ',parentName,parentName,childNow.data.id,childNow)
                      if (childNow.data.id === hirchName) {
                        let parentR = childNow.r / (wh / 2)
                        let parentX = childNow.x - childNow.r
                        let parentY = childNow.y - childNow.r

                        // console.log('move-g in(',parentName,'):  ',hirchName)
                        gTrans[porpNow][hirchName] =
                          'translate(' +
                          parentX +
                          ',' +
                          parentY +
                          ')scale(' +
                          parentR +
                          ')'
                        gHirch[porpNow][hirchName].attr(
                          'transform',
                          gTrans[porpNow][hirchName]
                        )
                      }
                    })
                  }

                  // console.log('hirchName',hirchName,depthClick)
                  gHirch[porpNow][hirchName + 'circ']
                    .selectAll('circle.' + hirchName)
                    .data(hirchNow.descendants())
                    .enter()
                    .append('circle')
                    .attr('class', hirchName)
                    // .attr("id",            function(d){ return myUniqueId+hirchName+"_"+d.data.id; })
                    .style('opacity', function (d) {
                      return hirchStyleOpac(d, hirchNow, 0)
                    })
                    .style('stroke', function (d) {
                      return hirchStyleStroke(d, hirchNow, 0)
                    })
                    .style('stroke-width', function (d) {
                      return hirchStrkW(d, hirchNow, 0)
                    })
                    .style('fill', function (d) {
                      return hirchStyleFill(d, hirchNow, 0)
                    })
                    .attr('cx', function (d) {
                      return d.x
                    })
                    .attr('cy', function (d) {
                      return d.y
                    })
                    .attr('r', 0)
                    .attr('vector-effect', 'non-scaling-stroke')
                    .attr('pointer-events', function (d) {
                      return d.data.childDepth === 1 ? 'auto' : 'none'
                    })
                    .on('click', click)
                    .on('mouseover', hirchHovTitleIn)
                    .on('mouseout', hirchHovTitleOut)
                  // .on('mouseover', function(d){ console.log(d.data.id,d); })
                  // .transition("inOut").duration(timeD.animArc)
                  // .attr("r",             function(d,i){ return d.r; });

                  function click (d) {
                    if (
                      !locker.isFreeV([
                        's10bckArcChange',
                        'dataChange',
                        's10clickHirch'
                      ])
                    ) {
                      return
                    }

                    hirchStyleClick({
                      propIn: porpNow,
                      id: d.data.id,
                      isOpen: true
                    })
                    
                    propsS1({
                      telId: telId,
                      clickIn: true,
                      propIn: d.data.id,
                      debug: 'hirchClick'
                    })

                    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                    // FIXME:
                    // here we can set non thisS10.instruments.props names if needed.....
                    // console.log('_setPropLblInitHirch',d.data.id); setPropLbl({ propIn:d.data.id });
                    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                  }
                })
              }
            }
          })
        }
        thisS10.initHirch = initHirch

        // setTimeout(function() {
        //   console.log('==========================')
        //   porpNow = "mirror"
        //   // hirchName = "mirror_1_1"
        //   hirchName = porpNow
        //   hirchStyleClick({ propIn:porpNow, id:hirchName isOpen:true })

        // }, 4000);

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function hirchStyleClick (optIn) {
          if (noRender) return
          if (!hasVar(gBase)) return

          if (!locker.isFreeV(['dataChange', 's10clickHirch'])) {
            setTimeout(function () {
              hirchStyleClick(optIn)
            }, timeD.animArc / 3)
            return
          }

          locker.add({ id: 's10clickHirch', override: true })
          function freeMe (doDelay) {
            locker.remove({
              id: 's10clickHirch',
              delay: doDelay ? timeD.animArc * 1.5 : 0,
              override: true
            })
          }

          let id = optIn.id
          let propIn = optIn.propIn
          let isOpen = optIn.isOpen
          let syncProp = hasVar(optIn.syncProp) ? optIn.syncProp : optIn.id
          // console.log('clk',id,'==',propIn,'--', hirchDataV[propIn])

          if (thisTop.getZoomS() === 1) {
            let arrZoomerProp = isOpen ? syncProp : ''
            syncStateSend({
              type: 'syncArrZoomerProp',
              syncTime: Date.now(),
              telId: zoomD.target,
              propId: arrZoomerProp
            })
          }

          if (propIn === '' || !hasVar(propIn)) {
            $.each(gHirch, function (porpAllNow, gHirchNow) {
              gHirchNow.hirch
                .selectAll('circle')
                .transition('updt')
                .duration(timeD.animArc)
                .style('stroke', 'transparent')
                .attr('r', 0)

              $.each(gHirchNow, function (hirchName, gNow) {
                gNow
                  .transition('inOut')
                  .duration(timeD.animArc)
                  .attr('transform', gTrans[porpAllNow][hirchName])
              })
            })

            freeMe(true)
            return
          }

          if (
            !hasVar(gHirch[propIn][id]) ||
            !hasVar(hirchDataV[propIn][id])
          ) {
            freeMe(true)
            return
          }

          let depthNow = hirchDataV[propIn][id].childDepth
          let childDepth = depthNow + 1

          depthClick[propIn] = depthNow

          $.each(gHirch, function (porpAllNow, gHirchNow) {
            function isOut (d) {
              let inParentV = parentV[porpAllNow][d.data.id].indexOf(id) >= 0
              return isOpen && inParentV && d.data.childDepth > depthNow
            }

            gHirchNow.hirch
              .selectAll('circle')
              .transition('updt')
              .duration(timeD.animArc)
              .attr('r', function (d) {
                return isOut(d) ? d.r : 0
              })
              .attr('pointer-events', function (d) {
                return isOut(d) && d.data.childDepth === childDepth
                  ? 'auto'
                  : 'none'
              })
              .style('opacity', function (d) {
                return hirchStyleOpac(d, d, childDepth)
              })
              .style('stroke', function (d) {
                return isOut(d)
                  ? hirchStyleStroke(d, d, childDepth)
                  : 'transparent'
              })
              .style('stroke-width', function (d) {
                return hirchStrkW(d, d, childDepth)
              })
              .style('fill', function (d) {
                return hirchStyleFill(d, d, childDepth)
              })
          })

          $.each(gHirch, function (porpAllNow, gHirchNow) {
            $.each(gHirchNow, function (hirchName, gNow) {
              let inParentV = parentV[propIn][id].indexOf(hirchName) >= 0

              gNow
                .transition('inOut')
                .duration(timeD.animArc)
                .attr(
                  'transform',
                  inParentV
                    ? 'translate(0,0)scale(1)'
                    : gTrans[porpAllNow][hirchName]
                )
            })
          })

          freeMe(true)
        }
        thisTop.hirchStyleClick = hirchStyleClick

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function updateHirch (dataIn) {
          // due to delays from locker, this function could be called after the S10obj has
          // been removed - make a safety check using gBase...
          if (!hasVar(gBase)) return

          if (
            !locker.isFreeV([
              's10bckArcChange',
              's10clickHirch',
              'updateHirch'
            ])
          ) {
            // console.log('will delay updateHirch',dataIn);
            setTimeout(function () {
              updateHirch(dataIn)
            }, timeD.animArc / 3)
            return
          }
          locker.add('updateHirch')

          //
          $.each(thisS10.instruments.props, function (index, porpNow) {
            let baseTag = 's10arc'
            let tagNow = baseTag + porpNow
            let path = gBckArc.selectAll('path.' + tagNow)

            path
              .transition('updtData')
              .duration(timeD.animArc)
              .each(function (d) {
                if (d.nArc === 0) {
                  d.col = telHealthCol(
                    instruments.data.propDataS1[telId][porpNow].val)
                }
              })
              .style('fill', function (d) {
                return d.isFull ? '#383b42' : d.col
              })
          })

          //
          $.each(gHirch, function (porpNow, hirchNow) {
            hirchNow.hirch
              .selectAll('circle')
              .each(function (d) {
                if (hasVar(dataIn[d.data.id])) {
                  // console.log('updt 111',d.data.id,d);
                  d.data.val = dataIn[d.data.id]
                }
              })
              .transition('updtData')
              .duration(timeD.animArc)
              .style('fill', function (d) {
                return hirchStyleFill(d, d, depthClick[porpNow] + 1)
              })
          })
          // console.log('--------------------------------')

          locker.remove('updateHirch')
        }
        thisS10.updateHirch = updateHirch

        // ------------------------------------------------------------------
        // utility functions
        // ------------------------------------------------------------------
        function hirchStyleFill (d, dRef, depth) {
          return dRef.data.childDepth === depth && d.parent
            ? telHealthCol(d.data.val)
            : 'transparent'
        }
        
        function hirchStrkW (d, dRef, depth) {
          if (!d.parent) return 0
          else return dRef.data.childDepth === depth ? 0 : 1
        }
        
        function hirchStyleStroke (d, dRef, depth) {
          return hirchStrkW(d, dRef, depth) < 0.0001
            ? 'transparent'
            : '#383b42'
        }
        
        function hirchStyleOpac (d, dRef, depth) {
          return hirchStrkW(d, dRef, depth) < 0.0001 ? 0.9 : 1
        }
      
        return
      }

      s10 = new S10obj(zoomD.target)
      s10V.push({ id: zoomD.target, s10: s10 })
      
      ;(function () {
        if (s10V.length <= maxEleKeep) return

        let debug = false
        let s10in = []
        let s10out = []
        let s10indexDate = []

        $.each(s10V, function (index, eleNow) {
          s10indexDate.push([index, eleNow.s10.getDate()])
        })

        s10indexDate.sort(function (a, b) {
          return a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0
        })

        let dbgTxt = ''
        if (debug) {
          $.each(s10indexDate, function (index, eleNow) {
            dbgTxt += '[' + s10V[eleNow[0]].id + ' , '
            dbgTxt += s10V[eleNow[0]].s10.getDate() + '] '
          })
          dbgTxt += ' ---> removing: '
        }

        $.each(s10indexDate, function (index, eleNow) {
          if (index < maxEleKeep) s10in.push(s10V[eleNow[0]])
          else s10out.push(s10V[eleNow[0]])

          if (debug) {
            if (index >= maxEleKeep) dbgTxt += s10V[eleNow[0]].id + ' '
          }
        })
        if (debug) console.log('- Sorted:', dbgTxt)

        s10V = s10in

        $.each(s10out, function (index, eleNow) {
          // console.log('- removing:',index,eleNow.id,eleNow.s10,eleNow.s10.gBase)
          eleNow.s10.cleanup()
          eleNow.s10 = null

          if (hasVar(instruments.data.propDataS1[eleNow.id])) {
            delete instruments.data.propDataS1[eleNow.id]
            delete instruments.data.propParentS1[eleNow.id]
            delete instruments.data.propTitleS1[eleNow.id]
            delete instruments.data.dataBaseS1[eleNow.id]
          }
        })

        s10in = null
        s10out = null
        s10indexDate = null
      })()
    }

    s10.init()
  }
  thisTop.s10main = s10main

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function bckArcClick (optIn) {
    $.each(s10V, function (index, eleNow) {
      if (eleNow.id === zoomD.target) {
        eleNow.s10.bckArcClick(optIn)
      }
    })
  }
  thisTop.bckArcClick = bckArcClick

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function updateS1 (dataIn) {
    $.each(s10V, function (index, eleNow) {
      if (eleNow.id === dataIn.id) {
        eleNow.s10.updateHirch(dataIn.data)
      }
    })
  }
  thisTop.updateS1 = updateS1

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setStateOnce () {
    // console.log('setState_main main',thisTop.getScale())
    let scale = thisTop.getScale()
    let zoomS = thisTop.getZoomS()

    if (zoomS === 0) {
      s10main(null)
    }

    if (scale <= zoomD.len['0.1']) {
      updateMap({})
      s00title([], [])
      s01inner([])
      s01outer([])
    } else {
      // let zoomTargetIndex = instruments.data.idToIndex[zoomD.target];
      // let arrPropVtarget = [ instruments.data.tel[zoomTargetIndex] ];

      let arrPropVon = []
      let arrPropVoff = []
      let arrPropVtarget = []
      $.each(instruments.data.tel, function (index, dataNow) {
        if (zoomD.target === dataNow.id || !hasVar(links2V.xyz[zoomD.target])) {
          zoomD.target = dataNow.id
          arrPropVon.push(dataNow)
          arrPropVtarget.push(dataNow)
        } else {
          // arrPropVoff.push(dataNow)
          if (links2V.xyz[zoomD.target].indexOf(dataNow.id) < 0) {
            arrPropVoff.push(dataNow)
          } else {
            arrPropVon.push(dataNow)
          }
        }
      })

      updateMap({ focusV0: arrPropVon, focusV1: arrPropVtarget })

      if (zoomS === 0) {
        s01inner(arrPropVtarget)
        s01outer(arrPropVon)

        s00title(arrPropVon, [])
      } else {
        s00title(arrPropVon, arrPropVtarget)

        s01inner(arrPropVtarget, arrPropVtarget)
        s01outer(arrPropVon, arrPropVtarget)

        // ------------------------------------------------------------------
        // syncroniz changes with other panels
        // ------------------------------------------------------------------
        syncStateSend({
          type: 'syncTelFocus',
          syncTime: Date.now(),
          zoomState: thisTop.getZoomS(),
          target: zoomD.target
        })
      }

      arrPropVtarget = null
    }
  }
  thisTop.setStateOnce = setStateOnce

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function updateMap (optIn) {
    let dataV = instruments.data.tel
    let gNow = com.s00.g
    let posTag = 'xyr'
    let focusV0 = hasVar(optIn.focusV0) ? optIn.focusV0 : []
    let focusV1 = hasVar(optIn.focusV1) ? optIn.focusV1 : []
    let tagNow = instruments.prop0

    let focusIdV = [
      focusV0.map(function (d) {
        return d.id
      }),
      focusV1.map(function (d) {
        return d.id
      })
    ]
    function isFocused (d, nFocus) {
      return focusIdV[nFocus].indexOf(d.id) >= 0
    }

    if (noRender) return

    // operate on new elements only
    let circ = gNow
        .selectAll('circle.' + tagNow)
        .data(dataV, function (d) {
          return d.id
        })

    circ
      .enter()
      .append('circle')
      .attr('class', tagNow)
      .style('opacity', '0')
      .attr('r', function (d) {
        return 0
      })
      .style('stroke-width', '0.5')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('transform', function (d) {
        return (
          'translate(' +
          instruments.data[posTag][d.id].x +
          ',' +
          instruments.data[posTag][d.id].y +
          ')'
        )
      })
      .merge(circ)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('transform', function (d) {
        return (
          'translate(' +
          instruments.data[posTag][d.id].x +
          ',' +
          instruments.data[posTag][d.id].y +
          ')'
        )
      })
      .style('fill', function (d) {
        return telHealthCol(d[tagNow])
      })
      .style('stroke', function (d) {
        return telHealthCol(d[tagNow], 0.5)
      })
      .style('opacity', function (d) {
        if (isFocused(d, 1)) return 0.01
        else if (isFocused(d, 0)) return 0.07
        else return 1
      })
      .attr('r', function (d) {
        let r = instruments.data[posTag][d.id].r * rScale[0].health2
        if (isFocused(d, 1)) return r * 2
        else if (isFocused(d, 0)) return r * 1.1
        else return r
      })
    
    return
  }

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function askDataS1 () {
    let zoomS = thisTop.getZoomS()
    if (zoomS === 0) return

    sock.widgetV[widgetType].SockFunc.askDataS1({
      widgetId: widgetId,
      zoomState: zoomS,
      zoomTarget: zoomD.target
    })
  }
  thisTop.askDataS1 = askDataS1

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function getWidgetState () {
    return {
      zoomState: thisTop.getZoomS(),
      zoomTarget: zoomD.target
    }
  }
  thisTop.getWidgetState = getWidgetState

  return
}
