/* global $ */
/* global d3 */
/* global hasVar */
/* global getColorTheme */

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.ScrollForm = function (optIn) {
  let colorTheme = getColorTheme('bright-Grey')
  let template = {}
  let com = {}
  com = optIn

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  com.component = {}
  com.component.fo = com.main.g.append('foreignObject')
    .attr('width', com.main.box.w + 'px')
    .attr('height', com.main.box.h + 'px')
    .attr('x', com.main.box.x + 'px')
    .attr('y', com.main.box.y + 'px')

  let rootDivWidth = '100%'
  if (com.quickScroll.enabled) rootDivWidth = 'calc(100% - ' + com.quickScroll.width + ')'
  com.component.rootDiv = com.component.fo.append('xhtml:div')
    .style('display', 'inline-block')
    .style('border', 0 + 'px solid #78909C')
    .style('background-color', colorTheme.dark.background)
    .style('width', rootDivWidth)
    .style('height', 'calc(100% - ' + com.titles.height + ')')
  if (com.quickScroll.enabled) {
    com.component.quickDiv = com.component.fo.append('xhtml:div')
      .style('display', 'inline-block')
      .style('background-color', '#333333')
      .style('width', com.quickScroll.width)
      .style('height', 'calc(100% - ' + com.titles.height + ')')
  }
  com.component.titleDiv = com.component.rootDiv.append('div')
    .style('height', com.titles.height)
    .style('border', 0 + 'px solid #78909C')
    .style('background-color', colorTheme.darker.background)
  com.component.contentDiv = com.component.rootDiv.append('div')
    .attr('class', 'overflowVerticalDiv')
    .style('border', 0 + 'px solid #78909C')
    .style('background-color', colorTheme.brighter.background)

  function setTitles () {
    com.component.titles = []
    let offsetScroll = 8 / com.titles.data.length
    for (var i = 0; i < com.titles.data.length; i++) {
      let t = com.titles.data[i]
      let comp = com.component.titleDiv.append('div')
        .style('display', 'inline-block')
        .style('width', 'calc(' + t.width + ' - ' + offsetScroll + 'px)')
        .style('height', com.titles.height)
        .style('background', colorTheme.darker.background)
        .style('text-align', t.anchor)
      comp.append('label')
        .html(t.title)
        .attr('class', 'title')
        .style('display', 'inline-block')
        .style('color', colorTheme.darker.text)
        .style('font-size', 12 + 'px')
        .style('background', 'transparent')
        .style('text-align', t.anchor)
    }
  }
  setTitles()

  function updateData (data, format) {
    com.data.data = data
    com.data.format = format
    update()
  }
  this.updateData = updateData

  function formatData (key, data, div) {
    if (com.data.format === 'modification') {
      div.append('label')
        .html(key)
        .style('display', 'inline-block')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('background', 'transparent')
      div.append('label')
        .html(':')
        .style('display', 'inline-block')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('background', 'transparent')
      div.append('label')
        .html(data.old)
        .style('display', 'inline-block')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('background', 'transparent')
      div.append('label')
        .html('-> ')
        .style('display', 'inline-block')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('background', 'transparent')
      div.append('label')
        .html(data.new)
        .style('display', 'inline-block')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('background', 'transparent')
    } else if (com.data.format === 'info') {
      div.append('label')
        .html(key)
        .style('display', 'inline-block')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('background', 'transparent')
      div.append('label')
        .html(':')
        .style('display', 'inline-block')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('background', 'transparent')
      div.append('label')
        .html(data)
        .style('display', 'inline-block')
        .style('color', '#000000')
        .style('font-size', 10 + 'px')
        .style('background', 'transparent')
    }
  }

  function fillDivs (title, group, divs, index) {
    let info = group.data
    let childs = group.childs
    let innerDiv = divs[index].append('div')
      .style('margin-bottom', '6px')
      .style('background', colorTheme.brighter.background)
    innerDiv.append('label')
      .html(com.titles.data[index].extension + title)
      .attr('class', 'title')
      .style('display', 'block')
      .style('color', colorTheme.dark.text)
      .style('background', colorTheme.dark.background)
    for (let key in info) {
      let lines = info[key]
      for (let j = 0; j < lines.length; j++) {
        let modif = lines[j]
        let lineDiv = innerDiv.append('div')
          .style('background', (j % 2 === 1 ? colorTheme.bright.background : colorTheme.brighter.background))
        formatData(key, modif, lineDiv)
      }
    }
    for (var children in childs) {
      fillDivs(children, childs[children], divs, index + 1)
    }
  }

  function update () {
    for (let key in com.data.data) {
      let group = com.data.data[key]

      let parentDiv = com.component.contentDiv.append('div')
        .attr('id', 'id_' + key)
        .style('width', '100%')
      let divs = []
      for (let i = 0; i < com.titles.data.length; i++) {
        divs.push(parentDiv.append('div')
          .style('display', 'inline-block')
          .style('width', 'calc(' + com.titles.data[i].width + ' - 2px)')
          .style('background', 'transparent')
          .style('vertical-align', 'top')
          .style('border-rigth', '2px solid #ffffff'))
      }
      fillDivs(key, group, divs, 0)
    }

    let totOffset = 0
    let totScrollHeight = com.component.contentDiv._groups[0][0].scrollHeight
    let sizes = []
    for (let key in com.data.data) {
      let setOffsetTo = totOffset
      let scrollHeight = com.component.contentDiv.select('div#id_' + key)._groups[0][0].scrollHeight
      sizes.push([scrollHeight, setOffsetTo])
      totOffset += scrollHeight
    }

    let ratio = com.component.contentDiv._groups[0][0].clientHeight / totOffset
    let even = 0
    for (let key in com.data.data) {
      let local = even
      com.component.quickDiv.append('div')
        .style('width', '100%')
        .style('height', (sizes[local][0] * ratio) + 'px')
        .style('background', (local % 2 === 1 ? colorTheme.medium.background : colorTheme.brighter.background))
        .on('mouseover', function () {
          com.component.contentDiv
            .transition()
            .delay(300)
            .duration(400)
            .on('start', function () {
              com.component.contentDiv.attr('canInterrupt', false)
            })
            .tween('scroll', function () {
              let that = this
              var i = d3.interpolateNumber(that.scrollTop, sizes[local][1])
              return function (t) { that.scrollTop = i(t) }
            })
            .on('end', function () {
              com.component.contentDiv.attr('canInterrupt', true)
            })
        })
        .on('mouseout', function () {
          if (com.component.contentDiv.attr('canInterrupt') === 'true') {
            com.component.contentDiv.interrupt()
          }
        })
        .on('wheel.zoom', function () {
          d3.event.preventDefault()
          let newScrollTop = com.component.contentDiv._groups[0][0].scrollTop + d3.event.deltaY
          if (newScrollTop < sizes[local][1]) {
            com.component.contentDiv
              .transition()
              .duration(300)
              .ease(d3.easeLinear)
              .tween('scroll', function () {
                let that = this
                var i = d3.interpolateNumber(that.scrollTop, sizes[local][1])
                return function (t) { that.scrollTop = i(t) }
              })
          } else if ((newScrollTop + com.component.contentDiv._groups[0][0].clientHeight) > (sizes[local][1] + sizes[local][0])) {
            com.component.contentDiv
              .transition()
              .duration(300)
              .ease(d3.easeLinear)
              .tween('scroll', function () {
                let that = this
                var i = d3.interpolateNumber(that.scrollTop, (sizes[local][1] + sizes[local][0] - com.component.contentDiv._groups[0][0].clientHeight))
                return function (t) { that.scrollTop = i(t) }
              })
          } else {
            com.component.contentDiv
              .transition()
              .duration(300)
              .ease(d3.easeLinear)
              .tween('scroll', function () {
                let that = this
                var i = d3.interpolateNumber(that.scrollTop, newScrollTop)
                return function (t) { that.scrollTop = i(t) }
              })
          }
        })
      even += 1
    }
  }
}
