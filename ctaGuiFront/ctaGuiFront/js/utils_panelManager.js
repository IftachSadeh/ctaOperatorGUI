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
    com.dragable = optIn.dragable
    com.closable = optIn.closable
  }
  this.init = init

  function createNewPanelGroup (optIn) {
    if (optIn.transX) {
      com.prevX = 0
    } else {
      com.prevX += 6
    }
    if (optIn.transY) {
      com.prevY = 0
    } else {
      com.prevY += 6
    }
    let newOptIn = {
      manager: com.manager,
      panels: [],
      optIn: optIn,
      g: com.mainG,
      index: com.panelsGroup.length,
      transX: (optIn.transX ? optIn.transX : com.prevX),
      transY: (optIn.transY ? optIn.transY : com.prevY),
      width: (optIn.width) ? optIn.width : 300,
      height: (optIn.height) ? optIn.height : 200,
      dragable: optIn.dragable,
      closable: optIn.closable
    }
    let newGroup = new PanelGroup()
    newGroup.createGroup(newOptIn)
    com.panelsGroup.push(newGroup)
    com.panelsGroupOnFocus = newGroup
  }
  this.createNewPanelGroup = createNewPanelGroup
  function removePanelGroup (id) {
    let index = -1
    for (var i = 0; i < com.panelsGroup.length; i++) {
      if (com.panelsGroup[i].get('idGroup') === id) index = i
    }
    com.panelsGroup.splice(index, 1)
    if (com.panelsGroupOnFocus.get('idGroup') === id) com.panelsGroupOnFocus = null
  }
  this.removePanelGroup = removePanelGroup
  function removePanel (panel) {
    panel.get('panelGroup').removePanel(panel, -1)
  }
  this.removePanel = removePanel
  function setFocusOnGroup (group) {
    com.panelsGroupOnFocus = group
  }
  this.setFocusOnGroup = setFocusOnGroup
  function setFocusOnGroupByID (id) {
    for (var i = 0; i < com.panelsGroup.length; i++) {
      if (com.panelsGroup[i].get('idGroup') === id) com.panelsGroupOnFocus = com.panelsGroup[i]
    }
  }
  this.setFocusOnGroupByID = setFocusOnGroupByID
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
  com.idGroup = Math.floor(Math.random() * Math.floor(100000))

  com.width = 600
  com.height = 400
  com.panels = []
  com.panelOnFocus = null
  com.optIn = null

  com.g = null
  com.gLabel = null
  com.gPanel = null
  com.gTemplate = null
  com.drag = {transX: 0, transY: 0, startDragX: null, startDragY: null}

  com.index = null

  com.spaceBetweenLabel = 4
  com.labelSize = com.width
  com.tabHeight = 26
  com.margin = 20

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function createTemplate () {
    com.gTemplate.append('rect')
      .attr('x', 0)
      .attr('y', 0 - 2)
      .attr('rx', 1)
      .attr('ry', 1)
      .attr('width', com.width + 4)
      .attr('height', com.height + 6)
      .attr('fill', 'none')
      .attr('stroke', 'none')
      .attr('stroke-width', 0.5)
    if (com.dragable.general) {
      com.g.call(dragGroup)
      com.gPanel.call(d3.drag()
        .on('start', function () {})
        .on('drag', function () {})
        .on('end', function () {}))
    }
  }
  let dragGroup = d3.drag()
    .on('start', function () {
      d3.event.sourceEvent.stopPropagation()
      com.manager.setFocusOnGroupByID(com.idGroup)
      com.drag.startDragX = d3.event.x
      com.drag.startDragY = d3.event.y
    })
    .on('drag', function () {
      let offsetX = com.drag.transX + (d3.event.x - com.drag.startDragX)
      let offsetY = com.drag.transY + (d3.event.y - com.drag.startDragY)
      com.g.attr('transform', 'translate(' + offsetX + ',' + offsetY + ')')
    })
    .on('end', function () {
      com.drag.transX = com.drag.transX + (d3.event.x - com.drag.startDragX)
      com.drag.transY = com.drag.transY + (d3.event.y - com.drag.startDragY)
    })

  function createGroup (optIn) {
    com.manager = optIn.manager

    com.drag.transX = optIn.transX
    com.drag.transY = optIn.transY
    com.g = optIn.g.append('g')
      .attr('transform', 'translate(' + com.drag.transX + ',' + com.drag.transY + ')')
    com.gTemplate = com.g.append('g')
    com.gLabel = com.g.append('g')
      .attr('transform', 'translate(' + com.margin + ',' + 0 + ')')
    com.gPanel = com.g.append('g')
      .attr('transform', 'translate(' + com.margin + ',' + (com.tabHeight + 2) + ')')

    com.dragable = optIn.dragable
    com.closable = optIn.closable

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
    // ((com.width - (com.margin * 2)) - ((com.panels.length - 1) * com.spaceBetweenLabel)) / com.panels.length
    com.labelSize = ((com.width - (com.margin * 1)) - ((com.panels.length - 1) * com.spaceBetweenLabel)) / com.panels.length
  }
  this.resizeTab = resizeTab
  function addPanel (newPanel) {
    com.panels.push(newPanel)
    resizeTab()
    updateTab()
    setFocusOnPanel(newPanel)
  }
  this.addPanel = addPanel
  function removePanel (panel, i) {
    if (i === -1) {
      for (i = 0; i < com.panels.length; i++) {
        if (com.panels[i].get('id') === panel.get('id')) break
      }
    }

    com.panels.splice(i, 1)
    if (com.panels.length === 0) {
      com.g.selectAll('*').remove()
      com.manager.removePanelGroup(com.idGroup)
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
      d3.select(this).attr('width', com.labelSize).attr('height', com.tabHeight)
      com.panels[i].setTabProperties('dimension', {width: com.labelSize, height: com.tabHeight})
      com.panels[i].repaintTab()
      com.panels[i].translateTabTo((com.labelSize * i + (com.spaceBetweenLabel * i)), 0)
    })

    mergedLabels.each(function (d, i) {
      com.panels[i].setTabEvent('click', function () {
        setFocusOnPanel(d)
      })
      if (com.dragable.tab) com.panels[i].setTabEvent('drag', drag)
      if (com.closable) com.panels[i].setTabEvent('close', function () { removePanel(d, i) })
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
    com.gPanel.attr('width', com.width - com.margin)
      .attr('height', com.height - com.tabHeight)
    com.panelOnFocus.repaintPanel(com.gPanel)
  }
  this.updateInformation = updateInformation
}
var PanelGroup = window.PanelGroup

window.CustomPanel = function () {
  let com = {}
  com.id = Math.random() * 10000000
  com.tab = {}
  com.panel = {}
  com.tab.events = {}

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
  function getTabProperties (prop) {
    return com['tab'][prop]
  }
  this.getTabProperties = getTabProperties
  // function setStyle (style, transition = {duration: 0, delay: 0, ease: d3.easeLinear}) {
  //   if (style.tab.back) {
  //     for (let key in style.tab.back) {
  //       console.log(key, style.tab.back[key]);
  //       com.tab.g.select('rect.back')
  //         // .transition()
  //         // .duration(transition.duration)
  //         // .delay(transition.delay)
  //         // .ease(transition.ease)
  //         .style(key, '#000000')
  //       com.tab.g.select('rect.back')
  //         .transition()
  //         .duration(transition.duration)
  //         .delay(transition.delay)
  //         .ease(transition.ease)
  //         .style(key, '#37474F')
  //     }
  //   }
  //   if (style.tab.close) {
  //     com.tab.g.select('rect.close')
  //       .transition()
  //       .duration(transition.duration)
  //       .delay(transition.delay)
  //       .ease(transition.ease)
  //       .attr('fill', style.tab.close)
  //   }
  //   if (style.tab.tabName) {
  //     com.tab.g.select('text.tabName')
  //       .transition()
  //       .duration(transition.duration)
  //       .delay(transition.delay)
  //       .ease(transition.ease)
  //       .attr('stroke', 'none')
  //       .attr('fill', style.tab.tabName)
  //   }
  // }
  // this.setStyle = setStyle
  function setRepaintTab (fun) {
    com.tab.repaint = fun
  }
  this.setRepaintTab = setRepaintTab
  function repaintTab () {
    if (com.tab.repaint) com.tab.repaint(com.tab.g)
  }
  this.repaintTab = repaintTab
  // function drawTab (optIn) {
  //
  // }
  // this.drawTab = drawTab
  function selectTab (optIn) {
    com.tab.g.select('rect.back').attr('height', 35)
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
    com.tab.events[type] = fun
    // if (type === 'close') {
    //   com.tab.g.select('rect.close').on('click', function () {
    //     fun()
    //   })
    // } else if (type === 'click') {
    //   com.tab.g.select('rect.back').on('click', function (d) {
    //     fun()
    //   })
    // } else if (type === 'drag') {
    //   com.tab.g.call(fun)
    // }
  }
  this.setTabEvent = setTabEvent
  function getTabEvent (type) {
    return com.tab.events[type]
  }
  this.getTabEvent = getTabEvent

  /* ********************* MiDDLE INFO ************************** */

  function setPanelProperties (prop, value) {
    com['panel'][prop] = value
  }
  this.setPanelProperties = setPanelProperties
  function getPanelGroup () {
    return com.panel.g
  }
  this.getPanelGroup = getPanelGroup
  function setRepaintPanel (fun) {
    com.panel.repaint = fun
  }
  this.setRepaintPanel = setRepaintPanel
  function repaintPanel (g) {
    com.panel.g = g
    if (com.panel.repaint) com.panel.repaint(com.panel.g)
  }
  this.repaintPanel = repaintPanel

  // function setDrawInfo (fun) {
  //   com.drawInfo = fun
  // }
  // this.setDrawInfo = setDrawInfo
  // function drawInfo (g) {
  //   com.panel.g = g
  //   if (com.drawInfo) com.drawInfo(g)
  // }
  // this.drawInfo = drawInfo
  // function callFun (fun) {
  //   fun(com.panel.g)
  // }
  // this.callFun = callFun
}
var CustomPanel = window.CustomPanel

/* function bindData (dataIn) { */
/* function setTabProperties (prop, value) { */
/* function drawTab (optIn) { */
/* function selectTab (optIn) { */
/* function unselectTab (optIn) { */
/* function translateTabTo (x, y) { */
/* function setTabEvent (type, fun) { */
