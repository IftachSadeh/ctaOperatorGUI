// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
// window.loadScript({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global deepCopy */

window.ButtonPanel = function () {
  let com = {}

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function init (optIn) {
    com.g = optIn.g
    com.box = optIn.box
    com.margin = optIn.margin
    com.rows = optIn.rows
    com.cols = optIn.cols

    com.g.attr('transform', 'translate(' + com.box.x + ',' + com.box.y + ')')
    com.g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('rx', 0)
      .attr('ry', 0)
      .attr('width', com.box.w)
      .attr('height', com.box.h)
      .attr('fill', optIn.background)
      .attr('stroke', optIn.stroke)
      .attr('stroke-width', 0.2)

    computeButtonsPositions()
  }
  this.init = init

  function computeButtonsPositions () {
    com.buttonPositions = []
    com.button = []
    for (var i = 0; i < com.rows; i++) {
      com.buttonPositions.push([])
      com.button.push([])
      for (var j = 0; j < com.cols; j++) {
        let x = (((com.box.w - (2 * com.margin.extern)) / com.cols) * j) + com.margin.inner + com.margin.extern
        let y = (((com.box.h - (2 * com.margin.extern)) / com.rows) * i) + com.margin.inner + com.margin.extern
        let width = ((com.box.w - (2 * com.margin.extern)) / com.cols) - (com.margin.inner * 2)
        let height = ((com.box.h - (2 * com.margin.extern)) / com.rows) - (com.margin.inner * 2)
        com.buttonPositions[i].push({x: x, y: y, width: width, height: height})
        com.button.push(null)
      }
    }
  }

  function addButton (optIn) {
    // if (com.button[optIn.row] && com.button[optIn.row][optIn.col]) removeButton(optIn)

    let gButton = com.g.append('g')
      .attr('transform', 'translate(' + com.buttonPositions[optIn.row][optIn.col].x + ',' + com.buttonPositions[optIn.row][optIn.col].y + ')')
      .attr('width', com.buttonPositions[optIn.row][optIn.col].width)
      .attr('height', com.buttonPositions[optIn.row][optIn.col].height)

    // com.button[optIn.row][optIn.col] = gButton
    return gButton
  }
  this.addButton = addButton

  function removeButton (optIn) {

  }
  this.removeButton = removeButton

  function checkButton () {

  }
  this.checkButton = checkButton
  function uncheckButton () {

  }
  this.uncheckButton = uncheckButton
}
