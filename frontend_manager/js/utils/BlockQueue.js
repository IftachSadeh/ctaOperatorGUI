/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global get_color_theme */
/* global deep_copy */
/* global min_max_obj */
/* global load_script */
/* global cols_blues */
/* global cols_yellows */

load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/ScrollBox.js',
})

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.BlockQueue = function(opt_in) {
    let color_theme = get_color_theme('bright_grey')
    let template = {
        main: {
            tag: 'blockQueueRootTag',
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
        axis: {
            enabled: true,
            g: undefined,
            box: {
                x: 0,
                y: 300,
                w: 1000,
                h: 0,
                marg: 0,
            },
            axis: undefined,
            scale: undefined,
            domain: [ 0, 1000 ],
            range: [ 0, 0 ],
            showText: true,
            orientation: 'axisTop',
            attr: {
                text: {
                    stroke: color_theme.medium.stroke,
                    fill: color_theme.medium.background,
                },
                path: {
                    stroke: color_theme.medium.stroke,
                    fill: color_theme.medium.background,
                },
            },
        },
        blocks: {
            enabled: true,
            run: {
                enabled: true,
                g: undefined,
                box: {
                    x: 0,
                    y: 300 * 0.66,
                    w: 1000,
                    h: 300 * 0.34,
                    marg: 0,
                },
                events: {
                    click: () => {},
                    mouseover: () => {},
                    mouseout: () => {},
                    drag: {
                        start: () => {},
                        tick: () => {},
                        end: () => {},
                    },
                },
                background: {
                    fill: color_theme.brighter.background,
                    stroke: 'none',
                    strokeWidth: 0,
                },
            },
            cancel: {
                enabled: true,
                g: undefined,
                box: {
                    x: 0,
                    y: 0,
                    w: 1000,
                    h: 300 * 0.2,
                    marg: 0,
                },
                events: {
                    click: () => {},
                    mouseover: () => {},
                    mouseout: () => {},
                    drag: {
                        start: () => {},
                        tick: () => {},
                        end: () => {},
                    },
                },
                background: {
                    fill: color_theme.brighter.background,
                    stroke: color_theme.brighter.stroke,
                    strokeWidth: 0,
                },
            },
            modification: {
                enabled: true,
                g: undefined,
                box: {
                    x: 0,
                    y: 300 * 0.24,
                    w: 1000,
                    h: 300 * 0.36,
                    marg: 0,
                },
                events: {
                    click: () => {},
                    mouseover: () => {},
                    mouseout: () => {},
                    drag: {
                        start: () => {},
                        tick: () => {},
                        end: () => {},
                    },
                },
                background: {
                    fill: color_theme.brighter.background,
                    stroke: 'none',
                    strokeWidth: 0,
                },
            },
            colorPalette: color_theme.blocks,
        },
        filters: {
            enabled: false,
            g: undefined,
            box: {
                x: 0,
                y: 300 * 0.15,
                w: 1000 * 0.12,
                h: 300 * 0.7,
                marg: 0,
            },
            filters: [],
        },
        timeBars: {
            enabled: true,
            g: undefined,
            box: {
                x: 0,
                y: 0,
                w: 1000,
                h: 300,
                marg: 0,
            },
        },
        time: {
            currentTime: {
                date: new Date(),
                time: 0,
            },
            start_time_sec: {
                date: new Date(),
                time: 0,
            },
            end_time_sec: {
                date: new Date(),
                time: 1000,
            },
        },
        data: {
            raw: {
                blocks: [],
                tel_ids: [],
            },
            filtered: {
            },
            modified: [],
        },
        debug: {
            enabled: false,
        },
        pattern: {
        },
        event: {
        },
        input: {
            selection: [],
        },
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
            let modified = opt_in.d.data.modifications
                ? opt_in.d.data.modifications.userModifications.length > 0
                : false

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
            let modified = opt_in.d.data.modifications
                ? opt_in.d.data.modifications.userModifications.length > 0
                : false

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

        com.pattern.select = {
        }
        com.pattern.select.defs = com.main.g.append('defs')
        // com.pattern.select.patternHover = com.pattern.select.defs.append('pattern')
        //   .attr('id', 'patternHover')
        //   .attr('x', 0)
        //   .attr('y', 0)
        //   .attr('width', 5)
        //   .attr('height', 5)
        //   .attr('fill', '#ffffff')
        //   .attr('patternUnits', 'userSpaceOnUse')
        // com.pattern.select.patternHover.append('line')
        //   .attr('x1', 0)
        //   .attr('y1', 0)
        //   .attr('x2', 5)
        //   .attr('y2', 5)
        //   .attr('stroke', '#000000')
        //   .attr('stroke-width', 0.8)
        //   .attr('stroke-opacity', 0.4)
        // com.pattern.select.patternHover.append('line')
        //   .attr('x1', 5)
        //   .attr('y1', 0)
        //   .attr('x2', 0)
        //   .attr('y2', 5)
        //   .attr('stroke', '#000000')
        //   .attr('stroke-width', 0.8)
        //   .attr('stroke-opacity', 0.4)

        com.pattern.select.patternSelect = com.pattern.select.defs
            .append('pattern')
            .attr('id', 'patternSelect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 3)
            .attr('height', 3)
            .attr('fill', '#ffffff')
            .attr('patternUnits', 'userSpaceOnUse')
        com.pattern.select.patternSelect
            .append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 3)
            .attr('y2', 3)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.4)
            .attr('stroke-opacity', 0.6)
        com.pattern.select.patternSelect
            .append('line')
            .attr('x1', 3)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 3)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.4)
            .attr('stroke-opacity', 0.6)
    }

    function init() {
        setDefaultStyle()
        this.initBackground()
        initAxis()
        initBlocks()
        initFilters()
        initTimeBars()
    }
    this.init = init
    function initBackground() {
        com.main.g
            .append('rect')
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
    this.initBackground = initBackground
    function initAxis() {
        com.axis.scale = d3
            .scaleTime()
            .range(com.axis.range)
            .domain(com.axis.domain)
        com.axis.main = d3
            .axisBottom(com.axis.scale)
            .tickFormat(d3.timeFormat('%H:%M'))

        if (!com.axis.enabled) {
            return
        }
        com.axis.g = com.main.g
            .append('g')
            .attr(
                'transform',
                'translate(' + com.axis.box.x + ',' + com.axis.box.y + ')'
            )
        com.axis.g.attr('class', 'axis').call(com.axis.main)

        com.axis.g.style('opacity', 1)
    }
    function initBlocks() {
        if (!com.blocks.enabled) {
            return
        }

        com.blocks.clipping = {
        }
        com.blocks.clipping.g = com.main.g.append('g')
        com.blocks.clipping.g
            .append('defs')
            .append('svg:clipPath')
            .attr('id', 'clip')
            .append('svg:rect')
            .attr('id', 'clip-rect')
            .attr('x', '0')
            .attr('y', '0')
            .attr('width', com.main.box.w)
            .attr('height', com.main.box.h)
        com.blocks.clipping.clipBody = com.blocks.clipping.g
            .append('g')
            .attr('clip-path', 'url(#clip)')
        if (com.blocks.run.enabled) {
            com.blocks.run.g = com.blocks.clipping.clipBody.append('g')
            com.blocks.run.g
                .attr(
                    'transform',
                    'translate(' + com.blocks.run.box.x + ',' + com.blocks.run.box.y + ')'
                )
                .style('opacity', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .style('opacity', 1)
        }
        if (com.blocks.cancel.enabled) {
            com.blocks.cancel.g = com.blocks.clipping.clipBody.append('g')
            com.blocks.cancel.g
                .attr(
                    'transform',
                    'translate('
            + com.blocks.cancel.box.x
            + ','
            + com.blocks.cancel.box.y
            + ')'
                )
                .style('opacity', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .style('opacity', 1)
        }
        if (com.blocks.modification.enabled) {
            com.blocks.modification.g = com.blocks.clipping.clipBody.append('g')
            com.blocks.modification.g
                .attr(
                    'transform',
                    'translate('
            + com.blocks.modification.box.x
            + ','
            + com.blocks.modification.box.y
            + ')'
                )
                .style('opacity', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .style('opacity', 1)
        }
    }
    function initFilters() {
        if (!com.filters.enabled) {
            return
        }
        function changeMode(newMode) {
            if (newMode === 'states') {
                com.filters.mode = 'states'
                createStatesFilters()
            }
            else if (newMode === 'tels') {
                com.filters.mode = 'tels'
                createTelsFilters()
            }
            else if (newMode === 'targets') {
                com.filters.mode = 'targets'
                create_targetsFilsters()
            }
        }

        function recCol(state) {
            if (state === 'Wait') {
                return com.blocks.colorPalette.wait
            }
            else if (state === 'Done') {
                return com.blocks.colorPalette.done
            }
            else if (state === 'Run') {
                return com.blocks.colorPalette.run
            }
            else if (state === 'Cancel.canrun') {
                return com.blocks.colorPalette.cancelSys
            }
            else if (state === 'Cancel') {
                return com.blocks.colorPalette.cancelOp
            }
            else if (state === 'Fail') {
                return com.blocks.colorPalette.fail
            }
            else {
                return com.blocks.colorPalette.shutdown
            }
        }

        function createTop() {
            com.filters.top = {
                g: com.filters.g.append('g'),
                box: deep_copy(com.filters.box),
                childs: {
                },
            }
            com.filters.top.box.y = com.filters.top.box.y
            com.filters.top.box.h *= 0.15

            // com.filters.top.g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', com.filters.top.box.y)
            //   .attr('width', com.filters.top.box.w)
            //   .attr('height', com.filters.top.box.h)
            //   .attr('fill', com.main.color_theme.dark.background)
            //   .attr('stroke', com.main.color_theme.dark.stroke)
            //   .attr('stroke-width', 0.2)

            com.filters.top.g
                .append('rect')
                .attr('x', 0)
                .attr('y', com.filters.top.box.y)
                .attr('width', com.filters.top.box.w * 0.32)
                .attr('height', com.filters.top.box.h * 0.9)
                .attr('fill', com.main.color_theme.darker.background)
                .attr('stroke', com.main.color_theme.darker.stroke)
                .attr('stroke-width', 0.2)
            com.filters.top.g
                .append('rect')
                .attr('x', com.filters.top.box.w * 0.34)
                .attr('y', com.filters.top.box.y)
                .attr('width', com.filters.top.box.w * 0.32)
                .attr('height', com.filters.top.box.h * 0.9)
                .attr('fill', com.main.color_theme.darker.background)
                .attr('stroke', com.main.color_theme.darker.stroke)
                .attr('stroke-width', 0.2)
            com.filters.top.g
                .append('rect')
                .attr('x', com.filters.top.box.w * 0.68)
                .attr('y', com.filters.top.box.y)
                .attr('width', com.filters.top.box.w * 0.32)
                .attr('height', com.filters.top.box.h * 0.9)
                .attr('fill', com.main.color_theme.darker.background)
                .attr('stroke', com.main.color_theme.darker.stroke)
                .attr('stroke-width', 0.2)
        }
        function createMiddle() {
            com.filters.middle = {
                g: com.filters.g.append('g'),
                box: deep_copy(com.filters.box),
                states: {
                },
                tels: {
                },
                targets: {
                },
            }
            com.filters.middle.box.x = 0
            com.filters.middle.box.y
        = com.filters.middle.box.y + com.filters.middle.box.h * 0.15
            com.filters.middle.box.h *= 0.67

            // com.filters.middle.g.append('rect')
            //   .attr('x', 0)
            //   .attr('y', 0)
            //   .attr('width', com.filters.middle.box.w)
            //   .attr('height', com.filters.middle.box.h)
            //   .attr('fill', com.main.color_theme.dark.background)
            //   .attr('stroke', com.main.color_theme.dark.stroke)
            //   .attr('stroke-width', 0.2)
        }
        function createBottom() {
            com.filters.bottom = {
                g: com.filters.g.append('g'),
                box: deep_copy(com.filters.box),
                childs: {
                },
            }
            com.filters.bottom.box.y
        = com.filters.bottom.box.y + com.filters.bottom.box.h * 0.85
            com.filters.bottom.box.h *= 0.15

            com.filters.bottom.g
                .append('rect')
                .attr('x', 0)
                .attr('y', com.filters.bottom.box.y)
                .attr('width', com.filters.bottom.box.w * 0.2)
                .attr('height', com.filters.bottom.box.h)
                .attr('fill', com.main.color_theme.dark.background)
                .attr('stroke', com.main.color_theme.dark.stroke)
                .attr('stroke-width', 0.2)
        }
        function createGeneral() {
            com.filters.general = {
                g: com.filters.g.append('g'),
                box: deep_copy(com.filters.box),
                states: {
                },
                tels: {
                },
                targets: {
                },
            }
            com.filters.general.box.x = 0
            com.filters.general.box.y
        = com.filters.general.box.y + com.filters.general.box.h * 0.15
            com.filters.general.box.h *= 0.67

            // com.filters.general.g.append('rect')
            //   .attr('x', com.filters.general.box.w * 0.56)
            //   .attr('y', com.filters.general.box.w * 0.36)
            //   .attr('width', com.filters.general.box.w * 0.45)
            //   .attr('height', com.filters.general.box.w * 0.47)
            //   .attr('fill', com.main.color_theme.medium.background)
            //   .attr('stroke', com.main.color_theme.medium.stroke)
            //   .attr('stroke-width', 0.2)
            //   .attr('stroke-dasharray', [com.filters.general.box.w * 0.45, com.filters.general.box.w * 0.47, com.filters.general.box.w * 0.92])
            com.filters.general.g
                .append('rect')
                .attr('x', com.filters.general.box.w * 0.65)
                .attr('y', com.filters.general.box.w * 0.45)
                .attr('width', com.filters.general.box.w * 0.3)
                .attr('height', com.filters.general.box.w * 0.3)
                .attr('fill', com.main.color_theme.medium.background)
                .attr('stroke', com.main.color_theme.medium.stroke)
                .attr('stroke-width', 0.2)
            com.filters.general.g
                .append('rect')
                .attr('x', com.filters.general.box.w * 0.65)
                .attr('y', com.filters.general.box.w * 0.45)
                .attr('width', com.filters.general.box.w * 0.3)
                .attr('height', com.filters.general.box.w * 0.3)
                .attr('fill', 'transparent')
                .attr('stroke', com.main.color_theme.medium.stroke)
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', []) // [0, com.filters.middle.box.w * 0.15, com.filters.middle.box.w * 0.4, com.filters.middle.box.w * 0.65])
            com.filters.general.g
                .append('text')
                .text('20/20')
                .attr('x', com.filters.general.box.w * 0.8)
                .attr('y', com.filters.general.box.w * 0.6)
                .attr('dy', 7)
                .attr('stroke', com.main.color_theme.darker.stroke)
                .attr('stroke-width', 0.0)
                .attr('fill', com.main.color_theme.darker.stroke)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('font-size', '7px')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
            com.filters.general.g
                .append('text')
                .text('100%')
                .attr('x', com.filters.middle.box.w * 0.8)
                .attr('y', com.filters.middle.box.w * 0.6)
                .attr('dy', -3)
                .attr('stroke', com.main.color_theme.darker.stroke)
                .attr('stroke-width', 0.0)
                .attr('fill', com.main.color_theme.darker.stroke)
                .style('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .style('font-size', '8px')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
        }

        function createStatesFilters() {
            function create_button(position, type, filter) {
                let new_button = buttonPanel.add_button(position)
                new_button.attr('status', 'disabled')

                let clickFunction = function(rect, filter) {
                    if (new_button.attr('status') === 'enabled') {
                        new_button.attr('status', 'disabled')
                        rect
                            .attr('stroke', function(d, i) {
                                return '#000000'
                            })
                            .attr('stroke-width', 1.5)
                        new_button
                            .append('line')
                            .attr('class', 'checkboxBar')
                            .attr('x1', 0)
                            .attr('y1', 0)
                            .attr('x2', Number(new_button.attr('width')))
                            .attr('y2', Number(new_button.attr('height')))
                            .attr('stroke', '#000000')
                            .style('stroke-opacity', 0.9)
                            .attr('stroke-width', 2)
                            .style('pointer-events', 'none')
                        new_button
                            .append('line')
                            .attr('class', 'checkboxBar')
                            .attr('x1', 0)
                            .attr('y1', Number(new_button.attr('height')))
                            .attr('x2', Number(new_button.attr('width')))
                            .attr('y2', 0)
                            .attr('stroke', '#000000')
                            .style('stroke-opacity', 0.9)
                            .attr('stroke-width', 2)
                            .style('pointer-events', 'none')
                        // if (filter !== undefined) {
                        //   com.filters.filters.push(filter)
                        //   updateBlocks()
                        // }
                    }
                    else {
                        new_button.attr('status', 'enabled')
                        new_button.selectAll('line.checkboxBar').remove()
                        rect
                            .attr('stroke', function(d, i) {
                                return '#000000'
                            })
                            .attr('stroke-width', 0.2)
                            .style('stroke-opacity', 1)
                        // if (filter !== undefined) {
                        //   let index = com.filters.filters.indexOf(filter)
                        //   com.filters.filters.splice(index, 1)
                        //   updateBlocks()
                        // }
                    }
                }

                let newRect = new_button
                    .append('rect')
                    .attr(
                        'x',
                        (Number(new_button.attr('width'))
              - Number(new_button.attr('width')) * 3 / 3)
              / 2
                    )
                    .attr(
                        'y',
                        (Number(new_button.attr('height'))
              - Number(new_button.attr('height')) * 3 / 3)
              / 2
                    )
                    .attr('width', function(d, i) {
                        return Number(new_button.attr('width')) * 3 / 3
                    })
                    .attr('height', function(d, i) {
                        return Number(new_button.attr('height')) * 3 / 3
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
                        clickFunction(d3.select(this), filter)
                    })
                    .on('mouseover', function() {
                        let ginfo = com.filters.g
                            .append('g')
                            .attr('class', 'info')
                            .attr('transform', new_button.attr('transform'))
                        ginfo
                            .append('rect')
                            .attr('x', -Number(new_button.attr('width')) * 0.5)
                            .attr('y', -20)
                            .attr('width', Number(new_button.attr('width')) * 2)
                            .attr('height', 18)
                            .attr('rx', 3)
                            .attr('ry', 3)
                            .attr('fill', '#eeeeee')
                            .style('fill-opacity', 0.82)
                        ginfo
                            .append('text')
                            .text(type)
                            .attr('x', Number(new_button.attr('width')) * 0.5)
                            .attr('y', -5)
                            .style('fill-opacity', 0.82)
                            .style('font-weight', 'normal')
                            .attr('text-anchor', 'middle')
                            .style('font-size', 16)
                            .style('pointer-events', 'none')
                            .style('user-select', 'none')

                        new_button.attr('status-over', new_button.attr('status'))
                        if (new_button.attr('status') === 'enabled') {
                            if (filter !== undefined) {
                                com.filters.filters.push(filter)
                                updateBlocks()
                            }
                        }
                        else if (new_button.attr('status') === 'disabled') {
                            if (filter !== undefined) {
                                let index = com.filters.filters.indexOf(filter)
                                com.filters.filters.splice(index, 1)
                                updateBlocks()
                            }
                        }
                    })
                    .on('mouseout', function() {
                        com.filters.g.select('g.info').remove()
                        if (new_button.attr('status') !== new_button.attr('status-over')) {

                        }
                        else if (new_button.attr('status') === 'disabled') {
                            if (filter !== undefined) {
                                com.filters.filters.push(filter)
                                updateBlocks()
                            }
                        }
                        else if (new_button.attr('status') === 'enabled') {
                            if (filter !== undefined) {
                                let index = com.filters.filters.indexOf(filter)
                                com.filters.filters.splice(index, 1)
                                updateBlocks()
                            }
                        }
                    })

                clickFunction(newRect, type)

                return new_button
            }
            let margin = {
                inner: 0.1,
                extern: 0.1,
            }
            let buttonPanel = new ButtonPanel()
            buttonPanel.init({
                g: com.filters.middle.g,
                box: com.filters.middle.box,
                margin: margin,
                rows: 7,
                cols: 7,
                background: 'transparent',
                stroke: 'transparent',
            })

            com.filters.middle.g
                .append('text')
                .text('States filters')
                .attr('x', com.filters.middle.box.w * 0.5)
                .attr('y', com.filters.middle.box.h * 0.05)
                .attr('dy', 4)
                .attr('stroke', com.main.color_theme.darker.stroke)
                .attr('stroke-width', 0.0)
                .attr('fill', com.main.color_theme.darker.stroke)
                .style('font-weight', 'normal')
                .attr('text-anchor', 'middle')
                .style('font-size', '8px')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
            // for (let i = 0; i < 6; i++) {
            //   let new_button = buttonPanel.add_button({row: 4, col: i})
            //   new_button.append('text')
            //     .text('0')
            //     .attr('x', Number(new_button.attr('width')) * 0.5)
            //     .attr('y', Number(new_button.attr('height')) * 0.5)
            //     .attr('dy', 2)
            //     .style('font-weight', 'normal')
            //     .attr('text-anchor', 'middle')
            //     .style('font-size', '8px')
            // }
            // for (let i = 0; i < 5; i++) {
            //   com.filters.middle.g.append('text')
            //     .text('+')
            //     .attr('x', com.filters.middle.box.w * (0.14 * (i + 1) + 0.01))
            //     .attr('y', com.filters.middle.box.h * 0.92)
            //     .attr('dy', 0)
            //     .attr('stroke', com.main.color_theme.darker.stroke)
            //     .attr('stroke-width', 0.0)
            //     .attr('fill', com.main.color_theme.darker.stroke)
            //     .style('font-weight', 'normal')
            //     .attr('text-anchor', 'middle')
            //     .style('font-size', '8px')
            //     .style('pointer-events', 'none')
            //     .style('user-select', 'none')
            // }

            com.filters.middle.button = {
                Fail: create_button({
                    row: 1,
                    col: 3,
                }, 'Fail', [
                    {
                        keys: [ 'exe_state', 'state' ],
                        value: 'fail',
                    },
                ]),
                Done: create_button({
                    row: 2,
                    col: 3,
                }, 'Done', [
                    {
                        keys: [ 'exe_state', 'state' ],
                        value: 'done',
                    },
                ]),
                Run: create_button({
                    row: 3,
                    col: 3,
                }, 'Run', [
                    {
                        keys: [ 'exe_state', 'state' ],
                        value: 'run',
                    },
                ]),
                'Cancel.canrun': create_button({
                    row: 4,
                    col: 3,
                }, 'Cancel.canrun', [
                    {
                        keys: [ 'exe_state', 'state' ],
                        value: 'cancel',
                    },
                    {
                        keys: [ 'exe_state', 'can_run' ],
                        value: true,
                    },
                ]),
                Cancel: create_button({
                    row: 5,
                    col: 3,
                }, 'Cancel', [
                    {
                        keys: [ 'exe_state', 'state' ],
                        value: 'cancel',
                    },
                    {
                        keys: [ 'exe_state', 'can_run' ],
                        value: false,
                    },
                ]),
                Wait: create_button({
                    row: 6,
                    col: 3,
                }, 'Wait', [
                    {
                        keys: [ 'exe_state', 'state' ],
                        value: 'wait',
                    },
                ]),
            }

            updateStatesFilters()
        }
        function updateStatesFilters() {
            for (let key in com.filters.middle.button) {
                let button = com.filters.middle.button[key]
                let box = {
                    x: 0,
                    y: 0,
                    w: Math.random() * 3 * Number(button.attr('width')),
                    h: Number(button.attr('height')),
                }
                button
                    .append('rect')
                    .attr('x', -box.w)
                    .attr('y', box.y + box.h * 0.1)
                    .attr('width', box.w)
                    .attr('height', box.h * 0.8)
                    .attr('fill', recCol(key).background)
                    .attr('stroke', com.main.color_theme.medium.stroke)
                    .attr('stroke-width', 0.2)
            }
        }
        function createTelsFilters() {}
        function create_targetsFilsters() {}

        com.filters.g = com.main.g
            .append('g')
            .attr(
                'transform',
                'translate(' + com.filters.box.x + ',' + com.filters.box.y + ')'
            )

        createTop()
        createMiddle()
        createBottom()
        createGeneral()

        changeMode('states')
    }
    function initTimeBars() {
        if (!com.timeBars.enabled) {
            return
        }
        com.timeBars.g = com.main.g
            .append('g')
            .attr(
                'transform',
                'translate(' + com.timeBars.box.x + ',' + com.timeBars.box.y + ')'
            )
        com.timeBars.g
            .style('opacity', 0)
            .transition()
            .duration(1000)
            .delay(1000)
            .style('opacity', 1)
    }

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
        let filtered = {
            done: [],
            run: [],
            cancel: [],
            wait: [],
            fail: [],
        }
        for (var z = 0; z < com.data.raw.blocks.done.length; z++) {
            let data_now = com.data.raw.blocks.done[z]
            if (com.filters.filters.length === 0) {
                if (data_now.exe_state.state === 'done') {
                    filtered.done.push(data_now)
                }
                if (data_now.exe_state.state === 'fail') {
                    filtered.fail.push(data_now)
                }
                if (data_now.exe_state.state === 'cancel') {
                    filtered.cancel.push(data_now)
                }
            }
            else {
                let insert = true
                for (var i = 0; i < com.filters.filters.length; i++) {
                    let filterNow = com.filters.filters[i]
                    let allPropValidate = true
                    for (var j = 0; j < filterNow.length; j++) {
                        if (
                            !checkPropertiesValue(
                                data_now,
                                filterNow[j].keys,
                                filterNow[j].value
                            )
                        ) {
                            allPropValidate = false
                        }
                    }
                    if (allPropValidate) {
                        insert = false
                    }
                }
                if (insert) {
                    if (data_now.exe_state.state === 'done') {
                        filtered.done.push(data_now)
                    }
                    if (data_now.exe_state.state === 'fail') {
                        filtered.fail.push(data_now)
                    }
                    if (data_now.exe_state.state === 'cancel') {
                        filtered.cancel.push(data_now)
                    }
                }
            }
        }
        filtered.wait = com.data.raw.blocks.wait.filter(function(d) {
            if (com.filters.filters.length === 0) {
                return true
            }
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
        filtered.run = com.data.raw.blocks.run.filter(function(d) {
            if (com.filters.filters.length === 0) {
                return true
            }
            let ok = true
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
        com.axis.domain = [ com.time.start_time_sec.date, com.time.end_time_sec.date ]
        com.axis.range = [ 0, com.axis.box.w ]

        com.axis.scale.domain(com.axis.domain).range(com.axis.range)

        if (!com.axis.enabled) {
            return
        }
        let minTxtSize = com.main.box.w * 0.02
        // console.log(com.axis.domain, com.axis.range);
        com.axis.main.scale(com.axis.scale)
        com.axis.main.tickSize(4)
        com.axis.g.call(com.axis.main)
        com.axis.g
            .select('path')
            .attr('stroke-width', 1.5)
            .attr('stroke', com.axis.attr.path.stroke)
        com.axis.g
            .selectAll('g.tick')
            .selectAll('line')
            .attr('stroke-width', 1.5)
            .attr('stroke', com.axis.attr.path.stroke)
        com.axis.g
            .selectAll('g.tick')
            .selectAll('text')
            .attr('stroke', com.axis.attr.text.stroke)
            .attr('stroke-width', 0.5)
            .attr('fill', com.axis.attr.text.fill)
            .style('font-size', minTxtSize + 'px')
    }
    function updateBlocks() {
        if (com.data.filtered === undefined) {
            return
        }

        if (com.blocks.run.enabled) {
            let dataBottom = []
                .concat(com.data.filtered.done)
                .concat(com.data.filtered.fail)
                .concat(com.data.filtered.run)
                .concat(com.data.filtered.wait)
            let bottomRow = calcBlockRow({
                type_now: 'bottom',
                start: com.time.start_time_sec.time,
                end: com.time.end_time_sec.time,
                data: dataBottom,
                box: {
                    x: 0,
                    y: 0,
                    w: com.blocks.run.box.w,
                    h: com.blocks.run.box.h,
                    marg: com.blocks.run.box.marg,
                },
                yScale: true,
            })
            bottomRow = adjustBlockRow(
                bottomRow,
                {
                    x: 0,
                    y: 0,
                    w: com.blocks.run.box.w,
                    h: com.blocks.run.box.h,
                    marg: com.blocks.run.box.marg,
                },
                'toTop'
            )
            bottomRow = setDefaultStyleForBlocks(bottomRow)
            setBlockRect(bottomRow, com.blocks.run)
        }
        if (com.blocks.cancel.enabled) {
            let dataTop = [].concat(com.data.filtered.cancel)
            let topRow = calcBlockRow({
                type_now: 'top',
                start: com.time.start_time_sec.time,
                end: com.time.end_time_sec.time,
                data: dataTop,
                box: {
                    x: 0,
                    y: 0,
                    w: com.blocks.cancel.box.w,
                    h: com.blocks.cancel.box.h,
                    marg: com.blocks.cancel.box.marg,
                },
                yScale: false,
            })
            topRow = adjustBlockRow(
                topRow,
                {
                    x: 0,
                    y: 0,
                    w: com.blocks.cancel.box.w,
                    h: com.blocks.cancel.box.h,
                    marg: com.blocks.cancel.box.marg,
                },
                'toTop'
            )
            topRow = setDefaultStyleForBlocks(topRow)
            setBlockRect(topRow, com.blocks.cancel)
        }
        if (com.blocks.modification.enabled && com.data.modified.length > 0) {
            let middleRow = calcBlockRow({
                type_now: 'top',
                start: com.time.start_time_sec.time,
                end: com.time.end_time_sec.time,
                data: com.data.modified,
                box: {
                    x: 0,
                    y: 0,
                    w: com.blocks.run.box.w,
                    h: com.blocks.run.box.h,
                    marg: com.blocks.run.box.marg,
                },
                yScale: true,
            })
            middleRow = adjustBlockRow(
                middleRow,
                {
                    x: 0,
                    y: 0,
                    w: com.blocks.modification.box.w,
                    h: com.blocks.modification.box.h,
                    marg: com.blocks.modification.box.marg,
                },
                'toBottom'
            )
            middleRow = setDefaultStyleForBlocks(middleRow)
            setBlockRect(middleRow, com.blocks.modification)
        }
    }
    this.updateBlocks = updateBlocks
    function update_data(data_in) {
        com.main.g
            .select('text.name')
            .transition()
            .duration(400)
            .style('opacity', 0)
        com.time.currentTime = data_in.time.currentTime
        com.time.start_time_sec = data_in.time.start_time_sec
        com.time.end_time_sec = data_in.time.end_time_sec
        com.data.raw = data_in.data.raw
        com.data.modified = data_in.data.modified

        com.data.filtered = filterData()

        updateAxis()
        if (com.blocks.enabled) {
            updateBlocks()
        }
        if (com.timeBars.enabled) {
            setTimeRect()
        }
    }
    this.update_data = update_data
    function update(data_in) {
        com.time.currentTime = data_in.time.currentTime
        com.time.start_time_sec = data_in.time.start_time_sec
        com.time.end_time_sec = data_in.time.end_time_sec

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

    function groupByTime(blocks) {
        let groups = []
        for (var i = 0; i < blocks.length; i++) {
            let newGroup = [ blocks[i] ]
            for (var j = 0; j < blocks.length; j++) {
                if (
                    i !== j
          && is_same_time_begin_after(
              blocks[i].x,
              blocks[i].x + blocks[i].w,
              blocks[j].x,
              blocks[j].x + blocks[j].w
          )
                ) {
                    newGroup.push(blocks[j])
                }
            }
            groups.push(newGroup)
        }
        return groups
    }

    function is_same_time_begin_after(s1, e1, s2, e2) {
        if (s1 > s2 && s1 < e2) {
            return true
        }
        return false
    }
    function is_same_time(s1, e1, s2, e2) {
        if (s1 > s2 && s1 < e2) {
            return true
        }
        if (e1 > s2 && e1 < e2) {
            return true
        }
        if (s1 < s2 && e1 > e2) {
            return true
        }
        return false
    }

    function isGeneratingTelsConflict(group) {
        function useSameTels(tel1, tel2) {
            for (var i = 0; i < tel1.length; i++) {
                for (var j = 0; j < tel2.length; j++) {
                    if (tel1[i] === tel2[j]) {
                        return true
                    }
                }
            }
            return false
        }
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < length; j++) {
                if (
                    i !== j
          && useSameTels(group[i].data.tel_ids, group[j].data.tel_ids)
                ) {
                    return true
                }
            }
        }
        return false
    }

    function adjustBlockRow(blocks, box, direction) {
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
        // ------------------------------------------------------------------
        let sortedIds = []
        $.each(blocks, function(index0, data_now0) {
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
                    let diffTime = a.data.data.start_time_sec - b.data.data.start_time_sec
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
                let hasOverlap
          = x1 < x0 + w0 && x1 + w1 > x0 && y1 < y0 + h0 && y1 + h1 > y0
                if (hasOverlap) {
                    data_now1.y = y0 + h0 + margY / 2
                    // data_now1.y += h0 + margY/2;
                }
                // if(hasOverlap) console.log([index0,data_now0.data.metadata.block_name],[index1,data_now1.data.metadata.block_name],(h0 + margY/2));
            })
        })
        if (direction === 'toTop') {
            $.each(blocks, function(index0, data_now0) {
                data_now0.y = 2 * box.y + box.h - data_now0.y - data_now0.h
            })
        }
        return blocks
    }
    this.adjustBlockRow = adjustBlockRow
    function calcBlockRow(opt_in) {
        let data_in = opt_in.data
        let box = opt_in.box
        let xScale = box.w / (opt_in.end - opt_in.start)
        let yScale = box.h / (com.data.raw.tel_ids.length + 2)

        let blocks = []
        let n_blocksType = {
        }
        // console.log(data_in);
        // compute width/height/x/y of blocks, only y need to be modified (so far)

        $.each(data_in, function(index, data_now) {
            // console.log(data_now);

            let id = data_now.obs_block_id
            let state = data_now.exe_state.state
            let n_tels = data_now.tel_ids.length
            let start = (data_now.start_time_sec - opt_in.start) * xScale
            let end = (data_now.end_time_sec - opt_in.start) * xScale
            let overlap = (data_now.end_time_sec - data_now.start_time_sec) * xScale * 0.2 // allow small overlap in x between blocks
            let x0 = box.x + start
            let w0 = end - start
            let h0 = opt_in.yScale ? n_tels * yScale : box.h * 0.3
            let y0 = box.y

            if (!is_def(n_blocksType[state])) {
                n_blocksType[state] = 0
            }
            else {
                n_blocksType[state] += 1
            }

            blocks.push({
                id: id,
                x: x0,
                y: y0,
                w: w0,
                h: h0,
                newH: h0,
                o: overlap,
                n_block: n_blocksType[state],
                // nTel: n_tels,
                data: data_now,
            })
        })

        let groups = groupByTime(blocks)
        $.each(groups, function(index, group) {
            let tot = 0
            $.each(group, function(index, data_now) {
                tot += data_now.h
            })
            // console.log(isGeneratingTelsConflict(group), tot > box.h);
            if (isGeneratingTelsConflict(group)) {
                let coef = box.h * 1 / tot
                let x = group[0].x
                let x2 = x + group[0].w
                $.each(group, function(index, data_now) {
                    data_now.newH
            = data_now.h * coef < data_now.newH ? data_now.h * coef : data_now.newH
                    if (data_now.x < x) {
                        x = data_now.x
                    }
                    if (data_now.x + data_now.w > x2) {
                        x2 = data_now.x + data_now.w
                    }
                })
                com.background.child.runOverflow.back
                    .append('rect')
                    .attr('class', 'conflictRect')
                    .attr('x', x)
                    .attr(
                        'y',
                        com.blocks.run.box.y
              - com.blocks.run.box.h * 0.25
              - com.blocks.run.box.marg
                    )
                    .attr('width', x2 - x)
                    .attr('height', com.blocks.run.box.h * 0.12)
                    .attr('fill', com.background.child.runOverflow.fill)
                    .attr('fill-opacity', com.background.child.runOverflow.fill_opacity)
            }
            else if (tot > box.h) {
                let coef = box.h / tot
                $.each(group, function(index, data_now) {
                    data_now.newH
            = data_now.h * coef > data_now.newH ? data_now.h * coef : data_now.newH
                })
            }
        })
        $.each(groups, function(index, group) {
            $.each(group, function(index, data_now) {
                data_now.h = data_now.newH ? data_now.newH : data_now.h
            })
        })
        return blocks
    }
    this.calcBlockRow = calcBlockRow
    function setDefaultStyleForBlocks(blocks) {
        let timescale = d3
            .scaleLinear()
            .range(com.axis.range)
            .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])
        for (let index in blocks) {
            let b = blocks[index]
            let cols = com.style.blockCol({
                d: b,
            })

            b.w = timescale(b.data.end_time_sec) - timescale(b.data.start_time_sec)
            b.stroke = cols.stroke
            b.strokeWidth = 0.5
            b.fill = cols.background
            b.fill_opacity = com.style.blockOpac({
                d: b,
            })
            b.strokeOpacity = com.style.blockOpac({
                d: b,
            })
            b.strokeDasharray = []

            b.text = cols.text
            b.patternFill = ''
            b.patternOpacity = 0
            if (b.data.sched_block_id === com.input.focus.sched_blocks) {
                if (
                    !(
                        com.input.over.sched_blocks !== undefined
            && com.input.over.sched_blocks !== com.input.focus.sched_blocks
                    )
                ) {
                    // b.stroke = color_theme.blocks.critical.background
                    // b.patternFill = 'url(#patternHover)'
                    b.patternFill = 'url(#patternSelect)'
                    b.patternOpacity = 1
                }
                b.strokeWidth = 1
                b.strokeOpacity = 1
                // b.strokeDasharray = [2, 2]
            }
            if (b.data.sched_block_id === com.input.over.sched_blocks) {
                b.strokeWidth = 1
                b.strokeOpacity = 1
                // b.strokeDasharray = [2, 2]
                b.patternFill = 'url(#patternSelect)'
                b.patternOpacity = 1
            }
            if (b.data.obs_block_id === com.input.focus.block) {
                if (
                    com.input.over.block !== undefined
          && com.input.over.block !== com.input.focus.block
                ) {
                    b.strokeDasharray = [ 8, 4 ]
                }
                b.strokeWidth = 6
                b.strokeOpacity = 1
            }
            if (b.data.obs_block_id === com.input.over.block) {
                b.strokeWidth = 6
                b.strokeOpacity = 1
                b.strokeDasharray = []
            }
        }
        return blocks
    }
    function get_block_rows() {
        if (com.blocks.run.enabled) {
            let dataBottom = []
                .concat(com.data.filtered.done)
                .concat(com.data.filtered.fail)
                .concat(com.data.filtered.run)
                .concat(com.data.filtered.wait)
            let bottomRow = calcBlockRow({
                type_now: 'bottom',
                start: com.time.start_time_sec.time,
                end: com.time.end_time_sec.time,
                data: dataBottom,
                box: {
                    x: 0,
                    y: 0,
                    w: com.blocks.run.box.w,
                    h: com.blocks.run.box.h,
                    marg: com.blocks.run.box.marg,
                },
                yScale: true,
            })
            bottomRow = adjustBlockRow(
                bottomRow,
                {
                    x: 0,
                    y: 0,
                    w: com.blocks.run.box.w,
                    h: com.blocks.run.box.h,
                    marg: com.blocks.run.box.marg,
                },
                'toTop'
            )
            bottomRow = setDefaultStyleForBlocks(bottomRow)
            return bottomRow
        }
    }
    this.get_block_rows = get_block_rows

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    // function blocksMouseOver (data) {
    //   let totBlocks = com.blocks.run.g.selectAll('g.' + com.main_tag + 'blocks')
    //   if (com.blocks.cancel.g) totBlocks.merge(com.blocks.cancel.g.selectAll('g.' + com.main_tag + 'blocks'))
    //
    //   totBlocks.each(function (d) {
    //     if (d.data.metadata.n_sched === data.data.metadata.n_sched && d.data.metadata.n_obs !== data.data.metadata.n_obs) {
    //       d3.select(this).select('rect.back').attr('stroke-width', 6)
    //         .style('stroke-opacity', 1)
    //         .attr('stroke-dasharray', [4, 2])
    //     }
    //   })
    // }
    // function blocksMouseOut (data) {
    //   let totBlocks = com.blocks.run.g.selectAll('g.' + com.main_tag + 'blocks')
    //   if (com.blocks.cancel.g) totBlocks.merge(com.blocks.cancel.g.selectAll('g.' + com.main_tag + 'blocks'))
    //
    //   totBlocks.each(function (d) {
    //     if (d.data.metadata.n_sched === data.data.metadata.n_sched && d.data.metadata.n_obs !== data.data.metadata.n_obs) {
    //       d3.select(this).select('rect.back').attr('stroke-width', 1)
    //         .style('stroke-opacity', 0.4)
    //         .attr('stroke-dasharray', [])
    //     }
    //   })
    // }

    function over_sched_blocks(id) {
        com.input.over.sched_blocks = id
        updateBlocks()
    }
    this.over_sched_blocks = over_sched_blocks
    function out_sched_blocks(id) {
        com.input.over.sched_blocks = undefined
        updateBlocks()
    }
    this.out_sched_blocks = out_sched_blocks
    function overBlock(id) {
        com.input.over.block = id
        updateBlocks()
    }
    this.overBlock = overBlock
    function outBlock(id) {
        com.input.over.block = undefined
        updateBlocks()
    }
    this.outBlock = outBlock

    function focusOn_sched_blocks(id) {
        com.input.focus.sched_blocks = id
        updateBlocks()
    }
    this.focusOn_sched_blocks = focusOn_sched_blocks
    function unfocusOn_sched_blocks(id) {
        com.input.focus.sched_blocks = undefined
        updateBlocks()
    }
    this.unfocusOn_sched_blocks = unfocusOn_sched_blocks
    function focusOn_block(id) {
        com.input.focus.block = id
        updateBlocks()
    }
    this.focusOn_block = focusOn_block
    function unfocusOn_block(id) {
        com.input.focus.block = undefined
        updateBlocks()
    }
    this.unfocusOn_block = unfocusOn_block

    // function dragBlockStart (d) {}
    // function dragBlockTick (d) {}
    // function dragBlockEnd (d) {}

    function setBlockRect(data, group) {
        let box = group.box
        let g = group.g
        let minTxtSize = box.w * 0.016
        let timescale = d3
            .scaleLinear()
            .range(com.axis.range)
            .domain([ com.time.start_time_sec.time, com.time.end_time_sec.time ])

        let rect = g
            .selectAll('g.' + com.main_tag + 'blocks')
            .data(data, function(d) {
                return d.id
            })
        let rectEnter = rect
            .enter()
            .append('g')
            .attr('class', com.main_tag + 'blocks')
        rectEnter.each(function(d, i) {
            let parent = d3.select(this)
            d3
                .select(this)
                .append('rect')
                .attr('class', 'back')
                .attr('x', function(d, i) {
                    return timescale(d.data.start_time_sec)
                })
                .attr('y', function(d, i) {
                    return d.y - 2
                })
                .attr('width', function(d, i) {
                    return timescale(d.data.end_time_sec) - timescale(d.data.start_time_sec)
                })
                .attr('height', function(d, i) {
                    return d.h
                })
                .attr('stroke', function(d, i) {
                    return d.stroke
                })
                .style('fill', function(d, i) {
                    return d.fill
                })
                .style('fill-opacity', function(d, i) {
                    return d.fill_opacity
                })
                .attr('stroke-width', function(d, i) {
                    return d.strokeWidth
                })
                .style('stroke-opacity', function(d, i) {
                    return d.strokeOpacity
                })
                .style('stroke-dasharray', function(d, i) {
                    return d.strokeDasharray
                })
            // .style("pointer-events", "none")
                .attr('vector-effect', 'non-scaling-stroke')
                .on('click', function(e, d) {
                    let node = d3.select(this)
                    node.attr('clicked', 1)
                    let that = this

                    setTimeout(function() {
                        if (node.attr('clicked') === '2') {
                            return
                        }
                        console.log('click')
                        if (e.ctrlKey) {
                            com.input.selection.push(that)
                        }
                        else {
                            com.input.selection = [ that ]
                        }
                        group.events.click(d.data)
                    }, 250)
                })
                .on('dblclick', function(d) {
                    let node = d3.select(this)
                    node.attr('clicked', 2)
                    console.log('dbclick')
                })
                .on('mouseover', function(d) {
                    // blocksMouseOver(d)
                    // d3.select(this).attr('stroke-width', 4)
                    // d3.select(this).style('stroke-opacity', 1)
                    group.events.mouseover(d.data)
                })
                .on('mouseout', function(d) {
                    // blocksMouseOut(d)
                    // d3.select(this).attr('stroke-width', 1)
                    // d3.select(this).style('stroke-opacity', function (d) {
                    //   return 0.55
                    // })
                    group.events.mouseout(d.data)
                })
                .call(
                    d3
                        .drag()
                        .on('start', function(d) {
                            com.interaction = {
                            }
                            com.interaction.oldG = parent
                            group.events.drag.start(d)
                        })
                        .on('drag', function(d) {
                            group.events.drag.tick(d)
                        })
                        .on('end', function(d) {
                            group.events.drag.end(d)
                        })
                )
            d3
                .select(this)
                .append('rect')
                .attr('class', 'pattern')
                .attr('x', function(d, i) {
                    return timescale(d.data.start_time_sec)
                })
                .attr('y', function(d, i) {
                    return d.y - 2
                })
                .attr('width', function(d, i) {
                    return timescale(d.data.end_time_sec) - timescale(d.data.start_time_sec)
                })
                .attr('height', function(d, i) {
                    return d.h
                })

                .attr('stroke', 'none')
                .style('fill', 'none')
                .style('fill-opacity', 1)
                .style('stroke-opacity', 0)
                .style('pointer-events', 'none')
                .attr('vector-effect', 'non-scaling-stroke')
            d3
                .select(this)
                .append('text')
                .attr('class', 'name')
                .text(function(d, i) {
                    return d.data.metadata.block_name
                })
                .style('font-weight', 'normal')
                .style('opacity', function(d, i) {
                    return d.fill_opacity
                })
                .style('fill', function(d) {
                    return d.text
                })
                .style('stroke-width', 0.3)
                .style('stroke-opacity', 1)
                .attr('vector-effect', 'non-scaling-stroke')
                .style('pointer-events', 'none')
                .style('stroke', function(d) {
                    return d.stroke
                })
                .attr('x', function(d, i) {
                    return timescale(d.data.start_time_sec + d.data.duration * 0.5)
                })
                .attr('y', function(d, i) {
                    return d.y + d.h / 2
                })
                .attr('text-anchor', 'middle')
        })

        rect.merge(rectEnter).each(function(d, i) {
            d3
                .select(this)
                .select('rect.back')
                .transition('in_out')
                .duration(times.anim)
                .attr('stroke', function(d, i) {
                    return d.stroke
                })
                .style('fill', function(d, i) {
                    return d.fill
                })
                .style('fill-opacity', function(d, i) {
                    return d.fill_opacity
                })
                .attr('x', function(d, i) {
                    return timescale(d.data.start_time_sec)
                })
                .attr('y', function(d, i) {
                    return d.y - 2
                })
                .attr('width', function(d, i) {
                    return timescale(d.data.end_time_sec) - timescale(d.data.start_time_sec)
                })
                .attr('height', function(d, i) {
                    return d.h
                })
                .attr('stroke-width', function(d, i) {
                    return d.strokeWidth
                })
                .style('stroke-opacity', function(d, i) {
                    return d.strokeOpacity
                })
                .style('stroke-dasharray', function(d, i) {
                    return d.strokeDasharray
                })
            d3
                .select(this)
                .select('rect.pattern')
                .attr('x', function(d, i) {
                    return timescale(d.data.start_time_sec)
                })
                .attr('y', function(d, i) {
                    return d.y - 2
                })
                .attr('width', function(d, i) {
                    return timescale(d.data.end_time_sec) - timescale(d.data.start_time_sec)
                })
                .attr('height', function(d, i) {
                    return d.h
                })
                .style('fill', function(d, i) {
                    return d.patternFill
                })
                .style('fill-opacity', function(d, i) {
                    return d.patternOpacity
                })
            d3
                .select(this)
                .select('text')
                .style('font-size', function(d) {
                    d.size = Math.max(minTxtSize, Math.min(d.w, d.h)) / 3
                    if (!is_def(d.size)) {
                        console.error(
                            '_blockQueue_ERROR:',
                            com.main_tag,
                            minTxtSize,
                            d.w,
                            d.h
                        )
                    } // should not happen....
                    if (!is_def(d.size)) {
                        d.size = 0
                    }
                    // d.size = d.w/3;
                    return d.size + 'px'
                })
                .attr('dy', function(d) {
                    return d.size / 3 + 'px'
                })
                .transition('in_out')
                .duration(times.anim)
                .style('stroke-opacity', function(d, i) {
                    return d.fill_opacity
                })
                .style('fill-opacity', function(d, i) {
                    return d.fill_opacity
                })
                .attr('x', function(d, i) {
                    return timescale(d.data.start_time_sec + d.data.duration * 0.5)
                })
                .attr('y', function(d, i) {
                    return d.y + d.h / 2
                })
        })
        rect
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .style('opacity', 0)
            .remove()
        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        // let text = g
        //   .selectAll('text.' + com.main_tag + 'blocks')
        //   .data(data, function (d) {
        //     return d.id
        //   })
        // text
        //   .enter()

    // text
    //   .exit()
    //   .transition('in_out')
    //   .duration(times.anim)
    //   .style('opacity', 0)
    //   .remove()
    }
    this.setBlockRect = setBlockRect

    function addExtraBar(date) {
        let data = []
        if (date === null) {
            let rectNow = com.main.g
                .selectAll('rect.' + com.main_tag + 'extra')
                .data(data)
            rectNow.exit().remove()
        }
        else {
            data = [ date ]
            let rectNow = com.main.g
                .selectAll('rect.' + com.main_tag + 'extra')
                .data(data)
                .attr('transform', 'translate(' + com.axis.box.x + ',' + 0 + ')')

            rectNow
                .enter()
                .append('rect')
                .attr('class', com.main_tag + 'extra')
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
                    return com.main.box.y - 1 * com.main.box.marg
                })
                .attr('width', 0)
                .attr('height', function(d, i) {
                    return com.main.box.h + 1 * com.main.box.marg
                })
                .attr('stroke', d3.rgb(com.style.runRecCol).darker(1.0))
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
                    return com.main.box.marg
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
                id: com.main_tag + 'now',
                x: com.axis.scale(com.time.currentTime.date),
                y: com.timeBars.box.y,
                w: com.timeBars.box.marg,
                h: com.timeBars.box.h + com.timeBars.box.marg * 2,
            },
        ]
        // console.log('timeFrac',timeFrac,rectNowData);
        // console.log('rectNowData',(com.blockRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let rectNow = com.timeBars.g
            .selectAll('rect.' + com.main_tag + 'now')
            .data(rectNowData, function(d) {
                return d.id
            })

        rectNow
            .enter()
            .append('rect')
            .attr('class', com.main_tag + 'now')
            .style('opacity', 1)
            .attr('x', function(d, i) {
                return d.x
            })
            .attr('y', function(d, i) {
                return d.y - 1 * com.main.box.marg
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
}
