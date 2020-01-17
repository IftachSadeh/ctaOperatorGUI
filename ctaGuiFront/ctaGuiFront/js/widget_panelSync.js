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
var mainScriptTag = 'panelSync'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global timeD */
/* global hasVar */
/* global moveNodeUp */
/* global RunLoop */
/* global Locker */
/* global iconBadge */
/* global unique */
/* global appendToDom */
/* global runWhenReady */
/* global vorPloyFunc */
/* global disableScrollSVG */
/* global bckPattern */
/* global ScrollGrid */

window.loadScript({ source: mainScriptTag, script: '/js/utils_scrollGrid.js' })

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 9
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = { SockFunc: sockPanelSync, MainFunc: mainPanelSync }
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
let sockPanelSync = function (optIn) {
  let widgetType = optIn.widgetType
  let widgetSource = optIn.widgetSource

  // ---------------------------------------------------------------------------------------------------
  // ask for update for state1 data for a given module
  // ---------------------------------------------------------------------------------------------------
  this.askData = function (optIn) {
    if (sock.conStat.isOffline()) return

    let dataEmit = {
      widgetSource: widgetSource,
      widgetName: widgetType,
      widgetId: optIn.widgetId,
      methodName: 'askData'
    }

    sock.socket.emit('widget', dataEmit)
  }

  // ---------------------------------------------------------------------------------------------------
  // ask for update for state1 data for a given module
  // ---------------------------------------------------------------------------------------------------
  this.groupsToServer = function (optIn) {
    if (sock.conStat.isOffline()) return

    let data = {}
    data.widgetId = optIn.widgetId
    data.data = optIn.data

    let dataEmit = {
      widgetSource: widgetSource,
      widgetName: widgetType,
      widgetId: data.widgetId,
      methodName: 'setSyncGroups',
      methodArgs: data
    }
    // console.log(dataEmit);
    sock.socket.emit('widget', dataEmit)
  }
}

let mainPanelSync = function (optIn) {
  // let myUniqueId = unique()
  let widgetType = optIn.widgetType
  let tagpanelSyncSvg = optIn.baseName
  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle

  // let thisPanelSync = this
  let isSouth = window.__nsType__ === 'S'

  // let sgvTag = {};
  // $.each(widgetEle, function(index,eleNow) {
  //   sgvTag[eleNow.id] = { id:tagpanelSyncSvg+"_"+eleNow.id, whRatio:(eleNow.w/eleNow.h) };
  // })
  let sgvTag = {}
  $.each(widgetEle, function (index, eleNow) {
    sgvTag[eleNow.id] = {
      id: tagpanelSyncSvg + eleNow.id,
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

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function initData (dataIn) {
    if (sock.multipleInit({ id: widgetId, data: dataIn })) return

    sock.setBadgeIcon({ nIcon: dataIn.nIcon, iconDivV: null })
    
    svgMain.initData(dataIn.data)

    svgMain.setAllowSyncState(dataIn.data)
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
    let recD = {}
    let svg = {}
    let grpD = {}

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

    // let arcPrev = {}
    // arcPrev.ang = {}
    // arcPrev.rad = {}

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

    let zoomLen = {}
    zoomLen['0'] = 1
    zoomLen['1'] = 5

    // let colsBlk = [colsReds[0], colsBlues[0], colsGreens[2], colsPurples[0]] // colsYellows[4]

    // flag to add a new-group toggle box
    let canTogEmpty = true
    // let allowPermEmptyGrp = !false;

    // delay after a dragging event
    let delayAfterDrag = 500
    // sllow this time to use the new empty group before a dataupdate removes it
    let delayAfterAddEmpty = 5000

    // some initializations
    com.addEmptyGrp = false

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    let tagMain = widgetType
    let tagIcon = tagMain + 'icons'
    let tagCirc = tagMain + 'telCirc'
    let tagTtl = tagMain + 'telTitle'
    let tagVor = tagMain + 'telVor'
    let tagGridRec = tagMain + 'colLeft'
    let tagLeftIn = tagMain + 'dataIn'
    let tagEmpty = tagMain + 'empty'
    let tagClipPath = tagMain + 'tagClipPath'

    let wh = [lenD.w[0], lenD.h[0]]
    let sideColW = wh[0] * 0.2
    let whPack = [wh[0] - sideColW, wh[1]] // [ Math.min(wh[0],wh[1])*(1-whFrac*2) , Math.min(wh[0],wh[1])*(1-whFrac*2) ]
    let shiftMainG = [sideColW, 0]
    let nEmptyIcon = -1 // nEmptyIcon = 81; // set high for debugging...

    function groupsToServer () {
      let data = { id: 'allGrps', children: [] }

      updateEmptyGrp()

      $.each(grpD.data.children, function (nChild0, childNow0) {
        if (!isEmptyGrp(childNow0.id)) {
          let childV = []
          $.each(childNow0.children, function (nChild1, childNow1) {
            childV.push([])
            $.each(childNow1.children, function (nChild2, childNow2) {
              if (childNow2.nIcon >= 0) {
                // console.log('xxxxxxx',childNow2);
                childV[nChild1].push([childNow2.trgWidgId, childNow2.id])
              }
            })
          })

          data.children.push({
            id: childNow0.id,
            ttl: childNow0.ttl,
            children: childV
          })
        }
      })

      sock.widgetV[widgetType].SockFunc.groupsToServer({
        widgetId: widgetId,
        data: data
      })

      // console.log('groupsToServer',data);
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initData (dataIn) {
      grpD.data = dataIn.groups

      if (hasVar(svg.svg)) return

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
      // .call(com.svgZoom)
      // .on("dblclick.zoom", null)

      if (disableScrollSVG) {
        svg.svg.on('wheel', function () {
          d3.event.preventDefault()
        })
      }

      svg.g = svg.svg.append('g')
      svg.overlay = svg.svg.append('g')

      // add one circle as background
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
      svg.recG = svg.g.append('g')
      recD.gBase = svg.recG.append('g')
      recD.dataG = svg.recG.append('g')

      svg.mainG = svg.g.append('g')

      com.vor = {}
      com.vor.g = svg.mainG.append('g')

      com.empty = {}
      com.empty.g = svg.mainG.append('g')

      com.icons = {}
      com.icons.g = svg.mainG.append('g')

      com.highlight = {}
      com.highlight.g = svg.mainG.append('g')

      svg.mainG.attr(
        'transform',
        'translate(' + shiftMainG[0] + ',' + shiftMainG[1] + ')'
      )

      // // for debugging
      // svg.mainG.append("g").selectAll("rect").data([0])
      //   .enter()
      //   .append("rect")
      //     .attr("x", 0).attr("y", 0)
      //     .attr("width", whPack[0])
      //     .attr("height", whPack[1])
      //     .attr("fill", "transparent")
      //     .style("stroke", colsPurples[4] )
      //     .style("pointer-events", "none")

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      function doDragMainStart (dIn, thisIn) {
        moveNodeUp(thisIn, 2)

        com.icons.g.selectAll('g.' + tagIcon).style('pointer-events', 'none')

        com.icons.g
          .selectAll('circle.' + tagCirc)
          .style('pointer-events', 'none')

        grpD.hovIdIcon = dIn.data.id
        grpD.hovIdGrpStart = dIn.parent.data.id
      }

      com.dragMainStart = function (dIn, thisIn) {
        locker.add({ id: tagMain + 'inDrag', override: true })

        doDragMainStart(dIn, thisIn)
      }

      com.dragMainDuring = function (dIn, thisIn) {
        d3.select(thisIn).attr('transform', function (d) {
          d.x = d3.event.x
          d.y = d3.event.y
          return 'translate(' + d.x + ',' + d.y + ')'
        })
      }

      function doDragMainEnd (dIn, thisIn) {
        com.icons.g
          .selectAll('g.' + tagIcon)
          .style('pointer-events', iconPntEvt)

        com.icons.g
          .selectAll('circle.' + tagCirc)
          .style('pointer-events', 'auto')

        updateGroups()
        removeDuplicates()
        groupsToServer()

        grpD.hovIdGrpStart = null
      }

      com.dragMainEnd = function (dIn, thisIn) {
        doDragMainEnd(dIn, thisIn)

        locker.remove({
          id: tagMain + 'inDrag',
          override: true,
          delay: delayAfterDrag
        })
      }

      com.dragMain = d3
        .drag()
        .on('start', function (d) {
          com.dragMainStart(d, this)
        })
        .on('drag', function (d) {
          com.dragMainDuring(d, this)
        })
        .on('end', function (d) {
          com.dragMainEnd(d, this)
        })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let iconSide = null
      let iconSideSel = null
      com.dragSideStart = function (dIn) {
        locker.add({ id: tagMain + 'inDrag', override: true })

        let idSide = sideColClick(dIn)
        let iconV = com.hirchDesc.filter(function (d) {
          return d.data.id === idSide
        })

        iconSide = iconV.length === 0 ? null : iconV[0]
        iconSideSel = iconV.length === 0 ? null : svg.mainG.select('#' + idSide)

        if (hasVar(iconSideSel)) {
          moveNodeUp(iconSideSel.node(), 2)
        }

        iconSideSel
          .transition('inOut')
          .duration(timeD.animArc / 5)
          .attr('transform', function (d) {
            d.x = d3.event.x - shiftMainG[0]
            d.y = d3.event.y - shiftMainG[1]
            return 'translate(' + d.x + ',' + d.y + ')'
          })

        if (hasVar(iconSide)) doDragMainStart(iconSide, this)
      }

      com.dragSideDuring = function (dIn) {
        if (!hasVar(iconSide)) return

        iconSideSel.attr('transform', function (d) {
          d.x = d3.event.x - shiftMainG[0]
          d.y = d3.event.y - shiftMainG[1]
          return 'translate(' + d.x + ',' + d.y + ')'
        })
      }

      com.dragSideEnd = function (dIn) {
        doDragMainEnd(iconSide, this)

        iconSide = null
        iconSideSel = null

        locker.remove({
          id: tagMain + 'inDrag',
          override: true,
          delay: delayAfterDrag
        })
      }

      com.dragSide = d3
        .drag()
        .on('start', com.dragSideStart)
        .on('drag', com.dragSideDuring)
        .on('end', com.dragSideEnd)

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let marg = wh[1] * 0.025
      let w0 = sideColW - marg * 2
      let h0 = wh[1] - marg * 2
      let x0 = marg
      let y0 = marg

      if (canTogEmpty) {
        h0 -= w0 + marg
        initNewGrpSideTog({
          gTransX: x0 - shiftMainG[0],
          gTransY: y0 + h0 + marg,
          recW: w0
        })
      }

      recD.recOpt = {
        id: tagGridRec,
        tagClipPath: tagClipPath,
        recD: recD,
        recV: [],
        gBox: recD.gBase,
        x0: x0,
        y0: y0,
        w0: w0,
        h0: h0,
        recH: w0 * 0.5,
        recW: w0 * 0.5,
        showCounts: false,
        isHorz: false,
        bckRecOpt: { textureOrient: '5/8', frontProp: { strkWOcp: 0.2 } },
        // vorOpt: { mouseover: sideColHov, call: com.dragSide },
        vorOpt: { mouseover: sideColHov, call: com.dragSide },
        onZoom: { during: updSideColOnZoom, end: updSideColOnZoom },
        runLoop: runLoop,
        locker: locker,
        lockerV: [tagMain + 'updateData', tagMain + 'inDrag'],
        lockerZoom: {
          all: tagGridRec + 'zoom',
          during: tagGridRec + 'zoomDuring',
          end: tagGridRec + 'zoomEnd'
        }
      }

      com.scrollGrid = new ScrollGrid(recD.recOpt)

      recD.dataG = com.scrollGrid.getBackDataG()
      recD.dataG.attr('clip-path', function (d) {
        return 'url(#' + tagClipPath + tagGridRec + ')'
      })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      runLoop.push({ tag: 'updateData', data: dataIn.groups })

      runWhenReady({
        pass: function () {
          return locker.isFreeV(com.lockerUpdateV)
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
    function setAllowSyncState (dataIn) {
      let isAcive = dataIn.allowPanelSync

      let tagRec = 'overlayRec'
      let rect = svg.overlay.selectAll('rect.' + tagRec).data([0])

      rect
        .enter()
        .append('rect')
        .attr('class', tagRec)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', lenD.w[0])
        .attr('height', lenD.h[0])
        .attr('fill', '#F2F2F2')
        // .attr("stroke-width", 0)
        .merge(rect)
        .attr('opacity', isAcive ? 0 : 0.7)
        .attr('pointer-events', isAcive ? 'none' : 'auto')

      // the background grid
      bckPattern({
        com: com,
        gNow: svg.overlay,
        gTag: tagRec,
        lenWH: [lenD.w[0], lenD.h[0]],
        opac: isAcive ? 0 : 0.2,
        circType: 'lighter'
      })
    }
    this.setAllowSyncState = setAllowSyncState

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function askData () {
      sock.widgetV[widgetType].SockFunc.askData({ widgetId: widgetId })
    }
    this.askData = askData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.lockerUpdateV = [
      tagMain + 'dataChange',
      tagMain + 'updateData',
      tagMain + 'updateGroups',
      tagMain + 'addedEmptyGrp',
      tagGridRec + 'zoom'
    ]
    // ---------------------------------------------------------------------------------------------------
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
    this.updateData = updateData

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateDataOnce (dataIn) {
      if (!locker.isFree(tagMain + 'inDrag')) return

      if (!locker.isFreeV(com.lockerUpdateV)) {
        // console.log('will delay _updateData_',locker.getActiveV(com.lockerUpdateV));
        setTimeout(function () {
          updateData(dataIn)
        }, timeD.animArc / 2)
        return
      }

      locker.add(tagMain + 'updateData')
      locker.expires({
        id: tagMain + 'dataChange',
        duration: delayAfterDrag
      })
      locker.expires({
        id: tagMain + 'clickEmptyGrp',
        duration: delayAfterDrag
      })

      // ---------------------------------------------------------------------------------------------------
      // use the original data for existing elements
      // ---------------------------------------------------------------------------------------------------
      let origV = {}
      $.each(grpD.data.children, function (nChild0, childNow0) {
        $.each(childNow0.children, function (nChild1, childNow1) {
          $.each(childNow1.children, function (nChild2, childNow2) {
            if (childNow2.nIcon !== nEmptyIcon) {
              origV[childNow2.id] = childNow2
            }
          })
        })
      })

      $.each(dataIn.children, function (nChild0, childNow0) {
        $.each(childNow0.children, function (nChild1, childNow1) {
          $.each(childNow1.children, function (nChild2, childNow2) {
            if (hasVar(origV[childNow2.id])) {
              dataIn.children[nChild0].children[nChild1].children[nChild2] =
                origV[childNow2.id]
            }
          })
        })
      })

      // // preserve the original empty group, if it remains empty
      // // ---------------------------------------------------------------------------------------------------
      // updateEmptyGrp();

      // $.each(grpD.data.children, function(nChild0,childNow0) {
      //   if(isEmptyGrp(childNow0)) {
      //     let emptyGrpId = childNow0.id;
      //     let allGrpIds  = dataIn.children.map(function(d){ return d.id; });
      //     if(allGrpIds.indexOf(emptyGrpId) < 0) {
      //       dataIn.children.push(childNow0);
      //     }
      //   }
      // })

      // reference the new data in the local obj
      grpD.data = dataIn

      locker.remove({
        id: tagMain + 'updateData',
        delay: timeD.animArc * 2
      })

      // finally update, using the new data
      updateGroups()
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initNewGrpSideTog (optIn) {
      let gTransX = optIn.gTransX
      let gTransY = optIn.gTransY
      let recW = optIn.recW

      com.empty.g.attr('transform', function (d, i) {
        return 'translate(' + gTransX + ',' + gTransY + ')'
      })

      let dataEmptyD = {
        id: 'emptyGroup',
        children: [
          {
            id: 'emptyGroup0',
            ttl: 'Add/remove',
            children: [
              { id: 'emptyGroup00' },
              { id: 'emptyGroup01' },
              { id: 'emptyGroup02' }
            ]
          }
        ]
      }

      let hirch = d3.hierarchy(dataEmptyD).sum(function (d) {
        return 1
      })
      let packNode = d3
        .pack()
        .size([recW, recW])
        .padding(5)
      packNode(hirch)

      let hirchDesc = hirch.descendants()

      let circ = com.empty.g
        .selectAll('circle.' + tagEmpty)
        .data(hirchDesc, function (d) {
          return d.data.id
        }) // console.log('xxx',d.data.id);

      circ
        .enter()
        .append('circle')
        // .attr("id", function(d,i) { return myUniqueId+tagCirc+"_"+d.data.id; })
        .attr('class', tagEmpty)
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .style('opacity', 0)
        .attr('r', function (d, i) {
          return d.r
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('stroke-width', function (d) {
          d.data.strkW = d.depth === 2 ? 2.0 : 0.5
          return d.data.strkW
        })
        .style('stroke', function (d) {
          return hirchStyleStroke(d)
        })
        .style('fill', function (d) {
          return hirchStyleFill(d)
        })
        .style('stroke-opacity', function (d) {
          return hirchOpacStrk(d)
        })
        .style('fill-opacity', function (d) {
          return hirchOpacFill(d)
        })
        .merge(circ)
        .transition('out')
        .duration(timeD.animArc)
        .style('opacity', 1)
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .attr('r', function (d, i) {
          return d.r
        })

      circ
        .exit()
        .transition('out')
        .duration(timeD.animArc / 2)
        .style('opacity', 0)
        .attr('stroke-width', 0)
        .style('fill-opacity', 0)
        .remove()

      setTtl(hirchDesc)

      com.empty.g
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', recW)
        .attr('height', recW)
        .attr('stroke-width', 0)
        .attr('fill', 'transparent')
        .on('mouseover', function (d) {
          // just in case...
          grpD.hovIdGrpNow = null
        })
        .on('click', function (d) {
          if (
            !locker.isFreeV([
              tagMain + 'clickEmptyGrp',
              tagMain + 'inDrag',
              tagMain + 'setAll',
              tagMain + 'updateData',
              tagMain + 'updateGroups'
            ])
          ) {
            return
          }

          locker.add({ id: tagMain + 'clickEmptyGrp', override: true })
          locker.add({ id: tagMain + 'addedEmptyGrp', override: true })

          // if(allowPermEmptyGrp) com.addEmptyGrp = !com.addEmptyGrp;

          updateEmptyGrp()

          if (com.emptyGrpIndex >= 0) updateGroups()
          else sideColClick()

          locker.remove({
            id: tagMain + 'clickEmptyGrp',
            override: true,
            delay: timeD.animArc * 2
          })
          locker.remove({
            id: tagMain + 'addedEmptyGrp',
            override: true,
            delay: delayAfterAddEmpty
          })
        })
      // .attr("stroke-width", 2).attr("stroke", "red")
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setHirch () {
      // console.log(grpD.data);
      // let tagCirc = "telCirc";

      com.hirch = d3.hierarchy(grpD.data).sum(function (d) {
        return 1
      })
      let packNode = d3
        .pack()
        .size(whPack)
        .padding(15)
      packNode(com.hirch)

      com.hirchDesc = com.hirch.descendants()

      grpD.hovIdGrp0 = null

      let circ = com.icons.g
        .selectAll('circle.' + tagCirc)
        .data(com.hirchDesc, function (d) {
          return d.data.id
        }) // console.log('xxx',d.data.id);

      circ
        .enter()
        .append('circle')
        // .attr("id", function(d,i) { return myUniqueId+tagCirc+"_"+d.data.id; })
        .attr('class', tagCirc)
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .style('opacity', 0)
        .attr('r', function (d, i) {
          return d.r
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('stroke-width', function (d) {
          d.data.strkW = d.depth === 2 ? 2.0 : 0.5
          return d.data.strkW
        })
        .style('stroke', function (d) {
          return hirchStyleStroke(d)
        })
        .style('fill', function (d) {
          return hirchStyleFill(d)
        })
        .style('stroke-opacity', function (d) {
          return hirchOpacStrk(d)
        })
        .style('fill-opacity', function (d) {
          return hirchOpacFill(d)
        })
        // .on("mouseover", hirchStyleHover).on("click", hirchStyleClick).on("dblclick", hirchStyleDblclick)
        .merge(circ)
        .each(function (d) {
          if (d.depth === 2) {
            if (!hasVar(grpD.hovIdGrp0)) grpD.hovIdGrp0 = d.data.id
          }
        })
        .transition('out')
        .duration(timeD.animArc)
        .style('opacity', 1)
        // .style("opacity", function(d){
        //     // if(d.depth == 1 && d.data.isEmpty) return 0.2;
        //     if(d.depth == 2 && d.parent.data.isEmpty) return 0.2;
        //   return 1;
        // })
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .attr('r', function (d, i) {
          return d.r
        })

      circ
        .exit()
        .transition('out')
        .duration(timeD.animArc / 2)
        .style('opacity', 0)
        .attr('stroke-width', 0)
        .style('fill-opacity', 0)
        .remove()
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setIcons () {
      let needUpdt = false
      let sclR = 1
      let data = com.hirchDesc.filter(function (d) {
        return d.depth === 3
      })
      let icn = com.icons.g.selectAll('g.' + tagIcon).data(data, function (d) {
        return d.data.id
      })

      icn
        .enter()
        .append('g')
        .attr('class', tagIcon)
        .attr('id', function (d) {
          return d.data.id
        })
        .each(function (d, i) {
          // console.log('-------',d.data);
          let iconSvg = iconBadge.get(d.data.nIcon)
          let badge = iconBadge.add({
            parentSvg: d3.select(this),
            iconFile: iconSvg[0],
            text: { pos: 'topRight', txt: iconSvg[1] },
            rad: d.r * sclR,
            delay: 0,
            pulseHovIn: true,
            transBack: false
          })
          d.data.badge = badge.g
          d.data.setR = badge.setR

          if (hasVar(d.data.init)) {
            d.x = d.data.init.x
            d.y = d.data.init.y
            d.r = d.data.init.r
          }
        })
        .attr('transform', function (d, i) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })
        .call(com.dragMain)
        .merge(icn)
        .style('pointer-events', iconPntEvt)
        // .each(function(d,i) { if(d.data.nIcon>=0)console.log(d.data.id,d) })
        .each(function (d, i) {
          if (hasVar(d.data.setR)) {
            d.data.setR(d.r * sclR)
          } else {
            // can happen after a disconnect, that we loose the original element
            // then, just remove it (no time for transitions!!!), and ask for an update
            needUpdt = true
            console.log('000 - no d.data.setR -', d.data.id)
            com.icons.g.select('#' + d.data.id).remove()
          }
        })
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('transform', function (d, i) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })

      icn
        .exit()
        .transition('inOut')
        .duration(timeD.animArc / 4)
        .style('opacity', 0)
        .remove()

      if (needUpdt) askData()
    }
    function iconPntEvt (d) {
      return d.data.nIcon === nEmptyIcon ? 'none' : 'auto'
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function sideColHov (d) {
      // console.log('sideColHov',d.data.id)
      // just in case...
      grpD.hovIdGrpNow = null
    }

    function sideColClick (dIn) {
      let idNow = 'icn' + unique()
      if (hasVar(dIn)) {
        let nIcon = dIn.data.data.data.nIcon
        let trgWidgId = dIn.data.data.data.trgWidgId

        let initXYR = {}
        let rScale = 1.2
        initXYR.r = dIn.data.w / 2
        initXYR.x =
          dIn.data.x +
          dIn.data.w / 2 -
          shiftMainG[0] -
          (rScale - 1) * initXYR.r / 2
        initXYR.y =
          dIn.data.y +
          dIn.data.h / 2 -
          shiftMainG[1] -
          (rScale - 1) * initXYR.r / 2
        initXYR.r *= rScale

        let dataAdd = {
          id: idNow,
          trgWidgId: trgWidgId,
          ttl: '',
          nIcon: nIcon,
          init: initXYR
        }

        updateEmptyGrp()

        if (com.emptyGrpIndex >= 0) {
          grpD.data.children[com.emptyGrpIndex].children[0].children = [dataAdd]
        } else {
          let nGrp = -1
          let grpIdV = grpD.data.children.map(function (d) {
            return d.id
          })
          $.each(grpD.data.children, function (nChild0, childNow0) {
            if (grpIdV.indexOf('grp' + nChild0) < 0 && nGrp < 0) {
              nGrp = nChild0
            }
          })
          if (nGrp < 0) nGrp = grpD.data.children.length

          let newGrp = {
            id: 'grp' + nGrp,
            ttl: 'Group ' + nGrp,
            children: [
              { id: 'grp' + nGrp + '_0', children: [dataAdd] },
              // { id:"grp_"+nGrp+"_0", children: [{id:"icn_"+nGrp+"_0"+idNow, trgWidgId:"", nIcon:nEmptyIcon}, dataAdd] },
              {
                id: 'grp' + nGrp + '_1',
                children: [
                  {
                    id: 'icn' + nGrp + '_1' + idNow,
                    trgWidgId: '',
                    nIcon: nEmptyIcon
                  }
                ]
              },
              {
                id: 'grp' + nGrp + '_2',
                children: [
                  {
                    id: 'icn' + nGrp + '_2' + idNow,
                    trgWidgId: '',
                    nIcon: nEmptyIcon
                  }
                ]
              }
            ]
          }
          grpD.data.children.push(newGrp)
        }
      }

      // if(!allowPermEmptyGrp) com.addEmptyGrp  = !hasVar(dIn);
      grpD.hovIdGrpStart = null
      com.addEmptyGrp = !hasVar(dIn)

      updateGroups()

      // if(!allowPermEmptyGrp) com.addEmptyGrp  = false;
      com.addEmptyGrp = false

      return idNow
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function initSideCol () {
      let data = grpD.data.allWidgetV

      let iconVorig = hasVar(recD[tagLeftIn]) ? recD[tagLeftIn] : []
      let iconVnew = []
      let trgWidgIdV = []
      $.each(iconVorig, function (index0, ele0) {
        let idNow = ele0.data.id
        let trgWidgId = ele0.data.trgWidgId

        $.each(data, function (index1, ele1) {
          if (idNow === ele1.id && trgWidgIdV.indexOf(trgWidgId) < 0) {
            iconVnew.push(ele0)

            trgWidgIdV.push(trgWidgId)
          }
        })
      })

      $.each(data, function (index0, ele0) {
        if (ele0.nIcon !== nEmptyIcon) {
          let idNow = ele0.id
          let trgWidgId = ele0.trgWidgId
          let eleIndex = -1

          $.each(iconVorig, function (index1, ele1) {
            if (ele1.id === idNow) eleIndex = index1
          })

          if (eleIndex < 0 && trgWidgIdV.indexOf(trgWidgId) < 0) {
            // console.log(ele0.trgWidgId);
            iconVnew.push({
              id: idNow,
              data: { id: idNow, trgWidgId: trgWidgId, nIcon: ele0.nIcon }
            })

            trgWidgIdV.push(trgWidgId)
          }
        }
      })

      recD[tagLeftIn] = iconVnew
      iconVorig = null
      iconVnew = null
      trgWidgIdV = null

      updSideCol()
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updSideCol () {
      let recV = recD[tagLeftIn]
      if (!hasVar(recV)) recV = []

      com.scrollGrid.update({ recV: recV })

      let needUpdt = false
      let sclR = 1
      let dataNow = recD[tagGridRec]
      let icn = recD.dataG
        .selectAll('g.a' + tagIcon)
        .data(dataNow, function (d) {
          return d.data.id
        })

      icn
        .enter()
        .append('g')
        .attr('class', 'a' + tagIcon)
        .attr('id', function (d) {
          return d.data.id
        })
        .each(function (d, i) {
          let iconSvg = iconBadge.get(d.data.data.nIcon)
          let badge = iconBadge.add({
            parentSvg: d3.select(this),
            iconFile: iconSvg[0],
            text: { pos: 'topRight', txt: iconSvg[1] },
            rad: d.w / 2 * sclR,
            delay: 300,
            pulseHovIn: true,
            transBack: true
          })
          d.data.data.badge = badge.g
          d.data.data.setR = badge.setR
          // console.log(d.data.id,d.x)
        })
        .attr('transform', function (d, i) {
          return 'translate(' + (d.x + d.w / 2) + ',' + (d.y + d.h / 2) + ')'
        })
        .call(com.dragSide)
        .merge(icn)
        .style('pointer-events', iconPntEvt)
        // .each(function(d,i) { if(d.data.nIcon>=0)console.log(d.data.id,d) })
        .each(function (d) {
          if (hasVar(d.data.data.setR)) {
            d.data.data.setR(d.w / 2 * sclR)
          } else {
            // can happen after a disconnect, that we loose the original element
            // then, just remove it (no time for transitions!!!), and ask for an update
            needUpdt = true
            console.log('111 - no d.data.data.setR -', d.data.id)
            recD.dataG.select('#' + d.data.id).remove()
          }
        })
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('transform', function (d) {
          return 'translate(' + (d.x + d.w / 2) + ',' + (d.y + d.h / 2) + ')'
        })
        .style('opacity', 1)

      icn
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('opacity', 0)
        .remove()

      if (needUpdt) askData()
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updSideColOnZoom (optIn) {
      let icn = recD.dataG.selectAll('g.a' + tagIcon)
      let duration = optIn.duration
      let trans = function (d) {
        return 'translate(' + (d.x + d.w / 2) + ',' + (d.y + d.h / 2) + ')'
      }

      if (duration <= 0) {
        icn.attr('transform', trans)
      } else {
        icn
          .transition('move')
          .duration(duration)
          .attr('transform', trans)
      }
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setTtl (dataIn) {
      let ttlV = ['Both', 'Sends', 'Gets']

      let data, gNow
      if (hasVar(dataIn)) {
        gNow = com.empty.g
        data = dataIn.filter(function (d) {
          if (d.depth === 0 || d.depth === 3) return false
          return true
        })
      } else {
        updateEmptyGrp()

        gNow = com.icons.g
        data = com.hirchDesc.filter(function (d) {
          // console.log(d.data.ttl,isEmptyGrp(d));
          if (d.depth === 0 || d.depth === 3) return false
          else if (d.depth === 2 && !isEmptyGrp(d)) return false
          else return true
        })
      }

      function fontSize (d) {
        d.size = d.depth === 1 ? d.r / 4.5 : d.r / 1.7
        if (hasVar(dataIn) && d.depth === 1) d.size *= 1.5
        return d.size + 'px'
      }

      let txt = gNow.selectAll('text.' + tagTtl).data(data, function (d) {
        return d.data.id
      })

      txt
        .enter()
        .append('text')
        .attr('class', tagTtl)
        .text('')
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .style('text-anchor', 'middle')
        .style('font-weight', function (d) {
          return d.depth === 1 ? 'bold' : 'normal'
        })
        .style('stroke-width', hasVar(dataIn) ? 0.3 : 1)
        .style('stroke', function (d) {
          if (hasVar(dataIn)) {
            return d.depth === 1
              ? '#383b42'
              : d3.rgb(hirchStyleStroke(d)).darker(5)
          } else {
            return d.depth === 1
              ? '#383b42'
              : d3.rgb(hirchStyleStroke(d)).darker(1)
          }
        })
        .style('fill', hirchStyleStroke)
        .style('pointer-events', 'none')
        .style('vector-effect', 'non-scaling-stroke')
        .style('font-size', fontSize)
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
        .attr('transform', function (d) {
          if (d.depth === 1) return 'translate(' + d.x + ',' + (d.y - d.r) + ')'
          else return 'translate(' + d.x + ',' + d.y + ')'
        })
        .merge(txt)
        .transition('inOut')
        .duration(timeD.animArc)
        .delay(timeD.animArc / 2)
        .attr('transform', function (d) {
          if (d.depth === 1) return 'translate(' + d.x + ',' + (d.y - d.r) + ')'
          else return 'translate(' + d.x + ',' + d.y + ')'
        })
        .style('font-size', fontSize)
        .attr('dy', function (d) {
          let dyScale
          if (!hasVar(dataIn) && d.depth === 1) {
            dyScale = grpD.data.children.length === 1 ? 2 : 1
          } else if (d.depth === 1) {
            dyScale = 1.5
          } else {
            dyScale = 1
          }
          return dyScale * d.size / 3 + 'px'
        })
        .text(function (d) {
          if (d.depth === 1) {
            return hasVar(d.data.ttl) ? d.data.ttl : d.data.id
          } else {
            return ttlV[getIndexInParent(d)]
          }
        })
        .style('fill-opacity', function (d) {
          if (hasVar(dataIn)) return 0.7
          else return d.depth === 1 ? 0.4 : 0.7
        })
        .style('stroke-opacity', 0.9)

      txt
        .exit()
        .transition('inOut')
        .duration(timeD.animArc / 2)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .remove()
    }

    function setVor () {
      let showVor = false

      let vorFunc = d3
        .voronoi()
        .x(function (d) {
          return d.x
        })
        .y(function (d) {
          return d.y
        })
        .extent([[0, 0], [lenD.w[0], lenD.h[0]]])

      let data = com.hirchDesc.filter(function (d) {
        return d.depth === 2
      })
      let vor = com.vor.g
        .selectAll('path.' + tagVor)
        .data(vorFunc.polygons(data), function (d) {
          return d.data.id
        })

      vor
        .enter()
        .append('path')
        .attr('class', tagVor)
        .style('fill', 'transparent')
        .style('opacity', '0')
        .attr('vector-effect', 'non-scaling-stroke')
        .on('mouseover', function (d) {
          // console.log('in ',hasVar(d)?d.data.data.id:"-");
          if (hasVar(d)) {
            highlight({
              id: d.data.data.id,
              data: [{ x: d.data.x, y: d.data.y, r: d.data.r }],
              type: {
                name: 'pulse',
                duration: 1500,
                col: hirchStyleStroke(d.data)
              }
            })

            grpD.hovIdGrpNow = d.data.data.id
          }
        })
        .on('mouseout', function (d) {
          // console.log('out',hasVar(d)?d.data.data.id:"-");
          grpD.hovIdGrpNow = null

          highlight({
            id: d.data.data.id,
            data: [],
            type: {
              name: 'pulse',
              duration: 1500,
              col: hirchStyleStroke(d.data)
            }
          })
        })
        .merge(vor)
        .call(function (d) {
          d.attr('d', vorPloyFunc)
        })
      // .on("mouseover", telData.vorHov)
      // .on("click",     telData.vorClick)
      // .on("dblclick",  function(d) { telData.vorDblclick({ d:d, isInOut:dblclickZoomInOut }); })

      if (showVor) {
        com.vor.g
          .selectAll('path.' + tagVor)
          .style('opacity', '0.25')
          .style('stroke-width', '1.5')
          .style('stroke', '#E91E63')
      }

      vor
        .exit()
        .transition('out')
        .duration(timeD.animArc / 2)
        .attr('opacity', 0)
        .remove()
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateGroups () {
      if (
        !locker.isFreeV([tagMain + 'updateData', tagMain + 'updateGroups'])
      ) {
        setTimeout(function () {
          updateGroups()
        }, timeD.animArc / 2)
        return
      }
      locker.add({ id: tagMain + 'updateGroups' })

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let dataTrans = null
      let rmInd = null
      if (hasVar(grpD.hovIdGrpStart)) {
        $.each(grpD.data.children, function (nChild0, childNow0) {
          $.each(childNow0.children, function (nChild1, childNow1) {
            if (childNow1.id === grpD.hovIdGrpStart) {
              $.each(childNow1.children, function (nChild2, childNow2) {
                if (childNow2.id === grpD.hovIdIcon) {
                  dataTrans = childNow2
                  rmInd = [nChild0, nChild1, nChild2]
                }
              })
            }
          })
        })
      }

      if (hasVar(dataTrans)) {
        if (hasVar(grpD.hovIdGrpNow)) {
          $.each(grpD.data.children, function (nChild0, childNow0) {
            $.each(childNow0.children, function (nChild1, childNow1) {
              if (childNow1.id === grpD.hovIdGrpNow) {
                childNow1.children.push(dataTrans)
              }
            })
          })
        }

        grpD.data.children[rmInd[0]].children[rmInd[1]].children.splice(
          rmInd[2],
          1
        )

        // // add an empty iconBadge if needed
        // if(grpD.data.children[ rmInd[0] ].children[ rmInd[1] ].children.length == 0) {
        //   grpD.data.children[ rmInd[0] ].children[ rmInd[1] ].children
        //     .push({ id:"icn_empty_"+unique(), trgWidgId:"", ttl:"", nIcon:nEmptyIcon });
        // }
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      setEmptyIcons()

      // ---------------------------------------------------------------------------------------------------
      // update the com.emptyGrpIndex
      // ---------------------------------------------------------------------------------------------------
      updateEmptyGrp()

      // add an empy group if needed
      // ---------------------------------------------------------------------------------------------------
      if (com.addEmptyGrp && com.emptyGrpIndex < 0) {
        // find the minimal available index for the new empty group
        // ---------------------------------------------------------------------------------------------------
        let nGrp = -1
        let grpIdV = grpD.data.children.map(function (d) {
          return d.id
        })
        $.each(grpD.data.children, function (nChild0, childNow0) {
          if (grpIdV.indexOf('grp' + nChild0) < 0 && nGrp < 0) nGrp = nChild0
        })
        if (nGrp < 0) nGrp = grpD.data.children.length

        // ---------------------------------------------------------------------------------------------------
        // group names must be unique and of the pattern "grp_0", with sub
        // groups ["grp_0_0","grp_0_1","grp_0_2"], as defined exactly by the server
        // ---------------------------------------------------------------------------------------------------
        let idNow = unique()
        let newGrp = {
          id: 'grp' + nGrp,
          ttl: 'Group ' + nGrp,
          children: [
            {
              id: 'grp' + nGrp + '_0',
              children: [
                {
                  id: 'icn' + nGrp + '_0' + idNow,
                  trgWidgId: '',
                  nIcon: nEmptyIcon
                }
              ]
            },
            {
              id: 'grp' + nGrp + '_1',
              children: [
                {
                  id: 'icn' + nGrp + '_1' + idNow,
                  trgWidgId: '',
                  nIcon: nEmptyIcon
                }
              ]
            },
            {
              id: 'grp' + nGrp + '_2',
              children: [
                {
                  id: 'icn' + nGrp + '_2' + idNow,
                  trgWidgId: '',
                  nIcon: nEmptyIcon
                }
              ]
            }
          ]
        }
        grpD.data.children.push(newGrp)
      }

      // remove the empty group if needed
      // ---------------------------------------------------------------------------------------------------
      if (!com.addEmptyGrp && com.emptyGrpIndex >= 0) {
        grpD.data.children.splice(com.emptyGrpIndex, 1)
      }

      // ---------------------------------------------------------------------------------------------------
      // order groups by name
      // ---------------------------------------------------------------------------------------------------
      if (locker.isFree(tagMain + 'inDrag')) {
        grpD.data.children = grpD.data.children.sort(function (x, y) {
          let idX = parseInt(x.id.replace('grp', ''))
          let idY = parseInt(y.id.replace('grp', ''))

          return idX - idY
        })
      }

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      highlight({
        id: 'all',
        data: [],
        type: { name: 'pulse', duration: 100, col: '#383b42' }
      })

      setAll()

      initSideCol()

      locker.remove({ id: tagMain + 'updateGroups' })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function updateEmptyGrp () {
      com.emptyGrpIndex = -1
      com.emptyGrpId = unique()

      // let nEmptyGrps = 0
      $.each(grpD.data.children, function (nChild0, childNow0) {
        let nEmpties = 0
        $.each(childNow0.children, function (nChild1, childNow1) {
          if (childNow1.children.length === 1) {
            if (childNow1.children[0].nIcon === nEmptyIcon) nEmpties++
          }
        })
        if (nEmpties === 3) {
          // nEmptyGrps++
          com.emptyGrpIndex = nChild0
          com.emptyGrpId = childNow0.id
        }
      })

      // console.log('===',nEmptyGrps,com.emptyGrpIndex,com.emptyGrpId);
    }

    function isEmptyGrp (dIn) {
      let isEmpty = false
      let dNow = dIn
      while (hasVar(dNow)) {
        if (hasVar(dNow.id)) {
          if (com.emptyGrpId === dNow.id) isEmpty = true
        } else if (hasVar(dNow.data)) {
          if (hasVar(dNow.data.id)) {
            if (com.emptyGrpId === dNow.data.id) isEmpty = true
          }
        }

        dNow = dNow.parent
      }
      return isEmpty
    }

    // ---------------------------------------------------------------------------------------------------
    // remove duplicates within a given group, by trgWidgId
    // ---------------------------------------------------------------------------------------------------
    function removeDuplicates () {
      let hasRemoved = false
      $.each(grpD.data.children, function (nChild0, childNow0) {
        let idD = {}
        let hasDuplicates = false
        $.each(childNow0.children, function (nChild1, childNow1) {
          $.each(childNow1.children, function (nChild2, childNow2) {
            let idNow = childNow2.trgWidgId

            // do not register the first occurence, just initialize the vector
            if (!hasVar(idD[idNow])) {
              idD[idNow] = []
            } else {
              idD[idNow].push([nChild1, nChild2])
              hasRemoved = true
              hasDuplicates = true
            }
          })
        })

        if (hasDuplicates) {
          $.each(childNow0.children, function (nChild1, childNow1) {
            let childV = []
            $.each(childNow1.children, function (nChild2, childNow2) {
              let idNow = childNow2.trgWidgId

              let willRemove = false
              $.each(idD[idNow], function (index, objNow) {
                if (objNow[0] === nChild1 && objNow[1] === nChild2) {
                  willRemove = true
                }
              })
              if (!willRemove) childV.push(childNow2)
            })
            grpD.data.children[nChild0].children[nChild1].children = childV
          })
        }
      })

      if (hasRemoved) updateGroups()

      setEmptyIcons()
    }

    // ---------------------------------------------------------------------------------------------------
    // need to add a fake (empty) g for empty groups, in order to make sure the
    // highlight function works ok, and to prevent change od size of group on 1->0 elements
    // ---------------------------------------------------------------------------------------------------
    function setEmptyIcons () {
      $.each(grpD.data.children, function (nChild0, childNow0) {
        $.each(childNow0.children, function (nChild1, childNow1) {
          if (childNow1.children.length === 0) {
            childNow1.children.push({
              id: 'icnEmpty' + unique(),
              trgWidgId: '',
              ttl: '',
              nIcon: nEmptyIcon
            })
          }
        })
      })

      let rmInd = 1
      while (hasVar(rmInd)) {
        rmInd = null
        $.each(grpD.data.children, function (nChild0, childNow0) {
          $.each(childNow0.children, function (nChild1, childNow1) {
            $.each(childNow1.children, function (nChild2, childNow2) {
              if (
                childNow2.nIcon === nEmptyIcon &&
                childNow1.children.length > 1
              ) {
                rmInd = [nChild0, nChild1, nChild2]
              }
            })
          })
        })

        if (hasVar(rmInd)) {
          grpD.data.children[rmInd[0]].children[rmInd[1]].children.splice(
            rmInd[2],
            1
          )
        }
      }
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function setAll () {
      locker.add({ id: tagMain + 'setAll' })

      setHirch()
      setIcons()
      setTtl()
      setVor()

      locker.remove({ id: tagMain + 'setAll', delay: timeD.animArc * 2 })
    }

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    function highlight (optIn) {
      if (locker.isFree(tagMain + 'inDrag')) return

      let id = optIn.id
      let data = optIn.data
      let duration = optIn.type.duration //* ((data.length > 0)?1:0);
      let col = optIn.type.col

      let rRange = [1, 1]
      let opac = [0, 0.2]
      let strkW = [0, 0.175]

      // let circ = com.icons.g.selectAll("circle."+tagCirc).filter(function(d) { return (d.data.id == id); });
      //   //.data(com.hirchDesc, function(d) { return d.data.id; }) //console.log('xxx',d.data.id);
      // circ
      //   .transition("inOut").duration(duration/4)
      //   // .style("opacity",        opac[1])
      //   .attr("r",             function(d,i){ return d.r * rRange[1]; })
      //   .attr("stroke-width",  function(d,i){ return d.data.strkW * 8; })
      //   .style("stroke-opacity", function(d) { return hirchOpacStrk(d) / 3; } )
      //   .transition("inOut").duration(duration*3/4)
      //   // // .style("opacity",        opac[0])
      //   .attr("r",             function(d,i){ return d.r * rRange[0]; })
      //   .attr("stroke-width",  function(d,i){ return d.data.strkW; })
      //   .style("stroke-opacity", function(d) { return hirchOpacStrk(d); } )
      // return

      let circ = com.highlight.g
        .selectAll('circle.' + id)
        .data(data, function (d, i) {
          return hasVar(d.id) ? d.id : i
        })

      circ
        .enter()
        .append('circle')
        .attr('class', id + ' ' + 'all')
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .attr('r', function (d, i) {
          return d.r
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', col)
        .style('fill', 'transparent')
        .style('opacity', opac[0])
        .attr('stroke-width', function (d, i) {
          return d.r * strkW[0]
        })
        .merge(circ)
        .transition('inOut')
        .duration(duration / 4)
        .style('opacity', opac[1])
        .attr('r', function (d, i) {
          return d.r * rRange[1]
        })
        .attr('stroke-width', function (d, i) {
          return d.r * strkW[1]
        })
        .transition('inOut')
        .duration(duration * 3 / 4)
        .style('opacity', opac[0])
        .attr('r', function (d, i) {
          return d.r * rRange[0]
        })
        .attr('stroke-width', function (d, i) {
          return d.r * strkW[0]
        })
        .transition('inOut')
        .duration(1)
        .remove()

      circ
        .exit()
        .transition('inOut')
        .duration(duration / 2)
        .style('opacity', 0)
        .remove()
    }

    function hirchStyleStroke (d) {
      if (d.depth === 2) {
        let index = getIndexInParent(d)
        // if(index == 0) return d3.rgb(colsBlues[3]).darker(0.5);
        // if(index == 1) return d3.rgb(colsYellows[6]).brighter(0.1);
        // if(index == 2) return d3.rgb(colsReds[4]).brighter(0.95);

        // if(index == 0) return d3.rgb('#01579B').brighter(0.0005);
        // if(index == 1) return d3.rgb('#00B0FF').brighter(0.0005);
        // if(index == 2) return d3.rgb('#536DFE').brighter(0.0005);

        if (index === 0) return d3.rgb('#00B0FF').darker(0.5)
        if (index === 1) return d3.rgb('#8BC34A').darker(0.5)
        if (index === 2) return d3.rgb('#CD96CD').brighter(0.0095)

        // if(index == 0) return d3.rgb('#009688').brighter(0.5);
        // if(index == 1) return d3.rgb('#FF9800').brighter(0.5);
        // if(index == 2) return d3.rgb('#F06292').brighter(0.0095);
      }
      return '#383b42'
      // return d3.rgb(hirchStyleFill(d)).darker(1);
    }
    function hirchStyleFill (d) {
      // if(d.depth == 2) {
      //   let index = getIndexInParent(d);
      //   if(index == 0) return colsGreens[0];
      //   if(index == 1) return colsYellows[0];
      //   if(index == 2) return colsReds[0];
      // }
      return '#383b42'
      // return d.children ? "#383b42" : telData.idToCol[d.data.id];
    }
    function hirchOpacFill (d, scale) {
      if (d.depth === 0) return 0
      else if (d.depth === 1) return 0.015
      else if (d.depth === 2) return 0.02
      else if (d.depth === 3) return 0
      // console.log(d)
      // if     (!d.parent)  return 0.02;
      // else if(d.children) return 0.03;
      // else                return 0;
    }
    function hirchOpacStrk (d, scale) {
      if (d.depth === 0) return 0
      else if (d.depth === 1) return 0.5
      else if (d.depth === 2) return 0.9
      else if (d.depth === 3) return 0
      // if     (!d.parent)  return 1;
      // else if(d.children) return 0.5;
      // else                return 0;
    }
    function getIndexInParent (d) {
      let index = -1
      $.each(d.parent.children, function (nChild, childNow) {
        if (childNow.data.id === d.data.id) index = nChild
      })
      return index
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function syncStateGet (dataIn) {
    // console.log(' - mainPanelSync - syncStateGet ',dataIn);
  }
  this.syncStateGet = syncStateGet

  let svgMain = new SvgMain()
}
