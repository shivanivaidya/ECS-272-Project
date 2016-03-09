var diameter = 1200;

var margin = {top: 40, right: 120, bottom: 20, left: 120},
    width = 2200 - margin.right - margin.left,
    height = 1500 - margin.top - margin.bottom,
    r_width = diameter,
    r_height = diameter;

var i = 0,
    duration = 350,
    root,
    r_root;

var tree = d3.layout.tree()
.nodeSize([25,])
.separation(function separation(a, b) {
  return a.parent == b.parent ? 2 : 2;
});

var r_tree = d3.layout.tree()
.size([360, diameter / 2 - 80])
.separation(function (a, b) {
  return (a.parent == b.parent ? 5 : 10) / a.depth;
});

var diagonal = d3.svg.diagonal()
.projection(function(d) { return [d.x, d.y]; });

var r_diagonal = d3.svg.diagonal.radial()
.projection(function (d) {
  return [d.y, d.x / 180 * Math.PI];
});

var svg = d3.select("body").append("svg")
.attr("width", width + margin.right + margin.left)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + (margin.left + width/2) + "," + margin.top + ")");

var r_svg = d3.select("body").append("svg")
.attr("width", r_width)
.attr("height", r_height)
.append("g")
.attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");


root = books_nos;
root.x0 = width / 2;
root.y0 = 0;

r_root = big_group;

var dict = {};
var fc_values = [];
var max_fc, min_fc;

function initialize(){
  for(i = 0;  i < big_group.children.length; i++){
    var temp = big_group.children[i];
    dict[temp.name] = temp.data.fc_value;
    if(fc_values.indexOf(temp.data.fc_value) == -1){
      fc_values.push(temp.data.fc_value);
    }
  }
  var nodes = tree.nodes(root).reverse();

  nodes.forEach(function(d) {if(typeof d.data != 'undefined'){
    dict[d.name] = d.data.fc_value;
    fc_values.push(d.data.fc_value);
  }});
  max_fc = Math.max.apply(Math, fc_values);
  min_fc = Math.min.apply(Math, fc_values);
}

initialize();


var color = d3.scale.linear()
.domain([min_fc, max_fc])
.range(["lightyellow", "red"]);


function update(source) {
  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 100; });

  // Update the nodes…
  var node = svg.selectAll("g.node")
  .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
  .attr("class", "node")
  .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
  .on("click", click)
  .on("mouseover", mouseover)
  .on("mouseout", mouseout);

  nodeEnter.append("circle")
  .attr("r", 25)
  .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("text")
  .attr("y", function(d) { return d.children || d._children ? 0 : 0; })
  .attr("dy", ".10em")
  .attr("text-anchor", function(d) { return d.children || d._children ? "middle" : "middle"; })
  .text(function(d) { if(d.name.startsWith("GO")){return "GO:";} else {return d.name;} })
  .style("fill-opacity", 1);

  nodeEnter.append("text")
  .attr("y", function(d) { return d.children || d._children ? 0 : 0; })
  .attr("dy", ".99em")
  .attr("text-anchor", function(d) { return d.children || d._children ? "middle" : "middle"; })
  .text(function(d) { if(d.name.startsWith("GO")){return d.name.substring(3);} else {return "";} })
  .style("fill-opacity", 1);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
  .duration(duration)
  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  nodeUpdate.select("circle")
  .attr("r", 25)
  .style("fill", function(d) {
    if(d.name == "Groups"){
      return "#fff";
    }
    else {
      var i = dict[d.name];
      return d._children ? "lightsteelblue" : "lightsteelblue";
    }});

  nodeUpdate.select("text")
  .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
  .duration(duration)
  .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
  .remove();

  nodeExit.select("circle")
  .attr("r", 25)

  nodeExit.select("text")
  .style("fill-opacity", 1e-6);

  // Update the links…
  var link = svg.selectAll("path.link")
  .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
  .attr("class", "link")
  .attr("d", function(d) {
    var o = {x: source.x0, y: source.y0};
    return diagonal({source: o, target: o});
  });

  // Transition links to their new position.
  link.transition()
  .duration(duration)
  .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
  .duration(duration)
  .attr("d", function(d) {
    var o = {x: source.x, y: source.y};
    return diagonal({source: o, target: o});
  })
  .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

function r_update(source) {
  // Compute the new tree layout.
  var nodes = r_tree.nodes(r_root),
      links = r_tree.links(nodes);

  // Normalize for fixed-depth.
  //nodes.forEach(function(d) { d.y = d.depth * 80; });

  // Update the nodes…
  var node = r_svg.selectAll("g.node")
  .data(nodes, function (d) {
    return d.id || (d.id = ++i);
  });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
  .attr("class", "node")
  .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
  .on("mouseover", mouseover)
  .on("mouseout", mouseout);

  nodeEnter.append("circle")
  .attr("r", 1e-6)
  .style("fill", function (d) {
    return d._children ? "lightsteelblue" : "#fff";
  });

  nodeEnter.append("text")
  .attr("x", 10)
  .attr("dy", ".35em")
  .attr("text-anchor", "start")
  .attr("transform", function(d) { return d.x < 180 ? "translate(0)" : "rotate(180)translate(-" + (d.name.length * 8.5)  + ")"; })
  .text(function (d) {
    return d.name;
  })
  .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
  .duration(duration)
  .attr("transform", function (d) {
    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
  })

  nodeUpdate.select("circle")
  .attr("r", 4.5)
  .style("fill", function (d) {
    return d._children ? "lightsteelblue" : "#fff";
  });

  nodeUpdate.select("text")
  .style("fill-opacity", 1)
  .attr("transform", function (d) {
    return d.x < 180 ? "translate(0)" : "rotate(180)translate(-" + (d.name.length + 50) + ")";
  });

  // TODO: appropriate transform
  var nodeExit = node.exit().transition()
  .duration(duration)
  .attr("transform", function(d) { return "diagonal(" + source.y + "," + source.x + ")"; })
  .remove();

  nodeExit.select("circle")
  .attr("r", 1e-6);

  nodeExit.select("text")
  .style("fill-opacity", 1e-6);

  // Update the links…
  var link = r_svg.selectAll("path.link")
  .data(links, function (d) {
    return d.target.id;
  });
}

var expanded = false;
var first = true;

function toggleGroups() {
  if(expanded == true){
    expanded = false;
  }
  else{
    expanded = true;
  }
}

// Toggle children on click.
function click(d) {
  if(d.name == "GO:0003700"){
    r_click(r_root);
    n_click(d);
  }else if(d.name == "Groups"){
    toggleGroups();
    if(expanded == false){
      root.children.forEach(collapse);
      r_click(r_root);
    }
    else{
      root.children.forEach(expand);
      r_click(r_root);
    }
    update(root);
  }else {
    n_click(d);
  }
}

function n_click(d){
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

function r_click(d){
  if (d.children) {
    if(!first){
      d._children = d.children;
      d.children = null;
    }
  } else {
    d.children = d._children;
    d._children = null;
  }
  r_update(d);
  first = false;
}

function mouseover(d) {
  d3.select(this).append("text")
  .attr("class", "hover")
  .attr('transform', function(d){
    return 'translate(50, -10)';
  })
  .text(get_fc_value(d));
}

function get_fc_value(gene) {
  return dict[gene.name];
}

// Toggle children on click.
function mouseout(d) {
  d3.select(this).select("text.hover").remove();
}

function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function expand(d) {
  if (d._children) {
    d.children = d._children;
    d.children.forEach(expand);
    d._children = null;
  }
}

root.children.forEach(collapse);
update(root);
d3.select(self.frameElement).style("height", "800px");





