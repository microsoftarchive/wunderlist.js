'use strict';

// HTML5 boilerplate - MIT
// Avoid `console` errors in browsers that lack a console - e.g. < IE 10
var method;
var noop = function () {};
var methods = [
  'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
  'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
  'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
  'timeStamp', 'trace', 'warn'
];
var len = methods.length;
var Console = global.console || {};

while (len--) {
  method = methods[len];
  // Only stub undefined methods.
  if (!Console[method]) {
    Console[method] = noop;
  }
}

module.exports = Console;
