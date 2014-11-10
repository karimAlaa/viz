'use strict';

describe('Controller: PerformanceCtrl', function () {

  // load the controller's module
  beforeEach(module('customVisulizationApp'));

  var PerformanceCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PerformanceCtrl = $controller('PerformanceCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
