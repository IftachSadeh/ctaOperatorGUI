'use strict'
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// stric mode for the following script or function (must come at the very begining!)
// see: http://www.w3schools.com/js/js_strict.asp
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// mainScriptTag used locally (will be overriden by other scripts...)
// must be compatible with the name of this js file, according to:
//    "/js/widget_"+mainScriptTag+".js"
var mainScriptTag = 'commentNightSched'
// -------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global minMaxObj */
/* global sock */
/* global timeD */
/* global hasVar */
/* global telInfo */
/* global disableScrollSVG */
/* global RunLoop */
/* global BlockDisplayer */
/* global BlockList */
/* global BlockFilters */
/* global BlockQueueCreator */
/* global TelsArray */
/* global EventQueue */
/* global ClockEvents */
/* global ButtonPanel */
/* global PanelManager */
/* global bckPattern */
/* global telHealthCol */
/* global colsPurplesBlues */
/* global colsYellows */
/* global ScrollTable */
/* global colsReds */
/* global colsPurples */
/* global colsGreens */
/* global colPrime */
/* global Locker */
/* global FormManager */
/* global appendToDom */
/* global runWhenReady */
/* global ScrollBox */

// window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueueCreator.js' })
// window.loadScript({ source: mainScriptTag, script: '/js/utils_blockList.js' })
window.loadScript({
  source: mainScriptTag,
  script: '/js/blocks/utils_blockFilters.js'
})
window.loadScript({
  source: mainScriptTag,
  script: '/js/blocks/utils_blockDisplayer.js'
})
window.loadScript({
  source: mainScriptTag,
  script: '/js/events/utils_EventQueue.js'
})
// window.loadScript({ source: mainScriptTag, script: '/js/utils_TelsArray.js' })

window.loadScript({
  source: mainScriptTag,
  script: '/js/utils_panelManager.js'
})
window.loadScript({ source: mainScriptTag, script: '/js/utils_buttonPanel.js' })
window.loadScript({
  source: mainScriptTag,
  script: '/js/events/utils_clockEvents.js'
})
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollTable.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_formManager.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollBox.js' })

// -------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 6
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = {
    SockFunc: sockCommentNightSched,
    MainFunc: mainCommentNightSched
  }
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

// -------------------------------------------------------------------
// additional socket events for this particular widget type
// -------------------------------------------------------------------
let sockCommentNightSched = function (optIn) {
  // let widgetType   = optIn.widgetType;
  // let widgetSource = optIn.widgetSource;
  // // -------------------------------------------------------------------
  // // get data from the server for a given telescope
  // // -------------------------------------------------------------------
  // this.askTelData = function(optIn) {
  //   if(sock.conStat.isOffline()) return;
  //   let data         = {};
  //   data.widgetId = widgetId;
  //   data.telId    = optIn.telId;
  //   data.propId   = optIn.propId;
  //   let dataEmit = {
  //     "widgetSource":widgetSource, "widgetName":widgetType, "widgetId":widgetId,
  //     "methodName":"commentNightSchedAskTelData",
  //     "methodArgs":data
  //   };
  //   sock.socket.emit("widget", dataEmit);
  //   return;
  // }
}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// here we go with the content of this particular widget
// -------------------------------------------------------------------
let mainCommentNightSched = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  // let myUniqueId = unique()
  let widgetType = optIn.widgetType
  let tagBlockQueue = 'blockQueue'
  let tagArrZoomerPlotsSvg = optIn.baseName

  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV

  let shared = {
    data: {
      server: undefined,
      copy: [],
      current: 0
    },
    focus: {
      schedBlocks: undefined,
      block: undefined
    }
  }
  let svg = {}
  let box = {}
  let lenD = {}

  let com = {}

  let filters = { states: [], errors: [] }
  let tokens = { blockState: {}, blockError: {} }
  let filteredTokens = { blockState: {}, blockError: {} }

  let blockQueueServer = null
  let blockFilters = null

  let eventQueue = new EventQueue()

  // let thisCommentNightSched = this
  // let isSouth = window.__nsType__ === 'S'

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

  // function loop
  let runLoop = new RunLoop({ tag: widgetId })

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function createDummyLog () {
    function shuffle (a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }
    com.logs = []
    let categories = [
      'cat1',
      'cat2',
      'cat3',
      'cat4',
      'cat5',
      'cat6',
      'cat7',
      'cat8',
      'cat9'
    ]
    let linkto = ['block', 'tel', 'event']
    for (var i = 0; i < 100; i++) {
      shuffle(categories)
      shuffle(linkto)
      let categ = []
      let linkt = []
      for (let j = 0; j < Math.floor(Math.random() * 4) + 1; j++) {
        categ.push(categories[j])
      }
      for (let j = 0; j < Math.floor(Math.random() * 3); j++) {
        linkt.push(linkto[j])
      }
      com.logs.push({
        id: 'log_' + i + Math.floor(Math.random() * 1000),
        name: 'log_' + i + Math.floor(Math.random() * 1000),
        description:
          'description description description description description description description description description description description description',
        categories: categ,
        info: [
          {
            action: 'creation',
            author: 'system',
            date: '27/02/2019'
          },
          {
            action: 'modification',
            author: 'system',
            date: '27/02/2019'
          },
          {
            action: 'modification',
            author: 'system',
            date: '27/02/2019'
          },
          {
            action: 'modification',
            author: 'system',
            date: '27/02/2019'
          }
        ],
        linkedTo: linkt
      })
    }
  }
  function addDummyLog () {
    shared.data.server.logs = com.logs
  }
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

      com.svgZoomNode = svg.svg.nodes()[0]
      svg.back = svg.svg.append('g')
      svg.g = svg.svg.append('g')

      let defs = svg.svg.append('defs')
      // create filter with id #drop-shadow
      // height=130% so that the shadow is not clipped
      let filter = defs
        .append('filter')
        .attr('id', 'drop-shadow')
        .attr('height', '120%')

      // SourceAlpha refers to opacity of graphic that this filter will be applied to
      // convolve that with a Gaussian with standard deviation 3 and store result
      // in blur
      filter
        .append('feGaussianBlur')
        .attr('in', 'SourceAlpha')
        .attr('stdDeviation', 2.5)
        .attr('result', 'blur')

      // translate output of Gaussian blur to the right and downwards with 2px
      // store result in offsetBlur
      filter
        .append('feOffset')
        .attr('in', 'blur')
        .attr('dx', -1)
        .attr('dy', 1)
        .attr('result', 'offsetBlur')

      // overlay original SourceGraphic over translated blurred opacity by using
      // feMerge filter. Order of specifying inputs is important!
      let feMerge = filter.append('feMerge')
      feMerge.append('feMergeNode').attr('in', 'offsetBlur')
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic')
    }
    function initBackground () {
      svg.svg.style('background', '#444444') // colorTheme.bright.background)

      // svg.back.append('rect')
      //   .attr('x', -lenD.w[0] * 0.1)
      //   .attr('y', lenD.h[0] * 0.005)
      //   .attr('width', lenD.w[0] * 0.59)
      //   .attr('height', lenD.h[0] * 0.475 + lenD.h[0] * 0.0)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)
      //   .attr('rx', 0)
      // svg.back.append('text')
      //   .text('Scheduling blocks & Events')
      //   .style('fill', colorTheme.medium.text)
      //   // .style('stroke', colorTheme.medium.text)
      //   // .style('stroke-size', 0.1)
      //   .style('font-weight', '')
      //   .style('font-size', '10px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(' + ((-lenD.w[0] * 0.15 + lenD.w[0] * 0.59) * 0.5) + ',' + (lenD.h[0] * 0.03) + ')')
      // // svg.back.append('rect')
      // //   .attr('x', lenD.w[0] * 0.54 * 0.5 - lenD.w[0] * 0.05)
      // //   .attr('y', lenD.h[0] * 0.025 - lenD.h[0] * 0.015)
      // //   .attr('width', lenD.w[0] * 0.1)
      // //   .attr('height', lenD.h[0] * 0.03)
      // //   .attr('fill', colorTheme.medium.background)
      // //   .attr('stroke', '#000000')
      // //   .attr('stroke-width', 0.6)
      // //   .attr('rx', 2)
      // svg.back.append('rect')
      //   .attr('x', -lenD.w[0] * 0.1)
      //   .attr('y', lenD.h[0] * 0.487)
      //   .attr('width', lenD.w[0] * 0.59)
      //   .attr('height', lenD.h[0] * 0.405)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)
      //   .attr('rx', 0)
      // svg.back.append('text')
      //   .text('Telescopes')
      //   .style('fill', colorTheme.medium.text)
      //   .style('font-weight', '')
      //   .style('font-size', '10px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(' + ((-lenD.w[0] * 0.15 + lenD.w[0] * 0.59) * 0.5) + ',' + (lenD.h[0] * 0.51) + ')')
      // // svg.back.append('rect')
      // //   .attr('x', lenD.w[0] * 0.54 * 0.5 - lenD.w[0] * 0.05)
      // //   .attr('y', lenD.h[0] * 0.5 - lenD.h[0] * 0.0125)
      // //   .attr('width', lenD.w[0] * 0.1)
      // //   .attr('height', lenD.h[0] * 0.025)
      // //   .attr('fill', colorTheme.medium.background)
      // //   .attr('stroke', colorTheme.medium.stroke)
      // //   .attr('stroke-width', 0.4)
      // svg.back.append('rect')
      //   .attr('x', -lenD.w[0] * 0.1)
      //   .attr('y', lenD.h[0] * 0.9)
      //   .attr('width', lenD.w[0] * 0.59)
      //   .attr('height', lenD.h[0] * 0.1)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)
      //   .attr('rx', 0)
      //
      // svg.back.append('rect')
      //   .attr('x', lenD.w[0] * 0.493)
      //   .attr('y', lenD.h[0] * 0)
      //   .attr('width', lenD.w[0] * 0.507)
      //   .attr('height', lenD.h[0] * 1)
      //   .attr('fill', colorTheme.medium.background)
      //   .attr('stroke', '#000000')
      //   .attr('stroke-width', 0.2)
    }
    function initBox () {
      let marg = lenD.w[0] * 0.01
      box.log = {
        x: lenD.w[0] * 0 + marg,
        y: lenD.h[0] * 0.0 + marg,
        w: lenD.w[0] * 0.5 - 2 * marg,
        h: lenD.h[0] * 1 - 2 * marg,
        marg: marg
      }
      box.logFields = {
        x: box.log.x * 0.0 + box.log.w * 0.25,
        y: box.log.y * 0.0 + box.log.h * 0.0,
        w: box.log.w * 0.75,
        h: box.log.h * 0.7,
        marg: box.log.marg
      }
      box.logHistory = {
        x: box.log.x * 0.0 + box.log.w * 0.01,
        y: box.log.y * 0.0 + marg,
        w: box.log.w * 0.24,
        h: box.log.h * 0.89,
        marg: box.log.marg
      }
      // box.logCategories = {
      //   x: box.log.x * 0.0 + box.log.w * 0.5,
      //   y: box.log.y * 0.0 + box.log.w * 0.1,
      //   w: box.log.w * 0.25,
      //   h: box.log.h * 0.3,
      //   marg: box.log.marg
      // }
      // box.logText = {
      //   x: box.log.x * 0.0 + box.log.w * 0.0,
      //   y: box.log.y * 0.0 + box.log.w * 0.1,
      //   w: box.log.w * 0.5,
      //   h: box.log.h * 0.9,
      //   marg: box.log.marg
      // }
      box.logAssociatedElement = {
        x: box.log.w * 0.575,
        y: box.log.h * 0.7,
        w: box.log.w * 0.4,
        h: box.log.h * 0.275,
        marg: box.log.marg
      }
      box.logInfo = {
        x: box.log.w * 0.275,
        y: box.log.h * 0.7,
        w: box.log.w * 0.275,
        h: box.log.h * 0.275,
        marg: box.log.marg
      }

      box.rightPanel = {
        x: lenD.w[0] * 0.5,
        y: lenD.h[0] * 0.0,
        w: lenD.w[0] * 0.5,
        h: lenD.h[0] * 1.0,
        marg: lenD.w[0] * 0.01
      }
      box.blockQueueServer = box.rightPanel
      box.blockQueueServerIcon = {
        x: box.blockQueueServer.w * 0.02,
        y: marg,
        w: box.blockQueueServer.w * 0.05,
        h: box.blockQueueServer.h * 0.05,
        marg: box.blockQueueServer.marg
      }
      box.blockQueueServerTab = {
        x: box.blockQueueServer.w * 0.225,
        y: box.blockQueueServer.h * 0.175,
        w: box.blockQueueServer.w * 0.05,
        h: box.blockQueueServer.h * 0.05,
        marg: box.blockQueueServer.marg
      }
      box.blockQueueServerTitle = {
        x: box.blockQueueServer.w * 0.1,
        y: box.blockQueueServer.h * 0.0,
        w: box.blockQueueServer.w * 0.8,
        h: box.blockQueueServer.h * 0.1,
        marg: box.blockQueueServer.marg
      }
      box.blockQueueServerFilter = {
        x: box.blockQueueServer.w * 0.15,
        y: box.blockQueueServer.h * 0.1,
        w: box.blockQueueServer.w * 0.8,
        h: box.blockQueueServer.h * 0.4,
        marg: box.blockQueueServer.marg
      }
      box.blockQueueServerContent = {
        x: box.blockQueueServer.marg * 3,
        y: box.blockQueueServer.h * 0.575,
        w: box.blockQueueServer.w * 0.85,
        h: box.blockQueueServer.h * 0.35,
        marg: box.blockQueueServer.marg
      }

      box.eventQueueServer = box.rightPanel
      box.eventQueueServerIcon = {
        x: box.blockQueueServer.w * 0.02,
        y: box.blockQueueServer.h * 0.05 + marg * 2,
        w: box.blockQueueServer.w * 0.05,
        h: box.blockQueueServer.h * 0.05,
        marg: box.eventQueueServer.marg
      }
      box.eventQueueServerTab = {
        x: box.eventQueueServer.w * 0.225,
        y: box.eventQueueServer.h * 0.175,
        w: box.eventQueueServer.w * 0.05,
        h: box.eventQueueServer.h * 0.05,
        marg: box.eventQueueServer.marg
      }
      box.eventQueueServerTitle = {
        x: box.eventQueueServer.w * 0.0,
        y: box.eventQueueServer.h * 0.0,
        w: box.eventQueueServer.w * 0.8,
        h: box.eventQueueServer.h * 0.1,
        marg: box.eventQueueServer.marg
      }
      box.eventQueueServerFilter = {
        x: box.eventQueueServer.w * 0.05,
        y: box.eventQueueServer.h * 0.1,
        w: box.eventQueueServer.w * 0.71,
        h: box.eventQueueServer.h * 0.4,
        marg: box.eventQueueServer.marg
      }
      box.eventQueueServerContent = {
        x: box.eventQueueServer.marg * 3,
        y: box.eventQueueServer.h * 0.575,
        w: box.eventQueueServer.w * 0.85,
        h: box.eventQueueServer.h * 0.35,
        marg: box.eventQueueServer.marg
      }

      box.telsQueueServer = box.rightPanel
      box.telsQueueServerIcon = {
        x: box.blockQueueServer.w * 0.02,
        y: box.blockQueueServer.h * 0.05 * 2 + marg * 3,
        w: box.blockQueueServer.w * 0.05,
        h: box.blockQueueServer.h * 0.05,
        marg: box.telsQueueServer.marg
      }
      box.telsQueueServerTab = {
        x: box.telsQueueServer.w * 0.225,
        y: box.telsQueueServer.h * 0.175,
        w: box.telsQueueServer.w * 0.05,
        h: box.telsQueueServer.h * 0.05,
        marg: box.telsQueueServer.marg
      }
      box.telsQueueServerTitle = {
        x: box.telsQueueServer.w * 0.0,
        y: box.telsQueueServer.h * 0.0,
        w: box.telsQueueServer.w * 0.8,
        h: box.telsQueueServer.h * 0.1,
        marg: box.telsQueueServer.marg
      }
      box.telsQueueServerFilter = {
        x: box.telsQueueServer.w * 0.05,
        y: box.telsQueueServer.h * 0.1,
        w: box.telsQueueServer.w * 0.71,
        h: box.telsQueueServer.h * 0.4,
        marg: box.telsQueueServer.marg
      }
      box.telsQueueServerContent = {
        x: box.telsQueueServer.marg * 3,
        y: box.telsQueueServer.h * 0.575,
        w: box.telsQueueServer.w * 0.85,
        h: box.telsQueueServer.h * 0.35,
        marg: box.telsQueueServer.marg
      }

      box.daqQueueServer = box.rightPanel
      box.daqQueueServerIcon = {
        x: box.blockQueueServer.w * 0.02,
        y: box.blockQueueServer.h * 0.05 + marg * 2,
        w: box.blockQueueServer.w * 0.05,
        h: box.blockQueueServer.h * 0.05,
        marg: box.daqQueueServer.marg
      }
      box.daqQueueServerTab = {
        x: box.daqQueueServer.w * 0.225,
        y: box.daqQueueServer.h * 0.175,
        w: box.daqQueueServer.w * 0.05,
        h: box.daqQueueServer.h * 0.05,
        marg: box.daqQueueServer.marg
      }
      box.daqQueueServerTitle = {
        x: box.daqQueueServer.w * 0.0,
        y: box.daqQueueServer.h * 0.0,
        w: box.daqQueueServer.w * 0.8,
        h: box.daqQueueServer.h * 0.1,
        marg: box.daqQueueServer.marg
      }
      box.daqQueueServerFilter = {
        x: box.daqQueueServer.w * 0.05,
        y: box.daqQueueServer.h * 0.1,
        w: box.daqQueueServer.w * 0.71,
        h: box.daqQueueServer.h * 0.4,
        marg: box.daqQueueServer.marg
      }
      box.daqQueueServerContent = {
        x: box.daqQueueServer.marg * 3,
        y: box.daqQueueServer.h * 0.575,
        w: box.daqQueueServer.w * 0.85,
        h: box.daqQueueServer.h * 0.35,
        marg: box.daqQueueServer.marg
      }

      box.telescopes = {
        x: lenD.w[0] * 0.5,
        y: lenD.h[0] * 0.56,
        w: lenD.w[0] * 0.48,
        h: lenD.h[0] * 0.5,
        marg: lenD.w[0] * 0.01
      }
      box.clock = {
        x: lenD.w[0] * 0.002,
        y: lenD.h[0] * 0.92,
        w: lenD.w[0] * 0.485,
        h: lenD.h[0] * 0.05,
        marg: lenD.w[0] * 0.01
      }
    }
    function initDefaultStyle () {
      shared.style = {}
      shared.style.runRecCol = colsBlues[2]
      shared.style.blockCol = function (optIn) {
        let endTime = hasVar(optIn.endTime) ? optIn.endTime : undefined
        if (endTime < Number(shared.data.server.timeOfNight.now)) { return colorTheme.blocks.shutdown }

        let state = hasVar(optIn.exeState.state)
          ? optIn.exeState.state
          : undefined
        console.log(state)
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

    sock.setBadgeIcon({ nIcon: dataIn.nIcon, iconDivV: iconDivV })

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

    com.dataIn = dataIn
    shared.data.server = dataIn.data
    createDummyLog()
    addDummyLog()

    svgTextEditor.initData(dataIn.data)
    svgBlocksQueueServer.initData(dataIn.data)
    svgEvents.initData(dataIn.data)
    svgTelescopes.initData(dataIn.data)
    // svgDAQ.initData()
    // svgBottomInfo.initData(dataIn.data)
  }
  this.initData = initData

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function updateData (dataIn) {
    com.dataIn = dataIn
    shared.data.server = dataIn.data
    addDummyLog()

    // clusterData(com.dataIn.data)
    // filterData(com.dataIn.data)

    svgBlocksQueueServer.updateData()
    svgEvents.updateData(dataIn.data)
    // svgTelescopes.updateData(dataIn.data)
    // svgFilterBlocks.updateData(dataIn.data)
    // svgMiddleInfo.updateData(dataIn.data)
    // svgBottomInfo.updateData(dataIn.data)
  }
  this.updateData = updateData

  function clusterData (dataIn) {
    tokens.blockState = {}
    tokens.blockError = {}
    for (var i = 0; i < dataIn.blocks.done.length; i++) {
      if (hasVar(tokens.blockState[dataIn.blocks.done[i].exeState.state])) {
        if (
          !tokens.blockState[dataIn.blocks.done[i].exeState.state].includes(
            dataIn.blocks.done[i].obId
          )
        ) {
          tokens.blockState[dataIn.blocks.done[i].exeState.state].push(
            dataIn.blocks.done[i].obId
          )
        }
      } else {
        tokens.blockState[dataIn.blocks.done[i].exeState.state] = [
          dataIn.blocks.done[i].obId
        ]
      }

      if (
        dataIn.blocks.done[i].exeState.state === 'cancel' ||
        dataIn.blocks.done[i].exeState.state === 'fail'
      ) {
        if (hasVar(tokens.blockError[dataIn.blocks.done[i].exeState.error])) {
          if (
            !tokens.blockError[dataIn.blocks.done[i].exeState.error].includes(
              dataIn.blocks.done[i].obId
            )
          ) {
            tokens.blockError[dataIn.blocks.done[i].exeState.error].push(
              dataIn.blocks.done[i].obId
            )
          }
        } else {
          tokens.blockError[dataIn.blocks.done[i].exeState.error] = [
            dataIn.blocks.done[i].obId
          ]
        }
      }
    }
  }
  function checkWithErrorsFilters (block) {
    if (filters.errors.length === 0) return true
    for (let i = 0; i < filters.errors.length; i++) {
      if (filters.errors[i].id === block.error) return true
    }
    return false
  }
  function checkWithStatesFilters (block) {
    if (filters.states.length === 0) return true
    for (let i = 0; i < filters.states.length; i++) {
      if (filters.states[i].id === block.state) return true
    }
    return false
  }
  function filterData (dataIn) {
    filteredTokens.blockState = {}
    filteredTokens.blockError = {}
    for (var i = 0; i < dataIn.blocks.done.length; i++) {
      if (checkWithErrorsFilters(dataIn.blocks.done[i].exeState)) {
        if (
          hasVar(
            filteredTokens.blockState[dataIn.blocks.done[i].exeState.state]
          )
        ) {
          if (
            !filteredTokens.blockState[
              dataIn.blocks.done[i].exeState.state
            ].includes(dataIn.blocks.done[i].obId)
          ) {
            filteredTokens.blockState[
              dataIn.blocks.done[i].exeState.state
            ].push(dataIn.blocks.done[i].obId)
          }
        } else {
          filteredTokens.blockState[dataIn.blocks.done[i].exeState.state] = [
            dataIn.blocks.done[i].obId
          ]
        }
      }

      if (checkWithStatesFilters(dataIn.blocks.done[i].exeState)) {
        if (
          dataIn.blocks.done[i].exeState.state === 'cancel' ||
          dataIn.blocks.done[i].exeState.state === 'fail'
        ) {
          if (
            hasVar(
              filteredTokens.blockError[dataIn.blocks.done[i].exeState.error]
            )
          ) {
            if (
              !filteredTokens.blockError[
                dataIn.blocks.done[i].exeState.error
              ].includes(dataIn.blocks.done[i].obId)
            ) {
              filteredTokens.blockError[
                dataIn.blocks.done[i].exeState.error
              ].push(dataIn.blocks.done[i].obId)
            }
          } else {
            filteredTokens.blockError[dataIn.blocks.done[i].exeState.error] = [
              dataIn.blocks.done[i].obId
            ]
          }
        }
      }
    }
  }
  function extractTargets () {
    let t = []
    for (let key in shared.data.server.blocks) {
      let arr = shared.data.server.blocks[key]
      for (let i = 0; i < arr.length; i++) {
        if (t.indexOf(arr[i].targetId) === -1) t.push(arr[i].targetId)
      }
    }
    return t
  }

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function syncStateSend (dataIn) {
    if (sock.conStat.isOffline()) return

    sock.sockSyncStateSend({
      widgetId: widgetId,
      type: dataIn.type,
      data: dataIn
    })
  }

  // -------------------------------------------------------------------
  let SvgTextEditor = function () {
    let reserved = {
      main: {
        g: undefined,
        box: {}
      }
    }

    // function initinputHistory () {
    //   function initLocalHistory () {
    //     reserved.inputHistory.local.scroll.scrollBoxG = reserved.inputHistory.local.g.append('g')
    //     let historyBox = reserved.inputHistory.local.box
    //     reserved.inputHistory.local.scroll.scrollBoxG.append('rect')
    //       .attr('x', historyBox.x)
    //       .attr('y', historyBox.y)
    //       .attr('width', historyBox.w)
    //       .attr('height', historyBox.h)
    //       .attr('fill', colorTheme.dark.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //
    //     reserved.inputHistory.local.scroll.scrollBox = new ScrollBox()
    //     reserved.inputHistory.local.scroll.scrollBox.init({
    //       tag: 'inputHistoryScrollBox',
    //       gBox: reserved.inputHistory.local.scroll.scrollBoxG,
    //       boxData: {
    //         x: historyBox.x,
    //         y: historyBox.y,
    //         w: historyBox.w,
    //         h: historyBox.h,
    //         marg: 0
    //       },
    //       useRelativeCoords: true,
    //       locker: new Locker(),
    //       lockerV: [widgetId + 'updateData'],
    //       lockerZoom: {
    //         all: 'ScrollBox' + 'zoom',
    //         during: 'ScrollBox' + 'zoomDuring',
    //         end: 'ScrollBox' + 'zoomEnd'
    //       },
    //       runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
    //       canScroll: true,
    //       scrollVertical: true,
    //       scrollHorizontal: false,
    //       scrollHeight: 0.1 + historyBox.h,
    //       scrollWidth: 0,
    //       background: 'transparent',
    //       scrollRecH: {h: 2},
    //       scrollRecV: {w: 2}
    //     })
    //     reserved.inputHistory.local.scroll.scrollG = reserved.inputHistory.local.scroll.scrollBox.get('innerG')
    //   }
    //   function initGeneralHistory () {
    //     reserved.inputHistory.general.scroll.scrollBoxG = reserved.inputHistory.general.g.append('g')
    //     let historyBox = reserved.inputHistory.general.box
    //     reserved.inputHistory.general.scroll.scrollBoxG.append('rect')
    //       .attr('x', historyBox.x)
    //       .attr('y', historyBox.y)
    //       .attr('width', historyBox.w)
    //       .attr('height', historyBox.h)
    //       .attr('fill', colorTheme.dark.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //
    //     reserved.inputHistory.general.scroll.scrollBox = new ScrollBox()
    //     reserved.inputHistory.general.scroll.scrollBox.init({
    //       tag: 'inputHistoryScrollBox',
    //       gBox: reserved.inputHistory.general.scroll.scrollBoxG,
    //       boxData: {
    //         x: historyBox.x,
    //         y: historyBox.y,
    //         w: historyBox.w,
    //         h: historyBox.h,
    //         marg: 0
    //       },
    //       useRelativeCoords: true,
    //       locker: new Locker(),
    //       lockerV: [widgetId + 'updateData'],
    //       lockerZoom: {
    //         all: 'ScrollBox' + 'zoom',
    //         during: 'ScrollBox' + 'zoomDuring',
    //         end: 'ScrollBox' + 'zoomEnd'
    //       },
    //       runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
    //       canScroll: true,
    //       scrollVertical: true,
    //       scrollHorizontal: false,
    //       scrollHeight: 0.1 + historyBox.h,
    //       scrollWidth: 0,
    //       background: 'transparent',
    //       scrollRecH: {h: 2},
    //       scrollRecV: {w: 2}
    //     })
    //     reserved.inputHistory.general.scroll.scrollG = reserved.inputHistory.general.scroll.scrollBox.get('innerG')
    //   }
    //
    //   reserved.inputHistory.main.g.attr('transform', 'translate(' + reserved.inputHistory.main.box.x + ',' + reserved.inputHistory.main.box.y + ')')
    //   reserved.inputHistory.main.g.append('text')
    //     .text('Operators operations :')
    //     .attr('x', 2)
    //     .attr('y', 0 - reserved.inputHistory.main.box.h * 0.03)
    //     .style('fill', colorTheme.medium.text)
    //     .style('font-weight', '')
    //     .style('font-size', '8px')
    //     .attr('text-anchor', 'start')
    //   reserved.inputHistory.main.g.append('line')
    //     .attr('x1', 2)
    //     .attr('y1', 0 - reserved.inputHistory.main.box.h * 0.02)
    //     .attr('x2', reserved.inputHistory.main.box.w * 0.9)
    //     .attr('y2', 0 - reserved.inputHistory.main.box.h * 0.02)
    //     .attr('stroke-width', 0.4)
    //     .attr('stroke', colorTheme.medium.stroke)
    //
    //   reserved.inputHistory.general = {
    //     g: reserved.inputHistory.main.g.append('g'),
    //     box: {
    //       x: 0,
    //       y: reserved.inputHistory.main.box.h * 0.0,
    //       w: reserved.inputHistory.main.box.w * 1,
    //       h: reserved.inputHistory.main.box.h * 0.49
    //     },
    //     scroll: {}
    //   }
    //   reserved.inputHistory.local = {
    //     g: reserved.inputHistory.main.g.append('g'),
    //     box: {
    //       x: reserved.inputHistory.main.box.w * 0.3,
    //       y: reserved.inputHistory.main.box.h * 0.51,
    //       w: reserved.inputHistory.main.box.w * 0.7,
    //       h: reserved.inputHistory.main.box.h * 0.49
    //     },
    //     scroll: {}
    //   }
    //   initGeneralHistory()
    //   initLocalHistory()
    // }
    // function initOnlineOperator () {
    //   reserved.onlineOperator.main.g.attr('transform', 'translate(' + reserved.onlineOperator.main.box.x + ',' + reserved.onlineOperator.main.box.y + ')')
    //   reserved.onlineOperator.main.g.append('text')
    //     .text('Operators online :')
    //     .attr('x', 2)
    //     .attr('y', 0 - reserved.onlineOperator.main.box.h * 0.03)
    //     .style('fill', colorTheme.medium.text)
    //     .style('font-weight', '')
    //     .style('font-size', '8px')
    //     .attr('text-anchor', 'start')
    //   reserved.onlineOperator.main.g.append('line')
    //     .attr('x1', 2)
    //     .attr('y1', 0 - reserved.onlineOperator.main.box.h * 0.02)
    //     .attr('x2', reserved.onlineOperator.main.box.w * 0.9)
    //     .attr('y2', 0 - reserved.onlineOperator.main.box.h * 0.02)
    //     .attr('stroke-width', 0.4)
    //     .attr('stroke', colorTheme.medium.stroke)
    //
    //   let op = reserved.onlineOperator.main.g.selectAll('g.operators')
    //     .data([{icon: 'A', name: 'Anna'}, {icon: 'B', name: 'Bob'}, {icon: 'C', name: 'Connor'}])
    //   let opEnter = op.enter()
    //     .append('g')
    //     .attr('class', 'operators')
    //     .attr('transform', function (d, i) {
    //       let tx = reserved.onlineOperator.main.box.w * 0.1
    //       let ty = 0 + reserved.onlineOperator.main.box.w * 0.25 * (i)
    //       return 'translate(' + tx + ',' + ty + ')'
    //     })
    //   opEnter.each(function (d) {
    //     d3.select(this).append('rect')
    //       .attr('x', 0)
    //       .attr('y', 0)
    //       .attr('width', reserved.onlineOperator.main.box.w * 0.2)
    //       .attr('height', reserved.onlineOperator.main.box.w * 0.2)
    //       .attr('stroke', '#000000')
    //       .attr('stroke-width', 0.2)
    //       .attr('fill', colorTheme.dark.background)
    //     d3.select(this).append('text')
    //       .text(d.icon)
    //       .attr('x', reserved.onlineOperator.main.box.w * 0.1)
    //       .attr('y', reserved.onlineOperator.main.box.w * 0.1)
    //       .attr('dy', 3)
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //     d3.select(this).append('text')
    //       .text(d.name)
    //       .attr('x', reserved.onlineOperator.main.box.w * 0.3)
    //       .attr('y', reserved.onlineOperator.main.box.w * 0.1)
    //       .attr('dy', 3)
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'start')
    //   })
    // }
    // function initFocusedItemHeader () {
    //   reserved.focusedItemHeader.main.g.append('text')
    //     .text('No element on focus')
    //     .style('fill', colorTheme.medium.text)
    //     .style('font-weight', '')
    //     .style('font-size', '14px')
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', 'translate(' +
    //       (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.5) +
    //       ',' +
    //       (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.6) + ')')
    //   reserved.focusedItemHeader.main.g.append('text')
    //     .text('X')
    //     .style('fill', colorTheme.medium.text)
    //     .style('font-weight', 'bold')
    //     .style('font-size', '14px')
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', 'translate(' +
    //       (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.15) +
    //       ',' +
    //       (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.9) + ')')
    //   reserved.focusedItemHeader.main.g.append('text')
    //     .text('X')
    //     .style('fill', colorTheme.medium.text)
    //     .style('font-weight', 'bold')
    //     .style('font-size', '14px')
    //     .attr('text-anchor', 'middle')
    //     .attr('transform', 'translate(' +
    //       (reserved.focusedItemHeader.main.box.x + reserved.focusedItemHeader.main.box.w * 0.85) +
    //       ',' +
    //       (reserved.focusedItemHeader.main.box.y + reserved.focusedItemHeader.main.box.h * 0.9) + ')')
    // }
    // function initFocusedItemInfo () {
    //   function initFocusPreview () {
    //     reserved.focusedItemInfo.preview.g.append('rect')
    //       .attr('x', reserved.focusedItemInfo.preview.box.x)
    //       .attr('y', reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.0)
    //       .attr('width', reserved.focusedItemInfo.preview.box.h * 1)
    //       .attr('height', reserved.focusedItemInfo.preview.box.h * 1)
    //       .attr('fill', colorTheme.medium.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 1.5)
    //     reserved.focusedItemInfo.preview.g = reserved.focusedItemInfo.preview.g.append('g')
    //     reserved.focusedItemInfo.preview.g.append('text')
    //       .text('Preview')
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //       .attr('transform', 'translate(' +
    //         (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
    //         ',' +
    //         (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.25) + ')')
    //     reserved.focusedItemInfo.preview.g.append('text')
    //       .text('of')
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //       .attr('transform', 'translate(' +
    //         (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
    //         ',' +
    //         (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.4) + ')')
    //     reserved.focusedItemInfo.preview.g.append('text')
    //       .text('Block /')
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //       .attr('transform', 'translate(' +
    //         (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
    //         ',' +
    //         (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.55) + ')')
    //     reserved.focusedItemInfo.preview.g.append('text')
    //       .text('Telescope /')
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //       .attr('transform', 'translate(' +
    //         (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
    //         ',' +
    //         (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.7) + ')')
    //     reserved.focusedItemInfo.preview.g.append('text')
    //       .text('...')
    //       .style('fill', colorTheme.medium.text)
    //       .style('font-weight', '')
    //       .style('font-size', '9px')
    //       .attr('text-anchor', 'middle')
    //       .attr('transform', 'translate(' +
    //         (reserved.focusedItemInfo.preview.box.x + reserved.focusedItemInfo.preview.box.w * 0.5) +
    //         ',' +
    //         (reserved.focusedItemInfo.preview.box.y + reserved.focusedItemInfo.preview.box.h * 0.85) + ')')
    //   }
    //   function initFocusFields () {
    //     reserved.focusedItemInfo.fields.scroll.scrollBoxG = reserved.focusedItemInfo.fields.g.append('g')
    //     let historyBox = reserved.focusedItemInfo.fields.box
    //     reserved.focusedItemInfo.fields.scroll.scrollBoxG.append('rect')
    //       .attr('x', historyBox.x)
    //       .attr('y', historyBox.y)
    //       .attr('width', historyBox.w)
    //       .attr('height', historyBox.h)
    //       .attr('fill', colorTheme.dark.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //
    //     reserved.focusedItemInfo.fields.scroll.scrollBox = new ScrollBox()
    //     reserved.focusedItemInfo.fields.scroll.scrollBox.init({
    //       tag: 'inputHistoryScrollBox',
    //       gBox: reserved.focusedItemInfo.fields.scroll.scrollBoxG,
    //       boxData: {
    //         x: historyBox.x,
    //         y: historyBox.y,
    //         w: historyBox.w,
    //         h: historyBox.h,
    //         marg: 0
    //       },
    //       useRelativeCoords: true,
    //       locker: new Locker(),
    //       lockerV: [widgetId + 'updateData'],
    //       lockerZoom: {
    //         all: 'ScrollBox' + 'zoom',
    //         during: 'ScrollBox' + 'zoomDuring',
    //         end: 'ScrollBox' + 'zoomEnd'
    //       },
    //       runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
    //       canScroll: true,
    //       scrollVertical: true,
    //       scrollHorizontal: false,
    //       scrollHeight: 0.1 + historyBox.h,
    //       scrollWidth: 0,
    //       background: 'transparent',
    //       scrollRecH: {h: 6},
    //       scrollRecV: {w: 6}
    //     })
    //     reserved.focusedItemInfo.info.scroll.scrollG = reserved.focusedItemInfo.fields.scroll.scrollBox.get('innerG')
    //
    //     let dimField = {
    //       w: reserved.focusedItemInfo.fields.box.w,
    //       h: reserved.focusedItemInfo.fields.box.h * 0.1,
    //       margW: 0, // reserved.focusedItemInfo.focusFields.box.w * 0.04,
    //       margH: 0 // reserved.focusedItemInfo.focusFields.box.h * 0.04
    //     }
    //     let fields = reserved.focusedItemInfo.info.g.selectAll('g.fields')
    //       .data([{name: 'A'}, {name: 'B'}, {name: 'C'}, {name: 'D'}, {name: 'E'}, {name: 'F'}, {name: 'G'}, {name: 'H'}])
    //     let fieldsEnter = fields.enter()
    //       .append('g')
    //       .attr('class', 'fields')
    //       .attr('transform', function (d, i) {
    //         let tx = reserved.focusedItemInfo.info.box.x + dimField.margW * ((i % 4) + 1) + (dimField.w * (i % 4))
    //         let ty = reserved.focusedItemInfo.info.box.y + dimField.margH * (parseInt(i / 4) + 1) + (dimField.h * parseInt(i / 4))
    //         return 'translate(' + tx + ',' + ty + ')'
    //       })
    //     fieldsEnter.each(function (d) {
    //       d3.select(this).append('rect')
    //         .attr('x', 0)
    //         .attr('y', 0)
    //         .attr('width', dimField.w)
    //         .attr('height', dimField.h)
    //         .attr('stroke', '#000000')
    //         .attr('stroke-width', 0.2)
    //         .attr('fill', colorTheme.dark.background)
    //       // d3.select(this).append('text')
    //       //   .text(d.name)
    //       //   .attr('x', 0)
    //       //   .attr('y', 2)
    //       //   .style('fill', colorTheme.medium.text)
    //       //   .style('font-weight', '')
    //       //   .style('font-size', '7px')
    //       //   .attr('text-anchor', 'middle')
    //     })
    //   }
    //   function initFocusInfo () {
    //     reserved.focusedItemInfo.info.scroll.scrollBoxG = reserved.focusedItemInfo.info.g.append('g')
    //     reserved.focusedItemInfo.info.scroll.scrollBoxG.append('rect')
    //       .attr('x', reserved.focusedItemInfo.info.box.x)
    //       .attr('y', reserved.focusedItemInfo.info.box.y)
    //       .attr('width', reserved.focusedItemInfo.info.box.w)
    //       .attr('height', reserved.focusedItemInfo.info.box.h)
    //       .attr('fill', colorTheme.dark.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //
    //     let historyBox = reserved.focusedItemInfo.info.box
    //     reserved.focusedItemInfo.info.scroll.scrollBoxG.append('rect')
    //       .attr('x', historyBox.x)
    //       .attr('y', historyBox.y)
    //       .attr('width', historyBox.w)
    //       .attr('height', historyBox.h)
    //       .attr('fill', colorTheme.dark.background)
    //       .attr('stroke', colorTheme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //
    //     reserved.focusedItemInfo.info.scroll.scrollBox = new ScrollBox()
    //     reserved.focusedItemInfo.info.scroll.scrollBox.init({
    //       tag: 'inputHistoryScrollBox',
    //       gBox: reserved.focusedItemInfo.info.scroll.scrollBoxG,
    //       boxData: {
    //         x: historyBox.x,
    //         y: historyBox.y,
    //         w: historyBox.w,
    //         h: historyBox.h,
    //         marg: 0
    //       },
    //       useRelativeCoords: true,
    //       locker: new Locker(),
    //       lockerV: [widgetId + 'updateData'],
    //       lockerZoom: {
    //         all: 'ScrollBox' + 'zoom',
    //         during: 'ScrollBox' + 'zoomDuring',
    //         end: 'ScrollBox' + 'zoomEnd'
    //       },
    //       runLoop: new RunLoop({tag: 'inputHistoryScrollBox'}),
    //       canScroll: true,
    //       scrollVertical: true,
    //       scrollHorizontal: false,
    //       scrollHeight: 0.1 + historyBox.h,
    //       scrollWidth: 0,
    //       background: 'transparent',
    //       scrollRecH: {h: 6},
    //       scrollRecV: {w: 6}
    //     })
    //     reserved.focusedItemInfo.info.scroll.scrollG = reserved.focusedItemInfo.info.scroll.scrollBox.get('innerG')
    //   }
    //   reserved.focusedItemInfo.main.g.attr('transform', 'translate(' + reserved.focusedItemInfo.main.box.x + ',' + reserved.focusedItemInfo.main.box.y + ')')
    //   reserved.focusedItemInfo.preview = {
    //     g: reserved.focusedItemInfo.main.g.append('g'),
    //     box: {
    //       x: 0,
    //       y: 0,
    //       w: reserved.focusedItemInfo.main.box.h * 0.325,
    //       h: reserved.focusedItemInfo.main.box.h * 0.325
    //     }
    //   }
    //   reserved.focusedItemInfo.fields = {
    //     g: reserved.focusedItemInfo.main.g.append('g'),
    //     box: {
    //       x: 0,
    //       y: 0 + reserved.focusedItemInfo.main.box.h * 0.35,
    //       w: reserved.focusedItemInfo.main.box.h * 0.325,
    //       h: reserved.focusedItemInfo.main.box.h * 0.65
    //     },
    //     scroll: {}
    //   }
    //   reserved.focusedItemInfo.info = {
    //     g: reserved.focusedItemInfo.main.g.append('g'),
    //     box: {
    //       x: 0 + reserved.focusedItemInfo.main.box.h * 0.35,
    //       y: 0,
    //       w: reserved.focusedItemInfo.main.box.w - (reserved.focusedItemInfo.main.box.h * 0.35),
    //       h: reserved.focusedItemInfo.main.box.h
    //     },
    //     scroll: {}
    //   }
    //   initFocusPreview()
    //   initFocusFields()
    //   initFocusInfo()
    // }
    // function initTextInput () {
    //   reserved.textInput.main.g.append('rect')
    //     .attr('x', reserved.textInput.main.box.x)
    //     .attr('y', reserved.textInput.main.box.y)
    //     .attr('width', reserved.textInput.main.box.w)
    //     .attr('height', reserved.textInput.main.box.h)
    //     .attr('fill', colorTheme.dark.background)
    //     .attr('stroke', colorTheme.dark.stroke)
    //     .attr('stroke-width', 0.2)
    // }
    function initAssociatedElement () {
      reserved.associatedElement.g.attr(
        'transform',
        'translate(' +
          reserved.associatedElement.box.x +
          ',' +
          reserved.associatedElement.box.y +
          ')'
      )

      reserved.associatedElement.g
        .append('rect')
        .attr('x', reserved.associatedElement.box.w * 0.0)
        .attr('y', reserved.associatedElement.box.h * 0.0)
        .attr('width', reserved.associatedElement.box.w * 1.0)
        .attr('height', reserved.associatedElement.box.h * 1.0)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0)
        .attr('opacity', 1)
        .on('mouseover', function () {
          // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
        })
        .on('mouseout', function () {
          // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
        })

      reserved.associatedElement.g
        .append('text')
        .text('Associated elements')
        .attr('x', reserved.associatedElement.box.w * 0.5)
        .attr('y', 10)
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '9px')
        .attr('text-anchor', 'middle')

      reserved.associatedElement.blocks.icon = reserved.associatedElement.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            reserved.associatedElement.box.w * 0.8 +
            ',' +
            reserved.associatedElement.box.h * 0.2 +
            ')'
        )
      reserved.associatedElement.blocks.icon
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.associatedElement.box.w * 0.11)
        .attr('height', reserved.associatedElement.box.w * 0.1)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
        .attr('opacity', 0)
        .on('mouseover', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('opacity', 1)
        })
        .on('mouseout', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('opacity', 0)
        })
      reserved.associatedElement.blocks.icon
        .append('svg:image')
        .attr('xlink:href', '/static/icons/blocks.svg')
        .attr('width', reserved.associatedElement.box.w * 0.075)
        .attr('height', reserved.associatedElement.box.w * 0.075)
        .attr('x', reserved.associatedElement.box.w * 0.01)
        .attr('y', reserved.associatedElement.box.h * 0.01)
        .style('pointer-events', 'none')
      // reserved.associatedElement.blocks.icon.append('text')
      //   .text('+')
      //   .style('font-size', '11px')
      //   .attr('x', reserved.associatedElement.box.w * 0.075)
      //   .attr('y', reserved.associatedElement.box.h * 0.145)
      //   .style('pointer-events', 'none')
      //   .style('pointer-events', 'none')

      reserved.associatedElement.events.icon = reserved.associatedElement.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            reserved.associatedElement.box.w * 0.8 +
            ',' +
            reserved.associatedElement.box.h * 0.45 +
            ')'
        )
      reserved.associatedElement.events.icon
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.associatedElement.box.w * 0.11)
        .attr('height', reserved.associatedElement.box.w * 0.1)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
        .attr('opacity', 0)
        .on('mouseover', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('opacity', 1)
        })
        .on('mouseout', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('opacity', 0)
        })
      reserved.associatedElement.events.icon
        .append('svg:image')
        .attr('xlink:href', '/static/icons/warning.svg')
        .attr('width', reserved.associatedElement.box.w * 0.08)
        .attr('height', reserved.associatedElement.box.w * 0.08)
        .attr('x', reserved.associatedElement.box.w * 0.01)
        .attr('y', reserved.associatedElement.box.h * 0.01)
        .style('pointer-events', 'none')
      // reserved.associatedElement.events.icon.append('text')
      //   .text('+')
      //   .style('font-size', '11px')
      //   .attr('x', reserved.associatedElement.box.w * 0.075)
      //   .attr('y', reserved.associatedElement.box.h * 0.145)
      //   .style('pointer-events', 'none')

      reserved.associatedElement.tels.icon = reserved.associatedElement.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            reserved.associatedElement.box.w * 0.8 +
            ',' +
            reserved.associatedElement.box.h * 0.7 +
            ')'
        )
      reserved.associatedElement.tels.icon
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.associatedElement.box.w * 0.11)
        .attr('height', reserved.associatedElement.box.w * 0.1)
        .attr('fill', colorTheme.dark.background)
        .attr('stroke', colorTheme.dark.stroke)
        .attr('stroke-width', 0.2)
        .attr('opacity', 0)
        .on('mouseover', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('opacity', 1)
        })
        .on('mouseout', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('opacity', 0)
        })
      reserved.associatedElement.tels.icon
        .append('svg:image')
        .attr('xlink:href', '/static/icons/telescope.svg')
        .attr('width', reserved.associatedElement.box.w * 0.1)
        .attr('height', reserved.associatedElement.box.w * 0.09)
        .attr('x', reserved.associatedElement.box.w * 0.0)
        .attr('y', reserved.associatedElement.box.h * 0.005)
        .style('pointer-events', 'none')
      // reserved.associatedElement.tels.icon.append('text')
      //   .text('+')
      //   .style('font-size', '11px')
      //   .attr('x', reserved.associatedElement.box.w * 0.075)
      //   .attr('y', reserved.associatedElement.box.h * 0.145)
      //   .style('pointer-events', 'none')
      //   .style('pointer-events', 'none')
    }

    function initLogInfo () {
      reserved.logInfo.g.attr(
        'transform',
        'translate(' +
          reserved.logInfo.box.x +
          ',' +
          reserved.logInfo.box.y +
          ')'
      )

      function initScrollBox () {
        reserved.logInfo.scroll = {}
        reserved.logInfo.scroll.scrollBoxG = reserved.logInfo.g.append('g')
        let box = {
          x: reserved.logInfo.box.w * 0.05,
          y: reserved.logInfo.box.h * 0.12,
          w: reserved.logInfo.box.w * 0.9,
          h: reserved.logInfo.box.h * 0.88
        }

        reserved.logInfo.scroll.scrollBoxG
          .append('rect')
          .attr('x', box.x - 1)
          .attr('y', box.y - 1)
          .attr('width', box.w + 2)
          .attr('height', box.h + 2)
          .attr('fill', 'none')
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-dasharray', [
            box.w + 2 + 2,
            box.h - 2,
            box.w + 2 + 2 + 2,
            box.h - 2
          ])
          .attr('stroke-width', 0.6)

        reserved.logInfo.scroll.scrollBox = new ScrollBox()
        reserved.logInfo.scroll.scrollBox.init({
          tag: 'logInfoScrollBox',
          gBox: reserved.logInfo.scroll.scrollBoxG,
          boxData: {
            x: box.x,
            y: box.y,
            w: box.w,
            h: box.h,
            marg: 0
          },
          useRelativeCoords: true,
          locker: new Locker(),
          lockerV: [widgetId + 'updateData'],
          lockerZoom: {
            all: 'logInfoBox' + 'zoom',
            during: 'logInfoBox' + 'zoomDuring',
            end: 'logInfoBox' + 'zoomEnd'
          },
          runLoop: new RunLoop({ tag: 'logInfoScrollBox' }),
          canScroll: true,
          scrollVertical: true,
          scrollHorizontal: false,
          scrollHeight: 0,
          scrollWidth: 0,
          background: 'transparent',
          scrollRecH: { h: 0 },
          scrollRecV: { w: 0 }
        })
        reserved.logInfo.scroll.scrollG = reserved.logInfo.scroll.scrollBox.get(
          'innerG'
        )
      }

      // reserved.logInfo.g.append('rect')
      //   .attr('x', reserved.logInfo.box.w * 0.0)
      //   .attr('y', reserved.logInfo.box.h * 0.0)
      //   .attr('width', reserved.logInfo.box.w * 1.0)
      //   .attr('height', reserved.logInfo.box.h * 1.0)
      //   .attr('fill', colorTheme.dark.background)
      //   .attr('stroke', colorTheme.dark.stroke)
      //   .attr('stroke-width', 0)
      //   .attr('opacity', 1)
      //   .on('mouseover', function () {
      //     // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
      //   })
      //   .on('mouseout', function () {
      //     // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
      //   })
      reserved.logInfo.g
        .append('text')
        .text('Log information')
        .attr('x', reserved.logInfo.box.w * 0.5)
        .attr('y', 10)
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '9px')
        .attr('text-anchor', 'middle')
      initScrollBox()
    }
    function updateLogInfo (log) {
      function wrap (self, width) {
        let textLength = self.node().getComputedTextLength()
        let text = self.text()
        while (textLength > width && text.length > 0) {
          text = text.slice(0, -1)
          self.text(text)
          textLength = self.node().getComputedTextLength()
        }
      }

      reserved.logInfo.g
        .select('text')
        .text('Log information: ' + log.info.length)

      let ib = {
        x: reserved.logInfo.box.w * 0.05,
        y: 0,
        w: reserved.logInfo.box.w * 0.9,
        h: reserved.logInfo.box.h * 0.35
      }
      let current = reserved.logInfo.scroll.scrollG
        .selectAll('g.logInfo')
        .data(log.info)
      let enter = current
        .enter()
        .append('g')
        .attr('class', 'logInfo')
      enter.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', function () {
          let tx = 0
          let ty = i * reserved.logInfo.box.h * 0.31
          return 'translate(' + tx + ',' + ty + ')'
        })

        g
          .append('rect')
          .attr('x', 1)
          .attr('y', 1)
          .attr('width', ib.w - 2)
          .attr('height', reserved.logInfo.box.h * 0.3 - 2)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.medium.stroke)
          .attr('stroke-width', 0.4)
        g
          .append('text')
          .text('Action: ' + d.action)
          .attr('x', reserved.logInfo.box.w * 0.05)
          .attr('y', ib.h * 0.25)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '8px')
          .attr('text-anchor', 'start')
        g
          .append('text')
          .text('By: ' + d.author)
          .attr('x', reserved.logInfo.box.w * 0.12)
          .attr('y', ib.h * 0.5)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '8px')
          .attr('text-anchor', 'start')
        g
          .append('text')
          .text('On: ' + d.date)
          .attr('x', reserved.logInfo.box.w * 0.12)
          .attr('y', ib.h * 0.75)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '8px')
          .attr('text-anchor', 'start')
      })

      let merge = current.merge(enter)
      merge.each(function (d, i) {
        let g = d3.select(this)
        g.attr('transform', function () {
          let tx = 0
          let ty = i * reserved.logInfo.box.h * 0.31
          return 'translate(' + tx + ',' + ty + ')'
        })
      })

      current
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()

      reserved.logInfo.scroll.scrollBox.resetVerticalScroller({
        canScroll: true,
        scrollHeight: log.info.length * reserved.logInfo.box.h * 0.31
      })
    }

    function initLogFields () {
      reserved.logFields.g.attr(
        'transform',
        'translate(' +
          reserved.logFields.box.x +
          ',' +
          reserved.logFields.box.y +
          ')'
      )

      function initTitle () {
        reserved.logFields.title.g = reserved.logFields.g.append('g')
        reserved.logFields.title.g.attr(
          'transform',
          'translate(' +
            reserved.logFields.title.box.x +
            ',' +
            reserved.logFields.title.box.y +
            ')'
        )

        reserved.logFields.title.g
          .append('rect')
          .attr('x', reserved.logFields.title.box.w * 0.025)
          .attr('y', reserved.logFields.title.box.h * 0.25)
          .attr('width', reserved.logFields.title.box.w * 0.95)
          .attr('height', reserved.logFields.title.box.h * 0.8)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0)
          .attr('opacity', 1)
          .on('mouseover', function () {
            // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
          })
          .on('mouseout', function () {
            // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
          })
        reserved.logFields.title.g
          .append('text')
          .text('Log ID')
          .attr('x', reserved.logFields.title.box.w * 0.5)
          .attr('y', reserved.logFields.title.box.h * 0.65)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'middle')

        // reserved.logFields.title.g.append('rect')
        //   .attr('x', reserved.logFields.title.box.w * 0.515)
        //   .attr('y', reserved.logFields.title.box.h * 0.25)
        //   .attr('width', reserved.logFields.title.box.w * 0.47)
        //   .attr('height', reserved.logFields.title.box.h * 0.8)
        //   .attr('fill', colorTheme.dark.background)
        //   .attr('stroke', colorTheme.dark.stroke)
        //   .attr('stroke-width', 0)
        //   .attr('opacity', 1)
        //   .on('mouseover', function () {
        //     // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
        //   })
        //   .on('mouseout', function () {
        //     // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
        //   })
        // reserved.logFields.title.g.append('text')
        //   .text('Log ID')
        //   .attr('x', (reserved.logFields.title.box.w * 0.7))
        //   .attr('y', reserved.logFields.title.box.h * 0.65)
        //   .style('fill', colorTheme.medium.text)
        //   .style('font-weight', '')
        //   .style('font-size', '9px')
        //   .attr('text-anchor', 'middle')
      }
      initTitle()

      function initHeader () {
        reserved.logFields.header.g = reserved.logFields.g.append('g')
        reserved.logFields.header.g.attr(
          'transform',
          'translate(' +
            reserved.logFields.header.box.x +
            ',' +
            reserved.logFields.header.box.y +
            ')'
        )

        reserved.logFields.header.g
          .append('rect')
          .attr('x', reserved.logFields.header.box.w * 0.1)
          .attr('y', 10)
          .attr('width', reserved.logFields.header.box.w * 0.8)
          .attr('height', 15)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0)
          .attr('opacity', 1)
          .on('mouseover', function () {
            // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
          })
          .on('mouseout', function () {
            // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
          })
        reserved.logFields.header.g
          .append('text')
          .attr('id', 'title')
          .text('Title')
          .attr('x', reserved.logFields.header.box.w * 0.15)
          .attr('y', 20)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'start')

        reserved.logFields.header.g
          .append('rect')
          .attr('x', reserved.logFields.header.box.w * 0.1)
          .attr('y', 10 + 20)
          .attr('width', reserved.logFields.header.box.w * 0.8)
          .attr('height', 15)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0)
          .attr('opacity', 1)
          .on('mouseover', function () {
            // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
          })
          .on('mouseout', function () {
            // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
          })
        reserved.logFields.header.g
          .append('text')
          .attr('id', 'category')
          .text('Categories')
          .attr('x', reserved.logFields.header.box.w * 0.15)
          .attr('y', 40)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '9px')
          .attr('text-anchor', 'start')
      }
      initHeader()

      function initText () {
        reserved.logFields.text.g = reserved.logFields.g.append('g')
        reserved.logFields.text.g.attr(
          'transform',
          'translate(' +
            reserved.logFields.text.box.x +
            ',' +
            reserved.logFields.text.box.y +
            ')'
        )

        let fo = reserved.logFields.text.g
          .append('foreignObject')
          .attr('x', reserved.logFields.text.box.w * 0.05)
          .attr('y', 10)
          .attr('width', reserved.logFields.text.box.w * 0.9)
          .attr('height', reserved.logFields.text.box.h - 15)
        let rootDiv = fo
          .append('xhtml:div')
          .style('display', 'block')
          .style('border', 'none')
          .style('width', '100%')
          .style('height', '100%')
        rootDiv
          .append('textArea')
          .style('width', '100%')
          .style('height', '100%')
          .style('font-size', '9px')
          .style('resize', 'none')
          .style('border-style', 'solid')
          .style('border-width', '1px 1px 1px 1x')
          .style('background-color', colorTheme.medium.background)
          .attr('placeholder', 'Log information')

        // reserved.logFields.text.g.append('rect')
        //   .attr('x', reserved.logFields.text.box.w * 0.05)
        //   .attr('y', 10)
        //   .attr('width', reserved.logFields.text.box.w * 0.9)
        //   .attr('height', reserved.logFields.text.box.h - 15)
        //   .attr('fill', colorTheme.dark.background)
        //   .attr('stroke', colorTheme.dark.stroke)
        //   .attr('stroke-width', 0)
        //   .attr('opacity', 1)
        //   .on('mouseover', function () {
        //     // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
        //   })
        //   .on('mouseout', function () {
        //     // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
        //   })
        // reserved.logFields.text.g.append('text')
        //   .text('Information')
        //   .attr('x', reserved.logFields.text.box.w * 0.1)
        //   .attr('y', 20)
        //   .style('fill', colorTheme.medium.text)
        //   .style('font-weight', '')
        //   .style('font-size', '9px')
        //   .attr('text-anchor', 'start')
      }
      initText()
    }
    function updateLogFields (log) {
      reserved.logFields.title.g.select('text').text(log.id)
      reserved.logFields.header.g.select('#title').text(log.name)
      reserved.logFields.header.g.select('#category').text(log.categories[0])
      reserved.logFields.text.g.select('textArea').text(log.description)
    }

    function initLogHistory () {
      let filterTemplate = {
        id: 'include',
        name: 'include',
        description: 'include',
        categories: 'equal',
        info: {
          author: 'equal',
          date: 'equal+'
        },
        linkedTo: 'equal',
        modifications: {
          author: 'equal',
          date: 'equal+',
          field: 'equal'
        }
      }
      let filters = []
      let b = reserved.logHistory.box

      reserved.logHistory.outerBox = {
        x: 0,
        y: 0,
        w: b.w,
        h: 15
      }
      let ob = reserved.logHistory.outerBox
      reserved.logHistory.innerBoxFilter = {
        x: 2,
        y: 2,
        w: ob.w - 4,
        h: ob.h - 4
      }
      reserved.logHistory.innerBoxLog = {
        x: 0,
        y: 2,
        w: ob.w,
        h: ob.h - 4
      }

      let fb = {
        x: b.x,
        y: b.y,
        w: b.w,
        h: ob.h * (filters.length + 2)
      }
      let lb = {
        x: b.x,
        y: ob.h * 6,
        w: b.w,
        h: b.h - ob.h * 4
      }

      function filterLogs () {
        function checkFilter (filt, data) {
          let str = filt.split(':')
          let keys = str[0].split('.')
          let value = str[1]

          let target = data
          for (let i = 0; i < keys.length; i++) {
            target = target[keys[i]]
          }

          if (Array.isArray(target)) {
            if (target.indexOf(value) !== -1) {
              return true
            }
          } else if (target === value) {
            return true
          }
          return false
        }
        let filtered = []
        for (let i = 0; i < shared.data.server.logs.length; i++) {
          let insert = true
          for (
            let j = 0;
            j < reserved.logHistory.filtering.filters.length;
            j++
          ) {
            if (
              !checkFilter(
                reserved.logHistory.filtering.filters[j],
                shared.data.server.logs[i]
              )
            ) { insert = false }
          }
          if (insert) filtered.push(shared.data.server.logs[i])
        }
        return filtered
      }
      function updateFilters () {
        let ib = reserved.logHistory.innerBoxFilter
        let current = reserved.logHistory.filtering.scroll.scrollG
          .selectAll('g.filter')
          .data(reserved.logHistory.filtering.filters)
        let enter = current
          .enter()
          .append('g')
          .attr('class', 'filter')
        enter.each(function (d, i) {
          let g = d3.select(this)
          g.attr('transform', function () {
            let tx = 0
            let ty = i * ob.h
            return 'translate(' + tx + ',' + ty + ')'
          })

          g
            .append('rect')
            .attr('x', function (d) {
              return ib.x + ib.w * 0.05
            })
            .attr('y', function (d) {
              return ib.y
            })
            .attr('width', function (d) {
              return ib.w * 0.1
            })
            .attr('height', function (d) {
              return ib.h
            })
            .attr('fill', function (d) {
              return colorTheme.darker.background
            })
            .attr('stroke', 'none')
          let back = g
            .append('rect')
            .attr('width', ib.w * 0.65 + 'px')
            .attr('height', ib.h + 'px')
            .attr('x', ib.x + ib.w * 0.15 + 'px')
            .attr('y', ib.y + 'px')
            .attr('fill', 'none')
            .attr('stroke', colorTheme.dark.stroke)
            .attr('stroke-width', 0.2)
          let buttonDel = g
            .append('rect')
            .attr('x', ib.x + ib.w * 0.8)
            .attr('y', ib.y)
            .attr('width', ib.w * 0.1)
            .attr('height', ib.h)
            .attr('fill', 'transparent')
            .attr('stroke', 'none')
            .on('mouseover', function () {
              buttonDel.attr('fill', colorTheme.darker.background)
            })
            .on('mouseout', function () {
              buttonDel.attr('fill', 'transparent')
            })
            .on('click', function () {
              removeFilter(d)
              updateFilters()
              updateLogList()
            })
          g
            .append('text')
            .text('x')
            .attr('x', ib.x + ib.w * 0.85)
            .attr('y', ib.y + ib.h * 0.7)
            .style('font-size', ib.h * 0.8 + 'px')
            .style('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .style('pointer-events', 'none')
            .style('user-select', 'none')

          let str = d.split(':')
          let textLeft = g
            .append('text')
            .append('tspan')
            .text(str[0])
            .attr('x', ib.x + ib.w * 0.15 + ib.w * 0.3 + 'px')
            .attr('y', ib.y + ib.h * 0.75)
            .style('font-size', ib.h * 0.8 + 'px')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'end')
            .each(function () {
              wrap(d3.select(this), ib.w * 0.3)
            })
          let textMiddle = g
            .append('text')
            .append('tspan')
            .text(':')
            .attr('x', ib.x + ib.w * 0.15 + ib.w * 0.325 + 'px')
            .attr('y', ib.y + ib.h * 0.75)
            .style('font-size', ib.h * 0.8 + 'px')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .each(function () {
              wrap(d3.select(this), ib.w * 0.05)
            })
          let textRight = g
            .append('text')
            .append('tspan')
            .text(str[1])
            .attr('x', ib.x + ib.w * 0.15 + ib.w * 0.35 + 'px')
            .attr('y', ib.y + ib.h * 0.75)
            .style('font-size', ib.h * 0.8 + 'px')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'start')
            .each(function () {
              wrap(d3.select(this), ib.w * 0.3)
            })

          function wrap (self, width) {
            let textLength = self.node().getComputedTextLength()
            let text = self.text()
            while (textLength > width && text.length > 0) {
              text = text.slice(0, -1)
              self.text(text)
              textLength = self.node().getComputedTextLength()
            }
          }
        })

        let merge = current.merge(enter)
        merge.each(function (d, i) {
          let g = d3.select(this)
          g.attr('transform', function () {
            let tx = 0
            let ty = i * ob.h
            return 'translate(' + tx + ',' + ty + ')'
          })
        })

        current
          .exit()
          .transition('inOut')
          .duration(timeD.animArc)
          .style('opacity', 0)
          .remove()
      }
      function addFilter (f) {
        reserved.logHistory.filtering.filters.push(f)
      }
      function removeFilter (f) {
        reserved.logHistory.filtering.filters.splice(
          reserved.logHistory.filtering.filters.indexOf(f),
          1
        )
      }
      function createLogFilter () {
        function createDataList (object) {
          let dl = []
          function rec (object, string) {
            for (var key in object) {
              let cpString = string + '.' + key
              if (
                typeof object[key] === 'string' ||
                object[key] instanceof String
              ) { dl.push({ key: cpString, action: object[key] }) } else {
                dl.push({ key: cpString, action: 'none' })
                rec(object[key], cpString)
              }
            }
          }
          for (var key in object) {
            let cpString = '' + key
            if (
              typeof object[key] === 'string' ||
              object[key] instanceof String
            ) { dl.push({ key: cpString, action: object[key] }) } else {
              dl.push({ key: cpString, action: 'none' })
              rec(object[key], cpString)
            }
          }
          return dl
        }
        let ib = reserved.logHistory.innerBoxFilter
        reserved.logHistory.filtering = {}
        reserved.logHistory.filtering.g = reserved.logHistory.g.append('g')
        reserved.logHistory.filtering.filters = filters

        let g = reserved.logHistory.filtering.g
        g.attr('transform', function () {
          let tx = 0
          let ty = 0
          return 'translate(' + tx + ',' + ty + ')'
        })
        let back = g
          .append('rect')
          .attr('width', ib.w * 0.95 + 'px')
          .attr('height', ib.h + 'px')
          .attr('x', ib.x + ib.w * 0.05 + 'px')
          .attr('y', ib.y + 'px')
          .attr('fill', 'none')
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.2)

        let fo = g
          .append('foreignObject')
          .attr('width', ib.w * 0.95 + 'px')
          .attr('height', ib.h + 'px')
          .attr('x', ib.x + ib.w * 0.05 + 'px')
          .attr('y', ib.y + 'px')
        let rootDiv = fo
          .append('xhtml:div')
          .style('display', 'block')
          .style('border', 'none')
          .style('background-color', 'transparent')
          .style('width', '100%')
          .style('height', '100%')

        let dl = createDataList(filterTemplate)
        let datalist = rootDiv.append('datalist').attr('id', 'datalist')
        datalist
          .selectAll('option')
          .data(dl)
          .enter()
          .append('option')
          .property('value', function (d) {
            return d.key
          })
        let input = rootDiv
          .append('input')
          .attr('list', 'datalist')
          .property('value', function (d) {
            return d
          })
          .attr('placeholder', 'Add filter')
          .style('width', '100%')
          .style('height', '100%')
          .style('padding', '0')
          .style('vertical-align', 'top')
          .style('border', 'none')
          .style('background', 'transparent')
          .style('color', colorTheme.dark.text)
          .style('font-size', ib.h * 0.8 + 'px')
          .style('text-align', 'left')
          .attr('type', 'list')

        input.on('focus', function () {
          back.attr('fill', colorTheme.bright.background)
          // .attr('stroke', 'none')
          input.style('outline', 'none')
        })
        input.on('blur', function () {
          back.attr('fill', 'none')
          // .attr('stroke', colorTheme.dark.stroke)
          input.style('outline', 'none')
        })
        input.on('input', function () {
          // let str = input.property('value').split(':')
          // if (str.length === 1) {
          //   textLeft.text(str[0])
          //   textMiddle.text('')
          // } else if (str.length === 2) {
          //   textRight.text(str[1])
          //   textMiddle.text(':')
          // }
        })
        input.on('change', function () {
          let str = input.property('value').split(':')
          if (str.length === 1) {
            // textLeft.text(str[0])
            // textMiddle.text(':')
            input.property('value', input.property('value') + ':')
          } else if (str.length === 2) {
            // textRight.text(str[1])
            addFilter(input.property('value'))
            updateFilters()
            updateLogList()
            input.property('value', '')
          }
        })

        let button = g
          .append('rect')
          .attr('x', ib.x + ib.w * 0.9)
          .attr('y', ib.y)
          .attr('width', ib.h)
          .attr('height', ib.h)
          .attr('fill', 'transparent')
          .on('mouseover', function () {
            button.attr('fill', colorTheme.darker.background)
          })
          .on('mouseout', function () {
            button.attr('fill', 'transparent')
          })
        g
          .append('text')
          .text('?')
          .attr('x', ib.x + ib.w - ib.h * 0.5)
          .attr('y', ib.y + ib.h * 0.8)
          .style('font-size', ib.h * 0.8 + 'px')
          .attr('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')

        function initScrollBox () {
          reserved.logHistory.filtering.scroll = {}
          reserved.logHistory.filtering.scroll.scrollBoxG = reserved.logHistory.filtering.g.append(
            'g'
          )
          let historyBox = {
            x: b.x,
            y: ob.h * 1.2,
            w: b.w,
            h: ob.h * 4.5
          }
          // reserved.logHistory.filtering.scroll.scrollBoxG.append('rect')
          //   .attr('x', historyBox.x)
          //   .attr('y', historyBox.y)
          //   .attr('width', historyBox.w)
          //   .attr('height', historyBox.h)
          //   .attr('fill', 'none')
          //   .attr('stroke', colorTheme.dark.stroke)
          //   .attr('stroke-dasharray', [historyBox.w, historyBox.h, historyBox.w, historyBox.h])
          //   .attr('stroke-width', 0.2)

          reserved.logHistory.filtering.scroll.scrollBox = new ScrollBox()
          reserved.logHistory.filtering.scroll.scrollBox.init({
            tag: 'inputHistoryFilteringScrollBox',
            gBox: reserved.logHistory.filtering.scroll.scrollBoxG,
            boxData: {
              x: historyBox.x,
              y: historyBox.y,
              w: historyBox.w,
              h: historyBox.h,
              marg: 0
            },
            useRelativeCoords: true,
            locker: new Locker(),
            lockerV: [widgetId + 'updateData'],
            lockerZoom: {
              all: 'ScrollFilteringBox' + 'zoom',
              during: 'ScrollFilteringBox' + 'zoomDuring',
              end: 'ScrollFilteringBox' + 'zoomEnd'
            },
            runLoop: new RunLoop({ tag: 'inputHistoryFilteringScrollBox' }),
            canScroll: true,
            scrollVertical: true,
            scrollHorizontal: false,
            scrollHeight: ob.h * reserved.logHistory.filtering.filters.length,
            scrollWidth: 0,
            background: 'transparent',
            scrollRecH: { h: 1 },
            scrollRecV: { w: 1 }
          })
          reserved.logHistory.filtering.scroll.scrollG = reserved.logHistory.filtering.scroll.scrollBox.get(
            'innerG'
          )
        }
        initScrollBox()
        updateFilters()
      }

      function createLogList () {
        let ib = reserved.logHistory.innerBoxLog
        reserved.logHistory.list = {}
        function initScrollBox () {
          reserved.logHistory.list.scroll = {}
          reserved.logHistory.list.g = reserved.logHistory.g.append('g')
          reserved.logHistory.list.scroll.scrollBoxG = reserved.logHistory.list.g.append(
            'g'
          )
          let historyBox = lb
          // reserved.logHistory.list.scroll.scrollBoxG.append('rect')
          //   .attr('x', historyBox.x)
          //   .attr('y', historyBox.y)
          //   .attr('width', historyBox.w)
          //   .attr('height', historyBox.h)
          //   .attr('fill', 'none')
          //   .attr('stroke', colorTheme.dark.stroke)
          //   .attr('stroke-dasharray', [historyBox.w, historyBox.h, historyBox.w, historyBox.h])
          //   .attr('stroke-width', 0.1)

          reserved.logHistory.list.scroll.scrollBox = new ScrollBox()
          reserved.logHistory.list.scroll.scrollBox.init({
            tag: 'inputHistoryScrollBox',
            gBox: reserved.logHistory.list.scroll.scrollBoxG,
            boxData: {
              x: historyBox.x,
              y: historyBox.y,
              w: historyBox.w,
              h: historyBox.h,
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
            runLoop: new RunLoop({ tag: 'inputHistoryScrollBox' }),
            canScroll: true,
            scrollVertical: true,
            scrollHorizontal: false,
            scrollHeight: 0.1 + historyBox.h,
            scrollWidth: 0,
            background: 'transparent',
            scrollRecH: { h: 2 },
            scrollRecV: { w: 2 }
          })
          reserved.logHistory.list.scroll.scrollG = reserved.logHistory.list.scroll.scrollBox.get(
            'innerG'
          )
        }
        initScrollBox()
        function wrap (self, width) {
          let textLength = self.node().getComputedTextLength()
          let text = self.text()
          while (textLength > width && text.length > 0) {
            text = text.slice(0, -1)
            self.text(text)
            textLength = self.node().getComputedTextLength()
          }
        }
        console.log(shared.data.server.logs[0])

        let fl = filterLogs()
        let current = reserved.logHistory.list.scroll.scrollG
          .selectAll('g.log')
          .data(fl, function (d) {
            return d.id
          })
        let enter = current
          .enter()
          .append('g')
          .attr('class', 'log')
        enter.each(function (d, i) {
          let g = d3.select(this)
          g.attr('transform', function () {
            let tx = 0
            let ty = i * ob.h
            return 'translate(' + tx + ',' + ty + ')'
          })
          g
            .append('rect')
            .attr('width', ob.w + 'px')
            .attr('height', ob.h + 'px')
            .attr('x', 0 + 'px')
            .attr('y', 0 + 'px')
            .attr(
              'fill',
              i % 2 === 0
                ? colorTheme.dark.background
                : colorTheme.medium.background
            )
            .attr('stroke', colorTheme.dark.stroke)
            .attr('stroke-width', 0.0)
            .on('mouseover', function () {
              d3.select(this).attr('fill', colorTheme.darker.background)
              g
                .selectAll('tspan')
                .style('fill', '#000000')
                .style('font-size', '9px')
            })
            .on('mouseout', function () {
              d3
                .select(this)
                .attr(
                  'fill',
                  i % 2 === 0
                    ? colorTheme.dark.background
                    : colorTheme.medium.background
                )
              g
                .selectAll('tspan')
                .style('fill', colorTheme.medium.text)
                .style('font-size', '8px')
            })
            .on('click', function () {
              updateLog(d)
            })
          g
            .append('text')
            .append('tspan')
            .text(function (d) {
              return d.id
            })
            .attr('x', ib.w * 0.025)
            .attr('y', ib.h * 0.9)
            .style('fill', colorTheme.medium.text)
            .style('font-weight', '')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'start')
            .each(function () {
              wrap(d3.select(this), ib.w * 0.45)
            })
          g
            .append('text')
            .append('tspan')
            .text(function (d) {
              return d.info[0].date
            })
            .attr('x', ib.w * 0.9)
            .attr('y', ib.h * 0.9)
            .style('fill', colorTheme.medium.text)
            .style('font-weight', '')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'end')
            .each(function () {
              wrap(d3.select(this), ib.w * 0.45)
            })
        })

        // let mergeCurrentTels = currentTels.merge(enterCurrentTels)
        // mergeCurrentTels.each(function (d, i) {
        //   let toff = off
        //   if (d.id.split('_')[0] === 'M') toff += 1
        //   if (d.id.split('_')[0] === 'S') toff += 2
        //
        //   d3.select(this)
        //     .attr('transform', function (d) {
        //       let tx = -(parseInt((i + toff) / telsPerRow) % 2) === 0 ?
        //         (offset.x * (0.5 + ((i + toff) % telsPerRow))) :
        //         (offset.x * (0.0 + (telsPerRow))) - (offset.x * (0.5 + ((i + toff) % telsPerRow)))
        //       // if (toff % 2 === 1) tx += 2 * offset.x
        //       let ty = (offset.y * (0.5 + parseInt((i + toff) / telsPerRow))) + (toff * offset.ty)
        //       return 'translate(' + tx + ',' + ty + ')'
        //     })
        //     .style('opacity', function () {
        //       if (!d.running) return 1
        //       return 0.4
        //     })
        //   d3.select(this).select('rect')
        //     .transition()
        //     .duration(timeD.animArc)
        //     .attr('x', function (d) {
        //       return (-offset.x * 0.5) + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
        //     })
        //     .attr('y', function (d) {
        //       return (-offset.y * 0.5) + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
        //     })
        //     .attr('width', function (d) {
        //       return offset.x - strokeSize(d.val) // (offset.x * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
        //     })
        //     .attr('height', function (d) {
        //       return offset.y - strokeSize(d.val) // (offset.y * (1 - (0.3 * (d.val / 100)))) - (4 - (3 * (d.val / 100)))
        //     })
        //     .attr('fill', function (d) {
        //       if (!d.running) return telHealthCol(d.val)
        //       return colorTheme.dark.background
        //     })
        //     // .attr('fill-opacity', function (d) {
        //     //   return fillOpacity(d.val)
        //     // })
        //     .attr('stroke-width', function (d) {
        //       return strokeSize(d.val)
        //     })
        //     .attr('stroke', function (d) {
        //       // if (!d.running) return telHealthCol(d.val)
        //       return colorTheme.dark.stroke
        //     })
        //     // .attr('stroke-opacity', function (d) {
        //     //   if (!d.running) return 1
        //     //   return 1
        //     // })
        //   d3.select(this).select('text')
        //     .attr('x', 0)
        //     .attr('y', offset.y * 0.2)
        //     .attr('dy', 0)
        //     .text(function (d) {
        //       return d.id // d.id.split('_')[1]
        //     })
        //     .style('fill', colorTheme.blocks.run.text)
        //     .style('font-weight', 'normal')
        //     .style('font-size', function (d) {
        //       return 6.2 // - (2 * (d.val / 100))
        //     })
        //     .attr('text-anchor', 'middle')
        // })
        //
        // currentTels
        //   .exit()
        //   .transition('inOut')
        //   .duration(timeD.animArc)
        //   .style('opacity', 0)
        //   .remove()

        reserved.logHistory.list.scroll.scrollBox.resetVerticalScroller({
          canScroll: true,
          scrollHeight: fl.length * ob.h
        })
      }
      function updateLogList () {
        function wrap (self, width) {
          let textLength = self.node().getComputedTextLength()
          let text = self.text()
          while (textLength > width && text.length > 0) {
            text = text.slice(0, -1)
            self.text(text)
            textLength = self.node().getComputedTextLength()
          }
        }
        let fl = filterLogs()
        let current = reserved.logHistory.list.scroll.scrollG
          .selectAll('g.log')
          .data(fl, function (d) {
            return d.id
          })
        let enter = current
          .enter()
          .append('g')
          .attr('class', 'log')
        enter.each(function (d, i) {
          let ib = reserved.logHistory.innerBoxLog
          let g = d3.select(this)
          g.attr('transform', function () {
            let tx = 0
            let ty = i * ob.h
            return 'translate(' + tx + ',' + ty + ')'
          })
          g
            .append('rect')
            .attr('width', ob.w + 'px')
            .attr('height', ob.h + 'px')
            .attr('x', 0 + 'px')
            .attr('y', 0 + 'px')
            .attr(
              'fill',
              i % 2 === 0
                ? colorTheme.dark.background
                : colorTheme.medium.background
            )
            .attr('stroke', colorTheme.dark.stroke)
            .attr('stroke-width', 0.0)
            .on('mouseover', function () {
              d3.select(this).attr('fill', colorTheme.darker.background)
              g
                .selectAll('tspan')
                .style('fill', '#000000')
                .style('font-size', '9px')
            })
            .on('mouseout', function () {
              d3
                .select(this)
                .attr(
                  'fill',
                  i % 2 === 0
                    ? colorTheme.dark.background
                    : colorTheme.medium.background
                )
              g
                .selectAll('tspan')
                .style('fill', colorTheme.medium.text)
                .style('font-size', '8px')
            })
          g
            .append('text')
            .append('tspan')
            .text(function (d) {
              return d.id
            })
            .attr('x', ib.w * 0.025)
            .attr('y', ib.h * 0.9)
            .style('fill', colorTheme.medium.text)
            .style('font-weight', '')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'start')
            .each(function () {
              wrap(d3.select(this), ib.w * 0.45)
            })
          g
            .append('text')
            .append('tspan')
            .text(function (d) {
              return d.info[0].date
            })
            .attr('x', ib.w * 0.9)
            .attr('y', ib.h * 0.9)
            .style('fill', colorTheme.medium.text)
            .style('font-weight', '')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'end')
            .each(function () {
              wrap(d3.select(this), ib.w * 0.45)
            })
        })

        let mergeCurrentTels = current.merge(enter)
        mergeCurrentTels.each(function (d, i) {
          let g = d3.select(this)
          g.attr('transform', function () {
            let tx = 0
            let ty = i * ob.h
            return 'translate(' + tx + ',' + ty + ')'
          })
          g
            .select('rect')
            .attr(
              'fill',
              i % 2 === 0
                ? colorTheme.dark.background
                : colorTheme.medium.background
            )
            .attr('stroke', colorTheme.dark.stroke)
            .on('mouseover', function () {
              d3.select(this).attr('fill', colorTheme.darker.background)
              g
                .selectAll('tspan')
                .style('fill', '#000000')
                .style('font-size', '9px')
            })
            .on('mouseout', function () {
              d3
                .select(this)
                .attr(
                  'fill',
                  i % 2 === 0
                    ? colorTheme.dark.background
                    : colorTheme.medium.background
                )
              g
                .selectAll('tspan')
                .style('fill', colorTheme.medium.text)
                .style('font-size', '8px')
            })
        })

        current
          .exit()
          .transition('inOut')
          .duration(timeD.animArc)
          .style('opacity', 0)
          .remove()

        reserved.logHistory.list.scroll.scrollBox.resetVerticalScroller({
          canScroll: true,
          scrollHeight: fl.length * ob.h
        })
      }

      reserved.logHistory.g.attr(
        'transform',
        'translate(' +
          reserved.logHistory.box.x +
          ',' +
          reserved.logHistory.box.y +
          ')'
      )

      createLogFilter()
      createLogList()

      // reserved.logHistory.g.append('rect')
      //   .attr('x', reserved.logHistory.box.w * 0.0)
      //   .attr('y', reserved.logHistory.box.h * 0.0)
      //   .attr('width', reserved.logHistory.box.w * 1.0)
      //   .attr('height', reserved.logHistory.box.h * 1.0)
      //   .attr('fill', colorTheme.dark.background)
      //   .attr('stroke', colorTheme.dark.stroke)
      //   .attr('stroke-width', 0)
      //   .attr('opacity', 1)
      //   .on('mouseover', function () {
      //     // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 1)
      //   })
      //   .on('mouseout', function () {
      //     // d3.select(this).transition().duration(timeD.animArc).attr('opacity', 0)
      //   })
      // reserved.logHistory.g.append('text')
      //   .text('Logs List')
      //   .attr('x', (reserved.logHistory.box.w * 0.5))
      //   .attr('y', reserved.logHistory.box.h * 0.05)
      //   .style('fill', colorTheme.medium.text)
      //   .style('font-weight', '')
      //   .style('font-size', '9px')
      //   .attr('text-anchor', 'middle')
    }

    function updateLog (log) {
      updateLogInfo(log)
      updateLogFields(log)
    }

    function initData (dataIn) {
      reserved.main.box = {
        x: box.log.x,
        y: box.log.y,
        w: box.log.w,
        h: box.log.h,
        marg: box.log.marg
      }
      reserved.main.g = svg.g
        .append('g')
        .attr(
          'transform',
          'translate(' + reserved.main.box.x + ',' + reserved.main.box.y + ')'
        )
      let lineGenerator = d3
        .line()
        .x(function (d) {
          return d.x
        })
        .y(function (d) {
          return d.y
        })
        .curve(d3.curveLinear)
      let depth = 3
      let dataPointFuturTop = [
        { x: 0, y: 0 },
        { x: -depth, y: depth },
        { x: -depth, y: reserved.main.box.h + depth },
        { x: reserved.main.box.w - depth, y: reserved.main.box.h + depth },
        { x: reserved.main.box.w + 0, y: reserved.main.box.h },
        { x: 0, y: reserved.main.box.h },
        { x: -depth, y: reserved.main.box.h + depth },
        { x: 0, y: reserved.main.box.h },
        { x: 0, y: 0 }
      ]
      reserved.main.g
        .append('path')
        .data([dataPointFuturTop])
        .attr('d', lineGenerator)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
      reserved.main.g
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', reserved.main.box.w)
        .attr('height', reserved.main.box.h)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', colorTheme.medium.stroke)
        .attr('stroke-width', 0.2)
      // .style('filter', 'url(#drop-shadow)')

      // let gapUp = [
      //   {x: reserved.main.box.w * 0.256, y: reserved.main.box.h * 0.00},
      //   {x: reserved.main.box.w * 0.256, y: reserved.main.box.h * 0.1},
      //   {x: reserved.main.box.w * 0.256 + depth * 1.5, y: reserved.main.box.h * 0.1},
      //   {x: reserved.main.box.w * 0.256 + depth * 1.5, y: reserved.main.box.h * 0.00}
      // ]
      // reserved.main.g.append('path')
      //   .data([gapUp])
      //   .attr('d', lineGenerator)
      //   .attr('fill', colorTheme.darker.background)
      //   .attr('stroke', colorTheme.darker.stroke)
      //   .attr('stroke-width', 0.2)
      // let gapUp2 = [
      //   {x: reserved.main.box.w * 0.256, y: reserved.main.box.h * 0.00},
      //   {x: reserved.main.box.w * 0.256, y: reserved.main.box.h * 0.1},
      //   {x: reserved.main.box.w * 0.256 + (depth * 0.5), y: reserved.main.box.h * 0.1},
      //   {x: reserved.main.box.w * 0.256 + (depth * 0.5), y: reserved.main.box.h * 0.00 + depth},
      //   {x: reserved.main.box.w * 0.256 + depth * 1.5, y: reserved.main.box.h * 0.00}
      // ]
      // reserved.main.g.append('path')
      //   .data([gapUp2])
      //   .attr('d', lineGenerator)
      //   .attr('fill', '#444444')
      //   .attr('stroke', '')
      //   .attr('stroke-width', 0)
      //
      // let gapBottom = [
      //   {x: reserved.main.box.w * 0.257, y: reserved.main.box.h * 1},
      //   {x: reserved.main.box.w * 0.257, y: reserved.main.box.h * 0.525},
      //   {x: reserved.main.box.w * 0.257 + depth, y: reserved.main.box.h * 0.525},
      //   {x: reserved.main.box.w * 0.257 + depth, y: reserved.main.box.h * 1}
      // ]
      // reserved.main.g.append('path')
      //   .data([gapBottom])
      //   .attr('d', lineGenerator)
      //   .attr('fill', colorTheme.darker.background)
      //   .attr('stroke', colorTheme.darker.stroke)
      //   .attr('stroke-width', 0.2)
      // let gapBottom2 = [
      //   {x: reserved.main.box.w * 0.257, y: reserved.main.box.h * 1},
      //   {x: reserved.main.box.w * 0.257 - depth, y: reserved.main.box.h * 1 + depth},
      //   {x: reserved.main.box.w * 0.257, y: reserved.main.box.h * 1 + depth}
      // ]
      // reserved.main.g.append('path')
      //   .data([gapBottom2])
      //   .attr('d', lineGenerator)
      //   .attr('fill', '#444444')
      //   .attr('stroke', '')
      //   .attr('stroke-width', 0)

      reserved.associatedElement = {
        g: reserved.main.g.append('g'),
        box: box.logAssociatedElement,
        blocks: {
          icon: undefined
        },
        events: {
          icon: undefined
        },
        tels: {
          icon: undefined
        }
      }
      reserved.logInfo = {
        g: reserved.main.g.append('g'),
        box: box.logInfo
      }
      reserved.logFields = {
        g: reserved.main.g.append('g'),
        box: box.logFields,
        title: {
          g: undefined,
          box: {
            x: 0,
            y: box.logFields.h * 0.0,
            w: box.logFields.w,
            h: box.logFields.h * 0.08
          }
        },
        header: {
          g: undefined,
          box: {
            x: 0,
            y: box.logFields.h * 0.08,
            w: box.logFields.w * 0.35,
            h: box.logFields.h * 0.9
          }
        },
        text: {
          g: undefined,
          box: {
            x: box.logFields.w * 0.3,
            y: box.logFields.h * 0.08,
            w: box.logFields.w * 0.7,
            h: box.logFields.h * 0.9
          }
        }
      }
      reserved.logHistory = {
        g: reserved.main.g.append('g'),
        box: box.logHistory
      }
      // reserved.inputHistory = {
      //   main: {
      //     g: reserved.gBlockBox.append('g'),
      //     box: {
      //       x: reserved.adjustedBox.x,
      //       y: reserved.adjustedBox.y + box.log.h * 0.06,
      //       w: box.log.w * 0.165,
      //       h: box.log.h * 0.45,
      //       marg: box.telescopes.marg
      //     }
      //   }
      // }
      // reserved.onlineOperator = {
      //   main: {
      //     g: reserved.gBlockBox.append('g'),
      //     box: {
      //       x: reserved.adjustedBox.x + box.log.w * 0.825,
      //       y: reserved.adjustedBox.y + box.log.h * 0.06,
      //       w: box.log.w * 0.165,
      //       h: box.log.h * 0.45,
      //       marg: box.telescopes.marg
      //     }
      //   }
      // }
      // reserved.focusedItemHeader = {
      //   main: {
      //     g: reserved.gBlockBox.append('g'),
      //     box: {
      //       x: reserved.adjustedBox.x + box.log.w * 0.175,
      //       y: reserved.adjustedBox.y + box.log.h * 0.0,
      //       w: box.log.w * 0.65,
      //       h: box.log.h * 0.06,
      //       marg: box.telescopes.marg * 0.5
      //     }
      //   }
      // }
      // reserved.focusedItemInfo = {
      //   main: {
      //     g: reserved.gBlockBox.append('g'),
      //     box: {
      //       x: reserved.adjustedBox.x + box.log.w * 0.15,
      //       y: reserved.adjustedBox.y + box.log.h * 0.53,
      //       w: box.log.w * 0.7,
      //       h: box.log.h * 0.4,
      //       marg: box.telescopes.marg * 0.5
      //     }
      //   }
      // }
      // reserved.textInput = {
      //   main: {
      //     g: reserved.gBlockBox.append('g'),
      //     box: {
      //       x: reserved.adjustedBox.x + box.log.w * 0.175,
      //       y: reserved.adjustedBox.y + box.log.h * 0.06,
      //       w: box.log.w * 0.65,
      //       h: box.log.h * 0.45,
      //       marg: box.telescopes.marg * 0.5
      //     }
      //   }
      // }

      initAssociatedElement()
      initLogFields()
      initLogHistory()
      initLogInfo()
      // initinputHistory()
      // initOnlineOperator()
      // initFocusedItemHeader()
      // initFocusedItemInfo()
      // initTextInput()
    }
    this.initData = initData

    function updateData (dataIn) {}
    this.updateData = updateData
  }
  let SvgBlocksQueueServer = function () {
    let reserved = {
      main: {
        g: undefined,
        mode: 'icon'
      },
      back: {
        g: undefined
      },
      icon: {
        g: undefined
      },
      title: {
        g: undefined
      },
      filter: {
        g: undefined
      },
      content: {
        g: undefined
      }
    }

    function initData () {
      reserved.main.g = svg.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.blockQueueServer.x +
            ',' +
            box.blockQueueServer.y +
            ')'
        )

      reserved.icon.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.blockQueueServerIcon.x +
            ',' +
            box.blockQueueServerIcon.y +
            ')'
        )
        .attr('opacity', 1)
      reserved.title.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.blockQueueServerTitle.x +
            ',' +
            box.blockQueueServerTitle.y +
            ')'
        )
      reserved.filter.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.blockQueueServerFilter.x +
            ',' +
            box.blockQueueServerFilter.y +
            ')'
        )
      reserved.content.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.blockQueueServerContent.x +
            ',' +
            box.blockQueueServerContent.y +
            ')'
        )

      let lineGenerator = d3
        .line()
        .x(function (d) {
          return d.x
        })
        .y(function (d) {
          return d.y
        })
        .curve(d3.curveLinear)
      let depth = 2
      let dataPointFuturTop = [
        { x: 0, y: 0 },
        { x: -depth, y: depth },
        { x: -depth, y: box.blockQueueServerIcon.h + depth },
        {
          x: box.blockQueueServerIcon.w - depth,
          y: box.blockQueueServerIcon.h + depth
        },
        { x: box.blockQueueServerIcon.w + 0, y: box.blockQueueServerIcon.h },
        { x: 0, y: box.blockQueueServerIcon.h },
        { x: -depth, y: box.blockQueueServerIcon.h + depth },
        { x: 0, y: box.blockQueueServerIcon.h },
        { x: 0, y: 0 }
      ]
      reserved.icon.g
        .append('path')
        .data([dataPointFuturTop])
        .attr('d', lineGenerator)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
      reserved.icon.g
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.blockQueueServerIcon.w)
        .attr('height', box.blockQueueServerIcon.h)
        .attr('fill', colorTheme.bright.background)
        .attr('stroke', colorTheme.bright.stroke)
        .attr('stroke-width', 0.2)
        .on('mouseover', function () {
          if (reserved.main.mode === 'expand') { d3.select(this).attr('fill', colorTheme.bright.background) } else d3.select(this).attr('fill', colorTheme.darker.background)
        })
        .on('mouseout', function () {
          if (reserved.main.mode === 'expand') { d3.select(this).attr('fill', colorTheme.darker.background) } else d3.select(this).attr('fill', colorTheme.bright.background)
        })
        .on('click', function () {
          let dataPointFuturTop = [
            { x: -4, y: 4 },
            { x: -5, y: 5 },
            { x: -5, y: box.blockQueueServerIcon.h + 5 },
            {
              x: box.blockQueueServerIcon.w - 5,
              y: box.blockQueueServerIcon.h + 5
            },
            {
              x: box.blockQueueServerIcon.w - 4,
              y: box.blockQueueServerIcon.h + 4
            },
            { x: -4, y: box.blockQueueServerIcon.h + 4 },
            { x: -5, y: box.blockQueueServerIcon.h + 5 },
            { x: -4, y: box.blockQueueServerIcon.h + 4 },
            { x: -4, y: 4 }
          ]
          reserved.icon.g
            .select('path')
            .data([dataPointFuturTop])
            .transition()
            .duration(timeD.animArc)
            .attr('d', lineGenerator)
          reserved.icon.g
            .select('image')
            .transition()
            .duration(timeD.animArc)
            .attr('x', box.blockQueueServerIcon.w * 0.2 - 4)
            .attr('y', box.blockQueueServerIcon.h * 0.2 + 4)
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('x', -4)
            .attr('y', 4)
            .attr('fill', colorTheme.darker.background)
            .on('end', function () {
              reserved.main.mode = 'expand'
              drawBlockQueueServer()
            })
        })
      reserved.icon.g
        .append('svg:image')
        .attr('xlink:href', '/static/icons/blocks.svg')
        .attr('width', box.blockQueueServerIcon.w * 0.6)
        .attr('height', box.blockQueueServerIcon.h * 0.6)
        .attr('x', box.blockQueueServerIcon.w * 0.2)
        .attr('y', box.blockQueueServerIcon.h * 0.2)
        .style('pointer-events', 'none')
    }
    this.initData = initData

    function drawBlockQueueServer () {
      function drawBack () {
        let lineGenerator = d3
          .line()
          .x(function (d) {
            return d.x
          })
          .y(function (d) {
            return d.y
          })
          .curve(d3.curveLinear)
        let b = {
          x: box.blockQueueServer.marg,
          y: box.blockQueueServer.marg,
          w: box.blockQueueServer.w - 2 * box.blockQueueServer.marg,
          h: box.blockQueueServer.h - 2 * box.blockQueueServer.marg
        }
        let dataPointBottom = [
          { x: b.x + b.w * 0.1, y: b.y },
          { x: b.x + b.w, y: b.y },
          { x: b.x + b.w, y: b.y + b.h },
          { x: b.x, y: b.y + b.h },
          { x: b.x, y: b.y + b.h * 0.3 },
          { x: b.x + b.w * 0.1, y: b.y + b.h * 0.3 },
          { x: b.x + b.w * 0.1, y: b.y }
        ]
        reserved.back.g
          .append('path')
          .data([dataPointBottom])
          .attr('d', lineGenerator)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.medium.stroke)
          .attr('stroke-width', 0.2)

        let depth = 3
        let dataPointFuturTop = [
          { x: b.x + b.w * 0.1, y: b.y },
          { x: b.x + b.w * 0.1 - depth, y: b.y + depth },
          { x: b.x + b.w * 0.1 - depth, y: b.y + b.h * 0.3 },
          { x: b.x, y: b.y + b.h * 0.3 },
          { x: b.x - depth, y: b.y + b.h * 0.3 + depth },
          { x: b.x - depth, y: b.y + b.h + depth },
          { x: b.x + b.w - depth, y: b.y + b.h + depth },
          { x: b.x + b.w, y: b.y + b.h },
          { x: b.x, y: b.y + b.h },
          { x: b.x - depth, y: b.y + b.h + depth },
          { x: b.x, y: b.y + b.h },
          { x: b.x, y: b.y + b.h * 0.3 },
          { x: b.x + b.w * 0.1, y: b.y + b.h * 0.3 }
        ]
        reserved.back.g
          .append('path')
          .data([dataPointFuturTop])
          .attr('d', lineGenerator)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
      }
      function drawTitle () {
        reserved.title.g
          .append('svg:image')
          .attr('xlink:href', '/static/icons/blocks.svg')
          .attr('width', box.blockQueueServerTitle.h * 0.6)
          .attr('height', box.blockQueueServerTitle.h * 0.6)
          .attr(
            'x',
            box.blockQueueServerTitle.w * 0.075 -
              box.blockQueueServerTitle.h * 0.3
          )
          .attr(
            'y',
            box.blockQueueServerTitle.h * 0.6 -
              box.blockQueueServerTitle.h * 0.3
          )
          .style('pointer-events', 'none')
        reserved.title.g
          .append('text')
          .text('Scheduling blocks')
          .attr('x', box.blockQueueServerTitle.w * 0.125)
          .attr('y', box.blockQueueServerTitle.h * 0.7)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '14px')
          .attr('text-anchor', 'start')
        // .attr('transform', 'translate(' +
        //   (box.blockQueueServerTitle.x + box.blockQueueServerTitle.w * 0.5) +
        //   ',' + (box.blockQueueServerTitle.y + box.blockQueueServerTitle.h * 1.0) + ')')
      }

      reserved.back.g = reserved.main.g
        .append('g')
        .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
      reserved.title.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.blockQueueServerTitle.x +
            ',' +
            box.blockQueueServerTitle.y +
            ')'
        )
      reserved.filter.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.blockQueueServerFilter.x +
            ',' +
            box.blockQueueServerFilter.y +
            ')'
        )
      reserved.content.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.blockQueueServerContent.x +
            ',' +
            box.blockQueueServerContent.y +
            ')'
        )

      drawBack()
      drawTitle()

      reserved.content.g
        .append('rect')
        .attr('x', 0 + 1)
        .attr('y', -16)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorTheme.dark.background)
        .on('click', function () {
          blockQueueServer.changeDisplayer('blockQueue')
        })
      reserved.content.g
        .append('svg:image')
        .attr('xlink:href', '/static/icons/blocks-vert-hori.svg')
        .attr('width', 12)
        .attr('height', 12)
        .attr('x', 0 + 2.25)
        .attr('y', -16 + 1.5)
        .style('pointer-events', 'none')

      reserved.content.g
        .append('rect')
        .attr('x', 20 + 1)
        .attr('y', -16)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorTheme.dark.background)
        .on('click', function () {
          blockQueueServer.changeDisplayer('blockQueue2')
        })
      reserved.content.g
        .append('svg:image')
        .attr('xlink:href', '/static/icons/blocks-diag.svg')
        .attr('width', 12)
        .attr('height', 12)
        .attr('x', 20 + 2.25)
        .attr('y', -16 + 1.5)
        .style('pointer-events', 'none')

      reserved.content.g
        .append('rect')
        .attr('x', 40 + 1)
        .attr('y', -16)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorTheme.dark.background)
        .on('click', function () {
          blockQueueServer.changeDisplayer('blockList')
        })
      reserved.content.g
        .append('svg:image')
        .attr('xlink:href', '/static/icons/blocks-4.svg')
        .attr('width', 12)
        .attr('height', 12)
        .attr('x', 40 + 2.25)
        .attr('y', -16 + 1.5)
        .style('pointer-events', 'none')

      reserved.content.g
        .append('rect')
        .attr('x', 60 + 1)
        .attr('y', -16)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorTheme.dark.background)
        .on('click', function () {
          blockQueueServer.changeDisplayer('blockForm')
        })
      reserved.content.g
        .append('svg:image')
        .attr('xlink:href', '/static/icons/list.svg')
        .attr('width', 12)
        .attr('height', 12)
        .attr('x', 60 + 2.25)
        .attr('y', -16 + 1.5)
        .style('pointer-events', 'none')

      let fbox = box.blockQueueServerFilter
      blockFilters = new BlockFilters({
        main: {
          tag: 'blockQueueFilterTag',
          g: reserved.filter.g,
          box: box.blockQueueServerFilter,
          mode: 'beginner',
          background: {
            fill: colorTheme.dark.background,
            stroke: colorTheme.dark.stroke,
            strokeWidth: 0.1
          },
          colorTheme: colorTheme
        },
        blocks: {
          colorPalette: colorTheme.blocks
        },
        beginner: {
          middle: {
            g: reserved.filter.g.append('g'),
            box: {
              x: box.blockQueueServerFilter.w * 0.33,
              y: 0,
              w: box.blockQueueServerFilter.w * 0.33,
              h: box.blockQueueServerFilter.h
            }
          },
          states: {
            g: reserved.filter.g.append('g'),
            box: {
              x: 0,
              y: 0,
              w: box.blockQueueServerFilter.w * 0.2,
              h: box.blockQueueServerFilter.h * 0.33
            },
            token: {
              id: 'statesToken',
              type: 'states',
              filtering: []
            }
          },
          tels: {
            g: reserved.filter.g.append('g'),
            box: {
              x: box.blockQueueServerFilter.w * 0.7,
              y: box.blockQueueServerFilter.h * 0.4,
              w: box.blockQueueServerFilter.w * 0.2,
              h: box.blockQueueServerFilter.h * 0.6
            },
            token: {
              id: 'telsToken',
              type: 'tels',
              filtering: []
            }
          },
          targets: {
            g: reserved.filter.g.append('g'),
            box: {
              x: box.blockQueueServerFilter.w * 0.1,
              y: box.blockQueueServerFilter.h * 0.4,
              w: box.blockQueueServerFilter.w * 0.2,
              h: box.blockQueueServerFilter.h * 0.6
            },
            targetIds: extractTargets(),
            token: {
              id: 'targetsToken',
              type: 'targets',
              filtering: []
            }
          },
          time: {
            g: reserved.filter.g.append('g'),
            box: {
              x: box.blockQueueServerFilter.w * 0.66,
              y: 0,
              w: box.blockQueueServerFilter.w * 0.33,
              h: box.blockQueueServerFilter.h * 0.33
            },
            token: {
              id: 'timeToken',
              type: 'time',
              filtering: []
            }
          }
        },
        expert: {
          tokenFocus: {},
          enabled: {
            g: reserved.filter.g.append('g'),
            box: { x: 0, y: 0, w: fbox.w * 1, h: fbox.h * 0.15 },
            scroll: {
              direction: 'vertical'
            }
          },
          disabled: {
            g: reserved.filter.g.append('g'),
            box: {
              x: 0,
              y: 0 + fbox.h * 0.85,
              w: fbox.w * 1,
              h: fbox.h * 0.15
            },
            scroll: {
              direction: 'vertical'
            }
          },
          content: {
            g: reserved.filter.g.append('g'),
            box: { x: 0, y: 0 + fbox.h * 0.15, w: fbox.w * 1, h: fbox.h * 0.7 },
            button: {
              g: undefined
            },
            panel: {
              g: undefined
            }
          }
        },
        // title: {
        //   g: reserved.filter.g.append('g'),
        //   box: {x: 0, y: 0 + fbox.h * 0.0, w: fbox.w * 0.8, h: fbox.h * 0.1}
        // },
        // result: {
        //   g: reserved.filter.g.append('g'),
        //   box: {x: 0, y: 0 + fbox.h * 0.84, w: fbox.w * 0.8, h: fbox.h * 0.16}
        // },
        filters: [],
        blockQueue: []
      })
      blockFilters.init()

      blockQueueServer = new BlockDisplayer({
        main: {
          tag: 'blockQueueMiddleTag',
          g: reserved.content.g,
          scroll: {},
          box: box.blockQueueServerContent,
          background: {
            fill: colorTheme.medium.background,
            stroke: colorTheme.medium.stroke,
            strokeWidth: 0.4
          },
          colorTheme: colorTheme
        },

        displayer: 'blockTrackShrinkBib',
        blockQueue: {
          axis: {
            enabled: true,
            g: undefined,
            box: {
              x: 0,
              y: box.blockQueueServerContent.h,
              w: box.blockQueueServerContent.w,
              h: 0,
              marg: box.blockQueueServerContent.marg
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            showText: true,
            orientation: 'axisTop',
            attr: {
              text: {
                size: 10,
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
              box: {
                x: 0,
                y: box.blockQueueServerContent.h * 0.32,
                w: box.blockQueueServerContent.w,
                h: box.blockQueueServerContent.h * 0.68,
                marg: box.blockQueueServerContent.marg
              },
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
              box: {
                x: 0,
                y: box.blockQueueServerContent.h * 0.0,
                w: box.blockQueueServerContent.w,
                h: box.blockQueueServerContent.h * 0.3,
                marg: box.blockQueueServerContent.marg
              },
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
              box: {
                x: 0,
                y: box.blockQueueServerContent.h * 0.5,
                w: box.blockQueueServerContent.w,
                h: box.blockQueueServerContent.h * 0.47,
                marg: box.blockQueueServerContent.marg
              },
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
            box: {
              x: 0,
              y: box.blockQueueServerContent.h * 0.025,
              w: box.blockQueueServerContent.w,
              h: box.blockQueueServerContent.h * 0.975,
              marg: box.blockQueueServerContent.marg
            }
          }
        },
        blockQueue2: {
          g: undefined,
          axis: {
            enabled: true,
            g: undefined,
            box: {
              x: 0,
              y: box.blockQueueServerContent.h,
              w: box.blockQueueServerContent.w,
              h: 0,
              marg: box.blockQueueServerContent.marg
            },
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
            enabled: true,
            g: undefined,
            box: {
              x: 0,
              y: box.blockQueueServerContent.h * 0.025,
              w: box.blockQueueServerContent.w,
              h: box.blockQueueServerContent.h * 0.975,
              marg: box.blockQueueServerContent.marg
            }
          }
        },
        blockTrackShrink: {
          g: undefined,
          schedBlocks: {
            label: {
              enabled: true,
              position: 'left'
            }
          },
          axis: {
            enabled: true,
            g: undefined,
            box: {
              x: 0,
              y: box.blockQueueServerContent.h,
              w: box.blockQueueServerContent.w,
              h: 0,
              marg: box.blockQueueServerContent.marg
            },
            axis: undefined,
            scale: undefined,
            domain: [0, 1000],
            range: [0, 0],
            showText: true,
            orientation: 'bottom',
            attr: {
              text: {
                size: 14,
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
            box: {
              x: 0,
              y: box.blockQueueServerContent.h,
              w: box.blockQueueServerContent.w,
              h: 0,
              marg: box.blockQueueServerContent.marg
            }
          }
        },
        blockList: {},
        blockForm: {
          mosaic: {
            box: {
              x: 0,
              y: 0,
              w: box.blockQueueServerContent.w * 0.2,
              h: box.blockQueueServerContent.h,
              marg: box.blockQueueServerContent.marg
            },
            order: 'nSched'
          },
          forms: {
            g: undefined,
            box: {
              x: box.blockQueueServerContent.w * 0.22,
              y: box.blockQueueServerContent.h * 0.02,
              w:
                box.blockQueueServerContent.w * 0.78 -
                box.blockQueueServerContent.h * 0.02,
              h: box.blockQueueServerContent.h * 0.96,
              marg: box.blockQueueServerContent.marg
            },
            display: 'list',
            scroll: {}
          }
        },

        filters: {
          blockFilters: [],
          filtering: []
        },
        time: {
          currentTime: { time: 0, date: undefined },
          startTime: { time: 0, date: undefined },
          endTime: { time: 0, date: undefined }
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
            click: d => {
              console.log(d)
            },
            mouseover: d => {
              console.log(d)
            },
            mouseout: d => {
              console.log(d)
            },
            drag: {
              start: () => {},
              tick: () => {},
              end: () => {}
            }
          },
          sched: {
            click: d => {
              console.log(d)
            },
            mouseover: d => {
              console.log(d)
            },
            mouseout: d => {
              console.log(d)
            }
          }
        },
        input: {
          focus: { schedBlocks: undefined, block: undefined },
          over: { schedBlocks: undefined, block: undefined },
          selection: []
        }
      })
      blockQueueServer.init()

      blockFilters.plugBlockQueue(blockQueueServer, true)

      updateData()
    }

    function updateData () {
      if (reserved.main.mode === 'icon') return
      let telIds = []
      $.each(shared.data.server.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
      })
      console.log(shared.data.server.timeOfNight)
      let startTime = {
        date: new Date(shared.data.server.timeOfNight.date_start),
        time: Number(shared.data.server.timeOfNight.start)
      }
      let endTime = {
        date: new Date(shared.data.server.timeOfNight.date_end),
        time: Number(shared.data.server.timeOfNight.end)
      }
      console.log(startTime)
      blockQueueServer.updateData({
        time: {
          currentTime: {
            date: new Date(shared.data.server.timeOfNight.date_now),
            time: Number(shared.data.server.timeOfNight.now)
          },
          startTime: {
            date: new Date(shared.data.server.timeOfNight.date_start),
            time: Number(shared.data.server.timeOfNight.start)
          },
          endTime: {
            date: new Date(shared.data.server.timeOfNight.date_end),
            time: Number(shared.data.server.timeOfNight.end)
          }
        },
        data: {
          raw: {
            blocks: shared.data.server.blocks,
            telIds: telIds
          },
          modified: []
        }
      })
      blockFilters.updateStats()
    }
    this.updateData = updateData

    function update () {
      if (reserved.main.mode === 'icon') return
      blockQueueServer.update({
        time: {
          currentTime: {
            date: new Date(shared.data.server.timeOfNight.date_now),
            time: Number(shared.data.server.timeOfNight.now)
          },
          startTime: {
            date: new Date(shared.data.server.timeOfNight.date_start),
            time: Number(shared.data.server.timeOfNight.start)
          },
          endTime: {
            date: new Date(shared.data.server.timeOfNight.date_end),
            time: Number(shared.data.server.timeOfNight.end)
          }
        }
      })
    }
    this.update = update
  }
  let SvgEvents = function () {
    let reserved = {
      main: {
        g: undefined,
        mode: 'icon'
      },
      back: {
        g: undefined
      },
      icon: {
        g: undefined
      },
      title: {
        g: undefined
      },
      filter: {
        g: undefined
      },
      content: {
        g: undefined
      }
    }
    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function initData () {
      reserved.main.g = svg.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.eventQueueServer.x +
            ',' +
            box.eventQueueServer.y +
            ')'
        )

      reserved.icon.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.eventQueueServerIcon.x +
            ',' +
            box.eventQueueServerIcon.y +
            ')'
        )
        .attr('opacity', 1)
      reserved.title.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.eventQueueServerTitle.x +
            ',' +
            box.eventQueueServerTitle.y +
            ')'
        )
      reserved.filter.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.eventQueueServerFilter.x +
            ',' +
            box.eventQueueServerFilter.y +
            ')'
        )
      reserved.content.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.eventQueueServerContent.x +
            ',' +
            box.eventQueueServerContent.y +
            ')'
        )

      let lineGenerator = d3
        .line()
        .x(function (d) {
          return d.x
        })
        .y(function (d) {
          return d.y
        })
        .curve(d3.curveLinear)
      let depth = 2
      let dataPointFuturTop = [
        { x: 0, y: 0 },
        { x: -depth, y: depth },
        { x: -depth, y: box.eventQueueServerIcon.h + depth },
        {
          x: box.eventQueueServerIcon.w - depth,
          y: box.eventQueueServerIcon.h + depth
        },
        { x: box.eventQueueServerIcon.w + 0, y: box.eventQueueServerIcon.h },
        { x: 0, y: box.eventQueueServerIcon.h },
        { x: -depth, y: box.eventQueueServerIcon.h + depth },
        { x: 0, y: box.eventQueueServerIcon.h },
        { x: 0, y: 0 }
      ]
      reserved.icon.g
        .append('path')
        .data([dataPointFuturTop])
        .attr('d', lineGenerator)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
      reserved.icon.g
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.eventQueueServerIcon.w)
        .attr('height', box.eventQueueServerIcon.h)
        .attr('fill', colorTheme.bright.background)
        .attr('stroke', colorTheme.bright.stroke)
        .attr('stroke-width', 0.2)
        .on('mouseover', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('fill', colorTheme.dark.background)
        })
        .on('mouseout', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('fill', colorTheme.bright.background)
        })
        .on('click', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('x', -5)
            .attr('y', 5)
          reserved.icon.g
            .transition()
            .duration(timeD.animArc)
            .attr('opacity', 0)
            .on('end', function () {
              reserved.main.mode = 'expand'
              drawEvents()
            })
        })
      reserved.icon.g
        .append('svg:image')
        .attr('xlink:href', '/static/icons/warning.svg')
        .attr('width', box.eventQueueServerIcon.w * 0.6)
        .attr('height', box.eventQueueServerIcon.h * 0.6)
        .attr('x', box.eventQueueServerIcon.w * 0.2)
        .attr('y', box.eventQueueServerIcon.h * 0.2)
        .style('pointer-events', 'none')
    }
    this.initData = initData

    function drawEvents () {
      function drawBack () {
        let lineGenerator = d3
          .line()
          .x(function (d) {
            return d.x
          })
          .y(function (d) {
            return d.y
          })
          .curve(d3.curveLinear)
        let b = {
          x: box.eventQueueServer.marg,
          y: box.eventQueueServer.marg,
          w: box.eventQueueServer.w - 2 * box.eventQueueServer.marg,
          h: box.eventQueueServer.h - 2 * box.eventQueueServer.marg
        }
        let dataPointBottom = [
          { x: b.x, y: b.y },
          { x: b.x + b.w * 0.9, y: b.y },
          { x: b.x + b.w * 0.9, y: b.y + b.h * 0.3 },
          { x: b.x + b.w, y: b.y + b.h * 0.3 },
          { x: b.x + b.w, y: b.y + b.h },
          { x: b.x, y: b.y + b.h },
          { x: b.x, y: b.y }
        ]
        reserved.back.g
          .append('path')
          .data([dataPointBottom])
          .attr('d', lineGenerator)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.medium.stroke)
          .attr('stroke-width', 0.2)

        let dataPointFuturTop = [
          { x: b.x, y: b.y },
          { x: b.x - 5, y: b.y + 5 },
          { x: b.x - 5, y: b.y + b.h + 5 },
          { x: b.x + b.w - 5, y: b.y + b.h + 5 },
          { x: b.x + b.w, y: b.y + b.h },
          { x: b.x, y: b.y + b.h },
          { x: b.x - 5, y: b.y + b.h + 5 },
          { x: b.x, y: b.y + b.h },
          { x: b.x, y: b.y }
        ]
        reserved.back.g
          .append('path')
          .data([dataPointFuturTop])
          .attr('d', lineGenerator)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
      }
      function drawTitle () {
        reserved.title.g
          .append('svg:image')
          .attr('xlink:href', '/static/icons/warning.svg')
          .attr('width', box.eventQueueServerTitle.h * 0.6)
          .attr('height', box.eventQueueServerTitle.h * 0.6)
          .attr(
            'x',
            box.eventQueueServerTitle.w * 0.075 -
              box.eventQueueServerTitle.h * 0.3
          )
          .attr(
            'y',
            box.eventQueueServerTitle.h * 0.6 -
              box.eventQueueServerTitle.h * 0.3
          )
          .style('pointer-events', 'none')
        reserved.title.g
          .append('text')
          .text('Events')
          .attr('x', box.eventQueueServerTitle.w * 0.125)
          .attr('y', box.eventQueueServerTitle.h * 0.7)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '14px')
          .attr('text-anchor', 'start')
        // .attr('transform', 'translate(' +
        //   (box.eventQueueServerTitle.x + box.eventQueueServerTitle.w * 0.5) +
        //   ',' + (box.eventQueueServerTitle.y + box.eventQueueServerTitle.h * 1.0) + ')')
      }

      reserved.back.g = reserved.main.g
        .append('g')
        .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
      reserved.title.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.eventQueueServerTitle.x +
            ',' +
            box.eventQueueServerTitle.y +
            ')'
        )
      reserved.filter.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.eventQueueServerFilter.x +
            ',' +
            box.eventQueueServerFilter.y +
            ')'
        )
      reserved.content.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.eventQueueServerContent.x +
            ',' +
            box.eventQueueServerContent.y +
            ')'
        )

      drawBack()
      drawTitle()
      // let adjustedBox = {
      //   x: box.eventQueueServer.x + box.eventQueueServer.w * 0.03,
      //   y: box.eventQueueServer.y + box.eventQueueServer.h * 0.05,
      //   w: box.eventQueueServer.w * 0.94,
      //   h: box.eventQueueServer.h * 0.8,
      //   marg: lenD.w[0] * 0.01
      // }
      //
      // gBlockBox = svg.g.append('g')
      //   .attr('transform', 'translate(' + adjustedBox.x + ',' + adjustedBox.y + ')')
      // gBlockBox.append('text')
      //   .text('Occured events')
      //   .style('fill', colorTheme.medium.text)
      //   .style('font-weight', '')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(-5,' + (adjustedBox.h * 0.5) + ') rotate(270)')
      //
      // eventQueue.init({
      //   main: {
      //     tag: 'eventQueueDefaultTag',
      //     g: gBlockBox,
      //     box: adjustedBox,
      //     background: {
      //       fill: colorTheme.dark.background,
      //       stroke: colorTheme.dark.stroke,
      //       strokeWidth: 0.1
      //     },
      //     colorTheme: colorTheme
      //   },
      //   tag: 'eventQueueDefaultTag',
      //   g: gBlockBox,
      //   box: adjustedBox,
      //   axis: {
      //     enabled: true,
      //     group: {
      //       g: undefined,
      //       box: {x: 0, y: 0, w: adjustedBox.w, h: 0, marg: 0}
      //     },
      //     axis: undefined,
      //     scale: undefined,
      //     domain: [0, 1000],
      //     range: [0, 0],
      //     showText: true,
      //     orientation: 'axisTop'
      //   },
      //   blocks: {
      //     enabled: true,
      //     group: {
      //       g: undefined,
      //       box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
      //     },
      //     events: {
      //       click: () => {},
      //       mouseover: () => {},
      //       mouseout: () => {}
      //     }
      //   },
      //   filters: {
      //     enabled: false,
      //     group: {
      //       g: undefined,
      //       box: {x: adjustedBox.w * 1.03, y: adjustedBox.h * 0, w: adjustedBox.w * 0.22, h: adjustedBox.h * 1, marg: 0},
      //     },
      //     filters: []
      //   },
      //   timeBars: {
      //     enabled: true,
      //     group: {
      //       g: undefined,
      //       box: {x: 0, y: 0, w: adjustedBox.w, h: adjustedBox.h, marg: adjustedBox.marg}
      //     }
      //   },
      //   data: {
      //     currentTime: {time: 0, date: undefined},
      //     startTime: {time: 0, date: undefined},
      //     endTime: {time: 0, date: undefined},
      //     lastRawData: undefined,
      //     formatedData: undefined
      //   },
      //   debug: {
      //     enabled: false
      //   }
      // })
      //
      // updateData(dataIn)
    }

    function updateData (dataIn) {
      if (reserved.main.mode === 'icon') return
      eventQueue.update({
        currentTime: {
          date: new Date(dataIn.timeOfNight.date_now),
          time: Number(dataIn.timeOfNight.now)
        },
        startTime: {
          date: new Date(dataIn.timeOfNight.date_start),
          time: Number(dataIn.timeOfNight.start)
        },
        endTime: {
          date: new Date(dataIn.timeOfNight.date_end),
          time: Number(dataIn.timeOfNight.end)
        },
        data: dataIn.external_events[0]
      })
    }
    this.updateData = updateData
  }
  let SvgTelescopes = function () {
    let reserved = {
      main: {
        g: undefined,
        mode: 'icon'
      },
      back: {
        g: undefined
      },
      icon: {
        g: undefined
      },
      title: {
        g: undefined
      },
      filter: {
        g: undefined
      },
      content: {
        g: undefined
      }
    }

    function dummy () {
      reserved.plot.main.g
        .append('rect')
        .attr('x', reserved.plot.main.box.x)
        .attr('y', reserved.plot.main.box.y)
        .attr('width', reserved.plot.main.box.w)
        .attr('height', reserved.plot.main.box.h)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
    }

    function initFilters () {
      function createSystemsHealthFilter (key, box) {
        reserved.filters.g
          .append('text')
          .text(key)
          .style('fill', colorTheme.medium.text)
          .style('font-weight', '')
          .style('font-size', '7px')
          .attr('text-anchor', 'middle')
          .attr(
            'transform',
            'translate(' +
              (box.x + box.w * 0.5) +
              ',' +
              (box.y + box.h - box.w * 0.6) +
              ')'
          )
        reserved.filters.g
          .append('rect')
          .attr('x', box.x + box.w * 0.325)
          .attr('y', box.y + box.h - box.w * 0.5)
          .attr('width', box.w * 0.35)
          .attr('height', box.w * 0.35)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)

        reserved.filters.g
          .append('rect')
          .attr('x', box.x + box.w * 0.35)
          .attr('y', box.y - box.w * 0.1)
          .attr('width', box.w * 0.3)
          .attr('height', box.w * 0.1)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        reserved.filters.g
          .append('line')
          .attr('x1', box.x + box.w * 0.5)
          .attr('y1', box.y)
          .attr('x2', box.x + box.w * 0.5)
          .attr('y2', box.y + box.h - box.w * 1.25)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        reserved.filters.g
          .append('rect')
          .attr('x', box.x + box.w * 0.35)
          .attr('y', box.y + box.h - box.w * 1.25)
          .attr('width', box.w * 0.3)
          .attr('height', box.w * 0.1)
          .attr('fill', colorTheme.dark.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)

        let height = box.h - box.w * 1.25
        reserved.filters.g
          .append('rect')
          .attr('x', box.x + box.w * 0.5 + box.w * 0.1)
          .attr('y', box.y + height - height * 0.75 - box.w * 0.125)
          .attr('width', box.w * 0.25)
          .attr('height', box.w * 0.25)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
        reserved.filters.g
          .append('rect')
          .attr('x', box.x + box.w * 0.5 + box.w * 0.1)
          .attr('y', box.y + height - height * 0.5 - box.w * 0.125)
          .attr('width', box.w * 0.25)
          .attr('height', box.w * 0.25)
          .attr('fill', colorTheme.medium.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
      }
      reserved.filters = {
        g: reserved.gBlockBox.append('g'),
        box: {
          x: box.telescopes.w * 0.4 - box.telescopes.marg * 2.5,
          y: box.telescopes.marg * 3,
          w: box.telescopes.w * 0.19 + box.telescopes.marg * 2,
          h: box.telescopes.h * 0.8 - 6 * box.telescopes.marg,
          marg: box.telescopes.marg
        }
      }
      reserved.filters.g.attr(
        'transform',
        'translate(' +
          reserved.filters.box.x +
          ',' +
          reserved.filters.box.y +
          ')'
      )
      // reserved.filters.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.filters.box.w)
      //   .attr('height', reserved.filters.box.h)
      //   .attr('fill', colorTheme.darker.background)
      //   .attr('stroke', colorTheme.darker.stroke)
      //   .attr('stroke-width', 0.2)

      reserved.filters.g
        .append('text')
        .text('Tels types:')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr(
          'transform',
          'translate(' +
            reserved.filters.box.w * 0.5 +
            ',' +
            reserved.filters.box.h * 0.06 +
            ')'
        )

      reserved.filters.g
        .append('text')
        .text('LTs:')
        .style('fill', colorTheme.medium.text)
        // .style('stroke', colorTheme.medium.text)
        // .style('stroke-size', 0.1)
        .style('font-weight', '')
        .style('font-size', '7px')
        .attr('text-anchor', 'start')
        .attr(
          'transform',
          'translate(' +
            reserved.filters.box.w * 0.09 +
            ',' +
            reserved.filters.box.h * 0.16 +
            ')'
        )
      reserved.filters.g
        .append('rect')
        .attr('x', reserved.filters.box.w * (0.03 + 0.18))
        .attr('y', reserved.filters.box.h * 0.1)
        .attr('width', reserved.filters.box.h * 0.07)
        .attr('height', reserved.filters.box.h * 0.07)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)

      reserved.filters.g
        .append('text')
        .text('MTs:')
        .style('fill', colorTheme.medium.text)
        // .style('stroke', colorTheme.medium.text)
        // .style('stroke-size', 0.1)
        .style('font-weight', '')
        .style('font-size', '7px')
        .attr('text-anchor', 'start')
        .attr(
          'transform',
          'translate(' +
            reserved.filters.box.w * 0.36 +
            ',' +
            reserved.filters.box.h * 0.16 +
            ')'
        )
      reserved.filters.g
        .append('rect')
        .attr('x', reserved.filters.box.w * (0.36 + 0.15))
        .attr('y', reserved.filters.box.h * 0.1)
        .attr('width', reserved.filters.box.h * 0.07)
        .attr('height', reserved.filters.box.h * 0.07)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)

      reserved.filters.g
        .append('text')
        .text('STs:')
        .style('fill', colorTheme.medium.text)
        // .style('stroke', colorTheme.medium.text)
        // .style('stroke-size', 0.1)
        .style('font-weight', '')
        .style('font-size', '7px')
        .attr('text-anchor', 'start')
        .attr(
          'transform',
          'translate(' +
            reserved.filters.box.w * 0.66 +
            ',' +
            reserved.filters.box.h * 0.16 +
            ')'
        )
      reserved.filters.g
        .append('rect')
        .attr('x', reserved.filters.box.w * (0.66 + 0.13))
        .attr('y', reserved.filters.box.h * 0.1)
        .attr('width', reserved.filters.box.h * 0.07)
        .attr('height', reserved.filters.box.h * 0.07)
        .attr('fill', colorTheme.medium.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)

      reserved.filters.g
        .append('text')
        .text('Systems & health:')
        .style('fill', colorTheme.medium.text)
        .style('font-weight', '')
        .style('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr(
          'transform',
          'translate(' +
            reserved.filters.box.w * 0.5 +
            ',' +
            reserved.filters.box.h * 0.3 +
            ')'
        )

      createSystemsHealthFilter('Cam', {
        x: 0,
        y: reserved.filters.box.h * 0.4,
        w: reserved.filters.box.w * 0.25,
        h: reserved.filters.box.h * 0.6
      })
      createSystemsHealthFilter('Mir', {
        x: reserved.filters.box.w * 0.25,
        y: reserved.filters.box.h * 0.4,
        w: reserved.filters.box.w * 0.25,
        h: reserved.filters.box.h * 0.6
      })
      createSystemsHealthFilter('Mou', {
        x: reserved.filters.box.w * 0.5,
        y: reserved.filters.box.h * 0.4,
        w: reserved.filters.box.w * 0.25,
        h: reserved.filters.box.h * 0.6
      })
      createSystemsHealthFilter('Aux', {
        x: reserved.filters.box.w * 0.75,
        y: reserved.filters.box.h * 0.4,
        w: reserved.filters.box.w * 0.25,
        h: reserved.filters.box.h * 0.6
      })
    }
    function initView () {
      function createArrZoomerButton () {
        reserved.view.main.g
          .append('rect')
          .attr(
            'x',
            reserved.view.main.box.x + reserved.view.main.box.marg * 1.2
          )
          .attr('y', reserved.view.main.box.y)
          .attr('width', 1.8 * reserved.view.main.box.marg)
          .attr('height', 1.8 * reserved.view.main.box.marg)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
      }
      function createListButton () {
        reserved.view.main.g
          .append('rect')
          .attr(
            'x',
            reserved.view.main.box.x + reserved.view.main.box.marg * 1.2
          )
          .attr(
            'y',
            reserved.view.main.box.y + 1.8 * reserved.view.main.box.marg
          )
          .attr('width', 1.8 * reserved.view.main.box.marg)
          .attr('height', 1.8 * reserved.view.main.box.marg)
          .attr('fill', colorTheme.darker.background)
          .attr('stroke', colorTheme.darker.stroke)
          .attr('stroke-width', 0.2)
      }
      reserved.view = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: 0,
            y: 0,
            w: box.telescopes.w * 0.5,
            h: box.telescopes.h * 1,
            marg: box.telescopes.marg
          }
        },
        telsList: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: box.telescopes.marg * 1 + box.telescopes.w * 0.0,
            y: box.telescopes.marg * 2 + box.telescopes.h * 0.0,
            w: box.telescopes.w * 0.4 - box.telescopes.marg * 4,
            h: box.telescopes.h * 0.8 - box.telescopes.marg * 4,
            marg: box.telescopes.marg
          }
          // box: {
          //   x: box.telescopes.marg * 4,
          //   y: box.telescopes.marg * 2,
          //   w: box.telescopes.w * 0.5 - 4 * box.telescopes.marg,
          //   h: box.telescopes.h * 0.9 - 4 * box.telescopes.marg,
          //   marg: box.telescopes.marg
          // }
        },
        projection: 'arrZoomer' // 'list'
      }

      reserved.view.main.g.attr(
        'transform',
        'translate(' +
          reserved.view.main.box.x +
          ',' +
          reserved.view.main.box.y +
          ')'
      )
      reserved.view.telsList.g.attr(
        'transform',
        'translate(' +
          reserved.view.telsList.box.x +
          ',' +
          reserved.view.telsList.box.y +
          ')'
      )

      // reserved.view.telsList.g.append('rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', reserved.view.telsList.box.w)
      //   .attr('height', reserved.view.telsList.box.h)
      //   .attr('fill', colorTheme.darker.stroke)
      //   .attr('stroke', colorTheme.darker.stroke)
      //   .attr('stroke-width', 0.2)

      // createArrZoomerButton()
      // createListButton()

      // let telsArray = new TelsArray({
      //   main: {
      //     tag: 'telsArrayTag',
      //     g: reserved.view.main.g,
      //     box: {x: reserved.view.main.box.x + 3 * reserved.view.main.box.marg,
      //       y: reserved.view.main.box.y,
      //       w: reserved.view.main.box.w - 2 * reserved.view.main.box.marg,
      //       h: reserved.view.main.box.h,
      //       marg: 0},
      //     colorTheme: colorTheme
      //   },
      //   dataPanel: {
      //     g: undefined,
      //     box: {x: 0,
      //       y: 0,
      //       w: reserved.view.main.box.w - 2 * reserved.view.main.box.marg,
      //       h: reserved.view.main.box.h,
      //       marg: 0},
      //     zoomable: true,
      //     telsId: true,
      //     event: {
      //       click: () => {},
      //       mouseover: () => {},
      //       mouseout: () => {}
      //     }
      //   },
      //   optionsPanel: {
      //     g: undefined,
      //     box: {x: 0, y: 0, w: 100, h: 100, marg: 0}
      //   },
      //   focusOverlay: {
      //     enabled: true,
      //     g: undefined
      //   },
      //   highlightOverlay: {
      //     enabled: true,
      //     g: undefined
      //   },
      //   time: {
      //     currentTime: shared.data.server.timeOfNight.now
      //   },
      //   data: {
      //     raw: {
      //       blocks: [],
      //       telIds: []
      //     }
      //   },
      //   debug: {
      //     enabled: false
      //   }
      // })
      // telsArray.init()
      updateTelsList()
    }
    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function initData () {
      reserved.main.g = svg.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.telsQueueServer.x +
            ',' +
            box.telsQueueServer.y +
            ')'
        )

      reserved.icon.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.telsQueueServerIcon.x +
            ',' +
            box.telsQueueServerIcon.y +
            ')'
        )
        .attr('opacity', 1)
      reserved.title.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.telsQueueServerTitle.x +
            ',' +
            box.telsQueueServerTitle.y +
            ')'
        )
      reserved.filter.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.telsQueueServerFilter.x +
            ',' +
            box.telsQueueServerFilter.y +
            ')'
        )
      reserved.content.g = reserved.main.g
        .append('g')
        .attr(
          'transform',
          'translate(' +
            box.telsQueueServerContent.x +
            ',' +
            box.telsQueueServerContent.y +
            ')'
        )

      let lineGenerator = d3
        .line()
        .x(function (d) {
          return d.x
        })
        .y(function (d) {
          return d.y
        })
        .curve(d3.curveLinear)
      let depth = 2
      let dataPointFuturTop = [
        { x: 0, y: 0 },
        { x: -depth, y: depth },
        { x: -depth, y: box.telsQueueServerIcon.h + depth },
        {
          x: box.telsQueueServerIcon.w - depth,
          y: box.telsQueueServerIcon.h + depth
        },
        { x: box.telsQueueServerIcon.w + 0, y: box.telsQueueServerIcon.h },
        { x: 0, y: box.telsQueueServerIcon.h },
        { x: -depth, y: box.telsQueueServerIcon.h + depth },
        { x: 0, y: box.telsQueueServerIcon.h },
        { x: 0, y: 0 }
      ]
      reserved.icon.g
        .append('path')
        .data([dataPointFuturTop])
        .attr('d', lineGenerator)
        .attr('fill', colorTheme.darker.background)
        .attr('stroke', colorTheme.darker.stroke)
        .attr('stroke-width', 0.2)
      reserved.icon.g
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', box.telsQueueServerIcon.w)
        .attr('height', box.telsQueueServerIcon.h)
        .attr('fill', colorTheme.bright.background)
        .attr('stroke', colorTheme.bright.stroke)
        .attr('stroke-width', 0.2)
        .on('mouseover', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('fill', colorTheme.dark.background)
        })
        .on('mouseout', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('fill', colorTheme.bright.background)
        })
        .on('click', function () {
          d3
            .select(this)
            .transition()
            .duration(timeD.animArc)
            .attr('x', -5)
            .attr('y', 5)
          reserved.icon.g
            .transition()
            .duration(timeD.animArc)
            .attr('opacity', 0)
            .on('end', function () {
              reserved.main.mode = 'expand'
              drawTels()
            })
        })
      reserved.icon.g
        .append('svg:image')
        .attr('xlink:href', '/static/icons/telescope.svg')
        .attr('width', box.telsQueueServerIcon.w * 0.6)
        .attr('height', box.telsQueueServerIcon.h * 0.6)
        .attr('x', box.telsQueueServerIcon.w * 0.2)
        .attr('y', box.telsQueueServerIcon.h * 0.2)
        .style('pointer-telss', 'none')
    }
    this.initData = initData

    function drawTels () {
      reserved.adjustedBox = {
        x: box.telescopes.marg,
        y: box.telescopes.marg,
        w: box.telescopes.w - 2 * box.telescopes.marg,
        h: box.telescopes.h - 2 * box.telescopes.marg,
        marg: box.telescopes.marg
      }
      reserved.gBlockBox = svg.g
        .append('g')
        .attr(
          'transform',
          'translate(' + box.telescopes.x + ',' + box.telescopes.y + ')'
        )
      // reserved.gBlockBox.append('rect')
      //   .attr('x', reserved.adjustedBox.x)
      //   .attr('y', reserved.adjustedBox.y)
      //   .attr('width', reserved.adjustedBox.w)
      //   .attr('height', reserved.adjustedBox.h)
      //   .attr('fill', colorTheme.dark.background)
      //   .attr('stroke', colorTheme.dark.stroke)
      //   .attr('stroke-width', 0.2)

      reserved.plot = {
        main: {
          g: reserved.gBlockBox.append('g'),
          box: {
            x: box.telescopes.w * 0.5 + box.telescopes.marg * 4,
            y: box.telescopes.marg * 2,
            w: box.telescopes.w * 0.5 - 4 * box.telescopes.marg,
            h: box.telescopes.h * 0.8 - 4 * box.telescopes.marg,
            marg: box.telescopes.marg
          }
        }
      }

      // reserved.gBlockBox.append('text')
      //   .text('Unused Telescopes')
      //   .style('fill', colorTheme.dark.text)
      //   .style('font-weight', 'normal')
      //   .style('font-size', '8px')
      //   .attr('text-anchor', 'middle')
      //   .attr('transform', 'translate(4,' + (reserved.view.main.box.h * 0.5) + ') rotate(270)')
      // reserved.view.main.g = reserved.gBlockBox.append('g')
      //   .attr('transform', 'translate(' + reserved.view.main.box.marg + ',0)')
      initView()
      initFilters()
      dummy()
    }

    function updateTelsList () {
      function strokeSize (val) {
        return 0.4 // (2 - (2 * (val / 100)))
      }
      function fillOpacity (val) {
        return 1 // (0.9 - (0.5 * (val / 100)))
      }

      let tels = deepCopy(shared.data.server.telHealth)
      let defaultHeightView = reserved.view.telsList.box.h
      let widthBlocks = reserved.view.telsList.box.w
      // let offsetX = (box.currentBlocks.w - widthBlocks) * 0.5

      let telsPerRow = 8
      let sizeTelsRow = 0.0715
      let offsetTelsType = 0.5

      let ratio = 1

      let off = 0
      if (tels.length > 0 && tels[0].id.split('_')[0] === 'M') off -= 1
      if (tels.length > 0 && tels[0].id.split('_')[0] === 'S') off -= 2

      let telsBox = {
        x: reserved.view.telsList.box.marg,
        y: reserved.view.telsList.box.marg,
        w: widthBlocks,
        h: defaultHeightView
      }
      let offset = {
        x: telsBox.w / telsPerRow,
        ty: ratio * offsetTelsType * sizeTelsRow * defaultHeightView,
        y: ratio * sizeTelsRow * defaultHeightView
      }

      let currentTels = reserved.view.telsList.g
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
          let tx =
            -(parseInt((i + toff) / telsPerRow) % 2) === 0
              ? offset.x * (0.5 + (i + toff) % telsPerRow)
              : offset.x * (0.0 + telsPerRow) -
                offset.x * (0.5 + (i + toff) % telsPerRow)
          if (toff % 2 === 1) tx += offset.x
          let ty =
            offset.y * (0.5 + parseInt((i + toff) / telsPerRow)) +
            toff * offset.ty
          return 'translate(' + tx + ',' + ty + ')'
        })
        d3
          .select(this)
          .append('rect')
          .attr('x', function (d) {
            return -offset.x * 0.5 + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
          })
          .attr('y', function (d) {
            return -offset.y * 0.5 + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
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
        d3
          .select(this)
          .append('text')
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

        d3
          .select(this)
          .attr('transform', function (d) {
            let tx =
              -(parseInt((i + toff) / telsPerRow) % 2) === 0
                ? offset.x * (0.5 + (i + toff) % telsPerRow)
                : offset.x * (0.0 + telsPerRow) -
                  offset.x * (0.5 + (i + toff) % telsPerRow)
            // if (toff % 2 === 1) tx += 2 * offset.x
            let ty =
              offset.y * (0.5 + parseInt((i + toff) / telsPerRow)) +
              toff * offset.ty
            return 'translate(' + tx + ',' + ty + ')'
          })
          .style('opacity', function () {
            if (!d.running) return 1
            return 0.4
          })
        d3
          .select(this)
          .select('rect')
          .transition()
          .duration(timeD.animArc)
          .attr('x', function (d) {
            return -offset.x * 0.5 + strokeSize(d.val) * 0.5 // (-offset.x * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
          })
          .attr('y', function (d) {
            return -offset.y * 0.5 + strokeSize(d.val) * 0.5 // (-offset.y * (0.5 - (0.15 * (d.val / 100)))) + (4 - (3 * (d.val / 100))) * 0.5
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
        d3
          .select(this)
          .select('text')
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
    this.updateTelsList = updateTelsList
    function updateData (dataIn) {}
    this.updateData = updateData
  }
  let SvgDAQ = function () {
    function init () {}
    this.init = init
  }
  // let SvgBottomInfo = function () {
  //   let gBlockBox
  //   let clockEvents
  //
  //   function initData (dataIn) {
  //     gBlockBox = svg.g.append('g')
  //
  //     clockEvents = new ClockEvents()
  //     clockEvents.init({
  //       g: gBlockBox,
  //       box: box.clock,
  //       colorTheme: colorTheme.medium
  //     })
  //     clockEvents.setHour(new Date(com.dataIn.data.timeOfNight.date_now))
  //     clockEvents.setSendFunction(function (date) {
  //       blockQueueServer.addExtraBar(date)
  //       eventQueue.addExtraBar(date)
  //     })
  //     clockEvents.addEvent(com.dataIn.data.external_clockEvents[0])
  //
  //     // let startEvent = new Date(com.dataIn.data.timeOfNight.now).getTime() + ((Math.random() * 3) + 2) * 60000
  //     // let endEvent = new Date(startEvent).getTime() + 10000
  //     // clockEvents.addEvent({id: 'E' + Math.floor(Math.random() * 1000000), name: 'moonrise', icon: null, startTime: startEvent, endTime: endEvent})
  //   }
  //   this.initData = initData
  //
  //   function updateData (dataIn) {
  //     clockEvents.setHour(new Date(com.dataIn.data.timeOfNight.date_now))
  //     clockEvents.addEvent(com.dataIn.data.external_clockEvents[0])
  //     // let rnd = Math.random()
  //     // if (rnd < 0.8) {
  //     //   let startEvent = new Date(com.dataIn.data.timeOfNight.now).getTime() + ((Math.random() * 3) + 0.4) * 60000
  //     //   let endEvent = new Date(startEvent).getTime() + 10000
  //     //   clockEvents.addEvent({id: Math.floor(Math.random() * 100000), name: 'moonrise', icon: null, startTime: startEvent, endTime: endEvent})
  //     // }
  //   }
  //   this.updateData = updateData
  // }

  let svgBlocksQueueServer = new SvgBlocksQueueServer()
  let svgEvents = new SvgEvents()
  let svgTelescopes = new SvgTelescopes()
  let svgDAQ = new SvgDAQ()
  let svgTextEditor = new SvgTextEditor()
  // let svgTels = new SvgTels()
  // let svgFilterBlocks = new SvgFilterBlocks()
  // let svgFilterTels = new SvgFilterTels()
  // let svgMiddleInfo = new SvgMiddleInfo()
  // let svgBottomInfo = new SvgBottomInfo()
}
