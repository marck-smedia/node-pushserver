'use strict';

var _ = require('lodash'),
  pushAssociations = require('./PushAssociations'),
  apnPusher = require('./APNPusher'),
  gcmPusher = require('./GCMPusher'),
  mpnPusher = require('./MPNPusher'),
  config = require('./Config'),
  logger = config.log4js.getLogger('PushController');


var send = function (pushAssociations, androidPayload, iosPayload, wpPayload) {
    var androidTokens = _(pushAssociations).where({type: 'android'}).map('token').value();
    var iosTokens = _(pushAssociations).where({type: 'ios'}).map('token').value();
    var wpTokens = _(pushAssociations).where({type: 'wp'}).map('token').value();

  if (androidPayload && androidTokens.length > 0) {
    var gcmPayload = gcmPusher.buildPayload(androidPayload);
    gcmPusher.push(androidTokens, gcmPayload);
  }

  if (iosPayload && iosTokens.length > 0) {
    var apnPayload = apnPusher.buildPayload(iosPayload);
    apnPusher.push(iosTokens, apnPayload);
  }

  if(wpPayload && wpTokens.length > 0) {
    var mpnPayload = mpnPusher.buildPayload(wpPayload);
    mpnPusher.push(wpTokens, mpnPayload);
  }
};

var sendUsers = function (users, payload) {
  pushAssociations.getForUsers(users, function (err, pushAss) {
    if (err) return;
    send(pushAss, payload);
  });
};

var subscribe = function (deviceInfo, callback) {
  pushAssociations.add(deviceInfo.user, deviceInfo.type, deviceInfo.token, callback);
};

var unsubscribeDevice = function (deviceToken) {
  pushAssociations.removeDevice(deviceToken);
};

var unsubscribeUser = function (user) {
  pushAssociations.removeForUser(user);
};

var unsubscribeUserDevice = function(user, token) {
    pushAssociations.removeDeviceFromUser(user, token);
};

module.exports = {
    send: send,
    sendUsers: sendUsers,
    subscribe: subscribe,
    unsubscribeDevice: unsubscribeDevice,
    unsubscribeUser: unsubscribeUser,
    unsubscribeUserDevice: unsubscribeUserDevice
};
