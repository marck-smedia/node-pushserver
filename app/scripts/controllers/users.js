'use strict';

/**
 * @ngdoc function
 * @name nodePushserverWebApp.controller:UsersCtrl
 * @description
 * # UsersCtrl
 * Controller of the nodePushserverWebApp
 */
angular.module('nodePushserverWebApp')
  .controller('UsersCtrl', function ($scope, $http, $resource) {
    var refreshUsers = function () {
      $scope.users = $resource('/usersComplete').get();
    };

    refreshUsers();

    $scope.addUser = function () {
      $http.post('/subscribe', $scope.add)
        .success(function () {
          $scope.add = {};
          refreshUsers();
        });
    };

    $scope.deleteUser = function () {
      $http.post('/unsubscribe', {
        'token': this.user.token
      }).success(function () {
        refreshUsers();
      });
    };
  });
