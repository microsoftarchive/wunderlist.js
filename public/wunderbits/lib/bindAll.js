'use strict';

var core = require('wunderbits.core');
var functions = core.lib.functions;

// because lodash and underscore do some stupids
var arrRef = [];

// always use native bind regardless of "speed", we want less closures!
var bindAll = (function () {
  return function (object) {
    var fns = arguments.length > 1 ? arrRef.concat.apply(arrRef, arrRef.slice.call(arguments, 1)) : functions(object);
    var key;

    while (fns.length) {
      key = fns.shift();
      if (key !== 'constructor') {
        object[key] = object[key].bind(object);
      }
    }
  };
})();

module.exports = bindAll;
