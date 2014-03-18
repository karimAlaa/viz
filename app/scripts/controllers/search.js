'use strict';

angular.module('customVisulizationApp')
  .controller('SearchCtrl', function ($scope,elastic) {

  	elastic.ping({
	  requestTimeout: 1000,
	  hello: "elasticsearch!"
	}, 
	function (error) {
	  if (error) {
	    console.error('elasticsearch cluster is down!');
	  } else {
	    console.log('All is well');
	  }
	});

	elastic.count(function(error, response, status){
		$scope.response = response
	})

	elastic.search({
		// index: 'logstash-2013.06.25',
		body:{
			aggregations: {
        		by_hour: {
            		date_histogram: {
                		field:    "@timestamp",
                		interval: "hour"
            		},
            		aggregations: {
                		durations: {
                    		terms: { field: "statusID" }
               			}
            		}
       			}
    		}
		}
	},function(error, response, status){
		$scope.response = response.aggregations.by_hour.buckets
		var reducer = {}
		var category=[]
		var types=[]
		$scope.response.forEach(function(time){
			var hour = new Date(time.key).getHours()
			if(!reducer[hour]){
				reducer[hour]={}
				category.push(hour)
			}
			time.durations.buckets.forEach(function(duration){
				if(!reducer[hour][duration.key]){
					reducer[hour][duration.key] =0					
				}
				reducer[hour][duration.key]+=duration.doc_count
			})
		})
		
		var series=[]
		types = getKeys(reducer[0])
		for(var i in types){
			series[i]=[]
			category.forEach(function(cat){
				series[i].push(reducer[cat][types[i]])
			})
		}


		
		console.log(reducer)
		console.log(category.sort(function(a,b){return a - b}))
		console.log(types)
		console.log(series)
		createChart(category,types, series)
	})
//toString()
    var createChart=function(category, types,series){
        $scope.chartConfig = {
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
                // subtitle: {
                //         text: document.ontouchstart === undefined ? $translate('statistics.drag_to_zoom'):$translate('statistics.pinch_to_zoom')
                // },
             //    xAxis: {
	                
	            // },
                plotOptions: {
                    // area: {
                    //     fillColor: {
                    //         linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                    //         stops: [
                    //             [0, Highcharts.getOptions().colors[0]],
                    //             [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    //         ]
                    //     },
                    //     lineWidth: 1,
                    //     marker: {
                    //         enabled: false
                    //     },
                    //     shadow: false,
                    //     states: {
                    //         hover: {
                    //             lineWidth: 1
                    //         }
                    //     },
                    //     threshold: null
                    // },
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
            series: [
            {
                type: 'area',
                name: types[0],
                data:series[0]
            },{
                type: 'area',
                name: types[1],
                data:series[1]
            },{
                type: 'area',
                name: types[2],
                data:series[2]
            },{
                type: 'area',
                name: types[3],
                data:series[3]
            },{
                type: 'area',
                name: types[4],
                data:series[4]
            },{
                type: 'area',
                name: types[5],
                data:series[5]
            },{
                type: 'area',
                name: types[6],
                data:series[6]
            },{
                type: 'area',
                name: types[7],
                data:series[7]
            }
            //,{
            //     type: 'line',
            //     name: types[9],
            //     data:series[9]
            // },{
            //     type: 'line',
            //     name: types[10],
            //     data:series[10]
            // },{
            //     type: 'line',
            //     name: types[11],
            //     data:series[11]
            // },{
            //     type: 'line',
            //     name: types[12],
            //     data:series[12]
            // },{
            //     type: 'line',
            //     name: types[13],
            //     data:series[13]
            // },{
            //     type: 'line',
            //     name: types[14],
            //     data:series[14]
            // },{
            //     type: 'line',
            //     name: types[15],
            //     data:series[15]
            // },{
            //     type: 'line',
            //     name: types[16],
            //     data:series[16]
            // },{
            //     type: 'line',
            //     name: types[17],
            //     data:series[17]
            // },{
            //     type: 'line',
            //     name: types[18],
            //     data:series[18]
            // },{
            //     type: 'line',
            //     name: types[19],
            //     data:series[19]
            // },{
            //     type: 'line',
            //     name: types[20],
            //     data:series[20]
            // },{
            //     type: 'line',
            //     name: types[21],
            //     data:series[21]
            // },{
            //     type: 'line',
            //     name: types[22],
            //     data:series[22]
            // },{
            //     type: 'line',
            //     name: types[23],
            //     data:series[23]
            // },
            ],
            title: {
                text: null
            },
            xAxis: {
                // type: 'datetime',
                // title: {
                //     text: null
                // }
                categories: category,
                min:category[0],
                max:category[category.length-1]
            },
            yAxis: {
                min: 0,
                max:null,
                title: {
                    text: null
                }
            },
            loading: false,
        }
    }

  });

var getKeys = function( obj ) {
    return Object.keys ? Object.keys( obj ) : (function( obj ) {
      var item,
          list = [];

      for ( item in obj ) {
        if ( hasOwn.call( obj, item ) ) {
          list.push( item );
        }
      }
      return list;
    })( obj );
  }
