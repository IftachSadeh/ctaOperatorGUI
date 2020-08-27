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
var main_script_tag = 'EmptyExample'
// -------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global sock */
/* global Locker */
/* global RunLoop */
/* global dom_add */
/* global run_when_ready */
/* global disable_scroll_svg */
/* global bck_pattern */
/* global cols_mix */
/* global unique */

// -------------------------------------------------------------------
sock.widget_table[main_script_tag] = function(opt_in) {
    let x0 = 0
    let y0 = 0
    let h0 = 6
    let w0 = 12
    let div_key = 'main'

    opt_in.widget_func = {
        sock_func: sock_empty_example,
        main_func: main_empty_example,
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

// -------------------------------------------------------------------
// additional socket events for this particular widget type
// -------------------------------------------------------------------
let sock_empty_example = function(opt_in) {}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// here we go with the content of this particular widget
// -------------------------------------------------------------------
window.empty_example_svg_mains = {
}

let main_empty_example = function(opt_in) {
    // let my_unique_id = unique()
    let widget_type = opt_in.widget_type
    let tag_arr_zoomerPlotsSvg = opt_in.base_name
    let widget_id = opt_in.widget_id
    let widget_ele = opt_in.widget_ele
    let icon_divs = opt_in.icon_divs

    // let is_south = window.SITE_TYPE === 'S'
    // let this_empty_example = this

    let sgv_tag = {
    }
    $.each(widget_ele, function(index, ele_now) {
        sgv_tag[ele_now.id] = {
            id: tag_arr_zoomerPlotsSvg + ele_now.id,
            widget: ele_now.widget,
            whRatio: ele_now.w / ele_now.h,
        }
    })

    // delay counters
    let locker = new Locker()
    locker.add('in_init' + widget_id)

    // function loop
    let run_loop = new RunLoop({
        tag: widget_id,
    })

    // ------------------------------------------------------------------
    sock.socket.on('update_data_widget_name', function(data_in) {
        update_data(data_in)
    })

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

        sock.set_icon_badge({
            data: data_in,
            icon_divs: icon_divs,
        })

        svg_main.init_data(data_in)
    }
    this.init_data = init_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    function update_data(data_in) {
        let svg_mains = window.empty_example_svg_mains[data_in.metadata.widget_id]
        svg_mains.update_data(data_in.data)
    }
    this.update_data = update_data

    // -------------------------------------------------------------------
    //
    // -------------------------------------------------------------------
    let SvgMain = function() {
        let com = {
        }
        let svg = {
        }
        // let thisMain = this

        let svg_dims = {
        }
        svg_dims.w = {
        }
        svg_dims.h = {
        }
        svg_dims.w[0] = 1000
        svg_dims.h[0] = svg_dims.w[0] / sgv_tag.main.whRatio

        let tag_empty_example = 'empty_example'

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
            sock.emit_mouse_move({
                eleIn: svg_div,
                data: {
                    widget_id: widget_id,
                },
            })

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
                .style('background', '#383B42') // .style("background", "red")// .style("border","1px solid red")
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
                opac: 0.06,
                hex_r: 20,
            })

            // -------------------------------------------------------------------
            //
            // -------------------------------------------------------------------
            update_data_once(data_in.data)

            run_when_ready({
                pass: function() {
                    return locker.is_free(tag_empty_example + 'update_data' + widget_id)
                },
                execute: function() {
                    locker.remove('in_init' + widget_id)
                },
            })
        }
        this.init_data = init_data

        // -------------------------------------------------------------------
        //
        // -------------------------------------------------------------------
        run_loop.init({
            tag: widget_id + 'update_data_0',
            func: update_data_once,
            n_keep: 1,
        })
        run_loop.init({
            tag: widget_id + 'update_data_1',
            func: update_data_once,
            n_keep: 1,
        })

        function update_data(data_in) {
            if (!locker.is_free('in_init' + widget_id)) {
                setTimeout(function() {
                    update_data(data_in)
                }, 10)
                return
            }
            // console.log('lllllllllll',widget_id,data_in.n_circ)

            if (data_in.n_circ == 0) {
                run_loop.push({
                    tag: widget_id + 'update_data_0',
                    data: data_in,
                })
            }
            else if (data_in.n_circ == 1) {
                run_loop.push({
                    tag: widget_id + 'update_data_1',
                    data: data_in,
                })
            }
        }
        this.update_data = update_data

        // -------------------------------------------------------------------
        // some random stuff for illustration
        // -------------------------------------------------------------------
        function update_data_once(data_in) {
            if (!locker.are_free([ tag_empty_example + 'update_data' + widget_id ])) {
                // console.log('will delay update_data', data_in)
                setTimeout(function() {
                    update_data(data_in)
                }, 10)
                return
            }
            locker.add(tag_empty_example + 'update_data' + widget_id)

            // -------------------------------------------------------------------
            // send some random message to the server ...
            // -------------------------------------------------------------------
            let my_message_data = {
            }
            my_message_data.widget_id = opt_in.widget_id
            my_message_data.my_message = (
                'my_message_' + widget_id + unique() + '_' + data_in.n_circ
            )

            let emit_data = {
                widget_name: widget_type,
                widget_id: my_message_data.widget_id,
                method_name: 'send_rnd_message',
                method_arg: my_message_data,
            }

            sock.socket.emit('widget', emit_data)

            // -------------------------------------------------------------------
            // do random stuff on updates ...
            // -------------------------------------------------------------------
            let tag_circ = 'my_circ' + data_in.n_circ
            let rnd = Math.max(0.1, Math.min(0.9, data_in.rnd / 100))
            let opac = Math.max(0.1, Math.min(0.9, Math.pow(1 - rnd, 2)))
            let time = data_in.time

            let circ = svg.g
                .selectAll('circle.' + tag_circ)
                .data([{
                    id: 0,
                    r: rnd,
                }, {
                    id: 1,
                    r: Math.pow(1 - rnd, 2),
                }], function(
                    d
                ) {
                    return d.id
                })

            circ
                .enter()
                .append('circle')
                .attr('class', tag_circ)
                .style('stroke-opacity', 0.7)
                .attr('r', 0)
                .attr('fill', 'transparent')
                .attr('stroke', 'transparent')
                .attr('stroke-width', '3')
                .attr('cx', svg_dims.w[0] * ((data_in.n_circ == 0) ? 0.75 : 0.25))
                .attr('cy', svg_dims.h[0] * ((data_in.n_circ == 0) ? 0.45 : 0.55))
                .merge(circ)
                .transition('in_out')
                .duration(data_in.anim_speed)
                .style('fill-opacity', opac)
                .style('fill', function(d, i) {
                    return i === 0 ? cols_mix[time % cols_mix.length] : 'transparent'
                })
                .style('stroke', function(d, i) {
                    return i === 1 ? cols_mix[time % cols_mix.length] : 'transparent'
                })
                .attr('r', function(d) {
                    return d.r * Math.min(svg_dims.w[0], svg_dims.h[0]) / 3
                })

            circ
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .attr('r', 0)
                .style('opacity', 0)
                .remove()
            // -------------------------------------------------------------------

            locker.remove(tag_empty_example + 'update_data' + widget_id)
        }
    }

    let svg_main = new SvgMain()
    window.empty_example_svg_mains[widget_id] = svg_main
}
// -------------------------------------------------------------------
// -------------------------------------------------------------------
