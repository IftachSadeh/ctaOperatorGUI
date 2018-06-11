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
var mainScriptTag = 'emptyExample'
// ---------------------------------------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global sock */
/* global CheckFree */
/* global RunLoop */
/* global appendToDom */
/* global runWhenReady */
/* global disableScrollSVG */
/* global bckPattern */
/* global colsMix */

// // load additional js files:
// window.loadScript({ source:mainScriptTag, script:"/js/utils_scrollGrid.js"});

// ---------------------------------------------------------------------------------------------------
sock.widgetTable[mainScriptTag] = function (optIn) {
  let x0 = 0
  let y0 = 0
  let h0 = 9
  let w0 = 12
  let divKey = 'main'

  optIn.widgetFunc = {
    SockFunc: sockEmptyExample,
    MainFunc: mainEmptyExample
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
let sockEmptyExample = function (optIn) {}

// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// here we go with the content of this particular widget
// ---------------------------------------------------------------------------------------------------
let mainEmptyExample = function (optIn) {
  // let _0_ = uniqId()
  // let widgetType = optIn.widgetType
  let tagArrZoomerPlotsSvg = optIn.baseName
  let widgetId = optIn.widgetId
  let widgetEle = optIn.widgetEle
  let iconDivV = optIn.iconDivV
  let sideId = optIn.sideId

  // let isSouth = window.__nsType__ === 'S'
  // let thisEmptyExample = this

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
    let svg = {}
    // let thisMain = this

    let lenD = {}
    lenD.w = {}
    lenD.h = {}
    lenD.w[0] = 1000
    lenD.h[0] = lenD.w[0] / sgvTag.main.whRatio

    let tagEmptyExample = 'emptyExample'

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
      _updateData(dataIn.data)

      runWhenReady({
        pass: function () {
          return checkFree.isFree(tagEmptyExample + 'updateData')
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
      if (!checkFree.isFreeV([tagEmptyExample + 'updateData'])) {
        // console.log('will delay updateData');
        setTimeout(function () {
          updateData(dataIn)
        }, 10)
        return
      }
      checkFree.add(tagEmptyExample + 'updateData')

      // ---------------------------------------------------------------------------------------------------
      // ---------------------------------------------------------------------------------------------------
      // do stuff on updates........
      // ---------------------------------------------------------------------------------------------------
      // let time = dataIn.time;
      // let tagPath1 = 'aaaa'
      // let upData = [ {id:0, x:100, y:111}, {id:1, x:210, y:115}, {id:2, x:120, y:111+(10* (+time%15))} ]
      // // console.log(JSON.stringify(upData),time%5);
      // let upData_ = []
      // if(time%2==0) {upData_.push(upData[0]); upData_.push(upData[1])}
      // else          {upData_.push(upData[1]); upData_.push(upData[0])}
      // upData_.push(upData[2])

      // let selection1 = svg.g.selectAll("circle."+tagPath1)
      //     .data(upData_, function(d) { return d.id; });

      // let selEnter = selection1
      //   .enter()
      //     .append("circle")
      //     .attr("class", function() { return tagPath1; })
      //     .attr("cx", function(d, i) { return  d.x; })
      //     .attr("cy", function(d, i) { return  d.y; })
      //     .attr("r", 5)
      //     .style("fill", "blue")
      //   .merge(selection1)
      //     .transition().duration(1500)
      //     .attr("cx", function(d, i) { return  d.x; })
      //     .attr("cy", function(d, i) { return  d.y; })
      //     .attr("r", 5)
      //     .style("fill", "red");

      // selection1.exit()
      //     .remove();

      let tagCirc = 'myCirc'
      let rnd = Math.max(0.1, Math.min(0.9, dataIn.rnd))
      let opac = Math.max(0.1, Math.min(0.9, Math.pow(1 - rnd, 2)))
      let time = dataIn.time

      let circ = svg.g
        .selectAll('circle.' + tagCirc)
        .data([{ id: 0, r: rnd }, { id: 1, r: Math.pow(1 - rnd, 2) }], function (
          d
        ) {
          return d.id
        })

      circ
        .enter()
        .append('circle')
        .attr('class', tagCirc)
        .style('stroke-opacity', 0.7)
        .attr('r', 0)
        .attr('fill', 'transparent')
        .attr('stroke', 'transparent')
        .attr('stroke-width', '3')
        .attr('cx', function (d) {
          return lenD.w[0] / 2
        })
        .attr('cy', function (d) {
          return lenD.h[0] / 2
        })
        .merge(circ)
        .transition('inOut')
        .duration(timeD.animArc)
        .style('fill-opacity', opac)
        .style('fill', function (d, i) {
          return i === 0 ? colsMix[time % colsMix.length] : 'transparent'
        })
        .style('stroke', function (d, i) {
          return i === 1 ? colsMix[time % colsMix.length] : 'transparent'
        })
        .attr('r', function (d) {
          return d.r * Math.min(lenD.w[0], lenD.h[0]) / 3
        })

      circ
        .exit()
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('r', function (d) {
          return 0
        })
        .style('opacity', 0)
        .remove()
      // ---------------------------------------------------------------------------------------------------
      // ---------------------------------------------------------------------------------------------------
      // ---------------------------------------------------------------------------------------------------

      checkFree.remove(tagEmptyExample + 'updateData')
    }
    this.updateData = updateData
  }

  let svgMain = new SvgMain()
}
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
