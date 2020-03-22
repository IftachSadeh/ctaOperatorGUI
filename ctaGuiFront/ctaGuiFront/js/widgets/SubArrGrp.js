'use strict'
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// stric mode for the following script or function (must come at the very begining!)
// see: http://www.w3schools.com/js/js_strict.asp
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// main_script_tag used locally (will be overriden by other scripts...)
// must be compatible with the name of this js file, according to:
//    "/js/widget_"+main_script_tag+".js"
var main_script_tag = 'SubArrGrp'
// -------------------------------------------------------------------
/* global $ */
/* global d3 */
/* global symbols */
/* global tau */
/* global sock */
/* global times */
/* global is_def */
/* global tel_info */
/* global unit_deg */
/* global RunLoop */
/* global cols_reds */
/* global deg_hms */
/* global deg_dms */
/* global dms_deg */
/* global azim_ra */
/* global this_trans */
/* global unit_arcmin */
/* global unit_arcsec */
/* global Locker */
/* global cols_yellows */
/* global cols_purples */
/* global dom_add */
/* global run_when_ready */
/* global do_zoom_to_target */
/* global find_dict_ele_in_obj */

// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function (opt_in) {
  let x0 = 0
  let y0 = 0
  let h0 = 6
  let w0 = 6
  let divKey = ''

  opt_in.widget_func = { sock_func: sock_sub_arr_grp, main_func: main_sub_arr_grp }
  opt_in.widget_div_id = opt_in.widget_id + 'Widget_div'
  opt_in.ele_props = {}

  divKey = 'skyPos'
  opt_in.ele_props[divKey] = {
    autoPos: true,
    is_dark_ele: true,
    gsId: opt_in.widget_div_id + divKey,
    x: x0,
    y: y0,
    w: w0,
    h: h0,
    content: "<div id='" + opt_in.base_name + divKey + "'></div>"
  }

  y0 += w0

  divKey = 'subArr'
  opt_in.ele_props[divKey] = {
    autoPos: true,
    is_dark_ele: true,
    gsId: opt_in.widget_div_id + divKey,
    x: x0,
    y: y0,
    w: w0,
    h: h0,
    content: "<div id='" + opt_in.base_name + divKey + "'></div>"
  }

  sock.add_to_table(opt_in)
}

// -------------------------------------------------------------------
//
// -------------------------------------------------------------------
let sock_sub_arr_grp = function (opt_in) {
  // let widget_type = opt_in.widget_type;
  // let widget_source = opt_in.widget_source;
  // this.askInitData = function(opt_in) {
  //   let emit_data = {
  //     "widget_source":widget_source, "widget_name":widget_type,
  //     "widget_id":opt_in.widget_id, "method_name":"sub_arr_grp_askInitData"
  //   };
  //   sock.socket.emit("widget", emit_data);
  //   return;
  // }
}

let main_sub_arr_grp = function (opt_in) {
  // let my_unique_id = unique()
  // let widget_type = opt_in.widget_type
  let tag_sub_arr_grpSvg = opt_in.base_name
  let widget_id = opt_in.widget_id
  let widget_ele = opt_in.widget_ele
  let icon_divs = opt_in.icon_divs

  // let this_sub_arr_grp = this
  let is_south = window.__site_type__ === 'S'

  // let sgv_tag = {};
  // $.each(widget_ele, function(index,ele_now) {
  //   sgv_tag[ele_now.id] = { id:tag_arr_zoomerSvg+"_"+ele_now.id, whRatio:(ele_now.w/ele_now.h) };
  // })
  let sgv_tag = {}
  $.each(widget_ele, function (index, ele_now) {
    sgv_tag[ele_now.id] = {
      id: tag_sub_arr_grpSvg + ele_now.id,
      widget: ele_now.widget,
      whRatio: ele_now.w / ele_now.h
    }
  })

  // delay counters
  let locker = new Locker()
  locker.add('inInit')
  locker.add('inInitSubArr')
  locker.add('inInitSkyPos')

  // function loop
  let run_loop = new RunLoop({ tag: widget_id })

  let interpolate01 = d3.interpolate(0, 1)

  let zoom_state = 0
  let telData = {}

  let lenD = {}
  lenD.w = {}
  lenD.h = {}

  lenD.w[0] = 400 // is_south ? 900 : 400;
  lenD.h[0] = lenD.w[0]
  lenD.w[1] = lenD.w[0] * 1.2
  lenD.h[1] = lenD.h[0] * 1.2

  let whFrac = 0.05
  let wh = [lenD.w[1], lenD.h[1]] // wh[0] *= 0.9; wh[1] *= 0.9;
  let whPack = [wh[0] * (1 - whFrac * 2), wh[1] * (1 - whFrac * 2)]

  let isRaDec = false
  let isDHms = false
  let lblDig = 3

  // -------------------------------------------------------------------
  // color
  // -------------------------------------------------------------------
  // see: http://colors.findthedata.com/saved_search/Pastel-Colors
  //      https://www.google.de/design/spec/style/color.html#color-color-palette
  //      http://riccardoscalco.github.io/crayon/
  let stateCol = {}
  stateCol.b = ['#64B5F6']
  stateCol.p = ['#9575CD']
  stateCol.g = ['#b5c69c', '#AED581']
  stateCol.y = ['#fcd975', '#FFEB3B']
  stateCol.r = ['#ed6d6c', '#EF5350']

  let telTrackCol = d3
    .scaleLinear()
    .domain([360, 1])
    .range(['#90CAF9', '#64B5F6'])

  function getColStop () {
    return cols_reds[8]
  }
  function getColSlew (d) {
    return telTrackCol(d)
  }
  function getColTrack () {
    return stateCol.g[0]
  }
  function getColStretchBand () {
    return stateCol.p[0]
  }

  function parsePosTxt (posIn) {
    if (posIn.length === 0) return ''

    let title
    let pos = [posIn[0], posIn[1]]
    if (isRaDec) {
      title = 'RA,Dec: '
      pos[0] = azim_ra(pos[0])
    } else {
      title = symbols.phi + ',' + symbols.delta + ': '
    }

    let data_out
    if (isDHms) {
      let pos1
      if (isRaDec) pos1 = [deg_hms(pos[0]), deg_dms(pos[1])]
      else pos1 = [deg_dms(pos[0]), deg_dms(pos[1])]

      data_out =
        formInpt(pos1[0][0], 0) +
        unit_deg +
        ' ' +
        formInpt(pos1[0][1], 0) +
        unit_arcmin +
        ' ' +
        formInpt(pos1[0][2], 1) +
        unit_arcsec +
        ' , ' +
        formInpt(pos1[1][0], 0) +
        unit_deg +
        ' ' +
        formInpt(pos1[1][1], 0) +
        unit_arcmin +
        ' ' +
        formInpt(pos1[1][2], 1) +
        unit_arcsec

      return (title + data_out).replace(/ /g, '\u00A0')
    } else {
      data_out =
        formInpt(pos[0], lblDig) +
        unit_deg +
        ' , ' +
        formInpt(pos[1], lblDig) +
        unit_deg
      return (title + data_out).replace(/ /g, '\u00A0')
    }
  }
  function formInpt (input, prec) {
    return d3.format(' >' + (prec + 3) + ',.' + prec + 'f')(input)
  }

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  // run_loop.init({ tag:"askInitData", func:_askInitData, n_keep:1 });
  // function askInitData(opt_in) {
  //   run_loop.push({ tag:"askInitData", data:opt_in });
  //   return;
  // }
  // function _askInitData(opt_in) {
  //   // create delay if currently in data update or a previous call of _askInitData
  //   if(!locker.is_free("dataChange")) {
  //     // console.log('delay askInitData')
  //     setTimeout(function () { askInitData(opt_in); }, times.anim_arc*2);
  //     return;
  //   }
  //   // console.log('do askInitData')

  //   sock.all_widgets[widget_type].sock_func.askInitData(opt_in);

  //   return;
  // }

  function init_data (data_init) {
    if (sock.multiple_inits({ id: widget_id, data: data_init })) return

    locker.add('dataChange')

    let data_in = data_init.data
    let hasJoinedData = joinTelProps(data_in, true)

    sock.set_icon_badge({ n_icon: data_init.n_icon, icon_divs: icon_divs })

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    svgSubArr.init_data(hasJoinedData)
    svgSkyPos.init_data(hasJoinedData)

    locker.remove('dataChange')

    setState({ type: 'init_data', data: null })

    run_when_ready({
      pass: function () {
        return locker.are_free([
          'inInitSubArr',
          'inInitSkyPos',
          'dataChange',
          'setState',
          'setFocused'
        ])
      },
      execute: function () {
        locker.remove('inInit')
      }
    })
  }
  this.init_data = init_data

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  run_loop.init({ tag: 'update_data', func: update_dataOnce, n_keep: -1 })

  function update_data (data_in) {
    run_loop.push({ tag: 'update_data', data: data_in.data }) //, time:data_in.emit_time
  }

  function update_dataOnce (data_in) {
    if (
      !locker.are_free([
        'zoom',
        'zoom_to_target',
        'dataChange',
        'setState',
        'setFocused'
      ])
    ) {
      setTimeout(function () {
        update_dataOnce(data_in)
      }, 10)
      return
    }
    // console.log('update_data')
    locker.add('dataChange')

    let hasJoinedData = joinTelProps(data_in, false)

    if (hasJoinedData) {
      svgSubArr.update_data(data_in)
      svgSkyPos.update_data(data_in)
    }

    locker.remove({ id: 'dataChange' })

    setState({ type: 'dataChange', data: null })
  }
  this.update_data = update_data

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  run_loop.init({ tag: 'setState', func: setStateOnce, n_keep: 1 })

  function setState (data_in) {
    run_loop.push({ tag: 'setState', data: data_in })
  }

  function setStateOnce (opt_in) {
    // console.log('SetState');
    // console.log(telData)

    svgSubArr.setStateOnce(opt_in)
    svgSkyPos.setFocused()
  }

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function joinTelProps (data_in, isInit) {
    locker.add('dataChange')

    if (isInit) {
      telData = data_in
      // console.log('xxxxxxxx',data_in);
      // telData = deep_copy(data_in); // deep copy

      telData.idToCol = {}
      telData.idToFocus = {}
      telData.trgPntFocus = { trg: {}, pnt: {} }

      if (!is_def(telData.prevState)) telData.prevState = 0
      if (!is_def(telData.telHover)) telData.telHover = null
    } else {
      if (is_def(data_in.subArr)) {
        telData.subArr = data_in.subArr
        // telData.subArr = deep_copy(data_in.subArr); // deep copy
      }
      // console.log('subArr',telData.subArr)

      $.each(data_in, function (key, data_now0) {
        if (key !== 'subArr') {
          // console. log(key,telData[key])
          $.each(data_now0, function (index, data_now1) {
            let eleV = find_dict_ele_in_obj(telData[key], 'id', data_now1.id, false)

            // console.log('qqqqqqqqq',eleV);
            if (eleV[0] === -1) {
              // console.log("found no original element in update_inst_posPntProps()",data_now1);
              telData[key].push(data_now1)
            } else {
              telData[key][eleV[0]] = data_now1
            }
          })
        }
      })

      // check if there are any trg,pnt elements which are not used by any telescope, and remove them
      $.each(['trg', 'pnt'], function (trgTelIndex, trgTel) {
        let rmV = []
        $.each(telData[trgTel], function (i, d) {
          let target_point_id = d.id
          let eleV = find_dict_ele_in_obj(
            telData.tel,
            trgTel + 'Id',
            target_point_id,
            false
          )

          // add to begning of array, as will need to remove one by one, which will change the length
          if (eleV[0] === -1) rmV.unshift(i)
        })

        // remove all unused elements
        $.each(rmV, function (i, d) {
          telData[trgTel].splice(d, 1)
        })
        // console.log('rmV',rmV,telData[trgTel])
      })
    }

    // -------------------------------------------------------------------
    // quick access for each child by the corresponding id
    // -------------------------------------------------------------------
    telData.subArrIds = {}
    telData.telSubArrId = {}
    $.each(telData.subArr.children, function (index0, subArrNow) {
      telData.subArrIds[subArrNow.id] = subArrNow

      telData.telSubArrId[subArrNow.id] = subArrNow.id
      $.each(subArrNow.children, function (index1, telNow) {
        telData.telSubArrId[telNow.id] = subArrNow.id
        // console.log('set :',subArrNow.id,telNow.id)
      })
    })

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    if (!is_def(telData.telHover)) {
      telData.telHover = {}
      telData.telHover.subArr = ''
    }
    if (!is_def(telData.subArrIds[telData.telHover.subArr])) {
      telData.telHover.id = telData.subArr.children[0].children[0].id
      telData.telHover.focusedSubArr = ''
      telData.telHover.clickedSubArr = ''
      // console.log('set telData.telHover:',subArrNow,tel_IdNow)
    }
    telData.telHover.subArr = telData.telSubArrId[telData.telHover.id]

    // -------------------------------------------------------------------
    // fill the "trg" and "pnt" elements according to the corresponding data_now.trg, data_now.pnt
    // -------------------------------------------------------------------
    // let needInitData = false;
    $.each(['trg', 'pnt'], function (index0, key) {
      $.each(telData.tel, function (index1, ele_now) {
        telData.tel[index1][key] = [0, 0]

        let target_point_id = ele_now[key + 'Id']
        let trgPntD =
          target_point_id !== tel_info.no_subArr_name()
            ? find_dict_ele_in_obj(telData[key], 'id', target_point_id, true)[1]
            : undefined

        if (is_def(trgPntD)) {
          if (target_point_id !== tel_info.no_subArr_name()) {
            telData.tel[index1][key] = trgPntD.pos
          }
        }

        if (target_point_id !== tel_info.no_subArr_name() && !is_def(trgPntD)) {
          // needInitData = true;
          console.error(
            'pqpqp:',
            key,
            index1,
            ele_now.id,
            ele_now,
            target_point_id,
            target_point_id !== tel_info.no_subArr_name()
              ? find_dict_ele_in_obj(telData[key], 'id', target_point_id, true)[1]
              : '-------',
            telData
          )
        }
      })
    })
    // if(Math.floor(Math.random()*100)%5==0){  needInitData = true;}

    // // -------------------------------------------------------------------
    // // if there is some inconsistency with the unpdated data, ask for a complete initialization
    // // -------------------------------------------------------------------
    // if(needInitData) {
    //   locker.remove("dataChange");
    //   console.log('askInitData',widget_id);
    //   askInitData({widget_id:widget_id});
    //   return false;
    // }

    // -------------------------------------------------------------------
    // colors
    // -------------------------------------------------------------------
    let colNow
    $.each(telData.tel, function (index, ele_now) {
      if (ele_now.pntId === tel_info.no_subArr_name()) {
        colNow = getColStop()
      } else {
        let posDiff0 = Math.abs(ele_now.pos[0] - ele_now.pnt[0])
        let posDiff1 = Math.abs(ele_now.pos[1] - ele_now.pnt[1])
        if (posDiff0 >= 360) posDiff0 -= 360
        if (posDiff1 >= 90) posDiff1 -= 90
        let posDiff = Math.sqrt(Math.pow(posDiff0, 2) + Math.pow(posDiff1, 2))
        let posDiffDms = deg_dms(posDiff)

        colNow =
          posDiffDms[0] <= 1 || posDiffDms[0] >= 359
            ? getColTrack()
            : getColSlew(posDiff)
      }

      telData.idToCol[ele_now.id] = colNow
      telData.tel[index].col = colNow
    })

    locker.remove('dataChange')

    return true
  }

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  // function get_sync_state(data_in) {
  //   svgSubArr.zoom_to_target({ target:telData.telHover.id, scale:getScale(), duration_scale:2 });
  // }
  // this.get_sync_state = get_sync_state;

  let prev_sync = {}
  function get_sync_state (data_in) {
    if (document.hidden) return
    if (sock.con_stat.is_offline()) return

    let sess_widget_ids = data_in.sess_widget_ids
    if (sess_widget_ids.indexOf(widget_id) < 0 || widget_id === data_in.widget_id) {
      return
    }

    if (sock.is_old_sync(prev_sync, data_in.data)) return

    // console.log('get  -=- ',widget_id,data_in.type,data_in.data);

    prev_sync[data_in.type] = data_in.data

    let type = data_in.type
    if (type === 'syncTelFocus') {
      // locker.add("get_sync_state");

      let target = data_in.data.target
      let zoom_state = data_in.data.zoom_state

      let scale = svgSubArr.com.z['0.0']
      if (zoom_state === 1) scale = svgSubArr.com.z['2.0']

      svgSubArr.zoom_to_target({
        target: target,
        scale: scale,
        duration_scale: 1,
        endFunc: function () {}
      })
    }
  }
  this.get_sync_state = get_sync_state

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  run_loop.init({
    tag: 'sync_state_send',
    func: sync_state_sendOnce,
    n_keep: 1,
    wait: times.wait_sync_state
  })

  function sync_state_send (data_in) {
    run_loop.push({ tag: 'sync_state_send', data: data_in })
  }

  function sync_state_sendOnce (data_in) {
    if (sock.con_stat.is_offline()) return

    if (
      !locker.are_free([
        'inInit',
        'zoom',
        'autoZoomTarget',
        'setState',
        'setHirch',
        'dataChange'
      ])
    ) {
      setTimeout(function () {
        sync_state_send(data_in)
      }, times.anim_arc)
      return
    }

    if (sock.is_same_sync(prev_sync, data_in)) return

    // console.log('send -=- ',widget_id,data_in,prev_sync[ data_in.type]);

    prev_sync[data_in.type] = data_in
    sock.sock_sync_state_send({
      widget_id: widget_id,
      type: data_in.type,
      data: data_in
    })
  }

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function SvgSkyPos () {
    let thisSkyPos = this

    let com = {}

    // initialize a couple of functions to be overriden below
    let getScale = function () {
      return lenSkyPos.z['0.0']
    }
    let getTrans = function () {
      return [0, 0]
    }
    this.getScale = getScale
    this.getTrans = getTrans

    let funcD = {}
    funcD.zoomFuncDuring = {}
    funcD.zoomFuncEnd = {}
    funcD.updtFocused = {}

    let lenSkyPos = {}
    lenSkyPos.z = {}
    lenSkyPos.z['0.0'] = 1
    lenSkyPos.z['1.0'] = 100
    lenSkyPos.z.scaleFactor = lenSkyPos.z['0.0']
    lenSkyPos.z.gratRatio = 25

    // font sizes, scaled to the different zoom levels
    lenSkyPos.f = {}
    lenSkyPos.f['0.0'] = 9 / lenSkyPos.z['0.0']

    //
    lenSkyPos.r = {}
    lenSkyPos.r.trg = is_south ? 4 : 6
    lenSkyPos.r.tel = is_south ? 10 : 18 // {"L":14,"M":14,"S":14};//{"L":14,"M":12,"S":10};

    // initialize a global function (to be overriden below)
    let zoom_to_target = function (opt_in) {
      if (!locker.is_free('inInit')) {
        setTimeout(function () {
          zoom_to_target(opt_in)
        }, times.wait_loop)
      }
    }
    this.zoom_to_target = zoom_to_target

    // -------------------------------------------------------------------
    // background container & zoom behaviour
    // -------------------------------------------------------------------
    function init_data (hasJoinedData) {
      if (is_def(com.zoom_callable)) return

      // -------------------------------------------------------------------
      // attach the div which will host the main svg element
      // -------------------------------------------------------------------
      let svg_div_id = sgv_tag.skyPos.id + 'Svg'
      let svg_div = sgv_tag.skyPos.widget.get_ele(svg_div_id)

      if (!is_def(svg_div)) {
        let parent = sgv_tag.skyPos.widget.get_ele(sgv_tag.skyPos.id)
        svg_div = document.createElement('div')
        svg_div.id = svg_div_id

        dom_add(parent, svg_div)

        run_when_ready({
          pass: function () {
            return is_def(sgv_tag.skyPos.widget.get_ele(svg_div_id))
          },
          execute: function () {
            init_data(hasJoinedData)
          }
        })

        return
      }
      sock.emit_mouse_move({ eleIn: svg_div, data: { widget_id: widget_id } })

      // -------------------------------------------------------------------
      // zoom start/on/end functions, attachd to com.svgZoom
      // -------------------------------------------------------------------
      let scaleStart = 0
      com.svgZoomStart = function () {
        scaleStart = d3.event.transform.k
        locker.add({ id: 'zoom', override: true })
        locker.add({ id: 'zoomEndFunc', override: true })
      }

      com.svgZoomDuring = function () {
        com.zoom_callable.attr('transform', d3.event.transform)
        com.svgZoomUpdState()
      }

      com.svgZoomUpdState = function () {}

      com.svgZoomEnd = function () {
        locker.remove('zoom')
        locker.remove({
          id: 'zoomEndFunc',
          delay: times.anim_arc * 1.2,
          override: true
        })

        com.svgZoomUpdState()

        // only do this once for each zooming sequence
        doZoomFuncEnd()

        // if on minimal zoom, center
        if (Math.abs(d3.event.transform.k - scaleStart) > 0.00001) {
          if (Math.abs(d3.event.transform.k - lenSkyPos.z['0.0']) < 0.00001) {
            if (locker.are_free(['autoZoomTarget'])) {
              zoom_to_target({
                target: 'init',
                scale: d3.event.transform.k,
                duration_scale: 0.5
              })
            }
          }
        }
      }

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      run_loop.init({ tag: 'doZoomFuncEnd', func: doZoomFuncEndOnce, n_keep: 1 })

      function doZoomFuncEnd () {
        run_loop.push({ tag: 'doZoomFuncEnd' })
      }

      function doZoomFuncEndOnce () {
        if (
          locker.are_free([
            'zoomEndFunc',
            'setState',
            'zoom',
            'zoom_to_target',
            'dataChange',
            'setFocused'
          ])
        ) {
          $.each(funcD.zoomFuncEnd, function (tag_now, funcNow) {
            funcNow()
          })
        } else {
          setTimeout(function () {
            doZoomFuncEnd()
          }, times.anim_arc / 2)
        }
      }

      com.svgZoom = d3
        .zoom()
        .scaleExtent([lenSkyPos.z['0.0'], lenSkyPos.z['1.0']])
      com.svgZoom.on('start', com.svgZoomStart)
      com.svgZoom.on('zoom', com.svgZoomDuring)
      com.svgZoom.on('end', com.svgZoomEnd)

      // -------------------------------------------------------------------
      // programatic zoom to some target and scale - only use the last of any set of ovelapping
      // zoom requests, where zooming is only possible after lenSkyPos.zoomLock becomes free
      // -------------------------------------------------------------------
      run_loop.init({
        tag: 'zoom_to_target_sky_pos',
        func: do_zoom_to_target,
        n_keep: -1
      })

      // the actual function to be called when a zoom needs to be put in the queue
      zoom_to_target = function (opt_in) {
        if (!locker.is_free('inInit')) {
          setTimeout(function () {
            zoom_to_target(opt_in)
          }, times.wait_loop)
          return
        }
        if (!locker.are_free(['autoZoomTarget'])) return

        let target_name = opt_in.target
        let targetScale = opt_in.scale
        let duration_scale = opt_in.duration_scale

        if (targetScale < lenSkyPos['0.0']) targetScale = getScale()

        let trans_to = [0, 0]
        if (target_name !== 'init') {
          let id_now = 'tel' + target_name
          if (is_def(com.inst_pos.circXY)) {
            let inst_pos = com.inst_pos.circXY[id_now]

            if (is_def(inst_pos)) trans_to = [inst_pos.x, inst_pos.y]
          }
        }

        let func_start = function () {
          locker.add({ id: 'autoZoomTarget', override: true })
        }
        let func_during = function () {}
        let func_end = function () {
          locker.remove('autoZoomTarget')
        }

        let data_out = {
          target_scale: targetScale,
          duration_scale: duration_scale,
          baseTime: 300,
          trans_to: trans_to,
          wh: [lenD.w[1], lenD.h[1]],
          cent: [0, 0],
          func_start: func_start,
          func_end: func_end,
          func_during: func_during,
          svg: com.svg,
          svgZoom: com.svgZoom,
          zoom_callable: com.zoom_callable,
          svg_zoom_node: com.svg_zoom_node
        }

        if (duration_scale < 0) {
          data_out.duration_scale = 0
          do_zoom_to_target(data_out)
        } else {
          run_loop.push({ tag: 'zoom_to_target_sky_pos', data: data_out })
        }
      }
      thisSkyPos.zoom_to_target = zoom_to_target

      // -------------------------------------------------------------------
      // create the main svg element
      // -------------------------------------------------------------------
      com.svg = d3
        .select(svg_div)
        // .classed("svgInGridStack_outer", true)
        .style('background', '#383B42')
        .append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr(
          'viewBox',
          -lenD.w[1] / 2 +
            ' ' +
            -lenD.h[1] / 2 +
            ' ' +
            lenD.w[1] +
            ' ' +
            lenD.h[1]
        )
        .style('position', 'relative')
        .style('width', '100%')
        .style('height', '100%')
        .style('top', '0px')
        .style('left', '0px')
        // .classed("svgInGridStack_inner", true)
        .style('background', '#383B42') // .style("background", "blue")// .style("border","1px solid red")
        .call(com.svgZoom)
        .on('wheel', function () {
          d3.event.preventDefault()
        })
      // .on("dblclick.zoom", null)

      com.zoom_callable = com.svg.append('g')
      com.svgOverlay = com.svg.append('g')

      // save the svg node to use for d3.zoomTransform() later
      com.svg_zoom_node = com.svg.nodes()[0]

      getScale = function () {
        return d3.zoomTransform(com.svg_zoom_node).k
      }
      getTrans = function () {
        return [
          d3.zoomTransform(com.svg_zoom_node).x,
          d3.zoomTransform(com.svg_zoom_node).y
        ]
      }
      thisSkyPos.getScale = getScale
      thisSkyPos.getTrans = getTrans

      // add one circle as background
      // -------------------------------------------------------------------
      com.zoom_callable
        .append('g')
        .selectAll('circle')
        .data([0, 1])
        .enter()
        .append('circle')
        .attr('r', 0)
        // .attr("cx", lenD.w[1]/2)
        // .attr("cy", lenD.h[1]/2)
        .attr('cx', 0)
        .attr('cy', 0)
        // .attr("fill", "#F2F2F2")
        .attr('fill', function (d, i) {
          return i === 0 ? d3.rgb('#F2F2F2').darker(0.05) : '#F2F2F2'
        })
        .transition('inOut')
        .duration(times.anim_arc / 3)
        // .attr("r", function(d,i) { return lenD.w[1]/2; });
        .attr('r', function (d, i) {
          return lenD.w[1] * (i === 0 ? 1 / 2 : 1 / 2.2)
        })

      com.zoom_callable.on('mousemove', function () {
        updateOverText(d3.mouse(this))
      })

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      //
      initGrat()
      //
      setProjPath()
      //
      addGratLines()
      //
      gratLbls([0, 0], 1)
      //
      projTelos()
      // initi overlay coordinate text
      setOverText()

      locker.remove('inInitSkyPos')
    }
    this.init_data = init_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setOverText () {
      if (!is_def(com.overRect)) {
        com.overRect = {}
        com.overRect.w = lenD.w[1]
        com.overRect.h = lenD.h[1] * 0.06
        com.overRect.x = -com.overRect.w / 2
        com.overRect.y = lenD.h[1] / 2 - com.overRect.h

        com.overRect.data = [
          {
            id: 'coordinates',
            x: 15, // com.overRect.w*0.05,
            y: com.overRect.h / 2,
            txt: '',
            size: 15
          }
        ]

        com.svgOverlay
          .style('pointer-events', 'none')
          .attr('transform', function (d) {
            return 'translate(' + com.overRect.x + ',' + com.overRect.y + ')'
          })

        let defs = com.svgOverlay.append('defs')

        let grad = defs
          .append('linearGradient')
          .attr('id', 'svgOverlayGrad')
          .attr('x1', '0%')
          .attr('x2', '100%')
          .attr('y1', '100%')
          .attr('y2', '100%')

        grad
          .append('stop')
          .attr('offset', '25%')
          .attr('stop-color', '#383b42')
          .attr('stop-opacity', 1)
        grad
          .append('stop')
          .attr('offset', '70%')
          .attr('stop-color', '#383b42')
          .attr('stop-opacity', 0)
        // .attr("stop-color", "red").attr("stop-opacity", 1)

        com.svgOverlay
          .append('g')
          .selectAll('rect')
          .data([0])
          .enter()
          .append('rect')
          .style('pointer-events', 'none')
          .attr('width', com.overRect.w)
          .attr('height', com.overRect.h)
          .attr('x', 0)
          .attr('y', 0)
          .style('opacity', 0.7)
          .attr('fill', 'url(#svgOverlayGrad)')
        // .attr("fill","#F2F2F2")
      }

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      let tag_now = 'coord'
      let txt = com.svgOverlay
        .selectAll('text.' + tag_now)
        .data(com.overRect.data, function (d, i) {
          return d.id
        })

      txt
        .enter()
        .append('text')
        .attr('class', tag_now)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .style('text-anchor', 'left')
        .style('font-weight', 'normal')
        .style('stroke-width', 0.5)
        .style('stroke', function (d) {
          return '#F2F2F2'
        })
        .style('fill', function (d) {
          return '#F2F2F2'
        })
        .style('pointer-events', 'none')
        .style('vector-effect', 'non-scaling-stroke')
        .style('font-size', function (d) {
          return d.size + 'px'
        })
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
        .attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })
        .merge(txt)
        .transition('inOut')
        .duration(times.anim_arc)
        .text(function (d) {
          return d.txt
        })
        .style('fill-opacity', 0.9)
        .style('stroke-opacity', 0.7)

      txt
        .exit()
        .transition('inOut')
        .duration(times.anim_arc)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .remove()
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function updateOverText (mousePos) {
      let transProj = com.proj.invert(mousePos)

      let isOut = false
      if (com.isPolar) isOut = transProj[1] >= 0
      if (isOut) transProj = []
      else transProj[1] *= -1

      com.overRect.data[0].txt = parsePosTxt(transProj)

      setOverText()
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update_data (data_in) {
      projTelos()
    }
    thisSkyPos.update_data = update_data

    // -------------------------------------------------------------------
    // translate coordinates to the skymap
    // -------------------------------------------------------------------
    function setProjPos () {
      $.each(['trg', 'pnt', 'tel'], function (trgTelIndex, trgTel) {
        $.each(['pos', 'pnt', 'trg'], function (index0, posTag) {
          if (posTag === 'pos' || trgTel === 'tel') {
            let tag_now = trgTel + posTag

            $.each(telData[trgTel], function (index1, data_now) {
              // console.log(tag_now,posTag,data_now[posTag],telData[trgTel][index1]);

              telData[trgTel][index1][tag_now] = projXY(data_now[posTag])
            })
          }
        })
      })
    }

    function projXY (xy) {
      return com.proj([xy[0], -xy[1]])
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function projTelos () {
      // // fixme !!!!!!!!!!!!!!!!!!!!
      // // fixme !!!!!!!!!!!!!!!!!!!!
      // let tagAzZen = ''
      // // fixme !!!!!!!!!!!!!!!!!!!!
      // // fixme !!!!!!!!!!!!!!!!!!!!
      if (!is_def(com.inst_pos)) {
        com.inst_pos = {}
        com.inst_pos.g = com.zoom_callable.append('g')
        com.inst_pos.circXY = {}
        com.inst_pos.lblXY = {}
      }
      let tagTelLbl = 'telTitle'
      let tagTrgLbl = 'trgTitle'

      let nLblTicks = 100
      let lblForceStrength = is_south ? -40 : -150
      let multiTickUpdate = false
      let colLblV = [
        d3.rgb(cols_reds[3]).brighter(0.3),
        d3.rgb(cols_reds[3]).darker(0.3),
        d3.rgb(cols_reds[3]).darker(1)
      ]
      let colLineV = [
        d3.rgb(cols_reds[8]).brighter(0.5),
        '#383b42',
        d3.rgb(cols_yellows[2]).brighter(0.3),
        colLblV[2],
        colLblV[2]
      ]

      let fontSize = 0.9 * lenSkyPos.r.tel
      function getFontSize () {
        return fontSize * Math.pow(getScale(), -0.3)
      }

      let scaleFact = 1 / Math.sqrt(getScale())
      let scaledR = {
        trg: scaleFact * lenSkyPos.r.trg,
        tel: scaleFact * lenSkyPos.r.tel,
        pnt: scaleFact * lenSkyPos.r.tel / 2
      }

      // translate coordinates to the skymap
      setProjPos()

      // -------------------------------------------------------------------
      // label data
      // -------------------------------------------------------------------
      let trgLblData = []
      let telLblData = []
      let forceNodes = []
      $.each(['trg', 'pnt', 'tel'], function (trgTelIndex, trgTel) {
        let tag_now = trgTel + 'pos'
        let data_now = telData[trgTel].filter(function (d) {
          return filtFunc(trgTel, 'pos', d)
        })

        $.each(data_now, function (indexNode, nodeNow) {
          let isHov = telData.telHover.id === nodeNow.id
          // if(trgTelIndex<2)console.log('nodeNow',nodeNow);
          if (!isHov && trgTel === 'tel') return

          let id_now = trgTel + nodeNow.id
          let data_now = {
            id: id_now,
            type: trgTel,
            N: trgTel === 'tel' ? tel_info.get_title(nodeNow.id) : nodeNow.N,
            x: nodeNow[tag_now][0],
            y: nodeNow[tag_now][1] - scaledR[trgTel],
            col: nodeNow.col
          }

          com.inst_pos.circXY[id_now] = { x: data_now.x, y: data_now.y }

          if (trgTel === 'tel') telLblData.push(data_now)
          else trgLblData.push(data_now)

          forceNodes.push(data_now)
        })
      })

      // -------------------------------------------------------------------
      // combinations are: trgpos (target), telpos (telescope), telpnt (pointing)
      // -------------------------------------------------------------------
      function filtFunc (trgTel, posPnt, d) {
        if (d.id === tel_info.no_subArr_name() && trgTel === 'trg') return false
        else if (d.pntId === tel_info.no_subArr_name() && posPnt === 'pnt') {
          return false
        } else return true
      }

      // -------------------------------------------------------------------
      // connecting lines:
      // [index==0]     is for a line between tel and pnt
      // [index==1]     is for a line between pnt and trg
      // [index==2,3,4] are for lines between tel/trg/pnt and the respective
      //                labels (actual position only set in com.nodeUpdateTickPos)
      // -------------------------------------------------------------------
      if (!is_def(com.inst_pos.lineTags)) {
        com.inst_pos.lineTags = [
          { pair: [0, 1], telTag: 'tel', tag: 'lineTelPnt', dash: '5,5' },
          { pair: [1, 2], telTag: 'tel', tag: 'lineTrgPnt', dash: '10,10' },
          { pair: [0, 0], telTag: 'tel', tag: 'lineTelLbl', dash: '5,1' },
          { pair: [0, 0], telTag: 'pnt', tag: 'linePntLbl', dash: '5,1' },
          { pair: [0, 0], telTag: 'trg', tag: 'lineTrgLbl', dash: '5,1' }
        ]
      }

      let posTagV = ['pos', 'pnt', 'trg']
      $.each(com.inst_pos.lineTags, function (index, ele_now) {
        let trgTel = ele_now.telTag
        let pairNow = ele_now.pair
        let tag_now = ele_now.tag
        let dash = ele_now.dash

        let data_now = telData[trgTel].filter(function (d) {
          return filtFuncLines(d)
        })
        let line = com.inst_pos.g
          .selectAll('line.' + tag_now)
          .data(data_now, function (d) {
            return tag_now + d.id
          })

        function filtFuncLines (d) {
          let isHov = telData.telHover.id === d.id
          if (!isHov) return false

          if (d.pntId === tel_info.no_subArr_name() && index !== 2) return false
          else if (d.trgId === tel_info.no_subArr_name() && index === 1) {
            return false
          } else return true
        }

        let n_ele_in = data_now.length
        line
          .enter()
          .append('line')
          .attr('class', tag_now)
          // .each(  function(d,i) { // xxxxxxxxxxxxx
          //   if(index < 2) console.log(d,trgTel,pairNow[1], posTagV[pairNow[1]],  d[ trgTel+ posTagV[ pairNow[1] ]][0]);
          // })
          .attr('x1', function (d, i) {
            return d[trgTel + posTagV[pairNow[0]]][0]
          })
          .attr('x2', function (d, i) {
            return d[trgTel + posTagV[pairNow[1]]][0]
          })
          .attr('y1', function (d, i) {
            return d[trgTel + posTagV[pairNow[0]]][1]
          })
          .attr('y2', function (d, i) {
            return d[trgTel + posTagV[pairNow[1]]][1]
          })
          .style('stroke-opacity', 0)
          .style('stroke-width', index < 2 ? 1 : 1)
          .style('pointer-events', 'none')
          .style('vector-effect', 'non-scaling-stroke')
          .style('stroke-dasharray', dash)
          .attr('stroke', function (d, i) {
            return colLineV[index]
          })
          .merge(line)
          .transition('inOut1')
          .duration(times.anim_arc)
          // .attr("x1",  function(d,i) { return d[ trgTel+ posTagV[ pairNow[0] ]][0]; })
          // .attr("y1",  function(d,i) { return d[ trgTel+ posTagV[ pairNow[0] ]][1]; })
          .attr('x2', function (d, i) {
            return d[trgTel + posTagV[pairNow[1]]][0]
          })
          .attr('y2', function (d, i) {
            return d[trgTel + posTagV[pairNow[1]]][1]
          })
          .style('stroke-opacity', function (d, i) {
            if (index === 0) return 0.6
            else if (index === 1) return 0.6
            else return 0.65
          })
          .on('end', transEnd)

        function transEnd () {
          if (index < 2) {
            n_ele_in--
            if (n_ele_in === 0) {
              line
                .transition('inOut2')
                .duration(times.anim_arc)
                .attr('x1', function (d, i) {
                  return d[trgTel + posTagV[pairNow[0]]][0]
                })
                .attr('y1', function (d, i) {
                  return d[trgTel + posTagV[pairNow[0]]][1]
                })
            }
          }
        }

        line
          .exit()
          // .transition("inOut").duration(times.anim_arc)
          // .attr("stroke-opacity", "0")
          .remove()
      })

      // -------------------------------------------------------------------
      // circles for target, pointing and telescopes
      // -------------------------------------------------------------------
      $.each(['tel', 'pnt', 'trg'], function (trgTelIndex, trgTel) {
        let posPnt = 'pos'
        let tag_now = trgTel + posPnt

        function selCirc (tagIn) {
          let data_now = telData[trgTel].filter(function (d) {
            return filtFunc(trgTel, posPnt, d)
          })
          return com.inst_pos.g
            .selectAll('circle.' + tag_now)
            .data(data_now, function (d) {
              return tag_now + d.id
            })
        }
        let circ = selCirc()

        // operate on new elements only
        let n_ele_in = -1
        circ
          .enter()
          .append('circle')
          .attr('class', tag_now)
          .style('vector-effect', 'non-scaling-stroke')
          .attr('r', 0)
          .style('stroke-width', function (d, i) {
            if (trgTel === 'trg') {
              return 1.5
            } else {
              return 1.0
            }
          })
          .attr('transform', function (d) {
            return 'translate(' + d[tag_now][0] + ',' + d[tag_now][1] + ')'
          })
          .attr('fill-opacity', function (d) {
            return trgTel === 'trg' ? 0.25 : 0.55
          })
          .on('click', function (d) {
            if (trgTel === 'tel') {
              svgSubArr.zoom_to_target({
                target: d.id,
                scale: svgSubArr.com.z['1.0'],
                duration_scale: 1
              })
            }
          })
          .attr('pointer-events', trgTel === 'tel' ? 'auto' : 'none')
          .merge(circ)
          .each(function () {
            n_ele_in++
          })
          .transition('trans')
          .duration(times.anim_arc)
          .attr('transform', function (d) {
            return 'translate(' + d[tag_now][0] + ',' + d[tag_now][1] + ')'
          })
          .style('fill', function (d, i) {
            if (trgTel === 'tel') return d.col
            else if (trgTel === 'trg') return '#383b42'
            else return 'transparent'
          })
          .style('stroke', function (d, i) {
            if (trgTel === 'tel') return d3.rgb(d.col).darker(1)
            else return '#383b42'
          })
          .on('end', function (d, i) {
            if (i === n_ele_in) updtCirc()
          })

        circ
          .exit()
          .transition('inOut')
          .duration(times.anim_arc / 2)
          .attr('r', 0)
          .remove()

        function updtCirc () {
          let circ = selCirc()
          // make sure the projected positions are calculated
          // (may not be the case for reconnected sessions...)
          circ.each(function (d, i) {
            if (!is_def(d[tag_now])) {
              console.log.error('test setProjPos()...', i, d)
            }
            if (!is_def(d[tag_now])) setProjPos()
            if (!is_def(d[tag_now])) {
              console.log.error('something is wrong with setProjPos()...', d)
            }
          })

          circ
            .transition('zoom')
            .duration(times.anim_arc)
            .attr('transform', function (d) {
              return 'translate(' + d[tag_now][0] + ',' + d[tag_now][1] + ')'
            })
            .attr('r', scaledR[trgTel])
        }
        funcD.zoomFuncEnd['updtZoomedSize' + tag_now] = updtCirc
      })

      // -------------------------------------------------------------------
      // labels
      // -------------------------------------------------------------------
      let trgLbl = com.inst_pos.g
        .selectAll('text.' + tagTrgLbl)
        .data(trgLblData, function (d, i) {
          return d.id
        })

      trgLbl
        .enter()
        .append('text')
        .attr('class', tagTrgLbl)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .text(function (d) {
          return d.N
        })
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('stroke-width', 0.5)
        .style('stroke', function (d) {
          return colLblV[2]
        })
        .style('fill', function (d) {
          return colLblV[d.type === 'trg' ? 0 : 1]
        })
        .style('pointer-events', 'none')
        .style('vector-effect', 'non-scaling-stroke')
        .style('font-size', function (d) {
          return getFontSize() + 'px'
        })
        .attr('dy', getFontSize() / 3 + 'px')
        .attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })
        .merge(trgLbl)
        .transition('inOut')
        .duration(times.anim_arc)
        .style('font-size', function (d) {
          return getFontSize() + 'px'
        })
        .attr('dy', getFontSize() / 3 + 'px')
        .style('fill-opacity', 0.6)
        .style('stroke-opacity', 1)

      trgLbl
        .exit()
        .transition('inOut')
        .duration(times.anim_arc)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .remove()

      let telLbl = com.inst_pos.g
        .selectAll('text.' + tagTelLbl)
        .data(telLblData, function (d, i) {
          return d.id
        })

      telLbl
        .enter()
        .append('text')
        .attr('class', tagTelLbl)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .text(function (d) {
          return d.N
        })
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('stroke-width', 0.5)
        .style('stroke', function (d) {
          return '#383b42'
        })
        .style('fill', function (d) {
          return '#383b42'
        })
        .style('pointer-events', 'none')
        .style('vector-effect', 'non-scaling-stroke')
        .style('font-size', function (d) {
          return getFontSize() + 'px'
        })
        .attr('dy', getFontSize() / 3 + 'px')
        .attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })
        .merge(telLbl)
        .transition('inOut')
        .duration(times.anim_arc)
        .style('font-size', function (d) {
          return getFontSize() + 'px'
        })
        .attr('dy', getFontSize() / 3 + 'px')
        .style('fill-opacity', 0.8)
        .style('stroke-opacity', 0.8)

      telLbl
        .exit()
        .transition('inOut')
        .duration(times.anim_arc)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .remove()

      let prevTickAnim
      let minAnimWait
      if (is_def(com.inst_pos[tagTelLbl + 'force'])) {
        com.inst_pos[tagTelLbl + 'force']
          .alpha(1)
          .nodes(forceNodes)
          .restart()
      } else {
        prevTickAnim = Date.now()
        minAnimWait = times.anim_arc * 2 // minAnimWait must be >= times.anim_arc !!!

        // update the positions
        com.nodeUpdateTickPos = function (animFrac) {
          com.inst_pos.g
            .selectAll('text')
            .each(function (d) {
              com.inst_pos.lblXY[d.id] = { x: d.x, y: d.y }
            })
            .transition('updtTickepos_dif')
            .duration(times.anim_arc * animFrac)
            .attr('transform', function (d) {
              return 'translate(' + d.x + ',' + d.y + ')'
            })

          $.each(com.inst_pos.lineTags, function (index, ele_now) {
            if (index > 1) {
              let trgTel = ele_now.telTag
              // let pairNow = ele_now.pair
              let tag_now = ele_now.tag

              com.inst_pos.g
                .selectAll('line.' + tag_now)
                .transition('inOut')
                .duration(times.anim_arc * animFrac)
                .attr('x1', function (d, i) {
                  return com.inst_pos.lblXY[trgTel + d.id].x
                })
                .attr('y1', function (d, i) {
                  return com.inst_pos.lblXY[trgTel + d.id].y
                })
                .attr('x2', function (d, i) {
                  return d[trgTel + 'pos'][0]
                })
                .attr('y2', function (d, i) {
                  return d[trgTel + 'pos'][1]
                })
            }
          })

          prevTickAnim = Date.now()
        }
        // com.nodeUpdateTickPos = function(animFrac) {}

        com.inst_pos[tagTelLbl + 'force'] = d3
          .forceSimulation()
          .force('charge', getForchCharge())
          .alpha(1)
          .alphaDecay(1 - Math.pow(0.001, 1 / nLblTicks))
          .nodes(forceNodes)
          .on('tick', nodeUpdateTickVal)
          .on('end', function (d) {
            com.nodeUpdateTickPos(1)
          })

        funcD.zoomFuncEnd['updtZoomedSize' + tagTelLbl] = updtTxt
        // funcD.zoomFuncEnd["updtZoomedSize_"+tagTelLbl] = function(){}
      }

      function nodeUpdateTickVal () {
        let alpha = com.inst_pos[tagTelLbl + 'force'].alpha()
        let tickFrac = alpha // set to some number between 0 and alpha
        // console.log(tickFrac);

        // push nodes toward their designated focus
        com.inst_pos.g.selectAll('text').each(function (d, i) {
          if (!is_def(d.x)) return

          d.x += (com.inst_pos.circXY[d.id].x - d.x) * tickFrac
          d.y += (com.inst_pos.circXY[d.id].y - d.y) * tickFrac
        })
        // .attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; })

        // only update the position every few ticks
        if (multiTickUpdate) {
          if (Date.now() - prevTickAnim > minAnimWait && alpha < 0.1) {
            com.nodeUpdateTickPos(0.5)
          }
        }
      }

      function getForchCharge () {
        return d3
          .forceManyBody()
          .distanceMin(lenSkyPos.r.tel * 1 / Math.sqrt(getScale()))
          .distanceMax(lenSkyPos.r.tel * 5 / Math.sqrt(getScale()))
          .strength(lblForceStrength)
      }

      function updtTxt () {
        com.inst_pos[tagTelLbl + 'force']
          .force('charge', getForchCharge())
          .alpha(1)
          .restart()
          .on('end', function (d) {
            com.nodeUpdateTickPos(1)
          })

        // update the title size on zoom
        com.inst_pos.g
          .selectAll('text')
          .transition('zoom')
          .duration(times.anim_arc)
          .style('font-size', getFontSize() + 'px')
          .attr('dy', getFontSize() / 3 + 'px')
      }
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    run_loop.init({ tag: 'setFocused', func: setFocusedOnce, n_keep: 1 })

    function setFocused (data_in) {
      run_loop.push({ tag: 'setFocused', data: data_in })
    }
    this.setFocused = setFocused

    function setFocusedOnce () {
      // create delay if currently in data update or a previous call of setFocused
      if (
        !locker.are_free(['setState', 'zoom', 'zoom_to_target', 'dataChange'])
      ) {
        setTimeout(function () {
          setFocused(opt_in)
        }, times.anim_arc)
        return
      }
      locker.add({ id: 'setFocused', override: true })

      let tagTelLbl = 'telTitle'
      let tagTrgLbl = 'trgTitle'
      let fadeOpac = 0.05
      let animTime = times.anim_arc / 2

      function isFocused (id_in) {
        if (!is_def(telData.idToFocus[id_in])) return true
        return telData.idToFocus[id_in]
      }

      $.each(['tel', 'pnt', 'trg'], function (trgTelIndex, trgTel) {
        let posPnt = 'pos'
        let tag_now = trgTel + posPnt

        com.inst_pos.g
          .selectAll('circle.' + tag_now)
          .transition('fadeInOut')
          .duration(animTime)
          .style('opacity', function (d) {
            return isFocused(trgTel + d.id) ? 1 : fadeOpac
          })
      })

      $.each(com.inst_pos.lineTags, function (index, ele_now) {
        let trgTel = ele_now.telTag
        let tag_now = ele_now.tag

        com.inst_pos.g
          .selectAll('line.' + tag_now)
          .transition('inOut')
          .duration(animTime)
          .style('opacity', function (d) {
            return isFocused(trgTel + d.id) ? 1 : fadeOpac
          })
      })

      com.inst_pos.g
        .selectAll('text.' + tagTelLbl)
        .transition('fadeInOut')
        .duration(animTime)
        .style('opacity', function (d) {
          return isFocused(d.id) ? 1 : fadeOpac
        })

      com.inst_pos.g
        .selectAll('text.' + tagTrgLbl)
        .transition('fadeInOut')
        .duration(animTime)
        .style('opacity', function (d) {
          return isFocused(d.id) ? 1 : fadeOpac
        })

      locker.remove({ id: 'setFocused', delay: times.anim_arc })
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function initGrat () {
      com.isPolar = true
      com.followGratLbls = false

      com.gratScale = 1.8 * lenD.w[1] / tau
      com.gratStep = [10, 10]
      com.maxLat = 80
      com.maxLng = 180
      com.gratExt = [[-com.maxLng, -1 * com.maxLat - 1e-6], [com.maxLng, 0]]

      com.gratPrev = getGradPrev()

      com.grat = d3
        .geoGraticule()
        .extent(com.gratExt)
        .step(com.gratStep)

      com.gGrat = com.zoom_callable.append('g')
      // com.gGrat.attr("transform", function(d) { return "translate("+lenD.w[1]/2+","+lenD.h[1]/2+")"; });
    }

    function getGradPrev () {
      let scale0 = getScale() - lenSkyPos.z['0.0']
      let dScal = lenSkyPos.z['1.0'] - lenSkyPos.z['0.0']
      if (scale0 < dScal * 0.2) return 1
      else return 2
      // if     (scale0 < dScal * 0.1) return 1;
      // else if(scale0 < dScal * 0.3) return 2;
      // else                          return 3;
    }

    function addGratLines () {
      // return
      let opac = 0.35
      let strkW = 0.5

      com.grdL = com.gGrat.selectAll('path.' + 'grat').data(com.grat.lines)

      com.grdL
        .enter()
        .append('path')
        .attr('class', 'grat')
        .attr('stroke-width', 0)
        .style('stroke', '#383b42')
        .style('fill', 'transparent')
        .style('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('opacity', opac)
        .merge(com.grdL)
        .transition('inOut')
        .duration(times.anim_arc / 2)
        .attr('stroke-width', 0)
        .transition('inOut')
        .duration(0)
        .attr('d', com.path)
        .transition('inOut')
        .duration(times.anim_arc / 2)
        .attr('stroke-width', strkW)

      com.grdL
        .exit()
        .transition('inOut')
        .duration(times.anim_arc / 2)
        .attr('stroke-width', 0)
        .remove()

      // com.gGrat.selectAll("path."+"grat").filter(function(d,i){ return i%2==1;})
      //   .transition("inOut").duration(times.anim_arc/2)
      //   .attr("stroke-width", 0)
      //   .remove()

      // just in case, though not needed here...
      com.gratPrev = getGradPrev()
    }

    function setProjPath () {
      if (com.isPolar) {
        com.proj = d3
          .geoAzimuthalEquidistant()
          .scale(com.gratScale)
          .precision(0.1)
          .clipAngle(90 + 1e-3)
          .center([0, 0])
          .translate([0, 0])

        com.proj.rotate([0, 90, 0])
      } else {
        com.proj = d3
          .geoMercator()
          .scale(com.gratScale / 2)
          .precision(0.1)
          .translate([0, -1 * lenD.h[1] * sgv_tag.skyPos.whRatio / 4])
      }

      com.path = d3.geoPath().projection(com.proj)
    }

    function gratLbls (trans, scaleFactor) {
      // return
      let nAzm = 14
      let nZen = 3
      let lblPerc = 1

      let scale = getScale()
      let interStep = scaleFactor < 2 ? 5 : 3
      let colLblV = [
        d3.rgb(cols_purples[4]).darker(0.3),
        d3.rgb(cols_purples[2]).darker(0.3)
      ]
      let gratFont = lenSkyPos.f['0.0']

      let center = [0, 0]
      let trnsScaled = [
        (center[0] - trans[0]) / scale,
        (center[1] - trans[1]) / scale
      ]
      let step = com.grat.step()
      let extn = com.grat.extent()
      let maxExtn1 = Math.abs(extn[0][1])

      let nomBinProj = com.proj.invert(trnsScaled)
      let midBin0 = (Math.floor(nomBinProj[0] / step[0]) + 0.5) * step[0]
      let midBin1 = (Math.floor(nomBinProj[1] / step[1]) + 0.5) * step[1]
      let midBin2 = 0

      if (!com.followGratLbls) {
        nAzm = 18
        nZen = 10
        midBin0 = 90
        midBin2 = Math.abs(
          com.gratExt[0][1] + (com.gratExt[1][1] - com.gratExt[0][1]) * 2 / 3
        )
      }

      if (com.isPolar) {
        if (-1 * midBin1 < 0.5 * step[1]) {
          midBin1 = -0.5 * step[1]
        }
      } else {
        if (Math.abs(midBin1) > com.maxLat - 0.5 * step[1]) {
          midBin1 = (midBin1 > 0 ? 1 : -1) * (com.maxLat - 0.5 * step[1])
        }
        if (Math.abs(midBin1) < 0.5 * step[1]) {
          midBin1 = (midBin1 > 0 ? 1 : -1) * (0.5 * step[1])
        }
      }
      if (midBin1 > 0) midBin1 = Math.min(midBin1, maxExtn1 - step[1] / 2)
      else midBin1 = Math.max(midBin1, -maxExtn1 + step[1] / 2)

      let labelV = []
      let allAzm = []
      let pos0, pos1, txt1, text, txtType

      // azimuth
      for (let nAzmNow = -nAzm; nAzmNow < nAzm + 1; nAzmNow++) {
        pos0 = [midBin0 + nAzmNow * step[0], midBin1 + midBin2]
        if (pos0[0] > com.maxLng) pos0[0] -= 360
        else if (pos0[0] < -com.maxLng) pos0[0] += 360

        pos1 = com.proj(pos0)
        txt1 = pos0[0]

        if (isDHms) {
          if (isRaDec) {
            txtType = 'hms'
            text = deg_hms(azim_ra(txt1))
          } else {
            txtType = 'dms'
            text = deg_dms(txt1)
          }
        } else {
          if (isRaDec) {
            txtType = 'deg'
            text = azim_ra(txt1)
          } else {
            txtType = 'deg'
            text = txt1
          }
        }

        // if     (isRaDec)  { txtType = "hms"; text = deg_hms(txt1); }
        // else if(isDHms)   { txtType = "dms"; text = deg_dms(txt1); }
        // else                     { txtType = "deg"; text = txt1;           }

        // ignore the middle one (ovelaps with zenith)
        if (nAzmNow === 0) continue
        // check for duplicates
        if (allAzm.indexOf(text) > -1) continue
        else allAzm.push(text)

        if (nAzmNow !== interStep && nAzmNow % 2 === 0) {
          // console.log(nAzmNow,[pos1,text,pos0[1],txtType])
          labelV.push({
            id: 'lng' + text,
            type: 0,
            V: [pos1, text, pos0[1], txtType]
          })
          // console.log('---',pos0,pos1,midBin1,text);
        }
      }

      // zenith
      for (let nZenNow = -nZen; nZenNow < nZen + 1; nZenNow++) {
        pos0 = [midBin0, midBin1 + nZenNow * step[1]]
        // let pos0 = [ midBin0 + interStep * step[0] , midBin1 + nZenNow * step[1] ]
        pos1 = com.proj(pos0)
        txt1 = -1 * pos0[1]

        if (isDHms) {
          txtType = 'hms'
          text = deg_dms(txt1)
        } else {
          txtType = 'deg'
          text = txt1
        }

        // if     (isRaDec)  { txtType = "dms"; text = deg_dms(txt1); }
        // else if(isDHms)   { txtType = "dms"; text = deg_dms(txt1); }
        // else                     { txtType = "deg"; text = txt1;           }

        // console.log('-----',nZenNow,[pos1,text,pos0[1],txtType])
        if (txt1 > 0 && txt1 < maxExtn1) {
          // console.log(nZenNow,[pos1,text,pos0[1],txtType])
          labelV.push({
            id: 'lat' + text,
            type: 1,
            V: [pos1, text, pos0[1], txtType]
          })
        }
      }

      function formInpt (input, prec) {
        return d3.format(' >' + (prec + 3) + ',.' + prec + 'f')(input)
      }

      function parsePosTxt (dIn, txtType, isInv) {
        if (txtType === 'dms' || txtType === 'hms') {
          if (isInv) {
            let splitDeg = dIn.split(unit_deg)
            let splitMin = splitDeg[1].split(unit_arcmin)
            let deg = parseFloat(splitDeg[0])
            let min = parseFloat(splitMin[0])
            let sec = parseFloat(splitMin[1].replace(unit_arcsec, ''))
            // console.log([parseFloat(deg),parseFloat(min),parseFloat(sec)])
            return [deg, min, sec]
          } else {
            return (
              formInpt(dIn[0], 0) +
              unit_deg +
              ' ' +
              formInpt(dIn[1], 0) +
              unit_arcmin +
              ' ' +
              formInpt(dIn[2], 1) +
              unit_arcsec
            )
          }
        } else if (txtType === 'deg') {
          if (isInv) {
            return parseFloat(dIn.split(unit_deg)[0])
          } else {
            return formInpt(dIn, lblPerc) + unit_deg
          }
        }
      }

      let opac = gratFontOpac()

      com.lbl = com.gGrat
        .selectAll('text.' + 'grat')
        .data(labelV, function (d, i) {
          return d.id
        })

      com.lbl
        .enter()
        .append('text')
        .attr('class', 'grat')
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .style('stroke-width', 0.5)
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('font-size', function (d) {
          return gratFont / fontScale(d.V) + 'px'
        })
        .style('fill', function (d) {
          return colLblV[d.type === 0 ? 0 : 1]
        })
        .style('stroke', function (d) {
          return d3.rgb(colLblV[d.type === 0 ? 0 : 1]).darker(0.3)
        })
        .attr('transform', function (d) {
          return lblTrans(d.V)
        })
        .merge(com.lbl)
        .text(function (d) {
          d.txt = parsePosTxt(d.V[1], d.V[3])
          return d.txt
        }) // .toFixed(lblPerc)
        .transition('update')
        .duration(times.anim_arc)
        .style('fill-opacity', opac)
        .style('stroke-opacity', Math.min(0.9, opac * 2))
        .attr('transform', function (d) {
          return lblTrans(d.V)
        })
        .style('font-size', function (d) {
          d.txt_size = gratFont / fontScale(d.V)
          return d.txt_size + 'px'
        })
        .attr('dy', function (d) {
          return d.txt_size / 3 + 'px'
        })

      com.lbl
        .exit()
        .transition('inOut')
        .duration(times.anim_arc)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .remove()

      function lblTrans (d, i) {
        return 'translate(' + d[0][0] + ',' + d[0][1] + ')'
        // let xy = [d[0][0]-center[0] , d[0][1]-center[1]] //[d[0][0]-lenD.w[1]/2 , d[0][1]-lenD.h[1]/2]
        // let angle = (Math.atan2(xy[0],-xy[1]) * 360/tau);
        // if(xy[1] > 0)                angle += 180;
        // if(!com.isPolar) angle = 0;
        // let angle = 0;
        // return "translate("+d[0][0]+","+d[0][1]+")rotate("+angle+")";
      }

      function fontScale (d) {
        let scaleRatio = com.followGratLbls ? Math.abs(d[2]) / maxExtn1 : 0.3
        let scaleByRad = 1
        if (com.isPolar) {
          if (scaleRatio > 0.7) scaleByRad = 2.2
          else if (scaleRatio > 0.5) scaleByRad = 1.7
          else if (scaleRatio > 0.3) scaleByRad = 1.5
        } else scaleByRad = 2

        let scale = getScale()
        let zoomFrac = Math.max(
          0.25,
          1 - Math.pow((scale - lenSkyPos.z['0.0']) / lenSkyPos.z['1.0'], 0.8)
        )
        scaleByRad /= zoomFrac

        let fontScl = scaleFactor > 1 ? scaleFactor * 1.8 : 1.2
        return fontScl * scaleByRad
      }
    }

    function gratFontOpac () {
      let scale = getScale()
      let zoomFrac = Math.max(
        0.25,
        1 - Math.pow((scale - lenSkyPos.z['0.0']) / lenSkyPos.z['1.0'], 0.2)
      )
      let opac = 0.3 * zoomFrac
      return opac
    }

    function updateGratScale () {
      let scale = getScale()
      let scaleFactor = Math.ceil(scale / lenSkyPos.z.gratRatio)

      // if(Math.abs( com.grat.step()[0] * scaleFactor - com.gratStep[0] )  > 0.01) {
      if (com.gratPrev !== getGradPrev()) {
        com.gratPrev = getGradPrev()

        com.grat = d3
          .geoGraticule()
          .extent(com.gratExt)
          .step([
            com.gratStep[0] / com.gratPrev,
            com.gratStep[1] / com.gratPrev
          ])

        addGratLines()
      }

      if (com.followGratLbls) {
        gratLbls(getTrans(), scaleFactor)
      } else {
        let opac = gratFontOpac()

        com.lbl = com.gGrat
          .selectAll('text.' + 'grat')
          .transition('update')
          .duration(times.anim_arc)
          .style('fill-opacity', opac)
          .style('stroke-opacity', Math.min(0.9, opac * 2))
      }
    }
    funcD.zoomFuncEnd.updateGratScale = updateGratScale
  }

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function SvgSubArr () {
    let thisSvgSubArr = this

    let com = {}
    this.com = com

    // initialize a couple of functions to be overriden below
    let getScale = function () {
      return com.z['0.0']
    }
    let getTrans = function () {
      return [0, 0]
    }
    this.getScale = getScale
    this.getTrans = getTrans

    com.z = {}
    com.z['0.0'] = 1
    if (is_south) {
      com.z['0.1'] = 1.1
      com.z['0.2'] = 1.5
      com.z['1.0'] = 2
      com.z['1.1'] = 4
      com.z['2.0'] = 10
      com.z['2.1'] = com.z['2.0'] + 0.7
      com.z['2.2'] = com.z['2.0'] + 10
    } else {
      com.z['0.1'] = 1.1
      com.z['0.2'] = 1.2
      com.z['1.0'] = 1.25
      com.z['1.1'] = 3
      com.z['2.0'] = 4
      com.z['2.1'] = com.z['2.0'] + 1
      com.z['2.2'] = com.z['2.0'] + 6
    }
    com.z.prev = com.z['0.0']

    // initialize a global function (to be overriden below)
    let zoom_to_target = function (opt_in) {
      if (!locker.is_free('inInit')) {
        setTimeout(function () {
          zoom_to_target(opt_in)
        }, times.wait_loop)
      }
    }
    this.zoom_to_target = zoom_to_target

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function init_data (hasJoinedData) {
      // console.log('init_data')

      // -------------------------------------------------------------------
      // background container & zoom behaviour
      // -------------------------------------------------------------------
      if (!is_def(com.zoom_callable)) {
        // -------------------------------------------------------------------
        // attach the div which will host the main svg element
        // -------------------------------------------------------------------
        let svg_div_id = sgv_tag.subArr.id + 'Svg'
        let svg_div = sgv_tag.subArr.widget.get_ele(svg_div_id)

        if (!is_def(svg_div)) {
          let parent = sgv_tag.subArr.widget.get_ele(sgv_tag.subArr.id)
          svg_div = document.createElement('div')
          svg_div.id = svg_div_id

          dom_add(parent, svg_div)

          run_when_ready({
            pass: function () {
              return is_def(sgv_tag.subArr.widget.get_ele(svg_div_id))
            },
            execute: function () {
              init_data(hasJoinedData)
            }
          })

          return
        }
        sock.emit_mouse_move({ eleIn: svg_div, data: { widget_id: widget_id } })

        // -------------------------------------------------------------------
        // zoom start/on/end functions, attachd to com.svgZoom
        // -------------------------------------------------------------------
        let scaleStart = 0
        com.svgZoomStart = function () {
          scaleStart = d3.event.transform.k
          locker.add({ id: 'zoom', override: true })
        }

        com.svgZoomDuring = function () {
          com.zoom_callable.attr('transform', d3.event.transform)
          com.svgZoomUpdState()
        }

        com.svgZoomUpdState = function () {
          let scale = getScale()

          let changeState =
            (com.z.prev < com.z['1.0'] && scale >= com.z['1.0']) ||
            (com.z.prev >= com.z['1.0'] && scale < com.z['1.0']) ||
            (com.z.prev < com.z['1.1'] && scale >= com.z['1.1']) ||
            (com.z.prev >= com.z['1.1'] && scale < com.z['1.1']) ||
            (com.z.prev < com.z['2.0'] && scale >= com.z['2.0']) ||
            (com.z.prev >= com.z['2.0'] && scale < com.z['2.0'])

          if (changeState) {
            // console.log('svgZoomUpdState',zoom_state,scale)

            com.z.prev = scale
            if (scale < com.z['1.0']) zoom_state = 0
            else if (scale < com.z['2.0']) zoom_state = 1
            else zoom_state = 2

            setState({ type: 'zoom', data: null })
            hex00()
          }
        }

        com.svgZoomEnd = function () {
          locker.remove('zoom')
          com.svgZoomUpdState()

          // if on minimal zoom, center
          if (Math.abs(d3.event.transform.k - scaleStart) > 0.00001) {
            if (Math.abs(d3.event.transform.k - com.z['0.0']) < 0.00001) {
              if (locker.are_free(['autoZoomTarget'])) {
                zoom_to_target({
                  target: 'init',
                  scale: d3.event.transform.k,
                  duration_scale: 0.5
                })
              }

              // syncroniz changes with other panels
              // -------------------------------------------------------------------
              sync_state_send({
                type: 'syncTelFocus',
                syncTime: Date.now(),
                zoom_state: 0,
                target: 'init'
              })
            }
          }
        }

        com.svgZoom = d3.zoom().scaleExtent([com.z['0.0'], com.z['2.2']])
        com.svgZoom.on('start', com.svgZoomStart)
        com.svgZoom.on('zoom', com.svgZoomDuring)
        com.svgZoom.on('end', com.svgZoomEnd)

        // -------------------------------------------------------------------
        // programatic zoom to some target and scale - only use the last of any set of ovelapping
        // zoom requests, where zooming is only possible after lenD.zoomLock becomes free
        // -------------------------------------------------------------------
        run_loop.init({
          tag: 'zoom_to_target_sub_arr',
          func: do_zoom_to_target,
          n_keep: -1
        })

        // the actual function to be called when a zoom needs to be put in the queue
        zoom_to_target = function (opt_in) {
          if (!locker.is_free('inInit')) {
            setTimeout(function () {
              zoom_to_target(opt_in)
            }, times.wait_loop)
            return
          }
          if (!locker.are_free(['autoZoomTarget'])) return

          let target_name = opt_in.target
          let targetScale = opt_in.scale
          let duration_scale = opt_in.duration_scale

          if (targetScale < com.z['0.0']) targetScale = getScale()

          let trans_to // = (com.telXY[target_name] == undefined) ? [lenD.w[1]/2, lenD.h[1]/2] : com.telXY[target_name];
          if (target_name === 'init') {
            trans_to = [lenD.w[1] / 2, lenD.h[1] / 2]
          } else {
            if (target_name === '' || !is_def(com.telXY[target_name])) {
              let scale = getScale()
              let trans = getTrans()

              let x = (lenD.w[1] / 2 - trans[0]) / scale
              let y = (lenD.h[1] / 2 - trans[1]) / scale
              target_name = telData.telHover.id
              let diffMin = -1
              $.each(com.telXY, function (id_now, data_now) {
                if (data_now.isTel) {
                  let diffNow =
                    Math.pow(x - data_now.x, 2) + Math.pow(y - data_now.y, 2)
                  if (diffNow < diffMin || diffMin < 0) {
                    diffMin = diffNow
                    target_name = id_now
                  }
                }
              })
            }

            telData.telHover.id = target_name
            telData.telHover.subArr = telData.telSubArrId[target_name]
            trans_to = [com.telXY[target_name].x, com.telXY[target_name].y]
          }

          let func_start = function () {
            locker.add({ id: 'autoZoomTarget', override: true })
            // if(target_name != "") zoom_target = target_name;
          }
          let func_during = function () {}
          let func_end = function () {
            locker.remove('autoZoomTarget')

            let isDone = true
            if (Math.abs(getScale() - com.z['0.0']) < 0.00001) {
              let trans = getTrans()
              if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
                isDone = false
                zoom_to_target({
                  target: 'init',
                  scale: com.z['0.0'],
                  duration_scale: 1
                })
              }
            }
            if (duration_scale > 0 && isDone) setState({ type: 'zoom', data: null })
          }

          let data_out = {
            target_scale: targetScale,
            duration_scale: duration_scale,
            baseTime: 300,
            trans_to: trans_to,
            wh: [lenD.w[1], lenD.h[1]],
            cent: null,
            func_start: func_start,
            func_end: func_end,
            func_during: func_during,
            svg: com.svg,
            svgZoom: com.svgZoom,
            zoom_callable: com.zoom_callable,
            svg_zoom_node: com.svg_zoom_node
          }

          if (duration_scale < 0) {
            data_out.duration_scale = 0
            do_zoom_to_target(data_out)
          } else {
            run_loop.push({ tag: 'zoom_to_target_sub_arr', data: data_out })
          }
        }
        thisSvgSubArr.zoom_to_target = zoom_to_target

        // -------------------------------------------------------------------
        // create the main svg element
        // -------------------------------------------------------------------
        com.svg = d3
          .select(svg_div)
          // .classed("svgInGridStack_outer", true)
          .style('background', '#383B42')
          .append('svg')
          .attr('preserveAspectRatio', 'xMidYMid meet')
          .attr('viewBox', '0 0 ' + lenD.w[1] + ' ' + lenD.h[1])
          .style('position', 'relative')
          .style('width', '100%')
          .style('height', '100%')
          .style('top', '0px')
          .style('left', '0px')
          // .attr("viewBox", "0 0 "+lenD.w[1]+" "+lenD.h[1] * whRatio)
          // .classed("svgInGridStack_inner", true)
          .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
          .call(com.svgZoom)
          .on('dblclick.zoom', null)
          .on('wheel', function () {
            d3.event.preventDefault()
          })

        com.zoom_callable = com.svg.append('g')
        com.svgOverlay = com.svg.append('g')

        // // -------------------------------------------------------------------
        // // overlying rect, just to add a frame to the entire svg
        // // -------------------------------------------------------------------
        // com.svg.append("g").selectAll("rect").data([0])
        //   .enter()
        //   .append("rect")
        //     .attr("x", 0).attr("y", 0)
        //     .attr("width", lenD.w[1])
        //     .attr("height", lenD.h[1])
        //     .attr("stroke","#383B42") //.attr("stroke","red")
        //     .attr("stroke-width","3")
        //     .attr("fill", "transparent")
        //     .style("pointer-events", "none")

        // save the svg node to use for d3.zoomTransform() later
        com.svg_zoom_node = com.svg.nodes()[0]

        getScale = function () {
          return d3.zoomTransform(com.svg_zoom_node).k
        }
        getTrans = function () {
          return [
            d3.zoomTransform(com.svg_zoom_node).x,
            d3.zoomTransform(com.svg_zoom_node).y
          ]
        }
        thisSvgSubArr.getScale = getScale
        thisSvgSubArr.getTrans = getTrans

        // add one circle as background
        // -------------------------------------------------------------------
        com.zoom_callable
          .append('g')
          .selectAll('circle')
          .data([0])
          .enter()
          .append('circle')
          .attr('r', 0)
          .attr('cx', lenD.w[1] / 2)
          .attr('cy', lenD.h[1] / 2)
          .attr('fill', '#F2F2F2')
          .transition('inOut')
          .duration(times.anim_arc / 3)
          .attr('r', lenD.w[1] / 2.1)

        // initialize the hexagonal background grid
        hex00()

        //
        setOverText()
      }

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      if (hasJoinedData) {
        setHirch(true)
        initState01(true)
      }

      // // for testing...
      // setTimeout(function() {
      //   // zoom_to_target({ target:'M_1', scale:com.z["2.0"], duration_scale:1.5 } )
      //   // zoom_to_target({ target:'init', scale:com.z["0.0"], duration_scale:1.5 } )
      // }, 2000);

      locker.remove('inInitSubArr')
    }
    thisSvgSubArr.init_data = init_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setOverText () {
      if (!is_def(com.overRect)) {
        com.overRect = {}
        com.overRect.w = lenD.w[1]
        com.overRect.h = lenD.h[1] * 0.06
        com.overRect.x = 0
        com.overRect.y = lenD.h[1] - com.overRect.h

        com.overRect.data = [
          {
            id: 'tel_Id',
            txt: '',
            size: 15,
            x: 15,
            y: com.overRect.h / 2
          },
          {
            id: 'coordinates',
            txt: '',
            size: 15,
            x: 60,
            y: com.overRect.h / 2
          }
        ]

        com.svgOverlay
          .style('pointer-events', 'none')
          .attr('transform', function (d) {
            return 'translate(' + com.overRect.x + ',' + com.overRect.y + ')'
          })

        let defs = com.svgOverlay.append('defs')

        let grad = defs
          .append('linearGradient')
          .attr('id', 'svgOverlayGrad')
          .attr('x1', '0%')
          .attr('x2', '100%')
          .attr('y1', '100%')
          .attr('y2', '100%')

        grad
          .append('stop')
          .attr('offset', '25%')
          .attr('stop-color', '#383B42')
          .attr('stop-opacity', 1)
        grad
          .append('stop')
          .attr('offset', '70%')
          .attr('stop-color', '#383B42')
          .attr('stop-opacity', 0)
        // .attr("stop-color", "red").attr("stop-opacity", 1)

        com.svgOverlay
          .append('g')
          .selectAll('rect')
          .data([0])
          .enter()
          .append('rect')
          .style('pointer-events', 'none')
          .attr('width', com.overRect.w)
          .attr('height', com.overRect.h)
          .attr('x', 0)
          .attr('y', 0)
          .attr('fill', 'url(#svgOverlayGrad)')
          // .attr("fill","#F2F2F2")
          .style('opacity', 0.7)
      }

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      let tag_now = 'coord'
      let txt = com.svgOverlay
        .selectAll('text.' + tag_now)
        .data(com.overRect.data, function (d, i) {
          return d.id
        })

      txt
        .enter()
        .append('text')
        .attr('class', tag_now)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .style('text-anchor', 'left')
        .style('font-weight', 'normal')
        .style('stroke-width', 0.5)
        .style('stroke', function (d) {
          return '#F2F2F2'
        })
        .style('fill', function (d) {
          return '#F2F2F2'
        })
        .style('pointer-events', 'none')
        .style('vector-effect', 'non-scaling-stroke')
        .style('font-size', function (d) {
          return d.size + 'px'
        })
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
        .attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })
        .merge(txt)
        .transition('inOut')
        .duration(times.anim_arc)
        .text(function (d) {
          return d.txt
        })
        .style('fill-opacity', 0.9)
        .style('stroke-opacity', 0.7)

      txt
        .exit()
        .transition('inOut')
        .duration(times.anim_arc)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .remove()
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function updateOverText (txtV) {
      com.overRect.data[0].txt = txtV[0]
      com.overRect.data[1].txt = txtV[1]

      setOverText()
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update_data (data_in) {
      let isNewSubArr = is_def(data_in.subArr)
      setHirch(isNewSubArr)

      initState01(isNewSubArr)

      // if(isNewSubArr && getScale() > com.z["0.1"]) {
      //   zoom_to_target({ target:telData.telHover.id, scale:getScale(), duration_scale:2 });
      // }
    }
    thisSvgSubArr.update_data = update_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setHirch (isInit) {
      // create delay if currently in data update or a previous call of setHirch
      if (!(locker.is_free('setState') && locker.is_free('setHirch'))) {
        setTimeout(function () {
          setHirch(isInit)
        }, times.anim_arc)
        return
      }

      locker.add('setHirch')

      let tag_now

      if (!isInit) {
        tag_now = 'telCirc'
        com.hirchG
          .selectAll('circle.' + tag_now)
          .transition('updt')
          .duration(times.anim_arc)
          .style('stroke', function (d) {
            return hirchStyleStroke(d)
          })
          .style('fill', function (d) {
            return hirchStyleFill(d)
          })

        locker.remove({ id: 'setHirch', delay: times.anim_arc })

        return
      }

      let shiftXY = [(lenD.w[1] - whPack[0]) / 2, (lenD.h[1] - whPack[1]) / 2]

      if (!is_def(com.hirchG)) {
        com.hirchG = com.zoom_callable.append('g')
        com.hirchG.attr(
          'transform',
          'translate(' + shiftXY[0] + ',' + shiftXY[1] + ')'
        )
      }

      com.telXY = {}

      let subArr = { id: telData.subArr.id, children: [] }
      $.each(telData.subArr.children, function (index, subArrNow) {
        if (subArrNow.children.length > 0) {
          subArr.children.push(subArrNow)
          // subArrNow.children =
          tel_info.sort_ids({
            data: subArrNow.children,
            func: function (d) {
              return d.id
            }
          })
        }
      })

      com.hirch = d3.hierarchy(subArr).sum(function (d) {
        return 1
      })
      let packNode = d3
        .pack()
        .size(whPack)
        .padding(3)
      packNode(com.hirch)

      setCircTxt(com.hirch.descendants())

      locker.remove({ id: 'setHirch', delay: times.anim_arc * 2 })
    }

    function setCircTxt (data_in) {
      let tag_circ = 'telCirc'
      let tagText = 'telTitle'

      let shiftXY = [(lenD.w[1] - whPack[0]) / 2, (lenD.h[1] - whPack[1]) / 2]
      function focused (d, scale) {
        return telData.telHover.subArr === getSubArrId(d) && zoom_state >= scale
      }

      let circ = com.hirchG.selectAll('circle.' + tag_circ)
      let text = com.hirchG.selectAll('text.' + tagText)

      if (is_def(data_in)) {
        circ = circ.data(data_in, function (d) {
          return d.data.id
        })
        text = text.data(data_in, function (d) {
          return d.data.id
        })
      }

      circ
        .enter()
        .append('circle')
        .attr('class', tag_circ)
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .attr('r', function (d, i) {
          return 0
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('stroke-width', '0.5')
        .style('stroke', function (d) {
          return hirchStyleStroke(d)
        })
        .style('fill', function (d) {
          return hirchStyleFill(d)
        })
        .style('stroke-opacity', function (d) {
          return hirchStyleOpac(d, 0)
        })
        .style('fill-opacity', function (d) {
          return hirchStyleOpac(d, 0)
        })
        .on('mouseover', hirchStyleHover)
        .on('click', hirchStyleClick)
        .on('dblclick', hirchStyleDblclick)
        .merge(circ)
        .each(function (d, i) {
          com.telXY[d.data.id] = {
            isTel: !d.children,
            x: d.x + shiftXY[0],
            y: d.y + shiftXY[1]
          }
          if (!d.children) com.packNodeR = d.r
        })
        .transition('in')
        .duration(times.anim_arc)
        .style('stroke', function (d) {
          return hirchStyleStroke(d)
        })
        .style('fill', function (d) {
          return hirchStyleFill(d)
        })
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        // .style("stroke-opacity", function(d) { return hirchStyleOpac(d,0); } )
        // .style("fill-opacity",   function(d) { return hirchStyleOpac(d,0); } )
        // .attr("r",  function(d,i){ return hirchStyleRad(d,0); })
        .style('stroke-opacity', function (d) {
          return hirchStyleOpac(d, zoom_state === 0 ? 0 : focused(d, 1) ? 2 : 1)
        })
        .style('fill-opacity', function (d) {
          return hirchStyleOpac(d, zoom_state === 0 ? 0 : focused(d, 1) ? 2 : 1)
        })
        .attr('r', function (d, i) {
          return hirchStyleRad(d, zoom_state)
        })

      circ
        .exit()
        .transition('out')
        .duration(times.anim_arc)
        .attr('r', 0)
        .remove()

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      let fontSize = null

      text
        .enter()
        .append('text')
        .text(function (d) {
          // console.log(tel_info.get_title(d.children ? d.data.N : d.data.id),is_def(d.children) , d.data.N , d.data.id);
          if (!d.parent) return ''
          else if (d.data.id === tel_info.no_subArr_name()) {
            return tel_info.no_subArr_title()
          } else return tel_info.get_title(d.children ? d.data.N : d.data.id)
        })
        .attr('class', tagText)
        .style('font-weight', 'bold')
        .style('opacity', '0')
        .style('fill', '#383b42')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('transform', txtTrans)
        .style('fill-opacity', function (d) {
          if (d.children) return 0.4
          else return 1
        })
        .style('stroke-width', function (d) {
          if (d.children) return 0.7
          else return 0.3
        })
        .attr('text-anchor', 'middle')
        .style('stroke', '#383b42')
        .merge(text)
        .each(function (d) {
          if (!d.children && !is_def(fontSize)) {
            fontSize = [hirchStyleTitleSize(d, 0), hirchStyleTitleSize(d, 1)]
          }
        })
        .each(function (d) {
          let scale = d.children ? 1.5 : 1
          d.fontSize = [fontSize[0] * scale, fontSize[1] * scale]
        })
        .transition('in')
        .duration(times.anim_arc)
        .attr('dy', function (d, i) {
          if (d.children) {
            return 0
          } else return d.fontSize[0] / 3 + 'px' // (-d.fontSize[0]/3)+"px";
        })
        .attr('transform', txtTrans)
        .style('opacity', function (d, i) {
          return d.parent && !d.children ? 1 : 1
        })
        .attr('font-size', function (d, i) {
          if (!d.children) {
            return (
              d.fontSize[zoom_state === 0 ? 0 : focused(d, 1) ? 1 : 0] + 'px'
            )
          } else {
            return d.fontSize[0] + 'px'
          }
        })

      text
        .exit()
        .transition('out')
        .duration(times.anim_arc)
        .style('opacity', 0)
        .remove()

      function txtTrans (d) {
        return (
          'translate(' +
          d.x +
          ',' +
          (d.y + (d.children ? -d.r : -1 * focused(d, 1) * d.r)) +
          ')'
        )
      }
    }

    function hirchStyleStroke (d) {
      return '#383b42'
      // return d.children ? "#383b42" : telData.idToCol[d.data.id];
    }
    function hirchStyleFill (d) {
      return d.children ? '#383b42' : telData.idToCol[d.data.id]
    }
    function hirchStyleOpac (d, scale) {
      if (!d.parent) return 0

      let opac = d.children ? 0.07 : 0.9
      if (scale === 1) opac *= 0.5
      else if (scale === 2) opac *= d.children ? 0.4 : 0.1

      return opac
    }
    function hirchStyleRad (d, scale) {
      if (!d.parent) return d.r * 10

      let r = d.r
      if (d.parent.data.id === 'subArr') r *= 1.05
      if (scale > 0 && !d.children) r *= 1.1

      return r
    }
    function hirchStyleTitleSize (d, scale) {
      return d.r / 2 * (scale === 0 ? 1 : 0.6)
    }

    function hirchStyleHover (d) {
      if (d.height > 0) return
      if (getScale() >= com.z['1.0']) return

      hirchStyleClick(d)
    }

    function hirchStyleClick (d) {
      // console.log('wwwwwww',d);
      function setOnTelIdTry () {
        if (locker.is_free('dataChange')) {
          // console.log('hov... ',d.data.id)
          setOnTelId(d)

          svgSkyPos.update_data()

          if (locker.is_free('zoom') && locker.is_free('zoom_to_target')) {
            setState({ type: 'hover', data: d })
          }
        } else {
          setTimeout(function () {
            setOnTelIdTry()
          }, times.anim_arc / 2)
        }
      }
      setOnTelIdTry()
    }
    thisSvgSubArr.hirchStyleClick = hirchStyleClick

    // FIXME !!!!!!!!!!!!!!!!!!!
    // FIXME !!!!!!!!!!!!!!!!!!!
    // FIXME !!!!!!!!!!!!!!!!!!!
    // FIXME !!!!!!!!!!!!!!!!!!!
    // FIXME !!!!!!!!!!!!!!!!!!!
    // FIXME !!!!!!!!!!!!!!!!!!!
    // FIXME !!!!!!!!!!!!!!!!!!!
    // FIXME !!!!!!!!!!!!!!!!!!!
    function hirchStyleDblclick (d) {
      let scale = getScale()

      if (scale < com.z['1.1'] * 0.999) {
        zoom_to_target({
          target: d.data.id,
          scale: Math.max(com.z['1.1'], scale),
          duration_scale: 1.5
        })
      } else if (scale < com.z['2.0'] * 0.999) {
        if (telData.telHover.subArr === telData.telHover.clickedSubArr) {
          zoom_to_target({
            target: d.data.id,
            scale: Math.max(com.z['2.0'], scale),
            duration_scale: 1.5
          })
        } else {
          zoom_to_target({
            target: d.data.id,
            scale: Math.max(com.z['1.1'], scale),
            duration_scale: 1.5
          })
        }
      } else {
        zoom_to_target({
          target: d.data.id,
          scale: Math.max(com.z['2.0'], scale),
          duration_scale: 1.5
        })
      }

      telData.telHover.clickedSubArr = telData.telHover.subArr
    }

    function getSubArrId (d) {
      return d.parent ? telData.telSubArrId[d.data.id] : ''
      // let subArrId = "";
      // if(d.parent) {
      //   if(d.parent.data.id  == "subArr") subArrId = d.data.id;
      //   else                              subArrId = d.parent.data.id;
      // }
      // // console.log(d.data.id,subArrId);
      // return subArrId;
    }

    function setOnTelId (data_in) {
      if (data_in.depth === 0) return
      locker.add('dataChange')

      let subArrId = getSubArrId(data_in)

      // if not the root node
      if (data_in.height === 0) {
        telData.telHover.subArr = subArrId

        // if hovering over a spesific telescope
        if (!data_in.children) {
          telData.telHover.id = data_in.data.id
        } else {
          // if hovering over a subArr but not on a telescope, select the first element in the group
          if (telData.subArrIds[subArrId].children.length > 0) {
            telData.telHover.id = telData.subArrIds[subArrId].children[0].id
          }
        }
      }

      locker.remove('dataChange')
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setStateOnce (opt_in) {
      let type = opt_in.type
      // let data_in = opt_in.data

      // create delay if currently in data update or a previous call of setState
      if (!locker.are_free(['setState', 'setHirch', 'dataChange'])) {
        // console.log('delay setState')
        setTimeout(function () {
          setState(opt_in)
        }, times.anim_arc)
        return
      }
      // console.log('setState',opt_in)
      locker.add('dataChange')
      locker.add('setState')

      let scale = getScale()
      let isChangeFocus =
        telData.telHover.subArr !== telData.telHover.focusedSubArr

      if (isChangeFocus || type === 'zoom' || type === 'dataChange') {
        telData.telHover.focusedSubArr = telData.telHover.subArr

        setCircTxt()
      }

      // -------------------------------------------------------------------
      // derive the tel/trg/pnt focuse state
      // -------------------------------------------------------------------
      let overTxt = []
      $.each(['trg', 'pnt'], function (trgTelIndex, trgTel) {
        $.each(telData[trgTel], function (index, ele_now) {
          let target_point_id = ele_now.id
          telData.trgPntFocus[trgTel][target_point_id] = false
        })
      })

      $.each(telData.tel, function (index, ele_now) {
        let tel_Id = ele_now.id
        let isHov = telData.telHover.id === tel_Id

        let isFocused = true
        if (zoom_state > 0) {
          if (scale < com.z['1.1']) {
            isFocused = telData.telHover.subArr === telData.telSubArrId[tel_Id]
          } else {
            isFocused = isHov
          }
        }

        if (isHov) {
          overTxt = [tel_info.get_title(tel_Id), parsePosTxt(ele_now.pos)]
        }

        telData.idToFocus['tel' + tel_Id] = isFocused

        if (isFocused) {
          $.each(['trg', 'pnt'], function (trgTelIndex, trgTel) {
            let target_point_id = ele_now[trgTel + 'Id']
            telData.trgPntFocus[trgTel][target_point_id] = true
          })
        }
      })

      $.each(['trg', 'pnt'], function (trgTelIndex, trgTel) {
        $.each(telData[trgTel], function (index, ele_now) {
          let target_point_id = ele_now.id
          let isFocused = telData.trgPntFocus[trgTel][target_point_id]

          telData.idToFocus[trgTel + target_point_id] = isFocused
        })
      })

      // update the overlay text with the coordinates of the focused tel
      updateOverText(overTxt)

      // set the main display according to the focused tel/sub-array by zoom state
      if (scale < com.z['1.0']) {
        if (type !== 'dataChange' || telData.prevState !== 0) {
          telData.prevState = 0
          telData.telHover.focusedSubArr = ''

          setState01(false, '')
          setState10(false, '')
        }
      } else if (scale < com.z['2.0']) {
        setState01(true, '')

        if (type !== 'dataChange' || telData.prevState !== 1 || isChangeFocus) {
          telData.prevState = 1
          setState10(false, '')
        }
      } else {
        telData.prevState = 2
        setState10(true, '')

        // syncroniz changes with other panels
        // -------------------------------------------------------------------
        sync_state_send({
          type: 'syncTelFocus',
          syncTime: Date.now(),
          zoom_state: 1,
          target: telData.telHover.id
        })
      }

      locker.remove('dataChange')
      locker.remove({ id: 'setState', delay: times.anim_arc })
    }
    this.setStateOnce = setStateOnce

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function initState01 (needInit) {
      let tagBck = 'subArr'
      let tagG = tagBck + 'telG'
      let tagTel = tagG + 'ele'

      if (!is_def(com[tagG])) {
        com[tagG] = com.zoom_callable.append('g')
      }

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      com[tagTel] = {}
      $.each(telData.subArr.children, function (index0, grpNow) {
        $.each(grpNow.children, function (index1, ele_now) {
          let tel_Id = ele_now.id
          let telD = find_dict_ele_in_obj(telData.tel, 'id', tel_Id, true)[1] // if(telD == undefined) return;
          let pntD =
            telD.pntId === tel_info.no_subArr_name()
              ? telD
              : find_dict_ele_in_obj(telData.pnt, 'id', telD.pntId, true)[1]

          com[tagTel][tel_Id] = {}
          com[tagTel][tel_Id].telD = telD
          com[tagTel][tel_Id].pntD = pntD
        })
      })
      // console.log(com[tagTel]);return;

      if (!needInit) return

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      let tagState = 's01'

      let width = com.packNodeR * 1.7
      let lblSize = width / 22
      let lblUnits = [unit_deg, unit_arcmin, unit_arcsec]
      let lblProps = {
        size: lblSize,
        units: lblUnits,
        offset: [lblSize * 1.5, lblSize * 0.5]
      }

      let scaleRad0 = width / 4.5
      let scaleRad1 = scaleRad0 / 2
      let scaleStroke0 = scaleRad0 / 6
      let scaleRad2 = scaleRad0 * 2.5
      let scaleWidth0 = width * 0.7
      let scaleWidth1 = width / 2 - (width - scaleWidth0) / 2
      let scaleWidth2 = -scaleRad0 - scaleStroke0 * 3

      let scaleDeltaTrans0 = []
      scaleDeltaTrans0.push([scaleRad0 / 2.5, -scaleRad0 / 1.5])
      scaleDeltaTrans0.push([
        scaleDeltaTrans0[0][0] + width / 9,
        scaleDeltaTrans0[0][1] - width / 9
      ])

      let tblFont = lblSize * 1.3
      // let scaleTable = scaleWidth2 - scaleStroke0 * 3.5

      let centre0, centre1, centre2, centre3
      centre0 = [-scaleDeltaTrans0[0][0], -scaleDeltaTrans0[0][1]]
      centre1 = [-scaleWidth1, -scaleDeltaTrans0[0][1] - scaleWidth2]
      centre2 = [-scaleDeltaTrans0[1][0], -scaleDeltaTrans0[1][1]]

      let centreLabel0 = centre0
      let centreLabel1 = [
        centre2[0] - scaleRad2 * 0.15,
        centre2[1] - scaleRad2 * 1
      ]
      let centreLabel2 = [centre1[0], centre1[1] - scaleStroke0 * 1.5]

      com[tagState] = {}
      com[tagState].tagBck = tagBck
      com[tagState].tagG = tagG
      com[tagState].lblProps = lblProps
      com[tagState].scaleRad0 = scaleRad0
      com[tagState].scaleRad1 = scaleRad1
      com[tagState].scaleStroke0 = scaleStroke0
      com[tagState].scaleRad2 = scaleRad2
      com[tagState].scaleWidth0 = scaleWidth0
      com[tagState].scaleWidth1 = scaleWidth1
      com[tagState].scaleWidth2 = scaleWidth2
      com[tagState].scaleDeltaTrans0 = scaleDeltaTrans0
      com[tagState].tblFont = tblFont
      com[tagState].centre0 = centre0
      com[tagState].centre1 = centre1
      com[tagState].centre2 = centre2
      com[tagState].centreLabel0 = centreLabel0
      com[tagState].centreLabel1 = centreLabel1
      com[tagState].centreLabel2 = centreLabel2

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      tagState = 's10'

      width = com.packNodeR * 1.5
      lblSize = width / 30
      lblUnits = [unit_deg, unit_arcmin, unit_arcsec]
      lblProps = {
        size: lblSize,
        units: lblUnits,
        offset: [lblSize * 1.3, lblSize * 0.5]
      }

      scaleRad0 = width / 4
      scaleRad1 = scaleRad0 / 3.5
      scaleStroke0 = scaleRad0 / 8
      scaleRad2 = scaleRad0 * 2
      scaleWidth0 = width * 0.7
      scaleWidth1 = width / 2 - (width - scaleWidth0) / 2
      scaleWidth2 = -scaleRad0 - scaleStroke0 * 3

      scaleDeltaTrans0 = []
      scaleDeltaTrans0.push([width / 4, width / 9])
      scaleDeltaTrans0.push([-width / 20, scaleDeltaTrans0[0][1] - width / 4])
      scaleDeltaTrans0.push([-width / 4.5, scaleDeltaTrans0[0][1] - width / 12])

      centre0 = [-scaleDeltaTrans0[0][0] - width / 20, -scaleDeltaTrans0[0][1]]
      centre2 = [-scaleDeltaTrans0[1][0] + width / 20, -scaleDeltaTrans0[1][1]]
      centre3 = [-scaleDeltaTrans0[2][0] + width / 20, -scaleDeltaTrans0[2][1]]

      centreLabel0 = centre0
      centreLabel1 = [centre2[0] - scaleRad2 * 0.15, centre2[1] - scaleRad2 * 1]
      centreLabel2 = [centre1[0], centre1[1] - scaleStroke0 * 1.5]

      centre1 = []
      let wh1 = []
      centre1.push([centre0[0] - scaleRad0, centre0[1] - scaleWidth2 * 1.15])
      wh1.push([scaleRad0 * 2, scaleStroke0])
      centre1.push([centre2[0], centre1[0][1]])
      wh1.push([scaleRad0 * 2, scaleStroke0])
      centre1.push([0.0 - width * 0.425, centre1[0][1] + wh1[0][1] * 5])
      wh1.push([width * 0.85, scaleStroke0 * 1.5])

      let centLblV = []
      centLblV.push([centre1[0][0], centre1[0][1] - wh1[0][1]])
      centLblV.push([centre1[1][0], centre1[1][1] - wh1[1][1]])
      centLblV.push([
        centre1[2][0] - wh1[2][1],
        centre1[2][1] + wh1[2][1] * 0.6
      ])

      let scaleRad = [1, 0.6, 0.25]

      let tableHeight =
        0.55 *
        (width / 2 + scaleDeltaTrans0[0][1] + scaleWidth2 - scaleStroke0 * 5)
      let tablePos10 = {
        x: -width * 0.45,
        y: width * 0.45 - tableHeight,
        w: width * 0.9,
        h: tableHeight
      }

      com[tagState] = {}
      com[tagState].tagBck = tagBck
      com[tagState].tagG = tagG
      com[tagState].lblProps = lblProps
      // com[tagState].scaleRad0    = scaleRad0;
      // com[tagState].scaleRad1    = scaleRad1;
      // com[tagState].scaleStroke0 = scaleStroke0;
      // com[tagState].scaleRad2    = scaleRad2;
      com[tagState].scaleWidth0 = scaleWidth0
      com[tagState].scaleWidth1 = scaleWidth1
      com[tagState].scaleWidth2 = scaleWidth2
      com[tagState].scaleDeltaTrans0 = scaleDeltaTrans0
      com[tagState].tblFont = tblFont
      com[tagState].centre0 = centre0
      // com[tagState].centre1     = centre1;
      com[tagState].centre2 = centre2
      com[tagState].centre3 = centre3
      com[tagState].centreLabel0 = centreLabel0
      com[tagState].centreLabel1 = centreLabel1
      com[tagState].centreLabel2 = centreLabel2
      com[tagState].scaleRad = scaleRad
      com[tagState].tablePos10 = tablePos10

      $.each(scaleRad, function (index, scaleRadNow) {
        com[tagState]['scaleRad0' + index] = scaleRad0 * scaleRadNow
        com[tagState]['scaleRad1' + index] = scaleRad1 * scaleRadNow
        com[tagState]['scaleRad2' + index] = scaleRad2 * scaleRadNow
        com[tagState]['sclR3' + index] =
          scaleRad1 *
          (index === 2 ? (scaleRad[0] + scaleRad[1]) / 2 : scaleRad[1])
        com[tagState]['scaleStroke0' + index] = scaleStroke0 * scaleRadNow

        com[tagState]['centre1' + index] = centre1[index]
        com[tagState]['wh1' + index] = wh1[index]
        com[tagState]['centreLabel3' + index] = centLblV[index]
      })
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setState01 (isOn, tel_IdOn) {
      // console.log('__setStateS01')
      let tagBck = 'subArr'
      let tagG = tagBck + 'telG'
      let tagTel = tagG + 'ele'
      // let tagState = 's01'

      let data_in = {}
      data_in.azm = []
      data_in.zen = []
      if (isOn) {
        let scale = getScale()
        $.each(telData.subArrIds[telData.telHover.subArr].children, function (
          index,
          ele_now
        ) {
          let tel_Id = ele_now.id

          if (tel_IdOn === '' || tel_IdOn === tel_Id) {
            let telD = com[tagTel][tel_Id].telD
            let pntD = com[tagTel][tel_Id].pntD
            let isHov = telData.telHover.id === tel_Id && scale >= com.z['1.1']

            // if(tel_Id == 'M_2') console.log('+++',pntD.pos)
            data_in.azm.push({
              id: tel_Id,
              pos: telD.pos[0],
              pnt: pntD.pos[0],
              col: telD.col,
              hasLbls: isHov,
              hasCentLbl: isHov
            })
            data_in.zen.push({
              id: tel_Id,
              pos: telD.pos[1],
              pnt: pntD.pos[1],
              col: telD.col,
              hasLbls: isHov,
              hasCentLbl: isHov
            })
          }
        })
      }
      // console.log(data_in); return

      let opt = {}
      opt.index = 0
      opt.isArc = false
      opt.tagState = 's01'
      opt.tagType = '0'
      opt.scaleRad0 = 'scaleRad0'
      opt.scaleRad1 = 'scaleRad1'
      opt.scaleStroke0 = 'scaleStroke0'
      opt.lblProps = 'lblProps'
      opt.center = 'centre0'
      opt.centLbl = 'centreLabel0'
      opt.data = data_in.azm

      addRing(opt)

      opt = {}
      opt.index = 0
      opt.isArc = true
      opt.tagState = 's01'
      opt.tagType = '1'
      opt.scaleRad0 = 'scaleRad2'
      opt.scaleRad1 = 'scaleRad1'
      opt.scaleStroke0 = 'scaleStroke0'
      opt.lblProps = 'lblProps'
      opt.center = 'centre2'
      opt.centLbl = 'centreLabel1'
      opt.data = data_in.zen

      addRing(opt)

      data_in = null
    }

    function setState10 (isOn, tel_IdOn) {
      // console.log('__setStateS10')
      let tagBck = 'subArr'
      let tagG = tagBck + 'telG'
      let tagTel = tagG + 'ele'
      // let tagState = 's10'

      let showByPercision = true

      let data_in = {}
      data_in.azm = [[], [], []]
      data_in.zen = [[], [], []]
      data_in.posDiff = [] // data_in.tabel = []; data_in.remove = [];

      let hov = telData.telHover.subArr
      if (is_def(hov)) {
        if (is_def(telData.subArrIds[hov])) {
          $.each(telData.subArrIds[hov].children, function (index, ele_now) {
            let tel_Id = ele_now.id

            if (isOn && (tel_IdOn === '' || tel_IdOn === tel_Id)) {
              let telD = com[tagTel][tel_Id].telD
              let pntD = com[tagTel][tel_Id].pntD
              let isHov = telData.telHover.id === tel_Id
              // if(tel_Id=='M_10') console.log(telD,pntD)

              let posDiff0 = telD.pos[0] - pntD.pos[0]
              let posDiff1 = telD.pos[1] - pntD.pos[1]
              let posDiff2 = Math.sqrt(
                Math.pow(posDiff0, 2) + Math.pow(posDiff1, 2)
              )
              let posDiffV = [posDiff0, posDiff1, posDiff2]

              let isDiffMin = [true, true]
              let isDiffSec = [true, true]
              if (showByPercision) {
                $.each([0, 1], function (index_, index) {
                  let posDiff = Math.abs(index === 0 ? posDiff0 : posDiff1)
                  if (index === 0) {
                    if (posDiff >= 360) posDiff -= 360
                  } else {
                    if (posDiff >= 90) posDiff -= 90
                  }
                  let posDiffDms = deg_dms(posDiff)
                  isDiffMin[index] = posDiffDms[0] === 0
                  isDiffSec[index] = posDiffDms[0] === 0 && posDiffDms[1] === 0

                  // if(isHov&&index_==1) console.log('posDiff -',index,'-',Math.abs((index == 0) ? posDiff0 : posDiff1),posDiff,posDiffDms)
                })
              }

              let azm = {
                id: tel_Id,
                pos: telD.pos[0],
                pnt: pntD.pos[0],
                col: telD.col,
                hasLbls: isHov,
                hasCentLbl: isHov
              }
              let zen = {
                id: tel_Id,
                pos: telD.pos[1],
                pnt: pntD.pos[1],
                col: telD.col,
                hasLbls: isHov,
                hasCentLbl: isHov
              }

              // if( (Math.floor(Math.random()*1000))%2===0 )
              $.each([0, 1, 2], function (index_, index) {
                if (
                  index === 0 ||
                  (index === 1 && isDiffMin[0]) ||
                  (index === 2 && isDiffSec[0])
                ) {
                  data_in.azm[index].push(azm)
                }
                if (
                  index === 0 ||
                  (index === 1 && isDiffMin[1]) ||
                  (index === 2 && isDiffSec[1])
                ) {
                  data_in.zen[index].push(zen)
                }
              })

              if (isHov) {
                data_in.posDiff.push({
                  id: tel_Id,
                  posDiff: posDiffV,
                  col: telD.col,
                  hasLbls: isHov,
                  hasCentLbl: isHov
                })
                // console.log('posDiffV',posDiffV)
              }
            }
          })
        }
      }

      // -------------------------------------------------------------------
      // azimuth (full circle)
      // -------------------------------------------------------------------
      $.each([0, 1, 2], function (index_, index) {
        let opt = {}
        opt.index = index
        opt.isArc = false
        opt.tagState = 's10'
        opt.tagType = '0'
        opt.scaleRad0 = 'scaleRad0' + index
        opt.scaleRad1 = 'scaleRad1' + index
        opt.scaleStroke0 = 'scaleStroke0' + index
        opt.lblProps = 'lblProps'
        opt.center = 'centre0'
        opt.centLbl = 'centreLabel0'
        opt.data = data_in.azm[index]

        if (isOn || (!isOn && index > 0)) addRing(opt)
      })

      // -------------------------------------------------------------------
      // zenith (1/4 of circle)
      // -------------------------------------------------------------------
      $.each([0, 1, 2], function (index_, index) {
        let opt = {}
        opt.index = index
        opt.tagState = 's10'
        opt.tagType = '1'
        opt.scaleRad0 = (index === 0 ? 'scaleRad2' : 'scaleRad0') + index
        opt.scaleRad1 = 'scaleRad1' + index
        opt.scaleStroke0 = 'scaleStroke0' + index
        opt.lblProps = 'lblProps'
        opt.center = index === 0 ? 'centre2' : 'centre3'
        opt.centLbl = 'centreLabel1'
        // opt.onlyMove   = (index == 0)
        opt.data = data_in.zen[index]

        if (isOn || (!isOn && index > 0)) {
          opt.isArc = index === 0
          addRing(opt)
        }
      })

      // -------------------------------------------------------------------
      // difference between position and pointing (azimuth and zenith combined)
      // -------------------------------------------------------------------
      $.each([0, 1, 2], function (index_, index) {
        let opt = {}
        opt.index = index
        opt.tagState = 's10'
        opt.scaleRad1 = 'sclR3' + index
        opt.scaleStroke0 = 'scaleStroke0' + index
        opt.lblProps = 'lblProps'
        opt.center = 'centre1' + index
        opt.centLbl = 'centreLabel3' + index
        opt.wh = 'wh1' + index
        opt.data = data_in.posDiff

        addStretchBand(opt)
      })

      data_in = null

      // // -------------------------------------------------------------------
      // // table with pos/pnt/diff
      // // -------------------------------------------------------------------
      // $.each(data_in.tabel, function(index_,data_now) {
      //   let tel_Id = data_now.id
      //   let telD  = data_now.telD
      //   let pntD  = data_now.pntD

      //   let tblFont   = com[tagState][opt_in.tblFont];
      //   let tablePos10 = { "x":(com[tagState].tablePos10.x+com.telXY[tel_Id].x), "y":(com[tagState].tablePos10.y+com.telXY[tel_Id].y),
      //                     "w":com[tagState].tablePos10.w, "h":com[tagState].tablePos10.h }

      //   // -------------------------------------------------------------------
      //   // add a table with the positions
      //   // -------------------------------------------------------------------
      //   let deg_dms_pos0 = deg_dms(telD.pos[0]), deg_dms_pos1 = deg_dms(telD.pos[1]),
      //       deg_dms_pnt0 = deg_dms(pntD.pos[0]), deg_dms_pnt1 = deg_dms(pntD.pos[1])

      //   let tblCol  = ['',symbols.phi+unit_deg,symbols.phi+unit_arcmin,symbols.phi+unit_arcsec,symbols.delta+unit_deg,symbols.delta+unit_arcmin,symbols.delta+unit_arcsec]

      //   let tel_deg_dms = deg_dms(telD.pos[0]), pnt_deg_dms = deg_dms(pntD.pos[0]);

      //   let rowTitle = [ "pos","pnt",symbols.Delta ]

      //   let colTitle = [ "", symbols.space+symbols.phi+unit_deg ,   symbols.space+symbols.phi+unit_arcmin ,   symbols.space+symbols.phi+unit_arcsec ,
      //                        symbols.space+symbols.delta+unit_deg , symbols.space+symbols.delta+unit_arcmin , symbols.space+symbols.delta+unit_arcsec ]

      //   let tblData = []
      //   tblData.push({ 0:rowTitle[0], 1:telD.pos[0], 2:deg_dms_pos0[1], 3:deg_dms_pos0[2],
      //                                 4:telD.pos[1], 5:deg_dms_pos1[1], 6:deg_dms_pos1[2]  })

      //   tblData.push({ 0:rowTitle[1], 1:pntD.pos[0], 2:deg_dms_pnt0[1], 3:deg_dms_pnt0[2],
      //                                 4:pntD.pos[1], 5:deg_dms_pnt1[1], 6:deg_dms_pnt1[2]  })

      //   tblData.push({ 0:rowTitle[2], 1:pntD.pos[0]-telD.pos[0], 2:(deg_dms_pnt0[1]-deg_dms_pos0[1]), 3:(deg_dms_pnt0[2]-deg_dms_pos0[2]),
      //                                 4:pntD.pos[1]-telD.pos[1], 5:(deg_dms_pnt1[1]-deg_dms_pos1[1]), 6:(deg_dms_pnt1[2]-deg_dms_pos1[2])  })

      //   let tblColProps = { 0:{"title":"",          "type":"s", "width":1,  "format":null,            "fontSize":tblFont, "anch":"right","fontWgt":"bold"  } ,
      //                       1:{"title":colTitle[1], "type":"d", "width":1.4,"format":d3.format(".3f"),"fontSize":tblFont, "anch":"left", "fontWgt":"normal"} ,
      //                       2:{"title":colTitle[2], "type":"i", "width":1,  "format":d3.format("d"),  "fontSize":tblFont, "anch":"left", "fontWgt":"normal"} ,
      //                       3:{"title":colTitle[3], "type":"i", "width":1,  "format":d3.format("d"),  "fontSize":tblFont, "anch":"left", "fontWgt":"normal"} ,
      //                       4:{"title":colTitle[4], "type":"d", "width":1.4,"format":d3.format(".3f"),"fontSize":tblFont, "anch":"left", "fontWgt":"normal"} ,
      //                       5:{"title":colTitle[5], "type":"i", "width":1,  "format":d3.format("d"),  "fontSize":tblFont, "anch":"left", "fontWgt":"normal"} ,
      //                       6:{"title":colTitle[6], "type":"i", "width":1,  "format":d3.format("d"),  "fontSize":tblFont, "anch":"left", "fontWgt":"normal"} ,
      //                       "-":{"title":"",        "type":"i", "width":0.4,"format":d3.format("d"),  "fontSize":tblFont, "anch":"left", "fontWgt":"normal"}
      //                     }

      //   let optTbl         = {};
      //   optTbl.com      = com
      //   optTbl.tagG     = tagG
      //   optTbl.tag      = "tbl10_"//+tel_Id
      //   optTbl.pos      = tablePos10
      //   optTbl.data     = tblData
      //   optTbl.rowRules = {}//{"rowNumber":[0,2], "rowValue":[ ["col0",["14","15"]], ["col1",[5]] ]}
      //   optTbl.colsIn   = [0,"-",1,"-",2,3,"-",4,"-",5,6] // list of keys (does not need to be integers) matching selected columns (= keys of tblColProps and tblData)
      //   optTbl.colProps = tblColProps
      //   optTbl.lines    = { "row":[1], "col":[1] } // list of row/column positions
      //   optTbl.flags    = { "addColTitle":true }

      //   addTable(optTbl); //log(tblData)
      // })

      // // remove unneeded table
      // if(data_in.tabel.length == 0) {
      //   let optTbl         = {};
      //   optTbl.com      = com
      //   optTbl.tagG     = tagG
      //   optTbl.tag      = "tbl10_"//+tel_Id

      //   addTable(optTbl);
      // }

      // return;
    }

    // -------------------------------------------------------------------
    // helper functions for adding elements and for updating positions of sub elements
    // -------------------------------------------------------------------
    function addStretchBand (opt_in) {
      let index = opt_in.index
      let tagState = opt_in.tagState
      let tagBck = 'subArr'
      let tagG = tagBck + 'telG'
      let tagTel = tagG + 'ele'
      let tag_now = tagTel + index + 'band'
      let data = opt_in.data
      let addMainLbl = false

      let scaleRad1 = com[tagState][opt_in.scaleRad1]
      // let scaleStroke0 = com[tagState][opt_in.scaleStroke0]
      let lbl = com[tagState][opt_in.lblProps]
      let wh = com[tagState][opt_in.wh]

      function xy (tagIn, tel_Id) {
        return [
          com.telXY[tel_Id].x + com[tagState][opt_in[tagIn]][0],
          com.telXY[tel_Id].y + com[tagState][opt_in[tagIn]][1]
        ]
      }
      function center (tel_Id) {
        return xy('center', tel_Id)
      }
      function centLbl (tel_Id) {
        return xy('centLbl', tel_Id)
      }

      let data0 = []
      let dataLbl = []
      let dataCentLbl = []
      let xyDiff = {}

      let lblOffsetH = wh[1] * (index < 2 ? 3 : 2)
      let wFrac = 0.35
      let nLbls = 3
      let scaleV = [
        -(180 + 1e-4),
        -90,
        -45,
        -10,
        -1,
        -0.1,
        0.1,
        1,
        10,
        45,
        90,
        180 + 1e-4
      ]

      $.each(data, function (indexNow, data_now) {
        let tel_Id = data_now.id
        let posDiff = data_now.posDiff[index]
        if (posDiff > 180) posDiff -= 360
        else if (posDiff < -180) posDiff += 360

        if (data_now.hasCentLbl && index === 2) {
          dataCentLbl.push({ id: tel_Id })
        }

        let scaleIndex = 0
        let scaleVnow = []
        $.each(scaleV, function (index_, scaleNow) {
          if (index_ < scaleV.length - 1) {
            if (posDiff > scaleV[index_] && posDiff <= scaleV[index_ + 1]) {
              scaleIndex = index_
            }
            scaleVnow.push([scaleV[index_], scaleV[index_ + 1]])
          }
        })

        let rng
        let wNow
        let xNow
        let x0 = 0
        let w0 = wh[0] * wFrac / (scaleVnow.length - 1)
        let w1 = wh[0] * (1 - wFrac)
        let w2 = w0 * 0.3

        $.each(scaleVnow, function (index_, scaleNow) {
          rng = scaleNow[1] - scaleNow[0]
          wNow = index_ === scaleIndex ? w1 : w0
          xNow = x0
          x0 += wNow
          wNow -= w2

          if (index_ === scaleIndex) {
            xyDiff[tel_Id] = [
              xNow + wNow * (posDiff - scaleNow[0]) / rng,
              wh[1] / 2
            ]

            if (data_now.hasLbls) {
              for (let nLblNow = 0; nLblNow < nLbls; nLblNow++) {
                let lblX = xNow + nLblNow * wNow / (nLbls - 1)
                let lblV = formatLbl(scaleNow[0] + nLblNow * rng / (nLbls - 1))

                dataLbl.push({
                  id: tel_Id,
                  nLbl: nLblNow,
                  val: lblV,
                  pos: lblX
                })
              }
            }
          }

          data0.push({
            id: tel_Id,
            nRect: index_,
            rng: rng,
            x: xNow,
            w: wNow,
            opac: wNow <= w0 ? 0.2 : 0.1
          })
        })
      })

      // -------------------------------------------------------------------
      // labels
      // -------------------------------------------------------------------
      let lbl0 = com[tagG]
        .selectAll('text.' + tag_now + 'lbl0')
        .data(dataLbl, function (d, i) {
          return d.id + d.nLbl
        })

      lbl0
        .enter()
        .append('text')
        .text(function (d) {
          return d.val + lbl.units[0]
        })
        .attr('class', tag_now + 'lbl0')
        // .style("stroke", "#383b42")
        .style('stroke-width', 0)
        .style('opacity', '0')
        .style('fill', '#383b42')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', lbl.size * (index < 2 ? 1.2 : 1.5) + 'px')
        .attr('transform', function (d) {
          return (
            'translate(' +
            center(d.id)[0] +
            ',' +
            (center(d.id)[1] + lblOffsetH) +
            ')'
          )
        })
        .merge(lbl0)
        .transition('inOut')
        .duration(times.anim_arc)
        .attr('transform', function (d) {
          d.hasMoved =
            Math.abs(
              (this_trans(this)[0] - (center(d.id)[0] + d.pos)) /
                (center(d.id)[0] + d.pos)
            ) > 0.001
          return (
            'translate(' +
            (center(d.id)[0] + d.pos) +
            ',' +
            (center(d.id)[1] + lblOffsetH) +
            ')'
          )
        })
        .tween('text', function (d) {
          if (!d.hasMoved) return

          let that = d3.select(this)
          let i = d3.interpolateNumber(
            that
              .text()
              .replace(/,/g, '')
              .replace(lbl.units[0], ''),
            d.val
          )

          return function (t) {
            that.text(formatLbl(i(t)) + lbl.units[0])
          }
        })
        .style('opacity', 1)

      lbl0
        .exit()
        .attr('class', tag_now + 'lbl0' + 'exit')
        .transition('inOut')
        .duration(times.anim_arc)
        .style('opacity', 0)
        .remove()

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      if (addMainLbl) {
        let lbl1 = com[tagG]
          .selectAll('text.' + tag_now + 'lbl1')
          .data(dataCentLbl, function (d, i) {
            return d.id
          })

        lbl1
          .enter()
          .append('text')
          .text(function (d) {
            return symbols.Delta
          })
          .attr('class', tag_now + 'lbl1')
          .style('stroke', '#383b42')
          .style('opacity', '0')
          .style('fill', '#383b42')
          .attr('vector-effect', 'non-scaling-stroke')
          .style('pointer-events', 'none')
          .attr('text-anchor', 'middle')
          .style('font-size', function (d) {
            return lbl.size * (index === 2 ? 2 : 1.5) + 'px'
          })
          .attr('transform', function (d) {
            return (
              'translate(' +
              centLbl(d.id)[0] +
              ',' +
              (centLbl(d.id)[1] + lbl.offset[1]) +
              ')'
            )
          })
          .merge(lbl1)
          .transition('inOut')
          .duration(times.anim_arc)
          .style('font-size', function (d) {
            return lbl.size * (index === 2 ? 2 : 1.5) + 'px'
          })
          .style('opacity', 0.7)

        lbl1
          .exit()
          .attr('class', tag_now + 'lbl1' + 'exit')
          .transition('inOut')
          .duration(times.anim_arc)
          .style('opacity', 0)
          .remove()
      }
      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      com[tag_now + '0'] = com[tagG]
        .selectAll('rect.' + tag_now + '0')
        .data(data0, function (d, i) {
          return d.id + d.nRect
        })

      com[tag_now + '0']
        .enter()
        .append('rect')
        .attr('class', tag_now + '0')
        .style('stroke', '#383b42')
        .style('opacity', '0')
        .style('stroke-width', '0')
        .style('fill', '#383b42')
        .style('pointer-events', 'none')
        .attr('x', '0')
        .attr('y', '0')
        .attr('width', '0')
        .attr('height', wh[1] + 'px')
        .attr('transform', function (d) {
          return 'translate(' + center(d.id)[0] + ',' + center(d.id)[1] + ')'
        })
        // .transition("enter").duration(times.anim_arc)
        // .attr("r", function(d){ return scaleRad1+"px"; })
        .merge(com[tag_now + '0'])
        .transition('move')
        .duration(times.anim_arc)
        .attr('transform', function (d) {
          return 'translate(' + center(d.id)[0] + ',' + center(d.id)[1] + ')'
        })
        // .attr("height", (wh[1]+"px"))
        .style('opacity', function (d) {
          return d.opac
        })
        .attr('x', function (d) {
          return d.x
        })
        .attr('width', function (d) {
          return d.w
        })

      com[tag_now + '0']
        .exit()
        .attr('class', tag_now + '0' + 'exit')
        .transition('exit')
        .duration(times.anim_arc)
        .style('opacity', '0')
        .remove()

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      com[tag_now + '1'] = com[tagG]
        .selectAll('circle.' + tag_now + '1')
        .data(data, function (d, i) {
          return d.id
        })

      com[tag_now + '1']
        .enter()
        .append('circle')
        .attr('class', tag_now + '1')
        // .style("stroke", "#383b42")
        .style('opacity', '0.7')
        .style('stroke-width', '0')
        .style('fill', 'transparent')
        .style('pointer-events', 'none')
        .attr('r', '0')
        .attr('transform', function (d) {
          return (
            'translate(' +
            (center(d.id)[0] + xyDiff[d.id][0]) +
            ',' +
            (center(d.id)[1] + xyDiff[d.id][1]) +
            ')'
          )
        })
        .merge(com[tag_now + '1'])
        .transition('move')
        .duration(times.anim_arc)
        .attr('transform', function (d) {
          return (
            'translate(' +
            (center(d.id)[0] + xyDiff[d.id][0]) +
            ',' +
            (center(d.id)[1] + xyDiff[d.id][1]) +
            ')'
          )
        })
        .style('fill', function (d) {
          return getColStretchBand()
        }) // d.col
        .attr('r', scaleRad1 + 'px')

      com[tag_now + '1']
        .exit()
        .attr('class', tag_now + '1' + 'exit')
        .transition('exit')
        .duration(times.anim_arc)
        .attr('r', '0')
        .remove()

      data0 = null
      dataLbl = null
      dataCentLbl = null
      xyDiff = null
      lblOffsetH = null
      scaleV = null
    }

    function addRing (opt_in) {
      // console.log('addRing',opt_in)

      let index = opt_in.index
      let isArc = opt_in.isArc
      let tagState = opt_in.tagState
      let tagBck = 'subArr'
      let tagG = tagBck + 'telG'
      let tagTel = tagG + 'ele'
      let tag_now = tagTel + index + (isArc ? 'arc' : 'ring') + opt_in.tagType
      let data = opt_in.data

      let scaleRad0 = com[tagState][opt_in.scaleRad0]
      let scaleRad1 = com[tagState][opt_in.scaleRad1]
      let scaleStroke0 = com[tagState][opt_in.scaleStroke0]
      let lbl = com[tagState][opt_in.lblProps]

      function xy (tagIn, tel_Id) {
        return [
          com.telXY[tel_Id].x + com[tagState][opt_in[tagIn]][0],
          com.telXY[tel_Id].y + com[tagState][opt_in[tagIn]][1]
        ]
      }
      function center (tel_Id) {
        return xy('center', tel_Id)
      }
      function centLbl (tel_Id) {
        return xy('centLbl', tel_Id)
      }

      $.each(data, function (indexNow, data_now) {
        let tel_Id = data_now.id

        if (!is_def(com[tag_now + 'prev'])) {
          com[tag_now + 'prev'] = {}
        }
        if (!is_def(com[tag_now + 'prev'][tel_Id + 'pos'])) {
          com[tag_now + 'prev'][tel_Id + 'pos'] = 0
          com[tag_now + 'prev'][tel_Id + 'pnt'] = 0
          com[tag_now + 'prev'][tel_Id + 'r_0'] = 0
        }
      })

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      let arcNow = d3
        .arc()
        .startAngle(0)
        .endAngle(isArc ? tau / 4 : tau)
      function tweenArc (transition) {
        transition.attrTween('d', function (d) {
          let tel_Id = d.id
          let r0 = com[tag_now + 'prev'][tel_Id + 'r_0']
          com[tag_now + 'prev'][tel_Id + 'r_0'] = scaleRad0

          return function (t) {
            d.innerRadius = r0 + (scaleRad0 - r0) * interpolate01(t)
            d.outerRadius = d.innerRadius
            return arcNow(d)
          }
        })
      }

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      com[tag_now + '0'] = com[tagG]
        .selectAll('path.' + tag_now + '0')
        .data(data, function (d, i) {
          return d.id
        })

      com[tag_now + '0']
        .enter()
        .append('path')
        .attr('class', tag_now + '0')
        .style('stroke', '#383b42')
        .style('opacity', '0.1')
        .style('stroke-width', '0')
        .style('fill', 'transparent')
        .style('pointer-events', 'none')
        .attr('transform', function (d) {
          return 'translate(' + center(d.id)[0] + ',' + center(d.id)[1] + ')'
        })
        .transition('enter')
        .duration(times.anim_arc)
        .style('stroke-width', function (d) {
          return scaleStroke0 + 'px'
        })
        .call(tweenArc)

      let hasMoved
      com[tagG]
        .selectAll('path.' + tag_now + '0')
        .transition('updateSizeTrans')
        .duration(times.anim_arc)
        .attr('transform', function (d) {
          hasMoved =
            Math.abs((this_trans(this)[0] - center(d.id)[0]) / center(d.id)[0]) >
            0.001
          return 'translate(' + center(d.id)[0] + ',' + center(d.id)[1] + ')'
        })
        .style('stroke-width', function (d) {
          return scaleStroke0 + 'px'
        })
        .call(tweenArc)

      com[tag_now + '0']
        .exit()
        .attr('class', tag_now + '0' + 'exit')
        .transition('exit')
        .duration(times.anim_arc)
        .style('opacity', '0')
        .remove()

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      com[tag_now + '1'] = com[tagG]
        .selectAll('circle.' + tag_now + '1')
        .data(data, function (d, i) {
          return d.id
        })

      com[tag_now + '1']
        .enter()
        .append('circle')
        .attr('class', tag_now + '1')
        // .style("stroke", "#383b42")
        .style('opacity', '0.9')
        .style('stroke-width', '0')
        .style('fill', 'transparent')
        .style('pointer-events', 'none')
        .attr('r', '0')
        .attr('transform', function (d) {
          return transSet(true, 0, [scaleRad0, center(d.id)], index, false)
        })
      // .transition("enter").duration(times.anim_arc)
      // .attr("r", function(d){ return scaleRad1+"px"; })

      if (hasMoved) {
        com[tagG]
          .selectAll('circle.' + tag_now + '1')
          // .each(function(d){ if(d.id == 'M_2')console.log('ring',d.pos); })
          .transition('updateSizeTrans')
          .duration(times.anim_arc)
          .attr('transform', function (d) {
            return transSet(
              true,
              d.pos,
              [scaleRad0, center(d.id)],
              index,
              false
            )
          })
          .attr('r', function (d) {
            return scaleRad1 + 'px'
          })
          .style('fill', function (d) {
            return d.col
          })
      } else {
        com[tagG]
          .selectAll('circle.' + tag_now + '1')
          .transition('move')
          .duration(times.anim_arc)
          .attr('r', function (d) {
            return scaleRad1 + 'px'
          })
          .attrTween('transform', function (d, i) {
            return transUpdate(
              true,
              com[tag_now + 'prev'][d.id + 'pos'],
              d.pos,
              [scaleRad0, center(d.id)],
              index,
              d.id,
              tag_now + 'prev',
              d.id + 'pos'
            )
          })
          .style('fill', function (d) {
            return d.col
          })
      }

      com[tag_now + '1']
        .exit()
        .attr('class', tag_now + '1' + 'exit')
        .transition('exit')
        .duration(times.anim_arc)
        .attr('r', '0')
        .remove()

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      com[tag_now + '2'] = com[tagG]
        .selectAll('circle.' + tag_now + '2')
        .data(data, function (d, i) {
          return d.id
        })

      com[tag_now + '2']
        .enter()
        .append('circle')
        .attr('class', tag_now + '2')
        .style('stroke', '#383b42')
        .style('opacity', '0.7')
        .style('stroke-width', 0.1 * scaleRad1 + 'px')
        .style('fill', 'transparent')
        .style('pointer-events', 'none')
        .attr('r', '0')
        .attr('transform', function (d) {
          return transSet(true, 0, [scaleRad0, center(d.id)], index, false)
        })
      // .transition("enter").duration(times.anim_arc)
      // .attr("r", function(d){ return scaleRad1+"px"; })

      if (hasMoved) {
        com[tagG]
          .selectAll('circle.' + tag_now + '2')
          .transition('updateSizeTrans')
          .duration(times.anim_arc)
          .attr('transform', function (d) {
            return transSet(
              true,
              d.pnt,
              [scaleRad0, center(d.id)],
              index,
              false
            )
          })
          .attr('r', function (d) {
            return scaleRad1 + 'px'
          })
      } else {
        com[tagG]
          .selectAll('circle.' + tag_now + '2')
          .transition('move')
          .duration(times.anim_arc)
          .attr('r', function (d) {
            return scaleRad1 + 'px'
          })
          .attrTween('transform', function (d, i) {
            return transUpdate(
              true,
              com[tag_now + 'prev'][d.id + 'pnt'],
              d.pnt,
              [scaleRad0, center(d.id)],
              index,
              d.id,
              tag_now + 'prev',
              d.id + 'pnt'
            )
          })
      }

      com[tag_now + '2']
        .exit()
        .attr('class', tag_now + '2' + 'exit')
        .transition('exit')
        .duration(times.anim_arc)
        .attr('r', '0')
        .remove()

      // -------------------------------------------------------------------
      // labels
      // -------------------------------------------------------------------
      let nLbls
      let dataLbl = []
      let dataCentLbl = []
      if (isArc) {
        nLbls = 6
        $.each(data, function (indexNow, data_now) {
          let tel_Id = data_now.id

          if (data_now.hasLbls) {
            for (let nLblNow = 0; nLblNow < nLbls + 1; nLblNow++) {
              let posNow = nLblNow * 90 / nLbls
              let valNow = 90 - posNow
              let rot = nLblNow * (90 / 360) * 360 / nLbls

              dataLbl.push({
                id: tel_Id,
                nLbl: nLblNow,
                val: valNow,
                pos: posNow,
                rot: rot
              })
            }
          }

          if (data_now.hasCentLbl && index === 0) {
            dataCentLbl.push({ id: tel_Id })
          }
        })
      } else {
        nLbls = [10, 6, 3]
        $.each(data, function (indexNow, data_now) {
          let tel_Id = data_now.id

          if (data_now.hasLbls) {
            for (let nLblNow = 0; nLblNow < nLbls[index]; nLblNow++) {
              let posNow = nLblNow * (index === 0 ? 360 : 60) / nLbls[index]
              if (index === 0 && posNow > 180) posNow -= 360 // log(posNow)

              let rot = nLblNow * 360 / nLbls[index]
              if (rot > 90 && rot < 270) rot += 180

              dataLbl.push({ id: tel_Id, nLbl: nLblNow, pos: posNow, rot: rot })
            }

            if (data_now.hasCentLbl && index === 0) {
              dataCentLbl.push({ id: tel_Id })
            }
          }
        })
      }

      let lbl0 = com[tagG]
        .selectAll('text.' + tag_now + 'lbl0')
        .data(dataLbl, function (d, i) {
          return d.id + d.nLbl
        })
      lbl0
        .enter()
        .append('text')
        .text(function (d) {
          return d.pos + lbl.units[index]
        })
        .attr('class', tag_now + 'lbl0')
        .style('stroke', '#383b42')
        .style('stroke-width', 0.25)
        .style('opacity', '0')
        .style('fill', '#383b42')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', lbl.size + 'px')
        .attr('transform', function (d, i) {
          return (
            transSet(
              true,
              d.pos,
              [
                scaleRad0 + lbl.offset[0],
                [center(d.id)[0], center(d.id)[1] + lbl.offset[1]]
              ],
              index,
              true
            ) +
            'rotate(' +
            d.rot +
            ')'
          )
        })
        .merge(lbl0)
        .transition('inOut')
        .duration(times.anim_arc)
        .style('font-size', lbl.size + 'px')
        .attr('transform', function (d, i) {
          return (
            transSet(
              true,
              d.pos,
              [
                scaleRad0 + lbl.offset[0],
                [center(d.id)[0], center(d.id)[1] + lbl.offset[1]]
              ],
              index,
              true
            ) +
            'rotate(' +
            d.rot +
            ')'
          )
        })
        .style('opacity', 0.8)

      lbl0
        .exit()
        .attr('class', tag_now + 'lbl0' + 'exit')
        .transition('inOut')
        .duration(times.anim_arc)
        .style('opacity', 0)
        .remove()

      let lbl1 = com[tagG]
        .selectAll('text.' + tag_now + 'lbl1')
        .data(dataCentLbl, function (d, i) {
          return d.id
        })
      lbl1
        .enter()
        .append('text')
        .text(function (d) {
          return isArc ? symbols.delta : symbols.phi
        })
        .attr('class', tag_now + 'lbl1')
        .style('stroke', '#383b42')
        // .style("font-weight", "bold")
        .style('opacity', '0')
        .style('fill', '#383b42')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .style('font-size', function (d) {
          return lbl.size * 2 + 'px'
        })
        .attr('transform', function (d) {
          return (
            'translate(' +
            centLbl(d.id)[0] +
            ',' +
            (centLbl(d.id)[1] + lbl.offset[1]) +
            ')'
          )
        })
        .merge(lbl1)
        .transition('inOut')
        .duration(times.anim_arc)
        .attr('transform', function (d) {
          return (
            'translate(' +
            centLbl(d.id)[0] +
            ',' +
            (centLbl(d.id)[1] + lbl.offset[1]) +
            ')'
          )
        })
        .style('font-size', function (d) {
          return lbl.size * 2 + 'px'
        })
        .style('opacity', 0.7)

      lbl1
        .exit()
        .attr('class', tag_now + 'lbl1' + 'exit')
        .transition('inOut')
        .duration(times.anim_arc)
        .style('opacity', 0)
        .remove()

      dataLbl = null
      dataCentLbl = null
      nLbls = null
    }

    function transSet (isRing, pos, rad, type, isDms) {
      let dms = isDms ? pos : deg_dms(pos)[type]
      let typeScale = (type === 0 ? 360 : 60) / tau

      if (!isRing && type === 0) {
        typeScale = (dms > 0 ? -1 : 1) * 360 / tau
      }

      let angle = dms / typeScale
      if (isRing) angle -= tau / 4 // zero angle shifted to top

      let xyIn = [rad[0] * Math.cos(angle), rad[0] * Math.sin(angle)]
      let xyOut = [xyIn[0] + rad[1][0], xyIn[1] + rad[1][1]]

      // console.log(dms,typeScale,angle)
      return 'translate(' + xyOut[0] + ',' + xyOut[1] + ')'
    }

    function transUpdate (isRing, pos0, pos1, rad, type, id, tag0, tag1) {
      let prevDms = deg_dms(pos0)
      let posType0 = prevDms[type]
      let deltaPos = deg_dms(pos1)[type] - posType0

      if (type > 0) {
        if (deltaPos < -30) {
          deltaPos += 60
        }
      } // if(type == 1) console.log(deltaPos)

      return function (t) {
        prevDms[type] = posType0 + t * deltaPos
        com[tag0][tag1] = dms_deg(prevDms) // console.log(tag0,tag1)

        // if(tag=='pos'&&type==2)console. log(posType0,prevDms[type])
        return transSet(isRing, prevDms[type], rad, type, true)
      }
    }

    function formatLbl (val) {
      if (Math.abs(val) < 1e-10) return 0
      if (Math.abs(val) < 0.1) {
        return Math.floor(val * 100) / 100
      } else return d3.format('.1f')(val) //   d3.format(".2e")(val)
    }

    // -------------------------------------------------------------------
    // hexagonal grid serving as the background for the svg
    // -------------------------------------------------------------------
    function hex00 () {
      let tag_now = 'hex'
      let strk = 0.5
      let scale = getScale()

      let opac = '0.10'
      if (scale <= com.z['0.2']) opac = '0.25'
      else if (scale <= com.z['1.0']) opac = '0.15'

      // add the hexbin as another layer of the background
      // -------------------------------------------------------------------
      if (!is_def(com.svgHex)) {
        let hex_r = 18 // is_south ? 35 : 20;

        com.svgHex = {}
        com.svgHex.hex = d3
          .hexbin()
          .size([lenD.w[1], lenD.h[1]])
          .radius(hex_r)
        com.svgHex.g = com.zoom_callable.append('g')

        let xy = com.svgHex.hex([[lenD.w[1] / 2, -lenD.h[1] / 2]])
        let trans = [lenD.w[1] / 2 - xy[0].x, lenD.h[1] / 2 + xy[0].y]

        com.svgHex.trans = function (xyIn) {
          let xyOut = com.svgHex.hex([xyIn])

          return [xyOut[0].x + trans[0], xyOut[0].y + trans[1]]
        }

        com.svgHex.g
          .selectAll('path.' + tag_now)
          .data([0])
          .enter()
          .append('path')
          .attr('class', tag_now)
          .attr('fill', 'transparent')
          .attr('stroke', '#383b42')
          .attr('stroke-width', strk)
          .attr('opacity', opac)
          .attr('vector-effect', 'non-scaling-stroke')
          .attr('d', com.svgHex.hex.mesh())
      } else {
        com.svgHex.g
          .selectAll('path.' + tag_now)
          .transition('inOut')
          .duration(times.anim_arc)
          .attr('opacity', opac)
      }
    }
  }

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  let svgSubArr = new SvgSubArr()
  let svgSkyPos = new SvgSkyPos()
}