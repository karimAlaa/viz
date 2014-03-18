'use strict';

angular.module('customVisulizationApp')
.service('elastic', function (esFactory) {
  return esFactory({
    host: 'localhost:9200',
    log: 'trace',
    apiVersion: '1.0'
  });
});

