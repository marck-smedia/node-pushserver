'use strict';

/**
 * @ngdoc function
 * @name nodePushserverWebApp.controller:PushCtrl
 * @description
 * # PushCtrl
 * Controller of the nodePushserverWebApp
 */
angular.module('nodePushserverWebApp')
  .controller('PushCtrl', function($scope, $window, $http, $resource, toaster) {
    var ctrl = this;

    ctrl.allUsers = $resource('/users').get();

    ctrl.android = {
      fields: {
        data: {
          title: 'Title',
          message: 'Your message'
        }
      }
    };
    ctrl.ios = {
      fields: {
        'badge': 0,
        'alert': 'Your message',
        'sound': 'default'
      }
    };
    ctrl.wp = {
      fields: {
        'bold': 'Title',
        'normal': 'Your message'
      }
    };

    /**
     * Recursively delete empty properties of an object
     * @param {Object} object - object
     */
    var deleteEmptyProperties = function(object) {
      for (var i in object) {
        if (object[i] === null || object[i] === '') {
          delete object[i];
        } else if (typeof object[i] === 'object') {
          deleteEmptyProperties(object[i]);
        }
      }
    };

    /**
     * Synchronize from inputs to textarea (payload)
     * @param {Object} device - DTO corresponding to the device
     * @return {Function} Function that handles fields update (it refreshes the payload by taking inputs modifications)
     */
    var fieldsUpdateHandler = function(device) {
      return function(newValues) {
        var payload = {};
        try {
          if (device.payload) {
            payload = JSON.parse(device.payload);
          }
        } catch (e) {
          toaster.pop('error', 'Payload JSON parse error', 'Some custom fields may have been lost...');
        }

        angular.merge(payload, newValues);
        deleteEmptyProperties(payload, true);

        device.payload = JSON.stringify(payload, null, 2);
      };
    };

    /**
     * Synchronize from textarea (payload) to inputs
     * @param device - DTO corresponding to the device
     * @return {Function} Function that handles payload update (it refreshes fields)
     */
    var payloadUpdateHandler = function(device) {
      return function(newPayload) {
        try {
          device.fields = JSON.parse(newPayload);
          device.jsonOK = true;
        } catch (e) {
          // The user hasn't finished to edit the payload (at least we expect!)
          device.jsonOK = false;
        }
      };
    };

    $scope.$watch('ctrl.android.fields', fieldsUpdateHandler(ctrl.android), true);
    $scope.$watch('ctrl.android.payload', payloadUpdateHandler(ctrl.android));

    $scope.$watch('ctrl.ios.fields', fieldsUpdateHandler(ctrl.ios), true);
    $scope.$watch('ctrl.ios.payload', payloadUpdateHandler(ctrl.ios));

    $scope.$watch('ctrl.wp.fields', fieldsUpdateHandler(ctrl.wp), true);
    $scope.$watch('ctrl.wp.payload', payloadUpdateHandler(ctrl.wp));

    ctrl.push = function() {
      if ($window.confirm('Confirm push?')) {
        var payload = {};
        if (ctrl.users && ctrl.users.length > 0 && ctrl.users.indexOf('') === -1) {
          payload.users = ctrl.users;
        }
        try {
          payload.android = JSON.parse(ctrl.android.payload);
          payload.ios = JSON.parse(ctrl.ios.payload);
          payload.wp = JSON.parse(ctrl.wp.payload);

          $http.post('/send', payload)
            .success(function() {
              var nbUsers = payload.users ? payload.users.length : 'all';
              toaster.pop('success', 'Notification sent to ' + nbUsers + ' users');
            })
            .error(function() {
              toaster.pop('error', 'Error while sending the notification');
            });
        } catch (e) {
          toaster.pop('error', 'Couldn\'t trigger the push because of JSON parse error');
        }
      }
    };
  });
