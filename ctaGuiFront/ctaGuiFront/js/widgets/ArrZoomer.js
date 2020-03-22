'use strict'
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// stric mode for the following script or function (must come at the very begining!)
// see: http://www.w3schools.com/js/js_strict.asp
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// main_script_tag used locally (will be overriden by other scripts...)
// must be compatible with the name of this js file, according to:
//    "/js/widget_"+main_script_tag+".js"
var main_script_tag = 'ArrZoomer'
// ------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global is_def */
/* global RunLoop */
/* global Locker */
/* global unique */
/* global dom_add */
/* global run_when_ready */
/* global ArrZoomerBase */

window.load_script({
  source: main_script_tag,
  script: '/js/widgets/ArrZoomer/ArrZoomerBase.js'
})

// ------------------------------------------------------------------
sock.widget_table[main_script_tag] = function (opt_in) {
  let x0 = 0
  let y0 = 0
  let h0 = 2
  let w0 = 12
  let divKey

  opt_in.widget_func = { sock_func: sock_arr_zoomer, main_func: main_arr_zoomer }
  opt_in.widget_div_id = opt_in.widget_id + 'widget_div'
  opt_in.ele_props = {}

  divKey = 'arr_zoomer_div'
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

  return
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
let sock_arr_zoomer = function (opt_in) {
  return
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
let main_arr_zoomer = function (opt_in) {
  let this_top = this
  let my_unique_id = unique()
  let widget_type = opt_in.widget_type
  let widget_source = opt_in.widget_source
  let tag_arr_zoomerSvg = opt_in.base_name
  let widget_id = opt_in.widget_id
  let widget_ele = opt_in.widget_ele
  let icon_divs = opt_in.icon_divs
  let sideId = opt_in.sideId

  let is_south = window.__site_type__ === 'S'

  let sgv_tag = {}
  $.each(widget_ele, function (index, ele_now) {
    sgv_tag[ele_now.id] = {
      id: tag_arr_zoomerSvg + ele_now.id,
      widget: ele_now.widget,
      whRatio: ele_now.w / ele_now.h
    }
  })

  // let lenD = { w: 500, h: 400 }
  let lenD = { w: 500, h: 350 }
  let arr_zoomerLockInitKey = 'inInitarr_zoomer' + my_unique_id


  // ------------------------------------------------------------------
  // 
  // ------------------------------------------------------------------
  let arr_zoomer_ele_opts = {
    do_ele: {
      main: true,
      ches: true,
      mini: true,
      tree: true,
      lens: !true,
    },
    trans: {
      main: 'translate(0,100)scale(2.5)',
      ches: 'translate(110,0)scale(3.8)',
      tree: 'translate(250,100)scale(2.5)',
      mini: 'translate(5,0)scale(1)',
      lens: 'translate(10,5)scale(0.18)',
      // mini: 'translate(240,0)scale(2.7)',
      // lens: 'translate(245,5)scale(0.60)',
    },
    main:{
      // dblclickZoomInOut: false,
    },
    ches:{
      // myOpt: 0,
    },
    mini:{
      // staticZoom: false,
    },
    tree: {
      // aspectRatio: 6/5,
    },
    lens: {
      aspectRatio: 4,
      hasTitles: true,
      // pointerEvents: true,
    },
  }

  // ------------------------------------------------------------------
  // delay counters
  // ------------------------------------------------------------------
  let locker = new Locker()
  locker.add('inInit')
  locker.add(arr_zoomerLockInitKey)

  // function loop
  let run_loop = new RunLoop({ tag: widget_id })

  // ------------------------------------------------------------------
  //
  // ------------------------------------------------------------------
  function init_data (dataDictIn) {
    if (sock.multiple_inits({ id: widget_id, data: dataDictIn })) {
      return
    }

    // ------------------------------------------------------------------
    // create the main svg element
    // ------------------------------------------------------------------
    let svg_div_id = sgv_tag.arr_zoomer_div.id + '_svg'
    let svg_div = sgv_tag.arr_zoomer_div.widget.get_ele(svg_div_id)

    if (!is_def(svg_div)) {
      let parent = sgv_tag.arr_zoomer_div.widget.get_ele(sgv_tag.arr_zoomer_div.id)
      let svg_div = document.createElement('div')
      svg_div.id = svg_div_id

      dom_add(parent, svg_div)

      run_when_ready({
        pass: function () {
          return is_def(sgv_tag.arr_zoomer_div.widget.get_ele(svg_div_id))
        },
        execute: function () {
          init_data(dataDictIn)
        }
      })

      return
    }
    sock.emit_mouse_move({ eleIn: svg_div, data: { widget_id: widget_id } })
    sock.set_icon_badge({ n_icon: dataDictIn.n_icon, icon_divs: icon_divs })

    // ------------------------------------------------------------------
    // create the main svg element
    // ------------------------------------------------------------------
    let svg = d3
      .select(svg_div)
      .style('background', '#383B42')
      .append('svg')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', '0 0 ' + lenD.w + ' ' + lenD.h)
      .style('position', 'relative')
      .style('width', '100%')
      .style('height', '100%')
      .style('top', '0px')
      .style('left', '0px')
      // .attr("viewBox", "0 0 "+lenD.w+" "+lenD.h * whRatio)
      // .classed("svgInGridStack_inner", true)
      .style('background', '#383B42')
      // .style("background", "red").style("border","2px solid red")
      .on('dblclick.zoom', null)
      .on('wheel', function () {
        d3.event.preventDefault()
      })


    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    let arr_zoomer_base = new ArrZoomerBase({
      run_loop: run_loop,
      sgv_tag: sgv_tag,
      widget_id: widget_id,
      widget_source: widget_source,
      locker: locker,
      is_south: is_south,
      widget_type: widget_type,
      sock: sock,
      ele_opts: arr_zoomer_ele_opts,
      lock_init_key: arr_zoomerLockInitKey,
      svg: svg,
    })
    arr_zoomer_base.init_data(dataDictIn.data.arr_zoomer)


    // ------------------------------------------------------------------
    // expose the sync function
    // ------------------------------------------------------------------
    function get_sync_state (data_in) {
      arr_zoomer_base.get_sync_state(data_in)
      return
    }
    this_top.get_sync_state = get_sync_state

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    run_when_ready({
      pass: function () {
        return locker.are_free([
          arr_zoomerLockInitKey,
          'dataChange',
          'setStateLock'
        ])
      },
      execute: function () {
        locker.remove('inInit')
      }
    })

    // // ------------------------------------------------------------------
    // // ------------------------------------------------------------------
    // console.log('XXzoomToTrgMainXX')
    // arr_zoomer_base.get_ele('main').zoomToTrgMain({ target:'M_9',  scale:arr_zoomer_base.zoomD.len["1.2"], duration_scale:0.1 });
    // arr_zoomer_base.get_ele('main').zoomToTrgMain({ target:'Lx00',  scale:arr_zoomer_base.zoomD.len["1.2"], duration_scale:1.5 });
    // arr_zoomer_base.get_ele('main').zoomToTrgMain({ target:'init', scale:arr_zoomer_base.zoomD.len["0.0"], duration_scale:0.1 });
    // // ------------------------------------------------------------------
    // // ------------------------------------------------------------------
    
    return
  }
  this_top.init_data = init_data

  return
}









