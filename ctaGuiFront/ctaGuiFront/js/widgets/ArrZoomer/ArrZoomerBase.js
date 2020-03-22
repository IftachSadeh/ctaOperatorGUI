// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
// window.load_script({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global sock */
/* global times */
/* global is_def */
/* global dom_add */
/* global run_when_ready */
/* global cols_purples */
/* global do_zoom_to_target */
/* global inst_health_col */
/* global bck_pattern */
/* global cols_blues */
/* global tel_info */
/* global move_node_up */
/* global vor_ploy_func */

window.load_script({
  source: main_script_tag,
  script: '/js/widgets/ArrZoomer/ArrZoomerMain.js'
})
window.load_script({
  source: main_script_tag,
  script: '/js/widgets/ArrZoomer/ArrZoomerMini.js'
})
window.load_script({
  source: main_script_tag,
  script: '/js/widgets/ArrZoomer/ArrZoomerChes.js'
})
window.load_script({
  source: main_script_tag,
  script: '/js/widgets/ArrZoomer/ArrZoomerTree.js'
})
// window.load_script({
//   source: main_script_tag,
//   script: '/js/arr_zoomer/utils_arr_zoomerLens.js'
// })

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerBase = function (opt_in0) {
  let this_top = this
  let my_unique_id = unique()
  let run_loop = opt_in0.run_loop
  let sgv_tag = opt_in0.sgv_tag
  let widget_id = opt_in0.widget_id
  let widget_source = opt_in0.widget_source
  let locker = opt_in0.locker
  let is_south = opt_in0.is_south
  let widget_type = opt_in0.widget_type
  let sock = opt_in0.sock
  let svg = opt_in0.svg
  let lock_init_key = opt_in0.lock_init_key

  let ele_opts = opt_in0.ele_opts
  let do_ele = ele_opts.do_ele
  // let rScale = instruments.rScale

  this_top.hasInit = false

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  let elements = {}
  function get_ele(tag) {
    return elements[tag]
  }
  this_top.get_ele = get_ele

  function set_ele(eleIn, tag) {
    elements[tag] = eleIn
    return
  }
  this_top.set_ele = set_ele


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  let svgD = {}
  this_top.svgD = svgD
  svgD.main = {}
  svgD.mini = {}
  svgD.ches = {}
  svgD.tree = {}
  svgD.lens = {}
  svgD.g_svg = svg.append('g')

  let interpolate01 = d3.interpolate(0, 1)
  this_top.interpolate01 = interpolate01

  let zoomD = {}
  this_top.zoomD = zoomD
  zoomD.target = ''

  let instruments = {}
  this_top.instruments = instruments
  
  instruments.props = {}
  instruments.props0 = {}
  instruments.tauFracs = {}
  instruments.propTitles = {}
  instruments.allIds = []
  instruments.allIds0 = []
  instruments.allProps = []
  instruments.allProps0 = []
  instruments.prop0 = 'health'
  instruments.propTitle0 = 'Health'
  instruments.tauSpace = tau / 50

  instruments.data = {}
  instruments.data.tel = []
  instruments.data.idToIndex = {}
  instruments.data.dataBaseS1 = {}
  instruments.data.propDataS1 = {}
  instruments.data.propParentS1 = {}
  instruments.data.propTitleS1 = {}

  instruments.rScale = {}
  instruments.rScale[0] = {}
  instruments.rScale[1] = {}

  instruments.rScale[0].health0 = 1.1
  instruments.rScale[0].health1 = 1.2
  instruments.rScale[0].health2 = 1.35
  instruments.rScale[0].line0 = 1.2
  instruments.rScale[0].line1 = 1.8
  instruments.rScale[0].percent = 0.6
  instruments.rScale[0].label = 1.95
  instruments.rScale[0].title = 2.05

  instruments.rScale[1].health0 = 1.5
  instruments.rScale[1].health1 = 1.65
  instruments.rScale[1].innerH0 = 1.25
  instruments.rScale[1].innerH1 = 1.3

  this_top.siteScale = is_south ? 4 / 9 : 1
  
  this_top.teleR = { s00: [12, 13, 14, 14] }
  this_top.teleR.s00 = this_top.teleR.s00.map(
    function(x) { return x * this_top.siteScale }
  )

  let tel_typeV = tel_info.get_ids()

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  let lock_init_keys = {
    main: 'in_arr_zoomerInitMain' + my_unique_id,
    ches: 'in_arr_zoomerInitChes' + my_unique_id,
    mini: 'in_arr_zoomerInitMini' + my_unique_id,
    tree: 'in_arr_zoomerInitTree' + my_unique_id,
    lens: 'in_arr_zoomerInitLens' + my_unique_id,
  }
  this_top.lock_init_keys = lock_init_keys

  let init_ele_keys = []
  $.each(do_ele, function(i, d) {
    if (d)   {
      init_ele_keys.push(lock_init_keys[i])
      locker.add(lock_init_keys[i])
    }
  })

  run_when_ready({
    pass: function () {
      return locker.are_free(init_ele_keys)
    },
    execute: function () {
      locker.remove(lock_init_key)
    }
  })


  // // ------------------------------------------------------------------
  // // 
  // // ------------------------------------------------------------------
  // function isTelTypeIn(tag, tel_Id) {
  //   let tel_types_ele = {
  //     main: ['LST'],
  //   }

  //   let telIndex = tel_types_ele[tag].indexOf(this_top.tel_types[tel_Id])
  //   return (telIndex !== -1)
  // }
  // this_top.isTelTypeIn = isTelTypeIn


  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function initInstProps (data_in) {
    let tel_prop_types = data_in.tel_prop_types
    
    instruments.allProps0.push(instruments.prop0)
    instruments.allIds0.push('')
    instruments.props[''] = []
    instruments.props0[''] = [instruments.prop0]
    instruments.propTitles[''] = {}

    // --FIXME-- currently sorting by the property name, but
    // should actually be by property title ...
    function propSort (arr_in) {
      arr_in.sort().sort(function (a, b) {
        if (a === instruments.prop0) return -1
        else return 1
      })
    }
    function propSortV (arr_inV) {
      $.each(arr_inV, function (i, arrNow) {
        propSort(arrNow)
      })
    }

    $.each(tel_prop_types, function (id_now, typeV) {
      // if (!isTelTypeIn('main', id_now)) return
      // console.log(isTelTypeIn('main', id_now),id_now, typeV)

      instruments.props[id_now] = []
      instruments.props0[id_now] = [instruments.prop0]
      instruments.propTitles[id_now] = {}

      instruments.allIds.push(id_now)
      instruments.allIds0.push(id_now)

      $.each(typeV, function (i, type_now) {
        instruments.props[id_now].push(type_now.id)
        instruments.props0[id_now].push(type_now.id)
        instruments.propTitles[id_now][type_now.id] = type_now.title

        if (instruments.props[''].indexOf(type_now.id) === -1) {
          instruments.props[''].push(type_now.id)
          instruments.props0[''].push(type_now.id)
          instruments.propTitles[''][type_now.id] = type_now.title
        }

        if (instruments.allProps.indexOf(type_now.id) === -1) {
          instruments.allProps.push(type_now.id)
          instruments.allProps0.push(type_now.id)
        }
      })
      propSortV([instruments.props[id_now], instruments.props0[id_now]])

      instruments.propTitles[id_now][instruments.prop0] = instruments.propTitle0
      instruments.tauFracs[id_now] = tau / instruments.props[id_now].length
      instruments.propTitles[''][instruments.prop0] = instruments.propTitle0
    })
    instruments.tauFracs[''] = tau / instruments.props[''].length

    propSortV([instruments.props[''], instruments.props0[''], instruments.allProps, instruments.allProps0])

    instruments.props['avg'] = instruments.props[''] // .slice()
    instruments.props0['avg'] = instruments.props0[''] // .slice()
    instruments.tauFracs['avg'] = instruments.tauFracs['']

    return
  }



  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function setTelData (data_in, isInit) {
    if (isInit) {
      instruments.data.tel = []
      instruments.data.avg = {}
      instruments.data.idToIndex = {}
    }

    $.each(data_in, function (id, data_now) {
      // if (!isTelTypeIn('main', id)) {
      //   console.log(id,data_now)
      // }
      // if (!isTelTypeIn('main', id)) return
      
      // console.log('==',id,data_now)
      let telD = {}
      telD.id = id

      $.each(instruments.props0[telD.id], function (index, porpNow) {
        telD[porpNow] = is_def(data_now[porpNow])
          ? Math.round(data_now[porpNow])
          : 0
      })

      if (isInit) {
        instruments.data.idToIndex[id] = instruments.data.tel.length
        instruments.data.tel.push(telD)
      } else {
        let origIndex = instruments.data.idToIndex[id]
        instruments.data.tel[origIndex] = telD
      }
    })

    // average of each property
    instruments.data.avg.id = 'avg'
    let propsNow = instruments.props0[instruments.data.avg.id]
    $.each(propsNow, function (index, porpNow) {
      instruments.data.avg[porpNow] = 0
      $.each(instruments.data.tel, function (id, data_now) {
        // console.log('    ++',id,porpNow,data_now[porpNow])
        if (
          data_now[porpNow] !== undefined &&
          typeof data_now[porpNow] === 'number'
        ) {
          instruments.data.avg[porpNow] += data_now[porpNow]
        }
      })
      // console.log('--',porpNow,instruments.data.avg[porpNow] , instruments.data.tel.length)
      instruments.data.avg[porpNow] /= instruments.data.tel.length
    })
    // console.log('SSS-------------SS',instruments.data, instruments.props0)

    return
  }
  this_top.setTelData = setTelData


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function getTelProps (keys, tel_Id) {
    return keys.filter(function (k) {
      return instruments.props[tel_Id].indexOf(k) !== -1
    })
  }
  this_top.getTelProps = getTelProps
  
  function getTauFrac (nProps) {
    return tau / nProps
  }
  this_top.getTauFrac = getTauFrac

  function getPropPosShift (xy, r, n_prop_now, nProps) {
    let angle = (n_prop_now + 0.5) * getTauFrac(nProps) + tau / 4
    let labelX = r * Math.cos(angle)
    let labelY = r * Math.sin(angle)

    if (xy === 'x') return labelX
    if (xy === 'y') return labelY
    else if (xy === 'xy') return [labelX, labelY]
    else return null
  }
  this_top.getPropPosShift = getPropPosShift

  zoomD.len = {}
  zoomD.len['0.0'] = 1
  if (is_south) {
    zoomD.len['0.1'] = 2 // - 0.4
    zoomD.len['0.2'] = 12 // - 4
    zoomD.len['1.0'] = 15 // - 6
    zoomD.len['1.1'] = zoomD.len['1.0'] + 0.1
    zoomD.len['1.2'] = zoomD.len['1.0'] + 2
    zoomD.len['1.3'] = 20
    // zoomD.len["0.1"]  = 4  //- 4
    // zoomD.len["0.2"]  = 10 //- 15.5
    // zoomD.len["1.0"]  = 12 //- 16.5
    // zoomD.len["1.1"]  = zoomD.len["1.0"] + 0.1
    // zoomD.len["1.2"]  = zoomD.len["1.0"] + 2
    // zoomD.len["1.3"]  = 90
  } else {
    zoomD.len['0.1'] = 2 // - 0.4
    zoomD.len['0.2'] = 5 // - 4
    zoomD.len['1.0'] = 6.5 // - 6
    zoomD.len['1.1'] = zoomD.len['1.0'] + 0.1
    zoomD.len['1.2'] = zoomD.len['1.0'] + 1
    zoomD.len['1.3'] = 9
  }
  zoomD.len.prev = zoomD.len['0.0']

  zoomD.scaleExtent = [zoomD.len['0.0'], zoomD.len['1.3']]

  function isStateUp (scale, scaleTag) {
    return zoomD.len.prev < zoomD.len[scaleTag] && scale >= zoomD.len[scaleTag]
  }
  this_top.isStateUp = isStateUp

  function isStateDown (scale, scaleTag) {
    return zoomD.len.prev >= zoomD.len[scaleTag] && scale < zoomD.len[scaleTag]
  }
  this_top.isStateDown = isStateDown

  function isStateChange (scale, scaleTag) {
    return isStateUp(scale, scaleTag) || isStateDown(scale, scaleTag)
  }
  this_top.isStateChange = isStateChange

  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function init_data (data_in) {
    this_top.tel_types = data_in.tel_types

    initInstProps(data_in)

    setTelData(data_in.arrProp, true)

    // arbitrary but safe initialization of target
    zoomD.target = instruments.data.tel[0].id 


    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function addUserOpts(opt_in, eleTag) {
      if (!is_def(ele_opts[eleTag])) return

      $.each(ele_opts[eleTag], function(i, d) {
        opt_in[i] = d
      })

      return
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    let ele_optsMain = {
      run_loop: run_loop,
      sgv_tag: sgv_tag,
      widget_id: widget_id,
      locker: locker,
      is_south: is_south,
      my_unique_id: my_unique_id,
      noRender: !do_ele.main,
      widget_type: widget_type,
      eleBase: this_top,
    }
    addUserOpts(ele_optsMain, 'main')
    
    let eleMain = new ArrZoomerMain(ele_optsMain)
    eleMain.init_data(data_in)

    if (do_ele.main) {
      if(is_def(ele_opts.trans.main)) {
        eleMain.setTransform(ele_opts.trans.main)
      }
    }
    
    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (do_ele.tree) {
      let ele_optsTree = {
        run_loop: run_loop,
        sgv_tag: sgv_tag,
        widget_id: widget_id,
        locker: locker,
        is_south: is_south,
        my_unique_id: my_unique_id,
        eleBase: this_top,
      }      
      addUserOpts(ele_optsTree, 'tree')
      
      let eleTree = new ArrZoomerTree(ele_optsTree)
      eleTree.init_data(data_in)

      if(is_def(ele_opts.trans.tree)) {
        eleTree.setTransform(ele_opts.trans.tree)
      }
    }
    
    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (do_ele.ches) {
      let ele_optsChes = {
        run_loop: run_loop,
        sgv_tag: sgv_tag,
        widget_id: widget_id,
        locker: locker,
        is_south: is_south,
        eleBase: this_top,
      }
      addUserOpts(ele_optsChes, 'ches')

      let eleChes = new ArrZoomerChes(ele_optsChes)
      eleChes.init_data({
        instrumentData: {
          tel: instruments.data.tel,
          // mini: instruments.data.mini,
          // xyr: instruments.data.xyr,
          vorDblclick: instruments.data.dblclick
        },
        tel_typeV: tel_typeV
      })

      if(is_def(ele_opts.trans.ches)) {
        eleChes.setTransform(ele_opts.trans.ches)
      }
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (do_ele.mini) {
      let ele_optsMini = {
        run_loop: run_loop,
        sgv_tag: sgv_tag,
        widget_id: widget_id,
        locker: locker,
        is_south: is_south,
        my_unique_id: my_unique_id,
        eleBase: this_top,
      }
      addUserOpts(ele_optsMini, 'mini')
      
      let eleMini = new ArrZoomerMini(ele_optsMini)
      eleMini.init_data({
        instrumentData: {
          tel: instruments.data.tel,
          vor: { data: instruments.data.vor.data },
          xyrPhysical: instruments.data.mini,
          // xyr: instruments.data.xyr,
          vorDblclick: instruments.data.dblclick
        },
        tel_typeV: tel_typeV
      })

      if(is_def(ele_opts.trans.mini)) {
        eleMini.setTransform(ele_opts.trans.mini)
      }
    }

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    if (do_ele.lens) {
      let ele_optsLens = {
        run_loop: run_loop,
        sgv_tag: sgv_tag,
        widget_id: widget_id,
        locker: locker,
        is_south: is_south,
        my_unique_id: my_unique_id,
        eleBase: this_top,
        isLens: 1,
        staticZoom: false,
      }
      addUserOpts(ele_optsLens, 'lens')
      
      let eleLens = new ArrZoomerMini(ele_optsLens)
      eleLens.init_data({
        instrumentData: {
          tel: instruments.data.tel,
          vor: { data: instruments.data.vor.data },
          xyrPhysical: instruments.data.lens,
          // xyr: instruments.data.xyr,
          vorDblclick: instruments.data.dblclick
        },
        tel_typeV: tel_typeV
      })

      if(is_def(ele_opts.trans.lens)) {
        eleLens.setTransform(ele_opts.trans.lens)
      }


      // let ele_optsLens = {
      //   run_loop: run_loop,
      //   sgv_tag: sgv_tag,
      //   widget_id: widget_id,
      //   locker: locker,
      //   is_south: is_south,
      //   my_unique_id: my_unique_id,
      //   eleBase: this_top,
      // }      
      // addUserOpts(ele_optsLens, 'lens')
      
      // let eleLens = new arr_zoomerLens(ele_optsLens)
      // eleLens.init_data(data_in)

      // if(is_def(ele_opts.trans.lens)) {
      //   eleLens.setTransform(ele_opts.trans.lens)
      // }
    }

    return
  }
  this_top.init_data = init_data


  // ------------------------------------------------------------------
  //
  // for s0 we acculumate all updates (each one is a 
  // subset of all elements which had some change)
  // for s1 we take ony the latest update (each one 
  // is a full update of all the data)
  // ------------------------------------------------------------------
  run_loop.init({
    tag: '_s00update_'+my_unique_id, 
    func: updateS0, 
    n_keep: -1, 
    wait: 500,
  })
  run_loop.init({
    tag: '_s11update_'+my_unique_id, 
    func: updateS1, 
    n_keep: 1, 
    wait: 500,
  })
  run_loop.init({
    tag: 'subArrUpdate'+my_unique_id,
    func: subArrUpdate,
    n_keep: 1,
    wait: 500,
  })

  function update_data (data_in) {
    if (!locker.is_free('inInit')) return

    if (data_in.type === 's00') {
      run_loop.push({ tag: '_s00update_'+my_unique_id, data: data_in })
    } 
    else if (data_in.type === 's11') {
      run_loop.push({ tag: '_s11update_'+my_unique_id, data: data_in })
    } 
    else if (data_in.type === 'subArr') {
      run_loop.push({ tag: 'subArrUpdate'+my_unique_id, data: data_in })
    } 
    else {
      console.error('undefined tag for data_in = ', data_in, ' !!!!!! ')
    }
  }
  this_top.update_data = update_data

  // ------------------------------------------------------------------
  // update the data for s0
  // ------------------------------------------------------------------
  function updateS0 (data_in) {
    if (!locker.are_free(['zoom', 'autoZoomTarget', 'dataChange'])) {
      // console.log('delay-s0 ....',data_in.type,data_in.emit_time )
      setTimeout(function () {
        updateS0(data_in)
      }, 10)
      return
    }
    // console.log('do   -s0 ....',data_in.type,data_in.emit_time )

    locker.add('dataChange')

    // ------------------------------------------------------------------
    // fill the updated properties (accumilate all updates in order,
    // so that if some id was updated multiple times,
    // the latest value will be kept
    // ------------------------------------------------------------------
    setTelData(data_in.data, false)

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    setState()

    locker.remove('dataChange')
    // locker.remove({id:"dataChange",delay:1500}); // for testing... never delay this...
  }

  // ------------------------------------------------------------------
  // update the data for s1
  // ------------------------------------------------------------------
  function updateS1 (dataDictIn) {
    if (get_ele('main').getZoomS() === 0) return

    if (!locker.are_free(['zoom', 'autoZoomTarget', 'dataChange'])) {
      setTimeout(function () {
        updateS1(dataDictIn)
      }, 10)
      return
    }

    let data_in = dataDictIn.data
    let updtData = data_in.data
    let tel_Id = data_in.id
    let telIndex = instruments.data.idToIndex[tel_Id]

    // if by the time the update has arrived, 
    // were already gone from this element...
    if (!is_def(instruments.data.propDataS1[tel_Id])) {
      // console.log('-+-> updateS1: could not find',tel_Id,'in instruments.data.propDataS1')
      return
    }
    // console.log('````',data_in,instruments.data.propDataS1[tel_Id]);

    locker.add('dataChange')

    // ------------------------------------------------------------------
    // update the underlying data
    // ------------------------------------------------------------------
    let propsNow = getTelProps(
      Object.keys(instruments.data.propDataS1[tel_Id]), tel_Id)
    
    $.each(propsNow, function (index, porpNow) {
      // update the data container with the s0 updated health
      instruments.data.propDataS1[tel_Id][porpNow].val = instruments.data.tel[telIndex][porpNow]

      // now go through the hirch
      let data_now = instruments.data.propDataS1[tel_Id][porpNow]
      update_data_now(data_now)

      function update_data_now (d) {
        if (is_def(updtData[d.id])) {
          d.val = updtData[d.id]
          // console.log('upddd',d.id,d)
        }
        if (d.children) {
          d.children.forEach(function (dNow) {
            update_data_now(dNow)
          })
        }
        // no need to explicitly change the d[childName] element, since it is just a pointer to d[children]
        // let childName = "child_"+d.childDepth
        // if(d[childName]) {
        //   d[childName].forEach(function(dNow) { update_data_now(dNow); })
        // }
      }
    })

    get_ele('main').updateS1(data_in)
    if (get_ele('tree')) {
      get_ele('tree').updateS1(data_in)
    }

    locker.remove('dataChange')
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function subArrUpdate (data_in) {
    if (!locker.are_free(['zoom', 'autoZoomTarget', 'dataChange'])) {
      setTimeout(function () {
        subArrUpdate(data_in)
      }, 10)
      return
    }

    get_ele('main').set_tel_layout({ 
      id: 'subArr', data: data_in.data, updtId: false,
    })

    return
  }

  function set_tel_layout (id_now) {
    get_ele('main').set_tel_layout({
      id: id_now, data: null, updtId: true, 
    })
  }
  this_top.set_tel_layout = set_tel_layout

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  run_loop.init({ tag: 'setState'+my_unique_id, func: setStateOnce, n_keep: 1 })

  function setState () {
    run_loop.push({ tag: 'setState'+my_unique_id })
  }
  this_top.setState = setState

  function setStateOnce () {
    // create delay if currently in data update or a previous call of setStateOnce
    if (!locker.are_free(['setStateLock', 'dataChange'])) {
      // console.log('delay setStateOnce',' :',locker.is_free({id:"setStateLock"}),' - data_updateate:',locker.is_free({id:"setStateLock"}))
      setTimeout(function () {
        setState()
      }, times.anim_arc)
      return
    }
    // console.log("setState");

    locker.add('setStateLock')

    get_ele('main').setStateOnce()
    if (get_ele('tree')) {
      get_ele('tree').setStateOnce()
    }
    if (get_ele('mini')) {
      get_ele('mini').setStateOnce()
    }
    if (get_ele('lens')) {
      get_ele('lens').setStateOnce()
    }
    if (get_ele('ches')) {
      get_ele('ches').setStateOnce()
    }

    locker.remove({ id: 'setStateLock', delay: times.anim_arc * 2 })
  }

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  run_loop.init({ tag: '_s1props_'+my_unique_id, func: propsS1Once, n_keep: -1 })

  function propsS1 (opt_in) {
    // console.log('setState',get_ele('main').getZoomS(),getScale())
    run_loop.push({ tag: '_s1props_'+my_unique_id, data: opt_in })
  }
  // this.propsS1 = propsS1;
  this_top.propsS1 = propsS1

  function propsS1Once (opt_in) {
    // not sure i need "dataChange" or others here .... FIXME
    if (!locker.are_free(['s1propsChange', 'dataChange'])) {
      // console.log('delay propsS1Once....')
      propsS1(opt_in)
      return
    }

    locker.add('s1propsChange')

    let doFunc = opt_in.doFunc
    let doBckArcClick = is_def(doFunc)
      ? doFunc.indexOf('bckArcClick') >= 0
      : true
    let doTelHirch = is_def(doFunc) ? doFunc.indexOf('telHirch') >= 0 : true

    if (get_ele('tree')) {
      if (doTelHirch) get_ele('tree').telHirch(opt_in)
    }

    if (doBckArcClick) {
      opt_in.canIgnore = false
      get_ele('main').bckArcClick(opt_in)
    }

    locker.remove('s1propsChange')
  }

  // ------------------------------------------------------------------
  // activate a listener for getting the s1 data - this is needed 
  // in case the same data are sent more
  // then once (can happen if one element is requested, but 
  // by the time the transitions to open it
  // has ended, another was already requested too).
  // ------------------------------------------------------------------
  run_loop.init({ tag: '_get_data_s1_'+my_unique_id, func: get_data_s1_once, n_keep: 1 })

  function get_data_s1 (widget_id_in, data_in) {
    // just in case... should not be needed
    if (widget_id_in !== widget_id) {
      console.error('id mismatch', widget_id_in, widget_id)
      return
    }
    // console.log('-client- get_data_s1',data_in)

    if (get_ele('main').getZoomS() === 1) {
      run_loop.push({ tag: '_get_data_s1_'+my_unique_id, data: data_in })
    }
  }
  this_top.get_data_s1 = get_data_s1

  function get_data_s1_once (data_in) {
    if (
      get_ele('main').getZoomS() === 1 &&
      get_ele('main').syncD.zoom_target !== data_in.data.id
    ) {
      get_ele('main').syncD.zoom_target = data_in.data.id

      get_ele('main').s10main(data_in.data)

      propsS1({
        tel_Id: data_in.data.id,
        clickIn: false,
        propIn: '',
        doFunc: ['bckArcClick'],
        debug: 'get_data_s1_once'
      })
    }
  }

  












  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  let prev_sync = {}
  function get_sync_state (data_in) {
    if (document.hidden) return
    if (sock.con_stat.is_offline()) return

    let sess_widget_ids = data_in.sess_widget_ids
    if (sess_widget_ids.indexOf(widget_id) < 0 || widget_id === data_in.widget_id) {
      return
    }

    if (sock.is_old_sync(prev_sync, data_in.data)) return
    // console.log('get  -=- ',widget_id,data_in.data,prev_sync[ data_in.type]);

    prev_sync[data_in.type] = data_in.data

    let type = data_in.type
    if (type === 'syncTelFocus') {
      // locker.add("get_sync_state");

      let target = data_in.data.target
      let zoom_state = data_in.data.zoom_state

      let scale = zoomD.len['0.0']
      if (zoom_state === 1) scale = zoomD.len['1.0']

      get_ele('main').zoomToTrgMain({
        target: target,
        scale: scale,
        duration_scale: 1,
        endFunc: function () {
          // locker.remove("get_sync_state");
          get_ele('main').ask_dataS1()
        }
      })
    }

    return
  }
  this_top.get_sync_state = get_sync_state

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  run_loop.init({
    tag: 'sync_state_send'+my_unique_id,
    func: _sync_state_send,
    n_keep: 1,
    wait: times.wait_sync_state
  })

  function sync_state_send (data_in) {
    run_loop.push({ tag: 'sync_state_send'+my_unique_id, data: data_in })
  }
  this_top.sync_state_send = sync_state_send

  function _sync_state_send (data_in) {
    if (sock.con_stat.is_offline()) return

    if (data_in.type === 'syncTelFocus') {
      if (
        !locker.are_free([
          'inInit',
          'zoom',
          'autoZoomTarget',
          'setStateLock',
          'dataChange'
        ])
      ) {
        setTimeout(function () {
          sync_state_send(data_in)
        }, times.anim_arc)
        return
      }

      if (sock.is_same_sync(prev_sync, data_in)) return
    }

    // console.log('send -=- ',widget_id,data_in,prev_sync[ data_in.type]);
    prev_sync[data_in.type] = data_in
    sock.sock_sync_state_send({
      widget_id: widget_id,
      type: data_in.type,
      data: data_in
    })

    return
  }

  // ------------------------------------------------------------------
  // ask for update for state1 data for a given module
  // ------------------------------------------------------------------
  function sockAskDataS1 (opt_in) {
    if (sock.con_stat.is_offline()) return

    let data = {}
    data.widget_id = widget_id
    data.zoom_state = opt_in.zoom_state
    data.zoom_target = opt_in.zoom_target

    let emit_data = {
      widget_source: widget_source,
      widget_name: widget_type,
      widget_id: widget_id,
      method_name: 'arr_zoomer_ask_data_s1',
      method_arg: data,
    }

    sock.socket.emit('widget', emit_data)

    return
  }
  this_top.sockAskDataS1 = sockAskDataS1


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  function setZoomState () {
    if (sock.con_stat.is_offline()) return

    let mainWidgetState = get_ele('main').getWidgetState()
    
    let treeWidgetState = {}
    if (get_ele('tree')) {
      treeWidgetState = get_ele('tree').getWidgetState()
    } 
    else {
      function getWidgetState () {
        return {
          zoom_targetProp: '',
        }
      }
      treeWidgetState['zoom_targetProp'] = getWidgetState()
    }

    let dataWidget = {}
    dataWidget.widget_id = widget_id
    dataWidget.zoom_state = mainWidgetState.zoom_state
    dataWidget.zoom_target = mainWidgetState.zoom_target
    dataWidget.zoom_targetProp = treeWidgetState.zoom_targetProp

    let emit_data = {
      widget_source: widget_source,
      widget_name: widget_type,
      widget_id: widget_id,
      method_name: 'arr_zoomer_set_widget_state',
      method_arg: dataWidget
    }

    sock.socket.emit('widget', emit_data)

    return
  }
  this_top.setZoomState = setZoomState

  // ------------------------------------------------------------------
  // get update for state1 data which was explicitly asked for by a given module
  // ------------------------------------------------------------------
  sock.socket.on('arr_zoomer_get_data_s1', function (data) {
    if (sock.con_stat.is_offline()) return

    if (data.id !== '' && data.type === 's11') {
      // console.log('-server- get_data_s1 ',data);
      if (is_def(sock.all_widgets[widget_type].widgets[data.widget_id])) {
        this_top.get_data_s1(data.widget_id, data)
      }
    }
  })

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  sock.socket.on('arr_zoomer_update_data', function (data) {
    if (sock.con_stat.is_offline()) return

    $.each(sock.all_widgets[widget_type].widgets, function (widget_id_now, module_now) {
      if (data.sess_widget_ids.indexOf(widget_id_now) >= 0) {
        this_top.update_data(data)
      }
    })
  })

  return
}

