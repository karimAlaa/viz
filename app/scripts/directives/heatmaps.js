'use strict';

angular.module('customVisulizationApp')
.directive('daychart',['$rootScope','$log','$timeout', '$q','influxdbmin', 'influxdbhour' ,function($rootScope,$log,$timeout, $q, influxdbmin, influxdbhour){
		return {
			restrict: 'E',
			//replace:true, 
            templateUrl:'/views/day-chart.html',
//			scope:{
//				tracks:'=',
//			},
			link: function(scope, element){
                
                scope.influx = {'min': influxdbmin, 'hour': influxdbhour}
                console.log(scope.influx);
                
                var margin = { top: 50, right: 0, bottom: 100, left: 30 },
                  width = 960 - margin.left - margin.right,
                  height = 430 - margin.top - margin.bottom,
                  gridSize = Math.floor(width / 24),
                  legendElementWidth = gridSize*2,
                  buckets = 5,
                  //colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"], // alternatively colorbrewer.YlGnBu[9]
                  colors= ['darkgreen', 'lightgreen', 'yellow', 'orange', 'red'],
                  days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
                  times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12a"];

                var graph = 'data.json'
                var request = new XMLHttpRequest();
                request.open("GET", graph, false);
                request.send(null)
                var roads = JSON.parse(request.responseText).links;
                
                // assuming data for one road
                roads=[{"road_id":"31"}]
                
                roads.forEach(function(road){
                    //var start_date='2013-12-30';
                    var start_date='2013-06-29 22:00:00';
                    var end_date='2013-07-06 22:00:00';
                    getData(road.road_id, start_date, end_date, "hour").then(function(data){
                        road.data = data
                        setup(road.data);
                        console.log(road)
                    })
	            })
                
                function getData(id, start_date, end_date, group_by_time) {
                    var deferred = $q.defer();
                    //group_by_time use to pick table later
                    influxQuery("select avg_traffic from road_"+id+" where time > '"+start_date+"' and time < '"+end_date+"' ", group_by_time).then(function(data){
                        deferred.resolve(data)
                    })
                    
                    return deferred.promise
                }
                
                function influxQuery(query, group_by_time){
                    var deferred = $q.defer();
                    scope.influx[group_by_time].query(query+"order asc").then(function(results){
                        deferred.resolve(results[0].points)
                    })
                return deferred.promise
                }
                
                
        
//    d3.xhr("/path/to/file.csv")
//    .header("header-name", "header-value")
//    .get(function(error, data) {
//      // callback
        // here will get for each hour of each day, 114 points, I will average all 114 to get one value.
//    });
        
//	function getData(id, start_date, end_date, group_by_time){
      // do i have to specify road?? want average of all..
//        var deferred = $q.defer();
//        influxQuery("select count(status) from road_"+id+" where status=0 and time > '"+start_date+"' and time < '"+end_date+"' group by time("+group_by_time+"m)").then(function(views){
//            influxQuery("select mean(status) from road_"+id+" where status>0 and status<6 and time > '"+start_date+"' and time < '"+end_date+"' group by time("+group_by_time+"m)").then(function(status){
//                deferred.resolve(merge(views,status, angular.copy(date_template)))
//            })
//        })
//        return deferred.promise
//    } 
//
//    function influxQuery(query){
//        var deferred = $q.defer();
//        influxdb.query(query+"order asc").then(function(results){
//            deferred.resolve(results[0].points)
//        })
//        return deferred.promise
//    }

//      d3.tsv("data.tsv",
//        function(d) {
//          return {
//            day: +d.day,
//            hour: +d.hour,
//            value: +d.value
//          };
//        },
//        function(error, data) {
            
        
            var setup = function(road)
            {
            
          var colorScale = d3.scale.quantile()
              .domain([0,1,2,3,4])
              .range(colors);

          var svg = d3.select("#chart").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          var dayLabels = svg.selectAll(".dayLabel")
              .data(days)
              .enter().append("text")
                .text(function (d) { return d; })
                .attr("x", 0)
                .attr("y", function (d, i) { return i * gridSize; })
                .style("text-anchor", "end")
                .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
                .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

          var timeLabels = svg.selectAll(".timeLabel")
              .data(times)
              .enter().append("text")
                .text(function(d) { return d; })
                .attr("x", function(d, i) { return i * gridSize; })
                .attr("y", 0)
                .style("text-anchor", "middle")
                .attr("transform", "translate(" + gridSize / 2 + ", -6)")
                .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

          var heatMap = svg.selectAll(".hour")
              .data(road)
              .enter().append("rect")
              .attr("x", function(d) { 
                  //console.log("d isss");
                  //console.log(d);
                  return (new Date(d[0]).getHours()) * gridSize; 
              })
              .attr("y", function(d) { 
                  //console.log(new Date(d[0]).getDay() );
                  return (new Date(d[0]).getDay()) * gridSize; 
              })
              .attr("rx", 4)
              .attr("ry", 4)
              .attr("class", "hour bordered")
              .attr("width", gridSize)
              .attr("height", gridSize)
              .style("fill", colors[0]);

          heatMap.transition().duration(1000)
              .style("fill", function(d) {
                  //console.log(d);
                  //console.log(colorScale(d[2]));
                  return colorScale(Math.round(d[2])); 
              });

          heatMap.append("title").text(function(d) { return d.value; });
              
          var legend = svg.selectAll(".legend")
              .data([0].concat(colorScale.quantiles()), function(d) { return d; })
              .enter().append("g")
              .attr("class", "legend");

          legend.append("rect")
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", height)
            .attr("width", legendElementWidth)
            .attr("height", gridSize / 2)
            .style("fill", function(d, i) { return colors[i]; });

          legend.append("text")
            .attr("class", "mono")
            .text(function(d) {
                //console.log(d);
                return "≥ " + Math.ceil(d); 
            })
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", height + gridSize);
      //});
            }
            }
        }
}])