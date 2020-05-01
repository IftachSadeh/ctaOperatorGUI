// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
/* global is_def */
/* global bck_pattern */


// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ArrZoomerMore = function(opt_in_top) {
    let this_top = this
    let locker = opt_in_top.locker
    // let is_south = opt_in_top.is_south

    let aspect_ratio = opt_in_top.aspect_ratio

    let ele_base = opt_in_top.ele_base
    let insts = ele_base.insts

    ele_base.set_ele(this_top, 'more')

    let lock_init_key = ele_base.lock_init_keys.more

    let svg_dims = {
        w: 500,
    }
    svg_dims.h = svg_dims.w * aspect_ratio
    // let add_more_outline = false
    // let show_vor = false

    // let font_scale = is_south ? 4 : 4
    // let title_size = (is_south ? 16 : 17) * font_scale

    let more_gs = ele_base.svgs.more

    more_gs.g = ele_base.svgs.g_svg.append('g')
    more_gs.more_g = more_gs.g.append('g')
    more_gs.more_g_base = more_gs.more_g.append('g')

    // ------------------------------------------------------------------
    // scale to 100x100 px (executed after create_more_map())
    // ------------------------------------------------------------------
    function g_trans() {
        let scale_more = 100 / svg_dims.w
        more_gs.more_g_base.attr('transform',
            'translate(0,0)scale(' + scale_more + ')'
        )
        return
    }


    // function g_trans() {
    //     let trans_more = [ -1 * com.more_xy.x.min, -1 * com.more_xy.y.min ]
    //     more_gs.g_outer.attr('transform',
    //         'translate(' + trans_more[0] + ', ' + trans_more[1] + ')'
    //     )
    
    //     let scale_more = 100 / (com.more_xy.x.max - com.more_xy.x.min)
    //     more_gs.more_g_base.attr('transform',
    //         'scale(' + scale_more + ')'
    //     )

    //     return
    // }

    // ------------------------------------------------------------------
    // to avoid bugs, this is the g which should be used
    // for translations and sacling of this element
    // ------------------------------------------------------------------
    this_top.set_transform = function(trans) {
        if (is_def(trans)) {
            more_gs.more_g.attr('transform', trans)
        }
        return more_gs.more_g
    }


    let com = {
    }
    // com.more_xy = {
    //     x: {
    //     },
    //     y: {
    //     },
    // }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setup_rect(_) {
        let g_more_rec = more_gs.more_g_base.append('g')

        g_more_rec
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', svg_dims.w)
            .attr('height', svg_dims.h)
            .attr('stroke-width', 0.5)
            .attr('stroke', '#383b42')
            .attr('fill', '#F2F2F2')
            // .attr("fill", "#d698bc")// .attr("fill", "#F2F2F2")


        // the background grid
        bck_pattern({
            com: com,
            g_now: more_gs.more_g_base,
            g_tag: 'g_s0',
            len_wh: [ svg_dims.w, svg_dims.h ],
            opac: 0.05,
            texture_orient: '1/8',
        })

        return
    }


    // ------------------------------------------------------------------
    //  Global function
    // ------------------------------------------------------------------
    function init_data(_) {
        if (is_def(more_gs.g_outer)) {
            return
        }

        setup_rect()
        g_trans()

        set_state_once()

        locker.remove(lock_init_key)
        return
    }
    this_top.init_data = init_data


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function prop_focus(opt_in) {
        let tel_id = opt_in.tel_id
        let prop_in = opt_in.prop_in
        let parent_name = (
            prop_in === '' ? null : insts.data.prop_parent_s1[tel_id][prop_in]
        )

        ele_base.tel_prop_title({
            tel_id: tel_id,
            prop_in: prop_in,
            parent_name: parent_name,
            font_scale: 0.6,
            g_in: more_gs.more_g_base,
            g_w: svg_dims.w,
        })

        return
    }
    this_top.prop_focus = prop_focus

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_state_once() {
        return
    }
    this_top.set_state_once = set_state_once

    return
}

