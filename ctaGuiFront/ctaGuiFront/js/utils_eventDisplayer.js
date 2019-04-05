/* global $ */
/* global d3 */
/* global timeD */
/* global hasVar */
/* global getColorTheme */
/* global deepCopy */
/* global minMaxObj */
/* global loadScript */
/* global colsBlues */
/* global ScrollBox */
/* global Locker */
/* global RunLoop */

loadScript({ source: 'utils_scrollTable', script: '/js/utils_scrollBox.js' })

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.EventDisplayer = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  let com = {
    main: {
      tag: 'eventQueueRootTag',
      g: undefined,
      scroll: {},
      box: {x: 0, y: 0, w: 1000, h: 300, marg: 0},
      background: {
        fill: colorTheme.brighter.background,
        stroke: colorTheme.brighter.stroke,
        strokeWidth: 0.5
      }
    },

    displayer: 'eventTrack',
    eventTrack: {
      g: undefined,
      axis: {
        enabled: true,
        g: undefined,
        box: {x: 0, y: 300, w: 1000, h: 0, marg: 0},
        axis: undefined,
        scale: undefined,
        domain: [0, 1000],
        range: [0, 0],
        showText: true,
        orientation: 'axisTop',
        attr: {
          text: {
            stroke: colorTheme.medium.stroke,
            fill: colorTheme.medium.background
          },
          path: {
            stroke: colorTheme.medium.stroke,
            fill: colorTheme.medium.background
          }
        }
      },
      timeBars: {
        enabled: true,
        g: undefined,
        box: {x: 0, y: 0, w: 1000, h: 300, marg: 0}
      }
    },

    filters: {
      eventFilters: [],
      filtering: []
    },
    time: {
      currentTime: {date: new Date(), time: 0},
      startTime: {date: new Date(), time: 0},
      endTime: {date: new Date(), time: 1000}
    },
    data: {
      raw: {
        events: []
      },
      filtered: {}
    },
    debug: {
      enabled: false
    },
    pattern: {
      select: {}
    },
    input: {
      over: {
        event: undefined
      },
      focus: {
        event: undefined
      }
    }
  }
  com = optIn
  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  function setDefaultStyle () {
    if (com.style) return
    com.style = {}
    com.style.runRecCol = colsBlues[2]
    com.style.eventCol = function (optIn) {
      return com.main.colorTheme.dark
    }
    com.style.eventOpac = function (optIn) {
      return 1
    }

    com.pattern.select = {}
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

    com.pattern.select.patternSelect = com.pattern.select.defs.append('pattern')
      .attr('id', 'patternSelect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 3)
      .attr('height', 3)
      .attr('fill', '#ffffff')
      .attr('patternUnits', 'userSpaceOnUse')
    com.pattern.select.patternSelect.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 3)
      .attr('y2', 3)
      .attr('stroke', '#000000')
      .attr('stroke-width', 0.4)
      .attr('stroke-opacity', 0.6)
    com.pattern.select.patternSelect.append('line')
      .attr('x1', 3)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 3)
      .attr('stroke', '#000000')
      .attr('stroke-width', 0.4)
      .attr('stroke-opacity', 0.6)
  }

  let EventTrackBib = function () {
    function init () {
      com.eventTrack.g = com.main.g.append('g')
      initAxis()
      initTimeBars()
    }
    this.init = init
    function initAxis () {
      com.eventTrack.axis.scale = d3.scaleTime()
        .range(com.eventTrack.axis.range)
        .domain(com.eventTrack.axis.domain)
      com.eventTrack.axis.main = com.eventTrack.axis.orientation === 'top&bottom' ? d3.axisBottom(com.eventTrack.axis.scale) : d3.axisTop(com.eventTrack.axis.scale)

      com.eventTrack.axis.main.tickFormat(d3.timeFormat('%H:%M'))

      if (!com.eventTrack.axis.enabled) return
      com.eventTrack.axis.g = com.main.g.append('g')
        .attr('transform', 'translate(' + com.eventTrack.axis.box.x + ',' + com.eventTrack.axis.box.y + ')')
      if (com.eventTrack.axis.show) {
        com.eventTrack.axis.g
          .attr('class', 'axis')
          .call(com.eventTrack.axis.main)
        com.eventTrack.axis.g.style('opacity', 1)
      }
    }
    function initTimeBars () {
      if (!com.eventTrack.timeBars.enabled) return
      com.eventTrack.timeBars.g = com.main.g.append('g')
        .attr('transform', 'translate(' + com.eventTrack.timeBars.box.x + ',' + com.eventTrack.timeBars.box.y + ')')
      com.eventTrack.timeBars.g
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay(1000)
        .style('opacity', 1)
    }

    function setDefaultStyleForEvents (events) {
      for (let index in events) {
        let b = events[index]
        let bDisplay = {}

        let cols = com.style.eventCol({ d: b })

        bDisplay.stroke = cols.stroke
        bDisplay.strokeWidth = 0.2
        bDisplay.fill = cols.background
        bDisplay.fillOpacity = com.style.eventOpac({ d: b })
        bDisplay.strokeOpacity = com.style.eventOpac({ d: b })
        bDisplay.strokeDasharray = []
        bDisplay.opacity = b.filtered === true ? 0.05 : 1

        bDisplay.text = cols.text
        bDisplay.patternFill = ''
        bDisplay.patternOpacity = 0
        // if (b.obId === com.input.focus.event) {
        //   if (com.input.over.event !== undefined && com.input.over.event !== com.input.focus.event) bDisplay.strokeDasharray = [8, 4]
        //   bDisplay.strokeWidth = 6
        //   bDisplay.strokeOpacity = 1
        // }
        // if (b.obId === com.input.over.event) {
        //   bDisplay.strokeWidth = 6
        //   bDisplay.strokeOpacity = 1
        //   bDisplay.strokeDasharray = []
        // }

        b.display = bDisplay
      }
      return events
    }

    function update () {
      if (com.eventTrack.axis.enabled) updateAxis()
      if (com.eventTrack.timeBars.enabled) setTimeRect()

      updateEvents()
    }
    this.update = update
    function updateAxis () {
      com.eventTrack.axis.domain = [com.time.startTime.date, com.time.endTime.date]
      com.eventTrack.axis.range = [0, com.eventTrack.axis.box.w]
      com.eventTrack.axis.scale
        .domain(com.eventTrack.axis.domain)
        .range(com.eventTrack.axis.range)
        // .nice()

      if (!com.eventTrack.axis.enabled) return
      let minTxtSize = com.eventTrack.axis.attr.text.size ? com.eventTrack.axis.attr.text.size : com.main.box.w * 0.04
      // console.log(com.eventTrack.axis.domain, com.eventTrack.axis.range);
      com.eventTrack.axis.main.scale(com.eventTrack.axis.scale)
      com.eventTrack.axis.main.ticks(5)
      com.eventTrack.axis.main.tickSize(4)
      if (com.eventTrack.axis.show) {
        com.eventTrack.axis.g.call(com.eventTrack.axis.main)
        com.eventTrack.axis.g.select('path').attr('stroke-width', 0.5).attr('stroke', com.eventTrack.axis.attr.path.stroke)
        com.eventTrack.axis.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 0.5).attr('stroke', com.eventTrack.axis.attr.path.stroke)
        com.eventTrack.axis.g.selectAll('g.tick').selectAll('text')
          .attr('stroke', com.eventTrack.axis.attr.text.stroke)
          .attr('stroke-width', 0.2)
          .attr('fill', com.eventTrack.axis.attr.text.fill)
          .style('font-size', minTxtSize + 'px')
      }
    }
    function computeTrack (events) {
      let track = []
      for (let i = 0; i < events.length; i++) {
        let startT
        let endT
        startT = events[i].start_time
        if (events[i].end_time) endT = events[i].end_time
        else endT = startT + 60

        let insert = false
        for (let j = 0; j < track.length; j++) {
          if (track[j].endT + 3600 > startT && track[j].type === events[i].name) {
            events[i].track = j
            events[i].startT = track[j].startT
            events[i].endT = track[j].endT
            // track[j] = {time: endT, type: events[i].name}
            insert = true
            break
          }
        }
        if (!insert) {
          for (let j = 0; j < track.length; j++) {
            if (track[j].endT + 3600 < startT) {
              events[i].track = j
              events[i].startT = startT
              events[i].endT = endT
              track[j] = {startT: startT, endT: endT, type: events[i].name}
              insert = true
              break
            }
          }
        }
        if (!insert) {
          track.push({startT: startT, endT: endT, type: events[i].name})
          events[i].startT = startT
          events[i].endT = endT
          events[i].track = track.length - 1
        }
      }

      return track
    }
    function updateEvents () {
      let allEvents = [].concat(com.data.filtered.events_ponctual).concat(com.data.filtered.events_scheduled)
      let tracks = computeTrack(allEvents)

      let nLine = tracks.length
      let height = nLine >= 6 ? (com.main.box.h / nLine) : (com.main.box.h / 6)
      let offsetY = nLine >= 6 ? 0 : (com.main.box.h - ((com.main.box.h / 6) * nLine)) / (nLine - 1)

      let currentTrack = com.main.scroll.scrollG
        .selectAll('g.track')
        .data(tracks, function (d, i) {
          return i
        })
      let enterTrack = currentTrack
        .enter()
        .append('g')
        .attr('class', 'track')
        .attr('transform', function (d, i) {
          let translate = {
            y: (offsetY + height) * i,
            x: 0
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      enterTrack.each(function (d, i) {
        // d3.select(this).append('line')
        //   .attr('class', 'background')
        //   .attr('x1', 0)
        //   .attr('y1', 0)
        //   .attr('x2', com.main.box.w)
        //   .attr('y2', 0)
        //   .attr('fill', 'transparent')
        //   .attr('fill-opacity', 1)
        //   .attr('stroke', colorTheme.dark.stroke)
        //   .attr('stroke-width', 0.2)
        //   .attr('stroke-dasharray', [2, 2])
      })
      enterTrack.merge(currentTrack)
        .transition()
        .duration(timeD.animArc)
        .ease(d3.easeLinear)
        .attr('transform', function (d, i) {
          let translate = {
            y: (offsetY + height) * i,
            x: 0
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      currentTrack.exit()
        .transition('inOut').duration(timeD.animArc)
        .attr('width', 0)
        .style('opacity', 0)
        .remove()

      setEvenIcon(allEvents, tracks)
    }
    function setEvenIcon (events, tracks) {
      events = setDefaultStyleForEvents(events)

      let nLine = tracks.length
      let height = nLine >= 6 ? (com.main.box.h / nLine) : (com.main.box.h / 6)
      let offsetY = nLine >= 6 ? 0 : (com.main.box.h - ((com.main.box.h / 6) * nLine)) / (nLine - 1)

      let timeScale = d3.scaleLinear()
        .range(com.eventTrack.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])

      let rect = com.main.scroll.scrollG
        .selectAll('g.' + com.main.tag + 'events')
        .data(events, function (d) {
          return d.id
        })

      rect.each(function (d, i) {
        let box = {x: 0, y: (offsetY + height) * d.track, w: com.main.box.w, h: height * 1}
        d3.select(this)
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
          .attr('opacity', d => d.display.opacity)
        d3.select(this).select('rect.back')
          .transition('inOut')
          .duration(timeD.animArc)
          .ease(d3.easeLinear)
          .attr('x', timeScale(d.startT))
          .attr('y', 0)
          .attr('width', box.h) // timeScale(d.endT) - timeScale(d.startT))
          .attr('height', box.h)
          .style('fill', d.display.fill)
          .style('fill-opacity', d.display.fillOpacity)
          .attr('stroke-width', d.display.strokeWidth)
          .style('stroke-opacity', d.display.strokeOpacity)
          .style('stroke-dasharray', d.display.strokeDasharray)
        d3.select(this).select('rect.pattern')
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('x', timeScale(d.startT))
          .attr('y', 0)
          .attr('width', timeScale(d.endT) - timeScale(d.startT))
          .attr('height', box.h)
          .style('fill', d.display.patternFill)
          .style('fill-opacity', d.display.patternOpacity)
        d3.select(this).select('#icon')
          .attr('width', box.h)
          .attr('height', box.h)
          .attr('x', timeScale(d.startT))
          .attr('y', 0)
        // d3.select(this).select('text')
        //   .transition('inOut')
        //   .duration(timeD.animArc)
        //   .ease(d3.easeLinear)
        //   .text(d.name)
        //   .style('font-size', (box.h * 0.5) + 'px')
        //   .attr('dy', 1)
        //   .attr('x', timeScale(d.startT) + (timeScale(d.endT) - timeScale(d.startT)) * 0.5)
        //   .attr('y', (box.h * 0.5))
        //   .style('opacity', d.display.fillOpacity)
        //   .style('stroke-opacity', d.display.fillOpacity)
        //   .style('fill-opacity', d.display.fillOpacity)
      })
    }

    function getEventsRows () {
      let timeScale = d3.scaleLinear()
        .range(com.eventTrack.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])
      let scheds = groupEventsBySchedule(com.data.filtered)
      let nLine = scheds.length
      let height = com.main.box.h / nLine

      let ret = []
      for (let i = 0; i < scheds.length; i++) {
        for (let j = 0; j < scheds[i].events.length; j++) {
          let translate = {
            y: height * i,
            x: 0
          }
          ret.push({
            y: translate.y,
            x: timeScale(scheds[i].events[j].startTime),
            h: height,
            w: timeScale(scheds[i].events[j].endTime) - timeScale(scheds[i].events[j].startTime),
            event: scheds[i].events[j]
          })
        }
      }
      return ret
    }
    this.getEventsRows = getEventsRows

    // function addExtraBar (date) {
    //   let data = []
    //   if (date === null) {
    //     let rectNow = com.main.g
    //       .selectAll('rect.' + com.main.tag + 'extra')
    //       .data(data)
    //     rectNow.exit().remove()
    //   } else {
    //     data = [date]
    //     let rectNow = com.main.g
    //       .selectAll('rect.' + com.main.tag + 'extra')
    //       .data(data)
    //       .attr('transform', 'translate(' + com.eventTrack.axis.box.x + ',' + 0 + ')')
    //
    //     rectNow
    //       .enter()
    //       .append('rect')
    //       .attr('class', com.main.tag + 'extra')
    //       .style('opacity', 1)
    //       .attr('x', function (d, i) {
    //         if (d > com.eventTrack.axis.scale.domain()[1]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[1])
    //         else if (d < com.eventTrack.axis.scale.domain()[0]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[0])
    //         return com.eventTrack.axis.scale(d)
    //       })
    //       .attr('y', function (d, i) {
    //         return com.main.box.y - 1 * com.main.box.marg
    //       })
    //       .attr('width', 0)
    //       .attr('height', function (d, i) {
    //         return com.main.box.h + 1 * com.main.box.marg
    //       })
    //       .attr('stroke', d3.rgb(com.style.runRecCol).darker(1.0))
    //       .attr('fill', colsYellows[0])
    //       .attr('fill-opacity', 0.3)
    //       .style('stroke-opacity', 0.15)
    //       .attr('stroke-width', 3)
    //       .style('pointer-events', 'none')
    //       .attr('vector-effect', 'non-scaling-stroke')
    //       .merge(rectNow)
    //       .transition('inOut')
    //       .duration(50)
    //       .attr('x', function (d, i) {
    //         if (d > com.eventTrack.axis.scale.domain()[1]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[1])
    //         else if (d < com.eventTrack.axis.scale.domain()[0]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[0])
    //         return com.eventTrack.axis.scale(d)
    //       })
    //       // .attr("y", function(d,i) { return d.y; })
    //       .attr('width', function (d, i) {
    //         return com.main.box.marg
    //       })
    //   }
    // }
    function setTimeRect () {
      let rectNowData = []

      rectNowData = [
        {
          id: com.main.tag + 'now',
          x: com.eventTrack.axis.scale(com.time.currentTime.date),
          y: com.eventTrack.timeBars.box.y,
          w: com.eventTrack.timeBars.box.marg,
          h: com.eventTrack.timeBars.box.h + com.eventTrack.timeBars.box.marg * 2
        }
      ]
      // console.log('timeFrac',timeFrac,rectNowData);
      // console.log('rectNowData',(com.eventRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let rectNow = com.eventTrack.timeBars.g
        .selectAll('rect.' + com.main.tag + 'now')
        .data(rectNowData, function (d) {
          return d.id
        })

      rectNow
        .enter()
        .append('rect')
        .attr('class', com.main.tag + 'now')
        .style('opacity', 1)
        .attr('x', function (d, i) {
          return d.x
        })
        .attr('y', function (d, i) {
          return d.y - 1 * com.main.box.marg
        })
        .attr('width', 0)
        .attr('height', function (d, i) {
          return d.h
        })
        .attr('fill', com.style.runRecCol)
        .attr('fill-opacity', 0.3)
        .style('stroke-opacity', 0.15)
        .attr('stroke-width', 3)
        .style('pointer-events', 'none')
        .attr('vector-effect', 'non-scaling-stroke')
        .merge(rectNow)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('x', function (d, i) {
          return d.x
        })
        // .attr("y", function(d,i) { return d.y; })
        .attr('width', function (d, i) {
          return d.w
        })
      // .attr("height", function(d,i) { return d.h; })

      // rectNow.exit()
      //   .transition("inOut").duration(timeD.animArc/2)
      //   .attr("width", 0)
      //   .style("opacity", 0)
      //   .remove()
    }

    function remove () {
      com.eventTrack.g.remove()
      com.main.g.selectAll('g.allScheds').remove()
      if (com.eventTrack.axis.enabled) com.eventTrack.axis.g.remove()
      if (com.eventTrack.timeBars.enabled) com.eventTrack.timeBars.g.remove()
    }
    this.remove = remove
  }
  let eventTrackBib = new EventTrackBib()
  let EventQueueBib = function () {
    function init () {
      com.eventTrack.g = com.main.g.append('g')
      initAxis()
      initTimeBars()
    }
    this.init = init
    function initAxis () {
      com.eventTrack.axis.scale = d3.scaleTime()
        .range(com.eventTrack.axis.range)
        .domain(com.eventTrack.axis.domain)
      com.eventTrack.axis.main = com.eventTrack.axis.orientation === 'top&bottom' ? d3.axisBottom(com.eventTrack.axis.scale) : d3.axisTop(com.eventTrack.axis.scale)

      com.eventTrack.axis.main.tickFormat(d3.timeFormat('%H:%M'))

      if (!com.eventTrack.axis.enabled) return
      com.eventTrack.axis.g = com.main.g.append('g')
        .attr('transform', 'translate(' + com.eventTrack.axis.box.x + ',' + com.eventTrack.axis.box.y + ')')
      if (com.eventTrack.axis.show) {
        com.eventTrack.axis.g
          .attr('class', 'axis')
          .call(com.eventTrack.axis.main)
        com.eventTrack.axis.g.style('opacity', 1)
      }
    }
    function initTimeBars () {
      if (!com.eventTrack.timeBars.enabled) return
      com.eventTrack.timeBars.g = com.main.g.append('g')
        .attr('transform', 'translate(' + com.eventTrack.timeBars.box.x + ',' + com.eventTrack.timeBars.box.y + ')')
      com.eventTrack.timeBars.g
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay(1000)
        .style('opacity', 1)
    }

    function setDefaultStyleForEvents (events) {
      for (let index in events) {
        let b = events[index]
        let bDisplay = {}

        let cols = com.style.eventCol({ d: b })

        bDisplay.stroke = cols.stroke
        bDisplay.strokeWidth = 0.2
        bDisplay.fill = cols.background
        bDisplay.fillOpacity = com.style.eventOpac({ d: b })
        bDisplay.strokeOpacity = com.style.eventOpac({ d: b })
        bDisplay.strokeDasharray = []
        bDisplay.opacity = b.filtered === true ? 0.05 : 1

        bDisplay.text = cols.text
        bDisplay.patternFill = ''
        bDisplay.patternOpacity = 0
        // if (b.obId === com.input.focus.event) {
        //   if (com.input.over.event !== undefined && com.input.over.event !== com.input.focus.event) bDisplay.strokeDasharray = [8, 4]
        //   bDisplay.strokeWidth = 6
        //   bDisplay.strokeOpacity = 1
        // }
        // if (b.obId === com.input.over.event) {
        //   bDisplay.strokeWidth = 6
        //   bDisplay.strokeOpacity = 1
        //   bDisplay.strokeDasharray = []
        // }

        b.display = bDisplay
      }
      return events
    }

    function update () {
      if (com.eventTrack.axis.enabled) updateAxis()
      if (com.eventTrack.timeBars.enabled) setTimeRect()

      updateEvents()
    }
    this.update = update
    function updateAxis () {
      com.eventTrack.axis.domain = [com.time.startTime.date, com.time.endTime.date]
      com.eventTrack.axis.range = [0, com.eventTrack.axis.box.w]
      com.eventTrack.axis.scale
        .domain(com.eventTrack.axis.domain)
        .range(com.eventTrack.axis.range)
        // .nice()

      if (!com.eventTrack.axis.enabled) return
      let minTxtSize = com.eventTrack.axis.attr.text.size ? com.eventTrack.axis.attr.text.size : com.main.box.w * 0.04
      // console.log(com.eventTrack.axis.domain, com.eventTrack.axis.range);
      com.eventTrack.axis.main.scale(com.eventTrack.axis.scale)
      com.eventTrack.axis.main.ticks(5)
      com.eventTrack.axis.main.tickSize(4)
      if (com.eventTrack.axis.show) {
        com.eventTrack.axis.g.call(com.eventTrack.axis.main)
        com.eventTrack.axis.g.select('path').attr('stroke-width', 0.5).attr('stroke', com.eventTrack.axis.attr.path.stroke)
        com.eventTrack.axis.g.selectAll('g.tick').selectAll('line').attr('stroke-width', 0.5).attr('stroke', com.eventTrack.axis.attr.path.stroke)
        com.eventTrack.axis.g.selectAll('g.tick').selectAll('text')
          .attr('stroke', com.eventTrack.axis.attr.text.stroke)
          .attr('stroke-width', 0.2)
          .attr('fill', com.eventTrack.axis.attr.text.fill)
          .style('font-size', minTxtSize + 'px')
      }
    }
    function computeTrack (events) {
      let track = []
      for (let i = 0; i < events.length; i++) {
        let startT
        let endT
        startT = events[i].start_time
        if (events[i].end_time) endT = events[i].end_time
        else endT = startT + 60

        let insert = false
        for (let j = 0; j < track.length; j++) {
          if (track[j].endT + 3600 * 2 > startT && track[j].type === events[i].name) {
            events[i].track = j
            events[i].startT = startT // track[j].startT
            events[i].endT = endT // track[j].endT
            events[i].collapsed = true
            // track[j] = {time: endT, type: events[i].name}
            insert = true
            break
          }
        }
        if (!insert) {
          for (let j = 0; j < track.length; j++) {
            if (track[j].endT + 3600 * 1 < startT) {
              events[i].track = j
              events[i].startT = startT
              events[i].endT = endT
              events[i].collapsed = false
              track[j] = {startT: startT, endT: endT, type: events[i].name}
              insert = true
              break
            }
          }
        }
        if (!insert) {
          track.push({startT: startT, endT: endT, type: events[i].name})
          events[i].startT = startT
          events[i].endT = endT
          events[i].collapsed = false
          events[i].track = track.length - 1
        }
      }

      return track
    }
    function updateEvents () {
      // let allEvents = [].concat(com.data.filtered.events_scheduled).concat(com.data.filtered.events_ponctual)
      // let tracks = computeTrack(allEvents)
      // setEvenIcon(allEvents, tracks)

      // let tracksSched = computeTrack(com.data.filtered.events_scheduled)
      let tracksPonct = computeTrack(com.data.filtered.events_ponctual)

      let nLine = /* tracksSched.length + */ tracksPonct.length
      nLine = nLine < 2 ? 2 : nLine
      // setEvenIcon(com.data.filtered.events_scheduled, tracksSched, com.main.box.h / nLine, 'top')
      setEvenIcon(com.data.filtered.events_ponctual, tracksPonct, com.main.box.h / nLine, 'bottom')

      let height = com.main.box.h / nLine
      let currentTrack = com.main.scroll.scrollG
        .selectAll('g.track')
        .data(tracksPonct, function (d, i) {
          return i
        })
      let enterTrack = currentTrack
        .enter()
        .append('g')
        .attr('class', 'track')
        .attr('transform', function (d, i) {
          let translate = {
            y: height * i,
            x: 0
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      enterTrack.each(function (d, i) {
        d3.select(this).append('line')
          .attr('class', 'background')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', com.main.box.w)
          .attr('y2', 0)
          .attr('fill', 'transparent')
          .attr('fill-opacity', 1)
          .attr('stroke', colorTheme.dark.stroke)
          .attr('stroke-width', 0.1)
          .attr('stroke-dasharray', [2, 2])
      })
      enterTrack.merge(currentTrack)
        .transition()
        .duration(timeD.animArc)
        .ease(d3.easeLinear)
        .attr('transform', function (d, i) {
          let translate = {
            y: height * i,
            x: 0
          }
          return 'translate(' + translate.x + ',' + translate.y + ')'
        })
      currentTrack.exit()
        .transition('inOut').duration(timeD.animArc)
        .attr('width', 0)
        .style('opacity', 0)
        .remove()
    }
    function setEvenIcon (events, tracks, offset, position) {
      events = setDefaultStyleForEvents(events)

      // let nLine = tracks.length
      // let height = nLine >= 4 ? (com.main.box.h / nLine) : (com.main.box.h / 4)
      // let offsetY = nLine >= 6 ? 0 : (com.main.box.h - ((com.main.box.h / 6) * nLine)) / (nLine - 1)

      let timeScale = d3.scaleLinear()
        .range(com.eventTrack.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])

      let rect = com.main.scroll.scrollG
        .selectAll('g.' + com.main.tag + 'events')
        .data(events, function (d) {
          return d.id
        })
      rect.each(function (d, i) {
        let box = {x: 0, y: offset * d.track, w: com.main.box.w, h: offset * 1}
        if (position === 'bottom') box.y = com.main.box.h - (box.y + offset)
        let width = timeScale(d.endT) - timeScale(d.startT)
        width = width < box.h * 0.2 ? box.h * 0.2 : width
        d3.select(this)
          .transition('inOut')
          .duration(timeD.animArc)
          .attr('transform', 'translate(' + box.x + ',' + (box.y) + ')')
          // .attr('opacity', d => d.collapsed ? 1 : 1)
        d3.select(this).select('rect.back')
          // .transition('inOut')
          // .duration(timeD.animArc)
          // .ease(d3.easeLinear)
          .attr('x', timeScale(d.startT))
          .attr('y', function () {
            if (position === 'top') {
              return -box.y + d.track * box.h * 0.2
            } else {
              return box.h * 0.8 // offset * (d.track + 1) - (d.track + 1) * box.h * 0.2
            }
          })
          .attr('width', width) // timeScale(d.endT) - timeScale(d.startT))
          .attr('height', box.h * 0.2)
          .style('fill', com.main.colorTheme.blocks.wait.background)
          .style('fill-opacity', d.display.fillOpacity)
          .attr('stroke-width', d.display.strokeWidth)
          .style('stroke-opacity', d.display.strokeOpacity)
          // .style('stroke-dasharray', [box.h, width, width + box.h])
          // .attr('rx', box.h * 0.2)
          // .attr('ry', box.h * 0.2)
        d3.select(this).select('rect.pattern')
          // .transition('inOut')
          // .duration(timeD.animArc)
          .attr('x', timeScale(d.startT))
          .attr('y', 0)
          .attr('width', timeScale(d.endT) - timeScale(d.startT))
          .attr('height', box.h)
          .style('fill', d.display.patternFill)
          .style('fill-opacity', d.display.patternOpacity)
        d3.select(this).select('#icon')
          .attr('width', box.h * 0.75)
          .attr('height', box.h * 0.75)
          .attr('x', timeScale(d.startT))
          .attr('y', box.h * 0.0)
          .attr('opacity', d => d.collapsed ? 0 : 1)
        // d3.select(this).select('text')
        //   .transition('inOut')
        //   .duration(timeD.animArc)
        //   .ease(d3.easeLinear)
        //   .text(d.name)
        //   .style('font-size', (box.h * 0.5) + 'px')
        //   .attr('dy', 1)
        //   .attr('x', timeScale(d.startT) + (timeScale(d.endT) - timeScale(d.startT)) * 0.5)
        //   .attr('y', (box.h * 0.5))
        //   .style('opacity', d.display.fillOpacity)
        //   .style('stroke-opacity', d.display.fillOpacity)
        //   .style('fill-opacity', d.display.fillOpacity)
      })
    }

    function getEventsRows () {
      let timeScale = d3.scaleLinear()
        .range(com.eventTrack.axis.range)
        .domain([com.time.startTime.time, com.time.endTime.time])
      let scheds = groupEventsBySchedule(com.data.filtered)
      let nLine = scheds.length
      let height = com.main.box.h / nLine

      let ret = []
      for (let i = 0; i < scheds.length; i++) {
        for (let j = 0; j < scheds[i].events.length; j++) {
          let translate = {
            y: height * i,
            x: 0
          }
          ret.push({
            y: translate.y,
            x: timeScale(scheds[i].events[j].startTime),
            h: height,
            w: timeScale(scheds[i].events[j].endTime) - timeScale(scheds[i].events[j].startTime),
            event: scheds[i].events[j]
          })
        }
      }
      return ret
    }
    this.getEventsRows = getEventsRows

    // function addExtraBar (date) {
    //   let data = []
    //   if (date === null) {
    //     let rectNow = com.main.g
    //       .selectAll('rect.' + com.main.tag + 'extra')
    //       .data(data)
    //     rectNow.exit().remove()
    //   } else {
    //     data = [date]
    //     let rectNow = com.main.g
    //       .selectAll('rect.' + com.main.tag + 'extra')
    //       .data(data)
    //       .attr('transform', 'translate(' + com.eventTrack.axis.box.x + ',' + 0 + ')')
    //
    //     rectNow
    //       .enter()
    //       .append('rect')
    //       .attr('class', com.main.tag + 'extra')
    //       .style('opacity', 1)
    //       .attr('x', function (d, i) {
    //         if (d > com.eventTrack.axis.scale.domain()[1]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[1])
    //         else if (d < com.eventTrack.axis.scale.domain()[0]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[0])
    //         return com.eventTrack.axis.scale(d)
    //       })
    //       .attr('y', function (d, i) {
    //         return com.main.box.y - 1 * com.main.box.marg
    //       })
    //       .attr('width', 0)
    //       .attr('height', function (d, i) {
    //         return com.main.box.h + 1 * com.main.box.marg
    //       })
    //       .attr('stroke', d3.rgb(com.style.runRecCol).darker(1.0))
    //       .attr('fill', colsYellows[0])
    //       .attr('fill-opacity', 0.3)
    //       .style('stroke-opacity', 0.15)
    //       .attr('stroke-width', 3)
    //       .style('pointer-events', 'none')
    //       .attr('vector-effect', 'non-scaling-stroke')
    //       .merge(rectNow)
    //       .transition('inOut')
    //       .duration(50)
    //       .attr('x', function (d, i) {
    //         if (d > com.eventTrack.axis.scale.domain()[1]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[1])
    //         else if (d < com.eventTrack.axis.scale.domain()[0]) return com.eventTrack.axis.scale(com.eventTrack.axis.scale.domain()[0])
    //         return com.eventTrack.axis.scale(d)
    //       })
    //       // .attr("y", function(d,i) { return d.y; })
    //       .attr('width', function (d, i) {
    //         return com.main.box.marg
    //       })
    //   }
    // }
    function setTimeRect () {
      let rectNowData = []

      rectNowData = [
        {
          id: com.main.tag + 'now',
          x: com.eventTrack.axis.scale(com.time.currentTime.date),
          y: com.eventTrack.timeBars.box.y,
          w: com.eventTrack.timeBars.box.marg,
          h: com.eventTrack.timeBars.box.h + com.eventTrack.timeBars.box.marg * 2
        }
      ]
      // console.log('timeFrac',timeFrac,rectNowData);
      // console.log('rectNowData',(com.eventRow.run.length > 0),com.time.now,timeFrac,rectNowData[0]);

      // ---------------------------------------------------------------------------------------------------
      //
      // ---------------------------------------------------------------------------------------------------
      let rectNow = com.eventTrack.timeBars.g
        .selectAll('rect.' + com.main.tag + 'now')
        .data(rectNowData, function (d) {
          return d.id
        })

      rectNow
        .enter()
        .append('rect')
        .attr('class', com.main.tag + 'now')
        .style('opacity', 1)
        .attr('x', function (d, i) {
          return d.x
        })
        .attr('y', function (d, i) {
          return d.y - 1 * com.main.box.marg
        })
        .attr('width', 0)
        .attr('height', function (d, i) {
          return d.h
        })
        .attr('fill', com.style.runRecCol)
        .attr('fill-opacity', 0.3)
        .style('stroke-opacity', 0.15)
        .attr('stroke-width', 3)
        .style('pointer-events', 'none')
        .attr('vector-effect', 'non-scaling-stroke')
        .merge(rectNow)
        .transition('inOut')
        .duration(timeD.animArc)
        .attr('x', function (d, i) {
          return d.x
        })
        // .attr("y", function(d,i) { return d.y; })
        .attr('width', function (d, i) {
          return d.w
        })
      // .attr("height", function(d,i) { return d.h; })

      // rectNow.exit()
      //   .transition("inOut").duration(timeD.animArc/2)
      //   .attr("width", 0)
      //   .style("opacity", 0)
      //   .remove()
    }

    function remove () {
      com.eventTrack.g.remove()
      com.main.g.selectAll('g.allScheds').remove()
      if (com.eventTrack.axis.enabled) com.eventTrack.axis.g.remove()
      if (com.eventTrack.timeBars.enabled) com.eventTrack.timeBars.g.remove()
    }
    this.remove = remove
  }
  let eventQueueBib = new EventQueueBib()

  function init () {
    setDefaultStyle()
    initScrollBox()
    // this.initBackground()

    if (com.displayer === 'eventQueue') {
      eventQueueBib.init()
    } else if (com.displayer === 'eventTrack') {
      eventTrackBib.init()
    }
  }
  this.init = init
  function initScrollBox () {
    com.main.scroll.scrollBoxG = com.main.g.append('g')
    com.main.scroll.scrollBoxG.append('rect')
      .attr('class', 'background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', com.main.box.w)
      .attr('height', com.main.box.h)
      .style('fill', com.main.background.fill)
      .style('stroke', com.main.background.stroke)
      .style('stroke-width', com.main.background.strokeWidth)

    com.main.scroll.scrollBox = new ScrollBox()
    com.main.scroll.scrollBox.init({
      tag: 'eventDisplayerScroll',
      gBox: com.main.scroll.scrollBoxG,
      boxData: {
        x: 0,
        y: 0,
        w: com.main.box.w,
        h: com.main.box.h
      },
      useRelativeCoords: true,
      locker: new Locker(),
      lockerV: ['eventDisplayerScroll' + 'updateData'],
      lockerZoom: {
        all: 'eventDisplayerScroll' + 'zoom',
        during: 'eventDisplayerScroll' + 'zoomDuring',
        end: 'eventDisplayerScroll' + 'zoomEnd'
      },
      runLoop: new RunLoop({tag: 'eventDisplayerScroll'}),
      canScroll: true,
      scrollVertical: false,
      scrollHorizontal: true,
      scrollHeight: 0,
      scrollWidth: 0,
      background: 'transparent',
      scrollRecH: {h: 2},
      scrollRecV: {w: 2}
    })
    com.main.scroll.scrollG = com.main.scroll.scrollBox.get('innerG')
  }
  function initBackground () {
    com.main.g.append('rect')
      .attr('class', 'background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', com.main.box.w)
      .attr('height', com.main.box.h)
      .style('fill', com.main.background.fill)
      .style('stroke', com.main.background.stroke)
      .style('stroke-width', com.main.background.strokeWidth)
  }
  this.initBackground = initBackground

  function filterData (optIn) {
    function checkFilter (d, f) {
      let op = f.operation
      let co = f.contains
      let filters = f.filters

      if (co === 'all') {
        for (let i = 0; i < filters.length; i++) {
          let target = d
          for (let j = 0; j < filters[i].keys.length; j++) {
            target = target[filters[i].keys[j]]
          }
          if (Array.isArray(target)) {
            if (target.indexOf(filters[i].value) === -1) {
              if (op === 'exclude') return false
              if (op === 'include') return true
            }
          } else if (target !== filters[i].value) {
            if (op === 'exclude') return false
            if (op === 'include') return true
          }
        }
        if (op === 'exclude') return true
        if (op === 'include') return false
      } else if (co === 'one') {
        for (let i = 0; i < filters.length; i++) {
          let target = d
          for (let j = 0; j < filters[i].keys.length; j++) {
            target = target[filters[i].keys[j]]
          }
          if (Array.isArray(target)) {
            if (target.indexOf(filters[i].value) !== -1) {
              if (op === 'exclude') return true
              if (op === 'include') return false
            }
          } else if (target === filters[i].value) {
            if (op === 'exclude') return true
            if (op === 'include') return false
          }
        }
        if (op === 'exclude') return false
        if (op === 'include') return true
      }
      return false
    }

    let filters = optIn.filters ? optIn.filters : com.filters.filtering

    let filtered = {done: [], run: [], cancel: [], wait: [], fail: []}
    let stats = {tot: 0, filtered: 0}
    stats.tot = com.data.raw.events.done.length + com.data.raw.events.wait.length + com.data.raw.events.run.length
    // separate event according to states
    for (var z = 0; z < com.data.raw.events.done.length; z++) {
      let dataNow = com.data.raw.events.done[z]
      dataNow.filtered = false
      if (filters.length === 0) {
        if (dataNow.exeState.state === 'done') filtered.done.push(dataNow)
        if (dataNow.exeState.state === 'fail') filtered.fail.push(dataNow)
        if (dataNow.exeState.state === 'cancel') filtered.cancel.push(dataNow)
      } else {
        for (var i = 0; i < filters.length; i++) {
          let filterNow = filters[i]
          let allPropChecked = true
          if (!checkFilter(dataNow, filterNow)) allPropChecked = false
          if (allPropChecked) {
            dataNow.filtered = true
          }
        }
        if (dataNow.exeState.state === 'done') filtered.done.push(dataNow)
        if (dataNow.exeState.state === 'fail') filtered.fail.push(dataNow)
        if (dataNow.exeState.state === 'cancel') filtered.cancel.push(dataNow)
      }
      if (dataNow.filtered) stats.filtered += 1
    }

    filtered.wait = com.data.raw.events.wait.map(function (dataNow) {
      dataNow.filtered = false
      if (filters.length === 0) return dataNow
      for (var i = 0; i < filters.length; i++) {
        let filterNow = filters[i]
        let allPropChecked = true
        if (!checkFilter(dataNow, filterNow)) allPropChecked = false
        if (allPropChecked) {
          dataNow.filtered = true
        }
      }
      if (dataNow.filtered) stats.filtered += 1
      return dataNow
    })
    filtered.run = com.data.raw.events.run.map(function (dataNow) {
      dataNow.filtered = false
      if (filters.length === 0) return dataNow
      for (var i = 0; i < filters.length; i++) {
        let filterNow = filters[i]
        let allPropChecked = true
        if (!checkFilter(dataNow, filterNow)) allPropChecked = false
        if (allPropChecked) {
          dataNow.filtered = true
        }
      }
      if (dataNow.filtered) stats.filtered += 1
      return dataNow
    })
    return {data: filtered, stats: stats}
  }
  this.filterData = filterData
  function createEventsGroup () {
    let allEvents = [].concat(com.data.filtered.events_ponctual)
      .concat(com.data.filtered.events_scheduled)

    let rect = com.main.scroll.scrollG
      .selectAll('g.' + com.main.tag + 'events')
      .data(allEvents, function (d) {
        return d.id
      })
    let rectEnter = rect
      .enter()
      .append('g')
      .attr('class', com.main.tag + 'events')
      .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
    rectEnter.each(function (d, i) {
      let parent = d3.select(this)
      d3.select(this).append('rect')
        .attr('class', 'back')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0)
        .attr('stroke', com.main.colorTheme.dark.stroke)
        .style('fill', com.main.colorTheme.dark.background)
        .style('fill-opacity', 1)
        .attr('stroke-width', 0)
        .style('stroke-opacity', 0)
        .style('stroke-dasharray', [])
        .attr('vector-effect', 'non-scaling-stroke')
        .on('click', function (d) {
          let event = d3.event
          let node = d3.select(this)
          node.attr('clicked', 1)

          setTimeout(function () {
            if (node.attr('clicked') === '2') return
            if (event.ctrlKey) {
              // com.input.selection.push(that)
            } else {
              // com.input.selection = [that]
            }
            com.events.event.click(d)
          }, 250)
        })
        .on('dblclick', function (d) {
          let node = d3.select(this)
          node.attr('clicked', 2)
        })
        .on('mouseover', function (d) {
          d3.select(this).style('cursor', 'pointer')
          com.events.event.mouseover(d)
        })
        .on('mouseout', function (d) {
          d3.select(this).style('cursor', 'default')
          com.events.event.mouseout(d)
        })
        .call(d3.drag()
          .on('start', function (d) {
            com.interaction = {}
            com.interaction.oldG = parent
            com.events.event.drag.start(d)
          })
          .on('drag', function (d) {
            com.events.event.drag.tick(d)
          })
          .on('end', function (d) {
            com.events.event.drag.end(d)
          }))
      d3.select(this).append('rect')
        .attr('class', 'pattern')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0)
        .attr('stroke', 'none')
        .style('fill', 'none')
        .style('fill-opacity', 1)
        .style('stroke-opacity', 0)
        .style('pointer-events', 'none')
        .attr('vector-effect', 'non-scaling-stroke')
      d3.select(this).append('text')
        .attr('class', 'name')
        .text(d.name)
        .style('font-weight', 'normal')
        .style('opacity', 0)
        .style('fill', '#000000')
        .style('stroke-width', 0.3)
        .style('stroke-opacity', 1)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('pointer-events', 'none')
        .style('stroke', '#000000')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
      d3.select(this).append('svg:image')
        .attr('id', 'icon')
        .attr('xlink:href', '/static/' + d.icon)
        .attr('width', 0)
        .attr('height', 0)
        .attr('x', 0)
        .attr('y', 0)
        .style('pointer-events', 'none')
    })
    rect = rectEnter.merge(rect)
  }
  function updateData (dataIn) {
    com.main.g.select('text.name')
      .transition()
      .duration(400)
      .style('opacity', 0)
    com.time.currentTime = dataIn.time.currentTime
    com.time.startTime = dataIn.time.startTime
    com.time.endTime = dataIn.time.endTime
    com.data.raw = dataIn.data.raw
    com.data.modified = dataIn.data.modified
    // com.filters.filtering = updateFiltering()
    // com.data.filtered = filterData({}).data
    com.data.filtered = com.data.raw
    createEventsGroup()

    if (com.displayer === 'eventQueue') {
      eventQueueBib.update()
    } else if (com.displayer === 'eventTrack') {
      eventTrackBib.update()
    }
  }
  this.updateData = updateData
  function update () {
    com.filters.filtering = updateFiltering()
    com.data.filtered = filterData({}).data
    createEventsGroup()
    if (com.displayer === 'eventQueue') {
      eventQueueBib.update()
    } else if (com.displayer === 'eventTrack') {
      eventTrackBib.update()
    }
  }
  this.update = update

  function changeDisplayer (newDisplayer) {
    if (com.displayer === newDisplayer) return

    if (com.displayer === 'eventQueue') {
      eventQueueBib.remove()
    } else if (com.displayer === 'eventTrack') {
      eventTrackBib.remove()
    }

    com.displayer = newDisplayer
    if (com.displayer === 'eventQueue') {
      eventQueueBib.init()
      eventQueueBib.update()
    } else if (com.displayer === 'eventTrack') {
      eventTrackBib.init()
      eventTrackBib.update()
    }
  }
  this.changeDisplayer = changeDisplayer

  function getEventsRows () {
    if (com.displayer === 'eventQueue') {
      eventQueueBib.getEventsRows()
    } else if (com.displayer === 'eventTrack') {
      eventTrackBib.getEventsRows()
    }
  }
  this.getEventsRows = getEventsRows

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  // function eventsMouseOver (data) {
  //   let totEvents = com.eventQueue.events.run.g.selectAll('g.' + com.main.tag + 'events')
  //   if (com.eventQueue.events.cancel.g) totEvents.merge(com.eventQueue.events.cancel.g.selectAll('g.' + com.main.tag + 'events'))
  //
  //   totEvents.each(function (d) {
  //     if (d.data.metaData.nSched === data.data.metaData.nSched && d.data.metaData.nObs !== data.data.metaData.nObs) {
  //       d3.select(this).select('rect.back').attr('stroke-width', 6)
  //         .style('stroke-opacity', 1)
  //         .attr('stroke-dasharray', [4, 2])
  //     }
  //   })
  // }
  // function eventsMouseOut (data) {
  //   let totEvents = com.eventQueue.events.run.g.selectAll('g.' + com.main.tag + 'events')
  //   if (com.eventQueue.events.cancel.g) totEvents.merge(com.eventQueue.events.cancel.g.selectAll('g.' + com.main.tag + 'events'))
  //
  //   totEvents.each(function (d) {
  //     if (d.data.metaData.nSched === data.data.metaData.nSched && d.data.metaData.nObs !== data.data.metaData.nObs) {
  //       d3.select(this).select('rect.back').attr('stroke-width', 1)
  //         .style('stroke-opacity', 0.4)
  //         .attr('stroke-dasharray', [])
  //     }
  //   })
  // }

  function overEvent (id) {
    com.input.over.event = id
    if (com.displayer === 'eventQueue') {
      eventQueueBib.update()
    } else if (com.displayer === 'eventTrack') {
      eventTrackBib.update()
    }
  }
  this.overEvent = overEvent
  function outEvent (id) {
    com.input.over.event = undefined
    if (com.displayer === 'eventQueue') {
      eventQueueBib.update()
    } else if (com.displayer === 'eventTrack') {
      eventTrackBib.update()
    }
  }
  this.outEvent = outEvent

  function focusOnEvent (id) {
    com.input.focus.event = id
    if (com.displayer === 'eventQueue') {
      eventQueueBib.update()
    } else if (com.displayer === 'eventTrack') {
      eventTrackBib.update()
    }
  }
  this.focusOnEvent = focusOnEvent
  function unfocusOnEvent (id) {
    com.input.focus.event = undefined
    if (com.displayer === 'eventQueue') {
      eventQueueBib.update()
    } else if (com.displayer === 'eventTrack') {
      eventTrackBib.update()
    }
  }
  this.unfocusOnEvent = unfocusOnEvent

  function updateFiltering () {
    let allFilters = []
    for (let i = com.filters.eventFilters.length - 1; i > -1; i--) {
      let filters = com.filters.eventFilters[i].getFilters()
      allFilters = allFilters.concat(filters)
    }
    return allFilters
  }
  function plugEventFilters (eventFilters, propagate) {
    com.filters.eventFilters.push(eventFilters)
    if (propagate) eventFilters.plugEventQueue(this, !propagate)
  }
  this.plugEventFilters = plugEventFilters
  function unplugEventFilters (eventFilters, propagate) {
    for (let i = com.filters.eventFilters.length - 1; i > -1; i--) {
      if (com.filters.eventFilters[i] === eventFilters) {
        com.filters.eventFilters[i].remove()
      }
    }
    if (propagate) eventFilters.unplugEventQueue(this, !propagate)
  }
  this.unplugEventFilters = unplugEventFilters
}
