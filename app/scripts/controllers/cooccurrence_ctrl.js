'use strict';

angular.module('customVisulizationApp')
  .controller('cooccurrenceCtrl', function ($scope) {

  	var margin = {top: 220, right: 0, bottom: 10, left: 220},
    width = 720,
    height = 720;


    var request = new XMLHttpRequest();
    request.open("GET", 'data.json', false);
    request.send(null)
    var roads = JSON.parse(request.responseText).links;
    var road_names={}
    roads.forEach(function(road){
		road_names[road.road_id]= road.name
    })

    // request.open("GET", 'data.json', false);
    // request.send(null)
    // var cooccurrence_roads = JSON.parse(request.responseText);
    // cooccurrence_roads.nodes.forEach(function(r){
    // 	if(road_ids.indexOf(r.id)== -1)

    // })



    

	var x = d3.scale.ordinal().rangeBands([0, width]),
	    z = d3.scale.linear().domain([0, 1]).clamp(true),
	    c = d3.scale.category10().domain(d3.range(10));

	var svg = d3.select(".cooccurrence").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    // .style("margin-left", margin.left + "px")
	  	.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.json("cooccurrence_data.json", function(cooccurrence) {
	  var matrix = [],
	      nodes = cooccurrence.nodes,
	      n = nodes.length;
	  // Compute index per node.
	  nodes.forEach(function(node, i) {
	    node.index = i;
	    node.count = 0;
	    matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
	  });

	  // Convert links to matrix; count character occurrences.
	  cooccurrence.links.forEach(function(link) {
	    matrix[link.source][link.target].z = link.value;
	    // matrix[link.target][link.source].z += link.value;
	    // matrix[link.source][link.source].z += link.value;
	    // matrix[link.target][link.target].z += link.value;
	    // nodes[link.source].count += link.count;
	    // nodes[link.target].count += link.count;
	  });


	  // Precompute the orders.
	  var orders = { //d3.ascending(nodes[a].id, nodes[b].id);
	    id: d3.range(n).sort(function(a, b) { return  nodes[a].id - nodes[b].id;}),
	    // count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
	    // group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
	  };

	  // The default sort order.
	  x.domain(orders.id);

	  svg.append("rect")
	      .attr("class", "background")
	      .attr("width", width)
	      .attr("height", height);

	  var row = svg.selectAll(".row")
	      .data(matrix)
	      .enter().append("g")
	      .attr("class", "row")
	      .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
	      .each(row);

	  row.append("line")
	      .attr("x2", width);

	  row.append("text")
	      .attr("x", -6)
	      .attr("y", x.rangeBand() / 2)
	      .attr("dy", ".32em")
	      .attr("text-anchor", "end")
	      .text(function(d, i) { return road_names[nodes[i].id] || nodes[i].id; });

	  var column = svg.selectAll(".column")
	      .data(matrix)
	      .enter().append("g")
	      .attr("class", "column")
	      .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

	  column.append("line")
	      .attr("x1", -width);

	  column.append("text")
	      .attr("x", 6)
	      .attr("y", x.rangeBand() / 2)
	      .attr("dy", ".32em")
	      .attr("text-anchor", "start")
	      .text(function(d, i) {return road_names[nodes[i].id]|| nodes[i].id ; });

	  function row(row) {
	    var cell = d3.select(this).selectAll(".cell")
	        .data(row.filter(function(d) { return d.z; }))
	      	.enter().append("rect")
	        .attr("class", "cell")
	        .attr("x", function(d) { return x(d.x); })
	        .attr("width", x.rangeBand())
	        .attr("height", x.rangeBand())
	        .style("fill-opacity", function(d) { 
	        	return (d.z > 0.5)? z(d.z) : 1; 
	        })
	        .style("fill", function(d) { 
	        	// nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; 
	        	// if(d.z > 0.5)
	        	if(d.z > 0.5){
	        		if(d.z > 0.8)
	        			return "red"
	        		else if(d.z > 0.7)
	        			return "orange"
	        		else
	        			return "#34495E"
	        	}
	        	else
	        		return "rgb(238,238,238)"
	        })
	        .on("mouseover", mouseover)
	        .on("mouseout", mouseout);
	  }

	  function mouseover(p) {
	    d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
	    d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
	  }

	  function mouseout() {
	    d3.selectAll("text").classed("active", false);
	  }

	  // d3.select("#order").on("change", function() {
	  //   clearTimeout(timeout);
	  //   order(this.value);
	  // });

	  function order(value) {
	    x.domain(orders[value]);

	    var t = svg.transition().duration(2500);

	    t.selectAll(".row")
	        .delay(function(d, i) { return x(i) * 4; })
	        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
	      .selectAll(".cell")
	        .delay(function(d) { return x(d.x) * 4; })
	        .attr("x", function(d) { return x(d.x); });

	    t.selectAll(".column")
	        .delay(function(d, i) { return x(i) * 4; })
	        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
	  }

	  // setTimeout(function() {
	  //   order("group");
	  // }, 5000);

	  // setTimeout(function() {
	  //   order("count");
	  // }, 15000);

	});

})