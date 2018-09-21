/* global d3 */
/* global timeD */
/* global hasVar */
/* global colsPurples */
/* global getSelectBox */

// ---------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------
window.loadScript({
  source: 'utils_scrollTable',
  script: '/js/utils_scrollBox.js'
})

window.FormManager = function () {
  let com = {}

  this.set = function (optIn) {
    if (hasVar(optIn.data)) com[optIn.tag] = optIn.data
    else if (hasVar(optIn.def)) com[optIn.tag] = optIn.def
    else com[optIn.tag] = null
  }
  this.get = function (type) {
    return com[type]
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function init (optIn) {
    if (hasVar(com.mainTag)) {
      console.error('trying to init more than once ...', optIn)
      return
    }

    com.mainTag = optIn.tag
    com.body = {}
    com.forObj = {}
    com.mainDiv = {}
    com.input = {}
    com.title = {}

    // ---------------------------------------------------------------------------------------------------
    //
    // ---------------------------------------------------------------------------------------------------
    setStyle(optIn.style)
  }
  this.init = init

  // ---------------------------------------------------------------------------------------------------
  // styling
  // ---------------------------------------------------------------------------------------------------
  function setStyle (optIn) {
    if (!hasVar(optIn)) optIn = {}

    com.style = {}
  }
  this.setStyle = setStyle

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function addForm (optIn) {
    // let id = optIn.id
    // let data = optIn.data

    setMainDiv(optIn)
    setForm(optIn)
    setDisabled(optIn)
    setTitle(optIn)
    setForObjPos(optIn)
  }
  this.addForm = addForm

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setForObjPos (optIn) {
    let id = optIn.id
    let data = optIn.data
    let alignVert = hasVar(optIn.alignVert) ? optIn.alignVert : true

    let divH, divY
    if (alignVert) {
      divH = getSelectBox(com.body[id]).height * optIn.getScaleWH().h
      divY = data.y + (data.h - divH) / 2 + 'px'
    } else {
      divY = data.y + data.marg + 'px'
    }
    com.forObj[id]
      .attr('width', data.w - 2 * data.marg + 'px')
      .attr('height', data.h - 2 * data.marg + 'px')
      .attr('x', data.x + data.marg + 'px')
      .attr('y', divY)
      .transition('inOut')
      .duration(timeD.animArc)
      .attr('opacity', 1)
  }
  this.setForObjPos = setForObjPos

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setMainDiv (optIn) {
    let id = optIn.id
    // let data = optIn.data
    let selection = optIn.selection
    let tagForm = optIn.tagForm
    let outlineForm = hasVar(optIn.outlineForm) ? optIn.outlineForm : false

    com.forObj[id] = selection
      .append('foreignObject')
      .attr('opacity', 0)
      .style('background-color', 'transparent')
    // .style("background-color",'red')

    com.body[id] = com.forObj[id]
      .append('xhtml:body')
      .style('margin', '0px')
      .style('padding', '0px')

    com.mainDiv[id] = com.body[id]
      .append('div')
      .attr('class', tagForm + ' formMngrDiv') // .html('xxxxxx')
    // com.mainDiv[id].append('br');com.mainDiv[id].append('br');com.mainDiv[id].append('br')

    if (outlineForm) {
      com.mainDiv[id].style('border', '1px solid ' + colsPurples[0])
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setForm (optIn) {
    console.log(optIn);
    let id = optIn.id
    let formSubFunc = optIn.formSubFunc
    let preventDefault = hasVar(optIn.preventDefault)
      ? optIn.preventDefault
      : true
    let fontSize =
      +optIn.getScaleWH().w * (hasVar(optIn.fontScale) ? optIn.fontScale : 1)
    fontSize = fontSize * 100 + '%'

    let form = com.mainDiv[id]
      .append('form')
      // prevent form sub on Enter key
      .on('keydown', function () {
        if (d3.event.which === 13) {
          if (preventDefault) d3.event.preventDefault()
          if (formSubFunc) formSubFunc(optIn)
        }
      }).style('background', optIn.background ? optIn.background.input : '#f0f0f0')
    // .style("width", window.svgWidthScale[tagForm]())

    com.input[id] = form
      .append('input')
      .attr('class', 'formMngrInput')
      .attr('type', 'text')
      .attr('value', optIn.data.data.text ? optIn.data.data.text : '')
      .attr('required', 'true')
      // .attr("maxlength", 10).attr("type", 'radio')
      .style('font-size', fontSize)

    form.append('div').attr('class', 'formMngrBar')

    com.title[id] = form
      .append('div')
      .attr('class', 'formMngrTitle')
      .style('font-size', fontSize)
      .style('background', optIn.background ? optIn.background.title : '#f0f0f0')
  }

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setDisabled (optIn) {
    let id = optIn.id
    let disabled = hasVar(optIn.disabled)
      ? optIn.disabled ? true : null
      : null

    // let input = com.mainDiv[id].selectAll("input."+'formMngrInput');
    com.input[id].attr('disabled', disabled)
    if (disabled) {
      com.input[id].style('background-color', 'transparent')
    }
  }
  this.setDisabled = setDisabled

  // ---------------------------------------------------------------------------------------------------
  //
  // ---------------------------------------------------------------------------------------------------
  function setTitle (optIn) {
    let id = optIn.id
    let title = hasVar(optIn.data.data.title) ? optIn.data.data.title : ''

    // com.mainDiv[id].selectAll("div."+'formMngrTitle')
    com.title[id].html(title)
  }
  this.setTitle = setTitle
}

// if(!hasVar(window.svgWidthScale)) {
//   window.svgWidthScale = {};
// }
// if(!hasVar(window.svgWidthScale[tagForm])) {
//   window.svgWidthScale[tagForm] = function() {
//     return '100%';
//     // let scale = (+(svg.svg.node().getBoundingClientRect().width)) / lenD.w[0];
//     // return (scale*100)+'%';
//   }

//   // window.addEventListener('resize', function(e) {
//   //   svg.svg.selectAll("div."+tagForm).each(function(d,i){
//   //     d3.select(this).selectAll("form."+'formDiv')
//   //       .style("width", window.svgWidthScale[tagForm]());
//   //     return;
//   //   })
//   //   return;
//   // })
//   // // setTimeout(function(){window.dispatchEvent(new Event('resize'));}, 1000);
// }
