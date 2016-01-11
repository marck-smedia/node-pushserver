'use strict';

/**
 * @ngdoc function
 * @name nodePushserverWebApp.controller:LogsCtrl
 * @description
 * # LogsCtrl
 * Controller of the nodePushserverWebApp
 */
angular.module('nodePushserverWebApp')
  .controller('LogsCtrl', function($scope, $resource) {
    $scope.logs = $resource('/logs').get();
  });
