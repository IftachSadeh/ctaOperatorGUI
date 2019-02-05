/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global getColorTheme */
/* global deepCopy */
/* global minMaxObj */
/* global loadScript */
/* global colsBlues */
/* global colsYellows */
/* global ScrollForm */
/* global Locker */
/* global RunLoop */

loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollForm.js' })

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.BlockForm = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  let template = {
    main: {
      tag: 'blockFormTag',
      g: undefined,
      scroll: {},
      box: {x: 0, y: 0, w: 1000, h: 300, marg: 0},
      background: {
        fill: colorTheme.brighter.background,
        stroke: colorTheme.brighter.stroke,
        strokeWidth: 0.5
      }
    },
    data: {
      blocks: undefined
    },
    debug: {
      enabled: false
    },
    input: {
      over: {
        schedBlocks: undefined,
        block: undefined
      },
      focus: {
        schedBlocks: undefined,
        block: undefined
      }
    }
  }
  let com = {}
  com = optIn

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function init () {

  }
  this.init = init

  function update () {
    console.log(com.data.block);
    if (!com.data.block) return
    createBPropertiesList()
    createBlocksInfoPanel()
  }
  this.update = update

  function setBlock (b) {
    com.data.block = b
    update()
  }
  this.setBlock = setBlock

  function createBPropertiesList () {
    let b = com.data.block
    let startHS = {
      style: {'default': 'info'},
      format: 'info',
      key: 'Start',
      value: b.startTime,
      event: {},
      childs: []
    }
    let durHS = {
      style: {'default': 'info'},
      format: 'info',
      key: 'Duration',
      value: b.duration,
      event: {},
      childs: []
    }
    let endHS = {
      style: {'default': 'info'},
      format: 'info',
      key: 'End',
      value: b.endTime,
      event: {},
      childs: []
    }
    let startS = {
      style: {'default': 'info'},
      format: 'info',
      key: '',
      value: b.startTime,
      event: {},
      childs: []
    }
    let durS = {
      style: {'default': 'info'},
      format: 'info',
      key: '',
      value: b.duration,
      event: {},
      childs: []
    }
    let endS = {
      style: {'default': 'info'},
      format: 'info',
      key: '',
      value: b.endTime,
      event: {},
      childs: []
    }
    let time = {
      key: 'Time',
      format: 'plainText',
      style: {'default': 'subTitle'},
      childs: [[[startHS, durHS, endHS], [startS, durS, endS]]]
    }

    let exeState = {
      key: 'Execution State',
      format: 'plainText',
      style: {'default': 'subTitle'},
      childs: []
    }
    exeState.childs.push({
      style: {'default': 'info'},
      format: 'comboList',
      key: 'State',
      value: {
        current: b.exeState.state,
        select: ['wait', 'cancel', 'run']
      },
      event: {
        click: () => {},
        mouseover: () => {},
        mouseout: () => {}
      },
      childs: []
    })
    exeState.childs.push({
      style: {'default': 'info'},
      format: 'comboList',
      key: 'canRun',
      value: {
        current: b.exeState.canRun,
        select: ['true', 'false']
      },
      event: {
        click: () => {},
        mouseover: () => {},
        mouseout: () => {}
      },
      childs: []
    })

    let pointing = {
      key: 'Pointing',
      format: 'plainText',
      style: {'default': 'subTitle'},
      childs: []
    }
    pointing.childs.push({
      style: {'default': 'info'},
      format: 'info',
      key: 'Id',
      value: b.pointingId,
      event: {},
      childs: []
    })
    pointing.childs.push({
      style: {'default': 'info'},
      format: 'info',
      key: 'Name',
      value: b.pointingName,
      childs: []
    })
    pointing.childs.push({
      style: {'default': 'info'},
      format: 'info',
      key: 'Position',
      value: b.pointingPos,
      childs: []
    })

    let telescopes = {
      key: 'Telescopes',
      format: 'plainText',
      style: {'default': 'subTitle'},
      childs: []
    }
    telescopes.childs.push({
      style: {'default': 'info'},
      format: 'list',
      key: '',
      value: b.telIds,
      event: {},
      childs: []
    })

    let root = {title: {}, style: {}, childs: [exeState, time, pointing, telescopes]}
    return root
  }
  function createBlocksInfoPanel () {
    let data = com.data.block
    let dim = com.main.box
    let scrollForm = new ScrollForm({
      main: {
        tag: 'blockScrollForm',
        g: com.main.g,
        box: {x: dim.x, y: dim.y, w: dim.w, h: dim.h},
        colorTheme: colorTheme
      },
      titles: {
        data: [
          {
            title: 'Block: ' + data.metaData.blockName,
            extension: '',
            sortOptions: {

            },
            width: '100%',
            quickScroll: true,
            anchor: 'center'
          }
        ],
        height: '20px'
      },
      quickScroll: {
        enabled: false,
        width: '3%'
      },
      data: {}
    })
    let bPropList = createBPropertiesList(data)
    scrollForm.updateData(bPropList, 'info')
  }
}
