'use strict';

angular.module('customVisulizationApp')
  .controller('graphCtrl', function ($scope, statistics, util, influxdb, $q, $interval) {
 
    var graph = 'data.json'

 //    // var roads = JSON.parse('data.json')
    var request = new XMLHttpRequest();
    request.open("GET", graph, false);
    request.send(null)
    var roads = JSON.parse(request.responseText).links;
 //    console.log(roads)

	// var w = 960,
	// h = 590,
	// r = 10;

	// var vis = d3.select(".graph")
	// 	.append("svg:svg")
	// 	.attr("width", w)
	// 	.attr("height", h)
	// 	.attr("pointer-events", "all")
	// 	.append('svg:g')
	// 	// .call(d3.behavior.zoom().on("zoom", redraw))
	// 	// .append('svg:g');

	// vis.append('svg:rect')
	//     .attr('width', w)
	//     .attr('height', h)
	//     .attr('fill', 'rgba(1,1,1,0)')

    

	// function redraw() {
	// 	console.log("here", d3.event.translate, d3.event.scale);
	// 	vis.attr("transform","translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")"); 
	// }	
		
	// var force = d3.layout.force()
	// 	.gravity(.03)
	// 	.charge(-1200)
	// 	.linkDistance( 200 )
	// 	.size([w, h]);
	
	// // var svg = d3.select(".text").append("svg")
	// // 	.attr("width", w)
	// // 	.attr("height", h);
			
	// d3.json(graph, function(json) {
	// 	force
	// 		.nodes(json.nodes)
	// 		.links(json.links)
	// 		.on("tick", tick)
	// 		.start();

	// 		var link = vis.selectAll(".gLink")
	//             .data(force.links())
	//       		.enter().append("g")
	//       		.attr("class", "gLink")
	// 			.append("line")
	// 			.attr("class", "link")
	// 			.attr("stroke-width","6")
	// 			.attr("id", function(d){
	// 				return d.road_id
	// 			})
	// 			.on("mouseover", function(){d3.select(this).style("stroke", "#CA8C50")})
	// 			.on("mouseout", function(){d3.select(this).style("stroke", "#ccb")})

	// 		var linkText = vis.selectAll(".gLink")
	// 		    .data(force.links())
	// 		    .append("text")
	// 		    .attr("font-family", "Arial, Helvetica, sans-serif")
	// 		    .attr("fill", "Black")
	// 		    .style("font", "normal 12px Arial")
	// 		    .attr("dy", "0em")
	// 		    .text(function(d) { return d.name; })

	// 		var node = vis.selectAll("g.node")
	// 			.data(json.nodes)
	// 			.enter().append("svg:g")
	// 			.attr("class","node")
	// 			.call(force.drag);
				
	// 			node.append("svg:circle")
	// 				.attr("r", r )
	// 				.style("stroke-width", "4")
	// 				.on("mouseover", function(){d3.select(this).style("fill", "#999")})
	// 				.on("mouseout", function(d) {d3.select(this).style("fill","black")})
					
	// 			node.append("svg:text")
	// 				.attr("text-anchor", "middle") 
	// 				.attr("fill","skyblue")
	// 				.style("pointer-events", "none")
	// 				.attr("font-size", "9px")
	// 				.attr("font-weight", "100" )
	// 				.text( function(d) { return d.id} ) ;
				
 //  		function tick() {
	// 	    node.attr("cx", function(d) { return d.x; })
	// 	        .attr("cy", function(d) { return d.y; })
	// 			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";});

	// 	    link.attr("x1", function(d) { return d.source.x; })
	// 	        .attr("y1", function(d) { return d.source.y; })
	// 	        .attr("x2", function(d) { return d.target.x; })
	// 	        .attr("y2", function(d) { return d.target.y; });

	//         linkText.attr("x", function(d) {
	// 		        if (d.target.x > d.source.x)
	// 		            return (d.source.x + (d.target.x - d.source.x)/2)
	// 		        else
	// 		            return (d.target.x + (d.source.x - d.target.x)/2)
	// 		    })
	// 		    .attr("y", function(d) {
	// 		        if (d.target.y > d.source.y)
	// 		            return (d.source.y + (d.target.y - d.source.y)/2)
	// 		        else
	// 		            return (d.target.y + (d.source.y - d.target.y)/2)
	// 		    })
	//   	}
	// });
	var width = 960,
    	height = 580;
	var svg = d3.select(".graph").append("svg")
		    .attr("width", width)
		    .attr("height", height);

 	var date = d3.select(".graph").append("div")
        .attr("class", "date");

    var start_date = '2013-06-23'
    var end_date = '2013-06-28'
    var group_by_time = 10
    var date_template = setDateTemplate(start_date, end_date, group_by_time)
    var date_template_length =Object.keys(date_template).length

    var time_index= 0
    var speed= 500
    var interval_running = false
    var interval_promise= null

	roads.forEach(function(road){
		getData(road.road_id, start_date, end_date, group_by_time).then(function(data){
            road.data = data[1]
            console.log(road)
       	})
	})       

    shortcut.add("Enter",function() {
        if(interval_running){
            console.log("stop")
            $interval.cancel(interval_promise)
            interval_running = false
        }
        else{
            console.log("start")
            interval_running = true
            interval_promise= $interval(function(){
                animateRoads(roads, time_index)
                time_index++
                if(time_index>date_template_length-1){
                    console.log("done")
                    $interval.cancel(interval_promise)
                    interval_running = false
                    time_index = 0
                }
            },speed)
        }
        
    },{"disable_in_input" : false, 'propagate':false});

    shortcut.add("left",function() {
        if(!interval_running){
            time_index--
            animateRoads(roads, time_index)
        }
    })

    shortcut.add("right",function() {
        if(!interval_running){
            time_index++
            animateRoads(roads, time_index)
        }
    })


	d3.json(graph, function(json) {		

		var force = d3.layout.force()
		    .nodes(d3.values(json.nodes))
		    .links(json.links)
		    .size([width, height])
		    .gravity(.03)
		    .linkDistance(200)
		    .charge(-2000)
		    .on("tick", tick)
		    .start();

		svg.append("svg:defs").selectAll("marker")
		    .data(["end"])      
		  .enter().append("svg:marker") 
		    .attr("id", String)
		    .attr("viewBox", "0 -5 10 10")
		    .attr("refX", 20)
		    .attr("refY", 0)
		    .attr("markerWidth", 4)
		    .attr("markerHeight", 4)
		    .attr("orient", "auto")
		  	.append("svg:path")
		    .attr("d", "M0,-5L10,0L0,5");

		var path = svg.append("svg:g").selectAll("path")
		    .data(force.links())
		  	.enter().append("svg:path")
		    .attr("class", function(d){
		    	return "link "+d.road_id
		    })
		    .attr("id", function(d){
				return "l_"+d.id
			})
		    .attr("marker-end", "url(#end)");

	    var linktext = svg.append("svg:g").selectAll("g.linklabelholder").data(force.links());
	
    	linktext.enter().append("g").attr("class", "linklabelholder")
     		.append("text")
	     	.attr("class", "linklabel")
		 	.style("font-size", "9px")
	     	.attr("x", "30")
		 	.attr("dy", "-10")
	     	.attr("text-anchor", "start")
		   	.style("fill","#000")
		 	.append("textPath")
	    	.attr("xlink:href",function(d,i) { return "#l_" + d.id;})
	     	.text(function(d) { 
		 		return d.name; 
		 	});

		var node = svg.selectAll(".node")
		    .data(force.nodes())
		    .enter().append("g")
		    .attr("class", "node")
		    .call(force.drag);

		node.append("circle")
		    .attr("r", 10);

		node.append("text")
			.attr("text-anchor", "middle") 
			.attr("fill","skyblue")
			.style("pointer-events", "none")
			.attr("font-size", "9px")
			.attr("font-weight", "100" )
			.text( function(d) { return d.id} ) ; 

		function tick() {
		    path.attr("d", function(d) {
		        var dx = d.target.x - d.source.x,
		            dy = d.target.y - d.source.y,
		            dr = Math.sqrt((dx * dx)/0.05 + (dy * dy)/0.05);
		        return "M" + 
		            d.source.x + "," + 
		            d.source.y + "A" + 
		            dr + "," + dr + " 0 0,1 " + 
		            d.target.x + "," + 
		            d.target.y;
		    });

		    node.attr("transform", function(d) { 
		  	    return "translate(" + d.x + "," + d.y + ")"; });
		}

	});


	function getData(id, start_date, end_date, group_by_time){
        var deferred = $q.defer();
        influxQuery("select count(status) from road_"+id+" where status=0 and time > '"+start_date+"' and time < '"+end_date+"' group by time("+group_by_time+"m)").then(function(views){
            influxQuery("select mean(status) from road_"+id+" where status>0 and status<6 and time > '"+start_date+"' and time < '"+end_date+"' group by time("+group_by_time+"m)").then(function(status){
                deferred.resolve([id,merge(views,status, angular.copy(date_template))])
            })
        })
        return deferred.promise
    } 

    function influxQuery(query){
        var deferred = $q.defer();
        influxdb.query(query+"order asc").then(function(results){
            deferred.resolve(results[0].points)
        })
        return deferred.promise
    }

    function changeStrokeWidth(id, val){
        console.log("width: "+val)
        var width = val == -1? 1.5 : val/2
        $('.'+id).css('stroke-width',width)
    }

    function changeStrokeColor(id, val){
        console.log("color: "+val)
        var color = (val == -1)? hsv2rgb(0,0,0) : hsv2rgb(Math.floor((4 - val) * 120 / 4), 1, 1);
        $('.'+id).css('stroke', color)    
        
    }

    function printDate(val){
        date.text(new Date(val))
    }

    function animateRoads(roads, index){
    	roads.forEach(function(road){
    		if(road.data){
                printDate(road.data[index][0])
                // changeStrokeWidth(road.road_id,road.data[index][1])
                changeStrokeColor(road.road_id,road.data[index][2])
            }
    	})
    }

    function merge(arr1, arr2, obj){
        arr1.forEach(function(a){
            obj[a[0]][1] = a[1]// [a[0], a[1], -1]
        })
        arr2.forEach(function(a){
            obj[a[0]][2] = a[1]-1
            // if(obj[a[0]].length)
            // else
            //     obj[a[0]] = [a[0], -1, a[1]-1]
        })

        var merged_arr = $.map(obj, function(value, index) {
            return [value];
        })
        return merged_arr.sort(function (a, b) {
            return a[0] - b[0];
        })
    }

    var hsv2rgb = function(h, s, v) {
      var rgb, i, data = [];
      if (s === 0) {
        rgb = [v,v,v];
      } else {
        h = h / 60;
        i = Math.floor(h);
        data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
        switch(i) {
          case 0:
            rgb = [v, data[2], data[0]];
            break;
          case 1:
            rgb = [data[1], v, data[0]];
            break;
          case 2:
            rgb = [data[0], v, data[2]];
            break;
          case 3:
            rgb = [data[0], data[1], v];
            break;
          case 4:
            rgb = [data[2], data[0], v];
            break;
          default:
            rgb = [v, data[0], data[1]];
            break;
        }
      }
      return '#' + rgb.map(function(x){
        return ("0" + Math.round(x*255).toString(16)).slice(-2);
      }).join('');
    }

    function setDateTemplate(start, end, diff){
        var obj = {}
        var d = new Date(start)
        var end_date = new Date(end)
        while(d<= end_date){
            var ms = d.getTime()
            obj[ms]=[ms, -1, -1]
            d.setMinutes(d.getMinutes()+diff)
        }
        return obj
    }  

})