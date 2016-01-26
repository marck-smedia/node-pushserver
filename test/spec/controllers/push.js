'use strict';

describe('Controller: PushCtrl', function() {

  // load the controller's module
  beforeEach(module('nodePushserverWebApp'));

  var PushCtrl;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope) {
    PushCtrl = $controller('PushCtrl', {
      $scope: $rootScope.$new()
    });
  }));

  it('should init android and ios payloads', function() {
    expect(PushCtrl.android.fields.data.message).toBe('Your message');
    expect(PushCtrl.ios.fields.badge).toBe(0);
    expect(PushCtrl.ios.fields.alert).toBe('Your message');
    expect(PushCtrl.ios.fields.sound).toBe('default');
  });
});
