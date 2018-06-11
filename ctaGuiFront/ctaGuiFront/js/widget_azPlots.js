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
var mainScriptTag = 'azPlots'
// ---------------------------------------------------------------------------------------------------
/* global $ */
/* global d3 */
/* global sock */
/* global hasVar */
/* global CheckFree */
/* global runWhenReady */
/* global RunLoop */
/* global appendToDom */
/* global disableScrollSVG */
/* global ScrollGrid */
/* global replaceAll */
/* global PlotTimeSeries */
// ---------------------------------------------------------------------------------------------------

// // load additional js files:
window.loadScript({
  source: mainScriptTag,
  script: '/js/utils_plotTimeSeries.js'
})
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollGrid.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 9
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = { SockFunc: sockAzPlots, MainFunc: mainAzPlots }
  optIn.widgetDivId = optIn.widgetId + 'widgetDiv'
  optIn.eleProps = {}
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
// additional socket events for this particular widget type
// ---------------------------------------------------------------------------------------------------
let sockAzPlots = function (optIn) {}

// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// here we go with the content of this particular widget
// ---------------------------------------------------------------------------------------------------
let mainAzPlots = function (optIn) {
  // let _0_ = uniqId()
  // let widgetType = optIn.widgetType
  let tagArrZoomerPlotsSvg = optIn.baseName
  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

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
  let checkFree = new CheckFree()
  checkFree.add('inInit')

  // function loop
  let runLoop = new RunLoop({ tag: widgetId })

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function initData (dataIn) {
    if (sock.multipleInit({ id: widgetId, data: dataIn })) return

    window.sideDiv = sock.setSideDiv({
      id: sideId,
      nIcon: dataIn.nIcon,
      iconDivV: iconDivV
    })

    svgMain.initData(dataIn)
  }
  this.initData = initData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateData (dataIn) {
    svgMain.updateData(dataIn.data)
  }
  this.updateData = updateData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let SvgMain = function () {
    let com = {}
    // let recD = {}
    // let confD = {}
    // let recOpt = {}
    let svg = {}
    // let s10V = []
    // let thisMain = this

    let lenD = {}
    lenD.w = {}
    lenD.h = {}
    lenD.w[0] = 1000
    lenD.h[0] = lenD.w[0] / sgvTag.main.whRatio

    let tagAzPlots = 'azPlots'
    com.plotAspectRatio = 1

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
      // ---------------------------------------------------------------------------------------------------
      // create the main svg element
      // ---------------------------------------------------------------------------------------------------
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
        // .attr("viewBox", "0 0 "+lenD.w[0]+" "+lenD.h[0] * whRatio)
        // .classed("svgInGridStack_inner", true)
        .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
        // .call(com.svgZoom)
        .on('dblclick.zoom', null)

      if (disableScrollSVG) {
        svg.svg.on('wheel', function () {
          d3.event.preventDefault()
        })
      }

      com.svgZoomNode = svg.svg.nodes()[0]

      svg.g = svg.svg.append('g')

      // add one rect as background
      // ---------------------------------------------------------------------------------------------------
      svg.g
        .append('g')
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', lenD.w[0])
        .attr('height', lenD.h[0])
        .attr('fill', '#F2F2F2')

      // the background grid
      bckPattern({
        com: com,
        gNow: svg.g,
        gTag: 'hex',
        lenWH: [lenD.w[0], lenD.h[0]],
        opac: 0.1,
        hexR: 15
      })

      let scrollGridBox = {}
      scrollGridBox.outer = {}
      scrollGridBox.outer.marg = lenD.w[0] * 0.01
      scrollGridBox.outer.x = scrollGridBox.outer.marg
      scrollGridBox.outer.y = scrollGridBox.outer.marg
      scrollGridBox.outer.w = lenD.w[0] - scrollGridBox.outer.marg * 2
      scrollGridBox.outer.h = scrollGridBox.outer.w * 0.6

      scrollGridBox[0] = {}
      scrollGridBox[0].marg = scrollGridBox.outer.marg
      scrollGridBox[0].x = scrollGridBox.outer.x
      scrollGridBox[0].y = scrollGridBox.outer.y
      scrollGridBox[0].w = scrollGridBox.outer.w * 0.5
      scrollGridBox[0].h = scrollGridBox.outer.h

      let recW = scrollGridBox[0].w * 0.7
      let recH = recW * com.plotAspectRatio
      let recM = recH * 0.1
      let recE = recH * 0.1

      com.recD = {}
      com.recD.gBase = svg.g.append('g')

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
        checkFreeV: [tagScrollGridBox + 'updateData'],
        onZoom: { start: onZoomStart, during: onZoomDuring, end: onZoomEnd },
        runLoop: runLoop,
        checkFree: checkFree
      })

      com.recD.dataG = com.scrollGrid[0].getFrontDataG()

      com.plot = {}
      com.plotG = {}

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      _updateData(dataIn.data)

      runWhenReady({
        pass: function () {
          return checkFree.isFree(tagAzPlots + 'updateData')
        },
        execute: function () {
          checkFree.remove('inInit')
        }
      })
    }
    this.initData = initData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    runLoop.init({ tag: 'updateData', func: _updateData, nKeep: 1 })

    function updateData (dataIn) {
      if (!checkFree.isFree('inInit')) {
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }

      runLoop.push({ tag: 'updateData', data: dataIn }) //, time:dataIn.emitTime
    }

    function _updateData (dataIn) {
      if (!checkFree.isFreeV([tagAzPlots + 'updateData', tagPlot + 'zoom'])) {
        // console.log('will delay updateData');
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }
      checkFree.add(tagAzPlots + 'updateData')

      $.each(dataIn, function (i, d) {
        dataIn[i] = dataIn[i].map(function (d) {
          return { id: replaceAll(d.id, ';', ''), data: d.data }
        })
      })
      // console.log(dataIn);
      // return

      com.scrollGrid[0].update({ recV: dataIn[0] })

      $.each(dataIn[0], function (i, d) {
        if (!hasVar(com.plot[d.id])) addPlot({ plotId: d.id })
      })

      onZoomDuring()

      $.each(dataIn[0], function (i, d) {
        com.plot[d.id].update(d.data)
      })

      checkFree.remove(tagAzPlots + 'updateData')
    }
    this.updateData = updateData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function addPlot (optIn) {
      let plotId = optIn.plotId

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      com.plotG[plotId] = com.recD.dataG.append('g')

      // setTimeout(function() {
      //   console.log('eeeeeeeeeeee');
      //   com.plotG[plotId].remove()
      // }, 2000);

      let w0 = lenD.w[0] * 1
      let h0 = w0 * com.plotAspectRatio
      let x0 = 0
      let y0 = 0
      let marg = w0 * 0.01

      let plotBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }

      com.plot[plotId] = new PlotTimeSeries()

      com.plot[plotId].init({
        tag: tagPlot + plotId,
        gBox: com.plotG[plotId],
        hasBotPlot: true,
        style: { hasOutline: true },
        boxData: plotBoxData,
        checkFree: checkFree,
        checkFreeV: [tagPlot + 'updateData'],
        checkFreeZoom: {
          all: tagPlot + 'zoom',
          during: tagPlot + 'zoomDuring',
          end: tagPlot + 'zoomEnd'
        },
        runLoop: runLoop
      })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function onZoomStart () {}

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
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

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function onZoomEnd () {}
  }

  let svgMain = new SvgMain()
}
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
