// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
// window.load_script({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global times */
/* global unique */
/* global is_def */
/* global run_when_ready */
/* global tel_info */

let load_script_tag = 'ArrZoomerBase'

window.load_script({
    source: load_script_tag,
    script: '/js/utils/ArrZoomer/ArrZoomerMain.js',
})
window.load_script({
    source: load_script_tag,
    script: '/js/utils/ArrZoomer/ArrZoomerMini.js',
})
window.load_script({
    source: load_script_tag,
    script: '/js/utils/ArrZoomer/ArrZoomerChes.js',
})
window.load_script({
    source: load_script_tag,
    script: '/js/utils/ArrZoomer/ArrZoomerTree.js',
})
// window.load_script({
//   source: main_script_tag,
//   script: '/js/arr_zoomer/utils_arr_zoomerLens.js'
// })

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerBase = function(opt_in0) {
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
    // let scale_r = instruments.scale_r

    this_top.has_init = false

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
    let svgs = {}
    this_top.svgs = svgs
    svgs.main = {}
    svgs.mini = {}
    svgs.ches = {}
    svgs.tree = {}
    svgs.lens = {}
    svgs.g_svg = svg.append('g')

    let interpolate01 = d3.interpolate(0, 1)
    this_top.interpolate01 = interpolate01

    let zooms = {}
    this_top.zooms = zooms
    zooms.target = ''

    let instruments = {}
    this_top.instruments = instruments
  
    instruments.props = {}
    instruments.props0 = {}
    instruments.tau_fracs = {}
    instruments.prop_titles = {}
    instruments.all_ids = []
    instruments.all_ids0 = []
    instruments.all_props = []
    instruments.all_props0 = []
    instruments.prop0 = 'health'
    instruments.prop_title0 = 'Health'
    instruments.tau_space = tau / 50

    instruments.data = {}
    instruments.data.tel = []
    instruments.data.id_indices = {}
    instruments.data.data_base_s1 = {}
    instruments.data.prop_data_s1 = {}
    instruments.data.prop_parent_s1 = {}
    instruments.data.prop_title_s1 = {}

    instruments.scale_r = {}
    instruments.scale_r[0] = {}
    instruments.scale_r[1] = {}

    instruments.scale_r[0].health0 = 1.1
    instruments.scale_r[0].health1 = 1.2
    instruments.scale_r[0].health2 = 1.35
    instruments.scale_r[0].line0 = 1.2
    instruments.scale_r[0].line1 = 1.8
    instruments.scale_r[0].percent = 0.6
    instruments.scale_r[0].label = 1.95
    instruments.scale_r[0].title = 2.05

    instruments.scale_r[1].health0 = 1.5
    instruments.scale_r[1].health1 = 1.65
    instruments.scale_r[1].inner_h0 = 1.25
    instruments.scale_r[1].inner_h1 = 1.3

    this_top.site_scale = is_south ? 4 / 9 : 1
  
    this_top.tel_rs = { s00: [ 12, 13, 14, 14 ] }
    this_top.tel_rs.s00 = this_top.tel_rs.s00.map(
        function(x) { return x * this_top.site_scale }
    )

    let tel_id_types = tel_info.get_ids()

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    let lock_init_keys = {
        main: 'in_arr_zoomer_init_main' + my_unique_id,
        ches: 'in_arr_zoomer_init_ches' + my_unique_id,
        mini: 'in_arr_zoomer_init_mini' + my_unique_id,
        tree: 'in_arr_zoomer_init_tree' + my_unique_id,
        lens: 'in_arr_zoomer_init_lens' + my_unique_id,
    }
    this_top.lock_init_keys = lock_init_keys

    let init_ele_keys = []
    $.each(do_ele, function(i, d) {
        if (d) {
            init_ele_keys.push(lock_init_keys[i])
            locker.add(lock_init_keys[i])
        }
    })

    run_when_ready({
        pass: function() {
            return locker.are_free(init_ele_keys)
        },
        execute: function() {
            locker.remove(lock_init_key)
        },
    })


    // // ------------------------------------------------------------------
    // // 
    // // ------------------------------------------------------------------
    // function isTelTypeIn(tag, tel_Id) {
    //   let tel_types_ele = {
    //     main: ['LST'],
    //   }

    //   let tel_index = tel_types_ele[tag].indexOf(this_top.tel_types[tel_Id])
    //   return (tel_index !== -1)
    // }
    // this_top.isTelTypeIn = isTelTypeIn


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init_inst_props(data_in) {
        let tel_prop_types = data_in.tel_prop_types
    
        instruments.all_props0.push(instruments.prop0)
        instruments.all_ids0.push('')
        instruments.props[''] = []
        instruments.props0[''] = [ instruments.prop0 ]
        instruments.prop_titles[''] = {}

        // --FIXME-- currently sorting by the property name, but
        // should actually be by property title ...
        function prop_sort(arr_in) {
            arr_in.sort().sort(function(a, b) {
                if (a === instruments.prop0) return -1
                else return 1
            })
        }
        function prop_sorts(arr_inV) {
            $.each(arr_inV, function(i, arrNow) {
                prop_sort(arrNow)
            })
        }

        $.each(tel_prop_types, function(id_now, typeV) {
            // if (!isTelTypeIn('main', id_now)) return
            // console.log(isTelTypeIn('main', id_now),id_now, typeV)

            instruments.props[id_now] = []
            instruments.props0[id_now] = [ instruments.prop0 ]
            instruments.prop_titles[id_now] = {}

            instruments.all_ids.push(id_now)
            instruments.all_ids0.push(id_now)

            $.each(typeV, function(i, type_now) {
                instruments.props[id_now].push(type_now.id)
                instruments.props0[id_now].push(type_now.id)
                instruments.prop_titles[id_now][type_now.id] = type_now.title

                if (instruments.props[''].indexOf(type_now.id) === -1) {
                    instruments.props[''].push(type_now.id)
                    instruments.props0[''].push(type_now.id)
                    instruments.prop_titles[''][type_now.id] = type_now.title
                }

                if (instruments.all_props.indexOf(type_now.id) === -1) {
                    instruments.all_props.push(type_now.id)
                    instruments.all_props0.push(type_now.id)
                }
            })
            prop_sorts([ instruments.props[id_now], instruments.props0[id_now] ])

            instruments.prop_titles[id_now][instruments.prop0] = instruments.prop_title0
            instruments.tau_fracs[id_now] = tau / instruments.props[id_now].length
            instruments.prop_titles[''][instruments.prop0] = instruments.prop_title0
        })
        instruments.tau_fracs[''] = tau / instruments.props[''].length

        prop_sorts([ instruments.props[''], instruments.props0[''], instruments.all_props, instruments.all_props0 ])

        instruments.props['avg'] = instruments.props[''] // .slice()
        instruments.props0['avg'] = instruments.props0[''] // .slice()
        instruments.tau_fracs['avg'] = instruments.tau_fracs['']

        return
    }



    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_tel_data(data_in, isInit) {
        if (isInit) {
            instruments.data.tel = []
            instruments.data.avg = {}
            instruments.data.id_indices = {}
        }

        $.each(data_in, function(id, data_now) {
            // if (!isTelTypeIn('main', id)) {
            //   console.log(id,data_now)
            // }
            // if (!isTelTypeIn('main', id)) return
      
            // console.log('==',id,data_now)
            let tel_data = {}
            tel_data.id = id

            $.each(instruments.props0[tel_data.id], function(index, porp_now) {
                tel_data[porp_now] = is_def(data_now[porp_now])
                    ? Math.round(data_now[porp_now])
                    : 0
            })

            if (isInit) {
                instruments.data.id_indices[id] = instruments.data.tel.length
                instruments.data.tel.push(tel_data)
            } else {
                let origIndex = instruments.data.id_indices[id]
                instruments.data.tel[origIndex] = tel_data
            }
        })

        // average of each property
        instruments.data.avg.id = 'avg'
        let props_now = instruments.props0[instruments.data.avg.id]
        $.each(props_now, function(index, porp_now) {
            instruments.data.avg[porp_now] = 0
            $.each(instruments.data.tel, function(id, data_now) {
                // console.log('    ++',id,porp_now,data_now[porp_now])
                if (
                    data_now[porp_now] !== undefined &&
          typeof data_now[porp_now] === 'number'
                ) {
                    instruments.data.avg[porp_now] += data_now[porp_now]
                }
            })
            // console.log('--',porp_now,instruments.data.avg[porp_now] , instruments.data.tel.length)
            instruments.data.avg[porp_now] /= instruments.data.tel.length
        })
        // console.log('SSS-------------SS',instruments.data, instruments.props0)

        return
    }
    this_top.set_tel_data = set_tel_data


    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function get_tel_props(keys, tel_Id) {
        return keys.filter(function(k) {
            return instruments.props[tel_Id].indexOf(k) !== -1
        })
    }
    this_top.get_tel_props = get_tel_props
  
    function get_tau_frac(n_props) {
        return tau / n_props
    }
    this_top.get_tau_frac = get_tau_frac

    function get_prop_pos_shift(xy, r, n_prop_now, n_props) {
        let angle = (n_prop_now + 0.5) * get_tau_frac(n_props) + tau / 4
        let label_x = r * Math.cos(angle)
        let label_y = r * Math.sin(angle)

        if (xy === 'x') return label_x
        if (xy === 'y') return label_y
        else if (xy === 'xy') return [ label_x, label_y ]
        else return null
    }
    this_top.get_prop_pos_shift = get_prop_pos_shift

    zooms.len = {}
    zooms.len['0.0'] = 1
    if (is_south) {
        zooms.len['0.1'] = 2 // - 0.4
        zooms.len['0.2'] = 12 // - 4
        zooms.len['1.0'] = 15 // - 6
        zooms.len['1.1'] = zooms.len['1.0'] + 0.1
        zooms.len['1.2'] = zooms.len['1.0'] + 2
        zooms.len['1.3'] = 20
    // zooms.len["0.1"]  = 4  //- 4
    // zooms.len["0.2"]  = 10 //- 15.5
    // zooms.len["1.0"]  = 12 //- 16.5
    // zooms.len["1.1"]  = zooms.len["1.0"] + 0.1
    // zooms.len["1.2"]  = zooms.len["1.0"] + 2
    // zooms.len["1.3"]  = 90
    } else {
        zooms.len['0.1'] = 2 // - 0.4
        zooms.len['0.2'] = 5 // - 4
        zooms.len['1.0'] = 6.5 // - 6
        zooms.len['1.1'] = zooms.len['1.0'] + 0.1
        zooms.len['1.2'] = zooms.len['1.0'] + 1
        zooms.len['1.3'] = 9
    }
    zooms.len.prev = zooms.len['0.0']

    zooms.scale_extent = [ zooms.len['0.0'], zooms.len['1.3'] ]

    function is_state_up(scale, scaleTag) {
        return zooms.len.prev < zooms.len[scaleTag] && scale >= zooms.len[scaleTag]
    }
    this_top.is_state_up = is_state_up

    function is_state_down(scale, scaleTag) {
        return zooms.len.prev >= zooms.len[scaleTag] && scale < zooms.len[scaleTag]
    }
    this_top.is_state_down = is_state_down

    function is_state_change(scale, scaleTag) {
        return is_state_up(scale, scaleTag) || is_state_down(scale, scaleTag)
    }
    this_top.is_state_change = is_state_change

    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function init_data(data_in) {
        this_top.tel_types = data_in.tel_types

        init_inst_props(data_in)

        set_tel_data(data_in.arrProp, true)

        // arbitrary but safe initialization of target
        zooms.target = instruments.data.tel[0].id 


        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        function add_user_opts(opt_in, ele_tag) {
            if (!is_def(ele_opts[ele_tag])) return

            $.each(ele_opts[ele_tag], function(i, d) {
                opt_in[i] = d
            })

            return
        }

        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        let ele_opts_main = {
            run_loop: run_loop,
            sgv_tag: sgv_tag,
            widget_id: widget_id,
            locker: locker,
            is_south: is_south,
            my_unique_id: my_unique_id,
            no_render: !do_ele.main,
            widget_type: widget_type,
            ele_base: this_top,
        }
        add_user_opts(ele_opts_main, 'main')
    
        let eleMain = new ArrZoomerMain(ele_opts_main)
        eleMain.init_data(data_in)

        if (do_ele.main) {
            if(is_def(ele_opts.trans.main)) {
                eleMain.set_transform(ele_opts.trans.main)
            }
        }
    
        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        if (do_ele.tree) {
            let ele_opts_tree = {
                run_loop: run_loop,
                sgv_tag: sgv_tag,
                widget_id: widget_id,
                locker: locker,
                is_south: is_south,
                my_unique_id: my_unique_id,
                ele_base: this_top,
            }      
            add_user_opts(ele_opts_tree, 'tree')
      
            let eleTree = new ArrZoomerTree(ele_opts_tree)
            eleTree.init_data(data_in)

            if(is_def(ele_opts.trans.tree)) {
                eleTree.set_transform(ele_opts.trans.tree)
            }
        }
    
        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        if (do_ele.ches) {
            let ele_opts_ches = {
                run_loop: run_loop,
                sgv_tag: sgv_tag,
                widget_id: widget_id,
                locker: locker,
                is_south: is_south,
                ele_base: this_top,
            }
            add_user_opts(ele_opts_ches, 'ches')

            let eleChes = new ArrZoomerChes(ele_opts_ches)
            eleChes.init_data({
                instrument_data: {
                    tel: instruments.data.tel,
                    vor_dblclick: instruments.data.dblclick,
                },
                tel_id_types: tel_id_types,
            })

            if(is_def(ele_opts.trans.ches)) {
                eleChes.set_transform(ele_opts.trans.ches)
            }
        }

        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        if (do_ele.mini) {
            let ele_opts_mini = {
                run_loop: run_loop,
                sgv_tag: sgv_tag,
                widget_id: widget_id,
                locker: locker,
                is_south: is_south,
                my_unique_id: my_unique_id,
                ele_base: this_top,
            }
            add_user_opts(ele_opts_mini, 'mini')
      
            let eleMini = new ArrZoomerMini(ele_opts_mini)
            eleMini.init_data({
                instrument_data: {
                    tel: instruments.data.tel,
                    vor: { data: instruments.data.vor.data },
                    xyr_physical: instruments.data.mini,
                    vor_dblclick: instruments.data.dblclick,
                },
                tel_id_types: tel_id_types,
            })

            if(is_def(ele_opts.trans.mini)) {
                eleMini.set_transform(ele_opts.trans.mini)
            }
        }

        // ------------------------------------------------------------------
        // 
        // ------------------------------------------------------------------
        if (do_ele.lens) {
            let ele_opts_lens = {
                run_loop: run_loop,
                sgv_tag: sgv_tag,
                widget_id: widget_id,
                locker: locker,
                is_south: is_south,
                my_unique_id: my_unique_id,
                ele_base: this_top,
                isLens: 1,
                static_zoom: false,
            }
            add_user_opts(ele_opts_lens, 'lens')
      
            let eleLens = new ArrZoomerMini(ele_opts_lens)
            eleLens.init_data({
                instrument_data: {
                    tel: instruments.data.tel,
                    vor: { data: instruments.data.vor.data },
                    xyr_physical: instruments.data.lens,
                    // xyr: instruments.data.xyr,
                    vor_dblclick: instruments.data.dblclick,
                },
                tel_id_types: tel_id_types,
            })

            if(is_def(ele_opts.trans.lens)) {
                eleLens.set_transform(ele_opts.trans.lens)
            }
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
        tag: '_s00_update_' + my_unique_id, 
        func: update_s0, 
        n_keep: -1, 
        wait: 500,
    })
    run_loop.init({
        tag: '_s11_update_' + my_unique_id, 
        func: update_s1, 
        n_keep: 1, 
        wait: 500,
    })
    run_loop.init({
        tag: 'sub_arr_update' + my_unique_id,
        func: sub_arr_update,
        n_keep: 1,
        wait: 500,
    })

    function update_data(data_in) {
        if (!locker.is_free('in_init')) return

        if (data_in.type === 's00') {
            run_loop.push({ tag: '_s00_update_' + my_unique_id, data: data_in })
        } 
        else if (data_in.type === 's11') {
            run_loop.push({ tag: '_s11_update_' + my_unique_id, data: data_in })
        } 
        else if (data_in.type === 'sub_arr') {
            run_loop.push({ tag: 'sub_arr_update' + my_unique_id, data: data_in })
        } 
        else {
            console.error('undefined tag for data_in = ', data_in, ' !!!!!! ')
        }
    }
    this_top.update_data = update_data

    // ------------------------------------------------------------------
    // update the data for s0
    // ------------------------------------------------------------------
    function update_s0(data_in) {
        if (!locker.are_free([ 'zoom', 'auto_zoom_target', 'data_change' ])) {
            // console.log('delay-s0 ....',data_in.type,data_in.emit_time )
            setTimeout(function() {
                update_s0(data_in)
            }, 10)
            return
        }
        // console.log('do   -s0 ....',data_in.type,data_in.emit_time )

        locker.add('data_change')

        // ------------------------------------------------------------------
        // fill the updated properties (accumilate all updates in order,
        // so that if some id was updated multiple times,
        // the latest value will be kept
        // ------------------------------------------------------------------
        set_tel_data(data_in.data, false)

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        set_state()

        locker.remove('data_change')
    // locker.remove({id:"data_change",delay:1500}); // for testing... never delay this...
    }

    // ------------------------------------------------------------------
    // update the data for s1
    // ------------------------------------------------------------------
    function update_s1(data_in) {
        if (get_ele('main').get_zoom_state() === 0) return

        if (!locker.are_free([ 'zoom', 'auto_zoom_target', 'data_change' ])) {
            setTimeout(function() {
                update_s1(data_in)
            }, 10)
            return
        }

        let new_data = data_in.data.data
        let tel_Id = data_in.data.id
        let tel_index = instruments.data.id_indices[tel_Id]

        // if by the time the update has arrived, 
        // were already gone from this element...
        if (!is_def(instruments.data.prop_data_s1[tel_Id])) {
            // console.log('-+-> update_s1: could not find',tel_Id,'in instruments.data.prop_data_s1')
            return
        }
        // console.log('````',data_in.data,instruments.data.prop_data_s1[tel_Id]);

        locker.add('data_change')

        // ------------------------------------------------------------------
        // update the underlying data
        // ------------------------------------------------------------------
        let props_now = get_tel_props(
            Object.keys(instruments.data.prop_data_s1[tel_Id]), tel_Id)
    
        $.each(props_now, function(index, porp_now) {
            // update the data container with the s0 updated health
            instruments.data.prop_data_s1[tel_Id][porp_now].val = instruments.data.tel[tel_index][porp_now]

            // now go through the hirch
            let data_now = instruments.data.prop_data_s1[tel_Id][porp_now]
            update_data_now(data_now)

            function update_data_now(d) {
                if (is_def(new_data[d.id])) {
                    d.val = new_data[d.id]
                    // console.log('upddd',d.id,d)
                }
                if (d.children) {
                    d.children.forEach(function(dNow) {
                        update_data_now(dNow)
                    })
                }
                // no need to explicitly change the d[child_mame] element, since it is just a pointer to d[children]
                // let child_mame = "child_"+d.child_depth
                // if(d[child_mame]) {
                //   d[child_mame].forEach(function(dNow) { update_data_now(dNow); })
                // }
            }
        })

        get_ele('main').update_s1(data_in)
        if (get_ele('tree')) {
            get_ele('tree').update_s1(data_in)
        }

        locker.remove('data_change')
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function sub_arr_update(data_in) {
        if (!locker.are_free([ 'zoom', 'auto_zoom_target', 'data_change' ])) {
            setTimeout(function() {
                sub_arr_update(data_in)
            }, 10)
            return
        }

        get_ele('main').set_tel_layout({ 
            id: 'sub_arr', data: data_in.data, updtId: false,
        })

        return
    }

    function set_tel_layout(id_now) {
        get_ele('main').set_tel_layout({
            id: id_now, data: null, updtId: true, 
        })
    }
    this_top.set_tel_layout = set_tel_layout

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    run_loop.init({ 
        tag: 'set_state'+my_unique_id, func: set_state_once, n_keep: 1, 
    })

    function set_state() {
        run_loop.push({ tag: 'set_state'+my_unique_id })
    }
    this_top.set_state = set_state

    function set_state_once() {
    // create delay if currently in data update or a previous call of set_state_once
        if (!locker.are_free([ 'set_state_lock', 'data_change' ])) {
            // console.log('delay set_state_once',' :',locker.is_free({id:"set_state_lock"}),' - data_updateate:',locker.is_free({id:"set_state_lock"}))
            setTimeout(function() {
                set_state()
            }, times.anim_arc)
            return
        }
        // console.log("set_state");

        locker.add('set_state_lock')

        get_ele('main').set_state_once()
        if (get_ele('tree')) {
            get_ele('tree').set_state_once()
        }
        if (get_ele('mini')) {
            get_ele('mini').set_state_once()
        }
        if (get_ele('lens')) {
            get_ele('lens').set_state_once()
        }
        if (get_ele('ches')) {
            get_ele('ches').set_state_once()
        }

        locker.remove({
            id: 'set_state_lock', delay: times.anim_arc * 2,
        })
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    run_loop.init({ 
        tag: '_s1_props_'+my_unique_id, func: props_s1_once, n_keep: -1,
    })

    function props_s1(opt_in) {
    // console.log('set_state',get_ele('main').get_zoom_state(),get_scale())
        run_loop.push({
            tag: '_s1_props_'+my_unique_id, data: opt_in,
        })
    }
    // this.props_s1 = props_s1;
    this_top.props_s1 = props_s1

    function props_s1_once(opt_in) {
    // not sure i need "data_change" or others here .... FIXME
        if (!locker.are_free([ 's1_props_change', 'data_change' ])) {
            // console.log('delay props_s1_once....')
            props_s1(opt_in)
            return
        }

        locker.add('s1_props_change')

        let do_func = opt_in.do_func
        let do_bck_arc_click = is_def(do_func)
            ? do_func.indexOf('bck_arc_click') >= 0
            : true
        let do_tel_hierarchy = (
            is_def(do_func) ? do_func.indexOf('tel_hierarchy') >= 0 : true
        )

        if (get_ele('tree')) {
            if (do_tel_hierarchy) get_ele('tree').tel_hierarchy(opt_in)
        }

        if (do_bck_arc_click) {
            opt_in.can_ignore = false
            get_ele('main').bck_arc_click(opt_in)
        }

        locker.remove('s1_props_change')
    }

    // ------------------------------------------------------------------
    // activate a listener for getting the s1 data - this is needed 
    // in case the same data are sent more
    // then once (can happen if one element is requested, but 
    // by the time the transitions to open it
    // has ended, another was already requested too).
    // ------------------------------------------------------------------
    run_loop.init({
        tag: '_get_data_s1_'+my_unique_id, func: get_data_s1_once, n_keep: 1,
    })

    function get_data_s1(widget_id_in, data_in) {
    // just in case... should not be needed
        if (widget_id_in !== widget_id) {
            console.error('id mismatch', widget_id_in, widget_id)
            return
        }
        // console.log('-client- get_data_s1',data_in)

        if (get_ele('main').get_zoom_state() === 1) {
            run_loop.push({ tag: '_get_data_s1_'+my_unique_id, data: data_in })
        }
    }
    this_top.get_data_s1 = get_data_s1

    function get_data_s1_once(data_in) {
        if (
            get_ele('main').get_zoom_state() === 1 &&
      get_ele('main').syncs.zoom_target !== data_in.data.id
        ) {
            get_ele('main').syncs.zoom_target = data_in.data.id

            get_ele('main').s10_main(data_in.data)

            props_s1({
                tel_Id: data_in.data.id,
                click_in: false,
                prop_in: '',
                do_func: [ 'bck_arc_click' ],
                debug: 'get_data_s1_once',
            })
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let prev_sync = {}
    function get_sync_state(data_in) {
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
        if (type === 'sync_tel_focus') {
            // locker.add("get_sync_state");

            let target = data_in.data.target
            let zoom_state = data_in.data.zoom_state

            let scale = zooms.len['0.0']
            if (zoom_state === 1) scale = zooms.len['1.0']

            get_ele('main').zoom_to_target_main({
                target: target,
                scale: scale,
                duration_scale: 1,
                end_func: function() {
                    // locker.remove("get_sync_state");
                    get_ele('main').ask_data_s1()
                },
            })
        }

        return
    }
    this_top.get_sync_state = get_sync_state

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    run_loop.init({
        tag: 'sync_state_send' + my_unique_id,
        func: _sync_state_send,
        n_keep: 1,
        wait: times.wait_sync_state,
    })

    function sync_state_send(data_in) {
        run_loop.push({
            tag: 'sync_state_send' + my_unique_id, data: data_in,
        })
    }
    this_top.sync_state_send = sync_state_send

    function _sync_state_send(data_in) {
        if (sock.con_stat.is_offline()) return

        if (data_in.type === 'sync_tel_focus') {
            if (
                !locker.are_free([
                    'in_init',
                    'zoom',
                    'auto_zoom_target',
                    'set_state_lock',
                    'data_change',
                ])
            ) {
                setTimeout(function() {
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
            data: data_in,
        })

        return
    }

    // ------------------------------------------------------------------
    // ask for update for state1 data for a given module
    // ------------------------------------------------------------------
    function sock_ask_data_s1(opt_in) {
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
    this_top.sock_ask_data_s1 = sock_ask_data_s1


    // ------------------------------------------------------------------
    // 
    // ------------------------------------------------------------------
    function set_zoom_state() {
        if (sock.con_stat.is_offline()) return

        let main_widget_state = get_ele('main').get_widget_state()
    
        let tree_widget_state = {}
        if (get_ele('tree')) {
            tree_widget_state = get_ele('tree').get_widget_state()
        } 
        else {
            function get_widget_state() {
                return {
                    zoom_target_prop: '',
                }
            }
            tree_widget_state['zoom_target_prop'] = get_widget_state()
        }

        let data_widget = {}
        data_widget.widget_id = widget_id
        data_widget.zoom_state = main_widget_state.zoom_state
        data_widget.zoom_target = main_widget_state.zoom_target
        data_widget.zoom_target_prop = tree_widget_state.zoom_target_prop

        let emit_data = {
            widget_source: widget_source,
            widget_name: widget_type,
            widget_id: widget_id,
            method_name: 'arr_zoomer_set_widget_state',
            method_arg: data_widget,
        }

        sock.socket.emit('widget', emit_data)

        return
    }
    this_top.set_zoom_state = set_zoom_state

    // ------------------------------------------------------------------
    // get update for state1 data which was explicitly asked for by a given module
    // ------------------------------------------------------------------
    sock.socket.on('arr_zoomer_get_data_s1', function(data) {
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
    sock.socket.on('arr_zoomer_update_data', function(data) {
        if (sock.con_stat.is_offline()) return

        $.each(sock.all_widgets[widget_type].widgets, function(widget_id_now, module_now) {
            if (data.sess_widget_ids.indexOf(widget_id_now) >= 0) {
                this_top.update_data(data)
            }
        })
    })

    return
}

