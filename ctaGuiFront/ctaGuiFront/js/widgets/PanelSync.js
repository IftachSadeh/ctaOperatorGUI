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
var main_script_tag = 'PanelSync'
// -------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global sock */
/* global times */
/* global is_def */
/* global move_node_up */
/* global RunLoop */
/* global Locker */
/* global icon_badge */
/* global unique */
/* global dom_add */
/* global run_when_ready */
/* global vor_ploy_func */
/* global disable_scroll_svg */
/* global bck_pattern */
/* global ScrollGrid */

window.load_script({ source: main_script_tag, script: '/js/utils/ScrollGrid.js' })

// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function (opt_in) {
  let x0 = 0
  let y0 = 0
  let h0 = 9
  let w0 = 12
  let divKey = 'main'

  opt_in.widget_func = { sock_func: sock_panel_sync, main_func: main_panel_sync }
  opt_in.widget_div_id = opt_in.widget_id + 'widget_div'
  opt_in.ele_props = {}
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
// additional socket events for this particular widget type
// -------------------------------------------------------------------
let sock_panel_sync = function (opt_in) {
  let widget_type = opt_in.widget_type
  let widget_source = opt_in.widget_source

  // -------------------------------------------------------------------
  // ask for update for state1 data for a given module
  // -------------------------------------------------------------------
  this.ask_data = function (opt_in) {
    if (sock.con_stat.is_offline()) return

    let emit_data = {
      widget_source: widget_source,
      widget_name: widget_type,
      widget_id: opt_in.widget_id,
      method_name: 'ask_data'
    }

    sock.socket.emit('widget', emit_data)
  }

  // -------------------------------------------------------------------
  // ask for update for state1 data for a given module
  // -------------------------------------------------------------------
  this.groups_to_server = function (opt_in) {
    if (sock.con_stat.is_offline()) return

    let data = {}
    data.widget_id = opt_in.widget_id
    data.data = opt_in.data

    let emit_data = {
      widget_source: widget_source,
      widget_name: widget_type,
      widget_id: data.widget_id,
      method_name: 'setSyncGroups',
      method_arg: data
    }
    // console.log(emit_data);
    sock.socket.emit('widget', emit_data)
  }
}

let main_panel_sync = function (opt_in) {
  // let my_unique_id = unique()
  let widget_type = opt_in.widget_type
  let tag_panel_sync_svg = opt_in.base_name
  let widget_id = opt_in.widget_id
  let widget_ele = opt_in.widget_ele

  // let this_panel_sync = this
  let is_south = window.__site_type__ === 'S'

  // let sgv_tag = {};
  // $.each(widget_ele, function(index,ele_now) {
  //   sgv_tag[ele_now.id] = { id:tag_panel_sync_svg+"_"+ele_now.id, whRatio:(ele_now.w/ele_now.h) };
  // })
  let sgv_tag = {}
  $.each(widget_ele, function (index, ele_now) {
    sgv_tag[ele_now.id] = {
      id: tag_panel_sync_svg + ele_now.id,
      widget: ele_now.widget,
      whRatio: ele_now.w / ele_now.h
    }
  })

  // delay counters
  let locker = new Locker()
  locker.add('inInit')

  // function loop
  let run_loop = new RunLoop({ tag: widget_id })

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function init_data (data_in) {
    if (sock.multiple_inits({ id: widget_id, data: data_in })) return

    sock.set_icon_badge({ n_icon: data_in.n_icon, icon_divs: null })
    
    svgMain.init_data(data_in.data)

    svgMain.setAllowSyncState(data_in.data)
  }
  this.init_data = init_data

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function update_data (data_in) {
    svgMain.update_data(data_in.data)
  }
  this.update_data = update_data

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  let SvgMain = function () {
    let com = {}
    let recD = {}
    let svg = {}
    let grpD = {}

    let rScale = {}
    rScale[0] = {}
    rScale[1] = {}

    rScale[0].health0 = 1.1
    rScale[0].health1 = 1.2
    rScale[0].health2 = 1.35
    rScale[0].line0 = 1.2
    rScale[0].line1 = 1.8
    rScale[0].percent = 0.6
    rScale[0].label = 1.95
    rScale[0].title = 2.05

    rScale[1].health0 = 1.5
    rScale[1].health1 = 1.65
    rScale[1].innerH0 = 1.25
    rScale[1].innerH1 = 1.3

    this.rScale = rScale

    // let arc_prev = {}
    // arc_prev.ang = {}
    // arc_prev.rad = {}

    let siteScale = is_south ? 4 / 9 : 1

    let lenD = {}
    lenD.w = {}
    lenD.h = {}

    // lenD.w[0] = 400;
    // lenD.h[0] = lenD.w[0];
    lenD.w[0] = 1000
    lenD.h[0] = lenD.w[0] / sgv_tag.main.whRatio
    // is_south ? 900 : 400;

    lenD.r = {}
    lenD.r.s00 = [12, 13, 14]
    if (is_south) lenD.r.s00 = [12 * siteScale, 13 * siteScale, 14 * siteScale]

    let zoomLen = {}
    zoomLen['0'] = 1
    zoomLen['1'] = 5

    // let cols_blocks = [cols_reds[0], cols_blues[0], cols_greens[2], cols_purples[0]] // cols_yellows[4]

    // flag to add a new-group toggle box
    let canTogEmpty = true
    // let allowPermEmptyGrp = !false;

    // delay after a dragging event
    let delayAfterDrag = 500
    // sllow this time to use the new empty group before a dataupdate removes it
    let delayAfterAddEmpty = 5000

    // some initializations
    com.addEmptyGrp = false

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let tagMain = widget_type
    let tag_icon = tagMain + 'icons'
    let tag_circ = tagMain + 'telCirc'
    let tagTtl = tagMain + 'telTitle'
    let tagVor = tagMain + 'telVor'
    let tagGridRec = tagMain + 'colLeft'
    let tagLeftIn = tagMain + 'data_in'
    let tagEmpty = tagMain + 'empty'
    let tagClipPath = tagMain + 'tagClipPath'

    let wh = [lenD.w[0], lenD.h[0]]
    let sideColW = wh[0] * 0.2
    let whPack = [wh[0] - sideColW, wh[1]] // [ Math.min(wh[0],wh[1])*(1-whFrac*2) , Math.min(wh[0],wh[1])*(1-whFrac*2) ]
    let shiftMainG = [sideColW, 0]
    let n_empty_icon = -1 // n_empty_icon = 81; // set high for debugging...

    function groups_to_server () {
      let data = { id: 'all_groups', children: [] }

      updateEmptyGrp()

      $.each(grpD.data.children, function (nChild0, childNow0) {
        if (!is_empty_group(childNow0.id)) {
          let childV = []
          $.each(childNow0.children, function (nChild1, childNow1) {
            childV.push([])
            $.each(childNow1.children, function (nChild2, childNow2) {
              if (childNow2.n_icon >= 0) {
                // console.log('xxxxxxx',childNow2);
                childV[nChild1].push([childNow2.trgWidgId, childNow2.id])
              }
            })
          })

          data.children.push({
            id: childNow0.id,
            title: childNow0.title,
            children: childV
          })
        }
      })

      sock.all_widgets[widget_type].sock_func.groups_to_server({
        widget_id: widget_id,
        data: data
      })

      // console.log('groups_to_server',data);
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function init_data (data_in) {
      grpD.data = data_in.groups

      if (is_def(svg.svg)) return

      // -------------------------------------------------------------------
      // create the main svg element
      // -------------------------------------------------------------------
      let svg_div_id = sgv_tag.main.id + 'svg'
      let svg_div = sgv_tag.main.widget.get_ele(svg_div_id)

      if (!is_def(svg_div)) {
        let parent = sgv_tag.main.widget.get_ele(sgv_tag.main.id)
        let svg_div = document.createElement('div')
        svg_div.id = svg_div_id

        dom_add(parent, svg_div)

        run_when_ready({
          pass: function () {
            return is_def(sgv_tag.main.widget.get_ele(svg_div_id))
          },
          execute: function () {
            init_data(data_in)
          }
        })

        return
      }
      sock.emit_mouse_move({ eleIn: svg_div, data: { widget_id: widget_id } })

      svg.svg = d3
        .select(svg_div)
        // .classed("svgInGridStack_outer", true)
        .style('background', '#383B42')
        .append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', '0 0 ' + lenD.w[0] + ' ' + lenD.h[0])
        .style('position', 'relative')
        .style('width', '100%')
        .style('height', '100%')
        .style('top', '0px')
        .style('left', '0px')
        // .attr("viewBox", "0 0 "+lenD.w[0]+" "+lenD.h[0] * whRatio)
        // .classed("svgInGridStack_inner", true)
        .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
      // .call(com.svgZoom)
      // .on("dblclick.zoom", null)

      if (disable_scroll_svg) {
        svg.svg.on('wheel', function () {
          d3.event.preventDefault()
        })
      }

      svg.g = svg.svg.append('g')
      svg.overlay = svg.svg.append('g')

      // add one circle as background
      // -------------------------------------------------------------------
      svg.g
        .append('g')
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', lenD.w[0])
        .attr('height', lenD.h[0])
        .attr('fill', '#F2F2F2')

      // the background grid
      bck_pattern({
        com: com,
        g_now: svg.g,
        g_tag: 'hex',
        len_wh: [lenD.w[0], lenD.h[0]],
        opac: 0.1,
        hex_r: 15
      })

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      svg.recG = svg.g.append('g')
      recD.gBase = svg.recG.append('g')
      recD.dataG = svg.recG.append('g')

      svg.mainG = svg.g.append('g')

      com.vor = {}
      com.vor.g = svg.mainG.append('g')

      com.empty = {}
      com.empty.g = svg.mainG.append('g')

      com.icons = {}
      com.icons.g = svg.mainG.append('g')

      com.highlight = {}
      com.highlight.g = svg.mainG.append('g')

      svg.mainG.attr(
        'transform',
        'translate(' + shiftMainG[0] + ',' + shiftMainG[1] + ')'
      )

      // // for debugging
      // svg.mainG.append("g").selectAll("rect").data([0])
      //   .enter()
      //   .append("rect")
      //     .attr("x", 0).attr("y", 0)
      //     .attr("width", whPack[0])
      //     .attr("height", whPack[1])
      //     .attr("fill", "transparent")
      //     .style("stroke", cols_purples[4] )
      //     .style("pointer-events", "none")

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      function doDragMainStart (dIn, thisIn) {
        move_node_up(thisIn, 2)

        com.icons.g.selectAll('g.' + tag_icon).style('pointer-events', 'none')

        com.icons.g
          .selectAll('circle.' + tag_circ)
          .style('pointer-events', 'none')

        grpD.hov_id_icon = dIn.data.id
        grpD.hovIdGrpStart = dIn.parent.data.id
      }

      com.dragMainStart = function (dIn, thisIn) {
        locker.add({ id: tagMain + 'inDrag', override: true })

        doDragMainStart(dIn, thisIn)
      }

      com.dragMainDuring = function (dIn, thisIn) {
        d3.select(thisIn).attr('transform', function (d) {
          d.x = d3.event.x
          d.y = d3.event.y
          return 'translate(' + d.x + ',' + d.y + ')'
        })
      }

      function doDragMainEnd (dIn, thisIn) {
        com.icons.g
          .selectAll('g.' + tag_icon)
          .style('pointer-events', icon_pntEvt)

        com.icons.g
          .selectAll('circle.' + tag_circ)
          .style('pointer-events', 'auto')

        updateGroups()
        removeDuplicates()
        groups_to_server()

        grpD.hovIdGrpStart = null
      }

      com.dragMainEnd = function (dIn, thisIn) {
        doDragMainEnd(dIn, thisIn)

        locker.remove({
          id: tagMain + 'inDrag',
          override: true,
          delay: delayAfterDrag
        })
      }

      com.dragMain = d3
        .drag()
        .on('start', function (d) {
          com.dragMainStart(d, this)
        })
        .on('drag', function (d) {
          com.dragMainDuring(d, this)
        })
        .on('end', function (d) {
          com.dragMainEnd(d, this)
        })

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      let icon_side = null
      let icon_side_sel = null
      com.dragSideStart = function (dIn) {
        locker.add({ id: tagMain + 'inDrag', override: true })

        let id_side = sideColClick(dIn)
        let icons = com.hirchDesc.filter(function (d) {
          return d.data.id === id_side
        })

        icon_side = icons.length === 0 ? null : icons[0]
        icon_side_sel = icons.length === 0 ? null : svg.mainG.select('#' + id_side)

        if (is_def(icon_side_sel)) {
          move_node_up(icon_side_sel.node(), 2)
        }

        icon_side_sel
          .transition('inOut')
          .duration(times.anim_arc / 5)
          .attr('transform', function (d) {
            d.x = d3.event.x - shiftMainG[0]
            d.y = d3.event.y - shiftMainG[1]
            return 'translate(' + d.x + ',' + d.y + ')'
          })

        if (is_def(icon_side)) doDragMainStart(icon_side, this)
      }

      com.dragSideDuring = function (dIn) {
        if (!is_def(icon_side)) return

        icon_side_sel.attr('transform', function (d) {
          d.x = d3.event.x - shiftMainG[0]
          d.y = d3.event.y - shiftMainG[1]
          return 'translate(' + d.x + ',' + d.y + ')'
        })
      }

      com.dragSideEnd = function (dIn) {
        doDragMainEnd(icon_side, this)

        icon_side = null
        icon_side_sel = null

        locker.remove({
          id: tagMain + 'inDrag',
          override: true,
          delay: delayAfterDrag
        })
      }

      com.dragSide = d3
        .drag()
        .on('start', com.dragSideStart)
        .on('drag', com.dragSideDuring)
        .on('end', com.dragSideEnd)

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      let marg = wh[1] * 0.025
      let w0 = sideColW - marg * 2
      let h0 = wh[1] - marg * 2
      let x0 = marg
      let y0 = marg

      if (canTogEmpty) {
        h0 -= w0 + marg
        initNewGrpSideTog({
          gTransX: x0 - shiftMainG[0],
          gTransY: y0 + h0 + marg,
          recW: w0
        })
      }

      recD.recOpt = {
        id: tagGridRec,
        tagClipPath: tagClipPath,
        recD: recD,
        recV: [],
        gBox: recD.gBase,
        x0: x0,
        y0: y0,
        w0: w0,
        h0: h0,
        recH: w0 * 0.5,
        recW: w0 * 0.5,
        showCounts: false,
        isHorz: false,
        bckRecOpt: { texture_orient: '5/8', frontProp: { strkWOcp: 0.2 } },
        // vorOpt: { mouseover: sideColHov, call: com.dragSide },
        vorOpt: { mouseover: sideColHov, call: com.dragSide },
        onZoom: { during: updSideColOnZoom, end: updSideColOnZoom },
        run_loop: run_loop,
        locker: locker,
        lockerV: [tagMain + 'update_data', tagMain + 'inDrag'],
        lockerZoom: {
          all: tagGridRec + 'zoom',
          during: tagGridRec + 'zoomDuring',
          end: tagGridRec + 'zoomEnd'
        }
      }

      com.scrollGrid = new ScrollGrid(recD.recOpt)

      recD.dataG = com.scrollGrid.getBackDataG()
      recD.dataG.attr('clip-path', function (d) {
        return 'url(#' + tagClipPath + tagGridRec + ')'
      })

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      run_loop.push({ tag: 'update_data', data: data_in.groups })

      run_when_ready({
        pass: function () {
          return locker.are_free(com.lockerUpdateV)
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
    function setAllowSyncState (data_in) {
      let isAcive = data_in.allow_panel_sync

      let tagRec = 'overlayRec'
      let rect = svg.overlay.selectAll('rect.' + tagRec).data([0])

      rect
        .enter()
        .append('rect')
        .attr('class', tagRec)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', lenD.w[0])
        .attr('height', lenD.h[0])
        .attr('fill', '#F2F2F2')
        // .attr("stroke-width", 0)
        .merge(rect)
        .attr('opacity', isAcive ? 0 : 0.7)
        .attr('pointer-events', isAcive ? 'none' : 'auto')

      // the background grid
      bck_pattern({
        com: com,
        g_now: svg.overlay,
        g_tag: tagRec,
        len_wh: [lenD.w[0], lenD.h[0]],
        opac: isAcive ? 0 : 0.2,
        circ_type: 'lighter'
      })
    }
    this.setAllowSyncState = setAllowSyncState

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function ask_data () {
      sock.all_widgets[widget_type].sock_func.ask_data({ widget_id: widget_id })
    }
    this.ask_data = ask_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    com.lockerUpdateV = [
      tagMain + 'dataChange',
      tagMain + 'update_data',
      tagMain + 'updateGroups',
      tagMain + 'addedEmptyGrp',
      tagGridRec + 'zoom'
    ]
    // -------------------------------------------------------------------
    run_loop.init({ tag: 'update_data', func: update_dataOnce, n_keep: 1 })

    function update_data (data_in) {
      if (!locker.is_free('inInit')) {
        setTimeout(function () {
          update_data(data_in)
        }, 10)
        return
      }

      run_loop.push({ tag: 'update_data', data: data_in }) //, time:data_in.emit_time
    }
    this.update_data = update_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update_dataOnce (data_in) {
      if (!locker.is_free(tagMain + 'inDrag')) return

      if (!locker.are_free(com.lockerUpdateV)) {
        // console.log('will delay _update_data_',locker.get_actives(com.lockerUpdateV));
        setTimeout(function () {
          update_data(data_in)
        }, times.anim_arc / 2)
        return
      }

      locker.add(tagMain + 'update_data')
      locker.expires({
        id: tagMain + 'dataChange',
        duration: delayAfterDrag
      })
      locker.expires({
        id: tagMain + 'clickEmptyGrp',
        duration: delayAfterDrag
      })

      // -------------------------------------------------------------------
      // use the original data for existing elements
      // -------------------------------------------------------------------
      let origV = {}
      $.each(grpD.data.children, function (nChild0, childNow0) {
        $.each(childNow0.children, function (nChild1, childNow1) {
          $.each(childNow1.children, function (nChild2, childNow2) {
            if (childNow2.n_icon !== n_empty_icon) {
              origV[childNow2.id] = childNow2
            }
          })
        })
      })

      $.each(data_in.children, function (nChild0, childNow0) {
        $.each(childNow0.children, function (nChild1, childNow1) {
          $.each(childNow1.children, function (nChild2, childNow2) {
            if (is_def(origV[childNow2.id])) {
              data_in.children[nChild0].children[nChild1].children[nChild2] =
                origV[childNow2.id]
            }
          })
        })
      })

      // // preserve the original empty group, if it remains empty
      // // -------------------------------------------------------------------
      // updateEmptyGrp();

      // $.each(grpD.data.children, function(nChild0,childNow0) {
      //   if(is_empty_group(childNow0)) {
      //     let emptyGrpId = childNow0.id;
      //     let allGrpIds  = data_in.children.map(function(d){ return d.id; });
      //     if(allGrpIds.indexOf(emptyGrpId) < 0) {
      //       data_in.children.push(childNow0);
      //     }
      //   }
      // })

      // reference the new data in the local obj
      grpD.data = data_in

      locker.remove({
        id: tagMain + 'update_data',
        delay: times.anim_arc * 2
      })

      // finally update, using the new data
      updateGroups()
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function initNewGrpSideTog (opt_in) {
      let gTransX = opt_in.gTransX
      let gTransY = opt_in.gTransY
      let recW = opt_in.recW

      com.empty.g.attr('transform', function (d, i) {
        return 'translate(' + gTransX + ',' + gTransY + ')'
      })

      let dataEmptyD = {
        id: 'emptyGroup',
        children: [
          {
            id: 'emptyGroup0',
            title: 'Add/remove',
            children: [
              { id: 'emptyGroup00' },
              { id: 'emptyGroup01' },
              { id: 'emptyGroup02' }
            ]
          }
        ]
      }

      let hirch = d3.hierarchy(dataEmptyD).sum(function (d) {
        return 1
      })
      let packNode = d3
        .pack()
        .size([recW, recW])
        .padding(5)
      packNode(hirch)

      let hirchDesc = hirch.descendants()

      let circ = com.empty.g
        .selectAll('circle.' + tagEmpty)
        .data(hirchDesc, function (d) {
          return d.data.id
        }) // console.log('xxx',d.data.id);

      circ
        .enter()
        .append('circle')
        // .attr("id", function(d,i) { return my_unique_id+tag_circ+"_"+d.data.id; })
        .attr('class', tagEmpty)
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .style('opacity', 0)
        .attr('r', function (d, i) {
          return d.r
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('stroke-width', function (d) {
          d.data.strkW = d.depth === 2 ? 2.0 : 0.5
          return d.data.strkW
        })
        .style('stroke', function (d) {
          return hirchStyleStroke(d)
        })
        .style('fill', function (d) {
          return hirchStyleFill(d)
        })
        .style('stroke-opacity', function (d) {
          return hirchOpacStrk(d)
        })
        .style('fill-opacity', function (d) {
          return hirchOpacFill(d)
        })
        .merge(circ)
        .transition('out')
        .duration(times.anim_arc)
        .style('opacity', 1)
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .attr('r', function (d, i) {
          return d.r
        })

      circ
        .exit()
        .transition('out')
        .duration(times.anim_arc / 2)
        .style('opacity', 0)
        .attr('stroke-width', 0)
        .style('fill-opacity', 0)
        .remove()

      setTtl(hirchDesc)

      com.empty.g
        .selectAll('rect')
        .data([0])
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', recW)
        .attr('height', recW)
        .attr('stroke-width', 0)
        .attr('fill', 'transparent')
        .on('mouseover', function (d) {
          // just in case...
          grpD.hovIdGrpNow = null
        })
        .on('click', function (d) {
          if (
            !locker.are_free([
              tagMain + 'clickEmptyGrp',
              tagMain + 'inDrag',
              tagMain + 'setAll',
              tagMain + 'update_data',
              tagMain + 'updateGroups'
            ])
          ) {
            return
          }

          locker.add({ id: tagMain + 'clickEmptyGrp', override: true })
          locker.add({ id: tagMain + 'addedEmptyGrp', override: true })

          // if(allowPermEmptyGrp) com.addEmptyGrp = !com.addEmptyGrp;

          updateEmptyGrp()

          if (com.emptyGrpIndex >= 0) updateGroups()
          else sideColClick()

          locker.remove({
            id: tagMain + 'clickEmptyGrp',
            override: true,
            delay: times.anim_arc * 2
          })
          locker.remove({
            id: tagMain + 'addedEmptyGrp',
            override: true,
            delay: delayAfterAddEmpty
          })
        })
      // .attr("stroke-width", 2).attr("stroke", "red")
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setHirch () {
      // console.log(grpD.data);
      // let tag_circ = "telCirc";

      com.hirch = d3.hierarchy(grpD.data).sum(function (d) {
        return 1
      })
      let packNode = d3
        .pack()
        .size(whPack)
        .padding(15)
      packNode(com.hirch)

      com.hirchDesc = com.hirch.descendants()

      grpD.hovIdGrp0 = null

      let circ = com.icons.g
        .selectAll('circle.' + tag_circ)
        .data(com.hirchDesc, function (d) {
          return d.data.id
        }) // console.log('xxx',d.data.id);

      circ
        .enter()
        .append('circle')
        // .attr("id", function(d,i) { return my_unique_id+tag_circ+"_"+d.data.id; })
        .attr('class', tag_circ)
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .style('opacity', 0)
        .attr('r', function (d, i) {
          return d.r
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .attr('stroke-width', function (d) {
          d.data.strkW = d.depth === 2 ? 2.0 : 0.5
          return d.data.strkW
        })
        .style('stroke', function (d) {
          return hirchStyleStroke(d)
        })
        .style('fill', function (d) {
          return hirchStyleFill(d)
        })
        .style('stroke-opacity', function (d) {
          return hirchOpacStrk(d)
        })
        .style('fill-opacity', function (d) {
          return hirchOpacFill(d)
        })
        // .on("mouseover", hirchStyleHover).on("click", hirchStyleClick).on("dblclick", hirchStyleDblclick)
        .merge(circ)
        .each(function (d) {
          if (d.depth === 2) {
            if (!is_def(grpD.hovIdGrp0)) grpD.hovIdGrp0 = d.data.id
          }
        })
        .transition('out')
        .duration(times.anim_arc)
        .style('opacity', 1)
        // .style("opacity", function(d){
        //     // if(d.depth == 1 && d.data.is_empty) return 0.2;
        //     if(d.depth == 2 && d.parent.data.is_empty) return 0.2;
        //   return 1;
        // })
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .attr('r', function (d, i) {
          return d.r
        })

      circ
        .exit()
        .transition('out')
        .duration(times.anim_arc / 2)
        .style('opacity', 0)
        .attr('stroke-width', 0)
        .style('fill-opacity', 0)
        .remove()
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function set_icons () {
      let needUpdt = false
      let sclR = 1
      let data = com.hirchDesc.filter(function (d) {
        return d.depth === 3
      })
      let icn = com.icons.g.selectAll('g.' + tag_icon).data(data, function (d) {
        return d.data.id
      })

      icn
        .enter()
        .append('g')
        .attr('class', tag_icon)
        .attr('id', function (d) {
          return d.data.id
        })
        .each(function (d, i) {
          // console.log('-------',d.data);
          let icon_svg = icon_badge.get(d.data.n_icon)
          let badge = icon_badge.add({
            parent_svg: d3.select(this),
            icon_file: icon_svg[0],
            text: { pos: 'topRight', txt: icon_svg[1] },
            rad: d.r * sclR,
            delay: 0,
            pulse_hov_in: true,
            trans_back: false
          })
          d.data.badge = badge.g
          d.data.set_r = badge.set_r

          if (is_def(d.data.init)) {
            d.x = d.data.init.x
            d.y = d.data.init.y
            d.r = d.data.init.r
          }
        })
        .attr('transform', function (d, i) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })
        .call(com.dragMain)
        .merge(icn)
        .style('pointer-events', icon_pntEvt)
        // .each(function(d,i) { if(d.data.n_icon>=0)console.log(d.data.id,d) })
        .each(function (d, i) {
          if (is_def(d.data.set_r)) {
            d.data.set_r(d.r * sclR)
          } else {
            // can happen after a disconnect, that we loose the original element
            // then, just remove it (no time for transitions!!!), and ask for an update
            needUpdt = true
            console.log('000 - no d.data.set_r -', d.data.id)
            com.icons.g.select('#' + d.data.id).remove()
          }
        })
        .transition('inOut')
        .duration(times.anim_arc)
        .attr('transform', function (d, i) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })

      icn
        .exit()
        .transition('inOut')
        .duration(times.anim_arc / 4)
        .style('opacity', 0)
        .remove()

      if (needUpdt) ask_data()
    }
    function icon_pntEvt (d) {
      return d.data.n_icon === n_empty_icon ? 'none' : 'auto'
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function sideColHov (d) {
      // console.log('sideColHov',d.data.id)
      // just in case...
      grpD.hovIdGrpNow = null
    }

    function sideColClick (dIn) {
      let id_now = 'icn' + unique()
      if (is_def(dIn)) {
        let n_icon = dIn.data.data.data.n_icon
        let trgWidgId = dIn.data.data.data.trgWidgId

        let initXYR = {}
        let rScale = 1.2
        initXYR.r = dIn.data.w / 2
        initXYR.x =
          dIn.data.x +
          dIn.data.w / 2 -
          shiftMainG[0] -
          (rScale - 1) * initXYR.r / 2
        initXYR.y =
          dIn.data.y +
          dIn.data.h / 2 -
          shiftMainG[1] -
          (rScale - 1) * initXYR.r / 2
        initXYR.r *= rScale

        let dataAdd = {
          id: id_now,
          trgWidgId: trgWidgId,
          title: '',
          n_icon: n_icon,
          init: initXYR
        }

        updateEmptyGrp()

        if (com.emptyGrpIndex >= 0) {
          grpD.data.children[com.emptyGrpIndex].children[0].children = [dataAdd]
        } else {
          let nGrp = -1
          let grpIdV = grpD.data.children.map(function (d) {
            return d.id
          })
          $.each(grpD.data.children, function (nChild0, childNow0) {
            if (grpIdV.indexOf('grp' + nChild0) < 0 && nGrp < 0) {
              nGrp = nChild0
            }
          })
          if (nGrp < 0) nGrp = grpD.data.children.length

          let newGrp = {
            id: 'grp' + nGrp,
            title: 'Group ' + nGrp,
            children: [
              { id: 'grp' + nGrp + '_0', children: [dataAdd] },
              // { id:"grp_"+nGrp+"_0", children: [{id:"icn_"+nGrp+"_0"+id_now, trgWidgId:"", n_icon:n_empty_icon}, dataAdd] },
              {
                id: 'grp' + nGrp + '_1',
                children: [
                  {
                    id: 'icn' + nGrp + '_1' + id_now,
                    trgWidgId: '',
                    n_icon: n_empty_icon
                  }
                ]
              },
              {
                id: 'grp' + nGrp + '_2',
                children: [
                  {
                    id: 'icn' + nGrp + '_2' + id_now,
                    trgWidgId: '',
                    n_icon: n_empty_icon
                  }
                ]
              }
            ]
          }
          grpD.data.children.push(newGrp)
        }
      }

      // if(!allowPermEmptyGrp) com.addEmptyGrp  = !is_def(dIn);
      grpD.hovIdGrpStart = null
      com.addEmptyGrp = !is_def(dIn)

      updateGroups()

      // if(!allowPermEmptyGrp) com.addEmptyGrp  = false;
      com.addEmptyGrp = false

      return id_now
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function initSideCol () {
      let data = grpD.data.all_sync_widgets

      let icons_orig = is_def(recD[tagLeftIn]) ? recD[tagLeftIn] : []
      let icons_new = []
      let trgWidgIdV = []
      $.each(icons_orig, function (index0, ele0) {
        let id_now = ele0.data.id
        let trgWidgId = ele0.data.trgWidgId

        $.each(data, function (index1, ele1) {
          if (id_now === ele1.id && trgWidgIdV.indexOf(trgWidgId) < 0) {
            icons_new.push(ele0)

            trgWidgIdV.push(trgWidgId)
          }
        })
      })

      $.each(data, function (index0, ele0) {
        if (ele0.n_icon !== n_empty_icon) {
          let id_now = ele0.id
          let trgWidgId = ele0.trgWidgId
          let eleIndex = -1

          $.each(icons_orig, function (index1, ele1) {
            if (ele1.id === id_now) eleIndex = index1
          })

          if (eleIndex < 0 && trgWidgIdV.indexOf(trgWidgId) < 0) {
            // console.log(ele0.trgWidgId);
            icons_new.push({
              id: id_now,
              data: { id: id_now, trgWidgId: trgWidgId, n_icon: ele0.n_icon }
            })

            trgWidgIdV.push(trgWidgId)
          }
        }
      })

      recD[tagLeftIn] = icons_new
      icons_orig = null
      icons_new = null
      trgWidgIdV = null

      updSideCol()
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function updSideCol () {
      let recV = recD[tagLeftIn]
      if (!is_def(recV)) recV = []

      com.scrollGrid.update({ recV: recV })

      let needUpdt = false
      let sclR = 1
      let data_now = recD[tagGridRec]
      let icn = recD.dataG
        .selectAll('g.a' + tag_icon)
        .data(data_now, function (d) {
          return d.data.id
        })

      icn
        .enter()
        .append('g')
        .attr('class', 'a' + tag_icon)
        .attr('id', function (d) {
          return d.data.id
        })
        .each(function (d, i) {
          let icon_svg = icon_badge.get(d.data.data.n_icon)
          let badge = icon_badge.add({
            parent_svg: d3.select(this),
            icon_file: icon_svg[0],
            text: { pos: 'topRight', txt: icon_svg[1] },
            rad: d.w / 2 * sclR,
            delay: 300,
            pulse_hov_in: true,
            trans_back: true
          })
          d.data.data.badge = badge.g
          d.data.data.set_r = badge.set_r
          // console.log(d.data.id,d.x)
        })
        .attr('transform', function (d, i) {
          return 'translate(' + (d.x + d.w / 2) + ',' + (d.y + d.h / 2) + ')'
        })
        .call(com.dragSide)
        .merge(icn)
        .style('pointer-events', icon_pntEvt)
        // .each(function(d,i) { if(d.data.n_icon>=0)console.log(d.data.id,d) })
        .each(function (d) {
          if (is_def(d.data.data.set_r)) {
            d.data.data.set_r(d.w / 2 * sclR)
          } else {
            // can happen after a disconnect, that we loose the original element
            // then, just remove it (no time for transitions!!!), and ask for an update
            needUpdt = true
            console.log('111 - no d.data.data.set_r -', d.data.id)
            recD.dataG.select('#' + d.data.id).remove()
          }
        })
        .transition('inOut')
        .duration(times.anim_arc)
        .attr('transform', function (d) {
          return 'translate(' + (d.x + d.w / 2) + ',' + (d.y + d.h / 2) + ')'
        })
        .style('opacity', 1)

      icn
        .exit()
        .transition('inOut')
        .duration(times.anim_arc)
        .attr('opacity', 0)
        .remove()

      if (needUpdt) ask_data()
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function updSideColOnZoom (opt_in) {
      let icn = recD.dataG.selectAll('g.a' + tag_icon)
      let duration = opt_in.duration
      let trans = function (d) {
        return 'translate(' + (d.x + d.w / 2) + ',' + (d.y + d.h / 2) + ')'
      }

      if (duration <= 0) {
        icn.attr('transform', trans)
      } else {
        icn
          .transition('move')
          .duration(duration)
          .attr('transform', trans)
      }
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setTtl (data_in) {
      let titles = ['Both', 'Sends', 'Gets']

      let data, g_now
      if (is_def(data_in)) {
        g_now = com.empty.g
        data = data_in.filter(function (d) {
          if (d.depth === 0 || d.depth === 3) return false
          return true
        })
      } else {
        updateEmptyGrp()

        g_now = com.icons.g
        data = com.hirchDesc.filter(function (d) {
          // console.log(d.data.title,is_empty_group(d));
          if (d.depth === 0 || d.depth === 3) return false
          else if (d.depth === 2 && !is_empty_group(d)) return false
          else return true
        })
      }

      function fontSize (d) {
        d.size = d.depth === 1 ? d.r / 4.5 : d.r / 1.7
        if (is_def(data_in) && d.depth === 1) d.size *= 1.5
        return d.size + 'px'
      }

      let txt = g_now.selectAll('text.' + tagTtl).data(data, function (d) {
        return d.data.id
      })

      txt
        .enter()
        .append('text')
        .attr('class', tagTtl)
        .text('')
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .style('text-anchor', 'middle')
        .style('font-weight', function (d) {
          return d.depth === 1 ? 'bold' : 'normal'
        })
        .style('stroke-width', is_def(data_in) ? 0.3 : 1)
        .style('stroke', function (d) {
          if (is_def(data_in)) {
            return d.depth === 1
              ? '#383b42'
              : d3.rgb(hirchStyleStroke(d)).darker(5)
          } else {
            return d.depth === 1
              ? '#383b42'
              : d3.rgb(hirchStyleStroke(d)).darker(1)
          }
        })
        .style('fill', hirchStyleStroke)
        .style('pointer-events', 'none')
        .style('vector-effect', 'non-scaling-stroke')
        .style('font-size', fontSize)
        .attr('dy', function (d) {
          return d.size / 3 + 'px'
        })
        .attr('transform', function (d) {
          if (d.depth === 1) return 'translate(' + d.x + ',' + (d.y - d.r) + ')'
          else return 'translate(' + d.x + ',' + d.y + ')'
        })
        .merge(txt)
        .transition('inOut')
        .duration(times.anim_arc)
        .delay(times.anim_arc / 2)
        .attr('transform', function (d) {
          if (d.depth === 1) return 'translate(' + d.x + ',' + (d.y - d.r) + ')'
          else return 'translate(' + d.x + ',' + d.y + ')'
        })
        .style('font-size', fontSize)
        .attr('dy', function (d) {
          let dyScale
          if (!is_def(data_in) && d.depth === 1) {
            dyScale = grpD.data.children.length === 1 ? 2 : 1
          } else if (d.depth === 1) {
            dyScale = 1.5
          } else {
            dyScale = 1
          }
          return dyScale * d.size / 3 + 'px'
        })
        .text(function (d) {
          if (d.depth === 1) {
            return is_def(d.data.title) ? d.data.title : d.data.id
          } else {
            return titles[getIndexInParent(d)]
          }
        })
        .style('fill-opacity', function (d) {
          if (is_def(data_in)) return 0.7
          else return d.depth === 1 ? 0.4 : 0.7
        })
        .style('stroke-opacity', 0.9)

      txt
        .exit()
        .transition('inOut')
        .duration(times.anim_arc / 2)
        .style('fill-opacity', 0)
        .style('stroke-opacity', 0)
        .remove()
    }

    function setVor () {
      let showVor = false

      let vorFunc = d3
        .voronoi()
        .x(function (d) {
          return d.x
        })
        .y(function (d) {
          return d.y
        })
        .extent([[0, 0], [lenD.w[0], lenD.h[0]]])

      let data = com.hirchDesc.filter(function (d) {
        return d.depth === 2
      })
      let vor = com.vor.g
        .selectAll('path.' + tagVor)
        .data(vorFunc.polygons(data), function (d) {
          return d.data.id
        })

      vor
        .enter()
        .append('path')
        .attr('class', tagVor)
        .style('fill', 'transparent')
        .style('opacity', '0')
        .attr('vector-effect', 'non-scaling-stroke')
        .on('mouseover', function (d) {
          // console.log('in ',is_def(d)?d.data.data.id:"-");
          if (is_def(d)) {
            highlight({
              id: d.data.data.id,
              data: [{ x: d.data.x, y: d.data.y, r: d.data.r }],
              type: {
                name: 'pulse',
                duration: 1500,
                col: hirchStyleStroke(d.data)
              }
            })

            grpD.hovIdGrpNow = d.data.data.id
          }
        })
        .on('mouseout', function (d) {
          // console.log('out',is_def(d)?d.data.data.id:"-");
          grpD.hovIdGrpNow = null

          highlight({
            id: d.data.data.id,
            data: [],
            type: {
              name: 'pulse',
              duration: 1500,
              col: hirchStyleStroke(d.data)
            }
          })
        })
        .merge(vor)
        .call(function (d) {
          d.attr('d', vor_ploy_func)
        })
      // .on("mouseover", telData.vorHov)
      // .on("click",     telData.vorClick)
      // .on("dblclick",  function(d) { telData.vorDblclick({ d:d, isInOut:dblclickZoomInOut }); })

      if (showVor) {
        com.vor.g
          .selectAll('path.' + tagVor)
          .style('opacity', '0.25')
          .style('stroke-width', '1.5')
          .style('stroke', '#E91E63')
      }

      vor
        .exit()
        .transition('out')
        .duration(times.anim_arc / 2)
        .attr('opacity', 0)
        .remove()
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function updateGroups () {
      if (
        !locker.are_free([tagMain + 'update_data', tagMain + 'updateGroups'])
      ) {
        setTimeout(function () {
          updateGroups()
        }, times.anim_arc / 2)
        return
      }
      locker.add({ id: tagMain + 'updateGroups' })

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      let dataTrans = null
      let rmInd = null
      if (is_def(grpD.hovIdGrpStart)) {
        $.each(grpD.data.children, function (nChild0, childNow0) {
          $.each(childNow0.children, function (nChild1, childNow1) {
            if (childNow1.id === grpD.hovIdGrpStart) {
              $.each(childNow1.children, function (nChild2, childNow2) {
                if (childNow2.id === grpD.hov_id_icon) {
                  dataTrans = childNow2
                  rmInd = [nChild0, nChild1, nChild2]
                }
              })
            }
          })
        })
      }

      if (is_def(dataTrans)) {
        if (is_def(grpD.hovIdGrpNow)) {
          $.each(grpD.data.children, function (nChild0, childNow0) {
            $.each(childNow0.children, function (nChild1, childNow1) {
              if (childNow1.id === grpD.hovIdGrpNow) {
                childNow1.children.push(dataTrans)
              }
            })
          })
        }

        grpD.data.children[rmInd[0]].children[rmInd[1]].children.splice(
          rmInd[2],
          1
        )

        // // add an empty icon_badge if needed
        // if(grpD.data.children[ rmInd[0] ].children[ rmInd[1] ].children.length == 0) {
        //   grpD.data.children[ rmInd[0] ].children[ rmInd[1] ].children
        //     .push({ id:"icn_empty_"+unique(), trgWidgId:"", title:"", n_icon:n_empty_icon });
        // }
      }

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      set_empty_icons()

      // -------------------------------------------------------------------
      // update the com.emptyGrpIndex
      // -------------------------------------------------------------------
      updateEmptyGrp()

      // add an empy group if needed
      // -------------------------------------------------------------------
      if (com.addEmptyGrp && com.emptyGrpIndex < 0) {
        // find the minimal available index for the new empty group
        // -------------------------------------------------------------------
        let nGrp = -1
        let grpIdV = grpD.data.children.map(function (d) {
          return d.id
        })
        $.each(grpD.data.children, function (nChild0, childNow0) {
          if (grpIdV.indexOf('grp' + nChild0) < 0 && nGrp < 0) nGrp = nChild0
        })
        if (nGrp < 0) nGrp = grpD.data.children.length

        // -------------------------------------------------------------------
        // group names must be unique and of the pattern "grp_0", with sub
        // groups ["grp_0_0","grp_0_1","grp_0_2"], as defined exactly by the server
        // -------------------------------------------------------------------
        let id_now = unique()
        let newGrp = {
          id: 'grp' + nGrp,
          title: 'Group ' + nGrp,
          children: [
            {
              id: 'grp' + nGrp + '_0',
              children: [
                {
                  id: 'icn' + nGrp + '_0' + id_now,
                  trgWidgId: '',
                  n_icon: n_empty_icon
                }
              ]
            },
            {
              id: 'grp' + nGrp + '_1',
              children: [
                {
                  id: 'icn' + nGrp + '_1' + id_now,
                  trgWidgId: '',
                  n_icon: n_empty_icon
                }
              ]
            },
            {
              id: 'grp' + nGrp + '_2',
              children: [
                {
                  id: 'icn' + nGrp + '_2' + id_now,
                  trgWidgId: '',
                  n_icon: n_empty_icon
                }
              ]
            }
          ]
        }
        grpD.data.children.push(newGrp)
      }

      // remove the empty group if needed
      // -------------------------------------------------------------------
      if (!com.addEmptyGrp && com.emptyGrpIndex >= 0) {
        grpD.data.children.splice(com.emptyGrpIndex, 1)
      }

      // -------------------------------------------------------------------
      // order groups by name
      // -------------------------------------------------------------------
      if (locker.is_free(tagMain + 'inDrag')) {
        grpD.data.children = grpD.data.children.sort(function (x, y) {
          let idX = parseInt(x.id.replace('grp', ''))
          let idY = parseInt(y.id.replace('grp', ''))

          return idX - idY
        })
      }

      // -------------------------------------------------------------------
      //
      // -------------------------------------------------------------------
      highlight({
        id: 'all',
        data: [],
        type: { name: 'pulse', duration: 100, col: '#383b42' }
      })

      setAll()

      initSideCol()

      locker.remove({ id: tagMain + 'updateGroups' })
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function updateEmptyGrp () {
      com.emptyGrpIndex = -1
      com.emptyGrpId = unique()

      // let nEmptyGrps = 0
      $.each(grpD.data.children, function (nChild0, childNow0) {
        let nEmpties = 0
        $.each(childNow0.children, function (nChild1, childNow1) {
          if (childNow1.children.length === 1) {
            if (childNow1.children[0].n_icon === n_empty_icon) nEmpties++
          }
        })
        if (nEmpties === 3) {
          // nEmptyGrps++
          com.emptyGrpIndex = nChild0
          com.emptyGrpId = childNow0.id
        }
      })

      // console.log('===',nEmptyGrps,com.emptyGrpIndex,com.emptyGrpId);
    }

    function is_empty_group (dIn) {
      let is_empty = false
      let dNow = dIn
      while (is_def(dNow)) {
        if (is_def(dNow.id)) {
          if (com.emptyGrpId === dNow.id) is_empty = true
        } else if (is_def(dNow.data)) {
          if (is_def(dNow.data.id)) {
            if (com.emptyGrpId === dNow.data.id) is_empty = true
          }
        }

        dNow = dNow.parent
      }
      return is_empty
    }

    // -------------------------------------------------------------------
    // remove duplicates within a given group, by trgWidgId
    // -------------------------------------------------------------------
    function removeDuplicates () {
      let hasRemoved = false
      $.each(grpD.data.children, function (nChild0, childNow0) {
        let ids = {}
        let hasDuplicates = false
        $.each(childNow0.children, function (nChild1, childNow1) {
          $.each(childNow1.children, function (nChild2, childNow2) {
            let id_now = childNow2.trgWidgId

            // do not register the first occurence, just initialize the vector
            if (!is_def(ids[id_now])) {
              ids[id_now] = []
            } else {
              ids[id_now].push([nChild1, nChild2])
              hasRemoved = true
              hasDuplicates = true
            }
          })
        })

        if (hasDuplicates) {
          $.each(childNow0.children, function (nChild1, childNow1) {
            let childV = []
            $.each(childNow1.children, function (nChild2, childNow2) {
              let id_now = childNow2.trgWidgId

              let willRemove = false
              $.each(ids[id_now], function (index, obj_now) {
                if (obj_now[0] === nChild1 && obj_now[1] === nChild2) {
                  willRemove = true
                }
              })
              if (!willRemove) childV.push(childNow2)
            })
            grpD.data.children[nChild0].children[nChild1].children = childV
          })
        }
      })

      if (hasRemoved) updateGroups()

      set_empty_icons()
    }

    // -------------------------------------------------------------------
    // need to add a fake (empty) g for empty groups, in order to make sure the
    // highlight function works ok, and to prevent change od size of group on 1->0 elements
    // -------------------------------------------------------------------
    function set_empty_icons () {
      $.each(grpD.data.children, function (nChild0, childNow0) {
        $.each(childNow0.children, function (nChild1, childNow1) {
          if (childNow1.children.length === 0) {
            childNow1.children.push({
              id: 'icnEmpty' + unique(),
              trgWidgId: '',
              title: '',
              n_icon: n_empty_icon
            })
          }
        })
      })

      let rmInd = 1
      while (is_def(rmInd)) {
        rmInd = null
        $.each(grpD.data.children, function (nChild0, childNow0) {
          $.each(childNow0.children, function (nChild1, childNow1) {
            $.each(childNow1.children, function (nChild2, childNow2) {
              if (
                childNow2.n_icon === n_empty_icon &&
                childNow1.children.length > 1
              ) {
                rmInd = [nChild0, nChild1, nChild2]
              }
            })
          })
        })

        if (is_def(rmInd)) {
          grpD.data.children[rmInd[0]].children[rmInd[1]].children.splice(
            rmInd[2],
            1
          )
        }
      }
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function setAll () {
      locker.add({ id: tagMain + 'setAll' })

      setHirch()
      set_icons()
      setTtl()
      setVor()

      locker.remove({ id: tagMain + 'setAll', delay: times.anim_arc * 2 })
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function highlight (opt_in) {
      if (locker.is_free(tagMain + 'inDrag')) return

      let id = opt_in.id
      let data = opt_in.data
      let duration = opt_in.type.duration //* ((data.length > 0)?1:0);
      let col = opt_in.type.col

      let rRange = [1, 1]
      let opac = [0, 0.2]
      let strkW = [0, 0.175]

      // let circ = com.icons.g.selectAll("circle."+tag_circ).filter(function(d) { return (d.data.id == id); });
      //   //.data(com.hirchDesc, function(d) { return d.data.id; }) //console.log('xxx',d.data.id);
      // circ
      //   .transition("inOut").duration(duration/4)
      //   // .style("opacity",        opac[1])
      //   .attr("r",             function(d,i){ return d.r * rRange[1]; })
      //   .attr("stroke-width",  function(d,i){ return d.data.strkW * 8; })
      //   .style("stroke-opacity", function(d) { return hirchOpacStrk(d) / 3; } )
      //   .transition("inOut").duration(duration*3/4)
      //   // // .style("opacity",        opac[0])
      //   .attr("r",             function(d,i){ return d.r * rRange[0]; })
      //   .attr("stroke-width",  function(d,i){ return d.data.strkW; })
      //   .style("stroke-opacity", function(d) { return hirchOpacStrk(d); } )
      // return

      let circ = com.highlight.g
        .selectAll('circle.' + id)
        .data(data, function (d, i) {
          return is_def(d.id) ? d.id : i
        })

      circ
        .enter()
        .append('circle')
        .attr('class', id + ' ' + 'all')
        .attr('cx', function (d, i) {
          return d.x
        })
        .attr('cy', function (d, i) {
          return d.y
        })
        .attr('r', function (d, i) {
          return d.r
        })
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', col)
        .style('fill', 'transparent')
        .style('opacity', opac[0])
        .attr('stroke-width', function (d, i) {
          return d.r * strkW[0]
        })
        .merge(circ)
        .transition('inOut')
        .duration(duration / 4)
        .style('opacity', opac[1])
        .attr('r', function (d, i) {
          return d.r * rRange[1]
        })
        .attr('stroke-width', function (d, i) {
          return d.r * strkW[1]
        })
        .transition('inOut')
        .duration(duration * 3 / 4)
        .style('opacity', opac[0])
        .attr('r', function (d, i) {
          return d.r * rRange[0]
        })
        .attr('stroke-width', function (d, i) {
          return d.r * strkW[0]
        })
        .transition('inOut')
        .duration(1)
        .remove()

      circ
        .exit()
        .transition('inOut')
        .duration(duration / 2)
        .style('opacity', 0)
        .remove()
    }

    function hirchStyleStroke (d) {
      if (d.depth === 2) {
        let index = getIndexInParent(d)
        // if(index == 0) return d3.rgb(cols_blues[3]).darker(0.5);
        // if(index == 1) return d3.rgb(cols_yellows[6]).brighter(0.1);
        // if(index == 2) return d3.rgb(cols_reds[4]).brighter(0.95);

        // if(index == 0) return d3.rgb('#01579B').brighter(0.0005);
        // if(index == 1) return d3.rgb('#00B0FF').brighter(0.0005);
        // if(index == 2) return d3.rgb('#536DFE').brighter(0.0005);

        if (index === 0) return d3.rgb('#00B0FF').darker(0.5)
        if (index === 1) return d3.rgb('#8BC34A').darker(0.5)
        if (index === 2) return d3.rgb('#CD96CD').brighter(0.0095)

        // if(index == 0) return d3.rgb('#009688').brighter(0.5);
        // if(index == 1) return d3.rgb('#FF9800').brighter(0.5);
        // if(index == 2) return d3.rgb('#F06292').brighter(0.0095);
      }
      return '#383b42'
      // return d3.rgb(hirchStyleFill(d)).darker(1);
    }
    function hirchStyleFill (d) {
      // if(d.depth == 2) {
      //   let index = getIndexInParent(d);
      //   if(index == 0) return cols_greens[0];
      //   if(index == 1) return cols_yellows[0];
      //   if(index == 2) return cols_reds[0];
      // }
      return '#383b42'
      // return d.children ? "#383b42" : telData.idToCol[d.data.id];
    }
    function hirchOpacFill (d, scale) {
      if (d.depth === 0) return 0
      else if (d.depth === 1) return 0.015
      else if (d.depth === 2) return 0.02
      else if (d.depth === 3) return 0
      // console.log(d)
      // if     (!d.parent)  return 0.02;
      // else if(d.children) return 0.03;
      // else                return 0;
    }
    function hirchOpacStrk (d, scale) {
      if (d.depth === 0) return 0
      else if (d.depth === 1) return 0.5
      else if (d.depth === 2) return 0.9
      else if (d.depth === 3) return 0
      // if     (!d.parent)  return 1;
      // else if(d.children) return 0.5;
      // else                return 0;
    }
    function getIndexInParent (d) {
      let index = -1
      $.each(d.parent.children, function (nChild, childNow) {
        if (childNow.data.id === d.data.id) index = nChild
      })
      return index
    }
  }

  // -------------------------------------------------------------------
  //
  // -------------------------------------------------------------------
  function get_sync_state (data_in) {
    // console.log(' - main_panel_sync - get_sync_state ',data_in);
  }
  this.get_sync_state = get_sync_state

  let svgMain = new SvgMain()
}