'use strict'
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// stric mode for the following script or function (must come at the very begining!)
// see: http://www.w3schools.com/js/js_strict.asp
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// mainScriptTag used locally (will be overriden by other scripts...)
// must be compatible with the name of this js file, according to:
//    "/js/widget_"+mainScriptTag+".js"
var mainScriptTag = 'arrZoomer'
// ------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global hasVar */
/* global RunLoop */
/* global Locker */
/* global unique */
/* global appendToDom */
/* global runWhenReady */
/* global ArrZoomerBase */

window.loadScript({
  source: mainScriptTag,
  script: '/js/arrZoomer/utils_arrZoomerBase.js'
})

// ------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 2
  let w0 = 12
  let divKey

  optIn.widgetFunc = { SockFunc: sockArrZoomer, MainFunc: mainArrZoomer }
  optIn.widgetDivId = optIn.widgetId + 'widgetDiv'
  optIn.eleProps = {}

  divKey = 'arrZoomerDiv'
  optIn.eleProps[divKey] = {
    autoPos: true,
    isDarkEle: true,
    gsId: optIn.widgetDivId + divKey,
    x: x0,
    y: y0,
    w: w0,
    h: h0,
    content: "<div id='" + optIn.baseName + divKey + "'></div>"
  }

  sock.addToTable(optIn)

  return
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
let sockArrZoomer = function (optIn) {
  return
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
let mainArrZoomer = function (optIn) {
  let thisTop = this
  let myUniqueId = unique()
  let widgetType = optIn.widgetType
  let widgetSource = optIn.widgetSource
  let tagArrZoomerSvg = optIn.baseName
  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  let isSouth = window.__nsType__ === 'S'

  let sgvTag = {}
  $.each(widgetEle, function (index, eleNow) {
    sgvTag[eleNow.id] = {
      id: tagArrZoomerSvg + eleNow.id,
      widget: eleNow.widget,
      whRatio: eleNow.w / eleNow.h
    }
  })

  // let lenD = { w: 500, h: 400 }
  let lenD = { w: 500, h: 350 }
  let arrZoomerLockInitKey = 'inInitArrZoomer' + myUniqueId


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  let arrZoomerEleOpts = {
    doEle: {
      main: true,
      ches: true,
      mini: true,
      tree: true,
      lens: !true,
    },
    trans: {
      main: 'translate(0,100)scale(2.5)',
      ches: 'translate(110,0)scale(3.8)',
      tree: 'translate(250,100)scale(2.5)',
      mini: 'translate(5,0)scale(1)',
      lens: 'translate(10,5)scale(0.18)',
      // mini: 'translate(240,0)scale(2.7)',
      // lens: 'translate(245,5)scale(0.60)',
    },
    main:{
      // dblclickZoomInOut: false,
    },
    ches:{
      // myOpt: 0,
    },
    mini:{
      // staticZoom: false,
    },
    tree: {
      // aspectRatio: 6/5,
    },
    lens: {
      aspectRatio: 4,
      hasTitles: true,
      // pointerEvents: true,
    },
  }

  // ------------------------------------------------------------------
  // delay counters
  // ------------------------------------------------------------------
  let locker = new Locker()
  locker.add('inInit')
  locker.add(arrZoomerLockInitKey)

  // function loop
  let runLoop = new RunLoop({ tag: widgetId })

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function initData (dataDictIn) {
    if (sock.multipleInit({ id: widgetId, data: dataDictIn })) {
      return
    }

    // ------------------------------------------------------------------
    // create the main svg element
    // ------------------------------------------------------------------
    let svgDivId = sgvTag.arrZoomerDiv.id + '_svg'
    let svgDiv = sgvTag.arrZoomerDiv.widget.getEle(svgDivId)

    if (!hasVar(svgDiv)) {
      let parent = sgvTag.arrZoomerDiv.widget.getEle(sgvTag.arrZoomerDiv.id)
      let svgDiv = document.createElement('div')
      svgDiv.id = svgDivId

      appendToDom(parent, svgDiv)

      runWhenReady({
        pass: function () {
          return hasVar(sgvTag.arrZoomerDiv.widget.getEle(svgDivId))
        },
        execute: function () {
          initData(dataDictIn)
        }
      })

      return
    }
    sock.emitMouseMove({ eleIn: svgDiv, data: { widgetId: widgetId } })
    sock.setBadgeIcon({ nIcon: dataDictIn.nIcon, iconDivV: iconDivV })

    // ------------------------------------------------------------------
    // create the main svg element
    // ------------------------------------------------------------------
    let svg = d3
      .select(svgDiv)
      .style('background', '#383B42')
      .append('svg')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', '0 0 ' + lenD.w + ' ' + lenD.h)
      .style('position', 'relative')
      .style('width', '100%')
      .style('height', '100%')
      .style('top', '0px')
      .style('left', '0px')
      // .attr("viewBox", "0 0 "+lenD.w+" "+lenD.h * whRatio)
      // .classed("svgInGridStack_inner", true)
      .style('background', '#383B42')
      // .style("background", "red").style("border","2px solid red")
      .on('dblclick.zoom', null)
      .on('wheel', function () {
        d3.event.preventDefault()
      })


    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    let arrZoomerBase = new ArrZoomerBase({
      runLoop: runLoop,
      sgvTag: sgvTag,
      widgetId: widgetId,
      widgetSource: widgetSource,
      locker: locker,
      isSouth: isSouth,
      widgetType: widgetType,
      sock: sock,
      eleOpts: arrZoomerEleOpts,
      lockInitKey: arrZoomerLockInitKey,
      svg: svg,
    })
    arrZoomerBase.initData(dataDictIn.data.arrZoomer)


    // ------------------------------------------------------------------
    // expose the sync function
    // ------------------------------------------------------------------
    function syncStateGet (dataIn) {
      arrZoomerBase.syncStateGet(dataIn)
      return
    }
    thisTop.syncStateGet = syncStateGet

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    runWhenReady({
      pass: function () {
        return locker.isFreeV([
          arrZoomerLockInitKey,
          'dataChange',
          'setStateLock'
        ])
      },
      execute: function () {
        locker.remove('inInit')
      }
    })

    // // ------------------------------------------------------------------
    // // ------------------------------------------------------------------
    // console.log('XXzoomToTrgMainXX')
    // arrZoomerBase.getEle('main').zoomToTrgMain({ target:'M_9',  scale:arrZoomerBase.zoomD.len["1.2"], durFact:0.1 });
    // arrZoomerBase.getEle('main').zoomToTrgMain({ target:'Lx00',  scale:arrZoomerBase.zoomD.len["1.2"], durFact:1.5 });
    // arrZoomerBase.getEle('main').zoomToTrgMain({ target:'init', scale:arrZoomerBase.zoomD.len["0.0"], durFact:0.1 });
    // // ------------------------------------------------------------------
    // // ------------------------------------------------------------------
    
    return
  }
  thisTop.initData = initData

  return
}









