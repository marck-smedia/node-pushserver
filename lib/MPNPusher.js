'use strict';

var config = require('./Config');
var mpns = require('mpns');
var pushAssociations = require('./PushAssociations');
var logger = config.log4js.getLogger('MPNPusher');

var sendCallback = function(uri) {
  return function(result) {
    if (result) {
      if (result.shouldDeleteChannel) {
        logger.debug('Removed WP device: ' + uri);
        pushAssociations.removeDevice(uri);
      } else if (result.innerError) {
        logger.error(result);
      } else {
        logger.debug('Notification transmitted to: ', uri);
      }
    }
  };
};

var push = function(channelURIs, message) {
  for (var i = 0; i < channelURIs.length; i++) {
    var channelURI = channelURIs[i];
    mpns.sendToast(channelURI, message.bold, message.normal, sendCallback(channelURI));
  }
};

var buildPayload = function(options) {
  return options;
};

module.exports = {
  push: push,
  buildPayload: buildPayload
};
