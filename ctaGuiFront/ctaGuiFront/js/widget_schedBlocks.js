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
/* global BlockDisplayer */
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
/* global ScrollBox */
/* global colsBlk */
/* global telHealthCol */

window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollGrid.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockDisplayer.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueOld.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueCreator.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollBox.js' })
// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 10.66
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

  function sortBlocksByState (array) {
    if (!array) return
    let blocks = {}
    blocks.success = []
    blocks.fail = []
    blocks.cancel = []
    blocks.wait = []

    for (var i = 0; i < array.length; i++) {
      let b = array[i]
      if (b.exeState.state === 'done') blocks.success.push(b)
      else if (b.exeState.state === 'fail') blocks.fail.push(b)
      else if (b.exeState.state === 'cancel') blocks.cancel.push(b)
      else if (b.exeState.state === 'wait') blocks.wait.push(b)
    }
    return blocks
  }
  function getTelHealthById (id) {
    let index = Number(id.split('_')[1])
    return shared.data.server.telHealth[index]
  }
  function groupBlocksBySchedule (blocks) {
    let res = {}
    for (var key in blocks) {
      for (var i = 0; i < blocks[key].length; i++) {
        let ns = blocks[key][i].metaData.nSched
        if (ns in res) res[ns].push(blocks[key][i])
        else res[ns] = [blocks[key][i]]
      }
    }
    let ret = []
    Object.keys(res).map(function (key, index) {
      ret.push({schedName: key, scheduleId: res[key][0].sbId, blocks: res[key]})
    })
    return ret
  }
  function setCol (optIn) {
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
        x: lenD.w[0] * 0.035,
        y: lenD.h[0] * 0.03,
        w: lenD.w[0] * 0.38,
        h: lenD.h[0] * 0.56,
        marg: lenD.w[0] * 0.01
      }
      box.blockQueueServerFutur = {
        x: lenD.w[0] * 0.575,
        y: lenD.h[0] * 0.03,
        w: lenD.w[0] * 0.38,
        h: lenD.h[0] * 0.56,
        marg: lenD.w[0] * 0.01
      }
      box.stateScheduleMatrix = {
        x: lenD.w[0] * 0.015,
        y: lenD.h[0] * 0.57,
        w: lenD.w[0] * 0.36,
        h: lenD.h[0] * 0.34,
        marg: lenD.w[0] * 0.01
      }
      box.waitScheduleMatrix = {
        x: lenD.w[0] * 0.616,
        y: lenD.h[0] * 0.55,
        w: lenD.w[0] * 0.36,
        h: lenD.h[0] * 0.113,
        marg: lenD.w[0] * 0.01
      }
      box.freeTels = {
        x: lenD.w[0] * 0.616,
        y: lenD.h[0] * 0.7,
        w: lenD.w[0] * 0.36,
        h: lenD.h[0] * 0.28,
        marg: lenD.w[0] * 0.01
      }
      box.currentBlocks = {
        x: lenD.w[0] * 0.405,
        y: lenD.h[0] * 0.035,
        w: lenD.w[0] * 0.18,
        h: lenD.h[0] * 0.45,
        marg: lenD.w[0] * 0.01
      }

      // box.execution = {
      //   x: lenD.w[0] * 0.65,
      //   y: lenD.h[0] * 0.15,
      //   w: lenD.w[0] * 0.35,
      //   h: lenD.h[0] * 0.85,
      //   marg: lenD.w[0] * 0.01
      // }
      // box.details = {
      //   x: lenD.w[0] * 0,
      //   y: lenD.h[0] * 0.01,
      //   w: lenD.w[0] * 0,
      //   h: lenD.h[0] * 0.05
      // }
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
    // sortBlocksByState()

    svgRunningPhase.initData()
    svgBlocksQueueServerPast.initData()
    svgBlocksQueueServerFutur.initData()
    // svgStateScheduleMatrix.initData()
    // svgWaitScheduleMatrix.initData()
    // svgFreeTels.initData()
    // svgSuccessQueue.initData()
    // svgFailQueue.initData()
    // svgCancelQueue.initData()

    // svgMain.initData(dataIn.data)
  }
  this.initData = initData

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateData (dataIn) {
    shared.data.server = dataIn.data
    // sortBlocksByState()

    svgBlocksQueueServerPast.updateData()
    svgBlocksQueueServerFutur.updateData()
    svgRunningPhase.updateData()
    // svgStateScheduleMatrix.updateData()
    // svgWaitScheduleMatrix.updateData()
    // svgFreeTels.updateData()
    // svgCancelQueue.updateData()
    // svgSuccessQueue.updateData()
    // svgFailQueue.updateData()

    // svgMain.updateData(dataIn.data)
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
          // id:   ["run_config_mount","run_config_camera","run_config_camera","run_config_mirror"],
          // title:["Mount","Camera","DAQ","Mirror"]
          id: ['run_config_mount', 'run_config_camera', 'run_config_camera'],
          title: ['Mount', 'Camera', 'DAQ']
        },
        run_takeData: {
          id: ['run_takeData'],
          title: ['']
        },
        run_finish: {
          id: ['run_finish_mount', 'run_finish_camera', 'run_finish_camera'],
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
          return d.type === 0 ? 'normal' : 'normal'
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
    let reserved = {}
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServerPast.x + box.blockQueueServerPast.w * 0.03,
        y: box.blockQueueServerPast.y + box.blockQueueServerPast.h * 0.05,
        w: box.blockQueueServerPast.w * 0.94,
        h: box.blockQueueServerPast.h * 0.8,
        marg: lenD.w[0] * 0.01
      }

      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
      reserved.g.append('text')
        .text('Server schedule')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', 'normal')
        .style('font-size', '12px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(-5,' + (box.blockQueueServerPast.h * 0.4) + ') rotate(270)')

      blockQueueServerPast = new BlockDisplayer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: reserved.g,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'blockQueue2',
        blockQueue: {
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
              box: {x: 0, y: adjustedBox.h * 0.6, w: adjustedBox.w, h: adjustedBox.h * 0.6, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.0, w: adjustedBox.w, h: adjustedBox.h * 0.33, marg: adjustedBox.marg},
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
          timeBars: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockQueue2: {
          g: undefined,
          schedBlocks: {
            label: false
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
          timeBars: {
            enabled: false,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockList: {

        },
        blockForm: {
          mosaic: {
            box: {x: 0, y: 0, w: adjustedBox.w * 0.2, h: adjustedBox.h, marg: adjustedBox.marg},
            order: 'nSched'
          },
          forms: {
            g: undefined,
            box: {x: adjustedBox.w * 0.22,
              y: adjustedBox.h * 0.02,
              w: adjustedBox.w * 0.78 - adjustedBox.h * 0.02,
              h: adjustedBox.h * 0.96,
              marg: adjustedBox.marg},
            display: 'list',
            scroll: {}
          }
        },

        filters: {
          blockFilters: [],
          filtering: []
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
        events: {
          block: {
            click: (d) => { console.log(d) },
            mouseover: (d) => { console.log(d) },
            mouseout: (d) => { console.log(d) },
            drag: {
              start: () => {},
              tick: () => {},
              end: () => {}
            }
          },
          sched: {
            click: (d) => { console.log(d) },
            mouseover: (d) => { console.log(d) },
            mouseout: (d) => { console.log(d) }
          }
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })
      blockQueueServerPast.init()

      // blockQueueServerPast = new BlockQueueCreator({
      //   main: {
      //     tag: 'blockQueueMiddleTag',
      //     g: reserved.g,
      //     box: adjustedBox,
      //     background: {
      //       fill: colorTheme.dark.background,
      //       stroke: colorTheme.dark.stroke,
      //       strokeWidth: 0.1
      //     },
      //     colorTheme: colorTheme
      //   },
      //   axis: {
      //     enabled: true,
      //     g: undefined,
      //     box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
      //     axis: undefined,
      //     scale: undefined,
      //     domain: [0, 1000],
      //     range: [0, 0],
      //     showText: true,
      //     orientation: 'axisTop',
      //     attr: {
      //       text: {
      //         stroke: colorTheme.medium.stroke,
      //         fill: colorTheme.medium.stroke
      //       },
      //       path: {
      //         stroke: colorTheme.medium.stroke,
      //         fill: colorTheme.medium.stroke
      //       }
      //     }
      //   },
      //   blocks: {
      //     enabled: true,
      //     run: {
      //       enabled: true,
      //       g: undefined,
      //       box: {x: 0, y: adjustedBox.h * 0.46875, w: adjustedBox.w, h: adjustedBox.h * 0.53125, marg: adjustedBox.marg},
      //       events: {
      //         click: () => {},
      //         mouseover: () => {},
      //         mouseout: () => {},
      //         drag: {
      //           start: () => {},
      //           tick: () => {},
      //           end: () => {}
      //         }
      //       },
      //       background: {
      //         fill: colorTheme.brighter.background,
      //         stroke: 'none',
      //         strokeWidth: 0
      //       }
      //     },
      //     cancel: {
      //       enabled: true,
      //       g: undefined,
      //       box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h * 0.3125, marg: adjustedBox.marg},
      //       events: {
      //         click: () => {},
      //         mouseover: () => {},
      //         mouseout: () => {},
      //         drag: {
      //           start: () => {},
      //           tick: () => {},
      //           end: () => {}
      //         }
      //       },
      //       background: {
      //         fill: colorTheme.brighter.background,
      //         stroke: colorTheme.brighter.stroke,
      //         strokeWidth: 0
      //       }
      //     },
      //     modification: {
      //       enabled: true,
      //       g: undefined,
      //       box: {x: 0, y: adjustedBox.h * 0.5, w: adjustedBox.w, h: adjustedBox.h * 0.47, marg: adjustedBox.marg},
      //       events: {
      //         click: () => {},
      //         mouseover: () => {},
      //         mouseout: () => {},
      //         drag: {
      //           start: () => {},
      //           tick: () => {},
      //           end: () => {}
      //         }
      //       },
      //       background: {
      //         fill: colorTheme.brighter.background,
      //         stroke: colorTheme.brighter.stroke,
      //         strokeWidth: 0
      //       }
      //     },
      //     colorPalette: colorTheme.blocks
      //   },
      //   filters: {
      //     enabled: false,
      //     g: undefined,
      //     box: {x: 0, y: adjustedBox.h * 0.15, w: adjustedBox * 0.12, h: adjustedBox.h * 0.7, marg: 0},
      //     filters: []
      //   },
      //   timeBars: {
      //     enabled: false,
      //     g: undefined,
      //     box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
      //   },
      //   time: {
      //     currentTime: {time: 0, date: undefined},
      //     startTime: {time: 0, date: undefined},
      //     endTime: {time: 0, date: undefined}
      //   },
      //   data: {
      //     raw: undefined,
      //     formated: undefined,
      //     modified: undefined
      //   },
      //   debug: {
      //     enabled: false
      //   },
      //   pattern: {},
      //   event: {
      //     modifications: () => {}
      //   },
      //   input: {
      //     focus: {schedBlocks: undefined, block: undefined},
      //     over: {schedBlocks: undefined, block: undefined},
      //     selection: []
      //   }
      // })
      //
      // blockQueueServerPast.init()

      let minTxtSize = adjustedBox.w * 0.02
      reserved.g.append('rect')
        .attr('x', -minTxtSize * 2)
        .attr('y', adjustedBox.h + 4) // + minTxtSize * 1.5)
        .attr('width', minTxtSize * 4)
        .attr('height', minTxtSize * 2)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
      reserved.g.append('text')
        .attr('x', 0)
        .attr('y', adjustedBox.h + 4 + minTxtSize)
        .attr('dy', minTxtSize * 0.43)
        .attr('class', 'dateTextLeft')
        .attr('stroke', colorTheme.medium.stroke)
        .attr('stroke-width', 0.3)
        .attr('fill', colorTheme.medium.stroke)
        .style('font-size', (minTxtSize * 1.3) + 'px')
        .attr('text-anchor', 'middle')

      reserved.g.append('rect')
        .attr('x', adjustedBox.w - minTxtSize * 2)
        .attr('y', adjustedBox.h + 4) // + minTxtSize * 1.5)
        .attr('width', minTxtSize * 4)
        .attr('height', minTxtSize * 2)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
      reserved.g.append('text')
        .attr('x', adjustedBox.w)
        .attr('y', adjustedBox.h + 4 + minTxtSize)
        .attr('dy', minTxtSize * 0.43)
        .attr('class', 'dateTextRight')
        .attr('stroke', colorTheme.medium.stroke)
        .attr('stroke-width', 0.3)
        .attr('fill', colorTheme.medium.stroke)
        .style('font-size', (minTxtSize * 1.3) + 'px')
        .attr('text-anchor', 'middle')

      updateData()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      let startTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds() - (3600 * 8)), time: Number(shared.data.server.timeOfNight.now) - (3600 * 8)}
      let endTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds()), time: Number(shared.data.server.timeOfNight.now)}

      reserved.g.select('text.dateTextLeft').text(d3.timeFormat('%H:%M')(startTime.date))
      reserved.g.select('text.dateTextRight').text(d3.timeFormat('%H:%M')(endTime.date))

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
    let reserved = {}
    function initData () {
      let adjustedBox = {
        x: box.blockQueueServerFutur.x + box.blockQueueServerFutur.w * 0.03,
        y: box.blockQueueServerFutur.y + box.blockQueueServerFutur.h * 0.05,
        w: box.blockQueueServerFutur.w * 0.94,
        h: box.blockQueueServerFutur.h * 0.8,
        marg: lenD.w[0] * 0.01
      }

      reserved.g = svg.g.append('g')
        .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')

      blockQueueServerFutur = new BlockDisplayer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: reserved.g,
          scroll: {},
          box: adjustedBox,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'blockQueue2',
        blockQueue: {
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
              box: {x: 0, y: adjustedBox.h * 0.66875, w: adjustedBox.w, h: adjustedBox.h * 0.33125, marg: adjustedBox.marg},
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
              box: {x: 0, y: adjustedBox.h * 0.15, w: adjustedBox.w, h: adjustedBox.h * 0.1525, marg: adjustedBox.marg},
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
          timeBars: {
            enabled: true,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockQueue2: {
          g: undefined,
          schedBlocks: {
            label: false
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
          timeBars: {
            enabled: false,
            g: undefined,
            box: {x: 0, y: adjustedBox.h * 0.025, w: adjustedBox.w, h: adjustedBox.h * 0.975, marg: adjustedBox.marg}
          }
        },
        blockList: {

        },
        blockForm: {
          mosaic: {
            box: {x: 0, y: 0, w: adjustedBox.w * 0.2, h: adjustedBox.h, marg: adjustedBox.marg},
            order: 'nSched'
          },
          forms: {
            g: undefined,
            box: {x: adjustedBox.w * 0.22,
              y: adjustedBox.h * 0.02,
              w: adjustedBox.w * 0.78 - adjustedBox.h * 0.02,
              h: adjustedBox.h * 0.96,
              marg: adjustedBox.marg},
            display: 'list',
            scroll: {}
          }
        },

        filters: {
          blockFilters: [],
          filtering: []
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
        events: {
          block: {
            click: (d) => { console.log(d) },
            mouseover: (d) => { console.log(d) },
            mouseout: (d) => { console.log(d) },
            drag: {
              start: () => {},
              tick: () => {},
              end: () => {}
            }
          },
          sched: {
            click: (d) => { console.log(d) },
            mouseover: (d) => { console.log(d) },
            mouseout: (d) => { console.log(d) }
          }
        },
        input: {
          focus: {schedBlocks: undefined, block: undefined},
          over: {schedBlocks: undefined, block: undefined},
          selection: []
        }
      })
      blockQueueServerFutur.init()
      // blockQueueServerFutur = new BlockQueueCreator({
      //   main: {
      //     tag: 'blockQueueServerFuturTag',
      //     g: reserved.g,
      //     box: adjustedBox,
      //     background: {
      //       fill: colorTheme.dark.background,
      //       stroke: colorTheme.dark.stroke,
      //       strokeWidth: 0.1
      //     },
      //     colorTheme: colorTheme
      //   },
      //   axis: {
      //     enabled: true,
      //     g: undefined,
      //     box: {x: 0, y: adjustedBox.h, w: adjustedBox.w, h: 0, marg: adjustedBox.marg},
      //     axis: undefined,
      //     scale: undefined,
      //     domain: [0, 1000],
      //     range: [0, 0],
      //     showText: true,
      //     orientation: 'axisTop',
      //     attr: {
      //       text: {
      //         stroke: colorTheme.medium.stroke,
      //         fill: colorTheme.medium.stroke
      //       },
      //       path: {
      //         stroke: colorTheme.medium.stroke,
      //         fill: colorTheme.medium.stroke
      //       }
      //     }
      //   },
      //   blocks: {
      //     enabled: true,
      //     run: {
      //       enabled: true,
      //       g: undefined,
      //       box: {x: 0, y: adjustedBox.h * 0.46875, w: adjustedBox.w, h: adjustedBox.h * 0.53125, marg: adjustedBox.marg},
      //       events: {
      //         click: () => {},
      //         mouseover: () => {},
      //         mouseout: () => {},
      //         drag: {
      //           start: () => {},
      //           tick: () => {},
      //           end: () => {}
      //         }
      //       },
      //       background: {
      //         fill: colorTheme.brighter.background,
      //         stroke: 'none',
      //         strokeWidth: 0
      //       }
      //     },
      //     cancel: {
      //       enabled: true,
      //       g: undefined,
      //       box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h * 0.3125, marg: adjustedBox.marg},
      //       events: {
      //         click: () => {},
      //         mouseover: () => {},
      //         mouseout: () => {},
      //         drag: {
      //           start: () => {},
      //           tick: () => {},
      //           end: () => {}
      //         }
      //       },
      //       background: {
      //         fill: colorTheme.brighter.background,
      //         stroke: colorTheme.brighter.stroke,
      //         strokeWidth: 0
      //       }
      //     },
      //     modification: {
      //       enabled: true,
      //       g: undefined,
      //       box: {x: 0, y: adjustedBox.h * 0.5, w: adjustedBox.w, h: adjustedBox.h * 0.47, marg: adjustedBox.marg},
      //       events: {
      //         click: () => {},
      //         mouseover: () => {},
      //         mouseout: () => {},
      //         drag: {
      //           start: () => {},
      //           tick: () => {},
      //           end: () => {}
      //         }
      //       },
      //       background: {
      //         fill: colorTheme.brighter.background,
      //         stroke: colorTheme.brighter.stroke,
      //         strokeWidth: 0
      //       }
      //     },
      //     colorPalette: colorTheme.blocks
      //   },
      //   filters: {
      //     enabled: false,
      //     g: undefined,
      //     box: {x: 0, y: adjustedBox.h * 0.15, w: adjustedBox * 0.12, h: adjustedBox.h * 0.7, marg: 0},
      //     filters: []
      //   },
      //   timeBars: {
      //     enabled: false,
      //     g: undefined,
      //     box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
      //   },
      //   time: {
      //     currentTime: {time: 0, date: undefined},
      //     startTime: {time: 0, date: undefined},
      //     endTime: {time: 0, date: undefined}
      //   },
      //   data: {
      //     raw: undefined,
      //     formated: undefined,
      //     modified: undefined
      //   },
      //   debug: {
      //     enabled: false
      //   },
      //   pattern: {},
      //   event: {
      //     modifications: () => {}
      //   },
      //   input: {
      //     focus: {schedBlocks: undefined, block: undefined},
      //     over: {schedBlocks: undefined, block: undefined},
      //     selection: []
      //   }
      // })
      // blockQueueServerFutur.init()

      let minTxtSize = adjustedBox.w * 0.02
      reserved.g.append('rect')
        .attr('x', -minTxtSize * 2)
        .attr('y', adjustedBox.h + 4) // + minTxtSize * 1.5)
        .attr('width', minTxtSize * 4)
        .attr('height', minTxtSize * 2)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
      reserved.g.append('text')
        .attr('x', 0)
        .attr('y', adjustedBox.h + 4 + minTxtSize)
        .attr('dy', minTxtSize * 0.43)
        .attr('class', 'dateTextLeft')
        .attr('stroke', colorTheme.medium.stroke)
        .attr('stroke-width', 0.3)
        .attr('fill', colorTheme.medium.stroke)
        .style('font-size', (minTxtSize * 1.3) + 'px')
        .attr('text-anchor', 'middle')

      reserved.g.append('rect')
        .attr('x', adjustedBox.w - minTxtSize * 2)
        .attr('y', adjustedBox.h + 4) // + minTxtSize * 1.5)
        .attr('width', minTxtSize * 4)
        .attr('height', minTxtSize * 2)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
      reserved.g.append('text')
        .attr('x', adjustedBox.w)
        .attr('y', adjustedBox.h + 4 + minTxtSize)
        .attr('dy', minTxtSize * 0.43)
        .attr('class', 'dateTextRight')
        .attr('stroke', colorTheme.medium.stroke)
        .attr('stroke-width', 0.3)
        .attr('fill', colorTheme.medium.stroke)
        .style('font-size', (minTxtSize * 1.3) + 'px')
        .attr('text-anchor', 'middle')
      updateData()
    }
    this.initData = initData

    function updateData () {
      let date = new Date(shared.data.server.timeOfNight.date_now)
      let currentTime = {date: date, time: Number(shared.data.server.timeOfNight.now)}
      let startTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds()), time: Number(shared.data.server.timeOfNight.now)}
      let endTime = {date: new Date(shared.data.server.timeOfNight.date_now).setSeconds(date.getSeconds() + (3600 * 8)), time: Number(shared.data.server.timeOfNight.now) + (3600 * 8)}

      reserved.g.select('text.dateTextLeft').text(d3.timeFormat('%H:%M')(startTime.date))
      reserved.g.select('text.dateTextRight').text(d3.timeFormat('%H:%M')(endTime.date))

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
  let SvgStateScheduleMatrix = function () {
    let reserved = {}
    function initData () {
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.stateScheduleMatrix.x + ',' + box.stateScheduleMatrix.y + ')')
      reserved.gBlockBox.append('rect')
        .attr('x', 0 + box.stateScheduleMatrix.marg)
        .attr('y', 0 + box.stateScheduleMatrix.h * 0.1)
        .attr('width', box.stateScheduleMatrix.w * 1 - box.stateScheduleMatrix.marg)
        .attr('height', box.stateScheduleMatrix.h * 0.9 * 0.33)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      reserved.gBlockBox.append('text')
        .text('Success')
        .style('fill', colorTheme.dark.text)
        .style('font-weight', 'normal')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(4,' + (box.stateScheduleMatrix.h * 0.1 + box.stateScheduleMatrix.h * 0.9 * 0.166) + ') rotate(270)')
      reserved.gBlockBox.append('rect')
        .attr('x', 0 + box.stateScheduleMatrix.marg)
        .attr('y', 0 + box.stateScheduleMatrix.h * 0.1 + (box.stateScheduleMatrix.h * 0.9 * 0.33))
        .attr('width', box.stateScheduleMatrix.w * 1 - box.stateScheduleMatrix.marg)
        .attr('height', box.stateScheduleMatrix.h * 0.9 * 0.33)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      reserved.gBlockBox.append('text')
        .text('Fail')
        .style('fill', colorTheme.dark.text)
        .style('font-weight', 'normal')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(4,' + (box.stateScheduleMatrix.h * 0.1 + box.stateScheduleMatrix.h * 0.9 * 0.5) + ') rotate(270)')
      reserved.gBlockBox.append('rect')
        .attr('x', 0 + box.stateScheduleMatrix.marg)
        .attr('y', 0 + box.stateScheduleMatrix.h * 0.1 + (box.stateScheduleMatrix.h * 0.9 * 0.33) * 2)
        .attr('width', box.stateScheduleMatrix.w * 1 - box.stateScheduleMatrix.marg)
        .attr('height', box.stateScheduleMatrix.h * 0.9 * 0.33)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      reserved.gBlockBox.append('text')
        .text('Cancel')
        .style('fill', colorTheme.dark.text)
        .style('font-weight', 'normal')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(4,' + (box.stateScheduleMatrix.h * 0.1 + box.stateScheduleMatrix.h * 0.9 * 0.84) + ') rotate(270)')

      reserved.scrollBoxG = reserved.gBlockBox.append('g')
      // reserved.scrollBoxG.attr('transform', 'scale(-1,1)')
      reserved.scrollBox = new ScrollBox()
      reserved.scrollBox.init({
        tag: 'successScrollBox',
        gBox: reserved.scrollBoxG,
        boxData: {
          x: 0 + box.stateScheduleMatrix.marg, // - box.stateScheduleMatrix.w - box.stateScheduleMatrix.marg,
          y: 0,
          w: box.stateScheduleMatrix.w - box.stateScheduleMatrix.marg,
          h: box.stateScheduleMatrix.h,
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
        scrollHeight: box.stateScheduleMatrix.h - box.stateScheduleMatrix.marg,
        scrollWidth: box.stateScheduleMatrix.w - box.stateScheduleMatrix.marg,
        background: 'transparent',
        scrollRecH: {h: 6},
        scrollRecV: {w: 6}
      })
      reserved.scrollG = reserved.scrollBox.get('innerG')

      updateData()

      let scheds = groupBlocksBySchedule(shared.data.server.blocks)
      let dimCell = {
        w: box.stateScheduleMatrix.h * 0.9 * 0.3333, // (box.stateScheduleMatrix.w - box.stateScheduleMatrix.marg) / scheds.length,
        h: box.stateScheduleMatrix.h * 0.9 * 0.3333
      }
      reserved.scrollBox.resetHorizontalScroller({canScroll: true, scrollWidth: scheds.length * dimCell.w})
      for (let i = scheds.length - 1; i > -1; i--) {
        let b = sortBlocksByState(scheds[i].blocks)
        if (b.success.length === 0 && b.fail.length === 0 && b.cancel.length === 0) scheds.splice(i, 1)
      }
      reserved.scrollBox.updateHorizontalScroller({canScroll: true, scrollWidth: scheds.length * dimCell.w})
    }
    this.initData = initData

    function updateData () {
      let scheds = groupBlocksBySchedule(shared.data.server.blocks)// .reverse()
      for (let i = scheds.length - 1; i > -1; i--) {
        let b = sortBlocksByState(scheds[i].blocks)
        if (b.success.length === 0 && b.fail.length === 0 && b.cancel.length === 0) scheds.splice(i, 1)
      }

      let blocksTemplate = {
        '1': [{x: 0.5, y: 0.5}],
        '2': [{x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}],
        '3': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.7}],
        '4': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
        '5': [{x: 0.3, y: 0.16}, {x: 0.7, y: 0.16}, {x: 0.5, y: 0.5}, {x: 0.3, y: 0.84}, {x: 0.7, y: 0.84}],
        '6': [],
        '7': [],
        '8': [],
        '9': []
      }
      let dimCell = {
        w: box.stateScheduleMatrix.h * 0.9 * 0.3333, // (box.stateScheduleMatrix.w - box.stateScheduleMatrix.marg) / scheds.length,
        h: box.stateScheduleMatrix.h * 0.9 * 0.3333
      }
      let dimBlock = {
        w: dimCell.w * 0.31,
        h: dimCell.h * 0.31
      }
      let allScheds = reserved.scrollG
        .selectAll('g.allScheds')
        .data(scheds, function (d) {
          return d.scheduleId
        })
      let enterAllScheds = allScheds
        .enter()
        .append('g')
        .attr('class', 'allScheds')
        .attr('transform', function (d, i) {
          let translate = {
            y: 0,
            x: dimCell.w * (i) // + 1)
          }
          return 'translate(' + translate.x + ',' + translate.y + ')' // , scale(-1,1)'
        })
      enterAllScheds.each(function (d, i) {
        d3.select(this).append('rect')
          .attr('class', 'background')
          .attr('x', 0)
          .attr('y', box.stateScheduleMatrix.h * 0.1)
          .attr('width', dimCell.w)
          .attr('height', box.stateScheduleMatrix.h * 0.9)
          .attr('fill', 'transparent')
          .attr('fill-opacity', 0.5)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)
          .attr('stroke-dasharray', [4, 4])
        d3.select(this).append('text')
          .attr('class', 'schedId')
          .text(function (d) {
            return 'Sched:' + d.schedName
          })
          .attr('x', dimCell.w * 0.5)
          .attr('y', box.stateScheduleMatrix.h * 0.0)
          .style('font-weight', 'normal')
          .attr('text-anchor', 'middle')
          .style('font-size', '6.5px')
          .attr('dy', 5 + ((i + 1) % 2) * 4)
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.darker.text)
          .attr('stroke', 'none')
        d3.select(this).append('g')
          .attr('class', 'successBlocks')
          .attr('transform', function (d, i) {
            let translate = {
              y: box.stateScheduleMatrix.h * 0.1,
              x: 0
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
        d3.select(this).append('g')
          .attr('class', 'failBlocks')
          .attr('transform', function (d, i) {
            let translate = {
              y: box.stateScheduleMatrix.h * 0.1 + dimCell.h,
              x: 0
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
        d3.select(this).append('g')
          .attr('class', 'cancelBlocks')
          .attr('transform', function (d, i) {
            let translate = {
              y: box.stateScheduleMatrix.h * 0.1 + dimCell.h * 2,
              x: 0
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
      })

      let mergeAllScheds = enterAllScheds.merge(allScheds)
      mergeAllScheds.attr('transform', function (d, i) {
        let translate = {
          y: 0,
          x: dimCell.w * i
        }
        return 'translate(' + translate.x + ',' + translate.y + ')'
      })
      mergeAllScheds.each(function (d) {
        let blocks = sortBlocksByState(d.blocks)

        if (blocks.wait.length === 0) {
          d3.select(this).select('rect.background').attr('fill', colorTheme.darker.background)
        }

        let successBlocks = d3.select(this).select('g.successBlocks')
          .selectAll('g.successBlock')
          .data(blocks.success, function (d) {
            return d.obId
          })
        let enterSuccessBlocks = successBlocks
          .enter()
          .append('g')
          .attr('class', 'successBlock')
          .attr('transform', function (d, i) {
            let translate = {
              y: dimCell.h * 0.5,
              x: dimCell.w * 0.5
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
        enterSuccessBlocks.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', dimBlock.w)
          .attr('height', dimBlock.h)
          .attr('fill', function (d) { return setCol(d).background })
          .attr('stroke', function (d) { return setCol(d).stroke })
          .attr('stroke-width', 0.2)
        enterSuccessBlocks.append('text')
          .text(function (d) {
            return d.metaData.blockName
          })
          .attr('x', dimBlock.w * 0.5)
          .attr('y', dimBlock.h * 0.5)
          .attr('text-anchor', 'middle')
          .style('font-weight', 'normal')
          .style('font-size', '4.5px')
          .style('pointer-events', 'none')
          .attr('fill', function (d) { return setCol(d).text })
          .attr('stroke', 'none')
          .attr('dy', 2)
        let mergeSuccessBlocks = enterSuccessBlocks.merge(successBlocks)
        mergeSuccessBlocks
          .transition()
          .duration(800)
          .attr('transform', function (d, i) {
            let temp = blocksTemplate['' + blocks.success.length][i]
            let translate = {
              y: (dimCell.h * temp.y) - (dimBlock.h * 0.5),
              x: (dimCell.w * temp.x) - (dimBlock.w * 0.5)
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })

        let failBlocks = d3.select(this).select('g.failBlocks')
          .selectAll('g.failBlock')
          .data(blocks.fail, function (d) {
            return d.obId
          })
        let enterFailBlocks = failBlocks
          .enter()
          .append('g')
          .attr('class', 'failBlock')
          .attr('transform', function (d, i) {
            let translate = {
              y: dimCell.h * 0.5,
              x: dimCell.w * 0.5
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
        enterFailBlocks.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', dimBlock.w)
          .attr('height', dimBlock.h)
          .attr('fill', function (d) { return setCol(d).background })
          .attr('stroke', function (d) { return setCol(d).stroke })
          .attr('stroke-width', 0.2)
        enterFailBlocks.append('text')
          .text(function (d) {
            return d.metaData.blockName
          })
          .attr('x', dimBlock.w * 0.5)
          .attr('y', dimBlock.h * 0.5)
          .attr('text-anchor', 'middle')
          .style('font-weight', 'normal')
          .style('font-size', '4.5px')
          .style('pointer-events', 'none')
          .attr('fill', function (d) { return setCol(d).text })
          .attr('stroke', 'none')
          .attr('dy', 2)
        let mergeFailBlocks = enterFailBlocks.merge(failBlocks)
        mergeFailBlocks
          .transition()
          .duration(800)
          .attr('transform', function (d, i) {
            let temp = blocksTemplate['' + blocks.fail.length][i]
            let translate = {
              y: (dimCell.h * temp.y) - (dimBlock.h * 0.5),
              x: (dimCell.w * temp.x) - (dimBlock.w * 0.5)
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })

        let cancelBlocks = d3.select(this).select('g.cancelBlocks')
          .selectAll('g.cancelBlock')
          .data(blocks.cancel, function (d) {
            return d.obId
          })
        let enterCancelBlocks = cancelBlocks
          .enter()
          .append('g')
          .attr('class', 'cancelBlock')
          .attr('transform', function (d, i) {
            let translate = {
              y: dimCell.h * 0.5,
              x: dimCell.w * 0.5
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
        enterCancelBlocks.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', dimBlock.w)
          .attr('height', dimBlock.h)
          .attr('fill', function (d) { return setCol(d).background })
          .attr('stroke', function (d) { return setCol(d).stroke })
          .attr('stroke-width', 0.2)
        enterCancelBlocks.append('text')
          .text(function (d) {
            return d.metaData.blockName
          })
          .attr('x', dimBlock.w * 0.5)
          .attr('y', dimBlock.h * 0.5)
          .attr('text-anchor', 'middle')
          .style('font-weight', 'normal')
          .style('font-size', '4.5px')
          .style('pointer-events', 'none')
          .attr('fill', function (d) { return setCol(d).text })
          .attr('stroke', 'none')
          .attr('dy', 2)
        let mergeCancelBlocks = enterCancelBlocks.merge(cancelBlocks)
        mergeCancelBlocks
          .transition()
          .duration(800)
          .attr('transform', function (d, i) {
            let temp = blocksTemplate['' + blocks.cancel.length][i]
            let translate = {
              y: (dimCell.h * temp.y) - (dimBlock.h * 0.5),
              x: (dimCell.w * temp.x) - (dimBlock.w * 0.5)
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
      })

      reserved.scrollBox.updateHorizontalScroller({canScroll: true, scrollWidth: scheds.length * dimCell.w})
    }
    this.updateData = updateData
  }
  let SvgWaitScheduleMatrix = function () {
    let reserved = {}
    function initData () {
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.waitScheduleMatrix.x + ',' + box.waitScheduleMatrix.y + ')')
      reserved.gBlockBox.append('rect')
        .attr('x', 0 + box.waitScheduleMatrix.marg)
        .attr('y', 0 + box.waitScheduleMatrix.h * 0.3)
        .attr('width', box.waitScheduleMatrix.w * 1 - box.waitScheduleMatrix.marg)
        .attr('height', box.waitScheduleMatrix.h * 0.9)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
      reserved.gBlockBox.append('text')
        .text('Waiting')
        .style('fill', colorTheme.dark.text)
        .style('font-weight', 'normal')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(4,' + (box.waitScheduleMatrix.h * 0.1 + box.waitScheduleMatrix.h * 0.9 * 0.5 + box.waitScheduleMatrix.h * 0.2) + ') rotate(270)')

      reserved.scrollBoxG = reserved.gBlockBox.append('g')
      reserved.scrollBox = new ScrollBox()
      reserved.scrollBox.init({
        tag: 'waitScrollBox',
        gBox: reserved.scrollBoxG,
        boxData: {
          x: 0 + box.waitScheduleMatrix.marg,
          y: 0,
          w: box.waitScheduleMatrix.w - box.waitScheduleMatrix.marg,
          h: box.waitScheduleMatrix.h + box.waitScheduleMatrix.h * 0.2,
          marg: 0
        },
        useRelativeCoords: true,
        locker: new Locker(),
        lockerV: [widgetId + 'updateData'],
        lockerZoom: {
          all: 'ScrollBox' + 'zoom',
          during: 'ScrollBox' + 'zoomDuring',
          end: 'ScrollBox' + 'zoomEnd'
        },
        runLoop: new RunLoop({tag: 'successScrollBox'}),
        canScroll: true,
        scrollVertical: false,
        scrollHorizontal: true,
        scrollHeight: box.waitScheduleMatrix.h - box.waitScheduleMatrix.marg,
        scrollWidth: box.waitScheduleMatrix.w - box.waitScheduleMatrix.marg,
        background: 'transparent',
        scrollRecH: {h: 6},
        scrollRecV: {w: 6}
      })
      reserved.scrollG = reserved.scrollBox.get('innerG')

      updateData()

      let scheds = groupBlocksBySchedule(shared.data.server.blocks)
      let dimCell = {
        w: box.waitScheduleMatrix.h * 0.9, // (box.waitScheduleMatrix.w - box.waitScheduleMatrix.marg) / scheds.length,
        h: box.waitScheduleMatrix.h * 0.9
      }
      reserved.scrollBox.resetHorizontalScroller({canScroll: true, scrollWidth: scheds.length * dimCell.w})
    }
    this.initData = initData

    function updateData () {
      let scheds = groupBlocksBySchedule(shared.data.server.blocks)
      for (let i = scheds.length - 1; i > -1; i--) {
        let b = sortBlocksByState(scheds[i].blocks)
        if (b.wait.length === 0) scheds.splice(i, 1)
      }

      let blocksTemplate = {
        '1': [{x: 0.5, y: 0.5}],
        '2': [{x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}],
        '3': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.5, y: 0.7}],
        '4': [{x: 0.3, y: 0.3}, {x: 0.7, y: 0.3}, {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7}],
        '5': [{x: 0.3, y: 0.16}, {x: 0.7, y: 0.16}, {x: 0.5, y: 0.5}, {x: 0.3, y: 0.84}, {x: 0.7, y: 0.84}],
        '6': [],
        '7': [],
        '8': [],
        '9': []
      }
      let dimCell = {
        w: box.waitScheduleMatrix.h * 0.9, // (box.waitScheduleMatrix.w - box.waitScheduleMatrix.marg) / scheds.length,
        h: box.waitScheduleMatrix.h * 0.9
      }
      let dimBlock = {
        w: dimCell.w * 0.31,
        h: dimCell.h * 0.31
      }

      let allScheds = reserved.scrollG
        .selectAll('g.allScheds')
        .data(scheds, function (d) {
          return d.scheduleId
        })
      let enterAllScheds = allScheds
        .enter()
        .append('g')
        .attr('class', 'allScheds')
        .attr('transform', function (d, i) {
          let translate = {
            y: box.waitScheduleMatrix.h * 0.2,
            x: dimCell.w * i
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      enterAllScheds.each(function (d, i) {
        d3.select(this).append('rect')
          .attr('class', 'background')
          .attr('x', 0)
          .attr('y', box.waitScheduleMatrix.h * 0.1)
          .attr('width', dimCell.w)
          .attr('height', box.waitScheduleMatrix.h * 0.9)
          .attr('fill', 'transparent')
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)
          .attr('stroke-dasharray', [4, 4])
        d3.select(this).append('text')
          .attr('class', 'schedId')
          .text(function (d) {
            return 'Sched:' + d.schedName
          })
          .attr('x', dimCell.w * 0.5)
          .attr('y', box.waitScheduleMatrix.h * 0.0)
          .style('font-weight', 'normal')
          .attr('text-anchor', 'middle')
          .style('font-size', '6.5px')
          .attr('dy', -2 + ((i + 1) % 2) * 4)
          .style('pointer-events', 'none')
          .attr('fill', colorTheme.darker.text)
          .attr('stroke', 'none')
        d3.select(this).append('g')
          .attr('class', 'successBlocks')
          .attr('transform', function (d, i) {
            let translate = {
              y: box.waitScheduleMatrix.h * 0.1,
              x: 0
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
      })

      let mergeAllScheds = enterAllScheds.merge(allScheds)
      mergeAllScheds.attr('transform', function (d, i) {
        let translate = {
          y: box.waitScheduleMatrix.h * 0.2,
          x: dimCell.w * i
        }
        return 'translate(' + translate.x + ',' + translate.y + ')'
      })
      mergeAllScheds.each(function (d) {
        let blocks = sortBlocksByState(d.blocks)
        // if (blocks.wait.length === 0) {
        //   d3.select(this).select('rect.background').attr('fill', colorTheme.darker.background)
        //   return
        // }
        let successBlocks = d3.select(this).select('g.successBlocks')
          .selectAll('g.successBlock')
          .data(blocks.wait, function (d) {
            return d.obId
          })
        let enterSuccessBlocks = successBlocks
          .enter()
          .append('g')
          .attr('class', 'successBlock')
          .attr('transform', function (d, i) {
            let translate = {
              y: dimCell.h * 0.5,
              x: dimCell.w * 0.5
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
        enterSuccessBlocks.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', dimBlock.w)
          .attr('height', dimBlock.h)
          .attr('fill', function (d) { return setCol(d).background })
          .attr('stroke', function (d) { return setCol(d).stroke })
          .attr('stroke-width', 0.2)
        enterSuccessBlocks.append('text')
          .text(function (d) {
            return d.metaData.blockName
          })
          .attr('x', dimBlock.w * 0.5)
          .attr('y', dimBlock.h * 0.5)
          .attr('text-anchor', 'middle')
          .style('font-weight', 'normal')
          .style('font-size', '4.5px')
          .style('pointer-events', 'none')
          .attr('fill', function (d) { return setCol(d).text })
          .attr('stroke', 'none')
          .attr('dy', 2)
        let mergeSuccessBlocks = enterSuccessBlocks.merge(successBlocks)
        mergeSuccessBlocks
          .transition()
          .duration(800)
          .attr('transform', function (d, i) {
            let temp = blocksTemplate['' + blocks.wait.length][i]
            let translate = {
              y: (dimCell.h * temp.y) - (dimBlock.h * 0.5),
              x: (dimCell.w * temp.x) - (dimBlock.w * 0.5)
            }
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
        successBlocks.exit()
          .transition('inOut')
          .duration(timeD.animArc)
          .style('opacity', 0)
          .remove()
      })

      allScheds
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()

      reserved.scrollBox.updateHorizontalScroller({canScroll: true, scrollWidth: scheds.length * dimCell.w})
    }
    this.updateData = updateData
  }
  let SvgRunningPhase = function () {
    let reserved = {}

    function initData () {
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.currentBlocks.x + ',' + box.currentBlocks.y + ')')

      // reserved.gBlockBox.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', box.currentBlocks.w * 1)
      //   .attr('height', box.currentBlocks.h * 1)
      //   .attr('fill', colorTheme.dark.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)

      let minTxtSize = box.currentBlocks.w * 0.05
      reserved.gBlockBox.append('rect')
        .attr('x', box.currentBlocks.w * 0.4)
        .attr('y', box.currentBlocks.y - box.currentBlocks.h * 0.07 - minTxtSize * 0.75)
        .attr('width', box.currentBlocks.w * 0.2)
        .attr('height', minTxtSize * 1.5)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
        .attr('rx', 10)
      reserved.currentTime = reserved.gBlockBox.append('text')
        .attr('class', 'currentHour')
        .attr('stroke', colorTheme.stroke)
        .attr('fill', colorTheme.stroke)
        .attr('x', box.currentBlocks.w * 0.5)
        .attr('y', box.currentBlocks.y + box.currentBlocks.h * 0.025)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', minTxtSize)
        .attr('dy', 4)
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      // updateData()
    }
    this.initData = initData

    function updateData () {
      let currentTime = {date: new Date(shared.data.server.timeOfNight.date_now)}
      reserved.currentTime.text(d3.timeFormat('%H:%M')(currentTime.date))

      let b = box.currentBlocks

      let ratioHeight = 0.2
      let ratioWidth = 0.75
      let offsetRunningBlocks = 0.035

      let ratio = 1

      let queueRun = blockQueueServerFutur.getBlocksRows()

      queueRun = queueRun.filter(b => b.block.exeState.state === 'run')
      queueRun.sort(function (a, b) { return a.y > b.y })
      let totHeight = offsetRunningBlocks * (queueRun.length - 1) + queueRun.length * ratioHeight

      if (totHeight > 1) {
        ratio = 1 / totHeight
        totHeight = 1
      } else if (totHeight < 0.25) offsetRunningBlocks = 0.3
      else if (totHeight < 0.50) offsetRunningBlocks = 0.2
      else if (totHeight < 0.75) offsetRunningBlocks = 0.1

      ratioHeight = ratioHeight * ratio
      offsetRunningBlocks = offsetRunningBlocks * ratio

      let offsetY = (b.h * (1 - totHeight)) * 0.5

      let blockBox = {
        x: b.w * (1 - ratioWidth) * 0.5,
        y: b.h * offsetRunningBlocks,
        w: b.w * ratioWidth,
        h: b.h * ratioHeight
      }
      let headerBoxId = {
        x: blockBox.w * 0.0,
        y: blockBox.h * 0.0,
        w: blockBox.w * 1.0,
        h: blockBox.h * 1.0
      }
      let headerBoxRunningPhase = {
        x: blockBox.w * 0.0,
        y: blockBox.h * 0.0,
        w: blockBox.w * 1.0,
        h: blockBox.h * 1.0
      }

      let colorLock = colorTheme.blocks.run.background
      let colorFree = colorTheme.dark.background
      let transConfig = headerBoxRunningPhase.w * 0.25
      let transTake = headerBoxRunningPhase.w * 0.0
      let transFinish = -headerBoxRunningPhase.w * 0.25

      function initConfigDataFinish (g, headerBox) {
        // Back
        // g.append('rect')
        //   .attr('class', 'configBack')
        //   .attr('x', (headerBox.w * 0.4))
        //   .attr('y', headerBox.h * 0.0)
        //   .attr('width', headerBox.w * 0.23)
        //   .attr('height', headerBox.h * 0.98)
        //   .attr('fill', colorTheme.dark.background)
        //   .attr('stroke', colorTheme.dark.stroke)
        //   .attr('stroke-width', 0.45)
        // g.append('rect')
        //   .attr('class', 'dataBack')
        //   .attr('x', (headerBox.w * 0.63))
        //   .attr('y', headerBox.h * 0.0)
        //   .attr('width', headerBox.w * 0.15)
        //   .attr('height', headerBox.h * 0.98)
        //   .attr('fill', colorTheme.dark.background)
        //   .attr('stroke', colorTheme.dark.stroke)
        //   .attr('stroke-width', 0.45)
        // g.append('rect')
        //   .attr('class', 'finishBack')
        //   .attr('x', (headerBox.w * 0.78))
        //   .attr('y', headerBox.h * 0.0)
        //   .attr('width', headerBox.w * 0.22)
        //   .attr('height', headerBox.h * 0.98)
        //   .attr('fill', colorTheme.dark.background)
        //   .attr('stroke', colorTheme.dark.stroke)
        //   .attr('stroke-width', 0.45)
        let tdh = headerBoxRunningPhase.h * 0.45
        let tdw = headerBoxRunningPhase.h * 0.55
        let cfh = headerBoxRunningPhase.h * 0.45
        let cfw = headerBoxRunningPhase.h * 0.55

        // g.append('rect')
        //   .attr('class', 'dataLoading')
        //   .attr('x', headerBoxRunningPhase.x + headerBoxRunningPhase.w * 0.5 - tdw)
        //   .attr('y', headerBoxRunningPhase.y + headerBoxRunningPhase.h * 0.5 - tdh)
        //   .attr('width', tdw * 2)
        //   .attr('height', tdh * 2)
        //   .attr('fill', colorTheme.medium.background)
        //   .attr('stroke', colorTheme.medium.stroke)
        //   .attr('stroke-width', 8)
        // CONFIG
        // g.append('text')
        //   .text('CONFIG -------------->')
        //   .attr('x', (headerBox.w * 0.42) + 2)
        //   .attr('y', headerBox.h * 0.1)
        //   .attr('dy', 2)
        //   .style('fill', colorTheme.blocks.run.text)
        //   // .style('font-weight', 'normal')
        //   .style('font-size', '5.5px')
        //   .attr('text-anchor', 'start')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')

        g.append('rect')
          .attr('id', 'mount')
          .attr('x', headerBoxRunningPhase.x + headerBoxRunningPhase.w * 0.5 - tdw)
          .attr('y', headerBoxRunningPhase.y + headerBoxRunningPhase.h * 0.5 - tdh)
          .attr('width', cfw)
          .attr('height', cfh)
          .attr('fill', colorFree)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        // g.append('text')
        //   .text('Mo')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 0.5)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 0.5)
        //   .attr('dy', 3)
        //   .style('font-weight', 'normal')
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7px')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        g.append('rect')
          .attr('id', 'camera')
          .attr('x', headerBoxRunningPhase.x + headerBoxRunningPhase.w * 0.5 + tdw - cfw)
          .attr('y', headerBoxRunningPhase.y + headerBoxRunningPhase.h * 0.5 - tdh)
          .attr('width', cfw)
          .attr('height', cfh)
          .attr('fill', colorFree)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        // g.append('text')
        //   .text('C')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 1.5)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 0.5)
        //   .attr('dy', 3)
        //   .style('font-weight', 'normal')
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7px')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        g.append('rect')
          .attr('id', 'daq')
          .attr('x', headerBoxRunningPhase.x + headerBoxRunningPhase.w * 0.5 + tdw - cfw)
          .attr('y', headerBoxRunningPhase.y + headerBoxRunningPhase.h * 0.5 + tdh - cfh)
          .attr('width', cfw)
          .attr('height', cfh)
          .attr('fill', colorFree)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        // g.append('text')
        //   .text('Mi')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 2.5)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 0.5)
        //   .attr('dy', 3)
        //   .style('font-weight', 'normal')
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7px')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        g.append('rect')
          .attr('id', 'mirror')
          .attr('x', headerBoxRunningPhase.x + headerBoxRunningPhase.w * 0.5 - tdw)
          .attr('y', headerBoxRunningPhase.y + headerBoxRunningPhase.h * 0.5 + tdh - cfh)
          .attr('width', cfw)
          .attr('height', cfh)
          .attr('fill', colorFree)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        // g.append('text')
        //   .text('D')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 3.5)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 0.5)
        //   .attr('dy', 3)
        //   .style('font-weight', 'normal')
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7px')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')

        // Take Data

        // g.append('text')
        //   .text('Data')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 2))
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 2))
        //   .attr('dy', 2.2)
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7.5px')
        //   .style('font-weight', 'normal')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        // g.append('text')
        //   .text('a')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 3) * 1.45)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 6) * 2.5)
        //   .attr('dy', 1.8)
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7.5px')
        //   .style('font-weight', 'normal')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        // g.append('text')
        //   .text('t')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 3) * 1.55)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 6) * 3.5)
        //   .attr('dy', 3)
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7.5px')
        //   .style('font-weight', 'normal')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        // g.append('text')
        //   .text('a')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 3) * 1.65)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 6) * 4.5)
        //   .attr('dy', 4.2)
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7.5px')
        //   .style('font-weight', 'normal')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')

        // FINISH
        // g.append('text')
        //   .text('FINISH')
        //   .attr('x', (headerBox.w * 0.87) + 2)
        //   .attr('y', headerBox.h * 0.1)
        //   .attr('dy', 2)
        //   .style('fill', colorTheme.blocks.run.text)
        //   // .style('font-weight', 'normal')
        //   .style('font-size', '5.5px')
        //   .attr('text-anchor', 'start')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        // g.append('rect')
        //   .attr('class', 'finishMountLoading')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 0)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2)
        //   .attr('width', headerBoxRunningPhase.w / 4)
        //   .attr('height', headerBoxRunningPhase.h / 3)
        //   .attr('fill', colorTheme.darker.background)
        //   .attr('stroke', colorTheme.darker.stroke)
        //   .attr('stroke-width', 0.2)
        // g.append('text')
        //   .text('Mo')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 0.5)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2.5)
        //   .attr('dy', 3)
        //   .style('font-weight', 'normal')
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7px')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        // g.append('rect')
        //   .attr('class', 'finishCameraLoading')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 1)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2)
        //   .attr('width', headerBoxRunningPhase.w / 4)
        //   .attr('height', headerBoxRunningPhase.h / 3)
        //   .attr('fill', colorTheme.darker.background)
        //   .attr('stroke', colorTheme.darker.stroke)
        //   .attr('stroke-width', 0.2)
        // g.append('text')
        //   .text('C')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 1.5)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2.5)
        //   .attr('dy', 3)
        //   .style('font-weight', 'normal')
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7px')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        // g.append('rect')
        //   .attr('class', 'finishMirrorLoading')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 2)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2)
        //   .attr('width', headerBoxRunningPhase.w / 4)
        //   .attr('height', headerBoxRunningPhase.h / 3)
        //   .attr('fill', colorTheme.darker.background)
        //   .attr('stroke', colorTheme.darker.stroke)
        //   .attr('stroke-width', 0.2)
        // g.append('text')
        //   .text('Mi')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 2.5)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2.5)
        //   .attr('dy', 3)
        //   .style('font-weight', 'normal')
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7px')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        // g.append('rect')
        //   .attr('class', 'finishDAQLoading')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 3)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2)
        //   .attr('width', headerBoxRunningPhase.w / 4)
        //   .attr('height', headerBoxRunningPhase.h / 3)
        //   .attr('fill', colorTheme.darker.background)
        //   .attr('stroke', colorTheme.darker.stroke)
        //   .attr('stroke-width', 0.2)
        // g.append('text')
        //   .text('D')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 3.5)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2.5)
        //   .attr('dy', 3)
        //   .style('font-weight', 'normal')
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7px')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
      }

      function initRunPhase (g, runPhase, gt) {
        if (runPhase.length < 1) return
        if (runPhase[0].includes('config')) initConfig(g, runPhase, gt)
        if (runPhase[0].includes('takeData')) initTake(g, runPhase, gt)
        if (runPhase[0].includes('finish')) initFinish(g, runPhase, gt)
      }
      function initConfig (g, runPhase, gt) {
        g.attr('transform', 'translate(' + transConfig + ',0)')
        gt.attr('transform', 'translate(' + transConfig + ',0)')

        g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('#mount').attr('fill', colorFree) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('#camera').attr('fill', colorFree) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('#mirror').attr('fill', colorFree) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('DAQ')) g.select('#daq').attr('fill', colorFree) // .attr('stroke-width', 0.2)
        }
      }
      function initTake (g, runPhase, gt) {
        g.attr('transform', 'translate(' + transTake + ',0)')
        gt.attr('transform', 'translate(' + transTake + ',0)')

        g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
      }
      function initFinish (g, runPhase, gt) {
        g.attr('transform', 'translate(' + transFinish + ',0)')
        gt.attr('transform', 'translate(' + transFinish + ',0)')

        g.select('#mount').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorFree) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('DAQ')) g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 0.2)
        }
      }

      function dispatchRunPhase (g, runPhase, gt) {
        if (runPhase.length < 1) return
        if (runPhase[0].includes('config')) dispatchConfig(g, runPhase, gt)
        if (runPhase[0].includes('takeData')) dispatchTake(g, runPhase, gt)
        if (runPhase[0].includes('finish')) dispatchFinish(g, runPhase, gt)
      }
      function dispatchConfig (g, runPhase, gt) {
        g.transition().duration(timeD.animArc).attr('transform', 'translate(' + transConfig + ',0)')
        gt.transition().duration(timeD.animArc).attr('transform', 'translate(' + transConfig + ',0)')

        g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('#mount').attr('fill', colorTheme.dark.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('#camera').attr('fill', colorTheme.dark.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('#mirror').attr('fill', colorTheme.dark.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('DAQ')) g.select('#daq').attr('fill', colorTheme.dark.background) // .attr('stroke-width', 0.2)
        }
      }
      function dispatchTake (g, runPhase, gt) {
        g.transition().duration(timeD.animArc).attr('transform', 'translate(' + transTake + ',0)')
        gt.transition().duration(timeD.animArc).attr('transform', 'translate(' + transTake + ',0)')

        g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
      }
      function dispatchFinish (g, runPhase, gt) {
        g.transition().duration(timeD.animArc).attr('transform', 'translate(' + transFinish + ',0)')
        gt.transition().duration(timeD.animArc).attr('transform', 'translate(' + transFinish + ',0)')

        g.select('#mount').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorFree) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorFree) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('#mount').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('#camera').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('#mirror').attr('fill', colorLock) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('DAQ')) g.select('#daq').attr('fill', colorLock) // .attr('stroke-width', 0.2)
        }
      }

      let currentBlocks = reserved.gBlockBox
        .selectAll('g.currentBlock')
        .data(queueRun, function (d) {
          return d.block.obId
        })
      let enterCurrentBlocks = currentBlocks
        .enter()
        .append('g')
        .attr('class', 'currentBlock')
      enterCurrentBlocks.each(function (d, i) {
        d = d.block

        d3.select(this).append('path')
          .attr('fill', 'none')
          .attr('stroke', setCol(d).background)
          .attr('stroke-width', 4)
          .style('pointer-events', 'none')
        d3.select(this).append('rect')
          .attr('class', 'background')
          .attr('fill', function (d, i) {
            return colorTheme.medium.background
          })
          .style('fill-opacity', 1)
          .attr('stroke', colorTheme.medium.stroke)
          .attr('stroke-width', 0.0)

        let size = blockBox.w * 0.1
        d3.select(this).append('rect')
          .attr('class', 'finish')
          .attr('x', blockBox.w * 0.1 - size * 0.5)
          .attr('y', blockBox.h * 0.5 - size * 0.5)
          .attr('width', size)
          .attr('height', size)
          .attr('fill', colorTheme.dark.background)
          .style('fill-opacity', 1)
          .attr('stroke-width', 0.0)
        d3.select(this).append('rect')
          .attr('class', 'data')
          .attr('x', blockBox.w * 0.5 - size * 0.5)
          .attr('y', blockBox.h * 0.5 - size * 0.5)
          .attr('width', size)
          .attr('height', size)
          .attr('fill', colorTheme.dark.background)
          .style('fill-opacity', 1)
          .attr('stroke-width', 0.0)
        d3.select(this).append('rect')
          .attr('class', 'config')
          .attr('x', blockBox.w * 0.9 - size * 0.5)
          .attr('y', blockBox.h * 0.5 - size * 0.5)
          .attr('width', size)
          .attr('height', size)
          .attr('fill', colorTheme.dark.background)
          .style('fill-opacity', 1)
          .attr('stroke-width', 0.2)

        let grunphase = d3.select(this).append('g').attr('id', 'grunphase')
        let gtext = d3.select(this).append('g').attr('id', 'text')

        initConfigDataFinish(grunphase, blockBox)
        initRunPhase(grunphase, d.runPhase, gtext)

        // d3.select(this).append('rect')
        //   .attr('class', 'headerId')
        //   .attr('x', headerBoxId.x)
        //   .attr('y', headerBoxId.y)
        //   .attr('width', headerBoxId.w)
        //   .attr('height', headerBoxId.h)
        //   .attr('fill', function (d, i) {
        //     return colorTheme.medium.background// setCol(d).background
        //   })
        //   .style('fill-opacity', 1)
        //   .attr('stroke', colorTheme.dark.stroke)
        //   .attr('stroke-width', 0.0)
        gtext.append('text')
          .attr('id', 'name')
          .text(function () {
            return d.metaData.blockName
          })
          .attr('x', headerBoxId.w * 0.5)
          .attr('y', headerBoxId.h * 0.4)
          .attr('dy', 0)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'bold')
          .style('font-size', '24px')
          .attr('text-anchor', 'middle')
        gtext.append('text')
          .attr('id', 'percent')
          .attr('x', headerBoxId.w * 0.5)
          .attr('y', headerBoxId.h * 0.85)
          .attr('dy', 0)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'bold')
          .style('font-size', '24px')
          .attr('text-anchor', 'middle')
      })

      let mergeCurrentBlocks = currentBlocks.merge(enterCurrentBlocks)

      mergeCurrentBlocks.each(function (d, i) {
        let block = d.block
        let translate = {
          x: blockBox.x,
          y: offsetY + (blockBox.y + blockBox.h) * i
        }

        d3.select(this).select('rect.background')
          .transition()
          .duration(timeD.animArc)
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', blockBox.w)
          .attr('height', blockBox.h)
        d3.select(this).select('#percent')
          .text(function () {
            return Math.floor(100 - (((block.endTime - shared.data.server.timeOfNight.now) / (block.endTime - block.startTime)) * 100)) + '%'
          })

        d3.select(this)
          .transition()
          .duration(timeD.animArc)
          .attr('transform', function () {
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })

        // let lineGenerator = d3.line()
        //   .x(function (d) { return d.x })
        //   .y(function (d) { return d.y })
        //   .curve(d3.curveBasis)
        // let dataPointFuturTop = [
        //   {x: blockBox.w + blockBox.x, y: -translate.y + box.blockQueueServerPast.y + d.y + d.h * 0.5},
        //   {x: blockBox.w + (blockBox.x) * 0.5, y: -translate.y + box.blockQueueServerPast.y + d.y + d.h * 0.5 - blockBox.h * 0.5},
        //   {x: blockBox.w + (blockBox.x) * 0.5, y: blockBox.h * 0.5},
        //   {x: blockBox.w, y: blockBox.h * 0.5},
        //
        //   {x: blockBox.w * 0.5, y: blockBox.h * 0.5},
        //
        //   {x: 0, y: blockBox.h * 0.5},
        //   {x: 0 - (blockBox.x * 0.5), y: blockBox.h * 0.5},
        //   {x: 0 - (blockBox.x * 0.5), y: -translate.y + box.blockQueueServerPast.y + d.y + d.h * 0.5 - blockBox.h * 0.5},
        //   {x: -blockBox.x, y: -translate.y + box.blockQueueServerPast.y + d.y + d.h * 0.5}
        // ]
        // d3.select(this).select('path')
        //   .data([dataPointFuturTop])
        //   .transition()
        //   .duration(timeD.animArc)
        //   .attr('d', lineGenerator)

        dispatchRunPhase(d3.select(this).select('#grunphase'), block.runPhase, d3.select(this).select('#text'))
      })
      currentBlocks
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    this.updateData = updateData
  }
  let SvgRunningTels = function () {
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

      let minTxtSize = box.currentBlocks.w * 0.05
      reserved.gBlockBox.append('rect')
        .attr('x', box.currentBlocks.w * 0.4)
        .attr('y', box.currentBlocks.y - box.currentBlocks.h * 0.07 - minTxtSize * 0.75)
        .attr('width', box.currentBlocks.w * 0.2)
        .attr('height', minTxtSize * 1.5)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.4)
        .attr('rx', 10)
      reserved.currentTime = reserved.gBlockBox.append('text')
        .attr('class', 'currentHour')
        .attr('stroke', colorTheme.stroke)
        .attr('fill', colorTheme.stroke)
        .attr('x', box.currentBlocks.w * 0.5)
        .attr('y', box.currentBlocks.y - box.currentBlocks.h * 0.07)
        .style('font-weight', 'normal')
        .attr('text-anchor', 'middle')
        .style('font-size', minTxtSize)
        .attr('dy', 4)
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      // updateData()
    }
    this.initData = initData

    function updateData () {
      let currentTime = {date: new Date(shared.data.server.timeOfNight.date_now)}
      reserved.currentTime.text(d3.timeFormat('%H:%M')(currentTime.date))

      let defaultHeightView = box.currentBlocks.h * 0.93
      let widthBlocks = box.currentBlocks.w * 0.8
      let offsetX = (box.currentBlocks.w - widthBlocks) * 0.5

      let sizeHeader = 0.085

      let telsPerRow = 8
      let sizeTelsRow = 0.02
      let offsetTelsType = 0.25

      let offsetRunningBlocks = 0.035

      let ratio = 1

      let queueRun = blockQueueServerFutur.getBlocksRows()

      queueRun = queueRun.filter(b => b.block.exeState.state === 'run')
      queueRun.sort(function (a, b) { return a.y > b.y })
      for (let i = 0; i < queueRun.length; i++) {
        queueRun[i].y = queueRun[i].y
        queueRun[i].h = queueRun[i].h
        queueRun[i] = queueRun[i]
      }
      let totHeight = offsetRunningBlocks * (queueRun.length - 1)
      for (let i = 0; i < queueRun.length; i++) {
        let nTel = queueRun[i].block.telIds.length

        let copTelIds = deepCopy(queueRun[i].block.telIds)
        copTelIds.sort(function (a, b) { return ('' + a).localeCompare(b) })
        let off = 0
        for (let i = 0; i < copTelIds.length - 1; i++) {
          if (copTelIds[i].split('_')[0] !== copTelIds[i + 1].split('_')[0]) off += 1
        }
        nTel += off

        let nLine = (nTel % telsPerRow === 0) ?
          (nTel / telsPerRow) :
          (1 + parseInt(nTel / telsPerRow))
        nLine = nLine < 1 ? 1 : nLine

        queueRun[i].height = sizeTelsRow * nLine + off * offsetTelsType * sizeTelsRow + sizeHeader
        totHeight += queueRun[i].height
      }

      if (totHeight > 1) {
        ratio = 1 / totHeight
        totHeight = 1
      } else if (totHeight < 0.25) offsetRunningBlocks = 0.3
      else if (totHeight < 0.50) offsetRunningBlocks = 0.2
      else if (totHeight < 0.75) offsetRunningBlocks = 0.1

      for (let i = 0; i < queueRun.length; i++) {
        queueRun[i].height *= ratio
      }
      let offsetY = (defaultHeightView * 0.015) + (defaultHeightView * (1 - totHeight)) * 0.5

      let headerBox = {
        x: 0,
        y: 0,
        w: widthBlocks,
        h: ratio * defaultHeightView * sizeHeader
      }
      let headerBoxId = {
        x: headerBox.w * 0.0,
        y: headerBox.y,
        w: headerBox.w * 0.3,
        h: headerBox.h * 0.99
      }
      let headerBoxTels = {
        x: headerBox.w * 0.35,
        y: headerBox.y,
        w: headerBox.w * 0.3,
        h: headerBox.h * 0.99
      }
      let headerBoxRunningPhase = {
        x: headerBox.w * 0.7,
        y: headerBox.y,
        w: headerBox.w * 0.3,
        h: headerBox.h * 0.99
      }

      function drawTels (g) {
        function strokeSize (val) {
          return 0.3 // (2 - (2 * (val / 100)))
        }
        function fillOpacity (val) {
          return 0.9 // (0.9 - (0.5 * (val / 100)))
        }
        let tels = []
        let block = g.data()[0].block
        for (let i = 0; i < block.telIds.length; i++) { tels.push(getTelHealthById(block.telIds[i])) }
        tels.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })

        let toff = 0
        for (let i = 0; i < tels.length - 1; i++) {
          if (tels[i].id.split('_')[0] !== tels[i + 1].id.split('_')[0]) toff += 1
        }

        let nTel = block.telIds.length + toff
        let nLine = (nTel % telsPerRow === 0) ? (nTel / telsPerRow) : (1 + parseInt(nTel / telsPerRow))
        nLine = nLine < 1 ? 1 : nLine

        let off = 0
        if (tels[0].id.split('_')[0] === 'M') off -= 1
        if (tels[0].id.split('_')[0] === 'S') off -= 2

        let telsBox = {
          x: 0,
          y: (ratio * defaultHeightView * sizeHeader),
          w: widthBlocks,
          h: (ratio * nLine * sizeTelsRow * defaultHeightView) + (ratio * toff * offsetTelsType * sizeTelsRow * defaultHeightView)
        }
        let offset = {
          x: telsBox.w / telsPerRow,
          ty: (ratio * offsetTelsType * sizeTelsRow * defaultHeightView),
          y: (ratio * sizeTelsRow * defaultHeightView)
        }

        let LtelsBegin = []
        let LtelsEnd = []
        let MtelsBegin = []
        let MtelsEnd = []
        let StelsBegin = []
        let StelsEnd = []
        function addToTelsList (id, beginEnd, tx, ty) {
          if (id.split('_')[0] === 'L') {
            if (beginEnd === 'begin') {
              LtelsBegin.unshift({x: tx, y: ty})
            } else {
              LtelsEnd.push({x: tx, y: ty})
            }
          }
          if (id.split('_')[0] === 'M') {
            if (beginEnd === 'begin') {
              MtelsBegin.unshift({x: tx, y: ty})
            } else {
              MtelsEnd.push({x: tx, y: ty})
            }
          }
          if (id.split('_')[0] === 'S') {
            if (beginEnd === 'begin') {
              StelsBegin.unshift({x: tx, y: ty})
            } else {
              StelsEnd.push({x: tx, y: ty})
            }
          }
        }

        let currentTels = g
          .selectAll('g.currentTel')
          .data(tels, function (d) {
            return d.id
          })
        let enterCurrentTels = currentTels
          .enter()
          .append('g')
          .attr('class', 'currentTel')
        enterCurrentTels.each(function (d, i) {
          let toff = off
          if (d.id.split('_')[0] === 'M') toff += 1
          if (d.id.split('_')[0] === 'S') toff += 2

          let tx = (parseInt((i + toff) / telsPerRow) % 2) === 0 ?
            (offset.x * (0.5 + ((i + toff) % telsPerRow))) :
            (offset.x * (0.0 + (telsPerRow))) - (offset.x * (0.5 + ((i + toff) % telsPerRow)))
          let ty = (offset.y * (0.5 + parseInt((i + toff) / telsPerRow))) + (toff * offset.ty)

          let start = false
          if (d.id.split('_')[0] === 'L') {
            if (LtelsBegin.length === 0 && LtelsEnd.length === 0) {
              // LtelsBegin.push({x: tx, y: ty})
              // LtelsEnd.push({x: tx, ty: ty + (offset.y - strokeSize(d.val))})
              start = true
            }
          }
          if (d.id.split('_')[0] === 'M') {
            if (MtelsBegin.length === 0 && MtelsEnd.length === 0) {
              // MtelsBegin.push({x: tx, y: ty})
              // MtelsEnd.push({x: tx, ty: ty + (offset.y - strokeSize(d.val))})
              start = true
            }
          }
          if (d.id.split('_')[0] === 'S') {
            if (StelsBegin.length === 0 && StelsEnd.length === 0) {
              // StelsBegin.push({x: tx, y: ty})
              // StelsEnd.push({x: tx, ty: ty + (offset.y - strokeSize(d.val))})
              start = true
            }
          }

          let end = false
          if (i + 1 === tels.length || tels[i + 1].id.split('_')[0] !== d.id.split('_')[0]) {
            end = true
            // if (d.id.split('_')[0] === 'L') {
            //   if (LtelsBegin.length === 0) {
            //     LtelsBegin.push({x: tx, y: ty})
            //     LtelsEnd.push({x: tx, ty: ty + (offset.y - strokeSize(d.val))})
            //     start = true
            //   }
            // }
            // if (d.id.split('_')[0] === 'M') {
            //   if (MtelsBegin.length === 0) {
            //     MtelsBegin.push({x: tx, y: ty})
            //     MtelsEnd.push({x: tx, ty: ty + (offset.y - strokeSize(d.val))})
            //     start = true
            //   }
            // }
            // if (d.id.split('_')[0] === 'S') {
            //   if (StelsBegin.length === 0) {
            //     StelsBegin.push({x: tx, y: ty})
            //     StelsEnd.push({x: tx, ty: ty + (offset.y - strokeSize(d.val))})
            //     start = true
            //   }
            // }
          }

          if (start) {
            if ((parseInt((i + toff) / telsPerRow) % 2)) { // C1
              addToTelsList(d.id, 'begin', tx + offset.x - strokeSize(d.val), ty)
              addToTelsList(d.id, 'begin', tx + offset.x - strokeSize(d.val), ty + offset.y - strokeSize(d.val))
            } else {
              addToTelsList(d.id, 'end', tx, ty)
              addToTelsList(d.id, 'end', tx, ty + offset.y - strokeSize(d.val))
            }
          }
          if (end) {
            if ((parseInt((i + toff) / telsPerRow) % 2)) { // C1
              addToTelsList(d.id, 'end', tx, ty)
              addToTelsList(d.id, 'end', tx, ty + offset.y - strokeSize(d.val))
            } else {
              addToTelsList(d.id, 'begin', tx + offset.x - strokeSize(d.val), ty)
              addToTelsList(d.id, 'begin', tx + offset.x - strokeSize(d.val), ty + offset.y - strokeSize(d.val))
            }
          }

          if (true) { // !start && !end) {
            if ((parseInt((i + toff) / telsPerRow) % 2)) { // A
              if (((i + toff) % telsPerRow) === 0) { // C1
                addToTelsList(d.id, 'begin', tx + offset.x - strokeSize(d.val), ty)
                addToTelsList(d.id, 'begin', tx + offset.x - strokeSize(d.val), ty + offset.y - strokeSize(d.val))
              }
              if (((i + toff) % telsPerRow) === (telsPerRow - 1)) { // C2
                addToTelsList(d.id, 'end', tx, ty)
                addToTelsList(d.id, 'end', tx, ty + offset.y - strokeSize(d.val))
              }
            } else { // B
              if (((i + toff) % telsPerRow) === 0) { // C1
                addToTelsList(d.id, 'end', tx, ty)
                addToTelsList(d.id, 'end', tx, ty + offset.y - strokeSize(d.val))
              }
              if (((i + toff) % telsPerRow) === (telsPerRow - 1)) { // C2
                addToTelsList(d.id, 'begin', tx + offset.x - strokeSize(d.val), ty)
                addToTelsList(d.id, 'begin', tx + offset.x - strokeSize(d.val), ty + offset.y - strokeSize(d.val))
              }
            }
          }

          d3.select(this).attr('transform', 'translate(' + tx + ',' + ty + ')')
          d3.select(this).append('rect')
            .attr('x', function (d) {
              return (-offset.x * 0.5) + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
            })
            .attr('y', function (d) {
              return (-offset.y * 0.5) + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
            })
            .attr('width', function (d) {
              return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
            })
            .attr('height', function (d) {
              return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
            })
            .attr('fill', function (d) {
              return telHealthCol(d.val)
            })
            .attr('fill-opacity', function (d) {
              return fillOpacity(d.val)
            })
            .attr('stroke-width', function (d) {
              return strokeSize(d.val)
            })
            .attr('stroke', function (d) {
              return colorTheme.dark.stroke//telHealthCol(d.val)
            })
            .attr('stroke-opacity', function (d) {
              return 1
            })
            .attr('rx', 0)
            .attr('ry', 0)
          d3.select(this).append('text')
            .attr('x', 0)
            .attr('y', offset.y * 0.2)
            .attr('dy', 0)
            .text(function (d) {
              return d.id // d.id.split('_')[1]
            })
            .style('fill', colorTheme.blocks.run.text)
            .style('font-weight', 'normal')
            .style('font-size', function (d) {
              return 6.2 // - (2 * (d.val / 100))
            })
            .attr('text-anchor', 'middle')
        })

        // if (g.select('path.Lpath').empty()) {
        //   let lpath = g.append('path')
        //     .attr('class', 'Lpath')
        //   let dataPoints = [].concat(LtelsBegin).concat(LtelsEnd).concat([LtelsBegin[0]])
        //   if (dataPoints.length > 0) {
        //     let lineGenerator = d3.line()
        //       .x(function (d) { return d.x - offset.x * 0.5 })
        //       .y(function (d) { return d.y - offset.y * 0.5 })
        //     lpath
        //       .attr('fill', 'none')
        //       .attr('stroke', '#000000')
        //       .attr('stroke-width', 2)
        //       .attr('d', lineGenerator(dataPoints))
        //   }
        // }
        // if (g.select('path.Mpath').empty()) {
        //   let path = g.append('path')
        //     .attr('class', 'Mpath')
        //   let dataPoints = [].concat(MtelsBegin).concat(MtelsEnd).concat([MtelsBegin[0]])
        //   if (dataPoints.length > 0) {
        //     let lineGenerator = d3.line()
        //       .x(function (d) { return d.x - offset.x * 0.5 })
        //       .y(function (d) { return d.y - offset.y * 0.5 })
        //     path
        //       .attr('fill', 'none')
        //       .attr('stroke', '#000000')
        //       .attr('stroke-width', 2)
        //       .attr('d', lineGenerator(dataPoints))
        //   }
        // }
        // if (g.select('path.Spath').empty()) {
        //   let path = g.append('path')
        //     .attr('class', 'Spath')
        //   let dataPoints = [].concat(StelsBegin).concat(StelsEnd).concat([StelsBegin[0]])
        //   if (dataPoints.length > 0) {
        //     let lineGenerator = d3.line()
        //       .x(function (d) { return d.x - offset.x * 0.5 })
        //       .y(function (d) { return d.y - offset.y * 0.5 })
        //     path
        //       .attr('fill', 'none')
        //       .attr('stroke', '#000000')
        //       .attr('stroke-width', 2)
        //       .attr('d', lineGenerator(dataPoints))
        //   }
        // }
        let mergeCurrentTels = currentTels.merge(enterCurrentTels)
        mergeCurrentTels.each(function (d, i) {
          let toff = off
          if (d.id.split('_')[0] === 'M') toff += 1
          if (d.id.split('_')[0] === 'S') toff += 2

          d3.select(this).attr('transform', function (d) {
            let tx = -(parseInt((i + toff) / telsPerRow) % 2) === 0 ?
              (offset.x * (0.5 + ((i + toff) % telsPerRow))) :
              (offset.x * (0.0 + (telsPerRow))) - (offset.x * (0.5 + ((i + toff) % telsPerRow)))
            let ty = (offset.y * (0.5 + parseInt((i + toff) / telsPerRow))) + (toff * offset.ty)
            return 'translate(' + tx + ',' + ty + ')'
          })
          d3.select(this).select('rect')
            .transition()
            .duration(timeD.animArc)
            .attr('x', function (d) {
              return (-offset.x * 0.5) + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
            })
            .attr('y', function (d) {
              return (-offset.y * 0.5) + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
            })
            .attr('width', function (d) {
              return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
            })
            .attr('height', function (d) {
              return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
            })
            .attr('fill', function (d) {
              return telHealthCol(d.val)
            })
            .attr('fill-opacity', function (d) {
              return fillOpacity(d.val)
            })
            .attr('stroke-width', function (d) {
              return strokeSize(d.val)
            })
            .attr('stroke', function (d) {
              return colorTheme.dark.stroke//telHealthCol(d.val)
            })
            .attr('stroke-opacity', function (d) {
              return 1
            })
          d3.select(this).select('text')
            .attr('x', 0)
            .attr('y', offset.y * 0.2)
            .attr('dy', 0)
            .text(function (d) {
              return d.id // d.id.split('_')[1]
            })
            .style('fill', colorTheme.blocks.run.text)
            .style('font-weight', 'normal')
            .style('font-size', function (d) {
              return 6.2 // - (2 * (d.val / 100))
            })
            .attr('text-anchor', 'middle')
        })

        currentTels
          .exit()
          .transition('inOut')
          .duration(timeD.animArc)
          .style('opacity', 0)
          .remove()
      }

      function initConfigDataFinish (g, headerBox) {
        // Back
        // g.append('rect')
        //   .attr('class', 'configBack')
        //   .attr('x', (headerBox.w * 0.4))
        //   .attr('y', headerBox.h * 0.0)
        //   .attr('width', headerBox.w * 0.23)
        //   .attr('height', headerBox.h * 0.98)
        //   .attr('fill', colorTheme.dark.background)
        //   .attr('stroke', colorTheme.dark.stroke)
        //   .attr('stroke-width', 0.45)
        // g.append('rect')
        //   .attr('class', 'dataBack')
        //   .attr('x', (headerBox.w * 0.63))
        //   .attr('y', headerBox.h * 0.0)
        //   .attr('width', headerBox.w * 0.15)
        //   .attr('height', headerBox.h * 0.98)
        //   .attr('fill', colorTheme.dark.background)
        //   .attr('stroke', colorTheme.dark.stroke)
        //   .attr('stroke-width', 0.45)
        // g.append('rect')
        //   .attr('class', 'finishBack')
        //   .attr('x', (headerBox.w * 0.78))
        //   .attr('y', headerBox.h * 0.0)
        //   .attr('width', headerBox.w * 0.22)
        //   .attr('height', headerBox.h * 0.98)
        //   .attr('fill', colorTheme.dark.background)
        //   .attr('stroke', colorTheme.dark.stroke)
        //   .attr('stroke-width', 0.45)

        // CONFIG
        // g.append('text')
        //   .text('CONFIG -------------->')
        //   .attr('x', (headerBox.w * 0.42) + 2)
        //   .attr('y', headerBox.h * 0.1)
        //   .attr('dy', 2)
        //   .style('fill', colorTheme.blocks.run.text)
        //   // .style('font-weight', 'normal')
        //   .style('font-size', '5.5px')
        //   .attr('text-anchor', 'start')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        g.append('rect')
          .attr('class', 'mount')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 0)
          .attr('y', headerBoxRunningPhase.y)
          .attr('width', headerBoxRunningPhase.w / 4)
          .attr('height', headerBoxRunningPhase.h / 3)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('Mo')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 0.5)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 0.5)
          .attr('dy', 3)
          .style('font-weight', 'normal')
          .style('fill', colorTheme.blocks.run.text)
          .style('font-size', '7px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
        g.append('rect')
          .attr('class', 'camera')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 1)
          .attr('y', headerBoxRunningPhase.y)
          .attr('width', headerBoxRunningPhase.w / 4)
          .attr('height', headerBoxRunningPhase.h / 3)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('C')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 1.5)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 0.5)
          .attr('dy', 3)
          .style('font-weight', 'normal')
          .style('fill', colorTheme.blocks.run.text)
          .style('font-size', '7px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
        g.append('rect')
          .attr('class', 'mirror')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 2)
          .attr('y', headerBoxRunningPhase.y)
          .attr('width', headerBoxRunningPhase.w / 4)
          .attr('height', headerBoxRunningPhase.h / 3)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('Mi')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 2.5)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 0.5)
          .attr('dy', 3)
          .style('font-weight', 'normal')
          .style('fill', colorTheme.blocks.run.text)
          .style('font-size', '7px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
        g.append('rect')
          .attr('class', 'daq')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 3)
          .attr('y', headerBoxRunningPhase.y)
          .attr('width', headerBoxRunningPhase.w / 4)
          .attr('height', headerBoxRunningPhase.h / 3)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('D')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 3.5)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 0.5)
          .attr('dy', 3)
          .style('font-weight', 'normal')
          .style('fill', colorTheme.blocks.run.text)
          .style('font-size', '7px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')

        // Take Data
        g.append('rect')
          .attr('class', 'dataLoading')
          .attr('x', headerBoxRunningPhase.x + headerBoxRunningPhase.w * 0.25)
          .attr('y', headerBoxRunningPhase.y + headerBoxRunningPhase.h / 3)
          .attr('width', headerBoxRunningPhase.w * 0.5)
          .attr('height', headerBoxRunningPhase.h / 3)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('Data')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 2))
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 2))
          .attr('dy', 2.2)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-size', '7.5px')
          .style('font-weight', 'normal')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
        // g.append('text')
        //   .text('a')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 3) * 1.45)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 6) * 2.5)
        //   .attr('dy', 1.8)
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7.5px')
        //   .style('font-weight', 'normal')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        // g.append('text')
        //   .text('t')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 3) * 1.55)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 6) * 3.5)
        //   .attr('dy', 3)
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7.5px')
        //   .style('font-weight', 'normal')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        // g.append('text')
        //   .text('a')
        //   .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 3) * 1.65)
        //   .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 6) * 4.5)
        //   .attr('dy', 4.2)
        //   .style('fill', colorTheme.blocks.run.text)
        //   .style('font-size', '7.5px')
        //   .style('font-weight', 'normal')
        //   .attr('text-anchor', 'middle')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')

        // FINISH
        // g.append('text')
        //   .text('FINISH')
        //   .attr('x', (headerBox.w * 0.87) + 2)
        //   .attr('y', headerBox.h * 0.1)
        //   .attr('dy', 2)
        //   .style('fill', colorTheme.blocks.run.text)
        //   // .style('font-weight', 'normal')
        //   .style('font-size', '5.5px')
        //   .attr('text-anchor', 'start')
        //   .style('pointer-events', 'none')
        //   .style('user-select', 'none')
        g.append('rect')
          .attr('class', 'finishMountLoading')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 0)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2)
          .attr('width', headerBoxRunningPhase.w / 4)
          .attr('height', headerBoxRunningPhase.h / 3)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('Mo')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 0.5)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2.5)
          .attr('dy', 3)
          .style('font-weight', 'normal')
          .style('fill', colorTheme.blocks.run.text)
          .style('font-size', '7px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
        g.append('rect')
          .attr('class', 'finishCameraLoading')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 1)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2)
          .attr('width', headerBoxRunningPhase.w / 4)
          .attr('height', headerBoxRunningPhase.h / 3)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('C')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 1.5)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2.5)
          .attr('dy', 3)
          .style('font-weight', 'normal')
          .style('fill', colorTheme.blocks.run.text)
          .style('font-size', '7px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
        g.append('rect')
          .attr('class', 'finishMirrorLoading')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 2)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2)
          .attr('width', headerBoxRunningPhase.w / 4)
          .attr('height', headerBoxRunningPhase.h / 3)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('Mi')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 2.5)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2.5)
          .attr('dy', 3)
          .style('font-weight', 'normal')
          .style('fill', colorTheme.blocks.run.text)
          .style('font-size', '7px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
        g.append('rect')
          .attr('class', 'finishDAQLoading')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 3)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2)
          .attr('width', headerBoxRunningPhase.w / 4)
          .attr('height', headerBoxRunningPhase.h / 3)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        g.append('text')
          .text('D')
          .attr('x', headerBoxRunningPhase.x + (headerBoxRunningPhase.w / 4) * 3.5)
          .attr('y', headerBoxRunningPhase.y + (headerBoxRunningPhase.h / 3) * 2.5)
          .attr('dy', 3)
          .style('font-weight', 'normal')
          .style('fill', colorTheme.blocks.run.text)
          .style('font-size', '7px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
      }

      function initRunPhase (g, runPhase) {
        if (runPhase.length < 1) return
        if (runPhase[0].includes('config')) initConfig(g, runPhase)
        if (runPhase[0].includes('takeData')) initTake(g, runPhase)
        if (runPhase[0].includes('finish')) initFinish(g, runPhase)
      }
      function initConfig (g, runPhase) {
        g.select('#mount').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('#mount').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('#camera').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('#mirror').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('DAQ')) g.select('#daq').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
        }
      }
      function initTake (g, runPhase) {
        g.select('#mount').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)

        g.select('rect.dataLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('take')) g.select('rect.dataLoading').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
        }
      }
      function initFinish (g, runPhase) {
        g.select('#mount').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)

        g.select('rect.dataLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)

        g.select('rect.finishMountLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('rect.finishCameraLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('rect.finishDAQLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('rect.finishMirrorLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('rect.finishMountLoading').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('rect.finishCameraLoading').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('rect.finishMirrorLoading').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('DAQ')) g.select('rect.finishDAQLoading').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
        }
      }

      function dispatchRunPhase (g, runPhase) {
        if (runPhase.length < 1) return
        if (runPhase[0].includes('config')) dispatchConfig(g, runPhase)
        if (runPhase[0].includes('takeData')) dispatchTake(g, runPhase)
        if (runPhase[0].includes('finish')) dispatchFinish(g, runPhase)
      }
      function dispatchConfig (g, runPhase) {
        g.select('#mount').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('#mount').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('#camera').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('#mirror').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('DAQ')) g.select('#daq').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
        }
      }
      function dispatchTake (g, runPhase) {
        g.select('#mount').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#camera').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#daq').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('#mirror').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)

        g.select('rect.dataLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('take')) g.select('rect.dataLoading').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
        }
      }
      function dispatchFinish (g, runPhase) {
        g.select('rect.dataLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)

        g.select('rect.finishMountLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('rect.finishCameraLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('rect.finishDAQLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 2)
        g.select('rect.finishMirrorLoading').attr('fill', colorTheme.blocks.done.background) // .attr('stroke-width', 0.2)
        for (let i = 0; i < runPhase.length; i++) {
          if (runPhase[0].includes('mount')) g.select('rect.finishMountLoading').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('camera')) g.select('rect.finishCameraLoading').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('mirror')) g.select('rect.finishMirrorLoading').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
          if (runPhase[0].includes('DAQ')) g.select('rect.finishDAQLoading').attr('fill', colorTheme.blocks.run.background) // .attr('stroke-width', 0.2)
        }
      }

      let currentBlocks = reserved.gBlockBox
        .selectAll('g.currentBlock')
        .data(queueRun, function (d) {
          return d.block.obId
        })
      let enterCurrentBlocks = currentBlocks
        .enter()
        .append('g')
        .attr('class', 'currentBlock')
      enterCurrentBlocks.each(function (d, i) {
        d = d.block
        let copTelIds = deepCopy(d.telIds)
        copTelIds.sort(function (a, b) { return ('' + a).localeCompare(b) })
        let off = 0
        let LST = 0
        let MST = 0
        let SST = 0
        for (let i = 0; i < copTelIds.length - 1; i++) {
          if (copTelIds[i].split('_')[0] !== copTelIds[i + 1].split('_')[0]) {
            if (copTelIds[i].split('_')[0] === 'L') LST = i + 1
            if (copTelIds[i].split('_')[0] === 'M') MST = (i + 1) - LST
            off += 1
          }
        }
        SST = copTelIds.length - LST - MST

        let nTel = d.telIds.length + off

        let nLine = (nTel % telsPerRow === 0) ?
          (nTel / telsPerRow) :
          (1 + parseInt(nTel / telsPerRow))
        nLine = nLine < 1 ? 1 : nLine

        let headerBox = {
          x: 0,
          y: 0,
          w: widthBlocks,
          h: ratio * defaultHeightView * sizeHeader
        }
        let telsBox = {
          x: 0,
          y: (ratio * defaultHeightView * sizeHeader),
          w: widthBlocks,
          h: (ratio * nLine * sizeTelsRow * defaultHeightView) + (ratio * off * offsetTelsType * sizeTelsRow * defaultHeightView)
        }
        d3.select(this).append('path')
          .attr('fill', 'none')
          .attr('stroke', setCol(d).background)
          .attr('stroke-width', 4)
          .style('pointer-events', 'none')

        d3.select(this).append('rect')
          .attr('class', 'background')
          .attr('fill', function (d, i) {
            return colorTheme.darker.stroke
          })
          .style('fill-opacity', 1)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 1.5)

        d3.select(this).append('rect')
          .attr('class', 'headerId')
          .attr('x', headerBoxId.x)
          .attr('y', headerBoxId.y)
          .attr('width', headerBoxId.w)
          .attr('height', headerBoxId.h)
          .attr('fill', function (d, i) {
            return colorTheme.dark.background// setCol(d).background
          })
          .style('fill-opacity', 1)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.4)
        d3.select(this).append('text')
          .text(function () {
            return d.metaData.blockName
          })
          .attr('x', headerBoxId.w * 0.5)
          .attr('y', headerBoxId.h * 0.5)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', '12px')
          .attr('text-anchor', 'middle')

        d3.select(this).append('rect')
          .attr('class', 'headerTels')
          .attr('x', headerBoxTels.x)
          .attr('y', headerBoxTels.y)
          .attr('width', headerBoxTels.w)
          .attr('height', headerBoxTels.h)
          .attr('fill', function (d, i) {
            return colorTheme.dark.background
          })
          .style('fill-opacity', 1)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.4)
        d3.select(this).append('text')
          .text(d.pointingName.split('/')[0])
          .attr('x', headerBoxTels.x + headerBoxTels.w * 0.3)
          .attr('y', headerBoxTels.y + (headerBoxTels.h / 3))
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', '9px')
          .attr('text-anchor', 'middle')
        d3.select(this).append('text')
          .text(d.pointingName.split('/')[1])
          .attr('x', headerBoxTels.x + headerBoxTels.w * 0.3)
          .attr('y', headerBoxTels.y + (headerBoxTels.h / 3) * 2)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', '9px')
          .attr('text-anchor', 'middle')
        d3.select(this).append('rect')
          .attr('class', 'headerTels')
          .attr('x', headerBoxTels.x + headerBoxTels.w * 0.6)
          .attr('y', headerBoxTels.y)
          .attr('width', headerBoxTels.w * 0.4)
          .attr('height', headerBoxTels.h / 3)
          .attr('fill', function (d, i) {
            return colorTheme.dark.background
          })
          .style('fill-opacity', 1)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.4)
        d3.select(this).append('text')
          .text('L: ' + LST)
          .attr('x', headerBoxTels.x + headerBoxTels.w * 0.6 + headerBoxTels.w * 0.2)
          .attr('y', headerBoxTels.y + (headerBoxTels.h / 3) * 0.5)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', '8px')
          .attr('text-anchor', 'middle')
        d3.select(this).append('rect')
          .attr('class', 'headerTels')
          .attr('x', headerBoxTels.x + headerBoxTels.w * 0.6)
          .attr('y', headerBoxTels.y + (headerBoxTels.h / 3))
          .attr('width', headerBoxTels.w * 0.4)
          .attr('height', headerBoxTels.h / 3)
          .attr('fill', function (d, i) {
            return colorTheme.dark.background
          })
          .style('fill-opacity', 1)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.4)
        d3.select(this).append('text')
          .text('M: ' + MST)
          .attr('x', headerBoxTels.x + headerBoxTels.w * 0.6 + headerBoxTels.w * 0.2)
          .attr('y', headerBoxTels.y + (headerBoxTels.h / 3) * 1.5)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', '8px')
          .attr('text-anchor', 'middle')
        d3.select(this).append('rect')
          .attr('class', 'headerTels')
          .attr('x', headerBoxTels.x + headerBoxTels.w * 0.6)
          .attr('y', headerBoxTels.y + (headerBoxTels.h / 3) * 2)
          .attr('width', headerBoxTels.w * 0.4)
          .attr('height', headerBoxTels.h / 3)
          .attr('fill', function (d, i) {
            return colorTheme.dark.background
          })
          .style('fill-opacity', 1)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.4)
        d3.select(this).append('text')
          .text('S: ' + SST)
          .attr('x', headerBoxTels.x + headerBoxTels.w * 0.6 + headerBoxTels.w * 0.2)
          .attr('y', headerBoxTels.y + (headerBoxTels.h / 3) * 2.5)
          .attr('dy', 3)
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', '8px')
          .attr('text-anchor', 'middle')

        // initConfigDataFinish(d3.select(this), headerBox)
        // initRunPhase(d3.select(this), d.runPhase)

        d3.select(this).append('g')
          .attr('class', 'telsBox')
          .attr('transform', function () {
            return 'translate(' + (telsBox.x) + ',' + (telsBox.y) + ')'
          })
          .attr('width', telsBox.w)
          .attr('height', telsBox.h)
          .append('rect')
          .attr('class', 'background')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', function () {
            return telsBox.w
          })
          .attr('height', function () {
            return telsBox.h
          })
          .attr('fill', colorTheme.medium.background)
          .style('fill-opacity', 1)
          .attr('stroke', function (d, i) {
            return 'none' // setCol(d).background
          })
          .attr('stroke-width', 0.8)
      })

      let mergeCurrentBlocks = currentBlocks.merge(enterCurrentBlocks)

      mergeCurrentBlocks.each(function (d, i) {
        let block = d.block
        let copTelIds = deepCopy(block.telIds)
        copTelIds.sort(function (a, b) { return ('' + a).localeCompare(b) })
        let off = 0
        for (let i = 0; i < copTelIds.length - 1; i++) {
          if (copTelIds[i].split('_')[0] !== copTelIds[i + 1].split('_')[0]) off += 1
        }

        let nTel = block.telIds.length + off

        let nLine = (nTel % telsPerRow === 0) ?
          (nTel / telsPerRow) :
          (1 + parseInt(nTel / telsPerRow))
        nLine = nLine < 1 ? 1 : nLine
        let height = d.height * defaultHeightView
        let headerBox = {
          x: 0,
          y: 0,
          w: widthBlocks,
          h: ratio * defaultHeightView * sizeHeader
        }
        let telsBox = {
          x: 0,
          y: (ratio * defaultHeightView * sizeHeader),
          w: widthBlocks,
          h: (ratio * nLine * sizeTelsRow * defaultHeightView) + (ratio * off * offsetTelsType * sizeTelsRow * defaultHeightView)
        }

        offsetY += (i === 0 ? 0 : offsetRunningBlocks * defaultHeightView)
        let translate = {
          y: offsetY,
          x: offsetX
        }
        offsetY += height
        d3.select(this).select('rect.background')
          .transition()
          .duration(timeD.animArc)
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', widthBlocks)
          .attr('height', height)
        d3.select(this).select('g.telsBox rect.background')
          .transition()
          .duration(timeD.animArc)
          .attr('class', 'background')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', function () {
            return telsBox.w
          })
          .attr('height', function () {
            return telsBox.h
          })

        d3.select(this)
          .transition()
          .duration(timeD.animArc)
          .attr('transform', function (d, i) {
            return 'translate(' + translate.x + ',' + translate.y + ')'
          })
        let lineGenerator = d3.line()
          .x(function (d) { return d.x })
          .y(function (d) { return d.y })
          .curve(d3.curveBasis)
        let dataPointFuturTop = [
          {x: widthBlocks + offsetX, y: -translate.y + (box.blockQueueServerPast.h * 0.41375) + d.y + d.h * 0.5 - box.currentBlocks.y},
          {x: (widthBlocks) + (offsetX) * 0.5 /* ((1 / queueRun.length) * i) */, y: -translate.y + (box.blockQueueServerPast.h * 0.41375) + d.y + d.h * 0.5 - box.currentBlocks.y},
          {x: (widthBlocks) + (offsetX) * 0.5 /* ((1 / queueRun.length) * i) */, y: headerBox.h * 0.5},
          {x: (widthBlocks), y: headerBox.h * 0.5},

          {x: widthBlocks * 0.5, y: headerBox.h * 0.5},

          {x: 0, y: headerBox.h * 0.5},
          {x: 0 - (offsetX * 0.5 /* ((1 / queueRun.length) * i) */), y: headerBox.h * 0.5},
          {x: 0 - (offsetX * 0.5 /* ((1 / queueRun.length) * i) */), y: -translate.y + box.blockQueueServerPast.y + (box.blockQueueServerPast.h * 0.41375) + d.y + d.h * 0.5 - box.currentBlocks.y},
          {x: -offsetX, y: -translate.y + box.blockQueueServerPast.y + (box.blockQueueServerPast.h * 0.41375) + d.y + d.h * 0.5 - box.currentBlocks.y}
        ]
        d3.select(this).select('path')
          .data([dataPointFuturTop])
          .transition()
          .duration(timeD.animArc)
          .attr('d', lineGenerator)

        dispatchRunPhase(d3.select(this), block.runPhase)

        drawTels(d3.select(this).select('g.telsBox'))
      })
      currentBlocks
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    this.updateData = updateData
  }
  let SvgFreeTels = function () {
    let reserved = {}

    function initData () {
      reserved.gBlockBox = svg.g.append('g')
        .attr('transform', 'translate(' + box.freeTels.x + ',' + box.freeTels.y + ')')
      reserved.gBlockBox.append('rect')
        .attr('x', -3 + box.freeTels.marg)
        .attr('y', 0)
        .attr('width', box.freeTels.w - box.freeTels.marg)
        .attr('height', box.freeTels.h)
        .attr('fill', 'transparent') // colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
        .attr('stroke-dasharray', [0, 2 * (box.freeTels.w - box.freeTels.marg) + box.freeTels.h, box.freeTels.h])
      reserved.gBlockBox.append('text')
        .text('Unused Telescopes')
        .style('fill', colorTheme.dark.text)
        .style('font-weight', 'normal')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(4,' + (box.freeTels.h * 0.5) + ') rotate(270)')
      reserved.telsBox = reserved.gBlockBox.append('g')
        .attr('transform', 'translate(' + box.freeTels.marg + ',0)')
    }
    this.initData = initData

    function updateData () {
      function strokeSize (val) {
        return 0.4 // (2 - (2 * (val / 100)))
      }
      function fillOpacity (val) {
        return 1 // (0.9 - (0.5 * (val / 100)))
      }

      let runTels = []
      for (let i = 0; i < shared.data.server.blocks.run.length; i++) {
        runTels = runTels.concat(shared.data.server.blocks.run[i].telIds)
      }
      let freeTels = deepCopy(shared.data.server.telIds)
      freeTels = freeTels.filter(value => !runTels.includes(value))
      let tels = []
      for (let i = 0; i < runTels.length; i++) {
        let t = getTelHealthById(runTels[i])
        t.running = true
        tels.push(t)
      }
      for (let i = 0; i < freeTels.length; i++) {
        let t = getTelHealthById(freeTels[i])
        t.running = false
        tels.push(t)
      }

      tels.sort(function (a, b) { return ('' + a.id).localeCompare(b.id) })

      let defaultHeightView = box.freeTels.h
      let widthBlocks = box.freeTels.w - box.freeTels.marg
      // let offsetX = (box.currentBlocks.w - widthBlocks) * 0.5

      let telsPerRow = 12
      let sizeTelsRow = 0.1
      let offsetTelsType = 0.5

      let ratio = 1

      // let toff = 0
      // for (let i = 0; i < tels.length - 1; i++) {
      //   if (tels[i].id.split('_')[0] !== tels[i + 1].id.split('_')[0]) toff += 1
      // }

      // let nTel = tels.length + toff
      // let nLine = (nTel % telsPerRow === 0) ? (nTel / telsPerRow) : (1 + parseInt(nTel / telsPerRow))
      // nLine = nLine < 1 ? 1 : nLine

      let off = 0
      if (tels.length > 0 && tels[0].id.split('_')[0] === 'M') off -= 1
      if (tels.length > 0 && tels[0].id.split('_')[0] === 'S') off -= 2

      let telsBox = {
        x: box.freeTels.marg,
        y: 0,
        w: widthBlocks,
        h: defaultHeightView
      }
      let offset = {
        x: telsBox.w / telsPerRow,
        ty: (ratio * offsetTelsType * sizeTelsRow * defaultHeightView),
        y: (ratio * sizeTelsRow * defaultHeightView)
      }

      let currentTels = reserved.telsBox
        .selectAll('g.currentTel')
        .data(tels, function (d) {
          return d.id
        })
      let enterCurrentTels = currentTels
        .enter()
        .append('g')
        .attr('class', 'currentTel')
      enterCurrentTels.each(function (d, i) {
        let toff = off
        if (d.id.split('_')[0] === 'M') toff += 1
        if (d.id.split('_')[0] === 'S') toff += 2

        d3.select(this).attr('transform', function (d) {
          let tx = -(parseInt((i + toff) / telsPerRow) % 2) === 0 ?
            (offset.x * (0.5 + ((i + toff) % telsPerRow))) :
            (offset.x * (0.0 + (telsPerRow))) - (offset.x * (0.5 + ((i + toff) % telsPerRow)))
          let ty = (offset.y * (0.5 + parseInt((i + toff) / telsPerRow))) + (toff * offset.ty)
          return 'translate(' + tx + ',' + ty + ')'
        })
        d3.select(this).append('rect')
          .attr('x', function (d) {
            return (-offset.x * 0.5) + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
          })
          .attr('y', function (d) {
            return (-offset.y * 0.5) + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
          })
          .attr('width', function (d) {
            return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
          })
          .attr('height', function (d) {
            return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
          })
          .attr('fill', function (d) {
            return telHealthCol(d.val)
          })
          .attr('fill-opacity', function (d) {
            return fillOpacity(d.val)
          })
          .attr('stroke-width', function (d) {
            return strokeSize(d.val)
          })
          .attr('stroke', function (d) {
            return telHealthCol(d.val)
          })
          .attr('stroke-opacity', function (d) {
            return 1
          })
          .attr('rx', 0)
          .attr('ry', 0)
        d3.select(this).append('text')
          .attr('x', 0)
          .attr('y', offset.y * 0.2)
          .attr('dy', 0)
          .text(function (d) {
            return d.id // d.id.split('_')[1]
          })
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', function (d) {
            return 6.2 // - (2 * (d.val / 100))
          })
          .attr('text-anchor', 'middle')
      })

      let mergeCurrentTels = currentTels.merge(enterCurrentTels)
      mergeCurrentTels.each(function (d, i) {
        let toff = off
        if (d.id.split('_')[0] === 'M') toff += 1
        if (d.id.split('_')[0] === 'S') toff += 2

        d3.select(this)
          .attr('transform', function (d) {
            let tx = -(parseInt((i + toff) / telsPerRow) % 2) === 0 ?
              (offset.x * (0.5 + ((i + toff) % telsPerRow))) :
              (offset.x * (0.0 + (telsPerRow))) - (offset.x * (0.5 + ((i + toff) % telsPerRow)))
            let ty = (offset.y * (0.5 + parseInt((i + toff) / telsPerRow))) + (toff * offset.ty)
            return 'translate(' + tx + ',' + ty + ')'
          })
          .style('opacity', function () {
            if (!d.running) return 1
            return 0.4
          })
        d3.select(this).select('rect')
          .transition()
          .duration(timeD.animArc)
          .attr('x', function (d) {
            return (-offset.x * 0.5) + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
          })
          .attr('y', function (d) {
            return (-offset.y * 0.5) + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
          })
          .attr('width', function (d) {
            return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
          })
          .attr('height', function (d) {
            return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
          })
          .attr('fill', function (d) {
            if (!d.running) return telHealthCol(d.val)
            return colorTheme.dark.background
          })
          // .attr('fill-opacity', function (d) {
          //   return fillOpacity(d.val)
          // })
          .attr('stroke-width', function (d) {
            return strokeSize(d.val)
          })
          .attr('stroke', function (d) {
            // if (!d.running) return telHealthCol(d.val)
            return colorTheme.dark.stroke
          })
          // .attr('stroke-opacity', function (d) {
          //   if (!d.running) return 1
          //   return 1
          // })
        d3.select(this).select('text')
          .attr('x', 0)
          .attr('y', offset.y * 0.2)
          .attr('dy', 0)
          .text(function (d) {
            return d.id // d.id.split('_')[1]
          })
          .style('fill', colorTheme.blocks.run.text)
          .style('font-weight', 'normal')
          .style('font-size', function (d) {
            return 6.2 // - (2 * (d.val / 100))
          })
          .attr('text-anchor', 'middle')
      })

      currentTels
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    }
    this.updateData = updateData
  }

  let svgBlocksQueueServerPast = new SvgBlocksQueueServerPast()
  let svgBlocksQueueServerFutur = new SvgBlocksQueueServerFutur()
  let svgRunningPhase = new SvgRunningPhase()
  let svgStateScheduleMatrix = new SvgStateScheduleMatrix()
  let svgWaitScheduleMatrix = new SvgWaitScheduleMatrix()
  let svgFreeTels = new SvgFreeTels()
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
