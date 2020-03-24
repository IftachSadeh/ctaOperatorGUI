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
var main_script_tag = 'NightSched'
// -------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global min_max_obj */
/* global sock */
/* global times */
/* global is_def */
/* global tel_info */
/* global disable_scroll_svg */
/* global RunLoop */
/* global BlockQueueOld */
/* global bck_pattern */
/* global inst_health_col */
/* global Locker */
/* global dom_add */
/* global run_when_ready */

window.load_script({
    source: main_script_tag,
    script: '/js/utils/BlockQueueOld.js',
})

// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 8
    let w0 = 12
    let div_key = 'main'

    opt_in.widget_func = { sock_func: sock_night_sched, main_func: main_night_sched }
    opt_in.widget_div_id = opt_in.widget_id + 'widget_div'
    opt_in.ele_props = {}
    opt_in.ele_props[div_key] = {
        auto_pos: true,
        is_dark_ele: true,
        gs_id: opt_in.widget_div_id + div_key,
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        content: '<div id=\'' + opt_in.base_name + div_key + '\'></div>',
    }

    sock.add_to_table(opt_in)
}

// -------------------------------------------------------------------
// additional socket events for this particular widget type
// -------------------------------------------------------------------
let sock_night_sched = function(opt_in) {
    // let widget_type   = opt_in.widget_type;
    // let widget_source = opt_in.widget_source;
    // // -------------------------------------------------------------------
    // // get data from the server for a given telescope
    // // -------------------------------------------------------------------
    // this.askTelData = function(opt_in) {
    //   if(sock.con_stat.is_offline()) return;
    //   let data         = {};
    //   data.widget_id = widget_id;
    //   data.tel_Id    = opt_in.tel_Id;
    //   data.propId   = opt_in.propId;
    //   let emit_data = {
    //     "widget_source":widget_source, "widget_name":widget_type, "widget_id":widget_id,
    //     "method_name":"night_sched_ask_tel_data",
    //     "method_arg":data
    //   };
    //   sock.socket.emit("widget", emit_data);
    //   return;
    // }
}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// here we go with the content of this particular widget
// -------------------------------------------------------------------
let main_night_sched = function(opt_in) {
    // let my_unique_id = unique()
    let widget_type = opt_in.widget_type
    let tag_arr_zoomerPlotsSvg = opt_in.base_name
    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele
    let icon_divs = opt_in.icon_divs

    // let this_night_sched = this
    // let is_south = window.__site_type__ === 'S'

    let sgv_tag = {}
    $.each(widget_ele, function(index, ele_now) {
        sgv_tag[ele_now.id] = {
            id: tag_arr_zoomerPlotsSvg + ele_now.id,
            widget: ele_now.widget,
            whRatio: ele_now.w / ele_now.h,
        }
    })

    // delay counters
    let locker = new Locker()
    locker.add('in_init')

    // function loop
    let run_loop = new RunLoop({ tag: widget_id })

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function init_data(data_in) {
        if (sock.multiple_inits({ id: widget_id, data: data_in })) {
            return
        }

        sock.set_icon_badge({ n_icon: data_in.n_icon, icon_divs: icon_divs })

        svg_main.init_data(data_in.data)
    }
    this.init_data = init_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update_data(data_in) {
        svg_main.update_data(data_in.data)
    }
    this.update_data = update_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function sync_state_send(data_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        sock.sock_sync_state_send({
            widget_id: widget_id,
            type: data_in.type,
            data: data_in,
        })
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let SvgMain = function() {
        let com = {}
        let svg = {}
        // let thisMain = this

        let svg_dims = {}
        svg_dims.w = {}
        svg_dims.h = {}
        svg_dims.w[0] = 1000
        svg_dims.h[0] = svg_dims.w[0] / sgv_tag.main.whRatio

        let tag_night_sched = widget_type
        let tagBlockQueue = 'blockQueue'
        let tagTelTreeMap = 'treeMap'

        let blockQueue = new BlockQueueOld()
        let telTreeMap = new TelTreeMap()

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_data(data_in) {
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
                    pass: function() {
                        return is_def(sgv_tag.main.widget.get_ele(svg_div_id))
                    },
                    execute: function() {
                        init_data(data_in)
                    },
                })

                return
            }
            sock.emit_mouse_move({ eleIn: svg_div, data: { widget_id: widget_id } })

            svg.svg = d3
                .select(svg_div)
                .style('background', '#383B42')
                .append('svg')
                .attr('preserveAspectRatio', 'xMidYMid meet')
                .attr('viewBox', '0 0 ' + svg_dims.w[0] + ' ' + svg_dims.h[0])
                .style('position', 'relative')
                .style('width', '100%')
                .style('height', '100%')
                .style('top', '0px')
                .style('left', '0px')
            // .attr("viewBox", "0 0 "+svg_dims.w[0]+" "+svg_dims.h[0] * whRatio)
            // .classed("svgInGridStack_inner", true)
                .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
            // .call(com.svg_zoom)
                .on('dblclick.zoom', null)

            if (disable_scroll_svg) {
                svg.svg.on('wheel', function() {
                    d3.event.preventDefault()
                })
            }

            com.svg_zoom_node = svg.svg.nodes()[0]

            svg.g = svg.svg.append('g')

            // add one rect as background
            // -------------------------------------------------------------------
            svg.g
                .append('g')
                .selectAll('rect')
                .data([ 0 ])
                .enter()
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', svg_dims.w[0])
                .attr('height', svg_dims.h[0])
                .attr('fill', '#F2F2F2')

            // the background grid
            bck_pattern({
                com: com,
                g_now: svg.g,
                g_tag: 'hex',
                len_wh: [ svg_dims.w[0], svg_dims.h[0] ],
                opac: 0.1,
                hex_r: 15,
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let x0, y0, w0, h0, marg
            let gBlockBox = svg.g.append('g')

            w0 = svg_dims.w[0] * 0.95
            h0 = svg_dims.h[0] * 0.3 // h0 *= 2.5;
            x0 = (svg_dims.w[0] - w0) / 2
            y0 = x0
            marg = w0 * 0.01

            let blockBoxData = {
                x: x0,
                y: y0,
                w: w0,
                h: h0,
                marg: marg,
            }

            blockQueue.init({
                tag: tagBlockQueue,
                g_box: gBlockBox,
                doPhase: true,
                click: function(d) {
                    block_focus({ id: d.id })
                },
                boxData: blockBoxData,
                locker: locker,
                lockerV: [ tag_night_sched + 'update_data' ],
                lockerZoom: {
                    all: tagBlockQueue + 'zoom',
                    during: tagBlockQueue + 'zoomsuring',
                    end: tagBlockQueue + 'zoomEnd',
                },
                run_loop: run_loop,
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let gTelBox = svg.g.append('g')

            w0 = blockBoxData.w
            x0 = blockBoxData.x
            y0 = blockBoxData.y + blockBoxData.h + blockBoxData.x
            h0 = svg_dims.h[0] - y0 - blockBoxData.x
            marg = blockBoxData.marg * 2

            let telBoxData = {
                x: x0,
                y: y0,
                w: w0,
                h: h0,
                marg: marg,
            }

            telTreeMap.init({
                tag: tagTelTreeMap,
                click: function(opt_in) {
                    // console.log('click',opt_in);
                    if (opt_in.nTel === -1) {
                        block_focus({ id: opt_in.id })
                    }
                    else {
                        sync_state_send({
                            type: 'sync_tel_focus',
                            sync_time: Date.now(),
                            zoom_state: 1,
                            target: opt_in.id,
                        })
                    }
                },
                g_box: gTelBox,
                boxData: telBoxData,
            })

            telTreeMap.set({ tag: 'recCol', data: blockQueue.get('style').recCol })
            telTreeMap.set({
                tag: 'recFillOpac',
                data: blockQueue.get('style').recFillOpac,
            })
            telTreeMap.set({
                tag: 'recStrokeOpac',
                data: blockQueue.get('style').recStrokeOpac,
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            update_dataOnce(data_in)

            run_when_ready({
                pass: function() {
                    return locker.is_free(tag_night_sched + 'update_data')
                },
                execute: function() {
                    locker.remove('in_init')
                },
            })
        }
        this.init_data = init_data

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        run_loop.init({ tag: 'update_data', func: update_dataOnce, n_keep: 1 })

        function update_data(data_in) {
            if (!locker.is_free('in_init')) {
                setTimeout(function() {
                    update_data(data_in)
                }, 10)
                return
            }

            run_loop.push({ tag: 'update_data', data: data_in }) //, time:data_in.emit_time
        }
        this.update_data = update_data

        function update_dataOnce(data_in) {
            if (
                !locker.are_free([ tag_night_sched + 'update_data', tagBlockQueue + 'zoom' ])
            ) {
                // console.log('will delay updateRecData',locker.get_actives([tag_night_sched+"update_dataOnce", tagBlockQueue+"_zoom"]));
                setTimeout(function() {
                    update_data(data_in)
                }, 10)
                return
            }
            locker.add(tag_night_sched + 'update_data')

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let tel_ids = []
            let inst_health = {}
            $.each(data_in.inst_health, function(index, data_now) {
                tel_ids.push(data_now.id)
                inst_health[data_now.id] = data_now.val
            })

            // blockQueue.set({ tag: 'tel_ids', data: tel_ids })
            // blockQueue.set({ tag: 'time', data: data_in.time_of_night })
            // blockQueue.update(data_in.blocks)

            telTreeMap.set({ tag: 'tel_ids', data: tel_ids })
            telTreeMap.set({ tag: 'inst_health', data: inst_health })
            telTreeMap.update(data_in)

            locker.remove(tag_night_sched + 'update_data')
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function block_focus(opt_in) {
            let data = { type: 'syncObFocus', sync_time: Date.now(), obs_block_id: opt_in.id }
            sock.sock_sync_state_send({
                widget_id: widget_id,
                type: data.type,
                data: data,
            })
        }
    // -------------------------------------------------------------------
    }

    // // -------------------------------------------------------------------
    // //
    // // -------------------------------------------------------------------
    // function get_sync_state(data_in) {

    //   let type = data_in.type;
    //   if(type == "sync_arr_zoomer_prop") {
    //     // console.log(' - main_night_sched - get_sync_state ',data_in.data);
    //     // locker.add("get_sync_state");

    //     let tel_Id  = data_in.data.tel_Id;
    //     let propId = data_in.data.propId;

    //     sock.all_widgets[widget_type].sock_func.askTelData({tel_Id:tel_Id, propId:propId});

    //   }

    //   return;
    // }
    // this.get_sync_state = get_sync_state;

    let svg_main = new SvgMain()
}
// -------------------------------------------------------------------
// -------------------------------------------------------------------

// -------------------------------------------------------------------
//
// -------------------------------------------------------------------
let TelTreeMap = function() {
    let com = {}
    let mainTag = null
    let box = null

    this.set = function(opt_in) {
        if (is_def(opt_in.data)) {
            com[opt_in.tag] = opt_in.data
        }
        else if (is_def(opt_in.def)) {
            com[opt_in.tag] = opt_in.def
        }
        else {
            com[opt_in.tag] = null
        }
    }
    this.get = function(type, data) {
        return com[type]
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function init(opt_in) {
        if (is_def(mainTag)) {
            console.error('trying to init more than once ...', opt_in)
            return
        }
        mainTag = opt_in.tag

        // com.doTimeRect = is_def(opt_in.doTimeRect) ? opt_in.doTimeRect : true;
        com.click = opt_in.click

        // -------------------------------------------------------------------
        // box definition
        // -------------------------------------------------------------------
        let boxData = opt_in.boxData
        let g_box = opt_in.g_box

        com.box = {
            x: boxData.x + boxData.marg,
            y: boxData.y + boxData.marg,
            w: boxData.w - 2 * boxData.marg,
            h: boxData.h - 2 * boxData.marg,
            marg: boxData.marg,
            margFrac: 0.6,
            g: g_box,
            outerBox: boxData,
        }
        box = com.box

        g_box
            .selectAll('rect.' + mainTag + 'telBoxBack')
            .data([ boxData ], function(d) {
                return d.id
            })
            .enter()
            .append('rect')
            .attr('class', mainTag + 'telBoxBack')
            .attr('x', function(d, i) {
                return d.x
            })
            .attr('y', function(d, i) {
                return d.y
            })
            .attr('width', function(d, i) {
                return d.w
            })
            .attr('height', function(d, i) {
                return d.h
            })
            .attr('stroke', '#383B42')
            .attr('stroke-width', '1')
            .attr('stroke-opacity', 0.2)
            .attr('fill', '#F2F2F2')
            .attr('fill-opacity', 1)
            .style('pointer-events', 'none')

        bck_pattern({
            com: com,
            g_now: g_box,
            g_tag: mainTag + 'telBoxBack',
            len_wh: [ boxData.w, boxData.h ],
            trans: [ boxData.x, boxData.y ],
            opac: 0.06,
            texture_orient: '2/8',
        })

        setStyle(opt_in.style)

        com.minTxtSize = box.w * 0.03
    }
    this.init = init

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update(data_in) {
        let blocks = data_in.blocks.run

        let telV = []
        let obTelIdV = {}
        let hirchData = { id: 'tel_ids', children: [] }
        $.each(blocks, function(index, data_now) {
            let tel_ids = data_now.tel_ids.map(function(d) {
                return { id: d, nTel: com.tel_ids.indexOf(d) }
            })
            tel_ids.unshift({
                id: data_now.obs_block_id,
                nTel: -1,
                n_block: index,
                block_name: data_now.metadata.block_name,
            })

            hirchData.children.push({
                id: data_now.obs_block_id,
                nTel: index,
                n_block: index,
                children: tel_ids,
            })
            telV = telV.concat(data_now.tel_ids)

            $.each(data_now.tel_ids, function(i, d) {
                obTelIdV[d] = data_now.obs_block_id
            })
        })

        telV = com.tel_ids.filter(function(n) {
            return !telV.includes(n)
        })
        if (telV.length > 0) {
            hirchData.children.push({
                id: tel_info.no_sub_arr_name(),
                nTel: blocks.length,
                children: telV.map(function(d) {
                    return { id: d, nTel: com.tel_ids.indexOf(d) }
                }),
            })
            $.each(telV, function(i, d) {
                obTelIdV[d] = tel_info.no_sub_arr_name()
            })
        }

        // -------------------------------------------------------------------
        // check if the hirch needs to be recalculated
        // -------------------------------------------------------------------
        let is_new_hierarchy = true
        if (is_def(com.tel_idsObTelIdV)) {
            is_new_hierarchy = false
            $.each(com.tel_idsObTelIdV, function(tel_IdNow, obs_block_id_now) {
                if (obTelIdV[tel_IdNow] !== obs_block_id_now) {
                    is_new_hierarchy = true
                }
            })
        }
        com.tel_idsObTelIdV = obTelIdV

        if (is_new_hierarchy) {
            // -------------------------------------------------------------------
            // see: https://github.com/d3/d3-hierarchy/blob/master/README.md#resquarify_ratio
            // see: https://bl.ocks.org/d3indepth/fa5e9d42d8e260f3f76a98be648c9edd
            // -------------------------------------------------------------------
            if (!is_def(com.tel_idsTree)) {
                com.tel_idsTree = d3
                    .treemap()
                // .tile(d3.treemapResquarify)
                    .tile(d3.treemapResquarify.ratio(1))
                    .size([ box.w, box.h ])
                    .paddingInner(function(d) {
                        return d.height === 2 ? box.marg * 1.5 : 5
                    })
            }

            let hirch = d3
                .hierarchy(hirchData)
            // .sum(function(d) { return d.children ? 2 : 1; })
                .sum(function(d) {
                    if (d.nTel === -1 || is_def(d.children)) {
                        return 2
                    }
                    else {
                        return 1
                    }
                })
                .sort(function(a, b) {
                    if (a.height === 1 && b.height === 1) {
                        // make sure the empty sub-array is always last
                        if (
                            a.data.id === tel_info.no_sub_arr_name() ||
              b.data.id === tel_info.no_sub_arr_name()
                        ) {
                            return -2 * com.tel_ids.length
                        }
                        // make sure large sub-arrays are shown first
                        let difLen = b.children.length - a.children.length
                        let difBlk = b.data.n_block - a.data.n_block
                        return difLen === 0 ? difBlk : difLen
                    }
                    // sort telescopes by fixed order
                    return a.data.nTel - b.data.nTel
                })

            com.tel_idsTree(hirch)

            let desc = hirch.descendants()
            let circData = desc.filter(function(d) {
                return d.height === 0 && d.data.nTel >= 0
            })
            let rectData = desc.filter(function(d) {
                return (
                    (d.height === 1 && d.data.id !== tel_info.no_sub_arr_name()) ||
          d.data.nTel === -1
                )
            })
            $.each(rectData, function(index, data_now) {
                let x0 = com.style.x(data_now)
                let y0 = com.style.y(data_now)
                let w0 = com.style.width(data_now)
                let h0 = com.style.height(data_now)

                if (data_now.height === 0) {
                    let wh0 = Math.min(w0, h0)
                    x0 += (w0 - wh0) / 2
                    y0 += (h0 - wh0) / 2
                    w0 = wh0
                    h0 = wh0
                }

                data_now.data.rect = { x: x0, y: y0, w: w0, h: h0 }
            })
            // console.log(rectData);

            // calc the common size for all circles within a block
            com.telR = {}
            let telR = []
            let hirchBlocks = desc.filter(function(d) {
                return d.height === 1
            })
            $.each(hirchBlocks, function(index, data_now) {
                let id = data_now.data.id

                com.telR[id] =
          0.5 *
          min_max_obj({
              min_max: 'min',
              data: data_now.children,
              func: function(d, i) {
                  return Math.min(d.x1 - d.x0, d.y1 - d.y0)
              },
          })

                if (id !== tel_info.no_sub_arr_name()) {
                    telR.push(com.telR[id])
                }
            })

            // choose the minimal value from all blocks
            let minTelR = Math.min(...Object.values(telR))
            $.each(com.telR, function(key, val) {
                if (key !== tel_info.no_sub_arr_name()) {
                    com.telR[key] = minTelR
                }
                else {
                    com.telR[key] = Math.min(com.telR[key], minTelR)
                }
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let circ = box.g
                .selectAll('circle.' + mainTag + 'inst_health')
                .data(circData, function(d) {
                    return d.data.id
                })

            circ
                .enter()
                .append('circle')
                .attr('class', mainTag + 'inst_health')
                .style('opacity', 0)
                .attr('stroke-opacity', 1)
                .style('fill-opacity', 0.7)
                .attr('vector-effect', 'non-scaling-stroke')
                .attr('cx', com.style.cx)
                .attr('cy', com.style.cy)
                .attr('r', com.style.r)
                .attr('stroke-width', com.style.strokeWidth)
                .attr('fill', function(d, i) {
                    return com.style.fill(d, d.data.n_block)
                })
                .attr('stroke', function(d, i) {
                    return com.style.stroke(d, d.data.n_block)
                })
                .attr('stroke-opacity', com.style.strokeOpacity)
                .attr('pointer-events', com.style.pointerEvents)
                .on('click', com.style.click)
                .merge(circ)
                .transition('in_out')
                .duration(times.anim_arc)
                .attr('cx', com.style.cx)
                .attr('cy', com.style.cy)
                .attr('r', com.style.r)
                .attr('stroke-width', com.style.strokeWidth)
                .style('opacity', com.style.opacity)
                .attr('fill', function(d, i) {
                    return com.style.fill(d, d.data.n_block)
                })
                .attr('stroke', function(d) {
                    return com.style.stroke(d, d.data.n_block)
                })
                .attr('stroke-opacity', com.style.strokeOpacity)

            // -------------------------------------------------------------------
            let rect = box.g
                .selectAll('rect.' + mainTag + 'inst_health')
                .data(rectData, function(d) {
                    return d.data.id
                })

            rect
                .enter()
                .append('rect')
                .attr('class', mainTag + 'inst_health')
                .style('opacity', 0)
                .attr('stroke-opacity', 1)
                .attr('vector-effect', 'non-scaling-stroke')
                .attr('x', function(d) {
                    return d.data.rect.x
                })
                .attr('y', function(d) {
                    return d.data.rect.y
                })
                .attr('width', function(d) {
                    return d.data.rect.w
                })
                .attr('height', function(d) {
                    return d.data.rect.h
                })
                .attr('stroke-width', com.style.strokeWidth)
                .attr('fill', function(d, i) {
                    return com.style.fill(d, d.data.n_block)
                })
                .attr('fill-opacity', com.style.fill_opacity)
                .attr('stroke', function(d, i) {
                    return com.style.stroke(d, d.data.n_block)
                })
            // .attr("stroke", function(d) { return com.style.stroke(d,d.data.n_obs); })
                .attr('stroke-opacity', com.style.strokeOpacity)
                .attr('pointer-events', com.style.pointerEvents)
                .on('click', com.style.click)
                .merge(rect)
                .transition('in_out')
                .duration(times.anim_arc)
            // .attr("x", com.style.x)
            // .attr("y", com.style.y)
            // .attr("width", com.style.width)
            // .attr("height", com.style.height)
                .attr('x', function(d) {
                    return d.data.rect.x
                })
                .attr('y', function(d) {
                    return d.data.rect.y
                })
                .attr('width', function(d) {
                    return d.data.rect.w
                })
                .attr('height', function(d) {
                    return d.data.rect.h
                })
                .attr('stroke-width', com.style.strokeWidth)
                .style('opacity', 1)
            // .style("opacity", com.style.opacity)
                .attr('fill', function(d, i) {
                    return com.style.fill(d, d.data.n_block)
                })
                .attr('fill-opacity', com.style.fill_opacity)
                .attr('stroke', function(d) {
                    return com.style.stroke(d, d.data.n_block)
                })
                .attr('stroke-opacity', com.style.strokeOpacity)

            rect
                .exit()
                .transition('in_out')
                .duration(times.anim_arc / 2)
                .style('opacity', 0)
                .remove()

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let text = box.g.selectAll('text.' + mainTag + 'inst_health').data(
                desc.filter(function(d) {
                    return d.height === 0
                }),
                function(d) {
                    return d.data.id
                }
            )

            text
                .enter()
                .append('text')
                .attr('class', mainTag + 'inst_health')
            // .text(com.style.text)
                .text(function(d, i) {
                    if (d.data.nTel === -1) {
                        return d.data.block_name
                    }
                    else {
                        return tel_info.get_title(d.data.id)
                    }
                })
                .style('font-weight', 'normal')
                .style('opacity', 0)
                .style('fill-opacity', 1)
                .style('fill', '#383b42')
            // .style("stroke", "#383b42")
                .style('stroke', '#8B919F')
                .style('stroke-width', 0.3)
                .style('stroke-opacity', 1)
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .attr('x', com.style.textX)
                .attr('y', com.style.textY)
                .attr('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .merge(text)
                .style('font-size', com.style.font_size)
                .transition('in_out')
                .duration(times.anim_arc)
                .style('opacity', com.style.opacity)
                .attr('x', com.style.textX)
                .attr('y', com.style.textY)
                .attr('dy', function(d) {
                    return d.size / 3 + 'px'
                })

            text
                .exit()
                .transition('in_out')
                .duration(times.anim_arc)
                .style('opacity', 0)
                .remove()
        }
        else {
            let circ = box.g.selectAll('circle.' + mainTag + 'inst_health')

            circ
                .transition('updtCol')
                .duration(times.anim_arc)
                .attr('fill', function(d, i) {
                    return com.style.fill(d, d.data.n_block)
                })
                .attr('stroke', function(d) {
                    return com.style.stroke(d, d.data.n_block)
                })

            let rect = box.g.selectAll('rect.' + mainTag + 'inst_health')

            rect
                .transition('updtCol')
                .duration(times.anim_arc)
                .attr('fill', function(d, i) {
                    return com.style.fill(d, d.data.n_block)
                })
                .attr('stroke', function(d) {
                    return com.style.stroke(d, d.data.n_block)
                })
        }
    }
    this.update = update

    // -------------------------------------------------------------------
    // styling/helper functions
    // -------------------------------------------------------------------
    function setStyle(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {}
        }

        com.style = {}

        com.style.x = function(d) {
            if (d.height === 1) {
                return box.x + d.x0 - box.marg * box.margFrac
            }
            else {
                return box.x + d.x0
            }
        }
        com.style.y = function(d) {
            if (d.height === 1) {
                return box.y + d.y0 - box.marg * box.margFrac
            }
            else {
                return box.y + d.y0
            }
        }
        com.style.width = function(d) {
            // just in case, a minimal value...
            let w = Math.max(5, d.x1 - d.x0)
            if (d.height === 1) {
                return w + box.marg * box.margFrac * 2
            }
            else {
                return w
            }
        }
        com.style.height = function(d) {
            // just in case, a minimal value...
            let h = Math.max(5, d.y1 - d.y0)
            if (d.height === 1) {
                return h + box.marg * box.margFrac * 2
            }
            else {
                return h
            }
        }
        com.style.r = function(d) {
            // console.log(d.parent.data.id);
            return com.telR[d.parent.data.id]
            // return Math.min(com.style.width(d), com.style.height(d))/2;
        }
        com.style.cx = function(d) {
            return com.style.x(d) + com.style.width(d) / 2
        }
        com.style.cy = function(d) {
            return com.style.y(d) + com.style.height(d) / 2
        }
        com.style.fill = function(d, n_obs) {
            if (d.height === 0) {
                if (d.data.nTel === -1) {
                    return com.recCol({ d: d, state: 'run', n_obs: n_obs, can_run: true })
                }
                else {
                    return inst_health_col(com.inst_health[d.data.id])
                }
            }
            else {
                return 'transparent'
            }
        }
        com.style.fill_opacity = function(d) {
            if (d.data.nTel === -1) {
                return com.recFillOpac('run')
            }
            else {
                return 0.7
            }
        }
        com.style.stroke = function(d, n_obs) {
            if (d.height === 0) {
                if (d.data.nTel === -1) {
                    return d3
                        .rgb(com.recCol({ d: d, state: 'run', n_obs: n_obs, can_run: true }))
                        .darker(1.0)
                }
                else {
                    return inst_health_col(com.inst_health[d.data.id], 0.5)
                }
            }
            else if (d.height === 1) {
                return d3
                    .rgb(com.recCol({ d: d, state: 'run', n_obs: n_obs, can_run: true }))
                    .darker(1.0)
            }
            else {
                return 'transparent'
            }
        }
        com.style.strokeWidth = function(d) {
            if (d.height === 0) {
                return 1
            }
            else {
                return box.marg / 8
            }
        }
        com.style.strokeOpacity = function(d) {
            if (d.height === 0) {
                if (d.data.nTel === -1) {
                    return com.recStrokeOpac(d)
                }
                else {
                    return 0.5
                }
            }
            else {
                return com.recFillOpac('run')
            }
        }
        com.style.opacity = function(d) {
            if (d.height === 2) {
                return 0
            }
            else if (d.height === 1) {
                if (d.data.id === tel_info.no_sub_arr_name()) {
                    return 0
                }
                else {
                    return 0.5
                }
            }
            else {
                if (d.parent.data.id === tel_info.no_sub_arr_name()) {
                    return 0.4
                }
                else {
                    return 1
                }
            }
        }
        com.style.pointerEvents = function(d) {
            if (d.height === 0) {
                return 'auto'
            }
            else {
                return 'none'
            }
        }
        com.style.click = function(d) {
            return com.click({ id: d.data.id, nTel: d.data.nTel })
        }
        com.style.text = function(d) {
            if (d.height === 0) {
                return d.data.id
            }
            else {
                return ''
            }
        }
        com.style.textX = function(d, i, xx) {
            return com.style.x(d) + com.style.width(d) / 2
        }
        com.style.textY = function(d) {
            return com.style.y(d) + com.style.height(d) / 2
        }
        com.style.font_size = function(d) {
            if (d.data.nTel >= 0) {
                d.size = com.style.r(d) * 2
            }
            else {
                d.size = 0.8 * Math.min(com.style.width(d), com.style.height(d))
            }
            d.size = Math.max(com.minTxtSize, d.size) / 3
            return d.size + 'px'
        }
    }
}
