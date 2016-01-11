'use strict';

var _ = require('lodash');
var Q = require('q');
var pushAssociations = require('./PushAssociations');
var apnPusher = require('./APNPusher');
var gcmPusher = require('./GCMPusher');
var mpnPusher = require('./MPNPusher');
var config = require('./Config');
var logger = config.log4js.getLogger('PushController');

var send = function(pushAssociations, androidPayload, iosPayload, wpPayload) {
  var androidTokens = _(pushAssociations).where({type: 'android'}).map('token').value();
  var iosTokens = _(pushAssociations).where({type: 'ios'}).map('token').value();
  var wpURIs = _(pushAssociations).where({type: 'wp'}).map('token').value();

  if (androidPayload && androidTokens.length > 0) {
    var gcmPayload = gcmPusher.buildPayload(androidPayload);
    gcmPusher.push(androidTokens, gcmPayload);
  }

  if (iosPayload && iosTokens.length > 0) {
    var apnPayload = apnPusher.buildPayload(iosPayload);
    apnPusher.push(iosTokens, apnPayload);
  }

  if (wpPayload && wpURIs.length > 0) {
    var mpnPayload = mpnPusher.buildPayload(wpPayload);
    mpnPusher.push(wpURIs, mpnPayload);
  }
};

var sendUsers = function(users, payload) {
  pushAssociations.getForUsers(users).then(function(pushAss) {
    send(pushAss, payload);
  });
};

var subscribe = function(deviceInfo) {
  return pushAssociations
    .add(deviceInfo.user, deviceInfo.type, deviceInfo.token)
    .then(function() {
      logger.debug('User subscribed: ', deviceInfo);
    }, function(error) {
      logger.error('Couldn\'t add user: ', deviceInfo, error);
      return Q.reject(error);
    }
  );
};

var unsubscribeDevice = function(deviceToken) {
  return pushAssociations
    .removeDevice(deviceToken)
    .then(function() {
      logger.debug('Unsubscribe device: ', deviceToken);
    }, function(error) {
      logger.error('Couldn\'t unsubscribe device: ', deviceToken, error);
      return Q.reject(error);
    }
  );
};

var unsubscribeUser = function(user) {
  return pushAssociations
    .removeForUser(user)
    .then(function() {
      logger.debug('Unsubscribe user: ', user);
    }, function(error) {
      logger.error('Couldn\'t unsubscribe user: ', user, error);
      return Q.reject(error);
    }
  );
};

var unsubscribeUserDevice = function(user, token) {
  return pushAssociations
    .removeDeviceFromUser(user, token)
    .then(function() {
      logger.debug('Unsubscribe user device: ', user, token);
    }, function(error) {
      logger.error('Couldn\'t unsubscribe user device: ', user, token, error);
      return Q.reject(error);
    }
  );
};

module.exports = {
  send: send,
  sendUsers: sendUsers,
  subscribe: subscribe,
  unsubscribeDevice: unsubscribeDevice,
  unsubscribeUser: unsubscribeUser,
  unsubscribeUserDevice: unsubscribeUserDevice
};
