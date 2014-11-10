'use strict';

angular.module('customVisulizationApp')
.service('elastic', function (esFactory) {
  return esFactory({
    host: 'localhost:9200',
    // host: '5.79.24.178:9200',
    log: 'trace',
    apiVersion: '1.0'
  });
}).service('influxdb', function () {
  var opts={
	  	host: 'localhost',
	    port: 8086,
	    username:'root',
	    password:'root',
	    database:'bey2ollak_2'
	}
  return new InfluxDB(opts);

});

