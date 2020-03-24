/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global col_prime */
/* global cols_reds */
/* global deep_copy */
/* global min_max_obj */
/* global cols_purples */
/* global cols_blues */
/* global cols_greens */
/* global cols_yellows */
/* global cols_purples_blues */
/* global BlockQueue */
/* global get_color_theme */

window.load_script({
    source: 'BlockQueueModif',
    script: '/js/utils/BlockQueue.js',
})

window.BlockQueueModif = function(opt_in) {
    let color_theme = get_color_theme('bright_grey')
    let template = {
        main: {
            tag: 'blockQueueRootTag',
            g: undefined,
            box: { x: 0, y: 0, w: 1000, h: 300, marg: 0 },
            background: {
                fill: color_theme.brighter.background,
                stroke: color_theme.brighter.stroke,
                strokeWidth: 0.5,
            },
        },
        axis: {
            enabled: true,
            g: undefined,
            box: { x: 0, y: 300, w: 1000, h: 0, marg: 0 },
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
                box: { x: 0, y: 300 * 0.66, w: 1000, h: 300 * 0.34, marg: 0 },
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
                box: { x: 0, y: 0, w: 1000, h: 300 * 0.2, marg: 0 },
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
                box: { x: 0, y: 300 * 0.24, w: 1000, h: 300 * 0.36, marg: 0 },
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
            box: { x: 0, y: 300 * 0.15, w: 1000 * 0.12, h: 300 * 0.7, marg: 0 },
            filters: [],
        },
        timeBars: {
            enabled: true,
            g: undefined,
            box: { x: 0, y: 0, w: 1000, h: 300, marg: 0 },
        },
        time: {
            currentTime: { date: new Date(), time: 0 },
            startTime: { date: new Date(), time: 0 },
            endTime: { date: new Date(), time: 1000 },
        },
        data: {
            raw: {
                blocks: [],
                tel_ids: [],
            },
            formated: undefined,
            modified: [],
        },
        debug: {
            enabled: false,
        },
        pattern: {},
        event: {},
        input: {
            selection: [],
        },
    }
    let com = {}
    com = opt_in

    function setDefaultStyle() {
        com.style = {}
        com.style.runRecCol = cols_blues[2]
        com.style.blockCol = function(opt_in) {
            if (opt_in.d.data.endTime < com.time.currentTime.time) {
                return com.blocks.colorPalette.shutdown
            }
            let state = is_def(opt_in.state)
                ? opt_in.state
                : opt_in.d.data.exe_state.state
            let can_run = is_def(opt_in.can_run)
                ? opt_in.can_run
                : opt_in.d.data.exe_state.can_run

            if (state === 'wait') {
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
            if (opt_in.d.data.endTime < com.time.currentTime.time) {
                return com.blocks.colorPalette.shutdown
            }
            let state = is_def(opt_in.state)
                ? opt_in.state
                : opt_in.d.data.exe_state.state
            let can_run = is_def(opt_in.can_run)
                ? opt_in.can_run
                : opt_in.d.data.exe_state.can_run

            if (state === 'wait') {
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
    setDefaultStyle()

    let blockQueue = new BlockQueue(com)
    blockQueue.initBackground = function() {
        com.main.g
            .append('text')
            .attr('class', 'name')
            .text('MODIFICATIONS')
            .style('text-anchor', 'middle')
            .attr('x', com.main.box.w * 0.5)
            .attr('y', com.main.box.h * 0.46 * 0.5)
            .attr('dy', com.main.box.h * 0.06)
            .style('font-weight', 'bold')
            .style('font-size', com.main.box.h * 0.16)
            .style('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
            .style('fill', com.main.color_theme.dark.background)
            .style('opacity', 1)
    }
    return blockQueue
}
