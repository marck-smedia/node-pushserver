'use strict';

var sqlite3 = require('sqlite3'),
  config = require('./Config'),
  logger = config.log4js.getLogger('PushAssociations');

var sqliteFile = config.get('sqliteFile');

var error;
if (!sqliteFile) {
  error = 'The configuration file must define the "sqliteFile" value.';
  throw new Error(error);
}

var db = new sqlite3.Database(sqliteFile);
db.on('trace', function (query) {
  logger.trace(query);
});
db.run('CREATE TABLE IF NOT EXISTS push_associations (user TEXT NOT NULL, type TEXT NOT NULL, token TEXT NOT NULL, CONSTRAINT user_token UNIQUE (user, token))');

var add = function (user, deviceType, token, callback) {
  db.run('INSERT INTO push_associations VALUES (?, ?, ?)', user, deviceType, token, callback);
};

var updateTokens = function (fromToArray) {
  fromToArray.forEach(function (tokenUpdate) {
    db.run('UPDATE push_associations SET token = ? WHERE token = ?', tokenUpdate.to, tokenUpdate.from);
  });
};

var getAll = function (callback) {
  db.all('SELECT * FROM push_associations', callback);
};

var getForUser = function (user, callback) {
  db.all('SELECT * FROM push_associations WHERE user = ?', user, callback);
};

var getForUsers = function (users, callback) {
  // FIXME: prevent SQL injection (prepareStatement with "in (?,?)" doesn't work?!)
  var query = 'SELECT * FROM push_associations WHERE user in (';
  for (var i = 0; i < users.length; i++) {
    if (i > 0) query += ',';
    query += '\'' + users[i] + '\'';
  }
  query += ')';
  db.all(query, callback);
};

var removeForUser = function (user) {
  db.run('DELETE FROM push_associations WHERE user = ?', user);
};

var removeDeviceFromUser = function (user, token) {
  db.run('DELETE FROM push_associations WHERE user = ? AND token = ?', user, token);
};

var removeDevice = function (token) {
  db.run('DELETE FROM push_associations WHERE token = ?', token);
};

var removeDevices = function (tokens) {
  // FIXME: prevent SQL injection (prepareStatement with "in (?,?)" doesn't work?!)
  var query = 'DELETE FROM push_associations WHERE token in (';
  for (var i = 0; i < tokens.length; i++) {
    if (i > 0) query += ',';
    query += '\'' + tokens[i].toUpperCase() + '\'';
  }
  query += ')';
  db.run(query);
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
