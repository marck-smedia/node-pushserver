'use strict';

var sqlite3 = require('sqlite3');

var init = function(sqliteFile) {
  var error;
  if (!sqliteFile) {
    error = 'The configuration file must define the "sqliteFile" value.';
    throw new Error(error);
  }

  var db = new sqlite3.Database(sqliteFile);
  db.run('CREATE TABLE IF NOT EXISTS push_associations (user TEXT NOT NULL, type TEXT NOT NULL, token TEXT NOT NULL,' +
    ' CONSTRAINT user_token UNIQUE (user, token))');

  var add = function(user, deviceType, token, callback) {
    db.run('INSERT INTO push_associations VALUES (?, ?, ?)', user, deviceType, token, callback);
  };

  return {
    add: add,
    close: db.close
  };
};

module.exports = function(sqliteFile) {
  return init(sqliteFile);
};
