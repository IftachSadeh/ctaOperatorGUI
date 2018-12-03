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
    .style('background-color', 'transparent')
    .style('width', rootDivWidth)
    .style('height', function () {
      if (com.titles.data.length > 0) return 'calc(100% - ' + com.titles.height + ')'
      return '100%'
    })
  if (com.quickScroll.enabled) {
    com.component.quickDiv = com.component.fo.append('xhtml:div')
      .style('display', 'inline-block')
      .style('background-color', '#333333')
      .style('width', com.quickScroll.width)
      .style('height', function () {
        if (com.titles.data.length > 0) return 'calc(100% - ' + com.titles.height + ')'
        return '100%'
      })
  }
  if (com.titles.data.length > 0) {
    com.component.titleDiv = com.component.rootDiv.append('div')
      .style('height', com.titles.height)
      .style('border', 0 + 'px solid #78909C')
      .style('background-color', 'transparent')
      .style('border-radius', '0px 0px 0px 0px')
  }
  com.component.contentDiv = com.component.rootDiv.append('div')
    .attr('class', 'overflowVerticalDiv')
    .style('border', 0 + 'px solid #78909C')
    .style('background-color', 'transparent')

  function setTitles () {
    com.component.titles = []
    let offsetScroll = 8 / com.titles.data.length
    for (var i = 0; i < com.titles.data.length; i++) {
      let t = com.titles.data[i]
      let comp = com.component.titleDiv.append('div')
        .style('display', 'inline-block')
        .style('width', 'calc(' + t.width + ' - ' + offsetScroll + 'px)')
        .style('height', com.titles.height)
        .style('background', 'transparent')
        .style('text-align', t.anchor)
        .style('border-radius', '0px 0px 0px 0px')
      comp.append('label')
        .html(t.title)
        .attr('class', 'title')
        .style('display', 'inline-block')
        .style('font-weight', 'bold')
        .style('color', colorTheme.darker.text)
        .style('font-size', 12 + 'px')
        .style('background', 'transparent')
        .style('text-align', t.anchor)
    }
  }
  if (com.titles.data.length > 0) setTitles()

  function updateData (data, format) {
    com.data.data = data
    com.data.format = format
    update()
  }
  this.updateData = updateData

  // function formatData (key, data, div) {
  //   let keyMaj = key.charAt(0).toUpperCase() + key.slice(1)
  //   if (com.data.format === 'modification') {
  //     div.append('label')
  //       .html(keyMaj)
  //       .style('display', 'inline-block')
  //       .style('color', '#000000')
  //       .style('font-size', 10 + 'px')
  //       .style('background', 'transparent')
  //       .style('margin-left', '6px')
  //     div.append('label')
  //       .html(' : ')
  //       .style('display', 'inline-block')
  //       .style('color', '#000000')
  //       .style('font-size', 10 + 'px')
  //       .style('background', 'transparent')
  //     div.append('label')
  //       .html(data.old)
  //       .style('display', 'inline-block')
  //       .style('color', '#000000')
  //       .style('font-size', 10 + 'px')
  //       .style('background', 'transparent')
  //     div.append('label')
  //       .html('-> ')
  //       .style('display', 'inline-block')
  //       .style('color', '#000000')
  //       .style('font-size', 10 + 'px')
  //       .style('background', 'transparent')
  //     div.append('label')
  //       .html(data.new)
  //       .style('display', 'inline-block')
  //       .style('color', '#000000')
  //       .style('font-size', 10 + 'px')
  //       .style('background', 'transparent')
  //   } else if (com.data.format === 'info') {
  //     div.on('click', function (d) { if (data.click) data.click(div) })
  //     div.on('mouseover', function (d) {
  //       if (data.mouseover) {
  //         div.style('background-color', '#F1F1F1')
  //         data.mouseover(key, data)
  //       }
  //     })
  //     div.on('mouseout', function (d) {
  //       if (data.mouseout) {
  //         div.style('background-color', 'transparent')
  //         data.mouseout(key, data)
  //       }
  //     })
  //     div.append('label')
  //       .html(keyMaj)
  //       .attr('id', 'key')
  //       .style('display', 'inline-block')
  //       .style('color', '#000000')
  //       .style('font-size', 10 + 'px')
  //       .style('background', 'transparent')
  //       .style('margin-left', '6px')
  //     div.append('label')
  //       .attr('id', 'dot')
  //       .html(' : ')
  //       .style('display', 'inline-block')
  //       .style('color', '#000000')
  //       .style('font-size', 10 + 'px')
  //       .style('background', 'transparent')
  //     if (data.new) {
  //       div.append('label')
  //         .attr('id', 'new')
  //         .html(data.new)
  //         .style('display', 'inline-block')
  //         .style('color', '#000000')
  //         .style('font-size', 10 + 'px')
  //         .style('background', 'transparent')
  //       div.append('label')
  //         .attr('id', 'arrow')
  //         .html(' -> ')
  //         .style('display', 'inline-block')
  //         .style('color', '#000000')
  //         .style('font-size', 10 + 'px')
  //         .style('background', 'transparent')
  //     }
  //     if (data.format) {
  //       if (data.format.type === 'comboList') comboList(div, data)
  //       return
  //     }
  //     div.append('label')
  //       .attr('id', 'old')
  //       .html(data.value)
  //       .style('display', 'inline-block')
  //       .style('color', '#000000')
  //       .style('font-size', 10 + 'px')
  //       .style('background', 'transparent')
  //   }
  // }

  // function fillDivs (title, group, divs, index) {
  //   let info = group.data
  //   let childs = group.childs
  //   title = title.charAt(0).toUpperCase() + title.slice(1)
  //   let innerDiv = divs[index].append('div')
  //     .style('margin-bottom', '6px')
  //     .style('background', colorTheme.brighter.background)
  //   innerDiv.append('label')
  //     .html(com.titles.data[index].extension + title)
  //     .attr('class', 'title')
  //     .style('display', 'block')
  //     .style('color', colorTheme.dark.text)
  //     .style('background', colorTheme.dark.background)
  //   for (let key in info) {
  //     let lines = info[key]
  //     let lineDiv = innerDiv.append('div')
  //     formatData(key, lines, lineDiv)
  //     // for (let j = 0; j < lines.length; j++) {
  //     //   let modif = lines[j]
  //     //   let lineDiv = innerDiv.append('div')
  //     //     .style('background', (j % 2 === 1 ? colorTheme.bright.background : colorTheme.brighter.background))
  //     //   formatData(key, modif, lineDiv)
  //     // }
  //   }
  //   for (var children in childs) {
  //     fillDivs(children, childs[children], divs, index + 1)
  //   }
  // }

  function plainTextDiv (div) {
    // title = title.charAt(0).toUpperCase() + title.slice(1)
    // let innerDiv = divs[index].append('div')
    //   .style('margin-bottom', '6px')
    //   .style('background', colorTheme.brighter.background)
    div.attr('class', 'divForm titleDiv')

    div.append('label')
      .html(function (d) { return d.key })
      .attr('class', 'title')
      .style('color', colorTheme.dark.text)
      .style('background', 'transparent')
  }
  function modificationDiv (div) {
    div.on('click', function (d) {
      if (!d.event) return
      if (d.event.click) d.event.click(d)
    })
    div.on('mouseover', function (d) {
      if (!d.event) return
      if (d.event.mouseover) {
        div.style('background-color', '#F1F1F1')
        d.event.mouseover(d)
      }
    })
    div.on('mouseout', function (d) {
      if (!d.event) return
      if (d.event.mouseout) {
        div.style('background-color', 'transparent')
        d.event.mouseout(d)
      }
    })

    div.attr('class', 'divForm modificationDiv')

    div.append('label')
      .attr('class', 'key')
      .html(function (d) { return d.key })
      .style('display', 'inline-block')
      .style('color', '#000000')
      .style('font-size', 8 + 'px')
      .style('background', 'transparent')
      .style('margin-left', '6px')
    div.append('label')
      .attr('class', 'dot')
      .html(' : ')
      .style('display', 'inline-block')
      .style('color', '#000000')
      .style('font-size', 8 + 'px')
      .style('background', 'transparent')
    div.append('label')
      .attr('class', 'old')
      .html(function (d) { return d.value.old })
      .style('display', 'inline-block')
      .style('color', '#000000')
      .style('font-size', 8 + 'px')
      .style('background', 'transparent')
    div.append('label')
      .attr('class', 'arrow')
      .html('-> ')
      .style('display', 'inline-block')
      .style('color', '#000000')
      .style('font-size', 8 + 'px')
      .style('background', 'transparent')
    div.append('label')
      .attr('class', 'new')
      .html(function (d) { return d.value.new })
      .style('display', 'inline-block')
      .style('color', '#000000')
      .style('font-size', 8 + 'px')
      .style('background', 'transparent')
  }
  function infoDiv (div) {
    div.on('click', function (d) {
      if (!d.event) return
      if (d.event.click) d.event.click(d)
    })
    div.on('mouseover', function (d) {
      if (!d.event) return
      if (d.event.mouseover) {
        div.style('background-color', '#F1F1F1')
        d.event.mouseover(d)
      }
    })
    div.on('mouseout', function (d) {
      if (!d.event) return
      if (d.event.mouseout) {
        div.style('background-color', 'transparent')
        d.event.mouseout(d)
      }
    })

    div.attr('class', 'divForm infoDiv')

    div.append('label')
      .html(function (d) { return d.key })
      .attr('class', 'key')
      .attr('id', 'key')
      .style('display', 'inline-block')
      .style('color', '#000000')
      // .style('font-size', 10 + 'px')
      .style('background', 'transparent')
    div.append('label')
      .attr('id', 'dot')
      .attr('class', 'dot')
      .html(' : ')
      .style('display', 'inline-block')
      .style('color', '#000000')
      // .style('font-size', 10 + 'px')
      .style('background', 'transparent')
    div.append('label')
      .attr('class', 'new')
      .attr('id', 'new')
      .html(function (d) { return d.value })
      .style('display', 'inline-block')
      .style('color', '#000000')
      // .style('font-size', 10 + 'px')
      .style('background', 'transparent')
  }
  function dropDownDiv (div) {
    // div.on('click', function (d) { if (d.event.click) d.event.click(d) })
    div.on('mouseover', function (d) {
      if (d.event.mouseover) {
        div.style('background-color', '#F1F1F1')
        d.event.mouseover(d)
      }
    })
    div.on('mouseout', function (d) {
      if (d.event.mouseout) {
        div.style('background-color', 'transparent')
        d.event.mouseout(d)
      }
    })

    div.attr('class', 'divForm dropDownDiv')

    div.append('label')
      .attr('class', 'key')
      .html(function (d) { return d.key })
      .attr('id', 'key')
      .style('display', 'inline-block')
      .style('color', '#000000')
      // .style('font-size', 10 + 'px')
      .style('background', 'transparent')
      // .style('margin-left', '6px')
    div.append('label')
      .attr('class', 'dot')
      .attr('id', 'dot')
      .html(' : ')
      .style('display', 'inline-block')
      .style('color', '#000000')
      // .style('font-size', 10 + 'px')
      .style('background', 'transparent')
    let selector = div.append('select')
      .style('width', 'auto')
      .style('font-size', '9px')
      .style('height', div.style('height'))
      .style('border', '0.2px')
      .on('change', function (d) {
        let selectValue = div.select('select').property('value')
        d.event.click(selectValue, d)
      })
    selector.selectAll('option')
      .data(function (d) { return d.value.select })
      .enter()
      .append('option')
      .text(function (d) { return d })
    selector.property('value', function (d) {
      return d.value.current
    })
  }
  function divideDiv (div, data) {
    div.selectAll('div.divideChilds')
      .data(data)
      .enter()
      .append('div')
      .attr('class', 'divideChilds')
      .attr('id', function (d) { return 'id_' + d.key })
      .style('width', ((100 / data.length) - (2 * data.length - 1)) + '%')
      .style('margin-left', '2%')
      .style('display', 'inline-block')
      .style('vertical-align', 'top')
      .each(function (d) {
        createSubForm(d3.select(this), d)
        // if (Array.isArray(d)) {
        //   divideDiv(d3.select(this), d)
        // } else {
        //   createSubForm(d3.select(this), d)
        // }
      })
  }
  function createSubForm (div, data) {
    div.selectAll('div.divForm')
      .data(data)
      .enter()
      .append('div')
      .attr('class', 'divForm')
      .attr('id', function (d) { return 'id_' + d.key })
      .style('background', colorTheme.brighter.background)
      .style('border-radius', '5px 5px 5px 5px')
      .each(function (d) {
        if (Array.isArray(d)) {
          d3.select(this).style('background', 'transparent')
          divideDiv(d3.select(this), d)
        } else {
          if (d.format === 'plainText') plainTextDiv(d3.select(this))
          else if (d.format === 'info') infoDiv(d3.select(this))
          else if (d.format === 'comboList') dropDownDiv(d3.select(this))
          else if (d.format === 'modification') modificationDiv(d3.select(this))
          createSubForm(d3.select(this), d.childs)
        }
      })
  }
  function update () {
    if (!Object.keys(com.data.data).length) return
    if (com.data.data.childs.length === 0) return

    createSubForm(com.component.contentDiv, com.data.data.childs)

    // for (let key in com.data.data) {
    //   let group = com.data.data[key]
    //
    //   let parentDiv = com.component.contentDiv.append('div')
    //     .attr('id', 'id_' + key)
    //     .style('width', '100%')
    //   let divs = []
    //   for (let i = 0; i < com.titles.data.length; i++) {
    //     divs.push(parentDiv.append('div')
    //       .style('display', 'inline-block')
    //       .style('width', 'calc(' + com.titles.data[i].width + ' - 2px)')
    //       .style('background', 'transparent')
    //       .style('vertical-align', 'top')
    //       .style('border-rigth', '2px solid #ffffff'))
    //   }
    //   fillDivs(key, group, divs, 0)
    // }

    // let totOffset = 0
    // let totScrollHeight = com.component.contentDiv._groups[0][0].scrollHeight
    // let sizes = []
    // for (let key in com.data.data) {
    //   let setOffsetTo = totOffset
    //   let scrollHeight = com.component.contentDiv.select('div#id_' + key)._groups[0][0].scrollHeight
    //   sizes.push([scrollHeight, setOffsetTo])
    //   totOffset += scrollHeight
    // }
    //
    // let ratio = com.component.contentDiv._groups[0][0].clientHeight / totOffset
    // let even = 0
    // for (let key in com.data.data) {
    //   let local = even
    //   com.component.quickDiv.append('div')
    //     .style('width', '100%')
    //     .style('height', (sizes[local][0] * ratio) + 'px')
    //     .style('background', (local % 2 === 1 ? colorTheme.medium.background : colorTheme.brighter.background))
    //     .on('mouseover', function () {
    //       com.component.contentDiv
    //         .transition()
    //         .delay(300)
    //         .duration(400)
    //         .on('start', function () {
    //           com.component.contentDiv.attr('canInterrupt', false)
    //         })
    //         .tween('scroll', function () {
    //           let that = this
    //           var i = d3.interpolateNumber(that.scrollTop, sizes[local][1])
    //           return function (t) { that.scrollTop = i(t) }
    //         })
    //         .on('end', function () {
    //           com.component.contentDiv.attr('canInterrupt', true)
    //         })
    //     })
    //     .on('mouseout', function () {
    //       if (com.component.contentDiv.attr('canInterrupt') === 'true') {
    //         com.component.contentDiv.interrupt()
    //       }
    //     })
    //     .on('wheel.zoom', function () {
    //       d3.event.preventDefault()
    //       let newScrollTop = com.component.contentDiv._groups[0][0].scrollTop + d3.event.deltaY
    //       if (newScrollTop < sizes[local][1]) {
    //         com.component.contentDiv
    //           .transition()
    //           .duration(300)
    //           .ease(d3.easeLinear)
    //           .tween('scroll', function () {
    //             let that = this
    //             var i = d3.interpolateNumber(that.scrollTop, sizes[local][1])
    //             return function (t) { that.scrollTop = i(t) }
    //           })
    //       } else if ((newScrollTop + com.component.contentDiv._groups[0][0].clientHeight) > (sizes[local][1] + sizes[local][0])) {
    //         com.component.contentDiv
    //           .transition()
    //           .duration(300)
    //           .ease(d3.easeLinear)
    //           .tween('scroll', function () {
    //             let that = this
    //             var i = d3.interpolateNumber(that.scrollTop, (sizes[local][1] + sizes[local][0] - com.component.contentDiv._groups[0][0].clientHeight))
    //             return function (t) { that.scrollTop = i(t) }
    //           })
    //       } else {
    //         com.component.contentDiv
    //           .transition()
    //           .duration(300)
    //           .ease(d3.easeLinear)
    //           .tween('scroll', function () {
    //             let that = this
    //             var i = d3.interpolateNumber(that.scrollTop, newScrollTop)
    //             return function (t) { that.scrollTop = i(t) }
    //           })
    //       }
    //     })
    //   even += 1
    // }
  }
}
