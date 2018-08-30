// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
// window.loadScript({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global deepCopy */

window.PanelManager = function () {
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
    com.panelsGroup = []
    com.panelsGroupOnFocus = null

    let g = optIn.g.append('g')
      .attr('transform', 'translate(' + optIn.x + ',' + optIn.y + ')')
    let gLabel = g.append('g')
    let gPanel = g.append('g')
      .attr('transform', 'translate(0,' + optIn.height * 0.1 + ')')

    let newPanelGroup = {
      panels: [],
      optIn: optIn,
      g: g,
      gLabel: gLabel,
      gPanel: gPanel
    }

    com.panelsGroup.push(newPanelGroup)
    com.panelsGroupOnFocus = newPanelGroup
  }
  this.init = init

  function addLabel (data) {
    let labels = com.panelsGroupOnFocus.gLabel.selectAll('g.label')
      .data(com.panelsGroupOnFocus.panels)

    let enterLabels = labels
      .enter()
      .append('g')
      .attr('class', 'label')

    enterLabels.append('rect')
      .attr('x', function (d, i) {
        return 0
      })
      .attr('y', 0)
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('width', 120)
      .attr('height', function (d) {
        return d === data ? 45 : 30
      })
      .attr('fill', '#efefef')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0)
      .attr('stroke', 'black')
    enterLabels.append('circle')
      .attr('cx', function (d, i) {
        return 110
      })
      .attr('cy', 12)
      .attr('r', 8)
      .attr('fill', '#cccccc')
      .on('click', function (d, i) {
        removePanel(d, i)
      })
    enterLabels.append('text')
      .text(function (d) {
        return (d.name ? d.name : 'Blocks')
      })
      .attr('x', function (d, i) {
        return 30
      })
      .attr('y', 15)
      .style('font-weight', 'normal')
      .attr('text-anchor', 'start')
      .style('font-size', 16)
      .attr('dy', function (d) {
        return 4
      })
      .style('pointer-events', 'none')

    let mergeLabel = labels.merge(enterLabels)
      .attr('transform', function (d, i) {
        d.transX = (120 * i + (5 * i))
        d.transY = 0
        return 'translate(' + (120 * i + (5 * i)) + ',0)'
      })
      .on('click', function (d) {
        changeLabel(d)
        showPanel()
      })
      .call(drag)

    labels.exit().remove()
  }

  function changeLabel (data) {
    com.panelsGroupOnFocus.gLabel.selectAll('g.label').select('rect')
      .attr('height', function (d) {
        return d === data ? 45 : 25
      })
  }

  function addPanel (data) {
    com.panelsGroupOnFocus.panels.push(data)
    addLabel()
    changeLabel(data)
    showPanel()
  }
  this.addPanel = addPanel

  function createNewPanelGroup () {

  }

  function showPanel () {
    com.panelsGroupOnFocus.gPanel.selectAll().remove()
    com.panelsGroupOnFocus.gPanel.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('width', com.panelsGroupOnFocus.optIn.width)
      .attr('height', com.panelsGroupOnFocus.optIn.height)
      .attr('fill', '#efefef')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0)
      .attr('stroke', 'black')
    com.panelsGroupOnFocus.gPanel.append('text')
      .text(function () {
        return 'Comments:'
      })
      .attr('x', 60)
      .attr('y', 40)
      .style('font-weight', 'normal')
      .attr('text-anchor', 'middle')
      .style('font-size', 16)
      .attr('dy', function (d) {
        return 4
      })
      .style('pointer-events', 'none')

    let fo = com.panelsGroupOnFocus.gPanel.append('foreignObject')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', com.panelsGroupOnFocus.optIn.width)
      .attr('height', com.panelsGroupOnFocus.optIn.height)
    let div = fo.append('xhtml:div')
    div.append('textarea')
      .text('This is a test comment')
      .attr('rows', 14)
      .attr('cols', 73)
      .style('border', 'none')
      .style('margin-top', '55px')
      .style('margin-left', '20px')
  }
  this.showPanel = showPanel

  function removePanel (data, i) {
    com.panelsGroupOnFocus.panels.splice(i, 1)
    addLabel()
  }
  this.removePanel = removePanel

  let drag = d3.drag()
    .on('start', function (d, i) {
      d3.event.sourceEvent.stopPropagation()
      d.startDragX = d3.event.x
      d.startDragY = d3.event.y
    })
    .on('drag', function (d, i) {
      let offsetX = d.transX + (d3.event.x - d.startDragX)
      let offsetY = d.transY + (d3.event.y - d.startDragY)
      d3.select(this).attr('transform', 'translate(' + offsetX + ',' + offsetY + ')')
    })
    .on('end', function (d, i) {
      d.transX = d.transX + (d3.event.x - d.startDragX)
      d.transY = d.transY + (d3.event.y - d.startDragY)
      createNewPanelGroup(d)
    })

}
