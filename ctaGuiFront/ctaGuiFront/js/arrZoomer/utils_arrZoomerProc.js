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
window.ArrZoomerProc = function (optIn0) {
  let thisTop = this
  let runLoop = optIn0.runLoop
  let sgvTag = optIn0.sgvTag
  let widgetId = optIn0.widgetId
  let locker = optIn0.locker
  let isSouth = optIn0.isSouth
  let myUniqueId = unique()
  let parentUniqueId = optIn0.myUniqueId
  let aspectRatio = hasVar(optIn0.aspectRatio) ? optIn0.aspectRatio : 5

  // let dblclickZoomInOut = hasVar(optIn0.dblclickZoomInOut) ? optIn0.dblclickZoomInOut : true
  
  let eleBase = optIn0.eleBase

  // let instruments = eleBase.instruments
  let zoomD = eleBase.zoomD
  let lockInitKey = eleBase.lockInitKeys.proc

  // let rScale = instruments.rScale

  let baseH = 100
  // let lenBase = 500
  let lenD = {
    w: [baseH * aspectRatio], h: [baseH],
  }

  let com = {}

  // let showVor = false
  thisTop.hasInit = false
  // thisTop.staticZoom = true

  eleBase.setEle(thisTop, 'proc')
  let getEle = eleBase.getEle

  let gProcD = eleBase.svgD.proc
  gProcD.g = eleBase.svgD.gSvg.append('g')
  gProcD.gProc = gProcD.g.append('g')
  // gProcD.gBase = gProcD.gProc.append('g')


  let uniqueClipId = 'clip' + myUniqueId

  gProcD.gOuter = gProcD.gProc.append('g')
  gProcD.gOuter.append('defs')
    .append('clipPath')
    .attr('id', uniqueClipId)
    .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width',lenD.w[0])
      .attr('height',lenD.h[0])

  gProcD.gClipped = gProcD.gOuter.append('g')
  gProcD.gClipped.attr('class', 'gClipped')
    .attr('clip-path', 'url(#'+uniqueClipId+')');

  gProcD.gBase = gProcD.gClipped.append('g')
  gProcD.gS0 = gProcD.gBase.append('g')



  // ------------------------------------------------------------------
  // scale to 100x100 px (executed after createChessMap())
  // ------------------------------------------------------------------
  function gTrans() {
    let scaleProc = 100 / baseH
    gProcD.gProc.attr('transform', function (d) {
      return 'translate(0,0)scale(' + scaleProc + ')'
    })
    return
  }

  // ------------------------------------------------------------------
  // to avoid bugs, this is the g which should be used
  // for translations and sacling of this element
  // ------------------------------------------------------------------
  thisTop.setTransform = function (trans) {
    if (hasVar(trans)) gProcD.g.attr('transform', trans)
    return gProcD.g
  }



  // ------------------------------------------------------------------
  //  Global function
  // ------------------------------------------------------------------
  function initData (dataIn) {
    if (thisTop.hasInit) return
    thisTop.hasInit = true



    // ------------------------------------------------------------------
    // add one rectangle as background, and to allow click to zoom
    // ------------------------------------------------------------------
    gProcD.gS0
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', lenD.w[0])
      .attr('height', lenD.h[0])
      .attr('stroke-width', '0')
      .attr('fill', '#F2F2F2') 
      // .attr("fill", "red")
      .style("stroke",'#383B42' )
      // .style("stroke",'#F2F2F2' )
      // .style("stroke",'#2196F3' )
      .style("stroke-width", 1)
      .on('click', function () {
        // console.log('dddddddddd')
        // let scale = getEle('main').getScale()
        // if (scale >= zoomD.len['0.1'] && scale < zoomD.len['1.0']) {

        //   // console.log('FIXME - tree-0 - uncomment zoomToTrgMain')
        //   getEle('main').zoomToTrgMain({
        //     target: zoomD.target,
        //     scale: zoomD.len['1.2'],
        //     durFact: 1
        //   })
        // }
      })

    // the background grid
    bckPattern({
      com: com,
      gNow: gProcD.gS0,
      gTag: 'gS0',
      lenWH: [lenD.w[0], lenD.h[0]],
      opac: 0.05,
      textureOrient: '1/8'
    })


    
    locker.remove(lockInitKey)
    return
  }
  thisTop.initData = initData
  


  return
}

