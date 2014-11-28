'use strict';

angular.module('customVisulizationApp')
  .controller('graphCtrl', function ($scope, statistics, util, influxdb, $q, $interval) {
 
    var graph = 'data.json'
	
    var request = new XMLHttpRequest();
    request.open("GET", graph, false);
    request.send(null)
    var res = JSON.parse(request.responseText)
    var roads = res.links;
	var nodes_roads = buildNodesRoads(res);
	
	var width = 1400,
    	height = 610;

	var x = d3.scale.linear()
    	.domain([0, width])
    	.range([0, width]);

	var y = d3.scale.linear()
    	.domain([0, height])
    	.range([0,height]);

	var svg = d3.select(".graph").append("svg")
		    .attr("width", width)
		    .attr("height", height)
		    

 	var date = d3.select(".graph").append("div")
        .attr("class", "date");

    var start_date = '2013-06-13'
    var end_date = '2014-05-10'
    
    var cell_st_date = new Date('2013-06-01');
    
    var group_by_time = 1440
    var date_template = setDateTemplate(start_date, end_date, group_by_time)
    var date_template_length =Object.keys(date_template).length

    var time_index= 0
    var speed= 500
    var interval_running = false
    var interval_promise= null

	roads.forEach(function(road){
		getData(road.road_id, start_date, end_date, group_by_time).then(function(data){
            road.data = data
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
                showRoadWithStatus(current_selected_status)
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
		    // .gravity(.03)
		    // .linkDistance(200)
		    // .charge(-2000)
		    .on("tick", function(){})
		    .start();

		svg
		.call(d3.behavior.zoom().x(x).y(y).scaleExtent([1, 8]).on("zoom", tick))
		.append("svg:defs").selectAll("marker")
		    .data(["end"])      
		  	.enter().append("svg:marker") 
		    .attr("id", String)
		    .attr("viewBox", "0 -5 10 10")
		    .attr("refX", 20)
		    .attr("refY", 0)
		    .attr("markerWidth", 4)
		    .attr("markerHeight", 4)
		    .attr("orient", "auto")
		    .attr("fill","indianred")
		  	.append("svg:path")
		    .attr("d", "M0,-5L10,0L0,5");

		var path = svg.append("svg:g").selectAll("path")
		    .data(force.links())
		  	.enter().append("svg:path")
		    .attr("class", function(d){
		    	return "link " + d.road_id
		    })
		    .attr("id", function(d, i){
				return "l_"+i
			})
		    .attr("marker-end", "url(#end)")
		    .on('click', function(d, i){
		    	console.log(d.road_id + " is Selected");
		    	getDataFor("road_"+d.road_id, true);
		    	selectRoad(d.road_id);
		    });

	    var linktext = svg.append("svg:g")
	    	.selectAll("g.linklabelholder")
	    	.data(force.links())
    		.enter().append("g").attr("class", "linklabelholder")
     		.append("text")
	     	.attr("class", "linklabel")
	     	.attr("class", function(d){
	     		return "lbl_" + d.road_id;
     		})
		 	.style("font-size", "6px")
		 	.style("font-weight", "300")
		 	.style("cursor", "pointer")
	     	.attr("x", function(d){
	     		return Math.abs(x(((d.target.x - d.source.x)/4)-20))
	     	})
		 	.attr("dy", "-5")
	     	.attr("text-anchor", "start")
		   	.style("fill","#000")
		   	.on('click', function(d, i){
		    	console.log(d.road_id + " is Selected");
		    	getDataFor("road_"+d.road_id, true);
		    	selectRoad(d.road_id);
		    });

	   	var linktextpath = linktext
		 	.append("textPath")
	    	.attr("xlink:href",function(d,i) { return "#l_" + i;})
	     	.text(function(d) { 
		 		return d.name; 
		 	});

		var node = svg.selectAll(".node")
		    .data(force.nodes())
		    .enter().append("g")
		    .attr("class", function(d){
		    	if(d.invisible)
		    		return "node invisible"
		    	else
		    		return "node"
		    })
		    .attr("class", function(d){
		    	return "node node_id_" + d.id;
		    })
		    // .call(force.drag);

		node.append("circle")
		    .attr("r", 10)
		    .attr("cx", function(d) { return x(d.x) })
     		.attr("cy", function(d) { return y(d.y) })
//rgb(181, 17, 54)
		node.append("text")
			.attr("text-anchor", "middle") 
			.attr("fill","brown")
			.style("pointer-events", "none")
			.attr("font-size", "10px")
			.style("font-weight", "500")
			.text( function(d) { return d.title} )
			.attr("x", function(d){return x(d.x)}) 
			.attr("y", function(d){return y(d.y)}) 
			
		function tick() {
		    path.attr("d", function(d) {
		        var dx = x(d.target.x - d.source.x),
		            dy = y(d.target.y - d.source.y),
		            dr = Math.max(900,Math.sqrt((dx * dx)/0.05 + (dy * dy)/0.05));
		        return "M" + 
		            x(d.source.x) + "," + 
		            y(d.source.y) + "A" + 
		            dr + "," + dr + " 0 0,1 " + 
		            x(d.target.x) + "," + 
		            y(d.target.y);
		    });

		    node.attr("transform", function(d) { 
		  	    return "translate(" + d3.event.translate+ ") scale(" + d3.event.scale + ")"; });
		}

		tick()

	});



	function getData(id, start_date, end_date, group_by_time){
        var deferred = $q.defer();
        influxQuery("select avg_traffic from road_"+id+" where time > '"+start_date+"' and time < '"+end_date+"'").then(function(avg_traffic){
            // influxQuery("select total_reports from road_"+id+" where time > '"+start_date+"' and time < '"+end_date+"'").then(function(total_reports){
                // deferred.resolve(merge(avg_traffic, total_reports, angular.copy(date_template)))
                deferred.resolve(merge(avg_traffic, angular.copy(date_template)))
            // })
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
        // console.log("color: "+val)
        // var color = (val == -1)? hsv2rgb(0,0,0) : hsv2rgb(Math.floor((4 - val) * 120 / 4), 1, 1);
        //$('.'+id).css('stroke', color)    
        if(val != -1)
        	$('.'+id).css('stroke', hsv2rgb(Math.floor((4 - val) * 120 / 4), 1, 1))    
        
    }

    function printDate(val){
    	var d = new Date(val)
    	current_day = d;
    	var prev_d = new Date(val);
    	prev_d.setDate(prev_d.getDate() - 1)
        date.text(d);
        $('rect[data-date^="' + prev_d.toUTCString() + '"]').show();
        $('rect[data-date^="' + d.toUTCString() + '"]').hide();
    }

    function animateRoads(roads, index){
    	roads.forEach(function(road){
    		if(road.data){
                printDate(road.data[index][0])
                // changeStrokeWidth(road.road_id,road.data[index][1])
                changeStrokeColor(road.road_id,road.data[index][1])
            }
    	})
    }

    function merge(arr1, obj){
        arr1.forEach(function(a){
            obj[a[0]][1] = a[2]
        })
        // arr2.forEach(function(a){
            // obj[a[0]][2] = a[2]
        // })

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
            // obj[ms]=[ms, -1, -1]
            obj[ms]=[ms, -1]
            d.setMinutes(d.getMinutes()+diff)
        }
        return obj
    }  
		
	// ---- START Calender ----
	// ------------------------
	var cal = new CalHeatMap();
	function setupCalender(data){
		cal.init({
			itemSelector: "#onClick-a",
			domain: "month",
			subDoman: "day",
			cellSize: 20,
			subDomainTextFormat: "%d",
			range: 12,
			displayLegend: "false",
			start: new Date(2013, 5),
			minDate: new Date(2013, 5),
			maxDate: new Date(2014, 4),
			weekStartOnMonday: false,
			// highlight: select_range(new Date(2014, 3, 14), new Date(2014, 5, 14)),
			onClick: click_day,
			data: data,
			legend: [1, 2, 3, 4, 5],
			onComplete: function(){
				var cells = $(".graph-rect");
				$(".graph-rect").each(function( index ) {
				  $(this).attr("data-date", cell_st_date.toUTCString());
				  cell_st_date.setDate(cell_st_date.getDate() + 1);
				});
			}
		});
	}
	
	function click_day(date, nb){
		var first = date.getDate() - date.getDay();
		var last = first + 6;
		var firstday = new Date(date.setDate(first));
		var lastday = new Date(date.setDate(last));
		var format = d3.time.format("%Y-%m-%d %H:%M:%S");
		$("#onClick-placeholder").html(
			"first Date:" + format(firstday) + "<br/>" +
			"last Date:" + format(lastday) + "<br/>" +
			"Val:" + nb
		);
		
		// Start: Move the animation to the first day of this week
		var times = Object.keys(date_template).sort();
		for(var i = 0; i < times.length; i++){
			if(parseInt(times[i]) > firstday.getTime()){
				$("rect").show();
				time_index = i;
				break;
			}
		}
		// End: Move the animation to the first day of this week 
		
		// Call Bahia code to display the week 
	}
	
	// mark the given range
	function select_range(st_date, end_date){
		var selected_list = [];
	 	var start_sel = (st_date).getTime();
	 	var days = d3.time.days(st_date, end_date).length;
	 	for(var i = 0; i < days; i++){
	 		selected_list.push(new Date(start_sel + (i * 1000 * 60 * 60 * 24)) );
	 	}
	 	return selected_list;
	}
	
	var current_selected_road_id = null;		// hold the current selected road id,
	var current_day = new Date(start_date);		// hold the current day, initially eq to the data first day 
	var current_selected_status = -1;
	function getDataFor(db_name, update){
		var url = "http://54.173.41.125:8086/db/bey2ollak_day/series?u=root&p=root&q=select%20avg_traffic%20from%20" + db_name + "%20order%20asc";
		$.ajax({
				url: url,
				type: "GET",
				success: function(data, status, xhr){
							var time_idx = data[0].columns.indexOf("time")
							var avg_traffic_idx = data[0].columns.indexOf("avg_traffic")
							var points = data[0].points;
							var stats = {};
							for (var d in points) {
								stats[points[d][time_idx]/1000] = points[d][avg_traffic_idx];
							}
							if(update)
								cal.update(stats)
							else
								setupCalender(stats);
					},
				error: function (xhr, status, error) {
						console.log(status + " - " + error);
					}
			});
	}
	
	function selectRoad(id){
		if(current_selected_road_id){
			$('.'+current_selected_road_id).css('stroke-width',"2px");
			current_selected_road_id = id;
			$('.'+id).css('stroke-width',"4px");
		}else{
			current_selected_road_id = id;
			$('.'+id).css('stroke-width',"4px");
		}
	}
	
	$(function(){
		$("#traffic_flow_slider a").bind("click", function(){
			showRoadWithStatus($(this).data()["status"]);
		})
		getDataFor("road_all", false);
	})
	
	function showRoadWithStatus(status){
		current_selected_status = status;
		var times = Object.keys(date_template).sort();
		var current_idx;
		for(var i = 0; i < times.length; i++){
			if(parseInt(times[i]) > current_day.getTime()){
				current_idx = i;
				break;
			}
		}
		$("text").show();
		$(".link").show();
		$(".node").show();
		roads.forEach(function(road){
			if(road.data){
				var road_status = road.data[current_idx][1];
				if(road_status < current_selected_status){
					$(".lbl_" + road.road_id).hide();
					$("." + road.road_id).hide();
				}
			}
		})
		
		// Hide un-needed nodes
		$.each( nodes_roads, function( key, links ) {
		  var hide = true;
		  $.each(links, function( link_index, link ) {
  				$.each($("."+link), function( link_index, elem ) {
		  			if(elem.outerHTML.indexOf("display: none") == -1)
		  				hide = false;
  				}) 
		  });
		  if(hide)
		  	$(".node_id_" + key).hide();
		});
	}
	
	// build a map to hold {node: [roads]}
	function buildNodesRoads(g){
		var m = {};
		var n = g["nodes"];
		var l = g["links"];
		$.each(n, function( node_index, node ) {
			var roads_list = [];
			$.each(l, function( link_index, link ) {
				if( (link.source == node.id || link.target == node.id) && roads_list.indexOf(link.road_id) == -1)
					roads_list.push(link.road_id);
			});
			m[node.id] = roads_list;
		});
		return m;
	}
	
	// ------------------------
	// ----- END Calender -----  

})