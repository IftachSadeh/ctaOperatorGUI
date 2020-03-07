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
/* global ArrZoomerMain */
/* global ArrZoomerDetail */
/* global ArrZoomerMini */
/* global ArrZoomerChes */

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
  script: '/js/utils_arrZoomerMain.js'
})
window.loadScript({
  source: mainScriptTag,
  script: '/js/utils_arrZoomerDetail.js'
})
window.loadScript({
  source: mainScriptTag,
  script: '/js/utils_arrZoomerQuickMap.js'
})

// ------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let doSvgDetail = true
  let svgDetailOnRight = true
  let doSvgQuick = true

  let x0 = 0
  let y0 = 0
  let h0 = 2
  let w0 = 12
  let divKey

  optIn.setupData = {
    doSvgDetail: doSvgDetail,
    svgDetailOnRight: svgDetailOnRight,
    doSvgQuick: doSvgQuick
  }

  optIn.widgetFunc = { SockFunc: sockArrZoomer, MainFunc: mainArrZoomer }
  optIn.widgetDivId = optIn.widgetId + 'widgetDiv'
  optIn.eleProps = {}



  w0 = 12
  divKey = 'mainNEW'
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
  y0 += 2
  w0 = 12



  // if (doSvgQuick) {
  //   divKey = 'quick'
  //   optIn.eleProps[divKey] = {
  //     autoPos: true,
  //     isDarkEle: true,
  //     gsId: optIn.widgetDivId + divKey,
  //     x: x0,
  //     y: y0,
  //     w: w0,
  //     h: h0,
  //     content: "<div id='" + optIn.baseName + divKey + "'></div>"
  //   }
  // }

  // if (doSvgDetail) {
  //   if (svgDetailOnRight) {
  //     w0 = 6
  //     h0 = 6
  //   }
  // }
  // y0 += 2

  // divKey = 'main'
  // optIn.eleProps[divKey] = {
  //   autoPos: true,
  //   isDarkEle: true,
  //   gsId: optIn.widgetDivId + divKey,
  //   x: x0,
  //   y: y0,
  //   w: w0,
  //   h: h0,
  //   content: "<div id='" + optIn.baseName + divKey + "'></div>"
  // }

  // if (doSvgDetail) {
  //   divKey = 'detail'
  //   optIn.eleProps[divKey] = {
  //     autoPos: true,
  //     isDarkEle: true,
  //     gsId: optIn.widgetDivId + divKey,
  //     x: x0,
  //     y: y0,
  //     w: w0,
  //     h: h0,
  //     content: "<div id='" + optIn.baseName + divKey + "'></div>"
  //   }
  // }

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

  // ------------------------------------------------------------------
  // get update for state1 data which was explicitly asked for by a given module
  // ------------------------------------------------------------------
  sock.socket.on('arrZoomerGetDataS1', function (data) {
    if (sock.conStat.isOffline()) return

    if (data.id !== '' && data.type === 's11') {
      // console.log('-server- getDataS1 ',data);
      if (hasVar(sock.widgetV[widgetType].widgets[data.widgetId])) {
        sock.widgetV[widgetType].widgets[data.widgetId].getDataS1(
          data.widgetId,
          data
        )
      }
    }
  })

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  sock.socket.on('arrZoomerUpdateData', function (data) {
    if (sock.conStat.isOffline()) return

    $.each(sock.widgetV[widgetType].widgets, function (widgetIdNow, modNow) {
      if (data.sessWidgetIds.indexOf(widgetIdNow) >= 0) {
        sock.widgetV[widgetType].widgets[widgetIdNow].updateData(data)
      }
    })
  })
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
let mainArrZoomer = function (optIn) {
  let myUniqueId = unique()
  let widgetType = optIn.widgetType
  let tagArrZoomerSvg = optIn.baseName
  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  let thisArrZoomer = this
  let isSouth = window.__nsType__ === 'S'

  let doSvgDetail = optIn.setupData.doSvgDetail
  let svgDetailOnRight = optIn.setupData.svgDetailOnRight
  let doSvgQuick = optIn.setupData.doSvgQuick

  let sgvTag = {}
  $.each(widgetEle, function (index, eleNow) {
    sgvTag[eleNow.id] = {
      id: tagArrZoomerSvg + eleNow.id,
      widget: eleNow.widget,
      whRatio: eleNow.w / eleNow.h
    }
  })

  let svgMainArrZoomer = {}
  svgMainArrZoomer.main = {}
  svgMainArrZoomer.detail = {}
  svgMainArrZoomer.mini = {}
  svgMainArrZoomer.ches = {}

  // svgMainArrZoomer.detail.g.attr('transform', function (d) {
  //   return 'translate(20,20)scale(0.8)'
  // })

  let lenD = {}
  lenD.w = {}
  lenD.h = {}

  lenD.w[0] = 500
  lenD.h[0] = 500
  

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  let telTypeV = telInfo.getIds()

  let zoomD = {}
  zoomD.target = ''


  let instruments = {}
  instruments.props = {}
  instruments.props0 = {}
  instruments.tauFracs = {}
  instruments.propTitles = {}
  instruments.allIds = []
  instruments.allIds0 = []
  instruments.allProps = []
  instruments.allProps0 = []
  instruments.prop0 = 'health'
  instruments.propTitle0 = 'Health'
  instruments.tauSpace = tau / 50

  instruments.data = {}
  instruments.data.tel = []
  instruments.data.idToIndex = {}
  instruments.data.dataBaseS1 = {}
  instruments.data.propDataS1 = {}
  instruments.data.propParentS1 = {}
  instruments.data.propTitleS1 = {}

  instruments.focus = {}

  instruments.rScale = {}
  instruments.rScale[0] = {}
  instruments.rScale[1] = {}

  instruments.rScale[0].health0 = 1.1
  instruments.rScale[0].health1 = 1.2
  instruments.rScale[0].health2 = 1.35
  instruments.rScale[0].line0 = 1.2
  instruments.rScale[0].line1 = 1.8
  instruments.rScale[0].percent = 0.6
  instruments.rScale[0].label = 1.95
  instruments.rScale[0].title = 2.05

  instruments.rScale[1].health0 = 1.5
  instruments.rScale[1].health1 = 1.65
  instruments.rScale[1].innerH0 = 1.25
  instruments.rScale[1].innerH1 = 1.3


  // ------------------------------------------------------------------
  // delay counters
  // ------------------------------------------------------------------
  let locker = new Locker()
  locker.add('inInit')
  locker.add('inPropInit')
  locker.add('inNewSvgInit')
  locker.add('inInitMain')
  locker.add('inInitDetail')

  let svgMain = null
  let svgDetail = null
  let svgMini = null
  let svgChes = null

  // ------------------------------------------------------------------
  // main initialisation, after first data come in
  // ------------------------------------------------------------------
  function svgNewInit () {
    // console.log(' == svgNewInit ==')
    svgMain = new ArrZoomerMain({
      runLoop: runLoop,
      sgvTag: sgvTag,
      widgetId: widgetId,
      locker: locker,
      isSouth: isSouth,
      myUniqueId: myUniqueId,
      widgetType: widgetType,
      arrZoomerBase: thisArrZoomer,
      svgMainArrZoomer: svgMainArrZoomer,
      instruments: instruments,
      zoomD: zoomD,
    })
    thisArrZoomer.svgMain = svgMain
    
    if (doSvgDetail) {
      svgDetail = new ArrZoomerDetail({
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        aspectRatio: 1,
        arrZoomerBase: thisArrZoomer,
        svgMain: svgMain,
        svgMainArrZoomer: svgMainArrZoomer,
        instruments: instruments,
        zoomD: zoomD,
      })
      thisArrZoomer.svgDetail = svgDetail
    } else {
      locker.remove('inInitDetail')
    }
    
    if (doSvgQuick) {
      svgChes = new ArrZoomerChes({
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        arrZoomerBase: thisArrZoomer,
        svgMainArrZoomer: svgMainArrZoomer,
        instruments: instruments,
      })
      thisArrZoomer.svgChes = svgChes

      console.log('44444444444444')
      svgChes.getG().attr('transform', function (d) {
        return 'translate(100,0)scale(4)'
      })
     

      svgMini = new ArrZoomerMini({
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        myUniqueId: myUniqueId,
        arrZoomerBase: thisArrZoomer,
        svgMainArrZoomer: svgMainArrZoomer,
        instruments: instruments,
        zoomD: zoomD,
      })
      thisArrZoomer.svgMini = svgMini

      console.log('222222222222222')
      svgMini.getG().attr('transform', function (d) {
        return 'translate(100,0)scale(1.5)'
      })

    }

    locker.remove('inNewSvgInit')

    // // ------------------------------------------------------------------
    // // ------------------------------------------------------------------
    // svgMain.zoomToTrgMain({ target:'M_9',  scale:zoomD.len["1.2"], durFact:0.1 });
    // svgMain.zoomToTrgMain({ target:'init', scale:zoomD.len["0.0"], durFact:0.1 });
    // svgMain.zoomToTrgMain({ target:'Lx00',  scale:zoomD.len["1.2"], durFact:2.0 }); console.log('FAKE-START')
    // // ------------------------------------------------------------------
    // // ------------------------------------------------------------------
  }
  runWhenReady({
    pass: function () {
      return locker.isFreeV(['inPropInit'])
    },
    execute: svgNewInit
  })

  // function loop
  let runLoop = new RunLoop({ tag: widgetId })

  let interpolate01 = d3.interpolate(0, 1)
  thisArrZoomer.interpolate01 = interpolate01



  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function initInstProps (dataIn) {
    instruments.allProps0.push(instruments.prop0)
    instruments.allIds0.push('')
    instruments.props[''] = []
    instruments.props0[''] = [instruments.prop0]
    instruments.propTitles[''] = {}

    // --FIXME-- currently sorting by the property name, but
    // should actually be by property title ...
    function propSort (arrIn) {
      arrIn.sort().sort(function (a, b) {
        if (a === instruments.prop0) return -1
        else return 1
      })
    }
    function propSortV (arrInV) {
      $.each(arrInV, function (i, arrNow) {
        propSort(arrNow)
      })
    }

    $.each(dataIn, function (idNow, typeV) {
      instruments.props[idNow] = []
      instruments.props0[idNow] = [instruments.prop0]
      instruments.propTitles[idNow] = {}

      instruments.allIds.push(idNow)
      instruments.allIds0.push(idNow)

      $.each(typeV, function (i, typeNow) {
        instruments.props[idNow].push(typeNow.id)
        instruments.props0[idNow].push(typeNow.id)
        instruments.propTitles[idNow][typeNow.id] = typeNow.title

        if (instruments.props[''].indexOf(typeNow.id) === -1) {
          instruments.props[''].push(typeNow.id)
          instruments.props0[''].push(typeNow.id)
          instruments.propTitles[''][typeNow.id] = typeNow.title
        }

        if (instruments.allProps.indexOf(typeNow.id) === -1) {
          instruments.allProps.push(typeNow.id)
          instruments.allProps0.push(typeNow.id)
        }
      })
      propSortV([instruments.props[idNow], instruments.props0[idNow]])

      instruments.propTitles[idNow][instruments.prop0] = instruments.propTitle0
      instruments.tauFracs[idNow] = tau / instruments.props[idNow].length
      instruments.propTitles[''][instruments.prop0] = instruments.propTitle0
    })
    instruments.tauFracs[''] = tau / instruments.props[''].length

    propSortV([instruments.props[''], instruments.props0[''], instruments.allProps, instruments.allProps0])

    instruments.props['avg'] = instruments.props[''] // .slice()
    instruments.props0['avg'] = instruments.props0[''] // .slice()
    instruments.tauFracs['avg'] = instruments.tauFracs['']
  }
  thisArrZoomer.initInstProps = initInstProps

  function getTelProps (keys, telId) {
    return keys.filter(function (k) {
      return instruments.props[telId].indexOf(k) !== -1
    })
  }
  thisArrZoomer.getTelProps = getTelProps
  
  function getTauFrac (nProps) {
    return tau / nProps
  }
  thisArrZoomer.getTauFrac = getTauFrac

  function getPropPosShift (xy, r, nPropNow, nProps) {
    let angle = (nPropNow + 0.5) * getTauFrac(nProps) + tau / 4
    let labelX = r * Math.cos(angle)
    let labelY = r * Math.sin(angle)

    if (xy === 'x') return labelX
    if (xy === 'y') return labelY
    else if (xy === 'xy') return [labelX, labelY]
    else return null
  }
  thisArrZoomer.getPropPosShift = getPropPosShift


  // function interpolatePct (origVal, newVal) {
  //   return d3.interpolateRound(+origVal.slice(0, -1), +newVal)
  // }

  zoomD.len = {}
  zoomD.len['0.0'] = 1
  if (isSouth) {
    zoomD.len['0.1'] = 2 // - 0.4
    zoomD.len['0.2'] = 12 // - 4
    zoomD.len['1.0'] = 15 // - 6
    zoomD.len['1.1'] = zoomD.len['1.0'] + 0.1
    zoomD.len['1.2'] = zoomD.len['1.0'] + 2
    zoomD.len['1.3'] = 20
    // zoomD.len["0.1"]  = 4  //- 4
    // zoomD.len["0.2"]  = 10 //- 15.5
    // zoomD.len["1.0"]  = 12 //- 16.5
    // zoomD.len["1.1"]  = zoomD.len["1.0"] + 0.1
    // zoomD.len["1.2"]  = zoomD.len["1.0"] + 2
    // zoomD.len["1.3"]  = 90
  } else {
    zoomD.len['0.1'] = 2 // - 0.4
    zoomD.len['0.2'] = 5 // - 4
    zoomD.len['1.0'] = 6.5 // - 6
    zoomD.len['1.1'] = zoomD.len['1.0'] + 0.1
    zoomD.len['1.2'] = zoomD.len['1.0'] + 1
    zoomD.len['1.3'] = 9
  }
  zoomD.len.prev = zoomD.len['0.0']

  zoomD.scaleExtent = [zoomD.len['0.0'], zoomD.len['1.3']]

  function isStateUp (scale, scaleTag) {
    return zoomD.len.prev < zoomD.len[scaleTag] && scale >= zoomD.len[scaleTag]
  }
  thisArrZoomer.isStateUp = isStateUp

  function isStateDown (scale, scaleTag) {
    return zoomD.len.prev >= zoomD.len[scaleTag] && scale < zoomD.len[scaleTag]
  }
  thisArrZoomer.isStateDown = isStateDown

  function isStateChange (scale, scaleTag) {
    return isStateUp(scale, scaleTag) || isStateDown(scale, scaleTag)
  }
  thisArrZoomer.isStateChange = isStateChange

  // zoomD.len.start = Date.now();

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setTelData (dataIn, isInit) {
    if (isInit) {
      instruments.data.tel = []
      instruments.data.avg = {}
      instruments.data.idToIndex = {}
    }

    $.each(dataIn, function (id, dataNow) {
      // console.log('==',id,dataNow)
      let telD = {}
      telD.id = id

      $.each(instruments.props0[telD.id], function (index, porpNow) {
        telD[porpNow] = hasVar(dataNow[porpNow])
          ? Math.round(dataNow[porpNow])
          : 0
      })

      if (isInit) {
        instruments.data.idToIndex[id] = instruments.data.tel.length
        instruments.data.tel.push(telD)
      } else {
        let origIndex = instruments.data.idToIndex[id]
        instruments.data.tel[origIndex] = telD
      }
    })

    // average of each property
    instruments.data.avg.id = 'avg'
    $.each(instruments.props0[instruments.data.avg.id], function (index, porpNow) {
      instruments.data.avg[porpNow] = 0
      $.each(instruments.data.tel, function (id, dataNow) {
        // console.log('    ++',id,porpNow,dataNow[porpNow])
        if (
          dataNow[porpNow] !== undefined &&
          typeof dataNow[porpNow] === 'number'
        ) {
          instruments.data.avg[porpNow] += dataNow[porpNow]
        }
      })
      // console.log('--',porpNow,instruments.data.avg[porpNow] , instruments.data.tel.length)
      instruments.data.avg[porpNow] /= instruments.data.tel.length
    })
    // console.log('SSS-------------SS',instruments.data, instruments.props0)
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function initData (dataDictIn) {
    if (sock.multipleInit({ id: widgetId, data: dataDictIn }))
      return

    // ------------------------------------------------------------------
    // create the main svg element
    // ------------------------------------------------------------------
    let svgDivId = sgvTag.mainNEW.id + '_svg'
    let svgDiv = sgvTag.mainNEW.widget.getEle(svgDivId)

    if (!hasVar(svgDiv)) {
      let parent = sgvTag.mainNEW.widget.getEle(sgvTag.mainNEW.id)
      let svgDiv = document.createElement('div')
      svgDiv.id = svgDivId

      appendToDom(parent, svgDiv)

      runWhenReady({
        pass: function () {
          return hasVar(sgvTag.mainNEW.widget.getEle(svgDivId))
        },
        execute: function () {
          initData(dataDictIn)
        }
      })

      return
    }
    sock.emitMouseMove({ eleIn: svgDiv, data: { widgetId: widgetId } })

    // ------------------------------------------------------------------
    // background container & zoom behaviour
    // ------------------------------------------------------------------
    // create the main svg element
    // ------------------------------------------------------------------
    svgMainArrZoomer.mainNEWSvg = d3
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

    svgMainArrZoomer.gSvg = svgMainArrZoomer.mainNEWSvg.append('g')













    let dataIn = dataDictIn.data

    initInstProps(dataIn.telPropTypes)

    locker.remove('inPropInit')
    // console.log(' -- FIXME -- startup0 DONE!!!!!!! ')

    function svgDataInit () {
      // console.log(' == svgDataInit ==')
      // fill the local data list - element properties
      setTelData(dataIn.arrProp, true)

      zoomD.target = instruments.data.tel[0].id // arbitrary but safe initialization

      sock.setBadgeIcon({ nIcon: dataDictIn.nIcon, iconDivV: iconDivV })

      // ------------------------------------------------------------------
      //
      // ------------------------------------------------------------------
      svgMain.initData(dataIn)
      if (svgDetail) {
        svgDetail.initData(dataIn)
      }
      if (svgMini) {
        svgMini.initData({
          instrumentData: {
            tel: instruments.data.tel,
            vor: { data: instruments.data.vor.data },
            mini: instruments.data.mini,
            xyr: instruments.data.xyr,
            vorDblclick: instruments.data.vorDblclick
          },
          telTypeV: telTypeV
        })
      }
      if (svgChes) {
        svgChes.initData({
          instrumentData: {
            tel: instruments.data.tel,
            vor: { data: instruments.data.vor.data },
            mini: instruments.data.mini,
            xyr: instruments.data.xyr,
            vorDblclick: instruments.data.vorDblclick
          },
          telTypeV: telTypeV
        })
      }

      if (locker.isFree('inInit') && hasVar(dataIn.arrProp.type)) {
        console.error('double init ?!?!', dataIn)
        updateData(dataIn.arrProp)
      }

      runWhenReady({
        pass: function () {
          return locker.isFreeV([
            'inInitMain',
            'inPropInit',
            'inNewSvgInit',
            'inInitDetail',
            'inInitQuick',
            'dataChange',
            'setStateLock'
          ])
        },
        execute: function () {
          locker.remove('inInit')
        }
      })
    }
    runWhenReady({
      pass: function () {
        return locker.isFreeV(['inNewSvgInit'])
      },
      execute: svgDataInit
    })
  }
  thisArrZoomer.initData = initData

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  // for s0 we acculumate all updates (each one is a subset of all elements which had some change)
  // for s1 we take ony the latest update (each one is a full update of all the data)
  runLoop.init({ tag: '_s00update_', func: updateS0, nKeep: -1, wait: 500 })
  // runLoop.init({ tag:"_s10update_",    func:updateS0,     nKeep:-1, wait:500 });
  runLoop.init({ tag: '_s11update_', func: updateS1, nKeep: 1, wait: 500 })
  runLoop.init({
    tag: 'subArrUpdate',
    func: subArrUpdate,
    nKeep: 1,
    wait: 500
  })

  function updateData (dataIn) {
    if (!locker.isFree('inInit')) return

    // if     (dataIn.type == "s10") { console.log('ask...',dataIn.emitTime); }
    if (dataIn.type === 's00') {
      runLoop.push({ tag: '_s00update_', data: dataIn })
    } else if (dataIn.type === 's11') {
      //, time:dataIn.emitTime
      // else if(dataIn.type == "s10") { runLoop.push({ tag:"_s10update_", data:dataIn, time:dataIn.emitTime }); }
      runLoop.push({ tag: '_s11update_', data: dataIn })
    } else if (dataIn.type === 'subArr') {
      //, time:dataIn.emitTime
      runLoop.push({ tag: 'subArrUpdate', data: dataIn }) //, time:dataIn.emitTime
    } else {
      console.error('undefined tag for dataIn = ', dataIn, ' !!!!!! ')
    }
  }
  thisArrZoomer.updateData = updateData

  // ------------------------------------------------------------------
  // update the data for s0
  // ------------------------------------------------------------------
  function updateS0 (dataIn) {
    if (!locker.isFreeV(['zoom', 'autoZoomTarget', 'dataChange'])) {
      // console.log('delay-s0 ....',dataIn.type,dataIn.emitTime )
      setTimeout(function () {
        updateS0(dataIn)
      }, 10)
      return
    }
    // console.log('do   -s0 ....',dataIn.type,dataIn.emitTime )

    locker.add('dataChange')

    // ------------------------------------------------------------------
    // fill the updated properties (accumilate all updates in order,
    // so that if some id was updated multiple times,
    // the latest value will be kept
    // ------------------------------------------------------------------
    setTelData(dataIn.data, false)

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    setState()

    locker.remove('dataChange')
    // locker.remove({id:"dataChange",delay:1500}); // for testing... never delay this...
  }

  // ------------------------------------------------------------------
  // update the data for s1
  // ------------------------------------------------------------------
  function updateS1 (dataDictIn) {
    if (svgMain.getZoomS() === 0) return

    if (!locker.isFreeV(['zoom', 'autoZoomTarget', 'dataChange'])) {
      setTimeout(function () {
        updateS1(dataDictIn)
      }, 10)
      return
    }

    let dataIn = dataDictIn.data
    let updtData = dataIn.data
    let telId = dataIn.id
    let telIndex = instruments.data.idToIndex[telId]

    // console.log('updateS1',dataIn);

    // if by the time the update has arrived, were already gone from this element...
    if (!hasVar(instruments.data.propDataS1[telId])) {
      // console.log('-+-> updateS1: could not find',telId,'in instruments.data.propDataS1')
      return
    }
    // console.log('````',dataIn,instruments.data.propDataS1[telId]);

    locker.add('dataChange')

    // ------------------------------------------------------------------
    // update the underlying data
    // ------------------------------------------------------------------
    let propsNow = getTelProps(Object.keys(instruments.data.propDataS1[telId]), telId)
    $.each(propsNow, function (index, porpNow) {
      // update the data container with the s0 updated health
      instruments.data.propDataS1[telId][porpNow].val = instruments.data.tel[telIndex][porpNow]

      // now go through the hirch
      let dataNow = instruments.data.propDataS1[telId][porpNow]
      updateDataNow(dataNow)

      function updateDataNow (d) {
        if (hasVar(updtData[d.id])) {
          d.val = updtData[d.id]
          // console.log('upddd',d.id,d)
        }
        if (d.children) {
          d.children.forEach(function (dNow) {
            updateDataNow(dNow)
          })
        }
        // no need to explicitly change the d[childName] element, since it is just a pointer to d[children]
        // let childName = "child_"+d.childDepth
        // if(d[childName]) {
        //   d[childName].forEach(function(dNow) { updateDataNow(dNow); })
        // }
      }
    })

    svgMain.updateS1(dataIn)
    if (svgDetail) {
      svgDetail.updateS1(dataIn)
    }

    locker.remove('dataChange')
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function subArrUpdate (dataIn) {
    if (!locker.isFreeV(['zoom', 'autoZoomTarget', 'dataChange'])) {
      setTimeout(function () {
        subArrUpdate(dataIn)
      }, 10)
      return
    }

    svgMain.setTelLayout({ id: 'subArr', data: dataIn.data, updtId: false })
  }

  function setTelLayout (idNow) {
    svgMain.setTelLayout({ id: idNow, data: null, updtId: true })
  }
  thisArrZoomer.setTelLayout = setTelLayout

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  runLoop.init({ tag: 'setState', func: setStateOnce, nKeep: 1 })

  function setState () {
    runLoop.push({ tag: 'setState' })
  }
  thisArrZoomer.setState = setState

  function setStateOnce () {
    // create delay if currently in data update or a previous call of setStateOnce
    if (!locker.isFreeV(['setStateLock', 'dataChange'])) {
      // console.log('delay setStateOnce',' :',locker.isFree({id:"setStateLock"}),' - dataUpdate:',locker.isFree({id:"setStateLock"}))
      setTimeout(function () {
        setState()
      }, timeD.animArc)
      return
    }
    // console.log("setState");

    locker.add('setStateLock')

    svgMain.setStateOnce()
    if (svgDetail) {
      svgDetail.setStateOnce()
    }
    if (svgMini) {
      svgMini.setStateOnce()
    }
    if (svgChes) {
      svgChes.setStateOnce()
    }

    locker.remove({ id: 'setStateLock', delay: timeD.animArc * 2 })
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  runLoop.init({ tag: '_s1props_', func: propsS1Once, nKeep: -1 })

  function propsS1 (optIn) {
    // console.log('setState',svgMain.getZoomS(),getScale())
    runLoop.push({ tag: '_s1props_', data: optIn })
  }
  // this.propsS1 = propsS1;
  thisArrZoomer.propsS1 = propsS1

  function propsS1Once (optIn) {
    // not sure i need "dataChange" or others here .... FIXME
    if (!locker.isFreeV(['s1propsChange', 'dataChange'])) {
      // console.log('delay propsS1Once....')
      propsS1(optIn)
      return
    }

    locker.add('s1propsChange')

    let doFunc = optIn.doFunc
    let doBckArcClick = hasVar(doFunc)
      ? doFunc.indexOf('bckArcClick') >= 0
      : true
    let doTelHirch = hasVar(doFunc) ? doFunc.indexOf('telHirch') >= 0 : true

    // console.log('propsS1 '+optIn.debug+" :",optIn,doBckArcClick,doTelHirch)

    if (svgDetail) {
      if (doTelHirch) svgDetail.telHirch(optIn)
    }

    if (doBckArcClick) {
      optIn.canIgnore = false
      svgMain.bckArcClick(optIn)
    }

    locker.remove('s1propsChange')
  }

  // ------------------------------------------------------------------
  // activate a listener for getting the s1 data - this is needed in case the same data are sent more
  // then once (can happen if one element is requested, but by the time the transitions to open it
  // has ended, another was already requested too).
  // ------------------------------------------------------------------
  runLoop.init({ tag: '_getDataS1_', func: getDataS1Once, nKeep: 1 })

  function getDataS1 (widgetIdIn, dataIn) {
    // just in case... should not be needed
    if (widgetIdIn !== widgetId) {
      console.error('id mismatch', widgetIdIn, widgetId)
      return
    }
    // console.log('-client- getDataS1',dataIn)

    if (svgMain.getZoomS() === 1) {
      runLoop.push({ tag: '_getDataS1_', data: dataIn }) //, time:dataIn.emitTime
    }
  }
  this.getDataS1 = getDataS1

  function getDataS1Once (dataIn) {
    if (
      svgMain.getZoomS() === 1 &&
      svgMain.syncD.zoomTarget !== dataIn.data.id
    ) {
      svgMain.syncD.zoomTarget = dataIn.data.id

      svgMain.s10main(dataIn.data)

      propsS1({
        telId: dataIn.data.id,
        clickIn: false,
        propIn: '',
        doFunc: ['bckArcClick'],
        debug: 'getDataS1Once'
      })
    }
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  let prevSync = {}
  function syncStateGet (dataIn) {
    if (document.hidden) return
    if (sock.conStat.isOffline()) return

    let sessWidgetIds = dataIn.sessWidgetIds
    if (sessWidgetIds.indexOf(widgetId) < 0 || widgetId === dataIn.widgetId) {
      return
    }

    if (sock.isOldSync(prevSync, dataIn.data)) return
    // console.log('get  -=- ',widgetId,dataIn.data,prevSync[ dataIn.type]);

    prevSync[dataIn.type] = dataIn.data

    let type = dataIn.type
    if (type === 'syncTelFocus') {
      // locker.add("syncStateGet");

      let target = dataIn.data.target
      let zoomState = dataIn.data.zoomState

      let scale = zoomD.len['0.0']
      if (zoomState === 1) scale = zoomD.len['1.0']

      console.log('FIXME - syncTelFocus - uncomment zoomToTrgMain')
      // svgMain.zoomToTrgMain({
      //   target: target,
      //   scale: scale,
      //   durFact: 1,
      //   endFunc: function () {
      //     // locker.remove("syncStateGet");
      //     svgMain.askDataS1()
      //   }
      // })






    }
  }
  this.syncStateGet = syncStateGet

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  runLoop.init({
    tag: 'syncStateSend',
    func: _syncStateSend,
    nKeep: 1,
    wait: timeD.waitSyncState
  })

  function syncStateSend (dataIn) {
    runLoop.push({ tag: 'syncStateSend', data: dataIn })
  }
  thisArrZoomer.syncStateSend = syncStateSend

  function _syncStateSend (dataIn) {
    if (sock.conStat.isOffline()) return

    if (dataIn.type === 'syncTelFocus') {
      if (
        !locker.isFreeV([
          'inInit',
          'zoom',
          'autoZoomTarget',
          'setStateLock',
          'dataChange'
        ])
      ) {
        setTimeout(function () {
          syncStateSend(dataIn)
        }, timeD.animArc)
        return
      }

      if (sock.isSameSync(prevSync, dataIn)) return
    }

    // console.log('send -=- ',widgetId,dataIn,prevSync[ dataIn.type]);
    prevSync[dataIn.type] = dataIn
    sock.sockSyncStateSend({
      widgetId: widgetId,
      type: dataIn.type,
      data: dataIn
    })
  }

  function setZoomState () {
    let dataWidget = {
      widgetId: widgetId,
      zoomState: '',
      zoomTarget: '',
      zoomTargetProp: ''
    }
    let mainWidgetState = svgMain.getWidgetState()
    let detailWidgetState = {}
    if (doSvgDetail) {
      detailWidgetState = svgDetail.getWidgetState()
    } else {
      function getWidgetState () {
        return {
          zoomTargetProp: ''
        }
      }
      detailWidgetState['zoomTargetProp'] = getWidgetState()
    }
    dataWidget['zoomState'] = mainWidgetState['zoomState']
    dataWidget['zoomTarget'] = mainWidgetState['zoomTarget']
    dataWidget['zoomTargetProp'] = detailWidgetState['zoomTargetProp']

    sock.widgetV[widgetType].SockFunc.setWidgetZoomState(dataWidget)

    return dataWidget
  }
  thisArrZoomer.setZoomState = setZoomState


  return
}
