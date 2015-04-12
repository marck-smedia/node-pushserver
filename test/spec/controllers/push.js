'use strict';

describe('Controller: PushCtrl', function () {

  // load the controller's module
  beforeEach(module('nodePushserverWebApp'));

  var PushCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PushCtrl = $controller('PushCtrl', {
      $scope: scope
    });
  }));

  it('should init android and ios payloads', function () {
    expect(scope.android.message).toBe('Your message');
    expect(scope.ios.badge).toBe(0);
    expect(scope.ios.alert).toBe('Your message');
    expect(scope.ios.sound).toBe('default');
  });
});
