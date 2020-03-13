// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
// window.loadScript({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global sock */
/* global timeD */
/* global hasVar */
/* global appendToDom */
/* global runWhenReady */
/* global colsPurples */
/* global doZoomToTarget */
/* global telHealthCol */
/* global bckPattern */
/* global colsBlues */
/* global telInfo */
/* global moveNodeUp */
/* global vorPloyFunc */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerMini = function (optIn0) {
  let thisTop = this
  let runLoop = optIn0.runLoop
  let sgvTag = optIn0.sgvTag
  let widgetId = optIn0.widgetId
  let locker = optIn0.locker
  let isSouth = optIn0.isSouth
  let myUniqueId = unique()
  let parentUniqueId = optIn0.myUniqueId
  
  let svgBase = optIn0.svgBase
  svgBase.elements.mini = thisTop

  let instruments = svgBase.instruments
  let zoomD = svgBase.zoomD

  let rScale = instruments.rScale

  let baseH = 500
  let lenD = { w: [baseH], h: [baseH] }

  let showVor = false
  thisTop.hasInit = false
  thisTop.staticZoom = true

  // need to use access function, as these may not yet
  // be defined when this function is first initialised
  function getSvgMain() {
    return svgBase.elements.main
  }

  let gMiniD = svgBase.svgD.mini
  gMiniD.g = svgBase.svgD.gSvg.append('g')
  gMiniD.gMini = gMiniD.g.append('g')
  // gMiniD.gBase = gMiniD.gMini.append('g')


  let uniqueClipId = 'clip' + myUniqueId

  gMiniD.gOuter = gMiniD.gMini.append('g')
  gMiniD.gOuter.append('defs')
    .append('clipPath')
    .attr('id', uniqueClipId)
    .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width',baseH)
      .attr('height',baseH);

  gMiniD.gClipped = gMiniD.gOuter.append('g')
  gMiniD.gClipped.attr('class', 'gClipped')
    .attr('clip-path', 'url(#'+uniqueClipId+')');

  gMiniD.gBase = gMiniD.gClipped.append('g')




  // ------------------------------------------------------------------
  // scale to 100x100 px (executed after createChessMap())
  // ------------------------------------------------------------------
  function gTrans() {
    let scaleMini = 100 / baseH
    gMiniD.gMini.attr('transform', function (d) {
      return 'translate(0,0)scale(' + scaleMini + ')'
    })
    return
  }

  // ------------------------------------------------------------------
  // to avoid bugs, this is the g which should be used
  // for translations and sacling of this element
  // ------------------------------------------------------------------
  thisTop.setTransform = function (trans) {
    if (hasVar(trans)) gMiniD.g.attr('transform', trans)
    return gMiniD.g
  }


  let com = {}
  thisTop.com = com
  let zoomTarget = null
  let zoomLen = {}
  let telData = null
  let telTypeV = null
  let prop0 = 'health'

  let miniMapCol = {}
  miniMapCol.b = ['#64B5F6']
  miniMapCol.p = ['#9575CD']


  zoomLen['0.0'] = 1
  if (isSouth) {
    zoomLen['0.1'] = 2 // - 0.4
    zoomLen['0.2'] = 12 // - 4
    zoomLen['1.0'] = 15 // - 6
    zoomLen['1.1'] = zoomLen['1.0'] + 0.1
    zoomLen['1.2'] = zoomLen['1.0'] + 2
    zoomLen['1.3'] = 20
    // zoomLen["0.1"]  = 4  //- 4
    // zoomLen["0.2"]  = 10 //- 15.5
    // zoomLen["1.0"]  = 12 //- 16.5
    // zoomLen["1.1"]  = zoomLen["1.0"] + 0.1
    // zoomLen["1.2"]  = zoomLen["1.0"] + 2
    // zoomLen["1.3"]  = 90
  } else {
    zoomLen['0.1'] = 2 // - 0.4
    zoomLen['0.2'] = 5 // - 4
    zoomLen['1.0'] = 6.5 // - 6
    zoomLen['1.1'] = zoomLen['1.0'] + 0.1
    zoomLen['1.2'] = zoomLen['1.0'] + 1
    zoomLen['1.3'] = 9
  }
  zoomLen.prev = zoomLen['0.0']

  let zoomToTargetTag = {
    mini: 'zoomToTargetMini',
  }

  // ------------------------------------------------------------------
  //  MiniMap function
  // ------------------------------------------------------------------
  function createMiniMap (optIn) {
    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svgZoomStart() {
      if (!locker.isFreeV(['zoomSyncMain', 'zoomSyncMini', 'inZoomMain'])) return
      locker.add({ id: 'inZoomMini', override: true })
      return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svgZoomDuring() {
      if (!locker.isFreeV(['zoomSyncMain', 'zoomSyncMini', 'inZoomMain'])) return

      if (!thisTop.staticZoom) {
        gMiniD.gBase.attr('transform', d3.event.transform)
      }

      svgBase.svgD.main.gBase.attr('transform', d3.event.transform)

      return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function svgZoomEnd() {
      if (!locker.isFreeV(['zoomSyncMain', 'zoomSyncMini', 'inZoomMain'])) return

      miniZoomViewRec()

      getSvgMain().zoomSyncMain(d3.event.transform)

      // remove the lock before possible zoomToTrgMain()
      locker.remove('inZoomMini')


      if (Math.abs(thisTop.getScale() - zoomD.len['0.0']) < 0.00001) {
        let trans = thisTop.getTrans()
        if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
          getSvgMain().zoomToTrgMain({
            target: 'init',
            scale: zoomD.len['0.0'],
            durFact: 1
          })
        }
      }

      return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function zoomSyncMini(trans) {
      if (!locker.isFreeV(['zoomSyncMain', 'zoomSyncMini', 'inZoomMini'])) return

      locker.add({ id: 'zoomSyncMini', override: true })
      function funcEnd() {
        locker.remove('zoomSyncMini')
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
        svg: gMiniD.gMini,
        svgZoom: com.svgZoom,
        svgBox: gMiniD.gBase,
        svgZoomNode: gMiniD.zoomNode,
        isStatic: thisTop.staticZoom,
      }

      doZoomToTarget(outD)
      
      return
    }
    thisTop.zoomSyncMini = zoomSyncMini



    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    com.svgZoom = d3.zoom()
    com.svgZoom.scaleExtent(zoomD.scaleExtent)
    com.svgZoom.on('start', svgZoomStart)
    com.svgZoom.on('zoom', svgZoomDuring)
    com.svgZoom.on('end', svgZoomEnd)

    gMiniD.gMini
      .call(com.svgZoom)
      .on('dblclick.zoom', null)
      .on('wheel', function () {
        d3.event.preventDefault()
      })
      .on("mousedown.zoom", null)


    // ------------------------------------------------------------------
    // save the svg node to use for d3.zoomTransform() later
    // ------------------------------------------------------------------
    gMiniD.zoomNode = gMiniD.gMini.nodes()[0]

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    getScale = function () {
      return d3.zoomTransform(gMiniD.zoomNode).k
    }
    getTrans = function () {
      return [
        d3.zoomTransform(gMiniD.zoomNode).x,
        d3.zoomTransform(gMiniD.zoomNode).y
      ]
    }

    thisTop.getScale = getScale
    thisTop.getTrans = getTrans

    // add one rectangle as background
    // ------------------------------------------------------------------
    gMiniD.gBase
      .append('g')
      .selectAll('rect')
      .data([0])
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', baseH)
      .attr('height', baseH)
      .attr('stroke', '#383B42')
      .attr('stroke-width', 2)
      .attr('fill', '#383B42')


    // ------------------------------------------------------------------
    // add one circle as background
    // ------------------------------------------------------------------
    gMiniD.gBase
      .append('g')
      .selectAll('circle')
      .data([0])
      .enter()
      .append('circle')
      .attr('r', 0)
      .attr('cx', baseH / 2)
      .attr('cy', baseH / 2)
      .attr('fill', '#F2F2F2')
      .transition('inOut')
      .duration(timeD.animArc / 3)
      .attr('r', baseH / 2.1)

    // the background grid
    bckPattern({
      com: com,
      gNow: gMiniD.gBase,
      gTag: 'gBaseMini',
      lenWH: [baseH, baseH],
      opac: 0.2,
      hexR: 50
    })

    com.gBaseMini = {}
    com.gBaseMini.circ = gMiniD.gBase.append('g')
    com.gBaseMini.rect = gMiniD.gBase.append('g')
    com.gBaseMini.vor = gMiniD.gBase.append('g')
  }
  // this.createMiniMap = createMiniMap
 
  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function updateMiniMap (optIn) {
    let dataV = telData.tel
    let gNow = com.gBaseMini.circ
    let posTag = 'mini'
    let tagNow = prop0

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
      .style('opacity', '1')
      .attr('r', function (d) {
        return telData[posTag][d.id].r * rScale[0].health2
      })
      .style('stroke-width', '0.5')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('transform', function (d) {
        return (
          'translate(' +
          telData[posTag][d.id].x +
          ',' +
          telData[posTag][d.id].y +
          ')'
        )
      })
      .merge(circ)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('transform', function (d) {
        return (
          'translate(' +
          telData[posTag][d.id].x +
          ',' +
          telData[posTag][d.id].y +
          ')'
        )
      })
      .style('fill', function (d) {
        return telHealthCol(d[tagNow])
      })
      .style('stroke', function (d) {
        return telHealthCol(d[tagNow], 0.5)
      })
  }
  thisTop.updateMiniMap = updateMiniMap
  
  // ------------------------------------------------------------------
  //  Blue square on miniMap
  // ------------------------------------------------------------------
  function miniZoomViewRec () {
    runLoop.push({ tag: 'miniZoomViewRec' })
  }
  thisTop.miniZoomViewRec = miniZoomViewRec
  
  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function miniZoomViewRecOnce () {
    if (
      !locker.isFreeV([
        'autoZoomTarget',
        'zoomToTargetMini',
      ])
    ) {
      miniZoomViewRec()
      return
    }
    let tagNow = 'miniZoomViewRec'
    let scale = getScale()
    let trans = getTrans()
    let data = []

    if (scale < (isSouth ? 2 : 1.5)) {
      scale = 1
      trans = [0, 0]
    } else data = [{ id: 0 }]

    let w =
      (1 + (isSouth ? 2 * scale / zoomLen['1.3'] : 0)) * baseH / scale
    let h =
      (1 + (isSouth ? 2 * scale / zoomLen['1.3'] : 0)) * baseH / scale
    let x = (baseH / 2 - trans[0]) / scale - w / 2
    let y = (baseH / 2 - trans[1]) / scale - h / 2

    let strkW = 1 + 0.1 * scale / (zoomLen['1.3'] - zoomLen['0.0'])
    let opac = 0.95 * Math.sqrt(scale / (zoomLen['1.3'] - zoomLen['0.0']))

    // operate on new elements only
    let rect = com.gBaseMini.rect
      .selectAll('rect.' + tagNow)
      .data(data, function (d) {
        return d.id
      })

    rect
      .enter()
      .append('rect')
      .attr('class', tagNow)
      .style('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .attr('stroke', d3.rgb(miniMapCol.b).darker(0.5))
      .attr('stroke-width', '1')
      .attr('fill', miniMapCol.b) // .attr("fill", "red")
      .attr('vector-effect', 'non-scaling-stroke')
      .merge(rect)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .attr('stroke-width', strkW)
      .style('opacity', 1)
      .style('fill-opacity', opac)
      .attr('stroke-opacity', opac)

    rect
      .exit()
      .transition('out')
      .duration(timeD.animArc)
      .style('opacity', '0')
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .remove()
  }
  
  // ------------------------------------------------------------------
  //  Zoom to target when click on miniMap
  // ------------------------------------------------------------------
  function miniZoomClick () {
    // let tagNow = 'miniZoomClick'

    let vorFunc = d3
      .voronoi()
      .x(function (d) {
        return d.x
      })
      .y(function (d) {
        return d.y
      })
      .extent([[0, 0], [baseH, baseH]])

    com.gBaseMini.vor
      .selectAll('path')
      .data(vorFunc.polygons(telData.vor.data))
      .enter()
      .append('path')
      .style('fill', 'transparent')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('stroke-width', 0)
      .style('opacity', 0)
      .style('stroke', '#383B42')
      // .style("opacity", "0.25").style("stroke-width", "0.75").style("stroke", "#E91E63")//.style("stroke", "white")
      .call(function (d) {
        d.attr('d', vorPloyFunc)
      })
      .on('click', function (d) {
        telData.vorDblclick({ 
          source: 'minizoomclick', d: d, isInOut: false,
        })
        return
      })
      // .on("click", function(d) {
      //   let scaleToZoom = telData.vorDblclick({d:d, isInOut:false });
      //   thisTop.zoomToTrgQuick({ target:d.data.id, scale:scaleToZoom, durFact:-1 });
      // })
      // .on("dblclick", function(d) {  // dousnt work well...
      //   let scaleToZoom = telData.vorDblclick({d:d, isInOut:true });
      //   thisTop.zoomToTrgQuick({ target:d.data.id, scale:scaleToZoom, durFact:-1 });
      // })
      .on('mouseover', function (d) {
        thisTop.target = d.data.id
      })
  }

  // ------------------------------------------------------------------
  //  Global function
  // ------------------------------------------------------------------
  function initData (dataIn) {
    if (thisTop.hasInit) return
    thisTop.hasInit = true

    telData = dataIn.instrumentData
    telTypeV = dataIn.telTypeV

    createMiniMap()
    gTrans()

    // initialize the target name for hovering->zoom
    thisTop.target = zoomTarget
    // programatic zoom to some target and scale - only use the last of any set of ovelapping zoom requests
    runLoop.init({
      tag: zoomToTargetTag.mini,
      func: doZoomToTarget,
      nKeep: -1
    })

    // // the actual function to be called when a zoom needs to be put in the queue
    // zoomToTrgQuick = function (optIn) {
    //   console.log('zoomToTrgQuick',optIn)
    //   zoomToTargetNow(optIn, 'mini')
    // }
    // thisTop.zoomToTrgQuick = zoomToTrgQuick

    // // the background grid
    // bckPattern({
    //   com:com, gNow:gMiniD.svgChes, gTag:"gChes", lenWH:[baseH,baseH],
    //   opac:0.1, textureOrient:"5/8", textureSize:120
    // });
    runLoop.init({
      tag: 'miniZoomViewRec',
      func: miniZoomViewRecOnce,
      nKeep: 1
    })
    miniZoomViewRec()
    miniZoomClick()

    setStateOnce(dataIn)
    
    locker.remove('inInitMini')
  }
  thisTop.initData = initData
  
  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function setStateOnce (dataIn) {
    updateMiniMap({
      dataV: telData.tel,
      gNow: com.gBaseMini.circ,
      posTag: 'mini'
    })
  }
  thisTop.setStateOnce = setStateOnce

  // // ------------------------------------------------------------------
  // // initialize a global function (to be overriden below)
  // // ------------------------------------------------------------------
  // let zoomToTrgQuick = function (optIn) {
  //   if (!locker.isFree('inInit')) {
  //     setTimeout(function () {
  //       zoomToTrgQuick(optIn)
  //     }, timeD.waitLoop)
  //   }
  // }
  // thisTop.zoomToTrgQuick = zoomToTrgQuick
  

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  // initialize a couple of functions to be overriden below
  let getScale = function () {
    return zoomLen['0.0']
  }
  thisTop.getScale = getScale
  
  let getTrans = function () {
    return [0, 0]
  }
  thisTop.getTrans = getTrans

  return
}

