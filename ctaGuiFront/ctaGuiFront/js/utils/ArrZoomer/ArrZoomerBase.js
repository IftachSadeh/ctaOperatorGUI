// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
// window.load_script({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global times */
/* global tau */
/* global unique */
/* global is_def */
/* global run_when_ready */
/* global tel_info */
/* global ArrZoomerMain */
/* global ArrZoomerMini */
/* global ArrZoomerChes */
/* global ArrZoomerTree */

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

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerBase = function(opt_in0) {
    let this_top = this
    let my_unique_id = unique()
    let run_loop = opt_in0.run_loop
    let widget_id = opt_in0.widget_id
    let widget_source = opt_in0.widget_source
    let locker = opt_in0.locker
    let is_south = opt_in0.is_south
    let widget_type = opt_in0.widget_type
    let sock = opt_in0.sock
    let svg = opt_in0.svg

    let user_opts = opt_in0.user_opts
    let do_ele = user_opts.do_ele
    let inst_filter = user_opts.inst_filter

    this_top.has_init = false

    this_top.has_site_svg = !is_south
    this_top.site_bck_svg = is_south ? '' : '/static/site_layout_North.svg'

    let arr_zoomer_id = 'arr_zoomer' + my_unique_id
    this_top.arr_zoomer_id = arr_zoomer_id

    let lock_init_key = opt_in0.lock_init_key
    set_locks()

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let elements = {
    }
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
    let svgs = {
    }
    this_top.svgs = svgs
    svgs.main = {
    }
    svgs.mini = {
    }
    svgs.ches = {
    }
    svgs.tree = {
    }
    svgs.lens = {
    }
    svgs.g_svg = svg.append('g')

    let interpolate01 = d3.interpolate(0, 1)
    this_top.interpolate01 = interpolate01

    let zooms = {
    }
    this_top.zooms = zooms
    zooms.target = ''

    let insts = {
    }
    this_top.insts = insts
  
    insts.props = {
    }
    insts.props0 = {
    }
    insts.tau_fracs = {
    }
    insts.prop_titles = {
    }
    insts.all_ids = []
    insts.all_ids0 = []
    insts.all_props = []
    insts.all_props0 = []
    insts.prop0 = 'health'
    insts.prop_title0 = 'Health'
    insts.tau_space = tau / 50

    insts.data = {
    }
    insts.data.tel = []
    insts.data.id_indices = {
    }
    insts.data.data_base_s1 = {
    }
    insts.data.prop_data_s1 = {
    }
    insts.data.prop_parent_s1 = {
    }
    insts.data.prop_title_s1 = {
    }

    insts.scale_r = {
    }
    insts.scale_r[0] = {
    }
    insts.scale_r[1] = {
    }

    insts.scale_r[0].health0 = 1.1
    insts.scale_r[0].health1 = 1.2
    insts.scale_r[0].health2 = 1.35
    insts.scale_r[0].line0 = 1.2
    insts.scale_r[0].line1 = 1.8
    insts.scale_r[0].percent = 0.6
    insts.scale_r[0].label = 1.95
    insts.scale_r[0].title = 2.05

    insts.scale_r[1].health0 = 1.5
    insts.scale_r[1].health1 = 1.65
    insts.scale_r[1].inner_h0 = 1.25
    insts.scale_r[1].inner_h1 = 1.3

    this_top.site_scale = is_south ? 4 / 9 : 1
  
    this_top.tel_rs = {
        s00: [
            12,
            13,
            14,
            14,
            // is_south ? 30 : 14,
        ],
    }
    this_top.tel_rs.s00 = this_top.tel_rs.s00.map(
        function(x) {
            return x * this_top.site_scale
        }
    )

    let tel_id_types = tel_info.get_ids()

    // // ------------------------------------------------------------------
    // //
    // // ------------------------------------------------------------------
    // function isTelTypeIn(tag, tel_id) {
    //   let tel_types_ele = {
    //     main: ['LST'],
    //   }

    //   let tel_index = tel_types_ele[tag].indexOf(this_top.tel_types[tel_id])
    //   return (tel_index !== -1)
    // }
    // this_top.isTelTypeIn = isTelTypeIn


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init_inst_props(data_in) {
        let tel_prop_types = data_in.tel_prop_types
    
        insts.all_props0.push(insts.prop0)
        insts.all_ids0.push('')
        insts.props[''] = []
        insts.props0[''] = [ insts.prop0 ]
        insts.prop_titles[''] = {
        }

        // --FIXME-- currently sorting by the property name, but
        // should actually be by property title ...
        function prop_sort(arr_in) {
            arr_in.sort().sort(function(a, _) {
                if (a === insts.prop0) {
                    return -1
                }
                else {
                    return 1
                }
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

            insts.props[id_now] = []
            insts.props0[id_now] = [ insts.prop0 ]
            insts.prop_titles[id_now] = {
            }

            insts.all_ids.push(id_now)
            insts.all_ids0.push(id_now)

            $.each(typeV, function(i, type_now) {
                insts.props[id_now].push(type_now.id)
                insts.props0[id_now].push(type_now.id)
                insts.prop_titles[id_now][type_now.id] = type_now.title

                if (insts.props[''].indexOf(type_now.id) === -1) {
                    insts.props[''].push(type_now.id)
                    insts.props0[''].push(type_now.id)
                    insts.prop_titles[''][type_now.id] = type_now.title
                }

                if (insts.all_props.indexOf(type_now.id) === -1) {
                    insts.all_props.push(type_now.id)
                    insts.all_props0.push(type_now.id)
                }
            })
            prop_sorts([ insts.props[id_now], insts.props0[id_now] ])

            insts.prop_titles[id_now][insts.prop0] = insts.prop_title0
            insts.tau_fracs[id_now] = tau / insts.props[id_now].length
            insts.prop_titles[''][insts.prop0] = insts.prop_title0
        })
        insts.tau_fracs[''] = tau / insts.props[''].length

        prop_sorts([
            insts.props[''], insts.props0[''],
            insts.all_props, insts.all_props0,
        ])

        insts.props['avg'] = insts.props[''] // .slice()
        insts.props0['avg'] = insts.props0[''] // .slice()
        insts.tau_fracs['avg'] = insts.tau_fracs['']

        return
    }


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_tel_data(data_in, isInit) {
        if (isInit) {
            insts.data.tel = []
            insts.data.avg = {
            }
            insts.data.id_indices = {
            }
        }

        $.each(data_in, function(id, data_now) {
            // if (!isTelTypeIn('main', id)) {
            //   console.log(id,data_now)
            // }
            // if (!isTelTypeIn('main', id)) return
      
            // console.log('==',id,data_now)
            let tel_data = {
            }
            tel_data.id = id

            $.each(insts.props0[tel_data.id], function(index, porp_now) {
                tel_data[porp_now] = is_def(data_now[porp_now])
                    ? Math.round(data_now[porp_now])
                    : 0
            })

            if (isInit) {
                insts.data.id_indices[id] = insts.data.tel.length
                insts.data.tel.push(tel_data)
            }
            else {
                let origIndex = insts.data.id_indices[id]
                insts.data.tel[origIndex] = tel_data
            }
        })

        // average of each property
        insts.data.avg.id = 'avg'
        let props_now = insts.props0[insts.data.avg.id]
        $.each(props_now, function(index, porp_now) {
            insts.data.avg[porp_now] = 0
            $.each(insts.data.tel, function(id, data_now) {
                // console.log('    ++',id,porp_now,data_now[porp_now])
                if (
                    data_now[porp_now] !== undefined
                    && typeof data_now[porp_now] === 'number'
                ) {
                    insts.data.avg[porp_now] += data_now[porp_now]
                }
            })
            // console.log('--',porp_now,insts.data.avg[porp_now] , insts.data.tel.length)
            insts.data.avg[porp_now] /= insts.data.tel.length
        })
        // console.log('SSS-------------SS',insts.data, insts.props0)

        return
    }
    this_top.set_tel_data = set_tel_data


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function get_tel_props(keys, tel_id) {
        return keys.filter(function(k) {
            return insts.props[tel_id].indexOf(k) !== -1
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

        if (xy === 'x') {
            return label_x
        }
        if (xy === 'y') {
            return label_y
        }
        else if (xy === 'xy') {
            return [ label_x, label_y ]
        }
        else {
            return null
        }
    }
    this_top.get_prop_pos_shift = get_prop_pos_shift

    zooms.len = {
    }
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
    }
    else {
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
        zooms.target = insts.data.tel[0].id


        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function add_user_opts(opt_in, ele_tag) {
            if (!is_def(user_opts[ele_tag])) {
                return
            }

            $.each(user_opts[ele_tag], function(i, d) {
                opt_in[i] = d
            })

            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let ele_opts_main = {
            run_loop: run_loop,
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
            if (is_def(user_opts.trans.main)) {
                eleMain.set_transform(user_opts.trans.main)
            }
        }
    
        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (do_ele.tree) {
            let ele_opts_tree = {
                run_loop: run_loop,
                widget_id: widget_id,
                locker: locker,
                is_south: is_south,
                my_unique_id: my_unique_id,
                ele_base: this_top,
            }
            add_user_opts(ele_opts_tree, 'tree')
      
            let eleTree = new ArrZoomerTree(ele_opts_tree)
            eleTree.init_data(data_in)

            if (is_def(user_opts.trans.tree)) {
                eleTree.set_transform(user_opts.trans.tree)
            }
        }
    
        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (do_ele.ches) {
            let ele_opts_ches = {
                run_loop: run_loop,
                widget_id: widget_id,
                locker: locker,
                is_south: is_south,
                ele_base: this_top,
            }
            add_user_opts(ele_opts_ches, 'ches')

            let eleChes = new ArrZoomerChes(ele_opts_ches)
            eleChes.init_data({
                instrument_data: {
                    tel: insts.data.tel,
                    vor_dblclick: insts.data.dblclick,
                },
                tel_id_types: tel_id_types,
            })

            if (is_def(user_opts.trans.ches)) {
                eleChes.set_transform(user_opts.trans.ches)
            }
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (do_ele.mini) {
            let ele_opts_mini = {
                run_loop: run_loop,
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
                    tel: insts.data.tel,
                    vor: {
                        data: insts.data.vor.data,
                    },
                    xyr_physical: insts.data.mini,
                    vor_dblclick: insts.data.dblclick,
                },
                tel_id_types: tel_id_types,
            })

            if (is_def(user_opts.trans.mini)) {
                eleMini.set_transform(user_opts.trans.mini)
            }
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (do_ele.lens) {
            let ele_opts_lens = {
                run_loop: run_loop,
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
                    tel: insts.data.tel,
                    vor: {
                        data: insts.data.vor.data,
                    },
                    xyr_physical: insts.data.lens,
                    vor_dblclick: insts.data.dblclick,
                },
                tel_id_types: tel_id_types,
            })

            if (is_def(user_opts.trans.lens)) {
                eleLens.set_transform(user_opts.trans.lens)
            }
        }

        return
    }

    // ------------------------------------------------------------------
    // initialisation locks for this element and its children
    // ------------------------------------------------------------------
    function set_locks() {
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

        locker.add(lock_init_key)
        run_when_ready({
            pass: function() {
                return locker.are_free(init_ele_keys)
            },
            execute: function() {
                locker.remove(lock_init_key)
            },
        })

        return
    }

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
        if (!locker.is_free('in_init')) {
            return
        }

        if (data_in.type === 's00') {
            run_loop.push({
                tag: '_s00_update_' + my_unique_id,
                data: data_in,
            })
        }
        else if (data_in.type === 's11') {
            run_loop.push({
                tag: '_s11_update_' + my_unique_id,
                data: data_in,
            })
        }
        else if (data_in.type === 'sub_arr') {
            run_loop.push({
                tag: 'sub_arr_update' + my_unique_id,
                data: data_in,
            })
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
        if (get_ele('main').get_zoom_state() === 0) {
            return
        }

        if (!locker.are_free([ 'zoom', 'auto_zoom_target', 'data_change' ])) {
            setTimeout(function() {
                update_s1(data_in)
            }, 10)
            return
        }

        let new_data = data_in.data.data
        let tel_id = data_in.data.id
        let tel_index = insts.data.id_indices[tel_id]

        // if by the time the update has arrived,
        // were already gone from this element...
        if (!is_def(insts.data.prop_data_s1[tel_id])) {
            // console.log('-+-> update_s1: could not find',tel_id,'in insts.data.prop_data_s1')
            return
        }
        // console.log('````',data_in.data,insts.data.prop_data_s1[tel_id]);

        locker.add('data_change')

        // ------------------------------------------------------------------
        // update the underlying data
        // ------------------------------------------------------------------
        let props_now = get_tel_props(
            Object.keys(insts.data.prop_data_s1[tel_id]), tel_id)
    
        $.each(props_now, function(index, porp_now) {
            // update the data container with the s0 updated health
            insts.data.prop_data_s1[tel_id][porp_now].val = (
                insts.data.tel[tel_index][porp_now]
            )

            // now go through the hirch
            let data_now = insts.data.prop_data_s1[tel_id][porp_now]
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
            id: 'sub_arr',
            data: data_in.data,
            updtId: false,
        })

        return
    }

    function set_tel_layout(id_now) {
        get_ele('main').set_tel_layout({
            id: id_now,
            data: null,
            updtId: true,
        })
    }
    this_top.set_tel_layout = set_tel_layout

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    run_loop.init({
        tag: 'set_state' + my_unique_id,
        func: set_state_once,
        n_keep: 1,
    })

    function set_state() {
        run_loop.push({
            tag: 'set_state' + my_unique_id,
        })
    }
    this_top.set_state = set_state

    function set_state_once() {
        // create delay if currently in data update or a previous call
        if (!locker.are_free([ 'set_state_lock', 'data_change' ])) {
            setTimeout(function() {
                set_state()
            }, times.anim)
            return
        }
        // console.log("set_state");

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
            id: 'set_state_lock',
            delay: times.anim * 2,
        })
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    run_loop.init({
        tag: '_s1_props_' + my_unique_id,
        func: props_s1_once,
        n_keep: -1,
    })

    function props_s1(opt_in) {
        // console.log('set_state',get_ele('main').get_zoom_state(),get_scale())
        run_loop.push({
            tag: '_s1_props_' + my_unique_id,
            data: opt_in,
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
            if (do_tel_hierarchy) {
                get_ele('tree').tel_hierarchy(opt_in)
            }
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
        tag: '_get_data_s1_' + my_unique_id,
        func: get_data_s1_once,
        n_keep: 1,
    })

    function get_data_s1(widget_id_in, data_in) {
        // just in case... should not be needed
        if (widget_id_in !== widget_id) {
            console.error('id mismatch', widget_id_in, widget_id)
            return
        }
        // console.log('-client- get_data_s1',data_in)

        if (get_ele('main').get_zoom_state() === 1) {
            run_loop.push({
                tag: '_get_data_s1_' + my_unique_id,
                data: data_in,
            })
        }
    }
    this_top.get_data_s1 = get_data_s1

    function get_data_s1_once(data_in) {
        let is_zoom_state = (get_ele('main').get_zoom_state() === 1)
        let is_data_id = (get_ele('main').syncs.zoom_target !== data_in.data.id)
        if (is_zoom_state && is_data_id) {
            get_ele('main').syncs.zoom_target = data_in.data.id

            get_ele('main').s10_main(data_in.data)

            props_s1({
                tel_id: data_in.data.id,
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
    let prev_sync = {
    }
    function get_sync_tel_focus(data_in) {
        if (document.hidden || sock.con_stat.is_offline()) {
            return
        }
        let is_old_sync = sock.is_old_sync(prev_sync, data_in.data)
        if (is_old_sync) {
            return
        }
        
        let has_widget_id = (
            data_in.sess_widget_ids.indexOf(widget_id) >= 0
        )
        let same_widget_id = (widget_id === data_in.widget_id)
        let same_zoomer_id = (data_in.data.arr_zoomer_id === arr_zoomer_id)
        if (!has_widget_id || same_widget_id || same_zoomer_id) {
            return
        }

        let type = data_in.type
        prev_sync[type] = data_in.data

        // react to specific events by type
        if (type === 'sync_tel_focus') {
            sync_tel_focus(data_in.data)
        }

        return
    }
    this_top.get_sync_tel_focus = get_sync_tel_focus

    // ------------------------------------------------------------------
    // action to take upon getting a 'sync_tel_focus' sync
    // ------------------------------------------------------------------
    function sync_tel_focus(data_in) {
        let target = data_in.target
        let zoom_state = data_in.zoom_state

        let scale = zooms.len['0.0']
        if (zoom_state === 1) {
            scale = zooms.len['1.0']
        }

        get_ele('main').zoom_to_target_main({
            target: target,
            scale: scale,
            duration_scale: 1,
            end_func: function() {
                get_ele('main').ask_data_s1()
            },
        })
        return
    }

    // ------------------------------------------------------------------
    // ask for update for state1 data for a given module
    // ------------------------------------------------------------------
    function sock_ask_init_data() {
        if (sock.con_stat.is_offline()) {
            setTimeout(function() {
                sock_ask_init_data()
            }, 10)
            return
        }

        let init_opts = {
            arr_zoomer_id: arr_zoomer_id,
        }
        if (is_def(inst_filter)) {
            init_opts.inst_filter = inst_filter
        }

        let emit_data = {
            widget_source: widget_source,
            widget_name: widget_type,
            widget_id: widget_id,
            method_name: 'arr_zoomer_ask_init_data',
            method_arg: init_opts,
        }
        sock.socket.emit('widget', emit_data)

        return
    }

    // ------------------------------------------------------------------
    // get update for state1 data which was explicitly asked for by a given module
    // ------------------------------------------------------------------
    sock.socket.on('arr_zoomer_get_init_data', function(data_in) {
        if (data_in.data.arr_zoomer_id !== arr_zoomer_id) {
            return
        }
        run_when_ready({
            pass: function() {
                return !sock.con_stat.is_offline()
            },
            execute: function() {
                init_data(data_in.data)
            },
        })
    })

    // ------------------------------------------------------------------
    // ask for update for state1 data for a given module
    // ------------------------------------------------------------------
    function sock_ask_data_s1(opt_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        let data = {
        }
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
        if (sock.con_stat.is_offline()) {
            return
        }

        let main_widget_state = get_ele('main').get_widget_state()
    
        let tree_widget_state = {
        }
        if (get_ele('tree')) {
            tree_widget_state = get_ele('tree').get_widget_state()
        }
        else {
            let get_widget_state = function() {
                return {
                    zoom_target_prop: '',
                }
            }
            tree_widget_state['zoom_target_prop'] = get_widget_state()
        }

        let data_widget = {
        }
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
    sock.socket.on('arr_zoomer_get_data_s1', function(data_in) {
        if (sock.con_stat.is_offline()) {
            return
        }
        if (data_in.arr_zoomer_id !== arr_zoomer_id) {
            return
        }
        
        if (data_in.id !== '' && data_in.type === 's11') {
            // console.log('-server- get_data_s1 ',data_in);
            if (is_def(sock.all_widgets[widget_type].widgets[data_in.widget_id])) {
                this_top.get_data_s1(data_in.widget_id, data_in)
            }
        }
    })

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    sock.socket.on('arr_zoomer_update_data', function(data_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        let widgets = sock.all_widgets[widget_type].widgets
        $.each(widgets, function(widget_id_now, module_now) {
            if (data_in.sess_widget_ids.indexOf(widget_id_now) >= 0) {
                this_top.update_data(data_in)
            }
        })
    })

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    run_loop.init({
        tag: 'sync_state_send' + my_unique_id,
        func: sync_state_send_now,
        n_keep: 1,
        wait: times.wait_sync_state,
    })

    function sync_state_send(data_in) {
        run_loop.push({
            tag: 'sync_state_send' + my_unique_id,
            data: data_in,
        })
    }
    this_top.sync_state_send = sync_state_send

    function sync_state_send_now(data_in) {
        if (sock.con_stat.is_offline()) {
            return
        }

        if (data_in.type === 'sync_tel_focus') {
            let sync_locks = [
                'in_init', 'zoom', 'auto_zoom_target',
                'set_state_lock', 'data_change',
            ]
            if (!locker.are_free(sync_locks)) {
                setTimeout(function() {
                    sync_state_send(data_in)
                }, times.anim)
                return
            }

            if (sock.is_same_sync(prev_sync, data_in)) {
                return
            }
        }

        prev_sync[data_in.type] = data_in
        sock.sock_sync_state_send({
            widget_id: widget_id,
            type: data_in.type,
            data: data_in,
        })

        return
    }

    // ------------------------------------------------------------------
    // after all is setup, ask for the initialisation data
    // ------------------------------------------------------------------
    sock_ask_init_data()

    return
}



