'use strict';

angular.module('customVisulizationApp')
  .controller('kpiCtrl', function ($scope,elastic,statistics,util) {

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

	

	elastic.search({
        size:2500,
        body:{
            fields: ["@timestamp", "action"],
            sort: [
                {
                    "@timestamp": {
                        order: "asc"
                    }
                }
            ],  
            filter: {
                query: {
                    term: {
                        "action":{
                            value: "reportRoad"
                        }
                    }
                }
            }
        }
    },function(error, response, status){
        var total = response.hits.total
        var hits = response.hits.hits
        var diff = 0
        var diff_obj={}
        var diff_array=[]
        for(var i=0; i<hits.length; i++)
            if(i+1 < hits.length){
                var d1 = new Date(hits[i].fields['@timestamp'][0])
                var d2 = new Date(hits[i+1].fields['@timestamp'][0])    
                diff = d2 - d1
                if(diff <=60000){
                    diff_array.push(diff)
                    if(!diff_obj[parseInt(diff/1000)])
                        diff_obj[parseInt(diff/1000)]=0
                    diff_obj[parseInt(diff/1000)]+=1
                }
            }

            $scope.average =statistics.getAverageFromNumArr(diff_array,2)
            $scope.std = statistics.getStandardDeviation(diff_array,2)

            var series=[]
            var category = util.getKeys(diff_obj)
            category.forEach(function(cat){
                series.push(diff_obj[cat])
            })
       console.log(series)
       console.log(category)
       createChart(category, series)
    })

    
     var createChart=function(category, series){
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
            },
            series: [
                {
                    type: 'column',
                    name: 'Difference Count',
                    data:series
                }
            ],
            title: {
                text: "Average ="+$scope.average+"ms / "+($scope.average/1000)+"s | STD = "+$scope.std+"ms / "+($scope.std/1000)+"s"
            },
            xAxis: {
                categories: category,
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
    
})
	
