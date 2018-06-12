/* global $ */
/* global timeD */
/* global hasVar */
/* global deepCopy */
/* global ScrollBox */
/* global colsBlues */

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.loadScript({
  source: 'utils_scrollTable',
  script: '/js/utils_scrollBox.js'
})

window.ScrollTable = function () {
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

    com.mainTag = optIn.tag
    com.tagScrollBox = com.mainTag + 'scrollBox'

    com.tagClipPath = optIn.tagClipPath
    if (!hasVar(com.tagClipPath)) {
      com.tagClipPath = {
        inner: com.mainTag + 'clipPathInner',
        outer: com.mainTag + 'clipPathOuter'
      }
    }

    // ---------------------------------------------------------------------------------------------------
    // box definition
    // ---------------------------------------------------------------------------------------------------
    let gBox = optIn.gBox
    com.outerBox = deepCopy(optIn.boxData)

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    com.outerG = gBox.append('g')
    com.scrollBoxG = com.outerG.append('g')

    com.scrollBox = new ScrollBox()
    com.scrollBox.init({
      tag: com.tagScrollBox,
      gBox: com.scrollBoxG,
      boxData: com.outerBox,
      useRelativeCoords: optIn.useRelativeCoords,
      title: optIn.title,
      locker: optIn.locker,
      lockerV: optIn.lockerV,
      lockerZoom: optIn.lockerZoom,
      runLoop: optIn.runLoop,
      sameInnerBoxMarg: false
      // canScroll: optIn.canScroll,
      // scrollHeight: com.outerBox.h*2,
      // scrollHeight: optIn.scrollHeight,
      // scrollRec: {w:200},
    })

    com.innerG = com.scrollBox.get('innerG')
    com.innerBox = com.scrollBox.get('innerBox')

    com.tagClipPath = com.scrollBox.get('tagClipPath').outer

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    setStyle(optIn.style)
  }
  this.init = init

  // ---------------------------------------------------------------------------------------------------
  // styling
  // ---------------------------------------------------------------------------------------------------
  function setStyle (optIn) {
    if (!hasVar(optIn)) optIn = {}

    com.style = {}
  }
  this.setStyle = setStyle

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function updateTable (optIn) {
    if (hasVar(optIn.table)) com.table = optIn.table

    let totTableH = com.table.rowsIn.map(x => x.h).reduce((a, b) => a + b)
    totTableH = totTableH * com.table.rowH // +com.table.y

    let hasScroll = totTableH > com.innerBox.h + 0.01

    com.scrollBox.resetScroller({
      canScroll: hasScroll,
      scrollHeight: totTableH
    })

    let totTableW = com.table.rowW
    if (hasScroll) totTableW -= com.scrollBox.get('scrollRec').w

    com.table.rowsOut = []
    $.each(com.table.rowsIn, function (nRowNow, rowNow) {
      // let rowId = com.table.id + nRowNow
      let rowH = rowNow.h * com.table.rowH

      let sumW = rowNow.colsIn.map(x => x.w).reduce((a, b) => a + b)
      $.each(rowNow.colsIn, function (i, d) {
        rowNow.colsIn[i].w /= sumW
      })

      let row = {
        nRow: nRowNow,
        cols: [],
        w: totTableW,
        h: rowH
      }

      $.each(rowNow.colsIn, function (nColNow, colNow) {
        row.cols.push({
          id: colNow.id,
          nCol: nColNow,
          w: row.w * colNow.w,
          h: rowH
        })
      })

      com.table.rowsOut.push(row)
    })

    let rowY = com.table.y
    com.table.recs = []
    com.table.recV = []
    $.each(com.table.rowsOut, function (nRowNow, rowNow) {
      let colX = com.table.x
      com.table.recs.push([])

      $.each(rowNow.cols, function (nColNow, colNow) {
        // console.log(com.table.rowsIn[nRowNow].colsIn[nColNow]);
        let recNow = {
          id: colNow.id,
          data: com.table.rowsIn[nRowNow].colsIn[nColNow],
          nRow: nRowNow,
          nCol: nColNow,
          y: rowY,
          x: colX,
          w: colNow.w,
          h: colNow.h,
          marg: com.table.marg
        }

        com.table.recs[nRowNow].push(recNow)
        com.table.recV.push(recNow)

        colX += colNow.w
      })
      rowY += rowNow.h
    })

    let debugRect = true
    if (debugRect) {
      let rect = com.innerG
        .selectAll('rect.' + 'tagScroller')
        .data(com.table.recV, function (d) {
          return d.id
        })

      rect
        .enter()
        .append('rect')
        .attr('class', 'tagScroller')
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
        .attr('opacity', 0)
        .merge(rect)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('opacity', 1)
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
        .attr('fill', colsBlues[0])
        .attr('fill-opacity', 0)
        .style('pointer-events', 'none')

      rect
        .exit()
        .transition('inOut')
        .duration(timeD.animTxt)
        .style('opacity', 0)
        .remove()
    }
  }
  this.updateTable = updateTable
}
