'use strict'
// ------------------------------------------------------------------
// -------------------------------------------------------------------
/* global $ */
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
        has_drawer: false,
    })

    sock.add_widget({
        name_tag: 'ArrZoomerView',
        table_title: 'Telescope health',
        has_icon: true,
        has_drawer: true,
    })

    // // sock.add_widget({
    // //   name_tag: 'azPlots',
    // //   table_title: 'Telescope health plots',
    // //   has_icon: true,
    // //   has_drawer: false
    // // })

    sock.add_widget({
        name_tag: 'SubArrGrp',
        table_title: 'Sub-array pointings',
        has_icon: true,
        has_drawer: false,
    })

    // sock.add_widget({
    //   name_tag: 'NightSched',
    //   table_title: 'Nightly Schedule',
    //   has_icon: true,
    //   has_drawer: false
    // })

    sock.add_widget({
        name_tag: 'SchedBlockController',
        table_title: 'Scheduling blocks inspector',
        has_icon: true,
        has_drawer: false,
    })

    sock.add_widget({
        name_tag: 'SchedBlockInspector',
        table_title: 'Scheduling Blocks Inspector',
        has_icon: true,
        has_drawer: false,
    })

    sock.add_widget({
        name_tag: 'SchedBlocks',
        table_title: 'Observing blocks',
        has_icon: true,
        has_drawer: false,
    })

    sock.add_widget({
        name_tag: 'PlotsDash',
        table_title: 'plots Dashboard',
        has_icon: true,
        has_drawer: false,
    })

    sock.add_widget({
        name_tag: 'WeatherMonitoring',
        table_title: 'Weather Monitoring',
        has_icon: true,
        has_drawer: false,
    })

    sock.add_widget({
        name_tag: 'EmptyExample',
        table_title: 'empty_example',
        has_icon: true,
        has_drawer: false,
    })
}

// -------------------------------------------------------------------
// ArrZoomerView
// -------------------------------------------------------------------
setup_view.view200 = function() {
    sock.add_widget({
        name_tag: 'ArrZoomerView',
        table_title: 'Telescope health',
        has_icon: true,
        has_drawer: true,
    })
    // sock.add_widget({
    //   name_tag: 'azPlots',
    //   table_title: 'Telescope health plots',
    //   has_icon: true,
    //   has_drawer: false
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
        has_drawer: false,
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
        has_drawer: false,
    })
}

// -------------------------------------------------------------------
// PanelSync
// -------------------------------------------------------------------
setup_view.view203 = function() {
    sock.add_widget({
      name_tag:"ObsBlockControl", table_title:"Scheduling Block Control", has_icon:true, has_drawer:false
    })
    sock.add_widget({
        name_tag: 'PanelSync',
        table_title: 'Panel synchronization',
        has_icon: false,
        has_drawer: false,
    })

}

// -------------------------------------------------------------------
// SchedBlocks
// -------------------------------------------------------------------
setup_view.view204 = function() {
    sock.add_widget({
        name_tag: 'SchedBlocks',
        table_title: 'Observing blocks',
        has_icon: true,
        has_drawer: false,
    })
    // sock.add_widget({
    //   name_tag:"ObsBlockControl", table_title:"Scheduling Block Control", has_icon:true, has_drawer:false
    // });
    // sock.add_widget({
    //   name_tag:"NightSched", table_title:"Nightly Schedule", has_icon:true, has_drawer:false
    // })
    // sock.add_widget({
    //   name_tag:"SchedBlocks", table_title:"Observing blocks", has_icon:true, has_drawer:false
    // });
    // sock.add_widget({
    //   name_tag:"SchedBlocks", table_title:"Observing blocks", has_icon:true, has_drawer:false
    // });
    // sock.add_widget({
    //   name_tag:"SchedBlocks", table_title:"Observing blocks", has_icon:true, has_drawer:false
    // });
}

// -------------------------------------------------------------------
// night_sched
// -------------------------------------------------------------------
setup_view.view205 = function() {
    sock.add_widget({
        name_tag: 'NightSched',
        table_title: 'Nightly Schedule',
        has_icon: true,
        has_drawer: false,
    })
}

setup_view.view2051 = function() {
    sock.add_widget({
        name_tag: 'CommentSched',
        table_title: 'Comment Night Schedule',
        has_icon: true,
        has_drawer: false,
    })
}

// -------------------------------------------------------------------
// ObsBlockControl
// -------------------------------------------------------------------
setup_view.view206 = function() {
    sock.add_widget({
        name_tag: 'SchedBlockController',
        table_title: 'Scheduling blocks inspector',
        has_icon: true,
        has_drawer: false,
    })
    sock.add_widget({
        name_tag: 'SchedBlockInspector',
        table_title: 'Scheduling blocks controller',
        has_icon: false,
        has_drawer: true,
    })
}

setup_view.view207 = function() {
    sock.add_widget({
        name_tag: 'WeatherMonitoring',
        table_title: 'Weather Monitoring',
        has_icon: true,
        has_drawer: false,
    })
}

// -------------------------------------------------------------------
// empty_example
// -------------------------------------------------------------------
setup_view.view000 = function() {
    // sock.add_widget({
    //   name_tag: 'MyTestExample',
    //   table_title: 'myTestExample',
    //   has_icon: true,
    //   has_drawer: false
    // })

    sock.add_widget({
        name_tag: 'EmptyExample',
        table_title: 'empty_example',
        has_icon: true,
        has_drawer: false,
    })
}

// -------------------------------------------------------------------
// refresh all other views on a refresh of this particular view
// -------------------------------------------------------------------
setup_view.view_refresh_all = function() {
    sock.socket.emit('refreshAll')
}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// here we go...
// -------------------------------------------------------------------
$.getScript('/js/utils/common.js', function() {
    $.getScript('/js/utils/SocketManager.js', function() {
        sock.setup_socket()
    })
})
// -------------------------------------------------------------------
// -------------------------------------------------------------------
