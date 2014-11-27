'use strict';

angular.module('customVisulizationApp')
  .controller('graphCtrl', function ($scope, statistics, util, influxdbmin, $q, $interval) {
// 
//    var graph = 'data.json'
//
//    var request = new XMLHttpRequest();
//    request.open("GET", graph, false);
//    request.send(null)
//    var roads = JSON.parse(request.responseText).links;
//
//	var width = 1400,
//    	height = 610;
//
//	var x = d3.scale.linear()
//    	.domain([0, width])
//    	.range([0, width]);
//
//	var y = d3.scale.linear()
//    	.domain([0, height])
//    	.range([0,height]);
//
//	var svg = d3.select(".graph").append("svg")
//		    .attr("width", width)
//		    .attr("height", height)
//		    
//
// 	var date = d3.select(".graph").append("div")
//        .attr("class", "date");
//
//    var start_date = '2013-06-24'
//    var end_date = '2013-07-01'
//    var group_by_time = 10
//    var date_template = setDateTemplate(start_date, end_date, group_by_time)
//    var date_template_length =Object.keys(date_template).length
//
//    var time_index= 0
//    var speed= 200
//    var interval_running = false
//    var interval_promise= null
//
//       
//	roads.forEach(function(road){
//		getData(road.road_id, start_date, end_date, group_by_time).then(function(data){
//            road.data = data
//            //console.log(road)
//       	})
//	})       
//
//    shortcut.add("Enter",function() {
//        if(interval_running){
//            //console.log("stop")
//            $interval.cancel(interval_promise)
//            interval_running = false
//        }
//        else{
//            //console.log("start")
//            interval_running = true
//            interval_promise= $interval(function(){
//                animateRoads(roads, time_index)
//                time_index++
//                if(time_index>date_template_length-1){
//                    //console.log("done")
//                    $interval.cancel(interval_promise)
//                    interval_running = false
//                    time_index = 0
//                }
//            },speed)
//        }
//        
//    },{"disable_in_input" : false, 'propagate':false});
//
//    shortcut.add("left",function() {
//        if(!interval_running){
//            time_index--
//            animateRoads(roads, time_index)
//        }
//    })
//
//    shortcut.add("right",function() {
//        if(!interval_running){
//            time_index++
//            animateRoads(roads, time_index)
//        }
//    })
//
//
//	d3.json(graph, function(json) {		
//
//		var force = d3.layout.force()
//		    .nodes(d3.values(json.nodes))
//		    .links(json.links)
//		    .size([width, height])
//		    // .gravity(.03)
//		    // .linkDistance(200)
//		    // .charge(-2000)
//		    .on("tick", function(){})
//		    .start();
//
//		svg
//		.call(d3.behavior.zoom().x(x).y(y).scaleExtent([1, 8]).on("zoom", tick))
//		.append("svg:defs").selectAll("marker")
//		    .data(["end"])      
//		  	.enter().append("svg:marker") 
//		    .attr("id", String)
//		    .attr("viewBox", "0 -5 10 10")
//		    .attr("refX", 20)
//		    .attr("refY", 0)
//		    .attr("markerWidth", 4)
//		    .attr("markerHeight", 4)
//		    .attr("orient", "auto")
//		    .attr("fill","indianred")
//		  	.append("svg:path")
//		    .attr("d", "M0,-5L10,0L0,5");
//
//		var path = svg.append("svg:g").selectAll("path")
//		    .data(force.links())
//		  	.enter().append("svg:path")
//		    .attr("class", function(d){
//		    	return "link "+d.road_id
//		    })
//		    .attr("id", function(d, i){
//				return "l_"+i
//			})
//		    .attr("marker-end", "url(#end)");
//
//	    var linktext = svg.append("svg:g")
//	    	.selectAll("g.linklabelholder")
//	    	.data(force.links())
//    		.enter().append("g").attr("class", "linklabelholder")
//     		.append("text")
//	     	.attr("class", "linklabel")
//		 	.style("font-size", "6px")
//		 	.style("font-weight", "200")
//	     	.attr("x", function(d){
//	     		return Math.abs(x(((d.target.x - d.source.x)/4)-20))
//	     	})
//		 	.attr("dy", "-5")
//	     	.attr("text-anchor", "start")
//		   	.style("fill","#000")
//
//	   	var linktextpath = linktext
//		 	.append("textPath")
//	    	.attr("xlink:href",function(d,i) { return "#l_" + i;})
//	     	.text(function(d) { 
//		 		return d.name; 
//		 	});
//
//		var node = svg.selectAll(".node")
//		    .data(force.nodes())
//		    .enter().append("g")
//		    .attr("class", function(d){
//		    	if(d.invisible)
//		    		return "node invisible"
//		    	else
//		    		return "node"
//		    })
//		    // .call(force.drag);
//
//		node.append("circle")
//		    .attr("r", 10)
//		    .attr("cx", function(d) { return x(d.x) })
//     		.attr("cy", function(d) { return y(d.y) })
////rgb(181, 17, 54)
//		node.append("text")
//			.attr("text-anchor", "middle") 
//			.attr("fill","brown")
//			.style("pointer-events", "none")
//			.attr("font-size", "10px")
//			.style("font-weight", "500")
//			.text( function(d) { return d.title} )
//			.attr("x", function(d){return x(d.x)}) 
//			.attr("y", function(d){return y(d.y)}) 
//
//		function tick() {
//		    path.attr("d", function(d) {
//		        var dx = x(d.target.x - d.source.x),
//		            dy = y(d.target.y - d.source.y),
//		            dr = Math.max(900,Math.sqrt((dx * dx)/0.05 + (dy * dy)/0.05));
//		        return "M" + 
//		            x(d.source.x) + "," + 
//		            y(d.source.y) + "A" + 
//		            dr + "," + dr + " 0 0,1 " + 
//		            x(d.target.x) + "," + 
//		            y(d.target.y);
//		    });
//
//		    node.attr("transform", function(d) { 
//		  	    return "translate(" + d3.event.translate+ ") scale(" + d3.event.scale + ")"; });
//		}
//
//		tick()
//
//	});
//
//
//
//	function getData(id, start_date, end_date, group_by_time){
//       
//        var deferred = $q.defer();
//        influxQuery("select avg_traffic from road_"+id+" where time > '"+start_date+"' and time < '"+end_date+"'  ").then(function(data){
//                deferred.resolve(merge(data,angular.copy(date_template)))
//            })
//        return deferred.promise
//    } 
//
//    function influxQuery(query){
//        var deferred = $q.defer();
//        influxdbmin.query(query+"order asc").then(function(results){
//            deferred.resolve(results[0].points)
//        })
//        return deferred.promise
//    }
//
//    function changeStrokeWidth(id, val){
//        //console.log("width: "+val)
//        var width = val == -1? 1.5 : val/2
//        $('.'+id).css('stroke-width',width)
//    }
//
//    function changeStrokeColor(id, val){
//        //console.log("color: "+val)
//        // var color = (val == -1)? hsv2rgb(0,0,0) : hsv2rgb(Math.floor((4 - val) * 120 / 4), 1, 1);
//        //$('.'+id).css('stroke', color)    
//        if(val != -1)
//        	$('.'+id).css('stroke', hsv2rgb(Math.floor((4 - val) * 120 / 4), 1, 1))    
//        
//    }
//
//    function printDate(val){
//        date.text(new Date(val))
//    }
//
//    function animateRoads(roads, index){
//    	roads.forEach(function(road){
//    		if(road.data){
//                printDate(road.data[index][0])
//                // changeStrokeWidth(road.road_id,road.data[index][1])
//                changeStrokeColor(road.road_id,road.data[index][1])
//            }
//    	})
//    }
//
//    function merge(arr1, obj){
//        arr1.forEach(function(a){
//            obj[a[0]][1] = a[2]
//        })
//
//        var merged_arr = $.map(obj, function(value, index) {
//            return [value];
//        })
//        return merged_arr.sort(function (a, b) {
//            return a[0] - b[0];
//        })
//    }
//
//    var hsv2rgb = function(h, s, v) {
//      var rgb, i, data = [];
//      if (s === 0) {
//        rgb = [v,v,v];
//      } else {
//        h = h / 60;
//        i = Math.floor(h);
//        data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
//        switch(i) {
//          case 0:
//            rgb = [v, data[2], data[0]];
//            break;
//          case 1:
//            rgb = [data[1], v, data[0]];
//            break;
//          case 2:
//            rgb = [data[0], v, data[2]];
//            break;
//          case 3:
//            rgb = [data[0], data[1], v];
//            break;
//          case 4:
//            rgb = [data[2], data[0], v];
//            break;
//          default:
//            rgb = [v, data[0], data[1]];
//            break;
//        }
//      }
//      return '#' + rgb.map(function(x){
//        return ("0" + Math.round(x*255).toString(16)).slice(-2);
//      }).join('');
//    }
//
//    function setDateTemplate(start, end, diff){
//        var obj = {}
//        var d = new Date(start)
//        var end_date = new Date(end)
//        while(d<= end_date){
//            var ms = d.getTime()
//            obj[ms]=[ms, -1]
//            d.setMinutes(d.getMinutes()+diff)
//        }
//        return obj
//    }  
//      
//      // 0:red, 2:orange, 4:yellow, 6:light green, 8:dark green

})




// to do list:

// get data url from karim.
// update the getdata function, get the real data..
// plot in day chart..