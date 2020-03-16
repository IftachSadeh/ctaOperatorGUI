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
  script: '/js/arrZoomer/utils_arrZoomerTree.js'
})
window.loadScript({
  source: mainScriptTag,
  script: '/js/arrZoomer/utils_arrZoomerProc.js'
})

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerBase = function (optIn0) {
  let thisTop = this
  let myUniqueId = unique()
  let runLoop = optIn0.runLoop
  let sgvTag = optIn0.sgvTag
  let widgetId = optIn0.widgetId
  let widgetSource = optIn0.widgetSource
  let locker = optIn0.locker
  let isSouth = optIn0.isSouth
  let widgetType = optIn0.widgetType
  let sock = optIn0.sock
  let svg = optIn0.svg
  let lockInitKey = optIn0.lockInitKey

  let eleOpts = optIn0.eleOpts
  let doEle = eleOpts.doEle
  // let rScale = instruments.rScale

  thisTop.hasInit = false

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  let elements = {}
  function getEle(tag) {
    return elements[tag]
  }
  thisTop.getEle = getEle

  function setEle(eleIn, tag) {
    elements[tag] = eleIn
    return
  }
  thisTop.setEle = setEle


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  let svgD = {}
  thisTop.svgD = svgD
  svgD.main = {}
  svgD.mini = {}
  svgD.ches = {}
  svgD.tree = {}
  svgD.proc = {}
  svgD.gSvg = svg.append('g')

  let interpolate01 = d3.interpolate(0, 1)
  thisTop.interpolate01 = interpolate01

  let zoomD = {}
  thisTop.zoomD = zoomD
  zoomD.target = ''

  let instruments = {}
  thisTop.instruments = instruments
  
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

  let telTypeV = telInfo.getIds()

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  let lockInitKeys = {
    main: 'inArrZoomerInitMain' + myUniqueId,
    ches: 'inArrZoomerInitChes' + myUniqueId,
    mini: 'inArrZoomerInitMini' + myUniqueId,
    tree: 'inArrZoomerInitTree' + myUniqueId,
  }
  thisTop.lockInitKeys = lockInitKeys

  let initEleKeys = []
  $.each(doEle, function(i, d) {
    if (d)   {
      initEleKeys.push(lockInitKeys[i])
      locker.add(lockInitKeys[i])
    }
  })

  runWhenReady({
    pass: function () {
      return locker.isFreeV(initEleKeys)
    },
    execute: function () {
      locker.remove(lockInitKey)
    }
  })


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function isTelTypeIn(tag, telId) {
    let telTypesEle = {
      main: ['LST'],
    }

    return (telTypesEle[tag].indexOf(thisTop.telTypes[telId]) !== -1)
  }
  thisTop.isTelTypeIn = isTelTypeIn


  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function initInstProps (dataIn) {
    let telPropTypes = dataIn.telPropTypes
    
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

    $.each(telPropTypes, function (idNow, typeV) {
      // if (!isTelTypeIn('main', idNow)) return

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

    return
  }



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
      // if (!isTelTypeIn('main', id)) {
      //   console.log(id,dataNow)
      // }
      // if (!isTelTypeIn('main', id)) return
      
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
    let propsNow = instruments.props0[instruments.data.avg.id]
    $.each(propsNow, function (index, porpNow) {
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

    return
  }
  thisTop.setTelData = setTelData


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function getTelProps (keys, telId) {
    return keys.filter(function (k) {
      return instruments.props[telId].indexOf(k) !== -1
    })
  }
  thisTop.getTelProps = getTelProps
  
  function getTauFrac (nProps) {
    return tau / nProps
  }
  thisTop.getTauFrac = getTauFrac

  function getPropPosShift (xy, r, nPropNow, nProps) {
    let angle = (nPropNow + 0.5) * getTauFrac(nProps) + tau / 4
    let labelX = r * Math.cos(angle)
    let labelY = r * Math.sin(angle)

    if (xy === 'x') return labelX
    if (xy === 'y') return labelY
    else if (xy === 'xy') return [labelX, labelY]
    else return null
  }
  thisTop.getPropPosShift = getPropPosShift

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
  thisTop.isStateUp = isStateUp

  function isStateDown (scale, scaleTag) {
    return zoomD.len.prev >= zoomD.len[scaleTag] && scale < zoomD.len[scaleTag]
  }
  thisTop.isStateDown = isStateDown

  function isStateChange (scale, scaleTag) {
    return isStateUp(scale, scaleTag) || isStateDown(scale, scaleTag)
  }
  thisTop.isStateChange = isStateChange

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function initData (dataIn) {
    thisTop.telTypes = dataIn.telTypes

    initInstProps(dataIn)

    setTelData(dataIn.arrProp, true)

    // arbitrary but safe initialization of target
    zoomD.target = instruments.data.tel[0].id 


    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function addUserOpts(optIn, eleTag) {
      if (!hasVar(eleOpts[eleTag])) return

      $.each(eleOpts[eleTag], function(i, d) {
        optIn[i] = d
      })

      return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    let eleOptsMain = {
      runLoop: runLoop,
      sgvTag: sgvTag,
      widgetId: widgetId,
      locker: locker,
      isSouth: isSouth,
      myUniqueId: myUniqueId,
      noRender: !doEle.main,
      widgetType: widgetType,
      eleBase: thisTop,
    }
    addUserOpts(eleOptsMain, 'main')
    
    let eleMain = new ArrZoomerMain(eleOptsMain)
    eleMain.initData(dataIn)

    if (doEle.main) {
      if(hasVar(eleOpts.trans.main)) {
        eleMain.setTransform(eleOpts.trans.main)
      }
    }
    
    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (doEle.tree) {
      let eleOptsTree = {
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        myUniqueId: myUniqueId,
        eleBase: thisTop,
      }      
      addUserOpts(eleOptsTree, 'tree')
      
      let eleTree = new ArrZoomerTree(eleOptsTree)
      eleTree.initData(dataIn)

      if(hasVar(eleOpts.trans.tree)) {
        eleTree.setTransform(eleOpts.trans.tree)
      }
    }
    
    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (doEle.ches) {
      let eleOptsChes = {
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        eleBase: thisTop,
      }
      addUserOpts(eleOptsChes, 'ches')

      let eleChes = new ArrZoomerChes(eleOptsChes)
      eleChes.initData({
        instrumentData: {
          tel: instruments.data.tel,
          mini: instruments.data.mini,
          xyr: instruments.data.xyr,
          vorDblclick: instruments.data.dblclick
        },
        telTypeV: telTypeV
      })

      if(hasVar(eleOpts.trans.ches)) {
        eleChes.setTransform(eleOpts.trans.ches)
      }
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (doEle.mini) {
      let eleOptsMini = {
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        myUniqueId: myUniqueId,
        eleBase: thisTop,
      }
      addUserOpts(eleOptsMini, 'mini')
      
      let eleMini = new ArrZoomerMini(eleOptsMini)
      eleMini.initData({
        instrumentData: {
          tel: instruments.data.tel,
          vor: { data: instruments.data.vor.data },
          mini: instruments.data.mini,
          xyr: instruments.data.xyr,
          vorDblclick: instruments.data.dblclick
        },
        telTypeV: telTypeV
      })

      if(hasVar(eleOpts.trans.mini)) {
        eleMini.setTransform(eleOpts.trans.mini)
      }
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (doEle.proc) {
      let eleOptsProc = {
        runLoop: runLoop,
        sgvTag: sgvTag,
        widgetId: widgetId,
        locker: locker,
        isSouth: isSouth,
        myUniqueId: myUniqueId,
        eleBase: thisTop,
      }      
      addUserOpts(eleOptsProc, 'proc')
      
      let eleProc = new ArrZoomerProc(eleOptsProc)
      eleProc.initData(dataIn)

      if(hasVar(eleOpts.trans.proc)) {
        eleProc.setTransform(eleOpts.trans.proc)
      }
    }

    return
  }
  thisTop.initData = initData


  // ------------------------------------------------------------------
  //
  // for s0 we acculumate all updates (each one is a 
  // subset of all elements which had some change)
  // for s1 we take ony the latest update (each one 
  // is a full update of all the data)
  // ------------------------------------------------------------------
  runLoop.init({
    tag: '_s00update_'+myUniqueId, 
    func: updateS0, 
    nKeep: -1, 
    wait: 500,
  })
  runLoop.init({
    tag: '_s11update_'+myUniqueId, 
    func: updateS1, 
    nKeep: 1, 
    wait: 500,
  })
  runLoop.init({
    tag: 'subArrUpdate'+myUniqueId,
    func: subArrUpdate,
    nKeep: 1,
    wait: 500,
  })

  function updateData (dataIn) {
    if (!locker.isFree('inInit')) return

    if (dataIn.type === 's00') {
      runLoop.push({ tag: '_s00update_'+myUniqueId, data: dataIn })
    } 
    else if (dataIn.type === 's11') {
      runLoop.push({ tag: '_s11update_'+myUniqueId, data: dataIn })
    } 
    else if (dataIn.type === 'subArr') {
      runLoop.push({ tag: 'subArrUpdate'+myUniqueId, data: dataIn })
    } 
    else {
      console.error('undefined tag for dataIn = ', dataIn, ' !!!!!! ')
    }
  }
  thisTop.updateData = updateData

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
    if (getEle('main').getZoomS() === 0) return

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

    // if by the time the update has arrived, 
    // were already gone from this element...
    if (!hasVar(instruments.data.propDataS1[telId])) {
      // console.log('-+-> updateS1: could not find',telId,'in instruments.data.propDataS1')
      return
    }
    // console.log('````',dataIn,instruments.data.propDataS1[telId]);

    locker.add('dataChange')

    // ------------------------------------------------------------------
    // update the underlying data
    // ------------------------------------------------------------------
    let propsNow = getTelProps(
      Object.keys(instruments.data.propDataS1[telId]), telId)
    
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

    getEle('main').updateS1(dataIn)
    if (getEle('tree')) {
      getEle('tree').updateS1(dataIn)
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

    getEle('main').setTelLayout({ 
      id: 'subArr', data: dataIn.data, updtId: false,
    })

    return
  }

  function setTelLayout (idNow) {
    getEle('main').setTelLayout({
      id: idNow, data: null, updtId: true, 
    })
  }
  thisTop.setTelLayout = setTelLayout

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  runLoop.init({ tag: 'setState'+myUniqueId, func: setStateOnce, nKeep: 1 })

  function setState () {
    runLoop.push({ tag: 'setState'+myUniqueId })
  }
  thisTop.setState = setState

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

    getEle('main').setStateOnce()
    if (getEle('tree')) {
      getEle('tree').setStateOnce()
    }
    if (getEle('mini')) {
      getEle('mini').setStateOnce()
    }
    if (getEle('ches')) {
      getEle('ches').setStateOnce()
    }

    locker.remove({ id: 'setStateLock', delay: timeD.animArc * 2 })
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  runLoop.init({ tag: '_s1props_'+myUniqueId, func: propsS1Once, nKeep: -1 })

  function propsS1 (optIn) {
    // console.log('setState',getEle('main').getZoomS(),getScale())
    runLoop.push({ tag: '_s1props_'+myUniqueId, data: optIn })
  }
  // this.propsS1 = propsS1;
  thisTop.propsS1 = propsS1

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

    if (getEle('tree')) {
      if (doTelHirch) getEle('tree').telHirch(optIn)
    }

    if (doBckArcClick) {
      optIn.canIgnore = false
      getEle('main').bckArcClick(optIn)
    }

    locker.remove('s1propsChange')
  }

  // ------------------------------------------------------------------
  // activate a listener for getting the s1 data - this is needed 
  // in case the same data are sent more
  // then once (can happen if one element is requested, but 
  // by the time the transitions to open it
  // has ended, another was already requested too).
  // ------------------------------------------------------------------
  runLoop.init({ tag: '_getDataS1_'+myUniqueId, func: getDataS1Once, nKeep: 1 })

  function getDataS1 (widgetIdIn, dataIn) {
    // just in case... should not be needed
    if (widgetIdIn !== widgetId) {
      console.error('id mismatch', widgetIdIn, widgetId)
      return
    }
    // console.log('-client- getDataS1',dataIn)

    if (getEle('main').getZoomS() === 1) {
      runLoop.push({ tag: '_getDataS1_'+myUniqueId, data: dataIn })
    }
  }
  thisTop.getDataS1 = getDataS1

  function getDataS1Once (dataIn) {
    if (
      getEle('main').getZoomS() === 1 &&
      getEle('main').syncD.zoomTarget !== dataIn.data.id
    ) {
      getEle('main').syncD.zoomTarget = dataIn.data.id

      getEle('main').s10main(dataIn.data)

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

      getEle('main').zoomToTrgMain({
        target: target,
        scale: scale,
        durFact: 1,
        endFunc: function () {
          // locker.remove("syncStateGet");
          getEle('main').askDataS1()
        }
      })
    }

    return
  }
  thisTop.syncStateGet = syncStateGet

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  runLoop.init({
    tag: 'syncStateSend'+myUniqueId,
    func: _syncStateSend,
    nKeep: 1,
    wait: timeD.waitSyncState
  })

  function syncStateSend (dataIn) {
    runLoop.push({ tag: 'syncStateSend'+myUniqueId, data: dataIn })
  }
  thisTop.syncStateSend = syncStateSend

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

    return
  }

  // ------------------------------------------------------------------
  // ask for update for state1 data for a given module
  // ------------------------------------------------------------------
  function sockAskDataS1 (optIn) {
    if (sock.conStat.isOffline()) return

    let data = {}
    data.widgetId = widgetId
    data.zoomState = optIn.zoomState
    data.zoomTarget = optIn.zoomTarget

    let dataEmit = {
      widgetSource: widgetSource,
      widgetName: widgetType,
      widgetId: widgetId,
      methodName: 'arrZoomerAskDataS1',
      methodArgs: data,
    }

    sock.socket.emit('widget', dataEmit)

    return
  }
  thisTop.sockAskDataS1 = sockAskDataS1


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function setZoomState () {
    if (sock.conStat.isOffline()) return

    let mainWidgetState = getEle('main').getWidgetState()
    
    let treeWidgetState = {}
    if (getEle('tree')) {
      treeWidgetState = getEle('tree').getWidgetState()
    } 
    else {
      function getWidgetState () {
        return {
          zoomTargetProp: '',
        }
      }
      treeWidgetState['zoomTargetProp'] = getWidgetState()
    }

    let dataWidget = {}
    dataWidget.widgetId = widgetId
    dataWidget.zoomState = mainWidgetState.zoomState
    dataWidget.zoomTarget = mainWidgetState.zoomTarget
    dataWidget.zoomTargetProp = treeWidgetState.zoomTargetProp

    let dataEmit = {
      widgetSource: widgetSource,
      widgetName: widgetType,
      widgetId: widgetId,
      methodName: 'arrZoomerSetWidgetState',
      methodArgs: dataWidget
    }

    sock.socket.emit('widget', dataEmit)

    return
  }
  thisTop.setZoomState = setZoomState

  // ------------------------------------------------------------------
  // get update for state1 data which was explicitly asked for by a given module
  // ------------------------------------------------------------------
  sock.socket.on('arrZoomerGetDataS1', function (data) {
    if (sock.conStat.isOffline()) return

    if (data.id !== '' && data.type === 's11') {
      // console.log('-server- getDataS1 ',data);
      if (hasVar(sock.widgetV[widgetType].widgets[data.widgetId])) {
        thisTop.getDataS1(data.widgetId, data)
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
        thisTop.updateData(data)
      }
    })
  })

  return
}

