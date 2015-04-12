'use strict';

/**
 * @ngdoc function
 * @name nodePushserverWebApp.controller:UsersCtrl
 * @description
 * # UsersCtrl
 * Controller of the nodePushserverWebApp
 */
angular.module('nodePushserverWebApp')
  .controller('UsersCtrl', function ($scope, $window, $http, $resource, toaster) {
    var refreshUsers = function () {
      $http.get('/usersComplete').success(function (users) {
        $scope.users = users;
      });
    };

    refreshUsers();

    $scope.addUser = function () {
      $http.post('/subscribe', $scope.add)
        .success(function () {
          toaster.pop('success', 'User "' + $scope.add.user + '" registered');
          $scope.add = {};
          refreshUsers();
        })
        .error(function () {
          toaster.pop('error', 'Error while adding the user');
        });
    };

    $scope.deleteUser = function () {
      var user = this.user;
      if ($window.confirm('Confirm "' + user.user + '" deletion?')) {
        $http.post('/unsubscribe', {'token': user.token})
          .success(function () {
            toaster.pop('success', 'User "' + user.user + '" deleted');
            refreshUsers();
          })
          .error(function () {
            toaster.pop('error', 'Error while deleting the user');
          });
      }
    };
  });
