'use strict';

var ENV = process.env;

var SupportedBrowsers = require('./browsers');
var Files = require('./files');

var BrowsersToTest = ENV.TRAVIS ? Object.keys(SupportedBrowsers) : [
  'Firefox',
  'Chrome',
  'Safari'
];

module.exports = function (config) {

  var LogLevel = ENV.TRAVIS ? config.LOG_ERROR : config.LOG_INFO;

  config.set({
    'basePath': '',
    'frameworks': [
      'mocha'
    ],
    'files': Files,
    'reporters': ['dots'],
    'browserNoActivityTimeout': 60000,
    'captureTimeout': 60000,
    'port': 9876,
    'colors': true,
    'logLevel': LogLevel,
    'autoWatch': false,
    'browserStack': {
      'username': ENV.BROWSER_STACK_USERNAME,
      'accessKey': ENV.BROWSER_STACK_ACCESS_KEY
    },
    'customLaunchers': SupportedBrowsers,
    'browsers': BrowsersToTest,
    'singleRun': true
  });
};
