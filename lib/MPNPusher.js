var config = require('./Config');
var _ = require('lodash');
var mpns = require('mpns');
var pushAssociations = require('./PushAssociations');
var logger = config.log4js.getLogger('MPNPusher');

var push = function (channelURIs, message) {
  for (var i = 0; i < channelURIs.length; i++) {
    var channelURI = channelURIs[i];
    mpns.sendToast(channelURI, message.bold, message.normal, function (uri) {
      return function (err) {
        if (err) {
          if (err.shouldDeleteChannel) {
            logger.debug('Removed WP device: ' + uri);
            pushAssociations.removeDevice(uri);
          } else {
            logger.error(err);
          }
        }
      };
    }(channelURI));
  }
};

var buildPayload = function (options) {
  return options;
};

module.exports = {
  push: push,
  buildPayload: buildPayload
};
