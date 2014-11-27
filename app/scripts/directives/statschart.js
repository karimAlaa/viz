'use strict';

angular.module('customVisulizationApp')
.directive('statschart',['$rootScope', '$q','influxdbmin', 'influxdbhour', 'influxdbday',function($rootScope, $q, influxdbmin, influxdbhour, influxdbday){
		return {
			restrict: 'E',
			//replace:true, 
            templateUrl:'/views/statschart.html',
//			scope:{
//				tracks:'=',
//			},
			link: function(scope, element){
                
                //scope.influx = {'min': influxdbmin, 'hour': influxdbhour}
                //console.log(scope.influx);
                scope.influx = {'min': influxdbmin, 'hour': influxdbhour, 'day': influxdbday, 'month':influxdbday}
                var id="all";
                var start_date='2013-06-13 22:00:00';
                var end_date='2014-05-10 22:00:00';
                
                var getInfluxDate = function(timestamp){
                    var d = new Date(timestamp);
                    
                    var curr_hour = ("0" + d.getHours()).slice(-2);
                    var curr_min = ("0" + d.getMinutes()).slice(-2);
                    var curr_sec = ("0" + d.getSeconds()).slice(-2);
                    
                    var curr_day = ("0" + d.getDate()).slice(-2);
                    var curr_month = ("0" + (d.getMonth() + 1)).slice(-2); //Months are zero based
                    var curr_year = d.getFullYear();
                    var date=curr_year + "-" + curr_month + "-" + curr_day+" "+curr_hour+":"+curr_min+":"+curr_sec
                    //document.write();
                    console.log(date);
                    return date;
                }
                
                function getData(id, start_date, end_date, group_by_time) {
                    var deferred = $q.defer();
                    console.log("start is ");
                    console.log(start_date);
                    
                    console.log("end date is ");
                    console.log(end_date);
                    if(group_by_time=="month")
                        var query="select sum(\"7\") from road_"+id+" where time > '"+start_date+"' and time < '"+end_date+"' group by time(1M)";
                    else
                        var query="select \"7\" from road_"+id+" where time > '"+start_date+"' and time < '"+end_date+"' ";       
                    //group_by_time use to pick table later
                    scope.influx[group_by_time].query(query+" order asc").then(function(results){
                        deferred.resolve(results)
                    })
                    
                    return deferred.promise
                }
                
                
                var afterSetExtremes = function(e){
                    console.log(e);
                    var chart = angular.element(document.getElementById("chart2")).highcharts();
                    console.log(chart);
                    chart.showLoading('Loading data from server...');
                    getInfluxDate(e.min);
                    getInfluxDate(e.max);
                    var gran="month"
                    if(e.min && e.max)
                    {
                        
                        var a= new Date(e.min);
                        var b= new Date(e.max);
                        var timeDiff = Math.abs(b.getTime() - a.getTime());
                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
                        
                        if (diffDays < 15){
                            gran="hour"
                        }
                        else if(diffDays < 60){
                            gran= "day"
                        }//days
                        else{
                            gran="month"
                        }
                        getData(id, getInfluxDate(e.min), getInfluxDate(e.max), gran).then(function(data){
                            if(gran!="month")
                            {
                                data[0].points.forEach(function(a){
                                    a.splice(1,1);
                                });
                            }
                            
                            chart.series[0].setData(data[0].points);
                            chart.hideLoading();
                        });
                    }
                }
                
                
                getData(id,start_date, end_date, "month").then(function(data){
                    
                      console.log(data[0].points);
                      scope.results=data[0].points;

//                      scope.results.forEach(function(a){
//                            a.splice(1,1);
//                      }); //removing sequence number
//                    
                     //console.log("in chart");
                     //console.log(scope.results[7]);
                        console.log("minnnn");
                    console.log(scope.results[0][0]);
                      scope.chartConfig = {
                              options: {
                                chart: {
                                    type: 'line',
                                    zoomType: 'x',    
                                },
                                  rangeSelector: {
                                    buttons: [{
                                        type: 'day',
                                        count: 7,
                                        text: '1w'
                                        }
                                        , {
                                        type: 'month',
                                        count: 1,
                                        text: '1m'
                                    }, {
                                        type: 'month',
                                        count: 6,
                                        text: '6m'
                                    }, {
                                        type: 'year',
                                        count: 1,
                                        text: '1y'
                                    }, {
                                        type: 'all',
                                        text: 'All'
                                    }
                                ],
                                selected: 4,
                                inputEnabled: false,
                                enabled: true
                                },
//                                navigator: {
//                                    enabled : true,
//                                    adaptToUpdatedData : false,
//                                },
                                navigator : {
                                    baseSeries: 1,
                                    enabled : true,
                                    adaptToUpdatedData: false,
//                                    series : {
//                                        data : scope.results
//                                    }
                                },

                                scrollbar: {
                                    liveRedraw: false
                                },
                                        
                                xAxis : { 
                                minRange: 3600000,
                                currentMin: scope.results[0][0],
                                min: scope.results[0][0],
                                events : {
                                    afterSetExtremes : afterSetExtremes
                                },
                            },
                            },
                            useHighStocks: true,
                            series: [{
                                name: "Danger",
                                data: scope.results
                            }],
                            
                          size: {
                           width: 600,
                           height: 400
                         },
                            legend: {enabled:true},
                            title: {
                                text: 'Danger!'
                            },
                            loading: false
                          
                      }
                      
                      
                      // on zoom get per hour instead of day.
                      
                      
                    })
                
            }
        }
             

}])
