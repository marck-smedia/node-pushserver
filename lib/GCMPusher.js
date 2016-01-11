'use strict';

var config = require('./Config');
var _ = require('lodash');
var gcm = require('node-gcm');
var pushAssociations = require('./PushAssociations');
var logger = config.log4js.getLogger('GCMPusher');

var gcmSender = new gcm.Sender(config.get('gcm').apiKey);

var handleResults = function(results) {
  var idsToUpdate = [];
  var idsToDelete = [];

  results.forEach(function(result) {
    logger.debug('Notification transmitted to: ', result.token);
    if (!!result[gcm.Constants.TOKEN_CANONICAL_REG_ID]) {
      logger.debug('Token %s will be replaced by %s', result.token, result[gcm.Constants.TOKEN_CANONICAL_REG_ID]);
      idsToUpdate.push({from: result.token, to: result[gcm.Constants.TOKEN_CANONICAL_REG_ID]});
    } else if (result.error === 'InvalidRegistration' || result.error === 'NotRegistered') {
      logger.debug('Token %s will be replaced by %s', result.token, result[gcm.Constants.TOKEN_CANONICAL_REG_ID]);
      idsToDelete.push(result.token);
    }
  });

  if (idsToUpdate.length > 0) {
    pushAssociations.updateTokens(idsToUpdate);
  }
  if (idsToDelete.length > 0) {
    pushAssociations.removeDevices(idsToDelete);
  }
};

var push = function(tokens, message) {
  gcmSender.send(message, tokens, 4, function(err, res) {
    if (err) {
      logger.error(err);
    }

    if (res) {
      var mappedResults = _.map(_.zip(tokens, res.results), function(arr) {
        return _.merge({token: arr[0]}, arr[1]);
      });

      handleResults(mappedResults);
    }
  });
};

var buildPayload = function(options) {
  return new gcm.Message(options);
};

module.exports = {
  push: push,
  buildPayload: buildPayload
};
