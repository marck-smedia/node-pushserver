'use strict';

var mongoose = require('mongoose');
var _ = require('lodash');

// Init
var PushAssociation;

var outputFilterWrapper = function(callback) {
  return function(err, pushItems) {
    if (err) {
      return callback(err, null);
    }

    var items = _.map(pushItems, function(pushItem) {
      return _.pick(pushItem, ['user', 'type', 'token']);
    });

    return callback(null, items);
  };
};

var errorHandler = function(error) {
  console.error('ERROR: ' + error);
};

var initialize = function(mongodbUrl) {
  var db = mongoose.connect(mongodbUrl);
  mongoose.connection.on('error', errorHandler);

  var pushAssociationSchema = new db.Schema({
    user: {
      type: 'String',
      required: true
    },
    type: {
      type: 'String',
      required: true,
      enum: ['ios', 'android'],
      lowercase: true
    },
    token: {
      type: 'String',
      required: true
    }
  });

  // I must ensure uniqueness accross the two properties because two users can have the same token (ex: in apn, 1
  // token === 1 device)
  pushAssociationSchema.index({user: 1, token: 1}, {unique: true});

  PushAssociation = db.model('PushAssociation', pushAssociationSchema);

  var getAll = function(callback) {
    var wrappedCallback = outputFilterWrapper(callback);

    PushAssociation.find(wrappedCallback);
  };

  return {
    getAll: getAll,
    close: mongoose.connection.close
  };
};

module.exports = function(mongodbUrl) {
  return initialize(mongodbUrl);
};
