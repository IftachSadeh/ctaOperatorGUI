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

    com.popup = com.g.append('g')
      .attr('transform', 'translate(0,' + com.box.height * 0.2 + ')')

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
      .attr('y', com.box.height * 0.19)
      .attr('width', com.box.width * 0.12)
      .attr('height', com.box.height * 0.8)
      .attr('fill', '#263238')
      .attr('stroke', '#CFD8DC')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', [(com.box.width * 0.12) + (com.box.height * 0.8), (com.box.width * 0.12) + (com.box.height * 0.8)])

    com.g.append('text')
      .attr('class', 'currentHour')
      .attr('stroke', '#CFD8DC')
      .attr('fill', '#CFD8DC')
      .attr('x', com.box.width * 0.06)
      .attr('y', com.box.height * 0.7)
      .style('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .style('font-size', com.box.height * 0.6)
      .attr('dy', com.box.height * 0.12)
      .style('pointer-events', 'none')
      .style('user-select', 'none')

  }
  this.init = init

  function setHour (date) {
    com.currentDate = date
    com.limitDate = new Date(date.getTime()).setHours(date.getHours() + 3)
    com.g.select('text.currentHour')
      .text(com.currentDate.getHours() + ' : ' + (com.currentDate.getMinutes() < 10 ? ('0' + com.currentDate.getMinutes()) : com.currentDate.getMinutes()))

    com.axis.scaleX.domain([com.currentDate, com.limitDate])
    com.axis.bottom.scale(com.axis.scaleX)
    com.axis.axisG
      .transition()
      .ease(d3.easeLinear)
      .duration(1000)
      .call(com.axis.bottom)
    com.axis.axisG.selectAll('g.tick').selectAll('line').attr('stroke-width', 2).attr('stroke', '#CFD8DC')
    com.axis.axisG.selectAll('g.tick').selectAll('text').style('font-size', com.box.height * 0.26).attr('stroke', '#CFD8DC').attr('fill', '#CFD8DC')

    drawEvents()
  }
  this.setHour = setHour

  function drawEvents () {
    for (let i = com.futurEvents.length - 1; i >= 0; i--) {
      if (new Date(com.futurEvents[i].start_date) < com.limitDate) com.timelineEvents.push(com.futurEvents.splice(i, 1)[0])
    }
    com.shrinkButton.select('text.futurEvent').text('+' + com.futurEvents.length)

    drawTimelineEvents()
    for (let i = com.timelineEvents.length - 1; i >= 0; i--) {
      if (new Date(com.timelineEvents[i].start_date) < com.currentDate) com.popupEvents.push(com.timelineEvents.splice(i, 1)[0])
    }

    drawPopupEvents()
    for (let i = com.popupEvents.length - 1; i >= 0; i--) {
      let d = new Date(com.popupEvents[i].endTime)
      if (!(d instanceof Date && !isNaN(d)) || new Date(com.popupEvents[i].endTime) < com.currentDate) {
        if (com.popupEvents[i].state === 'finished') com.pastEvents.push(com.popupEvents.splice(i, 1)[0])
      }
    }
  }

  function addInArray (array, object) {
    for (var i = 0; i < array.length; i++) {
      if (array[i].id === object.id) return
    }
    array.push(object)
  }

  function addEvent (events) {
    for (var i = 0; i < events.length; i++) {
      if (new Date(events[i].start_date) > com.limitDate) {
        addInArray(com.futurEvents, events[i])
      } else if (new Date(events[i].start_date) > com.currentDate) {
        addInArray(com.timelineEvents, events[i])
      } else if (new Date(events[i].endTime) > com.currentDate) {
        addInArray(com.popupEvents, events[i])
      } else {
        addInArray(com.pastEvents, events[i])
      }
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
    //     return (com.axis.scaleX(d.endTime) + com.axis.scaleX(d.start_date)) * 0.5 - 5
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
    //     return (com.axis.scaleX(d.endTime) + com.axis.scaleX(d.start_date)) * 0.5 - 5
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

    let max = com.popupEvents.length

    let enterG = eventGroup
      .enter()
      .append('g')
      .attr('class', 'popupEvent')
    enterG
      .attr('transform', function (d, i) {
        return 'translate(0,' + 0 + ')'
      })
      .transition()
      .delay(function (d, i) {
        return 1000 * i
      })
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('transform', function (d, i) {
        return 'translate(0,' + -35 * (max - i) + ')'
      })
    enterG.append('rect')
      .attr('class', 'back')
      .attr('x', 5)
      .attr('y', 0)
      .attr('width', com.box.width * 0.12 - 5)
      .attr('height', 33)
      .attr('stroke-width', 0.2)
      .attr('stroke', '#000000')
      .style('fill', function (d, i) {
        return '#546E7A'
      })
      .attr('vector-effect', 'non-scaling-stroke')
      .transition()
      .delay(7000)
      .duration(2000)
      .ease(d3.easeLinear)
      .attr('width', 0)
      .attr('stroke-width', 0)
      .on('end', function (d) {
        d.state = 'finished'
      })
    enterG.append('rect')
      .attr('class', 'filler')
      .attr('x', com.box.width * 0.12 - 5)
      .attr('y', 0)
      .attr('width', 5)
      .attr('height', 33)
      .attr('stroke', 'none')
      .style('fill', function (d, i) {
        return '#90A4AE'
      })
      .attr('vector-effect', 'non-scaling-stroke')
      .transition()
      .duration(7000)
      .ease(d3.easeLinear)
      .attr('height', 0)
      .attr('y', 33)
    // enterG.append('rect')
    //   .attr('class', 'icon')
    //   .attr('x', function (d, i) {
    //     return (com.axis.scaleX(d.endTime) + com.axis.scaleX(d.start_date)) * 0.5 - 5
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

    // mergedG.selectAll('rect.icon')
    //   .attr('x', function (d, i) {
    //     return (com.axis.scaleX(d.endTime) + com.axis.scaleX(d.start_date)) * 0.5 - 5
    //   })
    //   .attr('y', function (d, i) {
    //     return -30
    //   })

    eventGroup
      .exit()
      .remove()
      // .each(function () {
      //   let that = this
      //   d3.select(this).select('rect.back')
      // })

    let mergedG = enterG.merge(eventGroup)
    eventGroup.transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('transform', function (d, i) {
        return 'translate(0,' + -35 * (max - i) + ')'
      })
  }

  function drawTimelineEvents () {
    let eventGroup = com.eventG
      .selectAll('g.timelineEvent')
      .data(com.timelineEvents, function (d, i) {
        return d.id
      })

    let enterG = eventGroup
      .enter()
      .append('g')
      .attr('class', 'timelineEvent')
    enterG.append('text')
      .text(function (d) {
        return new Date(d.start_date).getHours() + ':' + new Date(d.start_date).getMinutes()
      })
      .attr('class', 'area')
      .attr('x', function (d, i) {
        return com.axis.scaleX(new Date(d.start_date))
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
      .attr('xlink:href', function (d) {
        console.log('/static/' + d.icon);
        return '/static/' + d.icon
      })
      .attr('width', 30)
      .attr('height', 30)
      .attr('x', function (d, i) {
        return com.axis.scaleX(new Date(d.start_date)) - 15
      })
      .attr('y', function (d, i) {
        return -45
      })
    // enterG.append('rect')
    //   .attr('class', 'icon')
    //   .attr('x', function (d, i) {
    //     return com.axis.scaleX(d.start_date) - 15
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
      .transition().duration(1000).ease(d3.easeLinear)
      .attr('x', function (d, i) {
        return com.axis.scaleX(new Date(d.start_date))
      })
    mergedG.selectAll('image.icon')
      .transition().duration(1000).ease(d3.easeLinear)
      .attr('x', function (d, i) {
        return com.axis.scaleX(new Date(d.start_date)) - 15
      })

    eventGroup
      .exit()
      .remove()
  }
}
