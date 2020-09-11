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
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 6
    let w0 = 6
    let div_key = ''

    opt_in.widget_func = {
        sock_func: sock_sub_arr_grp,
        main_func: main_sub_arr_grp,
    }
    opt_in.widget_div_id = opt_in.widget_id + 'widget_div'
    opt_in.ele_props = {
    }

    div_key = 'sky_pos'
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

    y0 += w0

    div_key = 'sub_arr'
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
//
// -------------------------------------------------------------------
let sock_sub_arr_grp = function(opt_in) {}

let main_sub_arr_grp = function(opt_in) {
    // let my_unique_id = unique()
    // let widget_type = opt_in.widget_type
    let tag_sub_arr_grp_svg = opt_in.base_name
    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele
    let icon_divs = opt_in.icon_divs

    // let this_sub_arr_grp = this
    let is_south = window.SITE_TYPE === 'S'

    let sgv_tag = {
    }
    $.each(widget_ele, function(index, ele_now) {
        sgv_tag[ele_now.id] = {
            id: tag_sub_arr_grp_svg + ele_now.id,
            widget: ele_now.widget,
            whRatio: ele_now.w / ele_now.h,
        }
    })

    // delay counters
    let locker = new Locker()
    locker.add('in_init')
    locker.add('in_init_sub_arr')
    locker.add('in_init_sky_pos')

    // function loop
    let run_loop = new RunLoop({
        tag: widget_id,
    })

    let update_data_evt = function(data_in) {
        if (data_in.metadata.widget_id !== widget_id) {
            return
        }
        update_data(data_in)
    }
    sock.socket.add_listener({
        name: 'update_data',
        func: update_data_evt,
        is_singleton: false,
    })

    let interpolate01 = d3.interpolate(0, 1)

    let zoom_state = 0
    let tel_data = {
    }

    let svg_dims = {
    }
    svg_dims.w = {
    }
    svg_dims.h = {
    }

    svg_dims.w[0] = 400 // is_south ? 900 : 400;
    svg_dims.h[0] = svg_dims.w[0]
    svg_dims.w[1] = svg_dims.w[0] * 1.2
    svg_dims.h[1] = svg_dims.h[0] * 1.2

    let frac_wh = 0.05
    let wh = [ svg_dims.w[1], svg_dims.h[1] ] // wh[0] *= 0.9; wh[1] *= 0.9;
    let pack_wh = [ wh[0] * (1 - frac_wh * 2), wh[1] * (1 - frac_wh * 2) ]

    let is_ra_dec = false
    let is_hms = false
    let lbl_dig = 3

    // -------------------------------------------------------------------
    // color
    // -------------------------------------------------------------------
    // see: http://colors.findthedata.com/saved_search/Pastel-Colors
    //      https://www.google.de/design/spec/style/color.html#color-color-palette
    //      http://riccardoscalco.github.io/crayon/
    let state_col = {
    }
    state_col.b = [ '#64B5F6' ]
    state_col.p = [ '#9575CD' ]
    state_col.g = [ '#b5c69c', '#AED581' ]
    state_col.y = [ '#fcd975', '#FFEB3B' ]
    state_col.r = [ '#ed6d6c', '#EF5350' ]

    let tel_track_col = d3
        .scaleLinear()
        .domain([ 360, 1 ])
        .range([ '#90CAF9', '#64B5F6' ])

    function get_col_stop() {
        return cols_reds[8]
    }
    function get_col_slew(d) {
        return tel_track_col(d)
    }
    function get_col_track() {
        return state_col.g[0]
    }
    function get_col_stretch_band() {
        return state_col.p[0]
    }

    function parse_pos_txt(pos_in) {
        if (pos_in.length === 0) {
            return ''
        }

        let title
        let pos = [ pos_in[0], pos_in[1] ]
        if (is_ra_dec) {
            title = 'RA,Dec: '
            pos[0] = azim_ra(pos[0])
        }
        else {
            title = symbols.phi + ',' + symbols.delta + ': '
        }

        let data_out
        if (is_hms) {
            let pos1
            if (is_ra_dec) {
                pos1 = [ deg_hms(pos[0]), deg_dms(pos[1]) ]
            }
            else {
                pos1 = [ deg_dms(pos[0]), deg_dms(pos[1]) ]
            }

            data_out = (
                (formInpt(pos1[0][0], 0) + unit_deg + ' ' + formInpt(pos1[0][1], 0))
                + (unit_arcmin + ' ' + formInpt(pos1[0][2], 1) + unit_arcsec + ' , ')
                + (formInpt(pos1[1][0], 0) + unit_deg + ' ' + formInpt(pos1[1][1], 0))
                + (unit_arcmin + ' ' + formInpt(pos1[1][2], 1) + unit_arcsec)
            )

            return (
                (title + data_out).replace(/ /g, '\u00A0')
            )
        }
        else {
            data_out = (
                (formInpt(pos[0], lbl_dig) + unit_deg + ' , ')
                + (formInpt(pos[1], lbl_dig) + unit_deg)
            )
            return (
                (title + data_out).replace(/ /g, '\u00A0')
            )
        }
    }
    function formInpt(input, prec) {
        return (
            d3.format(' >' + (prec + 3) + ',.' + prec + 'f')(input)
        )
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function init_data(data_in) {
        let mult_inits = sock.multiple_inits({
            id: widget_id,
            data: data_in,
        })
        if (mult_inits) {
            return
        }

        locker.add('data_change')


        sock.set_icon_badge({
            data: data_in,
            icon_divs: icon_divs,
        })

        let data_init = data_in.data
        let has_join_data = join_tel_props(data_init, true)
        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        svg_sub_arr.init_data(has_join_data)
        svg_sky_pos.init_data(has_join_data)

        locker.remove('data_change')

        set_state({
            type: 'init_data',
            data: null,
        })

        run_when_ready({
            pass: function() {
                return locker.are_free([
                    'in_init_sub_arr',
                    'in_init_sky_pos',
                    'data_change',
                    'set_state',
                    'set_focused',
                ])
            },
            execute: function() {
                locker.remove('in_init')
            },
        })

        return
    }
    this.init_data = init_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    run_loop.init({
        tag: 'update_data',
        func: update_data_once,
        n_keep: -1,
    })

    function update_data(data_in) {
        run_loop.push({
            tag: 'update_data',
            data: data_in.data,
        })
    }

    function update_data_once(data_in) {
        if (
            !locker.are_free([
                'zoom',
                'zoom_to_target',
                'data_change',
                'set_state',
                'set_focused',
            ])
        ) {
            setTimeout(function() {
                update_data_once(data_in)
            }, 10)
            return
        }
        // console.log('update_data')
        locker.add('data_change')

        let has_join_data = join_tel_props(data_in, false)

        if (has_join_data) {
            svg_sub_arr.update_data(data_in)
            svg_sky_pos.update_data(data_in)
        }

        locker.remove({
            id: 'data_change',
        })

        set_state({
            type: 'data_change',
            data: null,
        })
    }
    this.update_data = update_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    run_loop.init({
        tag: 'set_state',
        func: set_state_once,
        n_keep: 1,
    })

    function set_state(data_in) {
        run_loop.push({
            tag: 'set_state',
            data: data_in,
        })
    }

    function set_state_once(opt_in) {
    // console.log('SetState');
    // console.log(tel_data)

        svg_sub_arr.set_state_once(opt_in)
        svg_sky_pos.set_focused()
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function join_tel_props(data_in, is_init) {
        locker.add('data_change')

        if (is_init) {
            tel_data = data_in
            // console.log('xxxxxxxx',data_in);
            // tel_data = deep_copy(data_in); // deep copy

            tel_data.id_cols = {
            }
            tel_data.id_focuses = {
            }
            tel_data.trg_pnt_focus = {
                trg: {
                },
                pnt: {
                },
            }

            if (!is_def(tel_data.prev_state)) {
                tel_data.prev_state = 0
            }
            if (!is_def(tel_data.tel_hover)) {
                tel_data.tel_hover = null
            }
        }
        else {
            if (is_def(data_in.sub_arr)) {
                tel_data.sub_arr = data_in.sub_arr
            }

            $.each(data_in, function(key, data_now_0) {
                if (key !== 'sub_arr') {
                    $.each(data_now_0, function(index, data_now_1) {
                        let eles = (
                            find_dict_ele_in_obj(
                                tel_data[key], 'id', data_now_1.id, false
                            )
                        )

                        if (eles[0] === -1) {
                            tel_data[key].push(data_now_1)
                        }
                        else {
                            tel_data[key][eles[0]] = data_now_1
                        }
                    })
                }
            })

            // check if there are any trg,pnt elements which are not used by any telescope, and remove them
            $.each([ 'trg', 'pnt' ], function(trg_tel_index, trg_tel) {
                let ele_to_rm = []
                $.each(tel_data[trg_tel], function(i, d) {
                    let target_point_id = d.id
                    let eles = find_dict_ele_in_obj(
                        tel_data.tel,
                        trg_tel + '_id',
                        target_point_id,
                        false
                    )

                    // add to begning of array, as will need to remove one by one, which will change the length
                    if (eles[0] === -1) {
                        ele_to_rm.unshift(i)
                    }
                })

                // remove all unused elements
                $.each(ele_to_rm, function(i, d) {
                    tel_data[trg_tel].splice(d, 1)
                })
                // console.log('ele_to_rm',ele_to_rm,tel_data[trg_tel])
            })
        }

        // -------------------------------------------------------------------
        // quick access for each child by the corresponding id
        // -------------------------------------------------------------------
        tel_data.sub_arr_ids = {
        }
        tel_data.tel_sub_arr_id = {
        }
        $.each(tel_data.sub_arr.children, function(index_0, sub_arr_now) {
            tel_data.sub_arr_ids[sub_arr_now.id] = sub_arr_now

            tel_data.tel_sub_arr_id[sub_arr_now.id] = sub_arr_now.id
            $.each(sub_arr_now.children, function(index_1, telNow) {
                tel_data.tel_sub_arr_id[telNow.id] = sub_arr_now.id
                // console.log('set :',sub_arr_now.id,telNow.id)
            })
        })

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        if (!is_def(tel_data.tel_hover)) {
            tel_data.tel_hover = {
            }
            tel_data.tel_hover.sub_arr = ''
        }
        if (!is_def(tel_data.sub_arr_ids[tel_data.tel_hover.sub_arr])) {
            tel_data.tel_hover.id = tel_data.sub_arr.children[0].children[0].id
            tel_data.tel_hover.focused_sub_arr = ''
            tel_data.tel_hover.clicked_sub_arr = ''
        }
        tel_data.tel_hover.sub_arr = tel_data.tel_sub_arr_id[tel_data.tel_hover.id]

        // -------------------------------------------------------------------
        // fill the "trg" and "pnt" elements according to the
        // corresponding data_now.trg, data_now.pnt
        // -------------------------------------------------------------------
        // let needInitData = false;
        $.each([ 'trg', 'pnt' ], function(index_0, key) {
            $.each(tel_data.tel, function(index_1, ele_now) {
                tel_data.tel[index_1][key] = [ 0, 0 ]

                let target_point_id = ele_now[key + '_id']
                let trg_pnts = (
                    target_point_id !== tel_info.no_sub_arr_name()
                        ? find_dict_ele_in_obj(
                            tel_data[key], 'id', target_point_id, true
                        )[1]
                        : undefined
                )

                if (is_def(trg_pnts)) {
                    if (target_point_id !== tel_info.no_sub_arr_name()) {
                        tel_data.tel[index_1][key] = trg_pnts.pos
                    }
                }

                if (target_point_id !== tel_info.no_sub_arr_name() && !is_def(trg_pnts)) {
                    // needInitData = true;
                    let ele_in_obj = find_dict_ele_in_obj(
                        tel_data[key], 'id', target_point_id, true
                    )[1]
                    if (target_point_id === tel_info.no_sub_arr_name()) {
                        ele_in_obj = '-------'
                    }
                    console.error(
                        '-ERROR-:',
                        key,
                        index_1,
                        ele_now.id,
                        ele_now,
                        target_point_id,
                        ele_in_obj,
                        tel_data
                    )
                }
            })
        })
        // if(Math.floor(Math.random()*100)%5==0){  needInitData = true;}

        // // -------------------------------------------------------------------
        // // if there is some inconsistency with the unpdated data, ask for a complete initialization
        // // -------------------------------------------------------------------
        // if(needInitData) {
        //   locker.remove("data_change");
        //   console.log('askInitData',widget_id);
        //   askInitData({widget_id:widget_id});
        //   return false;
        // }

        // -------------------------------------------------------------------
        // colors
        // -------------------------------------------------------------------
        let col_now
        $.each(tel_data.tel, function(index, ele_now) {
            if (ele_now.pnt_id === tel_info.no_sub_arr_name()) {
                col_now = get_col_stop()
            }
            else {
                let pos_diff_0 = Math.abs(ele_now.pos[0] - ele_now.pnt[0])
                let pos_diff_1 = Math.abs(ele_now.pos[1] - ele_now.pnt[1])
                if (pos_diff_0 >= 360) {
                    pos_diff_0 -= 360
                }
                if (pos_diff_1 >= 90) {
                    pos_diff_1 -= 90
                }
                let pos_diff = (
                    Math.sqrt(Math.pow(pos_diff_0, 2)
                    + Math.pow(pos_diff_1, 2))
                )
                let pos_diff_dms = deg_dms(pos_diff)

                col_now = (
                    pos_diff_dms[0] <= 1 || pos_diff_dms[0] >= 359
                        ? get_col_track()
                        : get_col_slew(pos_diff)
                )
            }

            tel_data.id_cols[ele_now.id] = col_now
            tel_data.tel[index].col = col_now
        })

        locker.remove('data_change')

        return true
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    // function update_sync_state(data_in) {
    //   svg_sub_arr.zoom_to_target({ target:tel_data.tel_hover.id, scale:get_scale(), duration_scale:2 });
    // }
    // this.update_sync_state = update_sync_state;

    let prev_sync = {
    }
    function update_sync_state(data_in) {
        console.log('see arrzommer update_sync_state JJJJJJJJJJJJJJJJ')
        if (document.hidden) {
            return
        }
        if (sock.con_stat.is_offline()) {
            return
        }

        let sess_widget_ids = data_in.metadata.sess_widget_ids
        if (sess_widget_ids.indexOf(widget_id) < 0 || widget_id === data_in.widget_id) {
            return
        }

        if (sock.is_old_sync(prev_sync, data_in.data)) {
            return
        }

        // console.log('get  -=- ',widget_id,data_in.type,data_in.data);

        prev_sync[data_in.type] = data_in.data

        let type = data_in.type
        if (type === 'sync_tel_focus') {
            // locker.add("update_sync_state");

            let target = data_in.data.target
            let zoom_state = data_in.data.zoom_state

            let scale = svg_sub_arr.com.z['0.0']
            if (zoom_state === 1) {
                scale = svg_sub_arr.com.z['2.0']
            }

            svg_sub_arr.zoom_to_target({
                target: target,
                scale: scale,
                duration_scale: 1,
                end_func: function() {},
            })
        }
    }
    this.update_sync_state = update_sync_state

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    run_loop.init({
        tag: 'send_sync_state_to_server',
        func: sync_state_send_nce,
        n_keep: 1,
        wait: times.wait_sync_state,
    })

    function send_sync_state_to_server(data_in) {
        run_loop.push({
            tag: 'send_sync_state_to_server',
            data: data_in,
        })
    }

    function sync_state_send_nce(data_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        if (
            !locker.are_free([
                'in_init',
                'zoom',
                'auto_zoom_target',
                'set_state',
                'set_hierarchy',
                'data_change',
            ])
        ) {
            setTimeout(function() {
                send_sync_state_to_server(data_in)
            }, times.anim)
            return
        }

        if (sock.is_same_sync(prev_sync, data_in)) {
            return
        }

        // console.log('send -=- ',widget_id,data_in,prev_sync[ data_in.type]);

        prev_sync[data_in.type] = data_in
        sock.sock_sync_state_send({
            widget_id: widget_id,
            type: data_in.type,
            data: data_in,
        })
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function SvgSkyPos() {
        let this_sky_pos = this

        let com = {
        }

        // initialize a couple of functions to be overriden below
        let get_scale = function() {
            return len_sky_pos.z['0.0']
        }
        let get_trans = function() {
            return [ 0, 0 ]
        }
        this.get_scale = get_scale
        this.get_trans = get_trans

        let zoom_funcs = {
        }
        zoom_funcs.zoom_during = {
        }
        zoom_funcs.zoom_end = {
        }
        // zoom_funcs.updt_focused = {
        // }

        let len_sky_pos = {
        }
        len_sky_pos.z = {
        }
        len_sky_pos.z['0.0'] = 1
        len_sky_pos.z['1.0'] = 100
        len_sky_pos.z.scaleFactor = len_sky_pos.z['0.0']
        len_sky_pos.z.gratRatio = 25

        // font sizes, scaled to the different zoom levels
        len_sky_pos.f = {
        }
        len_sky_pos.f['0.0'] = 9 / len_sky_pos.z['0.0']

        //
        len_sky_pos.r = {
        }
        len_sky_pos.r.trg = is_south ? 4 : 6
        len_sky_pos.r.tel = is_south ? 10 : 18 // {"L":14,"M":14,"S":14};//{"L":14,"M":12,"S":10};

        // initialize a global function (to be overriden below)
        let zoom_to_target = function(opt_in) {
            if (!locker.is_free('in_init')) {
                setTimeout(function() {
                    zoom_to_target(opt_in)
                }, times.wait_loop)
            }
        }
        this.zoom_to_target = zoom_to_target

        // -------------------------------------------------------------------
        // background container & zoom behaviour
        // -------------------------------------------------------------------
        function init_data(has_join_data) {
            if (is_def(com.zoom_callable)) {
                return
            }

            // -------------------------------------------------------------------
            // attach the div which will host the main svg element
            // -------------------------------------------------------------------
            let svg_div_id = sgv_tag.sky_pos.id + 'Svg'
            let svg_div = sgv_tag.sky_pos.widget.get_ele(svg_div_id)

            if (!is_def(svg_div)) {
                let parent = sgv_tag.sky_pos.widget.get_ele(sgv_tag.sky_pos.id)
                svg_div = document.createElement('div')
                svg_div.id = svg_div_id

                dom_add(parent, svg_div)

                run_when_ready({
                    pass: function() {
                        return is_def(sgv_tag.sky_pos.widget.get_ele(svg_div_id))
                    },
                    execute: function() {
                        init_data(has_join_data)
                    },
                })

                return
            }
            sock.emit_mouse_move({
                eleIn: svg_div,
                data: {
                    widget_id: widget_id,
                },
            })

            // -------------------------------------------------------------------
            // zoom start/on/end functions, attachd to com.svg_zoom
            // -------------------------------------------------------------------
            let scale_start = 0
            com.svg_zoom_start = function() {
                scale_start = d3.event.transform.k
                locker.add({
                    id: 'zoom',
                    override: true,
                })
                locker.add({
                    id: 'zoom_end',
                    override: true,
                })
            }

            com.svg_zoom_during = function() {
                com.zoom_callable.attr('transform', d3.event.transform)
                com.svg_zoom_update_state()
            }

            com.svg_zoom_update_state = function() {}

            com.svg_zoom_end = function() {
                locker.remove('zoom')
                locker.remove({
                    id: 'zoom_end',
                    delay: times.anim * 1.2,
                    override: true,
                })

                com.svg_zoom_update_state()

                // only do this once for each zooming sequence
                do_zoom_end_func()

                // if on minimal zoom, center
                if (Math.abs(d3.event.transform.k - scale_start) > 0.00001) {
                    if (Math.abs(d3.event.transform.k - len_sky_pos.z['0.0']) < 0.00001) {
                        if (locker.are_free([ 'auto_zoom_target' ])) {
                            zoom_to_target({
                                target: 'init',
                                scale: d3.event.transform.k,
                                duration_scale: 0.5,
                            })
                        }
                    }
                }
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            run_loop.init({
                tag: 'do_zoom_end_func',
                func: do_zoom_end_func_once,
                n_keep: 1,
            })

            function do_zoom_end_func() {
                run_loop.push({
                    tag: 'do_zoom_end_func',
                })
            }

            function do_zoom_end_func_once() {
                if (
                    locker.are_free([
                        'zoom_end',
                        'set_state',
                        'zoom',
                        'zoom_to_target',
                        'data_change',
                        'set_focused',
                    ])
                ) {
                    $.each(zoom_funcs.zoom_end, function(tag_now, funcNow) {
                        funcNow()
                    })
                }
                else {
                    setTimeout(function() {
                        do_zoom_end_func()
                    }, times.anim / 2)
                }
            }

            com.svg_zoom = d3
                .zoom()
                .scaleExtent([ len_sky_pos.z['0.0'], len_sky_pos.z['1.0'] ])
            
            com.svg_zoom.on('start', com.svg_zoom_start)
            com.svg_zoom.on('zoom', com.svg_zoom_during)
            com.svg_zoom.on('end', com.svg_zoom_end)

            // -------------------------------------------------------------------
            // programatic zoom to some target and scale - only use the last of any set of ovelapping
            // zoom requests, where zooming is only possible after len_sky_pos.zoomLock becomes free
            // -------------------------------------------------------------------
            run_loop.init({
                tag: 'zoom_to_target_sky_pos',
                func: do_zoom_to_target,
                n_keep: -1,
            })

            // the actual function to be called when a zoom needs to be put in the queue
            zoom_to_target = function(opt_in) {
                if (!locker.is_free('in_init')) {
                    setTimeout(function() {
                        zoom_to_target(opt_in)
                    }, times.wait_loop)
                    return
                }
                if (!locker.are_free([ 'auto_zoom_target' ])) {
                    return
                }

                let target_name = opt_in.target
                let target_scale = opt_in.scale
                let duration_scale = opt_in.duration_scale

                if (target_scale < len_sky_pos['0.0']) {
                    target_scale = get_scale()
                }

                let trans_to = [ 0, 0 ]
                if (target_name !== 'init') {
                    let id_now = 'tel' + target_name
                    if (is_def(com.inst_pos.circXY)) {
                        let inst_pos = com.inst_pos.circXY[id_now]

                        if (is_def(inst_pos)) {
                            trans_to = [ inst_pos.x, inst_pos.y ]
                        }
                    }
                }

                let func_start = function() {
                    locker.add({
                        id: 'auto_zoom_target',
                        override: true,
                    })
                }
                let func_during = function() {}
                let func_end = function() {
                    locker.remove('auto_zoom_target')
                }

                let data_out = {
                    target_scale: target_scale,
                    duration_scale: duration_scale,
                    base_time: 300,
                    trans_to: trans_to,
                    wh: [ svg_dims.w[1], svg_dims.h[1] ],
                    cent: [ 0, 0 ],
                    func_start: func_start,
                    func_end: func_end,
                    func_during: func_during,
                    svg: com.svg,
                    svg_zoom: com.svg_zoom,
                    zoom_callable: com.zoom_callable,
                    svg_zoom_node: com.svg_zoom_node,
                }

                if (duration_scale < 0) {
                    data_out.duration_scale = 0
                    do_zoom_to_target(data_out)
                }
                else {
                    run_loop.push({
                        tag: 'zoom_to_target_sky_pos',
                        data: data_out,
                    })
                }
            }
            this_sky_pos.zoom_to_target = zoom_to_target

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
                    (-svg_dims.w[1] / 2 + ' ' + -svg_dims.h[1] / 2 + ' ')
                    + (svg_dims.w[1] + ' ' + svg_dims.h[1])
                )
                .style('position', 'relative')
                .style('width', '100%')
                .style('height', '100%')
                .style('top', '0px')
                .style('left', '0px')
                // .classed("svgInGridStack_inner", true)
                .style('background', '#383B42') // .style("background", "blue")// .style("border","1px solid red")
                .call(com.svg_zoom)
                .on('wheel', function() {
                    d3.event.preventDefault()
                })
                // .on("dblclick.zoom", null)

            com.zoom_callable = com.svg.append('g')
            com.svg_overlay = com.svg.append('g')

            // save the svg node to use for d3.zoomTransform() later
            com.svg_zoom_node = com.svg.nodes()[0]

            get_scale = function() {
                return d3.zoomTransform(com.svg_zoom_node).k
            }
            get_trans = function() {
                return [
                    d3.zoomTransform(com.svg_zoom_node).x,
                    d3.zoomTransform(com.svg_zoom_node).y,
                ]
            }
            this_sky_pos.get_scale = get_scale
            this_sky_pos.get_trans = get_trans

            // -------------------------------------------------------------------
            // add one circle as background
            // -------------------------------------------------------------------
            com.zoom_callable
                .append('g')
                .selectAll('circle')
                .data([ 0, 1 ])
                .enter()
                .append('circle')
                .attr('r', 0)
                // .attr("cx", svg_dims.w[1]/2)
                // .attr("cy", svg_dims.h[1]/2)
                .attr('cx', 0)
                .attr('cy', 0)
                // .attr("fill", "#F2F2F2")
                .attr('fill', function(d, i) {
                    return i === 0 ? d3.rgb('#F2F2F2').darker(0.05) : '#F2F2F2'
                })
                .transition('in_out')
                .duration(times.anim / 3)
                // .attr("r", function(d,i) { return svg_dims.w[1]/2; });
                .attr('r', function(d, i) {
                    return svg_dims.w[1] * (i === 0 ? 1 / 2 : 1 / 2.2)
                })

            com.zoom_callable.on('mousemove', function() {
                update_over_text(d3.mouse(this))
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            //
            init_grat()
            //
            set_proj_path()
            //
            add_grat_lines()
            //
            grat_lbls([ 0, 0 ], 1)
            //
            proj_tel_pos()
            // initi overlay coordinate text
            set_over_text()

            locker.remove('in_init_sky_pos')
        }
        this.init_data = init_data

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_over_text() {
            if (!is_def(com.over_rect)) {
                com.over_rect = {
                }
                com.over_rect.w = svg_dims.w[1]
                com.over_rect.h = svg_dims.h[1] * 0.06
                com.over_rect.x = -com.over_rect.w / 2
                com.over_rect.y = svg_dims.h[1] / 2 - com.over_rect.h

                com.over_rect.data = [
                    {
                        id: 'coordinates',
                        x: 15, // com.over_rect.w*0.05,
                        y: com.over_rect.h / 2,
                        txt: '',
                        size: 15,
                    },
                ]

                com.svg_overlay
                    .style('pointer-events', 'none')
                    .attr('transform', (
                        'translate(' + com.over_rect.x + ',' + com.over_rect.y + ')'
                    ))

                let defs = com.svg_overlay.append('defs')

                let grad = defs
                    .append('linearGradient')
                    .attr('id', 'svg_overlay_grad')
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

                com.svg_overlay
                    .append('g')
                    .selectAll('rect')
                    .data([ 0 ])
                    .enter()
                    .append('rect')
                    .style('pointer-events', 'none')
                    .attr('width', com.over_rect.w)
                    .attr('height', com.over_rect.h)
                    .attr('x', 0)
                    .attr('y', 0)
                    .style('opacity', 0.7)
                    .attr('fill', 'url(#svg_overlay_grad)')
                // .attr("fill","#F2F2F2")
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let tag_now = 'coord'
            let txt = com.svg_overlay
                .selectAll('text.' + tag_now)
                .data(com.over_rect.data, function(d) {
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
                .style('stroke', '#F2F2F2')
                .style('fill', '#F2F2F2')
                .style('pointer-events', 'none')
                .style('vector-effect', 'non-scaling-stroke')
                .style('font-size', function(d) {
                    return d.size + 'px'
                })
                .attr('dy', function(d) {
                    return d.size / 3 + 'px'
                })
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')'
                })
                .merge(txt)
                .transition('in_out')
                .duration(times.anim)
                .text(function(d) {
                    return d.txt
                })
                .style('fill-opacity', 0.9)
                .style('stroke-opacity', 0.7)

            txt
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('fill-opacity', 0)
                .style('stroke-opacity', 0)
                .remove()
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function update_over_text(mousePos) {
            let transProj = com.proj.invert(mousePos)

            let is_out = false
            if (com.isPolar) {
                is_out = transProj[1] >= 0
            }
            if (is_out) {
                transProj = []
            }
            else {
                transProj[1] *= -1
            }

            com.over_rect.data[0].txt = parse_pos_txt(transProj)

            set_over_text()
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function update_data(data_in) {
            proj_tel_pos()
        }
        this_sky_pos.update_data = update_data

        // -------------------------------------------------------------------
        // translate coordinates to the skymap
        // -------------------------------------------------------------------
        // FFF
        function set_proj_pos() {
            $.each([ 'trg', 'pnt', 'tel' ], function(trg_tel_index, trg_tel) {
                $.each([ 'pos', 'pnt', 'trg' ], function(index_0, pos_tag) {
                    if (pos_tag === 'pos' || trg_tel === 'tel') {
                        let tag_now = trg_tel + '_' + pos_tag

                        $.each(tel_data[trg_tel], function(index_1, data_now) {
                            tel_data[trg_tel][index_1][tag_now] = (
                                projXY(data_now[pos_tag])
                            )
                        })
                    }
                })
            })
        }

        function projXY(xy) {
            return com.proj([ xy[0], -xy[1] ])
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function proj_tel_pos() {
            // // fixme !!!!!!!!!!!!!!!!!!!!
            // // fixme !!!!!!!!!!!!!!!!!!!!
            // let tagAzZen = ''
            // // fixme !!!!!!!!!!!!!!!!!!!!
            // // fixme !!!!!!!!!!!!!!!!!!!!
            if (!is_def(com.inst_pos)) {
                com.inst_pos = {
                }
                com.inst_pos.g = com.zoom_callable.append('g')
                com.inst_pos.circXY = {
                }
                com.inst_pos.lbl_xY = {
                }
            }
            let tagTelLbl = 'telTitle'
            let tag_trg_lbl = 'trgTitle'

            let nLblTicks = 100
            let lblForceStrength = is_south ? -40 : -150
            let multiTickUpdate = false
            let col_lbls = [
                d3.rgb(cols_reds[3]).brighter(0.3),
                d3.rgb(cols_reds[3]).darker(0.3),
                d3.rgb(cols_reds[3]).darker(1),
            ]
            let colLineV = [
                d3.rgb(cols_reds[8]).brighter(0.5),
                '#383b42',
                d3.rgb(cols_yellows[2]).brighter(0.3),
                col_lbls[2],
                col_lbls[2],
            ]

            let font_size = 0.9 * len_sky_pos.r.tel
            function getFontSize() {
                return font_size * Math.pow(get_scale(), -0.3)
            }

            let scale_fact = 1 / Math.sqrt(get_scale())
            let scaled_r = {
                trg: scale_fact * len_sky_pos.r.trg,
                tel: scale_fact * len_sky_pos.r.tel,
                pnt: scale_fact * len_sky_pos.r.tel / 2,
            }

            // translate coordinates to the skymap
            set_proj_pos()

            // -------------------------------------------------------------------
            // label data
            // -------------------------------------------------------------------
            let trg_lbl_data = []
            let tel_lbl_data = []
            let force_nodes = []
            $.each([ 'trg', 'pnt', 'tel' ], function(trg_tel_index, trg_tel) {
                let tag_now = trg_tel + '_' + 'pos'
                let data_now = tel_data[trg_tel].filter(function(d) {
                    return filtFunc(trg_tel, 'pos', d)
                })

                $.each(data_now, function(indexNode, nodeNow) {
                    let is_hov = tel_data.tel_hover.id === nodeNow.id
                    // if(trg_tel_index<2)console.log('nodeNow',nodeNow);
                    if (!is_hov && trg_tel === 'tel') {
                        return
                    }

                    let id_now = trg_tel + nodeNow.id
                    let data_now = {
                        id: id_now,
                        type: trg_tel,
                        N: (
                            trg_tel === 'tel'
                                ? tel_info.get_title(nodeNow.id)
                                : nodeNow.N
                        ),
                        x: nodeNow[tag_now][0],
                        y: nodeNow[tag_now][1] - scaled_r[trg_tel],
                        col: nodeNow.col,
                    }

                    com.inst_pos.circXY[id_now] = {
                        x: data_now.x,
                        y: data_now.y,
                    }

                    if (trg_tel === 'tel') {
                        tel_lbl_data.push(data_now)
                    }
                    else {
                        trg_lbl_data.push(data_now)
                    }

                    force_nodes.push(data_now)
                })
            })

            // -------------------------------------------------------------------
            // combinations are: trg_pos (target), tel_pos (telescope), tel_pnt (pointing)
            // -------------------------------------------------------------------
            function filtFunc(trg_tel, pos_pnt, d) {
                if (d.id === tel_info.no_sub_arr_name() && trg_tel === 'trg') {
                    return false
                }
                else if (d.pnt_id === tel_info.no_sub_arr_name() && pos_pnt === 'pnt') {
                    return false
                }
                else {
                    return true
                }
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
                    {
                        pair: [ 0, 1 ],
                        telTag: 'tel',
                        tag: 'lineTelPnt',
                        dash: '5,5',
                    },
                    {
                        pair: [ 1, 2 ],
                        telTag: 'tel',
                        tag: 'line_trg_pnt',
                        dash: '10,10',
                    },
                    {
                        pair: [ 0, 0 ],
                        telTag: 'tel',
                        tag: 'lineTelLbl',
                        dash: '5,1',
                    },
                    {
                        pair: [ 0, 0 ],
                        telTag: 'pnt',
                        tag: 'linePntLbl',
                        dash: '5,1',
                    },
                    {
                        pair: [ 0, 0 ],
                        telTag: 'trg',
                        tag: 'lineTrgLbl',
                        dash: '5,1',
                    },
                ]
            }

            let pos_tags = [ 'pos', 'pnt', 'trg' ]
            $.each(com.inst_pos.lineTags, function(index, ele_now) {
                let trg_tel = ele_now.telTag
                let pairNow = ele_now.pair
                let tag_now = ele_now.tag
                let dash = ele_now.dash

                let data_now = tel_data[trg_tel].filter(function(d) {
                    return filtFuncLines(d)
                })
                let line = com.inst_pos.g
                    .selectAll('line.' + tag_now)
                    .data(data_now, function(d) {
                        return tag_now + d.id
                    })

                function filtFuncLines(d) {
                    let is_hov = tel_data.tel_hover.id === d.id
                    if (!is_hov) {
                        return false
                    }

                    if (d.pnt_id === tel_info.no_sub_arr_name() && index !== 2) {
                        return false
                    }
                    else if (d.trg_id === tel_info.no_sub_arr_name() && index === 1) {
                        return false
                    }
                    else {
                        return true
                    }
                }

                let n_ele_in = data_now.length
                line
                    .enter()
                    .append('line')
                    .attr('class', tag_now)
                    // .each(  function(d,i) { // xxxxxxxxxxxxx
                    //   if(index < 2) console.log(d,trg_tel,pairNow[1], pos_tags[pairNow[1]],  d[ trg_tel+ pos_tags[ pairNow[1] ]][0]);
                    // })
                    .attr('x1', function(d) {
                        return d[trg_tel + '_' + pos_tags[pairNow[0]]][0]
                    })
                    .attr('x2', function(d) {
                        return d[trg_tel + '_' + pos_tags[pairNow[1]]][0]
                    })
                    .attr('y1', function(d) {
                        return d[trg_tel + '_' + pos_tags[pairNow[0]]][1]
                    })
                    .attr('y2', function(d) {
                        return d[trg_tel + '_' + pos_tags[pairNow[1]]][1]
                    })
                    .style('stroke-opacity', 0)
                    .style('stroke-width', index < 2 ? 1 : 1)
                    .style('pointer-events', 'none')
                    .style('vector-effect', 'non-scaling-stroke')
                    .style('stroke-dasharray', dash)
                    .attr('stroke', colLineV[index])
                    .merge(line)
                    .transition('in_out1')
                    .duration(times.anim)
                // .attr("x1",  function(d,i) { return d[ trg_tel+ pos_tags[ pairNow[0] ]][0]; })
                // .attr("y1",  function(d,i) { return d[ trg_tel+ pos_tags[ pairNow[0] ]][1]; })
                    .attr('x2', function(d) {
                        return d[trg_tel + '_' + pos_tags[pairNow[1]]][0]
                    })
                    .attr('y2', function(d) {
                        return d[trg_tel + '_' + pos_tags[pairNow[1]]][1]
                    })
                    .style('stroke-opacity', function() {
                        if (index === 0) {
                            return 0.6
                        }
                        else if (index === 1) {
                            return 0.6
                        }
                        else {
                            return 0.65
                        }
                    })
                    .on('end', transEnd)

                function transEnd() {
                    if (index < 2) {
                        n_ele_in--
                        if (n_ele_in === 0) {
                            line
                                .transition('in_out2')
                                .duration(times.anim)
                                .attr('x1', function(d) {
                                    return d[trg_tel + '_' + pos_tags[pairNow[0]]][0]
                                })
                                .attr('y1', function(d) {
                                    return d[trg_tel + '_' + pos_tags[pairNow[0]]][1]
                                })
                        }
                    }
                }

                line
                    .exit()
                // .transition("in_out").duration(times.anim)
                // .attr("stroke-opacity", "0")
                    .remove()
            })

            // -------------------------------------------------------------------
            // circles for target, pointing and telescopes
            // -------------------------------------------------------------------
            $.each([ 'tel', 'pnt', 'trg' ], function(trg_tel_index, trg_tel) {
                let pos_pnt = 'pos'
                let tag_now = trg_tel + '_' + pos_pnt

                function sel_circ(tag_in) {
                    let data_now = tel_data[trg_tel].filter(function(d) {
                        return filtFunc(trg_tel, pos_pnt, d)
                    })
                    return com.inst_pos.g
                        .selectAll('circle.' + tag_now)
                        .data(data_now, function(d) {
                            return tag_now + d.id
                        })
                }
                let circ = sel_circ()

                // operate on new elements only
                let n_ele_in = -1
                circ
                    .enter()
                    .append('circle')
                    .attr('class', tag_now)
                    .style('vector-effect', 'non-scaling-stroke')
                    .attr('r', 0)
                    .style('stroke-width', (trg_tel === 'trg') ? 1.5 : 1)
                    .attr('transform', function(d) {
                        return 'translate(' + d[tag_now][0] + ',' + d[tag_now][1] + ')'
                    })
                    .attr('fill-opacity', trg_tel === 'trg' ? 0.25 : 0.55)
                    .on('click', function(d) {
                        if (trg_tel === 'tel') {
                            svg_sub_arr.zoom_to_target({
                                target: d.id,
                                scale: svg_sub_arr.com.z['1.0'],
                                duration_scale: 1,
                            })
                        }
                    })
                    .attr('pointer-events', trg_tel === 'tel' ? 'auto' : 'none')
                    .merge(circ)
                    .each(function() {
                        n_ele_in++
                    })
                    .transition('trans')
                    .duration(times.anim)
                    .attr('transform', function(d) {
                        return 'translate(' + d[tag_now][0] + ',' + d[tag_now][1] + ')'
                    })
                    .style('fill', function(d) {
                        if (trg_tel === 'tel') {
                            return d.col
                        }
                        else if (trg_tel === 'trg') {
                            return '#383b42'
                        }
                        else {
                            return 'transparent'
                        }
                    })
                    .style('stroke', function(d) {
                        return (
                            (trg_tel === 'tel') ? d3.rgb(d.col).darker(1) : '#383b42'
                        )
                    })
                    .on('end', function(_, i) {
                        if (i === n_ele_in) {
                            updt_circ()
                        }
                    })

                circ
                    .exit()
                    .transition('in_out')
                    .duration(times.anim / 2)
                    .attr('r', 0)
                    .remove()

                function updt_circ() {
                    let circ = sel_circ()
                    // make sure the projected positions are calculated
                    // (may not be the case for reconnected sessions...)
                    circ.each(function(d, i) {
                        if (!is_def(d[tag_now])) {
                            console.log.error('test set_proj_pos()...', i, d)
                        }
                        if (!is_def(d[tag_now])) {
                            set_proj_pos()
                        }
                        if (!is_def(d[tag_now])) {
                            console.log.error(
                                'something is wrong with set_proj_pos()...', d
                            )
                        }
                    })

                    circ
                        .transition('zoom')
                        .duration(times.anim)
                        .attr('transform', function(d) {
                            return (
                                'translate(' + d[tag_now][0] + ',' + d[tag_now][1] + ')'
                            )
                        })
                        .attr('r', scaled_r[trg_tel])
                }
                zoom_funcs.zoom_end['updt_zoomed_size' + tag_now] = updt_circ
            })

            // -------------------------------------------------------------------
            // labels
            // -------------------------------------------------------------------
            let trg_lbl = com.inst_pos.g
                .selectAll('text.' + tag_trg_lbl)
                .data(trg_lbl_data, function(d) {
                    return d.id
                })

            trg_lbl
                .enter()
                .append('text')
                .attr('class', tag_trg_lbl)
                .style('fill-opacity', 0)
                .style('stroke-opacity', 0)
                .text(function(d) {
                    return d.N
                })
                .style('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .style('stroke-width', 0.5)
                .style('stroke', col_lbls[2])
                .style('fill', function(d) {
                    return col_lbls[d.type === 'trg' ? 0 : 1]
                })
                .style('pointer-events', 'none')
                .style('vector-effect', 'non-scaling-stroke')
                .style('font-size', getFontSize() + 'px')
                .attr('dy', getFontSize() / 3 + 'px')
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')'
                })
                .merge(trg_lbl)
                .transition('in_out')
                .duration(times.anim)
                .style('font-size', getFontSize() + 'px')
                .attr('dy', getFontSize() / 3 + 'px')
                .style('fill-opacity', 0.6)
                .style('stroke-opacity', 1)

            trg_lbl
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('fill-opacity', 0)
                .style('stroke-opacity', 0)
                .remove()

            let telLbl = com.inst_pos.g
                .selectAll('text.' + tagTelLbl)
                .data(tel_lbl_data, function(d) {
                    return d.id
                })

            telLbl
                .enter()
                .append('text')
                .attr('class', tagTelLbl)
                .style('fill-opacity', 0)
                .style('stroke-opacity', 0)
                .text(function(d) {
                    return d.N
                })
                .style('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .style('stroke-width', 0.5)
                .style('stroke', '#383b42')
                .style('fill', '#383b42')
                .style('pointer-events', 'none')
                .style('vector-effect', 'non-scaling-stroke')
                .style('font-size', getFontSize() + 'px')
                .attr('dy', getFontSize() / 3 + 'px')
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')'
                })
                .merge(telLbl)
                .transition('in_out')
                .duration(times.anim)
                .style('font-size', getFontSize() + 'px')
                .attr('dy', getFontSize() / 3 + 'px')
                .style('fill-opacity', 0.8)
                .style('stroke-opacity', 0.8)

            telLbl
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('fill-opacity', 0)
                .style('stroke-opacity', 0)
                .remove()

            let prevTickAnim
            let minAnimWait
            if (is_def(com.inst_pos[tagTelLbl + 'force'])) {
                com.inst_pos[tagTelLbl + 'force']
                    .alpha(1)
                    .nodes(force_nodes)
                    .restart()
            }
            else {
                prevTickAnim = Date.now()
                minAnimWait = times.anim * 2 // minAnimWait must be >= times.anim !!!

                // update the positions
                com.nodeUpdateTickPos = function(animFrac) {
                    com.inst_pos.g
                        .selectAll('text')
                        .each(function(d) {
                            com.inst_pos.lbl_xY[d.id] = {
                                x: d.x,
                                y: d.y,
                            }
                        })
                        .transition('updtTickepos_dif')
                        .duration(times.anim * animFrac)
                        .attr('transform', function(d) {
                            return 'translate(' + d.x + ',' + d.y + ')'
                        })

                    $.each(com.inst_pos.lineTags, function(index, ele_now) {
                        if (index > 1) {
                            let trg_tel = ele_now.telTag
                            // let pairNow = ele_now.pair
                            let tag_now = ele_now.tag

                            com.inst_pos.g
                                .selectAll('line.' + tag_now)
                                .transition('in_out')
                                .duration(times.anim * animFrac)
                                .attr('x1', function(d) {
                                    return com.inst_pos.lbl_xY[trg_tel + d.id].x
                                })
                                .attr('y1', function(d) {
                                    return com.inst_pos.lbl_xY[trg_tel + d.id].y
                                })
                                .attr('x2', function(d) {
                                    return d[trg_tel + '_' + 'pos'][0]
                                })
                                .attr('y2', function(d) {
                                    return d[trg_tel + '_' + 'pos'][1]
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
                    .nodes(force_nodes)
                    .on('tick', nodeUpdateTickVal)
                    .on('end', com.nodeUpdateTickPos(1))

                zoom_funcs.zoom_end['updt_zoomed_size' + tagTelLbl] = updtTxt
                // zoom_funcs.zoom_end["updt_zoomed_size_"+tagTelLbl] = function(){}
            }

            function nodeUpdateTickVal() {
                let alpha = com.inst_pos[tagTelLbl + 'force'].alpha()
                let tickFrac = alpha // set to some number between 0 and alpha
                // console.log(tickFrac);

                // push nodes toward their designated focus
                com.inst_pos.g.selectAll('text').each(function(d) {
                    if (!is_def(d.x)) {
                        return
                    }

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

            function getForchCharge() {
                return d3
                    .forceManyBody()
                    .distanceMin(len_sky_pos.r.tel * 1 / Math.sqrt(get_scale()))
                    .distanceMax(len_sky_pos.r.tel * 5 / Math.sqrt(get_scale()))
                    .strength(lblForceStrength)
            }

            function updtTxt() {
                com.inst_pos[tagTelLbl + 'force']
                    .force('charge', getForchCharge())
                    .alpha(1)
                    .restart()
                    .on('end', com.nodeUpdateTickPos(1))

                // update the title size on zoom
                com.inst_pos.g
                    .selectAll('text')
                    .transition('zoom')
                    .duration(times.anim)
                    .style('font-size', getFontSize() + 'px')
                    .attr('dy', getFontSize() / 3 + 'px')
            }
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        run_loop.init({
            tag: 'set_focused',
            func: setFocusedOnce,
            n_keep: 1,
        })

        function set_focused(data_in) {
            run_loop.push({
                tag: 'set_focused',
                data: data_in,
            })
        }
        this.set_focused = set_focused

        function setFocusedOnce() {
            // create delay if currently in data update or a previous call of set_focused
            if (
                !locker.are_free([ 'set_state', 'zoom', 'zoom_to_target', 'data_change' ])
            ) {
                setTimeout(function() {
                    set_focused(opt_in)
                }, times.anim)
                return
            }
            locker.add({
                id: 'set_focused',
                override: true,
            })

            let tagTelLbl = 'telTitle'
            let tag_trg_lbl = 'trgTitle'
            let fadeOpac = 0.05
            let animTime = times.anim / 2

            function is_focused(id_in) {
                if (!is_def(tel_data.id_focuses[id_in])) {
                    return true
                }
                return tel_data.id_focuses[id_in]
            }

            $.each([ 'tel', 'pnt', 'trg' ], function(trg_tel_index, trg_tel) {
                let pos_pnt = 'pos'
                let tag_now = trg_tel + '_' + pos_pnt

                com.inst_pos.g
                    .selectAll('circle.' + tag_now)
                    .transition('fadeInOut')
                    .duration(animTime)
                    .style('opacity', function(d) {
                        return is_focused(trg_tel + d.id) ? 1 : fadeOpac
                    })
            })

            $.each(com.inst_pos.lineTags, function(index, ele_now) {
                let trg_tel = ele_now.telTag
                let tag_now = ele_now.tag

                com.inst_pos.g
                    .selectAll('line.' + tag_now)
                    .transition('in_out')
                    .duration(animTime)
                    .style('opacity', function(d) {
                        return is_focused(trg_tel + d.id) ? 1 : fadeOpac
                    })
            })

            com.inst_pos.g
                .selectAll('text.' + tagTelLbl)
                .transition('fadeInOut')
                .duration(animTime)
                .style('opacity', function(d) {
                    return is_focused(d.id) ? 1 : fadeOpac
                })

            com.inst_pos.g
                .selectAll('text.' + tag_trg_lbl)
                .transition('fadeInOut')
                .duration(animTime)
                .style('opacity', function(d) {
                    return is_focused(d.id) ? 1 : fadeOpac
                })

            locker.remove({
                id: 'set_focused',
                delay: times.anim,
            })
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_grat() {
            com.isPolar = true
            com.followGratLbls = false

            com.gratScale = 1.8 * svg_dims.w[1] / tau
            com.gratStep = [ 10, 10 ]
            com.maxLat = 80
            com.maxLng = 180
            com.gratExt = [ [ -com.maxLng, -1 * com.maxLat - 1e-6 ], [ com.maxLng, 0 ] ]

            com.gratPrev = getGradPrev()

            com.grat = d3
                .geoGraticule()
                .extent(com.gratExt)
                .step(com.gratStep)

            com.gGrat = com.zoom_callable.append('g')
            // com.gGrat.attr("transform", function(d) { return "translate("+svg_dims.w[1]/2+","+svg_dims.h[1]/2+")"; });
        }

        function getGradPrev() {
            let scale0 = get_scale() - len_sky_pos.z['0.0']
            let dScal = len_sky_pos.z['1.0'] - len_sky_pos.z['0.0']
            if (scale0 < dScal * 0.2) {
                return 1
            }
            else {
                return 2
            }
            // if     (scale0 < dScal * 0.1) return 1;
            // else if(scale0 < dScal * 0.3) return 2;
            // else                          return 3;
        }

        function add_grat_lines() {
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
                .transition('in_out')
                .duration(times.anim / 2)
                .attr('stroke-width', 0)
                .transition('in_out')
                .duration(0)
                .attr('d', com.path)
                .transition('in_out')
                .duration(times.anim / 2)
                .attr('stroke-width', strkW)

            com.grdL
                .exit()
                .transition('in_out')
                .duration(times.anim / 2)
                .attr('stroke-width', 0)
                .remove()

            // com.gGrat.selectAll("path."+"grat").filter(function(d,i){ return i%2==1;})
            //   .transition("in_out").duration(times.anim/2)
            //   .attr("stroke-width", 0)
            //   .remove()

            // just in case, though not needed here...
            com.gratPrev = getGradPrev()
        }

        function set_proj_path() {
            if (com.isPolar) {
                com.proj = d3
                    .geoAzimuthalEquidistant()
                    .scale(com.gratScale)
                    .precision(0.1)
                    .clipAngle(90 + 1e-3)
                    .center([ 0, 0 ])
                    .translate([ 0, 0 ])

                com.proj.rotate([ 0, 90, 0 ])
            }
            else {
                com.proj = d3
                    .geoMercator()
                    .scale(com.gratScale / 2)
                    .precision(0.1)
                    .translate([ 0, -1 * svg_dims.h[1] * sgv_tag.sky_pos.whRatio / 4 ])
            }

            com.path = d3.geoPath().projection(com.proj)
        }

        function grat_lbls(trans, scaleFactor) {
            // return
            let nAzm = 14
            let nZen = 3
            let lblPerc = 1

            let scale = get_scale()
            let interStep = scaleFactor < 2 ? 5 : 3
            let col_lbls = [
                d3.rgb(cols_purples[4]).darker(0.3),
                d3.rgb(cols_purples[2]).darker(0.3),
            ]
            let gratFont = len_sky_pos.f['0.0']

            let center = [ 0, 0 ]
            let trnsScaled = [
                (center[0] - trans[0]) / scale,
                (center[1] - trans[1]) / scale,
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
            }
            else {
                if (Math.abs(midBin1) > com.maxLat - 0.5 * step[1]) {
                    midBin1 = (midBin1 > 0 ? 1 : -1) * (com.maxLat - 0.5 * step[1])
                }
                if (Math.abs(midBin1) < 0.5 * step[1]) {
                    midBin1 = (midBin1 > 0 ? 1 : -1) * (0.5 * step[1])
                }
            }
            if (midBin1 > 0) {
                midBin1 = Math.min(midBin1, maxExtn1 - step[1] / 2)
            }
            else {
                midBin1 = Math.max(midBin1, -maxExtn1 + step[1] / 2)
            }

            let labelV = []
            let allAzm = []
            let pos0, pos1, txt1, text, txtType

            // azimuth
            for (let nAzmNow = -nAzm; nAzmNow < nAzm + 1; nAzmNow++) {
                pos0 = [ midBin0 + nAzmNow * step[0], midBin1 + midBin2 ]
                if (pos0[0] > com.maxLng) {
                    pos0[0] -= 360
                }
                else if (pos0[0] < -com.maxLng) {
                    pos0[0] += 360
                }

                pos1 = com.proj(pos0)
                txt1 = pos0[0]

                if (is_hms) {
                    if (is_ra_dec) {
                        txtType = 'hms'
                        text = deg_hms(azim_ra(txt1))
                    }
                    else {
                        txtType = 'dms'
                        text = deg_dms(txt1)
                    }
                }
                else {
                    if (is_ra_dec) {
                        txtType = 'deg'
                        text = azim_ra(txt1)
                    }
                    else {
                        txtType = 'deg'
                        text = txt1
                    }
                }

                // if     (is_ra_dec)  { txtType = "hms"; text = deg_hms(txt1); }
                // else if(is_hms)   { txtType = "dms"; text = deg_dms(txt1); }
                // else                     { txtType = "deg"; text = txt1;           }

                // ignore the middle one (ovelaps with zenith)
                if (nAzmNow === 0) {
                    continue
                }
                // check for duplicates
                if (allAzm.indexOf(text) > -1) {
                    continue
                }
                else {
                    allAzm.push(text)
                }

                if (nAzmNow !== interStep && nAzmNow % 2 === 0) {
                    // console.log(nAzmNow,[pos1,text,pos0[1],txtType])
                    labelV.push({
                        id: 'lng' + text,
                        type: 0,
                        V: [ pos1, text, pos0[1], txtType ],
                    })
                    // console.log('---',pos0,pos1,midBin1,text);
                }
            }

            // zenith
            for (let nZenNow = -nZen; nZenNow < nZen + 1; nZenNow++) {
                pos0 = [ midBin0, midBin1 + nZenNow * step[1] ]
                // let pos0 = [ midBin0 + interStep * step[0] , midBin1 + nZenNow * step[1] ]
                pos1 = com.proj(pos0)
                txt1 = -1 * pos0[1]

                if (is_hms) {
                    txtType = 'hms'
                    text = deg_dms(txt1)
                }
                else {
                    txtType = 'deg'
                    text = txt1
                }

                // if     (is_ra_dec)  { txtType = "dms"; text = deg_dms(txt1); }
                // else if(is_hms)   { txtType = "dms"; text = deg_dms(txt1); }
                // else                     { txtType = "deg"; text = txt1;           }

                // console.log('-----',nZenNow,[pos1,text,pos0[1],txtType])
                if (txt1 > 0 && txt1 < maxExtn1) {
                    // console.log(nZenNow,[pos1,text,pos0[1],txtType])
                    labelV.push({
                        id: 'lat' + text,
                        type: 1,
                        V: [ pos1, text, pos0[1], txtType ],
                    })
                }
            }

            function formInpt(input, prec) {
                return d3.format(' >' + (prec + 3) + ',.' + prec + 'f')(input)
            }

            function parse_pos_txt(dIn, txtType, isInv) {
                if (txtType === 'dms' || txtType === 'hms') {
                    if (isInv) {
                        let splitDeg = dIn.split(unit_deg)
                        let splitMin = splitDeg[1].split(unit_arcmin)
                        let deg = parseFloat(splitDeg[0])
                        let min = parseFloat(splitMin[0])
                        let sec = parseFloat(splitMin[1].replace(unit_arcsec, ''))
                        // console.log([parseFloat(deg),parseFloat(min),parseFloat(sec)])
                        return [ deg, min, sec ]
                    }
                    else {
                        return (
                            formInpt(dIn[0], 0)
              + unit_deg
              + ' '
              + formInpt(dIn[1], 0)
              + unit_arcmin
              + ' '
              + formInpt(dIn[2], 1)
              + unit_arcsec
                        )
                    }
                }
                else if (txtType === 'deg') {
                    if (isInv) {
                        return parseFloat(dIn.split(unit_deg)[0])
                    }
                    else {
                        return formInpt(dIn, lblPerc) + unit_deg
                    }
                }
            }

            let opac = gratFontOpac()

            com.lbl = com.gGrat
                .selectAll('text.' + 'grat')
                .data(labelV, function(d) {
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
                .style('font-size', function(d) {
                    return gratFont / font_scale(d.V) + 'px'
                })
                .style('fill', function(d) {
                    return col_lbls[d.type === 0 ? 0 : 1]
                })
                .style('stroke', function(d) {
                    return d3.rgb(col_lbls[d.type === 0 ? 0 : 1]).darker(0.3)
                })
                .attr('transform', function(d) {
                    return lblTrans(d.V)
                })
                .merge(com.lbl)
                .text(function(d) {
                    d.txt = parse_pos_txt(d.V[1], d.V[3])
                    return d.txt
                }) // .toFixed(lblPerc)
                .transition('update')
                .duration(times.anim)
                .style('fill-opacity', opac)
                .style('stroke-opacity', Math.min(0.9, opac * 2))
                .attr('transform', function(d) {
                    return lblTrans(d.V)
                })
                .style('font-size', function(d) {
                    d.txt_size = gratFont / font_scale(d.V)
                    return d.txt_size + 'px'
                })
                .attr('dy', function(d) {
                    return d.txt_size / 3 + 'px'
                })

            com.lbl
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('fill-opacity', 0)
                .style('stroke-opacity', 0)
                .remove()

            function lblTrans(d) {
                return 'translate(' + d[0][0] + ',' + d[0][1] + ')'
                // let xy = [d[0][0]-center[0] , d[0][1]-center[1]] //[d[0][0]-svg_dims.w[1]/2 , d[0][1]-svg_dims.h[1]/2]
                // let angle = (Math.atan2(xy[0],-xy[1]) * 360/tau);
                // if(xy[1] > 0)                angle += 180;
                // if(!com.isPolar) angle = 0;
                // let angle = 0;
                // return "translate("+d[0][0]+","+d[0][1]+")rotate("+angle+")";
            }

            function font_scale(d) {
                let scaleRatio = com.followGratLbls ? Math.abs(d[2]) / maxExtn1 : 0.3
                let scale_by_rad = 1
                if (com.isPolar) {
                    if (scaleRatio > 0.7) {
                        scale_by_rad = 2.2
                    }
                    else if (scaleRatio > 0.5) {
                        scale_by_rad = 1.7
                    }
                    else if (scaleRatio > 0.3) {
                        scale_by_rad = 1.5
                    }
                }
                else {
                    scale_by_rad = 2
                }

                let scale = get_scale()
                let zoom_frac = Math.max(
                    0.25,
                    (1 - Math.pow(
                        (scale - len_sky_pos.z['0.0']) / len_sky_pos.z['1.0'], 0.8)
                    )
                )
                scale_by_rad /= zoom_frac

                let font_scl = scaleFactor > 1 ? scaleFactor * 1.8 : 1.2
                return font_scl * scale_by_rad
            }
        }

        function gratFontOpac() {
            let scale = get_scale()
            let zoom_frac = Math.max(
                0.25,
                1 - Math.pow((scale - len_sky_pos.z['0.0']) / len_sky_pos.z['1.0'], 0.2)
            )
            let opac = 0.3 * zoom_frac
            return opac
        }

        function updateGratScale() {
            let scale = get_scale()
            let scaleFactor = Math.ceil(scale / len_sky_pos.z.gratRatio)

            // if(Math.abs( com.grat.step()[0] * scaleFactor - com.gratStep[0] )  > 0.01) {
            if (com.gratPrev !== getGradPrev()) {
                com.gratPrev = getGradPrev()

                com.grat = d3
                    .geoGraticule()
                    .extent(com.gratExt)
                    .step([
                        com.gratStep[0] / com.gratPrev,
                        com.gratStep[1] / com.gratPrev,
                    ])

                add_grat_lines()
            }

            if (com.followGratLbls) {
                grat_lbls(get_trans(), scaleFactor)
            }
            else {
                let opac = gratFontOpac()

                com.lbl = com.gGrat
                    .selectAll('text.' + 'grat')
                    .transition('update')
                    .duration(times.anim)
                    .style('fill-opacity', opac)
                    .style('stroke-opacity', Math.min(0.9, opac * 2))
            }
        }
        zoom_funcs.zoom_end.updateGratScale = updateGratScale
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function SvgSubArr() {
        let this_svg_sub_arr = this

        let com = {
        }
        this.com = com

        // initialize a couple of functions to be overriden below
        let get_scale = function() {
            return com.z['0.0']
        }
        let get_trans = function() {
            return [ 0, 0 ]
        }
        this.get_scale = get_scale
        this.get_trans = get_trans

        com.z = {
        }
        com.z['0.0'] = 1
        if (is_south) {
            com.z['0.1'] = 1.1
            com.z['0.2'] = 1.5
            com.z['1.0'] = 2
            com.z['1.1'] = 4
            com.z['2.0'] = 10
            com.z['2.1'] = com.z['2.0'] + 0.7
            com.z['2.2'] = com.z['2.0'] + 10
        }
        else {
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
        let zoom_to_target = function(opt_in) {
            if (!locker.is_free('in_init')) {
                setTimeout(function() {
                    zoom_to_target(opt_in)
                }, times.wait_loop)
            }
        }
        this.zoom_to_target = zoom_to_target

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_data(has_join_data) {
            // console.log('init_data')

            // -------------------------------------------------------------------
            // background container & zoom behaviour
            // -------------------------------------------------------------------
            if (!is_def(com.zoom_callable)) {
                // -------------------------------------------------------------------
                // attach the div which will host the main svg element
                // -------------------------------------------------------------------
                let svg_div_id = sgv_tag.sub_arr.id + 'Svg'
                let svg_div = sgv_tag.sub_arr.widget.get_ele(svg_div_id)

                if (!is_def(svg_div)) {
                    let parent = sgv_tag.sub_arr.widget.get_ele(sgv_tag.sub_arr.id)
                    svg_div = document.createElement('div')
                    svg_div.id = svg_div_id

                    dom_add(parent, svg_div)

                    run_when_ready({
                        pass: function() {
                            return is_def(sgv_tag.sub_arr.widget.get_ele(svg_div_id))
                        },
                        execute: function() {
                            init_data(has_join_data)
                        },
                    })

                    return
                }
                sock.emit_mouse_move({
                    eleIn: svg_div,
                    data: {
                        widget_id: widget_id,
                    },
                })

                // -------------------------------------------------------------------
                // zoom start/on/end functions, attachd to com.svg_zoom
                // -------------------------------------------------------------------
                let scale_start = 0
                com.svg_zoom_start = function() {
                    scale_start = d3.event.transform.k
                    locker.add({
                        id: 'zoom',
                        override: true,
                    })
                }

                com.svg_zoom_during = function() {
                    com.zoom_callable.attr('transform', d3.event.transform)
                    com.svg_zoom_update_state()
                }

                com.svg_zoom_update_state = function() {
                    let scale = get_scale()

                    let changeState = (
                        (com.z.prev < com.z['1.0'] && scale >= com.z['1.0'])
                        || (com.z.prev >= com.z['1.0'] && scale < com.z['1.0'])
                        || (com.z.prev < com.z['1.1'] && scale >= com.z['1.1'])
                        || (com.z.prev >= com.z['1.1'] && scale < com.z['1.1'])
                        || (com.z.prev < com.z['2.0'] && scale >= com.z['2.0'])
                        || (com.z.prev >= com.z['2.0'] && scale < com.z['2.0'])
                    )

                    if (changeState) {
                        // console.log('svg_zoom_update_state',zoom_state,scale)

                        com.z.prev = scale
                        if (scale < com.z['1.0']) {
                            zoom_state = 0
                        }
                        else if (scale < com.z['2.0']) {
                            zoom_state = 1
                        }
                        else {
                            zoom_state = 2
                        }

                        set_state({
                            type: 'zoom',
                            data: null,
                        })
                        hex00()
                    }
                }

                com.svg_zoom_end = function() {
                    locker.remove('zoom')
                    com.svg_zoom_update_state()

                    // if on minimal zoom, center
                    if (Math.abs(d3.event.transform.k - scale_start) > 0.00001) {
                        if (Math.abs(d3.event.transform.k - com.z['0.0']) < 0.00001) {
                            if (locker.are_free([ 'auto_zoom_target' ])) {
                                zoom_to_target({
                                    target: 'init',
                                    scale: d3.event.transform.k,
                                    duration_scale: 0.5,
                                })
                            }

                            // syncroniz changes with other panels
                            // -------------------------------------------------------------------
                            send_sync_state_to_server({
                                type: 'sync_tel_focus',
                                sync_time: Date.now(),
                                zoom_state: 0,
                                target: 'init',
                            })
                        }
                    }
                }

                com.svg_zoom = d3.zoom().scaleExtent([ com.z['0.0'], com.z['2.2'] ])
                com.svg_zoom.on('start', com.svg_zoom_start)
                com.svg_zoom.on('zoom', com.svg_zoom_during)
                com.svg_zoom.on('end', com.svg_zoom_end)

                // -------------------------------------------------------------------
                // programatic zoom to some target and scale - only use the last of any set of ovelapping
                // zoom requests, where zooming is only possible after svg_dims.zoomLock becomes free
                // -------------------------------------------------------------------
                run_loop.init({
                    tag: 'zoom_to_target_sub_arr',
                    func: do_zoom_to_target,
                    n_keep: -1,
                })

                // the actual function to be called when a zoom needs to be put in the queue
                zoom_to_target = function(opt_in) {
                    if (!locker.is_free('in_init')) {
                        setTimeout(function() {
                            zoom_to_target(opt_in)
                        }, times.wait_loop)
                        return
                    }
                    if (!locker.are_free([ 'auto_zoom_target' ])) {
                        return
                    }

                    let target_name = opt_in.target
                    let target_scale = opt_in.scale
                    let duration_scale = opt_in.duration_scale

                    if (target_scale < com.z['0.0']) {
                        target_scale = get_scale()
                    }

                    let trans_to // = (com.tel_xy[target_name] == undefined) ? [svg_dims.w[1]/2, svg_dims.h[1]/2] : com.tel_xy[target_name];
                    if (target_name === 'init') {
                        trans_to = [ svg_dims.w[1] / 2, svg_dims.h[1] / 2 ]
                    }
                    else {
                        if (target_name === '' || !is_def(com.tel_xy[target_name])) {
                            let scale = get_scale()
                            let trans = get_trans()

                            let x = (svg_dims.w[1] / 2 - trans[0]) / scale
                            let y = (svg_dims.h[1] / 2 - trans[1]) / scale
                            target_name = tel_data.tel_hover.id
                            let min_diff = -1
                            $.each(com.tel_xy, function(id_now, data_now) {
                                if (data_now.isTel) {
                                    let diff_now
                    = Math.pow(x - data_now.x, 2) + Math.pow(y - data_now.y, 2)
                                    if (diff_now < min_diff || min_diff < 0) {
                                        min_diff = diff_now
                                        target_name = id_now
                                    }
                                }
                            })
                        }

                        tel_data.tel_hover.id = target_name
                        tel_data.tel_hover.sub_arr = tel_data.tel_sub_arr_id[target_name]
                        trans_to = [
                            com.tel_xy[target_name].x,
                            com.tel_xy[target_name].y,
                        ]
                    }

                    let func_start = function() {
                        locker.add({
                            id: 'auto_zoom_target',
                            override: true,
                        })
                        // if(target_name != "") zoom_target = target_name;
                    }
                    let func_during = function() {}
                    let func_end = function() {
                        locker.remove('auto_zoom_target')

                        let is_done = true
                        if (Math.abs(get_scale() - com.z['0.0']) < 0.00001) {
                            let trans = get_trans()
                            if (Math.abs(trans[0]) > 0.1 && Math.abs(trans[1]) > 0.1) {
                                is_done = false
                                zoom_to_target({
                                    target: 'init',
                                    scale: com.z['0.0'],
                                    duration_scale: 1,
                                })
                            }
                        }
                        if (duration_scale > 0 && is_done) {
                            set_state({
                                type: 'zoom',
                                data: null,
                            })
                        }
                    }

                    let data_out = {
                        target_scale: target_scale,
                        duration_scale: duration_scale,
                        base_time: 300,
                        trans_to: trans_to,
                        wh: [ svg_dims.w[1], svg_dims.h[1] ],
                        cent: null,
                        func_start: func_start,
                        func_end: func_end,
                        func_during: func_during,
                        svg: com.svg,
                        svg_zoom: com.svg_zoom,
                        zoom_callable: com.zoom_callable,
                        svg_zoom_node: com.svg_zoom_node,
                    }

                    if (duration_scale < 0) {
                        data_out.duration_scale = 0
                        do_zoom_to_target(data_out)
                    }
                    else {
                        run_loop.push({
                            tag: 'zoom_to_target_sub_arr',
                            data: data_out,
                        })
                    }
                }
                this_svg_sub_arr.zoom_to_target = zoom_to_target

                // -------------------------------------------------------------------
                // create the main svg element
                // -------------------------------------------------------------------
                com.svg = d3
                    .select(svg_div)
                // .classed("svgInGridStack_outer", true)
                    .style('background', '#383B42')
                    .append('svg')
                    .attr('preserveAspectRatio', 'xMidYMid meet')
                    .attr('viewBox', '0 0 ' + svg_dims.w[1] + ' ' + svg_dims.h[1])
                    .style('position', 'relative')
                    .style('width', '100%')
                    .style('height', '100%')
                    .style('top', '0px')
                    .style('left', '0px')
                // .attr("viewBox", "0 0 "+svg_dims.w[1]+" "+svg_dims.h[1] * whRatio)
                // .classed("svgInGridStack_inner", true)
                    .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
                    .call(com.svg_zoom)
                    .on('dblclick.zoom', null)
                    .on('wheel', function() {
                        d3.event.preventDefault()
                    })

                com.zoom_callable = com.svg.append('g')
                com.svg_overlay = com.svg.append('g')

                // // -------------------------------------------------------------------
                // // overlying rect, just to add a frame to the entire svg
                // // -------------------------------------------------------------------
                // com.svg.append("g").selectAll("rect").data([0])
                //   .enter()
                //   .append("rect")
                //     .attr("x", 0).attr("y", 0)
                //     .attr("width", svg_dims.w[1])
                //     .attr("height", svg_dims.h[1])
                //     .attr("stroke","#383B42") //.attr("stroke","red")
                //     .attr("stroke-width","3")
                //     .attr("fill", "transparent")
                //     .style("pointer-events", "none")

                // save the svg node to use for d3.zoomTransform() later
                com.svg_zoom_node = com.svg.nodes()[0]

                get_scale = function() {
                    return d3.zoomTransform(com.svg_zoom_node).k
                }
                get_trans = function() {
                    return [
                        d3.zoomTransform(com.svg_zoom_node).x,
                        d3.zoomTransform(com.svg_zoom_node).y,
                    ]
                }
                this_svg_sub_arr.get_scale = get_scale
                this_svg_sub_arr.get_trans = get_trans

                // add one circle as background
                // -------------------------------------------------------------------
                com.zoom_callable
                    .append('g')
                    .selectAll('circle')
                    .data([ 0 ])
                    .enter()
                    .append('circle')
                    .attr('r', 0)
                    .attr('cx', svg_dims.w[1] / 2)
                    .attr('cy', svg_dims.h[1] / 2)
                    .attr('fill', '#F2F2F2')
                    .transition('in_out')
                    .duration(times.anim / 3)
                    .attr('r', svg_dims.w[1] / 2.1)

                // initialize the hexagonal background grid
                hex00()

                //
                set_over_text()
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            if (has_join_data) {
                set_hierarchy(true)
                init_state_01(true)
            }

            // // for testing...
            // setTimeout(function() {
            //   // zoom_to_target({ target:'M_1', scale:com.z["2.0"], duration_scale:1.5 } )
            //   // zoom_to_target({ target:'init', scale:com.z["0.0"], duration_scale:1.5 } )
            // }, 2000);

            locker.remove('in_init_sub_arr')
        }
        this_svg_sub_arr.init_data = init_data

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_over_text() {
            if (!is_def(com.over_rect)) {
                com.over_rect = {
                }
                com.over_rect.w = svg_dims.w[1]
                com.over_rect.h = svg_dims.h[1] * 0.06
                com.over_rect.x = 0
                com.over_rect.y = svg_dims.h[1] - com.over_rect.h

                com.over_rect.data = [
                    {
                        id: 'tel_id',
                        txt: '',
                        size: 15,
                        x: 15,
                        y: com.over_rect.h / 2,
                    },
                    {
                        id: 'coordinates',
                        txt: '',
                        size: 15,
                        x: 60,
                        y: com.over_rect.h / 2,
                    },
                ]

                com.svg_overlay
                    .style('pointer-events', 'none')
                    .attr('transform', (
                        'translate(' + com.over_rect.x + ',' + com.over_rect.y + ')'
                    ))

                let defs = com.svg_overlay.append('defs')

                let grad = defs
                    .append('linearGradient')
                    .attr('id', 'svg_overlay_grad')
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

                com.svg_overlay
                    .append('g')
                    .selectAll('rect')
                    .data([ 0 ])
                    .enter()
                    .append('rect')
                    .style('pointer-events', 'none')
                    .attr('width', com.over_rect.w)
                    .attr('height', com.over_rect.h)
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('fill', 'url(#svg_overlay_grad)')
                    // .attr("fill","#F2F2F2")
                    .style('opacity', 0.7)
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let tag_now = 'coord'
            let txt = com.svg_overlay
                .selectAll('text.' + tag_now)
                .data(com.over_rect.data, function(d) {
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
                .style('stroke', '#F2F2F2')
                .style('fill', '#F2F2F2')
                .style('pointer-events', 'none')
                .style('vector-effect', 'non-scaling-stroke')
                .style('font-size', function(d) {
                    return d.size + 'px'
                })
                .attr('dy', function(d) {
                    return d.size / 3 + 'px'
                })
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')'
                })
                .merge(txt)
                .transition('in_out')
                .duration(times.anim)
                .text(function(d) {
                    return d.txt
                })
                .style('fill-opacity', 0.9)
                .style('stroke-opacity', 0.7)

            txt
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .style('fill-opacity', 0)
                .style('stroke-opacity', 0)
                .remove()
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function update_over_text(txtV) {
            com.over_rect.data[0].txt = txtV[0]
            com.over_rect.data[1].txt = txtV[1]

            set_over_text()
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function update_data(data_in) {
            let isNew_sub_arr = is_def(data_in.sub_arr)
            set_hierarchy(isNew_sub_arr)

            init_state_01(isNew_sub_arr)

            // if(isNew_sub_arr && get_scale() > com.z["0.1"]) {
            //   zoom_to_target({ target:tel_data.tel_hover.id, scale:get_scale(), duration_scale:2 });
            // }
        }
        this_svg_sub_arr.update_data = update_data

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_hierarchy(is_init) {
            // create delay if currently in data update or a previous call of set_hierarchy
            if (!(locker.is_free('set_state') && locker.is_free('set_hierarchy'))) {
                setTimeout(function() {
                    set_hierarchy(is_init)
                }, times.anim)
                return
            }

            locker.add('set_hierarchy')

            let tag_now

            if (!is_init) {
                tag_now = 'tel_circ'
                com.hirch_g
                    .selectAll('circle.' + tag_now)
                    .transition('updt')
                    .duration(times.anim)
                    .style('stroke', function(d) {
                        return hirch_style_stroke(d)
                    })
                    .style('fill', function(d) {
                        return hirch_style_fill(d)
                    })

                locker.remove({
                    id: 'set_hierarchy',
                    delay: times.anim,
                })

                return
            }

            let shift_xy = [
                (svg_dims.w[1] - pack_wh[0]) / 2,
                (svg_dims.h[1] - pack_wh[1]) / 2,
            ]

            if (!is_def(com.hirch_g)) {
                com.hirch_g = com.zoom_callable.append('g')
                com.hirch_g.attr(
                    'transform',
                    'translate(' + shift_xy[0] + ',' + shift_xy[1] + ')'
                )
            }

            com.tel_xy = {
            }

            let sub_arr = {
                id: tel_data.sub_arr.id,
                children: [],
            }
            $.each(tel_data.sub_arr.children, function(index, sub_arr_now) {
                if (sub_arr_now.children.length > 0) {
                    sub_arr.children.push(sub_arr_now)
                    // sub_arr_now.children =
                    tel_info.sort_ids({
                        data: sub_arr_now.children,
                        func: function(d) {
                            return d.id
                        },
                    })
                }
            })

            com.hirch = d3.hierarchy(sub_arr).sum(function(_) {
                return 1
            })
            let pack_node = d3
                .pack()
                .size(pack_wh)
                .padding(3)
            pack_node(com.hirch)

            set_circ_txt(com.hirch.descendants())

            locker.remove({
                id: 'set_hierarchy',
                delay: times.anim * 2,
            })
        }

        function set_circ_txt(data_in) {
            let tag_circ = 'tel_circ'
            let tag_text = 'telTitle'

            let shift_xy = [
                (svg_dims.w[1] - pack_wh[0]) / 2,
                (svg_dims.h[1] - pack_wh[1]) / 2,
            ]
            function focused(d, scale) {
                return (
                    tel_data.tel_hover.sub_arr === get_sub_arr_id(d)
                    && zoom_state >= scale
                )
            }

            let circ = com.hirch_g.selectAll('circle.' + tag_circ)
            let text = com.hirch_g.selectAll('text.' + tag_text)

            if (is_def(data_in)) {
                circ = circ.data(data_in, function(d) {
                    return d.data.id
                })
                text = text.data(data_in, function(d) {
                    return d.data.id
                })
            }

            circ
                .enter()
                .append('circle')
                .attr('class', tag_circ)
                .attr('cx', function(d) {
                    return d.x
                })
                .attr('cy', function(d) {
                    return d.y
                })
                .attr('r', 0)
                .attr('vector-effect', 'non-scaling-stroke')
                .style('stroke-width', '0.5')
                .style('stroke', function(d) {
                    return hirch_style_stroke(d)
                })
                .style('fill', function(d) {
                    return hirch_style_fill(d)
                })
                .style('stroke-opacity', function(d) {
                    return hirch_style_opac(d, 0)
                })
                .style('fill-opacity', function(d) {
                    return hirch_style_opac(d, 0)
                })
                .on('mouseover', hirch_style_hover)
                .on('click', hierarchy_style_click)
                .on('dblclick', hirch_style_dblclick)
                .merge(circ)
                .each(function(d) {
                    com.tel_xy[d.data.id] = {
                        isTel: !d.children,
                        x: d.x + shift_xy[0],
                        y: d.y + shift_xy[1],
                    }
                    if (!d.children) {
                        com.pack_node_r = d.r
                    }
                })
                .transition('in')
                .duration(times.anim)
                .style('stroke', function(d) {
                    return hirch_style_stroke(d)
                })
                .style('fill', function(d) {
                    return hirch_style_fill(d)
                })
                .attr('cx', function(d) {
                    return d.x
                })
                .attr('cy', function(d) {
                    return d.y
                })
                .style('stroke-opacity', function(d) {
                    let state_now = 1
                    if (zoom_state === 0) {
                        state_now = 0
                    }
                    else if (focused(d, 1)) {
                        state_now = 2
                    }
                    return hirch_style_opac(d, state_now)
                })
                .style('fill-opacity', function(d) {
                    let state_now = 1
                    if (zoom_state === 0) {
                        state_now = 0
                    }
                    else if (focused(d, 1)) {
                        state_now = 2
                    }
                    return hirch_style_opac(d, state_now)
                })
                .attr('r', function(d) {
                    return hirch_style_rad(d, zoom_state)
                })

            circ
                .exit()
                .transition('out')
                .duration(times.anim)
                .attr('r', 0)
                .remove()

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let font_size = null

            text
                .enter()
                .append('text')
                .text(function(d) {
                    // console.log(tel_info.get_title(d.children ? d.data.N : d.data.id),is_def(d.children) , d.data.N , d.data.id);
                    if (!d.parent) {
                        return ''
                    }
                    else if (d.data.id === tel_info.no_sub_arr_name()) {
                        return tel_info.no_sub_arr_title()
                    }
                    else {
                        return tel_info.get_title(d.children ? d.data.N : d.data.id)
                    }
                })
                .attr('class', tag_text)
                .style('font-weight', 'bold')
                .style('opacity', '0')
                .style('fill', '#383b42')
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .attr('transform', txt_trans)
                .style('fill-opacity', function(d) {
                    if (d.children) {
                        return 0.4
                    }
                    else {
                        return 1
                    }
                })
                .style('stroke-width', function(d) {
                    if (d.children) {
                        return 0.7
                    }
                    else {
                        return 0.3
                    }
                })
                .attr('text-anchor', 'middle')
                .style('stroke', '#383b42')
                .merge(text)
                .each(function(d) {
                    if (!d.children && !is_def(font_size)) {
                        font_size = [
                            hirch_style_title_size(d, 0),
                            hirch_style_title_size(d, 1),
                        ]
                    }
                })
                .each(function(d) {
                    let scale = d.children ? 1.5 : 1
                    d.font_size = [ font_size[0] * scale, font_size[1] * scale ]
                })
                .transition('in')
                .duration(times.anim)
                .attr('dy', function(d) {
                    if (d.children) {
                        return 0
                    }
                    else {
                        return d.font_size[0] / 3 + 'px'
                    }
                })
                .attr('transform', txt_trans)
                .style('opacity', function(d) {
                    return d.parent && !d.children ? 1 : 1
                })
                .attr('font-size', function(d) {
                    if (d.children) {
                        return d.font_size[0] + 'px'
                    }
                    
                    let state_now = 0
                    if (zoom_state === 0) {
                        state_now = 0
                    }
                    else if (focused(d, 1)) {
                        state_now = 1
                    }
                    return d.font_size[state_now] + 'px'
                })

            text
                .exit()
                .transition('out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()

            function txt_trans(d) {
                return (
                    'translate('
                      + (d.x + ',')
                      + (d.y + (d.children ? -d.r : -d.r * focused(d, 1)) + ')')
                )
            }
        }

        function hirch_style_stroke(_) {
            return '#383b42'
            // return d.children ? "#383b42" : tel_data.id_cols[d.data.id];
        }
        function hirch_style_fill(d) {
            return d.children ? '#383b42' : tel_data.id_cols[d.data.id]
        }
        function hirch_style_opac(d, scale) {
            if (!d.parent) {
                return 0
            }

            let opac = d.children ? 0.07 : 0.9
            if (scale === 1) {
                opac *= 0.5
            }
            else if (scale === 2) {
                opac *= d.children ? 0.4 : 0.1
            }

            return opac
        }
        function hirch_style_rad(d, scale) {
            if (!d.parent) {
                return d.r * 10
            }

            let r = d.r
            if (d.parent.data.id === 'sub_arr') {
                r *= 1.05
            }
            if (scale > 0 && !d.children) {
                r *= 1.1
            }

            return r
        }
        function hirch_style_title_size(d, scale) {
            return d.r / 2 * (scale === 0 ? 1 : 0.6)
        }

        function hirch_style_hover(d) {
            if (d.height > 0) {
                return
            }
            if (get_scale() >= com.z['1.0']) {
                return
            }

            hierarchy_style_click(d)
        }

        function hierarchy_style_click(d) {
            function set_on_tel_id_try() {
                if (locker.is_free('data_change')) {
                    set_on_tel_id(d)

                    svg_sky_pos.update_data()

                    if (locker.is_free('zoom') && locker.is_free('zoom_to_target')) {
                        set_state({
                            type: 'hover',
                            data: d,
                        })
                    }
                }
                else {
                    setTimeout(function() {
                        set_on_tel_id_try()
                    }, times.anim / 2)
                }
            }
            set_on_tel_id_try()

            return
        }
        this_svg_sub_arr.hierarchy_style_click = hierarchy_style_click

        // FIXME !!!!!!!!!!!!!!!!!!!
        // FIXME !!!!!!!!!!!!!!!!!!!
        // FIXME !!!!!!!!!!!!!!!!!!!
        // FIXME !!!!!!!!!!!!!!!!!!!
        // FIXME !!!!!!!!!!!!!!!!!!!
        // FIXME !!!!!!!!!!!!!!!!!!!
        // FIXME !!!!!!!!!!!!!!!!!!!
        // FIXME !!!!!!!!!!!!!!!!!!!
        function hirch_style_dblclick(d) {
            let scale = get_scale()

            if (scale < com.z['1.1'] * 0.999) {
                zoom_to_target({
                    target: d.data.id,
                    scale: Math.max(com.z['1.1'], scale),
                    duration_scale: 1.5,
                })
            }
            else if (scale < com.z['2.0'] * 0.999) {
                if (tel_data.tel_hover.sub_arr === tel_data.tel_hover.clicked_sub_arr) {
                    zoom_to_target({
                        target: d.data.id,
                        scale: Math.max(com.z['2.0'], scale),
                        duration_scale: 1.5,
                    })
                }
                else {
                    zoom_to_target({
                        target: d.data.id,
                        scale: Math.max(com.z['1.1'], scale),
                        duration_scale: 1.5,
                    })
                }
            }
            else {
                zoom_to_target({
                    target: d.data.id,
                    scale: Math.max(com.z['2.0'], scale),
                    duration_scale: 1.5,
                })
            }

            tel_data.tel_hover.clicked_sub_arr = tel_data.tel_hover.sub_arr
        }

        function get_sub_arr_id(d) {
            return (
                d.parent ? tel_data.tel_sub_arr_id[d.data.id] : ''
            )
        }

        function set_on_tel_id(data_in) {
            if (data_in.depth === 0) {
                return
            }
            locker.add('data_change')

            let sub_arr_id = get_sub_arr_id(data_in)

            // if not the root node
            if (data_in.height === 0) {
                tel_data.tel_hover.sub_arr = sub_arr_id

                // if hovering over a spesific telescope
                if (!data_in.children) {
                    tel_data.tel_hover.id = data_in.data.id
                }
                else {
                    // if hovering over a sub_arr but not on a telescope, select the first element in the group
                    if (tel_data.sub_arr_ids[sub_arr_id].children.length > 0) {
                        tel_data.tel_hover.id = (
                            tel_data.sub_arr_ids[sub_arr_id].children[0].id
                        )
                    }
                }
            }

            locker.remove('data_change')
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_state_once(opt_in) {
            let type = opt_in.type
            // let data_in = opt_in.data

            // create delay if currently in data update or a previous call of set_state
            if (!locker.are_free([ 'set_state', 'set_hierarchy', 'data_change' ])) {
                // console.log('delay set_state')
                setTimeout(function() {
                    set_state(opt_in)
                }, times.anim)
                return
            }
            // console.log('set_state',opt_in)
            locker.add('data_change')
            locker.add('set_state')

            let scale = get_scale()
            let is_change_focus = (
                tel_data.tel_hover.sub_arr !== tel_data.tel_hover.focused_sub_arr
            )

            if (is_change_focus || type === 'zoom' || type === 'data_change') {
                tel_data.tel_hover.focused_sub_arr = tel_data.tel_hover.sub_arr

                set_circ_txt()
            }

            // -------------------------------------------------------------------
            // derive the tel/trg/pnt focuse state
            // -------------------------------------------------------------------
            let over_txt = []
            $.each([ 'trg', 'pnt' ], function(trg_tel_index, trg_tel) {
                $.each(tel_data[trg_tel], function(index, ele_now) {
                    let target_point_id = ele_now.id
                    tel_data.trg_pnt_focus[trg_tel][target_point_id] = false
                })
            })

            $.each(tel_data.tel, function(index, ele_now) {
                let tel_id = ele_now.id
                let is_hov = tel_data.tel_hover.id === tel_id

                let is_focused = true
                if (zoom_state > 0) {
                    if (scale < com.z['1.1']) {
                        is_focused = (
                            tel_data.tel_hover.sub_arr === tel_data.tel_sub_arr_id[tel_id]
                        )
                    }
                    else {
                        is_focused = is_hov
                    }
                }

                if (is_hov) {
                    over_txt = [ tel_info.get_title(tel_id), parse_pos_txt(ele_now.pos) ]
                }

                tel_data.id_focuses['tel' + tel_id] = is_focused

                if (is_focused) {
                    $.each([ 'trg', 'pnt' ], function(trg_tel_index, trg_tel) {
                        let target_point_id = ele_now[trg_tel + '_id']
                        tel_data.trg_pnt_focus[trg_tel][target_point_id] = true
                    })
                }
            })

            $.each([ 'trg', 'pnt' ], function(trg_tel_index, trg_tel) {
                $.each(tel_data[trg_tel], function(index, ele_now) {
                    let target_point_id = ele_now.id
                    let is_focused = tel_data.trg_pnt_focus[trg_tel][target_point_id]

                    tel_data.id_focuses[trg_tel + target_point_id] = is_focused
                })
            })

            // update the overlay text with the coordinates of the focused tel
            update_over_text(over_txt)

            // set the main display according to the focused tel/sub-array by zoom state
            if (scale < com.z['1.0']) {
                if (type !== 'data_change' || tel_data.prev_state !== 0) {
                    tel_data.prev_state = 0
                    tel_data.tel_hover.focused_sub_arr = ''

                    set_state_01(false, '')
                    set_state_10(false, '')
                }
            }
            else if (scale < com.z['2.0']) {
                set_state_01(true, '')

                if (type !== 'data_change'
                        || tel_data.prev_state !== 1
                        || is_change_focus) {
                    tel_data.prev_state = 1
                    set_state_10(false, '')
                }
            }
            else {
                tel_data.prev_state = 2
                set_state_10(true, '')

                // syncroniz changes with other panels
                // -------------------------------------------------------------------
                send_sync_state_to_server({
                    type: 'sync_tel_focus',
                    sync_time: Date.now(),
                    zoom_state: 1,
                    target: tel_data.tel_hover.id,
                })
            }

            locker.remove('data_change')
            locker.remove({
                id: 'set_state',
                delay: times.anim,
            })
        }
        this.set_state_once = set_state_once

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function init_state_01(need_init) {
            let tag_bck = 'sub_arr'
            let tag_g = tag_bck + 'tel_g'
            let tag_tel = tag_g + 'ele'

            if (!is_def(com[tag_g])) {
                com[tag_g] = com.zoom_callable.append('g')
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            com[tag_tel] = {
            }
            $.each(tel_data.sub_arr.children, function(index_0, grp_now) {
                $.each(grp_now.children, function(index_1, ele_now) {
                    let tel_id = ele_now.id
                    let tel_data_now = (
                        find_dict_ele_in_obj(tel_data.tel, 'id', tel_id, true)[1]
                        // if(tel_data_now == undefined) return;
                    )
                    let pnts_now = (
                        tel_data_now.pnt_id === tel_info.no_sub_arr_name()
                            ? tel_data_now
                            : find_dict_ele_in_obj(
                                tel_data.pnt, 'id', tel_data_now.pnt_id, true
                            )[1]
                    )

                    com[tag_tel][tel_id] = {
                    }
                    com[tag_tel][tel_id].tels = tel_data_now
                    com[tag_tel][tel_id].pnts = pnts_now
                })
            })
            // console.log(com[tag_tel]);return;

            if (!need_init) {
                return
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let tag_state = 's01'

            let width = com.pack_node_r * 1.7
            let lbl_size = width / 22
            let lbl_units = [ unit_deg, unit_arcmin, unit_arcsec ]
            let lbl_props = {
                size: lbl_size,
                units: lbl_units,
                offset: [ lbl_size * 1.5, lbl_size * 0.5 ],
            }

            let scale_rad_0 = width / 4.5
            let scale_rad_1 = scale_rad_0 / 2
            let scale_stroke_0 = scale_rad_0 / 6
            let scale_rad_2 = scale_rad_0 * 2.5
            let scale_width_0 = width * 0.7
            let scale_width_1 = width / 2 - (width - scale_width_0) / 2
            let scale_width_2 = -scale_rad_0 - scale_stroke_0 * 3

            let scale_delta_trans0 = []
            scale_delta_trans0.push([ scale_rad_0 / 2.5, -scale_rad_0 / 1.5 ])
            scale_delta_trans0.push([
                scale_delta_trans0[0][0] + width / 9,
                scale_delta_trans0[0][1] - width / 9,
            ])

            let tbl_font = lbl_size * 1.3
            // let scaleTable = scale_width_2 - scale_stroke_0 * 3.5

            let centre_0, centre_1, centre_2, centre_3
            centre_0 = [ -scale_delta_trans0[0][0], -scale_delta_trans0[0][1] ]
            centre_1 = [ -scale_width_1, -scale_delta_trans0[0][1] - scale_width_2 ]
            centre_2 = [ -scale_delta_trans0[1][0], -scale_delta_trans0[1][1] ]

            let centre_label_0 = centre_0
            let centre_label_1 = [
                centre_2[0] - scale_rad_2 * 0.15,
                centre_2[1] - scale_rad_2 * 1,
            ]
            let centre_label_2 = [ centre_1[0], centre_1[1] - scale_stroke_0 * 1.5 ]

            com[tag_state] = {
            }
            com[tag_state].tag_bck = tag_bck
            com[tag_state].tag_g = tag_g
            com[tag_state].lbl_props = lbl_props
            com[tag_state].scale_rad_0 = scale_rad_0
            com[tag_state].scale_rad_1 = scale_rad_1
            com[tag_state].scale_stroke_0 = scale_stroke_0
            com[tag_state].scale_rad_2 = scale_rad_2
            com[tag_state].scale_width_0 = scale_width_0
            com[tag_state].scale_width_1 = scale_width_1
            com[tag_state].scale_width_2 = scale_width_2
            com[tag_state].scale_delta_trans0 = scale_delta_trans0
            com[tag_state].tbl_font = tbl_font
            com[tag_state].centre_0 = centre_0
            com[tag_state].centre_1 = centre_1
            com[tag_state].centre_2 = centre_2
            com[tag_state].centre_label_0 = centre_label_0
            com[tag_state].centre_label_1 = centre_label_1
            com[tag_state].centre_label_2 = centre_label_2

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            tag_state = 's10'

            width = com.pack_node_r * 1.5
            lbl_size = width / 30
            lbl_units = [ unit_deg, unit_arcmin, unit_arcsec ]
            lbl_props = {
                size: lbl_size,
                units: lbl_units,
                offset: [ lbl_size * 1.3, lbl_size * 0.5 ],
            }

            scale_rad_0 = width / 4
            scale_rad_1 = scale_rad_0 / 3.5
            scale_stroke_0 = scale_rad_0 / 8
            scale_rad_2 = scale_rad_0 * 2
            scale_width_0 = width * 0.7
            scale_width_1 = width / 2 - (width - scale_width_0) / 2
            scale_width_2 = -scale_rad_0 - scale_stroke_0 * 3

            scale_delta_trans0 = []
            scale_delta_trans0.push([
                width / 4, width / 9,
            ])
            scale_delta_trans0.push([
                -width / 20, scale_delta_trans0[0][1] - width / 4,
            ])
            scale_delta_trans0.push([
                -width / 4.5, scale_delta_trans0[0][1] - width / 12,
            ])

            centre_0 = [
                -scale_delta_trans0[0][0] - width / 20, -scale_delta_trans0[0][1],
            ]
            centre_2 = [
                -scale_delta_trans0[1][0] + width / 20, -scale_delta_trans0[1][1],
            ]
            centre_3 = [
                -scale_delta_trans0[2][0] + width / 20, -scale_delta_trans0[2][1],
            ]

            centre_label_0 = centre_0
            centre_label_1 = [
                centre_2[0] - scale_rad_2 * 0.15, centre_2[1] - scale_rad_2 * 1,
            ]
            centre_label_2 = [
                centre_1[0], centre_1[1] - scale_stroke_0 * 1.5,
            ]

            centre_1 = []
            let wh_1 = []
            centre_1.push([
                centre_0[0] - scale_rad_0, centre_0[1] - scale_width_2 * 1.15,
            ])
            wh_1.push([ scale_rad_0 * 2, scale_stroke_0 ])
            centre_1.push([
                centre_2[0], centre_1[0][1],
            ])
            wh_1.push([ scale_rad_0 * 2, scale_stroke_0 ])
            centre_1.push([
                0.0 - width * 0.425, centre_1[0][1] + wh_1[0][1] * 5,
            ])
            wh_1.push([
                width * 0.85, scale_stroke_0 * 1.5,
            ])

            let cent_lables = []
            cent_lables.push([
                centre_1[0][0], centre_1[0][1] - wh_1[0][1],
            ])
            cent_lables.push([
                centre_1[1][0], centre_1[1][1] - wh_1[1][1],
            ])
            cent_lables.push([
                centre_1[2][0] - wh_1[2][1],
                centre_1[2][1] + wh_1[2][1] * 0.6,
            ])

            let scale_rad = [ 1, 0.6, 0.25 ]

            let table_height = 0.55 * (
                (width / 2 + scale_delta_trans0[0][1])
                + (scale_width_2 - scale_stroke_0 * 5)
            )
            let table_pos_10 = {
                x: -width * 0.45,
                y: width * 0.45 - table_height,
                w: width * 0.9,
                h: table_height,
            }

            com[tag_state] = {
            }
            com[tag_state].tag_bck = tag_bck
            com[tag_state].tag_g = tag_g
            com[tag_state].lbl_props = lbl_props
            com[tag_state].scale_width_0 = scale_width_0
            com[tag_state].scale_width_1 = scale_width_1
            com[tag_state].scale_width_2 = scale_width_2
            com[tag_state].scale_delta_trans0 = scale_delta_trans0
            com[tag_state].tbl_font = tbl_font
            com[tag_state].centre_0 = centre_0
            com[tag_state].centre_2 = centre_2
            com[tag_state].centre_3 = centre_3
            com[tag_state].centre_label_0 = centre_label_0
            com[tag_state].centre_label_1 = centre_label_1
            com[tag_state].centre_label_2 = centre_label_2
            com[tag_state].scale_rad = scale_rad
            com[tag_state].table_pos_10 = table_pos_10

            $.each(scale_rad, function(index, scale_radNow) {
                com[tag_state]['scale_rad_0' + index] = scale_rad_0 * scale_radNow
                com[tag_state]['scale_rad_1' + index] = scale_rad_1 * scale_radNow
                com[tag_state]['scale_rad_2' + index] = scale_rad_2 * scale_radNow
                com[tag_state]['scl_r_3' + index]
          = scale_rad_1
          * (index === 2 ? (scale_rad[0] + scale_rad[1]) / 2 : scale_rad[1])
                com[tag_state]['scale_stroke_0' + index] = scale_stroke_0 * scale_radNow

                com[tag_state]['centre_1' + index] = centre_1[index]
                com[tag_state]['wh_1' + index] = wh_1[index]
                com[tag_state]['centre_label_3' + index] = cent_lables[index]
            })
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_state_01(is_on, tel_id_on) {
            let tag_bck = 'sub_arr'
            let tag_g = tag_bck + 'tel_g'
            let tag_tel = tag_g + 'ele'

            let data_in = {
            }
            data_in.azm = []
            data_in.zen = []
            if (is_on) {
                let scale = get_scale()
                let children_now = (
                    tel_data.sub_arr_ids[tel_data.tel_hover.sub_arr].children
                )
                $.each(children_now, function(index, ele_now) {
                    let tel_id = ele_now.id

                    if (tel_id_on === '' || tel_id_on === tel_id) {
                        let tel_data_now = com[tag_tel][tel_id].tels
                        let pnts_now = com[tag_tel][tel_id].pnts
                        let is_hov = (
                            tel_data.tel_hover.id === tel_id
                            && scale >= com.z['1.1']
                        )

                        // if(tel_id == 'M_2') console.log('+++',pnts_now.pos)
                        data_in.azm.push({
                            id: tel_id,
                            pos: tel_data_now.pos[0],
                            pnt: pnts_now.pos[0],
                            col: tel_data_now.col,
                            has_lbls: is_hov,
                            has_cent_lbl: is_hov,
                        })
                        data_in.zen.push({
                            id: tel_id,
                            pos: tel_data_now.pos[1],
                            pnt: pnts_now.pos[1],
                            col: tel_data_now.col,
                            has_lbls: is_hov,
                            has_cent_lbl: is_hov,
                        })
                    }
                })
            }
            // console.log(data_in); return

            let opt = {
            }
            opt.index = 0
            opt.is_arc = false
            opt.tag_state = 's01'
            opt.tag_type = '0'
            opt.scale_rad_0 = 'scale_rad_0'
            opt.scale_rad_1 = 'scale_rad_1'
            opt.scale_stroke_0 = 'scale_stroke_0'
            opt.lbl_props = 'lbl_props'
            opt.center = 'centre_0'
            opt.cent_lbl = 'centre_label_0'
            opt.data = data_in.azm

            add_ring(opt)

            opt = {
            }
            opt.index = 0
            opt.is_arc = true
            opt.tag_state = 's01'
            opt.tag_type = '1'
            opt.scale_rad_0 = 'scale_rad_2'
            opt.scale_rad_1 = 'scale_rad_1'
            opt.scale_stroke_0 = 'scale_stroke_0'
            opt.lbl_props = 'lbl_props'
            opt.center = 'centre_2'
            opt.cent_lbl = 'centre_label_1'
            opt.data = data_in.zen

            add_ring(opt)

            data_in = null
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function set_state_10(is_on, tel_id_on) {
            // console.log('__set_stateS10')
            let tag_bck = 'sub_arr'
            let tag_g = tag_bck + 'tel_g'
            let tag_tel = tag_g + 'ele'
            // let tag_state = 's10'

            let show_by_percision = true

            let data_in = {
            }
            data_in.azm = [ [], [], [] ]
            data_in.zen = [ [], [], [] ]
            data_in.pos_diff = [] // data_in.tabel = []; data_in.remove = [];

            let hov = tel_data.tel_hover.sub_arr
            if (is_def(hov) && is_def(tel_data.sub_arr_ids[hov])) {
                let children_now = tel_data.sub_arr_ids[hov].children
                $.each(children_now, function(index, ele_now) {
                    let tel_id = ele_now.id

                    if (is_on && (tel_id_on === '' || tel_id_on === tel_id)) {
                        let tel_data_now = com[tag_tel][tel_id].tels
                        let pnts_now = com[tag_tel][tel_id].pnts
                        let is_hov = tel_data.tel_hover.id === tel_id
                        // if(tel_id=='M_10') console.log(tel_data_now,pnts_now)

                        let pos_diff_0 = tel_data_now.pos[0] - pnts_now.pos[0]
                        let pos_diff_1 = tel_data_now.pos[1] - pnts_now.pos[1]
                        let pos_diff_2 = Math.sqrt(
                            Math.pow(pos_diff_0, 2) + Math.pow(pos_diff_1, 2)
                        )
                        let pos_diffs = [ pos_diff_0, pos_diff_1, pos_diff_2 ]

                        let is_diff_min = [ true, true ]
                        let is_diff_sec = [ true, true ]
                        if (show_by_percision) {
                            $.each([ 0, 1 ], function(_, index) {
                                let pos_diff = Math.abs(
                                    index === 0 ? pos_diff_0 : pos_diff_1
                                )
                                if (index === 0) {
                                    if (pos_diff >= 360) {
                                        pos_diff -= 360
                                    }
                                }
                                else {
                                    if (pos_diff >= 90) {
                                        pos_diff -= 90
                                    }
                                }
                                let pos_diff_dms = deg_dms(pos_diff)
                                is_diff_min[index] = pos_diff_dms[0] === 0
                                is_diff_sec[index] = (
                                    pos_diff_dms[0] === 0
                                    && pos_diff_dms[1] === 0
                                )
                            })
                        }

                        let azm = {
                            id: tel_id,
                            pos: tel_data_now.pos[0],
                            pnt: pnts_now.pos[0],
                            col: tel_data_now.col,
                            has_lbls: is_hov,
                            has_cent_lbl: is_hov,
                        }
                        let zen = {
                            id: tel_id,
                            pos: tel_data_now.pos[1],
                            pnt: pnts_now.pos[1],
                            col: tel_data_now.col,
                            has_lbls: is_hov,
                            has_cent_lbl: is_hov,
                        }

                        $.each([ 0, 1, 2 ], function(_, index) {
                            if (
                                index === 0
                                || (index === 1 && is_diff_min[0])
                                || (index === 2 && is_diff_sec[0])
                            ) {
                                data_in.azm[index].push(azm)
                            }
                            if (
                                index === 0
                                || (index === 1 && is_diff_min[1])
                                || (index === 2 && is_diff_sec[1])
                            ) {
                                data_in.zen[index].push(zen)
                            }
                        })

                        if (is_hov) {
                            data_in.pos_diff.push({
                                id: tel_id,
                                pos_diff: pos_diffs,
                                col: tel_data_now.col,
                                has_lbls: is_hov,
                                has_cent_lbl: is_hov,
                            })
                        }
                    }
                })
            }

            // -------------------------------------------------------------------
            // azimuth (full circle)
            // -------------------------------------------------------------------
            $.each([ 0, 1, 2 ], function(_, index) {
                let opt = {
                    index: index,
                    is_arc: false,
                    tag_state: 's10',
                    tag_type: '0',
                    scale_rad_0: 'scale_rad_0' + index,
                    scale_rad_1: 'scale_rad_1' + index,
                    scale_stroke_0: 'scale_stroke_0' + index,
                    lbl_props: 'lbl_props',
                    center: 'centre_0',
                    cent_lbl: 'centre_label_0',
                    data: data_in.azm[index],
                }

                if (is_on || (!is_on && index > 0)) {
                    add_ring(opt)
                }
            })

            // -------------------------------------------------------------------
            // zenith (1/4 of circle)
            // -------------------------------------------------------------------
            $.each([ 0, 1, 2 ], function(_, index) {
                let opt = {
                    index: index,
                    tag_state: 's10',
                    tag_type: '1',
                    scale_rad_0: (index === 0 ? 'scale_rad_2' : 'scale_rad_0') + index,
                    scale_rad_1: 'scale_rad_1' + index,
                    scale_stroke_0: 'scale_stroke_0' + index,
                    lbl_props: 'lbl_props',
                    center: index === 0 ? 'centre_2' : 'centre_3',
                    cent_lbl: 'centre_label_1',
                    data: data_in.zen[index],
                }

                if (is_on || (!is_on && index > 0)) {
                    opt.is_arc = index === 0
                    add_ring(opt)
                }
            })

            // -------------------------------------------------------------------
            // difference between position and pointing (azimuth and zenith combined)
            // -------------------------------------------------------------------
            $.each([ 0, 1, 2 ], function(_, index) {
                let opt = {
                    index: index,
                    tag_state: 's10',
                    scale_rad_1: 'scl_r_3' + index,
                    scale_stroke_0: 'scale_stroke_0' + index,
                    lbl_props: 'lbl_props',
                    center: 'centre_1' + index,
                    cent_lbl: 'centre_label_3' + index,
                    wh: 'wh_1' + index,
                    data: data_in.pos_diff,
                }

                add_stretch_band(opt)
            })

            data_in = null

            return
        }

        // -------------------------------------------------------------------
        // helper functions for adding elements and for updating positions of sub elements
        // -------------------------------------------------------------------
        function add_stretch_band(opt_in) {
            let index = opt_in.index
            let tag_state = opt_in.tag_state
            let tag_bck = 'sub_arr'
            let tag_g = tag_bck + 'tel_g'
            let tag_tel = tag_g + 'ele'
            let tag_now = tag_tel + index + 'band'
            let data = opt_in.data
            let add_main_lbl = false

            let scale_rad_1 = com[tag_state][opt_in.scale_rad_1]
            // let scale_stroke_0 = com[tag_state][opt_in.scale_stroke_0]
            let lbl = com[tag_state][opt_in.lbl_props]
            let wh = com[tag_state][opt_in.wh]

            function xy(tag_in, tel_id) {
                return [
                    com.tel_xy[tel_id].x + com[tag_state][opt_in[tag_in]][0],
                    com.tel_xy[tel_id].y + com[tag_state][opt_in[tag_in]][1],
                ]
            }
            function center(tel_id) {
                return xy('center', tel_id)
            }
            function cent_lbl(tel_id) {
                return xy('cent_lbl', tel_id)
            }

            let data_0 = []
            let data_lbl = []
            let data_cent_lbl = []
            let xy_xiff = {
            }

            let lbl_offset_h = wh[1] * (index < 2 ? 3 : 2)
            let w_frac = 0.35
            let n_lbls = 3
            let scales = [
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
                180 + 1e-4,
            ]

            $.each(data, function(_, data_now) {
                let tel_id = data_now.id
                let pos_diff = data_now.pos_diff[index]
                if (pos_diff > 180) {
                    pos_diff -= 360
                }
                else if (pos_diff < -180) {
                    pos_diff += 360
                }

                if (data_now.has_cent_lbl && index === 2) {
                    data_cent_lbl.push({
                        id: tel_id,
                    })
                }

                let scale_index = 0
                let scales_now = []
                $.each(scales, function(index, _) {
                    if (index < scales.length - 1) {
                        if (pos_diff > scales[index]
                                && pos_diff <= scales[index + 1]) {
                            scale_index = index
                        }
                        scales_now.push([ scales[index], scales[index + 1] ])
                    }
                })

                let rng
                let w_now
                let x_now
                let x0 = 0
                let w0 = wh[0] * w_frac / (scales_now.length - 1)
                let w1 = wh[0] * (1 - w_frac)
                let w2 = w0 * 0.3

                $.each(scales_now, function(index, scale_now) {
                    rng = scale_now[1] - scale_now[0]
                    w_now = (index === scale_index ? w1 : w0)
                    x_now = x0
                    x0 += w_now
                    w_now -= w2

                    if (index === scale_index) {
                        xy_xiff[tel_id] = [
                            x_now + w_now * (pos_diff - scale_now[0]) / rng,
                            wh[1] / 2,
                        ]

                        if (data_now.has_lbls) {
                            for (let n_lbl_now = 0; n_lbl_now < n_lbls; n_lbl_now++) {
                                let lbl_x = x_now + n_lbl_now * w_now / (n_lbls - 1)
                                let lbl_val = (
                                    formatLbl(
                                        scale_now[0] + n_lbl_now * rng / (n_lbls - 1)
                                    )
                                )

                                data_lbl.push({
                                    id: tel_id,
                                    n_lbl: n_lbl_now,
                                    val: lbl_val,
                                    pos: lbl_x,
                                })
                            }
                        }
                    }

                    data_0.push({
                        id: tel_id,
                        n_rect: index,
                        rng: rng,
                        x: x_now,
                        w: w_now,
                        opac: w_now <= w0 ? 0.2 : 0.1,
                    })
                })
            })

            // -------------------------------------------------------------------
            // labels
            // -------------------------------------------------------------------
            let lbl_0 = com[tag_g]
                .selectAll('text.' + tag_now + 'lbl_0')
                .data(data_lbl, function(d) {
                    return d.id + d.n_lbl
                })

            lbl_0
                .enter()
                .append('text')
                .text(function(d) {
                    return d.val + lbl.units[0]
                })
                .attr('class', tag_now + 'lbl_0')
                // .style("stroke", "#383b42")
                .style('stroke-width', 0)
                .style('opacity', '0')
                .style('fill', '#383b42')
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .attr('text-anchor', 'middle')
                .style('font-size', lbl.size * (index < 2 ? 1.2 : 1.5) + 'px')
                .attr('transform', function(d) {
                    return (
                        ('translate(' + center(d.id)[0])
                        + (',' + (center(d.id)[1] + lbl_offset_h) + ')')
                    )
                })
                .merge(lbl_0)
                .transition('in_out')
                .duration(times.anim)
                .attr('transform', function(d) {
                    let move = (
                        (this_trans(this)[0] - (center(d.id)[0] + d.pos))
                        / (center(d.id)[0] + d.pos)
                    )
                    d.has_moved = Math.abs(move) > 0.001
                    return (
                        ('translate(' + (center(d.id)[0] + d.pos) + ',')
                        + ((center(d.id)[1] + lbl_offset_h) + ')')
                    )
                })
                .tween('text', function(d) {
                    if (!d.has_moved) {
                        return
                    }

                    let that = d3.select(this)
                    let i = d3.interpolateNumber(
                        that
                            .text()
                            .replace(/,/g, '')
                            .replace(lbl.units[0], ''),
                        d.val
                    )

                    return function(t) {
                        that.text(formatLbl(i(t)) + lbl.units[0])
                    }
                })
                .style('opacity', 1)

            lbl_0
                .exit()
                .attr('class', tag_now + 'lbl_0' + 'exit')
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            if (add_main_lbl) {
                let lbl_1 = com[tag_g]
                    .selectAll('text.' + tag_now + 'lbl_1')
                    .data(data_cent_lbl, function(d) {
                        return d.id
                    })

                lbl_1
                    .enter()
                    .append('text')
                    .text(symbols.Delta)
                    .attr('class', tag_now + 'lbl_1')
                    .style('stroke', '#383b42')
                    .style('opacity', '0')
                    .style('fill', '#383b42')
                    .attr('vector-effect', 'non-scaling-stroke')
                    .style('pointer-events', 'none')
                    .attr('text-anchor', 'middle')
                    .style('font-size', (
                        (lbl.size * (index === 2 ? 2 : 1.5)) + 'px'
                    ))
                    .attr('transform', function(d) {
                        return (
                            ('translate(' + cent_lbl(d.id)[0] + ',')
                            + ((cent_lbl(d.id)[1] + lbl.offset[1]) + ')')
                        )
                    })
                    .merge(lbl_1)
                    .transition('in_out')
                    .duration(times.anim)
                    .style('font-size', (
                        (lbl.size * (index === 2 ? 2 : 1.5)) + 'px'
                    ))
                    .style('opacity', 0.7)

                lbl_1
                    .exit()
                    .attr('class', tag_now + 'lbl_1' + 'exit')
                    .transition('in_out')
                    .duration(times.anim)
                    .style('opacity', 0)
                    .remove()
            }
            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            com[tag_now + '0'] = com[tag_g]
                .selectAll('rect.' + tag_now + '0')
                .data(data_0, function(d) {
                    return d.id + d.n_rect
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
                .attr('transform', function(d) {
                    return 'translate(' + center(d.id)[0] + ',' + center(d.id)[1] + ')'
                })
                // .transition("enter").duration(times.anim)
                // .attr("r", function(d){ return scale_rad_1+"px"; })
                .merge(com[tag_now + '0'])
                .transition('move')
                .duration(times.anim)
                .attr('transform', function(d) {
                    return 'translate(' + center(d.id)[0] + ',' + center(d.id)[1] + ')'
                })
                // .attr("height", (wh[1]+"px"))
                .style('opacity', function(d) {
                    return d.opac
                })
                .attr('x', function(d) {
                    return d.x
                })
                .attr('width', function(d) {
                    return d.w
                })

            com[tag_now + '0']
                .exit()
                .attr('class', tag_now + '0' + 'exit')
                .transition('exit')
                .duration(times.anim)
                .style('opacity', '0')
                .remove()

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            com[tag_now + '1'] = com[tag_g]
                .selectAll('circle.' + tag_now + '1')
                .data(data, function(d) {
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
                .attr('transform', function(d) {
                    return (
                        ('translate(' + (center(d.id)[0] + xy_xiff[d.id][0]))
                        + (',' + (center(d.id)[1] + xy_xiff[d.id][1]) + ')')
                    )
                })
                .merge(com[tag_now + '1'])
                .transition('move')
                .duration(times.anim)
                .attr('transform', function(d) {
                    return (
                        ('translate(' + (center(d.id)[0] + xy_xiff[d.id][0]))
                        + (',' + (center(d.id)[1] + xy_xiff[d.id][1]) + ')')
                    )
                })
                .style('fill', get_col_stretch_band())
                .attr('r', scale_rad_1 + 'px')

            com[tag_now + '1']
                .exit()
                .attr('class', tag_now + '1' + 'exit')
                .transition('exit')
                .duration(times.anim)
                .attr('r', '0')
                .remove()

            data_0 = null
            data_lbl = null
            data_cent_lbl = null
            xy_xiff = null
            lbl_offset_h = null
            scales = null
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function add_ring(opt_in) {
            let index = opt_in.index
            let is_arc = opt_in.is_arc
            let tag_state = opt_in.tag_state
            let tag_bck = 'sub_arr'
            let tag_g = tag_bck + 'tel_g'
            let tag_tel = tag_g + 'ele'
            let tag_now = tag_tel + index + (is_arc ? 'arc' : 'ring') + opt_in.tag_type
            let data = opt_in.data

            let scale_rad_0 = com[tag_state][opt_in.scale_rad_0]
            let scale_rad_1 = com[tag_state][opt_in.scale_rad_1]
            let scale_stroke_0 = com[tag_state][opt_in.scale_stroke_0]
            let lbl = com[tag_state][opt_in.lbl_props]

            function xy(tag_in, tel_id) {
                return [
                    com.tel_xy[tel_id].x + com[tag_state][opt_in[tag_in]][0],
                    com.tel_xy[tel_id].y + com[tag_state][opt_in[tag_in]][1],
                ]
            }
            function center(tel_id) {
                return xy('center', tel_id)
            }
            function cent_lbl(tel_id) {
                return xy('cent_lbl', tel_id)
            }

            $.each(data, function(_, data_now) {
                let tel_id = data_now.id

                if (!is_def(com[tag_now + 'prev'])) {
                    com[tag_now + 'prev'] = {
                    }
                }
                if (!is_def(com[tag_now + 'prev'][tel_id + 'pos'])) {
                    com[tag_now + 'prev'][tel_id + 'pos'] = 0
                    com[tag_now + 'prev'][tel_id + 'pnt'] = 0
                    com[tag_now + 'prev'][tel_id + 'r_0'] = 0
                }
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            let arc_now = d3
                .arc()
                .startAngle(0)
                .endAngle(is_arc ? tau / 4 : tau)
            
            function tween_arc(transition) {
                transition.attrTween('d', function(d) {
                    let tel_id = d.id
                    let r0 = com[tag_now + 'prev'][tel_id + 'r_0']
                    com[tag_now + 'prev'][tel_id + 'r_0'] = scale_rad_0

                    return function(t) {
                        d.innerRadius = r0 + (scale_rad_0 - r0) * interpolate01(t)
                        d.outerRadius = d.innerRadius
                        return arc_now(d)
                    }
                })
            }

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            com[tag_now + '0'] = com[tag_g]
                .selectAll('path.' + tag_now + '0')
                .data(data, function(d) {
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
                .attr('transform', function(d) {
                    return 'translate(' + center(d.id)[0] + ',' + center(d.id)[1] + ')'
                })
                .transition('enter')
                .duration(times.anim)
                .style('stroke-width', scale_stroke_0 + 'px')
                .call(tween_arc)

            let has_moved
            com[tag_g]
                .selectAll('path.' + tag_now + '0')
                .transition('updateSizeTrans')
                .duration(times.anim)
                .attr('transform', function(d) {
                    let move = (this_trans(this)[0] - center(d.id)[0]) / center(d.id)[0]
                    has_moved = Math.abs(move) > 0.001
                    return 'translate(' + center(d.id)[0] + ',' + center(d.id)[1] + ')'
                })
                .style('stroke-width', scale_stroke_0 + 'px')
                .call(tween_arc)

            com[tag_now + '0']
                .exit()
                .attr('class', tag_now + '0' + 'exit')
                .transition('exit')
                .duration(times.anim)
                .style('opacity', '0')
                .remove()

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            com[tag_now + '1'] = com[tag_g]
                .selectAll('circle.' + tag_now + '1')
                .data(data, function(d) {
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
                .attr('transform', function(d) {
                    return transSet(true, 0, [ scale_rad_0, center(d.id) ], index, false)
                })
                // .transition("enter").duration(times.anim)
                // .attr("r", function(d){ return scale_rad_1+"px"; })

            if (has_moved) {
                com[tag_g]
                    .selectAll('circle.' + tag_now + '1')
                    // .each(function(d){ if(d.id == 'M_2')console.log('ring',d.pos); })
                    .transition('updateSizeTrans')
                    .duration(times.anim)
                    .attr('transform', function(d) {
                        return transSet(
                            true,
                            d.pos,
                            [ scale_rad_0, center(d.id) ],
                            index,
                            false
                        )
                    })
                    .attr('r', scale_rad_1 + 'px')
                    .style('fill', function(d) {
                        return d.col
                    })
            }
            else {
                com[tag_g]
                    .selectAll('circle.' + tag_now + '1')
                    .transition('move')
                    .duration(times.anim)
                    .attr('r', scale_rad_1 + 'px')
                    .attrTween('transform', function(d) {
                        return transUpdate(
                            true,
                            com[tag_now + 'prev'][d.id + 'pos'],
                            d.pos,
                            [ scale_rad_0, center(d.id) ],
                            index,
                            d.id,
                            tag_now + 'prev',
                            d.id + 'pos'
                        )
                    })
                    .style('fill', function(d) {
                        return d.col
                    })
            }

            com[tag_now + '1']
                .exit()
                .attr('class', tag_now + '1' + 'exit')
                .transition('exit')
                .duration(times.anim)
                .attr('r', '0')
                .remove()

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            com[tag_now + '2'] = com[tag_g]
                .selectAll('circle.' + tag_now + '2')
                .data(data, function(d) {
                    return d.id
                })

            com[tag_now + '2']
                .enter()
                .append('circle')
                .attr('class', tag_now + '2')
                .style('stroke', '#383b42')
                .style('opacity', '0.7')
                .style('stroke-width', 0.1 * scale_rad_1 + 'px')
                .style('fill', 'transparent')
                .style('pointer-events', 'none')
                .attr('r', '0')
                .attr('transform', function(d) {
                    return transSet(true, 0, [ scale_rad_0, center(d.id) ], index, false)
                })
                // .transition("enter").duration(times.anim)
                // .attr("r", function(d){ return scale_rad_1+"px"; })

            if (has_moved) {
                com[tag_g]
                    .selectAll('circle.' + tag_now + '2')
                    .transition('updateSizeTrans')
                    .duration(times.anim)
                    .attr('transform', function(d) {
                        return transSet(
                            true,
                            d.pnt,
                            [ scale_rad_0, center(d.id) ],
                            index,
                            false
                        )
                    })
                    .attr('r', scale_rad_1 + 'px')
            }
            else {
                com[tag_g]
                    .selectAll('circle.' + tag_now + '2')
                    .transition('move')
                    .duration(times.anim)
                    .attr('r', scale_rad_1 + 'px')
                    .attrTween('transform', function(d) {
                        return transUpdate(
                            true,
                            com[tag_now + 'prev'][d.id + 'pnt'],
                            d.pnt,
                            [ scale_rad_0, center(d.id) ],
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
                .duration(times.anim)
                .attr('r', '0')
                .remove()

            // -------------------------------------------------------------------
            // labels
            // -------------------------------------------------------------------
            let n_lbls
            let data_lbl = []
            let data_cent_lbl = []
            if (is_arc) {
                n_lbls = 6
                $.each(data, function(_, data_now) {
                    let tel_id = data_now.id

                    if (data_now.has_lbls) {
                        for (let n_lbl_now = 0; n_lbl_now < n_lbls + 1; n_lbl_now++) {
                            let pos_now = n_lbl_now * 90 / n_lbls
                            let val_now = 90 - pos_now
                            let rot = n_lbl_now * (90 / 360) * 360 / n_lbls

                            data_lbl.push({
                                id: tel_id,
                                n_lbl: n_lbl_now,
                                val: val_now,
                                pos: pos_now,
                                rot: rot,
                            })
                        }
                    }

                    if (data_now.has_cent_lbl && index === 0) {
                        data_cent_lbl.push({
                            id: tel_id,
                        })
                    }
                })
            }
            else {
                n_lbls = [ 10, 6, 3 ]
                $.each(data, function(_, data_now) {
                    let tel_id = data_now.id

                    if (data_now.has_lbls) {
                        for (let n_lbl_now = 0; n_lbl_now < n_lbls[index]; n_lbl_now++) {
                            let pos_now = (
                                n_lbl_now * (index === 0 ? 360 : 60) / n_lbls[index]
                            )
                            if (index === 0 && pos_now > 180) {
                                pos_now -= 360
                            }

                            let rot = n_lbl_now * 360 / n_lbls[index]
                            if (rot > 90 && rot < 270) {
                                rot += 180
                            }

                            data_lbl.push({
                                id: tel_id,
                                n_lbl: n_lbl_now,
                                pos: pos_now,
                                rot: rot,
                            })
                        }

                        if (data_now.has_cent_lbl && index === 0) {
                            data_cent_lbl.push({
                                id: tel_id,
                            })
                        }
                    }
                })
            }

            let lbl_0 = com[tag_g]
                .selectAll('text.' + tag_now + 'lbl_0')
                .data(data_lbl, function(d) {
                    return d.id + d.n_lbl
                })
            lbl_0
                .enter()
                .append('text')
                .text(function(d) {
                    return d.pos + lbl.units[index]
                })
                .attr('class', tag_now + 'lbl_0')
                .style('stroke', '#383b42')
                .style('stroke-width', 0.25)
                .style('opacity', '0')
                .style('fill', '#383b42')
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .attr('text-anchor', 'middle')
                .style('font-size', lbl.size + 'px')
                .attr('transform', function(d) {
                    return (
                        transSet(
                            true,
                            d.pos,
                            [
                                scale_rad_0 + lbl.offset[0],
                                [ center(d.id)[0], center(d.id)[1] + lbl.offset[1] ],
                            ],
                            index,
                            true
                        )
                        + ('rotate(' + d.rot + ')')
                    )
                })
                .merge(lbl_0)
                .transition('in_out')
                .duration(times.anim)
                .style('font-size', lbl.size + 'px')
                .attr('transform', function(d) {
                    return (
                        transSet(
                            true,
                            d.pos,
                            [
                                scale_rad_0 + lbl.offset[0],
                                [ center(d.id)[0], center(d.id)[1] + lbl.offset[1] ],
                            ],
                            index,
                            true
                        )
                        + ('rotate(' + d.rot + ')')
                    )
                })
                .style('opacity', 0.8)

            lbl_0
                .exit()
                .attr('class', tag_now + 'lbl_0' + 'exit')
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()

            let lbl_1 = com[tag_g]
                .selectAll('text.' + tag_now + 'lbl_1')
                .data(data_cent_lbl, function(d) {
                    return d.id
                })
            lbl_1
                .enter()
                .append('text')
                .text(is_arc ? symbols.delta : symbols.phi)
                .attr('class', tag_now + 'lbl_1')
                .style('stroke', '#383b42')
                // .style("font-weight", "bold")
                .style('opacity', '0')
                .style('fill', '#383b42')
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .attr('text-anchor', 'middle')
                .style('font-size', lbl.size * 2 + 'px')
                .attr('transform', function(d) {
                    return (
                        ('translate(' + cent_lbl(d.id)[0] + ',')
                        + ((cent_lbl(d.id)[1] + lbl.offset[1]) + ')')
                    )
                })
                .merge(lbl_1)
                .transition('in_out')
                .duration(times.anim)
                .attr('transform', function(d) {
                    return (
                        ('translate(' + cent_lbl(d.id)[0] + ',')
                        + ((cent_lbl(d.id)[1] + lbl.offset[1]) + ')')
                    )
                })
                .style('font-size', lbl.size * 2 + 'px')
                .style('opacity', 0.7)

            lbl_1
                .exit()
                .attr('class', tag_now + 'lbl_1' + 'exit')
                .transition('in_out')
                .duration(times.anim)
                .style('opacity', 0)
                .remove()

            data_lbl = null
            data_cent_lbl = null
            n_lbls = null
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function transSet(is_ring, pos, rad, type, is_dms) {
            let dms = is_dms ? pos : deg_dms(pos)[type]
            let type_scale = (type === 0 ? 360 : 60) / tau

            if (!is_ring && type === 0) {
                type_scale = (dms > 0 ? -1 : 1) * 360 / tau
            }

            let angle = dms / type_scale
            if (is_ring) {
                angle -= tau / 4
            } // zero angle shifted to top

            let xy_in = [ rad[0] * Math.cos(angle), rad[0] * Math.sin(angle) ]
            let xy_out = [ xy_in[0] + rad[1][0], xy_in[1] + rad[1][1] ]

            return ('translate(' + xy_out[0] + ',' + xy_out[1] + ')')
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function transUpdate(is_ring, pos0, pos1, rad, type, id, tag0, tag1) {
            let prev_mms = deg_dms(pos0)
            let pos_type_0 = prev_mms[type]
            let delta_pos = deg_dms(pos1)[type] - pos_type_0

            if (type > 0) {
                if (delta_pos < -30) {
                    delta_pos += 60
                }
            }

            return function(t) {
                prev_mms[type] = pos_type_0 + t * delta_pos
                com[tag0][tag1] = dms_deg(prev_mms)

                return transSet(is_ring, prev_mms[type], rad, type, true)
            }
        }

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        function formatLbl(val) {
            if (Math.abs(val) < 1e-10) {
                return 0
            }
            if (Math.abs(val) < 0.1) {
                return Math.floor(val * 100) / 100
            }
            else {
                return d3.format('.1f')(val)
            }
        }

        // -------------------------------------------------------------------
        // hexagonal grid serving as the background for the svg
        // -------------------------------------------------------------------
        function hex00() {
            let tag_now = 'hex'
            let strk = 0.5
            let scale = get_scale()

            let opac = '0.10'
            if (scale <= com.z['0.2']) {
                opac = '0.25'
            }
            else if (scale <= com.z['1.0']) {
                opac = '0.15'
            }

            // add the hexbin as another layer of the background
            // -------------------------------------------------------------------
            if (!is_def(com.svg_hex)) {
                let hex_r = 18 // is_south ? 35 : 20;

                com.svg_hex = {
                }
                com.svg_hex.hex = d3
                    .hexbin()
                    .size([ svg_dims.w[1], svg_dims.h[1] ])
                    .radius(hex_r)
                com.svg_hex.g = com.zoom_callable.append('g')

                let xy = com.svg_hex.hex([ [ svg_dims.w[1] / 2, -svg_dims.h[1] / 2 ] ])
                let trans = [ svg_dims.w[1] / 2 - xy[0].x, svg_dims.h[1] / 2 + xy[0].y ]

                com.svg_hex.trans = function(xy_in) {
                    let xy_out = com.svg_hex.hex([ xy_in ])

                    return [ xy_out[0].x + trans[0], xy_out[0].y + trans[1] ]
                }

                com.svg_hex.g
                    .selectAll('path.' + tag_now)
                    .data([ 0 ])
                    .enter()
                    .append('path')
                    .attr('class', tag_now)
                    .attr('fill', 'transparent')
                    .attr('stroke', '#383b42')
                    .attr('stroke-width', strk)
                    .attr('opacity', opac)
                    .attr('vector-effect', 'non-scaling-stroke')
                    .attr('d', com.svg_hex.hex.mesh())
            }
            else {
                com.svg_hex.g
                    .selectAll('path.' + tag_now)
                    .transition('in_out')
                    .duration(times.anim)
                    .attr('opacity', opac)
            }
        }
    }

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let svg_sub_arr = new SvgSubArr()
    let svg_sky_pos = new SvgSkyPos()
}
