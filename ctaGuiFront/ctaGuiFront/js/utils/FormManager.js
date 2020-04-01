/* global d3 */
/* global times */
/* global is_def */
/* global cols_purples */
/* global get_selection_box */

// ------------------------------------------------------------------
//
// ------------------------------------------------------------------
window.load_script({
    source: 'utils_scrollTable',
    script: '/js/utils/ScrollBox.js',
})

window.FormManager = function() {
    let com = {
    }

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

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function init(opt_in) {
        if (is_def(com.main_tag)) {
            console.error('trying to init more than once ...', opt_in)
            return
        }

        com.main_tag = opt_in.tag
        com.body = {
        }
        com.forObj = {
        }
        com.main_div = {
        }
        com.input = {
        }
        com.title = {
        }

        // ------------------------------------------------------------------
        //
        // ------------------------------------------------------------------
        set_style(opt_in.style)
    }
    this.init = init

    // ------------------------------------------------------------------
    // styling
    // ------------------------------------------------------------------
    function set_style(opt_in) {
        if (!is_def(opt_in)) {
            opt_in = {
            }
        }

        com.style = {
        }
    }
    this.set_style = set_style

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function addForm(opt_in) {
    // let id = opt_in.id
    // let data = opt_in.data

        setMain_div(opt_in)
        setForm(opt_in)
        setDisabled(opt_in)
        setTitle(opt_in)
        setForObjPos(opt_in)
    }
    this.addForm = addForm

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setForObjPos(opt_in) {
        let id = opt_in.id
        let data = opt_in.data
        let alignVert = is_def(opt_in.alignVert) ? opt_in.alignVert : true

        let divH, divY
        if (alignVert) {
            divH = get_selection_box(com.body[id]).height * opt_in.get_scaleWH().h
            divY = data.y + (data.h - divH) / 2 + 'px'
        }
        else {
            divY = data.y + data.marg + 'px'
        }
        com.forObj[id]
            .attr('width', data.w - 2 * data.marg + 'px')
            .attr('height', data.h - 2 * data.marg + 'px')
            .attr('x', data.x + data.marg + 'px')
            .attr('y', divY)
            .transition('in_out')
            .duration(times.anim)
            .attr('opacity', 1)
    }
    this.setForObjPos = setForObjPos

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setMain_div(opt_in) {
        let id = opt_in.id
        // let data = opt_in.data
        let selection = opt_in.selection
        let tagForm = opt_in.tagForm
        let outlineForm = is_def(opt_in.outlineForm) ? opt_in.outlineForm : false

        com.forObj[id] = selection
            .append('foreignObject')
            .attr('opacity', 0)
            .style('background-color', 'transparent')
        // .style("background-color",'red')

        com.body[id] = com.forObj[id]
            .append('xhtml:body')
            .style('margin', '0px')
            .style('padding', '0px')

        com.main_div[id] = com.body[id]
            .append('div')
            .attr('class', tagForm + ' formMngr_div') // .html('xxxxxx')
        // com.main_div[id].append('br');com.main_div[id].append('br');com.main_div[id].append('br')

        if (outlineForm) {
            com.main_div[id].style('border', '1px solid ' + cols_purples[0])
        }
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setForm(opt_in) {
        let id = opt_in.id
        let formSubFunc = opt_in.formSubFunc
        let preventDefault = is_def(opt_in.preventDefault)
            ? opt_in.preventDefault
            : true
        let font_size
      = +opt_in.get_scaleWH().w * (is_def(opt_in.font_scale) ? opt_in.font_scale : 1)
        font_size = font_size * 100 + '%'

        let form = com.main_div[id]
            .append('form')
        // prevent form sub on Enter key
            .on('keydown', function() {
                if (d3.event.which === 13) {
                    if (preventDefault) {
                        d3.event.preventDefault()
                    }
                    if (formSubFunc) {
                        formSubFunc(opt_in)
                    }
                }
            })
            .style(
                'background',
                opt_in.background ? opt_in.background.input : '#f0f0f0'
            )
        // .style("width", window.svgWidthScale[tagForm]())

        com.input[id] = form
            .append('input')
            .attr('class', 'formMngrInput')
            .attr('type', 'text')
            .attr('value', opt_in.data.data.text ? opt_in.data.data.text : '')
            .attr('required', 'true')
        // .attr("maxlength", 10).attr("type", 'radio')
            .style('font-size', font_size)

        form.append('div').attr('class', 'formMngrBar')

        com.title[id] = form
            .append('div')
            .attr('class', 'formMngrTitle')
            .style('font-size', font_size)
            .style(
                'background',
                opt_in.background ? opt_in.background.title : '#f0f0f0'
            )
    }

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setDisabled(opt_in) {
        let id = opt_in.id
        let disabled = is_def(opt_in.disabled)
            ? opt_in.disabled ? true : null
            : null

        // let input = com.main_div[id].selectAll("input."+'formMngrInput');
        com.input[id].attr('disabled', disabled)
        if (disabled) {
            com.input[id].style('background-color', 'transparent')
        }
    }
    this.setDisabled = setDisabled

    // ------------------------------------------------------------------
    //
    // ------------------------------------------------------------------
    function setTitle(opt_in) {
        let id = opt_in.id
        let title = is_def(opt_in.data.data.title) ? opt_in.data.data.title : ''

        // com.main_div[id].selectAll("div."+'formMngrTitle')
        com.title[id].html(title)
    }
    this.setTitle = setTitle
}

// if(!is_def(window.svgWidthScale)) {
//   window.svgWidthScale = {};
// }
// if(!is_def(window.svgWidthScale[tagForm])) {
//   window.svgWidthScale[tagForm] = function() {
//     return '100%';
//     // let scale = (+(svg.svg.node().getBoundingClientRect().width)) / svg_dims.w[0];
//     // return (scale*100)+'%';
//   }

//   // window.addEventListener('resize', function(e) {
//   //   svg.svg.selectAll("div."+tagForm).each(function(d,i){
//   //     d3.select(this).selectAll("form."+'form_div')
//   //       .style("width", window.svgWidthScale[tagForm]());
//   //     return;
//   //   })
//   //   return;
//   // })
//   // // setTimeout(function(){window.dispatchEvent(new Event('resize'));}, 1000);
// }
