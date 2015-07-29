var config = require('./Config')
var _ = require('lodash');
var mpns = require('mpns');
var pushAssociations = require('./PushAssociations');

var push = function (tokens, message) {
  var idsToDelete = [];

    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      mpns.sendToast(tokens[i], message.bold, message.normal, function(err, res) {
        if(err) {
          if(err.shouldDeleteChannel) {
            idsToDelete.push(tokens[i]);
          }
        }
        if(i == (len - 1)) {
          if (idsToDelete.length > 0) pushAssociations.removeDevices(idsToDelete);
        }
      });
    }
};

var buildPayload = function (options) {
    return options;
};

module.exports = {
    push: push,
    buildPayload:buildPayload
}
