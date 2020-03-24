/* global d3 */
/* global times */
/* global is_def */
/* global deep_copy */
/* global cols_blues */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ScrollBox = function() {
    let com = {}

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
    function updateClipping(box, duration = 0) {
        com.outerBox = deep_copy(box)
        com.clipRecInner
            .transition()
            .duration(duration)
            .attr('x', com.outerBox.x)
            .attr('y', com.outerBox.y)
            .attr('width', com.outerBox.w)
            .attr('height', com.outerBox.h)
        com.clipRecOuter
            .transition()
            .duration(duration)
            .attr('x', com.outerBox.x)
            .attr('y', com.outerBox.y)
            .attr('width', com.outerBox.w)
            .attr('height', com.outerBox.h)

        com.outerG
            .selectAll('rect.' + com.mainTag + 'blockBoxOuter')
            .data([ com.outerBox ], function(d) {
                return d.id
            })
            .transition()
            .duration(duration)
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
        com.scrollOuterG
            .selectAll('rect.' + com.mainTag + 'blockBoxInner')
            .data([ com.outerBox ], function(d) {
                return d.id
            })
            .transition()
            .duration(duration)
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
    }
    function initClipping(opt_in) {
        com.tagClipPath = opt_in.tagClipPath
        if (!is_def(com.tagClipPath)) {
            com.tagClipPath = {
                inner: com.mainTag + 'clipPathInner',
                outer: com.mainTag + 'clipPathOuter',
            }
        }

        com.g_box = opt_in.g_box
        com.outerBox = deep_copy(opt_in.boxData)
        let defs = com.g_box.append('defs')
        let clipPathInner = defs
            .append('clipPath')
            .attr('id', com.tagClipPath.inner)
        com.clipRecInner = clipPathInner
            .append('rect')
            .attr('x', com.outerBox.x)
            .attr('y', com.outerBox.y)
            .attr('width', com.outerBox.w)
            .attr('height', com.outerBox.h)
        let clipPathOuter = defs
            .append('clipPath')
            .attr('id', com.tagClipPath.outer)
        com.clipRecOuter = clipPathOuter
            .append('rect')
            .attr('x', com.outerBox.x)
            .attr('y', com.outerBox.y)
            .attr('width', com.outerBox.w)
            .attr('height', com.outerBox.h)

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.outerG = com.g_box.append('g')

        com.outerG
            .selectAll('rect.' + com.mainTag + 'blockBoxOuter')
            .data([ com.outerBox ], function(d) {
                return d.id
            })
            .enter()
            .append('rect')
            .attr('class', com.mainTag + 'blockBoxOuter')
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
            .attr('stroke-opacity', 0)
            .attr('fill', opt_in.background ? opt_in.background : '#F2F2F2')
            .attr('fill-opacity', 1)
            .style('pointer-events', 'none')

        com.scrollOuterG = com.g_box.append('g')

        com.scrollRecInner = com.scrollOuterG
            .selectAll('rect.' + com.mainTag + 'blockBoxInner')
            .data([ com.outerBox ], function(d) {
                return d.id
            })
            .enter()
            .append('rect')

        com.scrollRecInner
            .attr('class', com.mainTag + 'blockBoxInner')
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
            .attr('opacity', 0)

        com.innerG = com.scrollOuterG
            .append('g')
            .attr('class', 'clipping')
            .attr('clip-path', 'url(#' + com.tagClipPath.outer + ')')

        com.scrollBarVG = com.g_box.append('g')
        com.scrollBarHG = com.g_box.append('g')
    }
    function init(opt_in) {
        if (is_def(com.mainTag)) {
            console.error('trying to init more than once ...', opt_in)
            return
        }

        com.mainTag = opt_in.tag
        com.tag_zoom = com.mainTag + 'zoom'
        com.tagDrag = com.mainTag + 'drag'
        com.tagScrollBar = com.mainTag + 'scrollBar'

        com.canScroll = is_def(opt_in.canScroll) ? opt_in.canScroll : true
        com.useRelativeCoords = is_def(opt_in.useRelativeCoords)
            ? opt_in.useRelativeCoords
            : false

        com.locker = opt_in.locker
        com.run_loop = opt_in.run_loop
        let lockerZoom = opt_in.lockerZoom
        if (!is_def(lockerZoom)) {
            lockerZoom = {
                all: com.mainTag + 'zoom',
                during: com.mainTag + 'zoomsuring',
                end: com.mainTag + 'zoomEnd',
            }
        }
        com.lockerZoom = lockerZoom

        let lockerV = {}
        lockerV.lockerV = is_def(opt_in.lockerV) ? opt_in.lockerV : []
        lockerV.zoomsuring = lockerV.lockerV.slice().concat([ lockerZoom.during ])
        lockerV.zoomEnd = lockerV.lockerV.slice().concat([ lockerZoom.end ])
        com.lockerV = lockerV

        com.sameInnerBoxMarg = is_def(opt_in.sameInnerBoxMarg)
            ? opt_in.sameInnerBoxMarg
            : true

        com.zoomPause = 10
        com.isInDrag = false
        com.isInZoom = false
        com.inUserZoom = false
        com.prevUpdate = null

        // ------------------------------------------------------------------
        // box definition
        // ------------------------------------------------------------------

        initClipping(opt_in)
        initHorizontalScroll(opt_in)
        initVerticalScroll(opt_in)

        com.lockTitle = !is_def(opt_in.title)
        if (!com.lockTitle) {
            com.titleData = deep_copy(opt_in.title)
            com.titleG = com.g_box.append('g')

            setTitle()

            com.outerBox.h -= com.titleData.h
            com.outerBox.y += com.titleData.h
        }

        // ------------------------------------------------------------------
        //  CREATE CLIP
        // ------------------------------------------------------------------

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.innerBox = {}
        setBox()
        setHorizontalScrollState()
        setVerticalScrollState()

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------

        setStyle(opt_in.style)

        setupVerticalZoom()
        setupVerticalScrollBar()

        setupHorizontalZoom()
        setupHorizontalScrollBar()

    // update();
    }
    this.init = init

    // ------------------------------------------------------------------
    // styling
    // ------------------------------------------------------------------
    function setStyle(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {}
        }

        com.style = {}
    }
    this.setStyle = setStyle

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function posShift() {
        if (com.useRelativeCoords) {
            return [ com.outerBox.x, com.outerBox.y ]
        }
        else {
            return [ 0, 0 ]
        }
    }
    com.posShift = posShift

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setBox() {
        let boxMarg = com.outerBox.marg ? com.outerBox.marg : 0

        let scrollMargV = com.scrollRecV.w
        if (!com.sameInnerBoxMarg && !com.scrollTransV.active) {
            scrollMargV = 0
        }

        let scrollMargH = com.scrollRecH.w
        if (!com.sameInnerBoxMarg && !com.scrollTransH.active) {
            scrollMargH = 0
        }

        com.innerBox.x = com.outerBox.x + boxMarg
        com.innerBox.y = com.outerBox.y + boxMarg
        com.innerBox.w = com.outerBox.w - boxMarg * 2 //  - scrollMargV
        com.innerBox.h = com.outerBox.h - boxMarg * 2 //  - scrollMargH
        com.innerBox.marg = boxMarg
        com.innerBox.g = com.g_box

        let debug_innerBox = false
        if (debug_innerBox) {
            let rect = com.innerG.selectAll('rect.' + 'innerBoxOutline').data([{}])
            rect
                .enter()
                .append('rect')
                .attr('class', 'innerBoxOutline')
                .attr('fill', cols_blues[1])
                .attr('stroke', cols_blues[0])
                .attr('stroke-width', '1')
                .attr('stroke-opacity', 0.5)
                .attr('fill-opacity', 0.05)
                .style('pointer-events', 'none')
                .merge(rect)
                .attr('x', 0) // com.innerBox.marg)
                .attr('y', 0) // com.innerBox.marg)
                .attr('width', com.innerBox.w)
                .attr('height', com.innerBox.h)
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setTitle() {
        if (com.lockTitle) {
            return
        }
        if (!is_def(com.titleData)) {
            return
        }

        if (!is_def(com.titleData.id)) {
            com.titleData.id = com.mainTag + 'title'
        }
        if (!is_def(com.titleData.h)) {
            com.titleData.h = com.outerBox.w * 0.05
        }
        if (!is_def(com.titleData.marg)) {
            com.titleData.marg = com.outerBox.marg
        }
        if (!is_def(com.titleData.size)) {
            com.titleData.size = com.titleData.h * 0.5
        }
        if (!is_def(com.titleData.x)) {
            com.titleData.x = com.outerBox.x + com.titleData.marg
        }
        if (!is_def(com.titleData.y)) {
            com.titleData.y = com.outerBox.y
        }
        if (!is_def(com.titleData.weight)) {
            com.titleData.weight = 'bold'
        }

        let tagTitle = com.titleData.id
        let text = com.titleG
            .selectAll('text.' + tagTitle)
            .data([ com.titleData ], function(d) {
                return d.id
            })

        text
            .enter()
            .append('text')
            .attr('class', tagTitle)
            .style('font-weight', 'normal')
            .style('opacity', 0)
            .style('stroke-width', 0)
            .style('fill', '#383b42')
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .attr('text-anchor', 'left')
            .style('font-weight', com.titleData.weight)
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
    }
    this.setTitle = setTitle

    function initVerticalScroll(opt_in) {
        com.scrollVertical = is_def(opt_in.scrollVertical)
            ? opt_in.scrollVertical
            : true
        com.scrollHeight = is_def(opt_in.scrollHeight) ? opt_in.scrollHeight : 0
        com.scrollTransV = {
            now: 0,
            min: 0,
            max: 0,
            frac: 0,
            active: false,
            drag: { y: 0, frac: 0 },
        }
        com.scrollBarRecV = null

        com.scrollRecV = is_def(opt_in.scrollRecV) ? opt_in.scrollRecV : {}
        if (!is_def(com.scrollRecV.w)) {
            com.scrollRecV.w = com.outerBox.w * 0.015
        }
        if (!is_def(com.scrollRecV.h)) {
            com.scrollRecV.h = com.outerBox.h * 0.015
        }
        if (!is_def(com.scrollRecV.marg)) {
            com.scrollRecV.marg = 0.6
        }
        if (!is_def(com.scrollRecV.font_size)) {
            com.scrollRecV.font_size = com.scrollRecV.w
        }
        com.scrollRecV.x = com.outerBox.x + com.outerBox.w - com.scrollRecV.w
    }
    function setupVerticalZoom() {
        let zoomLen = [ -1, 1e20, 1e4 ]
        // let deltaWH       = com.innerBox.h * 0.1;

        let tag_zoom = com.tag_zoom + 'Vertical'
        let tagDrag = com.tagDrag + 'Vertical'
        let locker = com.locker
        let lockerV = com.lockerV
        let lockerZoom = com.lockerZoom

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_zoom + 'zoom_start'] = function() {
            com.isInZoom = true
        }

        com[tag_zoom + 'zoomsuring'] = function() {
            if (!com.scrollTransV.active) {
                return
            }

            com.inUserZoom = is_def(d3.event.sourceEvent)

            if (locker.are_free(lockerV.zoomsuring)) {
                locker.add({ id: lockerZoom.all, override: true })
                locker.add({ id: lockerZoom.during, override: true })

                let trans = null
                if (com.inUserZoom) {
                    let wdX = d3.event.sourceEvent.deltaX * 0.4
                    let wdY = d3.event.sourceEvent.deltaY * 0.4
                    let wdXY = Math.abs(wdX) > Math.abs(wdY) ? -1 * wdX : wdY

                    // trans = is_def(wdXY) ? (((wdXY < 0)?1:-1) * deltaWH) : 0;
                    trans = is_def(wdXY) ? -1 * wdXY : 0
                }

                let delay = doTrans({ trans: trans, duration: 0 })

                locker.remove({ id: lockerZoom.during, delay: delay })
            }
        }

        com[tag_zoom + 'zoomEnd'] = function() {
            com.isInZoom = false
            locker.remove({ id: lockerZoom.all, override: true })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tagDrag + 'dragStart'] = function() {
            if (!com.scrollTransV.active) {
                return
            }

            com.isInDrag = true

            // if(d3.event.x >= com.scrollRec.x) {
            //   let frac = (d3.event.y - com.innerBox.y) / (com.innerBox.h);
            //   frac = Math.min(1, Math.max(0, frac));
            //   let trans = (-1 * frac * (com.scrollTransV.max - com.scrollTransV.min)) - com.scrollTransV.now;

            //   com.doTrans({trans:trans}); //, duration:times.anim_arc/.2
            // }

            com.scrollTransV.drag.y = is_def(d3.event) ? d3.event.y : com.innerBox.y
            com.scrollTransV.drag.frac = com.scrollTransV.frac

            locker.add({ id: lockerZoom.all, override: true })
        }

        com[tagDrag + 'dragDuring'] = function() {
            if (!com.scrollTransV.active) {
                return
            }
            if (!is_def(d3.event)) {
                return
            }
            if (!is_def(d3.event.dy)) {
                return
            }

            if (locker.are_free(lockerV.zoomsuring)) {
                locker.add({ id: lockerZoom.all, override: true })
                locker.add({ id: lockerZoom.during, override: true })

                let trans = -1 * d3.event.dy
                // let frac  = (d3.event.y - com.innerBox.y)/com.innerBox.h;
                let frac =
          com.scrollTransV.drag.frac +
          (d3.event.y - com.scrollTransV.drag.y) / com.innerBox.h
                let delay =
          Math.abs(trans) > 0 ? doTrans({ frac: frac, duration: 0 }) : 0

                locker.remove({ id: lockerZoom.during, delay: delay })
            }
        }

        com[tagDrag + 'dragEnd'] = function() {
            com.isInDrag = false
            locker.remove({ id: lockerZoom.all, override: true })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function doTrans(opt_in) {
            let trans = opt_in.trans
            let frac = opt_in.frac
            let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim_arc
            duration = duration === 0 ? times.anim_arc : duration
            let isMoved = false
            let delay = 0

            if (is_def(trans)) {
                let now = com.scrollTransV.now
                if (now >= com.scrollTransV.max && trans > 0) {
                    trans = null
                }
                else if (now <= com.scrollTransV.min && trans < 0) {
                    trans = null
                }
                else {
                    now += trans
                    com.scrollTransV.now = Math.max(
                        com.scrollTransV.min,
                        Math.min(com.scrollTransV.max, now)
                    )
                    com.scrollTransV.frac = Math.abs(
                        com.scrollTransV.now / (com.scrollTransV.max - com.scrollTransV.min)
                    )
                }
                isMoved = is_def(trans)
            }
            else if (is_def(frac)) {
                com.scrollTransV.frac = Math.max(0, Math.min(1, frac))
                com.scrollTransV.now =
          com.scrollTransV.max +
          com.scrollTransV.frac * (com.scrollTransV.min - com.scrollTransV.max)
                isMoved = true
            }

            if (isMoved) {
                delay = com.zoomPause

                if (duration > 0) {
                    com.innerG
                        .transition('move')
                        .duration(duration)
                        .ease(d3.easeLinear)
                        .attr('transform', function(d, i) {
                            let shift = posShift()
                            return (
                                'translate(' +
                shift[0] +
                ',' +
                (com.scrollTransV.now + shift[1]) +
                ')'
                            )
                        })
                    com.clipRecInner
                        .transition('move')
                        .duration(duration)
                        .ease(d3.easeLinear)
                        .attr('transform', function(d, i) {
                            return 'translate(0,' + -com.scrollTransV.now + ')'
                        })
                    com.clipRecOuter
                        .transition('move')
                        .duration(duration)
                        .ease(d3.easeLinear)
                        .attr('transform', function(d, i) {
                            let shift = posShift()
                            return (
                                'translate(' +
                -shift[0] +
                ',' +
                (-shift[1] - com.scrollTransV.now) +
                ')'
                            )
                        })
                }
                else {
                    com.innerG.attr('transform', function(d, i) {
                        let shift = posShift()
                        return (
                            'translate(' +
              shift[0] +
              ',' +
              (com.scrollTransV.now + shift[1]) +
              ')'
                        )
                    })
                    com.clipRecInner.attr('transform', function(d, i) {
                        return 'translate(0,' + -com.scrollTransV.now + ')'
                    })
                    com.clipRecOuter.attr('transform', function(d, i) {
                        let shift = posShift()
                        return (
                            'translate(' +
              -shift[0] +
              ',' +
              (-shift[1] - com.scrollTransV.now) +
              ')'
                        )
                    })
                }
                com.zoomVerticalScrollBarUpdate()
            }

            return delay
        }
        com.doVerticalTrans = doTrans

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_zoom] = d3.zoom().scaleExtent([ zoomLen['0'], zoomLen['1'] ])
        com[tag_zoom]
            .on('start', com[tag_zoom + 'zoom_start'])
            .on('zoom', com[tag_zoom + 'zoomsuring'])
            .on('end', com[tag_zoom + 'zoomEnd'])

        // needed for auotomatic zoom
        com[tag_zoom + 'zoom_node'] = com.innerBox.g.nodes()[0]
        com[tag_zoom + 'zoomed'] = com.innerBox.g.append('g')

        com[tagDrag] = d3
            .drag()
            .on('start', com[tagDrag + 'dragStart'])
            .on('drag', com[tagDrag + 'dragDuring'])
            .on('end', com[tagDrag + 'dragEnd'])
        // .on("start", function(d) { com[tagDrag+"dragStart"](); })
        // .on("drag",  function(d) { let coords = d3.mouse(this); com[tagDrag+"_dragDuring"](coords); })
        // .on("end",   function(d) { com[tagDrag+"dragEnd"](); })

        com.scrollOuterG.call(com[tagDrag])
        com.scrollBarVG.call(com[tagDrag])

        setVerticalZoomStatus()
    }
    function setVerticalZoomStatus() {
        if (com.scrollTransV.active) {
            com.innerBox.g
                .call(com[com.tag_zoom + 'Vertical'])
                .on('dblclick.zoom', null)
        }
        else {
            com.innerBox.g.on('.zoom', null)
        }
    }
    function setupVerticalScrollBar() {
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
        function zoomVerticalScrollBarInit() {
            if (!com.locker.is_free(com.mainTag + 'zoomVerticalScrollBarInit')) {
                return
            }

            com.locker.add({
                id: com.mainTag + 'zoomVerticalScrollBarInit',
                override: true,
            })
            com.scrollBarRecV = null

            let nDone = 0
            let box = com.outerBox
            let dataBck = com.scrollTransV.active ? [{ id: 'zoom_scrollbar_bck' }] : []
            let recBck = com.scrollBarVG
                .selectAll('rect.' + com.tagScrollBar + 'bck')
                .data(dataBck, function(d) {
                    return d.id
                })

            // ------------------------------------------------------------------
            recBck
                .enter()
                .append('rect')
                .attr('class', com.tagScrollBar + 'bck')
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
            // click also does dragStart, but we need it for the smooth transition
                .on('click', function(d) {
                    recVerticalBckClickOnce({ coords: d3.mouse(this) })
                })
                .style('opacity', 1)
                .transition('in_out')
                .duration(times.anim_arc)
                .attr('x', com.scrollRecV.x)
                .attr('width', com.scrollRecV.w)
                .on('end', function(d) {
                    nDone += 1
                })

            recBck
                .exit()
                .transition('in_out')
                .duration(times.anim_arc)
                .attr('x', box.x + box.w)
                .attr('width', 0)
                .remove()
                .on('end', function(d) {
                    nDone += 1
                })

            // ------------------------------------------------------------------
            setVerticalRecScroll()

            //
            // ------------------------------------------------------------------
            let n_tries = 0
            let max_tries = 500
            function scrollBarRecSet() {
                setTimeout(function() {
                    // console.log('ndone/n_tries: ',nDone,n_tries);

                    if (nDone < 1 && n_tries < max_tries) {
                        scrollBarRecSet()
                    }
                    else {
                        if (n_tries >= max_tries) {
                            console.error('cant seem to init zoom_scrollbar ...')
                        }

                        com.scrollBarRecV = com.scrollBarVG.selectAll(
                            'rect.' + com.tagScrollBar + 'scroll'
                        )
                        com.locker.remove({ id: com.mainTag + 'zoomVerticalScrollBarInit' })
                    }
                    n_tries += 1
                }, times.anim_arc / 5)
            }

            if (com.scrollTransV.active) {
                scrollBarRecSet()
            }
            else {
                com.locker.remove({ id: com.mainTag + 'zoomVerticalScrollBarInit' })
            }
        }
        com.zoomVerticalScrollBarInit = zoomVerticalScrollBarInit

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function setVerticalRecScroll() {
            let box = com.outerBox
            let marg = com.scrollRecV.w * com.scrollRecV.marg / 2

            let dataScroll = com.scrollTransV.active
                ? [{ id: 'zoom_scrollbarScroll' }]
                : []
            let recScroll = com.scrollBarVG
                .selectAll('rect.' + com.tagScrollBar + 'scroll')
                .data(dataScroll, function(d) {
                    return d.id
                })

            recScroll
                .enter()
                .append('rect')
                .attr('class', com.tagScrollBar + 'scroll')
                .attr('stroke', '#383B42')
                .attr('stroke-width', '1')
                .style('stroke-opacity', '0.5')
                .style('fill', '#383B42')
                .style('fill-opacity', '0.9')
                .style('pointer-events', 'none')
                .attr('x', box.x + box.w)
                .attr('y', box.y + marg)
                .attr('width', 0)
                .attr('height', com.scrollRecV.h - marg * 2)
                .attr('transform', zoomVerticalScrollBarTrans)
                .merge(recScroll)
                .transition('in_out')
                .duration(times.anim_arc)
                .attr('transform', zoomVerticalScrollBarTrans)
                .attr('x', box.x + box.w - com.scrollRecV.w + marg)
                .attr('y', box.y + marg)
                .attr('width', com.scrollRecV.w - marg * 2)
                .attr('height', com.scrollRecV.h - marg * 2)

            recScroll
                .exit()
                .transition('in_out')
                .duration(times.anim_arc * 3 / 4)
                .attr('x', box.x + box.w)
                .attr('y', box.y + marg)
                .attr('width', 0)
                .remove()
        }
        com.setVerticalRecScroll = setVerticalRecScroll

        // ------------------------------------------------------------------
        // instant transition in case of dragging
        // ------------------------------------------------------------------
        function zoomVerticalScrollBarUpdate() {
            if (!is_def(com.scrollBarRecV)) {
                return
            }

            if (com.isInDrag || com.inUserZoom) {
                com.scrollBarRecV.attr('transform', zoomVerticalScrollBarTrans)
            }
            else {
                com.scrollBarRecV
                    .transition('move')
                    .duration(times.anim_arc / 4)
                    .attr('transform', zoomVerticalScrollBarTrans)
            }
        }
        com.zoomVerticalScrollBarUpdate = zoomVerticalScrollBarUpdate

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function zoomVerticalScrollBarTrans() {
            // let pos = com.scrollTrans.frac * (com.outerBox.h - com.scrollRec.w*2);
            // return "translate("+(com.outerBox.x)+","+(com.outerBox.y + pos)+")";
            let pos = com.scrollTransV.frac * (com.outerBox.h - com.scrollRecV.h)
            return 'translate(0,' + pos + ')'
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.run_loop.init({
            tag: com.mainTag + 'recVerticalBckClick',
            func: recVerticalBckClickOnce,
            n_keep: 1,
        })

        function recVerticalBckClick(data_in) {
            com.run_loop.push({
                tag: com.mainTag + 'recVerticalBckClick',
                data: data_in,
            })
        }
        com.recVerticalBckClick = recVerticalBckClick

        let nClickTries = 0
        function recVerticalBckClickOnce(data_in) {
            if (
                com.isInZoom ||
        com.isInDrag ||
        (com.scrollTransV.active && !is_def(com.scrollBarRecV))
            ) {
                // console.log('delay recVerticalBckClickOnce',[com.isInZoom,com.isInDrag],[com.scrollTrans.active,is_def(com.scrollBarRec)]);
                if (nClickTries < 100) {
                    setTimeout(function() {
                        nClickTries += 1
                        recVerticalBckClick(data_in)
                    }, times.anim_arc / 2)
                }
                else {
                    console.error('cant do recVerticalBckClick ...', data_in)
                }
                return
            }
            nClickTries = 0

            let frac = data_in.frac
            if (!is_def(frac) && is_def(data_in.coords)) {
                frac = (data_in.coords[1] - com.outerBox.y) / com.outerBox.h
            }

            if (is_def(frac)) {
                frac = Math.min(1, Math.max(0, frac))
                let trans =
          -1 * frac * (com.scrollTrans.max - com.scrollTrans.min) -
          com.scrollTrans.now

                com.doTrans({ trans: trans })
            }
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (com.scrollTransV.active) {
            zoomVerticalScrollBarInit()
        }

        resetVerticalScroller({ duration: 0 })
    }
    function resetVerticalScroller(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {}
        }
        let old = { frac: com.scrollTransV.frac, scrollHeight: com.scrollHeight }
        let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim_arc / 2

        if (is_def(opt_in.canScroll)) {
            com.canScroll = opt_in.canScroll
        }
        if (is_def(opt_in.scrollVertical)) {
            com.scrollVertical = opt_in.scrollVertical
        }
        if (is_def(opt_in.scrollHeight)) {
            com.scrollHeight = opt_in.scrollHeight
        }

        let prevActive = com.scrollTransV.active
        setVerticalScrollState(
            opt_in.keepFrac && old.scrollHeight > 0 ? old : undefined
        )

        // if (opt_in.keepFrac) {
        //   com.scrollTransV.frac = (old.frac * com.scrollHeight) / old.scrollHeight
        // }
        if (prevActive !== com.scrollTransV.active) {
            setBox()
        }
        // com.innerG
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', function (d, i) {
        //     let shift = posShift()
        //     return 'translate(' + shift[0] + ',' + shift[1] + ')'
        //   })
        //
        // com.clipRecInner
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', 'translate(0,0)')
        //
        // com.clipRecOuter
        //   .transition('move')
        //   .duration(duration)
        //   .attr('transform', function (d, i) {
        //     let shift = posShift()
        //     return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
        //   })

        if (prevActive !== com.scrollTransV.active) {
            setVerticalZoomStatus()
            com.zoomVerticalScrollBarInit()
        }
        else if (com.scrollTransV.active) {
            com.setVerticalRecScroll()
        }
        updateVerticalScrollState(true)
        com.setVerticalRecScroll()
        com.doVerticalTrans({ frac: com.scrollTransV.frac, duration: 0 })
    }
    this.resetVerticalScroller = resetVerticalScroller
    function setVerticalScrollState(old) {
        let boxH = com.innerBox.h // com.outerBox.h - com.outerBox.marg * 2;

        if (com.canScroll && com.scrollVertical) {
            com.scrollTransV.active = Math.abs(com.scrollHeight) > boxH
        }

        com.scrollTransV.min = is_def(com.scrollHeight)
            ? -1 * Math.abs(com.scrollHeight - boxH)
            : 0
        com.scrollTransV.max = 0
        if (old) {
            if (old.frac < 1) {
                com.scrollTransV.frac = com.scrollTransV.now / com.scrollTransV.min
            }
            else {
                com.scrollTransV.frac = 1
                com.scrollTransV.now = com.scrollTransV.min * com.scrollTransV.frac
            }
        }
        else {
            com.scrollTransV.frac = 0
            com.scrollTransV.now = com.scrollTransV.min * com.scrollTransV.frac
        }
        com.scrollRecV.h = boxH * boxH / Math.abs(com.scrollHeight)
    }
    function updateVerticalScrollState(keepFrac) {
        let boxH = com.innerBox.h // com.outerBox.h - com.outerBox.marg * 2;
        if (com.canScroll && com.scrollVertical) {
            com.scrollTransV.active = Math.abs(com.scrollHeight) > boxH
        }

        com.scrollTransV.min = is_def(com.scrollHeight)
            ? -1 * Math.abs(com.scrollHeight - boxH)
            : 0
        com.scrollTransV.max = 0
        if (!keepFrac) {
            com.scrollTransV.frac = 0
        }
        if (com.scrollTransV.now < com.scrollTransV.min) {
            com.scrollTransV.now = com.scrollTransV.min
        }
        else if (com.scrollTransV.now > com.scrollTransV.max) {
            com.scrollTransV.now = com.scrollTransV.max
        }
        com.scrollRecV.h = boxH * boxH / Math.abs(com.scrollHeight)
    } // NO

    function initHorizontalScroll(opt_in) {
        com.scrollHorizontal = is_def(opt_in.scrollHorizontal)
            ? opt_in.scrollHorizontal
            : true
        com.scrollWidth = is_def(opt_in.scrollWidth) ? opt_in.scrollWidth : 0
        com.scrollTransH = {
            now: 0,
            min: 0,
            max: 0,
            frac: 0,
            active: false,
            drag: { y: 0, frac: 0 },
        }
        com.scrollBarRecH = null

        com.scrollRecH = is_def(opt_in.scrollRecH) ? opt_in.scrollRecH : {}
        if (!is_def(com.scrollRecH.w)) {
            com.scrollRecH.w = com.outerBox.w * 0.015
        }
        if (!is_def(com.scrollRecH.h)) {
            com.scrollRecH.h = com.outerBox.h * 0.015
        }
        if (!is_def(com.scrollRecH.marg)) {
            com.scrollRecH.marg = 0.6
        }
        if (!is_def(com.scrollRecH.font_size)) {
            com.scrollRecH.font_size = com.scrollRecH.w
        }
        com.scrollRecH.y = com.outerBox.y + com.outerBox.h - com.scrollRecH.h
    }
    function setupHorizontalZoom() {
        let zoomLen = [ -1, 1e20, 1e4 ]
        // let deltaWH       = com.innerBox.h * 0.1;

        let tag_zoom = com.tag_zoom + 'Horizontal'
        let tagDrag = com.tagDrag + 'Horizontal'
        let locker = com.locker
        let lockerV = com.lockerV
        let lockerZoom = com.lockerZoom

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_zoom + 'zoom_start'] = function() {
            com.isInZoom = true
        }
        com[tag_zoom + 'zoomsuring'] = function() {
            if (!com.scrollTransH.active) {
                return
            }

            com.inUserZoom = is_def(d3.event.sourceEvent)

            if (locker.are_free(lockerV.zoomsuring)) {
                locker.add({ id: lockerZoom.all, override: true })
                locker.add({ id: lockerZoom.during, override: true })

                let trans = null
                if (com.inUserZoom) {
                    let wdX = d3.event.sourceEvent.deltaX
                    let wdY = d3.event.sourceEvent.deltaY
                    let wdXY = Math.abs(wdX) > Math.abs(wdY) ? -1 * wdX : wdY

                    // trans = is_def(wdXY) ? (((wdXY < 0)?1:-1) * deltaWH) : 0;
                    trans = is_def(wdXY) ? -1 * wdXY : 0
                }
                let delay = doTrans({ trans: trans, duration: 0 })

                locker.remove({ id: lockerZoom.during, delay: delay })
            }
        }
        com[tag_zoom + 'zoomEnd'] = function() {
            com.isInZoom = false
            locker.remove({ id: lockerZoom.all, override: true })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tagDrag + 'dragStart'] = function() {
            if (!com.scrollTransH.active) {
                return
            }

            com.isInDrag = true

            // if(d3.event.x >= com.scrollRec.x) {
            //   let frac = (d3.event.y - com.innerBox.y) / (com.innerBox.h);
            //   frac = Math.min(1, Math.max(0, frac));
            //   let trans = (-1 * frac * (com.scrollTransV.max - com.scrollTransV.min)) - com.scrollTransV.now;

            //   com.doTrans({trans:trans}); //, duration:times.anim_arc/.2
            // }

            com.scrollTransH.drag.x = is_def(d3.event) ? d3.event.x : com.innerBox.x
            com.scrollTransH.drag.frac = com.scrollTransH.frac

            locker.add({ id: lockerZoom.all, override: true })
        }
        com[tagDrag + 'dragDuring'] = function() {
            if (!com.scrollTransH.active) {
                return
            }
            if (!is_def(d3.event)) {
                return
            }
            if (!is_def(d3.event.dy)) {
                return
            }

            if (locker.are_free(lockerV.zoomsuring)) {
                locker.add({ id: lockerZoom.all, override: true })
                locker.add({ id: lockerZoom.during, override: true })

                let trans = -1 * d3.event.dx
                // let frac  = (d3.event.y - com.innerBox.y)/com.innerBox.h;
                let frac =
          com.scrollTransH.drag.frac +
          (d3.event.x - com.scrollTransH.drag.x) / com.innerBox.w
                let delay =
          Math.abs(trans) > 0 ? doTrans({ frac: frac, duration: 0 }) : 0

                locker.remove({ id: lockerZoom.during, delay: delay })
            }
        }
        com[tagDrag + 'dragEnd'] = function() {
            com.isInDrag = false
            locker.remove({ id: lockerZoom.all, override: true })
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function doTrans(opt_in) {
            let trans = opt_in.trans
            let frac = opt_in.frac
            let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim_arc
            let isMoved = false
            let delay = 0

            if (is_def(trans)) {
                let now = com.scrollTransH.now
                if (now >= com.scrollTransH.max && trans > 0) {
                    trans = null
                }
                else if (now <= com.scrollTransH.min && trans < 0) {
                    trans = null
                }
                else {
                    now += trans
                    com.scrollTransH.now = Math.max(
                        com.scrollTransH.min,
                        Math.min(com.scrollTransH.max, now)
                    )
                    com.scrollTransH.frac = Math.abs(
                        com.scrollTransH.now / (com.scrollTransH.max - com.scrollTransH.min)
                    )
                }
                isMoved = is_def(trans)
            }
            else if (is_def(frac)) {
                com.scrollTransH.frac = Math.max(0, Math.min(1, frac))
                com.scrollTransH.now =
          com.scrollTransH.max +
          com.scrollTransH.frac * (com.scrollTransH.min - com.scrollTransH.max)
                isMoved = true
            }

            if (isMoved) {
                delay = com.zoomPause

                if (duration > 0) {
                    com.innerG
                        .transition('move')
                        .duration(duration)
                        .attr('transform', function(d, i) {
                            let shift = posShift()
                            return (
                                'translate(' +
                (com.scrollTransH.now + shift[0]) +
                ',' +
                shift[1] +
                ')'
                            )
                        })
                    com.clipRecInner
                        .transition('move')
                        .duration(duration)
                        .attr('transform', function(d, i) {
                            return 'translate(' + -com.scrollTransH.now + ',0)'
                        })
                    com.clipRecOuter
                        .transition('move')
                        .duration(duration)
                        .attr('transform', function(d, i) {
                            let shift = posShift()
                            return (
                                'translate(' +
                (-shift[0] - com.scrollTransH.now) +
                ',' +
                -shift[1] +
                ')'
                            )
                        })
                }
                else {
                    com.innerG.attr('transform', function(d, i) {
                        let shift = posShift()
                        return (
                            'translate(' +
              (com.scrollTransH.now + shift[0]) +
              ',' +
              shift[1] +
              ')'
                        )
                    })
                    com.clipRecInner.attr('transform', function(d, i) {
                        return 'translate(' + -com.scrollTransH.now + ',0)'
                    })
                    com.clipRecOuter.attr('transform', function(d, i) {
                        let shift = posShift()
                        return (
                            'translate(' +
              (-shift[0] - com.scrollTransH.now) +
              ',' +
              -shift[1] +
              ')'
                        )
                    })
                }
                com.zoomHorizontalScrollBarUpdate()
            }

            return delay
        }
        com.doHorizontalTrans = doTrans

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com[tag_zoom] = d3.zoom().scaleExtent([ zoomLen['0'], zoomLen['1'] ])
        com[tag_zoom]
            .on('start', com[tag_zoom + 'zoom_start'])
            .on('zoom', com[tag_zoom + 'zoomsuring'])
            .on('end', com[tag_zoom + 'zoomEnd'])

        // needed for auotomatic zoom
        com[tag_zoom + 'zoom_node'] = com.innerBox.g.nodes()[0]
        com[tag_zoom + 'zoomed'] = com.innerBox.g.append('g')

        com[tagDrag] = d3
            .drag()
            .on('start', com[tagDrag + 'dragStart'])
            .on('drag', com[tagDrag + 'dragDuring'])
            .on('end', com[tagDrag + 'dragEnd'])
        // .on("start", function(d) { com[tagDrag+"dragStart"](); })
        // .on("drag",  function(d) { let coords = d3.mouse(this); com[tagDrag+"_dragDuring"](coords); })
        // .on("end",   function(d) { com[tagDrag+"dragEnd"](); })

        com.scrollOuterG.call(com[tagDrag])
        com.scrollBarHG.call(com[tagDrag])

        setHorizontalZoomStatus()
    }
    function setHorizontalZoomStatus() {
        if (com.scrollTransV.active) {
            return
        }
        if (com.scrollTransH.active) {
            com.innerBox.g
                .call(com[com.tag_zoom + 'Horizontal'])
                .on('dblclick.zoom', null)
        }
        else {
            com.innerBox.g.on('.zoom', null)
        }
    } // NO
    function setupHorizontalScrollBar() {
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
        function zoomHorizontalScrollBarInit() {
            if (!com.locker.is_free(com.mainTag + 'zoomHorizontalScrollBarInit')) {
                return
            }

            com.locker.add({
                id: com.mainTag + 'zoomHorizontalScrollBarInit',
                override: true,
            })
            com.scrollBarRecH = null

            let nDone = 0
            let box = com.outerBox
            let dataBck = com.scrollTransH.active ? [{ id: 'zoom_scrollbar_bck' }] : []
            let recBck = com.scrollBarHG
                .selectAll('rect.' + com.tagScrollBar + 'bck')
                .data(dataBck, function(d) {
                    return d.id
                })

            // ------------------------------------------------------------------
            recBck
                .enter()
                .append('rect')
                .attr('class', com.tagScrollBar + 'bck')
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
            // click also does dragStart, but we need it for the smooth transition
                .on('click', function(d) {
                    recHorizontalBckClickOnce({ coords: d3.mouse(this) })
                })
                .style('opacity', 1)
                .transition('in_out')
                .duration(times.anim_arc)
                .attr('y', com.scrollRecH.y)
                .attr('height', com.scrollRecH.h)
                .on('end', function(d) {
                    nDone += 1
                })

            recBck
                .exit()
                .transition('in_out')
                .duration(times.anim_arc)
                .attr('y', box.y + box.h)
                .attr('height', 0)
                .remove()
                .on('end', function(d) {
                    nDone += 1
                })

            // ------------------------------------------------------------------
            setHorizontalRecScroll()

            //
            // ------------------------------------------------------------------
            let n_tries = 0
            let max_tries = 500
            function scrollBarRecSet() {
                setTimeout(function() {
                    // console.log('ndone/n_tries: ',nDone,n_tries);

                    if (nDone < 1 && n_tries < max_tries) {
                        scrollBarRecSet()
                    }
                    else {
                        if (n_tries >= max_tries) {
                            console.error('cant seem to init zoom_scrollbar ...')
                        }

                        com.scrollBarRecH = com.scrollBarHG.selectAll(
                            'rect.' + com.tagScrollBar + 'scroll'
                        )
                        com.locker.remove({
                            id: com.mainTag + 'zoomHorizontalScrollBarInit',
                        })
                    }
                    n_tries += 1
                }, times.anim_arc / 5)
            }

            if (com.scrollTransH.active) {
                scrollBarRecSet()
            }
            else {
                com.locker.remove({ id: com.mainTag + 'zoomHorizontalScrollBarInit' })
            }
        }
        com.zoomHorizontalScrollBarInit = zoomHorizontalScrollBarInit

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function setHorizontalRecScroll() {
            let box = com.outerBox
            let marg = com.scrollRecH.h * com.scrollRecH.marg / 2

            let dataScroll = com.scrollTransH.active
                ? [{ id: 'zoom_scrollbarScroll' }]
                : []
            let recScroll = com.scrollBarHG
                .selectAll('rect.' + com.tagScrollBar + 'scroll')
                .data(dataScroll, function(d) {
                    return d.id
                })

            recScroll
                .enter()
                .append('rect')
                .attr('class', com.tagScrollBar + 'scroll')
                .attr('stroke', '#383B42')
                .attr('stroke-width', '1')
                .style('stroke-opacity', '0.5')
                .style('fill', '#383B42')
                .style('fill-opacity', '0.9')
                .style('pointer-events', 'none')
                .attr('y', box.y + box.h)
                .attr('x', box.x + marg)
                .attr('width', com.scrollRecH.w)
                .attr('height', 0)
                .attr('transform', zoomHorizontalScrollBarTrans)
                .merge(recScroll)
                .transition('in_out')
                .duration(times.anim_arc)
                .attr('transform', zoomHorizontalScrollBarTrans)
                .attr('y', box.y + box.h - com.scrollRecH.h + marg)
                .attr('x', box.x + marg)
                .attr('width', com.scrollRecH.w)
                .attr('height', com.scrollRecH.h - marg * 2)
            recScroll
                .exit()
                .transition('in_out')
                .duration(times.anim_arc * 3 / 4)
                .attr('y', box.y + box.y)
                .attr('x', box.x + marg)
                .attr('height', 0)
                .remove()
        }
        com.setHorizontalRecScroll = setHorizontalRecScroll

        // ------------------------------------------------------------------
        // instant transition in case of dragging
        // ------------------------------------------------------------------
        function zoomHorizontalScrollBarUpdate() {
            if (!is_def(com.scrollBarRecH)) {
                return
            }
            if (com.isInDrag || com.inUserZoom) {
                com.scrollBarRecH.attr('transform', zoomHorizontalScrollBarTrans)
            }
            else {
                com.scrollBarRecH
                    .transition('move')
                    .duration(times.anim_arc / 4)
                    .attr('transform', zoomHorizontalScrollBarTrans)
            }
        }
        com.zoomHorizontalScrollBarUpdate = zoomHorizontalScrollBarUpdate

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        function zoomHorizontalScrollBarTrans() {
            // let pos = com.scrollTrans.frac * (com.outerBox.h - com.scrollRec.w*2);
            // return "translate("+(com.outerBox.x)+","+(com.outerBox.y + pos)+")";
            let pos = com.scrollTransH.frac * (com.outerBox.w - com.scrollRecH.w)
            return 'translate(' + pos + ', 0)'
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        com.run_loop.init({
            tag: com.mainTag + 'recHorizontalBckClick',
            func: recHorizontalBckClickOnce,
            n_keep: 1,
        })

        function recHorizontalBckClick(data_in) {
            com.run_loop.push({
                tag: com.mainTag + 'recHorizontalBckClick',
                data: data_in,
            })
        }
        com.recHorizontalBckClick = recHorizontalBckClick

        let nClickTries = 0
        function recHorizontalBckClickOnce(data_in) {
            if (
                com.isInZoom ||
        com.isInDrag ||
        (com.scrollTransH.active && !is_def(com.scrollBarRecH))
            ) {
                // console.log('delay recHorizontalBckClickOnce',[com.isInZoom,com.isInDrag],[com.scrollTrans.active,is_def(com.scrollBarRec)]);
                if (nClickTries < 100) {
                    setTimeout(function() {
                        nClickTries += 1
                        recHorizontalBckClick(data_in)
                    }, times.anim_arc / 2)
                }
                else {
                    console.error('cant do recHorizontalBckClick ...', data_in)
                }
                return
            }
            nClickTries = 0

            let frac = data_in.frac
            if (!is_def(frac) && is_def(data_in.coords)) {
                frac = (data_in.coords[1] - com.outerBox.y) / com.outerBox.h
            }

            if (is_def(frac)) {
                frac = Math.min(1, Math.max(0, frac))
                let trans =
          -1 * frac * (com.scrollTrans.max - com.scrollTrans.min) -
          com.scrollTrans.now

                com.doTrans({ trans: trans })
            }
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        if (com.scrollTransH.active) {
            zoomHorizontalScrollBarInit()
        }

        resetHorizontalScroller({ duration: 0 })
    } // NO
    function resetHorizontalScroller(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {}
        }
        let old = { frac: com.scrollTransH.frac, scrollWidth: com.scrollWidth }
        let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim_arc / 2

        if (is_def(opt_in.canScroll)) {
            com.canScroll = opt_in.canScroll
        }
        if (is_def(opt_in.scrollVertical)) {
            com.scrollHorizontal = opt_in.scrollHorizontal
        }
        if (is_def(opt_in.scrollWidth)) {
            com.scrollWidth = opt_in.scrollWidth
        }

        let prevActive = com.scrollTransH.active
        setHorizontalScrollState(
            opt_in.keepFrac && old.scrollWidth > 0 ? old : undefined
        )

        if (prevActive !== com.scrollTransH.active) {
            setBox()
        }

        if (prevActive !== com.scrollTransH.active) {
            setHorizontalZoomStatus()
            com.zoomHorizontalScrollBarInit()
        }
        else if (com.scrollTransH.active) {
            com.setHorizontalRecScroll()
        }
        updateHorizontalScrollState(true)
        com.setHorizontalRecScroll()
        com.doHorizontalTrans({ frac: com.scrollTransH.frac, duration: 0 })
    }
    this.resetHorizontalScroller = resetHorizontalScroller
    function setHorizontalScrollState() {
        let boxW = com.innerBox.w // com.outerBox.h - com.outerBox.marg * 2;
        if (com.canScroll && com.scrollHorizontal) {
            com.scrollTransH.active = Math.abs(com.scrollWidth) > boxW
        }

        com.scrollTransH.min = is_def(com.scrollWidth)
            ? -1 * Math.abs(com.scrollWidth - boxW)
            : 0
        com.scrollTransH.max = 0
        com.scrollTransH.frac = 0
        com.scrollTransH.now = com.scrollTransH.max
        com.scrollRecH.w = boxW * boxW / Math.abs(com.scrollWidth)
    } // NO
    function updateHorizontalScrollState(keepFrac) {
        let boxW = com.innerBox.w // com.outerBox.h - com.outerBox.marg * 2;
        if (com.canScroll && com.scrollHorizontal) {
            com.scrollTransH.active = Math.abs(com.scrollWidth) > boxW
        }

        com.scrollTransH.min = is_def(com.scrollWidth)
            ? -1 * Math.abs(com.scrollWidth - boxW)
            : 0
        com.scrollTransH.max = 0
        if (!keepFrac) {
            com.scrollTransH.frac = 0
        }
        if (com.scrollTransH.now < com.scrollTransH.min) {
            com.scrollTransH.now = com.scrollTransH.min
        }
        else if (com.scrollTransH.now > com.scrollTransH.max) {
            com.scrollTransH.now = com.scrollTransH.max
        }
        com.scrollRecH.w = boxW * boxW / Math.abs(com.scrollWidth)
    } // NO

    function updateBox(box, duration) {
        updateClipping(box, duration)
    }
    this.updateBox = updateBox

    function resetScroller(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {}
        }
        let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim_arc / 2

        if (is_def(opt_in.canScroll)) {
            com.canScroll = opt_in.canScroll
        }
        if (is_def(opt_in.scrollVertical)) {
            com.scrollVertical = opt_in.scrollVertical
        }
        if (is_def(opt_in.scrollHeight)) {
            com.scrollHeight = opt_in.scrollHeight
        }

        let prevActive = com.scrollTransV.active
        setVerticalScrollState()

        if (prevActive !== com.scrollTransV.active) {
            setBox()
        }

        com.innerG
            .transition('move')
            .duration(duration)
            .attr('transform', function(d, i) {
                let shift = posShift()
                return 'translate(' + shift[0] + ',' + shift[1] + ')'
            })

        com.clipRecInner
            .transition('move')
            .duration(duration)
            .attr('transform', 'translate(0,0)')

        com.clipRecOuter
            .transition('move')
            .duration(duration)
            .attr('transform', function(d, i) {
                let shift = posShift()
                return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
            })

        if (prevActive !== com.scrollTransV.active) {
            setVerticalZoomStatus()
            com.zoomVerticalScrollBarInit()
        }
        else if (com.scrollTransV.active) {
            com.setVerticalRecScroll()
        }
    }
    this.resetScroller = resetScroller

    function moveHorizontalScrollerTo(target) {
        com.scrollTransH.frac = target
        com.zoomHorizontalScrollBarUpdate()
        com.doHorizontalTrans({ frac: target, duration: 400 })
    }
    this.moveHorizontalScrollerTo = moveHorizontalScrollerTo

    function moveVerticalScrollerTo(target) {
        com.scrollTransV.frac = target
        com.zoomVerticalScrollBarUpdate()
        com.doVerticalTrans({ frac: target, duration: 400 })
    }
    this.moveVerticalScrollerTo = moveVerticalScrollerTo

    function updateHorizontalScroller(opt_in) {
        if (!com.scrollTransH.active) {
            return
        }

        if (!is_def(opt_in)) {
            opt_in = {}
        }

        if (is_def(opt_in.scrollWidth)) {
            com.scrollWidth = opt_in.scrollWidth
        }
        // if (is_def(opt_in.boxWidth)) com.scrollWidth = opt_in.boxWidth
        // if (is_def(opt_in.frac)) com.scrollWidth = opt_in.frac

        updateHorizontalScrollState(true)
        com.setHorizontalRecScroll()
        com.doHorizontalTrans({ frac: com.scrollTransH.frac, duration: 0 })
    // setHorizontalZoomStatus()
    // if (prevActive !== com.scrollTransH.active) {
    //   setHorizontalZoomStatus()
    //   com.zoomHorizontalScrollBarInit()
    // }

    // if (prevActive !== com.scrollTransH.active) {
    //   setBox()
    // }
    //
    // com.innerG
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', function (d, i) {
    //     let shift = posShift()
    //     return 'translate(' + shift[0] + ',' + shift[1] + ')'
    //   })
    // com.clipRecInner
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', 'translate(0,0)')
    // com.clipRecOuter
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', function (d, i) {
    //     let shift = posShift()
    //     return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
    //   })
    //
    }
    this.updateHorizontalScroller = updateHorizontalScroller

    function updateVerticalScroller(opt_in) {
        if (!com.scrollTransV.active) {
            return
        }

        if (!is_def(opt_in)) {
            opt_in = {}
        }

        if (is_def(opt_in.scrollHeight)) {
            com.scrollHeight = opt_in.scrollHeight
        }
        // if (is_def(opt_in.boxWidth)) com.scrollWidth = opt_in.boxWidth
        // if (is_def(opt_in.frac)) com.scrollWidth = opt_in.frac
        updateVerticalScrollState(true)
        com.setVerticalRecScroll()
        com.doVerticalTrans({ frac: com.scrollTransV.frac, duration: 0 })
    // setHorizontalZoomStatus()
    // if (prevActive !== com.scrollTransH.active) {
    //   setHorizontalZoomStatus()
    //   com.zoomHorizontalScrollBarInit()
    // }

    // if (prevActive !== com.scrollTransH.active) {
    //   setBox()
    // }
    //
    // com.innerG
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', function (d, i) {
    //     let shift = posShift()
    //     return 'translate(' + shift[0] + ',' + shift[1] + ')'
    //   })
    // com.clipRecInner
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', 'translate(0,0)')
    // com.clipRecOuter
    //   .transition('move')
    //   .duration(duration)
    //   .attr('transform', function (d, i) {
    //     let shift = posShift()
    //     return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
    //   })
    //
    }
    this.updateVerticalScroller = updateVerticalScroller
    // function updateScrollerSize (opt_in) {
    //   if (!is_def(opt_in)) opt_in = {}
    //   let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim_arc / 2
    //
    //   if (is_def(opt_in.canScroll)) com.canScroll = opt_in.canScroll
    //   if (is_def(opt_in.scrollVertical)) com.scrollVertical = opt_in.scrollVertical
    //   if (is_def(opt_in.scrollHeight)) com.scrollHeight = opt_in.scrollHeight
    //
    //   let prevActive = com.scrollTransV.active
    //   setVerticalScrollState()
    //
    //   if (prevActive !== com.scrollTransV.active) {
    //     setBox()
    //   }
    //
    //   com.innerG
    //     .transition('move')
    //     .duration(duration)
    //     .attr('transform', function (d, i) {
    //       let shift = posShift()
    //       return 'translate(' + shift[0] + ',' + shift[1] + ')'
    //     })
    //
    //   com.clipRecInner
    //     .transition('move')
    //     .duration(duration)
    //     .attr('transform', 'translate(0,0)')
    //
    //   com.clipRecOuter
    //     .transition('move')
    //     .duration(duration)
    //     .attr('transform', function (d, i) {
    //       let shift = posShift()
    //       return 'translate(' + -shift[0] + ',' + -shift[1] + ')'
    //     })
    //
    //   if (prevActive !== com.scrollTransV.active) {
    //     setVerticalZoomStatus()
    //     com.zoomVerticalScrollBarInit()
    //   } else if (com.scrollTransV.active) {
    //     com.setVerticalRecScroll()
    //   }
    // }
    // this.updateScrollerSize = updateScrollerSize

    function getScrollProp(mode) {
        if (mode === 'vertical') {
            return com.scrollTransV
        }
        else if (mode === 'horizontal') {
            return com.scrollTransH
        }
    }
    this.getScrollProp = getScrollProp
}
