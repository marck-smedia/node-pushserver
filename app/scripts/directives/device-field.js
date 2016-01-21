'use strict';

angular.module('nodePushserverWebApp').directive('deviceField', function() {
  return {
    restrict: 'E',
    templateUrl: 'scripts/directives/device-field.html',
    scope: {
      label: '@',
      device: '=',
      deviceName: '@device',
      model: '=',
      fieldName: '@model',
      type: '@'
    },
    controller: function() {
    },
    controllerAs: 'ctrl',
    bindToController: true
  };
});
