'use strict';

angular.module('customVisulizationApp')
  .controller('SearchCtrl', function ($scope,elastic, util) {

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

	// elastic.count(function(error, response, status){
	// 	$scope.response = response
	// })

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
                		report_types: {
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
			var hour = new Date(time.key).toTimeString().split(" ")[0].split(':').slice(0,2).join(':')
			if(!reducer[hour]){
				reducer[hour]={}
				category.push(hour)
			}
			time.report_types.buckets.forEach(function(type){
				if(!reducer[hour][type.key]){
					reducer[hour][type.key] =0					
				}
				reducer[hour][type.key]+=type.doc_count
			})
		})
		
		var series=[]//parseInt(a.split()[0]) - parseInt(b.split()[0])
		// console.log(reducer[getKeys(reducer)[0]])

		category = category.sort(function (a, b) {
			return new Date('1970/01/01 ' + a) - new Date('1970/01/01 ' + b);
		})

		types = util.getKeys(reducer[util.getKeys(reducer)[0]])
		for(var i in types){
			series[i]=[]
			category.forEach(function(cat){
				//if(reducer[cat][types[i]] ==null)
				series[i].push(reducer[cat][types[i]]||0)
			})
		}

		

		console.log(reducer)
		console.log(category)
		console.log(types)
		console.log(series)
		createChart(category,types, series)
	})

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
		            name: types[7],
		            data:series[7]
		        },
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
		        }//,{
		        //     type: 'area',
		        //     name: types[6],
		        //     data:series[6]
		        //}

		        // ,{
		        //     type: 'area',
		        //     name: types[8],
		        //     data:series[8]
		        // }
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
                // min:category[0],
                // max:category[category.length-1]
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

// var getKeys = function( obj ) {
//     return Object.keys ? Object.keys( obj ) : (function( obj ) {
//       var item,
//           list = [];

//       for ( item in obj ) {
//         if ( hasOwn.call( obj, item ) ) {
//           list.push( item );
//         }
//       }
//       return list;
//     })( obj );
//   }
