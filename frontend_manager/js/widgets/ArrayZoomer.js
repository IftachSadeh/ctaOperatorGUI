'use strict'
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// stric mode for the following script or function (must come at the very begining!)
// see: http://www.w3schools.com/js/js_strict.asp
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// main_script_tag used locally (will be overriden by other scripts...)
// must be compatible with the name of this js file, according to:
//    "/js/widgets/"+main_script_tag+".js"
var main_script_tag = 'ArrayZoomer'
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
    script: '/js/utils/ArrZoomerUtil/ArrZoomerBase.js',
})

// ------------------------------------------------------------------
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 2
    let w0 = 12
    let div_key = 'arr_zoomer_div'

    opt_in.widget_func = {
        sock_func: sock_arr_zoomer,
        main_func: main_arr_zoomer,
    }
    opt_in.widget_div_id = opt_in.widget_id + 'widget_div'
    opt_in.ele_props = {
    }

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

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
let sock_arr_zoomer = function(_) {
    return
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
let main_arr_zoomer = function(opt_in) {
    let this_top = this
    let my_unique_id = unique()
    let widget_type = opt_in.widget_type
    let tag_arr_zoomer_svg = opt_in.base_name
    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele
    let icon_divs = opt_in.icon_divs

    let is_south = window.SITE_TYPE === 'S'

    let sgv_tag = {
    }
    $.each(widget_ele, function(index, ele_now) {
        sgv_tag[ele_now.id] = {
            id: tag_arr_zoomer_svg + ele_now.id,
            widget: ele_now.widget,
            whRatio: ele_now.w / ele_now.h,
        }
    })

    let svg_dims = {
        w: 500,
    }
    let arr_zoomer_lock_init_key = 'in_init_arr_zoomer' + my_unique_id

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
            more: true,
        },
        trans: {
        },
        inst_filter: {
            // inst_ids: [ 'Lx01', ],
            // inst_ids: [ 'Lx01', 'Lx02', 'Lx03', 'Lx04', 'Mx01' ],
            // inst_ids: [ 'Lx01', 'Mx04', 'Mx10', 'Mx11', 'Mx17' ],
            // inst_ids: [ 'Px00', 'Px01' ],
            // inst_types: [ 'AUX', 'PROC' ],
            // inst_types: [ 'LST', 'MST', 'SST' ],
        },
        main: {
            // dblclick_zoom_in_out: false,
        },
        ches: {
            n_cols: is_south ? 18 : 8,
            aspect_ratio: is_south ? 0.25 : 0.2,
            font_rect_scale: is_south ? 0.7 : 0.6,
        },
        mini: {
            // static_zoom: false,
        },
        tree: {
            // aspect_ratio: 6/5,
            has_title: false,
        },
        lens: {
            aspect_ratio: 4,
            has_titles: true,
            // pointerEvents: true,
        },
        more: {
            aspect_ratio: 0.5,
            // has_title: false,
        },
        base_ele_width: 100,
    }

    // if (!window.D3_VERS_5) {
    //     arr_zoomer_ele_opts.do_ele = {
    //         main: true,
    //         ches: !true,
    //         mini: !true,
    //         tree: !true,
    //         lens: !true,
    //         more: !true,
    //     }
    // }

    // symmetric arrangement for elements
    let base_ele_width = arr_zoomer_ele_opts.base_ele_width
    
    let mini_trans_x = 5
    let mini_scale = 1
    let mini_h = mini_scale * base_ele_width
    
    let ches_trans_x = mini_scale * base_ele_width + mini_trans_x
    let ches_scale = (svg_dims.w - ches_trans_x - mini_trans_x) / base_ele_width
    let ches_h = ches_scale * base_ele_width * arr_zoomer_ele_opts.ches.aspect_ratio
    
    let mini_trans_y = (mini_h < ches_h) * (0.5 * Math.abs(mini_h - ches_h))
    let ches_trans_y = (mini_h > ches_h) * (0.5 * Math.abs(mini_h - ches_h))
    
    let lens_scale = 0.18
    let lens_trans_x = mini_trans_x + 5
    let lens_trans_y = mini_trans_y + 5
    
    let main_scale = 2.5
    let main_trans_y = Math.max(mini_h, ches_h)
    
    let tree_trans_x = main_scale * base_ele_width
    
    let more_trans_y = main_trans_y + main_scale * base_ele_width
    let more_scale = 5
    let more_h = more_scale * base_ele_width * arr_zoomer_ele_opts.more.aspect_ratio

    arr_zoomer_ele_opts.trans = {
        main: (
            'translate(0,' + main_trans_y
            + ')scale(' + main_scale + ')'
        ),
        tree: (
            'translate(' + tree_trans_x + ',' + main_trans_y
            + ')scale(' + main_scale + ')'
        ),
        ches: (
            'translate(' + ches_trans_x + ',' + ches_trans_y
            + ')scale(' + ches_scale + ')'
        ),
        mini: (
            'translate(' + mini_trans_x + ',' + mini_trans_y
            + ')scale(' + mini_scale + ')'
        ),
        lens: (
            'translate(' + lens_trans_x + ',' + lens_trans_y
            + ')scale(' + lens_scale + ')'
        ),
        more: (
            'translate(0,' + more_trans_y
            + ')scale(' + more_scale + ')'
        ),
    }

    svg_dims.h = more_trans_y + more_h

    // example:
    //     arr_zoomer_ele_opts.trans = {
    //         main: 'translate(0,100)scale(2.5)',
    //         ches: 'translate(100,0)scale(4.0)',
    //         tree: 'translate(250,100)scale(2.5)',
    //         mini: 'translate(5,0)scale(1)',
    //         lens: 'translate(10,5)scale(0.18)',
    //         more: 'translate(0,350)scale(5)',
    //     }


    // ------------------------------------------------------------------
    // delay counters
    // ------------------------------------------------------------------
    let locker = new Locker()
    locker.add('in_init')

    // function loop
    let run_loop = new RunLoop({
        tag: widget_id,
    })

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init_data(data_in) {
        let mult_inits = sock.multiple_inits({
            id: widget_id,
            data: data_in,
        })
        if (mult_inits) {
            return
        }

        // ------------------------------------------------------------------
        // create the main svg element
        // ------------------------------------------------------------------
        let svg_div_id = sgv_tag.arr_zoomer_div.id + '_svg'
        let svg_div = sgv_tag.arr_zoomer_div.widget.get_ele(svg_div_id)

        if (!is_def(svg_div)) {
            let parent = sgv_tag.arr_zoomer_div.widget.get_ele(
                sgv_tag.arr_zoomer_div.id
            )
            let svg_div = document.createElement('div')
            svg_div.id = svg_div_id

            dom_add(parent, svg_div)

            run_when_ready({
                pass: function() {
                    return is_def(
                        sgv_tag.arr_zoomer_div.widget.get_ele(svg_div_id)
                    )
                },
                execute: function() {
                    init_data(data_in)
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
        sock.set_icon_badge({
            data: data_in,
            icon_divs: icon_divs,
        })

        // ------------------------------------------------------------------
        // create the main svg element
        // ------------------------------------------------------------------
        let svg = d3
            .select(svg_div)
            .style('background', '#383B42')
            .append('svg')
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('viewBox', '0 0 ' + svg_dims.w + ' ' + svg_dims.h)
            .style('position', 'relative')
            .style('width', '100%')
            .style('height', '100%')
            .style('top', '0px')
            .style('left', '0px')
            // .attr("viewBox", "0 0 "+svg_dims.w+" "+svg_dims.h * whRatio)
            // .classed("svgInGridStack_inner", true)
            .style('background', '#383B42')
            // .style("background", "red").style("border","2px solid red")
            // .style('background', 'white') // XRRX XRRX XRRX XRRX
            .on('dblclick.zoom', null)
            .on('wheel', function(event) {
                event.preventDefault()
            })

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let arr_zoomer_base = new ArrZoomerBase({
            run_loop: run_loop,
            sgv_tag: sgv_tag,
            svg_dims: {
                w: svg_dims.w,
                h: svg_dims.h,
            },
            widget_id: widget_id,
            locker: locker,
            is_south: is_south,
            widget_type: widget_type,
            sock: sock,
            user_opts: arr_zoomer_ele_opts,
            lock_init_key: arr_zoomer_lock_init_key,
            svg: svg,
        })


        // let arr_zoomer_ele_opts_0 = {
        //     do_ele: {
        //         main: true,
        //         ches: !true,
        //         mini: !true,
        //         tree: true,
        //         lens: !true,
        //         more: !true,
        //     },
        //     trans: {
        //     },
        //     inst_filter: {
        //         // inst_ids: [ 'Lx01', ],
        //         // inst_ids: [ 'Lx01', 'Lx02', 'Lx03', 'Lx04', 'Mx01' ],
        //         inst_ids: [ 'Lx01', 'Mx04', 'Mx10', 'Mx11', 'Mx17' ],
        //         // inst_ids: [ 'Px00', 'Px01' ],
        //         // inst_types: [ 'AUX', 'PROC' ],
        //         // inst_types: [ 'LST', 'MST', 'SST' ],
        //     },
        //     main: {
        //         // dblclick_zoom_in_out: false,
        //     },
        //     ches: {
        //         n_cols: is_south ? 18 : 8,
        //         aspect_ratio: is_south ? 0.25 : 0.2,
        //         font_rect_scale: is_south ? 0.7 : 0.6,
        //     },
        //     mini: {
        //         // static_zoom: false,
        //     },
        //     tree: {
        //         // aspect_ratio: 6/5,
        //         has_title: false,
        //     },
        //     lens: {
        //         aspect_ratio: 4,
        //         has_titles: true,
        //         // pointerEvents: true,
        //     },
        //     more: {
        //         aspect_ratio: 0.5,
        //         // has_title: false,
        //     },
        //     base_ele_width: 100,
        // }
        // arr_zoomer_ele_opts_0.trans = {
        //     main: 'translate(40,360)scale(2.5)',
        //     // ches: 'translate(100,0)scale(4.0)',
        //     tree: 'translate(290,360)scale(2.5)',
        //     // mini: 'translate(5,0)scale(1)',
        //     // lens: 'translate(10,5)scale(0.18)',
        //     // more: 'translate(0,350)scale(5)',
        // }
        // let arr_zoomer_base_0 = new ArrZoomerBase({
        //     run_loop: run_loop,
        //     sgv_tag: sgv_tag,
        //     svg_dims: {
        //         w: svg_dims.w,
        //         h: svg_dims.h,
        //     },
        //     widget_id: widget_id,
        //     locker: locker,
        //     is_south: is_south,
        //     widget_type: widget_type,
        //     sock: sock,
        //     user_opts: arr_zoomer_ele_opts_0,
        //     lock_init_key: arr_zoomer_lock_init_key,
        //     svg: svg,
        // })


        // ------------------------------------------------------------------
        // expose the sync function
        // ------------------------------------------------------------------
        function update_sync_state(data_sync_in) {
            arr_zoomer_base.get_sync_tel_focus(data_sync_in)
            
            // if (data_sync_in.type == 'sync_arr_zoomer_prop') {
            //     let is_own_sync = (
            //         arr_zoomer_base.util_id
            //         === data_sync_in.data.util_id
            //     )
            //     // console.log('got sync: ', is_own_sync, data_sync_in.data)
            // }
        }
        this_top.update_sync_state = update_sync_state

        locker.remove('in_init')

        // ------------------------------------------------------------------
        // ------------------------------------------------------------------
        function auto_trans_test() {
            sock.socket.emit({
                name: 'set_active_widget',
                data: {
                    'widget_id': widget_id,
                },
            })

            if (!is_def(arr_zoomer_base.get_ele('main'))) {
                setTimeout(function() {
                    auto_trans_test()
                }, 10)
                return
            }
            arr_zoomer_base.get_ele('main').zoom_to_target_main({
                // target: 'init',
                target: 'Lx01',
                // target: 'Lx02',
                // target: 'Mx01',
                // scale: arr_zoomer_base.zooms.len['0.1.5'],
                scale: arr_zoomer_base.zooms.len['1.2'],
                // scale: arr_zoomer_base.zooms.len['0.0'],
                duration_scale: 0.5,
                // duration_scale: 1.5,
            })
            return
        }
        // auto_trans_test()
        // ------------------------------------------------------------------
        // ------------------------------------------------------------------

        return
    }
    this_top.init_data = init_data
}
