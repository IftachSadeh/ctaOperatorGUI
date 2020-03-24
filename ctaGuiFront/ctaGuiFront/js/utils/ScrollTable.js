/* global $ */
/* global times */
/* global is_def */
/* global deep_copy */
/* global ScrollBox */
/* global cols_blues */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.load_script({
  source: 'utils_scrollTable',
  script: '/js/utils/ScrollBox.js'
})

window.ScrollTable = function () {
  let com = {}

  this.set = function (opt_in) {
    if (is_def(opt_in.data)) com[opt_in.tag] = opt_in.data
    else if (is_def(opt_in.def)) com[opt_in.tag] = opt_in.def
    else com[opt_in.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function init (opt_in) {
    if (is_def(com.mainTag)) {
      console.error('trying to init more than once ...', opt_in)
      return
    }

    com.mainTag = opt_in.tag
    com.tagScrollBox = com.mainTag + 'scrollBox'

    com.tagClipPath = opt_in.tagClipPath
    if (!is_def(com.tagClipPath)) {
      com.tagClipPath = {
        inner: com.mainTag + 'clipPathInner',
        outer: com.mainTag + 'clipPathOuter'
      }
    }

    // ------------------------------------------------------------------
    // box definition
    // ------------------------------------------------------------------
    let g_box = opt_in.g_box
    com.outerBox = deep_copy(opt_in.boxData)

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    com.outerG = g_box.append('g')
    com.scrollBoxG = com.outerG.append('g')

    com.scrollBox = new ScrollBox()
    com.scrollBox.init({
      tag: com.tagScrollBox,
      g_box: com.scrollBoxG,
      boxData: com.outerBox,
      useRelativeCoords: opt_in.useRelativeCoords,
      title: opt_in.title,
      locker: opt_in.locker,
      lockerV: opt_in.lockerV,
      lockerZoom: opt_in.lockerZoom,
      run_loop: opt_in.run_loop,
      sameInnerBoxMarg: false,
      background: opt_in.background
      // canScroll: opt_in.canScroll,
      // scrollHeight: com.outerBox.h*2,
      // scrollHeight: opt_in.scrollHeight,
      // scrollRec: {w:200},
    })

    com.innerG = com.scrollBox.get('innerG')
    com.innerBox = com.scrollBox.get('innerBox')

    com.tagClipPath = com.scrollBox.get('tagClipPath').outer

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    setStyle(opt_in.style)
  }
  this.init = init

  // ------------------------------------------------------------------
  // styling
  // ------------------------------------------------------------------
  function setStyle (opt_in) {
    if (!is_def(opt_in)) opt_in = {}

    com.style = {}
  }
  this.setStyle = setStyle

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function updateTable (opt_in) {
    if (is_def(opt_in.table)) com.table = opt_in.table

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
        .transition('in_out')
        .duration(times.anim_arc)
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
        .attr('fill', cols_blues[0])
        .attr('fill-opacity', 0)
        .style('pointer-events', 'none')

      rect
        .exit()
        .transition('in_out')
        .duration(times.anim_txt)
        .style('opacity', 0)
        .remove()
    }
  }
  this.updateTable = updateTable
}
