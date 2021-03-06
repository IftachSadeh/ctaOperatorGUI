// ------------------------------------------------------------------
'use strict'
/* global $ */
/* global d3 */
/* global Event */
/* global jQuery */
/* global moment */
/* global textures */

// ------------------------------------------------------------------
// unique identification
// ------------------------------------------------------------------
function get_rnd_once(n_digits) {
    let rnd_min = Math.pow(10, n_digits-1)
    let rnd_max = Math.pow(10, n_digits)
    let rnd_now = Math.random() * (rnd_max - rnd_min) + rnd_min
    rnd_now = (Math.min(Math.floor(rnd_now), rnd_max - 1)).toString()
    return rnd_now
}

window.unique = function(opt_in) {
    if (!is_def(opt_in)) {
        opt_in = {}
    }
    let n_digits = is_def(opt_in['n_digits']) ? opt_in['n_digits'] : 20
    let prefix = is_def(opt_in['prefix']) ? opt_in['prefix'] : '_'
    let postfix = is_def(opt_in['postfix']) ? opt_in['postfix'] : ''

    n_digits = Math.max(n_digits, 1)

    let rnd_now = ''
    let ntry = 0
    let rnd_precision = 10
    while (true) {
        let n_digits_now = Math.floor(Math.min(n_digits, rnd_precision))
        n_digits -= n_digits_now
        ntry += 1
        if (n_digits_now < 1 || ntry > 100) {
            break
        }
        rnd_now += get_rnd_once(n_digits_now)
    }

    return prefix + rnd_now + postfix
    // return prefix + get_time_now_msec().toString() + postfix
}
let unique = window.unique

// ------------------------------------------------------------------
// check if a variable is defined and not nulled
// ------------------------------------------------------------------
window.is_def = function(data_in) {
    if (data_in === undefined) {
        return false
    }
    else if (data_in === null) {
        return false
    }
    else if (data_in === Infinity) {
        return false
    }
    else {
        return true
    }
}
let is_def = window.is_def

// ------------------------------------------------------------------
// common colors
// see: https://material.google.com/style/color.html#color-color-palette
// ------------------------------------------------------------------
window.col_prime = '2F3238'
window.cols_reds = [
    '#E91E63',
    '#FF3333',
    '#F48FB1',
    '#C62828',
    '#AD1457',
    '#FF9E80',
    '#F44336',
    '#F8BBD0',
    '#F06292',
    '#C2185B',
]
let cols_reds = window.cols_reds

window.cols_blues = [
    '#2196F3',
    '#3949AB',
    '#00BCD4',
    '#90CAF9',
    '#607D8B',
    '#80DEEA',
]
let cols_blues = window.cols_blues

window.cols_greens = [ '#8BC34A', '#00E676', '#33691E', '#C0CA33', '#009688' ]
let cols_greens = window.cols_greens

window.cols_yellows = [
    '#FFD600',
    '#FF7043',
    '#A1887F',
    '#FFEB3B',
    '#FF9800',
    '#795548',
    '#FFC107',
]
let cols_yellows = window.cols_yellows

window.cols_purples = [ '#AB47BC', '#9575CD', '#673AB7', '#7B1FA2', '#CD96CD' ]
let cols_purples = window.cols_purples

window.cols_mix = [
    cols_reds[0],
    cols_blues[0],
    cols_greens[0],
    cols_yellows[0],
    cols_purples[0],
    cols_reds[1],
    cols_blues[1],
    cols_greens[1],
    cols_yellows[1],
    cols_purples[1],
    cols_reds[2],
    cols_blues[2],
    cols_greens[2],
    cols_yellows[2],
    cols_purples[2],
    cols_reds[3],
    cols_blues[3],
    cols_greens[3],
    cols_yellows[3],
    cols_purples[3],
    cols_reds[4],
    cols_blues[4],
    cols_greens[4],
    cols_yellows[4],
    cols_purples[4],
]
let cols_mix = window.cols_mix

window.cols_blocks = [
    cols_reds[0],
    cols_blues[0],
    cols_greens[2],
    cols_purples[0],
    cols_blues[4],
    cols_yellows[2],
    cols_greens[4],
    cols_reds[1],
    cols_blues[1],
    cols_greens[3],
    cols_purples[1],
    cols_blues[2],
    cols_yellows[3],
]
window.cols_purples_blues = [
    cols_blues[0],
    cols_purples[0],
    cols_blues[1],
    cols_purples[1],
    cols_blues[2],
    cols_purples[2],
    cols_blues[3],
    cols_purples[3],
    cols_blues[4],
    cols_purples[4],
]

window.color_theme = {
    'dark_Blue_grey': {
        blocks: {
            run: {
                background: '#377EB8',
                stroke: '#000000',
                text: '#000000',
            },
            done: {
                background: '#4DAF4A',
                stroke: '#000000',
                text: '#000000',
            },
            fail: {
                background: '#E41A1C',
                stroke: '#000000',
                text: '#000000',
            },
            wait: {
                background: '#E6E6E6',
                stroke: '#000000',
                text: '#000000',
            },
            cancelOp: {
                background: '#984EA3',
                stroke: '#000000',
                text: '#000000',
            },
            cancelSys: {
                background: '#E78AC3',
                stroke: '#000000',
                text: '#000000',
            },
            shutdown: {
                background: '#424242',
                stroke: '#000000',
                text: '#000000',
            },
        },
        darker: {
            background: '#37474F',
            stroke: '#263238',
            text: '#ECEFF1',
        },
        dark: {
            background: '#455A64',
            stroke: '#263238',
            text: '#ECEFF1',
        },
        medium: {
            background: '#546E7A',
            stroke: '#263238',
            text: '#ECEFF1',
        },
        bright: {
            background: '#607D8B',
            stroke: '#263238',
            text: '#ECEFF1',
        },
        brighter: {
            background: '#78909C',
            stroke: '#263238',
            text: '#000000',
        },
        warning: {
            background: '#FFEB3B',
            stroke: '#000000',
            text: '#000000',
        },
    },
    'dark_grey': {
        blocks: {
            run: {
                background: '#377EB8',
                stroke: '#000000',
                text: '#000000',
            },
            done: {
                background: '#4DAF4A',
                stroke: '#000000',
                text: '#000000',
            },
            fail: {
                background: '#E41A1C',
                stroke: '#000000',
                text: '#000000',
            },
            wait: {
                background: '#E6E6E6',
                stroke: '#000000',
                text: '#000000',
            },
            cancelOp: {
                background: '#984EA3',
                stroke: '#000000',
                text: '#000000',
            },
            cancelSys: {
                background: '#E78AC3',
                stroke: '#000000',
                text: '#000000',
            },
            shutdown: {
                background: '#424242',
                stroke: '#000000',
                text: '#000000',
            },
        },
        darker: {
            background: '#616161',
            stroke: '#263238',
            text: '#FFFFFF',
        },
        dark: {
            background: '#757575',
            stroke: '#263238',
            text: '#FFFFFF',
        },
        medium: {
            background: '#9E9E9E',
            stroke: '#263238',
            text: '#000000',
        },
        bright: {
            background: '#BDBDBD',
            stroke: '#263238',
            text: '#000000',
        },
        brighter: {
            background: '#E0E0E0',
            stroke: '#263238',
            text: '#000000',
        },
        warning: {
            background: '#FFEB3B',
            stroke: '#000000',
            text: '#000000',
        },
    },
    'bright_grey': {
        blocks: {
            run: {
                background: '#4FC3F7',
                stroke: '#000000',
                text: '#000000',
            },
            done: {
                background: '#B5C69C', // 9CCC65
                stroke: '#000000',
                text: '#000000',
            },
            fail: {
                background: '#ED6D6C', // DD2C00
                stroke: '#000000',
                text: '#000000',
            },
            wait: {
                background: '#DEDEDE',
                stroke: '#000000',
                text: '#000000',
            },
            cancelOp: {
                background: '#CE93D8',
                stroke: '#000000',
                text: '#000000',
            },
            warning: {
                background: '#FFE082',
                stroke: '#000000',
                text: '#000000',
            },
            critical: {
                background: '#FF9800',
                stroke: '#000000',
                text: '#000000',
            },
            cancelSys: {
                background: '#9575CD',
                stroke: '#000000',
                text: '#000000',
            },
            shutdown: {
                background: '#9E9E9E',
                stroke: '#000000',
                text: '#000000',
            },
        },
        darkest: {
            background: '#BDBDBD',
            stroke: '#444444',
            text: '#444444',
        },
        darker: {
            background: '#E0E0E0',
            stroke: '#444444',
            text: '#444444',
        },
        dark: {
            background: '#E8E8E8',
            stroke: '#444444',
            text: '#444444',
        },
        medium: {
            background: '#EEEEEE',
            stroke: '#444444',
            text: '#444444',
        },
        bright: {
            background: '#F5F5F5',
            stroke: '#444444',
            text: '#444444',
        },
        brighter: {
            background: '#FAFAFA',
            stroke: '#444444',
            text: '#444444',
        },
        warning: {
            background: '#FFEB3B',
            stroke: '#444444',
            text: '#444444',
        },
    },
    'bright_blue_grey': {
        blocks: {
            run: {
                background: '#4FC3F7',
                stroke: '#000000',
                text: '#000000',
            },
            done: {
                background: '#9CCC65',
                stroke: '#000000',
                text: '#000000',
            },
            fail: {
                background: '#EF5350',
                stroke: '#000000',
                text: '#000000',
            },
            wait: {
                background: '#EEEEEE',
                stroke: '#000000',
                text: '#000000',
            },
            cancelOp: {
                background: '#CE93D8',
                stroke: '#000000',
                text: '#000000',
            },
            warning: {
                background: '#FFB74D',
                stroke: '#000000',
                text: '#000000',
            },
            cancelSys: {
                background: '#9575CD',
                stroke: '#000000',
                text: '#000000',
            },
            shutdown: {
                background: '#9E9E9E',
                stroke: '#000000',
                text: '#000000',
            },
        },
        brighter: {
            background: '#ECEFF1',
            stroke: '#263238',
            text: '#263238',
        },
        bright: {
            background: '#CFD8DC',
            stroke: '#263238',
            text: '#263238',
        },
        medium: {
            background: '#B0BEC5',
            stroke: '#263238',
            text: '#263238',
        },
        dark: {
            background: '#90A4AE',
            stroke: '#263238',
            text: '#263238',
        },
        darker: {
            background: '#78909C',
            stroke: '#263238',
            text: '#263238',
        },
        warning: {
            background: '#FFEB3B',
            stroke: '#000000',
            text: '#000000',
        },
    },
}
let color_theme = window.color_theme

window.get_color_theme = function(name) {
    return color_theme[name]
}

// ------------------------------------------------------------------
// utility functions for cyclic access
// ------------------------------------------------------------------
window.col_red = function(index) {
    if (!is_def(index)) {
        index = 0
    }
    else if (index < 0) {
        index = Math.abs(index)
    }

    return cols_reds[index % cols_reds.length]
}
window.col_blue = function(index) {
    if (!is_def(index)) {
        index = 0
    }
    else if (index < 0) {
        index = Math.abs(index)
    }

    return cols_blues[index % cols_blues.length]
}
window.col_green = function(index) {
    if (!is_def(index)) {
        index = 0
    }
    else if (index < 0) {
        index = Math.abs(index)
    }

    return cols_greens[index % cols_greens.length]
}
window.col_yellow = function(index) {
    if (!is_def(index)) {
        index = 0
    }
    else if (index < 0) {
        index = Math.abs(index)
    }

    return cols_yellows[index % cols_yellows.length]
}
window.col_purple = function(index) {
    if (!is_def(index)) {
        index = 0
    }
    else if (index < 0) {
        index = Math.abs(index)
    }

    return cols_purples[index % cols_purples.length]
}
window.col_mix = function(index) {
    if (!is_def(index)) {
        index = 0
    }
    else if (index < 0) {
        index = Math.abs(index)
    }

    return cols_mix[index % cols_mix.length]
}

window.tel_state_cols = {
    'DISCONNECTED': ['#824580', '#8A5A7F'],
    'ERROR': ['#ED6D6C', '#EF5350'],
    'WARNING': ['#FCD975', '#FFEB3B'],
    'NOMINAL': ['#B5C69C', '#AED581'],
}

// ------------------------------------------------------------------
// commonly used units and symbols
// ------------------------------------------------------------------
window.tau = 2 * Math.PI
window.unit_deg = '\xB0'
window.unit_arcmin = '′'
window.unit_arcsec = '″'

// Font Awesome icons - unicode for javascript
let symbols = {
    compass: '\uf14e',
    random: '\uf074',
    bars: '\uf0c9',
    Phi: '\u03D5',
    phi: '\u03C6',
    Delta: '\u0394',
    delta: '\u03B4',
    space: '\u00A0',
    sec: '\u00A7', // for observing bloc prefix?????
}
window.symbols = symbols
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// prefixes for labelling
// ------------------------------------------------------------------
let prefixes = {
}
prefixes.sched = {
}
prefixes.sched.sched_block = 'S'
prefixes.sched.obs_block = symbols.sec
prefixes.sched.target = 'T'
prefixes.sched.pointing = 'P'
window.prefixes = prefixes
// ------------------------------------------------------------------

window.get_target_name = function(target) {
    if (!target) {
        return null
    }
    return target.name
}
window.get_target_short = function(target) {
    if (!target) {
        return null
    }
    return target.name.split('_')[1]
}
window.get_pointing_name = function(pointing) {
    if (!pointing) {
        return null
    }
    return pointing.name.split('/')[1]
}
window.get_pointing_target = function(pointing) {
    if (!pointing) {
        return null
    }
    return pointing.name.split('/')[0]
}
window.get_pointing_short = function(pointing) {
    if (!pointing) {
        return null
    }
    return pointing.name.split('/')[1].split('_')[1]
}
window.get_pointing_value = function(pointing) {
    if (!pointing) {
        return null
    }
    return pointing.name.split('/')[1].split('_')[1].split('-')[1]
}
// ------------------------------------------------------------------
// common telescope properties
// ------------------------------------------------------------------
window.tel_info = function() {
    // let is_south = window.SITE_TYPE === 'S'

    // ------------------------------------------------------------------
    // names which should match definitions on the python server side
    // ------------------------------------------------------------------
    this.no_sub_arr_name = function() {
        return 'empty_sub_array'
    }
    this.no_sub_arr_title = function() {
        return 'Free'
    }
    this.sub_arr_prefix = function() {
        return 'SA_'
    }

    // ------------------------------------------------------------------
    // telescope ids
    // ------------------------------------------------------------------
    let tel_ids = window.SOCKET_INFO.tel_ids
    this.get_ids = function() {
        return deep_copy(tel_ids)
    }

    let tel_id_to_types = window.SOCKET_INFO.tel_id_to_types
    this.get_id_to_types = function() {
        return deep_copy(tel_id_to_types)
    }

    let categorical_types = window.SOCKET_INFO.categorical_types
    this.get_categorical_types = function() {
        return deep_copy(categorical_types)
    }

    let categorical_ids = []
    $.each(tel_ids, function(index, id) {
        if (categorical_types.indexOf(tel_id_to_types[id]) !== -1) {
            categorical_ids.push(id)
        }
    })
    this.get_categorical_ids = function() {
        return deep_copy(categorical_ids)
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    this.is_categorical_id = function(tel_id) {
        return (categorical_types.indexOf(tel_id) !== -1)
    }

    // ------------------------------------------------------------------
    // consistent telescope id ordering
    // ------------------------------------------------------------------
    let order = {
    }
    $.each(tel_ids, function(i, id) {
        order[id] = i
    })

    this.get_tel_order = function(id) {
        return order[id]
    }

    this.sort_ids = function(opt_in) {
        let func
        if (is_def(opt_in.func)) {
            func = function(d) {
                return order[opt_in.func(d)]
            }
        }
        else {
            func = function(d) {
                return order[d]
            }
        }
        let is_ascend = is_def(opt_in.is_ascend) ? opt_in.is_ascend : true
        let data = opt_in.data
        if (is_def(opt_in.is_inplace) && !opt_in.is_inplace) {
            data = deep_copy(data)
        }

        data.sort(function(a, b) {
            if (!is_def(func(a)) || !is_def(func(b))) {
                console.error(
                    '- Trying to sort unknown tel_id',
                    [ a, b ],
                    [ func(a), func(b) ],
                    opt_in
                )
            }
            if (func(a) === func(b)) {
                return 0
            }
            else if (is_ascend) {
                return func(a) < func(b) ? -1 : 1
            }
            else {
                return func(a) > func(b) ? -1 : 1
            }
        })
    // let m1 = data.map(function(d){return d.id});
    }

    // ------------------------------------------------------------------
    // telescope titles
    // ------------------------------------------------------------------
    let title = {
    }
    $.each(tel_ids, function(i, id) {
        title[id] = id.replace('_', symbols.space)
    })

    this.get_title = function(id) {
        if (is_def(title[id])) {
            return title[id]
        }
        else {
            let id_str = String(id)
            while (id_str.includes('_')) {
                id_str = id_str.replace('_', symbols.space)
            }
            return id_str
        }
    }
}

function run_tel_info() {
    if (window.SOCKET_INFO === undefined) {
        setTimeout(function() {
            run_tel_info()
        }, 10)
        return
    }
    window.tel_info = new window.tel_info()
}
run_tel_info()

window.get_tel_number = function(tel) {
    return tel.id.split('_')[1]
}
// let x = ['L_0','M_11','M_21']
// tel_info.sort_ids({
//   data: x, //func: function(d,i){console.log(d); return d; },
// });
// console.log('xxxxx',x);



// ------------------------------------------------------------------
function set_tel_state_funcs(inst_states) {
    if (is_def(window.TEL_STATES)) {
        return
    }
    
    let tel_states = {
    }
    let tel_state_color = {
    }
    let tel_thresholds = {
    }

    // derive some objects for local/global use
    $.each(inst_states, function(_, state) {
        tel_states[state.name] = state.name
        tel_thresholds[state.name] = state.thresholds

        tel_state_color[state.name] = window.tel_state_cols[state.name]
        if (!is_def(tel_state_color[state.name])) {
            console.error(' - undefined state.name for:', state, ' --> undefined color from:', window.tel_state_cols,)
        }
    })
    window.TEL_HEALTH_THRESHOLDS = tel_thresholds
    window.TEL_STATES = tel_states

    // sort by the threshold
    let sorted_vals = Object.keys(tel_thresholds).sort(
        (a,b) => tel_thresholds[a][1] - tel_thresholds[b][1]
    )
    // console.log('sorted_vals',sorted_vals)
    
    // interface for determining where a value fall between thresholds
    let get_tel_state = function(health) {
        if (!is_def(health)) {
            console.error(' - problem with get_tel_state - value:', health, 'undefined ?!')
            return tel_states.ERROR
        }
        
        for (let i = 0; i < sorted_vals.length; i++) {
            let state = sorted_vals[i]
            let is_in_state = (
                health > tel_thresholds[state][0]
                && health <= tel_thresholds[state][1]
            )
            if (health <= tel_thresholds[state][1]) {
                return state
            }
        }

        // if for some reason we failed, send an error
        console.error(' - problem with get_tel_state - value:', health, 'out of bounds ?!')
        return tel_states.ERROR
    }
    window.get_tel_state = get_tel_state

    // colours for different states
    let inst_health_col = function(health, shade) {
        let tel_state = window.get_tel_state(health)
        if (!is_def(shade)) {
            return tel_state_color[tel_state][0]
        }
        else {
            return d3.rgb(tel_state_color[tel_state][0]).darker(shade)
        }
    }
    window.inst_health_col = inst_health_col

    // fraction of health within a red/yellow/green class
    let inst_health_frac = function(health) {
        return (100 - Math.min(0, Math.max(100, health))) * 1e-2
    }
    window.inst_health_frac = inst_health_frac

    return
}
window.set_tel_state_funcs = set_tel_state_funcs



// ------------------------------------------------------------------
// transition times (if the window/tab is inactive, flush_hidden_d3() makes sure all animations
// are flushed, and these times are ignored
// ------------------------------------------------------------------
let evt_timescale = 1
let anim_timescale = 0.75
let times = {
    // basic scaling factors for times
    evt_timescale: evt_timescale,
    anim_timescale: anim_timescale,
    // animation duration for general graphical elements
    anim: 250 * anim_timescale,
    // animation duration for text
    anim_txt: 150 * anim_timescale,
    // base timescale for zooming
    base_zoom: 300 * anim_timescale,
    // time to wait between update loop checks
    wait_loop: 200 * evt_timescale,
    // time to wait before panel synchronisation
    wait_sync_state: 250 * evt_timescale,
    // time to wait between func-queue loop checks
    wait_queue_loop: 200,
    // time to wait between pushing functions to the execution queue in RunLoop
    run_loop_push_wait: 100,
    // delay to use when hovering between elements (mouseover, mouseout) events
    // to prevent the exit events from overlapping with enter events, when
    // switching beteen elements (eg mouseover -> mouseout -> mouseover)
    hover_focus_delay: 150,
}
window.times = times

// ------------------------------------------------------------------
// global flag, to control general scroll behavious inside SVGs
// ------------------------------------------------------------------
window.disable_scroll_svg = false

// ------------------------------------------------------------------
// path elements for voronoi
// ------------------------------------------------------------------
window.vor_ploy_func = function(d) {
    return d ? 'M' + d.join('L') + 'Z' : null
}

// ------------------------------------------------------------------
// utility functions
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// used for right-side drawer-panel
// ------------------------------------------------------------------
window.pin_drawer = function(id_layout, id_drawer) {
    let ele_layout, ele_drawer
    if (typeof id_layout === 'string' || id_layout instanceof String) {
        ele_layout = document.getElementById(id_layout)
    }
    else {
        ele_layout = id_layout
    }
    if (typeof id_drawer === 'string' || id_drawer instanceof String) {
        ele_drawer = document.getElementById(id_drawer)
    }
    else {
        ele_drawer = id_drawer
    }

    if (ele_layout.force_narrow) {
        tog_drawer_with_pin(ele_layout, ele_drawer)
    }
    ele_layout.force_narrow = !ele_layout.force_narrow
}

window.tog_drawer_with_pin = function(id_layout, id_drawer) {
    let ele_layout, ele_drawer
    if (typeof id_layout === 'string' || id_layout instanceof String) {
        ele_layout = document.getElementById(id_layout)
    }
    else {
        ele_layout = id_layout
    }
    if (typeof id_drawer === 'string' || id_drawer instanceof String) {
        ele_drawer = document.getElementById(id_drawer)
    }
    else {
        ele_drawer = id_drawer
    }

    if (!ele_layout.force_narrow) {
        ele_layout.force_narrow = true
        ele_drawer.toggle()
    }
    ele_drawer.toggle()

    // dispatch a resize event manually
    setTimeout(function() {
        window.dispatchEvent(new Event('resize'))
    }, 100)
}
let tog_drawer_with_pin = window.tog_drawer_with_pin

// ------------------------------------------------------------------
// switch icon when toggling iron-collapse elements
// ------------------------------------------------------------------
window.tog_keyboard_arrow = function(opt_in) {
    let more_info, icon_button, icon_sel
    if (typeof opt_in === 'string' || opt_in instanceof String) {
        more_info = document.getElementById(opt_in)
        icon_button = document.getElementById(opt_in + '_fab')
        icon_sel = document.getElementById(opt_in + '_icon')
    }
    else {
        more_info = opt_in.main
        icon_button = opt_in.fab
        icon_sel = opt_in.icon
    }

    if (icon_button.icon) {
        if (
            icon_button.icon === 'unfold-more'
      || icon_button.icon === 'unfold-less'
        ) {
            icon_button.icon = more_info.opened ? 'unfold-more' : 'unfold-less'
        }
        else if (
            icon_button.icon === 'expand-more'
      || icon_button.icon === 'expand-less'
        ) {
            icon_button.icon = more_info.opened ? 'expand-more' : 'expand-less'
        }
    }
    else if (icon_sel) {
        if (icon_sel.icon === 'unfold-more' || icon_sel.icon === 'unfold-less') {
            icon_sel.icon = more_info.opened ? 'unfold-more' : 'unfold-less'
        }
        else if (
            icon_sel.icon === 'expand-more'
      || icon_sel.icon === 'expand-less'
        ) {
            icon_sel.icon = more_info.opened ? 'expand-more' : 'expand-less'
        }
    }
    more_info.toggle()
}

// ------------------------------------------------------------------
// polymer-safe append function
// ------------------------------------------------------------------
// window.dom_add = function (parent_id, ele_add) {
//   if (typeof parent_id === 'string' || parent_id instanceof String) {
//     if (!(parent_id.indexOf('#') === 0)) parent_id = '#' + parent_id

//     Polymer.dom(document.querySelector(parent_id)).appendChild(ele_add)
//   } else {
//     Polymer.dom(parent_id).appendChild(ele_add)
//   }
// }
window.dom_add = function(parent_id, ele_add) {
    if (typeof parent_id === 'string' || parent_id instanceof String) {
        if (!(parent_id.indexOf('#') === 0)) {
            parent_id
        = '#' + parent_id(document.querySelector(parent_id)).appendChild(ele_add)
        }
    }
    else {
        parent_id.appendChild(ele_add)
    }
}

window.new_d3_node = function(g, type, attr, style) {
    let ret = g.append(type)
    for (let key in attr) {
        ret.attr(key, attr[key])
    }
    for (let key in style) {
        ret.style(key, style[key])
    }
    return ret
}
window.add_node_attr = function(node, attrs) {
    for (let key in attrs) {
        node.attr(key, attrs[key])
    }
}
window.add_node_style = function(node, styles) {
    for (let key in styles) {
        node.style(key, styles[key])
    }
}
// ------------------------------------------------------------------
// move a node up inside an svg's hierarchy
// see: http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
// ------------------------------------------------------------------
window.move_node_up = function(node, n_levels_up, stop_name) {
    // console.log('move_node_up',n_levels_up,node);
    if (n_levels_up === undefined) {
        n_levels_up = 1e3
    }
    else {
        n_levels_up = Math.min(1e3, Math.max(1, n_levels_up))
    }
    if (stop_name === undefined) {
        stop_name = 'svg'
    }

    let parent = node
    while (n_levels_up > 0 && parent != null) {
    // console.log('move_node_up',n_levels_up,parent.nodeName)
        if (parent.nodeName === stop_name) {
            return
        }

        n_levels_up--
        d3.select(parent).moveNodeUp()
        parent = parent.parentNode
    }
}
d3.selection.prototype.moveNodeUp = function() {
    return this.each(function() {
        this.parentNode.appendChild(this)
    })
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.get_node_id = function(opt_in) {
    let id_tag = is_def(opt_in.id_tag) ? opt_in.id_tag : 'id'

    if (is_def(opt_in.get_id)) {
        return opt_in.selction
            .filter(function(d) {
                return opt_in.id === opt_in.get_id(d)
            })
            .node()
    }
    else {
        return opt_in.selction
            .filter(function(d) {
                return opt_in.id === d[id_tag]
            })
            .node()
    }
}
let get_node_id = window.get_node_id

window.get_node_wh_by_id = function(opt_in) {
    let ele_now = get_node_id(opt_in)

    if (!is_def(opt_in.txt_scale)) {
        opt_in.txt_scale = false
    }
    let txt_scale = opt_in.txt_scale ? get_txt_scale() : 1

    let box = null
    if (is_def(ele_now)) {
        box = ele_now.getBBox()
    }
    return box
}

window.get_txt_scale = function() {
    return 0.333
}
let get_txt_scale = window.get_txt_scale

window.get_selection_trans = function(sel) {
    let trans = sel.attr('transform')
    trans = trans
        .replace('translate(', '')
        .replace(')', '')
        .split(',')
    trans = [ +trans[0], +trans[1] ]
    return trans
}

window.get_selection_box = function(sel) {
    return sel.node().getBoundingClientRect()
}
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// load a script (where loaded scripts can also call this
// function, allowing recursive behaviour)
// ------------------------------------------------------------------
window.loaded_scripts = {
    queued: [],
    loaded: [],
}
let loaded_scripts = window.loaded_scripts

window.load_script = function(opt_in) {
    // console.log('load_script',opt_in)
    let debug = false
    if (loaded_scripts.queued.indexOf(opt_in.script) < 0) {
        loaded_scripts.queued.push(opt_in.script)
        if (debug) {
            console.log('--- queue ( from', opt_in.source, '):', opt_in.script)
        }

        $.getScript(opt_in.script, function() {
            loaded_scripts.loaded.push(opt_in.script)
            if (debug) {
                console.log('-+- loaded: ', opt_in.script)
            }
        })
    }
}

// ------------------------------------------------------------------
// return sorted array, by the given index
// ------------------------------------------------------------------
window.sort_by_func = function(opt_in) {
    let func = opt_in.func
    let is_ascend = is_def(opt_in.is_ascend) ? opt_in.is_ascend : true
    let data = opt_in.data
    if (is_def(opt_in.is_inplace) && !opt_in.is_inplace) {
        data = deep_copy(data)
    }

    data.sort(function(a, b) {
        if (!is_def(func(a)) || !is_def(func(b))) {
            console.error(
                '- Trying to sort unknown tel_id',
                opt_in,
                [ a, func(a) ],
                [ b, func(b) ]
            )
        }
        if (func(a) === func(b)) {
            return 0
        }
        else if (is_ascend) {
            return func(a) < func(b) ? -1 : 1
        }
        else {
            return func(a) > func(b) ? -1 : 1
        }
    })

    return data
}
let sort_by_func = window.sort_by_func

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.Locker = function(opt_init) {
    this.id = 'locker_' + unique()

    let counters = {
    }
    let default_cntr = 'common'

    // turn a counter on or off
    function add(opt_in) {
        let id = default_cntr
        let expire_sec = -1
        let override = false
        if (is_def(opt_in)) {
            if (typeof opt_in === 'string') {
                id = opt_in
            }
            else {
                if (is_def(opt_in.id)) {
                    id = opt_in.id
                }
                if (is_def(opt_in.expire_sec)) {
                    expire_sec = opt_in.expire_sec
                }
                if (is_def(opt_in.override)) {
                    override = opt_in.override
                }
            }
        }

        if (!is_def(counters[id])) {
            counters[id] = 0
        }
        if (override) {
            counters[id] = 1
        }
        else {
            counters[id] = Math.max(0, counters[id] + 1)
        }

        if (expire_sec > 0) {
            remove({
                id: id,
                delay: expire_sec,
            })
        }
    // if(id == 'zoom_to_target') console.log('Locker add',id,counters[id]);
    }
    this.add = add

    function remove(opt_in) {
        let id = default_cntr
        let override = false
        let delay = 0
        if (is_def(opt_in)) {
            if (typeof opt_in === 'string') {
                id = opt_in
            }
            else {
                if (is_def(opt_in.id)) {
                    id = opt_in.id
                }
                if (is_def(opt_in.override)) {
                    override = opt_in.override
                }
                if (is_def(opt_in.delay)) {
                    delay = opt_in.delay
                }
            }
        }

        if (delay <= 0) {
            del_counter()
        }
        else {
            setTimeout(function() {
                del_counter()
            }, delay)
        }

        function del_counter() {
            if (!is_def(counters[id])) {
                counters[id] = 0
            } // just in case - should not happen...
            if (override) {
                counters[id] = 0
            }
            else {
                counters[id] = Math.max(0, counters[id] - 1)
            }
        }

    // if(id == 'zoom_to_target') console.log('Locker remove('+delay+')',id,counters[id]);
    }
    this.remove = remove

    function expires(opt_in) {
        // let id = default_cntr
        let duration = 10
        if (is_def(opt_in)) {
            if (typeof opt_in !== 'string') {
                if (is_def(opt_in.duration)) {
                    duration = opt_in.duration
                }
            }
            // if (typeof opt_in === 'string') id = opt_in
            // else {
            //   if (is_def(opt_in.id)) id = opt_in.id
            //   if (is_def(opt_in.duration)) duration = opt_in.duration
            // }
        }

        if (duration > 0) {
            add(opt_in)
            setTimeout(function() {
                remove(opt_in)
            }, duration)
        }
        else {
            console.error(
                'ignoring Locker.expires() with non-positive duration:',
                opt_in
            )
        }
    }
    this.expires = expires

    // check if a counter is still active
    function is_free(opt_in) {
        let id = default_cntr
        if (is_def(opt_in)) {
            if (typeof opt_in === 'string') {
                id = opt_in
            }
            else if (is_def(opt_in.id)) {
                id = opt_in.id
            }
        }

        if (!is_def(counters[id])) {
            return true
        }
        else {
            counters[id] = Math.max(0, counters[id])
            return counters[id] === 0
        }
    }
    this.is_free = is_free

    function are_free(idV) {
        let are_all_free = true

        $.each(idV, function(index, id_now) {
            are_all_free = are_all_free && is_free(id_now)
        })

        return are_all_free
    }
    this.are_free = are_free

    // check the value of the active counter
    function n_active(opt_in) {
        let id = default_cntr
        if (is_def(opt_in)) {
            if (typeof opt_in === 'string') {
                id = opt_in
            }
            else if (is_def(opt_in.id)) {
                id = opt_in.id
            }
        }

        if (!is_def(counters[id])) {
            return 0
        }
        else {
            counters[id] = Math.max(0, counters[id])
            return counters[id]
        }
    }
    this.n_active = n_active

    function n_actives(idV) {
        let n_active_all = 0

        $.each(idV, function(index, id_now) {
            n_active_all += n_active(id_now)
        })

        return n_active_all
    }
    this.n_actives = n_actives

    function get_actives(idV) {
        if (!is_def(idV)) {
            return []
        }

        if (typeof idV === 'string') {
            idV = [ idV ]
        }

        let actives = []
        $.each(idV, function(i, d) {
            if (!is_free(d)) {
                actives.push(d)
            }
        })

        return actives
    }
    this.get_actives = get_actives
}
let Locker = window.Locker

window.RunLoop = function(opt_in) {
    let base_tag = opt_in.tag
    let push_wait = times.run_loop_push_wait
    let runs = {
    }
    let n_keep = {
    }
    let wait = {
    }
    let func = {
    }
    let locker = new Locker()

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init(opt_in) {
        let tag = opt_in.tag
        n_keep[tag] = is_def(opt_in.n_keep) ? opt_in.n_keep : -1
        func[tag] = opt_in.func
        wait[tag] = is_def(opt_in.wait) ? opt_in.wait : times.wait_loop
        wait[tag] = Math.max(wait[tag], times.wait_loop)

        if (!is_def(tag) || !is_def(func[tag])) {
            console.error(' - bad setting for exeLoop.init() :', base_tag, opt_in)
            return
        }
        if (is_def(runs[tag])) {
            console.error(
                ' - trying to initialize exeLoop.init() with existing tag :',
                base_tag,
                opt_in
            )
            return
        }

        runs[tag] = []
        run(tag)
    }
    this.init = init

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function run(tag) {
        if (!locker.is_free(tag)) {
            setTimeout(function() {
                run(tag)
            }, push_wait)
            return
        }
        setTimeout(function() {
            run(tag)
        }, wait[tag])

        if (runs[tag].length === 0) {
            return
        }

        locker.add(tag)

        // console.log('000',tag,runs[tag].map(function(d){ return d.time}));
        let n_ele = runs[tag].length

        // sort (in-place) so that the first elements (low date value) come first
        sort_by_func({
            data: runs[tag],
            func: function(d) {
                return d.time
            },
            is_ascend: true,
        })
        // console.log('111',tag,runs[tag].map(function(d){ return d.time}));

        // keep the requested number of elements
        let n_keep_now = n_keep[tag]
        if (n_keep_now <= 0) {
            runs[tag] = runs[tag].slice(0, n_ele)
        }
        else {
            n_keep_now = Math.min(Math.max(n_keep_now, 0), n_ele)
            runs[tag] = runs[tag].slice(n_ele - n_keep_now, n_ele)
        }
        // console.log('222',tag,runs[tag].map(function(d){ return d.time}));
        // console.log('-----------------------------');

        $.each(runs[tag], function(index, data_now) {
            func[tag](data_now.data)
        })
        runs[tag] = []

        locker.remove(tag)
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function push(opt_in) {
        if (!locker.is_free(opt_in.tag)) {
            setTimeout(function() {
                push(opt_in)
            }, push_wait)
            return
        }
        if (!is_def(runs[opt_in.tag])) {
            console.error(
                ' - got _run_loop_.push() with tag which was not initialized!!!',
                base_tag,
                opt_in
            )
            return
        }

        let time = parseInt(is_def(opt_in.time) ? opt_in.time : get_time_now_msec())
        runs[opt_in.tag].push({
            data: opt_in.data,
            time: time,
        })
    }
    this.push = push

    function has_tag(tag) {
        return is_def(runs[tag])
    }
    this.has_tag = has_tag
}
window.run_loop_com = new window.RunLoop({
    tag: 'run_loop_com',
})

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------

window.run_when_ready = function(opt_in) {
    let wait = is_def(opt_in.wait) ? opt_in.wait : 10
    let max_tries = is_def(opt_in.max_tries) ? opt_in.max_tries : 1000
    let fail_log = is_def(opt_in.fail_log)
        ? opt_in.fail_log
        : function() {
            console.error([ 'cant run check_ready() with: ', opt_in ])
        }

    let n_tries = 0
    function check_ready() {
        if (!opt_in.pass()) {
            if (n_tries > max_tries) {
                fail_log()
            }
            else {
                setTimeout(function() {
                    check_ready()
                }, wait)
            }
            n_tries += 1
            return
        }

        opt_in.execute()
    }
    check_ready()
}

// ------------------------------------------------------------------
// icon-badges for widget identification
// ------------------------------------------------------------------
window.IconBadge = function() {
    function set_widget_icon(opt_in) {
        let n_icon = opt_in.n_icon

        if (!is_def(opt_in.icon_div)) {
            return null
        }

        let icon_div_id_in = opt_in.icon_div.id
        let icon_div_ele = opt_in.icon_div.ele
        let pulse_hov_in = is_def(opt_in.pulse_hov_in) ? opt_in.pulse_hov_in : false

        if (!is_def(icon_div_id_in) || !is_def(n_icon) || n_icon < 0) {
            return null
        }

        // make sure we don't add the same badge twice
        let icon_div_id
        if (is_def(icon_div_ele)) {
            icon_div_id = icon_div_ele
        }
        else {
            icon_div_id = icon_div_id_in
            if (!(icon_div_id.indexOf('#') === 0)) {
                icon_div_id = '#' + icon_div_id
            }
        }

        // remove possible existing element before adding a new one
        d3
            .select(icon_div_id)
            .selectAll('svg')
            .style('position', 'absolute')
            .transition('in_out')
            .duration(times.anim)
            .style('opacity', 0)
            .remove()

        let is_empty_selection = true
        let svg = d3
            .select(icon_div_id)
            .style('width', '100%')
            .style('position', 'relative')
            .style('margin', 'auto')
            .each(function() {
                is_empty_selection = false
            })
            .append('svg')
            .attr('id', icon_div_id_in)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('viewBox', '-0.5 -0.5 1 1')
            .style('display', 'block')
            .style('background', 'transparent')
        // .style("background", "red").style('opacity',0.2)//.style("border","1px solid red")

        let data_out = {
        }

        if (is_empty_selection) {
            return data_out
        }

        let icon_svg = get(n_icon)
        let badge = add({
            parent_svg: svg,
            icon_file: icon_svg[0],
            text: {
                pos: 'top_right',
                txt: icon_svg[1],
            },
            rad: 0.48,
            delay: 0,
            pulse_hov_in: pulse_hov_in,
            trans_back: true,
        })

        data_out = {
            svg: svg,
            icon_svg: icon_svg,
            badge: badge,
        }

        return data_out
    }
    this.set_widget_icon = set_widget_icon

    // ------------------------------------------------------------------
    // produces an icon with a backdrop, where the entire box is scaled as 100x100px
    // ------------------------------------------------------------------
    function add(opt_in) {
    // required parameters
        let base_r = 50
        let parent_svg = opt_in.parent_svg
        let icon_file = opt_in.icon_file

        // optional parameters
        let rad = is_def(opt_in.rad) ? opt_in.rad : base_r
        let delay = is_def(opt_in.delay) ? opt_in.delay : 0
        let duration = is_def(opt_in.duration) ? opt_in.duration : times.anim
        let show_outline = is_def(opt_in.show_outline) ? opt_in.show_outline : false
        let bigger_icon = is_def(opt_in.bigger_icon) ? opt_in.bigger_icon : false
        let col_back = is_def(opt_in.col_back) ? opt_in.col_back : '#F2F2F2'
        let col_dark = is_def(opt_in.col_dark) ? opt_in.col_dark : '#383B42'
        let col_light = is_def(opt_in.col_light) ? opt_in.col_light : '#ececec'
        let icon_col = is_def(opt_in.icon_col) ? opt_in.icon_col : col_dark
        let icon_col_up = is_def(opt_in.icon_col_up)
            ? opt_in.icon_col_up
            : d3.rgb(icon_col).darker(2)
        let pulse_hov_in = is_def(opt_in.pulse_hov_in) ? opt_in.pulse_hov_in : false
        let pulse_hov_out = is_def(opt_in.pulse_hov_out) ? opt_in.pulse_hov_out : false
        let col_dark_opac = is_def(opt_in.col_dark_opac) ? opt_in.col_dark_opac : 1
        let col_light_opac = is_def(opt_in.col_light_opac) ? opt_in.col_light_opac : 1
        let add_boundbox = is_def(opt_in.add_boundbox) ? opt_in.add_boundbox : false
        let trans_back = is_def(opt_in.trans_back) ? opt_in.trans_back : false
        let text = is_def(opt_in.text) ? opt_in.text : null

        if (trans_back) {
            if (!is_def(opt_in.col_back)) {
                col_back = 'transparent'
            }
            if (!is_def(opt_in.col_light)) {
                col_light = '#383B42'
            }
            if (!is_def(opt_in.col_light_opac)) {
                col_light_opac = 0.2
            }
        }
        // duration*=10

        // col_dark = "#104E8B", col_light = "#74CBDE", icon_col = "#9CCC65";
        // col_dark = "#C2185B", col_light = "#F06292", icon_col = "#383B42";

        let g_outer = parent_svg.append('g')
        let g_inner = g_outer.append('g')
        let g_circ = g_inner.append('g')
        let g_svg = g_inner.append('g')
        let g_txt = g_inner.append('g')

        let set_r = function(r_in, duration) {
            if (!is_def(duration)) {
                duration = times.anim
            }
            let trans = -r_in
            let scale = r_in / base_r
            g_inner
                .transition('badge_set_r')
                .duration(duration)
                .attr(
                    'transform',
                    'translate(' + trans + ',' + trans + ')scale(' + scale + ')'
                )
        }
        set_r(rad, 0)

        if (icon_file === '') {
            return {
                g: g_outer,
                set_r: set_r,
            }
        }

        let data = []
        data.push({
            fill: col_back,
            strokeWidth: 0,
            stroke: col_dark,
            strokeOpac: col_dark_opac,
            opacity: 1,
            r: bigger_icon ? 25 : 48,
            transDark: false,
        })

        data.push({
            fill: 'transparent',
            strokeWidth: 20,
            stroke: col_dark,
            strokeOpac: col_dark_opac,
            opacity: 0.05,
            r: bigger_icon ? 18 : 38,
            transDark: false,
        })

        data.push({
            fill: 'transparent',
            strokeWidth: bigger_icon ? 1.5 : 2,
            stroke: col_light,
            strokeOpac: col_light_opac,
            opacity: 1,
            r: bigger_icon ? 18 : 38,
            transDark: false,
        })

        data.push({
            fill: 'transparent',
            strokeWidth: 4,
            stroke: col_dark,
            strokeOpac: col_dark_opac,
            opacity: 0.05,
            r: bigger_icon ? 22 : 44,
            transDark: false,
        })

        data.push({
            fill: 'transparent',
            strokeWidth: 0.5,
            stroke: col_light,
            strokeOpac: col_light_opac,
            opacity: 1,
            r: bigger_icon ? 22 : 44,
            transDark: true,
        })

        g_circ
            .selectAll('circle.badge')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'badge') // class list for easy selection
            .attr('cx', base_r)
            .attr('cy', base_r)
            .attr('t', 0)
            .attr('fill', function(d) {
                return d.fill
            })
            .style('stroke-width', function(d) {
                return d.strokeWidth
            })
            .style('stroke-opacity', function(d) {
                return d.strokeOpac
            })
            .style('stroke', function(d) {
                return d.stroke
            })
            .style('opacity', function(d) {
                return d.opacity
            })
            .transition('in_out')
            .delay(delay)
            .duration(duration)
            .attr('r', function(d) {
                return d.r
            })

        if (add_boundbox) {
            g_circ
                .selectAll('rect.badge')
                .data([ data[0] ])
                .enter()
                .append('rect')
                .attr('class', 'badge') // class list for easy selection
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', base_r * 2)
                .attr('height', base_r * 2)
                // .attr("t", 0)
                .attr('fill', 'transparent')
                .style('stroke-width', 1)
                .style('stroke-opacity', 1)
                .style('stroke', col_dark)
                .style('opacity', 0)
                .transition('in_out')
                .delay(delay)
                .duration(duration)
                .style('opacity', col_dark_opac)
        }

        if (is_def(text)) {
            let txt_size, align, pos
            if (text.pos === 'top_left') {
                txt_size = 28
                align = 'start'
                pos = [ 5, 0, txt_size ]
            }
            else if (text.pos === 'top_right') {
                txt_size = 28
                align = 'end'
                pos = [ data[0].r * 2 - 5, 0, txt_size ]
            }
            else {
                txt_size = 28
                align = 'middle'
                pos = [ data[0].r, data[0].r, txt_size / 3 ]
            }

            g_txt
                .selectAll('text.badge')
                .data([{
                    id: 'txt0',
                }])
                .enter()
                .append('text')
                .attr('class', 'badge')
                .text(text.txt)
                .style('text-anchor', align)
                .style('font-weight', 'bold')
                .style('stroke-width', 1.25)
                .style('stroke', '#F2F2F2')
                .style('fill', col_dark)
                .style('pointer-events', 'none')
                .style('vector-effect', 'non-scaling-stroke')
                .attr('transform',
                    'translate(' + pos[0] + ',' + pos[1] + ')'
                )
                .style('font-size', txt_size + 'px')
                .attr('dy', pos[2] + 'px')
                .style('fill-opacity', 0.9)
                .style('stroke-opacity', 1)
        }

        // g_svg .append("svg:image")
        //       .attr("xlink:href", icon_file)
        //       .attr({"width": 68, "height":68, "x":16, "y":16})
        //       .style({"opacity":"0"})
        //       .transition("in_out").delay(delay).duration(duration*2)
        //       .style({"opacity":"1"})

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        let id_now = 'badge' + unique()
        load_svg_file({
            g: g_svg,
            icon_path: icon_file,
            svg_id: id_now,
            func_end: function() {
                after_svg({
                    g: g_inner,
                    svg_id: id_now,
                })
            },
        })

        function after_svg(opt_in) {
            let g_now = opt_in.g
            let svg_id = opt_in.svg_id
            let svg_inner = g_now.select('#' + svg_id)

            let svg_ele_types = [ 'path', 'circle', 'polygon' ]
            $.each(svg_ele_types, function(index_type, type_now) {
                svg_inner.selectAll(type_now).attr('fill', icon_col)
            })

            let coords = [ 16, 68 ]
            svg_inner
                .attr('x', coords[0] + coords[1] / 2)
                .attr('y', coords[0] + coords[1] / 2)
                .attr('width', 0)
                .attr('height', 0)
                .style('opacity', 0.5)
                .transition('in_out')
                .delay(delay + duration / 2)
                .duration(duration)
                .attr('x', coords[0])
                .attr('y', coords[0])
                .attr('width', coords[1])
                .attr('height', coords[1])
                .style('opacity', 1)

            let circ = g_now.selectAll('circle.outline').data([ 0 ])
            circ
                .enter()
                .append('circle')
                .attr('class', 'outline')
                .attr('cx', base_r)
                .attr('cy', base_r)
                .attr('r', base_r)
                .attr('fill', 'transparent')
                .style('stroke-width', 1)
                .style('stroke', col_dark) // .style("stroke", 'red')
                .attr('vector-effect', 'non-scaling-stroke')
                .style('opacity', 0)
                .on('mouseover', function() {
                    if (pulse_hov_in) {
                        on_hov(1.05)
                    }
                })
                .on('mouseout', function() {
                    if (pulse_hov_out) {
                        on_hov(1)
                    }
                })
                .transition('in_out')
                .delay(delay + duration / 2)
                .duration(duration)
                .style('opacity', show_outline ? '1' : '0')

            function on_hov(scale) {
                let is_up = scale > 1.001
                let up_frac = bigger_icon && is_up ? 0.8 : 0.1 * (is_up ? 1 : -1)
                // console.log('on_hov',is_up)

                if (is_up) {
                    g_now
                        .selectAll('circle.badge')
                        .filter(function(d) {
                            return d.transDark
                        })
                        .transition('strk_up_down')
                        .duration(duration / 2)
                        .style('stroke', function(d) {
                            return d3.rgb(d.stroke).darker(1)
                        })
                        .transition('strk_up_down')
                        .duration(duration / 2)
                        .style('stroke', function(d) {
                            return d.stroke
                        })

                    $.each(svg_ele_types, function(index_type, type_now) {
                        svg_inner
                            .selectAll(type_now)
                            .transition('on_hov')
                            .duration(duration / 2)
                        // .attr("transform", "scale("+(2)+")")
                            .attr('fill', icon_col_up)
                            .transition('on_hov')
                            .duration(duration)
                        // .attr("transform", "scale("+(1)+")")
                            .attr('fill', icon_col)
                    })
                }

                //
                g_now
                    .selectAll('circle.badge')
                    .transition('on_hov')
                    .duration(duration / 2)
                    .attr('r', function(d) {
                        return d.r * (scale + up_frac)
                    })
                    .transition('on_hov')
                    .duration(duration / 2)
                    .attr('r', function(d) {
                        return d.r * scale
                    })
            }
        }

        // return g_outer;
        return {
            g: g_outer,
            set_r: set_r,
        }
    }
    this.add = add

    // ------------------------------------------------------------------
    // see: http://www.flaticon.com/free-icons/animals_221/2?word=animals&order_by=1&color=1&stroke=1
    // credit: _icons made by Freepik from www.flaticon.com
    // ------------------------------------------------------------------
    function get(n_icon) {
        let icons = [
            '/static/frog-jumping.svg',
            '/static/seahorse.svg',
            '/static/fox.svg',
            '/static/butterfly.svg',
            '/static/horse-left.svg',
            '/static/bat-round.svg',
            '/static/owl.svg',
            '/static/gorilla.svg',
            '/static/gecko.svg',
            '/static/puffin.svg',
            '/static/falcon.svg',
            '/static/deer-running.svg',
            '/static/dolphin.svg',
            '/static/cat-side.svg',
            '/static/swan.svg',
            '/static/flamingo.svg',
            '/static/squirrel.svg',
            '/static/fishe-pair.svg',
            '/static/spotted-beetle.svg',
            '/static/crab.svg',
            '/static/octopus.svg',
            '/static/dog.svg',
            '/static/goose.svg',
            '/static/blowfish.svg',
            '/static/wallaby.svg',
            '/static/lion.svg',
            '/static/giraffe.svg',
            '/static/arctic-fox.svg',
            '/static/chicken.svg',
            '/static/scorpion-clawed.svg',
            '/static/koala.svg',
            '/static/monkey.svg',
            '/static/arctic-moose.svg',
            '/static/hammerhead.svg',
            '/static/spider.svg',
            '/static/rabbit.svg',
            '/static/manta-ray.svg',
            '/static/snail.svg',
            '/static/poodle.svg',
            '/static/wolf.svg',
            '/static/sea-lion.svg',
            '/static/snake.svg',
            '/static/hummingbird.svg',
            '/static/elephant.svg',
            '/static/fish-triangular.svg',
            '/static/dromedary.svg',
            '/static/mouse.svg',
            '/static/cat.svg',
            '/static/sheep.svg',
            '/static/crane.svg',
            '/static/squid.svg',
            '/static/waterfowl.svg',
            '/static/snapper.svg',
            '/static/fish.svg',
            '/static/bear.svg',
            '/static/oystercatcher.svg',
            '/static/arthropod.svg',
            '/static/bandicoot.svg',
            '/static/balloonfish.svg',
            '/static/duck.svg',
            '/static/dove.svg',
            '/static/crocodile.svg',
            '/static/bird.svg',
            '/static/rooster.svg',
            '/static/parrot.svg',
            '/static/penguin.svg',
            '/static/eagle.svg',
            '/static/moose.svg',
            '/static/anhinga-bird.svg',
            '/static/horse-right.svg',
            '/static/sea-turtle.svg',
            '/static/frog.svg',
            '/static/centrosaurus.svg',
            '/static/aries.svg',
            '/static/bull-silhouette.svg',
            '/static/cougar.svg',
            '/static/japan-koi-fish.svg',
            '/static/ostrich-bird-shape-running.svg',
            '/static/capricorn.svg',
            '/static/scorpion.svg',
            '/static/butterfly-left.svg',
            '/static/turtle.svg',
            '/static/turkey.svg',
            '/static/vulture.svg',
            '/static/iguana.svg',
            '/static/pterodactyl.svg',
            '/static/cow-silhouette.svg',
            '/static/giraffatitan.svg',
            '/static/hawk.svg',
            '/static/deer.svg',
            '/static/compsognathus.svg',
            '/static/beetle.svg',
            '/static/elasmosaurus.svg',
            '/static/beaver.svg',
            '/static/ant-eater.svg',
            '/static/epidexipteryx.svg',
            '/static/whale-facing-right.svg',
            '/static/bat.svg',
            '/static/raven.svg',
            '/static/camel-shape.svg',
            '/static/piggy-bank.svg',
        ]

        if (!is_def(n_icon) || n_icon < 0) {
            return [ '', null ]
        }

        let n_icon_now = n_icon % icons.length
        let icon_txt = Math.floor(0.000001 + n_icon / icons.length)
        if (icon_txt === 0) {
            icon_txt = null
        }
        return [ icons[n_icon_now], icon_txt ]

    // else if(n_icon >= icons.length) {
    //   console.error('trying to get icons[',n_icon,'] which is out of bounds (size is ',icons.length,')')
    //   return "";
    // }
    }
    this.get = get
}
window.icon_badge = new window.IconBadge()

// ------------------------------------------------------------------
// function to load an external svg file
// ------------------------------------------------------------------
function load_svg_file(opt_in) {
    let g_now = opt_in.g
    let svg_id = opt_in.svg_id
    let icon_path = opt_in.icon_path
    let func_end = is_def(opt_in.func_end) ? opt_in.func_end : null

    d3.xml(icon_path).then(function(documentFragment) {
        let svg_node = documentFragment.getElementsByTagName('svg')
        if (svg_node[0]) {
            // assign an id, and then later do e.g., g.select("#"+id_now);
            let node = g_now.node().appendChild(svg_node[0])
            node.id = svg_id 
        }

        // exec function after we're done here
        if (is_def(func_end)) {
            func_end()
        }
    })
}
window.load_svg_file = load_svg_file

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------

window.bck_pattern = function(opt_in) {
    let com = opt_in.com
    let g_now = opt_in.g_now
    let g_tag = opt_in.g_tag
    let opac = opt_in.opac
    // let lenTag = opt_in.lenTag
    let texture_orient = opt_in.texture_orient
    let texture_size = opt_in.texture_size
    let circ_type = opt_in.circ_type
    let size = opt_in.size
    let hex_r = opt_in.hex_r
    let len_wh = opt_in.len_wh
    let trans = opt_in.trans

    // let g_now   = svg[g_tag];
    let tag_now = 'svg_bck' + g_tag
    let strk = 0.5
    // console.log('==========',texture_orient,is_def(texture_orient),isNaN(texture_orient),hex_r,is_def(hex_r))

    // add the hexbin as another layer of the background
    // ------------------------------------------------------------------
    if (is_def(texture_orient) || is_def(circ_type)) {
        if (!is_def(com[tag_now])) {
            com[tag_now] = {
            }
            com[tag_now].g = g_now.append('g')
            com[tag_now].orient = ''
            com[tag_now].size = is_def(texture_size) ? texture_size : 50
        }

        if (is_def(trans)) {
            com[tag_now].g.attr(
                'transform',
                'translate(' + trans[0] + ',' + trans[1] + ')'
            )
        }

        if (
            (is_def(texture_orient) && com[tag_now].orient !== texture_orient)
      || (is_def(texture_size) && com[tag_now].size !== texture_size)
        ) {
            if (is_def(texture_orient)) {
                com[tag_now].orient = texture_orient
            }
            if (is_def(texture_size)) {
                com[tag_now].size = texture_size
            }

            // see: http://riccardoscalco.github.io/textures/
            com[tag_now].txtr = textures
                .lines()
                .thinner()
                .lighter()
                .orientation(com[tag_now].orient)
                .stroke('#383B42')
                .strokeWidth(1)
                .size(com[tag_now].size)

            if (is_def(size)) {
                com[tag_now].txtr.size(size)
            }

            com[tag_now].g.call(com[tag_now].txtr)
        }
        else if (is_def(circ_type)) {
            // see: http://riccardoscalco.github.io/textures/
            if (circ_type === 'normal') {
                com[tag_now].txtr = textures.circles()
            }
            else if (circ_type === 'heavier') {
                com[tag_now].txtr = textures.circles().heavier()
            }
            else if (circ_type === 'lighter') {
                com[tag_now].txtr = textures.circles().lighter()
            }
            else if (circ_type === 'thicker') {
                com[tag_now].txtr = textures.circles().thicker()
            }
            else if (circ_type === 'thinner') {
                com[tag_now].txtr = textures.circles().thinner()
            }

            if (is_def(size)) {
                com[tag_now].txtr.size(size)
            }
            // .thinner().lighter()
            // .orientation(com[tag_now].orient)
            // .stroke("#383B42")
            // .strokeWidth(1).size(com[tag_now].size)

            com[tag_now].g.call(com[tag_now].txtr)
        }

        let rect = com[tag_now].g
            .selectAll('rect.' + tag_now)
            .data([{
                id: 0,
            }], function(d, i) {
                return i
            })

        rect
            .enter()
            .append('rect')
            .attr('class', tag_now)
            .attr('width', len_wh[0])
            .attr('height', len_wh[1])
            .attr('fill', 'transparent')
            .attr('stroke-width', 0)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('pointer-events', 'none')
            .merge(rect)
            .transition('in_out')
            .duration(times.anim)
            .style('fill', com[tag_now].txtr.url())
            .attr('opacity', opac)

        rect
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .style('opacity', '0')
            .remove()
    }
    else if (is_def(hex_r)) {
        if (!is_def(com[tag_now])) {
            com[tag_now] = {
            }
            com[tag_now].g = g_now.append('g')
            com[tag_now].path = null
            com[tag_now].hex_r = -1
        }

        if (com[tag_now].hex_r !== hex_r) {
            com[tag_now].hex_r = hex_r
            com[tag_now].path = d3
                .hexbin()
                .size([ len_wh[0], len_wh[1] ])
                .radius(hex_r)
        }

        let path = com[tag_now].g
            .selectAll('path.' + tag_now)
            .data([{
                id: 0,
            }], function(d, i) {
                return i
            })

        path
            .enter()
            .append('path')
            .attr('class', tag_now)
            .attr('fill', 'transparent')
            .attr('stroke', '#383B42')
            .attr('stroke-width', strk)
            .attr('vector-effect', 'non-scaling-stroke')
            .merge(path)
            .transition('in_out')
            .duration(times.anim)
            .attr('d', com[tag_now].path.mesh())
            .attr('opacity', opac)
            // .attr('stroke', cols_blues[0]).attr('opacity', 0.8)

        path
            .exit()
            .transition('in_out')
            .duration(times.anim)
            .style('opacity', '0')
            .remove()
    }
    else {
        console.log('undetermined options in bckPat', opt_in)
    }
}

// ------------------------------------------------------------------
// programatic zoom function
// ------------------------------------------------------------------

window.do_zoom_to_target = function(opt_in) {
    if (!is_def(opt_in.cent)) {
        opt_in.cent = [ opt_in.wh[0] / 2, opt_in.wh[1] / 2 ]
    }

    let duration = opt_in.duration_scale * times.base_zoom
    let trans_target = d3.zoomIdentity
        .translate(opt_in.cent[0], opt_in.cent[1])
        .scale(opt_in.target_scale)
        .translate(-opt_in.trans_to[0], -opt_in.trans_to[1])

    // // for chrome the following is enough, but for firefox we need to define attrTween explicitly...
    // opt_in.svg.transition("do_zoom_to_target").duration(duration*5)
    //   .call(opt_in.svg_zoom.transform, trans_target)
    //   .on("start", opt_in.func_start)
    //   .on("end", opt_in.func_end)
    // return;

    let scale0 = Math.sqrt(opt_in.wh[0] * opt_in.wh[1])
    let node = d3.zoomTransform(opt_in.svg_zoom_node)
    let center = [ opt_in.cent[0], opt_in.cent[1] ]
    let start = [
        (center[0] - node.x) / node.k,
        (center[1] - node.y) / node.k,
        scale0 / node.k,
    ]
    let end = [
        opt_in.trans_to[0], opt_in.trans_to[1],
        scale0 / opt_in.target_scale,
    ]
    let interpol_zoom = d3.interpolateZoom(start, end)

    if (is_def(opt_in.func_start)) {
        opt_in.func_start()
    }

    opt_in.zoom_callable
        .transition('zoom_to_target')
        .duration(duration)
        .attrTween('transform', function() {
            return tween_step
        })
        .on('end', function() {
            opt_in.svg.call(opt_in.svg_zoom.transform, trans_target)

            if (is_def(opt_in.func_end)) {
                opt_in.func_end()
            }
        })

    function tween_step(t) {
        if (opt_in.is_static) {
            return ''
        }

        if (is_def(opt_in.func_during)) {
            opt_in.func_during()
        }

        let intpr = interpol_zoom(t)
        if (!is_def(intpr[0])) {
            return ''
        }

        let scale = scale0 / intpr[2]
        let trans = [
            center[0] - intpr[0] * scale,
            center[1] - intpr[1] * scale,
        ]

        return ('translate(' + trans[0] + ',' + trans[1]
      + ')scale(' + scale + ')')
    }
}

// ------------------------------------------------------------------
// see: https://github.com/mbostock/d3/wiki/Math#transform
// ------------------------------------------------------------------

window.this_trans = function(me) {
    let trans = d3.select(me).attr('transform')
    return trans
        .replace('translate(', '')
        .replace(')', '')
        .split(',')
    // return d3.transform(d3.select(me).attr("transform")).translate;
}
// function thisScale (me) { return d3.transform(d3.select(me).attr("transform")).scale;     }
// function thisRotate(me) { return d3.transform(d3.select(me).attr("transform")).rotate;    }
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// deep copy an object or array
// ------------------------------------------------------------------
// window.merge_obj = function(obj, src) {
//     for (let key in src) {
//         if (src.hasOwnProperty(key)) {
//             obj[key] = src[key]
//         }
//     }
//     return obj
// }
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item))
}
// window.merge_obj = function (target, ...sources) {
//   let merge_object = Object.assign({}, target)
//     function inner_merge() {
//       if (!sources.length) return target
//       const source = sources.shift()
//
//       if (isObject(target) && isObject(source)) {
//           for (const key in source) {
//               if (isObject(source[key])) {
//                   if (!target[key]) Object.assign(target, { [key]: {} })
//                   merge_obj(target[key], source[key])
//               } else {
//                   if (!target[key]) Object.assign(target, { [key]: source[key] })
//               }
//           }
//       }
//
//       return merge_obj(merge_object, ...sources)
//     }
//     inner_merge()
//     return merge_object
// }

window.merge_obj = function (sources, overwrite) {
    let merge_object = {}

    function inner_merge(obj, sources, overwrite) {
      for (let key in overwrite) {
          if (isObject(overwrite[key])) {
            obj[key] = {}
            inner_merge(obj[key], isObject(sources[key]) ? sources[key] : {}, overwrite[key])
          } else {
            obj[key] = overwrite[key]
          }
      }
      for (let key in sources) {
          if (!overwrite.hasOwnProperty(key)) {
              if (isObject(sources[key])) {
                obj[key] = {}
                inner_merge(obj[key], sources[key], {})
              } else {
                obj[key] = sources[key]
              }
          }
      }
    }
    inner_merge(merge_object, sources, overwrite)
    return merge_object
}

window.overwrite_obj = function (sources, overwrite) {
    let overwrite_object = {}

    function inner_overwrite(obj, sources, overwrite) {
      for (let key in sources) {
          if (!overwrite.hasOwnProperty(key)) {
              if (isObject(sources[key])) {
                obj[key] = {}
                inner_overwrite(obj[key], sources[key], {})
              } else {
                obj[key] = sources[key]
              }
          } else {
            if (isObject(sources[key])) {
              if (isObject(overwrite[key])) {
                obj[key] = {}
                inner_overwrite(obj[key], sources[key], overwrite[key])
              } else {
                inner_overwrite(obj[key], sources[key], {})
              }
            } else {
              obj[key] = overwrite[key]
            }
          }
      }
    }
    inner_overwrite(overwrite_object, sources, overwrite)
    return overwrite_object
}

window.deep_copy = function(obj_in) {
    if (Array.isArray(obj_in)) {
        return obj_in.slice(0, obj_in.length)
    }
    else {
        return jQuery.extend(true, {
        }, obj_in)
    }
}
let deep_copy = window.deep_copy

// ------------------------------------------------------------------
// filter array for unique elements
// ------------------------------------------------------------------
window.unique_array = function(data_in) {
    return data_in.filter(function(d, i) {
        return data_in.indexOf(d) === i
    })
}

// ------------------------------------------------------------------
// filter array for unique elements
// example use:
//     let d_in = { '0': 11, '22': 22, '-19': -38, '1': 88, }
//     let d_out = window.filter_array({
//         data: d_in,
//         func: function(d, i) {
//             return d > 0
//         },
//         by_key: true,
//     })
//     console.log('input', d_in, ' --> output', d_out)
// ------------------------------------------------------------------
window.filter_array = function(opt_in) {
    let by_key = is_def(opt_in.by_key) ? opt_in.by_key : true
    let index = by_key ? 1 : 0
    let obj_out = {
    }
    let arr_out = Object.entries(opt_in.data).filter(function(d, i) {
        return opt_in.func(d[index], i)
    }
    )
    $.each(arr_out, function(i, d) {
        obj_out[d[0]] = d[1]
    })
    return obj_out
}


// ------------------------------------------------------------------
// find element in obkect with key and value match
// ------------------------------------------------------------------

window.find_dict_ele_in_obj = function(obj_in, key, val, is_debug) {
    let data_out = [ -1, undefined ]
    $.each(obj_in, function(index, ele_now) {
        if (ele_now[key] === val && data_out[0] === -1) {
            data_out = [ index, ele_now ]
        }
    })
    if (data_out[0] === -1 && is_debug) {
        console.log(' - could not find [', key, ' == ', val, '] in', obj_in)
    }
    return data_out
}

// ------------------------------------------------------------------
// iterative replace of all occurances of a sub-string
// (replace in two steps, since the replacing pattern might include the replaced pattern)
// ------------------------------------------------------------------

window.replace_all = function(str_in, patt0, patt1) {
    let data_out = str_in

    // temporary pattern which is not included in the input string
    let tmp_pattern = 'TMP_FAKE_PATTERN'
    while (data_out.indexOf(tmp_pattern) !== -1) {
        let sub0 = tmp_pattern.substr(0, tmp_pattern.length - 1)
        let sub1 = tmp_pattern.substr(tmp_pattern.length - 1, tmp_pattern.length)
        tmp_pattern = sub0 + '_' + sub1
    }

    while (data_out.indexOf(patt0) !== -1) {
        data_out = data_out.replace(patt0, tmp_pattern)
    }
    while (data_out.indexOf(tmp_pattern) !== -1) {
        data_out = data_out.replace(tmp_pattern, patt1)
    }

    return data_out
}

// ------------------------------------------------------------------
// common format for dates
// ------------------------------------------------------------------
window.date_to_string = function(date_in) {
    return moment(date_in).format('DD/MM/YYYY,HH:mm:ss')
    // return  date_in.getDate()+"/"+(date_in.getMonth()+1)+"/"+date_in.getFullYear()+","
    //        +date_in.getHours()+":"+date_in.getMinutes()+":"+date_in.getSeconds();
}

// the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC
window.get_time_now_msec = function() {
    return Date.now()
}

// the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC
// with reference to date_time
window.get_date_time = function(date_time) {
    return new Date(date_time)
}

// ------------------------------------------------------------------
// numerical
// ------------------------------------------------------------------
window.floor_min = function(inp, data_out) {
    return Math.max(Math.floor(inp), data_out)
}

window.floor_max = function(inp, data_out) {
    return Math.min(Math.floor(inp), data_out)
}

window.round_min = function(inp, data_out) {
    return Math.max(Math.round(inp), data_out)
}

window.round_max = function(inp, data_out) {
    return Math.min(Math.round(inp), data_out)
}

// ------------------------------------------------------------------
window.min_max_obj = function(opt_in) {
    let func = opt_in.func
    if (typeof opt_in.func === 'string') {
        func = function(d) {
            return d[opt_in.func]
        }
    }

    let mapped = opt_in.data.map(func)
    if (is_def(opt_in.filt)) {
        mapped = mapped.filter(opt_in.filt)
    }

    let min_max_func = opt_in.min_max === 'max' ? Math.max : Math.min

    if (mapped.length === 0) {
        return is_def(opt_in.default_val) ? opt_in.default_val : null
    }

    return mapped.reduce(function(a, b) {
        return min_max_func(a, b)
    })
}

// ------------------------------------------------------------------
// PLACEHOLDER FUNCTIONS for coordinates
// ------------------------------------------------------------------
// - degree to DMS comversion
// ------------------------------------------------------------------
window.deg_dms = function(data_in) {
    // let sign  = (data_in > 0) ? 1 : -1;
    // data_in    *= sign;// log(data_in)
    let deg = data_in | 0 // truncate dd to get degrees
    let frac = Math.abs(data_in - deg) // get fractional part
    let min = (frac * 60) | 0 // multiply fraction by 60 and truncate
    let sec = frac * 3600 - min * 60
    return [ deg, min, sec ]
}
let deg_dms = window.deg_dms

window.dms_deg = function(data_in) {
    let sign = data_in[0] > 0 ? 1 : -1
    return data_in[0] + sign * data_in[1] / 60 + sign * data_in[2] / 3600
}
// let dms_deg = window.dms_deg

window.deg_hms = function(data_in) {
    let scale = 24 / 360
    let data_out = deg_dms(data_in * scale)
    // console. log('---',data_in,data_out)
    return data_out
}
// let deg_hms = window.deg_hms

window.azim_ra = function(data_in) {
    // return data_in;

    let data_out = data_in
    data_out += 60
    if (data_out > 180) {
        data_out -= 360
    }
    else if (data_out < -180) {
        data_out += 360
    } // for debug
    return data_out
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.add_switch_btn = function(opt_in) {
    let main_div = opt_in.main_div
    let top_div_id = opt_in.top_div_id
    let input_id = opt_in.input_id
    let checked = opt_in.checked
    let tooltip = opt_in.tooltip

    let top_div = main_div.appendChild(
        document.createElement('div')
    )
    top_div.id = top_div_id

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let label = top_div.appendChild(
        document.createElement('label')
    )
    label.classList.add('checkbox_slider')

    let input = label.appendChild(
        document.createElement('input')
    )
    input.id = input_id
    input.type = 'checkbox'
    input.checked = checked

    let span = label.appendChild(
        document.createElement('span')
    )
    span.classList.add('checkbox_slider_bck')

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    if (is_def(tooltip)) {
        let tooltip_text = tooltip.text
        let class_list = tooltip.class_list

        top_div.classList.add('tooltip')
        let span = top_div.appendChild(
            document.createElement('span')
        )
        span.classList.add('tooltip-text')
        $.each(class_list, function(_, cls) {
            span.classList.add(cls)
        })
        span.innerHTML = tooltip_text
    }

    return
}


// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.add_click_btn = function(opt_in) {
    let main_div = opt_in.main_div
    let top_div_id = opt_in.top_div_id
    let is_dark = opt_in.is_dark
    let icon = opt_in.icon
    let tooltip = opt_in.tooltip

    let top_div = main_div.appendChild(
        document.createElement('div')
    )
    top_div.id = top_div_id

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let i = top_div.appendChild(
        document.createElement('i')
    )

    i.classList.add(
        'fa',
        icon,
        'sized-button',
        'fa-circle-button',
    )
    if (is_dark) {
        i.classList.add('fa-circle-button-dark')
    }
    else {
        i.classList.add('fa-circle-button-bright')
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    if (is_def(tooltip)) {
        let tooltip_text = tooltip.text
        let class_list = tooltip.class_list

        top_div.classList.add('tooltip')
        let span = top_div.appendChild(
            document.createElement('span')
        )
        span.classList.add('tooltip-text')
        $.each(class_list, function(_, cls) {
            span.classList.add(cls)
        })
        span.innerHTML = tooltip_text
    }
    return
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.add_status_indicator = function(opt_in) {
    let main_div = opt_in.main_div
    let top_div_id = opt_in.top_div_id
    let input_id = opt_in.input_id
    let checked = opt_in.checked
    let tooltip = opt_in.tooltip

    let top_div = main_div.appendChild(
        document.createElement('div')
    )
    top_div.id = top_div_id

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let div = top_div.appendChild(
        document.createElement('div')
    )
    div.id = input_id
    div.style = 'pointer-events:none'

    div.classList.add('status-indicator')
    if (checked) {
        div.classList.add('status-indicator-on')
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    if (is_def(tooltip)) {
        let tooltip_text = tooltip.text
        let class_list = tooltip.class_list

        top_div.classList.add('tooltip')
        let span = top_div.appendChild(
            document.createElement('span')
        )
        span.classList.add('tooltip-text')
        $.each(class_list, function(_, cls) {
            span.classList.add(cls)
        })
        span.innerHTML = tooltip_text
    }

    return
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.add_slider = function(opt_in) {
    let main_div = opt_in.main_div
    let top_div_id = opt_in.top_div_id
    let slider_id = opt_in.slider_id
    let slider_type = opt_in.slider_type
    let input_text = opt_in.input_text
    let tooltip = opt_in.tooltip
    // let hover_ranges = opt_in.hover_ranges

    let top_div = main_div.appendChild(
        document.createElement('div')
    )
    top_div.id = top_div_id

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    let slider = top_div.appendChild(
        document.createElement('input')
    )
    slider.classList.add('slider')
    slider.type = slider_type
    slider.id = slider_id
    slider.step = 1
    slider.min = 0
    slider.max = 1
    slider.value = 0

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    if (is_def(input_text)) {
        let text_id = input_text.id
        let text_size = input_text.size
        let is_before = input_text.is_before

        let text_container
        if (is_before) {
            text_container = main_div.insertBefore(
                document.createElement('a'), top_div
            )
        }
        else {
            text_container = top_div.appendChild(
                document.createElement('a')
            )
        }
        text_container.classList.add('slider-text')

        let text = text_container.appendChild(
            document.createElement('input')
        )
        text.classList.add('slider-text-input')
        text.type = 'text'
        text.id = text_id
        text.size = text_size
        text.value = slider.value
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    // if (is_def(hover_ranges)) {
    //     // let tooltip_text = tooltip.text
    //     // let class_list = tooltip.class_list

    //     top_div.classList.add('tooltip')

    //     let range_min = top_div.appendChild(
    //         document.createElement('span')
    //     )
    //     range_min.classList.add('tooltip-text')
    //     // range_min.classList.add(class_list)
    //     range_min.classList.add('tooltip-bottom-left')
    //     range_min.innerHTML = slider.min

    //     let range_max = top_div.appendChild(
    //         document.createElement('span')
    //     )
    //     range_max.classList.add('tooltip-text')
    //     range_max.classList.add('tooltip-bottom-left')
    //     range_max.innerHTML = slider.max
    // }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    if (is_def(tooltip)) {
        let tooltip_text = tooltip.text
        let class_list = tooltip.class_list

        top_div.classList.add('tooltip')
        let span = top_div.appendChild(
            document.createElement('span')
        )
        span.classList.add('tooltip-text')
        $.each(class_list, function(_, cls) {
            span.classList.add(cls)
        })
        span.innerHTML = tooltip_text
    }

    return
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.add_flex_line = function(opt_in) {
    let main_div = opt_in.main_div

    let div_top = main_div.appendChild(
        document.createElement('div')
    )
    div_top.classList.add('floating-div-content-line')

    let div_left = div_top.appendChild(
        document.createElement('div')
    )
    div_left.classList.add('floating-div-content-line')

    let div_flex = div_top.appendChild(
        document.createElement('div')
    )
    div_flex.classList.add('flex_ele')

    let div_right = div_top.appendChild(
        document.createElement('div')
    )
    div_right.classList.add('floating-div-content-line')

    return {
        div_top: div_top,
        div_left: div_left,
        div_right: div_right,
    }
}

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.add_accordion_div = function(opt_in) {
    let main_div = opt_in.main_div
    let is_open = opt_in.is_open
    let title_text = opt_in.title_text

    let top_div = main_div.appendChild(
        document.createElement('div')
    )
    top_div.classList.add('floating-div-content')

    let title_div = top_div.appendChild(
        document.createElement('div')
    )
    title_div.style = 'display: flex;'

    let content_div = top_div.appendChild(
        document.createElement('div')
    )

    let title_div_tog = title_div.appendChild(
        document.createElement('div')
    )

    function tog_click(opt_in) {
        let main_div = opt_in.main_div
        let tog_icon = opt_in.tog_icon
        let is_open_now = true

        let tog_icon_i = tog_icon.appendChild(
            document.createElement('i')
        )
        tog_icon_i.classList.add('fa')
        tog_icon_i.classList.add('fa-chevron-down')
        // tog_icon_i.classList.add('fa-circle-button')

        tog_icon.style = (
            'flex: 0 0 '
            + (2 * tog_icon_i.scrollWidth)
            + 'px; text-align: left;'
        )

        main_div.style.WebkitTransition = 'all .3s ease-out'
        main_div.style.MozTransition = 'all .3s ease-out'
        main_div.style.transition = 'all .3s ease-out'
        main_div.style.overflow = 'hidden'
        main_div.style.maxHeight = main_div.scrollHeight + 'px'
        tog_icon_i.style = 'padding-top: 3px;'

        function tog_func() {
            if (is_open_now) {
                main_div.style.maxHeight = 0
                tog_icon_i.classList.add('fa-chevron-right')
                tog_icon_i.classList.remove('fa-chevron-down')
            }
            else {
                main_div.style.maxHeight = main_div.scrollHeight + 'px'
                tog_icon_i.classList.add('fa-chevron-down')
                tog_icon_i.classList.remove('fa-chevron-right')
            }
            is_open_now = !is_open_now
            return
        }

        return tog_func
    }
    let click_func = tog_click({
        main_div: content_div,
        tog_icon: title_div_tog,
    })
    title_div.onclick = click_func
    click_func()

    if (is_open) {
        setTimeout(function() {
            click_func()
        }, times.wait_loop)
    }

    if (is_def(title_text)) {
        let title = title_div.appendChild(
            document.createElement('span')
        )
        title.innerHTML = title_text
        title.classList.add('floating-div-title')
        title.style += 'flex: 1;'
    }

    let output = {
        title_div: title_div,
        content_div: content_div,
    }
    return output
}

// window.raDecToLongLat = function (data_in) {
//   return [hmsToDeg(data_in[0]), dms_deg(data_in[1])]
// }
// let hmsToDeg = window.hmsToDeg

// window.longLatToRaDec = function (data_in) {
//   return [deg_hms(data_in[0]), deg_dms(data_in[1])]
// }

// ------------------------------------------------------------------

// // ===================================================================================================
// // ------------------------------------------------------------------
// // register a div to listen to zooming on the condition dfined by intgrCondFunc, and trigger
// // the function exeFunc with an on off (+-1) argument if zooming in or out
// // ------------------------------------------------------------------
// function setZoomList(target_div,exeFunc,intgrCondFunc) {
//   let timeWheel  = 100;
//   let countWheel = 0;
//   let prevWheel  = -1;
//   let wheelEvt   = ('onwheel' in document) ? 'wheel' : (('onmousewheel' in document) ? 'mousewheel' : 'DOMMouseScroll');

//   // call a function on wheelEvt, and return false in order to disables the normal scrolling behaviour
//   $("#"+target_div).on(wheelEvt,function() {
//     if(intgrCondFunc()) { //!isMouseMoving
//       doIntMouse();
//       return false;
//     }
//   });

//   // ------------------------------------------------------------------
//   // integrate the change in the mouse wheel over a continuous time period, sampled every timeWheel
//   // ------------------------------------------------------------------
//   let checkSetZoom = setInterval(function(){ checkSetZoomFunc(); }, timeWheel);

//   function checkSetZoomFunc() {
//     if(prevWheel < 0) return;

//     let time_dif = get_time_now_msec() - prevWheel;
//     if(time_dif > timeWheel) {
//       exeFunc( ((countWheel > 0) ? 1 : -1) );

//       countWheel =  0;
//       prevWheel  = -1;
//     }
//     return;
//   }

//   // ------------------------------------------------------------------
//   // add to the countWheel counter - integrates the mouse scroling over a period of up to timeWheel
//   // ------------------------------------------------------------------
//   function doIntMouse(){
//     countWheel += (event.detail<0) ? 1 : (event.wheelDelta>0) ? 1 : -1;;
//     prevWheel   = get_time_now_msec();
//     return;
//   };

//   // keep track of mouse movement - [isMouseMoving -> false] if there is no movement for at least mouseMinStop
//   // ------------------------------------------------------------------
//   // let mouseMinStop  = 500, isMouseMoving = false;
//   // $('body').onEnd('mousemove', function(e) { isMouseMoving = false; }, mouseMinStop);
//   // $('body').on   ('mousemove', function(e) { isMouseMoving = true;  }              );
// }
// // ===================================================================================================
// // ------------------------------------------------------------------
// // prevent focused (pressed) buttons from staying focused
// // ------------------------------------------------------------------
// $(".btn").hover(function(){
//     $(this).blur();
// })

// // ------------------------------------------------------------------
// // add a linear gradiant which may be used for filling stuff
// // see: http://dev.mikamai.com/post/86583300944/using-svg-gradient-masks-with-d3js
// // example:
// //       let optGrad        = {};
// //       optGrad.d3G     = d3G;
// //       optGrad.gradTag = "maskGrad";
// //       optGrad.gradXY  = {'x1':'0', 'x2':'1', 'y1':'0', 'y2':'0'};
// //       optGrad.grad_01  = {'start':'70%', 'end':'100%'};
// //       addLinGrad(optGrad);
// //       mask.enter().append("mask").attr("id", function(d){ return maskId(d); })
// //                   .append("rect").style({"fill":"url(#"+gradTag+")", "x":"0", "y":(-txtH), "width":(txtW*0.9), "height":(txtH*2)})
// // ------------------------------------------------------------------

// function addLinGrad(opt_in) {
//   let d3G     = opt_in.d3G;
//   let gradTag = opt_in.gradTag;
//   let gradXY  = opt_in.gradXY;
//   let grad_01  = opt_in.grad_01;

//   if(d3G.selectAll("linearGradient."+gradTag)[0].length != 0) return;

//   if(d3G.selectAll("defs")[0].length == 0) d3G.append("defs");

//   d3G.selectAll("defs").append("linearGradient")
//                        .attr("id", gradTag).attr(gradXY)
//                        .classed(gradTag,true) // class not really defined; just used for removal selection
//                        // .each(function(d){ d.linearGradientId = gradTag; })
//                        .call(function(grad) {
//                          if(grad_01["-1"]) grad.append("stop").attr({'offset':grad_01["-1"], "stop-color":"white", "stop-opacity":"0"});
//                          if(grad_01["0"])  grad.append("stop").attr({'offset':grad_01["0"],  "stop-color":"white", "stop-opacity":"1"});
//                          if(grad_01["1"])  grad.append("stop").attr({'offset':grad_01["1"],  "stop-color":"white", "stop-opacity":"0"});
//                        });

//   // d3G .append('defs')
//   //     .call(function(defs) {
//   //       defs.append('linearGradient')
//   //           .attr('id', gradTag).attr(gradXY)
//   //           .call(function(grad) {
//   //             if(grad_01["-1"]) grad.append('stop').attr({'offset':grad_01["-1"], 'stop-color':'white', 'stop-opacity':'0'});
//   //             if(grad_01["0"])  grad.append('stop').attr({'offset':grad_01["0"],  'stop-color':'white', 'stop-opacity':'1'});
//   //             if(grad_01["1"])  grad.append('stop').attr({'offset':grad_01["1"],  'stop-color':'white', 'stop-opacity':'0'});
//   //           });
//   //     });
//   // console.log('1',d3G.selectAll('linearGradient'),d3G.selectAll('linearGradient.tbl0_M_13maskGradId') )

// }
// function rmLinGrad(opt_in) {
//   let d3G     = opt_in.d3G;
//   let gradTag = opt_in.gradTag;

//   setTimeout(function () { d3G.selectAll("linearGradient."+gradTag).remove(); }, times.anim*2);
// }
