'use strict'
// ------------------------------------------------------------------
// -------------------------------------------------------------------
/* global sock */
/* global setup_view */

window.setup_view = {
}

// -------------------------------------------------------------------
// development
// -------------------------------------------------------------------
// window.debugWidget_title = true;
setup_view.view102 = function() {
    sock.add_widget({
        name_tag: 'PanelSync',
        table_title: 'Panel synchronization',
        has_icon: false,
    })

    sock.add_widget({
        name_tag: 'ArrayZoomer',
        table_title: 'Telescope health',
        has_icon: true,
    })

    // // sock.add_widget({
    // //   name_tag: 'azPlots',
    // //   table_title: 'Telescope health plots',
    // //   has_icon: true,
    // // })

    sock.add_widget({
        name_tag: 'SubArrGrp',
        table_title: 'Sub-array pointings',
        has_icon: true,
    })

    // sock.add_widget({
    //   name_tag: 'NightSched',
    //   table_title: 'Nightly Schedule',
    //   has_icon: true,
    // })

    sock.add_widget({
        name_tag: 'SchedBlockController',
        table_title: 'Scheduling blocks inspector',
        has_icon: true,
    })

    sock.add_widget({
        name_tag: 'SchedBlockInspector',
        table_title: 'Scheduling Blocks Inspector',
        has_icon: true,
    })

    sock.add_widget({
        name_tag: 'SchedBlocks',
        table_title: 'Observing blocks',
        has_icon: true,
    })

    // sock.add_widget({
    //     name_tag: 'CommentSched',
    //     table_title: 'Comment Night Schedule',
    //     has_icon: true,
    // })

    sock.add_widget({
        name_tag: 'PlotsDash',
        table_title: 'plots Dashboard',
        has_icon: true,
    })

    console.log('bring back WeatherMonitoring...')
    if (false) {
        sock.add_widget({
            name_tag: 'WeatherMonitoring',
            table_title: 'Weather Monitoring',
            has_icon: true,
        })
    }

    sock.add_widget({
        name_tag: 'EmptyExample',
        table_title: 'empty_example',
        has_icon: true,
    })
}

// -------------------------------------------------------------------
// ArrayZoomer
// -------------------------------------------------------------------
setup_view.view200 = function() {
    sock.add_widget({
        name_tag: 'ArrayZoomer',
        table_title: 'Telescope health',
        has_icon: true,
    })

    // sock.add_widget({
    //     name_tag: 'ArrayZoomer',
    //     table_title: 'Telescope health',
    //     has_icon: true,
    // })
    
    // sock.add_widget({
    //     name_tag: 'EmptyExample',
    //     table_title: 'empty_example',
    //     has_icon: true,
    // })
}

// -------------------------------------------------------------------
// array zoomer plots
// -------------------------------------------------------------------
setup_view.view201 = function() {
    sock.add_widget({
        name_tag: 'PlotsDash',
        table_title: 'Plots Dashboard',
        has_icon: true,
    })
}

// -------------------------------------------------------------------
// SubArrGrp
// -------------------------------------------------------------------
setup_view.view202 = function() {
    sock.add_widget({
        name_tag: 'SubArrGrp',
        table_title: 'Sub-array pointings',
        has_icon: true,
    })
}

// -------------------------------------------------------------------
// PanelSync
// -------------------------------------------------------------------
setup_view.view203 = function() {
    sock.add_widget({
        name_tag: 'PanelSync',
        table_title: 'Panel synchronization',
        has_icon: false,
    })

    // sock.add_widget({
    //     name_tag: 'PanelSync',
    //     table_title: 'Panel synchronization',
    //     has_icon: false,
    // })
}

// -------------------------------------------------------------------
// SchedBlocks
// -------------------------------------------------------------------
setup_view.view204 = function() {
    sock.add_widget({
        name_tag: 'SchedBlocks',
        table_title: 'Observing blocks',
        has_icon: true,
    })
}

// -------------------------------------------------------------------
// night_sched
// -------------------------------------------------------------------
setup_view.view205 = function() {
    sock.add_widget({
        name_tag: 'CommentSched',
        table_title: 'Comment Night Schedule',
        has_icon: true,
    })
}

// -------------------------------------------------------------------
// ObsBlockControl
// -------------------------------------------------------------------
setup_view.view206 = function() {
    sock.add_widget({
        name_tag: 'SchedBlockController',
        table_title: 'Scheduling blocks controller',
        has_icon: true,
    })
    
    sock.add_widget({
        name_tag: 'SchedBlockInspector',
        table_title: 'Scheduling blocks inspector',
        has_icon: false,
    })
}

setup_view.view207 = function() {
    sock.add_widget({
        name_tag: 'WeatherMonitoring',
        table_title: 'Weather Monitoring',
        has_icon: true,
    })
}


// -------------------------------------------------------------------
// test load
// -------------------------------------------------------------------
setup_view.view001 = function() {
    let n_widgets = 10
    let name_tags = [
        'ArrayZoomer',
        // 'SubArrGrp',
        // 'SchedBlockController',
        // 'SchedBlockInspector',
        // 'SchedBlocks',
        // 'EmptyExample',
        // 'PanelSync',

        // 'PlotsDash',
        // 'WeatherMonitoring',
    ]

    $.each(name_tags, function(_, name_tag) {
        for (var i = 0; i < n_widgets; i++) {
            sock.add_widget({
                name_tag: name_tag,
                table_title: (name_tag + ' ' + (i + 1) + ' / ' + n_widgets),
                has_icon: true,
            })
        }
    })
}
// -------------------------------------------------------------------
// empty_example
// -------------------------------------------------------------------
setup_view.view000 = function() {
    sock.add_widget({
        name_tag: 'EmptyExample',
        table_title: 'empty_example 0',
        has_icon: true,
    })

    sock.add_widget({
        name_tag: 'EmptyExample',
        table_title: 'empty_example 1',
        has_icon: true,
    })
}


// -------------------------------------------------------------------
// corresponding to the README.md example for adding a new view
// -------------------------------------------------------------------
// setup_view.myNewView = function() {
//     sock.add_widget({
//         name_tag: 'TestExample',
//         table_title: 'TestExample 0',
//         has_icon: true,
//     })
// }

