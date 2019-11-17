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
var mainScriptTag = 'azPlots'
// ------------------------------------------------------------------
/* global $ */
/* global d3 */
/* global sock */
/* global timeD */
/* global hasVar */
/* global Locker */
/* global runWhenReady */
/* global RunLoop */
/* global appendToDom */
/* global disableScrollSVG */
/* global getNodeWidthById */
/* global getNodeHeightById */
/* global ScrollGrid */
/* global replaceAll */
/* global PlotTimeSeries */
/* global PlotTimeBar */
/* global QuickMap */
// ------------------------------------------------------------------

// // load additional js files:
window.loadScript({source: mainScriptTag, script: '/js/utils_plotTimeSeries.js'})
window.loadScript({ source: mainScriptTag, script: '/js/utils_plotTimeBar.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollGrid.js' })
window.loadScript({source: mainScriptTag, script: '/js/utils_quickMap.js'})

// ------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  optIn.widgetFunc = { SockFunc: sockAzPlots, MainFunc: mainAzPlots }
  optIn.widgetDivId = optIn.widgetId + 'widgetDiv'
  optIn.eleProps = {}

  let x0 = 0
  let y0 = 0
  let h0 = 2
  let w0 = 12
  let divKey = 'quick'
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

  x0 = 0
  y0 = 0
  h0 = 7
  w0 = 12
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

  sock.addToTable(optIn)
}

// ------------------------------------------------------------------
// additional socket events for this particular widget type
// ------------------------------------------------------------------
let sockAzPlots = function (optIn) {
  let widgetType = optIn.widgetType
  // let widgetSource = optIn.widgetSource

  sock.socket.on('azPlotsUpdateData', function (data) {
    if (sock.conStat.isOffline()) return
    $.each(sock.widgetV[widgetType].widgets, function (widgetIdNow, modNow) {
      if (data.sessWidgetIds.indexOf(widgetIdNow) >= 0) {
        sock.widgetV[widgetType].widgets[widgetIdNow].updateData(data)
      }
    })
  })
}

// ------------------------------------------------------------------
// ------------------------------------------------------------------
// here we go with the content of this particular widget
// ------------------------------------------------------------------
let mainAzPlots = function (optIn) {
  // let myUniqueId = unique()
  // let widgetType = optIn.widgetType
  let tagArrZoomerPlotsSvg = optIn.baseName
  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  let isSouth = window.__nsType__ === 'S'
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

  // let isSouth = window.__nsType__ === 'S'
  // let thisAzPlots = this

  let tagPlot = 'plot'
  let tagScrollGridBox = 'scrollGridBox'

  let sgvTag = {}
  $.each(widgetEle, function (index, eleNow) {
    sgvTag[eleNow.id] = {
      id: tagArrZoomerPlotsSvg + eleNow.id,
      widget: eleNow.widget,
      whRatio: eleNow.w / eleNow.h
    }
  })

  // delay counters
  let locker = new Locker()
  locker.add('inInit')
  locker.add('inInitQuick')

  // function loop
  let runLoop = new RunLoop({ tag: widgetId })

  let prevSync = {}
  function syncStateGet (dataIn) {
    if (document.hidden) return
    if (sock.conStat.isOffline()) return

    let sessWidgetIds = dataIn.sessWidgetIds
    if (sessWidgetIds.indexOf(widgetId) < 0 || widgetId === dataIn.widgetId) {
      return
    }

    if (sock.isOldSync(prevSync, dataIn.data)) return

    // console.log('get  -=- ',widgetId,dataIn.type,dataIn.data);

    prevSync[dataIn.type] = dataIn.data
    let optFocus = {}
    let optIn = {}
    let type = dataIn.type
    if (type === 'syncTelFocus') {
      optIn.telId = dataIn.data.target === 'init' ? 'Array: ' : ('Telescope ' + dataIn.data.target + ':')
      optIn.propIn = ('general overview')
      optFocus.parentName = 'general'
    } else if (type === 'syncArrZoomerProp') {
      optIn.telId = dataIn.data.telId === 'init' ? 'Array: ' : ('Telescope ' + dataIn.data.telId + ':')
      if (dataIn.data.propId !== '') {
        let splitPropId = dataIn.data.propId.split('_')
        optFocus.parentName = splitPropId[0] === 'health' ? 'general' : splitPropId[0]
        if (splitPropId.length === 1) {
          if (dataIn.data.propId === 'health') optIn.propIn = ('general overview')
          else optIn.propIn = ('overview of ' + dataIn.data.propId)
        } else {
          optIn.propIn = ('focus on ' + dataIn.data.propId)
          optFocus.propName = dataIn.data.propId
        }
      }
    }
    svgMain.setTopTitle(optIn)
    svgMain.deploy(optFocus)
  }
  this.syncStateGet = syncStateGet

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function initData (dataIn) {
    if (sock.multipleInit({ id: widgetId, data: dataIn })) return
    window.sideDiv = sock.setSideDiv({
      id: sideId,
      nIcon: dataIn.nIcon,
      iconDivV: iconDivV
    })

    setTelData(dataIn.data.arrProp, true)
    setTelDataPhysical(dataIn.data.arrPosD)
    telData.vor.data = telData.vor.dataPhysical

    let dataMain = dataIn
    dataMain.data = dataIn.data.arrInit
    svgMain.initData(dataMain)

    svgQuick.initData({
      telData: {tel: telData.tel, vor: {data: telData.vor.data}, mini: telData.mini, vorDblclick: telData.vorDblclick},
      telTypeV: telTypeV})
    svgQuick.setStateOnce()
  }
  this.initData = initData

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function updateData (dataIn) {
    svgMain.updateData(dataIn.data)
    svgQuick.setStateOnce()
  }
  this.updateData = updateData

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  let SvgMain = function () {
    let com = {}
    let svg = {}

    let lenD = {}
    lenD.w = {}
    lenD.h = {}
    lenD.w[0] = 1000
    lenD.h[0] = lenD.w[0] / sgvTag.main.whRatio

    com.title = {}
    com.detail = {dissociate: {}, mini: {}}
    com.mirror = {dissociate: {}, mini: {}}
    com.camera = {dissociate: {}, mini: {}}
    com.mount = {dissociate: {}, mini: {}}
    com.aux = {dissociate: {}, mini: {}}
    com.associate = {dissociate: {}}

    com.title.h = lenD.h[0] / 12
    com.title.w = lenD.w[0]
    com.title.x = 0
    com.title.y = 0

    com.associate.h = com.title.h * 2
    com.associate.w = lenD.w[0]
    com.associate.x = 0
    com.associate.y = lenD.h[0] - com.title.h * 2
    com.associate.dissociate.h = 0
    com.associate.dissociate.w = lenD.w[0]
    com.associate.dissociate.x = 0
    com.associate.dissociate.y = lenD.h[0]

    com.detail.h = lenD.h[0] - (com.title.h * 2)
    com.detail.w = lenD.w[0]
    com.detail.x = 0
    com.detail.y = com.title.h * 2
    com.detail.mini.h = 0
    com.detail.mini.w = lenD.w[0]
    com.detail.mini.x = 0
    com.detail.mini.y = lenD.h[0]

    com.mirror.h = (lenD.h[0] - (com.title.h * 3)) / 2
    com.mirror.w = lenD.w[0] / 2
    com.mirror.x = 0
    com.mirror.y = com.title.h
    com.mirror.dissociate.h = com.title.h * 5.5
    com.mirror.dissociate.w = lenD.w[0] / 2
    com.mirror.dissociate.x = 0
    com.mirror.dissociate.y = com.title.h
    com.mirror.mini.h = com.title.h
    com.mirror.mini.w = lenD.w[0] / 4
    com.mirror.mini.x = 0
    com.mirror.mini.y = com.title.h

    com.camera.h = (lenD.h[0] - (com.title.h * 3)) / 2
    com.camera.w = lenD.w[0] / 2
    com.camera.x = lenD.w[0] / 2
    com.camera.y = com.title.h
    com.camera.dissociate.h = com.title.h * 5.5
    com.camera.dissociate.w = lenD.w[0] / 2
    com.camera.dissociate.x = lenD.w[0] / 2
    com.camera.dissociate.y = com.title.h
    com.camera.mini.h = com.title.h
    com.camera.mini.w = lenD.w[0] / 4
    com.camera.mini.x = lenD.w[0] * 0.5
    com.camera.mini.y = com.title.h

    com.mount.h = (lenD.h[0] - (com.title.h * 3)) / 2
    com.mount.w = lenD.w[0] / 2
    com.mount.x = 0
    com.mount.y = com.title.h + com.mirror.h
    com.mount.dissociate.h = com.title.h * 5.5
    com.mount.dissociate.w = lenD.w[0] / 2
    com.mount.dissociate.x = 0
    com.mount.dissociate.y = com.title.h + com.mirror.dissociate.h
    com.mount.mini.h = com.title.h
    com.mount.mini.w = lenD.w[0] / 4
    com.mount.mini.x = lenD.w[0] * 0.25
    com.mount.mini.y = com.title.h

    com.aux.h = (lenD.h[0] - (com.title.h * 3)) / 2
    com.aux.w = lenD.w[0] / 2
    com.aux.x = lenD.w[0] / 2
    com.aux.y = com.title.h + com.mirror.h
    com.aux.dissociate.h = com.title.h * 5.5
    com.aux.dissociate.w = lenD.w[0] / 2
    com.aux.dissociate.x = lenD.w[0] / 2
    com.aux.dissociate.y = com.title.h + com.mirror.dissociate.h
    com.aux.mini.h = com.title.h
    com.aux.mini.w = lenD.w[0] / 4
    com.aux.mini.x = lenD.w[0] * 0.75
    com.aux.mini.y = com.title.h

    let tagAzPlots = 'azPlots'
    com.plotAspectRatio = 1

    com.detailState = 'shrink'
    com.syncState = true

    com.plot = {}
    com.plotG = {}

    function deploy (optFocus) {
      function shrink (svg, prop) {
        svg
          .transition()
          .duration(1000)
          .attr('transform', 'translate(' + com[prop].mini.x + ',' + com[prop].mini.y + ')')
        svg.background
          .transition()
          .duration(1000)
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', com[prop].mini.w)
          .attr('height', com[prop].mini.h)
      }
      function extend (svg, prop) {
        svg
          .transition()
          .duration(1000)
          .attr('transform', 'translate(' + com[prop].x + ',' + com[prop].y + ')')
        svg.background
          .transition()
          .duration(1000)
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', com[prop].w)
          .attr('height', com[prop].h)
      }

      if (hasVar(optFocus.propName)) {
        if (com.detailState === 'shrink') {
          shrink(svg.mirror, 'mirror')
          shrink(svg.camera, 'camera')
          shrink(svg.mount, 'mount')
          shrink(svg.aux, 'aux')
          extend(svg.detail, 'detail')
          com.detailState = 'extended'
        }
      } else {
        if (com.detailState === 'extended') {
          extend(svg.mirror, 'mirror')
          extend(svg.camera, 'camera')
          extend(svg.mount, 'mount')
          extend(svg.aux, 'aux')
          shrink(svg.detail, 'detail')
          com.detailState = 'shrink'
        }
      }
    }
    this.deploy = deploy

    function setTopTitle (optIn) {
      let telId = optIn.telId
      let propIn = optIn.propIn

      let tagState = 'top'
      let tagNow = tagState + '_title_'

      let ttlData = []
      ttlData.push({
        id: tagNow + 'telId',
        text: telId,
        x: 20,
        y: com.title.h / 2,
        h: 30,
        strkW: 1
      })

      if (hasVar(propIn)) {
        ttlData.push({
          id: tagNow + 'parentName',
          text: propIn,
          x: 10,
          y: com.title.h / 2,
          h: 30,
          strkW: 1
        })
      }

      let title = svg.title
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
                  selction: svg.title.selectAll('text.' + tagNow),
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
              selction: svg.title.selectAll('text.' + tagNow),
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
          d.pos = [com.title.w * 1.1, textPos(d, i, false)]
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
    }
    this.setTopTitle = setTopTitle

    function changeAssociation () {
      function associate (svg, prop) {
        svg
          .transition()
          .duration(1000)
          .attr('transform', 'translate(' + com[prop].x + ',' + com[prop].y + ')')
        svg.background
          .transition()
          .duration(1000)
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', com[prop].w)
          .attr('height', com[prop].h)
      }
      function dissociate (svg, prop) {
        svg
          .transition()
          .duration(1000)
          .attr('transform', 'translate(' + com[prop].dissociate.x + ',' + com[prop].dissociate.y + ')')
        svg.background
          .transition()
          .duration(1000)
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', com[prop].dissociate.w)
          .attr('height', com[prop].dissociate.h)
      }

      if (com.syncState) {
        associate(svg.mirror, 'mirror')
        associate(svg.camera, 'camera')
        associate(svg.mount, 'mount')
        associate(svg.aux, 'aux')
        associate(svg.associate, 'associate')
      } if (!com.syncState) {
        dissociate(svg.mirror, 'mirror')
        dissociate(svg.camera, 'camera')
        dissociate(svg.mount, 'mount')
        dissociate(svg.aux, 'aux')
        dissociate(svg.associate, 'associate')
      }
    }

    function initSVGPanel (svg, prop, background = '#efefef') {
      svg
        .attr('transform', 'translate(' + com[prop].x + ',' + com[prop].y + ')')
        // .attr('x', com[prop].x)
        // .attr('y', com[prop].y)
        // .attr('width', com[prop].w)
        // .attr('height', com[prop].h)
      svg.background = svg.append('g')
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
      svg.background
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', com[prop].w)
        .attr('height', com[prop].h)
        .attr('fill', background)
    }

    function initMutliPlot (prop) {
      let scrollGridBox = {}
      scrollGridBox.outer = {}
      scrollGridBox.outer.marg = com[prop].w * 0.01
      scrollGridBox.outer.x = scrollGridBox.outer.marg
      scrollGridBox.outer.y = scrollGridBox.outer.marg
      scrollGridBox.outer.w = com[prop].w - scrollGridBox.outer.marg * 2
      scrollGridBox.outer.h = com[prop].h - scrollGridBox.outer.marg * 2// scrollGridBox.outer.w * 0.6

      scrollGridBox[0] = {}
      scrollGridBox[0].marg = scrollGridBox.outer.marg
      scrollGridBox[0].x = scrollGridBox.outer.x
      scrollGridBox[0].y = scrollGridBox.outer.y
      scrollGridBox[0].w = scrollGridBox.outer.w
      scrollGridBox[0].h = scrollGridBox.outer.h

      let recW = scrollGridBox[0].w * 0.7
      let recH = recW * com.plotAspectRatio
      let recM = recH * 0.1
      let recE = recH * 0.1

      com.recD = {}
      com.recD.gBase = svg.mirror.append('g')

      com.scrollGrid = {}

      com.scrollGrid[0] = new ScrollGrid({
        id: tagScrollGridBox + '0',
        x0: scrollGridBox[0].x,
        y0: scrollGridBox[0].y,
        w0: scrollGridBox[0].w,
        h0: scrollGridBox[0].h,
        recH: recH,
        recW: recW,
        recM: recM,
        recE: recE,
        showCounts: false,
        isHorz: false,
        nRows: 1,
        recD: com.recD,
        recV: [],
        gBox: com.recD.gBase,
        bckRecOpt: {
          opac: 0.06,
          circType: 'lighter',
          size: 10,
          frontProp: { strkWOcp: 0.1 }
        },
        scrollRec: { w: scrollGridBox[0].w * 0.03 },
        // vorOpt: { click: vorClick },
        lockerV: [tagScrollGridBox + 'updateData'],
        onZoom: { start: onZoomStart, during: onZoomDuring, end: onZoomEnd },
        runLoop: runLoop,
        locker: locker
      })

      com.recD.dataG = com.scrollGrid[0].getFrontDataG()
    }
    this.initMutliPlot = initMutliPlot

    function initSinglePlot (prop) {
      let scrollGridBox = {}
      scrollGridBox.outer = {}
      scrollGridBox.outer.marg = com[prop].w * 0.01
      scrollGridBox.outer.x = scrollGridBox.outer.marg
      scrollGridBox.outer.y = scrollGridBox.outer.marg
      scrollGridBox.outer.w = com[prop].w - scrollGridBox.outer.marg * 2
      scrollGridBox.outer.h = com[prop].h - scrollGridBox.outer.marg * 2// scrollGridBox.outer.w * 0.6

      scrollGridBox[0] = {}
      scrollGridBox[0].marg = scrollGridBox.outer.marg
      scrollGridBox[0].x = scrollGridBox.outer.x
      scrollGridBox[0].y = scrollGridBox.outer.y
      scrollGridBox[0].w = scrollGridBox.outer.w
      scrollGridBox[0].h = scrollGridBox.outer.h

      let recW = scrollGridBox[0].w * 0.7
      let recH = recW * com.plotAspectRatio
      let recM = recH * 0.1
      let recE = recH * 0.1

      com.recD = {}
      com.recD.gBase = svg.mirror.append('g')

      com.scrollGrid = {}

      com.scrollGrid[0] = new ScrollGrid({
        id: tagScrollGridBox + '0',
        x0: scrollGridBox[0].x,
        y0: scrollGridBox[0].y,
        w0: scrollGridBox[0].w,
        h0: scrollGridBox[0].h,
        recH: recH,
        recW: recW,
        recM: recM,
        recE: recE,
        showCounts: false,
        isHorz: false,
        nRows: 1,
        recD: com.recD,
        recV: [],
        gBox: com.recD.gBase,
        bckRecOpt: {
          opac: 0.06,
          circType: 'lighter',
          size: 10,
          frontProp: { strkWOcp: 0.1 }
        },
        scrollRec: { w: scrollGridBox[0].w * 0.03 },
        // vorOpt: { click: vorClick },
        lockerV: [tagScrollGridBox + 'updateData'],
        onZoom: { start: onZoomStart, during: onZoomDuring, end: onZoomEnd },
        runLoop: runLoop,
        locker: locker
      })

      com.recD.dataG = com.scrollGrid[0].getFrontDataG()
    }
    this.initSinglePlot = initSinglePlot

    function initData (dataIn) {
      // ------------------------------------------------------------------
      // create the main svg element
      // ------------------------------------------------------------------
      let svgDivId = sgvTag.main.id + 'svg'
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

      svg.svg = d3
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
        .style('background', '#383B42')
        .on('dblclick.zoom', null)

      if (disableScrollSVG) {
        svg.svg.on('wheel', function () {
          d3.event.preventDefault()
        })
      }

      svg.title = svg.svg.append('g')
      initSVGPanel(svg.title, 'title', '#efefef')
      svg.mirror = svg.svg.append('g')
      initSVGPanel(svg.mirror, 'mirror', '#eeeeee')
      svg.camera = svg.svg.append('g')
      initSVGPanel(svg.camera, 'camera', '#dddddd')
      svg.mount = svg.svg.append('g')
      initSVGPanel(svg.mount, 'mount', '#dddddd')
      svg.aux = svg.svg.append('g')
      initSVGPanel(svg.aux, 'aux', '#eeeeee')
      svg.associate = svg.svg.append('g')
      initSVGPanel(svg.associate, 'associate', '#eeeeee')

      svg.detail = svg.svg.append('g')
      initSVGPanel(svg.detail, 'detail', '#ffffff')
      svg.detail
        .attr('transform', 'translate(' + 0 + ',' + (lenD.h[0]) + ')')

      optIn = {}
      optIn.telId = 'Array: '
      optIn.propIn = ('general overview')
      setTopTitle(optIn)


      svg.title.append('circle')
        .attr('cx', com.title.w * 0.9)
        .attr('cy', com.title.h * 0.5)
        .attr('r', com.title.h * 0.4)
        .attr('fill', 'gold')
        .on('click', function () {
          com.syncState = !com.syncState
          changeAssociation()
        })

      addTimeBar({ plotId: 'associate', propId: 'associate' })
      addPlot({ plotId: 'mirror', propId: 'mirror' })
      addPlot({ plotId: 'camera', propId: 'camera' })
      addPlot({ plotId: 'mount', propId: 'mount' })
      addPlot({ plotId: 'aux', propId: 'aux' })
      //initSinglePlot('mirror')

      // // ------------------------------------------------------------------
      // //
      // // ------------------------------------------------------------------
      updateDataOnce(dataIn.data)
      runWhenReady({
        pass: function () {
          return locker.isFree(tagAzPlots + 'updateData')
        },
        execute: function () {
          locker.remove('inInit')
        }
      })
    }
    this.initData = initData

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    runLoop.init({ tag: 'updateData', func: updateDataOnce, nKeep: 1 })

    function updateData (dataIn) {
      if (!locker.isFree('inInit')) {
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }

      runLoop.push({ tag: 'updateData', data: dataIn }) //, time:dataIn.emitTime
    }

    function updateDataOnce (dataIn) {
      if (!locker.isFreeV([tagAzPlots + 'updateData', tagPlot + 'zoom'])) {
        // console.log('will delay updateData');
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
      }
      locker.add(tagAzPlots + 'updateData')
      console.log(dataIn.telHealthAggregate);
      setTelData(dataIn.telHealth, false)

      $.each(dataIn.dataOut, function (i, d) {
        dataIn.dataOut[i] = dataIn.dataOut[i].map(function (d) {
          return { id: replaceAll(d.id, ';', ''), data: d.data }
        })
      })
      // console.log(dataIn);
      // return

      //com.scrollGrid[0].update({ recV: dataIn[0] })

      // $.each(dataIn[1], function (i, d) {
      //   if (i === 0) addPlot({ plotId: 'mirror', propId: 'mirror' })
      //   //if (!hasVar(com.plot[d.id])) addPlot({ plotId: d.id, propId: 'mirror' })
      // })
      //onZoomDuring()
      $.each(dataIn.dataOut[0], function (i, d) {
        if (i === 0) com.plot['mirror'].update(d.data)
        // if (i === 0) com.plot['associate'].update(d.data)
        if (i === 1) com.plot['camera'].update(d.data)
        if (i === 2) com.plot['mount'].update(d.data)
        if (i === 3) com.plot['aux'].update(d.data)
      })

      locker.remove(tagAzPlots + 'updateData')
    }
    this.updateData = updateData

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function addTimeBar (optIn) {
      let plotId = optIn.plotId
      let propId = optIn.propId

      svg[propId].plot = svg[propId].append('g')

      let w0 = com[propId].w / 2
      let h0 = com[propId].h
      let x0 = com[propId].w / 4
      let y0 = 0
      let margW = w0 * 0.04
      let margH = h0 * 0.05

      let plotBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        margWidth: margW,
        margHeight: margH
      }

      com.plot[plotId] = new PlotTimeBar()

      com.plot[plotId].init({
        tag: tagPlot + plotId,
        gBox: svg[propId].plot,
        hasBotPlot: true,
        isPartofPlot: false,
        style: { hasOutline: true },
        boxData: plotBoxData,
        locker: locker,
        lockerV: [tagPlot + 'updateData'],
        lockerZoom: {
          all: tagPlot + 'zoom',
          during: tagPlot + 'zoomDuring',
          end: tagPlot + 'zoomEnd'
        },
        runLoop: runLoop
      })
    }

    function addPlot (optIn) {
      let plotId = optIn.plotId
      let propId = optIn.propId

      svg[propId].plot = svg[propId].append('g')

      let w0 = com[propId].w
      let h0 = com[propId].h
      let x0 = 0
      let y0 = 0

      let plotBoxData = {
        x: x0 + w0 * 0.1,
        y: y0 + h0 * 0.1,
        w: w0 * 0.8,
        h: h0 * 0.8
      }

      com.plot[plotId] = new PlotTimeSeries()

      com.plot[plotId].init({
        tag: tagPlot + plotId,
        gBox: svg[propId].plot,
        hasBotPlot: false,
        updateDomainY: false,
        overviewLine: true,
        style: { hasOutline: true },
        boxData: plotBoxData,
        locker: locker,
        lockerV: [tagPlot + 'updateData'],
        lockerZoom: {
          all: tagPlot + 'zoom',
          during: tagPlot + 'zoomDuring',
          end: tagPlot + 'zoomEnd'
        },
        runLoop: runLoop
      })
      com.plot[plotId].plugPlotTimeBar(com.plot['associate'])
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function onZoomStart () {}

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function onZoomDuring () {
      let dataRec = com.recD[tagScrollGridBox + '0']

      $.each(dataRec, function (i, d) {
        // console.log(i,d);
        let plotId = d.data.id

        let outerBox = com.plot[plotId].get('outerBox')
        let scaleW = d.w / outerBox.w
        // let scaleH = d.h / outerBox.h

        let k = scaleW
        com.plot[plotId].transScaleBox({ x: d.x, y: d.y, k: k, duration: 0 })
      })
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function onZoomEnd () {}
  }

  let svgMain = new SvgMain()

  let telData = {}
  telData.tel = []
  telData.idToIndex = {}
  telData.dataBaseS1 = {}
  telData.propDataS1 = {}
  telData.propParentS1 = {}
  telData.propTitleS1 = {}

  let lenD = {}
  lenD.w = {}
  lenD.h = {}

  let siteScale = isSouth ? 4 / 9 : 1
  lenD.w[0] = 500
  lenD.h[0] = 500
  lenD.r = {}
  lenD.r.s00 = [12, 13, 14]
  if (isSouth) lenD.r.s00 = [12 * siteScale, 13 * siteScale, 14 * siteScale]

  let prop0 = 'health'
  let propD = ['camera', 'aux', 'mount', 'mirror']
  let propDv = [prop0]
  $.each(propD, function (index, porpNow) {
    propDv.push(porpNow)
  })

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
  let svgQuick = new QuickMap({runLoop: runLoop, sgvTag: sgvTag, widgetId: widgetId, locker: locker, isSouth: isSouth})

  telData.vor = {}

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
  function setTelDataPhysical (dataIn) {
    // console.log("dataphyzoom", dataIn);
    telData.xyrPhysical = {}
    telData.vor.dataPhysical = []

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

      telData.xyrPhysical[id] = { x: x, y: y, r: eleR, isTel: true }
      telData.vor.dataPhysical.push({ id: id, x: x, y: y, r: eleR })
    })

    telData.mini = telData.xyrPhysical
  }
}
// ------------------------------------------------------------------
// ------------------------------------------------------------------
