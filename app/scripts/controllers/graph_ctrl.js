'use strict';

angular.module('customVisulizationApp')
  .controller('graphCtrl', function ($scope, statistics, util, influxdbday, $q, $interval) {

  	/* 
  	 * UI Initialization
	 */

	 $(document).ready(function(){
	 	$('[data-toggle="tooltip"]').tooltip()
	 	
	 	var offset = $("#sidePanelCloser").offset();
	 	var screenWidth = $(window).width();
	 	var btnWidth = $('#sidePanelCloser').width();

	 	var location = -(screenWidth - offset.left - btnWidth);

	 	$('#sidePanelCloser').css("right", location + "px")
	 	$('#sidePanelCloser').on('click',function(){
	 		var currentOffset = $("#sidePanelCloser").offset();
	 		var currentLocation = -(screenWidth - currentOffset.left - btnWidth);

	 		if(currentLocation != location) {
	 			$('#sidePanelCloser').animate({ right: "0" }, 1000)
	 			$('#sidePanelCloser span').removeClass("glyphicon glyphicon-chevron-left");
	 			$('#sidePanelCloser span').addClass("glyphicon glyphicon-chevron-right");
	 		} else {
	 			$('#sidePanelCloser').animate( { right: location + "px" }, 1000)
	 			$('#sidePanelCloser span').removeClass("glyphicon glyphicon-chevron-right");
	 			$('#sidePanelCloser span').addClass("glyphicon glyphicon-chevron-left");
	 		}

	        $('#sidePanelContent').toggle("slide", {direction:'right'}, 1000);
	    });

	    $('#playButton').on('click', function(){
	    	$(this).children("span").each(function() {
	    		if($(this).hasClass("glyphicon-play")) {
		    		
		    		startPauseAnimation();
	    		} else {
		    		startPauseAnimation();
	    		}
	    	});
	    })

	    $('#backwardButton').on('click', function() {
	    	DecTimeIndex();
	    })

	    $('#forwardButton').on('click', function() {
	    	IncTimeIndex();
	    })

	 })
 
 	var security_icon = "/img/security.ico"
 	var planning_icon = "/img/planning.ico"
 	
 	var Colors = ["darkgreen", "#2ECC71", "#F1C40F", "#F39C12", "#E74C3C", "purple", "pink", "black"]
    var graph = 'data.json'
	
    var request = new XMLHttpRequest();
    request.open("GET", graph, false);
    request.send(null)
    var res = JSON.parse(request.responseText)
    var roads = res.links;
	var nodes_roads = buildNodesRoads(res);
	$scope.road=false
    $scope.startofweek=""
    $scope.endofweek=""
      
	var width = 1400,
    	height = 610;

	var x = d3.scale.linear()
    	.domain([0, width])
    	.range([0, width]);

	var y = d3.scale.linear()
    	.domain([0, height])
    	.range([0,height]);

    var date = d3.select(".graph").append("div")
        .attr("class", "date");

	var svg = d3.select(".graph").append("svg")
		    .attr("width", width)
		    .attr("height", height)

    var start_date = '2013-06-13'
    var end_date = '2014-05-10'
    
    var cell_st_date = new Date('2013-06-01');
    
    var group_by_time = 1440
    var date_template = setDateTemplate(start_date, end_date, group_by_time)
    var date_template_length =Object.keys(date_template).length

    var time_index= 0
    var speed= 1200
    var interval_running = false
    var interval_promise= null

	roads.forEach(function(road){
		getData(road.road_id, start_date, end_date, group_by_time).then(function(data){
            road.data = data
            //console.log(road)
       	})
	})       

    shortcut.add("Enter",function() {
        startPauseAnimation()
    },{"disable_in_input" : false, 'propagate':false});

    shortcut.add("left",function() {
        DecTimeIndex();
    })

    shortcut.add("right",function() {
        IncTimeIndex();
    })

    function startPauseAnimation() {
    	if(interval_running){
            console.log("stop")
            $("#playButton").children("span").each(function() {
	            $(this).removeClass("glyphicon-pause");
			    $(this).addClass("glyphicon-play");
			});
            $interval.cancel(interval_promise)
            interval_running = false
        }
        else{

            console.log("start")
            $("#playButton").children("span").each(function() {
	            $(this).removeClass("glyphicon-play");
			    $(this).addClass("glyphicon-pause");
			});
            interval_running = true
            interval_promise= $interval(function(){
                animateRoads(roads, time_index)
                showRoadWithStatus(current_selected_status)
                time_index++
                if(time_index>date_template_length-1){
                    //console.log("done")
                    $interval.cancel(interval_promise)
                    interval_running = false
                    time_index = 0
                }
            },speed)
        }
    }

    function DecTimeIndex() {
		if(!interval_running){
            time_index--
            animateRoads(roads, time_index)
        }
    }

    function IncTimeIndex() {
    	if(!interval_running){
            time_index++
            animateRoads(roads, time_index)
        }
    }


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
		    	//console.log(d.road_id + " is Selected");
		    	getDataFor("road_"+d.road_id, true);
		    	selectRoad(d.road_id);
		    });
		    
		var icons = svg.append("svg:g").selectAll("g")
			.data(force.links()).enter().append("svg:g");
			
			icons.append("image").attr("xlink:href",security_icon)
		    .attr("width", 24).attr("height", 24)
		    .style("cursor", "pointer")
        	.style("display", "none")
        	.attr("class", function(d){
        		return "roads_icons icon_" + d.road_id;
        	})
        	.attr("transform", function(d) {
            	return "translate(" +((d.target.x+d.source.x)/2) + "," + ((d.target.y+d.source.y))/2 + ")";
    		})
    		.on('click', function(d){
    			BahiaWork(d.road_id);
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
                console.log("D IS!!");
                console.log(d);
	     		return Math.abs(x(((d.target.x - d.source.x)/4)-20))
	     	})
		 	//.attr("dy", "-5")
	     	.attr("text-anchor", "start")
		   	.style("fill","#000")
		   	.on('click', function(d, i){
		    	//console.log(d.road_id + " is Selected");
		    	getDataFor("road_"+d.road_id, true);
		    	selectRoad(d.road_id);
		    });
        
        
//        var linkicons = svg.append("svg:image")
//          .attr("xlink:href", "img/icons/sun.svg")
//            .data(force.links())
//          .attr("width", 40)
//          .attr("height", 40)
//          .attr("x", function(d){
//	     		return Math.abs(x(((d.target.x - d.source.x)/4)-20))
//	     	})
//          .attr("y", function(d){
//                console.log("D IS!!");
//                console.log(d);
//	     		return Math.abs(y(((d.target.y - d.source.y)/4)-20))
//	     	})
//          //.attr("y",53);

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
		  	    return "translate(" + d3.event.translate+ ") scale(" + d3.event.scale + ")"; 
	  	    });
	  	    
	  	    icons.attr("transform", function(d) {
            	return "translate(" + d3.event.translate+ ") scale(" + d3.event.scale + ")";
    		});
		  	    
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
        influxdbday.query(query+"order asc").then(function(results){
            deferred.resolve(results[0].points)
        })
        return deferred.promise
    }

    function changeStrokeWidth(id, val){
        //console.log("width: "+val)
        var width = val == -1? 1.5 : val/2
        $('.'+id).css('stroke-width',width)
    }

    function changeStrokeColor(id, val){
        // console.log("color: "+val)
        // var color = (val == -1)? hsv2rgb(0,0,0) : hsv2rgb(Math.floor((4 - val) * 120 / 4), 1, 1);
        //$('.'+id).css('stroke', color)    

        //if(val != -1)
        	//$('.'+id).css('stroke', hsv2rgb(Math.floor((4 - val) * 120 / 4), 0.8, 0.9))

        if(val != -1){
        	$('.'+id).css('stroke', Colors[Math.floor(val)])
    	}

    }

    function printDate(val){
    	var d = new Date(val)
    	current_day = d;
    	var prev_d = new Date(val);
    	prev_d.setDate(prev_d.getDate() - 1)
        // date.text(d);
        $('rect[data-date^="' + prev_d.toUTCString() + '"]').show();
        $('rect[data-date^="' + d.toUTCString() + '"]').hide();
    }

    function animateRoads(roads, index){
    	roads.forEach(function(road){
    		if(road.data){
                printDate(road.data[index][0])
                changeStrokeWidth(road.road_id,4)
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
		
    //////// tags //////////
      
       
	function calculateRoadTags(){
        var deferred = $q.defer();
		influxdbday.query('select sum("7") from /road_*/').then(function(danger){
            var roads = {}
            // var sum = 0
            // danger.forEach(function(road){
            // 	if(road.name != "road_all"){
            // 		sum+=road.points[0][1]
            // 	}            		
            // })
            // var danger_avg =Math.ceil(sum/(danger.length-1))
            // console.log(danger_avg)
            var danger_threshold = 10
            danger.forEach(function(road){
        		if(road.name != "road_all")
            		roads[road.name] = (road.points[0][1] > danger_threshold)? {"security":1} : {"security":0}
            })

            influxdbday.query('select count(avg_traffic) from /road_*/ where avg_traffic >=4').then(function(traffic){
        	 	// var sum = 0
           //  	traffic.forEach(function(road){
	          //   	if(road.name != "road_all"){
	          //   		sum+=road.points[0][1]
	          //   	}            		
	          //   })
	          //   var traffic_avg =Math.ceil(sum/(traffic.length-1))
	          //   console.log(traffic_avg)
	          	var traffic_threshold = 20
	            traffic.forEach(function(road){
        			if(road.name != "road_all")
        				roads[road.name]["planning"] = (road.points[0][1] > traffic_threshold)? 1 : 0
	            })
                deferred.resolve(roads)
            })
            
        })
     return deferred.promise
	}
      
      
      calculateRoadTags().then(function(data){
          console.log("dta is ")
          console.log(data)
          $scope.tags=data;
      });
      
      $scope.show_planning = function(){
  		  $(".roads_icons").hide();
  		  resetRoads();
          for(var key in $scope.tags){
              var id= key.split("_")[1];
                ///changeStrokeWidth(key,0)
                if($scope.tags[key]['planning']>=1)
                {
                    console.log("planning one is");
                    console.log(id);
                    changeStrokeColor(id,5)    
                    changeStrokeWidth(id,10)
                    $(".icon_" + id).show();
                    $(".icon_" + id).attr("href", planning_icon);
                }
          }
      }
      
      $scope.show_security = function(){
      	  $(".roads_icons").hide();
      	  resetRoads();
          for(var key in $scope.tags){
              var id= key.split("_")[1];
                ///changeStrokeWidth(key,0)
                if($scope.tags[key]['security']>=1)
                {
                    console.log("security one is");
                    console.log(id);
                    changeStrokeColor(id,6)    
                    changeStrokeWidth(id,10)
                    $(".icon_" + id).show();
                    $(".icon_" + id).attr("href", security_icon);
                }
          }
      }
      
      $scope.turn_off = function(){
          // for(var key in $scope.tags){
              // var id= key.split("_")[1];
                // ///changeStrokeWidth(key,0)
                // if($scope.tags[key]['security']>=1 || $scope.tags[key]['planning']>=1)
                // {
                    // console.log("security one is");
                    // console.log(id);
                    // changeStrokeColor(id,7)    
                    // changeStrokeWidth(id,4)
                // }
          // }
          resetRoads();
          $(".roads_icons").hide();
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
			legend: [1, 2, 3, 4],
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
        console.log( $scope.road);
		var first = date.getDate() - date.getDay();
		var last = first + 6;
		var firstday = new Date(date.setDate(first));
		var lastday = new Date(date.setDate(last));
		var format = d3.time.format("%Y-%m-%d %H:%M:%S");
        
        var firstw = date.getDate() - date.getDay() -1;
		var lastw = first + 6;
		var firstdayw = new Date(date.setDate(firstw));
		var lastdayw = new Date(date.setDate(lastw));
        var formatweek1 = d3.time.format("%Y-%m-%d 22:00:00");
        var formatweek2 = d3.time.format("%Y-%m-%d 21:00:00");
		$("#onClick-placeholder").html(
			"first Date:" + format(firstday) + " | " +
			"last Date:" + format(lastday) + " | " +
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
		console.log("here now");
		// Call Bahia code to display the week 
        $scope.startofweek= formatweek1(firstdayw)
		$scope.endofweek= formatweek2(lastdayw)
        console.log( $scope.road);
        $scope.safeApply();
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
        $scope.road= id;
        $scope.safeApply();
	}
	
	$(function(){
		$("#trafficFlowFiltration a").bind("click", function(){
			showRoadWithStatus(parseInt($(this).data()["status"]));
		})
		getDataFor("road_all", false);
		$scope.road="all"
	})
	
	function showRoadWithStatus(status){
		current_selected_status = status;
		if(current_selected_status == -1){
			$("text").show();
			$(".link").show();
			$(".node").show();
		}else{
			var times = Object.keys(date_template).sort();
			var current_idx;
			for(var i = 0; i < times.length; i++){
				if(parseInt(times[i]) > current_day.getTime()){
					current_idx = i - 1;
					break;
				}
			}
			$("text").show();
			$(".link").show();
			$(".node").show();
			roads.forEach(function(road){
				if(road.data){
					var road_status = road.data[current_idx][1];
					if(Math.floor(road_status) != current_selected_status){
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

	function resetRoads(){
		$(".link").css('stroke-width',"2px");
		$(".link").css('stroke',"#000");
	}

	function BahiaWork(road_id){
		console.log("Bahia Work: " + road_id);
	}

})

