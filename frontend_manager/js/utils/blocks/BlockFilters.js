/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global get_color_theme */
/* global deep_copy */
/* global load_script */
/* global cols_blues */
/* global ButtonPanel */
/* global tel_info */
/* global ScrollBox */

load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/ScrollBox.js',
})

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.BlockFilters = function(opt_in) {
    let color_theme = get_color_theme('bright_grey')
    let template = {
        main: {
            tag: 'blockQueueFilterTag',
            g: undefined,
            box: {
                x: 0,
                y: 0,
                w: 1000,
                h: 300,
                marg: 0,
            },
            background: {
                fill: color_theme.brighter.background,
                stroke: color_theme.brighter.stroke,
                strokeWidth: 0.5,
            },
        },
        blocks: {
            colorPalette: {
            },
        },
        title: {
            g: undefined,
            box: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            },
        },
        states: {
            g: undefined,
            box: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            },
        },
        tels: {
            g: undefined,
            box: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            },
        },
        targets: {
            g: undefined,
            box: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            },
        },
        time: {
            g: undefined,
            box: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            },
        },
        result: {
            g: undefined,
            box: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            },
        },
        filters: [], // [{key: [], value: ''}]
        token_focus: {
        },
        blockQueue: [],
    }

    let com = {
    }
    com = opt_in

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
    function recCol(state) {
        if (state === 'wait') {
            return com.blocks.colorPalette.wait
        }
        else if (state === 'done') {
            return com.blocks.colorPalette.done
        }
        else if (state === 'run') {
            return com.blocks.colorPalette.run
        }
        else if (state === 'cancelO') {
            return com.blocks.colorPalette.cancelSys
        }
        else if (state === 'cancelS') {
            return com.blocks.colorPalette.cancelOp
        }
        else if (state === 'fail') {
            return com.blocks.colorPalette.fail
        }
        else {
            return com.blocks.colorPalette.shutdown
        }
    }

    function setDefaultStyle() {
        if (com.style) {
            return
        }
        com.style = {
        }
        com.style.runRecCol = cols_blues[2]
        com.style.blockCol = function(opt_in) {
            let state = is_def(opt_in.state)
                ? opt_in.state
                : opt_in.d.data.exe_state.state
            let can_run = is_def(opt_in.can_run)
                ? opt_in.can_run
                : opt_in.d.data.exe_state.can_run
            let modified = opt_in.d.data.modifications ? opt_in.d.data.modifications.userModifications.length > 0 : false

            if (state === 'wait') {
                if (modified) {
                    return com.blocks.colorPalette.wait
                }
                return com.blocks.colorPalette.wait
            }
            else if (state === 'done') {
                return com.blocks.colorPalette.done
            }
            else if (state === 'fail') {
                return com.blocks.colorPalette.fail
            }
            else if (state === 'run') {
                return com.blocks.colorPalette.run
            }
            else if (state === 'cancel') {
                if (is_def(can_run)) {
                    if (!can_run) {
                        return com.blocks.colorPalette.cancelOp
                    }
                }
                return com.blocks.colorPalette.cancelSys
            }
            else {
                return com.blocks.colorPalette.shutdown
            }
        }
        com.style.blockOpac = function(opt_in) {
            let state = is_def(opt_in.state)
                ? opt_in.state
                : opt_in.d.data.exe_state.state
            let can_run = is_def(opt_in.can_run)
                ? opt_in.can_run
                : opt_in.d.data.exe_state.can_run
            let modified = opt_in.d.data.modifications ? opt_in.d.data.modifications.userModifications.length > 0 : false

            if (state === 'wait') {
                if (modified) {
                    return 0.2
                }
                return 1
            }
            else if (state === 'run') {
                return 1
            }
            else if (state === 'cancel') {
                if (is_def(can_run)) {
                    if (!can_run) {
                        return 1
                    }
                }
                return 1
            }
            else {
                return 1
            }
        }
    }
    function init() {
        setDefaultStyle()
        // if (com.main.mode === 'expert') {
        //   initEnabled()
        //   initContent()
        //   initDisabled()
        // } else
        if (com.main.mode === 'beginner') {
            initState()
            initTels()
            initTargets()
            initTime()
            initMiddle()

            addStatesMiddle_info()
            addTargetsMiddle_info()
            addTelsMiddle_info()
        }
    }
    this.init = init

    function initMiddle() {
        let b = com.beginner.middle.box
        let dim = b.w * 0.3
        com.beginner.middle.g.attr('transform', 'translate(' + b.x + ',' + b.y + ')')
        com.beginner.middle.g.append('rect')
            .attr('x', (b.w * 0.5) - dim * 0.5)
            .attr('y', (b.h * 0.4) - dim * 0.5)
            .attr('width', dim)
            .attr('height', dim)
            .attr('fill', com.main.color_theme.dark.background)
            .attr('stroke', com.main.color_theme.dark.stroke)
            .attr('stroke-width', 4)

        com.beginner.middle.g.append('text')
            .attr('class', 'tot-percent')
            .attr('x', (b.w * 0.5))
            .attr('y', (b.h * 0.4) - dim * 0.15)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        com.beginner.middle.g.append('text')
            .attr('class', 'tot-number')
            .attr('x', (b.w * 0.5))
            .attr('y', (b.h * 0.4) + dim * 0.25)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')

        com.beginner.middle.g.append('text')
            .attr('class', 'states-show')
            .attr('x', (b.w * 0.15))
            .attr('y', com.beginner.middle.box.h * 0.2 - 2)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        com.beginner.middle.g.append('text')
            .attr('class', 'states-hide')
            .attr('x', (b.w * 0.15))
            .attr('y', com.beginner.middle.box.h * 0.2 + 9)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')

        com.beginner.middle.g.append('text')
            .attr('class', 'targets-show')
            .attr('x', (b.w * 0.2))
            .attr('y', com.beginner.middle.box.h * 0.6 - 2)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        com.beginner.middle.g.append('text')
            .attr('class', 'targets-hide')
            .attr('x', (b.w * 0.2))
            .attr('y', com.beginner.middle.box.h * 0.6 + 9)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')

        com.beginner.middle.g.append('text')
            .attr('class', 'tels-show')
            .attr('x', (b.w * 0.8))
            .attr('y', com.beginner.middle.box.h * 0.6 - 2)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        com.beginner.middle.g.append('text')
            .attr('class', 'tels-hide')
            .attr('x', (b.w * 0.8))
            .attr('y', com.beginner.middle.box.h * 0.6 + 9)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
    }
    function addTotMiddle_info() {
        let allFilters = []
        allFilters = getFilters()

        for (let i = com.blockQueue.length - 1; i > -1; i--) {
            let stats = com.blockQueue[i].filterData({
                filters: allFilters,
            }).stats
            com.beginner.middle.g.select('text.tot-percent').text(100 - parseInt((stats.filtered / stats.tot) * 100) + '%')
            com.beginner.middle.g.select('text.tot-number').text((stats.tot - stats.filtered) + '/' + stats.tot)
        }
    }
    function addStatesMiddle_info() {
        let allFilters = []
        for (let j = 0; j < com.beginner.states.token.filtering.length; j++) {
            allFilters.push(com.beginner.states.token.filtering[j])
        }

        for (let i = com.blockQueue.length - 1; i > -1; i--) {
            let stats = com.blockQueue[i].filterData({
                filters: allFilters,
            }).stats
            com.beginner.middle.g.select('text.states-show').text(100 - parseInt((stats.filtered / stats.tot) * 100) + '%')
            com.beginner.middle.g.select('text.states-hide').text((stats.tot - stats.filtered) + '/' + stats.tot)
        }
        addTotMiddle_info()
    }
    function addTargetsMiddle_info() {
        let allFilters = []
        for (let j = 0; j < com.beginner.targets.token.filtering.length; j++) {
            allFilters.push(com.beginner.targets.token.filtering[j])
        }
        for (let i = com.blockQueue.length - 1; i > -1; i--) {
            let stats = com.blockQueue[i].filterData({
                filters: allFilters,
            }).stats
            if (allFilters[0].filters.length === 0) {
                com.beginner.middle.g.select('text.targets-show').text(parseInt((stats.filtered / stats.tot) * 100) + '%')
                com.beginner.middle.g.select('text.targets-hide').text((stats.filtered) + '/' + stats.tot)
            }
            else {
                com.beginner.middle.g.select('text.targets-show').text(100 - parseInt((stats.filtered / stats.tot) * 100) + '%')
                com.beginner.middle.g.select('text.targets-hide').text((stats.tot - stats.filtered) + '/' + stats.tot)
            }
        }
        addTotMiddle_info()
    }
    function addTelsMiddle_info() {
        let allFilters = []
        for (let j = 0; j < com.beginner.tels.token.filtering.length; j++) {
            allFilters.push(com.beginner.tels.token.filtering[j])
        }

        for (let i = com.blockQueue.length - 1; i > -1; i--) {
            let stats = com.blockQueue[i].filterData({
                filters: allFilters,
            }).stats
            com.beginner.middle.g.select('text.tels-show').text(100 - parseInt((stats.filtered / stats.tot) * 100) + '%')
            com.beginner.middle.g.select('text.tels-hide').text((stats.tot - stats.filtered) + '/' + stats.tot)
        }
        addTotMiddle_info()
    }

    function initState() {
        let b = com.beginner.states.box
        com.beginner.states.g.attr('transform', 'translate(' + b.x + ',' + b.y + ')')
        let lineGenerator = d3.line()
            .x(function(d) {
                return d.x
            })
            .y(function(d) {
                return d.y
            })
            .curve(d3.curveLinear)

        // let dataPointTop = [
        //   {x: 0, y: 0},
        //   {x: b.w, y: 0},
        //   {x: b.w, y: b.h * 0.7},
        //   {x: b.w - (b.h * 0.3), y: b.h},
        //   {x: 0, y: b.h},
        //   {x: 0, y: 0}
        // ]
        let dataPointTop = [
            {
                x: b.w * 0.7,
                y: b.h * 0.21,
            },
            {
                x: b.w * 0.9,
                y: b.h * 0.21,
            },
            {
                x: b.w * 1,
                y: com.beginner.middle.box.y + com.beginner.middle.box.h * 0.2,
            },
            {
                x: com.beginner.middle.box.x + (com.beginner.middle.box.w * 0.4) - (b.w * 0.1),
                y: com.beginner.middle.box.y + com.beginner.middle.box.h * 0.2,
            },
            {
                x: com.beginner.middle.box.x + com.beginner.middle.box.w * 0.4,
                y: com.beginner.middle.box.y + com.beginner.middle.box.h * 0.325,
            },
        ]
        com.beginner.states.g.append('path')
            .data([ dataPointTop ])
            .attr('d', lineGenerator)
            .attr('fill', 'none')
            .attr('stroke', color_theme.medium.stroke)
            .attr('stroke-width', 0.2)
        com.beginner.states.g.append('circle')
            .attr('cx', b.w * 0.75)
            .attr('cy', b.h * 0.21)
            .attr('r', 5)
            .attr('fill', 'none')
            .attr('stroke', com.main.color_theme.medium.stroke)
            .attr('stroke-width', 1)
        com.beginner.states.g.append('circle')
            .attr('cx', b.w * 0.75)
            .attr('cy', b.h * 0.21)
            .attr('r', 4)
            .attr('fill', com.main.color_theme.medium.stroke)
            .attr('stroke', 'none')
            .attr('stroke-width', 0)

        // let dataPointShadow = [
        //   {x: 0, y: 0},
        //   {x: 0, y: b.h},
        //   {x: b.w - (b.h * 0.3), y: b.h},
        //   {x: b.w, y: b.h * 0.7},
        //   {x: b.w, y: (b.h * 0.7) + 2.5},
        //   {x: b.w - (b.h * 0.3), y: b.h + 2.5},
        //   {x: b.w - (b.h * 0.3), y: b.h},
        //   {x: b.w - (b.h * 0.3), y: b.h + 2.5},
        //   {x: 0 - 2, y: b.h + 2},
        //   {x: 0, y: b.h},
        //   {x: 0 - 2, y: b.h + 2},
        //   {x: 0 - 2, y: 0 + 2},
        //   {x: 0, y: 0}
        // ]
        // com.beginner.states.g.append('path')
        //   .data([dataPointShadow])
        //   .attr('d', lineGenerator)
        //   .attr('fill', color_theme.darker.background)
        //   .attr('stroke', color_theme.darker.stroke)
        //   .attr('stroke-width', 0.2)
        // com.beginner.states.g.append('rect')
        //   .attr('x', 0)
        //   .attr('y', 0)
        //   .attr('width', b.w)
        //   .attr('height', b.h)
        //   .attr('fill', com.main.color_theme.medium.background)
        //   .attr('stroke', com.main.color_theme.medium.stroke)
        //   .attr('stroke-width', 0.4)

        function create_button(new_button, type, filter) {
            new_button.attr('status', 'disabled')
            if (com.beginner.states.token) {
                for (let i = 0; i < com.beginner.states.token.filtering.length; i++) {
                    if (com.beginner.states.token.filtering[i].name === type) {
                        new_button.attr('status', 'enabled')
                    }
                }
            }

            let checkFunction = function(rect) {
                if (new_button.attr('status') === 'enabled') {
                    rect.attr('stroke', function(d, i) {
                        return '#000000'
                    })
                        .attr('stroke-width', 1.5)
                    new_button.append('line')
                        .attr('class', 'checkboxBar')
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', (Number(new_button.attr('width'))))
                        .attr('y2', (Number(new_button.attr('height'))))
                        .attr('stroke', '#000000')
                        .style('stroke-opacity', 0.9)
                        .attr('stroke-width', 2)
                        .style('pointer-events', 'none')
                    new_button.append('line')
                        .attr('class', 'checkboxBar')
                        .attr('x1', 0)
                        .attr('y1', (Number(new_button.attr('height'))))
                        .attr('x2', (Number(new_button.attr('width'))))
                        .attr('y2', 0)
                        .attr('stroke', '#000000')
                        .style('stroke-opacity', 0.9)
                        .attr('stroke-width', 2)
                        .style('pointer-events', 'none')
                }
                else {
                    new_button.selectAll('line.checkboxBar').remove()
                    rect.attr('stroke', function(d, i) {
                        return '#000000'
                    })
                        .attr('stroke-width', 0.2)
                        .style('stroke-opacity', 1)
                }
            }
            let clickFunction = function(rect) {
                if (new_button.attr('status') === 'enabled') {
                    new_button.attr('status', 'disabled')
                    removeFiltering(filter)
                    updateBlockQueue()
                }
                else {
                    new_button.attr('status', 'enabled')
                    addFiltering(filter)
                    updateBlockQueue()
                }
            }
            function addFiltering(filter) {
                com.beginner.states.token.filtering.push(filter)
                addStatesMiddle_info()
            }
            function removeFiltering(filter) {
                let index = com.beginner.states.token.filtering.indexOf(filter)
                com.beginner.states.token.filtering.splice(index, 1)
                addStatesMiddle_info()
            }

            let newRect = new_button.append('rect')
                .attr('x', (Number(new_button.attr('width')) - ((Number(new_button.attr('width'))) * (3) / 3)) / 2)
                .attr('y', (Number(new_button.attr('height')) - ((Number(new_button.attr('height'))) * (3) / 3)) / 2)
                .attr('width', function(d, i) {
                    return ((Number(new_button.attr('width'))) * (3) / 3)
                })
                .attr('height', function(d, i) {
                    return ((Number(new_button.attr('height'))) * (3) / 3)
                })
                .attr('rx', 0)
                .attr('ry', 0)
                .attr('stroke', function(d, i) {
                    return 'black'
                })
                .attr('stroke-width', 0.2)
                .style('fill', function(d, i) {
                    return recCol(type).background
                })
                .style('fill-opacity', function(d, i) {
                    return 1
                })
                .on('click', function() {
                    clickFunction(d3.select(this))
                    checkFunction(d3.select(this))
                })
                .on('mouseover', function() {
                    new_button.attr('status-over', new_button.attr('status'))
                    if (new_button.attr('status') === 'enabled') {
                        removeFiltering(filter)
                        updateBlockQueue()
                    }
                    else if (new_button.attr('status') === 'disabled') {
                        addFiltering(filter)
                        updateBlockQueue()
                    }
                })
                .on('mouseout', function() {
                    // com.filters.g.select('g.info').remove()
                    if (new_button.attr('status') === 'disabled') {
                        removeFiltering(filter)
                        updateBlockQueue()
                    }
                    else if (new_button.attr('status') === 'enabled') {
                        addFiltering(filter)
                        updateBlockQueue()
                    }
                })
            // clickFunction(newRect)
            checkFunction(newRect)
            return new_button
        }
        com.beginner.states.g.append('text')
            .text('States')
            .attr('x', com.beginner.states.box.w * 0.5)
            .attr('y', com.beginner.states.box.h * 0.25)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '9')
            .style('pointer-events', 'none')
            .style('user-select', 'none')

        let bBox = {
            x: com.beginner.states.box.w * 0.18,
            y: com.beginner.states.box.h * 0.6,
            w: (com.beginner.states.box.w * 0.98) / 6,
            h: (com.beginner.states.box.w * 0.98) / 6,
        }
        let failG = com.beginner.states.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 0) + ',' + (bBox.y - bBox.h * 0.7) + ')')
        let doneG = com.beginner.states.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 1.5) + ',' + (bBox.y - bBox.h * 0.7) + ')')
        let runG = com.beginner.states.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 3) + ',' + (bBox.y - bBox.h * 0.7) + ')')
        let cancelOG = com.beginner.states.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 0) + ',' + (bBox.y + com.beginner.states.box.h * 0.2 - bBox.h * 0.5) + ')')
        let cancelSG = com.beginner.states.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 1.5) + ',' + (bBox.y + com.beginner.states.box.h * 0.2 - bBox.h * 0.5) + ')')
        let waitG = com.beginner.states.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 3) + ',' + (bBox.y + com.beginner.states.box.h * 0.2 - bBox.h * 0.5) + ')')
        com.beginner.states.button = {
            Fail: create_button(failG, 'fail', {
                name: 'fail',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'fail',
                }],
            }),
            Done: create_button(doneG, 'done', {
                name: 'done',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'done',
                }],
            }),
            Run: create_button(runG, 'run', {
                name: 'run',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'run',
                }],
            }),
            'Cancel.canrun': create_button(cancelOG, 'cancelO', {
                name: 'cancelO',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'cancel',
                }, {
                    keys: [ 'exe_state', 'can_run' ],
                    value: true,
                }],
            }),
            Cancel: create_button(cancelSG, 'cancelS', {
                name: 'cancelS',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'cancel',
                }, {
                    keys: [ 'exe_state', 'can_run' ],
                    value: false,
                }],
            }),
            Wait: create_button(waitG, 'wait', {
                name: 'wait',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'wait',
                }],
            }),
        }
    }
    function initTels() {
        com.beginner.tels.token.filtering.push({
            name: 'tels',
            operation: 'include',
            contains: 'all',
            filters: [],
        })
        let b = com.beginner.tels.box
        com.beginner.tels.g.attr('transform', 'translate(' + b.x + ',' + b.y + ')')

        let lineGenerator = d3.line()
            .x(function(d) {
                return d.x
            })
            .y(function(d) {
                return d.y
            })
            .curve(d3.curveLinear)
        let dataPointTop = [
            {
                x: -b.w * 0.02,
                y: b.h * 0.5,
            },
            {
                x: -b.x + com.beginner.middle.box.x + (com.beginner.middle.box.w * 0.9),
                y: com.beginner.middle.box.y + com.beginner.middle.box.h * 0.2,
            },
            {
                x: -b.x + com.beginner.middle.box.x + (com.beginner.middle.box.w * 0.6) + (b.w * 0.1),
                y: com.beginner.middle.box.y + com.beginner.middle.box.h * 0.2,
            },
            {
                x: -b.x + com.beginner.middle.box.x + com.beginner.middle.box.w * 0.6,
                y: -b.y + com.beginner.middle.box.y + com.beginner.middle.box.h * 0.475,
            },
        ]
        com.beginner.tels.g.append('path')
            .data([ dataPointTop ])
            .attr('d', lineGenerator)
            .attr('fill', 'none')
            .attr('stroke', color_theme.medium.stroke)
            .attr('stroke-width', 0.2)
        com.beginner.tels.g.append('circle')
            .attr('cx', -b.w * 0.05)
            .attr('cy', b.h * 0.5)
            .attr('r', 5)
            .attr('fill', 'none')
            .attr('stroke', com.main.color_theme.medium.stroke)
            .attr('stroke-width', 1)
        com.beginner.tels.g.append('circle')
            .attr('cx', -b.w * 0.05)
            .attr('cy', b.h * 0.5)
            .attr('r', 4)
            .attr('fill', com.main.color_theme.medium.stroke)
            .attr('stroke', 'none')
            .attr('stroke-width', 0)
        // com.beginner.tels.g.append('rect')
        //   .attr('x', 0)
        //   .attr('y', 0)
        //   .attr('width', b.w)
        //   .attr('height', b.h)
        //   .attr('fill', com.main.color_theme.dark.background)
        //   .attr('stroke', com.main.color_theme.dark.stroke)
        //   .attr('stroke-width', 0.4)

        com.beginner.tels.g.append('text')
            .text('Telescopes')
            .attr('x', com.beginner.tels.box.w * 0.275)
            .attr('y', com.beginner.tels.box.h * 0.15)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '9')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        com.beginner.tels.g.append('text')
            .text('')
            .attr('x', com.beginner.tels.box.w * 0.25)
            .attr('y', com.beginner.tels.box.h * 0.15)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '6px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        com.beginner.tels.g.append('text')
            .text('focus')
            .attr('x', com.beginner.tels.box.w * 0.75)
            .attr('y', com.beginner.tels.box.h * 0.15)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '6px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')

        let tels = tel_info.get_ids()
        tels = tels.map(function(d) {
            let filtered = false
            let f = com.beginner.tels.token.filtering[0]
            for (let i = 0; i < f.filters.length; i++) {
                if (f.filters[i].value === d) {
                    filtered = true
                }
            }
            return {
                id: d,
                filtered: filtered,
            }
        })

        let localScroll = {
        }
        let left = {
            x: com.beginner.tels.box.w * 0.05,
            y: com.beginner.tels.box.h * 0.175,
            w: com.beginner.tels.box.w * 0.44,
            h: com.beginner.tels.box.h * 0.68,
        }
        let right = {
            x: com.beginner.tels.box.w * 0.51,
            y: com.beginner.tels.box.h * 0.175,
            w: com.beginner.tels.box.w * 0.44,
            h: com.beginner.tels.box.h * 0.68,
        }
        function initScrollBox() {
            localScroll.scrollBoxG = com.beginner.tels.g.append('g')
            // localScroll.scrollBoxG.append('rect')
            //   .attr('class', 'background')
            //   .attr('x', left.x)
            //   .attr('y', left.y)
            //   .attr('width', left.w)
            //   .attr('height', left.h)
            //   .style('fill', 'transparent')
            //   .style('stroke', com.main.background.stroke)
            //   .style('stroke-width', 0.4)
            // localScroll.scrollBoxG.append('rect')
            //   .attr('class', 'background')
            //   .attr('x', right.x)
            //   .attr('y', right.y)
            //   .attr('width', right.w)
            //   .attr('height', right.h)
            //   .style('fill', 'transparent')
            //   .style('stroke', com.main.background.stroke)
            //   .style('stroke-width', 0.4)

            localScroll.scrollBox = new ScrollBox()
            localScroll.scrollBox.init({
                tag: 'telsFiltersScroll',
                g_box: localScroll.scrollBoxG,
                box_data: {
                    x: com.beginner.tels.box.w * 0.05,
                    y: com.beginner.tels.box.h * 0.175,
                    w: com.beginner.tels.box.w * 0.9,
                    h: com.beginner.tels.box.h * 0.68,
                    marg: 0,
                },
                use_relative_coords: true,
                locker: new Locker(),
                lockers: [ 'telsFiltersScroll' + 'update_data' ],
                lock_zoom: {
                    all: 'ScrollBox' + 'zoom',
                    during: 'ScrollBox' + 'zoom_during',
                    end: 'ScrollBox' + 'zoom_end',
                },
                run_loop: new RunLoop({
                    tag: 'telsFiltersScroll',
                }),
                can_scroll: true,
                scrollVertical: true,
                scroll_horizontal: false,
                scroll_height: 0,
                scroll_width: 0,
                background: 'transparent',
                scroll_rec_h: {
                    h: 1,
                },
                scroll_recs: {
                    w: 1,
                },
            })
            localScroll.scrollG = localScroll.scrollBox.get('inner_g')
        }
        initScrollBox()

        function addFiltering(filter) {
            let f = com.beginner.tels.token.filtering[0]
            f.filters.push(filter)
            addTelsMiddle_info()
        }
        function removeFiltering(filter) {
            let f = com.beginner.tels.token.filtering[0]
            let index = f.filters.indexOf(filter)
            f.filters.splice(index, 1)
            addTelsMiddle_info()
        }

        let labelBox = {
            x: com.beginner.tels.box.w * 0.46,
            y: 0,
            w: com.beginner.tels.box.w * 0.44,
            h: 12,
        }

        let allTels = localScroll.scrollG
            .selectAll('g.tel')
            .data(tels, function(d) {
                return d.id
            })
        let enterTels = allTels
            .enter()
            .append('g')
            .attr('class', 'tel')
            .attr('transform', function(d, i) {
                let translate = {
                    y: labelBox.h * i,
                    x: labelBox.x * d.filtered,
                }
                return 'translate(' + translate.x + ',' + translate.y + ')'
            })
        enterTels.each(function(d, i) {
            let gg = d3.select(this)
            d3.select(this).append('rect')
                .attr('x', 2)
                .attr('y', 0.5)
                .attr('width', labelBox.w - 2)
                .attr('height', labelBox.h)
                .style('fill', color_theme.medium.background)
                .style('stroke', com.main.background.stroke)
                .style('stroke-width', com.main.background.strokeWidth)
                .on('click', function() {
                    if (d.filtered) {
                        d.filtered = false
                        gg
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        removeFiltering({
                            keys: [ 'tel_ids' ],
                            value: d.id,
                        })
                        updateBlockQueue()
                    }
                    else {
                        d.filtered = true
                        gg
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        addFiltering({
                            keys: [ 'tel_ids' ],
                            value: d.id,
                        })
                        updateBlockQueue()
                    }
                })
            let dataPointTop = [
                {
                    x: 2,
                    y: 0.5,
                },
                {
                    x: 2,
                    y: labelBox.h + 0.5,
                },
                {
                    x: labelBox.w,
                    y: labelBox.h + 0.5,
                },
                {
                    x: labelBox.w - 2,
                    y: labelBox.h + 2.5,
                },
                {
                    x: 2 - 2,
                    y: labelBox.h + 2,
                },
                {
                    x: 2,
                    y: labelBox.h + 0.5,
                },
                {
                    x: 2 - 2,
                    y: labelBox.h + 2,
                },
                {
                    x: 2 - 2,
                    y: 0.5 + 2,
                },
                {
                    x: 2,
                    y: 0.5,
                },
            ]
            d3.select(this).append('path')
                .data([ dataPointTop ])
                .attr('d', lineGenerator)
                .attr('fill', color_theme.dark.background)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.2)
            d3.select(this).append('text')
                .text(d.id)
                .attr('x', labelBox.w * 0.5)
                .attr('y', labelBox.h * 0.7)
                .attr('fill', com.main.color_theme.darker.stroke)
                .style('font-weight', 'normal')
                .attr('text-anchor', 'middle')
                .style('font-size', '8px')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
        })
        let mergeTels = enterTels.merge(allTels)

        com.beginner.tels.g.append('rect')
            .attr('class', 'toRight')
            .attr('x', com.beginner.tels.box.w * 0.25 - 5)
            .attr('y', com.beginner.tels.box.h * 0.92 - 5)
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', color_theme.darker.background)
            .style('stroke', 'transparent')
            .style('opacity', 0)
            .style('stroke-width', 0.4)
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 1)
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 0)
            })
            .on('click', function() {
                mergeTels.each(function(d, i) {
                    if (!d.filtered) {
                        d.filtered = true
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        addFiltering({
                            keys: [ 'tel_ids' ],
                            value: d.id,
                        })
                    }
                })
                updateBlockQueue()
            })
        com.beginner.tels.g.append('svg:image')
            .attr('xlink:href', '/static/icons/arrow-right.svg')
            .attr('width', 10)
            .attr('height', 10)
            .attr('x', com.beginner.tels.box.w * 0.25 - 5)
            .attr('y', com.beginner.tels.box.h * 0.92 - 5)
            .style('pointer-events', 'none')

        com.beginner.tels.g.append('rect')
            .attr('class', 'switch')
            .attr('x', com.beginner.tels.box.w * 0.5 - 7.5)
            .attr('y', com.beginner.tels.box.h * 0.92 - 5)
            .attr('width', 15)
            .attr('height', 10)
            .style('fill', color_theme.darker.background)
            .style('stroke', 'transparent')
            .style('opacity', 0)
            .style('stroke-width', 0.4)
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 1)
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 0)
            })
            .on('click', function() {
                mergeTels.each(function(d, i) {
                    if (d.filtered) {
                        d.filtered = false
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        removeFiltering({
                            keys: [ 'tel_ids' ],
                            value: d.id,
                        })
                    }
                    else {
                        d.filtered = true
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        addFiltering({
                            keys: [ 'tel_ids' ],
                            value: d.id,
                        })
                    }
                })
                updateBlockQueue()
            })
        com.beginner.tels.g.append('svg:image')
            .attr('xlink:href', '/static/icons/arrow-bothside.svg')
            .attr('width', 15)
            .attr('height', 10)
            .attr('x', com.beginner.tels.box.w * 0.5 - 7.5)
            .attr('y', com.beginner.tels.box.h * 0.92 - 5)
            .style('pointer-events', 'none')

        com.beginner.tels.g.append('rect')
            .attr('class', 'toLeft')
            .attr('x', com.beginner.tels.box.w * 0.75 - 5)
            .attr('y', com.beginner.tels.box.h * 0.92 - 5)
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', color_theme.darker.background)
            .style('stroke', 'transparent')
            .style('opacity', 0)
            .style('stroke-width', 0.4)
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 1)
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 0)
            })
            .on('click', function() {
                mergeTels.each(function(d, i) {
                    if (d.filtered) {
                        d.filtered = false
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        removeFiltering({
                            name: 'tels',
                            operation: 'include',
                            contains: 'all',
                            filters: [{
                                keys: [ 'tel_ids' ],
                                value: d.id,
                            }],
                        })
                    }
                })
                updateBlockQueue()
            })
        com.beginner.tels.g.append('svg:image')
            .attr('xlink:href', '/static/icons/arrow-left.svg')
            .attr('width', 10)
            .attr('height', 10)
            .attr('x', com.beginner.tels.box.w * 0.75 - 5)
            .attr('y', com.beginner.tels.box.h * 0.92 - 5)
            .style('pointer-events', 'none')

        localScroll.scrollBox.reset_vertical_scroller({
            can_scroll: true,
            scroll_height: labelBox.h * tels.length,
        })
    }
    function initTargets() {
        com.beginner.targets.token.filtering.push({
            name: 'targets',
            operation: 'include',
            contains: 'one',
            filters: [],
        })
        let b = com.beginner.targets.box
        com.beginner.targets.g.attr('transform', 'translate(' + b.x + ',' + b.y + ')')

        let lineGenerator = d3.line()
            .x(function(d) {
                return d.x
            })
            .y(function(d) {
                return d.y
            })
            .curve(d3.curveLinear)

        let dataPointTop = [
            {
                x: b.w * 1.02,
                y: b.h * 0.5,
            },
            {
                x: -b.x + com.beginner.middle.box.x + (com.beginner.middle.box.w * 0.1),
                y: com.beginner.middle.box.y + com.beginner.middle.box.h * 0.2,
            },
            {
                x: -b.x + com.beginner.middle.box.x + (com.beginner.middle.box.w * 0.4) - (b.w * 0.1),
                y: com.beginner.middle.box.y + com.beginner.middle.box.h * 0.2,
            },
            {
                x: -b.x + com.beginner.middle.box.x + com.beginner.middle.box.w * 0.4,
                y: -b.y + com.beginner.middle.box.y + com.beginner.middle.box.h * 0.475,
            },
        ]
        com.beginner.targets.g.append('path')
            .data([ dataPointTop ])
            .attr('d', lineGenerator)
            .attr('fill', 'none')
            .attr('stroke', color_theme.medium.stroke)
            .attr('stroke-width', 0.2)
        com.beginner.targets.g.append('circle')
            .attr('cx', b.w * 1.05)
            .attr('cy', b.h * 0.5)
            .attr('r', 5)
            .attr('fill', 'none')
            .attr('stroke', com.main.color_theme.medium.stroke)
            .attr('stroke-width', 1)
        com.beginner.targets.g.append('circle')
            .attr('cx', b.w * 1.05)
            .attr('cy', b.h * 0.5)
            .attr('r', 4)
            .attr('fill', com.main.color_theme.medium.stroke)
            .attr('stroke', 'none')
            .attr('stroke-width', 0)

        com.beginner.targets.g.append('text')
            .text('Targets')
            .attr('x', com.beginner.targets.box.w * 0.275)
            .attr('y', com.beginner.targets.box.h * 0.15)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '9')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        com.beginner.targets.g.append('text')
            .text('')
            .attr('x', com.beginner.targets.box.w * 0.25)
            .attr('y', com.beginner.targets.box.h * 0.15)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '6px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        com.beginner.targets.g.append('text')
            .text('focus')
            .attr('x', com.beginner.targets.box.w * 0.75)
            .attr('y', com.beginner.targets.box.h * 0.15)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '6px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')

        let targets = com.beginner.targets.target_ids
        targets = targets.map(function(d) {
            let filtered = false
            let f = com.beginner.targets.token.filtering[0]
            for (let i = 0; i < f.filters.length; i++) {
                if (f.filters[i].value === d) {
                    filtered = true
                }
            }
            return {
                id: d,
                filtered: filtered,
            }
        })

        let localScroll = {
        }
        let left = {
            x: com.beginner.targets.box.w * 0.05,
            y: com.beginner.targets.box.h * 0.175,
            w: com.beginner.targets.box.w * 0.44,
            h: com.beginner.targets.box.h * 0.68,
        }
        let right = {
            x: com.beginner.targets.box.w * 0.51,
            y: com.beginner.targets.box.h * 0.175,
            w: com.beginner.targets.box.w * 0.44,
            h: com.beginner.targets.box.h * 0.68,
        }
        function initScrollBox() {
            localScroll.scrollBoxG = com.beginner.targets.g.append('g')
            // localScroll.scrollBoxG.append('rect')
            //   .attr('class', 'background')
            //   .attr('x', left.x)
            //   .attr('y', left.y)
            //   .attr('width', left.w)
            //   .attr('height', left.h)
            //   .style('fill', 'transparent')
            //   .style('stroke', com.main.background.stroke)
            //   .style('stroke-width', 0.4)
            // localScroll.scrollBoxG.append('rect')
            //   .attr('class', 'background')
            //   .attr('x', right.x)
            //   .attr('y', right.y)
            //   .attr('width', right.w)
            //   .attr('height', right.h)
            //   .style('fill', com.main.color_theme.darker.background)
            //   .style('stroke', 'none')
            //   .style('stroke-width', 0)

            localScroll.scrollBox = new ScrollBox()
            localScroll.scrollBox.init({
                tag: 'targetsFiltersScroll',
                g_box: localScroll.scrollBoxG,
                box_data: {
                    x: com.beginner.targets.box.w * 0.05,
                    y: com.beginner.targets.box.h * 0.175,
                    w: com.beginner.targets.box.w * 0.9,
                    h: com.beginner.targets.box.h * 0.68,
                    marg: 0,
                },
                use_relative_coords: true,
                locker: new Locker(),
                lockers: [ 'targetsFiltersScroll' + 'update_data' ],
                lock_zoom: {
                    all: 'ScrollBox' + 'zoom',
                    during: 'ScrollBox' + 'zoom_during',
                    end: 'ScrollBox' + 'zoom_end',
                },
                run_loop: new RunLoop({
                    tag: 'targetsFiltersScroll',
                }),
                can_scroll: true,
                scrollVertical: true,
                scroll_horizontal: false,
                scroll_height: 0,
                scroll_width: 0,
                background: 'transparent',
                scroll_rec_h: {
                    h: 1,
                },
                scroll_recs: {
                    w: 1,
                },
            })
            localScroll.scrollG = localScroll.scrollBox.get('inner_g')
        }
        initScrollBox()

        function addFiltering(filter) {
            let f = com.beginner.targets.token.filtering[0]
            f.filters.push(filter)
            addTargetsMiddle_info()
        }
        function removeFiltering(filter) {
            let f = com.beginner.targets.token.filtering[0]
            let index = f.filters.indexOf(filter)
            f.filters.splice(index, 1)
            addTargetsMiddle_info()
        }

        let labelBox = {
            x: com.beginner.targets.box.w * 0.46,
            y: 0,
            w: com.beginner.targets.box.w * 0.44,
            h: 12,
        }

        let alltargets = localScroll.scrollG
            .selectAll('g.tel')
            .data(targets, function(d) {
                return d.id
            })
        let entertargets = alltargets
            .enter()
            .append('g')
            .attr('class', 'tel')
            .attr('transform', function(d, i) {
                let translate = {
                    y: labelBox.h * i,
                    x: labelBox.x * d.filtered,
                }
                return 'translate(' + translate.x + ',' + translate.y + ')'
            })
        entertargets.each(function(d, i) {
            let gg = d3.select(this)
            d3.select(this).append('rect')
                .attr('x', 2)
                .attr('y', 0.5)
                .attr('width', labelBox.w - 2)
                .attr('height', labelBox.h)
                .style('fill', color_theme.medium.background)
                .style('stroke', com.main.background.stroke)
                .style('stroke-width', com.main.background.strokeWidth)
                .on('click', function() {
                    if (d.filtered) {
                        d.filtered = false
                        gg
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        removeFiltering({
                            keys: [ 'target_id' ],
                            value: d.id,
                        })
                        updateBlockQueue()
                    }
                    else {
                        d.filtered = true
                        gg
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        addFiltering({
                            keys: [ 'target_id' ],
                            value: d.id,
                        })
                        updateBlockQueue()
                    }
                })
            let dataPointTop = [
                {
                    x: 2,
                    y: 0.5,
                },
                {
                    x: 2,
                    y: labelBox.h + 0.5,
                },
                {
                    x: labelBox.w,
                    y: labelBox.h + 0.5,
                },
                {
                    x: labelBox.w - 2,
                    y: labelBox.h + 2.5,
                },
                {
                    x: 2 - 2,
                    y: labelBox.h + 2,
                },
                {
                    x: 2,
                    y: labelBox.h + 0.5,
                },
                {
                    x: 2 - 2,
                    y: labelBox.h + 2,
                },
                {
                    x: 2 - 2,
                    y: 0.5 + 2,
                },
                {
                    x: 2,
                    y: 0.5,
                },
            ]
            d3.select(this).append('path')
                .data([ dataPointTop ])
                .attr('d', lineGenerator)
                .attr('fill', color_theme.dark.background)
                .attr('stroke', color_theme.dark.stroke)
                .attr('stroke-width', 0.2)
            d3.select(this).append('text')
                .text(d.id)
                .attr('x', labelBox.w * 0.5)
                .attr('y', labelBox.h * 0.7)
                .attr('fill', com.main.color_theme.darker.stroke)
                .style('font-weight', 'normal')
                .attr('text-anchor', 'middle')
                .style('font-size', '8px')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
        })
        let mergetargets = entertargets.merge(alltargets)

        com.beginner.targets.g.append('rect')
            .attr('class', 'toRight')
            .attr('x', com.beginner.targets.box.w * 0.25 - 5)
            .attr('y', com.beginner.targets.box.h * 0.92 - 5)
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', color_theme.darker.background)
            .style('stroke', 'transparent')
            .style('opacity', 0)
            .style('stroke-width', 0.4)
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 1)
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 0)
            })
            .on('click', function() {
                mergetargets.each(function(d, i) {
                    if (!d.filtered) {
                        d.filtered = true
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        addFiltering({
                            keys: [ 'target_id' ],
                            value: d.id,
                        })
                    }
                })
                updateBlockQueue()
            })
        com.beginner.targets.g.append('svg:image')
            .attr('xlink:href', '/static/icons/arrow-right.svg')
            .attr('width', 10)
            .attr('height', 10)
            .attr('x', com.beginner.targets.box.w * 0.25 - 5)
            .attr('y', com.beginner.targets.box.h * 0.92 - 5)
            .style('pointer-events', 'none')

        com.beginner.targets.g.append('rect')
            .attr('class', 'switch')
            .attr('x', com.beginner.targets.box.w * 0.5 - 7.5)
            .attr('y', com.beginner.targets.box.h * 0.92 - 5)
            .attr('width', 15)
            .attr('height', 10)
            .style('fill', color_theme.darker.background)
            .style('stroke', 'transparent')
            .style('opacity', 0)
            .style('stroke-width', 0.4)
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 1)
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 0)
            })
            .on('click', function() {
                mergetargets.each(function(d, i) {
                    if (d.filtered) {
                        d.filtered = false
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        removeFiltering({
                            keys: [ 'target_id' ],
                            value: d.id,
                        })
                    }
                    else {
                        d.filtered = true
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        addFiltering({
                            keys: [ 'target_id' ],
                            value: d.id,
                        })
                    }
                })
                updateBlockQueue()
            })
        com.beginner.targets.g.append('svg:image')
            .attr('xlink:href', '/static/icons/arrow-bothside.svg')
            .attr('width', 15)
            .attr('height', 10)
            .attr('x', com.beginner.targets.box.w * 0.5 - 7.5)
            .attr('y', com.beginner.targets.box.h * 0.92 - 5)
            .style('pointer-events', 'none')

        com.beginner.targets.g.append('rect')
            .attr('class', 'toLeft')
            .attr('x', com.beginner.targets.box.w * 0.75 - 5)
            .attr('y', com.beginner.targets.box.h * 0.92 - 5)
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', color_theme.darker.background)
            .style('stroke', 'transparent')
            .style('opacity', 0)
            .style('stroke-width', 0.4)
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 1)
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .style('opacity', 0)
            })
            .on('click', function() {
                mergetargets.each(function(d, i) {
                    if (d.filtered) {
                        d.filtered = false
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        removeFiltering({
                            keys: [ 'target_id' ],
                            value: d.id,
                        })
                    }
                })
                updateBlockQueue()
            })
        com.beginner.targets.g.append('svg:image')
            .attr('xlink:href', '/static/icons/arrow-left.svg')
            .attr('width', 10)
            .attr('height', 10)
            .attr('x', com.beginner.targets.box.w * 0.75 - 5)
            .attr('y', com.beginner.targets.box.h * 0.92 - 5)
            .style('pointer-events', 'none')
        localScroll.scrollBox.reset_vertical_scroller({
            can_scroll: true,
            scroll_height: labelBox.h * targets.length,
        })
    }
    function initTime() {

    }

    // function initBackground () {
    //   com.main.g.append('rect')
    //     .attr('class', 'background')
    //     .attr('x', 0)
    //     .attr('y', 0)
    //     .attr('width', com.main.box.w)
    //     .attr('height', com.main.box.h)
    //     .style('fill', com.main.background.fill)
    //     .style('stroke', com.main.background.stroke)
    //     .style('stroke-width', com.main.background.strokeWidth)
    // }
    // function initTitle () {
    //   if (!com.title.g) com.title.g = com.main.g.append('g')
    //
    //   // com.title.g.append('rect')
    //   //   .attr('x', com.title.box.x)
    //   //   .attr('y', com.title.box.y)
    //   //   .attr('width', com.title.box.w)
    //   //   .attr('height', com.title.box.h)
    //   //   .style('fill', '#bbbbbb')
    //
    //   com.title.g.append('text')
    //     .text('Blocks filtering')
    //     .attr('x', com.title.box.w * 0.025)
    //     .attr('y', com.title.box.y + com.title.box.h * 0.75)
    //     .attr('dy', 0)
    //     .attr('stroke', com.main.color_theme.darker.stroke)
    //     .attr('stroke-width', 0.0)
    //     .attr('fill', com.main.color_theme.darker.stroke)
    //     .style('font-weight', 'normal')
    //     .attr('text-anchor', 'start')
    //     .style('font-size', '10px')
    //     .style('pointer-events', 'none')
    //     .style('user-select', 'none')
    // }
    // function initEnabled () {
    //   com.enabled.g.attr('transform', 'translate(' + com.enabled.box.x + ',' + com.enabled.box.y + ')')
    //
    //   let scrollBox = {
    //     x: com.enabled.box.w * 0.0,
    //     y: com.enabled.box.h * 0.0,
    //     w: com.enabled.box.w * 1,
    //     h: com.enabled.box.h * 1
    //   }
    //   function initScrollBox () {
    //     com.enabled.scroll.scrollBoxG = com.enabled.g.append('g')
    //     com.enabled.scroll.scrollBoxG.append('rect')
    //       .attr('class', 'background')
    //       .attr('x', scrollBox.x)
    //       .attr('y', scrollBox.y)
    //       .attr('width', scrollBox.w)
    //       .attr('height', scrollBox.h)
    //       .style('fill', color_theme.dark.background)
    //       .style('stroke', com.main.background.stroke)
    //       .style('stroke-width', 0.4)
    //     com.enabled.scroll.scrollBoxG.append('rect')
    //       .attr('class', 'background')
    //       .attr('x', scrollBox.x + 1)
    //       .attr('y', scrollBox.y + 1)
    //       .attr('width', scrollBox.w - 2)
    //       .attr('height', scrollBox.h - 2)
    //       .style('fill', color_theme.medium.background)
    //       .style('stroke', com.main.background.stroke)
    //       .style('stroke-width', 0.4)
    //
    //     com.enabled.scroll.scrollBox = new ScrollBox()
    //     com.enabled.scroll.scrollBox.init({
    //       tag: 'blocksFiltersScroll',
    //       g_box: com.enabled.scroll.scrollBoxG,
    //       box_data: {
    //         x: scrollBox.x,
    //         y: scrollBox.y,
    //         w: scrollBox.w,
    //         h: scrollBox.h,
    //         marg: 0
    //       },
    //       use_relative_coords: true,
    //       locker: new Locker(),
    //       lockers: ['blocksFiltersScroll' + 'update_data'],
    //       lock_zoom: {
    //         all: 'ScrollBox' + 'zoom',
    //         during: 'ScrollBox' + 'zoom_during',
    //         end: 'ScrollBox' + 'zoom_end'
    //       },
    //       run_loop: new RunLoop({tag: 'blocksFiltersScroll'}),
    //       can_scroll: true,
    //       scrollVertical: com.enabled.scroll.direction === 'vertical',
    //       scroll_horizontal: com.enabled.scroll.direction === 'horizontal',
    //       scroll_height: scrollBox.h + 0.01,
    //       scroll_width: scrollBox.w + 0.01,
    //       background: 'transparent',
    //       scroll_rec_h: {h: 2},
    //       scroll_recs: {w: 2}
    //     })
    //     com.enabled.scroll.scrollG = com.enabled.scroll.scrollBox.get('inner_g')
    //   }
    //   initScrollBox()
    //   updateEnabled()
    // }
    // function updateEnabled () {
    //   let dim = {
    //     x: com.enabled.box.h * 0.15,
    //     y: com.enabled.box.h * 0.15,
    //     w: com.enabled.box.h * 0.7,
    //     h: com.enabled.box.h * 0.7
    //   }
    //   let tokens = com.enabled.scroll.scrollG
    //     .selectAll('g.token')
    //     .data(com.filters, function (d) {
    //       return d.id
    //     })
    //   let enterTokens = tokens
    //     .enter()
    //     .append('g')
    //     .attr('class', 'token')
    //     .attr('transform', function (d, i) {
    //       let nLine = parseInt(com.enabled.box.w / (dim.x + dim.w))
    //       let translate = {
    //         y: dim.y + (dim.h + dim.y) * parseInt(i / nLine),
    //         x: dim.x + ((dim.w + dim.x) * (i % nLine))
    //       }
    //       return 'translate(' + translate.x + ',' + translate.y + ')'
    //     })
    //   enterTokens.each(function (d, i) {
    //     d3.select(this).append('rect')
    //       .attr('x', 0)
    //       .attr('y', 0)
    //       .attr('width', dim.w)
    //       .attr('height', dim.h)
    //       .attr('fill', com.main.color_theme.darker.background)
    //       .attr('fill-opacity', 1)
    //       .attr('stroke', color_theme.darker.stroke)
    //       .attr('stroke-width', 0.4)
    //       .on('click', function () {
    //         com.token_focus = d
    //         if (d.type === 'states') createStatesFilters({token: d})
    //         else if (d.type === 'tels') createTelsFilters({token: d})
    //         else if (d.type === 'targets') create_targetsFilter({token: d})
    //         else if (d.type === 'tume') createTimeFilters({token: d})
    //       })
    //     d3.select(this).append('text')
    //       .text(function (d) {
    //         return d.type
    //       })
    //       .attr('x', dim.w * 0.5)
    //       .attr('y', dim.h * 0.75)
    //       .style('font-weight', 'normal')
    //       .attr('text-anchor', 'middle')
    //       .style('font-size', '6.5px')
    //       .style('pointer-events', 'none')
    //       .attr('fill', color_theme.darker.text)
    //       .attr('stroke', 'none')
    //   })
    //
    //   let mergeTokens = enterTokens.merge(tokens)
    //   mergeTokens.each(function (d, i) {
    //     d3.select(this)
    //       .transition()
    //       .duration(times.anim)
    //       .attr('transform', function (d) {
    //         let nLine = parseInt(com.enabled.box.w / (dim.x + dim.w))
    //         let translate = {
    //           y: dim.y + (dim.h + dim.y) * parseInt(i / nLine),
    //           x: dim.x + ((dim.w + dim.x) * (i % nLine))
    //         }
    //         return 'translate(' + translate.x + ',' + translate.y + ')'
    //       })
    //   })
    //
    //   com.enabled.scroll.scrollBox.reset_vertical_scroller({can_scroll: true, scroll_height: 0})
    // }

    // function initDisabled () {
    //   com.disabled.g.attr('transform', 'translate(' + com.disabled.box.x + ',' + com.disabled.box.y + ')')
    //
    //   let scrollBox = {
    //     x: com.disabled.box.w * 0.0,
    //     y: com.disabled.box.h * 0.0,
    //     w: com.disabled.box.w * 1,
    //     h: com.disabled.box.h * 1
    //   }
    //   function initScrollBox () {
    //     com.disabled.scroll.scrollBoxG = com.disabled.g.append('g')
    //     com.disabled.scroll.scrollBoxG.append('rect')
    //       .attr('class', 'background')
    //       .attr('x', scrollBox.x)
    //       .attr('y', scrollBox.y)
    //       .attr('width', scrollBox.w)
    //       .attr('height', scrollBox.h)
    //       .style('fill', com.main.color_theme.dark.background)
    //       .style('stroke', com.main.color_theme.dark.stroke)
    //       .style('stroke-width', 0.4)
    //     com.disabled.scroll.scrollBoxG.append('rect')
    //       .attr('class', 'background')
    //       .attr('x', scrollBox.x + 1)
    //       .attr('y', scrollBox.y + 1)
    //       .attr('width', scrollBox.w - 2)
    //       .attr('height', scrollBox.h - 2)
    //       .style('fill', com.main.color_theme.medium.background)
    //       .style('stroke', com.main.color_theme.darker.stroke)
    //       .style('stroke-width', 0.4)
    //
    //     com.disabled.scroll.scrollBox = new ScrollBox()
    //     com.disabled.scroll.scrollBox.init({
    //       tag: 'blocksFiltersScroll',
    //       g_box: com.disabled.scroll.scrollBoxG,
    //       box_data: {
    //         x: scrollBox.x,
    //         y: scrollBox.y,
    //         w: scrollBox.w,
    //         h: scrollBox.h,
    //         marg: 0
    //       },
    //       use_relative_coords: true,
    //       locker: new Locker(),
    //       lockers: ['blocksFiltersScroll' + 'update_data'],
    //       lock_zoom: {
    //         all: 'ScrollBox' + 'zoom',
    //         during: 'ScrollBox' + 'zoom_during',
    //         end: 'ScrollBox' + 'zoom_end'
    //       },
    //       run_loop: new RunLoop({tag: 'blocksFiltersScroll'}),
    //       can_scroll: true,
    //       scrollVertical: com.disabled.scroll.direction === 'vertical',
    //       scroll_horizontal: com.disabled.scroll.direction === 'horizontal',
    //       scroll_height: scrollBox.h + 0.01,
    //       scroll_width: scrollBox.w + 0.01,
    //       background: 'transparent',
    //       scroll_rec_h: {h: 2},
    //       scroll_recs: {w: 2}
    //     })
    //     com.disabled.scroll.scrollG = com.disabled.scroll.scrollBox.get('inner_g')
    //   }
    //   initScrollBox()
    //   updateDisabled()
    // }
    // function updateDisabled () {
    //   let dim = {
    //     x: com.enabled.box.w * 0.0,
    //     y: com.enabled.box.w * 0.9,
    //     w: com.enabled.box.w * 0.8,
    //     h: com.enabled.box.w * 0.8
    //   }
    //   let tokens = com.enabled.scroll.scrollG
    //     .selectAll('g.token')
    //     .data(com.filters, function (d) {
    //       return d.id
    //     })
    //   let enterTokens = tokens
    //     .enter()
    //     .append('g')
    //     .attr('class', 'token')
    //     .attr('transform', function (d, i) {
    //       let translate = {
    //         y: dim.y * i,
    //         x: dim.x
    //       }
    //       return 'translate(' + translate.x + ',' + translate.y + ')'
    //     })
    //   enterTokens.each(function (d, i) {
    //     d3.select(this).append('rect')
    //       .attr('x', 0)
    //       .attr('y', 0)
    //       .attr('width', dim.w)
    //       .attr('height', dim.h)
    //       .attr('fill', '#999999')
    //       .attr('fill-opacity', 1)
    //       .attr('stroke', color_theme.dark.stroke)
    //       .attr('stroke-width', 0.2)
    //       .on('click', function () {
    //         com.token_focus = d
    //         if (d.type === 'states') createStatesFilters({token: d})
    //         else if (d.type === 'tels') createTelsFilters({token: d})
    //         else if (d.type === 'targets') create_targetsFilter({token: d})
    //         else if (d.type === 'tume') createTimeFilters({token: d})
    //       })
    //     d3.select(this).append('text')
    //       .text(function (d) {
    //         return d.type
    //       })
    //       .attr('x', dim.w * 0.5)
    //       .attr('y', dim.h * 0.75)
    //       .style('font-weight', 'normal')
    //       .attr('text-anchor', 'middle')
    //       .style('font-size', '6.5px')
    //       .style('pointer-events', 'none')
    //       .attr('fill', color_theme.darker.text)
    //       .attr('stroke', 'none')
    //   })
    //
    //   let mergeTokens = enterTokens.merge(tokens)
    //   mergeTokens.each(function (d, i) {
    //     d3.select(this)
    //       .transition()
    //       .duration(times.anim)
    //       .attr('transform', function () {
    //         let translate = {
    //           y: dim.y * i,
    //           x: dim.x
    //         }
    //         return 'translate(' + translate.x + ',' + translate.y + ')'
    //       })
    //   })
    //
    //   com.enabled.scroll.scrollBox.reset_vertical_scroller({can_scroll: true, scroll_height: 0})
    // }
    // function initContent () {
    //   com.content.g.attr('transform', 'translate(' + (com.content.box.x) + ',' + (com.content.box.y) + ')')
    //   com.content.g.append('rect')
    //     .attr('x', 0)
    //     .attr('y', 0)
    //     .attr('width', com.content.box.w)
    //     .attr('height', com.content.box.h)
    //     .style('fill', com.main.color_theme.dark.background)
    //     .style('stroke', com.main.color_theme.dark.stroke)
    //     .style('stroke-width', 0.4)
    //   com.content.g.append('rect')
    //     .attr('x', 1.5)
    //     .attr('y', 1.5)
    //     .attr('width', com.content.box.w - 3)
    //     .attr('height', com.content.box.h - 3)
    //     .style('fill', com.main.color_theme.medium.background)
    //     .style('stroke', com.main.color_theme.medium.stroke)
    //     .style('stroke-width', 0.4)
    //
    //   com.content.panel.g = com.content.g.append('g')
    //   com.content.button.g = com.content.g.append('g')
    //   let add_button_box = {
    //     x: com.content.box.w * 0.0 + 1,
    //     y: com.content.box.w * 0.0,
    //     w: com.content.box.w * 0.1,
    //     h: com.content.box.w * 0.1
    //   }
    //   com.content.button.g.append('rect')
    //     .attr('x', add_button_box.x + 1.5 + 0.5)
    //     .attr('y', add_button_box.y + 1.5 + 0.5)
    //     .attr('width', add_button_box.w + 0.5)
    //     .attr('height', add_button_box.h + 0.5)
    //     .style('fill', com.main.color_theme.darker.background)
    //   com.content.button.g.append('rect')
    //     .attr('x', add_button_box.x + 1.5)
    //     .attr('y', add_button_box.y + 1.5)
    //     .attr('width', add_button_box.w)
    //     .attr('height', add_button_box.h)
    //     .style('fill', com.main.color_theme.medium.background)
    //     .style('stroke', com.main.color_theme.medium.stroke)
    //     .style('stroke-width', 0.4)
    //     .on('click', createFiltersSelection)
    //   com.content.button.g.append('text')
    //     .text('+')
    //     .attr('x', add_button_box.x + add_button_box.w * 0.5 + 1.5)
    //     .attr('y', add_button_box.y + add_button_box.h * 0.8 + 1.5)
    //     .attr('dy', 0)
    //     .attr('stroke', com.main.color_theme.darker.stroke)
    //     .attr('stroke-width', 0.5)
    //     .attr('fill', com.main.color_theme.darker.stroke)
    //     .style('font-weight', 'normal')
    //     .attr('text-anchor', 'middle')
    //     .style('font-size', '12px')
    //     .style('pointer-events', 'none')
    //     .style('user-select', 'none')
    // }
    // function initResult () {
    //   if (!com.result.g) com.result.g = com.main.g.append('g')
    //
    //   com.result.g.append('rect')
    //     .attr('x', com.result.box.x)
    //     .attr('y', com.result.box.y)
    //     .attr('width', com.result.box.w)
    //     .attr('height', com.result.box.h)
    //     .style('fill', '#666666')
    // }

    function createFiltersSelection() {
        function addFilterToken(type) {
            let filterToken = {
                id: type + '_' + Date.now(),
                type: type,
                filtering: [],
            }
            com.filters.unshift(filterToken)
            com.token_focus = filterToken
            updateEnabled()
        }
        com.content.panel.g.selectAll('*').remove()
        let dim = com.content.box.w * 0.2
        let statesBox = {
            x: com.content.box.w * 0.33 - dim * 0.5,
            y: com.content.box.h * 0.33 - dim * 0.5,
            w: dim,
            h: dim,
        }
        let telsBox = {
            x: com.content.box.w * 0.66 - dim * 0.5,
            y: com.content.box.h * 0.33 - dim * 0.5,
            w: dim,
            h: dim,
        }
        let targetsBox = {
            x: com.content.box.w * 0.33 - dim * 0.5,
            y: com.content.box.h * 0.66 - dim * 0.5,
            w: dim,
            h: dim,
        }
        let timeBox = {
            x: com.content.box.w * 0.66 - (dim * 0.5),
            y: com.content.box.h * 0.66 - (dim * 0.5),
            w: dim,
            h: dim,
        }

        com.content.panel.g.append('rect')
            .attr('x', statesBox.x + 0.5)
            .attr('y', statesBox.y + 0.5)
            .attr('width', statesBox.w + 1.5)
            .attr('height', statesBox.h + 1.5)
            .style('fill', com.main.color_theme.darker.background)
            .style('stroke', com.main.color_theme.darker.stroke)
            .style('stroke-width', 0)
        com.content.panel.g.append('rect')
            .attr('x', statesBox.x + 0.5)
            .attr('y', statesBox.y + 0.5)
            .attr('width', statesBox.w + 1.5)
            .attr('height', statesBox.h + 1.5)
            .style('fill', com.main.color_theme.medium.background)
            .style('stroke', com.main.color_theme.medium.stroke)
            .style('stroke-width', 0)
            .on('click', function(d) {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .attr('x', statesBox.x + 0.5)
                    .attr('y', statesBox.y + 0.5)
                    .attr('width', statesBox.w + 1.5)
                    .attr('height', statesBox.h + 1.5)
                    .style('stroke-width', 0.0)
                    .on('end', function() {
                        addFilterToken('states')
                        createStatesFilters({
                        })
                    })
            })
            .transition()
            .duration(times.anim)
            .style('stroke-width', 0.4)
            .attr('x', statesBox.x)
            .attr('y', statesBox.y)
            .attr('width', statesBox.w)
            .attr('height', statesBox.h)

        com.content.panel.g.append('rect')
            .attr('x', telsBox.x + 0.5)
            .attr('y', telsBox.y + 0.5)
            .attr('width', telsBox.w + 1.5)
            .attr('height', telsBox.h + 1.5)
            .style('fill', com.main.color_theme.darker.background)
            .style('stroke', com.main.color_theme.darker.stroke)
            .style('stroke-width', 0.0)
        com.content.panel.g.append('rect')
            .attr('x', telsBox.x + 0.5)
            .attr('y', telsBox.y + 0.5)
            .attr('width', telsBox.w + 1.5)
            .attr('height', telsBox.h + 1.5)
            .style('fill', com.main.color_theme.medium.background)
            .style('stroke', com.main.color_theme.medium.stroke)
            .style('stroke-width', 0.0)
            .on('click', function(d) {
                d3.select(this)
                    .transition()
                    .duration(times.anim)
                    .attr('x', telsBox.x + 0.5)
                    .attr('y', telsBox.y + 0.5)
                    .attr('width', telsBox.w + 1.5)
                    .attr('height', telsBox.h + 1.5)
                    .style('stroke-width', 0.0)
                    .on('end', function() {
                        addFilterToken('tels')
                        createTelsFilters({
                        })
                    })
            })
            .transition()
            .duration(times.anim)
            .style('stroke-width', 0.4)
            .attr('x', telsBox.x)
            .attr('y', telsBox.y)
            .attr('width', telsBox.w)
            .attr('height', telsBox.h)

        com.content.panel.g.append('rect')
            .attr('x', targetsBox.x + 0.5)
            .attr('y', targetsBox.y + 0.5)
            .attr('width', targetsBox.w + 1.5)
            .attr('height', targetsBox.h + 1.5)
            .style('fill', com.main.color_theme.darker.background)
            .style('stroke', com.main.color_theme.darker.stroke)
            .style('stroke-width', 0.0)
        com.content.panel.g.append('rect')
            .attr('x', targetsBox.x + 0.5)
            .attr('y', targetsBox.y + 0.5)
            .attr('width', targetsBox.w + 1.5)
            .attr('height', targetsBox.h + 1.5)
            .style('fill', com.main.color_theme.medium.background)
            .style('stroke', com.main.color_theme.medium.stroke)
            .style('stroke-width', 0.0)
            .on('click', function(d) {
                addFilterToken('target')
                create_targetsFilter({
                })
            })
            .transition()
            .duration(times.anim)
            .style('stroke-width', 0.4)
            .attr('x', targetsBox.x)
            .attr('y', targetsBox.y)
            .attr('width', targetsBox.w)
            .attr('height', targetsBox.h)

        com.content.panel.g.append('rect')
            .attr('x', timeBox.x + 0.5)
            .attr('y', timeBox.y + 0.5)
            .attr('width', timeBox.w + 1.5)
            .attr('height', timeBox.h + 1.5)
            .style('fill', com.main.color_theme.darker.background)
            .style('stroke', com.main.color_theme.darker.stroke)
            .style('stroke-width', 0.0)
        com.content.panel.g.append('rect')
            .attr('x', timeBox.x + 0.5)
            .attr('y', timeBox.y + 0.5)
            .attr('width', timeBox.w + 1.5)
            .attr('height', timeBox.h + 1.5)
            .style('fill', com.main.color_theme.medium.background)
            .style('stroke', com.main.color_theme.medium.stroke)
            .style('stroke-width', 0.0)
            .on('click', function(d) {
                addFilterToken('time')
                createTimeFilters({
                })
            })
            .transition()
            .duration(times.anim)
            .style('stroke-width', 0.4)
            .attr('x', timeBox.x)
            .attr('y', timeBox.y)
            .attr('width', timeBox.w)
            .attr('height', timeBox.h)
    }
    function createStatesFilters(opt_in) {
        let token = opt_in.token

        com.content.panel.g.selectAll('*').remove()

        function create_button(new_button, type, filter) {
            new_button.attr('status', 'disabled')
            if (token) {
                for (let i = 0; i < token.filtering.length; i++) {
                    if (token.filtering[i].name === type) {
                        new_button.attr('status', 'enabled')
                    }
                }
            }

            let checkFunction = function(rect) {
                if (new_button.attr('status') === 'enabled') {
                    rect.attr('stroke', function(d, i) {
                        return '#000000'
                    })
                        .attr('stroke-width', 1.5)
                    new_button.append('line')
                        .attr('class', 'checkboxBar')
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', (Number(new_button.attr('width'))))
                        .attr('y2', (Number(new_button.attr('height'))))
                        .attr('stroke', '#000000')
                        .style('stroke-opacity', 0.9)
                        .attr('stroke-width', 2)
                        .style('pointer-events', 'none')
                    new_button.append('line')
                        .attr('class', 'checkboxBar')
                        .attr('x1', 0)
                        .attr('y1', (Number(new_button.attr('height'))))
                        .attr('x2', (Number(new_button.attr('width'))))
                        .attr('y2', 0)
                        .attr('stroke', '#000000')
                        .style('stroke-opacity', 0.9)
                        .attr('stroke-width', 2)
                        .style('pointer-events', 'none')
                }
                else {
                    new_button.selectAll('line.checkboxBar').remove()
                    rect.attr('stroke', function(d, i) {
                        return '#000000'
                    })
                        .attr('stroke-width', 0.2)
                        .style('stroke-opacity', 1)
                }
            }
            let clickFunction = function(rect) {
                if (new_button.attr('status') === 'enabled') {
                    new_button.attr('status', 'disabled')
                    removeFiltering(filter)
                    updateBlockQueue()
                }
                else {
                    new_button.attr('status', 'enabled')
                    addFiltering(filter)
                    updateBlockQueue()
                }
            }
            let newRect = new_button.append('rect')
                .attr('x', (Number(new_button.attr('width')) - ((Number(new_button.attr('width'))) * (3) / 3)) / 2)
                .attr('y', (Number(new_button.attr('height')) - ((Number(new_button.attr('height'))) * (3) / 3)) / 2)
                .attr('width', function(d, i) {
                    return ((Number(new_button.attr('width'))) * (3) / 3)
                })
                .attr('height', function(d, i) {
                    return ((Number(new_button.attr('height'))) * (3) / 3)
                })
                .attr('rx', 0)
                .attr('ry', 0)
                .attr('stroke', function(d, i) {
                    return 'black'
                })
                .attr('stroke-width', 0.2)
                .style('fill', function(d, i) {
                    return recCol(type).background
                })
                .style('fill-opacity', function(d, i) {
                    return 1
                })
                .on('click', function() {
                    clickFunction(d3.select(this))
                    checkFunction(d3.select(this))
                })
                .on('mouseover', function() {
                    // let ginfo = com.filters.g.append('g')
                    //   .attr('class', 'info')
                    //   .attr('transform', new_button.attr('transform'))
                    // ginfo.append('rect')
                    //   .attr('x', -Number(new_button.attr('width')) * 0.5)
                    //   .attr('y', -20)
                    //   .attr('width', Number(new_button.attr('width')) * 2)
                    //   .attr('height', 18)
                    //   .attr('rx', 3)
                    //   .attr('ry', 3)
                    //   .attr('fill', '#eeeeee')
                    //   .style('fill-opacity', 0.82)
                    // ginfo.append('text')
                    //   .text(type)
                    //   .attr('x', Number(new_button.attr('width')) * 0.5)
                    //   .attr('y', -5)
                    //   .style('fill-opacity', 0.82)
                    //   .style('font-weight', 'normal')
                    //   .attr('text-anchor', 'middle')
                    //   .style('font-size', 16)
                    //   .style('pointer-events', 'none')
                    //   .style('user-select', 'none')

                    new_button.attr('status-over', new_button.attr('status'))
                    if (new_button.attr('status') === 'enabled') {
                        removeFiltering(filter)
                        updateBlockQueue()
                    }
                    else if (new_button.attr('status') === 'disabled') {
                        addFiltering(filter)
                        updateBlockQueue()
                    }
                })
                .on('mouseout', function() {
                    // com.filters.g.select('g.info').remove()
                    if (new_button.attr('status') === 'disabled') {
                        removeFiltering(filter)
                        updateBlockQueue()
                    }
                    else if (new_button.attr('status') === 'enabled') {
                        addFiltering(filter)
                        updateBlockQueue()
                    }
                })
            // clickFunction(newRect)
            checkFunction(newRect)
            return new_button
        }
        com.content.panel.g.append('text')
            .text('States')
            .attr('x', com.content.box.w * 0.5)
            .attr('y', com.content.box.h * 0.25)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '9')
            .style('pointer-events', 'none')
            .style('user-select', 'none')

        let bBox = {
            x: com.content.box.w * 0.18,
            y: com.content.box.h * 0.5,
            w: (com.content.box.w * 0.98) / 6,
            h: (com.content.box.w * 0.98) / 6,
        }
        let failG = com.content.panel.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 0) + ',' + (bBox.y - bBox.h * 0.7) + ')')
        let doneG = com.content.panel.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 1.5) + ',' + (bBox.y - bBox.h * 0.7) + ')')
        let runG = com.content.panel.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 3) + ',' + (bBox.y - bBox.h * 0.7) + ')')
        let cancelOG = com.content.panel.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 0) + ',' + (bBox.y + com.content.box.h * 0.2 - bBox.h * 0.5) + ')')
        let cancelSG = com.content.panel.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 1.5) + ',' + (bBox.y + com.content.box.h * 0.2 - bBox.h * 0.5) + ')')
        let waitG = com.content.panel.g.append('g')
            .attr('width', bBox.w * 0.8)
            .attr('height', bBox.h * 0.8)
            .attr('transform', 'translate(' + (bBox.x + bBox.w * 3) + ',' + (bBox.y + com.content.box.h * 0.2 - bBox.h * 0.5) + ')')
        com.content.panel.button = {
            Fail: create_button(failG, 'fail', {
                name: 'fail',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'fail',
                }],
            }),
            Done: create_button(doneG, 'done', {
                name: 'done',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'done',
                }],
            }),
            Run: create_button(runG, 'run', {
                name: 'run',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'run',
                }],
            }),
            'Cancel.canrun': create_button(cancelOG, 'cancelO', {
                name: 'cancelO',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'cancel',
                }, {
                    keys: [ 'exe_state', 'can_run' ],
                    value: true,
                }],
            }),
            Cancel: create_button(cancelSG, 'cancelS', {
                name: 'cancelS',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'cancel',
                }, {
                    keys: [ 'exe_state', 'can_run' ],
                    value: false,
                }],
            }),
            Wait: create_button(waitG, 'wait', {
                name: 'wait',
                operation: 'exclude',
                contains: 'all',
                filters: [{
                    keys: [ 'exe_state', 'state' ],
                    value: 'wait',
                }],
            }),
        }
    }
    function createTelsFilters(opt_in) {
        let token = opt_in.token

        com.content.panel.g.selectAll('*').remove()

        com.content.panel.g.append('text')
            .text('Tels')
            .attr('x', com.content.box.w * 0.5)
            .attr('y', com.content.box.h * 0.15)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '9')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        com.content.panel.g.append('text')
            .text('')
            .attr('x', com.content.box.w * 0.25)
            .attr('y', com.content.box.h * 0.15)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '6px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
        com.content.panel.g.append('text')
            .text('Show')
            .attr('x', com.content.box.w * 0.75)
            .attr('y', com.content.box.h * 0.15)
            .attr('dy', 0)
            .attr('stroke', com.main.color_theme.darker.stroke)
            .attr('stroke-width', 0.0)
            .attr('fill', com.main.color_theme.darker.stroke)
            .style('font-weight', 'normal')
            .attr('text-anchor', 'middle')
            .style('font-size', '6px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')

        let tels = tel_info.get_ids()
        tels = tels.map(function(d) {
            let filtered = false
            if (token) {
                for (let i = 0; i < token.filtering.length; i++) {
                    let f = token.filtering[i]
                    if (f.filters[0].value === d) {
                        filtered = true
                    }
                }
            }
            return {
                id: d,
                filtered: filtered,
            }
        })

        let localScroll = {
        }
        let left = {
            x: com.content.box.w * 0.05,
            y: com.content.box.h * 0.175,
            w: com.content.box.w * 0.44,
            h: com.content.box.h * 0.68,
        }
        let right = {
            x: com.content.box.w * 0.51,
            y: com.content.box.h * 0.175,
            w: com.content.box.w * 0.44,
            h: com.content.box.h * 0.68,
        }
        function initScrollBox() {
            localScroll.scrollBoxG = com.content.panel.g.append('g')
            localScroll.scrollBoxG.append('rect')
                .attr('class', 'background')
                .attr('x', left.x)
                .attr('y', left.y)
                .attr('width', left.w)
                .attr('height', left.h)
                .style('fill', color_theme.darker.background)
                .style('stroke', com.main.background.stroke)
                .style('stroke-width', 0.4)
            localScroll.scrollBoxG.append('rect')
                .attr('class', 'background')
                .attr('x', right.x)
                .attr('y', right.y)
                .attr('width', right.w)
                .attr('height', right.h)
                .style('fill', color_theme.darker.background)
                .style('stroke', com.main.background.stroke)
                .style('stroke-width', 0.4)

            localScroll.scrollBox = new ScrollBox()
            localScroll.scrollBox.init({
                tag: 'telsFiltersScroll',
                g_box: localScroll.scrollBoxG,
                box_data: {
                    x: com.content.box.w * 0.05,
                    y: com.content.box.h * 0.175,
                    w: com.content.box.w * 0.9,
                    h: com.content.box.h * 0.68,
                    marg: 0,
                },
                use_relative_coords: true,
                locker: new Locker(),
                lockers: [ 'telsFiltersScroll' + 'update_data' ],
                lock_zoom: {
                    all: 'ScrollBox' + 'zoom',
                    during: 'ScrollBox' + 'zoom_during',
                    end: 'ScrollBox' + 'zoom_end',
                },
                run_loop: new RunLoop({
                    tag: 'telsFiltersScroll',
                }),
                can_scroll: true,
                scrollVertical: true,
                scroll_horizontal: false,
                scroll_height: 0,
                scroll_width: 0,
                background: 'transparent',
                scroll_rec_h: {
                    h: 1,
                },
                scroll_recs: {
                    w: 1,
                },
            })
            localScroll.scrollG = localScroll.scrollBox.get('inner_g')
        }
        initScrollBox()

        let labelBox = {
            x: com.content.box.w * 0.46,
            y: 0,
            w: com.content.box.w * 0.44,
            h: 12,
        }

        let allTels = localScroll.scrollG
            .selectAll('g.tel')
            .data(tels, function(d) {
                return d.id
            })
        let enterTels = allTels
            .enter()
            .append('g')
            .attr('class', 'tel')
            .attr('transform', function(d, i) {
                let translate = {
                    y: labelBox.h * i,
                    x: labelBox.x * d.filtered,
                }
                return 'translate(' + translate.x + ',' + translate.y + ')'
            })
        enterTels.each(function(d, i) {
            let gg = d3.select(this)
            d3.select(this).append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', labelBox.w)
                .attr('height', labelBox.h)
                .style('fill', color_theme.dark.background)
                .style('stroke', com.main.background.stroke)
                .style('stroke-width', com.main.background.strokeWidth)
                .on('click', function() {
                    if (d.filtered) {
                        d.filtered = false
                        gg
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        removeFiltering({
                            name: 'tels',
                            operation: 'include',
                            contains: 'all',
                            filters: [{
                                keys: [ 'tel_ids' ],
                                value: d.id,
                            }],
                        })
                        updateBlockQueue()
                    }
                    else {
                        d.filtered = true
                        gg
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        addFiltering({
                            name: 'tels',
                            operation: 'include',
                            contains: 'all',
                            filters: [{
                                keys: [ 'tel_ids' ],
                                value: d.id,
                            }],
                        })
                        updateBlockQueue()
                    }
                })
            d3.select(this).append('text')
                .text(d.id)
                .attr('x', labelBox.w * 0.5)
                .attr('y', labelBox.h * 0.7)
                .attr('fill', com.main.color_theme.darker.stroke)
                .style('font-weight', 'normal')
                .attr('text-anchor', 'middle')
                .style('font-size', '8px')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
        })
        let mergeTels = enterTels.merge(allTels)

        com.content.panel.g.append('rect')
            .attr('class', 'toRight')
            .attr('x', com.content.box.w * 0.25 - 5)
            .attr('y', com.content.box.h * 0.92 - 5)
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', color_theme.darker.background)
            .style('stroke', com.main.background.stroke)
            .style('stroke-width', 0.4)
            .on('click', function() {
                mergeTels.each(function(d, i) {
                    if (!d.filtered) {
                        d.filtered = true
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        addFiltering({
                            name: 'tels',
                            operation: 'include',
                            contains: 'all',
                            filters: [{
                                keys: [ 'tel_ids' ],
                                value: d.id,
                            }],
                        })
                    }
                })
                updateBlockQueue()
            })
        com.content.panel.g.append('rect')
            .attr('class', 'switch')
            .attr('x', com.content.box.w * 0.5 - 7.5)
            .attr('y', com.content.box.h * 0.92 - 5)
            .attr('width', 15)
            .attr('height', 10)
            .style('fill', color_theme.darker.background)
            .style('stroke', com.main.background.stroke)
            .style('stroke-width', 0.4)
            .on('click', function() {
                mergeTels.each(function(d, i) {
                    if (d.filtered) {
                        d.filtered = false
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        removeFiltering({
                            name: 'tels',
                            operation: 'include',
                            contains: 'all',
                            filters: [{
                                keys: [ 'tel_ids' ],
                                value: d.id,
                            }],
                        })
                    }
                    else {
                        d.filtered = true
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        addFiltering({
                            name: 'tels',
                            operation: 'include',
                            contains: 'all',
                            filters: [{
                                keys: [ 'tel_ids' ],
                                value: d.id,
                            }],
                        })
                    }
                })
                updateBlockQueue()
            })
        com.content.panel.g.append('rect')
            .attr('class', 'toLeft')
            .attr('x', com.content.box.w * 0.75 - 5)
            .attr('y', com.content.box.h * 0.92 - 5)
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', color_theme.darker.background)
            .style('stroke', com.main.background.stroke)
            .style('stroke-width', 0.4)
            .on('click', function() {
                mergeTels.each(function(d, i) {
                    if (d.filtered) {
                        d.filtered = false
                        d3.select(this)
                            .attr('transform', function(d) {
                                let translate = {
                                    y: labelBox.h * i,
                                    x: labelBox.x * d.filtered,
                                }
                                return 'translate(' + translate.x + ',' + translate.y + ')'
                            })
                        removeFiltering({
                            name: 'tels',
                            operation: 'include',
                            contains: 'all',
                            filters: [{
                                keys: [ 'tel_ids' ],
                                value: d.id,
                            }],
                        })
                    }
                })
                updateBlockQueue()
            })
        localScroll.scrollBox.reset_vertical_scroller({
            can_scroll: true,
            scroll_height: labelBox.h * tels.length,
        })
    }
    function create_targetsFilter(opt_in) {
        if (!com.targets.g) {
            com.targets.g = com.main.g.append('g')
        }

        com.targets.g.append('rect')
            .attr('x', com.targets.box.x)
            .attr('y', com.targets.box.y)
            .attr('width', com.targets.box.w)
            .attr('height', com.targets.box.h)
            .style('fill', '#666666')
    }
    function createTimeFilters(opt_in) {
        if (!com.time.g) {
            com.time.g = com.main.g.append('g')
        }

        com.time.g.append('rect')
            .attr('x', com.time.box.x)
            .attr('y', com.time.box.y)
            .attr('width', com.time.box.w)
            .attr('height', com.time.box.h)
            .style('fill', '#666666')
    }

    // function addFiltering (filter) {
    //   com.token_focus.filtering.push(filter)
    // }
    // function removeFiltering (filter) {
    //   let index = com.token_focus.filtering.indexOf(filter)
    //   com.token_focus.filtering.splice(index, 1)
    // }
    function getFilters() {
        let allFilters = []
        if (com.main.mode === 'expert') {
            for (let i = 0; i < com.filters.length; i++) {
                for (let j = 0; j < com.filters[i].filtering.length; j++) {
                    allFilters.push(com.filters[i].filtering[j])
                }
            }
        }
        else if (com.main.mode === 'beginner') {
            for (let j = 0; j < com.beginner.states.token.filtering.length; j++) {
                allFilters.push(com.beginner.states.token.filtering[j])
            }
            if (com.beginner.tels.token.filtering[0].filters.length > 0) {
                allFilters.push(com.beginner.tels.token.filtering[0])
            }
            if (com.beginner.targets.token.filtering[0].filters.length > 0) {
                allFilters.push(com.beginner.targets.token.filtering[0])
            }
        }
        return allFilters
    }
    this.getFilters = getFilters

    function updateBlockQueue() {
        for (let i = com.blockQueue.length - 1; i > -1; i--) {
            com.blockQueue[i].update()
        }
    }
    function update_stats() {
        addStatesMiddle_info()
        addTargetsMiddle_info()
        addTelsMiddle_info()
    }
    this.update_stats = update_stats

    function plugBlockQueue(blockQueue, propagate) {
        com.blockQueue.push(blockQueue)
        if (propagate) {
            blockQueue.plugBlockFilters(this, !propagate)
        }
        for (let i = 0; i < com.filters.length; i++) {
            blockQueue.updateFilters(com.filters[i])
        }
    }
    this.plugBlockQueue = plugBlockQueue
    function unplugBlockQueue(blockQueue, propagate) {
        for (let i = com.blockQueue.length - 1; i > -1; i--) {
            if (com.blockQueue[i] === blockQueue) {
                com.blockQueue[i].remove()
            }
        }
        if (propagate) {
            blockQueue.unplugBlockFilters(this, !propagate)
        }
        for (let i = 0; i < com.filters.length; i++) {
            blockQueue.updateFilters(com.filters[i])
        }
    }
    this.unplugBlockQueue = unplugBlockQueue
    // function updateTargetFromBlockQueue () {
    //   for (let i = com.blockQueue.length - 1; i > -1; i--) {
    //     if (com.blockQueue[i] === blockQueue) {
    //       com.blockQueue[i].remove()
    //     }
    //   }
    // }
}
