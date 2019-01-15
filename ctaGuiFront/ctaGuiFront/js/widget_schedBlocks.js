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
var mainScriptTag = 'schedBlocks'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global timeD */
/* global hasVar */
/* global BlockQueueOld */
/* global BlockQueueCreator */
/* global RunLoop */
/* global Locker */
/* global deepCopy */
/* global unique */
/* global appendToDom */
/* global runWhenReady */
/* global colsPurples */
/* global colsYellows */
/* global colsBlues */
/* global disableScrollSVG */
/* global bckPattern */
/* global ScrollGrid */
/* global colsBlk */

window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollGrid.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueOld.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueCreator.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollBox.js' })
// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 5
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = { SockFunc: sockSchedBlocks, MainFunc: mainSchedBlocks }
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
function sockSchedBlocks (optIn) {}

function mainSchedBlocks (optIn) {
  let colorTheme = getColorTheme('bright-Grey')

  let myUniqueId = unique()
  // let widgetType = optIn.widgetType
  let tagSchedBlocksSvg = optIn.baseName
  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  let shared = {
    data: {
      serverPast: undefined,
      blocks : {}
    },
    focus: {
      schedBlocks: undefined,
      block: undefined
    }
  }

  let svg = {}
  let box = {}
  let lenD = {}

  let blockQueueServerPast = null
  let blockQueueServerFutur = null

  // let thisSchedBlocks = this
  let isSouth = window.__nsType__ === 'S'

  // let sgvTag = {};
  // $.each(widgetEle, function(index,eleNow) {
  //   sgvTag[eleNow.id] = { id:tagSchedBlocksSvg+"_"+eleNow.id, whRatio:(eleNow.w/eleNow.h) };
  // })
  let sgvTag = {}
  $.each(widgetEle, function (index, eleNow) {
    sgvTag[eleNow.id] = {
      id: tagSchedBlocksSvg + eleNow.id,
      widget: eleNow.widget,
      whRatio: eleNow.w / eleNow.h
    }
  })

  // delay counters
  let locker = new Locker()
  locker.add('inInit')

  // function loop
  let runLoop = new RunLoop({ tag: widgetId })

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function syncStateSend (dataIn) {
    if (sock.conStat.isOffline()) return

    sock.sockSyncStateSend({
      widgetId: widgetId,
      type: dataIn.type,
      data: dataIn
    })
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

    let type = dataIn.type
    if (type === 'syncObFocus') {
      if (prevSync[type] !== dataIn.data.obId) {
        prevSync[type] = dataIn.data.obId
        svgMain.blockFocus({ id: dataIn.data.obId })
      }
    }
  }
  this.syncStateGet = syncStateGet

  function sortBlocksByState () {
    if (!shared.data.server.blocks) return
    shared.data.blocks.success = []
    shared.data.blocks.fail = []
    shared.data.blocks.cancel = []

    for (var i = 0; i < shared.data.server.blocks.done.length; i++) {
      let b = shared.data.server.blocks.done[i]
      if (b.exeState.state === 'done') shared.data.blocks.success.push(b)
      else if (b.exeState.state === 'fail') shared.data.blocks.fail.push(b)
      else if (b.exeState.state === 'cancel') shared.data.blocks.cancel.push(b)
    }
  }
  function setCol (optIn) {
    if (optIn.endTime < Number(shared.data.server.timeOfNight.now)) return colorTheme.blocks.shutdown
    let state = hasVar(optIn.state)
      ? optIn.state
      : optIn.exeState.state
    let canRun = hasVar(optIn.canRun)
      ? optIn.canRun
      : optIn.exeState.canRun

    if (state === 'wait') {
      return colorTheme.blocks.wait
    } else if (state === 'done') {
      return colorTheme.blocks.done
    } else if (state === 'fail') {
      return colorTheme.blocks.fail
    } else if (state === 'run') {
      return colorTheme.blocks.run
    } else if (state === 'cancel') {
      if (hasVar(canRun)) {
        if (!canRun) return colorTheme.blocks.cancelOp
      }
      return colorTheme.blocks.cancelSys
    } else return colorTheme.blocks.shutdown
  }
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function initData (dataIn) {
    function initSvg () {
      lenD.w = {}
      lenD.h = {}
      lenD.w[0] = 1000
      lenD.h[0] = lenD.w[0] / sgvTag.main.whRatio

      svg.svg = d3
        .select(svgDiv)
        .append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', '0 0 ' + lenD.w[0] + ' ' + lenD.h[0])
        .style('position', 'relative')
        .style('width', '100%')
        .style('height', '100%')
        .style('top', '0px')
        .style('left', '0px')
        .on('dblclick.zoom', null)

      if (disableScrollSVG) {
        svg.svg.on('wheel', function () {
          d3.event.preventDefault()
        })
      }
      svg.g = svg.svg.append('g')
    }
    function initBackground () {
      svg.svg
        .style('background', colorTheme.medium.background)
    }
    function initBox () {
      box.blockQueueServerPast = {
        x: lenD.w[0] * 0.01,
        y: lenD.h[0] * 0.0,
        w: lenD.w[0] * 0.38,
        h: lenD.h[0] * 0.5,
        marg: lenD.w[0] * 0.01
      }
      box.blockQueueServerFutur = {
        x: lenD.w[0] * 0.62,
        y: lenD.h[0] * 0,
        w: lenD.w[0] * 0.38,
        h: lenD.h[0] * 0.5,
        marg: lenD.w[0] * 0.01
      }
      box.currentBlocks = {
        x: lenD.w[0] * 0.38,
        y: lenD.h[0] * 0.0,
        w: lenD.w[0] * 0.25,
        h: lenD.h[0] * 1.0,
        marg: lenD.w[0] * 0.01
      }
      box.successQueue = {
        x: lenD.w[0] * 0.02,
        y: lenD.h[0] * 0.52,
        w: lenD.w[0] * 0.28,
        h: lenD.h[0] * 0.12,
        marg: lenD.w[0] * 0.01
      }
      box.failQueue = {
        x: lenD.w[0] * 0.02,
        y: lenD.h[0] * 0.7,
        w: lenD.w[0] * 0.28,
        h: lenD.h[0] * 0.12,
        marg: lenD.w[0] * 0.01
      }
      box.cancelQueue = {
        x: lenD.w[0] * 0.02,
        y: lenD.h[0] * 0.86,
        w: lenD.w[0] * 0.28,
        h: lenD.h[0] * 0.12,
        marg: lenD.w[0] * 0.01
      }
      box.execution = {
        x: lenD.w[0] * 0.65,
        y: lenD.h[0] * 0.15,
        w: lenD.w[0] * 0.35,
        h: lenD.h[0] * 0.85,
        marg: lenD.w[0] * 0.01
      }
      box.details = {
        x: lenD.w[0] * 0,
        y: lenD.h[0] * 0.01,
        w: lenD.w[0] * 0,
        h: lenD.h[0] * 0.05
      }
    }
    function initDefaultStyle () {
      shared.style = {}
      shared.style.runRecCol = colsBlues[2]
      shared.style.blockCol = function (optIn) {
        let endTime = hasVar(optIn.endTime)
          ? optIn.endTime
          : undefined
        if (endTime < Number(shared.data.server.timeOfNight.now)) return colorTheme.blocks.shutdown

        let state = hasVar(optIn.exeState.state)
          ? optIn.exeState.state
          : undefined
        console.log(state);
        let canRun = hasVar(optIn.exeState.canRun)
          ? optIn.exeState.canRun
          : undefined
        if (state === 'wait') {
          return colorTheme.blocks.wait
        } else if (state === 'done') {
          return colorTheme.blocks.done
        } else if (state === 'fail') {
          return colorTheme.blocks.fail
        } else if (state === 'run') {
          return colorTheme.blocks.run
        } else if (state === 'cancel') {
          if (hasVar(canRun)) {
            if (!canRun) return colorTheme.blocks.cancelOp
          }
          return colorTheme.blocks.cancelSys
        } else return colorTheme.blocks.shutdown
      }
    }

    if (sock.multipleInit({ id: widgetId, data: dataIn })) return
    window.sideDiv = sock.setSideDiv({
      id: sideId,
      nIcon: dataIn.nIcon,
      iconDivV: iconDivV
    })
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

    initSvg()
    initDefaultStyle()
    initBackground()
    initBox()

    shared.data.server = dataIn.data
    sortBlocksByState()

    svgCurrentBlocks.initData()
    svgBlocksQueueServerPast.initData()
    svgBlocksQueueServerFutur.initData()
    svgSuccessQueue.initData()
    svgFailQueue.initData()
    svgCancelQueue.initData()

    svgMain.initData(dataIn.data)
  }
  this.initData = initData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateData (dataIn) {
    shared.data.server = dataIn.data
    sortBlocksByState()

    svgBlocksQueueServerPast.updateData()
    svgBlocksQueueServerFutur.updateData()
    svgCurrentBlocks.updateData()
    svgCancelQueue.updateData()
    svgSuccessQueue.updateData()
    svgFailQueue.updateData()

    svgMain.updateData(dataIn.data)
  }
  this.updateData = updateData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let SvgMain = function () {
    let com = {}
    let recD = {}
    let confD = {}
    let recOpt = {}
    let scrollGrid = null
    let svg = {}

    let blockQueue = new BlockQueueOld()

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

    let siteScale = isSouth ? 4 / 9 : 1

    let lenD = {}
    lenD.w = {}
    lenD.h = {}
    // lenD.w[0] = 400;
    // lenD.h[0] = lenD.w[0];
    lenD.w[0] = 1000
    lenD.h[0] = lenD.w[0] / sgvTag.main.whRatio
    // isSouth ? 900 : 400;

    lenD.r = {}
    lenD.r.s00 = [12, 13, 14]
    if (isSouth) lenD.r.s00 = [12 * siteScale, 13 * siteScale, 14 * siteScale]

    let sbTag = 'scrollGrid'
    let bqTag = 'blockQueue'
    let tagDataIn = 'dataIn'
    let tagClipPath = 'clipPath'
    let tagPrevTag = 'prevTag'

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
      if (hasVar(svg.svg)) return

      // ---------------------------------------------------------------------------------------------------
      // create the main svg element
      // ---------------------------------------------------------------------------------------------------
      let svgDivId = sgvTag.main.id + 'svg'
      let svgDiv = sgvTag.main.widget.getEle(svgDivId)
      console.log(svgDivId, svgDiv);

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
        // .classed("svgInGridStackOuter", true)
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
        // .classed("svgInGridStackInner", true)
        .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
        // .call(com.svgZoom)
        .on('dblclick.zoom', null)

      if (disableScrollSVG) {
        svg.svg.on('wheel', function () {
          d3.event.preventDefault()
        })
      }

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

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      updateRecD(dataIn)

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      recD.tag = sbTag
      recD.gBase = svg.g.append('g')
      recD.gBack = recD.gBase.append('g')
      recD.dataG = recD.gBase.append('g')

      confD.s0 = {
        id: ['run_config', 'run_takeData', 'run_finish'],
        title: ['Configure', 'Take data', 'Finish']
      }

      confD.s1 = {
        run_config: {
          // id:   ["run_config_mount","run_config_camera","run_config_daq","run_config_mirror"],
          // title:["Mount","Camera","DAQ","Mirror"]
          id: ['run_config_mount', 'run_config_camera', 'run_config_daq'],
          title: ['Mount', 'Camera', 'DAQ']
        },
        run_takeData: {
          id: ['run_takeData'],
          title: ['']
        },
        run_finish: {
          id: ['run_finish_mount', 'run_finish_camera', 'run_finish_daq'],
          title: ['Mount', 'Camera', 'DAQ']
        }
      }

      // ---------------------------------------------------------------------------------------------------
      // define the geometry if this is the first time
      // ---------------------------------------------------------------------------------------------------
      confD.opt = []
      let x0, y0, w0, h0, marg
      let baseW = lenD.w[0] * 0.95
      let outerStrkOpac = 0.2

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      // ====================================================
      let gBlockBox = svg.g.append('g')
      // ====================================================

      w0 = baseW
      // w0   = baseW * 0.95 ;
      // h0   = lenD.h[0] * 0.32;
      h0 = lenD.h[0] * 0.12
      y0 = lenD.w[0] * 0.025
      x0 = lenD.w[0] * 0.95 - w0 + y0
      marg = w0 * 0.01
      // w0 = lenD.w[0]*0.95;  h0 = lenD.h[0]*0.14;  x0 = (lenD.w[0]-w0)/2;  y0 = x0;

      let blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }

      blockQueue.init({
        tag: bqTag,
        gBox: gBlockBox,
        doPhase: false,
        doText: true,
        style: {
          recCol: function (optIn) {
            if (optIn.d.id === blockQueue.get('focusId')) return colsPurples[1]
            else return colsYellows[2]
          },
          recFillOpac: function (d, state) {
            if (d.id === blockQueue.get('focusId')) return 0.5
            else if (state === 'run') return 0.3
            else return 0.1
          },
          textOpac: function (d) {
            return d.id === blockQueue.get('focusId') ? 1 : 0
          }
        },
        click: function (d) {
          blockFocus({ id: d.id })
        },
        boxData: blockBoxData,
        locker: locker,
        lockerV: [sbTag + 'updateData'],
        lockerZoom: {
          all: bqTag + 'zoom',
          during: bqTag + 'zoomDuring',
          end: bqTag + 'zoomEnd'
        },
        runLoop: runLoop
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      w0 = baseW
      h0 = lenD.h[0] * 0.12
      x0 = (lenD.w[0] - w0) / 2
      y0 = lenD.h[0] * 0.19

      // // ====================================================
      // // ====================================================
      // // ====================================================
      // // for debugging scroll
      // y0 = lenD.h[0] * 0.4;
      // // ====================================================
      // // ====================================================
      // // ====================================================

      recOpt.t = {
        id: sbTag + 'top',
        tagVecDataIn: 'wait',
        x0: x0,
        y0: y0,
        w0: w0,
        h0: h0,
        focus0: 0,
        recOrder: 'botLeftUpDown',
        isInvOrder: false,
        isHorz: true,
        recH: h0 * 0.45,
        recW: h0 * 0.45, // botLeftToRight
        bckRecOpt: {
          textureOrient: '2/8',
          textureOpac: 0.04,
          frontProp: { strkWOcp: outerStrkOpac }
        }
      }
      confD.opt.push(recOpt.t)

      let wB0 = baseW
      let hB0 = lenD.h[0] * 0.1
      let xB0 = (lenD.w[0] - wB0) / 2
      let yB0 = lenD.h[0] - xB0 - 2.15 * hB0 // lenD.h[0] * 0.86;

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      recOpt.b0 = {
        id: sbTag + 'Bottom0',
        tagVecDataIn: 'done',
        x0: xB0,
        y0: yB0,
        w0: wB0,
        h0: hB0,
        focus0: 0,
        recOrder: 'botRightUpDown',
        isInvOrder: true,
        isHorz: true,
        recH: hB0 * 0.45,
        recW: hB0 * 0.45,
        bckRecOpt: {
          textureOrient: '2/8',
          textureOpac: 0.04,
          frontProp: { strkWOcp: outerStrkOpac }
        }
      }
      confD.opt.push(recOpt.b0)

      let wB1 = wB0 * 0.49
      let hB1 = hB0
      let xB1 = xB0
      let yB1 = lenD.h[0] - xB0 - hB0

      recOpt.b1 = {
        id: sbTag + 'Bottom1',
        tagVecDataIn: 'cancel',
        x0: xB1,
        y0: yB1,
        w0: wB1,
        h0: hB1,
        focus0: 0,
        recOrder: 'botRightUpDown',
        isInvOrder: true,
        isHorz: true,
        recH: hB1 * 0.45,
        recW: hB1 * 0.45,
        bckRecOpt: {
          textureOrient: '2/8',
          textureOpac: 0.04,
          frontProp: { strkWOcp: outerStrkOpac }
        }
      }
      confD.opt.push(recOpt.b1)

      let wB2 = wB1
      let hB2 = hB1
      let xB2 = xB1 + wB2 + (0.5 - wB1 / wB0) * wB0 * 2
      let yB2 = yB1

      recOpt.b2 = {
        id: sbTag + 'Bottom2',
        tagVecDataIn: 'fail',
        x0: xB2,
        y0: yB2,
        w0: wB2,
        h0: hB2,
        focus0: 0,
        recOrder: 'botRightUpDown',
        isInvOrder: true,
        isHorz: true,
        recH: hB2 * 0.45,
        recW: hB2 * 0.45,
        bckRecOpt: {
          textureOrient: '2/8',
          textureOpac: 0.04,
          frontProp: { strkWOcp: outerStrkOpac }
        }
      }
      confD.opt.push(recOpt.b2)

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let dh = recOpt.b0.y0 - (recOpt.t.y0 + recOpt.t.h0)
      w0 = lenD.h[0] * 0.15
      h0 = dh * 0.9
      x0 = recOpt.t.x0
      y0 = recOpt.t.y0 + recOpt.t.h0 + (dh - h0) / 2

      recOpt.l = {
        id: sbTag + 'left',
        tagVecDataIn: 'run',
        x0: x0,
        y0: y0,
        w0: w0,
        h0: h0,
        focus0: 0,
        recOrder: 'topLeftToRight',
        isInvOrder: true,
        isHorz: false,
        recH: w0 * 0.45,
        recW: w0 * 0.45,
        bckRecOpt: {
          textureOrient: '2/8',
          textureOpac: 0.04,
          frontProp: { strkWOcp: outerStrkOpac }
        }
      }
      confD.opt.push(recOpt.l)

      let title0h = recOpt.l.h0 * 0.07
      let titleSize = title0h * 0.6

      // first three are for the column titles (x,y filled in the loop below)
      let txtData = [
        {
          id: 'col' + '0',
          type: 0,
          size: titleSize,
          x: 0,
          y: 0,
          txt: confD.s0.title[0]
        },
        {
          id: 'col' + '1',
          type: 0,
          size: titleSize,
          x: 0,
          y: 0,
          txt: confD.s0.title[1]
        },
        {
          id: 'col' + '2',
          type: 0,
          size: titleSize,
          x: 0,
          y: 0,
          txt: confD.s0.title[2]
        }
      ]

      txtData.push({
        id: 'main' + '0',
        type: 1,
        size: titleSize * 0.8,
        txt: 'Pending blocks',
        x: lenD.w[0] / 2,
        y: recOpt.t.y0 - lenD.h[0] * 0.015
      })
      txtData.push({
        id: 'main' + '1',
        type: 1,
        size: titleSize * 0.8,
        trans: 'rotate(-90)',
        txt: 'Running blocks',
        x: recOpt.t.x0 / 2,
        y: recOpt.l.y0 + recOpt.l.h0 / 2 - lenD.h[0] * 0.015
      })
      txtData.push({
        id: 'main' + '2',
        type: 1,
        size: titleSize * 0.8,
        txt: 'Successful blocks',
        x: lenD.w[0] / 2,
        // y:(recOpt.b0.y0 - recOpt.b1.h0*0.125)
        y: recOpt.b0.y0 - lenD.h[0] * 0.015
        // y:(lenD.h[0] - (lenD.h[0]-recOpt.b0.y0-recOpt.b0.h0)/2)
      })
      txtData.push({
        id: 'main' + '2',
        type: 1,
        size: titleSize * 0.8,
        txt: 'Cancelled blocks',
        x: recOpt.b1.x0 + recOpt.b1.w0 / 2,
        y: lenD.h[0] - (lenD.h[0] - recOpt.b1.y0 - recOpt.b1.h0) / 2
      })
      txtData.push({
        id: 'main' + '2',
        type: 1,
        size: titleSize * 0.8,
        txt: 'Failed blocks',
        x: recOpt.b2.x0 + recOpt.b2.w0 / 2,
        y: lenD.h[0] - (lenD.h[0] - recOpt.b2.y0 - recOpt.b2.h0) / 2
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let inFracH = 0.9
      let inFracW = 0.95
      let inner = {}
      inner.x0 = recOpt.l.x0 + recOpt.l.w0 * 1.1
      inner.y0 = recOpt.l.y0 + recOpt.l.h0 * (1 - inFracH) / 2 + title0h
      inner.w0 = (recOpt.t.x0 + recOpt.t.w0 - inner.x0) * inFracW
      inner.h0 = recOpt.l.h0 * inFracH - title0h
      inner.x0 += inner.w0 * ((1 - inFracW) / inFracW) / 2

      let colRowV = []
      colRowV.push({
        width: 0.3,
        isHorz: true,
        rows: confD.s1[confD.s0.id[0]].title
      })
      colRowV.push({
        width: 0.4,
        isHorz: false,
        rows: confD.s1[confD.s0.id[1]].title
      })
      colRowV.push({
        width: 0.3,
        isHorz: true,
        rows: confD.s1[confD.s0.id[2]].title
      })

      // ---------------------------------------------------------------------------------------------------
      // let nCol = colRowV.length
      $.each(colRowV, function (nColNow, colData) {
        let colW = inner.w0 * colData.width
        let nColRow = colData.rows.length
        for (let nRowNow = 0; nRowNow < nColRow; nRowNow++) {
          let w0 = colW
          let h0 = inner.h0 / nColRow
          let x0 = inner.x0
          let y0 = inner.y0 + nRowNow * h0

          for (let nPrevColNow = 0; nPrevColNow < nColNow; nPrevColNow++) {
            x0 += inner.w0 * colRowV[nPrevColNow].width
          }

          // derive the title's position (before adding the margin)
          if (nRowNow === 0) {
            txtData[nColNow].x = x0 + w0 / 2
            txtData[nColNow].y = y0 - title0h / 2
          }

          let marg = inner.w0 * 0.015
          w0 -= marg
          h0 -= marg
          x0 += marg / 2
          y0 += marg / 2

          let m0 = 0
          if (nColRow > 1) {
            m0 = title0h * 0.8
            txtData.push({
              id: 'row' + nColNow + nRowNow,
              type: 1,
              size: titleSize * 0.9 * (m0 / title0h),
              x: x0 + w0 / 2,
              y: y0 + m0 / 2,
              txt: colData.rows[nRowNow]
            })
          }

          let colTag = confD.s0.id[nColNow]
          let rowTag = confD.s1[colTag].id[nRowNow]
          // let orient = '1/8' // (nRowNow%3 + 1 + 4*(nColNow%2)) + "/8"; // allow "1,2,3,5,6,7"+"/8"
          let recWH = colData.isHorz ? w0 * 0.15 : w0 * 0.2

          let nBoxRows = rowTag === 'run_takeData' ? 3 : 1
          // console.log('-----',colTag,rowTag,nBoxRows);

          recOpt['inner' + nColNow + nRowNow] = {
            id: sbTag + 'inner' + nColNow + nRowNow,
            tagVecDataIn: rowTag,
            x0: x0,
            y0: y0,
            w0: w0,
            h0: h0,
            m0: m0,
            nRows: nBoxRows,
            focus0: 0,
            recOrder: 'topLeftToRight',
            isInvOrder: colData.isHorz,
            isHorz: colData.isHorz,
            recH: recWH,
            recW: recWH,
            bckRecOpt: {
              circType: 'lighter',
              size: 7,
              textureOpac: 0.05,
              frontProp: { strkW: 1, fillOcp: 0.025, strkWOcp: 0.2 }
              // textureOrient:orient, textureOpac:0.04, frontProp:{ strkW:1, fillOcp:0.025, strkWOcp:0.2 }
            }
          }

          confD.opt.push(recOpt['inner' + nColNow + nRowNow])
        }
      })

      // attach new data (select by id, and so will override existing data if has the same id)
      let tagTtl = sbTag + 'title'
      let text = recD.gBase
        .selectAll('text.' + tagTtl)
        .data(txtData, function (d) {
          return d.id
        })

      // operate on new elements only
      // ---------------------------------------------------------------------------------------------------
      text
        .enter()
        .append('text')
        .attr('class', tagTtl)
        .text(function (d) {
          return d.txt
        })
        .attr('id', function (d) {
          return myUniqueId + sbTag + d.id + tagTtl
        })
        .style('font-weight', function (d) {
          return d.type === 0 ? 'bold' : 'normal'
        })
        .style('opacity', '0')
        .style('fill-opacity', function (d) {
          return d.type === 0 ? 0.8 : 0.8
        })
        .style('fill', '#383b42')
        .style('stroke-width', function (d) {
          return d.type === 0 ? 0.3 : 0
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        // .each(function(d,i){ d.fontScale = String(fontScale); d.shiftY = shiftY; })
        .style('stroke', function (d) {
          return '#383b42'
        })
        .style('font-size', function (d) {
          return d.size + 'px'
        })
        // this comes last -  translate after the labels are drawn, so that the element size is available
        .attr('transform', function (d, i) {
          if (hasVar(d.trans)) {
            return 'translate(' + d.x + ',' + d.y + ')' + d.trans
          } else {
            return 'translate(' + d.x + ',' + d.y + ')'
          }
        })
        // .attr("transform", function(d,i) { return "translate("+d.x+","+d.y+")" + hasVar(d.trans)?d.trans:""; })
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
        // .attr("dy", (titleSize*0.8/3)+'px')
        .attr('text-anchor', 'middle')
        // .style("font-size", titleSize+'px')
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', '1')

      text
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()

      recD[tagClipPath + 'outer'] = recD.gBase
        .append('defs')
        .append('clipPath')
        .attr('id', tagClipPath + 'outer')
      recD[tagClipPath + 'outer']
        .append('rect')
        .attr('x', recOpt.t.x0)
        .attr('y', recOpt.t.y0)
        .attr('width', recOpt.t.w0)
        .attr('height', recOpt.b2.y0 + recOpt.b2.h0 - recOpt.t.y0)
      // .attr("stroke", 'red').attr("stroke-width","2")

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      updateRecDataOnce(dataIn)

      runWhenReady({
        pass: function () {
          return locker.isFree(sbTag + 'updateData')
        },
        execute: function () {
          locker.remove('inInit')
        }
      })
    }
    this.initData = initData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateRecD (dataIn) {
      com.blocks = dataIn.blocks
      com.telIds = dataIn.telIds
      com.timeOfNight = dataIn.timeOfNight

      let allBlocks = []
        .concat(dataIn.blocks.wait)
        .concat(dataIn.blocks.run)
        .concat(dataIn.blocks.done)

      let sbIndex = {}
      sbIndex.sbGlobalCounter = 0

      let prevTags = {}
      if (!hasVar(recD[tagPrevTag])) recD[tagPrevTag] = {}

      recD[tagDataIn] = {}
      $.each(allBlocks, function (index, dataNow) {
        if (!hasVar(sbIndex[dataNow.sbId])) {
          sbIndex[dataNow.sbId] = { sb: sbIndex.sbGlobalCounter, ob: 0 }
          sbIndex.sbGlobalCounter++
        }

        // console.log(index,dataNow);
        let id = 'blk' + dataNow.sbId + dataNow.obId

        dataNow.runPhase.unshift(dataNow.exeState.state)

        $.each(dataNow.runPhase, function (nState, stateNow) {
          if (!hasVar(recD[tagDataIn][stateNow])) recD[tagDataIn][stateNow] = []

          let idNow = id
          if (nState !== 0) {
            dataNow = deepCopy(dataNow)
            idNow += stateNow
          }
          dataNow.id = idNow
          // console.log(nState,stateNow);

          recD[tagDataIn][stateNow].push(dataNow)

          if (hasVar(recD[tagPrevTag][idNow])) {
            prevTags[idNow] = recD[tagPrevTag][idNow]
          }
        })

        sbIndex[dataNow.sbId].ob++
      })

      recD[tagPrevTag] = prevTags
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateData (dataIn) {
      if (!locker.isFree('inInit')) {
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }

      updateRecData(dataIn)
    }
    this.updateData = updateData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    runLoop.init({ tag: 'updateRecData', func: updateRecDataOnce, nKeep: 1 })

    function updateRecData (dataIn) {
      runLoop.push({ tag: 'updateRecData', data: dataIn }) //, time:dataIn.emitTime
    }

    function updateRecDataOnce (dataIn) {
      if (
        !locker.isFreeV([
          sbTag + 'updateData',
          sbTag + 'zoom',
          bqTag + 'zoom'
        ])
      ) {
        // console.log('will delay updateRecData',locker.getActiveV([sbTag+"UpdateData", sbTag+"Zoom", bqTag+"Zoom"]));
        setTimeout(function () {
          updateRecData(dataIn)
        }, 10)
        return
      }
      locker.add(sbTag + 'updateData')

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let hasNewData = false
      if (!hasVar(scrollGrid)) {
        scrollGrid = {}
        $.each(confD.opt, function (index, optIn) {
          optIn.gBox = recD.gBase
          optIn.gBack = recD.gBack // explicitly give the shared g
          optIn.gBckData = recD.dataG // explicitly give the shared g
          optIn.recV = recD[tagDataIn][optIn.tagVecDataIn]
          optIn.tagClipPath = tagClipPath
          optIn.autoClipPath = false
          optIn.scrollRecW = lenD.w[0] * 0.015
          optIn.recD = recD
          // optIn.showCounts    = false;
          optIn.lockerV = [sbTag + 'updateData']
          optIn.lockerZoom = {
            all: sbTag + 'zoom',
            during: sbTag + 'zoomDuring',
            end: sbTag + 'zoomEnd'
          }
          optIn.onZoom = {
            start: onZoomStart,
            during: onZoomDuring,
            end: onZoomDuring
          }
          // optIn.vorOpt        = { onlyMid:true, mouseover:null, click:null, dblclick:null };
          optIn.vorOpt = { mouseover: null, click: onVorClick, dblclick: null }
          optIn.runLoop = runLoop
          optIn.locker = locker

          scrollGrid[optIn.id] = new ScrollGrid(optIn)
        })

        hasNewData = true
      } else {
        updateRecD(dataIn)

        $.each(confD.opt, function (index, optIn) {
          let id = optIn.id
          let recV = recD[tagDataIn][optIn.tagVecDataIn]
          if (!hasVar(recV)) recV = []

          // console.log(index,id,recV.length,optIn.tagVecDataIn);
          let recVprev = scrollGrid[id].getRecV()
          let recIdV0 = recV.map(function (d) {
            return d.id
          })
          let recIdV1 = recVprev.map(function (d) {
            return d.id
          })
          let recIdV2 = recIdV0.filter(function (n) {
            return recIdV1.includes(n)
          })

          if (
            recIdV0.length === recIdV1.length &&
            recIdV0.length === recIdV2.length
          ) {
            return
          }

          scrollGrid[id].update({ recV: recV })

          hasNewData = true
        })
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      blockQueue.set({ tag: 'telIds', data: com.telIds })
      blockQueue.set({ tag: 'time', data: com.timeOfNight })
      blockQueue.update(com.blocks)

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      if (hasNewData) {
        updateRecs()
        locker.remove({
          id: sbTag + 'updateData',
          delay: timeD.animArc * 2
        })
      } else {
        locker.remove({ id: sbTag + 'updateData' })
      }
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    runLoop.init({ tag: 'blockFocus', func: blockFocusOnce, nKeep: 1 })

    function blockFocus (dataIn) {
      runLoop.push({ tag: 'blockFocus', data: dataIn }) //, time:dataIn.emitTime
    }
    this.blockFocus = blockFocus

    function blockFocusOnce (optIn) {
      if (
        !locker.isFreeV([
          sbTag + 'updateData',
          sbTag + 'zoom',
          bqTag + 'zoom'
        ])
      ) {
        // console.log('will delay _blockFocus_');
        setTimeout(function () {
          blockFocus(optIn)
        }, 10)
        return
      }
      locker.add(sbTag + 'updateData')
      // console.log(' will run _blockFocus_...');

      if (!hasVar(optIn)) optIn = {}
      com.focusId = hasVar(optIn.id) ? optIn.id : ''

      com.focusBlock = getFocusBlock({
        blocks: com.blocks,
        focusId: com.focusId
      })

      if (blockQueue.get('focusId') !== com.focusId) {
        blockQueue.set({ tag: 'focusId', data: com.focusId })
        blockQueue.setBlockRect()
      }

      syncStateSend({
        type: 'syncObFocus',
        syncTime: Date.now(),
        obId: com.focusId
      })

      locker.remove({ id: sbTag + 'updateData' })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function recCol (d, i) {
      return colsBlk[d.data.metaData.nSched % colsBlk.length]
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateRecs () {
      let tagRec = sbTag + 'rec'
      let tagTxtIn = sbTag + 'recTxtIn'
      // let tagTxtOut = sbTag + 'recTxtOut'
      let animT = timeD.animArc * 2
      // animT *= 6

      let dataRec = []
      $.each(confD.opt, function (index, optIn) {
        let id = optIn.id
        let dataNow = recD[id]
        dataRec = dataRec.concat(dataNow)
      })

      // check if the clip-path needs to be expanded for an element which chanes scrollGridId
      let isNewTag = {}
      $.each(dataRec, function (index, dataNow) {
        let id = dataNow.id

        isNewTag[id] =
          hasVar(recD[tagPrevTag][id]) &&
          recD[tagPrevTag][id] !== dataNow.scrollGridId

        recD[tagPrevTag][id] = dataNow.scrollGridId
      })

      let rect = recD.dataG
        .selectAll('rect.' + tagRec)
        .data(dataRec, function (d) {
          return d.id
        })

      let yTop = recOpt.t.y0 + recOpt.t.h0
      let yBot = recOpt.b0.y0
      let xLeft = recOpt.l.x0 + recOpt.l.w0

      // let xTopLeft = recOpt.t.x0
      // let xTopRight = recOpt.t.x0 + recOpt.t.w0
      // let yTopMid = recOpt.t.y0 + recOpt.t.h0 / 2
      // let yBotMid = recOpt.b0.y0 + recOpt.b0.h0 / 2

      rect
        .enter()
        .append('rect')
        .attr('stroke', function (d, i) {
          return d3.rgb(recCol(d, i)).darker(1.0)
        }) // "#383B42"
        .attr('stroke-width', 0.5)
        .style('stroke-opacity', 0.7)
        .style('fill-opacity', 0)
        .style('opacity', 0)
        .attr('x', function (d) {
          return d.x
        })
        .attr('y', function (d) {
          return d.y
        })
        // .attr("x", function(d){ return d.x+d.w/2; })
        // .attr("y", function(d){ return d.y+d.h/2; })
        .attr('width', function (d) {
          return d.w
        })
        .attr('height', function (d) {
          return d.h
        })
        .style('fill', recCol)
        .attr('vector-effect', 'non-scaling-stroke')
        .merge(rect)
        .attr('class', function (d) {
          return tagRec
        })
        .each(function (d) {
          d.recX0 = +d3.select(this).attr('x')
          d.recY0 = +d3.select(this).attr('y')

          d.recXyRatio = d.recY0 / (d.recX0 + d.recY0)

          if (d.recY0 <= yTop || d.recY0 >= yBot) d.recOrder = 1
          else if (d.recX0 < xLeft) d.recOrder = 0
          else d.recOrder = -1
        })
        .attr('clip-path', function (d, i) {
          return isNewTag[d.id]
            ? 'url(#' + tagClipPath + 'outer' + ')'
            : 'url(#' + tagClipPath + d.scrollGridId + ')'
        })
        .transition('inOut')
        .duration(animT)
        .attr('width', function (d) {
          return d.w
        })
        .attr('height', function (d) {
          return d.h
        })
        .style('opacity', 1)
        .style('fill', recCol)
        .style('fill-opacity', 0.3)
        .attrTween('x', function (d) {
          return transRecXY(d, 'x', [1, 0])
        })
        .attrTween('y', function (d) {
          return transRecXY(d, 'y', [0, 1])
        })
        // .attr("x", function(d){ return d.x; })
        // .attr("y", function(d){ return d.y; })
        .transition('clipPath')
        .duration(1)
        .attr('clip-path', function (d) {
          return 'url(#' + tagClipPath + d.scrollGridId + ')'
        })

      rect
        .exit()
        .transition('inOut')
        .duration(timeD.animArc / 2)
        .style('opacity', 0)
        .remove()

      let textIn = recD.dataG
        .selectAll('text.' + tagTxtIn)
        .data(dataRec, function (d) {
          return d.id
        })

      textIn
        .enter()
        .append('text')
        .text(function (d) {
          return d.data.metaData.blockName
        })
        .each(function (d) {
          d.nodeId = sbTag + d.id + tagTxtIn
        })
        .style('font-weight', 'normal')
        .style('opacity', 0)
        .style('fill-opacity', 0.7)
        .style('fill', '#383b42')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', function (d) {
          return '#383b42'
        })
        // .attr("transform", function(d,i) { return "translate("+(d.x+d.w/2)+","+(d.y+d.h/2)+")"; })
        .attr('x', function (d, i) {
          return d.x + d.w / 2
        })
        .attr('y', function (d, i) {
          return d.y + d.h / 2
        })
        .attr('text-anchor', 'middle')
        .merge(textIn)
        .attr('class', function (d) {
          return tagTxtIn
        })
        .each(function (d, i) {
          d.textX0 = +d3.select(this).attr('x') - d.w / 2
          d.textY0 = +d3.select(this).attr('y') - d.h / 2

          d.textXyRatio = d.textY0 / (d.textX0 + d.textY0)

          if (d.textY0 <= yTop || d.textY0 >= yBot) {
            d.textOrder = 1
          } else if (d.textX0 < xLeft) {
            d.textOrder = 0
          } else {
            d.textOrder = -1
          }

          d.size = d.w / 4
        })
        .style('font-size', function (d) {
          return d.size + 'px'
        })
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
        .attr('clip-path', function (d, i) {
          return isNewTag[d.id]
            ? 'url(#' + tagClipPath + 'outer' + ')'
            : 'url(#' + tagClipPath + d.scrollGridId + ')'
        })
        .transition('inOut')
        .duration(animT)
        // .attrTween("transform", transRec)
        .style('opacity', 1)
        .attrTween('x', function (d) {
          return transTxtXY(d, 'x', 'w', [1, 0])
        })
        .attrTween('y', function (d) {
          return transTxtXY(d, 'y', 'h', [0, 1])
        })
        // .attr("x", function(d){ return (d.x+d.w/2); })
        // .attr("y", function(d){ return (d.y+d.h/2); })
        .transition('clipPath')
        .duration(1)
        .attr('clip-path', function (d) {
          return 'url(#' + tagClipPath + d.scrollGridId + ')'
        })

      textIn
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let zoomTargets = {}
    function onZoomStart (optIn) {
      let tagRec = sbTag + 'rec'
      let tagTxtIn = sbTag + 'recTxtIn'

      zoomTargets.rect = recD.dataG
        .selectAll('rect.' + tagRec)
        .filter(function (d) {
          return d.scrollGridId === optIn.id
        })

      zoomTargets.text = recD.dataG
        .selectAll('text.' + tagTxtIn)
        .filter(function (d) {
          return d.scrollGridId === optIn.id
        })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function onZoomDuring (optIn) {
      let xy = optIn.xy
      let delta = optIn.wh / 2
      let duration = optIn.duration

      if (duration <= 0) {
        zoomTargets.rect.attr(xy, function (d, i) {
          return d[xy]
        })
        zoomTargets.text.attr(xy, function (d, i) {
          return d[xy] + delta
        })
      } else {
        zoomTargets.rect
          .transition('move')
          .duration(duration)
          .attr(xy, function (d, i) {
            return d[xy]
          })
        zoomTargets.text
          .transition('move')
          .duration(duration)
          .attr(xy, function (d, i) {
            return d[xy] + delta
          })
      }
    }
    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    // function onZoomEnd(optIn) {
    //   onZoomDuring(optIn);
    //   return;
    // }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function onVorClick (d) {
      // console.log('-onVorClick-',d.data.data.obId);

      blockFocus({ id: d.data.data.obId })

      let data = {
        type: 'syncObFocus',
        syncTime: Date.now(),
        obId: d.data.data.obId
      }
      sock.sockSyncStateSend({
        widgetId: widgetId,
        type: data.type,
        data: data
      })
    }

    // ---------------------------------------------------------------------------------------------------
    // functions to compute moevemnt of blocks according to set grid
    // ---------------------------------------------------------------------------------------------------
    function xyOrder (indexV, xyOrder, xyRatio, t) {
      if (xyOrder === indexV[0]) {
        if (t < xyRatio) return t / xyRatio
        else return 1
      } else if (xyOrder === indexV[1]) {
        if (t < xyRatio) return 0
        else return (t - xyRatio) / (1 - xyRatio)
      } else return t
    }
    function transRecXY (d, xy, indexV) {
      let XY = xy.toUpperCase()
      return function (t) {
        let tNow = xyOrder(indexV, d.recOrder, d.recXyRatio, t)
        return d['rec' + XY + '0'] + (d[xy] - d['rec' + XY + '0']) * tNow
      }
    }
    function transTxtXY (d, xy, wh, indexV) {
      let XY = xy.toUpperCase()
      return function (t) {
        let tNow = xyOrder(indexV, d.textOrder, d.textXyRatio, t)
        return (
          d['text' + XY + '0'] +
          (d[xy] - d['text' + XY + '0']) * tNow +
          d[wh] / 2
        )
      }
    }

    // function spiral() {
    //   let centerX = w0/2,
    //       centerY = h0*2,
    //       radius = 150,
    //       coils = 8;

    //   let rotation = 2 * Math.PI;
    //   let thetaMax = coils * 2 * Math.PI;
    //   let awayStep = radius / thetaMax;
    //   let chord = 23.5;

    //   let newTime = [];

    //   for ( theta = chord / awayStep; theta <= thetaMax; ) {
    //       away = awayStep * theta;
    //       around = theta + rotation;

    //       x = centerX + Math.cos ( around ) * away;
    //       y = centerY + Math.sin ( around ) * away;

    //       theta += chord / away;

    //       newTime.push({x: x, y: y});
    //   }

    //   let svggg = com.queue.gBase;

    //   let lineFunction = d3.line()
    //                       .x(function(d) { return d.x; })
    //                       .y(function(d) { return d.y; })
    //                       .curve(d3.curveCatmullRom.alpha(0.5))

    //   svggg.append("path")
    //     .attr("d", lineFunction(newTime))
    //     .attr("stroke", "gray")
    //     .attr("stroke-width", 0.5)
    //     .attr("fill", "none");

    //   let circles = svggg.selectAll("circle")
    //      .data(newTime)
    //      .enter()
    //        .append("circle")
    //        .attr("cx", function (d) { return d.x; })
    //        .attr("cy", function (d) { return d.y; })
    //        .attr("r", 1);
    // }
  }
  let SvgBlocksQueueServerPast = function () {
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServerPast.x + box.blockQueueServerPast.w * 0.03,
        y: box.blockQueueServerPast.y + box.blockQueueServerPast.h * 0.05,
        w: box.blockQueueServerPast.w * 0.94,
        h: box.blockQueueServerPast.h * 0.8,
        marg: lenD.w[0] * 0.01
      }

      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
      gBlockBox.append('text')
        .text('SERVER SCHEDULE')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(-5,' + (box.blockQueueServerPast.h * 0.4) + ') rotate(270)')

      blockQueueServerPast = new BlockQueueCreator({
        main: {
          tag: 'blockQueueMiddleTag',
          g: gBlockBox,
          box: adjustedBox,
          background: {
            fill: colorTheme.dark.background,
            stroke: colorTheme.dark.stroke,
            strokeWidth: 0.1
          },
          colorTheme: colorTheme
        },
        axis: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
          axis: undefined,
          scale: undefined,
          domain: [0, 1000],
          range: [0, 0],
          showText: true,
          orientation: 'axisTop',
          attr: {
            text: {
              stroke: colorTheme.medium.stroke,
              fill: colorTheme.medium.stroke
            },
            path: {
              stroke: colorTheme.medium.stroke,
              fill: colorTheme.medium.stroke
            }
          }
        },
        blocks: {
          enabled: true,
          run: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.46875, w: adjustedBox.w, h: adjustedBox.h * 0.53125, marg: adjustedBox.marg},
            events: {
              click: () => {},
              mouseover: () => {},
              mouseout: () => {},
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            },
            background: {
              fill: colorTheme.brighter.background,
              stroke: 'none',
              strokeWidth: 0
            }
          },
          cancel: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h * 0.3125, marg: adjustedBox.marg},
            events: {
              click: () => {},
              mouseover: () => {},
              mouseout: () => {},
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            },
            background: {
              fill: colorTheme.brighter.background,
              stroke: colorTheme.brighter.stroke,
              strokeWidth: 0
            }
          },
          modification: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.5, w: adjustedBox.w, h: adjustedBox.h * 0.47, marg: adjustedBox.marg},
            events: {
              click: () => {},
              mouseover: () => {},
              mouseout: () => {},
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            },
            background: {
              fill: colorTheme.brighter.background,
              stroke: colorTheme.brighter.stroke,
              strokeWidth: 0
            }
          },
          colorPalette: colorTheme.blocks
        },
        filters: {
          enabled: false,
          g: undefined,
          box: {x: 0, y: adjustedBox.h * 0.15, w: adjustedBox * 0.12, h: adjustedBox.h * 0.7, marg: 0},
          filters: []
        },
        timeBars: {
          enabled: false,
          g: undefined,
          box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
        },
        time: {
          currentTime: {time: 0, date: undefined},
          startTime: {time: 0, date: undefined},
          endTime: {time: 0, date: undefined}
        },
        data: {
          raw: undefined,
          formated: undefined,
          modified: undefined
        },
        debug: {
          enabled: false
        },
        pattern: {},
        event: {
          modifications: () => {}
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })

      blockQueueServerPast.init()
      updateData()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      let startTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds() - (3600 * 8)), time: Number(shared.data.server.timeOfNight.now) - (3600 * 8)}
      let endTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds()), time: Number(shared.data.server.timeOfNight.now)}
      blockQueueServerPast.updateData({
        time: {
          currentTime: currentTime,
          startTime: startTime,
          endTime: endTime
        },
        data: {
          raw: {
            blocks: shared.data.server.blocks,
            telIds: shared.data.server.telIds
          },
          modified: []
        }
      })
    }
    this.updateData = updateData

    function update () {
      blockQueueServerPast.update({
        time: {
          currentTime: {date: new Date(shared.data.server.timeOfNight.date_now), time: Number(shared.data.server.timeOfNight.now)},
          startTime: {date: new Date(shared.data.server.timeOfNight.date_start), time: Number(shared.data.server.timeOfNight.start)},
          endTime: {date: new Date(shared.data.server.timeOfNight.date_end), time: Number(shared.data.server.timeOfNight.end)}
        }
      })
    }
    this.update = update
  }
  let SvgBlocksQueueServerFutur = function () {
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServerFutur.x + box.blockQueueServerFutur.w * 0.03,
        y: box.blockQueueServerFutur.y + box.blockQueueServerFutur.h * 0.05,
        w: box.blockQueueServerFutur.w * 0.94,
        h: box.blockQueueServerFutur.h * 0.8,
        marg: lenD.w[0] * 0.01
      }

      let gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
      // gBlockBox.append('text')
      //   .text('SERVER SCHEDULE')
      //   .style('fill', colorTheme.medium.text)
      //   .style('font-weight', 'bold')
      //   .style('font-size', '12px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(-5,' + (box.blockQueueServerFutur.h * 0.4) + ') rotate(270)')

      blockQueueServerFutur = new BlockQueueCreator({
        main: {
          tag: 'blockQueueServerFuturTag',
          g: gBlockBox,
          box: adjustedBox,
          background: {
            fill: colorTheme.dark.background,
            stroke: colorTheme.dark.stroke,
            strokeWidth: 0.1
          },
          colorTheme: colorTheme
        },
        axis: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
          axis: undefined,
          scale: undefined,
          domain: [0, 1000],
          range: [0, 0],
          showText: true,
          orientation: 'axisTop',
          attr: {
            text: {
              stroke: colorTheme.medium.stroke,
              fill: colorTheme.medium.stroke
            },
            path: {
              stroke: colorTheme.medium.stroke,
              fill: colorTheme.medium.stroke
            }
          }
        },
        blocks: {
          enabled: true,
          run: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.46875, w: adjustedBox.w, h: adjustedBox.h * 0.53125, marg: adjustedBox.marg},
            events: {
              click: () => {},
              mouseover: () => {},
              mouseout: () => {},
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            },
            background: {
              fill: colorTheme.brighter.background,
              stroke: 'none',
              strokeWidth: 0
            }
          },
          cancel: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h * 0.3125, marg: adjustedBox.marg},
            events: {
              click: () => {},
              mouseover: () => {},
              mouseout: () => {},
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            },
            background: {
              fill: colorTheme.brighter.background,
              stroke: colorTheme.brighter.stroke,
              strokeWidth: 0
            }
          },
          modification: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.5, w: adjustedBox.w, h: adjustedBox.h * 0.47, marg: adjustedBox.marg},
            events: {
              click: () => {},
              mouseover: () => {},
              mouseout: () => {},
              drag: {
                start: () => {},
                tick: () => {},
                end: () => {}
              }
            },
            background: {
              fill: colorTheme.brighter.background,
              stroke: colorTheme.brighter.stroke,
              strokeWidth: 0
            }
          },
          colorPalette: colorTheme.blocks
        },
        filters: {
          enabled: false,
          g: undefined,
          box: {x: 0, y: adjustedBox.h * 0.15, w: adjustedBox * 0.12, h: adjustedBox.h * 0.7, marg: 0},
          filters: []
        },
        timeBars: {
          enabled: true,
          g: undefined,
          box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
        },
        time: {
          currentTime: {time: 0, date: undefined},
          startTime: {time: 0, date: undefined},
          endTime: {time: 0, date: undefined}
        },
        data: {
          raw: undefined,
          formated: undefined,
          modified: undefined
        },
        debug: {
          enabled: false
        },
        pattern: {},
        event: {
          modifications: () => {}
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })

      blockQueueServerFutur.init()
      updateData()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      let startTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds()), time: Number(shared.data.server.timeOfNight.now)}
      let endTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds() + (3600 * 8)), time: Number(shared.data.server.timeOfNight.now) + (3600 * 8)}
      blockQueueServerFutur.updateData({
        time: {
          currentTime: currentTime,
          startTime: startTime,
          endTime: endTime
        },
        data: {
          raw: {
            blocks: shared.data.server.blocks,
            telIds: shared.data.server.telIds
          },
          modified: []
        }
      })
    }
    this.updateData = updateData

    function update () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      let startTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds()), time: Number(shared.data.server.timeOfNight.now)}
      let endTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds() + (3600 * 8)), time: Number(shared.data.server.timeOfNight.now) + (3600 * 8)}
      blockQueueServerFutur.updateData({
        time: {
          currentTime: currentTime,
          startTime: startTime,
          endTime: endTime
        }
      })
    }
    this.update = update
  }
  let SvgSuccessQueue = function () {
    let reserved = {}
    function initData () {
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.successQueue.x + ',' + box.successQueue.y + ')')
      reserved.gBlockBox.append('rect')
        .attr('x', 0 + box.successQueue.marg)
        .attr('y', 0 + box.successQueue.marg)
        .attr('width', box.successQueue.w * 1 - box.successQueue.marg)
        .attr('height', box.successQueue.h * 1 - box.successQueue.marg)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.2)
      reserved.gBlockBox.append('text')
        .text('SUCCESS')
        .style('fill', colorTheme.dark.text)
        .style('font-weight', 'bold')
        .style('font-size', '10px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(4,' + (box.successQueue.h * 0.55) + ') rotate(270)')

      reserved.scrollBoxG = reserved.gBlockBox.append('g')
      reserved.scrollBox = new ScrollBox()
      reserved.scrollBox.init({
        tag: 'successScrollBox',
        gBox: reserved.scrollBoxG,
        boxData: {
          x: 0 + box.successQueue.marg,
          y: 0 + box.successQueue.marg,
          w: box.successQueue.w - box.successQueue.marg,
          h: box.successQueue.h - box.successQueue.marg,
          marg: 0
        },
        useRelativeCoords: true,
        locker: new Locker(),
        lockerV: [widgetId + 'updateData'],
        lockerZoom: {
          all: 'successScrollBox' + 'zoom',
          during: 'successScrollBox' + 'zoomDuring',
          end: 'successScrollBox' + 'zoomEnd'
        },
        runLoop: new RunLoop({tag: 'successScrollBox'}),
        canScroll: true,
        scrollVertical: false,
        scrollHorizontal: true,
        scrollHeight: box.successQueue.h - box.successQueue.marg,
        scrollWidth: box.successQueue.w - box.successQueue.marg,
        background: colorTheme.dark.background,
        scrollRecH: {h: 6},
        scrollRecV: {w: 6}
      })
      reserved.scrollG = reserved.scrollBox.get('innerG')

      updateData()
    }
    this.initData = initData

    function updateData () {
      let successBlocks = reserved.scrollG
        .selectAll('g.successBlock')
        .data(shared.data.blocks.success, function (d) {
          return d.obId
        })
      let enterSuccessBlocks = successBlocks
        .enter()
        .append('g')
        .attr('class', 'successBlock')
        .attr('transform', function (d, i) {
          let translate = {
            y: 0,
            x: 60 * i // (length < 19 ? 0 : ((shared.modifications.box.h / 2) * (i % 2)))
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      enterSuccessBlocks.append('rect')
        .attr('class', 'background')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', function (d, i) {
          return 50
        })
        .attr('height', function (d, i) {
          return 100
        })
        .attr('fill', function (d, i) {
          return setCol(d).background
        })
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
        .on('mouseover', function (d) {
          // mainOverSchedBlocks(d.scheduleId)
        })
        .on('mouseout', function (d) {
          // mainOutSchedBlocks(d.scheduleId)
        })
        .on('click', function (d) {
          // mainFocusOnSchedBlocks(d.scheduleId)
        })
      // enterSchedulingBlocks.append('text')
      //   .attr('class', 'name')
      //   .text(function (d) {
      //     return 'SB ' + d.schedName
      //   })
      //   .attr('x', function (d, i) {
      //     return dim.w * 0.5
      //   })
      //   .attr('y', function (d, i) {
      //     return dim.h * 0.2
      //   })
      //   .style('font-weight', 'bold')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', dim.h * 0.25)
      //   .attr('dy', dim.h * 0.15)
      //   .style('pointer-events', 'none')
      //   .attr('fill', colorTheme.darker.text)
      //   .attr('stroke', 'none')
      // enterSchedulingBlocks.each(function (d) {
      //   let dimBlocks = dim.h * 0.16
      //   let length = d.blocks.length
      //   let offset = ((dim.w /* - dimBlocks * 2 */) - (length < 4 ? (dimBlocks * 1.2 * length) : (length % 2 === 0 ? (dimBlocks * 0.6 * length) : (dimBlocks * 0.7 * length)))) * 0.5
      //
      //   d3.select(this).selectAll('rect.subBlocks')
      //     .data(d.blocks, function (d) {
      //       return d.obId
      //     })
      //     .enter()
      //     .append('rect')
      //     .attr('class', 'subBlocks')
      //     .attr('x', function (d, i) {
      //       return offset + (length < 4 ? (dimBlocks * i * 1.2) : (length % 2 === 0 ? (0.6 * dimBlocks * (i - (i % 2))) : (dimBlocks * i * 0.6)))
      //     })
      //     .attr('y', function (d, i) {
      //       return dim.h - dimBlocks * 1.8 - (length < 4 ? dimBlocks * 0.5 : dimBlocks * 1.2 * (i % 2))
      //     })
      //     .attr('width', function (d, i) {
      //       return dimBlocks
      //     })
      //     .attr('height', function (d, i) {
      //       return dimBlocks
      //     })
      //     .attr('fill', function (d, i) {
      //       return setCol(d).background
      //     })
      //     .style('opacity', 1)
      //     .attr('stroke', 'black')
      //     .attr('stroke-width', 0.2)
      //     .style('pointer-events', 'none')
      // })

      let mergeSuccessBlocks = enterSuccessBlocks.merge(successBlocks)
      mergeSuccessBlocks.attr('transform', function (d, i) {
        let translate = {
          y: 0,
          x: 60 * i // (length < 19 ? 0 : ((shared.modifications.box.h / 2) * (i % 2)))
        }
        return 'translate(' + translate.x + ',' + translate.y + ')'
      })
      // schedulingBlocks.each(function (d) {
      //   d3.select(this).selectAll('rect.subBlocks')
      //     .data(d.blocks, function (d) {
      //       return d.obId
      //     })
      //     .transition()
      //     .duration(800)
      //     .attr('fill', function (d, i) {
      //       return setCol(d).background
      //     })
      // })

      reserved.scrollBox.resetHorizontalScroller({canScroll: true, scrollWidth: shared.data.blocks.success.length * 60})
      //reserved.scrollBox.resetVerticalScroller({canScroll: true, scrollHeight: parseInt(reserved.scrollG.attr('height') + 200, 10)})
    }
    this.updateData = updateData
  }
  let SvgFailQueue = function () {
    let reserved = {}
    function initData () {
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.failQueue.x + ',' + box.failQueue.y + ')')
      reserved.gBlockBox.append('rect')
        .attr('x', 0 + box.failQueue.marg)
        .attr('y', 0 + box.failQueue.marg)
        .attr('width', box.failQueue.w * 1 - box.failQueue.marg)
        .attr('height', box.failQueue.h * 1 - box.failQueue.marg)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.2)
      reserved.gBlockBox.append('text')
        .text('FAIL')
        .style('fill', colorTheme.dark.text)
        .style('font-weight', 'bold')
        .style('font-size', '10px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(4,' + (box.failQueue.h * 0.55) + ') rotate(270)')

      reserved.scrollBoxG = reserved.gBlockBox.append('g')
      reserved.scrollBox = new ScrollBox()
      reserved.scrollBox.init({
        tag: 'failScrollBox',
        gBox: reserved.scrollBoxG,
        boxData: {
          x: 0 + box.failQueue.marg,
          y: 0 + box.failQueue.marg,
          w: box.failQueue.w - box.failQueue.marg,
          h: box.failQueue.h - box.failQueue.marg,
          marg: 0
        },
        useRelativeCoords: true,
        locker: new Locker(),
        lockerV: [widgetId + 'updateData'],
        lockerZoom: {
          all: 'failScrollBox' + 'zoom',
          during: 'failScrollBox' + 'zoomDuring',
          end: 'failScrollBox' + 'zoomEnd'
        },
        runLoop: new RunLoop({tag: 'failScrollBox'}),
        canScroll: true,
        scrollVertical: false,
        scrollHorizontal: true,
        scrollHeight: box.failQueue.h - box.failQueue.marg,
        scrollWidth: box.failQueue.w - box.failQueue.marg,
        background: colorTheme.dark.background,
        scrollRecH: {h: 6},
        scrollRecV: {w: 6}
      })
      reserved.scrollG = reserved.scrollBox.get('innerG')
    }
    this.initData = initData

    function updateData () {
      let successBlocks = reserved.scrollG
        .selectAll('g.successBlock')
        .data(shared.data.blocks.fail, function (d) {
          return d.obId
        })
      let enterSuccessBlocks = successBlocks
        .enter()
        .append('g')
        .attr('class', 'successBlock')
        .attr('transform', function (d, i) {
          let translate = {
            y: 0,
            x: 60 * i // (length < 19 ? 0 : ((shared.modifications.box.h / 2) * (i % 2)))
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      enterSuccessBlocks.append('rect')
        .attr('class', 'background')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', function (d, i) {
          return 50
        })
        .attr('height', function (d, i) {
          return 100
        })
        .attr('fill', function (d, i) {
          return setCol(d).background
        })
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
        .on('mouseover', function (d) {
          // mainOverSchedBlocks(d.scheduleId)
        })
        .on('mouseout', function (d) {
          // mainOutSchedBlocks(d.scheduleId)
        })
        .on('click', function (d) {
          // mainFocusOnSchedBlocks(d.scheduleId)
        })

      let mergeSuccessBlocks = enterSuccessBlocks.merge(successBlocks)
      mergeSuccessBlocks.attr('transform', function (d, i) {
        let translate = {
          y: 0,
          x: 60 * i // (length < 19 ? 0 : ((shared.modifications.box.h / 2) * (i % 2)))
        }
        return 'translate(' + translate.x + ',' + translate.y + ')'
      })

      reserved.scrollBox.resetHorizontalScroller({canScroll: true, scrollWidth: shared.data.blocks.fail.length * 60})
    }
    this.updateData = updateData
  }
  let SvgCancelQueue = function () {
    let reserved = {}

    function initData () {
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.cancelQueue.x + ',' + box.cancelQueue.y + ')')
      reserved.gBlockBox.append('rect')
        .attr('x', 0 + box.cancelQueue.marg)
        .attr('y', 0 + box.cancelQueue.marg)
        .attr('width', box.cancelQueue.w * 1 - box.cancelQueue.marg)
        .attr('height', box.cancelQueue.h * 1 - box.cancelQueue.marg)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.2)
      reserved.gBlockBox.append('text')
        .text('CANCEL')
        .style('fill', colorTheme.dark.text)
        .style('font-weight', 'bold')
        .style('font-size', '10px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(4,' + (box.cancelQueue.h * 0.55) + ') rotate(270)')
      reserved.scrollBoxG = reserved.gBlockBox.append('g')
      reserved.scrollBox = new ScrollBox()
      reserved.scrollBox.init({
        tag: 'cancelScrollBox',
        gBox: reserved.scrollBoxG,
        boxData: {
          x: 0 + box.cancelQueue.marg,
          y: 0 + box.cancelQueue.marg,
          w: box.cancelQueue.w - box.cancelQueue.marg,
          h: box.cancelQueue.h - box.cancelQueue.marg,
          marg: 0
        },
        useRelativeCoords: true,
        locker: new Locker(),
        lockerV: [widgetId + 'updateData'],
        lockerZoom: {
          all: 'cancelScrollBox' + 'zoom',
          during: 'cancelScrollBox' + 'zoomDuring',
          end: 'cancelScrollBox' + 'zoomEnd'
        },
        runLoop: new RunLoop({tag: 'canelScrollBox'}),
        canScroll: true,
        scrollVertical: false,
        scrollHorizontal: true,
        scrollHeight: box.cancelQueue.h - box.cancelQueue.marg,
        scrollWidth: box.cancelQueue.w - box.cancelQueue.marg,
        background: colorTheme.dark.background,
        scrollRecH: {h: 6},
        scrollRecV: {w: 6}
      })
      reserved.scrollG = reserved.scrollBox.get('innerG')

      updateData()
    }
    this.initData = initData

    function updateData () {
      let cancelBlocks = reserved.scrollG
        .selectAll('g.cancelBlock')
        .data(shared.data.blocks.cancel, function (d) {
          return d.obId
        })
      let enterSuccessBlocks = cancelBlocks
        .enter()
        .append('g')
        .attr('class', 'successBlock')
        .attr('transform', function (d, i) {
          let translate = {
            y: 0,
            x: 60 * i // (length < 19 ? 0 : ((shared.modifications.box.h / 2) * (i % 2)))
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      enterSuccessBlocks.append('rect')
        .attr('class', 'background')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', function (d, i) {
          return 50
        })
        .attr('height', function (d, i) {
          return 100
        })
        .attr('fill', function (d, i) {
          return setCol(d).background
        })
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
        .on('mouseover', function (d) {
          // mainOverSchedBlocks(d.scheduleId)
        })
        .on('mouseout', function (d) {
          // mainOutSchedBlocks(d.scheduleId)
        })
        .on('click', function (d) {
          // mainFocusOnSchedBlocks(d.scheduleId)
        })
      // enterSchedulingBlocks.append('text')
      //   .attr('class', 'name')
      //   .text(function (d) {
      //     return 'SB ' + d.schedName
      //   })
      //   .attr('x', function (d, i) {
      //     return dim.w * 0.5
      //   })
      //   .attr('y', function (d, i) {
      //     return dim.h * 0.2
      //   })
      //   .style('font-weight', 'bold')
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', dim.h * 0.25)
      //   .attr('dy', dim.h * 0.15)
      //   .style('pointer-events', 'none')
      //   .attr('fill', colorTheme.darker.text)
      //   .attr('stroke', 'none')
      // enterSchedulingBlocks.each(function (d) {
      //   let dimBlocks = dim.h * 0.16
      //   let length = d.blocks.length
      //   let offset = ((dim.w /* - dimBlocks * 2 */) - (length < 4 ? (dimBlocks * 1.2 * length) : (length % 2 === 0 ? (dimBlocks * 0.6 * length) : (dimBlocks * 0.7 * length)))) * 0.5
      //
      //   d3.select(this).selectAll('rect.subBlocks')
      //     .data(d.blocks, function (d) {
      //       return d.obId
      //     })
      //     .enter()
      //     .append('rect')
      //     .attr('class', 'subBlocks')
      //     .attr('x', function (d, i) {
      //       return offset + (length < 4 ? (dimBlocks * i * 1.2) : (length % 2 === 0 ? (0.6 * dimBlocks * (i - (i % 2))) : (dimBlocks * i * 0.6)))
      //     })
      //     .attr('y', function (d, i) {
      //       return dim.h - dimBlocks * 1.8 - (length < 4 ? dimBlocks * 0.5 : dimBlocks * 1.2 * (i % 2))
      //     })
      //     .attr('width', function (d, i) {
      //       return dimBlocks
      //     })
      //     .attr('height', function (d, i) {
      //       return dimBlocks
      //     })
      //     .attr('fill', function (d, i) {
      //       return setCol(d).background
      //     })
      //     .style('opacity', 1)
      //     .attr('stroke', 'black')
      //     .attr('stroke-width', 0.2)
      //     .style('pointer-events', 'none')
      // })

      let mergeSuccessBlocks = enterSuccessBlocks.merge(cancelBlocks)
      mergeSuccessBlocks.attr('transform', function (d, i) {
        let translate = {
          y: 0,
          x: 60 * i // (length < 19 ? 0 : ((shared.modifications.box.h / 2) * (i % 2)))
        }
        return 'translate(' + translate.x + ',' + translate.y + ')'
      })
      // schedulingBlocks.each(function (d) {
      //   d3.select(this).selectAll('rect.subBlocks')
      //     .data(d.blocks, function (d) {
      //       return d.obId
      //     })
      //     .transition()
      //     .duration(800)
      //     .attr('fill', function (d, i) {
      //       return setCol(d).background
      //     })
      // })

      reserved.scrollBox.resetHorizontalScroller({canScroll: true, scrollWidth: shared.data.blocks.cancel.length * 60})
    }
    this.updateData = updateData
  }

  let SvgCurrentBlockToken = function () {

  }
  let SvgCurrentBlocks = function () {
    let reserved = {}

    function initData () {
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.currentBlocks.x + ',' + box.currentBlocks.y + ')')

      // reserved.gBlockBox.append('rect')
      //   .attr('x', 0 + box.currentBlocks.marg)
      //   .attr('y', 0 + box.currentBlocks.marg)
      //   .attr('width', box.currentBlocks.w * 1 - box.currentBlocks.marg)
      //   .attr('height', box.currentBlocks.h * 1 - 2 * box.currentBlocks.marg)
      //   .attr('fill', colorTheme.dark.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)

      reserved.currentTime = reserved.gBlockBox.append('text')
        .attr('class', 'currentHour')
        .attr('stroke', colorTheme.stroke)
        .attr('fill', colorTheme.stroke)
        .attr('x', box.currentBlocks.w * 0.5)
        .attr('y', box.currentBlocks.h * 0.06)
        .style('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .style('font-size', 13.2)
        .attr('dy', 5)
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      // updateData()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      // reserved.currentTime
      //   .text(date.getHours() + ' : ' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()))

      // let queueRun = deepCopy(shared.data.server.blocks.run)
      let queueRun = blockQueueServerFutur.getBlocksRows()
      queueRun = queueRun.filter(b => b.data.exeState.state === 'run')
      queueRun.sort(function (a, b) { return a.y > b.y })
      for (let i = 0; i < queueRun.length; i++) {
        queueRun[i].data.y = queueRun[i].y
        queueRun[i].data.h = queueRun[i].h
        queueRun[i] = queueRun[i].data
      }

      let telPerRow = 16
      let defaultHeightView = box.currentBlocks.h * 0.95
      let totHeight = 0
      for (let i = 0; i < queueRun.length; i++) {
        let nTel = queueRun[i].telIds.length
        let addTel = telPerRow - (queueRun[i].telIds.length % telPerRow)

        let nTelHeight = defaultHeightView * (nTel / 100)
        let addTelHeight = defaultHeightView * (addTel / 100)

        // defaultHeightView -= addTelHeight
        queueRun[i].height = nTelHeight + addTelHeight
        totHeight += nTelHeight + addTelHeight
      }

      defaultHeightView = box.currentBlocks.h * 1
      let ratio = defaultHeightView < totHeight ? (defaultHeightView / totHeight) : 1
      for (let i = 0; i < queueRun.length; i++) {
        queueRun[i].height *= ratio
      }
      totHeight = defaultHeightView < totHeight ? defaultHeightView : totHeight
      let offsetY = box.currentBlocks.h * 0.0 + (defaultHeightView - totHeight) * 0.5
      let verticalRatio = 0.85
      let horizontalRatio = 0.85

      let currentBlocks = reserved.gBlockBox
        .selectAll('g.currentBlock')
        .data(queueRun, function (d) {
          return d.obId
        })
      let enterCurrentBlocks = currentBlocks
        .enter()
        .append('g')
        .attr('class', 'currentBlock')
      enterCurrentBlocks.each(function (d, i) {
        let width = (box.currentBlocks.w * horizontalRatio)
        d3.select(this).append('path')
          .attr('fill', 'none')
          .attr('stroke', setCol(d).background)
          .attr('stroke-width', 4)
          .style('pointer-events', 'none')
        d3.select(this).append('rect')
          .attr('class', 'back')
          .attr('fill', function (d, i) {
            return colorTheme.dark.background
          })
          .attr('rx', 1)
          .attr('ry', 1)
          .style('fill-opacity', 1)
          .attr('stroke', setCol(d).background)
          .attr('stroke-width', 0.8)

        d3.select(this).append('text')
          .attr('x', 0)
          .attr('y', 12 + d.height * (1 - verticalRatio) * 0.5)
          .text(function () {
            return 'Block: ' + d.metaData.blockName
          })
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'middle')

        d3.select(this).append('circle')
          .attr('cx', 60)
          .attr('cy', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('r', 6.5)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.45)
        d3.select(this).append('text')
          .text('M')
          .attr('x', 60)
          .attr('y', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          // .style('font-weight', 'bold')
          .style('font-size', '8px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')

        d3.select(this).append('circle')
          .attr('cx', 75)
          .attr('cy', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('r', 6.5)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.45)
        d3.select(this).append('text')
          .text('C')
          .attr('x', 75)
          .attr('y', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          // .style('font-weight', 'bold')
          .style('font-size', '8px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')

        d3.select(this).append('circle')
          .attr('cx', 90)
          .attr('cy', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('r', 6.5)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.45)
        d3.select(this).append('text')
          .text('D')
          .attr('x', 90)
          .attr('y', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          // .style('font-weight', 'bold')
          .style('font-size', '8px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')

        // FINISH
        d3.select(this).append('circle')
          .attr('cx', -60)
          .attr('cy', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('r', 6.5)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.45)
        d3.select(this).append('text')
          .text('D')
          .attr('x', -60)
          .attr('y', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          // .style('font-weight', 'bold')
          .style('font-size', '8px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')

        d3.select(this).append('circle')
          .attr('cx', -75)
          .attr('cy', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('r', 6.5)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.45)
        d3.select(this).append('text')
          .text('C')
          .attr('x', -75)
          .attr('y', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          // .style('font-weight', 'bold')
          .style('font-size', '8px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')

        d3.select(this).append('circle')
          .attr('cx', -90)
          .attr('cy', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('r', 6.5)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.45)
        d3.select(this).append('text')
          .text('M')
          .attr('x', -90)
          .attr('y', 10 + d.height * (1 - verticalRatio) * 0.5)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          // .style('font-weight', 'bold')
          .style('font-size', '8px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')

        d3.select(this).append('rect')
          .attr('x', -(width * 0.95 * 0.5))
          .attr('y', 22 + d.height * (1 - verticalRatio) * 0.5)
          .attr('width', function () {
            return width * 0.95
          })
          .attr('height', function () {
            return (d.height * verticalRatio) - 26
          })
          .attr('fill', function () {
            return colorTheme.dark.background
          })
          .style('fill-opacity', 1)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)
      })

      let mergeCurrentBlocks = currentBlocks.merge(enterCurrentBlocks)

      mergeCurrentBlocks.each(function (d, i) {
        let height = d.height
        let translate = {
          y: offsetY, // + height * 0.5,
          x: box.currentBlocks.w * 0.5
        }
        offsetY += height

        d3.select(this).attr('transform', function (d, i) {
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })

        d3.select(this).select('rect.back')
          .attr('x', -translate.x * (horizontalRatio))
          .attr('y', height * (1 - verticalRatio) * 0.5)
          .attr('width', function (d) {
            return translate.x * ((horizontalRatio) * 2)
          })
          .attr('height', function (d) {
            return height * verticalRatio
          })

        let lineGenerator = d3.line()
          .x(function (d) { return d.x })
          .y(function (d) { return d.y })
          .curve(d3.curveBasis)
        let dataPointFuturTop = [
          {x: translate.x * 1, y: -translate.y + (box.blockQueueServerPast.h * 0.41375) + d.y + d.h * 0.5},
          {x: (translate.x * horizontalRatio) * 1.05 + (translate.x * ((1 - horizontalRatio) * 0.45)) * ((1 / queueRun.length) * i), y: -translate.y + (box.blockQueueServerPast.h * 0.41375) + d.y + d.h * 0.5},
          {x: (translate.x * horizontalRatio) * 1.05 + (translate.x * ((1 - horizontalRatio) * 0.45)) * ((1 / queueRun.length) * i), y: height * 0.5},
          {x: translate.x * horizontalRatio, y: height * 0.5},
          {x: 0, y: height * 0.5},
          {x: -(translate.x * horizontalRatio), y: height * 0.5},
          {x: -(translate.x * horizontalRatio) * 1.05 - (translate.x * ((1 - horizontalRatio) * 0.45)) * ((1 / queueRun.length) * i), y: height * 0.5},
          {x: -(translate.x * horizontalRatio) * 1.05 - (translate.x * ((1 - horizontalRatio) * 0.45)) * ((1 / queueRun.length) * i), y: -translate.y + box.blockQueueServerPast.y + (box.blockQueueServerPast.h * 0.41375) + d.y + d.h * 0.5},
          {x: -translate.x * 1, y: -translate.y + box.blockQueueServerPast.y + (box.blockQueueServerPast.h * 0.41375) + d.y + d.h * 0.5}
        ]
        d3.select(this).select('path')
          .data([dataPointFuturTop])
          .attr('d', lineGenerator)
      })
      // mergeCurrentBlocks.attr('transform', function (d, i) {
      //   let height = (d.telIds.length * (box.blockQueueServerPast.h * 0.8 * 0.53125)) * 0.008
      //   height = height < 14 ? 14 : height
      //   let translate = {
      //     y: offsetY + height * 0.5,
      //     x: box.currentBlocks.w * 0.5 // + (box.currentBlocks.w * 0.1 * odd)
      //   }
      //   offsetY += height + 30
      //   return 'translate(' + translate.x + ',' + translate.y + ')'
      // })
      currentBlocks
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
      // mergeSuccessBlocks.attr('transform', function (d, i) {
      //   let translate = {
      //     y: 0,
      //     x: 60 * i // (length < 19 ? 0 : ((shared.modifications.box.h / 2) * (i % 2)))
      //   }
      //   return 'translate(' + translate.x + ',' + translate.y + ')'
      // })
    }
    this.updateData = updateData
  }

  let svgBlocksQueueServerPast = new SvgBlocksQueueServerPast()
  let svgBlocksQueueServerFutur = new SvgBlocksQueueServerFutur()
  let svgSuccessQueue = new SvgSuccessQueue()
  let svgFailQueue = new SvgFailQueue()
  let svgCancelQueue = new SvgCancelQueue()
  let svgCurrentBlocks = new SvgCurrentBlocks()
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function getFocusBlock (optIn) {
    let focusBlock = null
    let blocks = optIn.blocks

    if (hasVar(blocks)) {
      $.each(blocks, function (index0, dataNow0) {
        if (hasVar(focusBlock)) return
        $.each(dataNow0, function (index1, dataNow1) {
          if (optIn.focusId === dataNow1.obId) focusBlock = dataNow1
        })
      })
    }

    return hasVar(focusBlock) ? focusBlock : {}
  }

  // // ---------------------------------------------------------------------------------------------------
  // //
  // // ---------------------------------------------------------------------------------------------------
  // function syncStateGet(dataIn) {
  //   // console.log(' - _schedBlocks_ - syncStateGet ',dataIn);
  //   return;
  // }
  // this.syncStateGet = syncStateGet;

  let svgMain = new SvgMain()
}

// // ---------------------------------------------------------------------------------------------------
// //
// // ---------------------------------------------------------------------------------------------------
// let _utils = function() {

//   // ---------------------------------------------------------------------------------------------------
//   //
//   // ---------------------------------------------------------------------------------------------------
//   function getFocusBlock(optIn) {
//     let focusBlock = null;
//     let blocks = optIn.blocks;

//     if(hasVar(blocks)) {
//       $.each(blocks, function(index0,dataNow0) {
//         if(hasVar(focusBlock)) return;
//         $.each(dataNow0, function(index1,dataNow1) {
//           if(optIn.focusId == dataNow1.obId) focusBlock = dataNow1;
//         });
//       });
//     }

//     return hasVar(focusBlock) ? focusBlock : {};
//   }
//   this.getFocusBlock = getFocusBlock;

//   return;
// }
