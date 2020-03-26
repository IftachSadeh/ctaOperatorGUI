/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global col_prime */
/* global cols_reds */
/* global deep_copy */
/* global min_max_obj */
/* global cols_blues */
/* global cols_purples */
/* global load_script */
/* global ScrollBox */
/* global cols_greens */
/* global cols_yellows */
/* global cols_purples_blues */

load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/ScrollBox.js',
})

window.EventQueue = function() {
    let template = {
        tag: 'eventQueueDefaultTag',
        g: undefined,
        box: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
        },
        axis: {
            enabled: true,
            group: {
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                },
            },
            main: undefined,
            scale: undefined,
            domain: [ 0, 1000 ],
            range: [ 0, 0 ],
            showText: true,
            orientation: 'axisTop',
        },
        blocks: {
            enabled: true,
            group: {
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                },
            },
            events: {
                click: () => {},
                mouseover: () => {},
                mouseout: () => {},
            },
        },
        filters: {
            enabled: false,
            group: {
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                },
            },
            filters: [],
        },
        timeBars: {
            enabled: true,
            group: {
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                },
            },
        },
        data: {
            currentTime: {
                date: undefined,
                time: undefined,
            },
            start_time: {
                date: undefined,
                time: undefined,
            },
            end_time: {
                date: undefined,
                time: undefined,
            },
            lastRawData: undefined,
            formatedData: undefined,
        },
        debug: {
            enabled: false,
        },
    }
    let com = deep_copy(template)

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

    function init(opt_in) {
        com = opt_in
        initBackground()
        initAxis()
        initBlocks()
        initFilters()
        initTimeBars()
        setStyle()
    }
    this.init = init

    function initBackground() {
        com.main.g.append('rect')
            .attr('class', 'background')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', com.main.box.w)
            .attr('height', com.main.box.h)
            .style('fill', com.main.background.fill)
            .style('stroke', com.main.background.stroke)
            .style('stroke-width', com.main.background.strokeWidth)
    // back.style('opacity', 0)
    //   .transition()
    //   .duration(1000)
    //   .delay(1000)
    //   .style('opacity', 1)
    }
    function initAxis() {
        if (!com.axis.enabled) {
            return
        }
        com.axis.group.g = com.g.append('g')
            .attr('transform', 'translate(' + com.axis.group.box.x + ',' + com.axis.group.box.y + ')')

        com.axis.scale = d3.scaleTime()
            .range(com.axis.range)
            .domain(com.axis.domain)
        com.axis.main = d3.axisTop(com.axis.scale)
            .tickFormat('')
        com.axis.group.g
            .attr('class', 'axis')
            .call(com.axis.main)
        com.axis.group.g.select('path').attr('stroke-width', 1.5).attr('stroke', com.main.color_theme.dark.stroke)
        com.axis.group.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 1.5).attr('stroke', com.main.color_theme.dark.stroke)
        com.axis.group.g.selectAll('g.tick').selectAll('text').attr('stroke', com.main.color_theme.dark.text).attr('fill', com.main.color_theme.dark.text)
    }
    function initBlocks() {
        if (!com.blocks.enabled) {
            return
        }
        com.blocks.group.g = com.g.append('g')
            .attr('transform', 'translate(' + com.blocks.group.box.x + ',' + com.blocks.group.box.y + ')')
    }
    function initFilters() {
        if (!com.filters.enabled) {
            return
        }
        function create_button(position, type, priority, filter) {
            let new_button = buttonPanel.add_button(position)
            new_button.attr('status', 'disabled')

            let clickFunction = function(rect, filter) {
                if (new_button.attr('status') === 'enabled') {
                    new_button.attr('status', 'disabled')
                    rect.attr('stroke', function(d, i) {
                        return '#000000'
                    })
                        .attr('stroke-width', 4.5)
                        .style('stroke-opacity', 0.6)
                    new_button.append('line')
                        .attr('class', 'checkboxBar')
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', (Number(new_button.attr('width'))))
                        .attr('y2', (Number(new_button.attr('height'))))
                        .attr('stroke', '#000000')
                        .style('stroke-opacity', 0.9)
                        .attr('stroke-width', 3)
                        .style('pointer-events', 'none')
                    new_button.append('line')
                        .attr('class', 'checkboxBar')
                        .attr('x1', 0)
                        .attr('y1', (Number(new_button.attr('height'))))
                        .attr('x2', (Number(new_button.attr('width'))))
                        .attr('y2', 0)
                        .attr('stroke', '#000000')
                        .style('stroke-opacity', 0.9)
                        .attr('stroke-width', 3)
                        .style('pointer-events', 'none')
                    if (filter !== undefined) {
                        com.filters.filters.push(filter)
                        updateBlocks()
                    }
                }
                else {
                    new_button.attr('status', 'enabled')
                    new_button.selectAll('line.checkboxBar').remove()
                    rect.attr('stroke', function(d, i) {
                        return '#000000'
                    })
                        .attr('stroke-width', 0.5)
                        .style('stroke-opacity', 1)
                    if (new_button.attr('status', 'disabled')) {
                        let index = com.filters.filters.indexOf(filter)
                        com.filters.filters.splice(index, 1)
                        updateBlocks()
                    }
                }
            }

            let newRect = new_button.append('rect')
                .attr('x', (Number(new_button.attr('width')) - ((Number(new_button.attr('width'))) * (priority) / 3)) / 2)
                .attr('y', (Number(new_button.attr('height')) - ((Number(new_button.attr('height'))) * (priority) / 3)) / 2)
                .attr('width', function(d, i) {
                    return ((Number(new_button.attr('width'))) * (priority) / 3)
                })
                .attr('height', function(d, i) {
                    return ((Number(new_button.attr('height'))) * (priority) / 3)
                })
                .attr('rx', 0)
                .attr('ry', 0)
                .attr('stroke', function(d, i) {
                    return 'black'
                })
                .attr('stroke-width', 0.5)
                .style('fill', function(d, i) {
                    return '#efefef'// cols_yellows[0]
                })
                .style('fill-opacity', function(d, i) {
                    return 1
                })
                .on('click', function() {
                    clickFunction(d3.select(this), filter)
                })
                .on('mouseover', function() {
                    let ginfo = com.filters.group.g.append('g')
                        .attr('class', 'info')
                        .attr('transform', new_button.attr('transform'))
                    ginfo.append('rect')
                        .attr('x', -Number(new_button.attr('width')) * 0.5)
                        .attr('y', -20)
                        .attr('width', Number(new_button.attr('width')) * 2)
                        .attr('height', 18)
                        .attr('rx', 3)
                        .attr('ry', 3)
                        .attr('fill', '#eeeeee')
                        .style('fill-opacity', 0.82)
                    ginfo.append('text')
                        .text(type)
                        .attr('x', Number(new_button.attr('width')) * 0.5)
                        .attr('y', -5)
                        .style('fill-opacity', 0.82)
                        .style('font-weight', 'normal')
                        .attr('text-anchor', 'middle')
                        .style('font-size', 16)
                        .style('pointer-events', 'none')
                        .style('user-select', 'none')
                    if (filter !== undefined) {
                        com.filters.filters.push(filter)
                        updateBlocks()
                    }
                })
                .on('mouseout', function() {
                    com.filters.group.g.select('g.info').remove()
                    if (new_button.attr('status', 'disabled')) {
                        let index = com.filters.filters.indexOf(filter)
                        com.filters.filters.splice(index, 1)
                        updateBlocks()
                    }
                })


            if (type === 'Alarm') {
                drawAlarm(new_button, 0, 0, 16, 16)
            }
            if (type === 'GRB') {
                drawGrb(new_button, 0, 0, 16, 16)
            }
            if (type === 'Hardw.') {
                drawHardware(new_button, 0, 0, 16, 16)
            }

            clickFunction(newRect, type)
        }

        com.filters.group.g = com.g.append('g')
            .attr('transform', 'translate(' + com.filters.group.box.x + ',' + com.filters.group.box.y + ')')

        let margin = {
            inner: 5,
            extern: 5,
        }
        let buttonPanel = new ButtonPanel()

        buttonPanel.init({
            g: com.filters.group.g,
            box: com.filters.group.box,
            margin: margin,
            rows: 3,
            cols: 3,
            background: com.main.color_theme.dark.background,
            stroke: com.main.color_theme.dark.stroke,
        })

        create_button({
            row: 0,
            col: 0,
        }, 'Low', 1, [{
            keys: [ 'priority' ],
            value: 1,
        }])
        create_button({
            row: 0,
            col: 1,
        }, 'Medium', 2, [{
            keys: [ 'priority' ],
            value: 2,
        }])
        create_button({
            row: 0,
            col: 2,
        }, 'High', 3, [{
            keys: [ 'priority' ],
            value: 3,
        }])
        create_button({
            row: 1,
            col: 0,
        }, 'Alarm', 3, [{
            keys: [ 'name' ],
            value: 'alarm',
        }])
        create_button({
            row: 1,
            col: 1,
        }, 'GRB', 3, [{
            keys: [ 'name' ],
            value: 'grb',
        }])
        create_button({
            row: 1,
            col: 2,
        }, 'Hardw.', 3, [{
            keys: [ 'name' ],
            value: 'hardware',
        }])

        let new_button = buttonPanel.add_button({
            row: 2,
            col: 1,
        })
        new_button.append('text')
            .text('Events Filters')
            .attr('x', Number(new_button.attr('width')) * 0.5)
            .attr('y', Number(new_button.attr('height')) * 0.35)
            .attr('dy', 8)
            .attr('stroke', com.main.color_theme.dark.text)
            .attr('stroke-width', 0.4)
            .attr('fill', com.main.color_theme.dark.text)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', 12)
            .style('pointer-events', 'none')
            .style('user-select', 'none')
    }
    function initTimeBars() {
        if (!com.timeBars.enabled) {
            return
        }
        com.timeBars.group.g = com.g.append('g')
            .attr('transform', 'translate(' + com.timeBars.group.box.x + ',' + com.timeBars.group.box.y + ')')
    }
    function setStyle(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        com.style = {
        }

        com.style.runRecCol = opt_in.runRecCol
        if (!is_def(com.style.runRecCol)) {
            com.style.runRecCol = cols_blues[2]
        }

        com.style.recCol = opt_in.recCol
        if (!is_def(com.style.recCol)) {
            com.style.recCol = function(opt_in) {
                // let cols_purples_blues = cols_mix;
                // let n_obs = is_def(opt_in.n_obs) ? opt_in.n_obs : opt_in.d.n_block
                let state = is_def(opt_in.state)
                    ? opt_in.state
                    : opt_in.d.data.exe_state.state
                let can_run = is_def(opt_in.can_run)
                    ? opt_in.can_run
                    : opt_in.d.data.exe_state.can_run

                if (state === 'wait') {
                    return '#e6e6e6'
                }
                else if (state === 'done') {
                    return d3.color(cols_greens[0]).brighter()
                }
                else if (state === 'run') {
                    return d3.color(cols_purples_blues[0]).brighter() // [n_obs % cols_purples_blues.length]
                }
                else if (state === 'cancel') {
                    if (is_def(can_run)) {
                        if (!can_run) {
                            return d3.color(cols_purples[3]).brighter()
                        }
                    }
                    return d3.color(cols_purples[4])
                }
                else if (state === 'fail') {
                    return d3.color(cols_reds[3]).brighter()
                }
                else {
                    return d3.color(col_prime).brighter()
                }
            }
        }

        com.style.recFillOpac = opt_in.recFillOpac
        if (!is_def(com.style.recFillOpac)) {
            com.style.recFillOpac = function(d, state) {
                // return (d.data.exe_state.state == 'wait') ? 0.1 : ((d.data.exe_state.state == 'run') ? 0.4 : 0.2);
                return state === 'run' ? 0.4 : 0.15
            }
        }

        com.style.recStrokeOpac = opt_in.recStrokeOpac
        if (!is_def(com.style.recStrokeOpac)) {
            com.style.recStrokeOpac = function(d) {
                return 0.7
            }
        }

        com.style.textOpac = opt_in.textOpac
        if (!is_def(com.style.textOpac)) {
            com.style.textOpac = function(d) {
                return 1
            }
        }
    }
    this.setStyle = setStyle
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function filterData() {
        function checkPropertiesValue(d, keys, value) {
            let target = d
            for (var i = 0; i < keys.length; i++) {
                target = target[keys[i]]
            }
            if (target === value) {
                return true
            }
            return false
        }
        if (com.filters.filters.length === 0) {
            return com.data.raw
        }
        let filtered = com.data.raw.filter(function(d) {
            for (var i = 0; i < com.filters.filters.length; i++) {
                let filterNow = com.filters.filters[i]
                let ok = true
                for (var j = 0; j < filterNow.length; j++) {
                    if (!checkPropertiesValue(d, filterNow[j].keys, filterNow[j].value)) {
                        ok = false
                    }
                }
                if (ok) {
                    return false
                }
            }
            return true
        })
        return filtered
    }

    function updateAxis() {
        com.axis.domain = [ com.data.start_time.date, com.data.end_time.date ]
        com.axis.range = [ 0, com.axis.group.box.w ]

        com.axis.scale
            .domain(com.axis.domain)
            .range(com.axis.range)

        // console.log(com.axis.domain, com.axis.range);
        com.axis.main.scale(com.axis.scale)
        com.axis.group.g.call(com.axis.main)
        com.axis.group.g.select('path').attr('stroke-width', 1.5).attr('stroke', com.main.color_theme.dark.stroke)
        com.axis.group.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 1.5).attr('stroke', com.main.color_theme.dark.stroke)
        com.axis.group.g.selectAll('g.tick').selectAll('text').style('font-size', 14).attr('stroke', com.main.color_theme.dark.text).attr('fill', com.main.color_theme.dark.text)

    }
    function updateBlocks() {
        com.data.filtered = filterData()
        com.data.formatedData = calcBlockRow({
            type_now: 'events',
            start: com.data.start_time.time,
            end: com.data.end_time.time,
            data: com.data.filtered,
            box: com.blocks.group.box,
        })
        setBlockRect()
    }
    function mergeOptIn(newOptIn) {}

    function update(data_in) {
        com.data.lastRawData = com.data.raw
        com.data.currentTime = data_in.currentTime
        com.data.start_time = data_in.start_time
        com.data.end_time = data_in.end_time
        com.data.raw = data_in.data


        if (com.axis.enabled) {
            updateAxis()
        }
        if (com.blocks.enabled) {
            updateBlocks()
        }
        if (com.timeBars.enabled) {
            setTimeRect()
        }
    }
    this.update = update

    function calcBlockRow(opt_in) {
        let data_in = opt_in.data
        let box = opt_in.box
        let xScale = box.w / (opt_in.end - opt_in.start)

        let blocks = []

        // compute width/height/x/y of blocks, only y need to be modified (so far)
        $.each(data_in, function(index, data_now) {
            let sizeBlocks = (8 * (4.5 + 1) / 2.2)
            let start = new Date(data_now.time) * xScale
            let x0 = box.x + start - (sizeBlocks / 2)
            let w0 = sizeBlocks
            let h0 = sizeBlocks / 1.3
            let y0 = box.y

            blocks.push({
                x: x0,
                y: y0,
                w: w0,
                h: h0,
                data: data_now,
            })
        })

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let wMin = min_max_obj({
            min_max: 'min',
            data: blocks,
            func: 'w',
        })
        let hMin = min_max_obj({
            min_max: 'min',
            data: blocks,
            func: 'h',
        })
        if (!is_def(hMin) || !is_def(wMin)) {
            return []
        }
        let margX = wMin * 0.2
        let margY = blocks.length === 1 ? 0 : Math.min(hMin * 0.5, box.h * 0.05)
        $.each(blocks, function(index0, data_now0) {
            data_now0.x += margX / 2
            data_now0.w -= margX
            data_now0.h -= margY / 2

            // precaution against negative width values
            data_now0.w = Math.max(data_now0.w, box.marg / 10)
            data_now0.h = Math.max(data_now0.h, box.marg)
        })
        let sortedIds = []
        $.each(blocks, function(index0, data_now0) {
            // if(type_now=='run') return
            // if(sortedIds.indexOf(data_now0.id) >= 0) console.log('will skip sorted',index0,data_now0.data.metadata.block_name);
            if (sortedIds.indexOf(data_now0.id) >= 0) {
                return
            }
            sortedIds.push(data_now0.id)

            let x0 = data_now0.x
            let y0 = data_now0.y
            let w0 = data_now0.w
            let h0 = data_now0.h
            // let o0 = data_now0.o

            let telV = [].concat(data_now0.data.tel_ids)
            let min_max = {
                min_x: x0,
                min_y: y0,
                maxX: x0 + w0,
                maxY: y0 + h0,
            }

            let ovelaps = [{
                index: index0,
                data: data_now0,
            }]

            for (let n_tries = 0; n_tries < 1; n_tries++) {
                let nOver = ovelaps.length

                $.each(blocks, function(index1, data_now1) {
                    if (sortedIds.indexOf(data_now1.id) >= 0) {
                        return
                    }
                    if (
                        ovelaps
                            .map(function(d) {
                                return d.data.id
                            })
                            .indexOf(data_now1.id) >= 0
                    ) {
                        return
                    }

                    let x1 = data_now1.x
                    let y1 = data_now1.y
                    let w1 = data_now1.w
                    let h1 = data_now1.h
                    let o01 = Math.max(data_now0.o, data_now1.o)

                    let hasOverlap
                            = x1 < min_max.maxX - o01
                            && x1 + w1 > min_max.min_x + o01
                            && y1 < min_max.maxY
                            && y1 + h1 > min_max.min_y
                    // if(x1 > min_max.maxX-o1 && x1 < min_max.maxX) console.log([index0,data_now0.data.metadata.block_name],[index1,data_now1.data.metadata.block_name]);

                    // XXXXXXXXXXXXXXXXXX
                    // let hasOverlap = (
                    //   (x1 < min_max.maxX+margX/2) && (x1+w1 > min_max.min_x) &&
                    //   (y1 < min_max.maxY)         && (y1+h1 > min_max.min_y)
                    // );
                    // XXXXXXXXXXXXXXXXXX

                    if (hasOverlap) {
                        let intersect = telV.filter(n => data_now1.data.tel_ids.includes(n))
                        if (intersect.length === 0) {
                            sortedIds.push(data_now1.id)
                        }
                        telV = telV.concat(data_now1.data.tel_ids)

                        min_max = {
                            min_x: Math.min(min_max.min_x, x1),
                            min_y: Math.min(min_max.min_y, y1),
                            maxX: Math.max(min_max.maxX, x1 + w1),
                            maxY: Math.max(min_max.maxY, y1 + h1),
                        }

                        ovelaps.push({
                            index: index1,
                            data: data_now1,
                        })
                    }
                })
                // console.log('xxxxxxxxxxxxxxx',n_tries,ovelaps,ovelaps.map(function(d){return d.data.data.metadata.block_name;}));
                if (nOver === ovelaps.length) {
                    break
                }
            }

            if (ovelaps.length > 1) {
                let origIndices = ovelaps.map(function(d) {
                    return d.index
                })

                ovelaps.sort(function(a, b) {
                    let diffTime = a.data.data.start_time - b.data.data.start_time
                    let diffTel = b.data.data.tel_ids.length - a.data.data.tel_ids.length
                    return diffTel !== 0 ? diffTel : diffTime
                })

                // if(type_now=='run') console.log('will sort',ovelaps.map(function(d){return d.data.data.metadata.block_name;}));
                $.each(ovelaps, function(index1, data_now1) {
                    // if(type_now=='run') console.log('-=-=-',index1,origIndices[index1], data_now1.index);
                    let origIndex = origIndices[index1]
                    // if(canSort) blocks[origIndex] = data_now1.data;
                    blocks[origIndex] = data_now1.data
                })
            }
        })
        $.each(blocks, function(index0, data_now0) {
            let x0 = data_now0.x
            let y0 = data_now0.y
            let w0 = data_now0.w
            let h0 = data_now0.h

            // let telV = [].concat(data_now0.data.tel_ids)

            let isSkip = false
            $.each(blocks, function(index1, data_now1) {
                if (index0 >= index1 || isSkip) {
                    return
                }

                let x1 = data_now1.x
                let y1 = data_now1.y
                let w1 = data_now1.w
                let h1 = data_now1.h

                // XXXXXXXXXXXXXXXXXX
                // let hasOverlap = ((x1 < x0+w0+margX/2) && (x1+w1 > x0) && (y1 < y0+h0) && (y1+h1 > y0));
                // XXXXXXXXXXXXXXXXXX
                let hasOverlap = x1 < x0 + w0 && x1 + w1 > x0 && y1 < y0 + h0 && y1 + h1 > y0
                if (hasOverlap) {
                    data_now1.y = y0 + h0 + margY / 2
                    // data_now1.y += h0 + margY/2;
                }
                // if(hasOverlap) console.log([index0,data_now0.data.metadata.block_name],[index1,data_now1.data.metadata.block_name],(h0 + margY/2));
            })
        })

        return blocks
    }
    this.calcBlockRow = calcBlockRow

    function setBlockRect() {
        let rect = com.blocks.group.g
            .selectAll('g.events')
            .data(com.data.formatedData, function(d) {
                return d.data.id
            })
        // console.log(com.blocks.group.g);
        let newRect = rect
            .enter()
            .append('g')
            .attr('class', 'events')
        newRect.append('rect')
            .attr('x', function(d, i) {
                return com.axis.scale(new Date(d.data.date)) + d.w / 2
            })
            .attr('y', function(d, i) {
                return d.y + 2 + d.h / 2
            })
        // .attr('rx', 2)
        // .attr('ry', 2)
            .attr('width', function(d, i) {
                return 0
            })
            .attr('height', function(d, i) {
                return 0
            })
            .attr('stroke', function(d, i) {
                return '#000000'
            })
            .attr('stroke-width', 0.5)
            .style('stroke-opacity', function(d) {
                return 0.7
            })
        // .style('fill', function (d, i) {
        //   return '#CFD8DC'
        // })
            .style('fill', function(d, i) {
                return '#CFD8DC'
                // if (d.data.priority === 1) { return '#FFECB3' }
                // if (d.data.priority === 2) { return '#FFCA28' }
                // if (d.data.priority === 3) { return '#FFA000' }
            })
            .on('mouseover', function(d) {
                d3.select(this).attr('stroke-width', 3.5)
                    .style('stroke-opacity', 1)
                    .style('stroke', '#000000')
                    .style('fill', '#ffffff')
                    .style('fill-opacity', '1')
            })
            .on('mouseout', function(d) {
                d3.select(this).attr('stroke-width', 0.5)
                    .style('stroke-opacity', 0.7)
                    .style('stroke', '#000000')
                // .style('fill', '#CFD8DC')
                    .style('fill', function(d, i) {
                        return '#CFD8DC'
                        // if (d.data.priority === 1) { return '#FFECB3' }
                        // if (d.data.priority === 2) { return '#FFCA28' }
                        // if (d.data.priority === 3) { return '#FFA000' }
                    })
            })
            .on('click', function(d) {
                com.blocks.events.click()
            })
            .merge(rect)
            .transition('in_out')
            .duration(times.anim)
            .attr('x', function(d, i) {
                return com.axis.scale(new Date(d.data.date))
            })
            .attr('y', function(d, i) {
                return d.y + 2
            })
            .attr('width', function(d, i) {
                return d.w
            })
            .attr('height', function(d, i) {
                return d.h
            })
        newRect.each(function(d) {
            if (d.data.name === 'grb') {
                drawGrb(d3.select(this), com.axis.scale(new Date(d.data.date)), d.y, d.w, d.h, d.data.priority)
            }
            if (d.data.name === 'hardware') {
                drawHardware(d3.select(this), com.axis.scale(new Date(d.data.date)), d.y, d.w, d.h, d.data.priority)
            }
            if (d.data.name === 'alarm') {
                drawAlarm(d3.select(this), com.axis.scale(new Date(d.data.date)), d.y, d.w, d.h, d.data.priority)
            }
        })

        rect.exit()
            .transition('in_out')
            .duration(times.anim)
            .attr('width', 0)
            .style('opacity', 0)
            .remove()
    }
    this.setBlockRect = setBlockRect

    function addExtraBar(date) {
        let data = []
        if (date === null) {
            let rectNow = com.timeBars.group.g
                .selectAll('rect.' + com.mainTag + 'extra')
                .data(data)
            rectNow.exit().remove()
        }
        else {
            data = [ date ]
            let rectNow = com.timeBars.group.g
                .selectAll('rect.' + com.mainTag + 'extra')
                .data(data)

            rectNow
                .enter()
                .append('rect')
                .attr('class', com.mainTag + 'extra')
                .style('opacity', 1)
                .attr('x', function(d, i) {
                    if (d > com.axis.scale.domain()[1]) {
                        return com.axis.scale(com.axis.scale.domain()[1])
                    }
                    else if (d < com.axis.scale.domain()[0]) {
                        return com.axis.scale(com.axis.scale.domain()[0])
                    }
                    return com.axis.scale(d)
                })
                .attr('y', function(d, i) {
                    return com.timeBars.group.box.y - 1 * com.timeBars.group.box.marg
                })
                .attr('width', 0)
                .attr('height', function(d, i) {
                    return com.timeBars.group.box.h + 1 * com.timeBars.group.box.marg
                })
                .attr('fill', cols_yellows[0])
                .attr('fill-opacity', 0.3)
                .style('stroke-opacity', 0.15)
                .attr('stroke-width', 3)
                .style('pointer-events', 'none')
                .attr('vector-effect', 'non-scaling-stroke')
                .merge(rectNow)
                .transition('in_out')
                .duration(50)
                .attr('x', function(d, i) {
                    if (d > com.axis.scale.domain()[1]) {
                        return com.axis.scale(com.axis.scale.domain()[1])
                    }
                    else if (d < com.axis.scale.domain()[0]) {
                        return com.axis.scale(com.axis.scale.domain()[0])
                    }
                    return com.axis.scale(d)
                })
            // .attr("y", function(d,i) { return d.y; })
                .attr('width', function(d, i) {
                    return com.box.marg
                })
        }
    }
    this.addExtraBar = addExtraBar
    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setTimeRect() {
        let rectNowData = []

        rectNowData = [
            {
                id: com.mainTag + 'now',
                x: com.axis.scale(com.data.currentTime.date),
                y: com.timeBars.group.box.y,
                w: com.timeBars.group.box.marg,
                h: com.timeBars.group.box.h + com.timeBars.group.box.marg * 2,
            },
        ]

        console.log(com.data.currentTime, com.axis.scale(com.data.currentTime.date), rectNowData[0].x)
        // console.log('timeFrac',timeFrac,rectNowData);
        // console.log('rectNowData',(com.blockRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let rectNow = com.timeBars.group.g
            .selectAll('rect.' + com.mainTag + 'now')
            .data(rectNowData, function(d) {
                return d.id
            })

        console.log(com.timeBars.group.g.select('rect.' + com.mainTag + 'now'))

        rectNow
            .enter()
            .append('rect')
            .attr('class', com.mainTag + 'now')
            .style('opacity', 1)
            .attr('x', function(d, i) {
                return d.x
            })
            .attr('y', function(d, i) {
                return d.y - 1 * com.box.marg
            })
            .attr('width', 0)
            .attr('height', function(d, i) {
                return d.h
            })
            .attr('fill', com.style.runRecCol)
            .attr('fill-opacity', 0.3)
            .style('stroke-opacity', 0.15)
            .attr('stroke-width', 3)
            .style('pointer-events', 'none')
            .attr('vector-effect', 'non-scaling-stroke')
            .merge(rectNow)
            .transition('in_out')
            .duration(times.anim)
            .attr('x', function(d, i) {
                return d.x
            })
        // .attr("y", function(d,i) { return d.y; })
            .attr('width', function(d, i) {
                return d.w
            })
    // .attr("height", function(d,i) { return d.h; })

    // rectNow.exit()
    //   .transition("in_out").duration(times.anim/2)
    //   .attr("width", 0)
    //   .style("opacity", 0)
    //   .remove()
    }
    this.setTimeRect = setTimeRect

    function drawAlarm(g, x, y, w, h, priority) {
        g.append('svg:image')
            .attr('class', 'icon')
            .attr('xlink:href', '/static/alarm.svg')
            .attr('width', 0)
            .attr('height', 0)
            .attr('x', x + w * 0.5)
            .attr('y', y + h * 0.5)
            .style('pointer-events', 'none')
            .transition('in_out')
            .duration(times.anim)
            .attr('width', w * 0.8)
            .attr('height', h * 0.8)
            .attr('x', x + w * 0.1)
            .attr('y', y + h * 0.25)
    }
    function drawGrb(g, x, y, w, h, priority) {
        g.append('svg:image')
            .attr('class', 'icon')
            .attr('xlink:href', '/static/grb.svg')
            .attr('width', 0)
            .attr('height', 0)
            .attr('x', x + w * 0.5)
            .attr('y', y + h * 0.5)
            .style('pointer-events', 'none')
            .transition('in_out')
            .duration(times.anim)
            .attr('width', w * 0.8)
            .attr('height', h * 0.8)
            .attr('x', x + w * 0.1)
            .attr('y', y + h * 0.25)
    }
    function drawHardware(g, x, y, w, h, priority) {
        g.append('svg:image')
            .attr('class', 'icon')
            .attr('xlink:href', '/static/hardwareBreak.svg')
            .attr('width', 0)
            .attr('height', 0)
            .attr('x', x + w * 0.5)
            .attr('y', y + h * 0.5)
            .style('pointer-events', 'none')
            .transition('in_out')
            .duration(times.anim)
            .attr('width', w * 0.8)
            .attr('height', h * 0.8)
            .attr('x', x + w * 0.1)
            .attr('y', y + h * 0.25)
    }
}
