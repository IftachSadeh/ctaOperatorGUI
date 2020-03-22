// ------------------------------------------------------------------
//
// ------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global deep_copy */

window.GridBagLayout = function () {
  let com = {
    size: { r: 3, c: 2 },
    merge: [{ s: { r: 0, c: 0 }, e: { r: 1, c: 1 } }],
    // weight: [{c: {r: 2, c: 0}, x: 2}],
    grid: []
  }

  this.set = function (opt_in) {
    if (is_def(opt_in.data)) com[opt_in.tag] = opt_in.data
    else if (is_def(opt_in.def)) com[opt_in.tag] = opt_in.def
    else com[opt_in.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function init (opt_in) {
    com = opt_in
    createGrid()
    mergeCell()
    computeDimension()
    // computeWeight()
  }
  this.init = init

  function getCell (r, c) {
    return com.grid[r][c]
  }
  this.getCell = getCell

  function createGrid () {
    com.grid = []
    for (let i = 0; i < com.size.r; i++) {
      com.grid.push([])
      for (let j = 0; j < com.size.c; j++) {
        com.grid[i].push({ s: { r: i, c: j }, e: { r: i, c: j }, w: 1 })
      }
    }
  }
  function mergeCell () {
    for (let z = 0; z < com.merge.length; z++) {
      let mergeData = com.merge[z]
      for (let i = mergeData.s.r; i < mergeData.e.r + 1; i++) {
        for (let j = mergeData.s.c; j < mergeData.e.c + 1; j++) {
          com.grid[i][j].s = mergeData.s
          com.grid[i][j].e = mergeData.e
        }
      }
    }
  }

  function computeDimension () {
    for (let i = 0; i < com.size.r; i++) {
      for (let j = 0; j < com.size.c; j++) {
        let cell = com.grid[i][j]
        com.grid[i][j] = {
          y: cell.s.r / com.size.r,
          x: cell.s.c / com.size.c,
          h: (cell.e.r - cell.s.r + 1) / com.size.r,
          w: (cell.e.c - cell.s.c + 1) / com.size.c
        }
      }
    }
  }
  // function computeWeight () {
  //   for (var z = 0; z < com.weight.length; z++) {
  //     let weightData = com.weight[z]
  //     for (var i = mergeData.s.r; i < mergeData.e.r; i++) {
  //       for (var j = mergeData.s.c; j < mergeData.e.c; j++) {
  //         com.grid[i][j].s = mergeData.s
  //         com.grid[i][j].e = mergeData.e
  //       }
  //     }
  //   }
  //   console.log(com.grid)
  // }
}
