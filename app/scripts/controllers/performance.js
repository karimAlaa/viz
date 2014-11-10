'use strict';

angular.module('customVisulizationApp')
  .controller('PerformanceCtrl', function ($scope, elastic, $interval) {
 	
 	var init=function(){
        testConnection()
        // loadTest(3, 1000)

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


    var loadTest=function(count, interval){
      var number_of_complete =0 
      $scope.query_time = []
    	var actions=['addproute', 'addroute', 'adduser' ,'changenid', 'checkcookie' , 'checkupdate', 'deljavaapp', 'delrt', 'forgotpassword', 'gencookie', 'getallroads', 'getappad', 'getareas', 'getareasinit', 'getcities', 'getcomments', 'getfburl', 'getmsgs', 'getmyprofile', 'getnotificationsdetails', 'getnotificationsids', 'getphotoservice', 'getphotourl', 'getroad', 'getroadcategories', 'getroads', 'getroadsstatus', 'getstatuses', 'gettip', 'gettraffic', 'getuser', 'getuserdetails', 'getuserprofile', 'getuserroads', 'getuserroadsedit', 'getuserroutes', 'getusersiblocked', 'getvendor', 'hasnickname', 'instjavaap', 'instjavaapp', 'integratethirdparty', 'login', 'logout', 'pad', 'pushserveraction', 'reportabuse', 'reportroad', 'reqcom', 'resret', 'sendverificationemail', 'sharecomment', 'sso', 'updateuser', 'uroute', 'uusernames', 'verifyemail']

        $interval(function(){
          if(number_of_complete == 0){
          	for(var i=0; i<count; i++){
  		       var search_obj={
  		            body:{
  		                aggregations: {
  		                    results: {
  		                        terms: { field: "devicetype" }
  		                    }
  		                }
  		            }
  		        }

            var action = actions[Math.floor(Math.random() * (actions.length + 1))]
  			    if(action)
  			        search_obj.body.query= {
  			            "filtered": {
  			               "query": {
  			                   "term": {
  			                        "action": {
  			                            "value": action
  			                        }
  			                    }      
  			                }
  			            }
  			        } 

          		elastic.search(search_obj,function(error, response, status){
                $scope.query_time.push(response.took)
                number_of_complete +=1
                if(number_of_complete == count)
                  number_of_complete=0

              })
          	}
          }
        }, interval)  
    }


    init()
});
