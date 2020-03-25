// ------------------------------------------------------------------
//
// ------------------------------------------------------------------

/* global $ */
/* global d3 */
/* global times */
/* global is_def */
/* global deep_copy */

window.ButtonPanel = function() {
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

    function init(opt_in) {
        com.g = opt_in.g
        com.box = opt_in.box
        com.margin = opt_in.margin
        com.rows = opt_in.rows
        com.cols = opt_in.cols

        com.g.attr('transform', 'translate(' + com.box.x + ',' + com.box.y + ')')
        com.g
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('rx', 0)
            .attr('ry', 0)
            .attr('width', com.box.w)
            .attr('height', com.box.h)
            .attr('fill', opt_in.background)
            .attr('stroke', opt_in.stroke)
            .attr('stroke-width', 0.2)

        compute_buttonsPositions()
    }
    this.init = init

    function compute_buttonsPositions() {
        com.buttonPositions = []
        com.button = []
        for (var i = 0; i < com.rows; i++) {
            com.buttonPositions.push([])
            com.button.push([])
            for (var j = 0; j < com.cols; j++) {
                let x =
          (com.box.w - 2 * com.margin.extern) / com.cols * j +
          com.margin.inner +
          com.margin.extern
                let y =
          (com.box.h - 2 * com.margin.extern) / com.rows * i +
          com.margin.inner +
          com.margin.extern
                let width =
          (com.box.w - 2 * com.margin.extern) / com.cols - com.margin.inner * 2
                let height =
          (com.box.h - 2 * com.margin.extern) / com.rows - com.margin.inner * 2
                com.buttonPositions[i].push({
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                })
                com.button.push(null)
            }
        }
    }

    function add_button(opt_in) {
    // if (com.button[opt_in.row] && com.button[opt_in.row][opt_in.col]) remove_button(opt_in)

        let g_button = com.g
            .append('g')
            .attr(
                'transform',
                'translate(' +
          com.buttonPositions[opt_in.row][opt_in.col].x +
          ',' +
          com.buttonPositions[opt_in.row][opt_in.col].y +
          ')'
            )
            .attr('width', com.buttonPositions[opt_in.row][opt_in.col].width)
            .attr('height', com.buttonPositions[opt_in.row][opt_in.col].height)

        // com.button[opt_in.row][opt_in.col] = g_button
        return g_button
    }
    this.add_button = add_button

    function remove_button(opt_in) {}
    this.remove_button = remove_button

    function check_button() {}
    this.check_button = check_button
    function uncheck_button() {}
    this.uncheck_button = uncheck_button
}
