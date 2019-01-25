// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
// window.loadScript({ source:'utils_scrollTable', script:"/js/utils_scrollBox.js"});

/* global d3 */
/* global hasVar */

window.ClockEvents = function () {
  let com = {}
  com.futurEvents = []
  com.timelineEvents = []
  com.popupEvents = []
  com.pastEvents = []
  com.floor = 1
  com.timeRange = {}
  com.timeRange.total = 21600
  com.timeRange.day = 0
  com.timeRange.hour = 21600
  com.timeRange.minute = 0

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

  let formatMillisecond = d3.timeFormat('.%L')
  let formatSecond = d3.timeFormat(':%S')
  let formatMinute = d3.timeFormat('%I:%M')
  let formatHour = d3.timeFormat('%H:%M')
  let formatDay = d3.timeFormat('%a %d')
  let formatWeek = d3.timeFormat('%b %d')
  let formatMonth = d3.timeFormat('%B')
  let formatYear = d3.timeFormat('%Y')

  function multiFormat (date) {
    return (d3.timeSecond(date) < date ? formatMillisecond
      : d3.timeMinute(date) < date ? formatSecond
        : d3.timeHour(date) < date ? formatMinute
          : d3.timeDay(date) < date ? formatHour
            : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
              : d3.timeYear(date) < date ? formatMonth
                : formatYear)(date)
  }

  function reset () {
    com.futurEvents = []
    com.timelineEvents = []
    com.popupEvents = []
    com.pastEvents = []
  }
  this.reset = reset

  function setSendFunction (fun) {
    com.sendFunction = fun
  }
  this.setSendFunction = setSendFunction

  function getMouseCursorTime (pos) {
    if (pos === null) com.sendFunction(null)
    else com.sendFunction(com.axis.scaleX.invert(pos))
  }

  function init (optIn) {
    com.g = optIn.g
    com.box = optIn.box
    com.colorTheme = optIn.colorTheme

    com.g.attr('transform', 'translate(' + com.box.x + ',' + com.box.y + ')')
    com.g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', com.box.w)
      .attr('height', com.box.h)
      .attr('fill', com.colorTheme.background)

    com.popup = com.g.append('g')
      .attr('transform', 'translate(0,' + com.box.h * 0.2 + ')')

    com.axis = {}
    com.axis.scaleX = d3.scaleTime().range([0, com.box.w * 0.78]).domain([])
    com.axis.translate = 'translate(' + com.box.w * 0.12 + ',' + com.box.h * 0.62 + ')'
    com.axis.bottom = d3.axisBottom(com.axis.scaleX).tickSize(6).tickFormat(function (d) {
      return multiFormat(d)
    })
    com.axis.axisG = com.g
      .append('g')
      .attr('class', 'axisX')
      .attr('transform', com.axis.translate)
      .call(com.axis.bottom)
    com.axis.axisG.select('path').attr('stroke-width', 2).attr('stroke', com.colorTheme.stroke)

    com.eventG = com.g.append('g').attr('transform', com.axis.translate)
    com.g.append('rect')
      .attr('class', 'mousemove')
      .attr('x', com.box.w * 0.12)
      .attr('y', 0)
      .attr('width', com.box.w * 0.78)
      .attr('height', com.box.h)
      .attr('stroke', 'none')
      .attr('fill', '#ffffff')
      .attr('opacity', 0)
      .attr('mouseover', 0)
      .on('mousemove', function (d, i) {
        getMouseCursorTime(d3.mouse(this)[0] - 115)
      })
      .on('mouseout', function (d, i) {
        getMouseCursorTime(null)
      })
    com.g.append('clipPath')
      .attr('id', 'ellipse-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', -com.box.h * 0.8)
      .attr('width', com.box.w * 0.78)
      .attr('height', com.box.h * 0.8)
      .attr('stroke', '#000000')
    com.eventG.attr('clip-path', 'url(#ellipse-clip)')

    com.shrinkButton = com.g.append('g')
      .attr('transform', 'translate(' + ((com.box.w * 0.9)) + ',' + 0 + ')')
    changeDomainHourFront()
    // com.shrinkButton.append('rect')
    //   .attr('x', -12)
    //   .attr('y', -(com.box.h * 0.62))
    //   .attr('width', com.box.w * 0.1)
    //   .attr('height', com.box.h)
    //   .attr('fill', com.colorTheme.background)
    // com.shrinkButton.append('circle')
    //   .attr('cx', 0)
    //   .attr('cy', 0)
    //   .attr('r', 12)
    //   .attr('stroke', '#000000')
    //   .attr('stroke-width', 0.2)
    //   .attr('fill', com.colorTheme.background)
    // com.shrinkButton.append('rect')
    //   .attr('x', 0)
    //   .attr('y', -12)
    //   .attr('height', 24)
    //   .attr('width', 60)
    //   .attr('stroke', '#000000')
    //   .attr('stroke-width', 0.2)
    //   .attr('fill', com.colorTheme.background)
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
    //   .attr('stroke', com.colorTheme.stroke)
    //   .attr('stroke-width', 3)
    // com.shrinkButton.append('line')
    //   .attr('x1', 6 - 3 - 2)
    //   .attr('y1', 6)
    //   .attr('x2', 1 - 4 - 2)
    //   .attr('y2', -1)
    //   .attr('stroke', com.colorTheme.stroke)
    //   .attr('stroke-width', 3)
    // com.shrinkButton.append('text')
    //   .attr('class', 'futurEvent')
    //   .text('+0')
    //   .attr('x', 30)
    //   .attr('y', 0)
    //   .style('font-weight', 'normal')
    //   .attr('text-anchor', 'middle')
    //   .style('font-size', com.box.h * 0.4)
    //   .attr('dy', com.box.h * 0.16)
    //   .style('pointer-events', 'none')
    //   .style('user-select', 'none')

    // com.moreEvent = com.g.append('g')
    //   .attr('transform', 'translate(' + ((com.box.w * 0.965)) + ',' + (com.box.h * 0.62) + ')')
    // com.moreEvent.append('circle')
    //   .attr('cx', 0)
    //   .attr('cy', 0)
    //   .attr('r', 12)
    //   .attr('stroke', 'none')
    //   .attr('fill', 'none')

    com.futurEventsG = com.g.append('g')
      .attr('transform', 'translate(' + ((com.box.w * 0.9) - 2) + ',' + (com.box.h * 0.62 - 12) + ')')

    com.g.append('rect')
      .attr('x', 0)
      .attr('y', com.box.h * 0.19)
      .attr('width', com.box.w * 0.12)
      .attr('height', com.box.h * 0.8)
      .attr('fill', com.colorTheme.background)
      .attr('stroke', com.colorTheme.stroke)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', [(com.box.w * 0.12) + (com.box.h * 0.8), (com.box.w * 0.12) + (com.box.h * 0.8)])

    com.g.append('text')
      .attr('class', 'currentHour')
      .attr('stroke', com.colorTheme.stroke)
      .attr('fill', com.colorTheme.stroke)
      .attr('x', com.box.w * 0.06)
      .attr('y', com.box.h * 0.7)
      .style('font-weight', '')
      .attr('text-anchor', 'middle')
      .style('font-size', com.box.h * 0.6)
      .attr('dy', com.box.h * 0.12)
      .style('pointer-events', 'none')
      .style('user-select', 'none')
  }
  this.init = init

  function changeDomainHourBack () {
    com.timeRange.total = com.timeRange.day + com.timeRange.hour + com.timeRange.minute
    com.limitDate = new Date(com.currentDate.getTime()).setSeconds(com.currentDate.getSeconds() + com.timeRange.total)
    com.axis.scaleX.domain([com.currentDate, com.limitDate])
    com.axis.bottom.scale(com.axis.scaleX)
    com.axis.axisG
      .transition()
      .ease(d3.easeLinear)
      .duration(1000)
      .call(com.axis.bottom)
    com.axis.axisG.selectAll('g.tick').selectAll('line').attr('stroke-width', 2).attr('stroke', com.colorTheme.stroke)
    com.axis.axisG.selectAll('g.tick').selectAll('text')
      .style('font-size', com.box.h * 0.26)
      .attr('stroke-width', 0.4)
      .attr('stroke', com.colorTheme.stroke)
      .attr('fill', com.colorTheme.stroke)

    drawEvents()
  }

  function changeDomainHourFront () {
    com.shrinkButton.append('rect')
      .attr('x', 0)
      .attr('y', com.box.h * 0.2)
      .attr('width', com.box.w * 0.1)
      .attr('height', com.box.h * 0.8)
      .attr('fill', com.colorTheme.background)
      .attr('stroke', com.colorTheme.stroke)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', [(com.box.w * 0.1), (com.box.h * 0.8) + (com.box.w * 0.1), (com.box.h * 0.8)])

    let timerange = com.timeRange.total
    let newtime = Math.floor(timerange / 86400)
    com.shrinkButton.append('text')
      .attr('class', 'day')
      .text((newtime < 10 ? '0' + newtime : newtime) + ' :')
      .attr('x', com.box.w * 0.01)
      .attr('y', com.box.h * 0.5)
      .attr('stroke-width', 0.4)
      .attr('stroke', com.colorTheme.stroke)
      .attr('fill', com.colorTheme.stroke)
      .attr('text-anchor', 'start')
      .style('font-size', com.box.h * 0.3)
      .attr('dy', com.box.h * 0.07)
      .style('user-select', 'none')
    timerange = timerange % 86400
    newtime = Math.floor(timerange / 3600)
    com.shrinkButton.append('text')
      .attr('class', 'hour')
      .text((newtime < 10 ? '0' + newtime : newtime) + ' :')
      .attr('x', com.box.w * 0.04)
      .attr('y', com.box.h * 0.5)
      .attr('stroke-width', 0.4)
      .attr('stroke', com.colorTheme.stroke)
      .attr('fill', com.colorTheme.stroke)
      .attr('text-anchor', 'start')
      .style('font-size', com.box.h * 0.3)
      .attr('dy', com.box.h * 0.07)
      .style('user-select', 'none')
    timerange = timerange % 3600
    newtime = Math.floor(timerange / 60)
    com.shrinkButton.append('text')
      .attr('class', 'minute')
      .text((newtime < 10 ? '0' + newtime : newtime))
      .attr('x', com.box.w * 0.07)
      .attr('y', com.box.h * 0.5)
      .attr('stroke-width', 0.4)
      .attr('stroke', com.colorTheme.stroke)
      .attr('fill', com.colorTheme.stroke)
      .attr('text-anchor', 'start')
      .style('font-size', com.box.h * 0.3)
      .attr('dy', com.box.h * 0.07)
      .style('user-select', 'none')

    com.shrinkButton.append('rect')
      .attr('x', com.box.w * 0.005)
      .attr('y', com.box.h * 0.3)
      .attr('width', com.box.w * 0.03)
      .attr('height', com.box.h * 0.5)
      .attr('fill', 'red')
      .attr('opacity', 0)
      .on('mouseover', function () {
        com.shrinkButton.select('text.day')
          .attr('stroke', '#ffffff')
          .attr('fill', '#ffffff')
      })
      .on('mouseout', function () {
        com.shrinkButton.select('text.day')
          .attr('stroke', com.colorTheme.stroke)
          .attr('fill', com.colorTheme.stroke)
      })
      .on('wheel', function (d) {
        let direction = d3.event.wheelDelta < 0 ? 'down' : 'up'
        if (direction === 'down') {
          com.timeRange.day -= 86400
          if (com.timeRange.day < 0) com.timeRange.day = 8553600
        }
        if (direction === 'up') {
          com.timeRange.day += 86400
          if (com.timeRange.day > 8553600) com.timeRange.day = 0
        }
        let temp = Math.floor(com.timeRange.day / 86400)
        com.shrinkButton.select('text.day').text((temp < 10 ? '0' + temp : temp) + ' :')
        changeDomainHourBack()
      })
    com.shrinkButton.append('rect')
      .attr('x', com.box.w * 0.035)
      .attr('y', com.box.h * 0.3)
      .attr('width', com.box.w * 0.03)
      .attr('height', com.box.h * 0.5)
      .attr('fill', 'yellow')
      .attr('opacity', 0)
      .on('mouseover', function () {
        com.shrinkButton.select('text.hour')
          .attr('stroke', '#ffffff')
          .attr('fill', '#ffffff')
      })
      .on('mouseout', function () {
        com.shrinkButton.select('text.hour')
          .attr('stroke', com.colorTheme.stroke)
          .attr('fill', com.colorTheme.stroke)
      })
      .on('wheel', function (d) {
        let direction = d3.event.wheelDelta < 0 ? 'down' : 'up'
        if (direction === 'down') {
          com.timeRange.hour -= 3600
          if (com.timeRange.hour < 0) com.timeRange.hour = 82800
        }
        if (direction === 'up') {
          com.timeRange.hour += 3600
          if (com.timeRange.hour > 82800) com.timeRange.hour = 0
        }
        let temp = Math.floor(com.timeRange.hour / 3600)
        com.shrinkButton.select('text.hour').text((temp < 10 ? '0' + temp : temp) + ' :')
        changeDomainHourBack()
      })
    com.shrinkButton.append('rect')
      .attr('x', com.box.w * 0.065)
      .attr('y', com.box.h * 0.3)
      .attr('width', com.box.w * 0.03)
      .attr('height', com.box.h * 0.5)
      .attr('fill', 'blue')
      .attr('opacity', 0)
      .on('mouseover', function () {
        com.shrinkButton.select('text.minute')
          .attr('stroke', '#ffffff')
          .attr('fill', '#ffffff')
      })
      .on('mouseout', function () {
        com.shrinkButton.select('text.minute')
          .attr('stroke', com.colorTheme.stroke)
          .attr('fill', com.colorTheme.stroke)
      })
      .on('wheel', function (d) {
        let direction = d3.event.wheelDelta < 0 ? 'down' : 'up'
        if (direction === 'down') {
          com.timeRange.minute -= 60
          if (com.timeRange.minute < 0) com.timeRange.minute = 3540
        }
        if (direction === 'up') {
          com.timeRange.minute += 60
          if (com.timeRange.minute > 3540) com.timeRange.minute = 0
        }
        let temp = Math.floor(com.timeRange.minute / 60)
        com.shrinkButton.select('text.minute').text((temp < 10 ? '0' + temp : temp))
        changeDomainHourBack()
      })

    com.shrinkButton.append('text')
      .text('DD')
      .attr('x', com.box.w * 0.012)
      .attr('y', com.box.h * 0.8)
      .attr('stroke-width', 0.4)
      .attr('stroke', com.colorTheme.stroke)
      .attr('fill', com.colorTheme.stroke)
      .attr('text-anchor', 'start')
      .style('font-size', com.box.h * 0.2)
      .attr('dy', com.box.h * 0.07)
      .style('user-select', 'none')
      .style('pointer-events', 'none')
    com.shrinkButton.append('text')
      .text('HH')
      .attr('x', com.box.w * 0.04)
      .attr('y', com.box.h * 0.8)
      .attr('stroke-width', 0.4)
      .attr('stroke', com.colorTheme.stroke)
      .attr('fill', com.colorTheme.stroke)
      .attr('text-anchor', 'start')
      .style('font-size', com.box.h * 0.2)
      .attr('dy', com.box.h * 0.07)
      .style('user-select', 'none')
      .style('pointer-events', 'none')
    com.shrinkButton.append('text')
      .text('MM')
      .attr('x', com.box.w * 0.07)
      .attr('y', com.box.h * 0.8)
      .attr('stroke-width', 0.4)
      .attr('stroke', com.colorTheme.stroke)
      .attr('fill', com.colorTheme.stroke)
      .attr('text-anchor', 'start')
      .style('font-size', com.box.h * 0.2)
      .attr('dy', com.box.h * 0.07)
      .style('user-select', 'none')
      .style('pointer-events', 'none')
  }

  function setHour (date) {
    if (date < com.currentDate) reset()
    com.currentDate = date
    com.g.select('text.currentHour')
      .text(com.currentDate.getHours() + ' : ' + (com.currentDate.getMinutes() < 10 ? ('0' + com.currentDate.getMinutes()) : com.currentDate.getMinutes()))
    changeDomainHourBack()
  }
  this.setHour = setHour

  function drawEvents () {
    for (let i = com.futurEvents.length - 1; i >= 0; i--) {
      if (new Date(com.futurEvents[i].start_date) < com.limitDate) com.timelineEvents.push(com.futurEvents.splice(i, 1)[0])
    }
    com.shrinkButton.select('text.futurEvent').text('+' + com.futurEvents.length)

    for (let i = com.timelineEvents.length - 1; i >= 0; i--) {
      if (new Date(com.timelineEvents[i].start_date) < com.currentDate) com.popupEvents.push(com.timelineEvents.splice(i, 1)[0])
    }

    for (let i = com.popupEvents.length - 1; i >= 0; i--) {
      let d = new Date(com.popupEvents[i].endTime)
      if (!(d instanceof Date && !isNaN(d)) || new Date(com.popupEvents[i].endTime) < com.currentDate) {
        if (com.popupEvents[i].state === 'finished') com.pastEvents.push(com.popupEvents.splice(i, 1)[0])
      }
    }

    com.floor = 1
    drawPopupEvents()
    drawTimelineEvents()
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

  function drawPopupEvents () {
    for (let i = 0; i < com.popupEvents.length; i++) {
      if (com.popupEvents[i].end_date) {
        com.popupEvents[i].pos = com.floor
        com.popupEvents[i].state = 'waiting'
        com.floor += 1
      } else com.popupEvents[i].pos = 0
    }

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
    enterG.append('g').attr('class', 'popupG')
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
    enterG.each(function (d, i) {
      let rectBack = enterG.select('g.popupG').append('rect')
        .attr('class', 'back')
        .attr('x', 5)
        .attr('y', 0)
        .attr('width', com.box.w * 0.12 - 5)
        .attr('height', 33)
        .attr('stroke-width', 0.2)
        .attr('stroke', '#000000')
        .style('fill', function (d, i) {
          return com.colorTheme.background
        })
        .attr('vector-effect', 'non-scaling-stroke')
      let text = enterG.select('g.popupG').append('text')
        .text(function (d) {
          return d.name
        })
        .attr('class', 'name')
        .attr('x', com.box.w * 0.12 - 20)
        .attr('y', 16)
        .attr('stroke-width', 0.4)
        .attr('stroke', com.colorTheme.stroke)
        .attr('fill', com.colorTheme.stroke)
        .attr('text-anchor', 'end')
        .style('font-size', com.box.h * 0.22)
        .attr('dy', com.box.h * 0.07)
        .style('pointer-events', 'none')
        .style('user-select', 'none')
      let icon = enterG.select('g.popupG').append('svg:image')
        .attr('class', 'icon')
        .attr('xlink:href', function (d) {
          console.log('/static/' + d.icon)
          return '/static/' + d.icon
        })
        .attr('width', 25)
        .attr('height', 25)
        .attr('x', 15)
        .attr('y', 4)
      let rect = enterG.select('g.popupG').append('rect')
        .attr('class', 'filler')
        .attr('x', com.box.w * 0.12 - 5)
        .attr('y', 0)
        .attr('width', 5)
        .attr('height', 33)
        .attr('stroke', 'none')
        .style('fill', function (d, i) {
          return '#90A4AE'
        })
        .attr('vector-effect', 'non-scaling-stroke')
      if (d.pos === 0) {
        rect.transition()
          .duration(7000)
          .ease(d3.easeLinear)
          .attr('height', 0)
          .attr('y', 33)
          .on('end', function (d, i) {
            text.attr('opacity', 1)
              .transition()
              .duration(1500)
              .ease(d3.easeLinear)
              .attr('transform', 'scale(0,1)')
              .attr('opacity', 0)
            icon.transition()
              .duration(1500)
              .ease(d3.easeLinear)
              .attr('width', 0)
            rectBack.transition()
              .duration(2000)
              .ease(d3.easeLinear)
              .attr('width', 0)
              .attr('stroke-width', 0)
              .on('end', function (d) {
                d.state = 'finished'
              })
          })
      }
      else {
        rect.style('fill', function () {
          let color = ['#EC407A', '#5C6BC0', '#29B6F6', '#66BB6A', '#FFEE58']
          return color[d.color]
        }).attr('fill-opacity', 0.4)
          .attr('stroke', '#000000')
          .attr('stroke-width', 0.5)
        enterG.append('g')
          .attr('class', 'timelineG')
          .attr('transform', com.eventG.attr('transform'))
          .append('rect')
          .attr('transform', 'translate(0,' + (-com.box.h * 0.2) + ')')
          .attr('class', 'timeBar')
          .attr('x', 0)
          .attr('y', -5 * d.pos)
          .attr('width', com.axis.scaleX(new Date(d.end_date)) - com.axis.scaleX(com.currentDate))
          .attr('height', 5)
          .attr('fill', function () {
            let color = ['#EC407A', '#5C6BC0', '#29B6F6', '#66BB6A', '#FFEE58']
            return color[d.color]
          })
          .attr('fill-opacity', 0.3)
          .attr('stroke', '#000000')
          .attr('stroke-width', 0.5)
      }
    })
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
    mergedG.select('g.popupG')
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('transform', function (d, i) {
        return 'translate(0,' + -35 * (max - i) + ')'
      })
    mergedG.each(function (d, i) {
      let that = d3.select(this)
      that.select('g.timelineG').select('rect.timeBar')
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('width', function (d, i) {
          let ret = 0
          if (com.axis.scaleX(new Date(d.end_date)) - com.axis.scaleX(com.currentDate) < 0) {
            if (d.state === 'waiting') {
              d.state = 'inprogress'
              that.select('g.popupG').select('rect.filler').transition()
                .duration(4000)
                .ease(d3.easeLinear)
                .attr('height', 0)
                .attr('y', 33)
                .on('end', function (d, i) {
                  that.select('g.popupG').select('text.name').transition()
                    .duration(1500)
                    .ease(d3.easeLinear)
                    .attr('transform', 'scale(0,1)')
                    .attr('opacity', 0)
                  that.select('g.popupG').select('image.icon').transition()
                    .duration(1500)
                    .ease(d3.easeLinear)
                    .attr('width', 0)
                  that.select('g.popupG').select('rect.back').transition()
                    .duration(2000)
                    .ease(d3.easeLinear)
                    .attr('width', 0)
                    .attr('stroke-width', 0)
                    .on('end', function (d) {
                      d.state = 'finished'
                    })
                })
            }
          } else {
            ret = com.axis.scaleX(new Date(d.end_date)) - com.axis.scaleX(com.currentDate)
          }
          return ret
        })
    })
  }

  function drawTimelineEvents () {
    for (let i = 0; i < com.timelineEvents.length; i++) {
      if (com.timelineEvents[i].end_date) {
        com.timelineEvents[i].pos = com.floor
        com.floor += 1
      } else com.timelineEvents[i].pos = 0
    }
    let eventGroup = com.eventG
      .selectAll('g.timelineEvent')
      .data(com.timelineEvents, function (d, i) {
        return d.id
      })

    let enterG = eventGroup
      .enter()
      .append('g')
      .attr('class', 'timelineEvent')
    enterG.each(function (d, i) {
      if (d.pos === 0) return
      d3.select(this).append('rect')
        .attr('class', 'back')
        .attr('x', function () {
          return com.axis.scaleX(new Date(d.start_date))
        })
        .attr('y', function () {
          return -5 * (d.pos)
        })
        .attr('width', function () {
          if (d.end_date) return (com.axis.scaleX(new Date(d.end_date)) - com.axis.scaleX(new Date(d.start_date)))
          else return 0
        })
        .attr('height', 5)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5)
        .attr('fill', function () {
          d.color = d.pos % 4
          let color = ['#EC407A', '#5C6BC0', '#29B6F6', '#66BB6A', '#FFEE58']
          return color[d.color]
        })
        .attr('fill-opacity', 0.3)
    })
    enterG.append('text')
      .text(function (d) {
        let date = new Date(d.start_date)
        return (date.getHours() < 10 ? ('0' + date.getHours()) : date.getHours()) + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes())
      })
      .attr('class', 'area')
      .attr('x', function (d, i) {
        return com.axis.scaleX(new Date(d.start_date))
      })
      .attr('y', function (d, i) {
        return -2
      })
      .attr('stroke-width', 0.4)
      .attr('stroke', com.colorTheme.stroke)
      .attr('fill', com.colorTheme.stroke)
      .attr('text-anchor', 'middle')
      .style('font-size', com.box.h * 0.22)
      .style('pointer-events', 'none')
      .style('user-select', 'none')
    enterG.append('svg:image')
      .attr('class', 'icon')
      .attr('xlink:href', function (d) {
        console.log('/static/' + d.icon)
        return '/static/' + d.icon
      })
      .attr('width', 25)
      .attr('height', 25)
      .attr('x', function (d, i) {
        return com.axis.scaleX(new Date(d.start_date)) - 12
      })
      .attr('y', function (d, i) {
        return -40
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
    //   .attr('stroke', com.colorTheme.stroke)
    //   .attr('stroke-width', 1)
    //   .style('fill', function (d, i) {
    //     return 'none'
    //   })
    //   .attr('stroke-dasharray', [0, 30 + 25, 5 + 30 + 5, 25])
    //   .attr('vector-effect', 'non-scaling-stroke')

    let mergedG = enterG.merge(eventGroup)
    mergedG.selectAll('rect.back')
      .transition().duration(1000).ease(d3.easeLinear)
      .attr('x', function (d, i) {
        return com.axis.scaleX(new Date(d.start_date))
      })
      .attr('y', function (d, i) {
        return -5 * (d.pos)
      })
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
