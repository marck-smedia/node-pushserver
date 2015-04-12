'use strict';

/**
 * @ngdoc function
 * @name nodePushserverWebApp.controller:PushCtrl
 * @description
 * # PushCtrl
 * Controller of the nodePushserverWebApp
 */
angular.module('nodePushserverWebApp')
  .controller('PushCtrl', function ($scope, $http, $resource) {
    $scope.allUsers = $resource('/users').get();

    $scope.android = {
      'message': 'Your message'
    };
    $scope.ios = {
      'badge': 0,
      'alert': 'Your message',
      'sound': 'default'
    };

    // Synchronize from inputs to textarea (payload) for Android
    $scope.$watchGroup(['android.message', 'android.collapseKey'], function (newValues) {
      var message = newValues[0];
      var collapseKey = newValues[1];

      var payload = {};
      try {
        if ($scope.android.payload) {
          payload = JSON.parse($scope.android.payload);
        }
      } catch (e) {
        console.error('Couldn\'t update payload because of JSON parse error: ' + e);
      }

      if (!payload.data) {
        payload.data = {};
      }
      payload.data.message = message;

      if (collapseKey) {
        payload.collapseKey = collapseKey;
      } else {
        delete payload.collapseKey;
      }

      $scope.android.payload = JSON.stringify(payload, null, 2);
    });

    // Synchronize from textarea (payload) to inputs for Android
    $scope.$watch('android.payload', function (newAndroidPayload) {
      try {
        var payload = JSON.parse(newAndroidPayload);
        $scope.android.message = payload.data.message;
        $scope.android.collapseKey = payload.collapseKey;
        $scope.android.jsonOK = true;
      } catch (e) {
        // The user hasn't finished to edit the payload (at least we expect!)
        $scope.android.jsonOK = false;
      }
    });

    // Synchronize from inputs to textarea (payload) for iOS
    $scope.$watchGroup(['ios.badge', 'ios.alert', 'ios.sound'], function (newValues) {
      var badge = parseInt(newValues[0]);
      var alert = newValues[1];
      var sound = newValues[2];

      var payload = {};
      try {
        if ($scope.ios.payload) {
          payload = JSON.parse($scope.ios.payload);
        }
      } catch (e) {
        console.error('Couldn\'t update payload because of JSON parse error: ' + e);
      }

      payload.badge = badge;
      payload.alert = alert;
      payload.sound = sound;

      $scope.ios.payload = JSON.stringify(payload, null, 2);
    });

    // Synchronize from textarea (payload) to inputs for iOS
    $scope.$watch('ios.payload', function (newIosPayload) {
      try {
        var payload = JSON.parse(newIosPayload);
        $scope.ios.badge = payload.badge;
        $scope.ios.alert = payload.alert;
        $scope.ios.sound = payload.sound;
        $scope.ios.jsonOK = true;
      } catch (e) {
        // The user hasn't finished to edit the payload (at least we expect!)
        $scope.ios.jsonOK = false;
      }
    });

    $scope.push = function () {
      var payload = {};
      if ($scope.users) {
        payload.users = $scope.users;
      }
      try {
        payload.android = JSON.parse($scope.android.payload);
        payload.ios = JSON.parse($scope.ios.payload);

        $http.post('/send', payload);
      } catch (e) {
        console.error('Couldn\'t trigger the push because of JSON parse error: ' + e);
      }
    };
  });
