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
var mainScriptTag = 'nightSched'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global minMaxObj */
/* global sock */
/* global timeD */
/* global hasVar */
/* global telInfo */
/* global disableScrollSVG */
/* global RunLoop */
/* global BlockQueue */
/* global bckPattern */
/* global telHealthCol */
/* global CheckFree */
/* global appendToDom */
/* global runWhenReady */

window.loadScript({ source: mainScriptTag, script: '/js/utils_blockQueue.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 8
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = { SockFunc: sockNightSched, MainFunc: mainNightSched }
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
let sockNightSched = function (optIn) {
  // let widgetType   = optIn.widgetType;
  // let widgetSource = optIn.widgetSource;
  // // ---------------------------------------------------------------------------------------------------
  // // get data from the server for a given telescope
  // // ---------------------------------------------------------------------------------------------------
  // this.askTelData = function(optIn) {
  //   if(sock.conStat.isOffline()) return;
  //   let data         = {};
  //   data.widgetId = widgetId;
  //   data.telId    = optIn.telId;
  //   data.propId   = optIn.propId;
  //   let dataEmit = {
  //     "widgetSource":widgetSource, "widgetName":widgetType, "widgetId":widgetId,
  //     "methodName":"nightSched_askTelData",
  //     "methodArgs":data
  //   };
  //   sock.socket.emit("widget", dataEmit);
  //   return;
  // }
}

// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// here we go with the content of this particular widget
// ---------------------------------------------------------------------------------------------------
let mainNightSched = function (optIn) {
  // let _0_ = uniqId()
  let widgetType = optIn.widgetType
  let tagArrZoomerPlotsSvg = optIn.baseName
  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  // let thisNightSched = this
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
  let SvgMain = function () {
    let com = {}
    let svg = {}
    // let thisMain = this

    let lenD = {}
    lenD.w = {}
    lenD.h = {}
    lenD.w[0] = 1000
    lenD.h[0] = lenD.w[0] / sgvTag.main.whRatio

    let tagNightSched = widgetType
    let tagBlockQueue = 'blockQueue'
    let tagTelTreeMap = 'treeMap'

    let blockQueue = new BlockQueue()
    let telTreeMap = new TelTreeMap()

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

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let x0, y0, w0, h0, marg
      let gBlockBox = svg.g.append('g')

      w0 = lenD.w[0] * 0.95
      h0 = lenD.h[0] * 0.3 // h0 *= 2.5;
      x0 = (lenD.w[0] - w0) / 2
      y0 = x0
      marg = w0 * 0.01

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
        doPhase: true,
        click: function (d) {
          blockFocus({ id: d.id })
        },
        boxData: blockBoxData,
        checkFree: checkFree,
        checkFreeV: [tagNightSched + 'updateData'],
        checkFreeZoom: {
          all: tagBlockQueue + 'zoom',
          during: tagBlockQueue + 'zoomDuring',
          end: tagBlockQueue + 'zoomEnd'
        },
        runLoop: runLoop
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let gTelBox = svg.g.append('g')

      w0 = blockBoxData.w
      x0 = blockBoxData.x
      y0 = blockBoxData.y + blockBoxData.h + blockBoxData.x
      h0 = lenD.h[0] - y0 - blockBoxData.x
      marg = blockBoxData.marg * 2

      let telBoxData = {
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        marg: marg
      }

      telTreeMap.init({
        tag: tagTelTreeMap,
        click: function (optIn) {
          // console.log('click',optIn);
          if (optIn.nTel === -1) {
            blockFocus({ id: optIn.id })
          } else {
            syncStateSend({
              type: 'syncTelFocus',
              syncTime: Date.now(),
              zoomState: 1,
              target: optIn.id
            })
          }
        },
        gBox: gTelBox,
        boxData: telBoxData
      })

      telTreeMap.set({ tag: 'recCol', data: blockQueue.get('style').recCol })
      telTreeMap.set({
        tag: 'recFillOpac',
        data: blockQueue.get('style').recFillOpac
      })
      telTreeMap.set({
        tag: 'recStrokeOpac',
        data: blockQueue.get('style').recStrokeOpac
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      _updateData(dataIn)

      runWhenReady({
        pass: function () {
          return checkFree.isFree(tagNightSched + 'updateData')
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
    this.updateData = updateData

    function _updateData (dataIn) {
      if (
        !checkFree.isFreeV([
          tagNightSched + 'updateData',
          tagBlockQueue + 'zoom'
        ])
      ) {
        // console.log('will delay updateRecData',checkFree.getActiveV([tagNightSched+"_updateData", tagBlockQueue+"_zoom"]));
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }
      checkFree.add(tagNightSched + 'updateData')

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let telIds = []
      let telHealth = {}
      $.each(dataIn.telHealth, function (index, dataNow) {
        telIds.push(dataNow.id)
        telHealth[dataNow.id] = dataNow.val
      })

      blockQueue.set({ tag: 'telIds', data: telIds })
      blockQueue.set({ tag: 'time', data: dataIn.timeOfNight })
      blockQueue.update(dataIn.blocks)

      telTreeMap.set({ tag: 'telIds', data: telIds })
      telTreeMap.set({ tag: 'telHealth', data: telHealth })
      telTreeMap.update(dataIn)

      checkFree.remove(tagNightSched + 'updateData')
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function blockFocus (optIn) {
      let data = { type: 'syncObFocus', syncTime: Date.now(), obId: optIn.id }
      sock.sockSyncStateSend({
        widgetId: widgetId,
        type: data.type,
        data: data
      })
    }
    // ---------------------------------------------------------------------------------------------------
  }

  // // ---------------------------------------------------------------------------------------------------
  // //
  // // ---------------------------------------------------------------------------------------------------
  // function syncStateGet(dataIn) {

  //   let type = dataIn.type;
  //   if(type == "sync_arrZoomerProp") {
  //     // console.log(' - mainNightSched - syncStateGet ',dataIn.data);
  //     // checkFree.add("syncStateGet");

  //     let telId  = dataIn.data.telId;
  //     let propId = dataIn.data.propId;

  //     sock.widgetV[widgetType].SockFunc.askTelData({telId:telId, propId:propId});

  //   }

  //   return;
  // }
  // this.syncStateGet = syncStateGet;

  let svgMain = new SvgMain()
}
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
let TelTreeMap = function () {
  let com = {}
  let mainTag = null
  let box = null

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
    if (hasVar(mainTag)) {
      console.error('trying to init more than once ...', optIn)
      return
    }
    mainTag = optIn.tag

    // com.doTimeRect = hasVar(optIn.doTimeRect) ? optIn.doTimeRect : true;
    com.click = optIn.click

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------
    let boxData = optIn.boxData
    let gBox = optIn.gBox

    com.box = {
      x: boxData.x + boxData.marg,
      y: boxData.y + boxData.marg,
      w: boxData.w - 2 * boxData.marg,
      h: boxData.h - 2 * boxData.marg,
      marg: boxData.marg,
      margFrac: 0.6,
      g: gBox,
      outerBox: boxData
    }
    box = com.box

    gBox
      .selectAll('rect.' + mainTag + 'telBoxBack')
      .data([boxData], function (d) {
        return d.id
      })
      .enter()
      .append('rect')
      .attr('class', mainTag + 'telBoxBack')
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
      .attr('fill', '#F2F2F2')
      .attr('fill-opacity', 1)
      .style('pointer-events', 'none')

    bckPattern({
      com: com,
      gNow: gBox,
      gTag: mainTag + 'telBoxBack',
      lenWH: [boxData.w, boxData.h],
      trans: [boxData.x, boxData.y],
      opac: 0.06,
      textureOrient: '2/8'
    })

    setStyle(optIn.style)

    com.minTxtSize = box.w * 0.03
  }
  this.init = init

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function update (dataIn) {
    let blocks = dataIn.blocks.run

    let telV = []
    let obTelIdV = {}
    let hirchData = { id: 'telIds', children: [] }
    $.each(blocks, function (index, dataNow) {
      let telIds = dataNow.telIds.map(function (d) {
        return { id: d, nTel: com.telIds.indexOf(d) }
      })
      telIds.unshift({
        id: dataNow.obId,
        nTel: -1,
        nBlock: index,
        blockName: dataNow.metaData.blockName
      })

      hirchData.children.push({
        id: dataNow.obId,
        nTel: index,
        nBlock: index,
        children: telIds
      })
      telV = telV.concat(dataNow.telIds)

      $.each(dataNow.telIds, function (i, d) {
        obTelIdV[d] = dataNow.obId
      })
    })

    telV = com.telIds.filter(function (n) {
      return !telV.includes(n)
    })
    if (telV.length > 0) {
      hirchData.children.push({
        id: telInfo.noSubArrName(),
        nTel: blocks.length,
        children: telV.map(function (d) {
          return { id: d, nTel: com.telIds.indexOf(d) }
        })
      })
      $.each(telV, function (i, d) {
        obTelIdV[d] = telInfo.noSubArrName()
      })
    }

    // ---------------------------------------------------------------------------------------------------
    // check if the hirch needs to be recalculated
    // ---------------------------------------------------------------------------------------------------
    let isNewHirch = true
    if (hasVar(com.telIdsObTelIdV)) {
      isNewHirch = false
      $.each(com.telIdsObTelIdV, function (telIdNow, obIdNow) {
        if (obTelIdV[telIdNow] !== obIdNow) isNewHirch = true
      })
    }
    com.telIdsObTelIdV = obTelIdV

    if (isNewHirch) {
      // ---------------------------------------------------------------------------------------------------
      // see: https://github.com/d3/d3-hierarchy/blob/master/README.md#resquarify_ratio
      // see: https://bl.ocks.org/d3indepth/fa5e9d42d8e260f3f76a98be648c9edd
      // ---------------------------------------------------------------------------------------------------
      if (!hasVar(com.telIdsTree)) {
        com.telIdsTree = d3
          .treemap()
          // .tile(d3.treemapResquarify)
          .tile(d3.treemapResquarify.ratio(1))
          .size([box.w, box.h])
          .paddingInner(function (d) {
            return d.height === 2 ? box.marg * 1.5 : 5
          })
      }

      let hirch = d3
        .hierarchy(hirchData)
        // .sum(function(d) { return d.children ? 2 : 1; })
        .sum(function (d) {
          if (d.nTel === -1 || hasVar(d.children)) return 2
          else return 1
        })
        .sort(function (a, b) {
          if (a.height === 1 && b.height === 1) {
            // make sure the empty sub-array is always last
            if (
              a.data.id === telInfo.noSubArrName() ||
              b.data.id === telInfo.noSubArrName()
            ) {
              return -2 * com.telIds.length
            }
            // make sure large sub-arrays are shown first
            let difLen = b.children.length - a.children.length
            let difBlk = b.data.nBlock - a.data.nBlock
            return difLen === 0 ? difBlk : difLen
          }
          // sort telescopes by fixed order
          return a.data.nTel - b.data.nTel
        })

      com.telIdsTree(hirch)

      let desc = hirch.descendants()
      let circData = desc.filter(function (d) {
        return d.height === 0 && d.data.nTel >= 0
      })
      let rectData = desc.filter(function (d) {
        return (
          (d.height === 1 && d.data.id !== telInfo.noSubArrName()) ||
          d.data.nTel === -1
        )
      })
      $.each(rectData, function (index, dataNow) {
        let x0 = com.style.x(dataNow)
        let y0 = com.style.y(dataNow)
        let w0 = com.style.width(dataNow)
        let h0 = com.style.height(dataNow)

        if (dataNow.height === 0) {
          let wh0 = Math.min(w0, h0)
          x0 += (w0 - wh0) / 2
          y0 += (h0 - wh0) / 2
          w0 = wh0
          h0 = wh0
        }

        dataNow.data.rect = { x: x0, y: y0, w: w0, h: h0 }
      })
      // console.log(rectData);

      // calc the common size for all circles within a block
      com.telR = {}
      let telR = []
      let hirchBlocks = desc.filter(function (d) {
        return d.height === 1
      })
      $.each(hirchBlocks, function (index, dataNow) {
        let id = dataNow.data.id

        com.telR[id] =
          0.5 *
          minMaxObj({
            minMax: 'min',
            data: dataNow.children,
            func: function (d, i) {
              return Math.min(d.x1 - d.x0, d.y1 - d.y0)
            }
          })

        if (id !== telInfo.noSubArrName()) telR.push(com.telR[id])
      })

      // choose the minimal value from all blocks
      let minTelR = Math.min(...Object.values(telR))
      $.each(com.telR, function (key, val) {
        if (key !== telInfo.noSubArrName()) com.telR[key] = minTelR
        else com.telR[key] = Math.min(com.telR[key], minTelR)
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let circ = box.g
        .selectAll('circle.' + mainTag + 'telHealth')
        .data(circData, function (d) {
          return d.data.id
        })

      circ
        .enter()
        .append('circle')
        .attr('class', mainTag + 'telHealth')
        .style('opacity', 0)
        .attr('stroke-opacity', 1)
        .style('fill-opacity', 0.7)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('cx', com.style.cx)
        .attr('cy', com.style.cy)
        .attr('r', com.style.r)
        .attr('stroke-width', com.style.strokeWidth)
        .attr('fill', function (d, i) {
          return com.style.fill(d, d.data.nBlock)
        })
        .attr('stroke', function (d, i) {
          return com.style.stroke(d, d.data.nBlock)
        })
        .attr('stroke-opacity', com.style.strokeOpacity)
        .attr('pointer-events', com.style.pointerEvents)
        .on('click', com.style.click)
        .merge(circ)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('cx', com.style.cx)
        .attr('cy', com.style.cy)
        .attr('r', com.style.r)
        .attr('stroke-width', com.style.strokeWidth)
        .style('opacity', com.style.opacity)
        .attr('fill', function (d, i) {
          return com.style.fill(d, d.data.nBlock)
        })
        .attr('stroke', function (d) {
          return com.style.stroke(d, d.data.nBlock)
        })
        .attr('stroke-opacity', com.style.strokeOpacity)

      // ---------------------------------------------------------------------------------------------------
      let rect = box.g
        .selectAll('rect.' + mainTag + 'telHealth')
        .data(rectData, function (d) {
          return d.data.id
        })

      rect
        .enter()
        .append('rect')
        .attr('class', mainTag + 'telHealth')
        .style('opacity', 0)
        .attr('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('x', function (d) {
          return d.data.rect.x
        })
        .attr('y', function (d) {
          return d.data.rect.y
        })
        .attr('width', function (d) {
          return d.data.rect.w
        })
        .attr('height', function (d) {
          return d.data.rect.h
        })
        .attr('stroke-width', com.style.strokeWidth)
        .attr('fill', function (d, i) {
          return com.style.fill(d, d.data.nBlock)
        })
        .attr('fill-opacity', com.style.fillOpacity)
        .attr('stroke', function (d, i) {
          return com.style.stroke(d, d.data.nBlock)
        })
        // .attr("stroke", function(d) { return com.style.stroke(d,d.data.nObs); })
        .attr('stroke-opacity', com.style.strokeOpacity)
        .attr('pointer-events', com.style.pointerEvents)
        .on('click', com.style.click)
        .merge(rect)
        .transition('inOut')
        .duration(timeD.animArc)
        // .attr("x", com.style.x)
        // .attr("y", com.style.y)
        // .attr("width", com.style.width)
        // .attr("height", com.style.height)
        .attr('x', function (d) {
          return d.data.rect.x
        })
        .attr('y', function (d) {
          return d.data.rect.y
        })
        .attr('width', function (d) {
          return d.data.rect.w
        })
        .attr('height', function (d) {
          return d.data.rect.h
        })
        .attr('stroke-width', com.style.strokeWidth)
        .style('opacity', 1)
        // .style("opacity", com.style.opacity)
        .attr('fill', function (d, i) {
          return com.style.fill(d, d.data.nBlock)
        })
        .attr('fill-opacity', com.style.fillOpacity)
        .attr('stroke', function (d) {
          return com.style.stroke(d, d.data.nBlock)
        })
        .attr('stroke-opacity', com.style.strokeOpacity)

      rect
        .exit()
        .transition('inOut')
        .duration(timeD.animArc / 2)
        .style('opacity', 0)
        .remove()

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let text = box.g.selectAll('text.' + mainTag + 'telHealth').data(
        desc.filter(function (d) {
          return d.height === 0
        }),
        function (d) {
          return d.data.id
        }
      )

      text
        .enter()
        .append('text')
        .attr('class', mainTag + 'telHealth')
        // .text(com.style.text)
        .text(function (d, i) {
          if (d.data.nTel === -1) return d.data.blockName
          else return telInfo.getTitle(d.data.id)
        })
        .style('font-weight', 'normal')
        .style('opacity', 0)
        .style('fill-opacity', 1)
        .style('fill', '#383b42')
        // .style("stroke", "#383b42")
        .style('stroke', '#8B919F')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('x', com.style.textX)
        .attr('y', com.style.textY)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .merge(text)
        .style('font-size', com.style.fontSize)
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', com.style.opacity)
        .attr('x', com.style.textX)
        .attr('y', com.style.textY)
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })

      text
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .style('opacity', 0)
        .remove()
    } else {
      let circ = box.g.selectAll('circle.' + mainTag + 'telHealth')

      circ
        .transition('updtCol')
        .duration(timeD.animArc)
        .attr('fill', function (d, i) {
          return com.style.fill(d, d.data.nBlock)
        })
        .attr('stroke', function (d) {
          return com.style.stroke(d, d.data.nBlock)
        })

      let rect = box.g.selectAll('rect.' + mainTag + 'telHealth')

      rect
        .transition('updtCol')
        .duration(timeD.animArc)
        .attr('fill', function (d, i) {
          return com.style.fill(d, d.data.nBlock)
        })
        .attr('stroke', function (d) {
          return com.style.stroke(d, d.data.nBlock)
        })
    }
  }
  this.update = update

  // ---------------------------------------------------------------------------------------------------
  // styling/helper functions
  // ---------------------------------------------------------------------------------------------------
  function setStyle (optIn) {
    if (!hasVar(optIn)) optIn = {}

    com.style = {}

    com.style.x = function (d) {
      if (d.height === 1) return box.x + d.x0 - box.marg * box.margFrac
      else return box.x + d.x0
    }
    com.style.y = function (d) {
      if (d.height === 1) return box.y + d.y0 - box.marg * box.margFrac
      else return box.y + d.y0
    }
    com.style.width = function (d) {
      // just in case, a minimal value...
      let w = Math.max(5, d.x1 - d.x0)
      if (d.height === 1) return w + box.marg * box.margFrac * 2
      else return w
    }
    com.style.height = function (d) {
      // just in case, a minimal value...
      let h = Math.max(5, d.y1 - d.y0)
      if (d.height === 1) return h + box.marg * box.margFrac * 2
      else return h
    }
    com.style.r = function (d) {
      // console.log(d.parent.data.id);
      return com.telR[d.parent.data.id]
      // return Math.min(com.style.width(d), com.style.height(d))/2;
    }
    com.style.cx = function (d) {
      return com.style.x(d) + com.style.width(d) / 2
    }
    com.style.cy = function (d) {
      return com.style.y(d) + com.style.height(d) / 2
    }
    com.style.fill = function (d, nObs) {
      if (d.height === 0) {
        if (d.data.nTel === -1) {
          return com.recCol({ d: d, state: 'run', nObs: nObs, canRun: true })
        } else return telHealthCol(com.telHealth[d.data.id])
      } else {
        return 'transparent'
      }
    }
    com.style.fillOpacity = function (d) {
      if (d.data.nTel === -1) return com.recFillOpac('run')
      else return 0.7
    }
    com.style.stroke = function (d, nObs) {
      if (d.height === 0) {
        if (d.data.nTel === -1) {
          return d3
            .rgb(com.recCol({ d: d, state: 'run', nObs: nObs, canRun: true }))
            .darker(1.0)
        } else return telHealthCol(com.telHealth[d.data.id], 0.5)
      } else if (d.height === 1) {
        return d3
          .rgb(com.recCol({ d: d, state: 'run', nObs: nObs, canRun: true }))
          .darker(1.0)
      } else {
        return 'transparent'
      }
    }
    com.style.strokeWidth = function (d) {
      if (d.height === 0) return 1
      else return box.marg / 8
    }
    com.style.strokeOpacity = function (d) {
      if (d.height === 0) {
        if (d.data.nTel === -1) return com.recStrokeOpac(d)
        else return 0.5
      } else {
        return com.recFillOpac('run')
      }
    }
    com.style.opacity = function (d) {
      if (d.height === 2) return 0
      else if (d.height === 1) {
        if (d.data.id === telInfo.noSubArrName()) return 0
        else return 0.5
      } else {
        if (d.parent.data.id === telInfo.noSubArrName()) return 0.4
        else return 1
      }
    }
    com.style.pointerEvents = function (d) {
      if (d.height === 0) return 'auto'
      else return 'none'
    }
    com.style.click = function (d) {
      return com.click({ id: d.data.id, nTel: d.data.nTel })
    }
    com.style.text = function (d) {
      if (d.height === 0) return d.data.id
      else return ''
    }
    com.style.textX = function (d, i, xx) {
      return com.style.x(d) + com.style.width(d) / 2
    }
    com.style.textY = function (d) {
      return com.style.y(d) + com.style.height(d) / 2
    }
    com.style.fontSize = function (d) {
      if (d.data.nTel >= 0) {
        d.size = com.style.r(d) * 2
      } else {
        d.size = 0.8 * Math.min(com.style.width(d), com.style.height(d))
      }
      d.size = Math.max(com.minTxtSize, d.size) / 3
      return d.size + 'px'
    }
  }
}
