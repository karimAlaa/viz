'use strict';


  angular.module('customVisulizationApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'elasticsearch',
  'highcharts-ng',
])
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
  })




