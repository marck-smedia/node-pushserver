#!/usr/bin/env node

'use strict';

var config = require('../lib/Config');
var pack = require('../package');
var program = require('commander');
var fs = require('fs');
var path = require('path');
var logger = config.log4js.getLogger('pushserver');

function parseOverrideOption(val, memo) {
  var m = /^[^=]+=[^=]+$/.exec(val);
  if (!m) {
    logger.error('Incorrect value "%s": override option should be of the form key=value or  key.subKey=value. If the' +
      ' value begins with process.env, it is evaluated.', val);
  } else {
    memo.push(val);
  }
  return memo;
}

program.version(pack.version)
  .option('-c, --config <configPath>', 'Path to config file')
  .option('-o, --override [overrideValue]',
  'Overrides a config value. [overrideValue] should be of the form key=value or key.subKey=value. If the value' +
  ' begins with process.env, it is evaluated.',
  parseOverrideOption, [])
  .parse(process.argv);

var configPath = program.config;
if (configPath) {
  configPath = path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath);
  if (!fs.existsSync(configPath)) {
    logger.error('The configuration file doesn\'t exist.');
    return program.outputHelp();
  }
} else {
  logger.error('You must provide a configuration file.');
  return program.outputHelp();
}

config.initialize(configPath, program.override);

require('../lib/Web').start();
