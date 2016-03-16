var margin = 20,
    diameter = 1200;

var dict = {};
var fc_values = [];
var max_fc, min_fc;

var color = d3.scale.linear()
.domain([-1, 5])
.range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
.interpolate(d3.interpolateHcl);

var pack = d3.layout.pack()
.padding(2)
.size([diameter - margin, diameter - margin])
.value(function(d) { return d.size; })

var svg = d3.select("body").append("svg")
.attr("width", diameter)
.attr("height", diameter)
.append("g")
.attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

root = books_right_10;

function initialize(){
  nodes = pack.nodes(root);
  for(i = 0;  i < nodes.length; i++){
    var temp = nodes[i];
    if(typeof temp.data != 'undefined'){
      dict[temp.name] = temp.data.fc_value;
      if(fc_values.indexOf(temp.data.fc_value) == -1){
        fc_values.push(temp.data.fc_value);
      }
    }
  }

  nodes.forEach(function(d) { if(typeof d.data != 'undefined'){
    dict[d.name] = d.data.fc_value;
    fc_values.push(d.data.fc_value);
  }});
  max_fc = Math.max.apply(Math, fc_values);
  min_fc = Math.min.apply(Math, fc_values);
}

initialize();

function update(source) {

  var focus = root,
      nodes = pack.nodes(root),
      view;

  var circle = svg.selectAll("circle")
  .data(nodes)
  .enter().append("circle")
  .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
  .style("fill", function(d) { return d.children ? color(d.depth) : null; })
  .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

  /*var text = svg.selectAll("text")
  .data(nodes)
  .enter().append("text")
  .attr("class", "label")
  .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
  .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
  .text(function(d) { return d.name; });*/

  var texts = svg.selectAll("text")
  .data(nodes)
  .enter();

  texts.append("text")
  .attr("class", "label")
  .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
  .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
  .text(function(d) { return d.name; });

  texts.append("text")
  .attr("class", "label")
  .attr("dy", ".99em")
  .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
  .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
  .text(function(d) { if(typeof d.data != 'undefined'){return d.data.fc_value; }});

  var node = svg.selectAll("circle,text");

  d3.select("body")
  .style("background", color(-1))
  .on("click", function() { zoom(root); });
  /*.on("mouseover", function() { mouseover(root); })
  .on("mouseout", function() { mouseout(root); });*/

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    var focus0 = focus; focus = d;

    var transition = d3.transition()
    .duration(d3.event.altKey ? 7500 : 750)
    .tween("zoom", function(d) {
      var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
      return function(t) { zoomTo(i(t)); };
    });

    transition.selectAll("text")
    .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
    .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
    .each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
    .each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }

  function zoomTo(v) {
    var k = diameter / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
  }
}

/*function mouseover(d) {
  var focus0 = focus; focus = d;
  d3.select(this).append("text")
  .attr("class", "hover")
  .attr('transform', function(d){
    return 'translate(50, -10)';
  })
  .text(get_fc_value(d));
}

function mouseout(d) {
  var focus0 = focus; focus = d;
  d3.select(this).select("text.hover").remove();
}*/

function get_fc_value(gene) {
  return dict[gene.name];
}

update(root);
d3.select(self.frameElement).style("height", diameter + "px");
