// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
// window.loadScript({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global deepCopy */

window.ClockEvents = function () {
  let com = {}
  com.futurEvents = []
  com.timelineEvents = []
  com.popupEvents = []
  com.pastEvents = []

  // to init
  com.maxPopups = 3

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function init (optIn) {
    com.g = optIn.g
    com.box = optIn.box

    com.g.attr('transform', 'translate(' + com.box.x + ',' + com.box.y + ')')
    com.g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', com.box.width)
      .attr('height', com.box.height)
      .attr('fill', optIn.background)

    com.axis = {}
    com.axis.scaleX = d3.scaleTime().range([0, com.box.width * 0.8]).domain([])
    com.axis.translate = 'translate(' + com.box.width * 0.1 + ',' + com.box.height * 0.62 + ')'
    com.axis.bottom = d3.axisBottom(com.axis.scaleX).tickSize(6)
    com.axis.axisG = com.g
      .append('g')
      .attr('class', 'axisX')
      .attr('transform', com.axis.translate)
      .call(com.axis.bottom)
    com.axis.axisG.select('path').attr('stroke-width', 2).attr('stroke', '#CFD8DC')

    com.eventG = com.g.append('g').attr('transform', com.axis.translate)

    com.shrinkButton = com.g.append('g')
      .attr('transform', 'translate(' + ((com.box.width * 0.9)) + ',' + 0 + ')')
    com.shrinkButton.append('rect')
      .attr('x', 0)
      .attr('y', com.box.height * 0.2)
      .attr('width', com.box.width * 0.1)
      .attr('height', com.box.height * 0.8)
      .attr('fill', '#263238')
      .attr('stroke', '#CFD8DC')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', [(com.box.width * 0.1), (com.box.height * 0.8) + (com.box.width * 0.1), (com.box.height * 0.8)])
    // com.shrinkButton.append('rect')
    //   .attr('x', -12)
    //   .attr('y', -(com.box.height * 0.62))
    //   .attr('width', com.box.width * 0.1)
    //   .attr('height', com.box.height)
    //   .attr('fill', '#263238')
    // com.shrinkButton.append('circle')
    //   .attr('cx', 0)
    //   .attr('cy', 0)
    //   .attr('r', 12)
    //   .attr('stroke', '#000000')
    //   .attr('stroke-width', 0.2)
    //   .attr('fill', '#263238')
    // com.shrinkButton.append('rect')
    //   .attr('x', 0)
    //   .attr('y', -12)
    //   .attr('height', 24)
    //   .attr('width', 60)
    //   .attr('stroke', '#000000')
    //   .attr('stroke-width', 0.2)
    //   .attr('fill', '#37474F')
    //   .attr('stroke-dasharray', [(60) * 2 + 24, 24])
    //   .on('mouseover', drawFuturEvents)
    //   .on('mouseout', function () {
    //     com.futurEventsG.selectAll('*').remove()
    //   })
    // com.shrinkButton.append('line')
    //   .attr('x1', 6 - 3 - 2)
    //   .attr('y1', -6)
    //   .attr('x2', 1 - 4 - 2)
    //   .attr('y2', 1)
    //   .attr('stroke', '#CFD8DC')
    //   .attr('stroke-width', 3)
    // com.shrinkButton.append('line')
    //   .attr('x1', 6 - 3 - 2)
    //   .attr('y1', 6)
    //   .attr('x2', 1 - 4 - 2)
    //   .attr('y2', -1)
    //   .attr('stroke', '#CFD8DC')
    //   .attr('stroke-width', 3)
    // com.shrinkButton.append('text')
    //   .attr('class', 'futurEvent')
    //   .text('+0')
    //   .attr('x', 30)
    //   .attr('y', 0)
    //   .style('font-weight', 'normal')
    //   .attr('text-anchor', 'middle')
    //   .style('font-size', com.box.height * 0.4)
    //   .attr('dy', com.box.height * 0.16)
    //   .style('pointer-events', 'none')
    //   .style('user-select', 'none')

    // com.moreEvent = com.g.append('g')
    //   .attr('transform', 'translate(' + ((com.box.width * 0.965)) + ',' + (com.box.height * 0.62) + ')')
    // com.moreEvent.append('circle')
    //   .attr('cx', 0)
    //   .attr('cy', 0)
    //   .attr('r', 12)
    //   .attr('stroke', 'none')
    //   .attr('fill', 'none')

    com.futurEventsG = com.g.append('g')
      .attr('transform', 'translate(' + ((com.box.width * 0.9) - 2) + ',' + (com.box.height * 0.62 - 12) + ')')

    com.g.append('rect')
      .attr('x', 0)
      .attr('y', com.box.height * 0.2)
      .attr('width', com.box.width * 0.1)
      .attr('height', com.box.height * 0.8)
      .attr('fill', '#263238')
      .attr('stroke', '#CFD8DC')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', [(com.box.width * 0.1) + (com.box.height * 0.8), (com.box.width * 0.1) + (com.box.height * 0.8)])

    com.g.append('text')
      .attr('class', 'currentHour')
      .attr('stroke', '#CFD8DC')
      .attr('fill', '#CFD8DC')
      .attr('x', com.box.width * 0.045)
      .attr('y', com.box.height * 0.7)
      .style('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .style('font-size', com.box.height * 0.5)
      .attr('dy', com.box.height * 0.12)
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    com.popup = com.g.append('g')
      .attr('transform', 'translate(0,' + com.box.height * 0.2 + ')')

  }
  this.init = init

  function setHour (date) {
    com.currentDate = date
    com.limitDate = new Date(date.getTime()).setMinutes(date.getMinutes() + 5)
    com.g.select('text.currentHour')
      .text(com.currentDate.getHours() + ' : ' + (com.currentDate.getMinutes() < 10 ? ('0' + com.currentDate.getMinutes()) : com.currentDate.getMinutes()))

    com.axis.scaleX.domain([com.currentDate, com.limitDate])
    com.axis.bottom.scale(com.axis.scaleX)
    com.axis.axisG
    //    .transition()
    //   .ease(d3.easeLinear)
    //   .duration(function () {
    //     if (!com.prevSetHour) {
    //       com.prevSetHour = Date.now()
    //       return 0
    //     }
    //     else {
    //       let duration = Date.now() - com.prevSetHour
    //       com.prevSetHour = Date.now()
    //       return duration
    //     }
    //   })
      .call(com.axis.bottom)
    com.axis.axisG.selectAll('g.tick').selectAll('line').attr('stroke-width', 2).attr('stroke', '#CFD8DC')
    com.axis.axisG.selectAll('g.tick').selectAll('text').style('font-size', com.box.height * 0.26).attr('stroke', '#CFD8DC').attr('fill', '#CFD8DC')

    drawEvents()
  }
  this.setHour = setHour

  function drawEvents () {
    for (let i = com.futurEvents.length - 1; i >= 0; i--) {
      if (com.futurEvents[i].startTime < com.limitDate) com.timelineEvents.push(com.futurEvents.splice(i, 1)[0])
    }
    com.shrinkButton.select('text.futurEvent').text('+' + com.futurEvents.length)

    for (let i = com.timelineEvents.length - 1; i >= 0; i--) {
      if (com.timelineEvents[i].startTime < com.currentDate) com.popupEvents.push(com.timelineEvents.splice(i, 1)[0])
    }
    drawTimelineEvents()

    for (let i = com.popupEvents.length - 1; i >= 0; i--) {
      if (com.popupEvents[i].endTime < com.currentDate) com.pastEvents.push(com.popupEvents.splice(i, 1)[0])
    }
    drawPopupEvents()
  }

  function addEvent (newEvent) {
    if (newEvent.startTime > com.limitDate) {
      com.futurEvents.push(newEvent)
    } else if (newEvent.startTime > com.currentDate) {
      com.timelineEvents.push(newEvent)
    } else if (newEvent.endTime > com.currentDate) {
      com.popupEvents.push(newEvent)
    } else {
      com.pastEvents.push(newEvent)
    }
    drawEvents()
  }
  this.addEvent = addEvent

  function drawFuturEvents () {
    let eventGroup = com.futurEventsG
      .selectAll('g.futurEvent')
      .data(com.futurEvents, function (d, i) {
        return d.id
      })

    let enterG = eventGroup
      .enter()
      .append('g')
      .attr('class', 'popupEvent')
      .attr('transform', function (d, i) {
        return 'translate(0,' + -35 * (i + 1) + ')'
      })
    enterG.append('rect')
      .attr('class', 'back')
      .attr('x', 5)
      .attr('y', 0)
      .attr('width', com.box.width * 0.1 - 10)
      .attr('height', 33)
      .attr('stroke', 'none')
      .style('fill', function (d, i) {
        return '#eeeeee'
      })
      .attr('vector-effect', 'non-scaling-stroke')
    // enterG.append('rect')
    //   .attr('class', 'icon')
    //   .attr('x', function (d, i) {
    //     return (com.axis.scaleX(d.endTime) + com.axis.scaleX(d.startTime)) * 0.5 - 5
    //   })
    //   .attr('y', function (d, i) {
    //     return -30
    //   })
    //   .attr('width', function (d, i) {
    //     return 10
    //   })
    //   .attr('height', function (d, i) {
    //     return 10
    //   })
    //   .attr('stroke', 'black')
    //   .attr('stroke-width', 1)
    //   .style('fill', function (d, i) {
    //     return 'red'
    //   })
    //   .attr('vector-effect', 'non-scaling-stroke')

    let mergedG = enterG.merge(eventGroup)
    mergedG.attr('transform', function (d, i) {
      return 'translate(0,' + -35 * (i + 1) + ')'
    })
    // mergedG.selectAll('rect.icon')
    //   .attr('x', function (d, i) {
    //     return (com.axis.scaleX(d.endTime) + com.axis.scaleX(d.startTime)) * 0.5 - 5
    //   })
    //   .attr('y', function (d, i) {
    //     return -30
    //   })

    eventGroup
      .exit()
      .remove()
  }

  function drawPopupEvents () {
    let eventGroup = com.popup
      .selectAll('g.popupEvent')
      .data(com.popupEvents, function (d, i) {
        return d.id
      })

    let enterG = eventGroup
      .enter()
      .append('g')
      .attr('class', 'popupEvent')
      .attr('transform', function (d, i) {
        return 'translate(0,' + -35 * (i + 1) + ')'
      })
    enterG.append('rect')
      .attr('class', 'back')
      .attr('x', 5)
      .attr('y', 0)
      .attr('width', com.box.width * 0.1 - 5)
      .attr('height', 33)
      .attr('stroke', 'none')
      .style('fill', function (d, i) {
        return '#eeeeee'
      })
      .attr('vector-effect', 'non-scaling-stroke')
    // enterG.append('rect')
    //   .attr('class', 'icon')
    //   .attr('x', function (d, i) {
    //     return (com.axis.scaleX(d.endTime) + com.axis.scaleX(d.startTime)) * 0.5 - 5
    //   })
    //   .attr('y', function (d, i) {
    //     return -30
    //   })
    //   .attr('width', function (d, i) {
    //     return 10
    //   })
    //   .attr('height', function (d, i) {
    //     return 10
    //   })
    //   .attr('stroke', 'black')
    //   .attr('stroke-width', 1)
    //   .style('fill', function (d, i) {
    //     return 'red'
    //   })
    //   .attr('vector-effect', 'non-scaling-stroke')

    let mergedG = enterG.merge(eventGroup)
    mergedG.attr('transform', function (d, i) {
      return 'translate(0,' + -35 * (i + 1) + ')'
    })
    // mergedG.selectAll('rect.icon')
    //   .attr('x', function (d, i) {
    //     return (com.axis.scaleX(d.endTime) + com.axis.scaleX(d.startTime)) * 0.5 - 5
    //   })
    //   .attr('y', function (d, i) {
    //     return -30
    //   })

    eventGroup
      .exit()
      .remove()
  }

  function drawTimelineEvents () {
    console.log('NEW', com.currentDate)
    let eventGroup = com.eventG
      .selectAll('g.timelineEvent')
      .data(com.timelineEvents, function (d, i) {
        console.log(d);
        return d.id
      })

    let enterG = eventGroup
      .enter()
      .append('g')
      .attr('class', 'timelineEvent')
    enterG.append('text')
      .text(function (d) {
        return new Date(d.startTime).getHours() + ':' + new Date(d.startTime).getMinutes()
      })
      .attr('class', 'area')
      .attr('x', function (d, i) {
        return com.axis.scaleX(d.startTime)
      })
      .attr('y', function (d, i) {
        return -2
      })
      .attr('stroke', '#CFD8DC')
      .attr('fill', '#CFD8DC')
      .attr('text-anchor', 'middle')
      .style('font-size', com.box.height * 0.22)
      .style('pointer-events', 'none')
      .style('user-select', 'none')
    enterG.append('svg:image')
      .attr('class', 'icon')
      .attr('xlink:href', '/static/moon.svg')
      .attr('width', 30)
      .attr('height', 30)
      .attr('x', function (d, i) {
        return com.axis.scaleX(d.startTime) - 15
      })
      .attr('y', function (d, i) {
        return -45
      })
    // enterG.append('rect')
    //   .attr('class', 'icon')
    //   .attr('x', function (d, i) {
    //     return com.axis.scaleX(d.startTime) - 15
    //   })
    //   .attr('y', function (d, i) {
    //     return -32
    //   })
    //   .attr('rx', 10)
    //   .attr('ry', 10)
    //   .attr('width', function (d, i) {
    //     return 30
    //   })
    //   .attr('height', function (d, i) {
    //     return 30
    //   })
    //   .attr('stroke', '#CFD8DC')
    //   .attr('stroke-width', 1)
    //   .style('fill', function (d, i) {
    //     return 'none'
    //   })
    //   .attr('stroke-dasharray', [0, 30 + 25, 5 + 30 + 5, 25])
    //   .attr('vector-effect', 'non-scaling-stroke')

    let mergedG = enterG.merge(eventGroup)
    mergedG.selectAll('text.area')
      .transition().duration(2000)
      .attr('x', function (d, i) {
        return com.axis.scaleX(d.startTime)
      })
    mergedG.selectAll('image.icon')
      .transition().duration(2000)
      .attr('x', function (d, i) {
        return com.axis.scaleX(d.startTime) - 15
      })

    eventGroup
      .exit()
      .remove()
  }
}
