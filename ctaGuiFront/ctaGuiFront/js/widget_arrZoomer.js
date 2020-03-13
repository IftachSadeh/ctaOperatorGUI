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
/* global timeD */
/* global hasVar */
/* global tau */
/* global RunLoop */
/* global Locker */
/* global deepCopy */
/* global unique */
/* global appendToDom */
/* global runWhenReady */
/* global doZoomToTarget */
/* global telHealthCol */
/* global bckPattern */
/* global telInfo */
/* global vorPloyFunc */
/* global getNodeWidthById */
/* global getNodeHeightById */
/* global telHealthFrac */
/* global ArrZoomerBase */
/* global ArrZoomerMain */
/* global ArrZoomerMini */
/* global ArrZoomerChes */
/* global ArrZoomerDetail */

// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
window.loadScript({
  source: mainScriptTag,
  script: '/js/arrZoomer/utils_arrZoomerBase.js'
})
window.loadScript({
  source: mainScriptTag,
  script: '/js/arrZoomer/utils_arrZoomerMain.js'
})
window.loadScript({
  source: mainScriptTag,
  script: '/js/arrZoomer/utils_arrZoomerMini.js'
})
window.loadScript({
  source: mainScriptTag,
  script: '/js/arrZoomer/utils_arrZoomerChes.js'
})
window.loadScript({
  source: mainScriptTag,
  script: '/js/arrZoomer/utils_arrZoomerDetail.js'
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

  // console.log(optIn)
  sock.addToTable(optIn)
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
let sockArrZoomer = function (optIn) {
  let widgetType = optIn.widgetType
  let widgetSource = optIn.widgetSource

  // ------------------------------------------------------------------
  // update the state of this widget in the server
  // ------------------------------------------------------------------
  this.setWidgetZoomState = function (optIn) {
    if (sock.conStat.isOffline()) return

    let data = {}
    data.widgetId = optIn.widgetId
    data.zoomState = optIn.zoomState
    data.zoomTarget = optIn.zoomTarget
    data.zoomTargetProp = optIn.zoomTargetProp

    let dataEmit = {
      widgetSource: widgetSource,
      widgetName: widgetType,
      widgetId: data.widgetId,
      methodName: 'arrZoomerSetWidgetState',
      methodArgs: data
    }

    sock.socket.emit('widget', dataEmit)
  }

  // ------------------------------------------------------------------
  // ask for update for state1 data for a given module
  // ------------------------------------------------------------------
  this.askDataS1 = function (optIn) {
    if (sock.conStat.isOffline()) return

    let data = {}
    data.widgetId = optIn.widgetId
    data.zoomState = optIn.zoomState
    data.zoomTarget = optIn.zoomTarget

    let dataEmit = {
      widgetSource: widgetSource,
      widgetName: widgetType,
      widgetId: data.widgetId,
      methodName: 'arrZoomerAskDataS1',
      methodArgs: data
    }

    sock.socket.emit('widget', dataEmit)
  }


  return
}













// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
let mainArrZoomer = function (optIn) {
  let thisTop = this
  let myUniqueId = unique()
  let widgetType = optIn.widgetType
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

  let lenD = { w: [500], h: [400] }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  let telTypeV = telInfo.getIds()



  // ------------------------------------------------------------------
  // delay counters
  // ------------------------------------------------------------------
  let locker = new Locker()
  locker.add('inInit')
  locker.add('inInitMain')
  locker.add('inInitDetail')
  locker.add('inInitMini')
  locker.add('inInitChes')

  let svgBase = null
  let svgMain = null
  let svgDetail = null
  let svgMini = null
  let svgChes = null

  // function loop
  let runLoop = new RunLoop({ tag: widgetId })



  // ------------------------------------------------------------------
  // main initialisation, after first data come in
  // ------------------------------------------------------------------
  // runWhenReady({
  //   pass: function () {
  //     return locker.isFreeV(['initData'])
  //   },
  //   execute: svgNewInit
  // })






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
      .attr('viewBox', '0 0 ' + lenD.w[0] + ' ' + lenD.h[0])
      .style('position', 'relative')
      .style('width', '100%')
      .style('height', '100%')
      .style('top', '0px')
      .style('left', '0px')
      // .attr("viewBox", "0 0 "+lenD.w[0]+" "+lenD.h[0] * whRatio)
      // .classed("svgInGridStack_inner", true)
      .style('background', '#383B42')
      // .style("background", "red").style("border","2px solid red")
      .on('dblclick.zoom', null)
      .on('wheel', function () {
        d3.event.preventDefault()
      })


    // ------------------------------------------------------------------
    // background container & zoom behaviour
    // ------------------------------------------------------------------
    let dataIn = dataDictIn.data.arrZoomer

    let doSvgMain = true
    let doSvgChes = true
    let doSvgMini = true
    let doSvgDetail = true

    svgBase = new ArrZoomerBase({
      runLoop: runLoop,
      widgetId: widgetId,
      locker: locker,
      isSouth: isSouth,
      widgetType: widgetType,
      sock: sock,
      svg: svg,
    })
    svgBase.initData(dataIn)

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (doSvgMain) {
      svgMain = new ArrZoomerMain({
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        myUniqueId: myUniqueId,
        widgetType: widgetType,
        svgBase: svgBase,
      })
      svgMain.initData(dataIn)

      svgMain.setTransform('translate(0,100)scale(2.5)')
    } else {
      locker.remove('inInitMain')
    }
    
    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (doSvgDetail) {
      svgDetail = new ArrZoomerDetail({
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        myUniqueId: myUniqueId,
        aspectRatio: 600/500,
        svgBase: svgBase,
      })
      svgDetail.initData(dataIn)

      svgDetail.setTransform('translate(250,100)scale(2.5)')
    } else {
      locker.remove('inInitDetail')
    }
    
    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (doSvgChes) {
      svgChes = new ArrZoomerChes({
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        svgBase: svgBase,
      })
      svgChes.initData({
        instrumentData: {
          tel: svgBase.instruments.data.tel,
          // vor: { data: svgBase.instruments.data.vor.data },
          mini: svgBase.instruments.data.mini,
          xyr: svgBase.instruments.data.xyr,
          vorDblclick: svgBase.instruments.data.vorDblclick
        },
        telTypeV: telTypeV
      })

      svgChes.setTransform('translate(100,0)scale(4)')
    } else {
      locker.remove('inInitChes')
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (doSvgMini) {
      svgMini = new ArrZoomerMini({
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        myUniqueId: myUniqueId,
        svgBase: svgBase,
      })
      svgMini.initData({
        instrumentData: {
          tel: svgBase.instruments.data.tel,
          vor: { data: svgBase.instruments.data.vor.data },
          mini: svgBase.instruments.data.mini,
          xyr: svgBase.instruments.data.xyr,
          vorDblclick: svgBase.instruments.data.vorDblclick
        },
        telTypeV: telTypeV
      })

      svgMini.setTransform('translate(0,0)scale(1)')
    } else {
      locker.remove('inInitMini')
    }


    // ------------------------------------------------------------------
    // expose the sync function
    // ------------------------------------------------------------------
    function syncStateGet (dataIn) {
      svgBase.syncStateGet(dataIn)
      return
    }
    thisTop.syncStateGet = syncStateGet

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    // if (locker.isFree('inInit') && hasVar(dataIn.arrProp.type)) {
    //   console.error('double init ?!?!', dataIn)
    //   updateData(dataIn.arrProp)
    // }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    runWhenReady({
      pass: function () {
        return locker.isFreeV([
          'inInitMain',
          'inInitChes',
          'inInitMini',
          'inInitDetail',
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
    // svgMain.zoomToTrgMain({ target:'M_9',  scale:zoomD.len["1.2"], durFact:0.1 });
    // svgMain.zoomToTrgMain({ target:'Lx00',  scale:svgBase.zoomD.len["1.2"], durFact:0.61 });
    // svgMain.zoomToTrgMain({ target:'init', scale:zoomD.len["0.0"], durFact:0.1 });
    // // ------------------------------------------------------------------
    // // ------------------------------------------------------------------
    
    return
  }
  thisTop.initData = initData

  return
}









