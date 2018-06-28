'use strict'
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// stric mode for the following script or function (must come at the very begining!)
// see: http://www.w3schools.com/js/js_strict.asp
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// mainScriptTag used locally (will be overriden by other scripts...)
// must be compatible with the name of this js file, according to:
//    "/js/widget_"+mainScriptTag+".js"
var mainScriptTag = 'arrZoomer'
// ---------------------------------------------------------------------------------------------------

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
/* global colsPurples */
/* global doZoomToTarget */
/* global telHealthCol */
/* global bckPattern */
/* global colsBlues */
/* global telInfo */
/* global moveNodeUp */
/* global vorPloyFunc */
/* global getNodeWidthById */
/* global getNodeHeightById */
/* global telHealthFrac */
/* global  */
/* global  */
/* global  */
/* global  */
/* global  */

// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........
// double check formatting.........

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 2
  let w0 = 12
  let divKey

  optIn.widgetFunc = { SockFunc: sockArrZoomer, MainFunc: mainArrZoomer }
  optIn.widgetDivId = optIn.widgetId + 'widgetDiv'
  optIn.eleProps = {}

  divKey = 'quick'
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

  w0 = 6
  h0 = 6
  y0 += 2

  divKey = 'main'
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

  divKey = 'detail'
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
}

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
let sockArrZoomer = function (optIn) {
  let widgetType = optIn.widgetType
  let widgetSource = optIn.widgetSource

  // ---------------------------------------------------------------------------------------------------
  // update the state of this widget in the server
  // ---------------------------------------------------------------------------------------------------
  this.setWidgetState = function (optIn) {
    if (sock.conStat.isOffline()) return

    let data = {}
    data.widgetId = optIn.widgetId
    data.zoomState = optIn.zoomState
    data.zoomTarget = optIn.zoomTarget

    let dataEmit = {
      widgetSource: widgetSource,
      widgetName: widgetType,
      widgetId: data.widgetId,
      methodName: 'arrZoomerSetWidgetState',
      methodArgs: data
    }

    sock.socket.emit('widget', dataEmit)
  }

  // ---------------------------------------------------------------------------------------------------
  // ask for update for state1 data for a given module
  // ---------------------------------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------------------------------
  // get update for state1 data which was explicitly asked for by a given module
  // ---------------------------------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  sock.socket.on('arrZoomerUpdateData', function (data) {
    if (sock.conStat.isOffline()) return

    $.each(sock.widgetV[widgetType].widgets, function (widgetIdNow, modNow) {
      if (data.sessWidgetIds.indexOf(widgetIdNow) >= 0) {
        sock.widgetV[widgetType].widgets[widgetIdNow].updateData(data)
      }
    })
  })
}

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

  let sgvTag = {}
  $.each(widgetEle, function (index, eleNow) {
    sgvTag[eleNow.id] = {
      id: tagArrZoomerSvg + eleNow.id,
      widget: eleNow.widget,
      whRatio: eleNow.w / eleNow.h
    }
  })

  // delay counters
  let locker = new Locker()
  locker.add('inInit')
  locker.add('inInitMain')
  locker.add('inInitDetail')
  locker.add('inInitQuick')

  // function loop
  let runLoop = new RunLoop({ tag: widgetId })

  let interpolate01 = d3.interpolate(0, 1)

  // see: http://colors.findthedata.com/saved_search/Pastel-Colors
  //      https://www.google.de/design/spec/style/color.html#color-color-palette
  //      http://riccardoscalco.github.io/crayon/
  let miniMapCol = {}
  miniMapCol.b = ['#64B5F6']
  miniMapCol.p = ['#9575CD']

  // // ---------------------------------------------------------------------------------------------------
  // // colours for different states (red, yellow, green)
  // // ---------------------------------------------------------------------------------------------------
  // let colScale = d3.scaleLinear()
  //   .domain([0, 50, 100])
  //   .range ([
  //     telStateCol[telStates.error  ][0],
  //     telStateCol[telStates.warning][0],
  //     telStateCol[telStates.nominal][0]
  //   ]);

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function getPropPosShift (xy, r, nProp) {
    let angle = (nProp + 0.5) * tauFrac + tau / 4
    let labelX = r * Math.cos(angle)
    let labelY = r * Math.sin(angle)

    if (xy === 'x') return labelX
    if (xy === 'y') return labelY
    else if (xy === 'xy') return [labelX, labelY]
    else return null
  }

  let zoomTarget = ''
  // window.zoomTarget = "";

  let telData = {}
  telData.tel = []
  telData.idToIndex = {}
  telData.dataBaseS1 = {}
  telData.propDataS1 = {}
  telData.propParentS1 = {}
  telData.propTitleS1 = {}

  let telFocus = {}

  let prop0 = 'health'
  // let propD = ["camera","daq","mount","aux","mirror"]
  let propD = ['camera', 'aux', 'mount', 'mirror']
  // let propD = ["camera","mirror","daq"]
  // let propD = ["camera"]
  let propDv = [prop0]
  $.each(propD, function (index, porpNow) {
    propDv.push(porpNow)
  })

  let propTtlD = {}
  propTtlD[prop0] = 'Health'
  propTtlD.camera = 'Camera'
  propTtlD.mirror = 'Mirror'
  propTtlD.mount = 'Mount'
  propTtlD.daq = 'DAQ'
  propTtlD.aux = 'Aux'

  let tauFrac = tau / propD.length
  let tauSpace = tau / 50

  // ---------------------------------------------------------------------------------------------------
  // - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME -
  // a temporary way to get the ordered list of all tel-ids....
  // ---------------------------------------------------------------------------------------------------
  let telTypes = [
    { type: 'L', nTel: isSouth ? 4 : 4 },
    { type: 'M', nTel: isSouth ? 25 : 15 },
    { type: 'S', nTel: isSouth ? 70 : 0 }
  ]
  let telTypeV = []
  for (let nType = 0; nType < telTypes.length; nType++) {
    for (let nTel = 0; nTel < telTypes[nType].nTel; nTel++) {
      let telIndex = nTel
      if (nType > 0) telIndex += telTypes[0].nTel
      if (nType > 1) telIndex += telTypes[1].nTel
      telTypeV.push(telTypes[nType].type + '_' + String(telIndex))
    }
  }
  // - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME - FIXME -
  // ---------------------------------------------------------------------------------------------------

  // function interpolatePct (origVal, newVal) {
  //   return d3.interpolateRound(+origVal.slice(0, -1), +newVal)
  // }

  let zoomLen = {}
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

  function isStateUp (scale, scaleTag) {
    return zoomLen.prev < zoomLen[scaleTag] && scale >= zoomLen[scaleTag]
  }
  function isStateDown (scale, scaleTag) {
    return zoomLen.prev >= zoomLen[scaleTag] && scale < zoomLen[scaleTag]
  }
  function isStateChange (scale, scaleTag) {
    return isStateUp(scale, scaleTag) || isStateDown(scale, scaleTag)
  }

  // zoomLen.start = Date.now();

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setTelData (dataIn, isInit) {
    if (isInit) {
      telData.tel = []
      telData.avg = {}
      telData.idToIndex = {}
    }

    $.each(dataIn, function (id, dataNow) {
      // console.log('==',id,dataNow)
      let telD = {}
      telD.id = id

      $.each(propDv, function (index, porpNow) {
        telD[porpNow] = hasVar(dataNow[porpNow])
          ? Math.round(dataNow[porpNow])
          : 0
      })

      if (isInit) {
        telData.idToIndex[id] = telData.tel.length
        telData.tel.push(telD)
      } else {
        let origIndex = telData.idToIndex[id]
        telData.tel[origIndex] = telD
      }
    })

    // average of each property
    telData.avg.id = 'avg'
    $.each(propDv, function (index, porpNow) {
      telData.avg[porpNow] = 0

      $.each(telData.tel, function (id, dataNow) {
        telData.avg[porpNow] += dataNow[porpNow]
      })

      telData.avg[porpNow] /= telData.tel.length
    })
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function initData (dataDictIn) {
    if (sock.multipleInit({ id: widgetId, data: dataDictIn })) return

    let dataIn = dataDictIn.data

    // fill the local data list - element properties
    setTelData(dataIn.arrProp, true)

    zoomTarget = telData.tel[0].id // arbitrary but safe initialization

    window.sideDiv = sock.setSideDiv({
      id: sideId,
      nIcon: dataDictIn.nIcon,
      iconDivV: iconDivV
    })

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    svgMain.initData(dataIn)
    svgDetail.initData(dataIn)
    svgQuick.initData(dataIn)

    if (locker.isFree('inInit') && hasVar(dataIn.arrProp.type)) {
      console.error('double init ?!?!', dataIn)
      updateData(dataIn.arrProp)
    }

    runWhenReady({
      pass: function () {
        return locker.isFreeV([
          'inInitMain',
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
  thisArrZoomer.initData = initData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------------------------------
  // update the data for s0
  // ---------------------------------------------------------------------------------------------------
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

    // ---------------------------------------------------------------------------------------------------
    // fill the updated properties (accumilate all updates in order, so that if some id was updated
    // multiple times, the latest value will be kept
    // ---------------------------------------------------------------------------------------------------
    setTelData(dataIn.data, false)

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    setState()

    locker.remove('dataChange')
    // locker.remove({id:"dataChange",delay:1500}); // for testing... never delay this...
  }

  // ---------------------------------------------------------------------------------------------------
  // update the data for s1
  // ---------------------------------------------------------------------------------------------------
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
    let telIndex = telData.idToIndex[telId]

    // console.log('updateS1',dataIn);

    // if by the time the update has arrived, were already gone from this element...
    if (!hasVar(telData.propDataS1[telId])) {
      // console.log('-+-> updateS1: could not find',telId,'in telData.propDataS1')
      return
    }
    // console.log('````',dataIn,telData.propDataS1[telId]);

    locker.add('dataChange')

    // ---------------------------------------------------------------------------------------------------
    // update the underlying data
    // ---------------------------------------------------------------------------------------------------
    $.each(propD, function (index, porpNow) {
      // update the data container with the s0 updated health
      telData.propDataS1[telId][porpNow].val = telData.tel[telIndex][porpNow]

      // now go through the hirch
      let dataNow = telData.propDataS1[telId][porpNow]
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
    svgDetail.updateS1(dataIn)

    locker.remove('dataChange')
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
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
    svgDetail.setStateOnce()
    svgQuick.setStateOnce()

    locker.remove({ id: 'setStateLock', delay: timeD.animArc * 2 })
  }

  function svgZoomEnd (scale, target) {
    svgQuick.miniZoomViewRec()
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  runLoop.init({ tag: '_s1props_', func: propsS1Once, nKeep: -1 })

  function propsS1 (optIn) {
    // console.log('setState',svgMain.getZoomS(),getScale())
    runLoop.push({ tag: '_s1props_', data: optIn })
  }
  // this.propsS1 = propsS1;

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

    if (doTelHirch) svgDetail.telHirch(optIn)

    if (doBckArcClick) {
      optIn.canIgnore = false
      svgMain.bckArcClick(optIn)
    }

    locker.remove('s1propsChange')
  }

  // ---------------------------------------------------------------------------------------------------
  // activate a listener for getting the s1 data - this is needed in case the same data are sent more
  // then once (can happen if one element is requested, but by the time the transitions to open it
  // has ended, another was already requested too).
  // ---------------------------------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
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

      let scale = zoomLen['0.0']
      if (zoomState === 1) scale = zoomLen['1.0']

      svgMain.zoomToTrgMain({
        target: target,
        scale: scale,
        durFact: 1,
        endFunc: function () {
          // locker.remove("syncStateGet");
          svgMain.askDataS1()
        }
      })
    }
  }
  this.syncStateGet = syncStateGet

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  runLoop.init({
    tag: 'syncStateSend',
    func: _syncStateSend,
    nKeep: 1,
    wait: timeD.waitSyncState
  })

  function syncStateSend (dataIn) {
    runLoop.push({ tag: 'syncStateSend', data: dataIn })
  }

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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let SvgQuick = function () {
    let thisQuick = this

    let com = {}
    let svg = {}

    let lenD = {}
    lenD.mini = {}
    lenD.ches = {}
    lenD.mini.w = {}
    lenD.ches.w = {}
    lenD.mini.h = {}
    lenD.ches.h = {}

    let baseW = 500
    lenD.mini.w[0] = baseW // isSouth ? 900 : 400;
    lenD.mini.h[0] = baseW

    lenD.ches.w[0] = baseW * 5
    lenD.ches.h[0] = baseW

    // let rScale = svgMain.rScale

    // initialize a global function (to be overriden below)
    let zoomToTrgQuick = function (optIn) {
      if (!locker.isFree('inInit')) {
        setTimeout(function () {
          zoomToTrgQuick(optIn)
        }, timeD.waitLoop)
      }
    }
    thisQuick.zoomToTrgQuick = zoomToTrgQuick

    // initialize a couple of functions to be overriden below
    let getScale = function () {
      return zoomLen['0.0']
    }
    this.getScale = getScale
    let getTrans = function () {
      return [0, 0]
    }
    this.getTrans = getTrans

    function initData (dataIn) {
      if (hasVar(svg.svgMini)) return

      // ---------------------------------------------------------------------------------------------------
      // create the main svg element
      // ---------------------------------------------------------------------------------------------------
      let svgDivId = sgvTag.quick.id + '_svg'
      let svgDiv = sgvTag.quick.widget.getEle(svgDivId)

      if (!hasVar(svgDiv)) {
        let parent = sgvTag.quick.widget.getEle(sgvTag.quick.id)
        let svgDiv = document.createElement('div')
        svgDiv.id = svgDivId

        appendToDom(parent, svgDiv)

        runWhenReady({
          pass: function () {
            return hasVar(sgvTag.quick.widget.getEle(svgDivId))
          },
          execute: function () {
            initData(dataIn)
          }
        })

        return
      }
      sock.emitMouseMove({ eleIn: svgDiv, data: { widgetId: widgetId } })

      // ---------------------------------------------------------------------------------------------------
      // background container & zoom behaviour
      // ---------------------------------------------------------------------------------------------------
      let whRatio = sgvTag.quick.whRatio
      let whFracMini = 1
      let whFracChes = whRatio - whFracMini

      let svgMiniW = 100 * whFracMini / whRatio + '%'
      // let svgMiniH = '100%'
      // let svgMiniT  = "0px";
      // let svgMiniL  = "0px";

      let svgChesW = 100 * whFracChes / whRatio + '%'
      // let svgChesH = '100%'
      // let svgChesT  = "0px";
      // let svgChesL  = (100*whFracMini/whRatio)+"%";

      // ---------------------------------------------------------------------------------------------------
      // zoom start/on/end functions, attachd to com.svgZoom
      // ---------------------------------------------------------------------------------------------------
      com.svgZoomStart = function () {
        locker.add({ id: 'zoom', override: true })
      }

      // initialize the target name for hovering->zoom
      thisQuick.target = zoomTarget

      com.svgZoomDuringMini = function () {
        // console.log('svgZoomDuring',d3.event.transform)
        svg.gMiniZoomed.attr('transform', d3.event.transform)

        if (
          locker.isFreeV([
            'autoZoomTarget',
            'zoomToTargetMini',
            'zoomToTargetChes'
          ])
        ) {
          zoomToTargetNow(
            { target: '', scale: d3.event.transform.k, durFact: -1 },
            'ches'
          )
          svgMain.zoomToTrgMain({
            target: '',
            scale: d3.event.transform.k,
            durFact: -1
          })
        }
      }

      com.svgZoomDuringChes = function () {
        svg.gChesZoomed.attr('transform', d3.event.transform)

        if (
          locker.isFreeV([
            'autoZoomTarget',
            'zoomToTargetMini',
            'zoomToTargetChes'
          ])
        ) {
          zoomToTargetNow(
            { target: '', scale: d3.event.transform.k, durFact: -1 },
            'mini'
          )
          svgMain.zoomToTrgMain({
            target: '',
            scale: d3.event.transform.k,
            durFact: -1
          })
        }
      }

      com.svgZoomEnd = function () {
        locker.remove('zoom')
      }

      com.svgMiniZoom = d3.zoom().scaleExtent([zoomLen['0.0'], zoomLen['1.3']])
      com.svgChesZoom = d3.zoom().scaleExtent([zoomLen['0.0'], zoomLen['1.3']])

      com.svgMiniZoom.on('start', com.svgZoomStart)
      com.svgChesZoom.on('start', com.svgZoomStart)
      com.svgMiniZoom.on('zoom', com.svgZoomDuringMini)
      com.svgChesZoom.on('zoom', com.svgZoomDuringChes)
      com.svgMiniZoom.on('end', com.svgZoomEnd)
      com.svgChesZoom.on('end', com.svgZoomEnd)

      // ---------------------------------------------------------------------------------------------------
      // programatic zoom to some target and scale - only use the last of any set of ovelapping zoom requests
      // ---------------------------------------------------------------------------------------------------
      let zoomToTargetTag = {
        mini: 'zoomToTargetMini',
        ches: 'zoomToTargetChes'
      }

      runLoop.init({
        tag: zoomToTargetTag.mini,
        func: doZoomToTarget,
        nKeep: -1
      })
      runLoop.init({
        tag: zoomToTargetTag.ches,
        func: doZoomToTarget,
        nKeep: -1
      })

      // the actual function to be called when a zoom needs to be put in the queue
      zoomToTrgQuick = function (optIn) {
        zoomToTargetNow(optIn, 'mini')
        zoomToTargetNow(optIn, 'ches')
      }
      thisQuick.zoomToTrgQuick = zoomToTrgQuick

      function zoomToTargetNow (optIn, tagNow) {
        let tagNowUp = tagNow
        if (tagNowUp === 'mini') {
          tagNowUp = 'Mini'
        }
        if (tagNowUp === 'ches') {
          tagNowUp = 'Ches'
        }

        if (!locker.isFree('inInit')) {
          setTimeout(function () {
            zoomToTargetNow(optIn, tagNow)
          }, timeD.waitLoop)
          return
        }
        if (!locker.isFreeV(['autoZoomTarget', 'zoomToTarget' + tagNowUp])) {
          return
        }

        // if(tagNow=='mini')console.log('zoomToTrgQuick');

        let targetName = optIn.target
        let targetScale = optIn.scale
        let durFact = optIn.durFact

        if (targetScale < zoomLen['0.0']) targetScale = getScale()

        // let transTo = [ telData.mini[targetName].x, telData.mini[targetName].y ];
        let transTo
        if (targetName === '' || !hasVar(telData.mini[targetName])) {
          let scale = getScale()
          let trans = getTrans()
          let x = (lenD.mini.w[0] / 2 - trans[0]) / scale
          let y = (lenD.mini.h[0] / 2 - trans[1]) / scale
          transTo = [x, y]
        } else {
          transTo = [telData.mini[targetName].x, telData.mini[targetName].y]
        }

        let funcStart = function () {
          locker.add({ id: 'zoomToTarget' + tagNowUp, override: true })
          // console.log('xxx',targetName);
        }
        let funcDuring = function () {}
        let funcEnd = function () {
          locker.remove('zoomToTarget' + tagNowUp)
        }

        let outD = {
          trgScale: targetScale,
          durFact: durFact,
          baseTime: 300,
          transTo: transTo,
          wh: [lenD.mini.w[0], lenD.mini.h[0]],
          cent: null,
          funcStart: funcStart,
          funcEnd: funcEnd,
          funcDuring: funcDuring,
          svg: svg['svg' + tagNowUp],
          svgZoom: com['svg' + tagNowUp + 'Zoom'],
          svgBox: svg['g' + tagNowUp + 'Zoomed'],
          svgZoomNode: svg['svg' + tagNowUp + 'ZoomNode']
        }

        if (durFact < 0) {
          outD.durFact = 0
          doZoomToTarget(outD)
        } else {
          runLoop.push({ tag: zoomToTargetTag[tagNow], data: outD })
        }
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      svg.svgMini = d3
        .select(svgDiv)
        // svg.svgMini = d3.select("#"+(svgDiv.id))
        // .classed("svgInGridStack_outer", true)
        .append('svg')
        .attr('viewBox', '0 0 ' + lenD.mini.w[0] + ' ' + lenD.mini.h[0])
        .style('position', 'relative')
        .style('width', svgMiniW) // .style('height',svgMiniH).style('top',svgMiniT).style('left',svgMiniL)
        // .style("background", "transparent")
        .style('background', '#383B42') // .style('opacity',0.92)//.style("border","1px solid red")
        .call(com.svgMiniZoom)
        .on('dblclick.zoom', null)
        .on('wheel', function () {
          d3.event.preventDefault()
        })

      // save the svg node to use for d3.zoomTransform() later
      svg.svgMiniZoomNode = svg.svgMini.nodes()[0]

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      getScale = function () {
        return d3.zoomTransform(svg.svgMiniZoomNode).k
      }
      getTrans = function () {
        return [
          d3.zoomTransform(svg.svgMiniZoomNode).x,
          d3.zoomTransform(svg.svgMiniZoomNode).y
        ]
      }
      thisQuick.getScale = getScale
      thisQuick.getTrans = getTrans

      // add one rectangle as background
      // ---------------------------------------------------------------------------------------------------
      svg.svgMini
        .append('g')
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', lenD.mini.w[0])
        .attr('height', lenD.mini.h[0])
        .attr('stroke', '#383B42')
        .attr('stroke-width', 2)
        .attr('fill', '#383B42')
      // .style("opacity", 0.1)
      // .attr("fill", "transparent")//.attr("fill", "red")

      svg.gMiniZoomed = svg.svgMini.append('g')
      svg.gMini = svg.svgMini.append('g')
      // svg.gMiniZoomed = svg.gMini // to actually see the zoom...

      // add one circle as background
      // ---------------------------------------------------------------------------------------------------
      svg.gMini
        .append('g')
        .selectAll('circle')
        .data([0])
        .enter()
        .append('circle')
        .attr('r', 0)
        .attr('cx', lenD.mini.w[0] / 2)
        .attr('cy', lenD.mini.h[0] / 2)
        .attr('fill', '#F2F2F2')
        .transition('inOut')
        .duration(timeD.animArc / 3)
        .attr('r', lenD.mini.w[0] / 2.1)

      // the background grid
      bckPattern({
        com: com,
        gNow: svg.gMini,
        gTag: 'svgMini',
        lenWH: [lenD.mini.w[0], lenD.mini.h[0]],
        opac: 0.2,
        hexR: 50
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      svg.svgChes = d3
        .select(svgDiv)
        // svg.svgChes = d3.select("#"+(svgDiv.id))
        // .classed("svgInGridStack_outer", true)
        .append('svg')
        .attr('viewBox', '0 0 ' + lenD.ches.w[0] + ' ' + lenD.ches.h[0])
        .style('position', 'relative')
        .style('width', svgChesW) // .style('height',svgChesH).style('top',svgChesT).style('left',svgChesL)
        .style('background', 'transparent') // .style("background", "red").style('opacity',0.2)//.style("border","1px solid red")
        .call(com.svgChesZoom)
        .on('dblclick.zoom', null)
        .on('wheel', function () {
          d3.event.preventDefault()
        })

      // save the svg node to use for d3.zoomTransform() later
      svg.svgChesZoomNode = svg.svgChes.nodes()[0]

      svg.gChesZoomed = svg.svgChes.append('g')
      svg.gChes = svg.svgChes.append('g')

      // add one rectangle as background, and to allow click to zoom
      // ---------------------------------------------------------------------------------------------------
      svg.gChes
        .append('g')
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', lenD.ches.w[0])
        .attr('height', lenD.ches.h[0])
        .attr('stroke-width', '0')
        // .attr("fill", "#F2F2F2")//.attr("fill", "red")
        .attr('fill', '#383b42')

      // // the background grid
      // bckPattern({
      //   com:com, gNow:svg.gChes, gTag:"gChes", lenWH:[lenD.ches.w[0],lenD.ches.h[0]],
      //   opac:0.1, textureOrient:"5/8", textureSize:120
      // });

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      com.gMini = {}
      com.gMini.circ = svg.gMini.append('g')
      com.gMini.rect = svg.gMini.append('g')
      com.gMini.vor = svg.gMini.append('g')

      miniZoomViewRec()
      miniZoomClick()

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      com.gChes = {}
      com.gChes.g = svg.gChes.append('g')
      com.gChes.xyr = {}

      // let nRows     = isSouth ? 5 : 2;
      // let nEle = isSouth ? 99 : 19
      let nEleInRow = isSouth ? [20, 20, 20, 20] : [10]
      let eleR = isSouth ? lenD.ches.h[0] / 13 : lenD.ches.h[0] / 6.5
      let eleSpace = isSouth ? [3.15, 2.5] : [3.1, 2.5]
      let eleShift = isSouth ? [2, 2] : [2, 1.1]

      let vorData = []
      let nEleRow = 0
      let maxX = 0
      $.each(telTypeV, function (index, idNow) {
        let nEleNowInRow = nEleRow
        let nEleNowInCol = 0
        if (nEleInRow.length > 0) {
          if (nEleNowInRow >= nEleInRow[0]) {
            nEleNowInRow -= nEleInRow[0]
            nEleNowInCol++
          }
        }
        if (nEleInRow.length > 1) {
          if (nEleNowInRow >= nEleInRow[1]) {
            nEleNowInRow -= nEleInRow[1]
            nEleNowInCol++
          }
        }
        if (nEleInRow.length > 2) {
          if (nEleNowInRow >= nEleInRow[2]) {
            nEleNowInRow -= nEleInRow[2]
            nEleNowInCol++
          }
        }
        if (nEleInRow.length > 3) {
          if (nEleNowInRow >= nEleInRow[3]) {
            nEleNowInRow -= nEleInRow[3]
            nEleNowInCol++
          }
        }
        nEleRow++

        let x =
          eleR / eleShift[0] +
          eleR +
          ((isSouth ? 0.3 : 0.15) + nEleNowInRow) * (eleSpace[0] * eleR)
        let y = eleR / eleShift[1] + eleR + nEleNowInCol * (eleSpace[1] * eleR)

        com.gChes.xyr[idNow] = {
          id: idNow,
          rc: [nEleNowInRow, nEleNowInCol],
          x: x,
          y: y,
          r: eleR * 1.5
        }
        vorData.push({ id: idNow, x: x, y: y })

        if (x + eleR * eleShift[0] > maxX) maxX = x + eleR * eleShift[0]
        // console.log(nEleInRow,nEleRow,nEleNowInRow,nEleNowInCol,com.gChes.xyr[idNow])
      })
      // console.log(Object.keys(telData.mini).length, telData.mini)

      let vorFunc = d3
        .voronoi()
        .x(function (d) {
          return d.x
        })
        .y(function (d) {
          return d.y
        })
        .extent([[0, 0], [maxX, lenD.ches.h[0]]])

      com.gChes.vor = vorFunc.polygons(vorData)

      locker.remove('inInitQuick')
    }
    this.initData = initData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setStateOnce (dataIn) {
      svgMain.s00circ({
        dataV: telData.tel,
        gNow: com.gMini.circ,
        posTag: 'mini'
      })

      chesCirc(telData.tel, isSouth ? 2.7 : 5, false)
    }
    this.setStateOnce = setStateOnce

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function chesCirc (dataV, fontScale, shiftY) {
      let tagCirc = prop0
      let tagLbl = 'lbls00title'
      let tagState = 'state_00'
      // let tagTxt = tagState + tagLbl
      let titleSize = (isSouth ? 16 : 17) * fontScale
      let circStrk = 0
      let textStrk = isSouth ? 0.3 : 0.8
      let fillOpac = 1

      //
      let circ = com.gChes.g
        .selectAll('circle.' + tagCirc)
        .data(dataV, function (d) {
          return d.id
        })

      circ
        .enter()
        .append('circle')
        .attr('class', tagCirc)
        .attr('stroke-width', circStrk)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('transform', function (d) {
          return (
            'translate(' +
            com.gChes.xyr[d.id].x +
            ',' +
            com.gChes.xyr[d.id].y +
            ')'
          )
        })
        .style('fill-opacity', fillOpac)
        .attr('r', function (d) {
          return com.gChes.xyr[d.id].r
        })
        .style('opacity', 1)
        .style('fill', '#383b42')
        .merge(circ)
        .transition('inOut')
        .duration(timeD.animArc)
        // .style("fill", function(d) { return telHealthCol(d[tagCirc],0.5); } )
        .style('stroke', function (d) {
          return telHealthCol(d[tagCirc], 0.5)
        })

      circ
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('r', 0)
        .remove()

      function txtColRC (d) {
        let index = com.gChes.xyr[d.id].rc[0] + com.gChes.xyr[d.id].rc[1]
        return index % 2 === 0
          ? d3.rgb(colsPurples[4]).brighter(0.5)
          : d3.rgb(colsBlues[3]).brighter(0.1)
        // return (index%2 == 0) ? d3.rgb(colsYellows[1]).brighter(0.5) : d3.rgb(colsGreens[4]).brighter(0.1);
      }
      function txtColRCb (d) {
        return d3.rgb(txtColRC(d)).brighter(0.2)
      }

      // attach new data (select by id, and so will override existing data if has the same id)
      let text = com.gChes.g
        .selectAll('text.' + tagLbl)
        .data(dataV, function (d) {
          return d.id
        })

      // operate on new elements only
      text
        .enter()
        .append('text')
        .text(function (d) {
          return telInfo.getTitle(d.id)
        })
        // .attr("id",      function(d) { return myUniqueId+d.id+tagTxt; })
        .attr('class', tagState + ' ' + tagLbl)
        .style('font-weight', 'normal')
        .attr('stroke-width', textStrk)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .each(function (d, i) {
          d.fontScale = String(fontScale)
          d.shiftY = shiftY
        })
        // .style("stroke",    function(d) { return "#F2F2F2";  return "#383b42"; })
        // .style("stroke",   function(d) { return telHealthCol(d[tagCirc]); } )
        .style('stroke', txtColRCb)
        .style('fill', txtColRC)
        .style('font-size', titleSize + 'px')
        .attr('transform', function (d, i) {
          return (
            'translate(' +
            com.gChes.xyr[d.id].x +
            ',' +
            com.gChes.xyr[d.id].y +
            ')'
          )
        })
        .attr('dy', titleSize / 3 + 'px')
        .attr('text-anchor', 'middle')
        .style('font-size', titleSize + 'px')
        .transition('inOut')
        .duration(timeD.animArc)
        .delay(100)
        .style('opacity', '1')

      text
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()

      // ---------------------------------------------------------------------------------------------------
      // the highlight function
      // ---------------------------------------------------------------------------------------------------
      function focusTel (dIn, isOn) {
        locker.add('svgQuickFocusTel')

        let delay = 250
        setTimeout(function () {
          if (locker.nActive('svgQuickFocusTel') === 1) {
            _focusTel(dIn, isOn)
          }
          locker.remove('svgQuickFocusTel')
        }, delay)
      }

      function _focusTel (dIn, isOn) {
        let rScale = isSouth ? 2.0 : 1.1

        let isEleOn
        let dInId = hasVar(dIn.data) ? dIn.data.id : ''
        if (isOn) {
          isEleOn = function (d) {
            return d.id === dInId
          }
        } else {
          isEleOn = function () {
            return false
          }
        }

        //
        let circ = com.gChes.g.selectAll('circle.' + tagCirc)
        let text = com.gChes.g.selectAll('text.' + tagLbl)

        circ.each(function (d) {
          if (isEleOn(d)) moveNodeUp(this, 2)
        })
        text.each(function (d) {
          if (isEleOn(d)) moveNodeUp(this, 2)
        })

        //
        circ
          .transition('update')
          .duration(timeD.animArc * (isOn ? 0.5 : 0.5))
          // .style("opacity", function(d) { return isEleOn(d) ? 1 : (isOn?0.5:1);  })
          .style('fill-opacity', function (d) {
            return isEleOn(d) ? 1 : fillOpac
          })
          .attr('r', function (d) {
            return com.gChes.xyr[d.id].r * (isEleOn(d) ? rScale : 1)
          })
          .attr('stroke-width', function (d) {
            return isEleOn(d) ? circStrk + 1.5 : circStrk
          })

        //
        text
          .transition('update')
          .duration(timeD.animArc * (isOn ? 1 : 0.5))
          .style('font-size', function (d) {
            return (isEleOn(d) ? titleSize * rScale : titleSize) + 'px'
          })
          .attr('dy', function (d) {
            return (isEleOn(d) ? titleSize * rScale : titleSize) / 3 + 'px'
          })
          .attr('stroke-width', function (d) {
            return isEleOn(d) ? textStrk + 0.7 : textStrk
          })
          .style('font-weight', function (d) {
            return isEleOn(d) ? 'bold' : 'normal'
          })

        //
        let hovData = []
        if (isOn && hasVar(telData.mini[dInId])) hovData.push({ id: dInId })

        miniHoverViewCirc(hovData)
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      function miniHoverViewCirc (dataV) {
        let tagNow = 'miniHoverViewCirc'

        let circ = com.gMini.circ
          .selectAll('circle.' + tagNow)
          .data(dataV, function (d) {
            return d.i
          })

        circ
          .enter()
          .append('circle')
          .attr('class', tagNow)
          .style('opacity', '0')
          .style('fill-opacity', 0.2)
          .style('stroke-width', 0.5)
          .attr('vector-effect', 'non-scaling-stroke')
          .style('pointer-events', 'none')
          .attr('transform', function (d) {
            return (
              'translate(' +
              telData.mini[d.id].x +
              ',' +
              telData.mini[d.id].y +
              ')'
            )
          })
          .attr('r', function (d) {
            return telData.mini[d.id].r * (isSouth ? 12 : 5)
          })
          .merge(circ)
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('transform', function (d) {
            return (
              'translate(' +
              telData.mini[d.id].x +
              ',' +
              telData.mini[d.id].y +
              ')'
            )
          })
          .style('fill', function (d) {
            return miniMapCol.p
          })
          .style('stroke', function (d) {
            return d3.rgb(miniMapCol.p[0]).darker(0.5)
          })
          .style('opacity', 1)

        circ
          .exit()
          .transition('inOut')
          .duration(timeD.animArc)
          .style('opacity', 0)
          .remove()
      }

      // ---------------------------------------------------------------------------------------------------
      // vor cels for selection
      // ---------------------------------------------------------------------------------------------------
      com.gChes.g
        .selectAll('path')
        .data(com.gChes.vor)
        .enter()
        .append('path')
        .style('fill', 'transparent')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('opacity', '0')
        .style('stroke-width', 0)
        .style('stroke', '#383B42')
        // .style("opacity", "0.25").style("stroke-width", "0.75").style("stroke", "#E91E63")//.style("stroke", "white")
        .call(function (d) {
          d.attr('d', vorPloyFunc)
        })
        .on('click', function (d) {
          telData.vorDblclick({ d: d, isInOut: false })
        })
        // .on("dblclick",  function(d) { telData.vorDblclick({ d:d, isInOut:true }); }) // dousnt work well...
        .on('mouseover', function (d) {
          focusTel(d, true)
        })
        .on('mouseout', function (d) {
          focusTel(d, false)
        })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    runLoop.init({ tag: 'miniZoomViewRec', func: miniZoomViewRecOnce, nKeep: 1 })

    function miniZoomViewRec () {
      runLoop.push({ tag: 'miniZoomViewRec' })
    }
    this.miniZoomViewRec = miniZoomViewRec

    function miniZoomViewRecOnce () {
      if (
        !locker.isFreeV([
          'autoZoomTarget',
          'zoomToTargetMini',
          'zoomToTargetChes'
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
        (1 + (isSouth ? 2 * scale / zoomLen['1.3'] : 0)) *
        lenD.mini.w[0] /
        scale
      let h =
        (1 + (isSouth ? 2 * scale / zoomLen['1.3'] : 0)) *
        lenD.mini.h[0] /
        scale
      let x = (lenD.mini.w[0] / 2 - trans[0]) / scale - w / 2
      let y = (lenD.mini.h[0] / 2 - trans[1]) / scale - h / 2

      let strkW = 1 + 0.1 * scale / (zoomLen['1.3'] - zoomLen['0.0'])
      let opac = 0.95 * Math.sqrt(scale / (zoomLen['1.3'] - zoomLen['0.0']))

      // operate on new elements only
      let rect = com.gMini.rect
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

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
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
        .extent([[0, 0], [lenD.mini.w[0], lenD.mini.h[0]]])

      com.gMini.vor
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
          telData.vorDblclick({ d: d, isInOut: false })
        })
        // .on("click", function(d) {
        //   let scaleToZoom = telData.vorDblclick({d:d, isInOut:false });
        //   thisQuick.zoomToTrgQuick({ target:d.data.id, scale:scaleToZoom, durFact:-1 });
        // })
        // .on("dblclick", function(d) {  // dousnt work well...
        //   let scaleToZoom = telData.vorDblclick({d:d, isInOut:true });
        //   thisQuick.zoomToTrgQuick({ target:d.data.id, scale:scaleToZoom, durFact:-1 });
        // })
        .on('mouseover', function (d) {
          thisQuick.target = d.data.id
        })
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let SvgDetail = function () {
    let com = {}
    let svg = {}
    let thisDetail = this

    let rScale = {}
    rScale[0] = {}
    rScale[1] = {}

    rScale[0].health0 = 1.1
    rScale[0].health1 = 1.2
    rScale[0].health2 = 1.35
    rScale[0].line0 = 1.2
    rScale[0].line1 = 1.8
    rScale[0].percent = 0.6
    rScale[0].label = 1.95
    rScale[0].title = 2.05

    rScale[1].health0 = 1.5
    rScale[1].health1 = 1.65
    rScale[1].innerH0 = 1.25
    rScale[1].innerH1 = 1.3

    // let s1LblXY = {}
    let arcFunc = {}

    let arcPrev = {}
    arcPrev.ang = {}
    arcPrev.rad = {}

    // let siteScale = isSouth ? 4 / 9 : 1

    let lenD = {}
    lenD.w = {}
    lenD.h = {}

    // lenD.w[0] = 400;
    // lenD.h[0] = lenD.w[0];
    lenD.w[0] = 500
    lenD.h[0] = 500
    // isSouth ? 900 : 400;

    // lenD.r = {}
    // lenD.r.s00 = [ 12, 13, 14 ];
    // if(isSouth) lenD.r.s00 = [ 12*siteScale, 13*siteScale, 14*siteScale ];

    let avgTelD = []
    $.each([0, 1], function (nState_, nState) {
      if (nState === 0) {
        avgTelD.push({ r: lenD.w[0] / 4, x: lenD.w[0] / 2, y: lenD.h[0] / 2 })
      }
      if (nState === 1) {
        let propH = lenD.h[0] / propDv.length
        let propR = Math.min(propH * 0.4, lenD.w[0] / 15)
        let propY = propR * 1.25

        avgTelD.push({ r: propR, h: propY * 2 })
        $.each(propDv, function (index, porpNow) {
          avgTelD[1][porpNow + 'x'] = propH * (0.5 + index)
          avgTelD[1][porpNow + 'y'] = lenD.h[0] - propY

          // if(index == propD.length-1) {
          //   avgTelD[1][prop0+"x"] = avgTelD[1][porpNow+"x"];
          //   avgTelD[1][prop0+"y"] = propY;
          // }
        })
      }
    })

    lenD.w[1] = lenD.w[0] // - avgTelD[1].h;
    lenD.h[1] = lenD.h[0] - avgTelD[1].h * 2

    // initialize a global function (to be overriden below)
    let zoomToPos = function (optIn) {
      if (!locker.isFree('inInit')) {
        setTimeout(function () {
          zoomToPos(optIn)
        }, timeD.waitLoop)
      }
    }
    this.zoomToPos = zoomToPos

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
      if (hasVar(svg.svgS0)) return

      // ---------------------------------------------------------------------------------------------------
      // create the main svg element
      // ---------------------------------------------------------------------------------------------------
      let svgDivId = sgvTag.detail.id + '_svg'
      let svgDiv = sgvTag.detail.widget.getEle(svgDivId)

      if (!hasVar(svgDiv)) {
        let parent = sgvTag.detail.widget.getEle(sgvTag.detail.id)
        let svgDiv = document.createElement('div')
        svgDiv.id = svgDivId

        appendToDom(parent, svgDiv)

        runWhenReady({
          pass: function () {
            return hasVar(sgvTag.detail.widget.getEle(svgDivId))
          },
          execute: function () {
            initData(dataIn)
          }
        })

        return
      }
      sock.emitMouseMove({ eleIn: svgDiv, data: { widgetId: widgetId } })
      // if(dis

      // ---------------------------------------------------------------------------------------------------
      // background container & zoom behaviour
      // ---------------------------------------------------------------------------------------------------
      // create the main svg element
      // ---------------------------------------------------------------------------------------------------
      svg.svgS0 = d3
        .select(svgDiv)
        // svg.svgS0 = d3.select("#"+(svgDiv.id))
        // .classed("svgInGridStack_outer", true)
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
        .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
        .on('dblclick.zoom', null)
        .on('wheel', function () {
          d3.event.preventDefault()
        })

      svg.gS0 = svg.svgS0.append('g')

      // // ---------------------------------------------------------------------------------------------------
      // // overlying rect, just to add a frame to the entire svg
      // // ---------------------------------------------------------------------------------------------------
      // svg.svgS0.append("g").selectAll("rect").data([0])
      //   .enter()
      //   .append("rect")
      //     .attr("x", 0).attr("y", 0)
      //     .attr("width", lenD.w[0])
      //     .attr("height", lenD.h[0])
      //     .attr("stroke","#383B42") //.attr("stroke","red")
      //     .attr("stroke-width","3")
      //     .attr("fill", "transparent")
      //     .style("pointer-events", "none")

      // ---------------------------------------------------------------------------------------------------
      // add one rectangle as background, and to allow click to zoom
      // ---------------------------------------------------------------------------------------------------
      svg.gS0
        .append('g')
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', lenD.w[0])
        .attr('height', lenD.h[0])
        .attr('stroke-width', '0')
        .attr('fill', '#F2F2F2') // .attr("fill", "red")
        .on('click', function () {
          let scale = svgMain.getScale()
          if (scale >= zoomLen['0.1'] && scale < zoomLen['1.0']) {
            svgMain.zoomToTrgMain({
              target: zoomTarget,
              scale: zoomLen['1.2'],
              durFact: 1
            })
          }
        })

      // the background grid
      bckPattern({
        com: com,
        gNow: svg.gS0,
        gTag: 'gS0',
        lenWH: [lenD.w[0], lenD.h[0]],
        opac: 0.05,
        textureOrient: '2/8'
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let scaleStart = 0
      com.svgZoomStartS1 = function () {
        scaleStart = d3.event.transform.k
      }

      com.svgZoomDuringS1 = function () {
        svg.gS1.attr('transform', d3.event.transform)
      }

      com.svgZoomEndS1 = function () {
        // if on minimal zoom, center
        if (Math.abs(d3.event.transform.k - scaleStart) > 0.00001) {
          if (Math.abs(d3.event.transform.k - zoomLen['0.0']) < 0.00001) {
            if (locker.isFreeV(['autoZoomPos'])) {
              zoomToPos({ target: null, scale: 1, durFact: 0.5 })
            }
          }
        }
      }

      com.svgS1zoom = d3.zoom().scaleExtent([zoomLen['0.0'], zoomLen['1.3']])
      com.svgS1zoom.on('start', com.svgZoomStartS1)
      com.svgS1zoom.on('zoom', com.svgZoomDuringS1)
      com.svgS1zoom.on('end', com.svgZoomEndS1)

      // ---------------------------------------------------------------------------------------------------
      // programatic zoom to some target and scale - only use the last of any set of ovelapping zoom requests
      // ---------------------------------------------------------------------------------------------------
      runLoop.init({
        tag: 'zoomToPosDetail',
        func: doZoomToTarget,
        nKeep: -1
      })

      // the actual function to be called when a zoom needs to be put in the queue
      zoomToPos = function (optIn) {
        if (!locker.isFree('inInit')) {
          setTimeout(function () {
            zoomToPos(optIn)
          }, timeD.waitLoop)
          return
        }

        let zoomPos = optIn.target
        let targetScale = optIn.scale
        let durFact = optIn.durFact

        if (!locker.isFreeV(['autoZoomPos'])) return

        let transTo = hasVar(zoomPos) ? zoomPos : [lenD.w[1] / 2, lenD.h[1] / 2]

        let funcStart = function () {
          locker.add({ id: 'autoZoomPos', override: true })
        }
        let funcDuring = function () {}
        let funcEnd = function () {
          locker.remove('autoZoomPos')
        }

        let outD = {
          trgScale: targetScale,
          durFact: durFact,
          baseTime: 300,
          transTo: transTo,
          wh: [lenD.w[1], lenD.h[1]],
          cent: null,
          funcStart: funcStart,
          funcEnd: funcEnd,
          funcDuring: funcDuring,
          svg: svg.svgS1,
          svgZoom: com.svgS1zoom,
          svgBox: svg.gS1,
          svgZoomNode: svg.svgS1zoomNode
        }

        if (durFact < 0) {
          outD.durFact = 0
          doZoomToTarget(outD)
        } else {
          runLoop.push({ tag: 'zoomToPosDetail', data: outD })
        }
      }
      thisDetail.zoomToPos = zoomToPos

      let svgS1W = 100 * lenD.w[1] / lenD.w[0] + '%'
      let svgS1H = 100 * lenD.h[1] / lenD.h[0] + '%'
      let svgS1T = 100 * ((lenD.h[0] - lenD.h[1]) / 2) / lenD.h[0] + '%'
      let svgS1L = 100 * ((lenD.w[0] - lenD.w[1]) / 2) / lenD.w[0] + '%'

      svg.svgS1 = d3
        .select(svgDiv)
        // svg.svgS1 = d3.select("#"+(svgDiv.id))
        // .classed("svgInGridStack_outer", true)
        .append('svg')
        .attr('viewBox', '0 0 ' + lenD.w[1] + ' ' + lenD.h[1])
        .style('position', 'absolute')
        .style('width', svgS1W)
        .style('height', svgS1H)
        .style('top', svgS1T)
        .style('left', svgS1L)
        .style('background', 'transparent') // .style("background", "red").style('opacity',0.2)//.style("border","1px solid red")
        .call(com.svgS1zoom)
        .on('dblclick.zoom', null)
        .on('wheel', function () {
          d3.event.preventDefault()
        })

      svg.svgS1.attr('pointer-events', 'none').attr('opacity', 0)

      // save the svg node to use for d3.zoomTransform() later
      svg.svgS1zoomNode = svg.svgS1.nodes()[0]

      // add one rectangle as background
      // ---------------------------------------------------------------------------------------------------
      svg.svgS1
        .append('g')
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('stroke', '#383B42')
        .attr('stroke-width', 2)
        .style('opacity', 0.1)
        .attr('fill', 'transparent') // .attr("fill", "red")
      // .attr("fill", "#F2F2F2")

      svg.gS1 = svg.svgS1.append('g')

      // the background grid
      bckPattern({
        com: com,
        gNow: svg.gS1,
        gTag: 'svgS1',
        lenWH: [lenD.w[0], lenD.h[0]],
        opac: 0.025,
        textureOrient: '7/8'
      })

      // ---------------------------------------------------------------------------------------------------
      // some initialization
      // ---------------------------------------------------------------------------------------------------
      // see: http://bl.ocks.org/mbostock/5100636
      com.arcTween = function (transition, optIn) {
        // if(optIn.skip != undefined && optIn.skip) return null;
        transition.attrTween('d', function (d, i) {
          let id = d.id
          if (hasVar(optIn.indexId)) id = optIn.indexId ? d.id : i

          if (hasVar(optIn.incIdV)) {
            if (optIn.incIdV.indexOf(id) === -1) return null
          }
          if (hasVar(optIn.excIdV)) {
            if (optIn.excIdV.indexOf(id) >= 0) return null
          }

          let tagNow = optIn.tagNow
          let angStr0 = optIn.angStr0
            ? arcFunc[tagNow][optIn.angStr0](d)
            : optIn.arcPrev[tagNow].ang[id][0]
          let angStr1 = optIn.angStr1
            ? arcFunc[tagNow][optIn.angStr1](d)
            : optIn.arcPrev[tagNow].ang[id][0]
          let angEnd0 = optIn.angEnd0
            ? arcFunc[tagNow][optIn.angEnd0](d)
            : optIn.arcPrev[tagNow].ang[id][1]
          let angEnd1 = optIn.angEnd1
            ? arcFunc[tagNow][optIn.angEnd1](d)
            : optIn.arcPrev[tagNow].ang[id][1]
          let radInr0 = optIn.radInr0
            ? arcFunc[tagNow][optIn.radInr0](d)
            : optIn.arcPrev[tagNow].rad[id][0]
          let radInr1 = optIn.radInr1
            ? arcFunc[tagNow][optIn.radInr1](d)
            : optIn.arcPrev[tagNow].rad[id][0]
          let radOut0 = optIn.radOut0
            ? arcFunc[tagNow][optIn.radOut0](d)
            : optIn.arcPrev[tagNow].rad[id][1]
          let radOut1 = optIn.radOut1
            ? arcFunc[tagNow][optIn.radOut1](d)
            : optIn.arcPrev[tagNow].rad[id][1]
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

            optIn.arcPrev[tagNow].ang[id][0] = d.startAngle
            optIn.arcPrev[tagNow].ang[id][1] = d.endAngle
            optIn.arcPrev[tagNow].rad[id][0] = d.innerRadius
            optIn.arcPrev[tagNow].rad[id][1] = d.outerRadius

            return arc(d)
          }
        })
      }

      // state-01 initialization (needed before s01inner(), s01outer())
      com.s01 = {}
      com.s01.g = svg.gS0.append('g')

      // state-1 initialization (needed before updateLiveDataS1())
      com.s10 = {}
      com.s10.g = svg.gS1.append('g')

      locker.remove('inInitDetail')
    }
    this.initData = initData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setStateOnce () {
      // console.log('setStateDetail ----',getScale(),optIn)
      let scale = svgMain.getScale()

      if (scale < zoomLen['1.0']) {
        telHirch({ telId: '', clickIn: false, remove: true })
      }

      if (scale <= zoomLen['0.1']) {
        telArcs([telData.avg], 0)
        setSubProp({ telId: 'avg', propIn: '' })
      } else {
        let targetIndex = telData.idToIndex[zoomTarget]

        if (scale < zoomLen['1.0']) {
          telArcs([telData.tel[targetIndex]], 0)
          setSubProp({ telId: zoomTarget, propIn: '' })
        } else {
          telArcs([telData.tel[targetIndex]], 1)
        }
      }
    }
    this.setStateOnce = setStateOnce

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setSubProp (optIn) {
      // console.log('setSubProp',optIn)
      let telId = optIn.telId
      let propIn = optIn.propIn
      let parentName =
        propIn === '' ? null : telData.propParentS1[telId][propIn]

      telPropTitle({ telId: telId, propIn: propIn, parentName: parentName })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function telPropTitle (optIn) {
      let telId = optIn.telId
      let propIn = optIn.propIn
      let parentName = optIn.parentName

      if (propIn !== '' && !hasVar(parentName)) return
      // console.log('telPropTitle',optIn)

      // ---------------------------------------------------------------------------------------------------
      // title on top
      // ---------------------------------------------------------------------------------------------------
      let tagState = 'state10'
      let tagNow = tagState + '_title'

      let ttlData = []
      ttlData.push({
        id: tagNow + 'telId',
        text: telId === 'avg' ? 'Array' : telInfo.getTitle(telId),
        x: 20,
        y: avgTelD[1].h / 2,
        h: 30,
        strkW: 1
      })

      if (hasVar(parentName)) {
        ttlData.push({
          id: tagNow + parentName,
          text: propTtlD[parentName],
          x: 10,
          y: avgTelD[1].h / 2,
          h: 30,
          strkW: 1
        })

        if (propIn !== parentName) {
          ttlData.push({
            id: tagNow + propIn,
            text: telData.propTitleS1[telId][propIn],
            x: 10,
            y: avgTelD[1].h / 2,
            h: 25,
            strkW: 0
          })
        }
      }

      let title = com.s01.g
        .selectAll('text.' + tagNow)
        .data(ttlData, function (d, i) {
          return i
        })

      let eleWH = [[], null]
      $.each(ttlData, function (i, d) {
        eleWH[0].push(null)
      })

      function textPos (d, i, isX) {
        if (isX) {
          let x = d.x
          $.each(ttlData, function (index0, dataNow0) {
            if (index0 < i) {
              if (!hasVar(eleWH[0][index0]) || eleWH[0][index0] === 0) {
                eleWH[0][index0] = getNodeWidthById({
                  selction: com.s01.g.selectAll('text.' + tagNow),
                  id: dataNow0.id
                })
              }
              x += dataNow0.x + eleWH[0][index0]
            }
          })
          return x
        } else {
          if (!hasVar(eleWH[1]) || eleWH[1] === 0) {
            eleWH[1] = getNodeHeightById({
              selction: com.s01.g.selectAll('text.' + tagNow),
              id: ttlData[0].id,
              txtScale: true
            })
          }
          return d.y + eleWH[1]
        }
      }

      title
        .enter()
        .append('text')
        .text(function (d) {
          return d.text
        })
        .attr('class', tagState + ' ' + tagNow) // class list for easy selection
        .style('font-weight', function (d, i) {
          return i === 0 ? 'bold' : 'normal'
        })
        .style('opacity', 0)
        .style('fill', '#383b42')
        .style('stroke-width', function (d) {
          return d.strkW
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', function (d) {
          return '#383b42'
        })
        .attr('font-size', function (d) {
          return d.h + 'px'
        })
        .attr('transform', function (d, i) {
          d.pos = [lenD.w[0] * 1.1, textPos(d, i, false)]
          return 'translate(' + d.pos[0] + ',' + d.pos[1] + ')'
        })
        .merge(title)
        .text(function (d) {
          return d.text
        })
        .transition('update1')
        .duration(timeD.animArc) // .delay(timeD.animArc/2)
        .attr('transform', function (d, i) {
          d.pos = [textPos(d, i, true), textPos(d, i, false)]
          return 'translate(' + d.pos[0] + ',' + d.pos[1] + ')'
        })
        .style('opacity', 1)

      title
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('transform', function (d, i) {
          return 'translate(' + d.pos[0] * 2 + ',' + d.pos[1] + ')'
        })
        .style('opacity', 0)
        .remove()

      // ---------------------------------------------------------------------------------------------------
      // highlight rectangle for the selected property
      // ---------------------------------------------------------------------------------------------------
      let tagRect = tagState + '_rectSelect'
      let porpNow =
        propD.indexOf(propIn) >= 0 || propIn === ''
          ? propIn
          : telData.propParentS1[telId][propIn]
      // let porpX   = ((porpNow == "" || !clickIn) ? prop0: porpNow) + "x";
      let porpX = (porpNow === '' ? prop0 : porpNow) + 'x'
      let recH = avgTelD[1].h
      let recW = recH * 1.5
      let recX = avgTelD[1][porpX] - recH / 2 - (recW - recH) / 2
      let recY = lenD.h[0] - recH

      let dataV = svgMain.getScale() >= zoomLen['1.0'] ? [{ id: porpX }] : []
      let rect = com.s01.g
        .selectAll('rect.' + tagRect)
        .data(dataV, function (d, i) {
          return i
        })
      // let rect = com.s01.g.selectAll("rect."+tagRect).data( (clickIn || hasDataBase) ? [{id:0}] : [] )

      rect
        .enter()
        .append('rect')
        .attr('class', tagRect)
        .style('fill', '#383b42')
        // .style("stroke", "#383b42")
        .style('pointer-events', 'none')
        .style('stroke-width', '0')
        .attr('opacity', 0)
        .attr('height', recH)
        .attr('width', recW)
        .attr('transform', function (d) {
          return 'translate(' + -recW * 2 + ',' + recY + ')'
        })
        .merge(rect)
        .transition('enter')
        .duration(timeD.animArc)
        .attr('opacity', 0.05)
        .attr('transform', function (d) {
          return 'translate(' + recX + ',' + recY + ')'
        })

      rect
        .exit()
        .transition('out')
        .duration(timeD.animArc)
        .attr('transform', function (d) {
          return 'translate(' + lenD.h[0] + ',' + recY + ')'
        })
        .attr('opacity', 0)
        .remove()
    }

    // ---------------------------------------------------------------------------------------------------
    // innner arcs for the different properties
    // ---------------------------------------------------------------------------------------------------
    function telArcs (dataV, state) {
      let tagState = 'state01'

      if (!hasVar(com.s01.inner)) {
        com.s01.inner = true

        $.each(propD, function (index, porpNow) {
          $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
            let tagNow = porpNow + nArcDrawNow
            let is0 = nArcDrawNow === 0

            arcFunc[tagNow] = {}
            arcFunc[tagNow].rad00 = function (d) {
              return avgTelD[d.state].r * (is0 ? 0.1 : 0.1)
            }
            arcFunc[tagNow].rad01 = function (d) {
              return avgTelD[d.state].r * (is0 ? 0.95 : 0.99)
            }
            // arcFunc[tagNow].rad10 = function (d) { return avgTelD[d.state].r * rScale[1].innerH0 * (is0 ? 1 : 0.97); };
            // arcFunc[tagNow].rad11 = function (d) { return avgTelD[d.state].r * rScale[1].innerH1 * (is0 ? 1 : 1.03); };
            arcFunc[tagNow].ang00 = function (d) {
              return index * tauFrac + tauSpace
            }
            arcFunc[tagNow].ang01 = function (d) {
              return (
                index * tauFrac +
                tauSpace +
                (tauFrac - tauSpace * 2) * (is0 ? 1 : telHealthFrac(d[porpNow]))
              )
            }
            arcFunc[tagNow].ang10 = function (d) {
              return 0
            }
            arcFunc[tagNow].ang11 = function (d) {
              return is0 ? tau : tau * telHealthFrac(d[porpNow])
            }
          })
        })
      }

      // ---------------------------------------------------------------------------------------------------
      // innner arcs for the different properties
      // ---------------------------------------------------------------------------------------------------
      let pos = {}
      let angState = {}
      let radState = {}
      $.each(propDv, function (index, porpNow) {
        if (state === 0) {
          pos[porpNow] = { x: avgTelD[state].x, y: avgTelD[state].y }
          angState = { angStr1: 'ang00', angEnd1: 'ang01' }
          radState = { radInr1: 'rad00', radOut1: 'rad01' }
        } else {
          pos[porpNow] = {
            x: avgTelD[state][porpNow + 'x'],
            y: avgTelD[state][porpNow + 'y']
          }
          angState = { angStr1: 'ang10', angEnd1: 'ang11' }
          radState = { radInr1: 'rad10', radOut1: 'rad11' }
        }
      })

      $.each(propD, function (index, porpNow) {
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
            .data(dataV, function (d, i) {
              return i
            })

          // operate on new elements only
          path
            .enter()
            .append('path')
            .style('stroke-width', '0.05')
            .style('pointer-events', 'none')
            .attr('vector-effect', 'non-scaling-stroke')
            // .attr("id",        function(d) { return myUniqueId+d.id+tagNow; })
            .attr('class', tagState + ' ' + tagNow)
            // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
            .style('opacity', function (d) {
              return is0 ? '0.5' : '1'
            })
            .attr('transform', function (d) {
              return 'translate(' + pos[porpNow].x + ',' + pos[porpNow].y + ')'
            })
            .style('stroke', function (d) {
              return is0 ? null : telHealthCol(d[porpNow])
            })
            .style('fill', function (d) {
              return telHealthCol(d[porpNow])
            })
            .each(function (d, i) {
              d.state = state
              arcPrev[tagNow].ang[i] = [
                arcFunc[tagNow].ang00(d),
                arcFunc[tagNow].ang00(d)
              ]
              arcPrev[tagNow].rad[i] = [
                arcFunc[tagNow].rad00(d),
                arcFunc[tagNow].rad01(d)
              ]
            })
            .merge(path)
            .each(function (d, i) {
              d.state = state
            })
            .transition('update')
            .duration(timeD.animArc * 2)
            .attr('transform', function (d) {
              return 'translate(' + pos[porpNow].x + ',' + pos[porpNow].y + ')'
            })
            .style('stroke', function (d) {
              return is0 ? null : telHealthCol(d[porpNow])
            })
            .style('fill', function (d) {
              return telHealthCol(d[porpNow])
            })
            .call(com.arcTween, {
              tagNow: tagNow,
              arcPrev: arcPrev,
              indexId: false,
              angStr0: null,
              angStr1: angState.angStr1,
              angEnd0: null,
              angEnd1: angState.angEnd1,
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
              indexId: false,
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

      // ---------------------------------------------------------------------------------------------------
      // outer rings for the prop0 (equivalent of s00_D metric in s01_D)
      // ---------------------------------------------------------------------------------------------------
      let porpAll = prop0

      if (!hasVar(com.s01.outer)) {
        com.s01.outer = true

        $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
          let tagNow = porpAll + nArcDrawNow
          let is0 = nArcDrawNow === 0

          arcFunc[tagNow] = {}
          arcFunc[tagNow].rad00 = function (d) {
            return avgTelD[d.state].r * rScale[0].health0 * (is0 ? 1 : 0.95)
          }
          arcFunc[tagNow].rad01 = function (d) {
            return avgTelD[d.state].r * rScale[0].health1 * (is0 ? 1 : 1.05)
          }
          arcFunc[tagNow].rad10 = function (d) {
            return avgTelD[d.state].r * rScale[1].health0 * (is0 ? 0.475 : 0.4)
          }
          arcFunc[tagNow].rad11 = function (d) {
            return avgTelD[d.state].r * rScale[1].health1 * (is0 ? 0.525 : 0.6)
          }
          arcFunc[tagNow].ang00 = function (d) {
            return 0
          }
          arcFunc[tagNow].ang01 = function (d) {
            return is0 ? tau : tau * telHealthFrac(d[prop0])
          }
        })
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
        let tagNow = porpAll + nArcDrawNow
        let is0 = nArcDrawNow === 0

        if (!hasVar(arcPrev[tagNow])) {
          arcPrev[tagNow] = {}
          arcPrev[tagNow].ang = {}
          arcPrev[tagNow].rad = {}
        }

        let path = com.s01.g
          .selectAll('path.' + tagNow)
          .data(dataV, function (d, i) {
            return i
          })

        // operate on new elements only
        path
          .enter()
          .append('path')
          .style('stroke-width', 0.05)
          .style('pointer-events', 'none')
          .attr('vector-effect', 'non-scaling-stroke')
          // .attr("id",        function(d) { return myUniqueId+d.id+tagNow; })
          .attr('class', tagState + ' ' + tagNow)
          // .style("opacity",  function(d) { return is0 ? "0.1" :  "1" }) // if "#383b42" back-ring (for is0)
          .style('opacity', function (d) {
            return is0 ? '0.5' : '1'
          })
          .attr('transform', function (d) {
            return 'translate(' + pos[porpAll].x + ',' + pos[porpAll].y + ')'
          })
          .style('stroke', function (d) {
            return is0 ? null : telHealthCol(d[porpAll])
          })
          .style('fill', function (d) {
            return telHealthCol(d[porpAll])
          })
          .each(function (d, i) {
            d.state = state
            arcPrev[tagNow].ang[i] = [
              arcFunc[tagNow].ang00(d),
              arcFunc[tagNow].ang00(d)
            ]
            arcPrev[tagNow].rad[i] = [
              arcFunc[tagNow].rad00(d),
              arcFunc[tagNow].rad01(d)
            ]
          })
          .merge(path)
          .each(function (d, i) {
            d.state = state
          })
          .transition('update')
          .duration(timeD.animArc * 2) // .delay(timeD.animArc)
          .attr('transform', function (d) {
            return 'translate(' + pos[porpAll].x + ',' + pos[porpAll].y + ')'
          })
          .style('stroke', function (d) {
            return is0 ? null : telHealthCol(d[porpAll])
          })
          .style('fill', function (d) {
            return telHealthCol(d[porpAll])
          })
          .call(com.arcTween, {
            tagNow: tagNow,
            arcPrev: arcPrev,
            indexId: false,
            angStr0: null,
            angStr1: null,
            angEnd0: null,
            angEnd1: 'ang01',
            radInr0: null,
            radInr1: radState.radInr1,
            radOut0: null,
            radOut1: radState.radOut1
          })

        // operate on exiting elements only
        path
          .exit()
          .transition('out')
          .duration(timeD.animArc)
          .call(com.arcTween, {
            tagNow: tagNow,
            arcPrev: arcPrev,
            indexId: false,
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

      // ---------------------------------------------------------------------------------------------------
      // invisible rectangle for the selecting a property
      // ---------------------------------------------------------------------------------------------------
      let tagTitle = tagState + '_title'
      let textD = []
      $.each(propD, function (index, porpNow) {
        let txtR = avgTelD[state].r * rScale[state].health1 * 1.2
        let xy = getPropPosShift('xy', txtR, index)
        textD.push({
          id: tagTitle + porpNow,
          text: propTtlD[porpNow],
          h: state === 0 ? 30 : 16,
          xy: state === 0 ? xy : [0, 0],
          x: state === 0 ? avgTelD[state].x - xy[0] : pos[porpNow].x,
          y: state === 0 ? avgTelD[state].y - xy[1] : pos[porpNow].y,
          strkW: state === 1 ? 0.5 : 0.2,
          fWgt: state === 0 ? 'bold' : 'normal',
          opac: state === 0 ? 0.7 : 0.9,
          anch:
            state === 1 || Math.abs(xy[0] / avgTelD[state].r) < 0.001
              ? 'middle'
              : xy[0] < 0 ? 'start' : 'end'
        })
      })

      let eleH = null

      let title = com.s01.g
        .selectAll('text.' + tagTitle)
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
        .attr('class', tagState + ' ' + tagTitle) // class list for easy selection
        .style('opacity', '0')
        .style('fill-opacity', 0.7)
        .style('fill', '#383b42')
        // .attr("stroke-width", function(d) { return d.strkW; })
        .style('stroke', function (d) {
          return '#383b42'
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })
        .merge(title)
        .style('font-size', function (d) {
          return d.h + 'px'
        })
        .transition('update1')
        .duration(timeD.animArc * 2)
        .style('stroke-width', function (d) {
          return d.strkW
        })
        .style('stroke-opacity', 1)
        .style('font-weight', function (d) {
          return d.fWgt
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
              selction: com.s01.g.selectAll('text.' + tagTitle),
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

      // ---------------------------------------------------------------------------------------------------
      // invisible rectangle for the selecting a property
      // ---------------------------------------------------------------------------------------------------
      $.each(propDv, function (index, porpNow) {
        let tagRect = tagState + porpNow + 'rect'

        let recH = avgTelD[1].h
        let recW = Math.abs(
          avgTelD[1][propD[0] + 'x'] - avgTelD[1][propD[1] + 'x']
        )
        let recX = avgTelD[1][porpNow + 'x'] - recH / 2 - (recW - recH) / 2
        let recY = lenD.h[0] - recH

        let rect = com.s01.g
          .selectAll('rect.' + tagRect)
          .data(state ? [{ id: 0 }] : [])

        rect
          .enter()
          .append('rect')
          .attr('class', tagRect)
          .attr('opacity', 0)
          .style('stroke-width', '0')
          // .style("fill", "#383b42").style("stroke", "red").attr("opacity", 0.1).style("stroke-width", "1")
          .attr('height', recH)
          .attr('width', recW)
          .attr('transform', function (d) {
            return 'translate(' + -recW * 2 + ',' + recY + ')'
          })
          .on('click', click)
          .merge(rect)
          .transition('enter')
          .duration(timeD.animArc)
          .attr('transform', function (d) {
            return 'translate(' + recX + ',' + recY + ')'
          })

        rect
          .exit()
          .transition('out')
          .duration(timeD.animArc)
          .attr('transform', function (d) {
            return 'translate(' + lenD.h[0] + ',' + recY + ')'
          })
          .remove()

        // ---------------------------------------------------------------------------------------------------
        //
        // ---------------------------------------------------------------------------------------------------
        function click (d, i) {
          if (
            !locker.isFreeV([
              's10bckArcChange',
              'dataChange',
              's10clickHirch'
            ])
          ) {
            return
          }

          let clickIn = porpNow !== prop0
          let propIn = clickIn ? porpNow : ''

          // propsS1({ telId:zoomTarget, clickIn:clickIn, propIn:propIn, debug:"telArcs" }); // before 29/9

          svgMain.zoomToTrgMain({
            target: zoomTarget,
            scale: zoomLen['1.2'],
            durFact: 1
          })
          propsS1({
            telId: zoomTarget,
            clickIn: clickIn,
            propIn: propIn,
            doFunc: ['bckArcClick'],
            debug: 'telArcs'
          })

          // // initialize the zoom
          // thisDetail.zoomToPos({ target:null, scale:1, durFact:1 });
        }
      })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let prevTelHirchProp = ''
    function telHirch (optIn) {
      function mayUpdate () {
        return locker.isFree([
          'updateTelHirchDetail',
          'dataChange',
          's10bckArcChange',
          's10clickHirch',
          'updateTelHirch',
          'zoom',
          'autoZoomTarget',
          'zoomToTargetMini',
          'zoomToTargetChes'
        ])
      }
      if (!mayUpdate()) {
        setTimeout(function () {
          telHirch(optIn)
        }, timeD.animArc / 3)
        return
      }
      // if(!hasVar(optIn)) return;
      // console.log('telHirch',optIn);

      let tagState = 'state10'
      let tagNodes = tagState + 'circ'
      let tagText = tagState + '_text'
      let tagVor = tagState + '_vor'
      let tagLinks = tagState + '_path'

      let nodeR = 15
      let diffW = lenD.w[1] * 0.1
      let treeW = lenD.w[1] - diffW
      let treeH = lenD.h[1]

      function getEleId (d) {
        return d.data.id
      }

      let telId = ''
      let clickIn = false
      let propIn = ''
      let remove = false
      if (hasVar(optIn)) {
        if (hasVar(optIn.telId)) telId = optIn.telId
        if (hasVar(optIn.clickIn)) clickIn = optIn.clickIn
        if (hasVar(optIn.remove)) remove = optIn.remove
        if (hasVar(optIn.propIn)) propIn = optIn.propIn
      } else {
        // if(!hasVar(optIn) || isUpdate)
        propIn = prevTelHirchProp
        clickIn = propIn !== ''
      }

      if (zoomTarget !== telId || !hasVar(telData.propDataS1[telId])) {
        clickIn = false
        remove = true
      } else if (propIn === '') {
        clickIn = false
      }

      // ---------------------------------------------------------------------------------------------------
      // update the title
      // ---------------------------------------------------------------------------------------------------
      setSubProp({ telId: telId, propIn: clickIn ? propIn : '' })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      if (!remove && propIn !== '') {
        if (!hasVar(telData.propDataS1[telId][propIn])) {
          return
        }
      }

      locker.add({ id: 'updateTelHirchDetail', override: true })

      // show/hide the svg
      // ---------------------------------------------------------------------------------------------------
      svg.svgS1
        .attr('pointer-events', remove ? 'none' : 'auto')
        .transition('update')
        .duration(timeD.animArc)
        .attr('opacity', remove ? 0 : 1)

      // define the containing g with small margins on the sides
      // ---------------------------------------------------------------------------------------------------
      if (!hasVar(com.s10.gHirch)) {
        com.s10.gHirch = com.s10.g.append('g')
        com.s10.gHirch.attr('transform', function (d) {
          return 'translate(' + diffW / 2 + ',' + 0 + ')'
        })
        // com.s10.gHirch.append("rect").style('opacity',0.3).style("fill",'transparent').attr("height", treeH).attr("width", treeW).style("stroke","red")
      }

      let hasDataBase =
        !clickIn && !remove && hasVar(telData.dataBaseS1[telId])

      // ---------------------------------------------------------------------------------------------------
      // the tree hierarchy
      // ---------------------------------------------------------------------------------------------------
      let desc = []
      let dataPath = []
      let maxDepth = 0
      if (clickIn || hasDataBase) {
        // initialize the zoom upon any change of the hirch
        thisDetail.zoomToPos({
          target: null,
          scale: zoomLen['0.0'],
          durFact: 1
        })

        let dataHirch = clickIn
          ? telData.propDataS1[telId][propIn]
          : telData.dataBaseS1[telId]
        let hirch = d3.hierarchy(dataHirch)

        // if(!clickIn) console.log('----===--',telData.dataBaseS1[telId])
        // console.log('--==--',telId,propIn,hasVar(telData.propDataS1[telId][propIn]),clickIn,dataHirch)

        let tree = d3.tree().size([treeH, treeW])
        tree(hirch)

        desc = hirch.descendants()
        dataPath = desc.slice(1)

        $.each(desc, function (index, dataNow) {
          maxDepth = Math.max(maxDepth, dataNow.depth)
        })

        let xV = []
        $.each(desc, function (index, dataNow) {
          if (maxDepth === dataNow.depth) {
            xV.push(Number(dataNow.x))
          }
        })

        let diffMin = -1
        if (xV.length > 1) {
          xV.sort(d3.ascending)

          diffMin = xV[1] - xV[0]
          $.each(xV, function (index, xNow) {
            if (index > 0) {
              let diffNow = xV[index] - xV[index - 1]
              if (diffNow < diffMin) diffMin = diffNow
            }
          })

          nodeR = Math.min(diffMin / 2.3, nodeR)
        } else {
          nodeR = 5
        }
        // console.log('---',xV,diffMin,nodeR)

        prevTelHirchProp = propIn
      } else {
        prevTelHirchProp = ''
      }

      function fontSize (d) {
        return Math.max(10, Math.min(d.nodeR * 2, 15))
      }

      // ---------------------------------------------------------------------------------------------------
      // circles
      // ---------------------------------------------------------------------------------------------------
      let circs = com.s10.gHirch
        .selectAll('circle.' + tagNodes)
        .data(desc, getEleId) // d.data.id

      circs
        .enter()
        .append('circle')
        .attr('class', tagNodes)
        // .attr("id", function(d) { return myUniqueId+tagNodes+d.data.id; })
        .attr('r', 0)
        .attr('transform', function (d) {
          return 'translate(' + d.y + ',' + d.x + ')'
        })
        .style('stroke', function (d) {
          return telHealthCol(d.data.val, 0.5)
        })
        .style('fill', function (d) {
          return telHealthCol(d.data.val)
        })
        .attr('opacity', 0.85)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('pointer-events', 'none')
        .style('fill-opacity', 1)
        .merge(circs)
        .each(function (d) {
          d.nodeR = nodeR
        })
        .transition('update')
        .duration(timeD.animArc)
        .attr('transform', function (d) {
          return 'translate(' + d.y + ',' + d.x + ')'
        })
        .attr('r', function (d) {
          return d.nodeR
        })
        .style('stroke', function (d) {
          return telHealthCol(d.data.val)
        })
        .style('fill', function (d) {
          return telHealthCol(d.data.val)
        })
      // .each(function(d,i){ console.log(i,d.data); })

      circs
        .exit()
        .transition('out')
        .duration(timeD.animArc / 2)
        .attr('r', 0)
        .remove()

      // ---------------------------------------------------------------------------------------------------
      // labels
      // ---------------------------------------------------------------------------------------------------
      let text = com.s10.gHirch
        .selectAll('text.' + tagText)
        .data(desc, getEleId)

      text
        .enter()
        .append('text')
        .attr('class', tagText)
        .text(getTxt)
        .attr('transform', txtTrans)
        .style('font-size', function (d) {
          return fontSize(d) + 'px'
        })
        .style('text-anchor', txtAnch)
        .style('stroke', '#383b42')
        .attr('pointer-events', 'none')
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('opacity', 0)
        .merge(text)
        .style('stroke-width', clickIn ? 1 : 0.2)
        .style('font-size', function (d) {
          return fontSize(d) + 'px'
        })
        .transition('update')
        .duration(timeD.animArc)
        .attr('opacity', 1)
        .attr('transform', txtTrans)
        .style('text-anchor', txtAnch)
        // .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(getTxt)

      text
        .exit()
        .transition('out')
        .duration(timeD.animArc / 2)
        .attr('opacity', 0)
        .remove()

      function txtTrans (d, i) {
        let d0 = d.nodeR + Math.min(10, d.nodeR)
        let d1 = getNodeHeightById({
          selction: com.s10.gHirch.selectAll('text.' + tagText),
          id: getEleId(d),
          idFunc: getEleId,
          txtScale: true
        })

        return 'translate(' + (d.y - d0) + ',' + (d.x + d1) + ')'
      }
      function txtAnch (d) {
        return 'end'
        // if     (!d.parent)           return "start";
        // else if(maxDepth == d.depth) return "end";
        // else                         return "middle";
      }
      function getTxt (d) {
        return !d.parent || d.data.id === propIn ? '' : d.data.ttl
      }

      // ---------------------------------------------------------------------------------------------------
      // links
      // ---------------------------------------------------------------------------------------------------
      let path = com.s10.gHirch
        .selectAll('path.' + tagLinks)
        .data(dataPath, getEleId)

      path
        .enter()
        .append('path')
        .attr('class', tagLinks)
        .style('fill', 'transparent')
        .style('stroke', '#383b42')
        .style('stroke-width', '1')
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('pointer-events', 'none')
        .attr('opacity', 0)
        .attr('d', linkFunc)
        .merge(path)
        .attr('opacity', 0.15)
        .transition('update')
        .duration(timeD.animArc)
        .attr('d', linkFunc)

      path
        .exit()
        .transition('out')
        .duration(timeD.animArc / 2)
        .attr('opacity', 0)
        .remove()

      function linkFunc (d) {
        return (
          'M' +
          d.y +
          ',' +
          d.x +
          'C' +
          (d.y + d.parent.y) / 2 +
          ',' +
          d.x +
          ' ' +
          (d.y + d.parent.y) / 2 +
          ',' +
          d.parent.x +
          ' ' +
          d.parent.y +
          ',' +
          d.parent.x
        )
      }

      // ---------------------------------------------------------------------------------------------------
      // highlight on hover, using voronoi mapping
      // ---------------------------------------------------------------------------------------------------
      let vorFunc = d3
        .voronoi()
        .x(function (d) {
          return d.y
        })
        .y(function (d) {
          return d.x
        })
        .extent([[0, 0], [treeW, treeH]])

      let vor = com.s10.gHirch
        .selectAll('path.' + tagVor)
        .data(vorFunc.polygons(desc))

      vor
        .enter()
        .append('path')
        .attr('class', tagVor)
        .style('fill', 'transparent')
        .style('opacity', '0')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('stroke-width', 0)
        .style('opacity', 0)
        // .style("stroke-width", "1").style("opacity", "1")
        .style('stroke', '#383B42')
        .on('mouseover', function (d) {
          focusEle(d, true)
        })
        .on('mouseout', function (d) {
          focusEle(d, false)
        })
        .on('click', vorClick)
        .merge(vor)
        .call(function (d) {
          d.attr('d', vorPloyFunc)
        })

      vor
        .exit()
        .transition('out')
        .duration(timeD.animArc / 2)
        .attr('opacity', 0)
        .remove()

      // the click function
      // ---------------------------------------------------------------------------------------------------
      function vorClick (d) {
        setSubProp({ telId: telId, propIn: d.data.data.id })

        let clickIn = true
        let dId = d.data.data.id
        let idNow = hasVar(d.data.parent) ? d.data.parent.data.id : dId

        let parentName = telData.propParentS1[telId][dId]
        if (parentName === dId) {
          idNow = parentName
        }

        // console.log('===',[parentName,dId,propIn,idNow],clickIn);
        if (!hasVar(parentName)) {
          parentName = ''
          clickIn = false
        }
        // console.log('---',[parentName,dId,propIn,idNow],clickIn); console.log('-------------------------------------');

        svgMain.bckArcClick({
          clickIn: clickIn,
          propIn: parentName,
          onlyOpen: true
        })
        svgMain.hirchStyleClick({
          propIn: parentName,
          id: idNow,
          isOpen: true,
          syncProp: dId
        })
      }

      // the highlight function
      // ---------------------------------------------------------------------------------------------------
      function focusEle (dIn, isOn) {
        let dInId = dIn.data.data.id

        if (isOn) {
          if (!mayUpdate()) return

          com.s10.gHirch
            .selectAll('circle.' + tagNodes)
            .transition('highlight')
            .duration(timeD.animArc / 2)
            .attr('r', function (d) {
              return d.data.id === dInId ? d.nodeR * 1.5 : d.nodeR
            })
            .style('fill-opacity', function (d) {
              return d.data.id === dInId ? 0.6 : 1
            })

          com.s10.gHirch
            .selectAll('text.' + tagText)
            .transition('highlight')
            .duration(timeD.animArc / 2)
            .style('font-size', function (d) {
              return (
                (d.data.id === dInId ? fontSize(d) * 2 : fontSize(d)) + 'px'
              )
            })
            .style('font-weight', function (d) {
              return d.data.id === dInId ? 'bold' : 'normal'
            })
        } else {
          if (!mayUpdate()) {
            setTimeout(function () {
              resetR()
            }, 20)
            return
          }

          resetR()
        }

        function resetR () {
          com.s10.gHirch
            .selectAll('circle.' + tagNodes)
            .transition('highlight')
            .duration(timeD.animArc / 2)
            .attr('r', function (d) {
              return d.nodeR
            })
            .style('fill-opacity', 1)

          com.s10.gHirch
            .selectAll('text.' + tagText)
            .transition('highlight')
            .duration(timeD.animArc / 2)
            .style('font-size', function (d) {
              return fontSize(d) + 'px'
            })
            .style('font-weight', 'normal')
        }
      }

      locker.remove({ id: 'updateTelHirchDetail', delay: timeD.animArc })
    }
    this.telHirch = telHirch

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateS1 (dataIn) {
      if (
        !locker.isFreeV([
          's10bckArcChange',
          's10clickHirch',
          'updateTelHirch'
        ]) ||
        !hasVar(com.s10.gHirch)
      ) {
        // console.log('will delay updateS1',dataIn);
        setTimeout(function () {
          updateS1(dataIn)
        }, timeD.animArc / 3)
        return
      }
      locker.add('updateTelHirch')

      com.s10.gHirch
        .selectAll('circle')
        .each(function (d) {
          if (d.data.id === prop0) {
            // console.log('updt',d.data.id,d.data.val,hasVar(dataIn[prop0]));
            d.data.val = dataIn[prop0]
          } else if (hasVar(dataIn.data[d.data.id])) {
            // console.log('updt',d.data.id,dataIn.data[d.data.id]);
            d.data.val = dataIn.data[d.data.id]
          }
        })
        .transition('s1_updtData')
        .duration(timeD.animArc)
        .style('stroke', function (d) {
          return telHealthCol(d.data.val)
        })
        .style('fill', function (d) {
          return telHealthCol(d.data.val)
        })

      locker.remove('updateTelHirch')
    }
    this.updateS1 = updateS1
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let SvgMain = function () {
    let com = {}
    let svg = {}
    let s10V = []
    let syncD = {}
    this.syncD = syncD

    let thisMain = this

    let dblclickZoomInOut = true

    let rScale = {}
    rScale[0] = {}
    rScale[1] = {}

    rScale[0].health0 = 1.1
    rScale[0].health1 = 1.2
    rScale[0].health2 = 1.35
    rScale[0].line0 = 1.2
    rScale[0].line1 = 1.8
    rScale[0].percent = 0.6
    rScale[0].label = 1.95
    rScale[0].title = 2.05

    rScale[1].health0 = 1.5
    rScale[1].health1 = 1.65
    rScale[1].innerH0 = 1.25
    rScale[1].innerH1 = 1.3

    this.rScale = rScale

    let s1LblXY = {}
    let arcFunc = {}

    let links2V = {}

    let arcPrev = {}
    arcPrev.ang = {}
    arcPrev.rad = {}

    let siteScale = isSouth ? 4 / 9 : 1

    let lenD = {}
    lenD.w = {}
    lenD.h = {}

    // lenD.w[0] = 400;
    // lenD.h[0] = lenD.w[0];
    lenD.w[0] = 500
    lenD.h[0] = 500
    // isSouth ? 900 : 400;

    lenD.r = {}
    lenD.r.s00 = [12, 13, 14]
    if (isSouth) lenD.r.s00 = [12 * siteScale, 13 * siteScale, 14 * siteScale]

    // lenD.mouse = d3.mouse(this);  // inside event....

    // initialize a global function (to be overriden below)
    let zoomToTrgMain = function (optIn) {
      if (!locker.isFree('inInit')) {
        setTimeout(function () {
          zoomToTrgMain(optIn)
        }, timeD.waitLoop)
      }
    }
    thisMain.zoomToTrgMain = zoomToTrgMain

    // initialize a couple of functions to be overriden below
    let getScale = function () {
      return zoomLen['0.0']
    }
    let getTrans = function () {
      return [0, 0]
    }
    let getZoomS = function () {
      return 0
    }
    this.getScale = getScale
    this.getTrans = getTrans
    this.getZoomS = getZoomS

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
      let arrInit = dataIn.arrInit
      // let arrProp = dataIn.arrProp
      let subArr = dataIn.subArr

      if (hasVar(svg.g)) return

      // ---------------------------------------------------------------------------------------------------
      // create the main svg element
      // ---------------------------------------------------------------------------------------------------
      let svgDivId = sgvTag.main.id + '_svg'
      let svgDiv = sgvTag.main.widget.getEle(svgDivId)

      if (!hasVar(svgDiv)) {
        let parent = sgvTag.main.widget.getEle(sgvTag.main.id)
        let svgDiv = document.createElement('div')
        svgDiv.id = svgDivId

        appendToDom(parent, svgDiv)

        runWhenReady({
          pass: function () {
            return hasVar(sgvTag.main.widget.getEle(svgDivId))
          },
          execute: function () {
            initData(dataIn)
          }
        })

        return
      }
      sock.emitMouseMove({ eleIn: svgDiv, data: { widgetId: widgetId } })

      // ---------------------------------------------------------------------------------------------------
      // zoom start/on/end functions, attachd to com.svgZoom
      // ---------------------------------------------------------------------------------------------------
      let scaleStart = 0
      com.svgZoomStart = function () {
        scaleStart = d3.event.transform.k
        locker.add({ id: 'zoom', override: true })
      }

      com.svgZoomDuring = function () {
        // zoomLen.start = Date.now();
        // console.log('svgZoomDuring',d3.event.transform)
        svg.g.attr('transform', d3.event.transform)

        if (
          locker.isFreeV([
            'autoZoomTarget',
            'zoomToTargetMini',
            'zoomToTargetChes'
          ])
        ) {
          svgQuick.zoomToTrgQuick({
            target: zoomTarget,
            scale: d3.event.transform.k,
            durFact: -1
          })
        }

        svgZoomUpdState()
      }

      function svgZoomUpdState () {
        // common actions
        // svgZoomDuring();

        let scale = getScale()
        let zoomS = getZoomS()

        let change01 = isStateChange(scale, '0.1')
        let change10 = isStateChange(scale, '1.0')

        if (zoomS === 0) syncD.zoomTarget = ''

        // console.log('svgZoomEnd',changeState,scale)
        if (change01 || change10) {
          setState()

          // update the opacity of the background grid
          if (change10) {
            bckPattern({
              com: com,
              gNow: svg.g,
              gTag: 'hex',
              lenWH: [lenD.w[0], lenD.h[0]],
              opac: getScale() < zoomLen['1.0'] ? 0.15 : 0.07,
              hexR: 18
            })
          }
          if (isStateUp(scale, '1.0')) askDataS1()

          zoomLen.prev = scale
        }
      }

      com.svgZoomEnd = function () {
        svgZoomUpdState()
        setWidgetState()

        telFocus.target = zoomTarget
        telFocus.scale = d3.event.transform.k

        // must come last here !
        locker.remove('zoom')

        // common actions (after releasing locker)
        svgZoomEnd(d3.event.transform.k, zoomTarget)

        // if on minimal zoom, center
        if (Math.abs(d3.event.transform.k - scaleStart) > 0.00001) {
          if (Math.abs(d3.event.transform.k - zoomLen['0.0']) < 0.00001) {
            if (locker.isFreeV(['autoZoomTarget'])) {
              thisMain.zoomToTrgMain({
                target: 'init',
                scale: d3.event.transform.k,
                durFact: 0.5
              })
            }

            // syncroniz changes with other panels
            // ---------------------------------------------------------------------------------------------------
            syncStateSend({
              type: 'syncTelFocus',
              syncTime: Date.now(),
              zoomState: 0,
              target: 'init'
            })
          }
        }
      }

      // com.svgZoom = d3.behavior.zoom().translate([0, 0]).scale(1).scaleExtent([zoomLen["0.0"],zoomLen["1.2"]]);
      // function filt() { return  !event.button;}

      // com.svgZoom = d3.zoom().scaleExtent([zoomLen["0.0"],zoomLen["0.2"]])//.filter([filt]);
      com.svgZoom = d3.zoom().scaleExtent([zoomLen['0.0'], zoomLen['1.3']]) // .filter([filt]);
      com.svgZoom.on('zoom', com.svgZoomDuring)
      com.svgZoom.on('end', com.svgZoomEnd)
      com.svgZoom.on('start', com.svgZoomStart)

      // ---------------------------------------------------------------------------------------------------
      // programatic zoom to some target and scale - only use the last of any set of ovelapping zoom requests
      // ---------------------------------------------------------------------------------------------------
      runLoop.init({
        tag: 'zoomToTargetMain',
        func: doZoomToTarget,
        nKeep: -1
      })

      // the actual function to be called when a zoom needs to be put in the queue
      zoomToTrgMain = function (optIn) {
        if (!locker.isFree('inInit')) {
          setTimeout(function () {
            zoomToTrgMain(optIn)
          }, timeD.waitLoop)
          return
        }
        if (!locker.isFreeV(['autoZoomTarget'])) return

        let targetName = optIn.target
        let targetScale = optIn.scale
        let durFact = optIn.durFact
        let endFunc = optIn.endFunc

        if (targetScale < zoomLen['0.0']) targetScale = getScale()

        let transTo
        if (targetName === 'init') {
          transTo = [lenD.w[0] / 2, lenD.h[0] / 2]
        } else if (targetName === '' || !hasVar(telData.mini[targetName])) {
          let scale = getScale()
          let trans = getTrans()
          let x = (lenD.w[0] / 2 - trans[0]) / scale
          let y = (lenD.h[0] / 2 - trans[1]) / scale
          transTo = [x, y]

          let diffMin = -1
          targetName = zoomTarget
          $.each(telData.xyr, function (idNow, dataNow) {
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
          transTo = [telData.xyr[targetName].x, telData.xyr[targetName].y]
        }

        let funcStart = function () {
          svgQuick.zoomToTrgQuick({
            target: targetName,
            scale: targetScale,
            durFact: -1
          })

          locker.add({ id: 'autoZoomTarget', override: true })
          if (targetName !== '' && targetName !== 'init') {
            zoomTarget = targetName
          }
        }
        let funcDuring = function () {}
        let funcEnd = function () {
          locker.remove('autoZoomTarget')

          let isDone = true
          if (Math.abs(getScale() - zoomLen['0.0']) < 0.00001) {
            let trans = getTrans()
            if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
              isDone = false
              thisMain.zoomToTrgMain({
                target: 'init',
                scale: zoomLen['0.0'],
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
          svg: svg.svg,
          svgZoom: com.svgZoom,
          svgBox: svg.g,
          svgZoomNode: svg.zoomNode
        }

        if (durFact < 0) {
          outD.durFact = 0
          doZoomToTarget(outD)
        } else {
          runLoop.push({ tag: 'zoomToTargetMain', data: outD })
        }
      }
      thisMain.zoomToTrgMain = zoomToTrgMain

      // ---------------------------------------------------------------------------------------------------
      // create the main svg element
      // ---------------------------------------------------------------------------------------------------
      svg.svg = d3
        .select(svgDiv)
        // .classed("svgInGridStack_outer", true)
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
        .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
        .call(com.svgZoom)
        .on('dblclick.zoom', null)
        .on('wheel', function () {
          d3.event.preventDefault()
        })

      svg.g = svg.svg.append('g')
      // thisMain.svgZoom = com.svgZoom;

      // // ---------------------------------------------------------------------------------------------------
      // // overlying rect, just to add a frame to the entire svg
      // // ---------------------------------------------------------------------------------------------------
      // svg.svg.append("g").selectAll("rect").data([0])
      //   .enter()
      //   .append("rect")
      //     .attr("x", 0).attr("y", 0)
      //     .attr("width", lenD.w[0])
      //     .attr("height", lenD.h[0])
      //     .attr("stroke","#383B42") //.attr("stroke","red")
      //     .attr("stroke-width","3")
      //     .attr("fill", "transparent")
      //     .style("pointer-events", "none")

      // save the svg node to use for d3.zoomTransform() later
      svg.zoomNode = svg.svg.nodes()[0]

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      getScale = function () {
        return d3.zoomTransform(svg.zoomNode).k
      }
      getTrans = function () {
        return [
          d3.zoomTransform(svg.zoomNode).x,
          d3.zoomTransform(svg.zoomNode).y
        ]
      }
      getZoomS = function () {
        return getScale() < zoomLen['1.0'] ? 0 : 1
      }

      svgMain.getScale = getScale
      svgMain.getTrans = getTrans
      svgMain.getZoomS = getZoomS

      // // If the drag behavior prevents the default click, also stop propagation so we don’t click-to-zoom.
      // svg.g.on("click", stopped, true);
      // function stopped() { if (d3.event.defaultPrevented) d3.event.stopPropagation(); }

      // add one circle as background
      // ---------------------------------------------------------------------------------------------------
      svg.g
        .append('g')
        .selectAll('circle')
        .data([0])
        .enter()
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
        gNow: svg.g,
        gTag: 'hex',
        lenWH: [lenD.w[0], lenD.h[0]],
        opac: getScale() < zoomLen['1.0'] ? 0.15 : 0.07,
        hexR: 18
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let vorFunc = d3
        .voronoi()
        .x(function (d) {
          return d.x
        })
        .y(function (d) {
          return d.y
        })
        .extent([[0, 0], [lenD.w[0], lenD.h[0]]])

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      function setTelDataPhysical (dataIn) {
        telData.xyrPhysical = {}
        telData.vor.dataPhysical = []

        // ---------------------------------------------------------------------------------------------------
        // get the width of the initial data (should be most inclusive)
        // ---------------------------------------------------------------------------------------------------
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

          telData.xyrPhysical[id] = { x: x, y: y, r: eleR, isTel: true }
          telData.vor.dataPhysical.push({ id: id, x: x, y: y, r: eleR })
        })

        // ---------------------------------------------------------------------------------------------------
        // use delaunay links to get the closest neighbours of each data-point
        // see: http://christophermanning.org/projects/voronoi-diagram-with-force-directed-nodes-and-delaunay-links/
        // ---------------------------------------------------------------------------------------------------
        let linksV = {}
        $.each(vorFunc.links(telData.vor.dataPhysical), function (
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

        telData.mini = telData.xyrPhysical
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      function setTelDataSubArr (dataIn) {
        telData.xyrSubArr = {}
        telData.vor.dataSubArr = []
        telData.xyrSubArrGrp = []

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

            telData.xyrSubArr[id] = { x: x, y: y, r: eleR, isTel: isTel }

            if (isTel) {
              telData.vor.dataSubArr.push({ id: id, x: x, y: y, r: eleR })
            } else {
              let ttl = hasVar(dataNow.data.N)
                ? dataNow.data.N
                : telInfo.noSubArrTitle()
              telData.xyrSubArrGrp.push({
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

      // ---------------------------------------------------------------------------------------------------
      // create voronoi cells for the dataset. see: https://bl.ocks.org/mbostock/4060366
      // ---------------------------------------------------------------------------------------------------
      telData.vorHov = function (d) {
        if (zoomTarget === d.data.id) return
        if (!locker.isFreeV(['zoom', 'autoZoomTarget'])) return

        let scale = getScale()
        if (scale >= zoomLen['1.0']) return

        zoomTarget = d.data.id
        setState()
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      runLoop.init({ tag: 'vorClickOnce', func: vorClickOnce, nKeep: 1 })

      telData.vorClick = function (optIn) {
        if (locker.isFreeV(['zoom', 'autoZoomTarget'])) {
          runLoop.push({ tag: 'vorClickOnce', data: optIn })
        }
      }

      function vorClickOnce (d) {
        if (!locker.isFree('vorZoomClick')) {
          setTimeout(function () {
            telData.vorClick(d)
          }, timeD.waitLoop / 2)
          return
        }
        locker.add({ id: 'vorZoomClick', override: true })

        let scale = getScale()
        // console.log((scale >= zoomLen["1.0"]),(zoomTarget == d.data.id))

        if (scale < zoomLen['1.0']) {
          telData.vorDblclick({ d: d, isInOut: dblclickZoomInOut })
        } else if (scale >= zoomLen['1.0'] && zoomTarget !== d.data.id) {
          telData.vorDblclick({ d: d, isInOut: false })
        } else {
          zoomTarget = d.data.id
          setState()
        }

        locker.remove({ id: 'vorZoomClick', delay: timeD.animArc })
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      runLoop.init({ tag: 'vorDblclickOnce', func: vorDblclickOnce, nKeep: 1 })

      telData.vorDblclick = function (optIn) {
        if (locker.isFreeV(['zoom', 'autoZoomTarget'])) {
          runLoop.push({ tag: 'vorDblclickOnce', data: optIn })
        }
      }

      function vorDblclickOnce (optIn) {
        if (!locker.isFree('vorZoomDblclick')) {
          setTimeout(function () {
            telData.vorDblclick(optIn)
          }, timeD.waitLoop / 2)
          return
        }
        locker.add({ id: 'vorZoomDblclick', override: true })

        let d = optIn.d
        let zoomInOut = optIn.isInOut
        let scale = getScale()
        let isOnTarget = zoomTarget === d.data.id
        // console.log('vorClick',d.data.id,(scale >= zoomLen["1.0"]),!isOnTarget)

        zoomTarget = d.data.id

        let scaleToZoom = 1
        if (zoomInOut) {
          if (scale < zoomLen['1.2']) scaleToZoom = zoomLen['1.2'] + 0.001
          else scaleToZoom = zoomLen['0.0']
        } else {
          if (scale < zoomLen['0.2'] * 0.999) scaleToZoom = zoomLen['0.2']
          else if (scale < zoomLen['1.0'] * 1.001) scaleToZoom = zoomLen['1.1']
          else scaleToZoom = zoomLen['1.2']
        }

        thisMain.zoomToTrgMain({
          target: zoomTarget,
          scale: scaleToZoom,
          durFact: 1.25
        })

        if (scale >= zoomLen['1.0'] && !isOnTarget) {
          setState()

          askDataS1()
          propsS1({ telId: zoomTarget, clickIn: false, propIn: '' })
        }

        locker.remove({ id: 'vorZoomDblclick', delay: timeD.animArc })
      }

      function setVor () {
        let tagVor = 'vor'
        let vorShowLines = false

        let vor = com.vor.g
          .selectAll('path.' + tagVor)
          .data(vorFunc.polygons(telData.vor.data), function (d) {
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
          .on('mouseover', telData.vorHov)
          .on('click', telData.vorClick)
          .on('dblclick', function (d) {
            telData.vorDblclick({ d: d, isInOut: dblclickZoomInOut })
          })
          // .on("mouseover", function(d) { console.log(d.data.id);  }) // debugging
          .merge(vor)
          .call(function (d) {
            d.attr('d', vorPloyFunc)
          })

        vor.exit().remove()

        // ---------------------------------------------------------------------------------------------------
        // calculation of coordinates for labels, added next
        // ---------------------------------------------------------------------------------------------------
        $.each(propD, function (index, porpNow) {
          s1LblXY[porpNow] = {}

          $.each(telData.vor.data, function (index_, dataNow) {
            let angle = (index + 0.5) * tauFrac + tau / 4
            let labelX = dataNow.r * Math.cos(angle)
            let labelY = dataNow.r * Math.sin(angle)

            s1LblXY[porpNow][dataNow.id] = [labelX, labelY]
          })
        })
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      function setLayoutPhysical (dataIn) {
        if (hasVar(dataIn)) setTelDataPhysical(dataIn)

        if (telData.layout === 'physical') {
          telData.xyr = telData.xyrPhysical
          telData.vor.data = telData.vor.dataPhysical
          links2V.xyz = links2V.physical

          setVor()
          thisMain.subArrGrpCirc([])

          if (locker.isFree('inInit')) {
            if (hasVar(telFocus.target)) {
              if (hasVar(telData.xyr[telFocus.target])) {
                svgMain.zoomToTrgMain({
                  target: telFocus.target,
                  scale: telFocus.scale,
                  durFact: 1
                })
              }
            }
            // thisArrZoomer.setState();
          }
        }
      }
      thisMain.setLayoutPhysical = setLayoutPhysical

      function setLayoutSubArr (dataIn) {
        if (hasVar(dataIn)) setTelDataSubArr(dataIn)

        if (telData.layout === 'subArr') {
          telData.xyr = telData.xyrSubArr
          telData.vor.data = telData.vor.dataSubArr
          links2V.xyz = links2V.subArr

          setVor()

          thisMain.subArrGrpCirc(telData.xyrSubArrGrp)

          if (locker.isFree('inInit')) {
            if (hasVar(telFocus.target)) {
              if (hasVar(telData.xyr[telFocus.target])) {
                // console.log('222222222222');
                if (Math.abs(getScale() - zoomLen['0.0']) > 0.00001) {
                  let trans = getTrans()
                  if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
                    svgMain.zoomToTrgMain({
                      target: telFocus.target,
                      scale: telFocus.scale,
                      durFact: 1
                    })
                  }
                }
              }
            }
          }
        }
      }
      thisMain.setLayoutSubArr = setLayoutSubArr

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      if (!hasVar(com.vor)) {
        // add a voronoi-cell forground joining group members, to facilitate hover selection and area shading
        // ---------------------------------------------------------------------------------------------------
        com.vor = {}
        com.vor.g = svg.g.append('g')
        telData.vor = {}

        // run all variations, just to initialize all the variables
        // (but only the last one will take affect - this will be the default value)
        // ---------------------------------------------------------------------------------------------------
        telData.layout = 'physical' // set the physical layout as the default
        // telData.layout = "subArr";  // set the sub-array layout as the default value

        setLayoutSubArr(subArr)
        setLayoutPhysical(arrInit)

        // // ------------------------------------------------------------------------
        // // ------------------------------------------------------------------------
        // // not working for now ..... commented out from com.jinja2
        // // ------------------------------------------------------------------------
        // if (hasVar(window.sideDiv)) {
        //   let arrayLayout = window.sideDiv.getEle('arrayLayout')
        //   if (hasVar(arrayLayout)) arrayLayout.select(telData.layout)
        // }
        // // ------------------------------------------------------------------------
        // // ------------------------------------------------------------------------
      }

      // ---------------------------------------------------------------------------------------------------
      // some initialization
      // ---------------------------------------------------------------------------------------------------
      if (!hasVar(com.arcTween)) {
        // see: http://bl.ocks.org/mbostock/5100636
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
      }
      // state-01 initialization (needed before s01inner(), s01outer())
      if (!hasVar(com.s00)) {
        com.s00 = {}
        com.s00.g = svg.g.append('g')
      }
      if (!hasVar(com.s01)) {
        com.s01 = {}
        com.s01.g = svg.g.append('g')
      }
      // state-1 initialization (needed before updateLiveDataS1())
      if (!hasVar(com.s10)) {
        com.s10 = {}
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      setState()

      locker.remove('inInitMain')
    }
    this.initData = initData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
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
      let isChange = telData.layout !== id

      if (isChange || hasVar(data)) {
        locker.expires({ id: 'setStateLock', duration: timeD.animArc / 2 })
      }

      if (id === 'physical') {
        if (updtId) telData.layout = id
        thisMain.setLayoutPhysical(data)
      } else if (id === 'subArr') {
        if (updtId) telData.layout = id
        thisMain.setLayoutSubArr(data)
      } else {
        console.error(' - trying to set undefined layout', id)
        return
      }

      if ((updtId && isChange) || hasVar(data)) {
        setState()

        if (getZoomS() === 1) {
          $.each(s10V, function (index, eleNow) {
            eleNow.s10.updatePosG(timeD.animArc)
          })
        }
      }
    }
    this.setTelLayout = setTelLayout

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function s00circ (optIn) {
      let dataV = hasVar(optIn.dataV) ? optIn.dataV : telData.tel
      let gNow = hasVar(optIn.gNow) ? optIn.gNow : com.s00.g
      let posTag = hasVar(optIn.posTag) ? optIn.posTag : 'xyr'
      let focusV0 = hasVar(optIn.focusV0) ? optIn.focusV0 : []
      let focusV1 = hasVar(optIn.focusV1) ? optIn.focusV1 : []
      let tagNow = prop0

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

      // operate on new elements only
      let circ = gNow.selectAll('circle.' + tagNow).data(dataV, function (d) {
        return d.id
      })

      circ
        .enter()
        .append('circle')
        .attr('class', tagNow)
        .style('opacity', '0')
        .attr('r', 0)
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
        .style('opacity', function (d) {
          if (isFocused(d, 1)) return 0.01
          else if (isFocused(d, 0)) return 0.07
          else return 1
        })
        .attr('r', function (d) {
          let r = telData[posTag][d.id].r * rScale[0].health2
          if (isFocused(d, 1)) return r * 2
          else if (isFocused(d, 0)) return r * 1.1
          else return r
        })
    }
    this.s00circ = s00circ

    function subArrGrpCirc (dataV) {
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
    this.subArrGrpCirc = subArrGrpCirc

    // ---------------------------------------------------------------------------------------------------
    // add a lable with the
    // ---------------------------------------------------------------------------------------------------
    function s00title (focusV0, focusV1) {
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
        com[tagLbl].g = svg.g.append('g')
      }

      let text = com[tagLbl].g
        .selectAll('text.' + tagLbl)
        .data(telData.tel, function (d) {
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
            'translate(' + telData.xyr[d.id].x + ',' + telData.xyr[d.id].y + ')'
          )
        })
        .attr('text-anchor', 'middle')
        .merge(text)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('transform', function (d, i) {
          let shiftVal = 0
          if (isFocused(d, 1)) {
            shiftVal = telData.xyr[d.id].r * (rScale[1].health1 + 0.5)
          }
          return (
            'translate(' +
            telData.xyr[d.id].x +
            ',' +
            (telData.xyr[d.id].y - shiftVal) +
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

    // ---------------------------------------------------------------------------------------------------
    // innner arcs for the different properties
    // ---------------------------------------------------------------------------------------------------
    function s01inner (dataV, focusV) {
      let tagState = 'state01'

      if (!hasVar(com.s01.inner)) {
        com.s01.inner = true

        $.each(propD, function (index, porpNow) {
          $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
            let tagNow = porpNow + nArcDrawNow
            let is0 = nArcDrawNow === 0

            arcFunc[tagNow] = {}
            arcFunc[tagNow].rad00 = function (d) {
              return telData.xyr[d.id].r * (is0 ? 0.85 : 0.81)
            }
            arcFunc[tagNow].rad01 = function (d) {
              return telData.xyr[d.id].r * (is0 ? 0.95 : 0.99)
            }
            arcFunc[tagNow].rad10 = function (d) {
              return telData.xyr[d.id].r * rScale[1].innerH0 * (is0 ? 1 : 0.97)
            }
            arcFunc[tagNow].rad11 = function (d) {
              return telData.xyr[d.id].r * rScale[1].innerH1 * (is0 ? 1 : 1.03)
            }
            arcFunc[tagNow].ang00 = function (d) {
              return index * tauFrac + tauSpace
            }
            arcFunc[tagNow].ang01 = function (d) {
              return (
                index * tauFrac +
                tauSpace +
                (tauFrac - tauSpace * 2) * (is0 ? 1 : telHealthFrac(d[porpNow]))
              )
            }
          })
        })
      }

      // ---------------------------------------------------------------------------------------------------
      // innner arcs for the different properties
      // ---------------------------------------------------------------------------------------------------
      let focusIdV = []
      if (focusV !== undefined && focusV != null) {
        $.each(focusV, function (index, dataNow) {
          focusIdV.push(dataNow.id)
        })
      }

      $.each(propD, function (index, porpNow) {
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
                telData.xyr[d.id].x +
                ',' +
                telData.xyr[d.id].y +
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
                telData.xyr[d.id].x +
                ',' +
                telData.xyr[d.id].y +
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
      })

      focusIdV = null
    }

    // outer rings for the prop0 (equivalent of s00_D metric in s01_D)
    // ---------------------------------------------------------------------------------------------------
    function s01outer (dataV, focusV) {
      let tagState = 'state01'
      let porpNow = prop0

      if (!hasVar(com.s01.outer)) {
        com.s01.outer = true

        $.each([0, 1], function (nArcDrawNow, nArcDrawNow_) {
          let tagNow = porpNow + nArcDrawNow
          let is0 = nArcDrawNow === 0

          arcFunc[tagNow] = {}
          arcFunc[tagNow].rad00 = function (d) {
            return telData.xyr[d.id].r * rScale[0].health0 * (is0 ? 1 : 0.95)
          }
          arcFunc[tagNow].rad01 = function (d) {
            return telData.xyr[d.id].r * rScale[0].health1 * (is0 ? 1 : 1.05)
          }
          arcFunc[tagNow].rad10 = function (d) {
            return telData.xyr[d.id].r * rScale[1].health0 * (is0 ? 1 : 0.98)
          }
          arcFunc[tagNow].rad11 = function (d) {
            return telData.xyr[d.id].r * rScale[1].health1 * (is0 ? 1 : 1.02)
          }
          arcFunc[tagNow].ang00 = function (d) {
            return 0
          }
          arcFunc[tagNow].ang01 = function (d) {
            return is0 ? tau : tau * telHealthFrac(d[prop0])
          }
        })
      }

      // ---------------------------------------------------------------------------------------------------
      // innner arcs for the different properties
      // ---------------------------------------------------------------------------------------------------
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
              telData.xyr[d.id].x +
              ',' +
              telData.xyr[d.id].y +
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
              telData.xyr[d.id].x +
              ',' +
              telData.xyr[d.id].y +
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
    //     if(eleNow.id == zoomTarget) hasId = true;
    //   })
    //   return hasId;
    // }
    // this.hasS10main = hasS10main;

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function s10main (dataIn) {
      // console.log('s10main',zoomTarget,dataIn);

      let maxEleKeep = 1
      let childV = hasVar(dataIn) ? dataIn.data : null

      if (childV) {
        let telId = dataIn.id

        $.each(propD, function (index, porpNow) {
          telData.propDataS1[telId] = {}
          telData.propDataS1[telId][porpNow] = null
          telData.propParentS1[telId] = {}
          telData.propParentS1[telId][porpNow] = ''
          telData.propTitleS1[telId] = {}
          telData.propTitleS1[telId][porpNow] = ''
        })

        // construct the dataBase object b hand, as some properties may not be included in propD
        telData.dataBaseS1[telId] = {}
        telData.dataBaseS1[telId].id = prop0
        telData.dataBaseS1[telId].val = dataIn[prop0]
        telData.dataBaseS1[telId].children = []
        // console.log('qqqqqqqq',telId,dataIn.data.val,dataIn.data)

        $.each(childV, function (indexData, childNow) {
          let porpNow = childNow.id
          if (propD.indexOf(porpNow) >= 0) {
            // add a reference to each property
            telData.propDataS1[telId][porpNow] = childNow
            telData.propParentS1[telId][porpNow] = porpNow

            // also add a reference for each level of the hierarchy which has a sub-hierarchy of its own
            addChildren(childNow, telId, porpNow)

            // build up the baseData object
            telData.dataBaseS1[telId].children.push(childNow)
          }
        })
      }

      function addChildren (dataNow, telId, porpNow) {
        if (dataNow.children) {
          dataNow.children.forEach(function (d, i) {
            if (d.children) {
              telData.propDataS1[telId][d.id] = d
              addChildren(d, telId, porpNow)
            }
            telData.propParentS1[telId][d.id] = porpNow
            telData.propTitleS1[telId][d.id] = d.ttl
          })
        }
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
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

          if (id !== zoomTarget) {
            // s10.clickBckArc(null);
            s10.bckArcRemove() // console.log('clickBckArc s10 111')
          }
        })
      }

      let s10 = null
      $.each(s10V, function (index, eleNow) {
        if (eleNow.id === zoomTarget) s10 = eleNow.s10
      })
      if (!s10) {
        // ---------------------------------------------------------------------------------------------------
        //
        // ---------------------------------------------------------------------------------------------------
        let S10obj = function (telId) {
          let thisS10 = this
          this.telId = telId

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

          this.hirchData = {}
          $.each(propD, function (index, porpNow) {
            thisS10.hirchData[porpNow] = null
          })

          this.getDate = function () {
            return myDate
          }

          let wh = telData.xyr[telId].r * rScale[1].innerH1 * 1.6

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          function init () {
            if (gBase) {
              myDate = Date.now()
            } else {
              gBase = svg.g.append('g')

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

                if (propD.indexOf(porpNow) >= 0) {
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
          this.init = init

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          function updatePosG (duration) {
            let gBaseTrans = [
              telData.xyr[telId].x - wh / 2,
              telData.xyr[telId].y - wh / 2
            ]

            gBase
              .transition('updtPos')
              .duration(duration)
              .attr('transform', function (d) {
                return 'translate(' + gBaseTrans[0] + ',' + gBaseTrans[1] + ')'
              })
          }
          this.updatePosG = updatePosG

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
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
          this.cleanup = cleanup

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          function setPropLbl (optIn) {
            // due to delays from locker, this function could be called after the S10obj has
            // been removed - make a safety check using gBase...
            if (!hasVar(gBase)) return

            let baseTag = 's10arc'
            let tagLbl = baseTag + '_propLbl'
            let propIn = hasVar(optIn.propIn) ? optIn.propIn : ''
            let remove = hasVar(optIn.remove) ? optIn.remove : false

            if (propIn !== '') {
              if (propD.indexOf(propIn) < 0) {
                if (hasVar(telData.propParentS1[telId][propIn])) {
                  propIn = telData.propParentS1[telId][propIn]
                }
              }
            }

            let textD = []
            if (getZoomS() === 1 && !remove) {
              $.each(propD, function (index, porpNow) {
                let state = 0
                if (propIn !== '') {
                  state = propIn === porpNow ? 1 : 2
                }

                let txtR = telData.xyr[telId].r * rScale[1].innerH1 * 1.45
                let xy = getPropPosShift('xy', txtR, index)

                textD.push({
                  id: tagLbl + porpNow,
                  text: propTtlD[porpNow],
                  h: 30 / zoomLen['1.3'],
                  xy: xy,
                  x: wh / 2 - xy[0],
                  y: wh / 2 - xy[1],
                  strkW: state === 1 ? 3 : 0,
                  opac: state === 1 ? 0.9 : state === 2 ? 0.1 : 0.7,
                  anch:
                    Math.abs(xy[0] / telData.xyr[telId].r) < 0.001
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

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          function initBckArc () {
            // due to delays from locker, this function could be called after the S10obj has
            // been removed - make a safety check using gBase...
            if (!hasVar(gBase)) return

            // console.log('initBckArc')
            $.each(telData.propDataS1[telId], function (porpNow, dataNow) {
              if (dataNow) {
                let baseTag = 's10arc'
                let tagNow = baseTag + porpNow
                // let is0 = 1

                let nProp = propD.indexOf(porpNow)
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
                      return telData.xyr[telId].r * rScale[1].innerH1 * 0.1
                    }
                    arcFunc[tagNow].rad01 = function (d) {
                      return telData.xyr[telId].r * rScale[1].innerH1 * 0.8
                    }
                    arcFunc[tagNow].rad10 = function (d) {
                      return telData.xyr[telId].r * rScale[1].innerH1 * 0.85
                    }
                    arcFunc[tagNow].rad11 = function (d) {
                      return telData.xyr[telId].r * rScale[1].innerH1 * 1.35
                    }
                    arcFunc[tagNow].ang00 = function (d) {
                      return nProp * tauFrac + tauSpace
                    }
                    arcFunc[tagNow].ang01 = function (d) {
                      return (nProp + 1) * tauFrac - tauSpace
                    }
                    arcFunc[tagNow].ang10 = function (d) {
                      return 0
                    }
                    arcFunc[tagNow].ang11 = function (d) {
                      return tau
                    }
                    arcFunc[tagNow].ang20 = function (d) {
                      return nProp * tauFrac
                    }
                    arcFunc[tagNow].ang21 = function (d) {
                      return (nProp + 1) * tauFrac
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
                    ? telHealthCol(telData.propDataS1[telId][d.porpNow].val)
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
          this.initBckArc = initBckArc

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          let prevFocusedProp = ''
          function isClickIn (propIn) {
            return prevFocusedProp !== propIn
          }
          function setPrevProp (propIn) {
            prevFocusedProp = propIn
          }

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          function bckArcRemove () {
            // due to delays from locker, this function could be called after the S10obj has
            // been removed - make a safety check using gBase...
            if (!hasVar(gBase)) return

            locker.add('s10bckArcChange')

            //
            hirchStyleClick({ propIn: '', id: '', isOpen: false })

            //
            $.each(propD, function (index, porpNow) {
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
          this.bckArcRemove = bckArcRemove

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          function bckArcClick (optIn) {
            // due to delays from locker, this function could be called after the S10obj has
            // been removed - make a safety check using gBase...
            if (!hasVar(gBase)) return

            let clickIn = optIn.clickIn
            let propIn = optIn.propIn
            let onlyOpen = hasVar(optIn.onlyOpen) ? optIn.onlyOpen : false
            let canIgnore = hasVar(optIn.canIgnore) ? optIn.canIgnore : true

            if (propD.indexOf(propIn) < 0 && propIn !== '') return

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

            // ---------------------------------------------------------------------------------------------------
            //
            // ---------------------------------------------------------------------------------------------------
            $.each(propD, function (index, porpNow) {
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
            } else {
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
              svgMain.zoomToTrgMain({
                target: telId,
                scale: zoomLen['1.2'],
                durFact: 1
              })
            }

            freeMe(true)
          }
          this.bckArcClick = bckArcClick

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          function fullArcs (path0, path1, tagNow, isOpen) {
            // console.log('fullArcs',tagNow,isOpen)

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

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          function hideArcs (path, tagNow) {
            // console.log('hideArcs',tagNow)
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

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          function hirchHovTitleIn (dIn) {
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
            let dy = wh + 2 * r * telData.xyr[telId].r / lenD.r.s00[2]

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

          function hirchHovTitleOut (dIn) {
            gBase
              .selectAll('text.' + 'hovTitle')
              .filter(function (d) {
                return hasVar(dIn) ? d.id === dIn.data.id : true
              })
              .transition('update1')
              .duration(timeD.animArc)
              .style('opacity', '0')
              .remove()
          }

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
          function initHirch () {
            // due to delays from locker, this function could be called after the S10obj has
            // been removed - make a safety check using gBase...
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

              if (propD.indexOf(porpNow) >= 0) {
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
                      // here we can set non propD names if needed.....
                      // console.log('_setPropLblInitHirch',d.data.id); setPropLbl({ propIn:d.data.id });
                      // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                    }
                  })
                }
              }
            })
          }
          this.initHirch = initHirch

          // setTimeout(function() {
          //   console.log('==========================')
          //   porpNow = "mirror"
          //   // hirchName = "mirror_1_1"
          //   hirchName = porpNow
          //   hirchStyleClick({ propIn:porpNow, id:hirchName isOpen:true })

          // }, 4000);

          //
          function hirchStyleClick (optIn) {
            // due to delays from locker, this function could be called after the S10obj has
            // been removed - make a safety check using gBase...
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

            if (getZoomS() === 1) {
              let arrZoomerProp = isOpen ? syncProp : ''
              syncStateSend({
                type: 'syncArrZoomerProp',
                syncTime: Date.now(),
                telId: zoomTarget,
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
          thisMain.hirchStyleClick = hirchStyleClick

          // ---------------------------------------------------------------------------------------------------
          //
          // ---------------------------------------------------------------------------------------------------
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
            $.each(propD, function (index, porpNow) {
              let baseTag = 's10arc'
              let tagNow = baseTag + porpNow
              let path = gBckArc.selectAll('path.' + tagNow)

              path
                .transition('updtData')
                .duration(timeD.animArc)
                .each(function (d) {
                  if (d.nArc === 0) {
                    d.col = telHealthCol(
                      telData.propDataS1[telId][porpNow].val
                    )
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
          this.updateHirch = updateHirch

          // ---------------------------------------------------------------------------------------------------
          // utility functions
          // ---------------------------------------------------------------------------------------------------
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
        }

        s10 = new S10obj(zoomTarget)
        s10V.push({ id: zoomTarget, s10: s10 })
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

            if (hasVar(telData.propDataS1[eleNow.id])) {
              delete telData.propDataS1[eleNow.id]
              delete telData.propParentS1[eleNow.id]
              delete telData.propTitleS1[eleNow.id]
              delete telData.dataBaseS1[eleNow.id]
            }
          })

          s10in = null
          s10out = null
          s10indexDate = null
        })()
      }

      s10.init()
    }
    this.s10main = s10main

    function bckArcClick (optIn) {
      $.each(s10V, function (index, eleNow) {
        if (eleNow.id === zoomTarget) {
          eleNow.s10.bckArcClick(optIn)
        }
      })
    }
    this.bckArcClick = bckArcClick

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateS1 (dataIn) {
      $.each(s10V, function (index, eleNow) {
        if (eleNow.id === dataIn.id) {
          eleNow.s10.updateHirch(dataIn.data)
        }
      })
    }
    this.updateS1 = updateS1

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setStateOnce () {
      // console.log('setState_main main',getScale())
      let scale = getScale()
      let zoomS = getZoomS()

      if (zoomS === 0) {
        s10main(null)
      }

      if (scale <= zoomLen['0.1']) {
        s00circ({})
        s00title([], [])
        s01inner([])
        s01outer([])
      } else {
        // let zoomTargetIndex = telData.idToIndex[zoomTarget];
        // let arrPropVtarget = [ telData.tel[zoomTargetIndex] ];

        let arrPropVon = []
        let arrPropVoff = []
        let arrPropVtarget = []
        $.each(telData.tel, function (index, dataNow) {
          if (zoomTarget === dataNow.id || !hasVar(links2V.xyz[zoomTarget])) {
            zoomTarget = dataNow.id
            arrPropVon.push(dataNow)
            arrPropVtarget.push(dataNow)
          } else {
            // arrPropVoff.push(dataNow)
            if (links2V.xyz[zoomTarget].indexOf(dataNow.id) < 0) {
              arrPropVoff.push(dataNow)
            } else {
              arrPropVon.push(dataNow)
            }
          }
        })

        s00circ({ focusV0: arrPropVon, focusV1: arrPropVtarget })

        if (zoomS === 0) {
          s01inner(arrPropVtarget)
          s01outer(arrPropVon)

          s00title(arrPropVon, [])
        } else {
          s00title(arrPropVon, arrPropVtarget)

          s01inner(arrPropVtarget, arrPropVtarget)
          s01outer(arrPropVon, arrPropVtarget)

          // ---------------------------------------------------------------------------------------------------
          // syncroniz changes with other panels
          // ---------------------------------------------------------------------------------------------------
          syncStateSend({
            type: 'syncTelFocus',
            syncTime: Date.now(),
            zoomState: getZoomS(),
            target: zoomTarget
          })
        }

        arrPropVtarget = null
      }
    }
    this.setStateOnce = setStateOnce

    function askDataS1 () {
      let zoomS = getZoomS()
      if (zoomS === 0) return

      sock.widgetV[widgetType].SockFunc.askDataS1({
        widgetId: widgetId,
        zoomState: zoomS,
        zoomTarget: zoomTarget
      })
    }
    this.askDataS1 = askDataS1

    function setWidgetState () {
      sock.widgetV[widgetType].SockFunc.setWidgetState({
        widgetId: widgetId,
        zoomState: getZoomS(),
        zoomTarget: zoomTarget
      })
    }
  }

  let svgMain = new SvgMain() // must come first
  let svgDetail = new SvgDetail()
  let svgQuick = new SvgQuick()

  // // ---------------------------------------------------------------------------------------------------
  // // ---------------------------------------------------------------------------------------------------
  // svgMain.zoomToTrgMain({ target:'M_9',  scale:zoomLen["1.2"], durFact:0.1 });
  // svgMain.zoomToTrgMain({ target:'init', scale:zoomLen["0.0"], durFact:0.1 });
  // svgMain.zoomToTrgMain({ target:'L_1',  scale:zoomLen["1.2"], durFact:2.0 });
  // // ---------------------------------------------------------------------------------------------------
  // // ---------------------------------------------------------------------------------------------------
}
