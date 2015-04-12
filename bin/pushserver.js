#!/usr/bin/env node

'use strict';

var config = require('../lib/Config'),
  pack = require('../package'),
  program = require('commander'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  logger = config.log4js.getLogger('pushserver');

function parseOverrideOption(val, memo) {
  var m = /^[^=]+=[^=]+$/.exec(val);
  if (!m) {
    logger.error('Incorrect value "' + val + '": override option should be of the form key=value or key.subKey=value. If the value begins with process.env, it is evaluated.');
  } else {
    memo.push(val);
  }
  return memo;
}

program.version(pack.version)
  .option('-c, --config <configPath>', 'Path to config file')
  .option('-o, --override [overrideValue]', 'Overrides a config value. [overrideValue] should be of the form key=value or key.subKey=value. If the value begins with process.env, it is evaluated.', parseOverrideOption, [])
  .parse(process.argv);

var configPath = program.config;
if (configPath) {
  configPath = configPath.indexOf('/') === 0 ? configPath : path.join(process.cwd(), configPath);
  if (!fs.existsSync(configPath)) {
    logger.error('The configuration file doesn\'t exist.');
    return program.outputHelp();
  }
} else {
  logger.error('You must provide a configuration file.');
  return program.outputHelp();
}

var overrideValues = {};
_.forEach(program.override, function (valueParam) {
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

config.initialize(configPath, overrideValues);

var web = require('../lib/Web');
web.start();
