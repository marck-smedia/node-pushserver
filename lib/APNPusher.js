'use strict';

var config = require('./Config'),
  apn = require('apn'),
  pushAssociations = require('./PushAssociations'),
  logger = config.log4js.getLogger('APNPusher');

var push = function (tokens, payload) {
  apnSender.pushNotification(payload, tokens);
};

var buildPayload = function (options) {
  var notif = new apn.Notification(options.payload);

  notif.expiry = options.expiry || 0;
  notif.alert = options.alert;
  notif.badge = options.badge;
  notif.sound = options.sound;

  return notif;
};

var onTransmissionError = function (errorCode, notification, recipient) {
  logger.error('Error while pushing to APN: ' + errorCode);
  // Invalid token => remove device
  if (errorCode === 8) {
    var token = recipient.token.toString('hex');

    logger.debug('Invalid token: removing device ' + token);
    pushAssociations.removeDevice(token);
  }
};


var onFeedback = function (deviceInfos) {
  logger.debug('Feedback service, number of devices to remove: ' + deviceInfos.length);

  if (deviceInfos.length > 0) {
    pushAssociations.removeDevices(deviceInfos.map(function (deviceInfo) {
      return deviceInfo.device.token.toString('hex');
    }));
  }
};

var initAppFeedback = function () {
  var apnFeedback = new apn.Feedback(config.get('apn').feedback);

  apnFeedback.on('feedback', onFeedback);
};

var apnSender = new apn.Connection(config.get('apn').connection);
apnSender.on('transmissionError', onTransmissionError);
apnSender.on('transmitted', function (notification, device) {
  logger.debug('Notification transmitted to: ', device.token.toString('hex'));
});
initAppFeedback();

module.exports = {
  push: push,
  buildPayload: buildPayload
};
