/* global $ */
/* global d3 */
/* global is_def */
/* global get_color_theme */
/* global ScrollBox */
/* global Locker */
/* global RunLoop */
// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.ScrollForm = function(opt_in) {
    let color_theme = get_color_theme('bright_grey')
    let com = {
    }
    com = opt_in

    this.set = function(opt_in) {
        if (is_def(opt_in.data)) {
            com[opt_in.tag] = opt_in.data
        }
        else if (is_def(opt_in.def)) {
            com[opt_in.tag] = opt_in.def
        }
        else {
            com[opt_in.tag] = null
        }
    }
    this.get = function(type) {
        return com[type]
    }

    com.component = {
    }
    com.component.fo = com.main.g
        .append('foreignObject')
        .attr('width', com.main.box.w + 'px')
        .attr('height', com.main.box.h + 'px')
        .attr('x', com.main.box.x + 'px')
        .attr('y', com.main.box.y + 'px')

    let root_divWidth = '100%'
    if (com.quickScroll.enabled) {
        root_divWidth = 'calc(100% - ' + com.quickScroll.width + ')'
    }
    com.component.root_div = com.component.fo
        .append('xhtml:div')
        .style('display', 'inline-block')
        .style('border', 0 + 'px solid #78909C')
        .style('background-color', 'transparent')
        .style('width', root_divWidth)
        .style('height', function() {
            if (com.titles.data.length > 0) {
                return 'calc(100% - ' + com.titles.height + ')'
            }
            return '100%'
        })
    if (com.quickScroll.enabled) {
        com.component.quick_div = com.component.fo
            .append('xhtml:div')
            .style('display', 'inline-block')
            .style('background-color', '#333333')
            .style('width', com.quickScroll.width)
            .style('height', function() {
                if (com.titles.data.length > 0) {
                    return 'calc(100% - ' + com.titles.height + ')'
                }
                return '100%'
            })
    }
    if (com.titles.data.length > 0) {
        com.component.title_div = com.component.root_div
            .append('div')
            .style('height', com.titles.height)
            .style('border', 0 + 'px solid #78909C')
            .style('background-color', 'transparent')
            .style('border-radius', '0px 0px 0px 0px')
    }
    com.scrollBoxG = com.component.root_div
        .append('svg')
        .attr('width', com.main.box.w + 'px')
        .attr('height', com.main.box.h + 'px')
        .attr('x', 0 + 'px')
        .attr('y', 0 + 'px')
    com.scrollBox = new ScrollBox()
    com.scrollBox.init({
        tag: com.main.tag,
        g_box: com.scrollBoxG,
        boxData: {
            x: 0,
            y: 0,
            w: com.main.box.w,
            h: com.main.box.h,
            marg: 0,
        },
        useRelativeCoords: true,
        locker: new Locker(),
        lockers: [ com.main.tag + 'update_data' ],
        lock_zoom: {
            all: com.main.tag + 'zoom',
            during: com.main.tag + 'zoom_during',
            end: com.main.tag + 'zoom_end',
        },
        run_loop: new RunLoop({
            tag: 'scrollForm',
        }),
        canScroll: true,
        scrollVertical: true,
        scrollHorizontal: false,
        scrollHeight: com.main.box.h,
        background: color_theme.dark.background,
        scroll_recs: {
            w: 6,
        },
    })
    com.scrollBoxInner = com.scrollBox.get('innerG')
    com.scrollBoxG.select('g.clipping').attr('clip-path', '')

    let foScroll = com.scrollBoxInner
        .append('foreignObject')
        .attr('width', com.main.box.w + 'px')
        .attr('height', com.main.box.h + 'px')
        .attr('x', 0 + 'px')
        .attr('y', 0 + 'px')
    com.component.content_div = foScroll
        .append('xhtml:div')
        .attr('width', com.main.box.w + 'px')
        .attr('height', com.main.box.h + 'px')
        .style('border', 0 + 'px solid #78909C')
        .style('background-color', 'transparent')

    function setTitles() {
        com.component.titles = []
        let offsetScroll = 8 / com.titles.data.length
        for (var i = 0; i < com.titles.data.length; i++) {
            let t = com.titles.data[i]
            let comp = com.component.title_div
                .append('div')
                .style('display', 'inline-block')
                .style('width', 'calc(' + t.width + ' - ' + offsetScroll + 'px)')
                .style('height', com.titles.height)
                .style('background', 'transparent')
                .style('text-align', t.anchor)
                .style('border-radius', '0px 0px 0px 0px')
            comp
                .append('label')
                .html(t.title)
                .attr('class', 'title')
                .style('display', 'inline-block')
                .style('font-weight', 'bold')
                .style('color', color_theme.darker.text)
                .style('font-size', 10 + 'px')
                .style('background', 'transparent')
                .style('text-align', t.anchor)
        }
    }
    if (com.titles.data.length > 0) {
        setTitles()
    }

    function update_data(data, format) {
        com.data.data = data
        com.data.format = format
        update()
    }
    this.update_data = update_data

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

    // function fill_divs (title, group, divs, index) {
    //   let info = group.data
    //   let childs = group.childs
    //   title = title.charAt(0).toUpperCase() + title.slice(1)
    //   let inner_div = divs[index].append('div')
    //     .style('margin-bottom', '6px')
    //     .style('background', color_theme.brighter.background)
    //   inner_div.append('label')
    //     .html(com.titles.data[index].extension + title)
    //     .attr('class', 'title')
    //     .style('display', 'block')
    //     .style('color', color_theme.dark.text)
    //     .style('background', color_theme.dark.background)
    //   for (let key in info) {
    //     let lines = info[key]
    //     let line_div = inner_div.append('div')
    //     formatData(key, lines, line_div)
    //     // for (let j = 0; j < lines.length; j++) {
    //     //   let modif = lines[j]
    //     //   let line_div = inner_div.append('div')
    //     //     .style('background', (j % 2 === 1 ? color_theme.bright.background : color_theme.brighter.background))
    //     //   formatData(key, modif, line_div)
    //     // }
    //   }
    //   for (var children in childs) {
    //     fill_divs(children, childs[children], divs, index + 1)
    //   }
    // }

    function plainText_div(div) {
    // title = title.charAt(0).toUpperCase() + title.slice(1)
    // let inner_div = divs[index].append('div')
    //   .style('margin-bottom', '6px')
    //   .style('background', color_theme.brighter.background)
        div.attr('class', 'divForm title_div')

        div
            .append('label')
            .html(function(d) {
                return d.key
            })
            .attr('class', 'title')
            .style('color', color_theme.dark.text)
            .style('background', 'transparent')
    }
    function modification_div(div) {
        div.on('click', function(d) {
            if (!d.event) {
                return
            }
            if (d.event.click) {
                d.event.click(d)
            }
        })
        div.on('mouseover', function(d) {
            if (!d.event) {
                return
            }
            if (d.event.mouseover) {
                div.style('background-color', '#F1F1F1')
                d.event.mouseover(d)
            }
        })
        div.on('mouseout', function(d) {
            if (!d.event) {
                return
            }
            if (d.event.mouseout) {
                div.style('background-color', 'transparent')
                d.event.mouseout(d)
            }
        })

        div.attr('class', 'divForm modification_div')

        div
            .append('label')
            .attr('class', 'key')
            .html(function(d) {
                return d.key
            })
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('font-size', 8 + 'px')
            .style('background', 'transparent')
            .style('margin-left', '6px')
        div
            .append('label')
            .attr('class', 'dot')
            .html(' : ')
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('font-size', 8 + 'px')
            .style('background', 'transparent')
        div
            .append('label')
            .attr('class', 'old')
            .html(function(d) {
                return d.value.old
            })
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('font-size', 8 + 'px')
            .style('background', 'transparent')
        div
            .append('label')
            .attr('class', 'arrow')
            .html('-> ')
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('font-size', 8 + 'px')
            .style('background', 'transparent')
        div
            .append('label')
            .attr('class', 'new')
            .html(function(d) {
                return d.value.new
            })
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('font-size', 8 + 'px')
            .style('background', 'transparent')
    }
    function info_div(div) {
        div.on('click', function(d) {
            if (!d.event) {
                return
            }
            if (d.event.click) {
                d.event.click(d)
            }
        })
        div.on('mouseover', function(d) {
            if (!d.event) {
                return
            }
            if (d.event.mouseover) {
                div.style('background-color', '#F1F1F1')
                d.event.mouseover(d)
            }
        })
        div.on('mouseout', function(d) {
            if (!d.event) {
                return
            }
            if (d.event.mouseout) {
                div.style('background-color', 'transparent')
                d.event.mouseout(d)
            }
        })

        div.attr('class', 'divForm info_div')

        div
            .append('label')
            .html(function(d) {
                return d.key
            })
            .attr('class', 'key')
            .attr('id', 'key')
            .style('display', 'inline-block')
            .style('color', '#000000')
        // .style('font-size', 10 + 'px')
            .style('background', 'transparent')
        div
            .append('label')
            .attr('id', 'dot')
            .attr('class', 'dot')
            .html(' : ')
            .style('display', 'inline-block')
            .style('color', '#000000')
        // .style('font-size', 10 + 'px')
            .style('background', 'transparent')
        div
            .append('label')
            .attr('class', 'new')
            .attr('id', 'new')
            .html(function(d) {
                return d.value
            })
            .style('display', 'inline-block')
            .style('color', '#000000')
        // .style('font-size', 10 + 'px')
            .style('background', 'transparent')
    }
    function inputNumber(div) {
        div.on('click', function(d) {
            if (!d.event) {
                return
            }
            if (d.event.click) {
                d.event.click(d)
            }
        })
        div.on('mouseover', function(d) {
            if (!d.event) {
                return
            }
            if (d.event.mouseover) {
                div.style('background-color', '#F1F1F1')
                d.event.mouseover(d)
            }
        })
        div.on('mouseout', function(d) {
            if (!d.event) {
                return
            }
            if (d.event.mouseout) {
                div.style('background-color', 'transparent')
                d.event.mouseout(d)
            }
        })

        div.attr('class', 'divForm inputNumber')
        console.log(div)
        div
            .append('label')
            .html(function(d) {
                return d.key
            })
            .attr('class', 'key')
            .attr('id', 'key')
            .style('display', 'inline-block')
            .style('color', '#000000')
        // .style('font-size', 10 + 'px')
            .style('background', 'transparent')
        div
            .append('label')
            .attr('id', 'dot')
            .attr('class', 'dot')
            .html(' : ')
            .style('display', 'inline-block')
            .style('color', '#000000')
        // .style('font-size', 10 + 'px')
            .style('background', 'transparent')
        let input = div
            .append('input')
            .attr('class', 'new')
            .attr('id', 'new')
            .style('display', 'inline-block')
            .style('color', '#000000')
            .style('background', 'transparent')
            .attr('type', 'number')
            .attr('min', function(d) {
                return d.range[0]
            })
            .attr('max', function(d) {
                return d.range[1]
            })
        input.property('value', function(d) {
            return d.value
        })
        input.on('change', function(d) {
            let selectValue = div.select('input').property('value')
            d.event.change(selectValue, d)
        })
    }
    function dropDown_div(div) {
        div.on('mouseover', function(d) {
            if (d.event.mouseover) {
                div.style('background', function(d) {
                    return d.style && d.style.color
                        ? d3.color(d.style.color).darker(0.4)
                        : d3.color(color_theme.brighter.background).darker(0.4)
                })
                d.event.mouseover(d)
            }
        })
        div.on('mouseout', function(d) {
            if (d.event.mouseout) {
                div.style('background', function(d) {
                    return d.style && d.style.color
                        ? d.style.color
                        : color_theme.brighter.background
                })
                d.event.mouseout(d)
            }
        })

        div.attr('class', 'divForm dropDown_div')
        let d = div.data()[0]
        div
            .append('label')
            .attr('class', 'key')
            .html(function(d) {
                return d.key
            })
            .attr('id', 'key')
            .style('display', 'inline-block')
            .style('color', '#000000')
        // .style('font-size', 10 + 'px')
            .style('background', 'transparent')
        // .style('margin-left', '6px')
        div
            .append('label')
            .attr('class', 'dot')
            .attr('id', 'dot')
            .html(' : ')
            .style('display', 'inline-block')
            .style('color', '#000000')
        // .style('font-size', 10 + 'px')
            .style('background', 'transparent')
        let selector = div
            .append('select')
            .style('width', 'auto')
            .style('font-size', '9px')
            .style('height', div.style('height'))
            .style('border', '0.2px')
            .style('background', 'rgba(0, 0, 0, 0.15)')
            .on('change', function(d) {
                let selectValue = div.select('select').property('value')
                d.event.click(selectValue, d)
            })
        selector
            .selectAll('option')
            .data(function(d) {
                return d.value.select
            })
            .enter()
            .append('option')
            .text(function(d) {
                return d
            })
        selector.property('value', function() {
            return d.value.current
        })
        if (!d.editable) {
            selector.attr('disabled', true)
        }
    }

    function divide_div(div, data) {
        div
            .selectAll('div.divideChilds')
            .data(data)
            .enter()
            .append('div')
            .attr('class', 'divideChilds')
            .attr('id', function(d) {
                return 'id_' + d.key
            })
            .style('width', 100 / data.length - (2 * data.length - 1) + '%')
            .style('margin-left', '2%')
            .style('display', 'inline-block')
            .style('vertical-align', 'top')
            .each(function(d) {
                createSubForm(d3.select(this), d)
            })
    }
    function createSubForm(div, data) {
        div
            .selectAll('div.divForm')
            .data(data)
            .enter()
            .append('div')
            .attr('class', 'divForm')
            .attr('id', function(d) {
                return 'id_' + d.key
            })
            .style('background', function(d) {
                return d.style && d.style.color
                    ? d.style.color
                    : color_theme.brighter.background
            })
            .style('border-radius', '0.5px 0.5px 0.5px 0.5px')
            .each(function(d) {
                if (Array.isArray(d)) {
                    d3.select(this).style('background', 'transparent')
                    divide_div(d3.select(this), d)
                }
                else {
                    if (d.format === 'plainText') {
                        plainText_div(d3.select(this))
                    }
                    else if (d.format === 'info') {
                        info_div(d3.select(this))
                    }
                    else if (d.format === 'input_number') {
                        inputNumber(d3.select(this))
                    }
                    else if (d.format === 'comboList') {
                        dropDown_div(d3.select(this))
                    }
                    else if (d.format === 'modification') {
                        modification_div(d3.select(this))
                    }
                    createSubForm(d3.select(this), d.childs)
                }
            })
    }
    function update() {
        if (!Object.keys(com.data.data).length) {
            return
        }
        if (com.data.data.childs.length === 0) {
            return
        }

        createSubForm(com.component.content_div, com.data.data.childs)

        com.scrollBox.resetVerticalScroller({
            canScroll: true,
            scrollHeight: com.component.content_div._groups[0][0].scrollHeight,
        })

    // for (let key in com.data.data) {
    //   let group = com.data.data[key]
    //
    //   let parent_div = com.component.content_div.append('div')
    //     .attr('id', 'id_' + key)
    //     .style('width', '100%')
    //   let divs = []
    //   for (let i = 0; i < com.titles.data.length; i++) {
    //     divs.push(parent_div.append('div')
    //       .style('display', 'inline-block')
    //       .style('width', 'calc(' + com.titles.data[i].width + ' - 2px)')
    //       .style('background', 'transparent')
    //       .style('vertical-align', 'top')
    //       .style('border-rigth', '2px solid #ffffff'))
    //   }
    //   fill_divs(key, group, divs, 0)
    // }

    // let totOffset = 0
    // let totScrollHeight = com.component.content_div._groups[0][0].scrollHeight
    // let sizes = []
    // for (let key in com.data.data) {
    //   let setOffsetTo = totOffset
    //   let scrollHeight = com.component.content_div.select('div#id_' + key)._groups[0][0].scrollHeight
    //   sizes.push([scrollHeight, setOffsetTo])
    //   totOffset += scrollHeight
    // }
    //
    // let ratio = com.component.content_div._groups[0][0].clientHeight / totOffset
    // let even = 0
    // for (let key in com.data.data) {
    //   let local = even
    //   com.component.quick_div.append('div')
    //     .style('width', '100%')
    //     .style('height', (sizes[local][0] * ratio) + 'px')
    //     .style('background', (local % 2 === 1 ? color_theme.medium.background : color_theme.brighter.background))
    //     .on('mouseover', function () {
    //       com.component.content_div
    //         .transition()
    //         .delay(300)
    //         .duration(400)
    //         .on('start', function () {
    //           com.component.content_div.attr('canInterrupt', false)
    //         })
    //         .tween('scroll', function () {
    //           let that = this
    //           var i = d3.interpolateNumber(that.scrollTop, sizes[local][1])
    //           return function (t) { that.scrollTop = i(t) }
    //         })
    //         .on('end', function () {
    //           com.component.content_div.attr('canInterrupt', true)
    //         })
    //     })
    //     .on('mouseout', function () {
    //       if (com.component.content_div.attr('canInterrupt') === 'true') {
    //         com.component.content_div.interrupt()
    //       }
    //     })
    //     .on('wheel.zoom', function () {
    //       d3.event.preventDefault()
    //       let newScrollTop = com.component.content_div._groups[0][0].scrollTop + d3.event.deltaY
    //       if (newScrollTop < sizes[local][1]) {
    //         com.component.content_div
    //           .transition()
    //           .duration(300)
    //           .ease(d3.easeLinear)
    //           .tween('scroll', function () {
    //             let that = this
    //             var i = d3.interpolateNumber(that.scrollTop, sizes[local][1])
    //             return function (t) { that.scrollTop = i(t) }
    //           })
    //       } else if ((newScrollTop + com.component.content_div._groups[0][0].clientHeight) > (sizes[local][1] + sizes[local][0])) {
    //         com.component.content_div
    //           .transition()
    //           .duration(300)
    //           .ease(d3.easeLinear)
    //           .tween('scroll', function () {
    //             let that = this
    //             var i = d3.interpolateNumber(that.scrollTop, (sizes[local][1] + sizes[local][0] - com.component.content_div._groups[0][0].clientHeight))
    //             return function (t) { that.scrollTop = i(t) }
    //           })
    //       } else {
    //         com.component.content_div
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
