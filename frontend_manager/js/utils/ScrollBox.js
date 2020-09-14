/* global d3 */
/* global times */
/* global is_def */
/* global deep_copy */
/* global cols_blues */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ScrollBox = function() {
    let com = {
    }

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
    this.get = function(type) {
        return com[type]
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_clipping(box, duration = 0) {
        com.outer_box = deep_copy(box)
        
        com.clip_rec_inner
            .transition()
            .duration(duration)
            .attr('x', com.outer_box.x)
            .attr('y', com.outer_box.y)
            .attr('width', com.outer_box.w)
            .attr('height', com.outer_box.h)
        
        com.clip_rec_outer
            .transition()
            .duration(duration)
            .attr('x', com.outer_box.x)
            .attr('y', com.outer_box.y)
            .attr('width', com.outer_box.w)
            .attr('height', com.outer_box.h)

        com.outer_g
            .selectAll('rect.' + com.main_tag + 'block_box_outer')
            .data([ com.outer_box ], function(d) {
                return d.id
            })
            .transition()
            .duration(duration)
            .attr('x', function(d) {
                return d.x
            })
            .attr('y', function(d) {
                return d.y
            })
            .attr('width', function(d) {
                return d.w
            })
            .attr('height', function(d) {
                return d.h
            })
        
        com.scroll_outer_g
            .selectAll('rect.' + com.main_tag + 'block_box_inner')
            .data([ com.outer_box ], function(d) {
                return d.id
            })
            .transition()
            .duration(duration)
            .attr('x', function(d) {
                return d.x
            })
            .attr('y', function(d) {
                return d.y
            })
            .attr('width', function(d) {
                return d.w
            })
            .attr('height', function(d) {
                return d.h
            })
    }
    function init_clipping(opt_in) {
        com.tag_clip_path = opt_in.tag_clip_path
        if (!is_def(com.tag_clip_path)) {
            com.tag_clip_path = {
                inner: com.main_tag + 'clip_path_inner',
                outer: com.main_tag + 'clip_path_outer',
            }
        }

        com.g_box = opt_in.g_box
        com.outer_box = deep_copy(opt_in.box_data)
        let defs = com.g_box.append('defs')
        
        let clip_path_inner = defs
            .append('clipPath')
            .attr('id', com.tag_clip_path.inner)
        
        com.clip_rec_inner = clip_path_inner
            .append('rect')
            .attr('x', com.outer_box.x)
            .attr('y', com.outer_box.y)
            .attr('width', com.outer_box.w)
            .attr('height', com.outer_box.h)
        
        let clip_path_outer = defs
            .append('clipPath')
            .attr('id', com.tag_clip_path.outer)
        
        com.clip_rec_outer = clip_path_outer
            .append('rect')
            .attr('x', com.outer_box.x)
            .attr('y', com.outer_box.y)
            .attr('width', com.outer_box.w)
            .attr('height', com.outer_box.h)

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.outer_g = com.g_box.append('g')

        com.outer_g
            .selectAll('rect.' + com.main_tag + 'block_box_outer')
            .data([ com.outer_box ], function(d) {
                return d.id
            })
            .enter()
            .append('rect')
            .attr('class', com.main_tag + 'block_box_outer')
            .attr('x', function(d) {
                return d.x
            })
            .attr('y', function(d) {
                return d.y
            })
            .attr('width', function(d) {
                return d.w
            })
            .attr('height', function(d) {
                return d.h
            })
            .attr('stroke', '#383B42')
            .attr('stroke-width', '1')
            .attr('stroke-opacity', 0)
            .attr('fill', opt_in.background ? opt_in.background : '#F2F2F2')
            .attr('fill-opacity', 1)
            .style('pointer-events', 'none')

        com.scroll_outer_g = com.g_box.append('g')

        com.scroll_rec_inner = com.scroll_outer_g
            .selectAll('rect.' + com.main_tag + 'block_box_inner')
            .data([ com.outer_box ], function(d) {
                return d.id
            })
            .enter()
            .append('rect')

        com.scroll_rec_inner
            .attr('class', com.main_tag + 'block_box_inner')
            .attr('x', function(d) {
                return d.x
            })
            .attr('y', function(d) {
                return d.y
            })
            .attr('width', function(d) {
                return d.w
            })
            .attr('height', function(d) {
                return d.h
            })
            .attr('opacity', 0)

        com.inner_g = com.scroll_outer_g
            .append('g')
            .attr('class', 'clipping')
            .attr('clip-path', 'url(#' + com.tag_clip_path.outer + ')')

        com.scroll_bars_g = com.g_box.append('g')
        com.scroll_bar_h_h = com.g_box.append('g')

        return
    }
    function init(opt_in) {
        if (is_def(com.main_tag)) {
            console.error('trying to init more than once ...', opt_in)
            return
        }

        com.main_tag = opt_in.tag
        com.tag_zoom = com.main_tag + 'zoom'
        com.tag_drag = com.main_tag + 'drag'
        com.tag_scroll_bar = com.main_tag + 'scrollBar'

        com.can_scroll = is_def(opt_in.can_scroll) ? opt_in.can_scroll : true
        com.use_relative_coords = is_def(opt_in.use_relative_coords)
            ? opt_in.use_relative_coords
            : false

        com.locker = opt_in.locker
        com.run_loop = opt_in.run_loop
        let lock_zoom = opt_in.lock_zoom
        if (!is_def(lock_zoom)) {
            lock_zoom = {
                all: com.main_tag + 'zoom',
                during: com.main_tag + 'zoom_during',
                end: com.main_tag + 'zoom_end',
            }
        }
        com.lock_zoom = lock_zoom

        let lockers = {
        }
        lockers.lockers = is_def(opt_in.lockers) ? opt_in.lockers : []
        lockers.zoom_during = lockers.lockers.slice().concat([ lock_zoom.during ])
        lockers.zoom_end = lockers.lockers.slice().concat([ lock_zoom.end ])
        com.lockers = lockers

        com.same_inner_box_marg = is_def(opt_in.same_inner_box_marg)
            ? opt_in.same_inner_box_marg
            : true

        com.zoom_pause = 10
        com.is_in_drag = false
        com.is_in_zoom = false
        com.in_user_zoom = false
        com.prev_update = null

        // ------------------------------------------------------------------
        // box definition
        // ------------------------------------------------------------------

        init_clipping(opt_in)
        init_horizontal_scroll(opt_in)
        init_vertical_scroll(opt_in)

        com.lock_title = !is_def(opt_in.title)
        if (!com.lock_title) {
            com.title_data = deep_copy(opt_in.title)
            com.title_g = com.g_box.append('g')

            set_title()

            com.outer_box.h -= com.title_data.h
            com.outer_box.y += com.title_data.h
        }

        // ------------------------------------------------------------------
        //  CREATE CLIP
        // ------------------------------------------------------------------

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.inner_box = {
        }
        set_box()
        set_horizontal_scroll_state()
        set_vertical_scroll_state()

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------

        set_style(opt_in.style)

        setup_vertical_zoom()
        setup_vertical_scroll_bar()

        setup_horizontal_zoom()
        setup_horizontal_scroll_bar()

    // update();
    }
    this.init = init

    // ------------------------------------------------------------------
    // styling
    // ------------------------------------------------------------------
    function set_style(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        com.style = {
        }
    }
    this.set_style = set_style

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function pos_shift() {
        if (com.use_relative_coords) {
            return [ com.outer_box.x, com.outer_box.y ]
        }
        else {
            return [ 0, 0 ]
        }
    }
    com.pos_shift = pos_shift

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_box() {
        let box_marg = com.outer_box.marg ? com.outer_box.marg : 0

        // let scroll_margs = com.scroll_recs.w
        // if (!com.same_inner_box_marg && !com.scroll_transes.active) {
        //     scroll_margs = 0
        // }
        // let scroll_marg_h = com.scroll_rec_h.w
        // if (!com.same_inner_box_marg && !com.scroll_trans_h.active) {
        //     scroll_marg_h = 0
        // }

        com.inner_box.x = com.outer_box.x + box_marg
        com.inner_box.y = com.outer_box.y + box_marg
        com.inner_box.w = com.outer_box.w - box_marg * 2 //  - scroll_margs
        com.inner_box.h = com.outer_box.h - box_marg * 2 //  - scroll_marg_h
        com.inner_box.marg = box_marg
        com.inner_box.g = com.g_box

        let debug_inner_box = false
        if (debug_inner_box) {
            let rect = com.inner_g.selectAll('rect.' + 'inner_boxOutline').data([{
            }])
            
            rect
                .enter()
                .append('rect')
                .attr('class', 'inner_boxOutline')
                .attr('fill', cols_blues[1])
                .attr('stroke', cols_blues[0])
                .attr('stroke-width', '1')
                .attr('stroke-opacity', 0.5)
                .attr('fill-opacity', 0.05)
                .style('pointer-events', 'none')
                .merge(rect)
                .attr('x', 0) // com.inner_box.marg)
                .attr('y', 0) // com.inner_box.marg)
                .attr('width', com.inner_box.w)
                .attr('height', com.inner_box.h)
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_title() {
        if (com.lock_title) {
            return
        }
        if (!is_def(com.title_data)) {
            return
        }

        if (!is_def(com.title_data.id)) {
            com.title_data.id = com.main_tag + 'title'
        }
        if (!is_def(com.title_data.h)) {
            com.title_data.h = com.outer_box.w * 0.05
        }
        if (!is_def(com.title_data.marg)) {
            com.title_data.marg = com.outer_box.marg
        }
        if (!is_def(com.title_data.size)) {
            com.title_data.size = com.title_data.h * 0.5
        }
        if (!is_def(com.title_data.x)) {
            com.title_data.x = com.outer_box.x + com.title_data.marg
        }
        if (!is_def(com.title_data.y)) {
            com.title_data.y = com.outer_box.y
        }
        if (!is_def(com.title_data.weight)) {
            com.title_data.weight = 'bold'
        }

        let tag_title = com.title_data.id
        let text = com.title_g
            .selectAll('text.' + tag_title)
            .data([ com.title_data ], function(d) {
                return d.id
            })

        text
            .enter()
            .append('text')
            .attr('class', tag_title)
            .style('font-weight', 'normal')
            .style('opacity', 0)
            .style('stroke-width', 0)
            .style('fill', '#383b42')
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'left')
            .style('font-weight', com.title_data.weight)
            .attr('x', function(d) {
                return d.x + d.marg
            })
            .attr('y', function(d) {
                return d.y + d.h / 2
            })
            .style('font-size', function(d) {
                return d.size + 'px'
            })
            .attr('dy', function(d) {
                return d.size / 3 + 'px'
            })
            .merge(text)
            .transition('in_out')
            .duration(times.anim_txt)
            .attr('x', function(d) {
                return d.x + d.marg
            })
            .attr('y', function(d) {
                return d.y + d.h / 2
            })
            .style('font-size', function(d) {
                return d.size + 'px'
            })
            .attr('dy', function(d) {
                return d.size / 3 + 'px'
            })
            .text(function(d) {
                return d.text
            })
            .style('opacity', 1)

        text
            .exit()
            .transition('in_out')
            .duration(times.anim_txt)
            .style('opacity', 0)
            .remove()
    
        return
    }
    this.set_title = set_title

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init_vertical_scroll(opt_in) {
        com.scroll_vertical = is_def(opt_in.scroll_vertical)
            ? opt_in.scroll_vertical
            : true
        com.scroll_height = is_def(opt_in.scroll_height) ? opt_in.scroll_height : 0
        com.scroll_transes = {
            now: 0,
            min: 0,
            max: 0,
            frac: 0,
            active: false,
            drag: {
                y: 0,
                frac: 0,
            },
        }
        com.scroll_bar_recs = null

        com.scroll_recs = is_def(opt_in.scroll_recs) ? opt_in.scroll_recs : {
        }
        if (!is_def(com.scroll_recs.w)) {
            com.scroll_recs.w = com.outer_box.w * 0.015
        }
        if (!is_def(com.scroll_recs.h)) {
            com.scroll_recs.h = com.outer_box.h * 0.015
        }
        if (!is_def(com.scroll_recs.marg)) {
            com.scroll_recs.marg = 0.6
        }
        if (!is_def(com.scroll_recs.font_size)) {
            com.scroll_recs.font_size = com.scroll_recs.w
        }
        com.scroll_recs.x = com.outer_box.x + com.outer_box.w - com.scroll_recs.w

        return
    }


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setup_vertical_zoom() {
        let zoom_len = [ -1, 1e20, 1e4 ]
        // let deltaWH       = com.inner_box.h * 0.1;

        let tag_zoom = com.tag_zoom + '_vertical'
        let tag_drag = com.tag_drag + '_vertical'
        let locker = com.locker
        let lockers = com.lockers
        let lock_zoom = com.lock_zoom

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_zoom + 'zoom_start'] = function(e) {
            com.is_in_zoom = true
        }

        com[tag_zoom + 'zoom_during'] = function(e) {
            if (!com.scroll_transes.active) {
                return
            }

            com.in_user_zoom = is_def(e.sourceEvent)

            if (locker.are_free(lockers.zoom_during)) {
                locker.add({
                    id: lock_zoom.all,
                    override: true,
                })
                locker.add({
                    id: lock_zoom.during,
                    override: true,
                })

                let trans = null
                if (com.in_user_zoom) {
                    let wd_x = e.sourceEvent.deltaX * 0.4
                    let wd_y = e.sourceEvent.deltaY * 0.4
                    let wd_xy = Math.abs(wd_x) > Math.abs(wd_y) ? -1 * wd_x : wd_y

                    // trans = is_def(wd_xy) ? (((wd_xy < 0)?1:-1) * deltaWH) : 0;
                    trans = is_def(wd_xy) ? -1 * wd_xy : 0
                }

                let delay = do_trans({
                    trans: trans,
                    duration: 0,
                })

                locker.remove({
                    id: lock_zoom.during,
                    delay: delay,
                })
            }
        }

        com[tag_zoom + 'zoom_end'] = function() {
            com.is_in_zoom = false
            locker.remove({
                id: lock_zoom.all,
                override: true,
            })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_drag + 'drag_start'] = function(e) {
            if (!com.scroll_transes.active) {
                return
            }

            com.is_in_drag = true

            // if(e.x >= com.scroll_rec.x) {
            //   let frac = (e.y - com.inner_box.y) / (com.inner_box.h);
            //   frac = Math.min(1, Math.max(0, frac));
            //   let trans = (-1 * frac * (com.scroll_transes.max - com.scroll_transes.min)) - com.scroll_transes.now;

            //   com.do_trans({trans:trans}); //, duration:times.anim/.2
            // }

            com.scroll_transes.drag.y = is_def(e) ? e.y : com.inner_box.y
            com.scroll_transes.drag.frac = com.scroll_transes.frac

            locker.add({
                id: lock_zoom.all,
                override: true,
            })
        }

        com[tag_drag + 'drag_during'] = function(e) {
            if (!com.scroll_transes.active) {
                return
            }
            if (!is_def(e)) {
                return
            }
            if (!is_def(e.dy)) {
                return
            }

            if (locker.are_free(lockers.zoom_during)) {
                locker.add({
                    id: lock_zoom.all,
                    override: true,
                })
                locker.add({
                    id: lock_zoom.during,
                    override: true,
                })

                let trans = -1 * e.dy
                // let frac  = (e.y - com.inner_box.y)/com.inner_box.h;
                let frac = (
                    com.scroll_transes.drag.frac
                        + (
                            (e.y - com.scroll_transes.drag.y)
                            / com.inner_box.h
                        )
                )
                let delay = (
                    Math.abs(trans) > 0
                        ? do_trans({
                            frac: frac,
                            duration: 0,
                        })
                        : 0
                )

                locker.remove({
                    id: lock_zoom.during,
                    delay: delay,
                })
            }
        }

        com[tag_drag + 'drag_end'] = function() {
            com.is_in_drag = false
            locker.remove({
                id: lock_zoom.all,
                override: true,
            })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function do_trans(opt_in) {
            let trans = opt_in.trans
            let frac = opt_in.frac
            let is_moved = false
            let delay = 0
            
            let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim
            duration = duration === 0 ? times.anim : duration

            if (is_def(trans)) {
                let now = com.scroll_transes.now
                if (now >= com.scroll_transes.max && trans > 0) {
                    trans = null
                }
                else if (now <= com.scroll_transes.min && trans < 0) {
                    trans = null
                }
                else {
                    now += trans
                    com.scroll_transes.now = Math.max(
                        com.scroll_transes.min,
                        Math.min(com.scroll_transes.max, now)
                    )
                    com.scroll_transes.frac = Math.abs(
                        com.scroll_transes.now
                        / (com.scroll_transes.max - com.scroll_transes.min)
                    )
                }
                is_moved = is_def(trans)
            }
            else if (is_def(frac)) {
                com.scroll_transes.frac = Math.max(0, Math.min(1, frac))
                com.scroll_transes.now = (
                    com.scroll_transes.max
                    + (
                        com.scroll_transes.frac
                        * (com.scroll_transes.min - com.scroll_transes.max)
                    )
                )
                is_moved = true
            }

            if (is_moved) {
                delay = com.zoom_pause

                if (duration > 0) {
                    com.inner_g
                        .transition('move')
                        .duration(duration)
                        .ease(d3.easeLinear)
                        .attr('transform', function(_) {
                            let shift = pos_shift()
                            return (
                                'translate('
                                + shift[0]
                                + ','
                                + (com.scroll_transes.now + shift[1])
                                + ')'
                            )
                        })
                    
                    com.clip_rec_inner
                        .transition('move')
                        .duration(duration)
                        .ease(d3.easeLinear)
                        .attr('transform', (
                            'translate(0,' + -com.scroll_transes.now + ')'
                        ))
                    
                    com.clip_rec_outer
                        .transition('move')
                        .duration(duration)
                        .ease(d3.easeLinear)
                        .attr('transform', function(_) {
                            let shift = pos_shift()
                            return (
                                'translate('
                                + -shift[0]
                                + ','
                                + (-shift[1] - com.scroll_transes.now)
                                + ')'
                            )
                        })
                }
                else {
                    com.inner_g.attr('transform', function(_) {
                        let shift = pos_shift()
                        return (
                            'translate('
                            + shift[0]
                            + ','
                            + (com.scroll_transes.now + shift[1])
                            + ')'
                        )
                    })
                    com.clip_rec_inner.attr('transform', (
                        'translate(0,' + -com.scroll_transes.now + ')'
                    ))
                    com.clip_rec_outer.attr('transform', function(_) {
                        let shift = pos_shift()
                        return (
                            'translate('
                            + -shift[0]
                            + ','
                            + (-shift[1] - com.scroll_transes.now)
                            + ')'
                        )
                    })
                }
                com.zoom_vertical_scroll_bar_update()
            }

            return delay
        }
        com.do_vertical_trans = do_trans

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_zoom] = d3.zoom().scaleExtent([ zoom_len['0'], zoom_len['1'] ])
        com[tag_zoom]
            .on('start', com[tag_zoom + 'zoom_start'])
            .on('zoom', com[tag_zoom + 'zoom_during'])
            .on('end', com[tag_zoom + 'zoom_end'])

        // needed for auotomatic zoom
        com[tag_zoom + 'zoom_node'] = com.inner_box.g.nodes()[0]
        com[tag_zoom + 'zoomed'] = com.inner_box.g.append('g')

        com[tag_drag] = d3
            .drag()
            .on('start', com[tag_drag + 'drag_start'])
            .on('drag', com[tag_drag + 'drag_during'])
            .on('end', com[tag_drag + 'drag_end'])

        com.scroll_outer_g.call(com[tag_drag])
        com.scroll_bars_g.call(com[tag_drag])

        set_vertical_zoom_status()

        return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_vertical_zoom_status() {
        if (com.scroll_transes.active) {
            com.inner_box.g
                .call(com[com.tag_zoom + '_vertical'])
                .on('dblclick.zoom', null)
        }
        else {
            com.inner_box.g.on('.zoom', null)
        }

        return
    }


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setup_vertical_scroll_bar() {
        function zoom_vertical_scroll_bar_init() {
            if (!com.locker.is_free(com.main_tag + 'zoom_vertical_scroll_bar_init')) {
                return
            }

            com.locker.add({
                id: com.main_tag + 'zoom_vertical_scroll_bar_init',
                override: true,
            })
            com.scroll_bar_recs = null

            let n_done = 0
            let box = com.outer_box
            let data_bck = com.scroll_transes.active ? [{
                id: 'zoom_scrollbar_bck',
            }] : []
            let rec_bck = com.scroll_bars_g
                .selectAll('rect.' + com.tag_scroll_bar + 'bck')
                .data(data_bck, function(d) {
                    return d.id
                })

            // ------------------------------------------------------------------
            rec_bck
                .enter()
                .append('rect')
                .attr('class', com.tag_scroll_bar + 'bck')
                .attr('stroke', '#383B42')
                .attr('stroke-width', '0.5')
                .style('stroke-opacity', '0.5')
                .style('fill', '#383B42')
                .style('fill-opacity', '0.05')
                // .attr("stroke","#383B42").attr("stroke-width","0.5").style("stroke-opacity","0.5").style("fill", "#383B42").style("fill-opacity","0.8")
                .attr('x', box.x + box.w)
                .attr('y', box.y)
                .attr('width', 0)
                .attr('height', box.h)
                // click also does drag_start, but we need it for the smooth transition
                .on('click', function(_) {
                    rec_vertical_bck_click_once({
                        coords: d3.mouse(this),
                    })
                })
                .style('opacity', 1)
                .transition('in_out')
                .duration(times.anim)
                .attr('x', com.scroll_recs.x)
                .attr('width', com.scroll_recs.w)
                .on('end', function(_) {
                    n_done += 1
                })

            rec_bck
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .attr('x', box.x + box.w)
                .attr('width', 0)
                .remove()
                .on('end', function(_) {
                    n_done += 1
                })

            // ------------------------------------------------------------------
            set_vertical_rec_scroll()

            //
            // ------------------------------------------------------------------
            let n_tries = 0
            let max_tries = 500
            function scroll_bar_rec_set() {
                setTimeout(function() {
                    // console.log('ndone/n_tries: ',n_done,n_tries);

                    if (n_done < 1 && n_tries < max_tries) {
                        scroll_bar_rec_set()
                    }
                    else {
                        if (n_tries >= max_tries) {
                            console.error('cant seem to init zoom_scrollbar ...')
                        }

                        com.scroll_bar_recs = com.scroll_bars_g.selectAll(
                            'rect.' + com.tag_scroll_bar + 'scroll'
                        )
                        com.locker.remove({
                            id: com.main_tag + 'zoom_vertical_scroll_bar_init',
                        })
                    }
                    n_tries += 1
                }, times.anim / 5)
            }

            if (com.scroll_transes.active) {
                scroll_bar_rec_set()
            }
            else {
                com.locker.remove({
                    id: com.main_tag + 'zoom_vertical_scroll_bar_init',
                })
            }

            return
        }
        com.zoom_vertical_scroll_bar_init = zoom_vertical_scroll_bar_init

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function set_vertical_rec_scroll() {
            let box = com.outer_box
            let marg = com.scroll_recs.w * com.scroll_recs.marg / 2

            let data_scroll = com.scroll_transes.active
                ? [{
                    id: 'zoom_scrollbar_scroll',
                }]
                : []
            let rec_scroll = com.scroll_bars_g
                .selectAll('rect.' + com.tag_scroll_bar + 'scroll')
                .data(data_scroll, function(d) {
                    return d.id
                })

            rec_scroll
                .enter()
                .append('rect')
                .attr('class', com.tag_scroll_bar + 'scroll')
                .attr('stroke', '#383B42')
                .attr('stroke-width', '1')
                .style('stroke-opacity', '0.5')
                .style('fill', '#383B42')
                .style('fill-opacity', '0.9')
                .style('pointer-events', 'none')
                .attr('x', box.x + box.w)
                .attr('y', box.y + marg)
                .attr('width', 0)
                .attr('height', com.scroll_recs.h - marg * 2)
                .attr('transform', zoom_vertical_scroll_bar_trans)
                .merge(rec_scroll)
                .transition('in_out')
                .duration(times.anim)
                .attr('transform', zoom_vertical_scroll_bar_trans)
                .attr('x', box.x + box.w - com.scroll_recs.w + marg)
                .attr('y', box.y + marg)
                .attr('width', com.scroll_recs.w - marg * 2)
                .attr('height', com.scroll_recs.h - marg * 2)

            rec_scroll
                .exit()
                .transition('in_out')
                .duration(times.anim * 3 / 4)
                .attr('x', box.x + box.w)
                .attr('y', box.y + marg)
                .attr('width', 0)
                .remove()
        
            return
        }
        com.set_vertical_rec_scroll = set_vertical_rec_scroll

        // ------------------------------------------------------------------
        // instant transition in case of dragging
        // ------------------------------------------------------------------
        function zoom_vertical_scroll_bar_update() {
            if (!is_def(com.scroll_bar_recs)) {
                return
            }

            if (com.is_in_drag || com.in_user_zoom) {
                com.scroll_bar_recs.attr('transform', zoom_vertical_scroll_bar_trans)
            }
            else {
                com.scroll_bar_recs
                    .transition('move')
                    .duration(times.anim / 4)
                    .attr('transform', zoom_vertical_scroll_bar_trans)
            }

            return
        }
        com.zoom_vertical_scroll_bar_update = zoom_vertical_scroll_bar_update

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function zoom_vertical_scroll_bar_trans() {
            // let pos = com.scrollTrans.frac * (com.outer_box.h - com.scroll_rec.w*2);
            // return "translate("+(com.outer_box.x)+","+(com.outer_box.y + pos)+")";
            let pos = com.scroll_transes.frac * (com.outer_box.h - com.scroll_recs.h)
            return 'translate(0,' + pos + ')'
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.run_loop.init({
            tag: com.main_tag + 'rec_vertical_bck_click',
            func: rec_vertical_bck_click_once,
            n_keep: 1,
        })

        function rec_vertical_bck_click(data_in) {
            com.run_loop.push({
                tag: com.main_tag + 'rec_vertical_bck_click',
                data: data_in,
            })
        }
        com.rec_vertical_bck_click = rec_vertical_bck_click

        let n_click_tries = 0
        function rec_vertical_bck_click_once(data_in) {
            if (
                com.is_in_zoom
                || com.is_in_drag
                || (com.scroll_transes.active && !is_def(com.scroll_bar_recs))
            ) {
                // console.log('delay rec_vertical_bck_click_once',[com.is_in_zoom,com.is_in_drag],[com.scrollTrans.active,is_def(com.scroll_bar_rec)]);
                if (n_click_tries < 100) {
                    setTimeout(function() {
                        n_click_tries += 1
                        rec_vertical_bck_click(data_in)
                    }, times.anim / 2)
                }
                else {
                    console.error('cant do rec_vertical_bck_click ...', data_in)
                }
                return
            }
            n_click_tries = 0

            let frac = data_in.frac
            if (!is_def(frac) && is_def(data_in.coords)) {
                frac = (data_in.coords[1] - com.outer_box.y) / com.outer_box.h
            }

            if (is_def(frac)) {
                frac = Math.min(1, Math.max(0, frac))
                let trans = (
                    -1 * frac * (com.scrollTrans.max - com.scrollTrans.min)
                    - com.scrollTrans.now
                )

                com.do_trans({
                    trans: trans,
                })
            }

            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (com.scroll_transes.active) {
            zoom_vertical_scroll_bar_init()
        }

        reset_vertical_scroller({
            duration: 0,
        })

        return
    }
    

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function reset_vertical_scroller(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }
        let old = {
            frac: com.scroll_transes.frac,
            scroll_height: com.scroll_height,
        }
        // let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim / 2

        if (is_def(opt_in.can_scroll)) {
            com.can_scroll = opt_in.can_scroll
        }
        if (is_def(opt_in.scroll_vertical)) {
            com.scroll_vertical = opt_in.scroll_vertical
        }
        if (is_def(opt_in.scroll_height)) {
            com.scroll_height = opt_in.scroll_height
        }

        let prev_active = com.scroll_transes.active
        set_vertical_scroll_state(
            opt_in.keep_frac && old.scroll_height > 0 ? old : undefined
        )

        // if (opt_in.keep_frac) {
        //   com.scroll_transes.frac = (old.frac * com.scroll_height) / old.scroll_height
        // }
        if (prev_active !== com.scroll_transes.active) {
            set_box()
        }
        // com.inner_g
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', function (d, i) {
        //     let shift = pos_shift()
        //     return 'translate(' + shift[0] + ',' + shift[1] + ')'
        //   })
        //
        // com.clip_rec_inner
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', 'translate(0,0)')
        //
        // com.clip_rec_outer
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', function (d, i) {
        //     let shift = pos_shift()
        //     return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
        //   })

        if (prev_active !== com.scroll_transes.active) {
            set_vertical_zoom_status()
            com.zoom_vertical_scroll_bar_init()
        }
        else if (com.scroll_transes.active) {
            com.set_vertical_rec_scroll()
        }
        update_vertical_scroll_state(true)
        com.set_vertical_rec_scroll()
        com.do_vertical_trans({
            frac: com.scroll_transes.frac,
            duration: 0,
        })

        return
    }
    this.reset_vertical_scroller = reset_vertical_scroller
    

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_vertical_scroll_state(old) {
        let boxH = com.inner_box.h // com.outer_box.h - com.outer_box.marg * 2;

        if (com.can_scroll && com.scroll_vertical) {
            com.scroll_transes.active = Math.abs(com.scroll_height) > boxH
        }

        com.scroll_transes.min = is_def(com.scroll_height)
            ? -1 * Math.abs(com.scroll_height - boxH)
            : 0
        com.scroll_transes.max = 0
        if (old) {
            if (old.frac < 1) {
                com.scroll_transes.frac = com.scroll_transes.now / com.scroll_transes.min
            }
            else {
                com.scroll_transes.frac = 1
                com.scroll_transes.now = com.scroll_transes.min * com.scroll_transes.frac
            }
        }
        else {
            com.scroll_transes.frac = 0
            com.scroll_transes.now = com.scroll_transes.min * com.scroll_transes.frac
        }
        com.scroll_recs.h = boxH * boxH / Math.abs(com.scroll_height)

        return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_vertical_scroll_state(keep_frac) {
        let boxH = com.inner_box.h // com.outer_box.h - com.outer_box.marg * 2;
        if (com.can_scroll && com.scroll_vertical) {
            com.scroll_transes.active = Math.abs(com.scroll_height) > boxH
        }

        com.scroll_transes.min = (
            is_def(com.scroll_height)
                ? -1 * Math.abs(com.scroll_height - boxH)
                : 0
        )
        com.scroll_transes.max = 0
        if (!keep_frac) {
            com.scroll_transes.frac = 0
        }
        if (com.scroll_transes.now < com.scroll_transes.min) {
            com.scroll_transes.now = com.scroll_transes.min
        }
        else if (com.scroll_transes.now > com.scroll_transes.max) {
            com.scroll_transes.now = com.scroll_transes.max
        }
        com.scroll_recs.h = boxH * boxH / Math.abs(com.scroll_height)

        return
    }


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init_horizontal_scroll(opt_in) {
        com.scroll_horizontal = is_def(opt_in.scroll_horizontal)
            ? opt_in.scroll_horizontal
            : true
        com.scroll_width = is_def(opt_in.scroll_width) ? opt_in.scroll_width : 0
        com.scroll_trans_h = {
            now: 0,
            min: 0,
            max: 0,
            frac: 0,
            active: false,
            drag: {
                y: 0,
                frac: 0,
            },
        }
        com.scroll_bar_rec_h = null

        com.scroll_rec_h = is_def(opt_in.scroll_rec_h) ? opt_in.scroll_rec_h : {
        }
        if (!is_def(com.scroll_rec_h.w)) {
            com.scroll_rec_h.w = com.outer_box.w * 0.015
        }
        if (!is_def(com.scroll_rec_h.h)) {
            com.scroll_rec_h.h = com.outer_box.h * 0.015
        }
        if (!is_def(com.scroll_rec_h.marg)) {
            com.scroll_rec_h.marg = 0.6
        }
        if (!is_def(com.scroll_rec_h.font_size)) {
            com.scroll_rec_h.font_size = com.scroll_rec_h.w
        }
        com.scroll_rec_h.y = com.outer_box.y + com.outer_box.h - com.scroll_rec_h.h

        return
    }
    

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setup_horizontal_zoom() {
        let zoom_len = [ -1, 1e20, 1e4 ]
        // let deltaWH       = com.inner_box.h * 0.1;

        let tag_zoom = com.tag_zoom + '_horizontal'
        let tag_drag = com.tag_drag + '_horizontal'
        let locker = com.locker
        let lockers = com.lockers
        let lock_zoom = com.lock_zoom

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_zoom + 'zoom_start'] = function(e) {
            com.is_in_zoom = true
        }
        com[tag_zoom + 'zoom_during'] = function(e) {
            if (!com.scroll_trans_h.active) {
                return
            }

            com.in_user_zoom = is_def(e.sourceEvent)

            if (locker.are_free(lockers.zoom_during)) {
                locker.add({
                    id: lock_zoom.all,
                    override: true,
                })
                locker.add({
                    id: lock_zoom.during,
                    override: true,
                })

                let trans = null
                if (com.in_user_zoom) {
                    let wd_x = e.sourceEvent.deltaX
                    let wd_y = e.sourceEvent.deltaY
                    let wd_xy = Math.abs(wd_x) > Math.abs(wd_y) ? -1 * wd_x : wd_y

                    // trans = is_def(wd_xy) ? (((wd_xy < 0)?1:-1) * deltaWH) : 0;
                    trans = is_def(wd_xy) ? -1 * wd_xy : 0
                }
                let delay = do_trans({
                    trans: trans,
                    duration: 0,
                })

                locker.remove({
                    id: lock_zoom.during,
                    delay: delay,
                })
            }
        }
        
        com[tag_zoom + 'zoom_end'] = function() {
            com.is_in_zoom = false
            locker.remove({
                id: lock_zoom.all,
                override: true,
            })
            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_drag + 'drag_start'] = function(e) {
            if (!com.scroll_trans_h.active) {
                return
            }

            com.is_in_drag = true

            // if(e.x >= com.scroll_rec.x) {
            //   let frac = (e.y - com.inner_box.y) / (com.inner_box.h);
            //   frac = Math.min(1, Math.max(0, frac));
            //   let trans = (-1 * frac * (com.scroll_transes.max - com.scroll_transes.min)) - com.scroll_transes.now;

            //   com.do_trans({trans:trans}); //, duration:times.anim/.2
            // }

            com.scroll_trans_h.drag.x = is_def(e) ? e.x : com.inner_box.x
            com.scroll_trans_h.drag.frac = com.scroll_trans_h.frac

            locker.add({
                id: lock_zoom.all,
                override: true,
            })

            return
        }
        com[tag_drag + 'drag_during'] = function(e) {
            if (!com.scroll_trans_h.active) {
                return
            }
            if (!is_def(e)) {
                return
            }
            if (!is_def(e.dy)) {
                return
            }

            if (locker.are_free(lockers.zoom_during)) {
                locker.add({
                    id: lock_zoom.all,
                    override: true,
                })
                locker.add({
                    id: lock_zoom.during,
                    override: true,
                })

                let trans = -1 * e.dx
                // let frac  = (e.y - com.inner_box.y)/com.inner_box.h;
                let frac = (
                    com.scroll_trans_h.drag.frac
                    + (e.x - com.scroll_trans_h.drag.x) / com.inner_box.w
                )
                
                let delay = (
                    Math.abs(trans) > 0
                        ? do_trans({
                            frac: frac,
                            duration: 0,
                        })
                        : 0
                )

                locker.remove({
                    id: lock_zoom.during,
                    delay: delay,
                })
            }
         
            return
        }

        com[tag_drag + 'drag_end'] = function() {
            com.is_in_drag = false
            locker.remove({
                id: lock_zoom.all,
                override: true,
            })
            return
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function do_trans(opt_in) {
            let trans = opt_in.trans
            let frac = opt_in.frac
            let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim
            let is_moved = false
            let delay = 0

            if (is_def(trans)) {
                let now = com.scroll_trans_h.now
                if (now >= com.scroll_trans_h.max && trans > 0) {
                    trans = null
                }
                else if (now <= com.scroll_trans_h.min && trans < 0) {
                    trans = null
                }
                else {
                    now += trans
                    com.scroll_trans_h.now = Math.max(
                        com.scroll_trans_h.min,
                        Math.min(com.scroll_trans_h.max, now)
                    )
                    com.scroll_trans_h.frac = Math.abs(
                        com.scroll_trans_h.now
                        / (com.scroll_trans_h.max - com.scroll_trans_h.min)
                    )
                }
                is_moved = is_def(trans)
            }
            else if (is_def(frac)) {
                com.scroll_trans_h.frac = Math.max(0, Math.min(1, frac))
                com.scroll_trans_h.now = (
                    com.scroll_trans_h.max
                    + (
                        com.scroll_trans_h.frac
                        * (com.scroll_trans_h.min - com.scroll_trans_h.max)
                    )
                )
                
                is_moved = true
            }

            if (is_moved) {
                delay = com.zoom_pause

                if (duration > 0) {
                    com.inner_g
                        .transition('move')
                        .duration(duration)
                        .attr('transform', function(_) {
                            let shift = pos_shift()
                            return (
                                'translate('
                                + (com.scroll_trans_h.now + shift[0])
                                + ','
                                + shift[1]
                                + ')'
                            )
                        })
                    
                    com.clip_rec_inner
                        .transition('move')
                        .duration(duration)
                        .attr('transform', (
                            'translate(' + -com.scroll_trans_h.now + ',0)'
                        ))
                    
                    com.clip_rec_outer
                        .transition('move')
                        .duration(duration)
                        .attr('transform', function(_) {
                            let shift = pos_shift()
                            return (
                                'translate('
                                + (-shift[0] - com.scroll_trans_h.now)
                                + ','
                                + -shift[1]
                                + ')'
                            )
                        })
                }
                else {
                    com.inner_g.attr('transform', function(_) {
                        let shift = pos_shift()
                        return (
                            'translate('
                            + (com.scroll_trans_h.now + shift[0])
                            + ','
                            + shift[1]
                            + ')'
                        )
                    })
                    com.clip_rec_inner.attr('transform', (
                        'translate(' + -com.scroll_trans_h.now + ',0)'
                    ))
                    com.clip_rec_outer.attr('transform', function(_) {
                        let shift = pos_shift()
                        return (
                            'translate('
                            + (-shift[0] - com.scroll_trans_h.now)
                            + ','
                            + -shift[1]
                            + ')'
                        )
                    })
                }
                com.zoom_horizontal_scroll_bar_update()
            }

            return delay
        }
        com.do_horizontal_trans = do_trans

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_zoom] = d3.zoom().scaleExtent([ zoom_len['0'], zoom_len['1'] ])
        com[tag_zoom]
            .on('start', com[tag_zoom + 'zoom_start'])
            .on('zoom', com[tag_zoom + 'zoom_during'])
            .on('end', com[tag_zoom + 'zoom_end'])

        // needed for auotomatic zoom
        com[tag_zoom + 'zoom_node'] = com.inner_box.g.nodes()[0]
        com[tag_zoom + 'zoomed'] = com.inner_box.g.append('g')

        com[tag_drag] = d3
            .drag()
            .on('start', com[tag_drag + 'drag_start'])
            .on('drag', com[tag_drag + 'drag_during'])
            .on('end', com[tag_drag + 'drag_end'])
        // .on("start", function(d) { com[tag_drag+"drag_start"](); })
        // .on("drag",  function(d) { let coords = d3.mouse(this); com[tag_drag+"_drag_during"](coords); })
        // .on("end",   function(d) { com[tag_drag+"drag_end"](); })

        com.scroll_outer_g.call(com[tag_drag])
        com.scroll_bar_h_h.call(com[tag_drag])

        set_horizontal_zoom_status()

        return
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_horizontal_zoom_status() {
        if (com.scroll_transes.active) {
            return
        }
        if (com.scroll_trans_h.active) {
            com.inner_box.g
                .call(com[com.tag_zoom + '_horizontal'])
                .on('dblclick.zoom', null)
        }
        else {
            com.inner_box.g.on('.zoom', null)
        }

        return
    }
    

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setup_horizontal_scroll_bar() {
        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function zoom_horizontal_scroll_bar_init() {
            if (!com.locker.is_free(com.main_tag + 'zoom_horizontal_scroll_bar_init')) {
                return
            }

            com.locker.add({
                id: com.main_tag + 'zoom_horizontal_scroll_bar_init',
                override: true,
            })
            com.scroll_bar_rec_h = null

            let n_done = 0
            let box = com.outer_box
            let data_bck = (
                com.scroll_trans_h.active
                    ? [{
                        id: 'zoom_scrollbar_bck',
                    }]
                    : [
                    ]
            )
            
            let rec_bck = com.scroll_bar_h_h
                .selectAll('rect.' + com.tag_scroll_bar + 'bck')
                .data(data_bck, function(d) {
                    return d.id
                })

            // ------------------------------------------------------------------
            rec_bck
                .enter()
                .append('rect')
                .attr('class', com.tag_scroll_bar + 'bck')
                .attr('stroke', '#383B42')
                .attr('stroke-width', '0.5')
                .style('stroke-opacity', '0.5')
                .style('fill', '#383B42')
                .style('fill-opacity', '0.05')
                // .attr("stroke","#383B42").attr("stroke-width","0.5").style("stroke-opacity","0.5").style("fill", "#383B42").style("fill-opacity","0.8")
                .attr('x', box.x)
                .attr('y', box.y + box.h)
                .attr('width', box.w)
                .attr('height', 0)
                // click also does drag_start, but we need it for the smooth transition
                .on('click', function(_) {
                    rec_horizontal_bck_click_once({
                        coords: d3.mouse(this),
                    })
                })
                .style('opacity', 1)
                .transition('in_out')
                .duration(times.anim)
                .attr('y', com.scroll_rec_h.y)
                .attr('height', com.scroll_rec_h.h)
                .on('end', function(_) {
                    n_done += 1
                })

            rec_bck
                .exit()
                .transition('in_out')
                .duration(times.anim)
                .attr('y', box.y + box.h)
                .attr('height', 0)
                .remove()
                .on('end', function(_) {
                    n_done += 1
                })

            // ------------------------------------------------------------------
            set_horizontal_rec_scroll()

            //
            // ------------------------------------------------------------------
            let n_tries = 0
            let max_tries = 500
            function scroll_bar_rec_set() {
                setTimeout(function() {
                    // console.log('ndone/n_tries: ',n_done,n_tries);

                    if (n_done < 1 && n_tries < max_tries) {
                        scroll_bar_rec_set()
                    }
                    else {
                        if (n_tries >= max_tries) {
                            console.error('cant seem to init zoom_scrollbar ...')
                        }

                        com.scroll_bar_rec_h = com.scroll_bar_h_h.selectAll(
                            'rect.' + com.tag_scroll_bar + 'scroll'
                        )
                        com.locker.remove({
                            id: com.main_tag + 'zoom_horizontal_scroll_bar_init',
                        })
                    }
                    n_tries += 1
                }, times.anim / 5)
            }

            if (com.scroll_trans_h.active) {
                scroll_bar_rec_set()
            }
            else {
                com.locker.remove({
                    id: com.main_tag + 'zoom_horizontal_scroll_bar_init',
                })
            }
        }
        com.zoom_horizontal_scroll_bar_init = zoom_horizontal_scroll_bar_init

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function set_horizontal_rec_scroll() {
            let box = com.outer_box
            let marg = com.scroll_rec_h.h * com.scroll_rec_h.marg / 2

            let data_scroll = com.scroll_trans_h.active
                ? [{
                    id: 'zoom_scrollbar_scroll',
                }]
                : []
            
            let rec_scroll = com.scroll_bar_h_h
                .selectAll('rect.' + com.tag_scroll_bar + 'scroll')
                .data(data_scroll, function(d) {
                    return d.id
                })

            rec_scroll
                .enter()
                .append('rect')
                .attr('class', com.tag_scroll_bar + 'scroll')
                .attr('stroke', '#383B42')
                .attr('stroke-width', '1')
                .style('stroke-opacity', '0.5')
                .style('fill', '#383B42')
                .style('fill-opacity', '0.9')
                .style('pointer-events', 'none')
                .attr('y', box.y + box.h)
                .attr('x', box.x + marg)
                .attr('width', com.scroll_rec_h.w)
                .attr('height', 0)
                .attr('transform', zoom_horizontal_scroll_bar_trans)
                .merge(rec_scroll)
                .transition('in_out')
                .duration(times.anim)
                .attr('transform', zoom_horizontal_scroll_bar_trans)
                .attr('y', box.y + box.h - com.scroll_rec_h.h + marg)
                .attr('x', box.x + marg)
                .attr('width', com.scroll_rec_h.w)
                .attr('height', com.scroll_rec_h.h - marg * 2)
            
            rec_scroll
                .exit()
                .transition('in_out')
                .duration(times.anim * 3 / 4)
                .attr('y', box.y + box.y)
                .attr('x', box.x + marg)
                .attr('height', 0)
                .remove()
            
            return
        }
        com.set_horizontal_rec_scroll = set_horizontal_rec_scroll

        // ------------------------------------------------------------------
        // instant transition in case of dragging
        // ------------------------------------------------------------------
        function zoom_horizontal_scroll_bar_update() {
            if (!is_def(com.scroll_bar_rec_h)) {
                return
            }
            if (com.is_in_drag || com.in_user_zoom) {
                com.scroll_bar_rec_h.attr('transform', zoom_horizontal_scroll_bar_trans)
            }
            else {
                com.scroll_bar_rec_h
                    .transition('move')
                    .duration(times.anim / 4)
                    .attr('transform', zoom_horizontal_scroll_bar_trans)
            }

            return
        }
        com.zoom_horizontal_scroll_bar_update = zoom_horizontal_scroll_bar_update

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function zoom_horizontal_scroll_bar_trans() {
            // let pos = com.scrollTrans.frac * (com.outer_box.h - com.scroll_rec.w*2);
            // return "translate("+(com.outer_box.x)+","+(com.outer_box.y + pos)+")";
            let pos = com.scroll_trans_h.frac * (com.outer_box.w - com.scroll_rec_h.w)
            return 'translate(' + pos + ', 0)'
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.run_loop.init({
            tag: com.main_tag + 'rec_horizontal_bck_click',
            func: rec_horizontal_bck_click_once,
            n_keep: 1,
        })

        function rec_horizontal_bck_click(data_in) {
            com.run_loop.push({
                tag: com.main_tag + 'rec_horizontal_bck_click',
                data: data_in,
            })
        }
        com.rec_horizontal_bck_click = rec_horizontal_bck_click

        let n_click_tries = 0
        function rec_horizontal_bck_click_once(data_in) {
            if (
                com.is_in_zoom
                || com.is_in_drag
                || (com.scroll_trans_h.active && !is_def(com.scroll_bar_rec_h))
            ) {
                // console.log('delay rec_horizontal_bck_click_once',[com.is_in_zoom,com.is_in_drag],[com.scrollTrans.active,is_def(com.scroll_bar_rec)]);
                if (n_click_tries < 100) {
                    setTimeout(function() {
                        n_click_tries += 1
                        rec_horizontal_bck_click(data_in)
                    }, times.anim / 2)
                }
                else {
                    console.error('cant do rec_horizontal_bck_click ...', data_in)
                }
                return
            }
            n_click_tries = 0

            let frac = data_in.frac
            if (!is_def(frac) && is_def(data_in.coords)) {
                frac = (data_in.coords[1] - com.outer_box.y) / com.outer_box.h
            }

            if (is_def(frac)) {
                frac = Math.min(1, Math.max(0, frac))
                let trans = (
                    (-1 * frac * (com.scrollTrans.max - com.scrollTrans.min))
                    - com.scrollTrans.now
                )

                com.do_trans({
                    trans: trans,
                })
            }
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (com.scroll_trans_h.active) {
            zoom_horizontal_scroll_bar_init()
        }

        reset_horizontal_scroller({
            duration: 0,
        })
    
        return
    }
    

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function reset_horizontal_scroller(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }
        let old = {
            frac: com.scroll_trans_h.frac,
            scroll_width: com.scroll_width,
        }
        // let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim / 2

        if (is_def(opt_in.can_scroll)) {
            com.can_scroll = opt_in.can_scroll
        }
        if (is_def(opt_in.scroll_vertical)) {
            com.scroll_horizontal = opt_in.scroll_horizontal
        }
        if (is_def(opt_in.scroll_width)) {
            com.scroll_width = opt_in.scroll_width
        }

        let prev_active = com.scroll_trans_h.active
        set_horizontal_scroll_state(
            opt_in.keep_frac && old.scroll_width > 0 ? old : undefined
        )

        if (prev_active !== com.scroll_trans_h.active) {
            set_box()
        }

        if (prev_active !== com.scroll_trans_h.active) {
            set_horizontal_zoom_status()
            com.zoom_horizontal_scroll_bar_init()
        }
        else if (com.scroll_trans_h.active) {
            com.set_horizontal_rec_scroll()
        }
        
        update_horizontal_scroll_state(true)
        com.set_horizontal_rec_scroll()
        com.do_horizontal_trans({
            frac: com.scroll_trans_h.frac,
            duration: 0,
        })
    
        return
    }
    this.reset_horizontal_scroller = reset_horizontal_scroller

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function set_horizontal_scroll_state() {
        let box_w = com.inner_box.w // com.outer_box.h - com.outer_box.marg * 2;
        if (com.can_scroll && com.scroll_horizontal) {
            com.scroll_trans_h.active = Math.abs(com.scroll_width) > box_w
        }

        com.scroll_trans_h.min = (
            is_def(com.scroll_width)
                ? -1 * Math.abs(com.scroll_width - box_w)
                : 0
        )
        
        com.scroll_trans_h.max = 0
        com.scroll_trans_h.frac = 0
        com.scroll_trans_h.now = com.scroll_trans_h.max
        com.scroll_rec_h.w = box_w * box_w / Math.abs(com.scroll_width)
    }


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_horizontal_scroll_state(keep_frac) {
        let box_w = com.inner_box.w // com.outer_box.h - com.outer_box.marg * 2;
        if (com.can_scroll && com.scroll_horizontal) {
            com.scroll_trans_h.active = Math.abs(com.scroll_width) > box_w
        }

        com.scroll_trans_h.min = is_def(com.scroll_width)
            ? -1 * Math.abs(com.scroll_width - box_w)
            : 0
        com.scroll_trans_h.max = 0
        if (!keep_frac) {
            com.scroll_trans_h.frac = 0
        }
        if (com.scroll_trans_h.now < com.scroll_trans_h.min) {
            com.scroll_trans_h.now = com.scroll_trans_h.min
        }
        else if (com.scroll_trans_h.now > com.scroll_trans_h.max) {
            com.scroll_trans_h.now = com.scroll_trans_h.max
        }
        com.scroll_rec_h.w = box_w * box_w / Math.abs(com.scroll_width)

        return
    }

    function update_box(box, duration) {
        update_clipping(box, duration)
    }
    this.update_box = update_box


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function reset_scroller(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }
        let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim / 2

        if (is_def(opt_in.can_scroll)) {
            com.can_scroll = opt_in.can_scroll
        }
        if (is_def(opt_in.scroll_vertical)) {
            com.scroll_vertical = opt_in.scroll_vertical
        }
        if (is_def(opt_in.scroll_height)) {
            com.scroll_height = opt_in.scroll_height
        }

        let prev_active = com.scroll_transes.active
        set_vertical_scroll_state()

        if (prev_active !== com.scroll_transes.active) {
            set_box()
        }

        com.inner_g
            .transition('move')
            .duration(duration)
            .attr('transform', function(_) {
                let shift = pos_shift()
                return 'translate(' + shift[0] + ',' + shift[1] + ')'
            })

        com.clip_rec_inner
            .transition('move')
            .duration(duration)
            .attr('transform', 'translate(0,0)')

        com.clip_rec_outer
            .transition('move')
            .duration(duration)
            .attr('transform', function(_) {
                let shift = pos_shift()
                return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
            })

        if (prev_active !== com.scroll_transes.active) {
            set_vertical_zoom_status()
            com.zoom_vertical_scroll_bar_init()
        }
        else if (com.scroll_transes.active) {
            com.set_vertical_rec_scroll()
        }
    
        return
    }
    this.reset_scroller = reset_scroller

    
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function move_horizontal_scroller_to(target) {
        com.scroll_trans_h.frac = target
        com.zoom_horizontal_scroll_bar_update()
        com.do_horizontal_trans({
            frac: target,
            duration: 400,
        })
    }
    this.move_horizontal_scroller_to = move_horizontal_scroller_to

    
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function move_vertical_scroller_to(target) {
        com.scroll_transes.frac = target
        com.zoom_vertical_scroll_bar_update()
        com.do_vertical_trans({
            frac: target,
            duration: 400,
        })
    }
    this.move_vertical_scroller_to = move_vertical_scroller_to

    
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_horizontal_scroller(opt_in) {
        if (!com.scroll_trans_h.active) {
            return
        }

        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        if (is_def(opt_in.scroll_width)) {
            com.scroll_width = opt_in.scroll_width
        }
        // if (is_def(opt_in.boxWidth)) com.scroll_width = opt_in.boxWidth
        // if (is_def(opt_in.frac)) com.scroll_width = opt_in.frac

        update_horizontal_scroll_state(true)
        com.set_horizontal_rec_scroll()
        com.do_horizontal_trans({
            frac: com.scroll_trans_h.frac,
            duration: 0,
        })
        // set_horizontal_zoom_status()
        // if (prev_active !== com.scroll_trans_h.active) {
        //   set_horizontal_zoom_status()
        //   com.zoom_horizontal_scroll_bar_init()
        // }

        // if (prev_active !== com.scroll_trans_h.active) {
        //   set_box()
        // }
        //
        // com.inner_g
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', function (d, i) {
        //     let shift = pos_shift()
        //     return 'translate(' + shift[0] + ',' + shift[1] + ')'
        //   })
        // com.clip_rec_inner
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', 'translate(0,0)')
        // com.clip_rec_outer
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', function (d, i) {
        //     let shift = pos_shift()
        //     return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
        //   })
        //

        return
    }
    this.update_horizontal_scroller = update_horizontal_scroller


    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function update_vertical_scroller(opt_in) {
        if (!com.scroll_transes.active) {
            return
        }

        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        if (is_def(opt_in.scroll_height)) {
            com.scroll_height = opt_in.scroll_height
        }
        // if (is_def(opt_in.boxWidth)) com.scroll_width = opt_in.boxWidth
        // if (is_def(opt_in.frac)) com.scroll_width = opt_in.frac
        update_vertical_scroll_state(true)
        com.set_vertical_rec_scroll()
        com.do_vertical_trans({
            frac: com.scroll_transes.frac,
            duration: 0,
        })
        // set_horizontal_zoom_status()
        // if (prev_active !== com.scroll_trans_h.active) {
        //   set_horizontal_zoom_status()
        //   com.zoom_horizontal_scroll_bar_init()
        // }

        // if (prev_active !== com.scroll_trans_h.active) {
        //   set_box()
        // }
        //
        // com.inner_g
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', function (d, i) {
        //     let shift = pos_shift()
        //     return 'translate(' + shift[0] + ',' + shift[1] + ')'
        //   })
        // com.clip_rec_inner
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', 'translate(0,0)')
        // com.clip_rec_outer
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', function (d, i) {
        //     let shift = pos_shift()
        //     return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
        //   })
        //

        return
    }
    this.update_vertical_scroller = update_vertical_scroller
    

    // function updateScrollerSize (opt_in) {
    //   if (!is_def(opt_in)) opt_in = {}
    //   let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim / 2
    //
    //   if (is_def(opt_in.can_scroll)) com.can_scroll = opt_in.can_scroll
    //   if (is_def(opt_in.scroll_vertical)) com.scroll_vertical = opt_in.scroll_vertical
    //   if (is_def(opt_in.scroll_height)) com.scroll_height = opt_in.scroll_height
    //
    //   let prev_active = com.scroll_transes.active
    //   set_vertical_scroll_state()
    //
    //   if (prev_active !== com.scroll_transes.active) {
    //     set_box()
    //   }
    //
    //   com.inner_g
    //     .transition('move')
    //     .duration(duration)
    //     .attr('transform', function (d, i) {
    //       let shift = pos_shift()
    //       return 'translate(' + shift[0] + ',' + shift[1] + ')'
    //     })
    //
    //   com.clip_rec_inner
    //     .transition('move')
    //     .duration(duration)
    //     .attr('transform', 'translate(0,0)')
    //
    //   com.clip_rec_outer
    //     .transition('move')
    //     .duration(duration)
    //     .attr('transform', function (d, i) {
    //       let shift = pos_shift()
    //       return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
    //     })
    //
    //   if (prev_active !== com.scroll_transes.active) {
    //     set_vertical_zoom_status()
    //     com.zoom_vertical_scroll_bar_init()
    //   } else if (com.scroll_transes.active) {
    //     com.set_vertical_rec_scroll()
    //   }
    // }
    // this.updateScrollerSize = updateScrollerSize

    
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function get_scroll_prop(mode) {
        if (mode === 'vertical') {
            return com.scroll_transes
        }
        else if (mode === 'horizontal') {
            return com.scroll_trans_h
        }
    }
    this.get_scroll_prop = get_scroll_prop
}
