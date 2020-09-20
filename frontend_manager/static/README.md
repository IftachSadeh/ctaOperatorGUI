# get icons from...
http://www.freepik.com/index.php?goto=8&page=16&cat=animals&type=iconos

# add to an svg
d3D["svgBck"].append("svg:image")
              .attr("xlink:href", "/static/frog-jumping.svg")
              .attr("width", 200)
              .attr("height", 200)
              .attr("x", 220)
              .attr("y",220);
