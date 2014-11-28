'use strict';


  angular.module('customVisulizationApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'highcharts-ng',
  // 'ui.bootstrap',
]).run(['$http', '$rootScope',
        function($http, $rootScope) {
            $rootScope.safeApply = function(fn) {
                var phase = this.$root.$$phase;
                if(phase == '$apply' || phase == '$digest') {
                    if(fn && (typeof(fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };
      }])
  .config(function ($stateProvider, $urlRouterProvider) {
    //delete $httpProvider.defaults.headers.common['X-Requested-With'];
    
    
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('index', {
        url: '/',
        templateUrl: 'views/main.html',
        controller:'MainCtrl'
      })
      .state('search', {
        url:'/search',
        templateUrl: 'views/search.html',
        controller: 'SearchCtrl'
      })
      .state('kpi', {
        url:'/kpi',
        templateUrl: 'views/kpi.html',
        controller: 'kpiCtrl'
      })
      .state('kpi2', {
        url:'/kpi2',
        templateUrl: 'views/kpi2.html',
        controller: 'kpi2Ctrl'
      })
      .state('performance', {
        url:'/performance',
        templateUrl: 'views/performance.html',
        controller: 'PerformanceCtrl'
      })
      .state('influx', {
        url:'/influx',
        templateUrl: 'views/influx.html',
        controller: 'influxCtrl'
      })
      .state('map', {
        url:'/map',
        templateUrl: 'views/map.html',
        controller: 'mapCtrl'
      })
      .state('graph', {
        url:'/graph',
        templateUrl: 'views/graph.html',
        controller: 'graphCtrl'
      }).state('cache', {
        url:'/cache',
        templateUrl: 'views/cache.html',
        controller: 'cacheCtrl'
      })
      .state('cooccurrence', {
        url:'/cooccurrence',
        templateUrl: 'views/cooccurrence.html',
        controller: 'cooccurrenceCtrl'
      })
  })




