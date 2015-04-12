'use strict';

/**
 * @ngdoc overview
 * @name nodePushserverWebApp
 * @description
 * # nodePushserverWebApp
 *
 * Main module of the application.
 */
angular
  .module('nodePushserverWebApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/push.html',
        controller: 'PushCtrl'
      })
      .when('/users', {
        templateUrl: 'views/users.html',
        controller: 'UsersCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
