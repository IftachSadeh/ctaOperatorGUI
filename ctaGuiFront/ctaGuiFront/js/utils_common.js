// ---------------------------------------------------------------------------------------------------
'use strict'
/* global $ */
/* global d3 */
/* global Event */
/* global jQuery */
/* global moment */
/* global Polymer */
/* global textures */
// ---------------------------------------------------------------------------------------------------
// common colors
// see: https://material.google.com/style/color.html#color-color-palette
// ---------------------------------------------------------------------------------------------------
window.colPrime = '2F3238'
window.colsReds = [
  '#E91E63',
  '#ff3333',
  '#F48FB1',
  '#C62828',
  '#AD1457',
  '#FF9E80',
  '#F44336',
  '#F8BBD0',
  '#F06292',
  '#C2185B'
]
var colsReds = window.colsReds

window.colsBlues = [
  '#2196F3',
  '#3949AB',
  '#00BCD4',
  '#90CAF9',
  '#607D8B',
  '#80DEEA'
]
var colsBlues = window.colsBlues

window.colsGreens = ['#8BC34A', '#00E676', '#33691E', '#C0CA33', '#009688']
var colsGreens = window.colsGreens

window.colsYellows = [
  '#FFD600',
  '#FF7043',
  '#A1887F',
  '#FFEB3B',
  '#FF9800',
  '#795548',
  '#FFC107'
]
var colsYellows = window.colsYellows

window.colsPurples = ['#AB47BC', '#9575CD', '#673AB7', '#7B1FA2', '#CD96CD']
var colsPurples = window.colsPurples

window.colsMix = [
  colsReds[0],
  colsBlues[0],
  colsGreens[0],
  colsYellows[0],
  colsPurples[0],
  colsReds[1],
  colsBlues[1],
  colsGreens[1],
  colsYellows[1],
  colsPurples[1],
  colsReds[2],
  colsBlues[2],
  colsGreens[2],
  colsYellows[2],
  colsPurples[2],
  colsReds[3],
  colsBlues[3],
  colsGreens[3],
  colsYellows[3],
  colsPurples[3],
  colsReds[4],
  colsBlues[4],
  colsGreens[4],
  colsYellows[4],
  colsPurples[4]
]
var colsMix = window.colsMix

window.colsBlk = [
  colsReds[0],
  colsBlues[0],
  colsGreens[2],
  colsPurples[0],
  colsBlues[4],
  colsYellows[2],
  colsGreens[4],
  colsReds[1],
  colsBlues[1],
  colsGreens[3],
  colsPurples[1],
  colsBlues[2],
  colsYellows[3]
]
window.colsPurplesBlues = [
  colsBlues[0],
  colsPurples[0],
  colsBlues[1],
  colsPurples[1],
  colsBlues[2],
  colsPurples[2],
  colsBlues[3],
  colsPurples[3],
  colsBlues[4],
  colsPurples[4]
]

window.colorTheme = {
  'dark-BlueGrey': {
    blocks: {
      run: {
        background: '#377eb8',
        stroke: '#000000',
        text: '#000000'
      },
      done: {
        background: '#4daf4a',
        stroke: '#000000',
        text: '#000000'
      },
      fail: {
        background: '#e41a1c',
        stroke: '#000000',
        text: '#000000'
      },
      wait: {
        background: '#e6e6e6',
        stroke: '#000000',
        text: '#000000'
      },
      cancelOp: {
        background: '#984ea3',
        stroke: '#000000',
        text: '#000000'
      },
      cancelSys: {
        background: '#e78ac3',
        stroke: '#000000',
        text: '#000000'
      },
      shutdown: {
        background: '#424242',
        stroke: '#000000',
        text: '#000000'
      }
    },
    darker: {
      background: '#37474F',
      stroke: '#263238',
      text: '#ECEFF1'
    },
    dark: {
      background: '#455A64',
      stroke: '#263238',
      text: '#ECEFF1'
    },
    medium: {
      background: '#546E7A',
      stroke: '#263238',
      text: '#ECEFF1'
    },
    bright: {
      background: '#607D8B',
      stroke: '#263238',
      text: '#ECEFF1'
    },
    brighter: {
      background: '#78909C',
      stroke: '#263238',
      text: '#000000'
    },
    warning: {
      background: '#FFEB3B',
      stroke: '#000000',
      text: '#000000'
    }
  },
  'dark-Grey': {
    blocks: {
      run: {
        background: '#377eb8',
        stroke: '#000000',
        text: '#000000'
      },
      done: {
        background: '#4daf4a',
        stroke: '#000000',
        text: '#000000'
      },
      fail: {
        background: '#e41a1c',
        stroke: '#000000',
        text: '#000000'
      },
      wait: {
        background: '#e6e6e6',
        stroke: '#000000',
        text: '#000000'
      },
      cancelOp: {
        background: '#984ea3',
        stroke: '#000000',
        text: '#000000'
      },
      cancelSys: {
        background: '#e78ac3',
        stroke: '#000000',
        text: '#000000'
      },
      shutdown: {
        background: '#424242',
        stroke: '#000000',
        text: '#000000'
      }
    },
    darker: {
      background: '#616161',
      stroke: '#263238',
      text: '#ffffff'
    },
    dark: {
      background: '#757575',
      stroke: '#263238',
      text: '#ffffff'
    },
    medium: {
      background: '#9E9E9E',
      stroke: '#263238',
      text: '#000000'
    },
    bright: {
      background: '#BDBDBD',
      stroke: '#263238',
      text: '#000000'
    },
    brighter: {
      background: '#E0E0E0',
      stroke: '#263238',
      text: '#000000'
    },
    warning: {
      background: '#FFEB3B',
      stroke: '#000000',
      text: '#000000'
    }
  },
  'bright-Grey': {
    blocks: {
      run: {
        background: '#4FC3F7',
        stroke: '#000000',
        text: '#000000'
      },
      done: {
        background: '#9CCC65',
        stroke: '#000000',
        text: '#000000'
      },
      fail: {
        background: '#EF5350',
        stroke: '#000000',
        text: '#000000'
      },
      wait: {
        background: '#DEDEDE',
        stroke: '#000000',
        text: '#000000'
      },
      cancelOp: {
        background: '#CE93D8',
        stroke: '#000000',
        text: '#000000'
      },
      warning: {
        background: '#FFE082',
        stroke: '#000000',
        text: '#000000'
      },
      critical: {
        background: '#FF9800',
        stroke: '#000000',
        text: '#000000'
      },
      cancelSys: {
        background: '#9575CD',
        stroke: '#000000',
        text: '#000000'
      },
      shutdown: {
        background: '#9E9E9E',
        stroke: '#000000',
        text: '#000000'
      }
    },
    darker: {
      background: '#BDBDBD',
      stroke: '#444444',
      text: '#444444'
    },
    dark: {
      background: '#E0E0E0',
      stroke: '#444444',
      text: '#444444'
    },
    medium: {
      background: '#EEEEEE',
      stroke: '#444444',
      text: '#444444'
    },
    bright: {
      background: '#F5F5F5',
      stroke: '#444444',
      text: '#444444'
    },
    brighter: {
      background: '#FAFAFA',
      stroke: '#444444',
      text: '#444444'
    },
    warning: {
      background: '#FFEB3B',
      stroke: '#444444',
      text: '#444444'
    }
  },
  'bright-BlueGrey': {
    blocks: {
      run: {
        background: '#4FC3F7',
        stroke: '#000000',
        text: '#000000'
      },
      done: {
        background: '#9CCC65',
        stroke: '#000000',
        text: '#000000'
      },
      fail: {
        background: '#EF5350',
        stroke: '#000000',
        text: '#000000'
      },
      wait: {
        background: '#EEEEEE',
        stroke: '#000000',
        text: '#000000'
      },
      cancelOp: {
        background: '#CE93D8',
        stroke: '#000000',
        text: '#000000'
      },
      warning: {
        background: '#FFB74D',
        stroke: '#000000',
        text: '#000000'
      },
      cancelSys: {
        background: '#9575CD',
        stroke: '#000000',
        text: '#000000'
      },
      shutdown: {
        background: '#9E9E9E',
        stroke: '#000000',
        text: '#000000'
      }
    },
    brighter: {
      background: '#ECEFF1',
      stroke: '#263238',
      text: '#263238'
    },
    bright: {
      background: '#CFD8DC',
      stroke: '#263238',
      text: '#263238'
    },
    medium: {
      background: '#B0BEC5',
      stroke: '#263238',
      text: '#263238'
    },
    dark: {
      background: '#90A4AE',
      stroke: '#263238',
      text: '#263238'
    },
    darker: {
      background: '#78909C',
      stroke: '#263238',
      text: '#263238'
    },
    warning: {
      background: '#FFEB3B',
      stroke: '#000000',
      text: '#000000'
    }
  }
}
var colorTheme = window.colorTheme

window.getColorTheme = function (name) {
  return colorTheme[name]
}

// ---------------------------------------------------------------------------------------------------
// utility functions for cyclic access
// ---------------------------------------------------------------------------------------------------
window.colRed = function (index) {
  if (!hasVar(index)) index = 0
  else if (index < 0) index = Math.abs(index)

  return colsReds[index % colsReds.length]
}
window.colBlue = function (index) {
  if (!hasVar(index)) index = 0
  else if (index < 0) index = Math.abs(index)

  return colsBlues[index % colsBlues.length]
}
window.colGreen = function (index) {
  if (!hasVar(index)) index = 0
  else if (index < 0) index = Math.abs(index)

  return colsGreens[index % colsGreens.length]
}
window.colYellow = function (index) {
  if (!hasVar(index)) index = 0
  else if (index < 0) index = Math.abs(index)

  return colsYellows[index % colsYellows.length]
}
window.colPurple = function (index) {
  if (!hasVar(index)) index = 0
  else if (index < 0) index = Math.abs(index)

  return colsPurples[index % colsPurples.length]
}
window.colMix = function (index) {
  if (!hasVar(index)) index = 0
  else if (index < 0) index = Math.abs(index)

  return colsMix[index % colsMix.length]
}

// ---------------------------------------------------------------------------------------------------
// commonly used units and symbols
// ---------------------------------------------------------------------------------------------------
window.tau = 2 * Math.PI
window.unitDeg = '\xB0'
window.unitArcMin = '′'
window.unitArcSec = '″'

// Font Awesome icons - unicode for javascript
var faD = {}
faD.faCompass = '\uf14e'
faD.faRandom = '\uf074'
faD.faBars = '\uf0c9'
faD.Phi = '\u03D5'
faD.phi = '\u03C6'
faD.Delta = '\u0394'
faD.delta = '\u03B4'
faD.space = '\u00A0'
window.faD = faD
// ---------------------------------------------------------------------------------------------------

var blockTemplate = {
  startTime: null,
  endTime: null,
  duration: null,
  exeState: {
    state: null,
    canRun: null
  },
  metaData: {
    blockName: null,
    nObs: null,
    nSched: null
  },
  obId: null,
  pointingId: null,
  pointingName: null,
  pointingPos: null,
  runphase: null,
  sbId: null,
  targetId: null,
  targetName: null,
  targetPos: null,
  telIds: [],
  timeStamp: null
}
window.blockTemplate = blockTemplate
// ---------------------------------------------------------------------------------------------------
// common telescope properties
// ---------------------------------------------------------------------------------------------------
window.TelInfo = function () {
  var isSouth = window.__nsType__ === 'S'

  // ---------------------------------------------------------------------------------------------------
  // names which should match definitions on the python server side
  // ---------------------------------------------------------------------------------------------------
  this.noSubArrName = function () {
    return 'emptySA'
  }
  this.noSubArrTitle = function () {
    return 'Free'
  }
  this.subArrayPrefix = function () {
    return 'SA_'
  }

  // ---------------------------------------------------------------------------------------------------
  // telescope ids
  // ---------------------------------------------------------------------------------------------------
  var ids = []
  ids.push('L_0')
  ids.push('L_1')
  ids.push('L_2')
  ids.push('L_3')
  ids.push('M_4')
  ids.push('M_5')
  ids.push('M_6')
  ids.push('M_7')
  ids.push('M_8')
  ids.push('M_9')
  ids.push('M_10')
  ids.push('M_11')
  ids.push('M_12')
  ids.push('M_13')
  ids.push('M_14')
  ids.push('M_15')
  ids.push('M_16')
  ids.push('M_17')
  ids.push('M_18')
  if (isSouth) {
    ids.push('M_19')
    ids.push('M_20')
    ids.push('M_21')
    ids.push('M_22')
    ids.push('M_23')
    ids.push('M_24')
    ids.push('M_25')
    ids.push('M_26')
    ids.push('M_27')
    ids.push('M_28')
    ids.push('S_29')
    ids.push('S_30')
    ids.push('S_31')
    ids.push('S_32')
    ids.push('S_33')
    ids.push('S_34')
    ids.push('S_35')
    ids.push('S_36')
    ids.push('S_37')
    ids.push('S_38')
    ids.push('S_39')
    ids.push('S_40')
    ids.push('S_41')
    ids.push('S_42')
    ids.push('S_43')
    ids.push('S_44')
    ids.push('S_45')
    ids.push('S_46')
    ids.push('S_47')
    ids.push('S_48')
    ids.push('S_49')
    ids.push('S_50')
    ids.push('S_51')
    ids.push('S_52')
    ids.push('S_53')
    ids.push('S_54')
    ids.push('S_55')
    ids.push('S_56')
    ids.push('S_57')
    ids.push('S_58')
    ids.push('S_59')
    ids.push('S_60')
    ids.push('S_61')
    ids.push('S_62')
    ids.push('S_63')
    ids.push('S_64')
    ids.push('S_65')
    ids.push('S_66')
    ids.push('S_67')
    ids.push('S_68')
    ids.push('S_69')
    ids.push('S_70')
    ids.push('S_71')
    ids.push('S_72')
    ids.push('S_73')
    ids.push('S_74')
    ids.push('S_75')
    ids.push('S_76')
    ids.push('S_77')
    ids.push('S_78')
    ids.push('S_79')
    ids.push('S_80')
    ids.push('S_81')
    ids.push('S_82')
    ids.push('S_83')
    ids.push('S_84')
    ids.push('S_85')
    ids.push('S_86')
    ids.push('S_87')
    ids.push('S_88')
    ids.push('S_89')
    ids.push('S_90')
    ids.push('S_91')
    ids.push('S_92')
    ids.push('S_93')
    ids.push('S_94')
    ids.push('S_95')
    ids.push('S_96')
    ids.push('S_97')
    ids.push('S_98')
  }

  this.getIds = function () {
    return deepCopy(ids)
  }

  // ---------------------------------------------------------------------------------------------------
  // consistent telescope id ordering
  // ---------------------------------------------------------------------------------------------------
  var order = {}
  $.each(ids, function (i, id) {
    order[id] = i
  })

  this.getOrder = function (id) {
    return order[id]
  }

  this.sortIds = function (optIn) {
    var func
    if (hasVar(optIn.func)) {
      func = function (d) {
        return order[optIn.func(d)]
      }
    } else {
      func = function (d) {
        return order[d]
      }
    }
    var isAscend = hasVar(optIn.isAscend) ? optIn.isAscend : true
    var data = optIn.data
    if (hasVar(optIn.inPlace) && !optIn.inPlace) data = deepCopy(data)

    data.sort(function (a, b) {
      if (!hasVar(func(a)) || !hasVar(func(b))) {
        console.error(
          '- Trying to sort unknown telId',
          [a, b],
          [func(a), func(b)],
          optIn
        )
      }
      if (func(a) === func(b)) return 0
      else if (isAscend) return func(a) < func(b) ? -1 : 1
      else return func(a) > func(b) ? -1 : 1
    })
    // var m1 = data.map(function(d){return d.id});
  }

  // ---------------------------------------------------------------------------------------------------
  // telescope titles
  // ---------------------------------------------------------------------------------------------------
  var title = {}
  $.each(ids, function (i, id) {
    title[id] = id.replace('_', faD.space)
  })

  this.getTitle = function (id) {
    if (hasVar(title[id])) return title[id]
    else {
      var idStr = String(id)
      while (idStr.includes('_')) {
        idStr = idStr.replace('_', faD.space)
      }
      return idStr
    }
  }
}
window.telInfo = new window.TelInfo()

// var x = ['L_0','M_11','M_21']
// telInfo.sortIds({
//   data: x, //func: function(d,i){console.log(d); return d; },
// });
// console.log('xxxxx',x);

// ---------------------------------------------------------------------------------------------------
// colours for different states (red, yellow, green)
// ---------------------------------------------------------------------------------------------------
var TEL_STATES = {
  ERROR: 0,
  WARNING: 1,
  NOMINAL: 2
}
window.TEL_STATES = TEL_STATES

var telStateCol = {}
telStateCol[TEL_STATES.NOMINAL] = ['#b5c69c', '#AED581']
telStateCol[TEL_STATES.WARNING] = ['#fcd975', '#FFEB3B']
telStateCol[TEL_STATES.ERROR] = ['#ed6d6c', '#EF5350']
window.telStateCol = telStateCol

window.getTelState = function (health) {
  if (health < 30) return TEL_STATES.ERROR
  else if (health < 55) return TEL_STATES.WARNING
  else return TEL_STATES.NOMINAL
}
var getTelState = window.getTelState

window.telHealthCol = function (health, index) {
  var telState = getTelState(health)
  if (!hasVar(index)) return telStateCol[telState][0]
  else return d3.rgb(telStateCol[telState][0]).darker(index)
}
// fraction of health within a red/yellow/green class
window.telHealthFrac = function (health) {
  return (100 - health) / 100
}
// ---------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------
// transition times (if the window/tab is inactive, checkIsHidden() makes sure all animations
// are flushed, and these times are ignored
// ---------------------------------------------------------------------------------------------------
var timeD = {}
timeD.timeScale = 1
timeD.animArc = 250 * timeD.timeScale
timeD.animTxt = 150 * timeD.timeScale
timeD.baseZoom = 350 * timeD.timeScale
timeD.waitLoop = 200 * timeD.timeScale // time to wait between update loop checks
timeD.waitSyncState = 250 * timeD.timeScale
timeD.waitQueueLoop = 200 // time to wait between func-queue loop checks
window.timeD = timeD

// ---------------------------------------------------------------------------------------------------
// global flag, to control general scroll behavious inside SVGs
// ---------------------------------------------------------------------------------------------------
window.disableScrollSVG = false

// ---------------------------------------------------------------------------------------------------
// path elements for voronoi
// ---------------------------------------------------------------------------------------------------
window.vorPloyFunc = function (d) {
  return d ? 'M' + d.join('L') + 'Z' : null
}

// ---------------------------------------------------------------------------------------------------
// utility functions
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// used for right-side drawer-panel
// ---------------------------------------------------------------------------------------------------
window.pinDrawer = function (idLayout, idDrawer) {
  var eleLayout, eleDrawer
  if (typeof idLayout === 'string' || idLayout instanceof String) {
    eleLayout = document.getElementById(idLayout)
  } else {
    eleLayout = idLayout
  }
  if (typeof idDrawer === 'string' || idDrawer instanceof String) {
    eleDrawer = document.getElementById(idDrawer)
  } else {
    eleDrawer = idDrawer
  }

  if (eleLayout.forceNarrow) togDrawerWithPin(eleLayout, eleDrawer)
  eleLayout.forceNarrow = !eleLayout.forceNarrow
}

window.togDrawerWithPin = function (idLayout, idDrawer) {
  var eleLayout, eleDrawer
  if (typeof idLayout === 'string' || idLayout instanceof String) {
    eleLayout = document.getElementById(idLayout)
  } else {
    eleLayout = idLayout
  }
  if (typeof idDrawer === 'string' || idDrawer instanceof String) {
    eleDrawer = document.getElementById(idDrawer)
  } else {
    eleDrawer = idDrawer
  }

  if (!eleLayout.forceNarrow) {
    eleLayout.forceNarrow = true
    eleDrawer.toggle()
  }
  eleDrawer.toggle()

  // dispatch a resize event manually
  setTimeout(function () {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}
var togDrawerWithPin = window.togDrawerWithPin

// ---------------------------------------------------------------------------------------------------
// switch icon when toggling iron-collapse elements
// ---------------------------------------------------------------------------------------------------
window.tog_keyboardArrow = function (optIn) {
  var moreInfo, iconButton, iconSel
  if (typeof optIn === 'string' || optIn instanceof String) {
    moreInfo = document.getElementById(optIn)
    iconButton = document.getElementById(optIn + '_fab')
    iconSel = document.getElementById(optIn + '_icon')
  } else {
    moreInfo = optIn.main
    iconButton = optIn.fab
    iconSel = optIn.icon
  }

  if (iconButton.icon) {
    if (
      iconButton.icon === 'unfold-more' ||
      iconButton.icon === 'unfold-less'
    ) {
      iconButton.icon = moreInfo.opened ? 'unfold-more' : 'unfold-less'
    } else if (
      iconButton.icon === 'expand-more' ||
      iconButton.icon === 'expand-less'
    ) {
      iconButton.icon = moreInfo.opened ? 'expand-more' : 'expand-less'
    }
  } else if (iconSel) {
    if (iconSel.icon === 'unfold-more' || iconSel.icon === 'unfold-less') {
      iconSel.icon = moreInfo.opened ? 'unfold-more' : 'unfold-less'
    } else if (
      iconSel.icon === 'expand-more' ||
      iconSel.icon === 'expand-less'
    ) {
      iconSel.icon = moreInfo.opened ? 'expand-more' : 'expand-less'
    }
  }
  moreInfo.toggle()
}

// ---------------------------------------------------------------------------------------------------
// polymer-safe append function
// ---------------------------------------------------------------------------------------------------
window.appendToDom = function (parentId, eleToApp) {
  if (typeof parentId === 'string' || parentId instanceof String) {
    if (!(parentId.indexOf('#') === 0)) parentId = '#' + parentId

    Polymer.dom(document.querySelector(parentId)).appendChild(eleToApp)
  } else {
    Polymer.dom(parentId).appendChild(eleToApp)
  }
}
window.createD3Node = function (g, type, attr, style) {
  let ret = g.append(type)
  for (let key in attr) {
    ret.attr(key, attr[key])
  }
  for (let key in style) {
    ret.style(key, style[key])
  }
  return ret
}
// ---------------------------------------------------------------------------------------------------
// move a node up inside an svg's hierarchy
// see: http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
// ---------------------------------------------------------------------------------------------------
window.moveNodeUp = function (node, nLevelsUp, stopName) {
  // console.log('moveNodeUp',nLevelsUp,node);
  if (nLevelsUp === undefined) nLevelsUp = 1e3
  else nLevelsUp = Math.min(1e3, Math.max(1, nLevelsUp))
  if (stopName === undefined) stopName = 'svg'

  var parent = node
  while (nLevelsUp > 0 && parent != null) {
    // console.log('moveNodeUp',nLevelsUp,parent.nodeName)
    if (parent.nodeName === stopName) return

    nLevelsUp--
    d3.select(parent).moveNodeUp()
    parent = parent.parentNode
  }
}
d3.selection.prototype.moveNodeUp = function () {
  return this.each(function () {
    this.parentNode.appendChild(this)
  })
}

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.getNodeById = function (optIn) {
  var idTag = hasVar(optIn.idTag) ? optIn.idTag : 'id'

  if (hasVar(optIn.idFunc)) {
    return optIn.selction
      .filter(function (d) {
        return optIn.id === optIn.idFunc(d)
      })
      .node()
  } else {
    return optIn.selction
      .filter(function (d) {
        return optIn.id === d[idTag]
      })
      .node()
  }
}
var getNodeById = window.getNodeById

window.getNodeWidthById = function (optIn) {
  var eleNow = getNodeById(optIn)

  if (hasVar(eleNow)) return eleNow.getBBox().width
  else return 0
}

window.getNodeHeightById = function (optIn) {
  var eleNow = getNodeById(optIn)
  if (!hasVar(optIn.txtScale)) optIn.txtScale = false
  var txtScale = optIn.txtScale ? getTxtScale() : 1

  if (hasVar(eleNow)) return eleNow.getBBox().height * txtScale
  else return 0
}

window.getTxtScale = function () {
  return 0.333
}
var getTxtScale = window.getTxtScale

window.getSelTrans = function (sel) {
  var trans = sel.attr('transform')
  trans = trans
    .replace('translate(', '')
    .replace(')', '')
    .split(',')
  trans = [+trans[0], +trans[1]]
  return trans
}

window.getSelectBox = function (sel) {
  return sel.node().getBoundingClientRect()
}
// ---------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------
// load a script (where loaded scripts can also call this function, allowing recursive behaviour)
// ---------------------------------------------------------------------------------------------------
window.loadedScripts = { queued: [], loaded: [] }
var loadedScripts = window.loadedScripts

window.loadScript = function (optIn) {
  var debug = false
  if (loadedScripts.queued.indexOf(optIn.script) < 0) {
    loadedScripts.queued.push(optIn.script)
    if (debug) console.log('--- queue ( from', optIn.source, '):', optIn.script)

    $.getScript(optIn.script, function () {
      loadedScripts.loaded.push(optIn.script)
      if (debug) console.log('-+- loaded: ', optIn.script)
    })
  }
}

// ---------------------------------------------------------------------------------------------------
// return sorted array, by the given index
// ---------------------------------------------------------------------------------------------------
window.sortByFunc = function (optIn) {
  var func = optIn.func
  var isAscend = hasVar(optIn.isAscend) ? optIn.isAscend : true
  var data = optIn.data
  if (hasVar(optIn.inPlace) && !optIn.inPlace) data = deepCopy(data)

  data.sort(function (a, b) {
    if (!hasVar(func(a)) || !hasVar(func(b))) {
      console.error(
        '- Trying to sort unknown telId',
        optIn,
        [a, func(a)],
        [b, func(b)]
      )
    }
    if (func(a) === func(b)) return 0
    else if (isAscend) return func(a) < func(b) ? -1 : 1
    else return func(a) > func(b) ? -1 : 1
  })

  return data
}
var sortByFunc = window.sortByFunc

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.Locker = function (optInit) {
  var counters = {}
  var defCounter = 'common'

  // turn a counter on or off
  function add (optIn) {
    var id = defCounter
    var expire = -1
    var override = false
    if (hasVar(optIn)) {
      if (typeof optIn === 'string') id = optIn
      else {
        if (hasVar(optIn.id)) id = optIn.id
        if (hasVar(optIn.expire)) expire = optIn.expire
        if (hasVar(optIn.override)) override = optIn.override
      }
    }

    if (!hasVar(counters[id])) counters[id] = 0
    if (override) counters[id] = 1
    else counters[id] = Math.max(0, counters[id] + 1)

    if (expire > 0) {
      remove({ id: id, delay: expire })
    }
    // if(id == 'zoomToTarget') console.log('Locker add',id,counters[id]);
  }
  this.add = add

  function remove (optIn) {
    var id = defCounter
    var override = false
    var delay = 0
    if (hasVar(optIn)) {
      if (typeof optIn === 'string') id = optIn
      else {
        if (hasVar(optIn.id)) id = optIn.id
        if (hasVar(optIn.override)) override = optIn.override
        if (hasVar(optIn.delay)) delay = optIn.delay
      }
    }

    if (delay <= 0) removeNow()
    else {
      setTimeout(function () {
        removeNow()
      }, delay)
    }

    function removeNow () {
      if (!hasVar(counters[id])) counters[id] = 0 // just in case - should not happen...
      if (override) counters[id] = 0
      else counters[id] = Math.max(0, counters[id] - 1)
    }

    // if(id == 'zoomToTarget') console.log('Locker remove('+delay+')',id,counters[id]);
  }
  this.remove = remove

  function expires (optIn) {
    // var id = defCounter
    var duration = 10
    if (hasVar(optIn)) {
      if (typeof optIn !== 'string') {
        if (hasVar(optIn.duration)) duration = optIn.duration
      }
      // if (typeof optIn === 'string') id = optIn
      // else {
      //   if (hasVar(optIn.id)) id = optIn.id
      //   if (hasVar(optIn.duration)) duration = optIn.duration
      // }
    }

    if (duration > 0) {
      add(optIn)
      setTimeout(function () {
        remove(optIn)
      }, duration)
    } else {
      console.error(
        'ignoring Locker.expires() with non-positive duration:',
        optIn
      )
    }
  }
  this.expires = expires

  // check if a counter is still active
  function isFree (optIn) {
    var id = defCounter
    if (hasVar(optIn)) {
      if (typeof optIn === 'string') id = optIn
      else if (hasVar(optIn.id)) id = optIn.id
    }

    if (!hasVar(counters[id])) return true
    else {
      counters[id] = Math.max(0, counters[id])
      return counters[id] === 0
    }
  }
  this.isFree = isFree

  function isFreeV (idV) {
    var areAllFree = true

    $.each(idV, function (index, idNow) {
      areAllFree = areAllFree && isFree(idNow)
    })

    return areAllFree
  }
  this.isFreeV = isFreeV

  // check the value of the active counter
  function nActive (optIn) {
    var id = defCounter
    if (hasVar(optIn)) {
      if (typeof optIn === 'string') id = optIn
      else if (hasVar(optIn.id)) id = optIn.id
    }

    if (!hasVar(counters[id])) return 0
    else {
      counters[id] = Math.max(0, counters[id])
      return counters[id]
    }
  }
  this.nActive = nActive

  function nActiveV (idV) {
    var nActiveAll = 0

    $.each(idV, function (index, idNow) {
      nActiveAll += nActive(idNow)
    })

    return nActiveAll
  }
  this.nActiveV = nActiveV

  function getActiveV (idV) {
    if (!hasVar(idV)) return []

    if (typeof idV === 'string') idV = [idV]

    var activeV = []
    $.each(idV, function (i, d) {
      if (!isFree(d)) activeV.push(d)
    })

    return activeV
  }
  this.getActiveV = getActiveV
}
var Locker = window.Locker

window.RunLoop = function (optIn) {
  var baseTag = optIn.tag
  var pushWait = 10
  var runV = {}
  var nKeep = {}
  var wait = {}
  var func = {}
  var locker = new Locker()

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function init (optIn) {
    var tag = optIn.tag
    nKeep[tag] = hasVar(optIn.nKeep) ? optIn.nKeep : -1
    func[tag] = optIn.func
    wait[tag] = hasVar(optIn.wait) ? optIn.wait : timeD.waitLoop
    wait[tag] = Math.max(wait[tag], 100)

    if (!hasVar(tag) || !hasVar(func[tag])) {
      console.error(' - bad setting for exeLoop.init() :', baseTag, optIn)
      return
    }
    if (hasVar(runV[tag])) {
      console.error(
        ' - trying to initialize exeLoop.init() with existing tag :',
        baseTag,
        optIn
      )
      return
    }

    runV[tag] = []
    run(tag)
  }
  this.init = init

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function run (tag) {
    if (!locker.isFree(tag)) {
      setTimeout(function () {
        run(tag)
      }, pushWait)
      return
    }
    setTimeout(function () {
      run(tag)
    }, wait[tag])

    if (runV[tag].length === 0) return

    locker.add(tag)

    // console.log('000',tag,runV[tag].map(function(d){ return d.time}));
    var nEle = runV[tag].length

    // sort (in-place) so that the first elements (low date value) come first
    sortByFunc({
      data: runV[tag],
      func: function (d) {
        return d.time
      },
      isAscend: true
    })
    // console.log('111',tag,runV[tag].map(function(d){ return d.time}));

    // keep the requested number of elements
    var nKeepNow = nKeep[tag]
    if (nKeepNow <= 0) {
      runV[tag] = runV[tag].slice(0, nEle)
    } else {
      nKeepNow = Math.min(Math.max(nKeepNow, 0), nEle)
      runV[tag] = runV[tag].slice(nEle - nKeepNow, nEle)
    }
    // console.log('222',tag,runV[tag].map(function(d){ return d.time}));
    // console.log('-----------------------------');

    $.each(runV[tag], function (index, dataNow) {
      func[tag](dataNow.data)
    })
    runV[tag] = []

    locker.remove(tag)
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function push (optIn) {
    if (!locker.isFree(optIn.tag)) {
      setTimeout(function () {
        push(optIn)
      }, pushWait)
      return
    }
    if (!hasVar(runV[optIn.tag])) {
      console.error(
        ' - got _runLoop_.push() with tag which was not initialized!!!',
        baseTag,
        optIn
      )
      return
    }

    var time = parseInt(hasVar(optIn.time) ? optIn.time : Date.now())
    runV[optIn.tag].push({ data: optIn.data, time: time })
  }
  this.push = push

  function hasTag (tag) {
    return hasVar(runV[tag])
  }
  this.hasTag = hasTag
}
window.runLoopCom = new window.RunLoop({ tag: 'runLoopCom' })

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------

window.runWhenReady = function (optIn) {
  var wait = hasVar(optIn.wait) ? optIn.wait : 10
  var maxTries = hasVar(optIn.maxTries) ? optIn.maxTries : 1000
  var msgFail = hasVar(optIn.msgFail)
    ? optIn.msgFail
    : function () {
      console.error(['cant run checkReady() with: ', optIn])
    }

  var nTries = 0
  function checkReady () {
    if (!optIn.pass()) {
      if (nTries > maxTries) {
        msgFail()
      } else {
        setTimeout(function () {
          checkReady()
        }, wait)
      }
      nTries += 1
      return
    }

    optIn.execute()
  }
  checkReady()
}

// ---------------------------------------------------------------------------------------------------
// icon-badges for widget identification
// ---------------------------------------------------------------------------------------------------

window.IconBadge = function () {
  function setWidgetIcon (optIn) {
    var nIcon = optIn.nIcon

    if (!hasVar(optIn.iconDiv)) return

    var iconDivIdIn = optIn.iconDiv.id
    var iconDivEle = optIn.iconDiv.ele
    var pulseHovIn = hasVar(optIn.pulseHovIn) ? optIn.pulseHovIn : false

    if (!hasVar(iconDivIdIn) || !hasVar(nIcon) || nIcon < 0) return

    // make sure we don't add the same badge twice
    var iconDivId
    if (hasVar(iconDivEle)) {
      iconDivId = iconDivEle
    } else {
      iconDivId = iconDivIdIn
      if (!(iconDivId.indexOf('#') === 0)) iconDivId = '#' + iconDivId
    }

    // remove possible existing element before adding a new one
    d3
      .select(iconDivId)
      .selectAll('svg')
      .style('position', 'absolute')
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', 0)
      .remove()

    var isEmptySel = true
    var svg = d3
      .select(iconDivId)
      .style('width', '100%')
      .style('position', 'relative')
      .style('margin', 'auto')
      .each(function () {
        isEmptySel = false
      })
      .append('svg')
      .attr('id', iconDivIdIn)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', '-0.5 -0.5 1 1')
      .style('display', 'block')
      .style('background', 'transparent')
    // .style("background", "red").style('opacity',0.2)//.style("border","1px solid red")

    if (isEmptySel) return {}

    var iconSvg = get(nIcon)
    var badge = add({
      parentSvg: svg,
      iconFile: iconSvg[0],
      text: { pos: 'topRight', txt: iconSvg[1] },
      rad: 0.48,
      delay: 0,
      pulseHovIn: pulseHovIn,
      transBack: true
    })

    var outD = {
      svg: svg,
      iconSvg: iconSvg,
      badge: badge
    }

    return outD
  }
  this.setWidgetIcon = setWidgetIcon

  // ---------------------------------------------------------------------------------------------------
  // produces an icon with a backdrop, where the entire box is scaled as 100x100px
  // ---------------------------------------------------------------------------------------------------
  function add (optIn) {
    // required parameters
    var baseRad = 50
    var parentSvg = optIn.parentSvg
    var iconFile = optIn.iconFile

    // optional parameters
    var rad = hasVar(optIn.rad) ? optIn.rad : baseRad
    var delay = hasVar(optIn.delay) ? optIn.delay : 0
    var duration = hasVar(optIn.duration) ? optIn.duration : timeD.animArc
    var showOutline = hasVar(optIn.showOutline) ? optIn.showOutline : false
    var biggerIcon = hasVar(optIn.biggerIcon) ? optIn.biggerIcon : false
    var colBack = hasVar(optIn.colBack) ? optIn.colBack : '#F2F2F2'
    var colDark = hasVar(optIn.colDark) ? optIn.colDark : '#383b42'
    var colLight = hasVar(optIn.colLight) ? optIn.colLight : '#ececec'
    var iconCol = hasVar(optIn.iconCol) ? optIn.iconCol : colDark
    var iconColUp = hasVar(optIn.iconColUp)
      ? optIn.iconColUp
      : d3.rgb(iconCol).darker(2)
    var pulseHovIn = hasVar(optIn.pulseHovIn) ? optIn.pulseHovIn : false
    var pulseHovOut = hasVar(optIn.pulseHovOut) ? optIn.pulseHovOut : false
    var colDarkOpac = hasVar(optIn.colDarkOpac) ? optIn.colDarkOpac : 1
    var colLightOpac = hasVar(optIn.colLightOpac) ? optIn.colLightOpac : 1
    var addBoundBox = hasVar(optIn.addBoundBox) ? optIn.addBoundBox : false
    var transBack = hasVar(optIn.transBack) ? optIn.transBack : false
    var text = hasVar(optIn.text) ? optIn.text : null

    if (transBack) {
      if (!hasVar(optIn.colBack)) colBack = 'transparent'
      if (!hasVar(optIn.colLight)) colLight = '#383b42'
      if (!hasVar(optIn.colLightOpac)) colLightOpac = 0.2
    }
    // duration*=10

    // colDark = "#104E8B", colLight = "#74CBDE", iconCol = "#9CCC65";
    // colDark = "#C2185B", colLight = "#F06292", iconCol = "#383b42";

    var gOuter = parentSvg.append('g')
    var gInner = gOuter.append('g')
    var gCirc = gInner.append('g')
    var gSvg = gInner.append('g')
    var gTxt = gInner.append('g')

    var setR = function (radIn, duration) {
      if (!hasVar(duration)) duration = timeD.animArc
      var trans = -radIn
      var scale = radIn / baseRad
      gInner
        .transition('badgeRetR')
        .duration(duration)
        .attr(
          'transform',
          'translate(' + trans + ',' + trans + ')scale(' + scale + ')'
        )
    }
    setR(rad, 0)

    if (iconFile === '') {
      return { g: gOuter, setR: setR }
    }

    var data = []
    data.push({
      fill: colBack,
      strokeWidth: 0,
      stroke: colDark,
      strokeOpac: colDarkOpac,
      opacity: 1,
      r: biggerIcon ? 25 : 48,
      transDark: false
    })

    data.push({
      fill: 'transparent',
      strokeWidth: 20,
      stroke: colDark,
      strokeOpac: colDarkOpac,
      opacity: 0.05,
      r: biggerIcon ? 18 : 38,
      transDark: false
    })

    data.push({
      fill: 'transparent',
      strokeWidth: biggerIcon ? 1.5 : 2,
      stroke: colLight,
      strokeOpac: colLightOpac,
      opacity: 1,
      r: biggerIcon ? 18 : 38,
      transDark: false
    })

    data.push({
      fill: 'transparent',
      strokeWidth: 4,
      stroke: colDark,
      strokeOpac: colDarkOpac,
      opacity: 0.05,
      r: biggerIcon ? 22 : 44,
      transDark: false
    })

    data.push({
      fill: 'transparent',
      strokeWidth: 0.5,
      stroke: colLight,
      strokeOpac: colLightOpac,
      opacity: 1,
      r: biggerIcon ? 22 : 44,
      transDark: true
    })

    gCirc
      .selectAll('circle.badge')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'badge') // class list for easy selection
      .attr('cx', baseRad)
      .attr('cy', baseRad)
      .attr('t', 0)
      .attr('fill', function (d, i) {
        return d.fill
      })
      .style('stroke-width', function (d, i) {
        return d.strokeWidth
      })
      .style('stroke-opacity', function (d, i) {
        return d.strokeOpac
      })
      .style('stroke', function (d, i) {
        return d.stroke
      })
      .style('opacity', function (d, i) {
        return d.opacity
      })
      .transition('inOut')
      .delay(delay)
      .duration(duration)
      .attr('r', function (d, i) {
        return d.r
      })

    if (addBoundBox) {
      gCirc
        .selectAll('rect.badge')
        .data([data[0]])
        .enter()
        .append('rect')
        .attr('class', 'badge') // class list for easy selection
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', function (d, i) {
          return baseRad * 2
        })
        .attr('height', function (d, i) {
          return baseRad * 2
        })
        // .attr("t", 0)
        .attr('fill', 'transparent')
        .style('stroke-width', 1)
        .style('stroke-opacity', 1)
        .style('stroke', colDark)
        .style('opacity', 0)
        .transition('inOut')
        .delay(delay)
        .duration(duration)
        .style('opacity', colDarkOpac)
    }

    if (hasVar(text)) {
      var txtSize, align, pos
      if (text.pos === 'topLeft') {
        txtSize = 28
        align = 'start'
        pos = [5, 0, txtSize]
      } else if (text.pos === 'topRight') {
        txtSize = 28
        align = 'end'
        pos = [data[0].r * 2 - 5, 0, txtSize]
      } else {
        txtSize = 28
        align = 'middle'
        pos = [data[0].r, data[0].r, txtSize / 3]
      }

      gTxt
        .selectAll('text.badge')
        .data([{ id: 'txt0' }])
        .enter()
        .append('text')
        .attr('class', 'badge')
        .text(text.txt)
        .style('text-anchor', align)
        .style('font-weight', 'bold')
        .style('stroke-width', 1.25)
        .style('stroke', function (d) {
          return '#F2F2F2'
        })
        .style('fill', function (d) {
          return colDark
        })
        .style('pointer-events', 'none')
        .style('vector-effect', 'non-scaling-stroke')
        .attr('transform', function (d) {
          return 'translate(' + pos[0] + ',' + pos[1] + ')'
        })
        .style('font-size', function (d) {
          return txtSize + 'px'
        })
        .attr('dy', function (d) {
          return pos[2] + 'px'
        })
        .style('fill-opacity', 0.9)
        .style('stroke-opacity', 1)
    }

    // gSvg .append("svg:image")
    //       .attr("xlink:href", iconFile)
    //       .attr({"width": 68, "height":68, "x":16, "y":16})
    //       .style({"opacity":"0"})
    //       .transition("inOut").delay(delay).duration(duration*2)
    //       .style({"opacity":"1"})

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    var idNow = 'badge' + unique()
    getSvgFromFile({
      g: gSvg,
      iconPath: iconFile,
      idSvg: idNow,
      afterFunc: function () {
        afterSvg({ g: gInner, idSvg: idNow })
      }
    })

    // function to retreive
    function getSvgFromFile (optIn) {
      var gNow = optIn.g
      var idSvg = optIn.idSvg
      var iconPath = optIn.iconPath
      var afterFunc = hasVar(optIn.afterFunc) ? optIn.afterFunc : null

      d3.xml(iconPath, function (error, documentFragment) {
        if (error) {
          console.error('problem with d3.xml() for', idSvg, error)
          throw error
        }
        var svgNode = documentFragment.getElementsByTagName('svg')
        if (svgNode[0]) {
          var node = gNow.node().appendChild(svgNode[0])
          node.id = idSvg // assign an id, and then later do e.g., g.select("#"+idNow);
        }

        // exec function after we're done here
        if (hasVar(afterFunc)) afterFunc()
      })
    }

    function afterSvg (optIn) {
      var gNow = optIn.g
      var idSvg = optIn.idSvg
      var innerSVG = gNow.select('#' + idSvg)

      var svgEleTypes = ['path', 'circle', 'polygon']
      $.each(svgEleTypes, function (indexType, typeNow) {
        innerSVG.selectAll(typeNow).attr('fill', iconCol)
      })

      var coords = [16, 68]
      innerSVG
        .attr('x', coords[0] + coords[1] / 2)
        .attr('y', coords[0] + coords[1] / 2)
        .attr('width', 0)
        .attr('height', 0)
        .style('opacity', 0.5)
        .transition('inOut')
        .delay(delay + duration / 2)
        .duration(duration)
        .attr('x', coords[0])
        .attr('y', coords[0])
        .attr('width', coords[1])
        .attr('height', coords[1])
        .style('opacity', 1)

      var circ = gNow.selectAll('circle.outline').data([0])
      circ
        .enter()
        .append('circle')
        .attr('class', 'outline')
        .attr('cx', baseRad)
        .attr('cy', baseRad)
        .attr('r', baseRad)
        .attr('fill', 'transparent')
        .style('stroke-width', 1)
        .style('stroke', colDark) // .style("stroke", 'red')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('opacity', 0)
        .on('mouseover', function () {
          if (pulseHovIn) rUpDown(1.05)
        })
        .on('mouseout', function () {
          if (pulseHovOut) rUpDown(1)
        })
        .transition('inOut')
        .delay(delay + duration / 2)
        .duration(duration)
        .style('opacity', showOutline ? '1' : '0')

      function rUpDown (scale) {
        var isUp = scale > 1.001
        var upPrc = biggerIcon && isUp ? 0.8 : 0.1 * (isUp ? 1 : -1)
        // console.log('rUpDown',isUp)

        if (isUp) {
          gNow
            .selectAll('circle.badge')
            .filter(function (d) {
              return d.transDark
            })
            .transition('strkUpDown')
            .duration(duration / 2)
            .style('stroke', function (d, i) {
              return d3.rgb(d.stroke).darker(1)
            })
            .transition('strkUpDown')
            .duration(duration / 2)
            .style('stroke', function (d, i) {
              return d.stroke
            })

          $.each(svgEleTypes, function (indexType, typeNow) {
            innerSVG
              .selectAll(typeNow)
              .transition('rUpDown')
              .duration(duration / 2)
              // .attr("transform", "scale("+(2)+")")
              .attr('fill', iconColUp)
              .transition('rUpDown')
              .duration(duration)
              // .attr("transform", "scale("+(1)+")")
              .attr('fill', iconCol)
          })
        }

        //
        gNow
          .selectAll('circle.badge')
          .transition('rUpDown')
          .duration(duration / 2)
          .attr('r', function (d, i) {
            return d.r * (scale + upPrc)
          })
          .transition('rUpDown')
          .duration(duration / 2)
          .attr('r', function (d, i) {
            return d.r * scale
          })
      }
    }

    // return gOuter;
    return { g: gOuter, setR: setR }
  }
  this.add = add

  // ---------------------------------------------------------------------------------------------------
  // see: http://www.flaticon.com/free-icons/animals_221/2?word=animals&order_by=1&color=1&stroke=1
  // credit: Icons made by Freepik from www.flaticon.com
  // ---------------------------------------------------------------------------------------------------
  function get (nIcon) {
    var iconV = [
      '/static/frog-jumping.svg',
      '/static/seahorse.svg',
      '/static/fox.svg',
      '/static/butterfly.svg',
      '/static/horse-left.svg',
      '/static/bat-round.svg',
      '/static/owl.svg',
      '/static/gorilla.svg',
      '/static/gecko.svg',
      '/static/falcon.svg',
      '/static/deer-running.svg',
      '/static/dolphin.svg',
      '/static/cat-side.svg',
      '/static/swan.svg',
      '/static/flamingo.svg',
      '/static/squirrel.svg',
      '/static/fishe-pair.svg',
      '/static/spotted-beetle.svg',
      '/static/crab.svg',
      '/static/octopus.svg',
      '/static/dog.svg',
      '/static/goose.svg',
      '/static/blowfish.svg',
      '/static/wallaby.svg',
      '/static/lion.svg',
      '/static/giraffe.svg',
      '/static/chicken.svg',
      '/static/scorpion-clawed.svg',
      '/static/koala.svg',
      '/static/monkey.svg',
      '/static/hammerhead.svg',
      '/static/spider.svg',
      '/static/rabbit.svg',
      '/static/manta-ray.svg',
      '/static/snail.svg',
      '/static/poodle.svg',
      '/static/sea-lion.svg',
      '/static/snake.svg',
      '/static/hummingbird.svg',
      '/static/elephant.svg',
      '/static/fish-triangular.svg',
      '/static/dromedary.svg',
      '/static/mouse.svg',
      '/static/cat.svg',
      '/static/sheep.svg',
      '/static/crane.svg',
      '/static/squid.svg',
      '/static/waterfowl.svg',
      '/static/snapper.svg',
      '/static/fish.svg',
      '/static/bear.svg',
      '/static/oystercatcher.svg',
      '/static/arthropod.svg',
      '/static/bandicoot.svg',
      '/static/balloonfish.svg',
      '/static/duck.svg',
      '/static/dove.svg',
      '/static/crocodile.svg',
      '/static/bird.svg',
      '/static/rooster.svg',
      '/static/parrot.svg',
      '/static/penguin.svg',
      '/static/eagle.svg',
      '/static/moose.svg',
      '/static/anhinga-bird.svg',
      '/static/horse-right.svg',
      '/static/sea-turtle.svg',
      '/static/frog.svg',
      '/static/centrosaurus.svg',
      '/static/aries.svg',
      '/static/bull-silhouette.svg',
      '/static/cougar.svg',
      '/static/japan-koi-fish.svg',
      '/static/ostrich-bird-shape-running.svg',
      '/static/capricorn.svg',
      '/static/scorpion.svg',
      '/static/butterfly-left.svg',
      '/static/turtle.svg',
      '/static/turkey.svg',
      '/static/vulture.svg',
      '/static/iguana.svg',
      '/static/pterodactyl.svg',
      '/static/giraffatitan.svg',
      '/static/hawk.svg',
      '/static/deer.svg',
      '/static/compsognathus.svg',
      '/static/beetle.svg',
      '/static/elasmosaurus.svg',
      '/static/beaver.svg',
      '/static/ant-eater.svg',
      '/static/epidexipteryx.svg',
      '/static/whale-facing-right.svg',
      '/static/bat.svg',
      '/static/raven.svg',
      '/static/camel-shape.svg',
      '/static/piggy-bank.svg'
    ]

    if (nIcon < 0) return ['', null]

    var nIconNow = nIcon % iconV.length
    var iconTxt = Math.floor(0.000001 + nIcon / iconV.length)
    if (iconTxt === 0) iconTxt = null
    return [iconV[nIconNow], iconTxt]

    // else if(nIcon >= iconV.length) {
    //   console.error('trying to get iconV[',nIcon,'] which is out of bounds (size is ',iconV.length,')')
    //   return "";
    // }
  }
  this.get = get
}
window.iconBadge = new window.IconBadge()

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------

window.bckPattern = function (optIn) {
  var com = optIn.com
  var gNow = optIn.gNow
  var gTag = optIn.gTag
  var opac = optIn.opac
  // var lenTag = optIn.lenTag
  var textureOrient = optIn.textureOrient
  var textureSize = optIn.textureSize
  var circType = optIn.circType
  var size = optIn.size
  var hexR = optIn.hexR
  var lenWH = optIn.lenWH
  var trans = optIn.trans

  // var gNow   = svg[gTag];
  var tagNow = 'svgBck' + gTag
  var strk = 0.5
  // console.log('==========',textureOrient,hasVar(textureOrient),isNaN(textureOrient),hexR,hasVar(hexR))

  // add the hexbin as another layer of the background
  // ---------------------------------------------------------------------------------------------------
  if (hasVar(textureOrient) || hasVar(circType)) {
    if (!hasVar(com[tagNow])) {
      com[tagNow] = {}
      com[tagNow].g = gNow.append('g')
      com[tagNow].orient = ''
      com[tagNow].size = hasVar(textureSize) ? textureSize : 50
    }

    if (hasVar(trans)) {
      com[tagNow].g.attr(
        'transform',
        'translate(' + trans[0] + ',' + trans[1] + ')'
      )
    }

    if (
      (hasVar(textureOrient) && com[tagNow].orient !== textureOrient) ||
      (hasVar(textureSize) && com[tagNow].size !== textureSize)
    ) {
      if (hasVar(textureOrient)) com[tagNow].orient = textureOrient
      if (hasVar(textureSize)) com[tagNow].size = textureSize

      // see: http://riccardoscalco.github.io/textures/
      com[tagNow].txtr = textures
        .lines()
        .thinner()
        .lighter()
        .orientation(com[tagNow].orient)
        .stroke('#383b42')
        .strokeWidth(1)
        .size(com[tagNow].size)

      if (hasVar(size)) com[tagNow].txtr.size(size)

      com[tagNow].g.call(com[tagNow].txtr)
    } else if (hasVar(circType)) {
      // see: http://riccardoscalco.github.io/textures/
      if (circType === 'normal') {
        com[tagNow].txtr = textures.circles()
      } else if (circType === 'heavier') {
        com[tagNow].txtr = textures.circles().heavier()
      } else if (circType === 'lighter') {
        com[tagNow].txtr = textures.circles().lighter()
      } else if (circType === 'thicker') {
        com[tagNow].txtr = textures.circles().thicker()
      } else if (circType === 'thinner') {
        com[tagNow].txtr = textures.circles().thinner()
      }

      if (hasVar(size)) com[tagNow].txtr.size(size)
      // .thinner().lighter()
      // .orientation(com[tagNow].orient)
      // .stroke("#383b42")
      // .strokeWidth(1).size(com[tagNow].size)

      com[tagNow].g.call(com[tagNow].txtr)
    }

    var rect = com[tagNow].g
      .selectAll('rect.' + tagNow)
      .data([{ id: 0 }], function (d, i) {
        return i
      })

    rect
      .enter()
      .append('rect')
      .attr('class', tagNow)
      .attr('width', lenWH[0])
      .attr('height', lenWH[1])
      .attr('fill', 'transparent')
      .attr('stroke-width', 0)
      .attr('vector-effect', 'non-scaling-stroke')
      .style('pointer-events', 'none')
      .merge(rect)
      .transition('inOut')
      .duration(timeD.animArc)
      .style('fill', com[tagNow].txtr.url())
      .attr('opacity', opac)

    rect
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', '0')
      .remove()
  } else if (hasVar(hexR)) {
    if (!hasVar(com[tagNow])) {
      com[tagNow] = {}
      com[tagNow].g = gNow.append('g')
      com[tagNow].path = null
      com[tagNow].hexR = -1
    }

    if (com[tagNow].hexR !== hexR) {
      com[tagNow].hexR = hexR
      com[tagNow].path = d3
        .hexbin()
        .size([lenWH[0], lenWH[1]])
        .radius(hexR)
    }

    var path = com[tagNow].g
      .selectAll('path.' + tagNow)
      .data([{ id: 0 }], function (d, i) {
        return i
      })

    path
      .enter()
      .append('path')
      .attr('class', tagNow)
      .attr('fill', 'transparent')
      .attr('stroke', '#383b42')
      .attr('stroke-width', strk)
      .attr('vector-effect', 'non-scaling-stroke')
      .merge(path)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('d', com[tagNow].path.mesh())
      .attr('opacity', opac)

    path
      .exit()
      .transition('inOut')
      .duration(timeD.animArc)
      .style('opacity', '0')
      .remove()
  } else {
    console.log('undetermined options in bckPat', optIn)
  }
}

// ---------------------------------------------------------------------------------------------------
// programatic zoom function
// ---------------------------------------------------------------------------------------------------

window.doZoomToTarget = function (dataIn) {
  if (!hasVar(dataIn.cent)) {
    dataIn.cent = [dataIn.wh[0] / 2, dataIn.wh[1] / 2]
  }

  var duration = dataIn.durFact * timeD.baseZoom
  var transTarget = d3.zoomIdentity
    .translate(dataIn.cent[0], dataIn.cent[1])
    .scale(dataIn.trgScale)
    .translate(-dataIn.transTo[0], -dataIn.transTo[1])

  // // for chrome the following is enough, but for firefox we need to define attrTween explicitly...
  // dataIn.svg.transition("doZoomToTarget").duration(duration*5)
  //   .call(dataIn.svgZoom.transform, transTarget)
  //   .on("start", dataIn.funcStart)
  //   .on("end", dataIn.funcEnd)
  // return;

  var scale0 = Math.sqrt(dataIn.wh[0] * dataIn.wh[1])
  var node = d3.zoomTransform(dataIn.svgZoomNode)
  var center = [dataIn.cent[0], dataIn.cent[1]]
  var start = [
    (center[0] - node.x) / node.k,
    (center[1] - node.y) / node.k,
    scale0 / node.k
  ]
  var end = [dataIn.transTo[0], dataIn.transTo[1], scale0 / dataIn.trgScale]
  var intprZoom = d3.interpolateZoom(start, end)

  if (hasVar(dataIn.funcStart)) dataIn.funcStart()

  dataIn.svgBox
    .transition('zoomToTarget')
    .duration(duration)
    .attrTween('transform', function () {
      return transStep
    })
    .on('end', function () {
      dataIn.svg.call(dataIn.svgZoom.transform, transTarget)

      if (hasVar(dataIn.funcEnd)) dataIn.funcEnd()
    })

  function transStep (t) {
    if (hasVar(dataIn.funcDuring)) dataIn.funcDuring()

    var intpr = intprZoom(t)
    if (!hasVar(intpr[0])) return ''

    var scale = scale0 / intpr[2]
    var trans = [center[0] - intpr[0] * scale, center[1] - intpr[1] * scale]

    return 'translate(' + trans[0] + ',' + trans[1] + ')scale(' + scale + ')'
  }
}

// ---------------------------------------------------------------------------------------------------
// see: https://github.com/mbostock/d3/wiki/Math#transform
// ---------------------------------------------------------------------------------------------------

window.thisTrans = function (me) {
  var trans = d3.select(me).attr('transform')
  return trans
    .replace('translate(', '')
    .replace(')', '')
    .split(',')
  // return d3.transform(d3.select(me).attr("transform")).translate;
}
// function thisScale (me) { return d3.transform(d3.select(me).attr("transform")).scale;     }
// function thisRotate(me) { return d3.transform(d3.select(me).attr("transform")).rotate;    }
// ---------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------
// deep copy an object or array
// ---------------------------------------------------------------------------------------------------

window.deepCopy = function (objIn) {
  if (Array.isArray(objIn)) return objIn.slice(0, objIn.length)
  else return jQuery.extend(true, {}, objIn)
}
var deepCopy = window.deepCopy

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------

window.unique = function () {
  var postPad = '00000'
  var rndNow = Math.floor(Math.random() * 1e5).toString()
  var postfix = (postPad + rndNow).slice(-postPad.length)
  return '_' + Date.now().toString() + postfix
}
var unique = window.unique

window.uniqArray = function (dataIn) {
  return dataIn.filter(function (d, i) {
    return dataIn.indexOf(d) === i
  })
}

// ---------------------------------------------------------------------------------------------------
// find element in obkect with key and value match
// ---------------------------------------------------------------------------------------------------

window.findDictEleInObj = function (objIn, key, val, isDebug) {
  var retVal = [-1, undefined]
  $.each(objIn, function (index, eleNow) {
    if (eleNow[key] === val && retVal[0] === -1) retVal = [index, eleNow]
  })
  if (retVal[0] === -1 && isDebug) {
    console.log(' - could not find [', key, ' == ', val, '] in', objIn)
  }
  return retVal
}

// ---------------------------------------------------------------------------------------------------
// iterative replace of all occurances of a sub-string
// (replace in two steps, since the replacing pattern might include the replaced pattern)
// ---------------------------------------------------------------------------------------------------

window.replaceAll = function (strIn, patt0, patt1) {
  var strOut = strIn

  // temporary pattern which is not included in the input string
  var pattTmp = 'TMP_FAKE_PATTERN'
  while (strOut.indexOf(pattTmp) !== -1) {
    var sub0 = pattTmp.substr(0, pattTmp.length - 1)
    var sub1 = pattTmp.substr(pattTmp.length - 1, pattTmp.length)
    pattTmp = sub0 + '_' + sub1
  }

  while (strOut.indexOf(patt0) !== -1) {
    strOut = strOut.replace(patt0, pattTmp)
  }
  while (strOut.indexOf(pattTmp) !== -1) {
    strOut = strOut.replace(pattTmp, patt1)
  }

  return strOut
}

// ---------------------------------------------------------------------------------------------------
// common format for dates
// ---------------------------------------------------------------------------------------------------

window.dateToStr = function (dateIn) {
  return moment(dateIn).format('DD/MM/YYYY,HH:mm:ss')
  // return  dateIn.getDate()+"/"+(dateIn.getMonth()+1)+"/"+dateIn.getFullYear()+","
  //        +dateIn.getHours()+":"+dateIn.getMinutes()+":"+dateIn.getSeconds();
}

// ---------------------------------------------------------------------------------------------------
// check if a variable is defined and not nulled
// ---------------------------------------------------------------------------------------------------

window.hasVar = function (varIn) {
  if (varIn === undefined) return false
  else if (varIn === null) return false
  else if (varIn === Infinity) return false
  else return true
}
var hasVar = window.hasVar

// ---------------------------------------------------------------------------------------------------
// numerical
// ---------------------------------------------------------------------------------------------------
window.floorMin = function (inp, minOut) {
  return Math.max(Math.floor(inp), minOut)
}

window.floorMax = function (inp, maxOut) {
  return Math.min(Math.floor(inp), maxOut)
}

window.roundMin = function (inp, minOut) {
  return Math.max(Math.round(inp), minOut)
}

window.roundMax = function (inp, maxOut) {
  return Math.min(Math.round(inp), maxOut)
}

// ---------------------------------------------------------------------------------------------------
window.minMaxObj = function (optIn) {
  var func = optIn.func
  if (typeof optIn.func === 'string') {
    func = function (d) {
      return d[optIn.func]
    }
  }

  var mapped = optIn.data.map(func)
  if (hasVar(optIn.filt)) mapped = mapped.filter(optIn.filt)

  var minMaxFunc = optIn.minMax === 'max' ? Math.max : Math.min

  if (mapped.length === 0) return hasVar(optIn.defVal) ? optIn.defVal : null

  return mapped.reduce(function (a, b) {
    return minMaxFunc(a, b)
  })
}

// ---------------------------------------------------------------------------------------------------
// PLACEHOLDER FUNCTIONS for coordinates
// ---------------------------------------------------------------------------------------------------
// - degree to DMS comversion
// ---------------------------------------------------------------------------------------------------

window.degToDms = function (valIn) {
  // var sign  = (valIn > 0) ? 1 : -1;
  // valIn    *= sign;// log(valIn)
  var deg = valIn | 0 // truncate dd to get degrees
  var frac = Math.abs(valIn - deg) // get fractional part
  var min = (frac * 60) | 0 // multiply fraction by 60 and truncate
  var sec = frac * 3600 - min * 60
  return [deg, min, sec]
}
var degToDms = window.degToDms

window.dmsToDeg = function (valIn) {
  var sign = valIn[0] > 0 ? 1 : -1
  return valIn[0] + sign * valIn[1] / 60 + sign * valIn[2] / 3600
}
// var dmsToDeg = window.dmsToDeg

window.degToHms = function (valIn) {
  var scale = 24 / 360
  var valOut = degToDms(valIn * scale)
  // console. log('---',valIn,valOut)
  return valOut
}
// var degToHms = window.degToHms

window.azimToRa = function (valIn) {
  // return valIn;

  var valOut = valIn
  valOut += 60
  if (valOut > 180) valOut -= 360
  else if (valOut < -180) valOut += 360 // for debug
  return valOut
}

// window.raDecToLongLat = function (valIn) {
//   return [hmsToDeg(valIn[0]), dmsToDeg(valIn[1])]
// }
// var hmsToDeg = window.hmsToDeg

// window.longLatToRaDec = function (valIn) {
//   return [degToHms(valIn[0]), degToDms(valIn[1])]
// }

// ---------------------------------------------------------------------------------------------------

// // ===================================================================================================
// // ---------------------------------------------------------------------------------------------------
// // register a div to listen to zooming on the condition dfined by intgrCondFunc, and trigger
// // the function exeFunc with an on off (+-1) argument if zooming in or out
// // ---------------------------------------------------------------------------------------------------
// function setZoomList(targetDiv,exeFunc,intgrCondFunc) {
//   var timeWheel  = 100;
//   var countWheel = 0;
//   var prevWheel  = -1;
//   var wheelEvt   = ('onwheel' in document) ? 'wheel' : (('onmousewheel' in document) ? 'mousewheel' : 'DOMMouseScroll');

//   // call a function on wheelEvt, and return false in order to disables the normal scrolling behaviour
//   $("#"+targetDiv).on(wheelEvt,function() {
//     if(intgrCondFunc()) { //!isMouseMoving
//       doIntMouse();
//       return false;
//     }
//   });

//   // ---------------------------------------------------------------------------------------------------
//   // integrate the change in the mouse wheel over a continuous time period, sampled every timeWheel
//   // ---------------------------------------------------------------------------------------------------
//   var checkSetZoom = setInterval(function(){ checkSetZoomFunc(); }, timeWheel);

//   function checkSetZoomFunc() {
//     if(prevWheel < 0) return;

//     var timeDif = Date.now() - prevWheel;
//     if(timeDif > timeWheel) {
//       exeFunc( ((countWheel > 0) ? 1 : -1) );

//       countWheel =  0;
//       prevWheel  = -1;
//     }
//     return;
//   }

//   // ---------------------------------------------------------------------------------------------------
//   // add to the countWheel counter - integrates the mouse scroling over a period of up to timeWheel
//   // ---------------------------------------------------------------------------------------------------
//   function doIntMouse(){
//     countWheel += (event.detail<0) ? 1 : (event.wheelDelta>0) ? 1 : -1;;
//     prevWheel   = Date.now();
//     return;
//   };

//   // keep track of mouse movement - [isMouseMoving -> false] if there is no movement for at least mouseMinStop
//   // ---------------------------------------------------------------------------------------------------
//   // var mouseMinStop  = 500, isMouseMoving = false;
//   // $('body').onEnd('mousemove', function(e) { isMouseMoving = false; }, mouseMinStop);
//   // $('body').on   ('mousemove', function(e) { isMouseMoving = true;  }              );
// }
// // ===================================================================================================
// // ---------------------------------------------------------------------------------------------------
// // prevent focused (pressed) buttons from staying focused
// // ---------------------------------------------------------------------------------------------------
// $(".btn").hover(function(){
//     $(this).blur();
// })

// // ---------------------------------------------------------------------------------------------------
// // add a linear gradiant which may be used for filling stuff
// // see: http://dev.mikamai.com/post/86583300944/using-svg-gradient-masks-with-d3js
// // example:
// //       var optGrad        = {};
// //       optGrad.d3G     = d3G;
// //       optGrad.gradTag = "maskGrad";
// //       optGrad.gradXY  = {'x1':'0', 'x2':'1', 'y1':'0', 'y2':'0'};
// //       optGrad.grad01  = {'start':'70%', 'end':'100%'};
// //       addLinGrad(optGrad);
// //       mask.enter().append("mask").attr("id", function(d){ return maskId(d); })
// //                   .append("rect").style({"fill":"url(#"+gradTag+")", "x":"0", "y":(-txtH), "width":(txtW*0.9), "height":(txtH*2)})
// // ---------------------------------------------------------------------------------------------------

// function addLinGrad(optIn) {
//   var d3G     = optIn.d3G;
//   var gradTag = optIn.gradTag;
//   var gradXY  = optIn.gradXY;
//   var grad01  = optIn.grad01;

//   if(d3G.selectAll("linearGradient."+gradTag)[0].length != 0) return;

//   if(d3G.selectAll("defs")[0].length == 0) d3G.append("defs");

//   d3G.selectAll("defs").append("linearGradient")
//                        .attr("id", gradTag).attr(gradXY)
//                        .classed(gradTag,true) // class not really defined; just used for removal selection
//                        // .each(function(d){ d.linearGradientId = gradTag; })
//                        .call(function(grad) {
//                          if(grad01["-1"]) grad.append("stop").attr({'offset':grad01["-1"], "stop-color":"white", "stop-opacity":"0"});
//                          if(grad01["0"])  grad.append("stop").attr({'offset':grad01["0"],  "stop-color":"white", "stop-opacity":"1"});
//                          if(grad01["1"])  grad.append("stop").attr({'offset':grad01["1"],  "stop-color":"white", "stop-opacity":"0"});
//                        });

//   // d3G .append('defs')
//   //     .call(function(defs) {
//   //       defs.append('linearGradient')
//   //           .attr('id', gradTag).attr(gradXY)
//   //           .call(function(grad) {
//   //             if(grad01["-1"]) grad.append('stop').attr({'offset':grad01["-1"], 'stop-color':'white', 'stop-opacity':'0'});
//   //             if(grad01["0"])  grad.append('stop').attr({'offset':grad01["0"],  'stop-color':'white', 'stop-opacity':'1'});
//   //             if(grad01["1"])  grad.append('stop').attr({'offset':grad01["1"],  'stop-color':'white', 'stop-opacity':'0'});
//   //           });
//   //     });
//   // console.log('1',d3G.selectAll('linearGradient'),d3G.selectAll('linearGradient.tbl0_M_13maskGradId') )

// }
// function rmLinGrad(optIn) {
//   var d3G     = optIn.d3G;
//   var gradTag = optIn.gradTag;

//   setTimeout(function () { d3G.selectAll("linearGradient."+gradTag).remove(); }, timeD.animArc*2);
// }
