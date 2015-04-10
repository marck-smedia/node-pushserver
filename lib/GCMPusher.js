'use strict';

var config = require('./Config'),
  _ = require('lodash'),
  gcm = require('node-gcm'),
  pushAssociations = require('./PushAssociations'),
  logger = config.log4js.getLogger('GCMPusher');

var push = function (tokens, message) {
  gcmSender().send(message, tokens, 4, function (err, res) {
    if (err) logger.error(err);

    if (res) {
      var mappedResults = _.map(_.zip(tokens, res.results), function (arr) {
        return _.merge({token: arr[0]}, arr[1]);
      });

      handleResults(mappedResults);
    }
  });
};

var handleResults = function (results) {
  var idsToUpdate = [],
    idsToDelete = [];

  results.forEach(function (result) {
    if (!!result.registration_id) {
      idsToUpdate.push({from: result.token, to: result.registration_id});

    } else if (result.error === 'InvalidRegistration' || result.error === 'NotRegistered') {
      idsToDelete.push(result.token);
    }
  });

  if (idsToUpdate.length > 0) pushAssociations.updateTokens(idsToUpdate);
  if (idsToDelete.length > 0) pushAssociations.removeDevices(idsToDelete);
};

var buildPayload = function (options) {
  return new gcm.Message(options);
};

var gcmSender = _.once(function () {
  return new gcm.Sender(config.get('gcm').apiKey);
});

module.exports = {
  push: push,
  buildPayload: buildPayload
};
