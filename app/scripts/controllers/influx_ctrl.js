'use strict';

angular.module('customVisulizationApp')
  .controller('influxCtrl', function ($scope, statistics, util, influxdb) {
  		
  	$scope.open = function(open,$event) {
	    $event.preventDefault();
	    $event.stopPropagation();
	    open = true;
  	}

	$scope.dateOptions = {
		formatYear: 'yy',
		startingDay: 1
	}

 //  	$scope.opts={
	//   	host: 'localhost',
	//     port: 8086,
	//     username:'root',
	//     password:'root',
	//     database:'bey2ollak_2'
	// }
 //  var influxdb = new InfluxDB($scope.opts);

  	$scope.queries = []
  	$scope.addQuery = function(){
  		$scope.queries.push({string:'', data:[], normalized:false})
  	}
  	$scope.removeQuery = function(index){
  		$scope.queries.splice(index, 1)
  		// $scope.queries.push({string:'', data:[]})
  		// $scope.chartConfig.series.push({
    //         type: 'area',
    //         name: 'status',
    //         data:$scope.queries[$scope.queries.length-1].data
    //     })  
  	}

  	var render=function(){
  		$scope.chartConfig.series=[]
  		$scope.queries.forEach(function(query){
  			$scope.chartConfig.series.push({
	            type: 'line',
	            name: 'status',
	            data:query.data
	        })
  		})
  	}

  	var renderScatter=function(data){
  		$scope.scatterConfig.series=[]
  		$scope.scatterConfig.series.push({
            name: 'status',
            data:data
        })
  	}

  	$scope.influxQuery = function(query_obj){
  		influxdb.query(query_obj.string+" order asc").then(function(results){
  			var data = []
	  		results[0].points.forEach(function(point){
	  			var x = []
	  			for(var i in point){
	  				if(i=="time")
	  					x.push(point[i].getTime())
	  				else if(i != "sequence_number")
	  					x.push(point[i])
	  			}
	  			data.push(x)
	  		})
	  		query_obj.data = data
	  		render()
	  		query_obj.normalized=false
	  		$scope.$apply()
	  		console.log($scope.queries )
	  		console.log($scope.chartConfig )
	  	})
  	}

  	$scope.normalize = function(){
  		$scope.queries.forEach(function(query){
  			if(!query.normalized){
	  			var max = getMax(query.data)
	  			var min = getMin(query.data)
	  			console.log(min)
	  			console.log(max)
	  			for(var i in query.data)
	  				query.data[i][1] = ((query.data[i][1] - min)/ (max - min))*100
	  			query.normalized = true
	  		}
  		})
  		render()
  	}

  	var contains= function(data, value){
  		for(var i in data){
  			if(data[i][0] == value)
  				return true
  		}
  		return false
  	}

  	$scope.getDifference = function(){
  		$scope.addQuery()
  		var first_query = $scope.queries[0].data
  		var second_query  = $scope.queries[1].data
  		var new_first_query = []
  		first_query.forEach(function(point){
  			if(contains(second_query, point[0]))
  				new_first_query.push(point)
  		})
  		for(var i in new_first_query){
  			$scope.queries[$scope.queries.length-1].data[i] = [new_first_query[i][0], new_first_query[i][1]- second_query[i][1]]
  		}
  		render()
  		
  	}

  	var getMax=function(points){
  		var max = points[0][1]
  		points.forEach(function(point){
  			if(point[1] > max)
  				max = point[1]
  		})
  		return max
  	}

  	var getMin=function(points){
  		var min = points[0][1]
  		points.forEach(function(point){
  			if(point[1] < min)
  				min = point[1]
  		})
  		return min
  	}

  	$scope.generateScatter=function(){
  		var first_query = $scope.queries[0].data
  		var second_query  = $scope.queries[1].data
  		var new_first_query = []
  		first_query.forEach(function(point){
  			if(contains(second_query, point[0]))
  				new_first_query.push(point)
  		})
  		var data = []
  		for(var i in new_first_query){
  			data[i] = [new_first_query[i][1], second_query[i][1]]
  		}
  		renderScatter(data)
  	}

    var createChart=function(){
        return{
            options: {
                chart: {
                    zoomType: 'x',
                    spacingRight: 20
                },
                tooltip: {
                    shared: true
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    area: {
                        fillColor: {
                            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                            stops: [
                                [0, Highcharts.getOptions().colors[0]],
                                [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                            ]
                        },
                        lineWidth: 1,
                        marker: {
                            enabled: false
                        },
                        shadow: false,
                        states: {
                            hover: {
                                lineWidth: 1
                            }
                        },
                        threshold: null
                    },
                    line:{
                        fillColor: {
                            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                            stops: [
                                [0, Highcharts.getOptions().colors[0]],
                                [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                            ]
                        },
                        lineWidth: 1,
                        states: {
                            hover: {
                                lineWidth: 1
                            }
                        },
                        marker:{
                            enabled:false
                        },
                         threshold: null
                    }
                }
            },
            series: [],
            title: {
                text: null
            },
            xAxis: {
                type: 'datetime',
	            title: {
	                text: 'Date'
	            }
            },
            // yAxis: {
            //     min: 0,
            //     max:null,
            //     title: {
            //         text: null
            //     }
            // },
            loading: false,
        }
    }

    var createScatter=function(){
    	return {
    		options:{
    			chart: {
		            type: 'scatter',
		            zoomType: 'xy'
		        },
		        // title: {
		        //     text: 'Height Versus Weight of 507 Individuals by Gender'
		        // },
		        // subtitle: {
		        //     text: 'Source: Heinz  2003'
		        // },
		        xAxis: {
		            // title: {
		            //     enabled: true,
		            //     text: 'Height (cm)'
		            // },
		            startOnTick: true,
		            endOnTick: true,
		            showLastLabel: true
		        },
		        // yAxis: {
		        //     title: {
		        //         text: 'Weight (kg)'
		        //     }
		        // },
		        // legend: {
		        //     layout: 'vertical',
		        //     align: 'left',
		        //     verticalAlign: 'top',
		        //     x: 100,
		        //     y: 70,
		        //     floating: true,
		        //     backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
		        //     borderWidth: 1
		        // },
		        plotOptions: {
		            scatter: {
		                marker: {
		                    radius: 5,
		                    states: {
		                        hover: {
		                            enabled: true,
		                            lineColor: 'rgb(100,100,100)'
		                        }
		                    }
		                },
		                states: {
		                    hover: {
		                        marker: {
		                            enabled: false
		                        }
		                    }
		                },
		                tooltip: {
		                    headerFormat: '<b>{series.name}</b><br>',
		                    pointFormat: '{point.x}, {point.y}'
		                }
		            }
		        },
		        series: []
    		}
    	}
    }

    $scope.chartConfig = createChart()
    $scope.scatterConfig = createScatter()
    $scope.addQuery()
  	
  })