'use strict';

angular.module('customVisulizationApp')
	.controller('cacheCtrl', function ($scope, statistics, util, influxdbday, $q, $interval) {

	var roads = []

	var dataArray = []

	var insertedCount = 0;

	var trafficData = {}
	trafficData.indexedDB = {}

	window.addEventListener("DOMContentLoaded", init, false);

	trafficData.indexedDB.db = null;

	trafficData.indexedDB.open = function() {
		var version = 4;
		var request = indexedDB.open("traffic", version);
		

		request.onupgradeneeded = function(e) {
			var db = e.target.result;

			e.target.transaction.onerror = trafficData.indexedDB.onerror;

			if(db.objectStoreNames.contains("day_data")) {
				db.deleteObjectStore("day_data");
			}

			var store = db.createObjectStore("day_data", {keyPath: "road_id"});
		}

		request.onsuccess = function(e) {
			trafficData.indexedDB.db = e.target.result;

			trafficData.indexedDB.addData(dataArray);
		}

		request.onerror = trafficData.indexedDB.onerror;
	}

	trafficData.indexedDB.addData = function(dataArray) {

		var db = trafficData.indexedDB.db;
		var transaction = db.transaction(["day_data"], "readwrite");
		var store = transaction.objectStore("day_data");

		dataArray.forEach(function(item) {

			insertedCount++;
			
			store.put({
				"record": item, "road_id": item.name
			})

		});

		transaction.oncomplete = function(e) {
			console.log("Completed adding all records")
		}

		transaction.onerror = function(e) {
			console.log(e)
		}
	}


	function getData(id, group_by_time){
		 
		var deferred = $q.defer();
		influxQuery("select * from road_"+id).then(function(data){
				//deferred.resolve(merge(data,angular.copy(date_template)))
				deferred.resolve(data)
			})
		return deferred.promise
	}

	function initAllData() {
		var deferred = $q.defer();

		roads.forEach(function(road){
			getData(road.road_id, null).then(function(data){
				dataArray.push(data)
			});
		});

		getData("all", null).then(function(data){

			dataArray.push(data)
			console.log(dataArray.length)
		});

		deferred.resolve(dataArray)
		return deferred.promise
	}

	function retrieveDayData(allData, callback) {
		var db = trafficData.indexedDB.db;
		var trans = db.transaction(["day_data"], "readwrite");
		var store = trans.objectStore("day_data");

		var output =[]

		if(allData) {
			var keyRange = IDBKeyRange.lowerBound(0);
			var cursorRequest = store.openCursor(keyRange);

			cursorRequest.onsuccess = function(e) {
				var result = e.target.result;
				if(!!result == false)
					return;

				output.push(result.value.record);
				result.continue();
			};
			cursorRequest.onerror = trafficData.indexedDB.onerror;
		} else {
			var request = store.get("road_all");
			request.onerror = trafficData.indexedDB.onerror;

			request.onsuccess = function(event) {
			  output.push(request.result.record)
			};
		}		

		trans.oncomplete = function(e) {
			callback(output)
		}
		
	}

	function influxQuery(query){
		var deferred = $q.defer();
		influxdbday.query(query+" order asc").then(function(results){
			deferred.resolve(results[0])
		})
		return deferred.promise
	}

	
	function printDate(val){
		date.text(new Date(val))
	}



	function merge(arr1, obj){
		arr1.forEach(function(a){
			obj[a[0]][1] = a[2]
		})

		var merged_arr = $.map(obj, function(value, index) {
			return [value];
		})
		return merged_arr.sort(function (a, b) {
			return a[0] - b[0];
		})
	}

	function setDateTemplate(start, end, diff){
		var obj = {}
		var d = new Date(start)
		var end_date = new Date(end)
		while(d<= end_date){
			var ms = d.getTime()
			obj[ms]=[ms, -1]
			d.setMinutes(d.getMinutes()+diff)
		}
		return obj
	}  

	angular.element(document).ready(function () {
		init()
	});

	function init() {
		var graph = 'data.json'
		var request = new XMLHttpRequest()
		request.open("GET", graph, false)
		request.send(null)
		roads = JSON.parse(request.responseText).links
		
		initAllData();
		
		var interval = setInterval(
		 function(){
			if (roads.length == (dataArray.length + 1)) {
				trafficData.indexedDB.open()
			}

			if(insertedCount == dataArray.length) {
				retrieveDayData(false, function(data) {
					console.log(data);
				})
				clearInterval(interval)
			}
		}, 1000)
	}

})