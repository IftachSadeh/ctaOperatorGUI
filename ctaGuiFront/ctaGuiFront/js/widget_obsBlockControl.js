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
var mainScriptTag = 'obsBlockControl'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global tau */
/* global sock */
/* global timeD */
/* global hasVar */
/* global telInfo */
/* global RunLoop */
/* global Locker */
/* global colsYellows */
/* global colsPurples */
/* global appendToDom */
/* global runWhenReady */
/* global BlockQueue */
/* global disableScrollSVG */
/* global bckPattern */
/* global deepCopy */
/* global ScrollBox */
/* global ScrollTable */
/* global FormManager */
/* global TEL_STATES */
/* global getTelState */
/* global telHealthCol */
/* global telStateCol */
/* global telHealthFrac */
/* global ScrollGrid */
/* global colsBlk */
/* global TEL_STATES */

window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollBox.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollGrid.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueue.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollTable.js' })
window.loadScript({ source: mainScriptTag, script: '/js/utils_formManager.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 12
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = {
    SockFunc: sockObsBlockControl,
    MainFunc: mainObsBlockControl
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

// ---------------------------------------------------------------------------------------------------
// additional socket events for this particular widget type
// ---------------------------------------------------------------------------------------------------
let sockObsBlockControl = function (optIn) {}

// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// here we go with the content of this particular widget
// ---------------------------------------------------------------------------------------------------
let mainObsBlockControl = function (optIn) {
  // let myUniqueId = unique()
  let widgetType = optIn.widgetType
  let tagArrZoomerPlotsSvg = optIn.baseName
  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  // let thisObsBlockControl = this
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

    svgMain.initData(dataIn.data)
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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let SvgMain = function () {
    let com = {}
    let svg = {}
    // let thisMain = this

    com.focus = {}

    let lenD = {}
    lenD.w = {}
    lenD.h = {}
    lenD.w[0] = 1000
    lenD.h[0] = lenD.w[0] / sgvTag.main.whRatio

    let tagObsBlkCnt = widgetType
    let tagBlockQueue = tagObsBlkCnt + 'blockQueue'
    let tagBlockTitle = tagObsBlkCnt + 'blockTitle'
    let tagTelScroll = tagObsBlkCnt + 'telScroll'
    let tagObScroll = tagObsBlkCnt + 'obScroll'
    let tagTtelSummary = tagObsBlkCnt + 'telSummary'
    let tagScroller = tagObsBlkCnt + 'scrollBox'
    let tagScrollTable = tagObsBlkCnt + 'scrollTable'
    let tagFormManager = tagObsBlkCnt + 'formManager'

    let blockQueue = new BlockQueue()
    let telScroll = new TelScroll()
    let obScroll = new _obScroll()
    let telSummary = new TelSummary()
    let scrollBox = new ScrollBox()
    let scrollTable = new ScrollTable()
    let formManager = new FormManager()
    let utils = new ObsBlockControlUtils()

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

      com.getScaleWH = function () {
        return {
          w: lenD.w[0] / +svg.svg.node().getBoundingClientRect().width,
          h: lenD.h[0] / +svg.svg.node().getBoundingClientRect().height
        }
      }

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
      let x0, y0, w0, h0, marg
      let gBlockTitle = svg.g.append('g')

      w0 = lenD.w[0] * 0.95
      h0 = lenD.w[0] * 0.025
      x0 = (lenD.w[0] - w0) / 2
      y0 = x0
      marg = w0 * 0.01

      let blockTitleData = {
        id: tagBlockTitle,
        g: gBlockTitle,
        size: h0 * 0.8,
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }
      com.blockTitleData = blockTitleData

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let gBlockBox = svg.g.append('g')

      w0 = blockTitleData.w * 0.6
      h0 = blockTitleData.h * 4.5
      x0 = blockTitleData.x + (1 - w0 / blockTitleData.w) * blockTitleData.w
      y0 = blockTitleData.y + blockTitleData.h + blockTitleData.marg
      marg = blockTitleData.marg

      let blockBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }

      blockQueue.init({
        tag: tagBlockQueue,
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
        futureCanceled: { hide: false, shiftY: false },
        click: function (d) {
          blockFocus({ id: d.id })
        },
        boxData: blockBoxData,
        locker: locker,
        lockerV: [tagObsBlkCnt + 'updateData'],
        lockerZoom: {
          all: tagBlockQueue + 'zoom',
          during: tagBlockQueue + 'zoomDuring',
          end: tagBlockQueue + 'zoomEnd'
        },
        runLoop: runLoop
      })

      let blockQueueBox = blockQueue.get('outerBox')

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let gObBox = svg.g.append('g')

      w0 = (1 - w0 / blockTitleData.w) * blockTitleData.w - blockTitleData.marg // w0/=3
      h0 = blockQueueBox.h
      x0 = blockTitleData.x
      y0 = blockQueueBox.y
      marg = blockQueueBox.marg

      let obScrolBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }

      obScroll.init({
        tag: tagObScroll,
        gBox: gObBox,
        boxData: obScrolBoxData,
        showCounts: true,
        vorClick: function (d) {
          blockFocus({ id: d.data.id })
        },
        lockerV: [tagObsBlkCnt + 'updateData'],
        utils: utils,
        runLoop: runLoop,
        locker: locker
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let gTelBox = svg.g.append('g')

      h0 = blockQueueBox.h * 1.25
      w0 = blockTitleData.w - h0 // w0/=3
      x0 = blockTitleData.x
      y0 = blockQueueBox.y + blockQueueBox.h + 2 * blockQueueBox.marg
      marg = blockQueueBox.marg

      let telScrolBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }

      telScroll.init({
        tag: tagTelScroll,
        gBox: gTelBox,
        boxData: telScrolBoxData,
        vorClick: function (optIn) {
          syncStateSend({
            type: 'syncTelFocus',
            syncTime: Date.now(),
            zoomState: 1,
            target: optIn.data.id
          })
        },
        lockerV: [tagObsBlkCnt + 'updateData'],
        utils: utils,
        runLoop: runLoop,
        locker: locker
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let gTelSummary = svg.g.append('g')

      h0 = telScrolBoxData.h
      w0 = telScrolBoxData.h - telScrolBoxData.marg
      x0 = telScrolBoxData.x + telScrolBoxData.w + telScrolBoxData.marg
      y0 = telScrolBoxData.y
      marg = telScrolBoxData.marg

      // w0   = telScrolBoxData.w * 0.26;
      // h0   = w0;
      // x0   = telScrolBoxData.w - w0;
      // y0   = telScrolBoxData.y + telScrolBoxData.h + 2 * telScrolBoxData.marg;
      // marg = telScrolBoxData.marg;

      let telSummaryData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }

      telSummary.init({
        tag: tagTtelSummary,
        gBox: gTelSummary,
        utils: utils,
        boxData: telSummaryData
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let try0 = true
      let scrollTableData
      if (try0) {
        let gScrollTable = svg.g.append('g')

        h0 = telScrolBoxData.h * 2.5
        w0 = blockTitleData.w
        x0 = blockTitleData.x
        y0 = telScrolBoxData.y + telScrolBoxData.h + telScrolBoxData.marg * 3
        marg = telScrolBoxData.marg

        scrollTableData = {
          x: x0,
          y: y0,
          w: w0,
          h: h0,
          marg: marg
        }

        scrollTable.init({
          tag: tagScrollTable,
          gBox: gScrollTable,
          canScroll: true,
          useRelativeCoords: true,
          title: { text: 'title...' },
          boxData: scrollTableData,
          locker: locker,
          lockerV: [tagObsBlkCnt + 'updateData'],
          lockerZoom: {
            all: tagBlockQueue + 'zoom',
            during: tagBlockQueue + 'zoomDuring',
            end: tagBlockQueue + 'zoomEnd'
          },
          runLoop: runLoop
        })

        let innerBox = scrollTable.get('innerBox')

        let table = {
          id: 'xxx',
          x: innerBox.marg,
          y: innerBox.marg,
          marg: innerBox.marg,
          rowW: innerBox.w,
          rowH: innerBox.h / 4,
          rowsIn: []
        }

        // table.rowsIn.push({ h: 9, colsIn: [{id: '01', w: 0.3}], marg: innerBox.marg })
        table.rowsIn.push({
          h: 2,
          colsIn: [
            { id: '00', w: 0.6, title: 'qwe' },
            { id: '01', w: 0.3, title: 'qw' }
          ],
          marg: innerBox.marg
        })
        table.rowsIn.push({
          h: 2,
          colsIn: [
            { id: '10', w: 0.5, title: 'qw' },
            { id: '11', w: 0.5, title: 'qw' }
          ],
          marg: innerBox.marg
        })
        scrollTable.updateTable({ table: table })

        let innerG = scrollTable.get('innerG')
        let tagForms = 'tagForeignObject'

        formManager.init({
          tag: tagFormManager
        })

        // table.recV = [table.recV[0]]
        // let fornObj = innerG.selectAll("div."+tagForms).data(table.recV, function(d) { return d.id; })
        $.each(table.recV, function (i, d) {
          formManager.addForm({
            id: d.id,
            data: d,
            selection: innerG,
            formSubFunc: function (optIn) {
              console.log('formSubFunc:', optIn)
            },
            tagForm: tagForms,
            disabled: 0,
            getScaleWH: com.getScaleWH
          })
        })
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let try1 = false
      let scrlDataG
      if (try1) {
        // ---------------------------------------------------------------------------------------------------
        //
        // ---------------------------------------------------------------------------------------------------
        let gScrollBox = svg.g.append('g')

        h0 = scrollTableData.h * 0.6
        w0 = blockTitleData.w
        x0 = blockTitleData.x
        y0 = scrollTableData.y + scrollTableData.h + scrollTableData.marg * 3
        marg = scrollTableData.marg

        // w0   = telScrolBoxData.w * 0.26;
        // h0   = w0;
        // x0   = telScrolBoxData.w - w0;
        // y0   = telScrolBoxData.y + telScrolBoxData.h + 2 * telScrolBoxData.marg;
        // marg = telScrolBoxData.marg;

        let scrollBoxData = {
          x: x0,
          y: y0,
          w: w0,
          h: h0,
          marg: marg
        }

        scrollBox.init({
          tag: tagScroller,
          gBox: gScrollBox,
          // style: {
          //   recCol: function(optIn) {
          //     if(optIn.d.id == blockQueue.get('focusId')) return colsPurples[1];
          //     else                                        return colsYellows[2];
          //   },
          //   recFillOpac: function(d,state) {
          //     if(d.id == blockQueue.get('focusId')) return 0.5;
          //     else if(state == 'run')               return 0.3;
          //     else                                  return 0.1;
          //   },
          //   textOpac: function(d) {
          //     return (d.id == blockQueue.get('focusId')) ? 1 : 0;
          //   }
          // },
          // futureCanceled: { hide:false, shiftY:false },
          // click: function(d){ blockFocus({ id:d.id }); },
          canScroll: true,
          scrollHeight: scrollBoxData.h * 2,
          useRelativeCoords: true,
          // title: { h:scrollBoxData.h*0.2, text:"asldklksdj" },
          boxData: scrollBoxData,
          locker: locker,
          lockerV: [tagObsBlkCnt + 'updateData'],
          lockerZoom: {
            all: tagBlockQueue + 'zoom',
            during: tagBlockQueue + 'zoomDuring',
            end: tagBlockQueue + 'zoomEnd'
          },
          runLoop: runLoop
        })

        // setTimeout(function() { console.log('xxxxxxxxxxx'); scrollBox.resetScroller({canScroll:false}); }, 3000);

        // setTimeout(function() { console.log('xxxxxxxxxxx'); scrollBox.resetScroller({canScroll:true, scrollHeight: scrollBoxData.h*5}); }, 6000);
        // setTimeout(function() { console.log('xxxxxxxxxxx'); scrollBox.resetScroller({canScroll:true, scrollHeight: scrollBoxData.h*5/2}); }, 9000);

        // setTimeout(function() { console.log('xxxxxxxxxxx'); let title = scrollBox.get('titleData'); title.text = "77777777"; scrollBox.set({tag:'titleData', data:title}); scrollBox.setTitle(); }, 2000);

        // let scrlBox   = scrollBox.get('innerBox');
        scrlDataG = scrollBox.get('innerG')

        let dd = [
          { id: 0, x: 0, y: 0, w: 30, h: 30 },
          { id: 0, x: 210, y: 110, w: 30, h: 30 },
          { id: 0, x: 230, y: 160, w: 30, h: 30 },
          { id: 0, x: 230, y: 460, w: 30, h: 30 }
        ]

        scrlDataG
          .selectAll('rect.' + tagScroller + 'tagScroller')
          .data(dd, function (d) {
            return d.id
          })
          .enter()
          .append('rect')
          .attr('class', tagScroller + 'tagScroller')
          // .attr("x", function(d,i) { return scrlBox.marg + d.x; })
          // .attr("y", function(d,i) { return scrlBox.marg + d.y; })
          .attr('x', function (d, i) {
            return d.x
          })
          .attr('y', function (d, i) {
            return d.y
          })
          .attr('width', function (d, i) {
            return d.w
          })
          .attr('height', function (d, i) {
            return d.h
          })
          .attr('stroke', '#383B42')
          .attr('stroke-width', '1')
          .attr('stroke-opacity', 0.2)
          .attr('fill', 'red')
          .attr('fill-opacity', 1)
          .style('pointer-events', 'none')
      }

      // ---------------------------------------------------------------------------------------------------
      // time series plot
      // ---------------------------------------------------------------------------------------------------
      let try2 = false
      if (try2) {
        let g = scrlDataG
        let n = 40
        let random = d3.randomNormal(0, 0.2)
        let data = d3.range(n).map(random)
        // let margin = { top: 20, right: 20, bottom: 20, left: 40 }
        let width = w0
        let height = h0

        let x = d3
          .scaleLinear()
          .domain([1, n - 2])
          .range([0, width])
        let y = d3
          .scaleLinear()
          .domain([-1, 1])
          .range([height, 0])
        let line = d3
          .line()
          .curve(d3.curveBasis)
          .x(function (d, i) {
            return x(i)
          })
          .y(function (d, i) {
            return y(d)
          })
        g
          .append('defs')
          .append('clipPath')
          .attr('id', 'clip')
          .append('rect')
          .attr('width', width)
          .attr('height', height)
        g
          .append('g')
          .attr('class', 'axis axis--x')
          .attr('transform', 'translate(0,' + y(0) + ')')
          .call(d3.axisBottom(x))
        g
          .append('g')
          .attr('class', 'axis axis--y')
          .call(d3.axisLeft(y))

        let tick = function () {
          // Push a new data point onto the back.
          data.push(random())
          // Redraw the line.
          d3
            .select(this)
            .attr('d', line)
            .attr('transform', null)
          // Slide it to the left.
          d3
            .active(this)
            .attr('transform', 'translate(' + x(0) + ',0)')
            .transition()
            .delay(3000)
            .on('start', tick)
          // Pop the old data point off the front.
          data.shift()
        }

        g
          .append('g')
          .attr('clip-path', 'url(#clip)')
          .append('path')
          .datum(data)
          .style('fill', 'transparent')
          .style('stroke', 'red')
          .attr('class', 'line')
          .transition()
          .duration(200)
          .ease(d3.easeLinear)
          .on('start', tick)
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let try3 = false
      if (try3) {
        let schema = {
          fields: [
            { name: 'firstName', type: 'text', display: 'First Name' },
            { name: 'lastName', type: 'text', display: 'Last Name' },
            {
              name: 'country',
              type: 'dropdown',
              display: 'Country',
              values: ['lebanon', 'france', 'usa']
            }
          ]
        }

        let ff = scrollTable
          .get('innerG')
          .append('foreignObject')
          .attr('x', telScrolBoxData.x + telScrolBoxData.w / 3)
          .attr('y', telScrolBoxData.x)
          .attr('width', telScrolBoxData.w / 2)
          .attr('height', telScrolBoxData.h * 2)
          .append('xhtml:body')

        let form = ff.append('form')

        form
          .selectAll('p')
          .data(schema.fields)
          .enter()
          .append('p')
          .each(function (d) {
            let self = d3.select(this)
            self
              .append('label')
              .text(d.display)
              .style('width', '100px')
              .style('display', 'inline-block')

            if (d.type === 'text') {
              self.append('input').attr({
                type: function (d) {
                  return d.type
                },
                name: function (d) {
                  return d.name
                }
              })
            }

            if (d.type === 'dropdown') {
              self
                .append('select')
                .attr('name', 'country')
                .selectAll('option')
                .data(d.values)
                .enter()
                .append('option')
                .text(function (d) {
                  return d
                })
            }
          })

        form
          .append('button')
          .attr('type', 'submit')
          .text('Save')

        ff
          .append('g')
          .selectAll('rect')
          .data([0])
          .enter()
          .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 100)
          .attr('height', 100)
          .attr('fill', 'red')
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      updateDataOnce(dataIn)

      // ---------------------------------------------------------------------------------------------------
      // for debugging
      // ---------------------------------------------------------------------------------------------------
      let inDebug = true
      if (inDebug) {
        let blockV = dataIn.blocks.done
        if (blockV.length === 0) blockV = dataIn.blocks.run
        if (blockV.length === 0) blockV = dataIn.blocks.wait
        if (blockV.length > 0) {
          let obId = blockV[0].obId
          com.focus = utils.getFocusBlock({
            blocks: dataIn.blocks,
            focusId: obId
          })
          blockFocus({ id: com.focus.obId })
        }
      }
      // ---------------------------------------------------------------------------------------------------

      runWhenReady({
        pass: function () {
          return locker.isFree(tagObsBlkCnt + 'updateData')
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
    runLoop.init({ tag: 'updateData', func: updateDataOnce, nKeep: 1 })

    function updateData (dataIn) {
      if (!locker.isFree('inInit')) {
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }

      runLoop.push({ tag: 'updateData', data: dataIn })
    }

    function updateDataOnce (dataIn) {
      // return;
      if (
        !locker.isFreeV([
          tagObsBlkCnt + 'updateData',
          tagTelScroll + 'zoom',
          tagBlockQueue + 'zoom'
        ])
      ) {
        // console.log('will delay updateRecData',locker.getActiveV([tagObsBlkCnt+"updateDataOnce", tagTelScroll+"_zoom", tagBlockQueue+"_zoom"]));
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }
      locker.add(tagObsBlkCnt + 'updateData')
      // locker.add({ id:tagObsBlkCnt+"updateDataOnce", override:true });

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      com.blocks = dataIn.blocks
      com.timeOfNight = dataIn.timeOfNight

      let telIds = []
      let telHealth = {}
      $.each(dataIn.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
        telHealth[dataNow.id] = +dataNow.val
      })

      // ---------------------------------------------------------------------------------------------------
      // check if the focued ob is still valid and reset/update accordingly
      // ---------------------------------------------------------------------------------------------------
      if (hasVar(com.focus.obId)) {
        com.focus = utils.getFocusBlock({
          blocks: com.blocks,
          focusId: com.focus.obId
        })
      }

      //
      // ---------------------------------------------------------------------------------------------------
      let blocks = {}
      if (hasVar(com.focus.type) && hasVar(com.focus.sb)) {
        blocks[com.focus.type] = com.focus.sb.obV
      }
      blockQueue.update(blocks)
      blockQueue.set({ tag: 'telIds', data: telIds })
      blockQueue.set({ tag: 'time', data: com.timeOfNight })
      blockQueue.setTimeRect()

      //
      // ---------------------------------------------------------------------------------------------------
      telScroll.set({ tag: 'telIds', data: telIds })
      telScroll.set({ tag: 'telHealth', data: telHealth })
      telScroll.update()

      telSummary.set({ tag: 'telHealth', data: telHealth })
      telSummary.update()

      locker.remove({ id: tagObsBlkCnt + 'updateData' })
      // locker.remove({ id:tagObsBlkCnt+"updateDataOnce", override:true });

      blockFocus({ id: com.focus.obId })
    }
    this.updateData = updateData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    runLoop.init({ tag: 'blockFocus', func: blockFocusOnce, nKeep: 1 })

    function blockFocus (dataIn) {
      runLoop.push({ tag: 'blockFocus', data: dataIn })
    }
    this.blockFocus = blockFocus

    function blockFocusOnce (optIn) {
      if (
        !locker.isFreeV([
          tagObsBlkCnt + 'updateData',
          tagTelScroll + 'zoom',
          tagBlockQueue + 'zoom'
        ])
      ) {
        // console.log('will delay _blockFocus_');
        setTimeout(function () {
          blockFocus(optIn)
        }, 10)
        return
      }
      locker.add(tagObsBlkCnt + 'updateData')
      // console.log(' will run _blockFocus_...',optIn);

      let obId = hasVar(optIn.id) ? optIn.id : ''
      com.focus = utils.getFocusBlock({ blocks: com.blocks, focusId: obId })

      setBlockTitle()

      // ---------------------------------------------------------------------------------------------------
      if (blockQueue.get('focusId') !== com.focus.obId) {
        if (hasVar(com.focus.type) && hasVar(com.focus.sb)) {
          let blocks = {}
          blocks[com.focus.type] = com.focus.sb.obV
          blockQueue.update(blocks)
        }
        blockQueue.set({ tag: 'focusId', data: com.focus.obId })
        blockQueue.setBlockRect()
      }

      // ---------------------------------------------------------------------------------------------------
      if (obScroll.get('sbId') !== com.focus.sb.sbId) {
        obScroll.set({ tag: 'sbId', data: com.focus.sb.sbId })
        obScroll.set({ tag: 'obV', data: com.focus.sb.obV, def: [] })
        obScroll.update()
      }

      // ---------------------------------------------------------------------------------------------------
      if (telScroll.get('obId') !== com.focus.obId) {
        telScroll.set({ tag: 'obId', data: com.focus.obId })
        telScroll.set({ tag: 'obTelIds', data: com.focus.ob.telIds, def: [] })
        telScroll.update()
      }

      // ---------------------------------------------------------------------------------------------------
      if (telSummary.get('obId') !== com.focus.obId) {
        telSummary.set({ tag: 'obId', data: com.focus.obId })
        telSummary.set({ tag: 'telIds', data: com.focus.ob.telIds, def: [] })
        telSummary.update()
      }

      syncStateSend({
        type: 'syncObFocus',
        syncTime: Date.now(),
        obId: com.focus.obId
      })

      locker.remove({ id: tagObsBlkCnt + 'updateData' })
    }
    // ---------------------------------------------------------------------------------------------------

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setBlockTitle () {
      let focusId = com.focus.obId
      let focusBlock = com.focus.ob
      let data = com.blockTitleData

      let blockName = hasVar(focusBlock.metaData)
        ? focusBlock.metaData.blockName
        : null
      let titleText = hasVar(blockName)
        ? blockName + ' ... ' + focusId + ' ... '
        : ''

      if (titleText !== '') {
        let formatInt = d3.format('d')
        titleText +=
          ' [ ' +
          formatInt(focusBlock.startTime) +
          ' -- ' +
          formatInt(focusBlock.endTime) +
          ' ]'
      }

      let text = data.g
        .selectAll('text.' + tagBlockTitle)
        .data([data], function (d) {
          return d.id
        })

      text
        .enter()
        .append('text')
        .attr('class', tagBlockTitle)
        .style('font-weight', 'normal')
        .style('opacity', 0)
        .style('stroke-width', 0)
        .style('fill', '#383b42')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('text-anchor', 'left')
        .style('font-weight', 'bold')
        .attr('x', function (d) {
          return d.x + d.marg
        })
        .attr('y', function (d) {
          return d.y + d.h / 2
        })
        .style('font-size', function (d) {
          return d.size + 'px'
        })
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
        .merge(text)
        .transition('inOut')
        .duration(timeD.animTxt)
        .text(function (d) {
          return titleText
        })
        .style('opacity', 1)

      text
        .exit()
        .transition('inOut')
        .duration(timeD.animTxt)
        .style('opacity', 0)
        .remove()

      // let blockTitleData = {
      //   id: tagBlockTitle,
      //   x: x0, y: y0, w: w0, h: h0, marg: marg
      // };
    }
  }

  let svgMain = new SvgMain()
}
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------
// telSummary
// ---------------------------------------------------------------------------------------------------
let TelSummary = function () {
  let com = {}

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type, data) {
    return com[type]
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function init (optIn) {
    if (hasVar(com.mainTag)) {
      console.error('trying to init more than once ...', optIn)
      return
    }

    com.mainTag = optIn.tag
    com.obId = ''
    com.telIds = []

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------
    com.box = deepCopy(optIn.boxData)
    com.box.r = Math.min(com.box.w, com.box.h) / 2

    com.gBox = optIn.gBox.append('g')
    com.gBox.attr(
      'transform',
      'translate(' +
        (com.box.x + com.box.w / 2) +
        ',' +
        (com.box.y + com.box.h / 2) +
        ')'
    )

    com.style = {}
    com.style.outerCircR = com.box.r * 0.8
    com.style.outerArcWidth = com.box.r * (1 - com.style.outerCircR / com.box.r)
    com.style.innerArcR = [
      com.box.r * 0.05,
      com.style.outerCircR - com.style.outerArcWidth * 1.2,
      com.style.outerCircR - com.style.outerArcWidth
    ]
    com.style.tauFrac = tau / 3
    com.style.tauSpace = tau / 50

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let outerG = com.gBox.append('g')
    let showOuterRec = false

    if (showOuterRec) {
      outerG
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
        .attr('x', -com.box.w / 2)
        .attr('y', -com.box.h / 2)
        .attr('width', com.box.w)
        .attr('height', com.box.h)
        .attr('fill-opacity', 0)
        .attr('stroke', '#383b42')
    }

    outerG
      .selectAll('circle')
      .data([0])
      .enter()
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', com.box.r)
      .attr('fill', '#F2F2F2')
      // .attr("fill", "#383b42")
      .attr('fill-opacity', 0.7)
    // .attr("stroke",'#383b42')
  }
  this.init = init

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function update () {
    let tagArcs = com.mainTag + 'arcs'
    let tagTxt = com.mainTag + 'arcTxt'

    let nBlockTels = com.telIds.length
    let hasTels = nBlockTels > 0

    let avgState = 0
    let telStates = {}
    let telStateFracs = {}
    $.each(TEL_STATES, function (key, val) {
      telStates[val] = 0
      telStateFracs[val] = 0
    })

    $.each(com.telIds, function (index, telId) {
      avgState += com.telHealth[telId]

      let state = getTelState(com.telHealth[telId])
      telStates[state] += 1
    })
    if (hasTels) {
      avgState /= nBlockTels
      $.each(TEL_STATES, function (key, val) {
        telStateFracs[val] = telStates[val] / nBlockTels
      })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let arcData = [
      {
        id: tagArcs + 'outer' + '0',
        col: healthCol(hasTels, avgState),
        strokeWidth: 0,
        fillOpacity: stateOpac(hasTels, false),
        innerRadius: com.style.outerCircR - com.style.outerArcWidth / 4,
        outerRadius: com.style.outerCircR + com.style.outerArcWidth / 4,
        endAngle: 0,
        startAngle: 0,
        endAngleFinal: tau
      },
      {
        id: tagArcs + 'outer' + '1',
        col: healthCol(hasTels, avgState),
        strokeWidth: 0,
        fillOpacity: stateOpac(hasTels, true),
        innerRadius: com.style.outerCircR - com.style.outerArcWidth / 2,
        outerRadius: com.style.outerCircR + com.style.outerArcWidth / 2,
        endAngle: 0,
        startAngle: 0,
        endAngleFinal: tau * healthFrac(hasTels, avgState)
      },
      {
        id: tagArcs + 'nominal' + '0',
        col: stateCol(hasTels, TEL_STATES.NOMINAL),
        strokeWidth: 0,
        fillOpacity: stateOpac(hasTels, false),
        innerRadius: com.style.innerArcR[0],
        outerRadius: com.style.innerArcR[1],
        endAngle: innerArcAngles({ index: 0, isEnd: false, isBack: true }),
        startAngle: innerArcAngles({ index: 0, isEnd: false, isBack: true }),
        endAngleFinal: innerArcAngles({
          index: 0,
          isEnd: hasTels,
          isBack: true
        })
      },
      {
        id: tagArcs + 'nominal' + '1',
        col: stateCol(hasTels, TEL_STATES.NOMINAL),
        strokeWidth: 0,
        fillOpacity: stateOpac(hasTels, true),
        innerRadius: com.style.innerArcR[0],
        outerRadius: com.style.innerArcR[2],
        endAngle: innerArcAngles({ index: 0, isEnd: false, isBack: false }),
        startAngle: innerArcAngles({ index: 0, isEnd: false, isBack: false }),
        endAngleFinal: innerArcAngles({
          index: 0,
          isEnd: hasTels,
          isBack: false,
          val: telStateFracs[TEL_STATES.NOMINAL]
        })
      },
      {
        id: tagArcs + 'warning' + '0',
        col: stateCol(hasTels, TEL_STATES.WARNING),
        strokeWidth: 0,
        fillOpacity: stateOpac(hasTels, false),
        innerRadius: com.style.innerArcR[0],
        outerRadius: com.style.innerArcR[1],
        endAngle: innerArcAngles({ index: 1, isEnd: false, isBack: true }),
        startAngle: innerArcAngles({ index: 1, isEnd: false, isBack: true }),
        endAngleFinal: innerArcAngles({
          index: 1,
          isEnd: hasTels,
          isBack: true
        })
      },
      {
        id: tagArcs + 'warning' + '1',
        col: stateCol(hasTels, TEL_STATES.WARNING),
        strokeWidth: 0,
        fillOpacity: stateOpac(hasTels, true),
        innerRadius: com.style.innerArcR[0],
        outerRadius: com.style.innerArcR[2],
        endAngle: innerArcAngles({ index: 1, isEnd: false, isBack: false }),
        startAngle: innerArcAngles({ index: 1, isEnd: false, isBack: false }),
        endAngleFinal: innerArcAngles({
          index: 1,
          isEnd: hasTels,
          isBack: false,
          val: telStateFracs[TEL_STATES.WARNING]
        })
      },
      {
        id: tagArcs + 'error' + '0',
        col: stateCol(hasTels, TEL_STATES.ERROR),
        strokeWidth: 0,
        fillOpacity: stateOpac(hasTels, false),
        innerRadius: com.style.innerArcR[0],
        outerRadius: com.style.innerArcR[1],
        endAngle: innerArcAngles({ index: 2, isEnd: false, isBack: true }),
        startAngle: innerArcAngles({ index: 2, isEnd: false, isBack: true }),
        endAngleFinal: innerArcAngles({
          index: 2,
          isEnd: hasTels,
          isBack: true
        })
      },
      {
        id: tagArcs + 'error' + '1',
        col: stateCol(hasTels, TEL_STATES.ERROR),
        strokeWidth: 0,
        fillOpacity: stateOpac(hasTels, true),
        innerRadius: com.style.innerArcR[0],
        outerRadius: com.style.innerArcR[2],
        endAngle: innerArcAngles({ index: 2, isEnd: false, isBack: false }),
        startAngle: innerArcAngles({ index: 2, isEnd: false, isBack: false }),
        endAngleFinal: innerArcAngles({
          index: 2,
          isEnd: hasTels,
          isBack: false,
          val: telStateFracs[TEL_STATES.ERROR]
        })
      }
    ]

    if (hasVar(com.arcData)) {
      $.each(com.arcData, function (index, dataNow) {
        arcData[index].endAngle = dataNow.endAngleFinal
      })
    }
    com.arcData = arcData

    let arcs = com.gBox.selectAll('path.' + tagArcs).data(arcData, function (d) {
      return d.id
    })

    arcs
      .enter()
      .append('path')
      .attr('class', tagArcs)
      .style('stroke-opacity', 0.5)
      .attr('fill-opacity', function (d) {
        return d.fillOpacity
      })
      .attr('stroke-width', function (d) {
        return d.strokeWidth
      })
      .attr('fill', function (d, i) {
        return d.col
      })
      .attr('stroke', function (d, i) {
        return d3.rgb(d.col).darker(1.0)
      })
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('d', function (d) {
        return d3.arc()(d)
      })
      .merge(arcs)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('fill-opacity', function (d) {
        return d.fillOpacity
      })
      .attr('fill', function (d, i) {
        return d.col
      })
      .attr('stroke', function (d, i) {
        return d3.rgb(d.col).darker(1.0)
      })
      .attrTween('d', arcTween())

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    if (!hasVar(com.textData)) {
      let textR = com.style.innerArcR[1] / 1.8
      let textSize = com.style.innerArcR[1] / 2.5
      com.textData = [
        {
          id: tagTxt + 'nominal',
          textTag: TEL_STATES.NOMINAL,
          xy: getPropPosShift({ xy: 'xy', r: textR, index: 0 }),
          size: textSize
        },
        {
          id: tagTxt + 'warning',
          textTag: TEL_STATES.WARNING,
          xy: getPropPosShift({ xy: 'xy', r: textR, index: 1 }),
          size: textSize
        },
        {
          id: tagTxt + 'error',
          textTag: TEL_STATES.ERROR,
          xy: getPropPosShift({ xy: 'xy', r: textR, index: 2 }),
          size: textSize
        }
      ]
    }
    let textData = hasTels ? com.textData : []

    let text = com.gBox.selectAll('text.' + tagTxt).data(textData, function (d) {
      return d.id
    })
    text
      .enter()
      .append('text')
      .attr('class', tagTxt)
      .style('font-weight', 'normal')
      .style('opacity', 0)
      .style('stroke-width', 0)
      .style('fill', '#383b42')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .attr('x', function (d) {
        return d.xy[0]
      })
      .attr('y', function (d) {
        return d.xy[1]
      })
      .attr('dy', function (d) {
        return d.size / 3 + 'px'
      })
      .merge(text)
      .style('font-size', function (d) {
        return d.size + 'px'
      })
      .transition('inOut')
      .duration(timeD.animTxt)
      .style('opacity', 1)
      // .tween("text", function(d) {
      //   let topThis       = d3.select(this);
      //   let prevText    = topThis.text();
      //   let interpolate = d3.interpolate(prevText, 0);
      //   return function(t) { topThis.text(formatPercent(interpolate(t))); };
      // })
      .tween('text', function (d) {
        return tweenText(d3.select(this), +telStates[d.textTag])
      })

    text
      .exit()
      .transition('inOut')
      .duration(timeD.animTxt)
      .tween('text', function (d) {
        return tweenText(d3.select(this), 0)
      })
      .style('opacity', 0)
      .remove()
  }
  this.update = update

  // ---------------------------------------------------------------------------------------------------
  // helper functions
  // ---------------------------------------------------------------------------------------------------
  function arcTween () {
    return function (d) {
      let interpolate = d3.interpolate(d.endAngle, d.endAngleFinal)
      return function (t) {
        d.endAngle = interpolate(t)
        return d3.arc()(d)
      }
    }
  }

  let formatInt = d3.format('d')
  function tweenText (thisIn, newVal) {
    let prevText = thisIn.text()
    let interpolate = d3.interpolate(prevText, newVal)
    return function (t) {
      thisIn.text(formatInt(interpolate(t)))
    }
  }

  function innerArcAngles (optIn) {
    let angle = optIn.index * com.style.tauFrac + com.style.tauSpace
    if (optIn.isEnd) {
      return (
        angle +
        (com.style.tauFrac - com.style.tauSpace * 2) *
          (optIn.isBack ? 1 : optIn.val)
      )
    } else {
      return angle
    }
  }

  function getPropPosShift (optIn) {
    let angle = (optIn.index + 0.5) * com.style.tauFrac + tau / 4
    let labelX = -1 * optIn.r * Math.cos(angle)
    let labelY = -1 * optIn.r * Math.sin(angle)

    if (optIn.xy === 'x') return labelX
    if (optIn.xy === 'y') return labelY
    else if (optIn.xy === 'xy') return [labelX, labelY]
    else return null
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function healthCol (hasTels, val) {
    if (hasTels) return telHealthCol(val)
    else return '#383b42'
  }

  function stateCol (hasTels, state) {
    if (hasTels) return telStateCol[state][0]
    else return '#383b42'
  }

  function stateOpac (hasTels, isFront) {
    if (hasTels) return isFront ? 0.7 : 0.3
    else return 0.05
  }

  function healthFrac (hasTels, val) {
    if (hasTels) return telHealthFrac(val)
    else return 0
  }
}

// ---------------------------------------------------------------------------------------------------
// telScroll
// ---------------------------------------------------------------------------------------------------
let TelScroll = function () {
  let com = {}

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function init (optIn) {
    if (hasVar(com.mainTag)) {
      console.error('trying to init more than once ...', optIn)
      return
    }

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------
    com.mainTag = optIn.tag
    let boxData = optIn.boxData
    let gBox = optIn.gBox
    com.obId = ''
    com.obTelIds = []
    com.telIds = []
    com.telHealth = {}
    com.recD = {}
    com.recD.gBase = gBox.append('g')

    com.scrollGrid = new ScrollGrid({
      id: com.mainTag,
      x0: boxData.x,
      y0: boxData.y,
      w0: boxData.w,
      h0: boxData.h,
      recH: boxData.h * 0.3,
      recW: boxData.h * 0.3,
      showCounts: false,
      isHorz: true,
      nRows: 2,
      recD: com.recD,
      recV: [],
      gBox: com.recD.gBase,
      bckRecOpt: { textureOrient: '5/8', frontProp: { strkWOcp: 0.2 } },
      vorOpt: { click: optIn.vorClick },
      lockerV: optIn.lockerV,
      onZoom: {
        start: onZoomStart,
        during: onZoomDuring,
        end: onZoomDuring
      },
      runLoop: optIn.runLoop,
      locker: optIn.locker
    })

    com.recD.dataG = com.scrollGrid.getBackDataG()
  }
  this.init = init

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function update () {
    let tagCirc = com.mainTag + 'circ'
    let tagTxt = com.mainTag + 'circTxt'

    let blockTelIds = com.obTelIds.slice(0, com.obTelIds.length)

    blockTelIds.sort(function (a, b) {
      return com.telIds.indexOf(a) - com.telIds.indexOf(b)
    })

    let recV = blockTelIds.map(function (d) {
      return { id: d }
    })

    com.scrollGrid.update({ recV: recV })

    let dataRec = com.recD[com.mainTag]

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let circ = com.recD.dataG
      .selectAll('circle.' + tagCirc)
      .data(dataRec, function (d) {
        return d.id
      })

    circ
      .enter()
      .append('circle')
      .attr('class', function (d) {
        return tagCirc
      })
      .attr('stroke-width', 0.5)
      .style('stroke-opacity', 0.7)
      .style('fill-opacity', 0.7)
      .style('opacity', 1)
      .attr('cx', function (d) {
        return d.x + d.w / 2
      })
      .attr('cy', function (d) {
        return d.y + d.h / 2
      })
      .attr('r', 0)
      .style('fill', function (d) {
        return telHealthCol(com.telHealth[d.data.id])
      })
      .attr('stroke', function (d, i) {
        return d3.rgb(telHealthCol(com.telHealth[d.data.id])).darker(1.0)
      })
      .attr('vector-effect', 'non-scaling-stroke')
      .merge(circ)
      .transition('inOut')
      .duration(timeD.animArc)
      // .style("opacity", 1)
      .style('fill', function (d) {
        return telHealthCol(com.telHealth[d.data.id])
      })
      .attr('stroke', function (d, i) {
        return d3.rgb(telHealthCol(com.telHealth[d.data.id])).darker(1.0)
      })
      .attr('r', function (d) {
        return d.w / 2
      })
      .attr('cx', function (d) {
        return d.x + d.w / 2
      })
      .attr('cy', function (d) {
        return d.y + d.h / 2
      })

    circ
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('r', function (d) {
        return d.w
      })
      .style('opacity', 0)
      .remove()

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let text = com.recD.dataG
      .selectAll('text.' + tagTxt)
      .data(dataRec, function (d) {
        return d.id
      })

    text
      .enter()
      .append('text')
      .attr('class', tagTxt)
      .text(function (d, i) {
        return telInfo.getTitle(d.data.id)
      })
      .style('font-weight', 'normal')
      .style('opacity', 0)
      .style('fill-opacity', 1)
      .style('fill', '#383b42')
      .style('stroke', '#8B919F')
      .style('stroke-width', 0.3)
      .style('stroke-opacity', 1)
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .attr('x', function (d) {
        return d.x + d.w / 2
      })
      .attr('y', function (d) {
        return d.y + d.h / 2
      })
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .merge(text)
      .style('font-size', function (d) {
        d.size = d.w / 3
        return d.size + 'px'
      })
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 1)
      .attr('x', function (d) {
        return d.x + d.w / 2
      })
      .attr('y', function (d) {
        return d.y + d.h / 2
      })
      .attr('dy', function (d) {
        return d.size / 3 + 'px'
      })

    text
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()
  }
  this.update = update

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let zoomTargets = {}
  function onZoomStart (optIn) {
    let tagCirc = com.mainTag + 'circ'
    let tagTxt = com.mainTag + 'circTxt'

    zoomTargets.circ = com.recD.dataG.selectAll('circle.' + tagCirc)
    zoomTargets.text = com.recD.dataG.selectAll('text.' + tagTxt)
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function onZoomDuring (optIn) {
    let xy = optIn.xy
    let delta = optIn.wh / 2
    let duration = optIn.duration

    if (duration <= 0) {
      zoomTargets.circ.attr('c' + xy, function (d, i) {
        return d[xy] + delta
      })
      zoomTargets.text.attr(xy, function (d, i) {
        return d[xy] + delta
      })
    } else {
      zoomTargets.circ
        .transition('move')
        .duration(duration)
        .attr('c' + xy, function (d, i) {
          return d[xy] + delta
        })
      zoomTargets.text
        .transition('move')
        .duration(duration)
        .attr(xy, function (d, i) {
          return d[xy] + delta
        })
    }
  }
}

// ---------------------------------------------------------------------------------------------------
// obScroll
// ---------------------------------------------------------------------------------------------------
let _obScroll = function () {
  let com = {}

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type, data) {
    return com[type]
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function init (optIn) {
    if (hasVar(com.mainTag)) {
      console.error('trying to init more than once ...', optIn)
      return
    }

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------
    com.mainTag = optIn.tag
    let boxData = optIn.boxData
    let gBox = optIn.gBox
    com.sbId = ''
    com.obV = []
    com.recD = {}
    com.recD.gBase = gBox.append('g')

    com.scrollGrid = new ScrollGrid({
      id: com.mainTag,
      x0: boxData.x,
      y0: boxData.y,
      w0: boxData.w,
      h0: boxData.h,
      recH: boxData.h * 0.5,
      recW: boxData.h * 0.5,
      showCounts: optIn.showCounts,
      isHorz: true,
      nRows: 1,
      recD: com.recD,
      recV: [],
      gBox: com.recD.gBase,
      bckRecOpt: {
        opac: 0.06,
        circType: 'lighter',
        size: 10,
        frontProp: { strkWOcp: 0.2 }
      },
      // bckRecOpt: { textureOrient: "2/8",  frontProp: { strkWOcp: 0.2 } },
      vorOpt: { click: optIn.vorClick },
      lockerV: optIn.lockerV,
      onZoom: {
        start: onZoomStart,
        during: onZoomDuring,
        end: onZoomDuring
      },
      runLoop: optIn.runLoop,
      locker: optIn.locker
    })

    com.recD.dataG = com.scrollGrid.getBackDataG()

    setStyle(optIn.style)
  }
  this.init = init

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function update () {
    let tagRec = com.mainTag + 'rec'
    let tagTxt = com.mainTag + 'circTxt'

    let recV = com.obV.map(function (d) {
      return { id: d.obId, data: d }
    })

    recV.sort(function (a, b) {
      return a.data.metaData.nObs - b.data.metaData.nObs
    })

    com.scrollGrid.update({ recV: recV })

    let dataRec = com.recD[com.mainTag]

    let rect = com.recD.dataG
      .selectAll('rect.' + tagRec)
      .data(dataRec, function (d) {
        return d.id
      })

    rect
      .enter()
      .append('rect')
      .attr('class', tagRec)
      .attr('stroke', function (d, i) {
        return d3.rgb(com.style.recCol(d, i)).darker(1.0)
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
      .attr('width', function (d) {
        return d.w
      })
      .attr('height', function (d) {
        return d.h
      })
      .style('fill', com.style.recCol)
      .attr('vector-effect', 'non-scaling-stroke')
      .merge(rect)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('x', function (d) {
        return d.x
      })
      .attr('y', function (d) {
        return d.y
      })
      .attr('width', function (d) {
        return d.w
      })
      .attr('height', function (d) {
        return d.h
      })
      .style('opacity', 1)
      .style('fill', com.style.recCol)
      .style('fill-opacity', 0.3)

    rect
      .exit()
      .transition('inOut')
      .duration(timeD.animArc / 2)
      .style('opacity', 0)
      .remove()

    let textIn = com.recD.dataG
      .selectAll('text.' + tagTxt)
      .data(dataRec, function (d) {
        return d.id
      })

    textIn
      .enter()
      .append('text')
      .attr('class', tagTxt)
      .text(function (d) {
        return d.data.data.metaData.blockName
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
      .attr('x', function (d, i) {
        return d.x + d.w / 2
      })
      .attr('y', function (d, i) {
        return d.y + d.h / 2
      })
      .attr('text-anchor', 'middle')
      .merge(textIn)
      .each(function (d, i) {
        d.size = d.w / 4
      })
      .style('font-size', function (d) {
        return d.size + 'px'
      })
      .attr('dy', function (d) {
        return d.size / 3 + 'px'
      })
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 1)
      .attr('x', function (d) {
        return d.x + d.w / 2
      })
      .attr('y', function (d) {
        return d.y + d.h / 2
      })

    textIn
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()
  }
  this.update = update

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  let zoomTargets = {}
  function onZoomStart (optIn) {
    let tagRec = com.mainTag + 'rec'
    let tagTxt = com.mainTag + 'circTxt'

    zoomTargets.rect = com.recD.dataG.selectAll('rect.' + tagRec)
    zoomTargets.text = com.recD.dataG.selectAll('text.' + tagTxt)
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
  // styling
  // ---------------------------------------------------------------------------------------------------
  function setStyle (optIn) {
    if (!hasVar(optIn)) optIn = {}

    com.style = {}

    com.style.recCol = optIn.recCol
    if (!hasVar(com.style.recCol)) {
      com.style.recCol = function (d, i) {
        return colsBlk[d.data.data.metaData.nObs % colsBlk.length]
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
let ObsBlockControlUtils = function () {
  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function getFocusBlock (optIn) {
    let blocks = optIn.blocks
    let focusBlock = {
      obId: null,
      type: null,
      index: null,
      ob: {},
      sb: { sbId: null, obV: [] }
    }

    // get the block with the requested id
    if (hasVar(blocks)) {
      $.each(blocks, function (typeNow, dataNow0) {
        if (hasVar(focusBlock.type)) return
        $.each(dataNow0, function (index1, dataNow1) {
          if (optIn.focusId === dataNow1.obId) {
            focusBlock.sb.sbId = dataNow1.sbId
            focusBlock.obId = dataNow1.obId
            focusBlock.type = typeNow
            focusBlock.index = index1
            focusBlock.ob = dataNow1
          }
        })
      })
    }

    // get all blocks which belong to the same sb as the requested block
    if (hasVar(focusBlock.sb.sbId)) {
      $.each(blocks, function (typeNow, dataNow0) {
        $.each(dataNow0, function (index1, dataNow1) {
          if (focusBlock.sb.sbId === dataNow1.sbId) {
            focusBlock.sb.obV.push(dataNow1)
          }
        })
      })
    }

    // return hasVar(focusBlock.block) ? focusBlock.block : {};
    return focusBlock
  }
  this.getFocusBlock = getFocusBlock
}
