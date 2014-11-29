'use strict';

angular.module('customVisulizationApp')
.directive('statschart',['$rootScope', '$q','influxdbmin', 'influxdbhour', 'influxdbday',function($rootScope, $q, influxdbmin, influxdbhour, influxdbday){
		return {
			restrict: 'E',
			//replace:true, 
            templateUrl:'/views/statschart.html',
			scope:{
				dataType:'=type',
                id:'=',
                name:'=',
                label:'@',
                probability: '=',
                roadid:'='
			},
			link: function(scope, element){
                
                scope.$watch('roadid', function(newval){
                    console.log("IN WATCH");
                    if(scope.roadid)  
                    {
                        //$('#chart'+scope.id).html("");
                        console.log("getting chart");
                        scope.chartConfig={};
                        $rootScope.safeApply();
                        //angular.element(document.getElementById("chart"+scope.id)).highcharts().destroy();
                        scope.getchart();
                    }
                  }
                 );
                
                console.log(scope.probability);
                console.log("datatype issss");
                console.log(scope.dataType);
                //scope.influx = {'min': influxdbmin, 'hour': influxdbhour}
                //console.log(scope.influx);
                scope.influx = {'min': influxdbmin, 'hour': influxdbhour, 'day': influxdbday, 'month':influxdbday}
                
                //var id="216";
                
                // all the data
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
                    
                    var select=[];
                    var select2=[]
                    for(var i=0; i< scope.dataType.length; i++)
                    {
                        console.log("over here");
                        console.log(scope.dataType[i]);
                        if(scope.probability)
                        {
                            select.push("sum(\""+scope.dataType[i]+"\"*total_reports)")
                            select2.push("\""+scope.dataType[i]+"\"*total_reports")
                        }else{
                            select.push("sum(\""+scope.dataType[i]+"\")")
                            select2.push("\""+scope.dataType[i]+"\"")
                        }
                    };
                    select= select.join(",")
                    console.log("end date is ");
                    console.log(end_date);
                    if(group_by_time=="month")
                        var query="select "+select+" from road_"+id+" where time > '"+start_date+"' and time < '"+end_date+"' group by time(1M)";
                    else
                        var query="select "+select2+" from road_"+id+" where time > '"+start_date+"' and time < '"+end_date+"' ";       
                    //group_by_time use to pick table later
                    scope.influx[group_by_time].query(query+" order asc").then(function(results){
                        deferred.resolve(results)
                    })
                    
                    return deferred.promise
                }
                
                
                var afterSetExtremes = function(e){
                    console.log(e);
                    var chart = angular.element(document.getElementById("chart"+scope.id)).highcharts();
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
                        getData(scope.roadid, getInfluxDate(e.min), getInfluxDate(e.max), gran).then(function(data){
                            if(gran!="month")
                            {
                                data[0].points.forEach(function(a){
                                    a.splice(1,1);
                                });
                            }
                            
                            // if data[0].points[0].length>2 // keep making multiple series
                            
                            
                            var series=[]
                            if(data[0].points[0].length>2)
                            {
                                 data[0].points.forEach(function(a){
                                    for(var i=1; i<data[0].points[0].length; i++)
                                    {

                                        if(series[i-1] != undefined)
                                        {
                                            series[i-1]['data'].push([a[0],a[i]])
                                            console.log("here in defined");
                                            console.log(series[i-1]);
                                        }
                                        else
                                        {
                                            console.log("here in undefined");
                                            series[i-1]={data:([[a[0],a[i]]]), name: scope.name[i-1]}
                                            console.log(series[i-1]);
                                        }
                                    }
                                 }); 
                            }
                        else
                            series=[{data:data[0].points, name:scope.name[0]}]
                            
                            
                            for(var g=0; g<series.length; g++){
                                chart.series[g].setData(series[g].data);    
                            };
                            
                            
                            
                            chart.hideLoading();
                        });
                    }
                }
                
                
                scope.getchart = function()
                {
                    
                getData(scope.roadid,start_date, end_date, "month").then(function(data){
                    
                    console.log("pointsssss");
                      console.log(data[0].points);
                      scope.results=data[0].points;

                    
                         // if data[0].points[0].length>2 // keep making multiple series
                        var series=[]
                        if(scope.results[0].length>2)
                        {
                             scope.results.forEach(function(a){
                                for(var i=1; i<scope.results[0].length; i++)
                                {
                                    
                                    if(series[i-1] != undefined)
                                    {
                                        series[i-1]['data'].push([a[0],a[i]])
                                        console.log("here in defined");
                                        console.log(series[i-1]);
                                    }
                                    else
                                    {
                                        console.log("here in undefined");
                                        series[i-1]={data:([[a[0],a[i]]]), name:scope.name[i-1]}
                                        console.log(series[i-1]);
                                    }
                                }
                             }); 
                        }
                    else
                        series=[{data:scope.results, name:scope.name[0]}]
//                      scope.results.forEach(function(a){
//                            a.splice(1,1);
//                      }); //removing sequence number
//                    
                     //console.log("in chart");
                     //console.log(scope.results[7]);
                        console.log("minnnn");
                        console.log(series[0]['data']);
                        scope.chartConfig=null;
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
                            series: series,
                            
                          size: {
                           width: 600,
                           height: 400
                         },
                            legend: {enabled:true},
                            title: {
                                text: scope.label
                            },
                            loading: false
                          
                      }
                      
                     
                      
                      // on zoom get per hour instead of day.
                      
                      
                    })
                }
                
            }
        }
             

}])
