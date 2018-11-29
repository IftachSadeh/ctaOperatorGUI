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
    if (com.debug) console.log('createDefault')
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
    defaultPanel.set({tag: 'opt', def: {
      focusable: true,
      focusOnCreation: true,
      insert: 'after'
    }})
    defaultPanel.setRepaintPanel(paintContent)
    defaultPanel.setRepaintTab(paintTab)
    addNewPanel(defaultPanel)
  }
  function init (optIn) {
    com = optIn
    if (com.debug) console.log('init')

    com.tab.box.x = com.box.w * com.tab.box.x
    com.tab.box.y = com.box.h * com.tab.box.y
    com.tab.box.w = 70
    com.tab.box.h = 15

    com.content.box.x = com.box.w * com.content.box.x
    com.content.box.y = com.tab.box.h
    com.content.box.w = com.box.w * com.content.box.w
    com.content.box.h = com.box.h - com.content.box.y
    // com.tab.box.x = com.box.w * com.tab.box.x
    // com.tab.box.y = com.box.h * com.tab.box.y
    // com.tab.box.w = com.box.w * com.tab.box.w
    // com.tab.box.h = com.box.h * com.tab.box.h
    //
    // com.content.box.x = com.box.w * com.content.box.x
    // com.content.box.y = com.box.h * com.content.box.y
    // com.content.box.w = com.box.w * com.content.box.w
    // com.content.box.h = com.box.h * com.content.box.h

    com.tab.g.attr('transform', 'translate(' + com.tab.box.x + ',' + com.tab.box.y + ')')
    com.content.g.attr('transform', 'translate(' + com.content.box.x + ',' + com.content.box.y + ')')

    if (com.tab.enabled) createDefault()
  }
  this.init = init

  function removePanel (panel) {
    if (com.debug) console.log('removePanel', panel)
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
    if (com.debug) console.log('resizeTab')
    let w = com.tab.box.w
    let h = com.tab.box.h
    com.tab.dimension = {w: w, h: h} // ((com.width - (com.margin * 1)) - ((com.panels.length - 1) * com.spaceBetweenLabel)) / com.panels.length
  }
  function updateTab (data) {
    if (com.debug) console.log('updateTab', data)

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
    mergedLabels.on('click', function (d) {
      console.log('clickGroupofTab');
      // mergedLabels.each(function (d1, i) { d1.unselectTab() })
      d.selectTab()
      setFocusOnPanel(d)
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
    if (com.debug) console.log('setFocusOnPanel', panel)

    let opt = panel.getOptions()
    if (!opt.focusable) {
      if (com.panels.current) {
        com.panels.current.selectTab()
      }
    } else {
      if (com.panels.current) {
        if (com.panels.current === panel) return
        com.panels.current.unselectTab()
      }
    }
    com.panels.current = panel
    panel.selectTab()
    updateInformation()
  }

  function updateInformation () {
    if (com.debug) console.log('updateInfo')

    com.content.g.selectAll().remove()
    com.content.g
      .attr('width', com.content.box.w)
      .attr('height', com.content.box.h)
    com.panels.current.setPanelProperties('g', com.content.g)
    com.panels.current.repaintPanel()
  }
  this.updateInformation = updateInformation

  function addNewPanel (newPanel) {
    if (com.debug) console.log('addNewPanel', newPanel)

    let insertPanel = function (newPanel) {
      let opt = newPanel.getOptions()
      if (opt.insert === 'first') {
        com.panels.all.splice(0, 0, newPanel)
      } else if (opt.insert === 'after') {
        for (let i = 0; i < com.panels.all.length; i++) {
          if (com.panels.all[i].get('id') === com.panels.current.get('id')) {
            com.panels.all.splice(i + 1, 0, newPanel)
            return
          }
        }
        com.panels.all.push(newPanel)
      } else if (opt.insert === 'last') {
        com.panels.all.push(newPanel)
      }
    }
    if (com.panels.current && com.panels.current.get('id') === 'default') {
      com.panels.current = undefined
      com.panels.all = []
      com.tab.g.selectAll('*').remove()
      com.content.g.selectAll('*').remove()
    }
    let opt = newPanel.getOptions()
    insertPanel(newPanel)
    resizeTab()
    updateTab()
    if (!opt.focusOnCreation) com.panels.current.selectTab()
    else setFocusOnPanel(newPanel)
    if (com.debug) console.log('End addNewPanel')
  }
  this.addNewPanel = addNewPanel
}

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
    },
    data: {}
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
  function getOptions () {
    return com['opt']
  }
  this.getOptions = getOptions

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
    if (com.tab.repaint) com.tab.repaint(com.tab.g, com.data)
  }
  this.repaintTab = repaintTab
  // function drawTab (optIn) {
  //
  // }
  // this.drawTab = drawTab
  function selectTab (optIn) {
    com.tab.select(com.tab.g, com.data)
  }
  this.selectTab = selectTab
  function unselectTab (optIn) {
    com.tab.unselect(com.tab.g, com.data)
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
    if (com.content.repaint) com.content.repaint(com.content.g, com.data)
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
