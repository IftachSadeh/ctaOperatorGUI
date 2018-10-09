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
  let template = {
    tag: 'tagDefaultPanelManager',
    g: undefined,
    box: {x: 1, y: 1, w: 1, h: 1},
    tab: {
      enabled: true,
      g: undefined,
      box: {x: 1, y: 1, w: 1, h: 1},
      dimension: {w: 0, h: 0},
      dragable: false,
      closable: false
    },
    content: {
      enabled: true,
      g: undefined,
      box: {x: 1, y: 1, w: 1, h: 1}
    },
    panels: {
      current: undefined,
      all: []
    },
    options: {
      dragable: false,
      closable: false
    }
  }
  let com = template

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

  function createDefault () {
    function paintTab (g) {
      g.append('rect')
        .attr('x', com.tab.box.x)
        .attr('y', com.tab.box.y)
        .attr('width', com.tab.box.w)
        .attr('height', com.tab.box.h)
        .attr('fill', '#607D8B')
        .attr('stroke', 'none')
    }
    function paintContent (g) {
      g.append('rect')
        .attr('x', com.content.box.x + 2)
        .attr('y', com.content.box.y)
        .attr('width', com.content.box.w - 4)
        .attr('height', com.content.box.h)
        .attr('fill', 'none')
        .attr('stroke', '#607D8B')
        .attr('stroke-width', 4)
    }

    let defaultPanel = new CustomPanel()
    defaultPanel.set({tag: 'id', def: 'default'})
    defaultPanel.setRepaintPanel(paintContent)
    defaultPanel.setRepaintTab(paintTab)
    addNewPanel(defaultPanel)
  }
  function init (optIn) {
    com = optIn
    com.tab.box.x = com.box.w * com.tab.box.x
    com.tab.box.y = com.box.h * com.tab.box.y
    com.tab.box.w = com.box.w * com.tab.box.w
    com.tab.box.h = com.box.h * com.tab.box.h

    com.content.box.x = com.box.w * com.content.box.x
    com.content.box.y = com.box.h * com.content.box.y
    com.content.box.w = com.box.w * com.content.box.w
    com.content.box.h = com.box.h * com.content.box.h

    com.tab.g.attr('transform', 'translate(' + com.tab.box.x + ',' + com.tab.box.y + ')')
    com.content.g.attr('transform', 'translate(' + com.content.box.x + ',' + com.content.box.y + ')')

    if (com.tab.enabled) createDefault()
  }
  this.init = init

  function removePanel (panel) {
    let i = -1
    for (i = 0; i < com.panels.length; i++) {
      if (com.panels.all[i] === panel) break
    }

    com.panels.splice(i, 1)
    if (com.panels.length === 0) {
      com.g.selectAll('*').remove()
    } else {
      resizeTab()
      updateTab()
      if (panel === com.panels.current) {
        com.panels.current = null
        setFocusOnPanel(com.panels[i % com.panels.length])
      }
      setFocusOnPanel(com.panels.current)
    }
  }
  this.removePanel = removePanel

  function resizeTab () {
    com.tab.dimension = {w: com.tab.box.w / com.panels.all.length, h: com.tab.box.h} // ((com.width - (com.margin * 1)) - ((com.panels.length - 1) * com.spaceBetweenLabel)) / com.panels.length
  }
  function updateTab (data) {
    let labels = com.tab.g.selectAll('g.label')
      .data(com.panels.all)
    let enterLabels = labels
      .enter()
      .append('g')
      .attr('class', 'label')
    let mergedLabels = labels.merge(enterLabels)
      .attr('transform', function (d, i) {
        return 'translate(' + (com.tab.dimension.w * i) + ',' + 0 + ')'
      })

    mergedLabels.each(function (d, i) {
      d.setTabProperties('g', d3.select(this))
      d3.select(this).attr('width', com.tab.dimension.w).attr('height', com.tab.dimension.h)
      d.setTabProperties('dimension', {width: com.tab.dimension.w, height: com.tab.dimension.h})
      d.repaintTab()
      // d.translateTabTo((com.tab.dimension.w * i), 0)

      // d.setTabEvent('click', function () {
      //   setFocusOnPanel(d)
      // })
      // if (com.tab.dragable) d.setTabEvent('drag', drag)
      // if (com.tab.closable) d.setTabEvent('close', function () { removePanel(d, i) })
    })

    labels.exit().remove()
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

  function setFocusOnPanel (panel) {
    if (com.panels.current) {
      if (com.panels.current === panel) return
      com.panels.current.unselectTab()
    }
    com.panels.current = panel
    panel.selectTab()
    updateInformation()
  }

  function updateInformation () {
    com.content.g.selectAll().remove()
    com.content.g
      .attr('width', com.content.box.w)
      .attr('height', com.content.box.h)
    com.panels.current.setPanelProperties('g', com.content.g)
    com.panels.current.repaintPanel()
  }
  this.updateInformation = updateInformation

  function addNewPanel (newPanel) {
    if (com.panels.current && com.panels.current.get('id') === 'default') {
      com.panels.current = undefined
      com.panels.all = []
      com.tab.g.selectAll('*').remove()
      com.content.g.selectAll('*').remove()
    }
    com.panels.all.push(newPanel)
    resizeTab()
    updateTab()
    setFocusOnPanel(newPanel)
  }
  this.addNewPanel = addNewPanel
}

// window.PanelGroup = function () {
//   let com = {}
//   com.manager = null
//   com.idGroup = Math.floor(Math.random() * Math.floor(100000))
//
//   com.width = 600
//   com.height = 400
//   com.panels = []
//   com.panels.current = null
//   com.optIn = null
//
//   com.g = null
//   com.gLabel = null
//   com.gPanel = null
//   com.gTemplate = null
//   com.drag = {transX: 0, transY: 0, startDragX: null, startDragY: null}
//
//   com.index = null
//
//   com.spaceBetweenLabel = 4
//   com.labelSize = com.width
//   com.tabHeight = 26
//   com.margin = 20
//
//   this.set = function (optIn) {
//     if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
//     else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
//     else com[optIn.tag] = null
//   }
//   this.get = function (type) {
//     return com[type]
//   }
//
//   function createTemplate () {
//     com.gTemplate.append('rect')
//       .attr('x', 0)
//       .attr('y', 0 - 2)
//       .attr('rx', 1)
//       .attr('ry', 1)
//       .attr('width', com.width + 4)
//       .attr('height', com.height + 6)
//       .attr('fill', 'none')
//       .attr('stroke', 'none')
//       .attr('stroke-width', 0.5)
//     if (com.dragable.general) {
//       com.g.call(dragGroup)
//       com.gPanel.call(d3.drag()
//         .on('start', function () {})
//         .on('drag', function () {})
//         .on('end', function () {}))
//     }
//   }
//   let dragGroup = d3.drag()
//     .on('start', function () {
//       d3.event.sourceEvent.stopPropagation()
//       com.manager.setFocusOnGroupByID(com.idGroup)
//       com.drag.startDragX = d3.event.x
//       com.drag.startDragY = d3.event.y
//     })
//     .on('drag', function () {
//       let offsetX = com.drag.transX + (d3.event.x - com.drag.startDragX)
//       let offsetY = com.drag.transY + (d3.event.y - com.drag.startDragY)
//       com.g.attr('transform', 'translate(' + offsetX + ',' + offsetY + ')')
//     })
//     .on('end', function () {
//       com.drag.transX = com.drag.transX + (d3.event.x - com.drag.startDragX)
//       com.drag.transY = com.drag.transY + (d3.event.y - com.drag.startDragY)
//     })
// }
// var PanelGroup = window.PanelGroup

window.CustomPanel = function () {
  let com = {
    tab: {
      g: undefined,
      repaint: () => {},
      select: () => {},
      unselect: () => {},
      close: () => {}
    },
    content: {
      g: undefined,
      repaint: () => {}
    }
  }
  // com.tab = {}
  // com.panel = {}
  // com.tab.events = {}
  //
  // com.transX = 0
  // com.transY = 0

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function init (dataIn) {
    com = dataIn
  }
  this.init = init
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
    com.tab.select(com.tab.g)
  }
  this.selectTab = selectTab
  function unselectTab (optIn) {
    com.tab.unselect(com.tab.g)
  }
  this.unselectTab = unselectTab
  // function translateTabTo (x, y) {
  //   if (x != null) com.transX = x
  //   if (y != null) com.transY = y
  //   com.tab.g.attr('transform', 'translate(' + com.transX + ',' + com.transY + ')')
  // }
  // this.translateTabTo = translateTabTo

  // function setTabEvent (type, fun) {
  //   com.tab.events[type] = fun
  //   // if (type === 'close') {78909C
  //   //   com.tab.g.select('rect.close').on('click', function () {
  //   //     fun()
  //   //   })
  //   // } else if (type === 'click') {
  //   //   com.tab.g.select('rect.back').on('click', function (d) {
  //   //     fun()
  //   //   })
  //   // } else if (type === 'drag') {
  //   //   com.tab.g.call(fun)
  //   // }
  // }
  // this.setTabEvent = setTabEvent
  // function getTabEvent (type) {
  //   return com.tab.events[type]
  // }
  // this.getTabEvent = getTabEvent

  /* ********************* MiDDLE INFO ************************** */
  //
  function setPanelProperties (prop, value) {
    com['content'][prop] = value
  }
  this.setPanelProperties = setPanelProperties
  function setRepaintPanel (fun) {
    com.content.repaint = fun
  }
  this.setRepaintPanel = setRepaintPanel
  function repaintPanel (g) {
    if (com.content.repaint) com.content.repaint(com.content.g)
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
