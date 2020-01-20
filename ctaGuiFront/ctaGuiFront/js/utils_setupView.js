'use strict'
// ---------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------
/* global $ */
/* global sock */
/* global setupView */

window.setupView = {}

// -----------------------------------------------------------------------------------------------------------
// development
// -----------------------------------------------------------------------------------------------------------
// window.debugWidgetTitle = true;
setupView.view102 = function () {
  sock.addWidget({
    nameTag: 'panelSync',
    tableTitle: 'Panel synchronization',
    hasIcon: false,
    hasDrawer: false
  })

  sock.addWidget({
    nameTag: 'arrZoomer',
    tableTitle: 'Telescope health',
    hasIcon: true,
    hasDrawer: true
  })

  // // sock.addWidget({
  // //   nameTag: 'azPlots',
  // //   tableTitle: 'Telescope health plots',
  // //   hasIcon: true,
  // //   hasDrawer: false
  // // })

  sock.addWidget({
    nameTag: 'subArrGrp',
    tableTitle: 'Sub-array pointings',
    hasIcon: true,
    hasDrawer: false
  })

  sock.addWidget({
    nameTag: 'nightSched',
    tableTitle: 'Nightly Schedule',
    hasIcon: true,
    hasDrawer: false
  })

  sock.addWidget({
    nameTag: 'schedBlocksController',
    tableTitle: 'Scheduling Blocks Controller',
    hasIcon: true,
    hasDrawer: false
  })

  sock.addWidget({
    nameTag: 'schedBlocks',
    tableTitle: 'Observing blocks',
    hasIcon: true,
    hasDrawer: false
  })

  sock.addWidget({
    nameTag: 'emptyExample',
    tableTitle: 'emptyExample',
    hasIcon: true,
    hasDrawer: false
  })

}

// -----------------------------------------------------------------------------------------------------------
// arrZoomer
// -----------------------------------------------------------------------------------------------------------
setupView.view200 = function () {
  sock.addWidget({
    nameTag: 'arrZoomer',
    tableTitle: 'Telescope health',
    hasIcon: true,
    hasDrawer: true
  })
  // sock.addWidget({
  //   nameTag: 'azPlots',
  //   tableTitle: 'Telescope health plots',
  //   hasIcon: true,
  //   hasDrawer: false
  // })
}

// -----------------------------------------------------------------------------------------------------------
// array zoomer plots
// -----------------------------------------------------------------------------------------------------------
setupView.view201 = function () {
  sock.addWidget({
    nameTag: 'plotsDash',
    tableTitle: 'Plots Dashboard',
    hasIcon: true,
    hasDrawer: false
  })
}

// -----------------------------------------------------------------------------------------------------------
// subArrGrp
// -----------------------------------------------------------------------------------------------------------
setupView.view202 = function () {
  sock.addWidget({
    nameTag: 'subArrGrp',
    tableTitle: 'Sub-array pointings',
    hasIcon: true,
    hasDrawer: false
  })
}

// -----------------------------------------------------------------------------------------------------------
// panelSync
// -----------------------------------------------------------------------------------------------------------
setupView.view203 = function () {
  sock.addWidget({
    nameTag: 'panelSync',
    tableTitle: 'Panel synchronization',
    hasIcon: false,
    hasDrawer: false
  })
}

// -----------------------------------------------------------------------------------------------------------
// schedBlocks
// -----------------------------------------------------------------------------------------------------------
setupView.view204 = function () {
  sock.addWidget({
    nameTag: 'schedBlocks',
    tableTitle: 'Observing blocks',
    hasIcon: true,
    hasDrawer: false
  })
  // sock.addWidget({
  //   nameTag:"obsBlockControl", tableTitle:"Scheduling Block Control", hasIcon:true, hasDrawer:false
  // });
  // sock.addWidget({
  //   nameTag:"nightSched", tableTitle:"Nightly Schedule", hasIcon:true, hasDrawer:false
  // })
  // sock.addWidget({
  //   nameTag:"schedBlocks", tableTitle:"Observing blocks", hasIcon:true, hasDrawer:false
  // });
  // sock.addWidget({
  //   nameTag:"schedBlocks", tableTitle:"Observing blocks", hasIcon:true, hasDrawer:false
  // });
  // sock.addWidget({
  //   nameTag:"schedBlocks", tableTitle:"Observing blocks", hasIcon:true, hasDrawer:false
  // });
}

// -----------------------------------------------------------------------------------------------------------
// nightSched
// -----------------------------------------------------------------------------------------------------------
setupView.view205 = function () {
  sock.addWidget({
    nameTag: 'nightSched',
    tableTitle: 'Nightly Schedule',
    hasIcon: true,
    hasDrawer: false
  })
}

setupView.view2051 = function () {
  sock.addWidget({
    nameTag: 'commentNightSched',
    tableTitle: 'Comment Night Schedule',
    hasIcon: true,
    hasDrawer: false
  })
}

// -----------------------------------------------------------------------------------------------------------
// obsBlockControl
// -----------------------------------------------------------------------------------------------------------
setupView.view206 = function () {
  // sock.addWidget({
  //   nameTag: 'schedBlocksController',
  //   tableTitle: 'Scheduling blocks inspector',
  //   hasIcon: true,
  //   hasDrawer: false
  // })
  sock.addWidget({
    nameTag: 'schedBlocksInspector',
    tableTitle: 'Scheduling blocks controller',
    hasIcon: false,
    hasDrawer: true
  })
}

setupView.view207 = function () {
  sock.addWidget({
    nameTag: 'weatherMonitoring',
    tableTitle: 'Weather Monitoring',
    hasIcon: true,
    hasDrawer: false
  })
}

// -----------------------------------------------------------------------------------------------------------
// emptyExample
// -----------------------------------------------------------------------------------------------------------
setupView.view000 = function () {
  // sock.addWidget({
  //   nameTag: 'myTestExample',
  //   tableTitle: 'myTestExample',
  //   hasIcon: true,
  //   hasDrawer: false
  // })

  sock.addWidget({
    nameTag: 'emptyExample',
    tableTitle: 'emptyExample',
    hasIcon: true,
    hasDrawer: false
  })
}

// -----------------------------------------------------------------------------------------------------------
// refresh all other views on a refresh of this particular view
// -----------------------------------------------------------------------------------------------------------
setupView.viewRefreshAll = function () {
  sock.socket.emit('refreshAll')
}

// -----------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------
// here we go...
// -----------------------------------------------------------------------------------------------------------
$.getScript('/js/utils_common.js', function () {
  $.getScript('/js/utils_socketManager.js', function () {
    sock.setupSocket()
  })
})
// -----------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------
