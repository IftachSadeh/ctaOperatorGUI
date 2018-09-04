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
    com.mainG = optIn.g
    com.defaultOptIn = optIn
    com.manager = optIn.manager
  }
  this.init = init

  function createNewPanelGroup (optIn) {
    let newOptIn = {
      manager: com.manager,
      panels: [],
      optIn: optIn,
      g: com.mainG,
      index: com.panelsGroup.length,
      transX: (optIn.transX ? optIn.transX : 0),
      transY: (optIn.transY ? optIn.transY : 0),
      width: (optIn.width) ? optIn.width : 300,
      height: (optIn.height) ? optIn.height : 200
    }
    let newGroup = new PanelGroup()
    newGroup.createGroup(newOptIn)
    com.panelsGroup.push(newGroup)
    com.panelsGroupOnFocus = newGroup
  }
  this.createNewPanelGroup = createNewPanelGroup

  function setFocusOnGroup (group) {
    console.log('setFocusonGroup', group);
    com.panelsGroupOnFocus = group
  }
  this.setFocusOnGroup = setFocusOnGroup
  function addNewPanel (panel) {
    if (!com.panelsGroupOnFocus) {
      createNewPanelGroup(com.defaultOptIn)
    }
    panel.set({tag: 'panelGroup', 'data': com.panelsGroupOnFocus})
    com.panelsGroupOnFocus.addPanel(panel)
  }
  this.addNewPanel = addNewPanel
}

window.PanelGroup = function () {
  let com = {}
  com.manager = null
  com.width = 600
  com.height = 400
  com.panels = []
  com.panelOnFocus = null
  com.optIn = null

  com.g = null
  com.gLabel = null
  com.gPanel = null
  com.gTemplate = null

  com.index = null

  com.spaceBetweenLabel = 4
  com.labelSize = com.width
  com.tabHeight = 18
  com.margin = 20

  function createTemplate () {
    com.gTemplate.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('width', com.width)
      .attr('height', com.tabHeight + 2)
      .attr('fill', '#888888')
  }
  function createGroup (optIn) {
    com.manager = optIn.manager

    com.g = optIn.g.append('g')
      .attr('transform', 'translate(' + optIn.transX + ',' + optIn.transY + ')')
    com.gTemplate = com.g.append('g')
    com.gLabel = com.g.append('g')
      .attr('transform', 'translate(' + com.margin + ',' + 0 + ')')
    com.gPanel = com.g.append('g')
      .attr('transform', 'translate(' + com.margin + ',' + (com.tabHeight + 2) + ')')

    com.optIn = optIn
    com.width = optIn.width
    com.labelSize = com.width
    com.height = optIn.height
    com.panels = optIn.panels
    com.index = optIn.index

    createTemplate()
  }
  this.createGroup = createGroup
  function resizeTab () {
    com.labelSize = ((com.width - (com.margin * 2)) - ((com.panels.length - 1) * com.spaceBetweenLabel)) / com.panels.length
  }
  this.resizeTab = resizeTab
  function addPanel (newPanel) {
    com.panels.push(newPanel)
    console.log(com.panels);
    resizeTab()
    updateTab()
    setFocusOnPanel(newPanel)
  }
  this.addPanel = addPanel
  function removePanel (panel, i) {
    console.log(com.panels);
    com.panels.splice(i, 1)
    if (com.panels.length === 0) {
      console.log('TODO')
      // com.panelsGroupOnFocus.g.selectAll('*').remove()
      // com.panelsGroup.splice(com.panelsGroupOnFocus.index, 1)
      // com.panelsGroupOnFocus = null
    } else {
      resizeTab()
      updateTab()
      if (panel === com.panelOnFocus) {
        com.panelOnFocus = null
        setFocusOnPanel(com.panels[i % com.panels.length])
      }
      setFocusOnPanel(com.panelOnFocus)
    }
    console.log(com.panels);
  }
  this.removePanel = removePanel
  function updateTab (data) {
    let labels = com.gLabel.selectAll('g.label')
      .data(com.panels)
    let enterLabels = labels
      .enter()
      .append('g')
      .attr('class', 'label')
    let mergedLabels = labels.merge(enterLabels)

    mergedLabels.each(function (d, i) {
      com.panels[i].setTabProperties('g', d3.select(this))
      com.panels[i].setTabProperties('dimension', {width: com.labelSize, height: com.tabHeight})
      com.panels[i].drawTab()
      com.panels[i].translateTabTo((com.labelSize * i + (com.spaceBetweenLabel * i)), 0)
    })

    mergedLabels.each(function (d, i) {
      com.panels[i].setTabEvent('click', function () {
        setFocusOnPanel(d)
      })
      com.panels[i].setTabEvent('drag', drag)
      com.panels[i].setTabEvent('close', function () {
        removePanel(d, i)
      })
    })

    labels.exit().remove()
  }
  function setFocusOnPanel (panel) {
    if (com.panelOnFocus) com.panelOnFocus.unselectTab()
    com.panelOnFocus = panel
    panel.selectTab()
    updateInformation()
  }

  let drag = d3.drag()
    .on('start', function (d, i) {
      d3.event.sourceEvent.stopPropagation()
      com.manager.setFocusOnGroup(d.get('panelGroup'))
      d.startDragX = d3.event.x
      d.startDragY = d3.event.y
    })
    .on('drag', function (d, i) {
      let offsetX = d.get('transX') + (d3.event.x - d.startDragX)
      let offsetY = d.get('transY') + (d3.event.y - d.startDragY)
      d3.select(this).attr('transform', 'translate(' + offsetX + ',' + offsetY + ')')
    })
    .on('end', function (d, i) {
      if (Math.sqrt(Math.pow((d3.event.x - d.startDragX), 2) + Math.pow((d3.event.y - d.startDragY), 2)) > 40) {
        removePanel(d, i)
        let optIn = {
          transX: d.transX + (d3.event.x - d.startDragX),
          transY: d.transY + (d3.event.y - d.startDragY),
          width: d.get('tab').width,
          height: com.height
        }
        com.manager.createNewPanelGroup(optIn)
        com.manager.addNewPanel(d)
      } else {
        d.translateTabTo()
      }
    })

  function updateInformation () {
    com.gPanel.selectAll().remove()
    com.gPanel.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('width', com.width - com.margin)
      .attr('height', com.height - com.tabHeight)
      .attr('fill', '#efefef')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0)
      .attr('stroke', 'black')
    com.gPanel.append('text')
      .text(function () {
        return 'Comments:'
      })
      .attr('x', 60 / 1.5)
      .attr('y', 40 / 2)
      .style('font-weight', 'normal')
      .attr('text-anchor', 'middle')
      .style('font-size', 16 / 1.5)
      .attr('dy', function (d) {
        return 4
      })
      .style('pointer-events', 'none')

    // let fo = com.gPanel.append('foreignObject')
    //   .attr('x', 0)
    //   .attr('y', 0)
    //   .attr('width', com.width)
    //   .attr('height', com.height)
    // let div = fo.append('xhtml:div')
    // div.append('textarea')
    //   .text('This is a test comment')
    //   .attr('rows', 14 / 2)
    //   .attr('cols', 73 / 2)
    //   .style('border', 'none')
    //   .style('margin-top', '27px')
    //   .style('margin-left', '10px')
  }
  this.updateInformation = updateInformation
}
var PanelGroup = window.PanelGroup

window.CustomPanel = function () {
  let com = {}
  com.tab = {}
  com.panel = {}

  com.transX = 0
  com.transY = 0

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function bindData (dataIn) {
    console.log('dataBind to panel')
    com.data = dataIn
  }
  this.bindData = bindData

  /* ********************* TAB ******************************** */

  function setTabProperties (prop, value) {
    com['tab'][prop] = value
  }
  this.setTabProperties = setTabProperties
  function drawTab (optIn) {
    com.tab.g.selectAll('*').remove()
    com.tab.g.append('rect')
      .attr('class', 'back')
      .attr('x', 0)
      .attr('y', 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', com.tab.dimension.width)
      .attr('height', com.tab.dimension.height)
      .attr('fill', '#cccccc')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0)
      .attr('stroke', 'black')
    com.tab.g.append('rect')
      .attr('class', 'close')
      .attr('x', com.tab.dimension.width - 16)
      .attr('y', (com.tab.dimension.height / 2) - 8)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', 13)
      .attr('height', 13)
      .attr('fill', '#aaaaaa')
    com.tab.g.append('text')
      .text(function (data) {
        return 'Name' + Math.random()
      })
      .attr('x', com.tab.dimension.width / 2)
      .attr('y', com.tab.dimension.height / 2)
      .style('font-weight', 'normal')
      .attr('text-anchor', 'middle')
      .style('font-size', 11)
      .attr('dy', 3)
      .style('pointer-events', 'none')
  }
  this.drawTab = drawTab
  function selectTab (optIn) {
    com.tab.g.select('rect.back').attr('height', 35).attr('fill', '#efefef')
  }
  this.selectTab = selectTab
  function unselectTab (optIn) {
    com.tab.g.select('rect.back').attr('height', com.tab.dimension.height).attr('fill', '#cccccc')
  }
  this.unselectTab = unselectTab
  function translateTabTo (x, y) {
    if (x != null) com.transX = x
    if (y != null) com.transY = y
    com.tab.g.attr('transform', 'translate(' + com.transX + ',' + com.transY + ')')
  }
  this.translateTabTo = translateTabTo
  function setTabEvent (type, fun) {
    if (type === 'close') {
      com.tab.g.select('rect.close').on('click', function () {
        fun()
      })
    } else if (type === 'click') {
      com.tab.g.select('rect.back').on('click', function (d) {
        fun()
      })
    } else if (type === 'drag') {
      com.tab.g.call(fun)
    }
  }
  this.setTabEvent = setTabEvent
  /* ********************* MiDDLE INFO ************************** */

  function setPanelProperties (prop, value) {
    com['panel'][prop] = value
  }
  this.setPanelProperties = setPanelProperties

  function drawInfo (d, i) {}
  this.drawInfo = drawInfo
}
var CustomPanel = window.CustomPanel

/* function bindData (dataIn) { */
/* function setTabProperties (prop, value) { */
/* function drawTab (optIn) { */
/* function selectTab (optIn) { */
/* function unselectTab (optIn) { */
/* function translateTabTo (x, y) { */
/* function setTabEvent (type, fun) { */
