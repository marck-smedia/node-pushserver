'use strict';

/**
 * @ngdoc function
 * @name nodePushserverWebApp.controller:HeaderCtrl
 * @description
 * # HeaderCtrl
 * Controller of the nodePushserverWebApp
 */
angular.module('nodePushserverWebApp')
  .controller('HeaderCtrl', function ($scope, $location) {
    $scope.isActive = function (viewLocation) {
      return viewLocation === $location.path();
    };
  });
