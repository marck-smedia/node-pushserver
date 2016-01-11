'use strict';

var sqlite3 = require('sqlite3'),
  Q = require('q'),
  config = require('./Config'),
  logger = config.log4js.getLogger('PushAssociations');

var sqliteFile = config.get('sqliteFile');

var error;
if (!sqliteFile) {
  error = 'The configuration file must define the "sqliteFile" value.';
  throw new Error(error);
}

var resultHandler = function(deferred) {
  return function(error, result) {
    if (error) {
      deferred.reject(new Error(error));
    } else {
      deferred.resolve(result);
    }
  };
};

var deleteResultHandler = function(deferred) {
  return function(error) {
    if (error) {
      deferred.reject(new Error(error));
    } else if (this.changes > 0) {
      deferred.resolve(this.changes);
    } else {
      deferred.reject(new Error('Nothing deleted'));
    }
  };
};

var db = new sqlite3.Database(sqliteFile);
db.on('trace', function (query) {
  logger.trace(query);
});
db.run('CREATE TABLE IF NOT EXISTS push_associations (user TEXT NOT NULL, type TEXT NOT NULL, token TEXT NOT NULL, CONSTRAINT user_token UNIQUE (user, token))');

var add = function (user, deviceType, token) {
  var deferred = Q.defer();
  db.run('INSERT INTO push_associations VALUES (?, ?, ?)', user, deviceType, token, resultHandler(deferred));
  return deferred.promise;
};

var updateTokens = function (fromToArray) {
  fromToArray.forEach(function (tokenUpdate) {
    db.run('UPDATE push_associations SET token = ? WHERE token = ?', tokenUpdate.to, tokenUpdate.from);
  });
};

var getAll = function () {
  var deferred = Q.defer();
  db.all('SELECT * FROM push_associations', resultHandler(deferred));
  return deferred.promise;
};

var getForUser = function (user) {
  var deferred = Q.defer();
  db.all('SELECT * FROM push_associations WHERE user = ?', user, resultHandler(deferred));
  return deferred.promise;
};

var getForUsers = function (users) {
  var deferred = Q.defer();
  // FIXME: prevent SQL injection (prepareStatement with "in (?,?)" doesn't work?!)
  var query = 'SELECT * FROM push_associations WHERE user in (';
  for (var i = 0; i < users.length; i++) {
    if (i > 0) query += ',';
    query += '\'' + users[i] + '\'';
  }
  query += ')';
  db.all(query, resultHandler(deferred));
  return deferred.promise;
};

var removeForUser = function (user) {
  var deferred = Q.defer();
  db.run('DELETE FROM push_associations WHERE user = ?', user, deleteResultHandler(deferred));
  return deferred.promise;
};

var removeDeviceFromUser = function (user, token) {
  var deferred = Q.defer();
  db.run('DELETE FROM push_associations WHERE user = ? AND token = ?', user, token, deleteResultHandler(deferred));
  return deferred.promise;
};

var removeDevice = function (token) {
  var deferred = Q.defer();
  db.run('DELETE FROM push_associations WHERE token = ?', token, deleteResultHandler(deferred));
  return deferred.promise;
};

var removeDevices = function (tokens) {
  // FIXME: prevent SQL injection (prepareStatement with "in (?,?)" doesn't work?!)
  var deferred = Q.defer();
  var query = 'DELETE FROM push_associations WHERE token in (';
  for (var i = 0; i < tokens.length; i++) {
    if (i > 0) query += ',';
    query += '\'' + tokens[i].toUpperCase() + '\'';
  }
  query += ')';
  db.run(query, deleteResultHandler(deferred));
  return deferred.promise;
};

module.exports = {
  add: add,
  updateTokens: updateTokens,
  getAll: getAll,
  getForUser: getForUser,
  getForUsers: getForUsers,
  removeForUser: removeForUser,
  removeDeviceFromUser: removeDeviceFromUser,
  removeDevice: removeDevice,
  removeDevices: removeDevices
};
