'use strict';

var _ = require('lodash');
var log4js = require('log4js');

var config;

var initialize = _.once(function(configFilePath, overrides) {
  var overrideValues = {};
  _.forEach(overrides, function(valueParam) {
    var array = valueParam.split('=');
    var key = array[0];
    var value = array[1];

    var configElement = overrideValues;
    var keyPath = key.split('.');
    for (var i = 0; i < keyPath.length - 1; i++) {
      var pathElement = keyPath[i];
      configElement[pathElement] = configElement[pathElement] || {};
      configElement = configElement[pathElement];
    }
    var k = keyPath[keyPath.length - 1];
    configElement[k] = value;
  });

  config = _.merge({}, require(configFilePath), overrideValues);

  // Replace any "process.env.*" by its corresponding value
  var replaceEnvVars = function(obj) {
    _.forOwn(obj, function(value, key) {
      var env = /^process\.env\.(.+)$/.exec(value);
      if (env) {
        obj[key] = process.env[env[1]];
      }
      if (typeof value === 'object') {
        replaceEnvVars(value);
      }
    });
  };

  replaceEnvVars(config);

  var logConfigFile = process.env.LOG4JS_CONFIG || __dirname + '/../log4js.json';
  config.logConfigFile = logConfigFile;
  var logPath = config.logPath || __dirname + '/../logs/';
  config.logPath = logPath;
  log4js.configure(logConfigFile, {cwd: logPath});

  return config;
});

var get = function(key) {
  if (!config) {
    initialize('../config.json');
  }
  return config[key];
};

module.exports = {
  initialize: initialize,
  get: get,
  log4js: log4js
};
