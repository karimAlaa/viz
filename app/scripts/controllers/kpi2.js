'use strict';

angular.module('customVisulizationApp')
  .controller('kpi2Ctrl', function ($scope,elastic,statistics,util) {

    var init=function(){
        $scope.interval = "day"
        $scope.filter
        testConnection()
        search()

        $scope.$watch('interval',function(){
            $scope.chartConfig =null
            search($scope.filter)
        })
         $scope.$watch('filter',function(){
            $scope.chartConfig =null
            search($scope.filter)
        })
    }


    $scope.changeInterval=function(value, filter){
        // $scope.interval = value
        $scope.chartConfig =null
        // $scope.chartConfig.series=[]
        search(filter)
    }

  	var testConnection=function(){
        elastic.ping({
          requestTimeout: 10000,
          hello: "elasticsearch!"
        }, 
        function (error) {
          if (error) {
            console.error('elasticsearch cluster is down!');
          } else {
            console.log('All is well');
          }
        });
    }

	
    var search=function(filter){
        var search_obj={
            body:{
                aggregations: {
                    histogram: {
                        date_histogram: {
                            field:    "@timestamp",
                            interval: $scope.interval || "day"
                        },
                        aggregations: {
                            results: {
                                terms: { field: "deviceType", size:100 }
                            }
                        }
                    }
                }
            }
        }

    if(filter)
        search_obj.body.query= {
            "filtered": {
               "query": {
                   "term": {
                        "action": {
                            "value": filter
                        }
                    }      
                }
            }
        }   
    elastic.search(search_obj,function(error, response, status){
        var total = response.hits.total
        $scope.response = response.aggregations.histogram.buckets
        var reducer = {}
        var category=[]
        var types=[]
        $scope.response.forEach(function(time){
            var date = new Date(time.key).toDateString().split(" ").slice(1).join(" ")
            if(!reducer[date]){
                reducer[date]={}
            }
            time.results.buckets.forEach(function(type){
                if(!reducer[date][type.key]){
                    reducer[date][type.key] =0 
                    if(types.indexOf(type.key) == -1)
                        types.push(type.key)

                }
                reducer[date][type.key]+=type.doc_count
            })
        })
        
        var series=[]

        category = util.getKeys(reducer).sort(function (a, b) {
            return new Date(a) - new Date(b);
        })



        for(var i in types){
            series[i]=[]
            category.forEach(function(cat){
               // var percent = (reducer[cat][types[i]]*100)/total
                series[i].push(reducer[cat][types[i]]||0)
            })
        }

        

        console.log(reducer)
        console.log(category)
        console.log(types)
        console.log(series)
        createChart(category,types, series)
    })
    }


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
                plotOptions: {                   
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
            title: {
                text: null
            },
            xAxis: {
                type: 'datetime',
                // categories:category
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
        $scope.chartConfig.series=[]
        for(var i in types){
            var date = new Date(category[0])
            var interval= 24 * 3600 * 1000
            if($scope.interval == 'week')
                interval *=7
            else if($scope.interval =='month')
                interval*= new Date(parseInt(date.getFullYear()), (parseInt(date.getMonth())+1), 0).getDate();
            // else if ($scope.interval == 'quarter'){
            //     interval =null
            //     $scope.chartConfig.xAxis.categories = category
            //     $scope.chartConfig.xAxis.type=null
            //     // var diff = (new Date((parseInt(date.getFullYear())+1),0,0)) - (new Date(parseInt(date.getFullYear()),0,0))
            //     // diff /=interval
            //     // interval*=Math.floor(diff/4)
            // }
            var obj ={
                type:'area',
                name:types[i],
                data:series[i],
                pointInterval: interval,
                pointStart: Date.UTC(parseInt(date.getFullYear()), parseInt(date.getMonth()), parseInt(date.getDate())),
            }
            if($scope.interval =="quarter"){
                obj.pointInterval = null
                obj.pointStart = null
                $scope.chartConfig.xAxis.categories = category
                $scope.chartConfig.xAxis.type=null
            }
            $scope.chartConfig.series.push(obj)
        }
    }

    init()
    
})
	
