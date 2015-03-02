!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),(n.wunderlist||(n.wunderlist={})).sdk=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(_dereq_,module,exports){
(function (process,global){
'use strict';

var isBrowser = process.browser;
if (isBrowser && global.MagiConsole) {
  module.exports = global.MagiConsole;
}
else {
  var Console = global.console;
  var WBClass = _dereq_('wunderbits.core/public/WBClass');
  var assert =  _dereq_('wunderbits.core/public/lib/assert');
  var functions =  _dereq_('wunderbits.core/public/lib/functions');
  var toArray = _dereq_('wunderbits.core/public/lib/toArray');

  var _logLevels = {
    'error': 3,
    'warn': 4,
    'log': 5,
    'info': 6,
    'debug': 7
  };
  var _normalLoggers = Object.keys(_logLevels);

  var _colors = {
    'blue': '\x1B[34m',
    'cyan': '\x1B[36m',
    'green': '\x1B[32m',
    'grey': '\x1B[90m',
    'magenta': '\x1B[35m',
    'red': '\x1B[31m',
    'white': '\x1B[37m',
    'yellow': '\x1B[33m'
  };
  var _colorTerminator = '\x1B[39m';

  var _colorMap = {
    'debug': 'cyan',
    'error': 'red',
    'info': 'grey',
    'log': 'white',
    'warn': 'yellow'
  };

  // let there be debug!
  _normalLoggers.forEach(function (logger) {
    if (typeof Console[logger] !== 'function') {
      Console[logger] = Console.log;
    }
  });

  var MagiConsolePrototype = {

    'constructor': function (namespace) {

      var self = this;

      assert.string(namespace, 'namespace must be a string');

      // if a cached namespaced logger already exists, simply return it
      var namespaceMap = MagiConsole.namespaces;
      if (namespaceMap[namespace] instanceof MagiConsole) {
        return namespaceMap[namespace];
      }

      self.namespace = namespace;
      namespaceMap[namespace] = self;

      WBClass.call(self);
    },

    'shouldRunLevel': function (method) {

      var currentLevel = _logLevels[MagiConsole.level];
      var methodLevel = _logLevels[method];

      if (currentLevel === undefined || methodLevel === undefined) {
        return true;
      }
      else {
        return MagiConsole.levelOnly ? methodLevel === currentLevel : methodLevel <= currentLevel;
      }
    },

    'shouldRun': function (method) {

      var self = this;
      var pattern = MagiConsole.pattern;
      var level = MagiConsole.level;

      var shouldRun = pattern && pattern.test(self.namespace);
      shouldRun = shouldRun && (level ? self.shouldRunLevel(method) : true);
      return !!(shouldRun && Console);
    },

    'colorizeString': function (string, color) {

      return _colors[color] + string + _colorTerminator;
    },

    'colorizeNamespace': function (string, method) {

      var color = _colorMap[method];
      if (color) {
        string = this.colorizeString(string, color);
      }

      return string;
    },

    'colorizeStrings': function (method, args) {

      var self = this;

      args.forEach(function (arg, index) {

        if (typeof arg === 'string') {
          args[index] = self.colorizeNamespace(arg, method);
        }
      });

      return args;
    },

    'injectNamespace': function (method, args) {

      var self = this;

      if (_normalLoggers.indexOf(method) >= 0) {
        args = toArray(args);
        var namespaceString = '[' + self.namespace.toUpperCase() + ']';
        if (typeof args[0] === 'string') {
          args[0] = namespaceString + ' ' + args[0];
        }
        else {
          args.unshift(namespaceString);
        }

        !isBrowser && self.colorizeStrings(method, args);
      }

      return args;
    }
  };

  functions(Console).forEach(function (method) {

    MagiConsolePrototype[method] = function methodWrapper () {

      var self = this;
      var args = arguments;
      if (self.shouldRun(method)) {
        args = self.injectNamespace(method, args);
        Console[method].apply(Console, args);
      }
    };
  });

  var MagiConsole = WBClass.extend(MagiConsolePrototype);

  MagiConsole.release = function () {

    MagiConsole.namespaces = {};
  };

  MagiConsole.reset = MagiConsole.off = function () {

    MagiConsole.pattern = undefined;
    MagiConsole.level = undefined;
    MagiConsole.levelOnly = false;
  };

  MagiConsole.setPattern = function (regexPatternString) {

    assert.string(regexPatternString, 'regexPatternString must be a string');
    regexPatternString = regexPatternString === '*' ? '.?' : regexPatternString;
    MagiConsole.pattern = new RegExp(regexPatternString);
  };

  MagiConsole.setLevel = function (logLevel, levelOnly) {

    assert.string(logLevel, 'logLevel must be a string');
    logLevel = logLevel === '*' ? undefined : logLevel;
    MagiConsole.level = logLevel;
    MagiConsole.levelOnly = !!levelOnly;
  };

  if (!isBrowser) {
    var env = process.env;
    var envPattern = env.MLOG;
    var envLevel = env.MLEVEL;
    envPattern && MagiConsole.setPattern(envPattern);
    envLevel && MagiConsole.setLevel(envLevel, env.MLEVELONLY === 'true');
  }

  MagiConsole.release();
  MagiConsole.reset();

  module.exports = MagiConsole;
}

}).call(this,_dereq_("Rdh0rp"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"Rdh0rp":1,"wunderbits.core/public/WBClass":5,"wunderbits.core/public/lib/assert":13,"wunderbits.core/public/lib/functions":23,"wunderbits.core/public/lib/toArray":29}],3:[function(_dereq_,module,exports){
'use strict';

var BaseEmitter = _dereq_('./WBEventEmitter').extend({
  'mixins': [
    _dereq_('./mixins/WBDestroyableMixin'),
    _dereq_('./mixins/WBUtilsMixin'),
    _dereq_('./mixins/ObservableHashMixin')
  ]
});

module.exports = BaseEmitter;

},{"./WBEventEmitter":7,"./mixins/ObservableHashMixin":33,"./mixins/WBDestroyableMixin":35,"./mixins/WBUtilsMixin":38}],4:[function(_dereq_,module,exports){
'use strict';

var BaseSingleton = _dereq_('./WBSingleton').extend({
  'mixins': [
    _dereq_('./mixins/WBEventsMixin'),
    _dereq_('./mixins/WBBindableMixin'),
    _dereq_('./mixins/WBDestroyableMixin'),
    _dereq_('./mixins/WBUtilsMixin'),
    _dereq_('./mixins/ObservableHashMixin')
  ]
});

module.exports = BaseSingleton;

},{"./WBSingleton":10,"./mixins/ObservableHashMixin":33,"./mixins/WBBindableMixin":34,"./mixins/WBDestroyableMixin":35,"./mixins/WBEventsMixin":36,"./mixins/WBUtilsMixin":38}],5:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_('./lib/inherits');
var extend = _dereq_('./lib/extend');
var clone = _dereq_('./lib/clone');
var createUID = _dereq_('./lib/createUID');
var fromSuper = _dereq_('./lib/fromSuper');

// Self-propagating extend function.
// Create a new class,
// that inherits from the class found in the `this` context object.
// This function is meant to be called,
// in the context of a constructor function.
function extendSelf (protoProps, staticProps) {
  /* jshint validthis:true */

  var parent = this;

  protoProps = protoProps || {};

  // extract mixins, if any
  var mixins = protoProps.mixins || [];
  delete protoProps.mixins;

  // create the derived class
  var child = inherits(parent, protoProps, staticProps);

  // apply mixins to the derived class
  var mixin;
  while (mixins.length) {
    mixin = mixins.shift();
    (typeof mixin.applyToClass === 'function') &&
      mixin.applyToClass(child);
  }

  // make the child class extensible
  child.extend = parent.extend || extendSelf;
  return child;
}

function WBClass (options) {

  var self = this;

  // Assign a unique identifier to the instance
  self.uid = self.uid || createUID();

  // save options, make sure it's at least an empty object
  self.options = options || self.options;

  // augment properties from mixins
  self.augmentProperties();

  // initialize the instance
  self.initialize.apply(self, arguments);

  // initialize all the mixins, if needed
  // don't keep this in the initialize,
  // initialize can be overwritten
  self.initMixins.apply(self, arguments);
}

var proto = {

  'initialize': function () {

    // Return self to allow for subclass to assign
    // super initializer value to self
    var self = this;
    return self;
  },

  // If any mixins were applied to the prototype, initialize them
  'initMixins': function () {

    var self = this;
    var initializers = fromSuper.concat(self, 'initializers');

    var initializer;
    while (initializers.length) {
      initializer = initializers.shift();
      (typeof initializer === 'function') &&
        initializer.apply(self, arguments);
    }
  },

  // If any proerties were defined in the mixins, augment them to the instance
  'augmentProperties': function () {

    var self = this;
    var properties = fromSuper.merge(self, 'properties');

    function augmentProperty (property, value) {

      var type = typeof value;

      if (type === 'function') {
        self[property] = value.call(self);
      }
      else if (type === 'object') {
        self[property] = clone(value, true);
      }
      else {
        self[property] = value;
      }
    }

    for (var key in properties) {
      augmentProperty(key, properties[key]);
    }
  }
};

extend(WBClass.prototype, proto);
WBClass.extend = extendSelf;

module.exports = WBClass;

},{"./lib/clone":14,"./lib/createUID":15,"./lib/extend":20,"./lib/fromSuper":22,"./lib/inherits":25}],6:[function(_dereq_,module,exports){
'use strict';

var WBClass = _dereq_('./WBClass');
var WBPromise = _dereq_('./WBPromise');
var assert = _dereq_('./lib/assert');
var toArray = _dereq_('./lib/toArray');

var states = {
  'pending': 0,
  'resolved': 2,
  'rejected': 4
};

var stateNames = {
  0: ['pending'],
  2: ['resolved', 'resolve'],
  4: ['rejected', 'reject']
};

var proto = {

  'properties': {
    '_state': states.pending,
    '_args': [],
    'handlers': []
  },

  'initialize': function (context) {
    var self = this;
    self._context = context;
  },

  'state': function () {
    var self = this;
    return stateNames[self._state][0];
  },

  'trigger': function (withContext) {

    var self = this;
    if (self._state === states.pending) {
      return;
    }

    var handlers = self.handlers, handle;
    while (handlers.length) {
      handle = handlers.shift();
      self.invoke(handle, withContext || self._context);
    }
  },

  'invoke': function (deferredResponse, withContext) {

    var self = this;
    var state = self._state;
    var context = deferredResponse.context || withContext || self;
    var args = deferredResponse.args;

    self._args.forEach(function (arg) {
      // send single arguments as the item, otherwise send it as an array
      args.push(arg);
    });

    var type = deferredResponse.type;
    var isCompleted = (type === 'then') ||
      (type === 'done' && state === states.resolved) ||
      (type === 'fail' && state === states.rejected);

    isCompleted && deferredResponse.fn.apply(context, args);
  },

  'promise': function () {
    var self = this;
    self._promise = self._promise || new WBPromise(this);
    return self._promise;
  }
};

['then', 'done', 'fail'].forEach(function (method) {
  proto[method] = function () {

    var self = this;

    // store references to the context, callbacks, and arbitrary arguments
    var args = toArray(arguments);
    var fn = args.shift();
    var context = args.shift();

    assert.function(fn, method + ' accepts only functions');

    self.handlers.push({
      'type': method,
      'context': context,
      'fn': fn,
      'args': args
    });

    // if the defered is not pending anymore, call the callbacks
    self.trigger();

    return self;
  };
});

// Alias `always` to `then` on Deferred's prototype
proto.always = proto.then;

function resolver (state, isWith, fnName) {
  return function complete () {

    var self = this;

    if (!(self instanceof WBDeferred)) {
      throw new Error(fnName + ' invoked with wrong context');
    }

    // can't change state once resolved or rejected
    if (self._state !== states.pending) {
      return self;
    }

    self._args = toArray(arguments);
    var context = isWith ? self._args.shift() : undefined;

    self._state = state;
    self.trigger(context);

    return self;
  };
}

[states.resolved, states.rejected].forEach(function (state) {
  var fnName = stateNames[state][1];
  proto[fnName] = resolver(state, false, fnName);
  proto[fnName + 'With'] = resolver(state, true, fnName);
});

var WBDeferred = WBClass.extend(proto);
module.exports = WBDeferred;

},{"./WBClass":5,"./WBPromise":9,"./lib/assert":13,"./lib/toArray":29}],7:[function(_dereq_,module,exports){
'use strict';

var WBEventEmitter = _dereq_('./WBClass').extend({
  'mixins': [
    _dereq_('./mixins/WBBindableMixin'),
    _dereq_('./mixins/WBEventsMixin')
  ]
});

module.exports = WBEventEmitter;

},{"./WBClass":5,"./mixins/WBBindableMixin":34,"./mixins/WBEventsMixin":36}],8:[function(_dereq_,module,exports){
'use strict';

var extend = _dereq_('./lib/extend');
var clone = _dereq_('./lib/clone');
var assert = _dereq_('./lib/assert');
var WBSingleton = _dereq_('./WBSingleton');

var WBMixin = WBSingleton.extend({

  // Apply the mixin to an instance of a class
  'applyTo': function (instance) {

    var behavior = clone(this.Behavior, true);

    // apply mixin's initialize & remove it from the instance
    var initializer;
    if (typeof behavior.initialize === 'function') {
      initializer = behavior.initialize;
      delete behavior.initialize;
    }

    // augment mixin's properties object into the instance
    var properties = behavior.properties;
    delete behavior.properties;

    // mixin the behavior
    extend(instance, behavior);

    // apply the initializer, if any
    initializer && initializer.apply(instance);

    // augment proerties to the instance
    properties && extend(instance, properties);

    return instance;
  },

  // Apply the mixin to the class directly
  'applyToClass': function (klass) {

    // validate class
    assert.class(klass, 'applyToClass expects a class');

    var proto = klass.prototype;
    var behavior = clone(this.Behavior, true);

    // cache the mixin's initializer, to be applied later
    var initialize = behavior.initialize;
    if (typeof initialize === 'function') {
      (!proto.hasOwnProperty('initializers')) && (proto.initializers = []);
      proto.initializers.push(initialize);
      delete behavior.initialize;
    }

    var properties = behavior.properties;
    delete behavior.properties;

    // extend the prototype
    extend(proto, behavior);

    // cache the properties, to be applied later
    (!proto.hasOwnProperty('properties')) && (proto.properties = {});
    properties && extend(proto.properties, properties);

    return klass;
  }
});

// The only real change from a simple singleton is
// the altered extend class method, which will save
// "mixinProps" into a specific member, for easy
// and clean application using #applyTo
WBMixin.extend = function (mixinProps, staticProps) {

  mixinProps || (mixinProps = {});
  staticProps || (staticProps = {});

  var current = clone(this.Behavior, true);
  staticProps.Behavior = extend(current, mixinProps);
  var mixin = WBSingleton.extend.call(this, staticProps);

  mixin.extend = WBMixin.extend;

  return mixin;
};

module.exports = WBMixin;

},{"./WBSingleton":10,"./lib/assert":13,"./lib/clone":14,"./lib/extend":20}],9:[function(_dereq_,module,exports){
'use strict';

var WBClass = _dereq_('./WBClass');

function proxy (name) {
  return function () {
    var deferred = this.deferred;
    deferred[name].apply(deferred, arguments);
    return this;
  };
}

var proto = {
  'constructor': function (deferred) {
    this.deferred = deferred;
  },

  'promise': function () {
    return this;
  },

  'state': function () {
    return this.deferred.state();
  }
};

[
  'done',
  'fail',
  'then'
].forEach(function (name) {
  proto[name] = proxy(name);
});

proto.always = proto.then;

module.exports = WBClass.extend(proto);

},{"./WBClass":5}],10:[function(_dereq_,module,exports){
'use strict';

var extend = _dereq_('./lib/extend');
var createUID = _dereq_('./lib/createUID');

function applyMixins (mixins, instance) {
  var mixin;
  while (mixins.length) {
    mixin = mixins.shift();
    (typeof mixin.applyTo === 'function') &&
      mixin.applyTo(instance);
  }
}

function extendSelf (staticProps) {
  /* jshint validthis:true */

  staticProps = staticProps || {};

  // extend from the base singleton
  var BaseSingleton = this || WBSingleton;

  // create a new instance
  Ctor.prototype = BaseSingleton;
  var singleton = new Ctor();

  // extract mixins
  var mixins = staticProps.mixins || [];
  staticProps.mixins = undefined;

  // apply mixins to the instance
  applyMixins(mixins, singleton);

  // append the static properties to the singleton
  extend(singleton, staticProps);

  // make the singleton extendable
  // Do this after applying mixins,
  // to ensure that no mixin can override `extend` method
  singleton.extend = extendSelf;

  // every signleton gets a UID
  singleton.uid = createUID();

  return singleton;
}

var Ctor = function () {};
Ctor.prototype = {
  'extend': extendSelf
};

var WBSingleton = new Ctor();
module.exports = WBSingleton;

},{"./lib/createUID":15,"./lib/extend":20}],11:[function(_dereq_,module,exports){
'use strict';

var WBClass = _dereq_('./WBClass');

var WBDestroyableMixin = _dereq_('./mixins/WBDestroyableMixin');
var originalDestroy = WBDestroyableMixin.Behavior.destroy;

var WBStateModel = WBClass.extend({

  'mixins': [
    _dereq_('./mixins/WBEventsMixin'),
    _dereq_('./mixins/WBStateMixin'),
    _dereq_('./mixins/WBBindableMixin'),
    WBDestroyableMixin
  ],

  'initialize': function (attributes) {

    var self = this;

    if (attributes) {
      self.attributes = attributes;
    }
  },

  'sync':  function (method, instance, options) {
    if (options && typeof options.success === 'function') {
      options.success();
    }
  },

  'fetch': function (options) {
    var self = this;
    var success = options.success;
    var model = this;
    options.success = function (resp) {
      if (!model.set(resp, options)) return false;
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };
    return self.sync('read', self, options);
  },

  'save': function (key, val, options) {

    var self = this;
    if (!self.destroying) {
      // set the attributes
      self.set(key, val, options);
      // sync
      (typeof key === 'object') && (options = val);
      self.sync('update', self, options);
    }
    return self;
  },

  'destroy': function (options) {

    var self = this;
    if (!self.destroying) {
      self.destroying = true;
      originalDestroy.call(self, options);
      self.attributes = {};
      self.sync('delete', self, options);
    }
  }
});

module.exports = WBStateModel;

},{"./WBClass":5,"./mixins/WBBindableMixin":34,"./mixins/WBDestroyableMixin":35,"./mixins/WBEventsMixin":36,"./mixins/WBStateMixin":37}],12:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  'lib': _dereq_('./lib'),
  'BaseEventEmitter': _dereq_('./BaseEventEmitter'),
  'BaseSingleton': _dereq_('./BaseSingleton'),
  'WBClass': _dereq_('./WBClass'),
  'WBDeferred': _dereq_('./WBDeferred'),
  'WBEventEmitter': _dereq_('./WBEventEmitter'),
  'WBMixin': _dereq_('./WBMixin'),
  'WBSingleton': _dereq_('./WBSingleton'),
  'WBStateModel': _dereq_('./WBStateModel'),
  'mixins': _dereq_('./mixins')
};

},{"./BaseEventEmitter":3,"./BaseSingleton":4,"./WBClass":5,"./WBDeferred":6,"./WBEventEmitter":7,"./WBMixin":8,"./WBSingleton":10,"./WBStateModel":11,"./lib":24,"./mixins":39}],13:[function(_dereq_,module,exports){
'use strict';

function assert (condition, message) {
  if (!condition) {
    throw new Error(message || '');
  }
}

var nativeIsArray = Array.isArray;
assert.empty = function (object, message) {
  var keys = nativeIsArray(object) ? object : Object.keys(object);
  assert(keys.length === 0, message);
};

assert.array = function (array, message) {
  assert(nativeIsArray(array), message);
};

assert.class = function (klass, message) {
  var proto = klass.prototype;
  assert(proto && proto.constructor === klass, message);
};

assert.number = function (value, message) {
  assert(typeof value === 'number' && !isNaN(value), message);
};

var types = [
  'undefined',
  'boolean',
  'string',
  'function',
  'object'
];

function typecheck (type) {
  assert[type] = function (o, message) {
    assert(typeof o === type, message);
  };
}

while (types.length) {
  typecheck(types.shift());
}

module.exports = assert;

},{}],14:[function(_dereq_,module,exports){
'use strict';

var nativeIsArray = Array.isArray;

function cloneArray (arr, isDeep) {
  arr = arr.slice();
  if (isDeep) {
    var newArr = [], value;
    while (arr.length) {
      value = arr.shift();
      value = (value instanceof Object) ? clone(value, isDeep) : value;
      newArr.push(value);
    }
    arr = newArr;
  }
  return arr;
}

function cloneDate (date) {
  return new Date(date.getTime());
}

function cloneObject (source, isDeep) {
  var object = {};
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      var value = source[key];
      if (value instanceof Date) {
        object[key] = cloneDate(value);
      } else if (typeof value === 'object' && value !== null && isDeep) {
        object[key] = clone(value, isDeep);
      } else {
        object[key] = value;
      }
    }
  }
  return object;
}

function clone (obj, isDeep) {

  if (nativeIsArray(obj)) {
    return cloneArray(obj, isDeep);
  }

  return cloneObject(obj, isDeep);
}

module.exports = clone;

},{}],15:[function(_dereq_,module,exports){
// http://stackoverflow.com/a/21963136/933653
'use strict';

var ff = 0xff;
var lut = [];
for (var i = 0; i < 256; i++) {
  lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
}

var random = Math.random;
function randHex() {
  return (random() * 0xffffffff | 0);
}

function section0 () {
  var d0 = randHex();
  return lut[d0 & ff] + lut[d0 >> 8 & ff] +
           lut[d0 >> 16 & ff] + lut[d0 >> 24 & ff];
}

function section1 () {
  var d1 = randHex();
  return lut[d1 & ff] + lut[d1 >> 8 & ff] + '-' +
         lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & ff];
}

function section2 () {
  var d2 = randHex();
  return lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & ff] + '-' +
       lut[d2 >> 16 & ff] + lut[d2 >> 24 & ff];
}

function section3 () {
  var d3 = randHex();
  return lut[d3 & ff] + lut[d3 >> 8 & ff] +
       lut[d3 >> 16 & ff] + lut[d3 >> 24 & ff];
}

function createUID (prefix) {
  var uid = [section0(), section1(), section2(), section3()].join('-');
  return (!prefix ? '' : prefix).toString() + uid;
}

module.exports = createUID;

},{}],16:[function(_dereq_,module,exports){
'use strict';

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// From: http://davidwalsh.name/function-debounce
function debounce (fn, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) {
        fn.apply(context, args);
      }
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      fn.apply(context, args);
    }
  };
}

module.exports = debounce;
},{}],17:[function(_dereq_,module,exports){
'use strict';

var toArray = _dereq_('./toArray');
var delay = _dereq_('./delay');

function defer (fn) {
  var args = toArray(arguments);
  args[0] = 1;
  args.unshift(fn);
  return delay.apply(null, args);
}

module.exports = defer;

},{"./delay":18,"./toArray":29}],18:[function(_dereq_,module,exports){
'use strict';

var toArray = _dereq_('./toArray');

function delay (fn, time, context) {
  var args = toArray(arguments, 3);
  return setTimeout(function () {

    var destroyed = context && context.destroyed;
    !destroyed && fn.apply(context, args);
  }, time);
}

module.exports = delay;

},{"./toArray":29}],19:[function(_dereq_,module,exports){
'use strict';

var assert = _dereq_('./assert');
var toArray = _dereq_('./toArray');
var clone = _dereq_('./clone');

var eventSplitter = /\s+/;

var validationErrors = {
  'trigger': 'Cannot trigger event(s) without event name(s)',
  'events': 'Cannot bind/unbind without valid event name(s)',
  'callback': 'Cannot bind/unbind to an event without valid callback function'
};

var events = {

  'properties': {
    '_events': {},
    '_cache': {}
  },

  'on': function (events, callback, context) {

    var self = this;

    // validate arguments
    assert.string(events, validationErrors.events);
    assert.function(callback, validationErrors.callback);

    // loop through the events & bind them
    self.iterate(events, function (name) {
      // keep the binding
      self.bind(name, callback, context);

      // if this was a published event, do an immediate trigger
      var cache = self._cache;
      if (cache[name]) {
        callback.apply(context || self, cache[name]);
      }
    });

    return self;
  },

  'off': function (events, callback, context) {

    var self = this;

    // validate events only if a truthy value is passed
    events && assert.string(events, validationErrors.events);

    // if no arguments were passed, unbind everything
    if (!events && !callback && !context) {
      self._events = {};
      return self;
    }

    // if no events are passed, unbind all events with this callback
    var localEvents = events || Object.keys(self._events);

    // loop through the events & bind them
    self.iterate(localEvents, function (name) {
      self.unbind(name, callback, context);
    });

    return self;
  },

  'once': function (events, callback, context) {

    var self = this;
    var args = toArray(arguments);

    // create a one time binding
    args[1] = function () {
      self.off.apply(self, args);
      callback.apply(context || self, arguments);
    };

    self.on.apply(self, args);

    return self;
  },

  'publish': function (events) {

    var self = this;
    var args = toArray(arguments);

    // validate events
    assert.string(events, validationErrors.events);

    self.iterate(events, function (name) {
      var cache = self._cache;
      if (!cache[name]) {
        cache[name] = args.slice(1);
        args[0] = name;
        self.trigger.apply(self, args);
      }
    });

    return self;
  },

  'unpublish': function (events) {

    var self = this;

    // validate events
    assert.string(events, validationErrors.events);

    // remove the cache for the events
    self.iterate(events, function (name) {
      self._cache[name] = undefined;
    });

    return self;
  },

  'unpublishAll': function () {
    var self = this;
    self._cache = {};
    return self;
  },

  'trigger': function (events) {

    var self = this;

    // validate arguments
    assert.string(events, validationErrors.trigger);

    // loop through the events & trigger them
    var params = toArray(arguments, 1);
    self.iterate(events, function (name) {
      self.triggerEvent(name, params);
    });

    return self;
  },

  'triggerEvent': function (name, params) {

    var self = this;
    var events = self._events || {};

    // call sub-event handlers
    var current = [];
    var fragments = name.split(':');
    var subName;
    while (fragments.length) {
      current.push(fragments.shift());
      subName = current.join(':');
      if (subName in events) {
        self.triggerSection(subName, fragments, params);
      }
    }
  },

  'triggerSection': function (name, fragments, params) {

    var self = this;
    var events = self._events || {};
    var bucket = events[name] || [];

    bucket.forEach(function (item) {
      var args;
      if (fragments.length) {
        args = clone(params);
        args.unshift(fragments);
      }
      item.callback.apply(item.context || self, args || params);
    });
  },

  'iterate': function (events, iterator) {

    var self = this;
    var localEvents = events;

    if (typeof localEvents === 'string') {
      localEvents = localEvents.split(eventSplitter);
    } else {
      assert.array(localEvents);
    }

    while (localEvents.length) {
      iterator.call(self, localEvents.shift());
    }
  },

  'bind': function (name, callback, context) {

    var self = this;

    // store the reference to the callback + context
    var events = self._events || {};
    var bucket = events[name] || (events[name] = []);
    bucket.push({
      'callback': callback,
      'context': context
    });

    return self;
  },

  'unbind': function (name, callback, context) {

    var self = this;

    // lookup the reference to handler & remove it
    var events = self._events;
    var bucket = events[name] || [];
    var retain = [];

    // loop through the handlers
    var i = -1, l = bucket.length, item;
    while (++i < l) {
      item = bucket[i];
      if ((callback && callback !== item.callback) ||
          (context && context !== item.context)) {
        retain.push(item);
      }
    }

    // flush out detached handlers
    events[name] = retain;

    return self;
  }
};

module.exports = events;

},{"./assert":13,"./clone":14,"./toArray":29}],20:[function(_dereq_,module,exports){
'use strict';

var toArray = _dereq_('./toArray');
var merge = _dereq_('./merge');
var assert = _dereq_('./assert');

function extend () {

  // convert the argument list into an array
  var args = toArray(arguments);

  // validate input
  assert(args.length > 0, 'extend expect one or more objects');

  // loop through the arguments
  // & merging them recursively
  var object = args.shift();
  while (args.length) {
    merge(object, args.shift());
  }

  return object;
}

module.exports = extend;

},{"./assert":13,"./merge":27,"./toArray":29}],21:[function(_dereq_,module,exports){
'use strict';

function forArray (array, iterator, context) {
  for (var i = 0, l = array.length; i < l; i++) {
    if (iterator.call(context, array[i], i, array) === false) {
      return;
    }
  }
}

function forObject (object, iterator, context) {
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      if (iterator.call(context, object[key], key) === false) {
        return;
      }
    }
  }
}

function forEach (collection, iterator, context) {
  var handler = Array.isArray(collection) ? forArray : forObject;
  handler(collection, iterator, context);
}

module.exports = forEach;

},{}],22:[function(_dereq_,module,exports){
'use strict';

var merge = _dereq_('./merge');
var extend = _dereq_('./extend');

function mergeFromSuper (instance, key) {

  var constructor = instance.constructor;
  var proto = constructor.prototype;

  var baseData = {};
  if (instance.hasOwnProperty(key)) {
    baseData = instance[key];
  } else if (proto.hasOwnProperty(key)) {
    baseData = proto[key];
  }

  var _super = constructor && constructor.__super__;
  if (_super) {
    baseData = merge(mergeFromSuper(_super, key), baseData);
  }

  return extend({}, baseData);
}

function concatFromSuper (instance, key) {

  var constructor = instance.constructor;
  var proto = constructor.prototype;

  var baseData = [];
  if (instance.hasOwnProperty(key)) {
    baseData = instance[key];
  } else if (proto.hasOwnProperty(key)) {
    baseData = proto[key];
  }

  var _super = constructor && constructor.__super__;
  if (_super) {
    baseData = [].concat(concatFromSuper(_super, key), baseData);
  }

  return [].concat(baseData);
}

module.exports = {
  'merge': mergeFromSuper,
  'concat': concatFromSuper
};

},{"./extend":20,"./merge":27}],23:[function(_dereq_,module,exports){
'use strict';

function functions (obj) {
  var funcs = [];
  for (var key in obj) {
    if (typeof obj[key] === 'function') {
      funcs.push(key);
    }
  }
  return funcs;
}

module.exports = functions;

},{}],24:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  'assert': _dereq_('./assert'),
  'clone': _dereq_('./clone'),
  'createUID': _dereq_('./createUID'),
  'debounce': _dereq_('./debounce'),
  'defer': _dereq_('./defer'),
  'delay': _dereq_('./delay'),
  'events': _dereq_('./events'),
  'extend': _dereq_('./extend'),
  'forEach': _dereq_('./forEach'),
  'fromSuper': _dereq_('./fromSuper'),
  'functions': _dereq_('./functions'),
  'inherits': _dereq_('./inherits'),
  'isEqual': _dereq_('./isEqual'),
  'merge': _dereq_('./merge'),
  'size': _dereq_('./size'),
  'toArray': _dereq_('./toArray'),
  'when': _dereq_('./when'),
  'where': _dereq_('./where')
};
},{"./assert":13,"./clone":14,"./createUID":15,"./debounce":16,"./defer":17,"./delay":18,"./events":19,"./extend":20,"./forEach":21,"./fromSuper":22,"./functions":23,"./inherits":25,"./isEqual":26,"./merge":27,"./size":28,"./toArray":29,"./when":30,"./where":31}],25:[function(_dereq_,module,exports){
'use strict';

var extend = _dereq_('./extend');

// Helper function to correctly set up the prototype chain, for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
function inherits (parent, protoProps, staticProps) {

  var child;

  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call `super()`.
  if (protoProps && protoProps.hasOwnProperty('constructor')) {
    child = protoProps.constructor;
  }
  else {
    child = function () {
      return parent.apply(this, arguments);
    };
  }

  // Inherit class (static) properties from parent.
  extend(child, parent);

  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function.
  child.prototype = Object.create(parent.prototype);

  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  extend(child.prototype, protoProps);

  // Correctly set child's `prototype.constructor`.
  child.prototype.constructor = child;

  // Add static properties to the constructor function, if supplied.
  extend(child, staticProps);

  // Set a convenience property
  // in case the parent's prototype is needed later.
  child.__super__ = parent.prototype;

  return child;
}

module.exports = inherits;

},{"./extend":20}],26:[function(_dereq_,module,exports){
'use strict';

// TODO: implement deepEqual
function isEqual (a, b) {
  return a === b;
}

module.exports = isEqual;

},{}],27:[function(_dereq_,module,exports){
'use strict';

var toArray = _dereq_('./toArray');

function merge (object) {
  var localSource;
  var sources = toArray(arguments, 1);
  while (sources.length) {
    localSource = sources.shift();
    for (var key in localSource) {
      if (localSource.hasOwnProperty(key)) {
        object[key] = localSource[key];
      }
    }
  }
  return object;
}

module.exports = merge;

},{"./toArray":29}],28:[function(_dereq_,module,exports){
'use strict';

function size (collection) {
  !Array.isArray(collection) && (collection = Object.keys(collection));
  return collection.length;
}

module.exports = size;

},{}],29:[function(_dereq_,module,exports){
'use strict';

function getAllocatedArray (arrLength) {

  arrLength = arrLength > 0 ? arrLength : 0;
  return new Array(arrLength);
}

function toArray (arrayLikeObj, skip) {

  var localSkip = skip || 0;
  var length = arrayLikeObj.length;
  var arr = getAllocatedArray(length - localSkip);

  for (var i = localSkip; i < length; i++) {
    arr[i - localSkip] = arrayLikeObj[i];
  }

  return arr;
}

module.exports = toArray;
},{}],30:[function(_dereq_,module,exports){
'use strict';

var WBDeferred = _dereq_('../WBDeferred');
var toArray = _dereq_('./toArray');

function When () {

  var context = this;
  var main = new WBDeferred(context);
  var deferreds = toArray(arguments);

  // support passing an array of deferreds, to avoid `apply`
  if (deferreds.length === 1 && Array.isArray(deferreds[0])) {
    deferreds = deferreds[0];
  }

  var count = deferreds.length;
  var args = new Array(count);

  function Fail () {
    main.rejectWith(this);
  }

  function Done () {

    if (main.state() === 'rejected') {
      return;
    }

    var index = count - deferreds.length - 1;
    args[index] = toArray(arguments);

    if (deferreds.length) {
      var next = deferreds.shift();
      next.done(Done);
    } else {
      args.unshift(this);
      main.resolveWith.apply(main, args);
    }
  }

  if (deferreds.length) {

    deferreds.forEach(function (deferred) {
      deferred.fail(Fail);
    });

    var current = deferreds.shift();
    current.done(Done);
  } else {
    main.resolve();
  }

  return main.promise();
}

module.exports = When;

},{"../WBDeferred":6,"./toArray":29}],31:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_('./forEach');

function where (collection, properties) {
  var matches = [];
  forEach(collection, function (item) {
    for (var key in properties) {
      if (item[key] !== properties[key]) {
        return;
      }
      matches.push(item);
    }
  });
  return matches;
}

module.exports = where;

},{"./forEach":21}],32:[function(_dereq_,module,exports){
'use strict';

var WBMixin = _dereq_('../WBMixin');
var fromSuper = _dereq_('../lib/fromSuper');

var ControllableMixin = WBMixin.extend({

  'initialize': function () {

    var self = this;

    self.controllers = [];
    self.implemented = [];

    self.implements = fromSuper.concat(self, 'implements');
    self.createControllerInstances();

    self.bindOnceTo(self, 'destroy', 'destroyControllers');
  },

  'createControllerInstances': function () {

    var self = this;

    var Controllers = self.implements;
    if (typeof Controllers === 'function') {
      Controllers = Controllers.call(self);
    }

    var ControllerClass, controllerInstance, i;

    // the order in which the controllers are implemented is important!
    for (i = Controllers.length; i--;) {
      ControllerClass = Controllers[i];

      // If we have already implemented a controller that inherits from
      // this controller, we don't need another one...
      if (self.implemented.indexOf(ControllerClass.toString()) < 0) {

        controllerInstance = new ControllerClass(self);
        self.controllers.push(controllerInstance);
        controllerInstance.parent = self;

        self.trackImplementedSuperConstructors(ControllerClass);
      }
    }

    return self.implemented;
  },

  'trackImplementedSuperConstructors': function (Controller) {

    var self = this;
    var _super = Controller.__super__;
    var superConstructor = _super && _super.constructor;

    if (superConstructor) {
      self.implemented.push(superConstructor.toString());
      self.trackImplementedSuperConstructors(superConstructor);
    }
  },

  'destroyControllers': function () {

    var self = this;

    // Loop and destroy
    var controller;
    var controllers = self.controllers;

    while (controllers.length) {
      // A controller can exist multiple times in the list,
      // since it's based on the event name,
      // so make sure to only destroy each one once
      controller = controllers.shift();
      controller.destroyed || controller.destroy();
    }
  }
});

module.exports = ControllableMixin;

},{"../WBMixin":8,"../lib/fromSuper":22}],33:[function(_dereq_,module,exports){
'use strict';

var WBMixin = _dereq_('../WBMixin');
var fromSuper = _dereq_('../lib/fromSuper');
var clone = _dereq_('../lib/clone');

var ObservableHashMixin = WBMixin.extend({

  'initialize': function () {

    var self = this;

    var observesHash = fromSuper.merge(self, 'observes');
    for (var target in observesHash) {
      self.bindToTarget(self.resolveTarget(target), observesHash[target]);
    }
  },

  'bindToTarget': function (target, events) {

    var self = this;

    for (var eventString in events) {
      self.bindHandlers(target, eventString, events[eventString]);
    }
  },

  'bindHandlers': function (target, eventString, handlers) {

    var self = this;

    if (typeof handlers === 'string') {
      handlers = [handlers];
    } else {
      handlers = clone(handlers);
    }

    while (handlers.length) {
      self.bindTo(target, eventString, handlers.shift());
    }
  },

  'resolveTarget': function (key) {

    var self = this;

    // allow observing self
    if (key === 'self') {
      return self;
    }

    var target = self[key];
    if (!target && typeof key === 'string' && key.indexOf('.') > -1) {
      key = key.split('.');
      target = self;
      while (key.length && target) {
        target = target[key.shift()];
      }
    }

    return target;
  }

});

module.exports = ObservableHashMixin;

},{"../WBMixin":8,"../lib/clone":14,"../lib/fromSuper":22}],34:[function(_dereq_,module,exports){
'use strict';

var WBMixin = _dereq_('../WBMixin');
var createUID = _dereq_('../lib/createUID');

var WBBindableMixin = WBMixin.extend({

  'properties': {
    '_bindings': {},
    '_namedEvents': {}
  },

  // keeps callback closure in own execution context with
  // only callback and context
  'callbackFactory': function  (callback, context) {

    var self = this;
    var bindCallback;

    if (typeof callback === 'string') {
      bindCallback = self.stringCallbackFactory(callback, context);
    }
    else {
      bindCallback = self.functionCallbackFactory(callback, context);
    }

    return bindCallback;
  },

  'stringCallbackFactory': function (callback, context) {

    return function stringCallback () {
      context[callback].apply(context, arguments);
    };
  },

  'functionCallbackFactory': function (callback, context) {

    return function functionCallback () {
      callback.apply(context, arguments);
    };
  },

  'bindTo': function (target, event, callback, context) {

    var self = this;
    self.checkBindingArgs.apply(self, arguments);

    // default to self if context not provided
    var ctx = context || self;

    // if this binding already made, return it
    var bound = self.isAlreadyBound(target, event, callback, ctx);
    if (bound) {
      return bound;
    }

    var callbackFunc, args;
    // if a jquery object
    if (self.isTargetJquery(target)) {
      // jquery does not take context in .on()
      // cannot assume on takes context as a param for bindable object
      // create a callback which will apply the original callback
      // in the correct context
      callbackFunc = self.callbackFactory(callback, ctx);
      args = [event, callbackFunc];
    }
    else {
      // Backbone accepts context when binding, simply pass it on
      callbackFunc = (typeof callback === 'string') ? ctx[callback] : callback;
      args = [event, callbackFunc, ctx];
    }

    // create binding on target
    target.on.apply(target, args);

    var binding = {
      'uid': createUID(),
      'target': target,
      'event': event,
      'originalCallback': callback,
      'callback': callbackFunc,
      'context': ctx
    };

    self._bindings[binding.uid] = binding;
    self.addToNamedBindings(event, binding);

    return binding;
  },

  'isTargetJquery': function (target) {

    var constructor = target.constructor;
    return constructor && constructor.fn && constructor.fn.on === target.on;
  },

  'bindOnceTo': function (target, event, callback, context) {

    var self = this;
    self.checkBindingArgs.apply(self, arguments);

    context = context || self;

    // if this binding already made, return it
    var bound = self.isAlreadyBound(target, event, callback, context);
    if (bound) {
      return bound;
    }

    // this is a wrapper
    var onceBinding = function () {

      ((typeof callback === 'string') ? context[callback] : callback).apply(context, arguments);
      self.unbindFrom(binding);
    };

    var binding = {
      'uid': createUID(),
      'target': target,
      'event': event,
      'originalCallback': callback,
      'callback': onceBinding,
      'context': context
    };

    target.on(event, onceBinding, context);

    self._bindings[binding.uid] = binding;
    self.addToNamedBindings(event, binding);

    return binding;
  },

  'unbindFrom': function (binding) {

    var self = this;

    var uid = binding && binding.uid;
    if (!binding || (typeof uid !== 'string')) {
      throw new Error('Cannot unbind from undefined or invalid binding');
    }

    var event = binding.event;
    var context = binding.context;
    var callback = binding.callback;
    var target = binding.target;

    // a binding object with only uid, i.e. a destroyed/unbound
    // binding object has been passed - just do nothing
    if (!event || !callback || !target || !context) {
      return;
    }

    target.off(event, callback, context);

    // clean up binding object, but keep uid to
    // make sure old bindings, that have already been
    // cleaned, are still recognized as bindings
    for (var key in binding) {
      if (key !== 'uid') {
        delete binding[key];
      }
    }

    delete self._bindings[uid];

    var namedEvents = self._namedEvents;
    var events = namedEvents[event];

    if (events) {
      var cloned = events && events.slice(0);
      for (var i = events.length - 1; i >= 0; i--) {
        if (events[i].uid === uid) {
          cloned.splice(i, 1);
        }
      }

      namedEvents[event] = cloned;
    }

    return;
  },

  'unbindFromTarget': function (target) {

    var self = this;

    if (!target || (typeof target.on !== 'function')) {
      throw new Error('Cannot unbind from undefined or invalid binding target');
    }

    var binding;
    for (var key in self._bindings) {
      binding = self._bindings[key];
      if (binding.target === target) {
        self.unbindFrom(binding);
      }
    }
  },

  'unbindAll': function () {

    var self = this;

    var binding;
    for (var key in self._bindings) {
      binding = self._bindings[key];
      self.unbindFrom(binding);
    }
  },

  'checkBindingArgs': function (target, event, callback, context) {

    context = context || this;

    // do not change these messages without updating the specs
    if (!target || (typeof target.on !== 'function')) {
      throw new Error('Cannot bind to undefined target or target without #on method');
    }

    if (!event || (typeof event !== 'string')) {
      throw new Error('Cannot bind to target event without event name');
    }

    if (!callback || ((typeof callback !== 'function') && (typeof callback !== 'string'))) {
      throw new Error('Cannot bind to target event without a function or method name as callback');
    }

    if ((typeof callback === 'string') && !context[callback]) {
      throw new Error('Cannot bind to target using a method name that does not exist for the context');
    }
  },

  'isAlreadyBound': function (target, event, callback, context) {

    var self = this;
    // check for same callback on the same target instance
    // return early withthe event binding
    var events = self._namedEvents[event];
    if (events) {
      for (var i = 0, max = events.length; i < max; i++) {

        var current = events[i] || {};

        // the below !boundTarget check seems unreachable
        // was added in this commit of the web app: c75d5077c0a8629b60cb6dd1cd78d3bc77fcac48
        // need to ask Adam under what conditions this would be possible
        var boundTarget = current.target;
        if (!boundTarget) {
          return false;
        }

        var targetBound = target.uid ? target.uid === boundTarget.uid : false;
        if (current.originalCallback === callback &&
            current.context === context && targetBound) {
          return current;
        }
      }
    }

    return false;
  },

  'addToNamedBindings': function (event, binding) {

    var self = this;
    if (!self._namedEvents[event]) {
      self._namedEvents[event] = [];
    }
    self._namedEvents[event].push(binding);
  }
});

module.exports = WBBindableMixin;

},{"../WBMixin":8,"../lib/createUID":15}],35:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_('../lib/forEach');
var WBMixin = _dereq_('../WBMixin');

function noop () {}

function Call (fn) {
  var self = this;
  (typeof fn === 'string') && (fn = self[fn]);
  (typeof fn === 'function') && fn.call(self);
}

var cleanupMethods = ['unbind', 'unbindAll', 'onDestroy'];

var WBDestroyableMixin = WBMixin.extend({

  'destroy': function () {

    var self = this;

    self.trigger('destroy');

    // clean up
    forEach(cleanupMethods, Call, self);

    self.destroyObject(self);

    self.destroyed = true;
  },

  'destroyObject': function (object) {

    var self = this;
    for (var key in object) {
      self.destroyKey(key, object);
    }
  },

  'destroyKey': function (key, context) {

    if (context.hasOwnProperty(key) && key !== 'uid' && key !== 'cid') {
      // make functions noop
      if (typeof context[key] === 'function') {
        context[key] = noop;
      }
      // and others undefined
      else {
        context[key] = undefined;
      }
    }
  }
});

module.exports = WBDestroyableMixin;

},{"../WBMixin":8,"../lib/forEach":21}],36:[function(_dereq_,module,exports){
'use strict';

var WBMixin = _dereq_('../WBMixin');
var events = _dereq_('../lib/events');

var WBEventsMixin = WBMixin.extend(events);

module.exports = WBEventsMixin;

},{"../WBMixin":8,"../lib/events":19}],37:[function(_dereq_,module,exports){
'use strict';

var clone = _dereq_('../lib/clone');
var merge = _dereq_('../lib/merge');
var extend = _dereq_('../lib/extend');
var isEqual = _dereq_('../lib/isEqual');
var WBMixin = _dereq_('../WBMixin');

var WBStateMixin = WBMixin.extend({

  'attributes': {},
  'options': {},

  'initialize': function (attributes, options) {

    var self = this;
    self.attributes = extend({}, self.defaults, attributes);
    self.options = options || {};
    self.changed = {};
  },

  'get': function (key) {
    console.warn('getters are deprecated');
    return this.attributes[key];
  },

  'set': function (key, val, options) {

    var self = this;
    if (key === null) {
      return self;
    }

    var attrs, attr;
    // Handle both `"key", value` and `{key: value}` -style arguments.
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      attrs = {};
      attrs[key] = val;
    }

    // default options are empty
    options || (options = {});

    // no need to track changes on options.silent
    if (options.silent) {
      merge(self.attributes, attr);
    }
    // For each `set` attribute, update or delete the current value.
    else {
      var changes = self.changes(attrs, options);
      self._trigger(attrs, changes, options);
    }

    return self;
  },

  'unset': function (attr, options) {
    return this.set(attr, undefined, extend({}, options, { 'unset': true }));
  },

  'clear': function (options) {
    var self = this;
    return self.set(self.defaults, options);
  },

  'changes': function (attrs, options) {

    var self = this;
    var key, val;
    var changes = [];

    var prev = clone(self.attributes, true);
    var current = self.attributes;
    self.changed = {};

    for (key in attrs) {
      val = attrs[key];
      if (!isEqual(current[key], val)) {
        changes.push(key);
      }
      if (!isEqual(prev[key], val)) {
        self.changed[key] = val;
      } else {
        delete self.changed[key];
      }

      current[key] = options.unset ? undefined : val;
    }

    return changes;
  },

  '_trigger': function (attrs, changes, options) {

    var self = this;
    var current = self.attributes;

    // if any changes found
    // & if this is an EventEmitter,
    // trigger the change events
    var attr;
    while (changes && changes.length && self.trigger) {
      attr = changes.shift();
      self.trigger('change:' + attr, self, current[attr], options);
    }
  }
});

module.exports = WBStateMixin;

},{"../WBMixin":8,"../lib/clone":14,"../lib/extend":20,"../lib/isEqual":26,"../lib/merge":27}],38:[function(_dereq_,module,exports){
'use strict';

var WBMixin = _dereq_('../WBMixin');
var WBDeferred = _dereq_('../WBDeferred');
var when = _dereq_('../lib/when');
var toArray = _dereq_('../lib/toArray');
var forEach = _dereq_('../lib/forEach');
var delay = _dereq_('../lib/delay');
var defer = _dereq_('../lib/defer');
var functions = _dereq_('../lib/functions');

var WBUtilsMixin = WBMixin.extend({

  'deferred': function () {
    var self = this;
    return new WBDeferred(self);
  },

  'when': function () {
    var self = this;
    return when.apply(self, arguments);
  },

  'defer': function (fn) {
    var self = this;
    var args = toArray(arguments);
    // default context to self
    args[1] = args[1] || this;
    // support string names of functions on self
    (typeof fn === 'string') && (args[0] = self[fn]);
    return defer.apply(null, args);
  },

  'delay': function (fn) {
    var self = this;
    var args = toArray(arguments);
    // default context to self
    args[2] = args[2] || self;
    // support string names of functions on self
    (typeof fn === 'string') && (args[0] = self[fn]);
    return delay.apply(null, args);
  },

  'forEach': function (collection, fn, context) {
    var self = this;
    // default context to self
    context = context || self;
    // support string names of functions on self
    (typeof fn === 'string') && (fn = self[fn]);
    forEach(collection, fn, context);
  },

  'functions': function (obj) {
    return functions(obj || this);
  }
});

module.exports = WBUtilsMixin;

},{"../WBDeferred":6,"../WBMixin":8,"../lib/defer":17,"../lib/delay":18,"../lib/forEach":21,"../lib/functions":23,"../lib/toArray":29,"../lib/when":30}],39:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  'ControllableMixin': _dereq_('./ControllableMixin'),
  'ObservableHashMixin': _dereq_('./ObservableHashMixin'),
  'WBBindableMixin': _dereq_('./WBBindableMixin'),
  'WBDestroyableMixin': _dereq_('./WBDestroyableMixin'),
  'WBEventsMixin': _dereq_('./WBEventsMixin'),
  'WBStateMixin': _dereq_('./WBStateMixin'),
  'WBUtilsMixin': _dereq_('./WBUtilsMixin')
};
},{"./ControllableMixin":32,"./ObservableHashMixin":33,"./WBBindableMixin":34,"./WBDestroyableMixin":35,"./WBEventsMixin":36,"./WBStateMixin":37,"./WBUtilsMixin":38}],40:[function(_dereq_,module,exports){
'use strict';

/**
  * Default configuration file.
  * Overidable in SDK constructor.
  * @module config/default
  */

module.exports = {
  /**
    * Wunderlist SDK Version
    * @type {string}
    */
  'release': '0.0.0',

  /**
    * Your Client Identification Number/String
    * @type {string}
    */
  'clientID': undefined,

  /**
    * WebSocket connection timeout (in ms)
    * @type {number}
    */
  'webSocketTimeout': 15 * 1000,

  'api': {
    'host': 'https://a.wunderlist.com/api',
  },

  'realtime': {
    'host': 'wss://socket.wunderlist.com:8443/api/v1/sync'
  }
};

},{}],41:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('wunderbits.core');
var WBDeferred = core.WBDeferred;

var _super = WBDeferred.prototype;

var RequestDeferred = WBDeferred.extend({

  'properties': {

    'loadDurationTime': undefined,
    'loadStarted': false,
    'loadStartTime': undefined,
    'latencyTime': undefined,

    'startTime': undefined,
    'url': undefined,
    'xhr': undefined,
  },

  'error': _super.fail
});

module.exports = RequestDeferred;
},{"wunderbits.core":12}],42:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('wunderbits.core');
var WBDeferred = core.WBDeferred;

var RestSocketRequestDeferred = WBDeferred.extend({

  'properties': {
    'startTime': undefined,
    'endTime': undefined,
    'requestID': undefined,
    'uri': undefined
  }
});

module.exports = RestSocketRequestDeferred;
},{"wunderbits.core":12}],43:[function(_dereq_,module,exports){
'use strict';

/**
  * Aopi health checker
  * @module helpers/HealthCheck
  * @extends module:wunderbits.core/WBSingleton
  * @requires module:wunderbits.core/WBSingleton
  */

var core = _dereq_('wunderbits.core');
var WBSingleton = core.WBSingleton;
var WBBindableMixin = core.mixins.WBBindableMixin;
var WBEventsMixin = core.mixins.WBEventsMixin;

var IOHttp = _dereq_('../io/IO');

var networkPollTime = 15 * 1000;

var HealthCheck = WBSingleton.extend({

  'mixins': [
    WBBindableMixin,
    WBEventsMixin
  ],

  'init': function (options) {

    var self = this;

    self.setupIO(options.config);
    self.startPolling();
  },

  'destroy': function () {

    var self = this;
    self.poller && clearInterval(self.poller);
  },

  'setupIO': function (config) {

    var self = this;

    if (!self.io) {
      self.io = new IOHttp({
        'config': config
      }).io;
    }
  },

  'startPolling': function () {

    var self = this;

    self.poller && clearInterval(self.poller);

    self.poller = setInterval(function () {

      self.checkApiHealth();
    }, networkPollTime);
  },

  'checkApiHealth': function () {

    var self = this;
    self.io.get('/health')
      .done(self.onHealthy, self)
      .fail(self.onUnhealthy, self);
  },

  'onHealthy': function () {

    var self = this;
    self.trigger('healthy');
  },

  'onUnhealthy': function () {

    var self = this;
    self.trigger('unhealthy');
  }
});

module.exports = HealthCheck;

},{"../io/IO":46,"wunderbits.core":12}],44:[function(_dereq_,module,exports){
(function (global){
'use strict';

/**
  * Holds reference for all important analytics platform headers.
  * @module helpers/PlatformHeaders
  * @extends module:wunderbits.core/WBSingleton
  */

var core = _dereq_('wunderbits.core');
var WBSingleton = core.WBSingleton;

var navigator = global.navigator || {};
var nodejs = global.process || {};
var userAgent = navigator.userAgent || ('node ' + nodejs.version);

var PlatformHeaders = WBSingleton.extend({
  /**
    * Precompiled platform headers.
    * @type {object}
    */
  'headers': {
    'x-client-platform': 'web',
    'x-client-product':  'wunderlist',
    'x-client-product-version': null,
    'x-client-system': userAgent,
    'x-client-system-version': 'Standard',
    'x-client-product-git-hash': null
  },

  'init': function (options) {

    var self = this;

    var config = options;
    var headers = self.headers;

    headers['x-client-product-version'] = config.release;

    var gitHash = /\[(.*)\]/.exec(config.gitHash);
    gitHash = gitHash && gitHash[1];
    headers['x-client-product-git-hash'] = gitHash || 'dev';

    if (config.testing) {
      headers['x-client-testing'] = 'true';
    }

    if (config.product) {
      headers['x-client-product'] = config.product;
    }
  }
});

module.exports = PlatformHeaders;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"wunderbits.core":12}],45:[function(_dereq_,module,exports){
'use strict';

/**
* @module helpers/URL
* @requires module:wunderbits.core/WBSingleton
*/

var core = _dereq_('wunderbits.core');
var WBSingleton = core.WBSingleton;

var URLHelper = WBSingleton.extend({

  /**
    * Compiles hash of request parameters into a valid URI component
    * @param {object} params - Hash of request parameters
    */
  'compileParams': function (params) {

    var first = true;
    var component = '';
    var value;

    for (var key in params) {
      value = encodeURIComponent(params[key]);
      component += (first ? '?' : '&') + key + '=' + encodeURIComponent(value);

      if (first) {
        first = false;
      }
    }

    return component;
  },

  /**
    * Helper for generating full URI from a host (with path) and a params hash.
    * @param {string} host - Host and path part of URI
    * @param {object} params - Hash of URI params and values.
    */
  'generateURI': function (host, params) {

    var self = this;

    return host + self.compileParams(params);
  }
});

module.exports = URLHelper;

},{"wunderbits.core":12}],46:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides http IO.
  * @module io/IO
  * @extends module:io/IOBase
  * @requires module:io/IOBase
  *
  * @example
  * var IOHttp = require('io/IO');
  *
  * var params = {
  *   'thingID': 1345
  * };
  *
  * IOHttp.get('http://www.example.com/api/endpoint', params, 'asdflkj23094802938')
  *   .done(function (response, code) {
  *     //...
  *   })
  *   .fail(function (response, code) {
  *     //...
  *   });
  */

var core = _dereq_('wunderbits.core');
var createUID = core.lib.createUID;
var WBDeferred = core.WBDeferred;
var WBBindableMixin = core.mixins.WBBindableMixin;
var WBEventsMixin = core.mixins.WBEventsMixin;

var SchemaValidator = _dereq_('../validators/SchemaValidator');
var IOBase = _dereq_('./IOBase');

var _super = IOBase.prototype;

var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:IO');

var IO = IOBase.extend({

  // make our rest IO evented
  'mixins': [
    WBBindableMixin,
    WBEventsMixin
  ],

  /**
    * @constructor
    * @alias module:io/IO
    */
  'initialize': function (options) {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.config = options.config;

    // set requests hash on instance
    self.requests = {};

    // verbs are programatically built by _super.initialize
    // need to override now
    self.wrapVerbs();
  },

  /**
    * Moves unwrapped http verbs to _ prefixed names and sets up
    * wrapped unprefixed verbs that execute through #requestWrapper
    */
  'wrapVerbs': function () {

    var self = this;
    var io = self.io;
    ['get', 'patch', 'post', 'put', 'delete'].forEach(function (verb) {
      io['_' + verb] = io[verb];
      io[verb] = self.requestWrapper.bind(self, verb);
    });
  },

  /**
    * Hash for tracking requests made by an instance of this class
    * @type {object}
    */
  'requests': {},

  /**
    * Map of token patterns for use by routes patterns
    */
  'tokens': {
    'id': '([-])?[0-9]+',
    'version': 'v(\\d)+',
    'provider': '[a-z]+'
  },

  /**
    * Map of paths patterns that should map to the 'api' host
    */
  'routes': {
    'api': []
  },

  /**
    * Map of paths patterns that do not require authorization headers
    */
  'authFreeRoutes': {
    'api': [
      'health',
      '{{version}}/oauth/{{provider}}/exchange',
      '{{version}}/signup',
      '{{version}}/authenticate',
      '{{version}}/user/password/reset'
    ]
  },

  // make relative URLs absolute
  'normalizeUrl': function (url) {

    var self = this;
    return self.config.api.host + url;
  },

  /**
    * Extend #extendHeaders to inject clientID
    */
  'extendHeaders': function (headers) {

    var self = this;

    var clientID = self.config.clientID;
    var deviceID = self.config.deviceID;
    var instanceID = self.config.instanceID;

    clientID && (headers['x-client-id'] = clientID);
    deviceID &&(headers['x-client-device-id'] = deviceID);
    instanceID && (headers['x-client-instance-id'] = instanceID);

    if (typeof self.config.extendHeaders === 'function') {
      self.config.extendHeaders(headers);
    }

    return _super.extendHeaders.apply(self, arguments);
  },

  /**
    * Adds x-access-token and x-client-id headers to api endpoints that require them.
    * @param {object} headers - current headers for the request being constructed
    * @param {string} url - url for the request being constructed
    */
  'setAuthorization': function (headers) {

    var self = this;

    var accessToken = self.config.accessToken;
    accessToken && (headers['x-access-token'] = accessToken);
  },

 /**
    * Wrapper for CRUD methods to inject supplied requestID, or auto generated requestID
    * @returns {promise} Request promise.
    * @param {string} method - HTTP method to execute
    * @param {string} path - URI or path to make request against
    * @param {object} [data] - Request body or hash of key value pairs for GET params
    * @param {string} [requestID] - User supplied requestID to be sent as a header, auto generated if omitted
    * @param {number} [timeout] - User supplied timeout in ms
    */
  'requestWrapper': function (method, path, data, requestID, timeout) {

    var self = this;
    var deferred = new WBDeferred();
    var headers = {};

    if (!requestID) {
      requestID = self.generateUID();
    }

    self.requests[requestID] = deferred;

    headers['x-client-request-id'] = requestID;

    timeout = timeout ? parseInt(timeout, 10) : 60000;

    self.io['_' + method](path, data, headers, timeout)
      .done(function (response, xhr) {

        if (Array.isArray(response)) {
          response.forEach(function (item) {

            if (item.type) {
              SchemaValidator.validateData(item, item.type);
            }
          });
        }
        else if (response && response.type) {
          SchemaValidator.validateData(response, response.type);
        }

        localConsole.log(xhr.status, path);

        // make the success state exatcly match socket success
        deferred.resolve(response, xhr.status);
      })
      .fail(function (response, xhr) {

        localConsole.error(xhr.status, xhr.statusText, path);

        // make the failure state exactly match socket failure
        deferred.reject(response, xhr.status);

        if (xhr.status === 401) {
          /**
            * Unauthorized event
            * @event module:io/IO#unauthorized
            */
          self.trigger('unauthorized');
        }
      })
      .always(function () {
        // drop reference, but keep id in hash
        self.requests[requestID] = undefined;
      });

    return deferred.promise();
  },

  /**
    * Generates unique indentifiers for proxy requests.
    * @returns {string} UID
    */
  'generateUID': function () {

    var self = this;
    var uid;

    while (!uid || !self.isUIDValid(uid)) {
      uid = createUID();
    }

    return uid;
  },

  /**
    * Checks that UID is not already used by a pending known request.
    * @param {string} uid - UID
    * @returns {boolean} - returns TRUE iff valid
    */
  'isUIDValid': function (uid) {

    return !(uid in this.requests);
  },

  'cancelInflightCreate': function (requestID, onlineID, revision) {

    var self = this;
    var request = self.requests[requestID];

    localConsole.debug('cancelling request locally', requestID, 'alive?', !!request);

    if (request) {
      self.requests[requestID] = undefined;
      var data = onlineID ? {'id': onlineID} : {};
      data.revision = revision;
      request.resolve(data, 200);
    }
  }
});

module.exports = IO;

},{"../validators/SchemaValidator":109,"./IOBase":47,"magiconsole":2,"wunderbits.core":12}],47:[function(_dereq_,module,exports){
(function (global){
'use strict';

// GENERIC BASE IO CLASS
// returns class

var core = _dereq_('wunderbits.core');
var WBClass = core.WBClass;
var WBDeferred = core.WBDeferred;
var assert = core.lib.assert;
var extend = core.lib.extend;

var AjaxTransport = _dereq_('./io/AjaxTransport');
var PlatformHeaders = _dereq_('../helpers/PlatformHeaders');

var _super = WBClass.prototype;

var absoluteUrlRegexp = /^(https?:)?\/\//;
var wlURLRegexp = /^(https?:)?\/\/\w+\.wunderlist.com\//;

module.exports = WBClass.extend({

  'initialize': function (options) {

    var self = this;
    self.config = options.config;

    AjaxTransport.maxRequests = self.config.maxHttpRequests || 5;

    _super.initialize.apply(self, arguments);

    self.io = AjaxTransport.ajax.bind(AjaxTransport);

    // create io verbs on class
    var crudOps = ['delete', 'get', 'patch', 'post', 'put'];
    for (var i=0, len=crudOps.length; i<len; i++) {
      self.defineVerb(crudOps[i]);
    }

    // compile routes for faster lookup
    self.routes = self.compileRoutes(self.routes, self.tokens);
    self.authFreeRoutes = self.compileRoutes(self.authFreeRoutes, self.tokens);
  },

  'compileRoutes': function (routes, tokens) {

    var self = this;

    // no routes defined
    if (!routes) {
      return undefined;
    }

    function markTokens (rule) {
      return rule.replace(/\{\{(\w+)\}\}/g, function (match, token) {
        return tokens[token];
      });
    }

    var compiled = {};
    for (var service in routes) {
      var rules = routes[service];
      rules = rules.map(markTokens);
      var regexp = new RegExp('^/(' + rules.join('|') + ')(\\?|$)');
      var host = self.config[service].host;
      compiled[host] = regexp;
    }

    return compiled;
  },

  // Change relative URLs to point to the correct host
  // extend is subclass
  'resolveUrl': function (url) {

    var self = this, resolved;

    // Don't touch absolute urls
    if (absoluteUrlRegexp.test(url)) {
      return url;
    }

    // if a known route
    if (self.routes) {
      resolved = self.resolveRoute(url);
    }

    // just make the url relative to the current domain
    if (!resolved) {
      resolved = self.normalizeUrl(url);
    }

    return resolved;
  },

  // resolve known routes to absolute urls
  'resolveRoute': function (route) {

    var self = this;
    for (var host in self.routes) {
      var regexp = self.routes[host];
      if (regexp.test(route)) {
        return host + route;
      }
    }
  },

  // make relative URLs absolute
  'normalizeUrl': function (url) {
    var location = global.location;
    return location.protocol + '//' + location.host + url;
  },

  // add/remove/augment headers
  // extend in subclass
  'extendHeaders': function (headers, url) {

    var self = this;

    var isAbsoluteURL = absoluteUrlRegexp.test(url);
    var isWLUrl = !isAbsoluteURL || wlURLRegexp.test(url);

    // url is used by api extendHeaders
    headers = headers || {};

    // Also add custom headers needed for client-identification
    if (isWLUrl) {
      extend(headers, PlatformHeaders.headers);
    }

    // skip auth headers for certain urls
    if (self.authFreeRoutes) {
      for (var host in self.authFreeRoutes) {
        var regexp = self.authFreeRoutes[host];
        if (regexp.test(url)) {
          return headers;
        }
      }
    }

    // Add Auth token for relative urls that need auth
    // Don't modify any existing auth headers
    if (isWLUrl && !headers.Authorization) {
      self.setAuthorization(headers, url);
    }

    return headers;
  },

  'setAuthorization': function () {
    // base class, does nothing
  },

  // Create functions for http verbs
  'defineVerb': function (type) {

    var self = this;

    self.io[type] = function (url, data, headers, timeout, context) {

      assert(url, 'need a url for ajax calls');

      headers = headers || {};
      headers = self.extendHeaders(headers, url);

      var deferred = new WBDeferred();
      var promise = deferred.promise();

      // resolve the url to an absolute url
      url = self.resolveUrl(url);

      // format the data
      if (typeof data === 'object') {
        // convert to query params for get requests
        if (type === 'get') {
          var params = [], key;
          for (key in data) {
            params.push(key + '=' + encodeURIComponent(data[key]));
          }
          params.length && (url = url + '?' + params.join('&'));
          data = undefined;
        }
        // for other methods, Serialize the data as json
        else {
          data = JSON.stringify(data);
        }
      }

      // send the request
      self.io(url, {
        'type': type.toUpperCase(),
        'data': data,
        'headers': headers,
        'success': deferred.resolve.bind(deferred),
        'error': deferred.reject.bind(deferred),
        'timeout': timeout,
        'context': context
      });

      return promise;
    };
  }
});

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../helpers/PlatformHeaders":44,"./io/AjaxTransport":49,"wunderbits.core":12}],48:[function(_dereq_,module,exports){
'use strict';

/**
  * @module io/RestSocket
  * @requires module:io/io/WebSocket
  * @requires module:helpers/URL
  * @requires module:wunderbits/lib/SafeParse
  * @requires module:wunderbits.core/lib/createUID
  * @extends module:wunderbites/WBEventEmitter
  *
  * @example
  * var IORestSocket = require('io/RestSocket');
  *
  * var params = {
  *   'thingID': 1345
  * };
  *
  * IORestSocket.get('http://www.example.com/api/endpoint', params, 'asdflkj23094802938')
  *   .done(function (response, code) {
  *     //...
  *   })
  *   .fail(function (response, code) {
  *     //...
  *   });
  */

var core = _dereq_('wunderbits.core');
var createUID = core.lib.createUID;
var extend = core.lib.extend;
var WBEventEmitter = core.WBEventEmitter;
var WBDeferred = core.WBDeferred;

var PlatformHeaders = _dereq_('../helpers/PlatformHeaders');
var RequestQueueMixin = _dereq_('./mixins/RequestQueueMixin');
var RestSocketRequestDeferred = _dereq_('../deferreds/RestSocketRequestDeferred');
var SafeParse = _dereq_('../wunderbits/lib/SafeParse');
var SchemaValidator = _dereq_('../validators/SchemaValidator');
var URLHelper = _dereq_('../helpers/URL');
var WebSocket = _dereq_('./io/WebSocket');

var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:RESTSOCKET');

var SocketRequestQueueMixin = RequestQueueMixin.extend({

  'maxRequests': 100,

  'executeRequest': function (requestData) {

    var self = this;

    var options = requestData.options;

    self.socketRequest(
      requestData.deferred,
      options.method,
      options.uri,
      options.data,
      options.requestID,
      options.requestType
    )
    .always(function executeRequestDone () {

      delete self.executingRequests[requestData.queueID];
      self.checkQueue();
    });
  }
});

var _super = WBEventEmitter.prototype;
var RestSocket = WBEventEmitter.extend({

  'mixins': [
    SocketRequestQueueMixin
  ],

  /** Default RestSocket timout duration in milliseconds (16 seconds) */
  'timeout': 60 * 1000,

  /** Holds referenece to instance of WebSocket. */
  'socket': undefined,

  /** Deferred object for getting RestSocket state */
  'ready': undefined,

  /**
    * Hash for managing inprogress WebSocket proxied REST requests
    * @type {object}
    */
  'requests': {},

  /**
    * Wunderlist API RestSocket Module.
    * Performs restful CRUD operations against the Wunderlist API over a WebSocket Proxy
    * @constructor
    * @alias module:io/RestSocket
    */
  'initialize': function (options) {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.appState = options.appState;
    self.config = options.config;

    self.ready = new WBDeferred();

    self.socket = new WebSocket(options);

    // set requests hash on instance
    self.requests = {};

    // verbs are programatically built by _super.initialize
    // need to override now
    self.wrapVerbs();

    self.pollForTimeouts();
    self.bindToSocket();
    self.ready.resolve();
  },

  'destroy': function () {

    var self = this;

    self.unbindAll();
    self.socket && self.socket.destroy();
    self.destroyed = true;
  },

  /**
    * Wrap the IO verbs
    */
  'wrapVerbs': function () {

    var self = this;

    // TODO: merge this with io.js#wrapVerbs
    // maybe move this into a mixin
    var verbs = ['get', 'post', 'put', 'patch', 'delete'];
    verbs.forEach(function (verb) {

      var fn = self[verb];
      self[verb] = function () {
        return fn.apply(self, arguments);
      };
    });
  },

  /**
    * Sets up interval timer to check for request timeouts.
    */
  'pollForTimeouts': function () {

    var self = this;

    self.timer && clearInterval(self.timer);
    self.timer = setInterval(function () {

      self.checkForRequestTimeouts();
    }, 1000);
  },

  /**
    * Close raw WebSocket connection if open.
    */
  'close': function () {

    var self = this;
    self.socket && self.socket.close();
  },

  /** Binds to WebSocket message events */
  'bindToSocket': function () {

    var self = this;
    self.bindTo(self.socket, 'open', 'onSocketConnect');
    self.bindTo(self.socket, 'message', 'onMessage');
    self.bindTo(self.socket, 'close', 'onSocketFalure');
    self.bindTo(self.socket, 'close', 'onSocketDisconnect');
    self.bindTo(self.socket, 'error', 'onSocketFalure');
  },

  /**
    * Real socket is open and ready.  Trigger a connected event.
    */
  'onSocketConnect': function (e) {

    var self = this;

    self.getSocketHealth()
      .done(function () {

        self.connected = true;
        self.trigger('connected', e);
        self.pollHealth();
      })
      .fail(self.close, self);
  },

  /**
    * Starts polling for health
    */
  'pollHealth': function () {

    var self = this;

    self.cancelPollHealth();

    self.poller = setInterval(function () {

      if (self.connected) {
        self.getSocketHealth()
          .fail(self.close, self);
      }
      else {
        self.cancelPollHealth();
      }
    }, 15000);
  },

  /**
    * Cancels the poller timer
    */
  'cancelPollHealth': function () {

    var self = this;
    self.poller && clearInterval(self.poller);
  },

  /**
    * Get the socket health state
    * @returns {promise} - A promise that resolves or rejects depending on the health
    */
  'getSocketHealth': function () {

    var self = this;

    var request = self.request(undefined, undefined, undefined, undefined, 'health')
      .done(function (resp, code) {

        localConsole.info('websocket healthy', resp || '', code);
      })
      .fail(function (resp, code) {

        localConsole.error('websocket not healthy', resp || '', code);
      });

    return request.promise();
  },

  /**
    * Real socket is closed.  Trigger a disconnected event.
    */
  'onSocketDisconnect': function (e) {

    var self = this;

    self.cancelPollHealth();
    self.connected = false;
    self.trigger('disconnected', e);
  },

  /**
    * Handles incomming messages from WebSocket
    * @param {event} e - WebSocket event
    */
  'onMessage': function (e) {

    var self = this;
    var data = SafeParse.json(e.data);
    if (data && data.headers) {
      data.headers = self.normalizeHeaders(data.headers);
    }

    var requestID = self.extractRequestIDFromHeaders(data);
    var request = requestID && self.requests[requestID];
    self.parseDataBody(data);

    switch (data.type) {
    case 'request':
      request && self.handleRequest(request, data, requestID);
      break;
    case 'health':
      request && self.handleHealthRequest(request, data, requestID);
      break;
    case 'desktop_notification':
      self.handleDesktopNotification(data);
      break;
    case 'mutation':
      self.isCorrectMutationVersion(data) && self.handleMessage(data);
      break;
    default:
      self.handleMessage(data);
    }
  },

  /**
    * Extracts the request id from the data
    * @param {object} data - the request data
    * @returns {integer} id - the request id
    */
  'extractRequestIDFromHeaders': function (data) {

    return data && data.headers && data.headers['x-client-request-id'];
  },

  /**
    * Convert body on data to a real object
    * @param {object} data - the request data
    */
  'parseDataBody': function (data) {

    data && data.body && (data.body = SafeParse.json(data.body));
  },

  /**
    * Validates realtime mutations to the correct api version
    * @param {object} mutationData - raw mutation data
    * @returns {bool}
    */
  'isCorrectMutationVersion': function (mutationData) {

    var isCorrectVersion = false;

    var type = mutationData.subject.type;
    var version = mutationData.version;

    var versionTwoEndpoints = [
      'file'
    ];

    var canBeVersionTwo = versionTwoEndpoints.indexOf(type) !== -1;
    var isVersionTwo = version === 2;
    var isVersionOne = version === 1;

    if (canBeVersionTwo && (isVersionTwo || isVersionOne)) {
      isCorrectVersion = true;
    }
    else if (isVersionOne) {
      isCorrectVersion = true;
    }

    return isCorrectVersion;
  },

  /**
    * Handles messages that correspond to requests made by this module.
    * @param {deferred} request - The request's deferred object.
    * @param {data} data - The WebSocket message JSON parsed body.
    */
  'handleRequest': function (request, data, requestID) {

    var self = this;

    request.endTime = Date.now();

    var okay = /^2/.test(data.status);
    self.logRequestTimings(okay, request, data);

    if (Array.isArray(data.body)) {
      data.body.forEach(function (item) {

        if (item.type) {
          SchemaValidator.validateData(item, item.type);
        }
      });
    }
    else if (data.body && data.body.type) {
      SchemaValidator.validateData(data.body, data.body.type);
    }

    request[okay ? 'resolve' : 'reject'](data.body, data.status);
    self.checkStillAuthorized(data.status);
    self.requests[requestID] = undefined;
  },

  /**
    * Handles health requests
    */
  'handleHealthRequest': function (request, data, requestID) {

    var self = this;

    request.endTime = Date.now();

    var okay = data.body && data.body.healthy === true;
    self.logRequestTimings(okay, request, data);
    request[okay ? 'resolve' : 'reject'](data.body, data.status);
    self.requests[requestID] = undefined;
  },

  /**
    * Handles request times
    */
  'logRequestTimings': function (okay, request, data) {

    var args = [data.status, request.uri, request.endTime - request.startTime];
    if (okay) {
      this.triggerTiming(request);
      localConsole.info.apply(localConsole, args);
    }
    else {
      localConsole.error.apply(localConsole, args);
    }
  },

  /**
    * Triggers out timings
    */
  'triggerTiming': function (requestDeferred) {

    var self = this;

    var requestTime = requestDeferred.startTime;
    requestDeferred.loadDurationTime = requestDeferred.endTime - requestTime;
    requestDeferred.latencyTime = requestDeferred.loadDurationTime;

    var timingData = {
      'start': requestTime,
      'end': requestDeferred.endTime,
      'duration': requestDeferred.loadDurationTime,
      'latency': requestDeferred.latencyTime,
      // can't find any data available on
      // websocket messages to calculate download time
      'download': undefined,
      'url': requestDeferred.uri,
      'type': 'websocket'
    };

    // trigger on self
    self.trigger('timing:io', timingData);
  },

  /**
    * Triggers unauthorized event if the response status is 401.
    * @param {Number} statusCode - HTTP Status Code
    * @fires module:io/RestSocket#unauthorized
    * @todo instance of Wunderlist class should destroy and cleanup self when unauthorized
    */
  'checkStillAuthorized': function (statusCode) {

    var unauthorized = 'unauthorized';
    if (statusCode === 401) {
      /**
        * Unauthorized event
        * @event module:io/RestSocket#unauthorized
        */
      this.trigger(unauthorized);
    }
  },

  /**
    * Handle arbitrary WebSocket messages.
    * @fires module:io/RestSocket#event
    * @fires module:io/RestSocket#someCRUDOperation
    */
  'handleMessage': function (data) {

    var self = this;

    localConsole.debug('arbitrary message', data);

    var type = data && data.subject && data.subject.type;
    type && SchemaValidator.validateData(data.data, type);

    /**
      * Socket raw changes endpoint event
      * @event module:io/RestSocket#event
      * @type {object}
      */
    self.trigger('event', data);

    var operation = data && data.operation;
    if (operation) {
      /**
        * Socket scoped changes endpoint event
        * @event module:io/RestSocket#someCRUDOperation
        * @type {object}
        */
      self.trigger(operation, data);
    }
  },

  /**
    * Handle desktop notifications.
    * @fires module:io/RestSocket#desktopNotification
    */
  'handleDesktopNotification': function (data) {

    var self = this;

    /**
      * Socket desktop notifications
      * @event module:io/RestSocket#desktopNotification
      * @type {object}
      */
    self.trigger('desktopNotification', data);
  },

  /**
    * Sets up restful proxy request to the Wunderlist API over a WebSocket
    * @param {string} method - The rest CRUD operation: POST, GET, PUT, DELETE
    * @param {string} uri - The API path to proxy to: /api/v1/settings
    * @param {object} data - Data to send with a POST or PUT.
    * @param {string} [requestID] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'request': function (method, uri, data, requestID, requestType) {

    var self = this;

    var options = {
      'method': method,
      'uri': uri,
      'data': data,
      'requestID': requestID,
      'requestType': requestType
    };

    var request = self.queueRequest(uri, options, RestSocketRequestDeferred);
    return request.promise();
  },

  /**
    * Sends out a socket request
    */
  'socketRequest': function (requestDeferred, method, uri, data, requestID, requestType) {

    var self = this;

    var socket = self.socket;

    requestID = requestID || self.generateUID();

    var headers = self.compileHeaders(requestID);

    var json = {
      'type': requestType || 'request',
      'headers': self.normalizeHeaders(headers)
    };

    method && (json.verb = method);
    uri && (json.uri = uri);

    if ((method === 'POST' || method === 'PATCH' || method === 'PUT') && data) {
      json.body = JSON.stringify(data);
    }

    // add additional request information to the request deferred object
    requestDeferred.requestID = requestID;
    requestDeferred.uri = uri;
    requestDeferred.startTime = Date.now();

    self.requests[requestID] = requestDeferred;

    // only send messages if the socket is still connected
    if (self.appState.isOnline() && self.socket.isConnected()) {
      socket.send(JSON.stringify(json));
    }
    else {
      requestDeferred.reject({
        'errors': ['no websocket connection available']
      }, 0);
    }

    return requestDeferred.promise();
  },

  /**
    * Compiles headers
    */
  'compileHeaders': function (requestID) {

    var self = this;
    var headers = {
      'x-client-request-id': requestID,
      'x-client-id': self.appState.attributes.clientID,
      'x-client-instance-id': self.appState.attributes.instanceID,
      'x-client-device-id': self.appState.attributes.deviceID,
      'content-type': 'application/json',
      'accept': 'application/json'
    };

    headers = extend(headers, PlatformHeaders.headers);

    if (self.config && (typeof self.config.extendHeaders === 'function')) {
      self.config.extendHeaders(headers);
    }

    var val;
    for (var header in headers) {
      val = headers[header];
      if (val === undefined || val === null) {
        delete headers[header];
      }
    }

    return headers;
  },

  /**
    * Normalizes headers to all lowercase
    */
  'normalizeHeaders': function (headers) {

    var normalize = {};

    for (var key in headers) {
      normalize[key.toLowerCase()] = headers[key];
    }

    return normalize;
  },

  /**
    * Wrapper for CRUD methods that calls #request when WebSocket is ready.
    * @returns {promise} Request promise.
    */
  'requestWrapper': function (method, path, data, requestId) {

    var self = this;
    var deferred = new WBDeferred();

    path = '/api' + path;

    self.ready.done(function () {

      self.request(method, path, data, requestId)
        .done(deferred.resolve.bind(deferred))
        .fail(deferred.reject.bind(deferred));
    });

    return deferred.promise();
  },

  /**
    * Cancel all request on a socket failure event (close, error)
    */
  'onSocketFalure': function () {

    var self = this;
    var request;
    for (var requestID in self.requests) {
      request = self.requests[requestID];
      request && request.reject({
        'errors': ['websocket connection lost']
      }, 0);
      self.requests[requestID] = undefined;
    }
  },

  /**
    * Check for request timeouts.
    */
  'checkForRequestTimeouts': function () {

    var self = this;
    var now = Date.now();

    for (var requestID in self.requests) {
      self.checkRequestIsTimedout(self.requests[requestID], now);
    }
  },

  /**
    * Check if a request is timedout.
    * @param {defferred} requestDeferred - Request deffered object
    * @param {number} now - The time in milliseconds
    */
  'checkRequestIsTimedout': function (requestDeferred, now) {

    var self = this;
    if (requestDeferred && now - requestDeferred.startTime >= self.timeout) {

      localConsole.error('timeout', requestDeferred.uri, now - requestDeferred.startTime);

      requestDeferred.reject({
        'errors': ['request timedout locally due to no response in ' + self.timeout]
      }, 408);
      self.requests[requestDeferred.requestID] = undefined;
    }
  },

  /**
    * Makes a DELETE proxy request over WebSocket.
    * @param {string} uri - Path to Wunderlist API endpoint.
    * @param {object} [params] - Params to send as part of delete request.
    * @param {string} [requestId] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'delete': function (uri, params, requestId) {

    var url = uri + URLHelper.compileParams(params);
    return this.requestWrapper('DELETE', url, undefined, requestId);
  },

  /**
    * Makes a GET proxy request over WebSocket.
    * @param {string} uri - Path to Wunderlist API endpoint.
    * @param {object} params - Request parameters (key value hash)
    * @param {string} [requestId] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'get': function (uri, params, requestId) {

    var url = uri + URLHelper.compileParams(params);
    return this.requestWrapper('GET', url, undefined, requestId);
  },

  /**
    * Makes a PATCH proxy request over WebSocket.
    * @param {string} uri - Path to Wunderlist API endpoint.
    * @param {object} data - Data to send.
    * @param {string} [requestId] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'patch': function (uri, data, requestId) {
    return this.requestWrapper('PATCH', uri, data, requestId);
  },

  /**
    * Makes a POST proxy request over WebSocket.
    * @param {string} uri - Path to Wunderlist API endpoint.
    * @param {object} data - Data to send.
    * @param {string} [requestId] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'post': function (uri, data, requestId) {
    return this.requestWrapper('POST', uri, data, requestId);
  },

  /**
    * Makes a PUT proxy request over WebSocket.
    * @param {string} uri - Path to Wunderlist API endpoint.
    * @param {object} data - Data to send.
    * @param {string} [requestId] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'put': function (uri, data, requestId) {

    return this.requestWrapper('PUT', uri, data, requestId);
  },

  /**
    * Generates unique indentifiers for proxy requests.
    * @returns {string} UID
    */
  'generateUID': function () {

    var self = this;
    var uid;

    while (!uid || !self.isUIDValid(uid)) {
      uid = createUID();
    }

    return uid;
  },

  /**
    * Checks that UID is not already used by a pending known request.
    * @param {string} uid - UID
    * @returns {boolean} - returns TRUE iff valid
    */
  'isUIDValid': function (uid) {
    return !(uid in this.requests);
  },

  /**
    * Cancels in-flight socket requests
    */
  'cancelInflightCreate': function (requestID, onlineID, revision) {

    var self = this;
    var request = self.requests[requestID];

    localConsole.debug('cancelling request locally', requestID, 'alive?', !!request);

    if (request) {
      self.requests[requestID] = undefined;
      var data = onlineID ? {'id': onlineID} : {};
      data.revision = revision;
      request.resolve(data, 200);
    }
  }
});

module.exports = RestSocket;

},{"../deferreds/RestSocketRequestDeferred":42,"../helpers/PlatformHeaders":44,"../helpers/URL":45,"../validators/SchemaValidator":109,"../wunderbits/lib/SafeParse":111,"./io/WebSocket":52,"./mixins/RequestQueueMixin":53,"magiconsole":2,"wunderbits.core":12}],49:[function(_dereq_,module,exports){
'use strict';

/**
  * Ajax transport that permits a maximum number of open http connections.
  * Queueing and flushing is handled automagically.
  * @module io/io/AjaxTransport
  * @extends module:wunderbits.core/WBSingleton
  * @requires module:wunderbits.core/WBSingleton
  * @requires module:wunderbits.core/WBDeferred
  * @requires module:wunderbits.core/lib/createUID
  * @requires module:helpers/URL
  * @requires module:wunderbits/lib/SafeParse
  * @requires module:io/io/NativeXMLHttpRequest
  *
  * @example
  * var ajax = require('io/io/AjaxTransport').ajax;
  * var request = ajax('http://www.example.comt/api/endpoint', {
  *   'type': 'GET',
  *   'data': {
  *     'param': 'value'
  *   },
  *   'success': function (data, xhr) {//...},
  *   'error': function (data, xhr) {//...}
  * });
  */

var core = _dereq_('wunderbits.core');
var WBSingleton = core.WBSingleton;
var WBBindableMixin = core.mixins.WBBindableMixin;
var WBEventsMixin = core.mixins.WBEventsMixin;

var urlHelper = _dereq_('../../helpers/URL');
var SafeParse = _dereq_('../../wunderbits/lib/SafeParse');
var XHR = _dereq_('./NativeXMLHttpRequest');
var RequestDeferred = _dereq_('../../deferreds/RequestDeferred');
var RequestQueueMixin = _dereq_('../mixins/RequestQueueMixin');

var AjaxRequestQueueMixin = RequestQueueMixin.extend({

  'maxRequests': 5,

  /**
  * Executes a pending request
  * @param {object} requestData - queued request data
  */
  'executeRequest': function (requestData) {

    var self = this;

    var url = requestData.url;
    var options = requestData.options;
    var deferred = requestData.deferred;

    self.executingRequests[requestData.queueID] = requestData;

    var request = self.xhrRequest(url, {

      'type': options.type,
      'data': options.data,
      'headers': options.headers,
      'timeout': options.timeout
    }, deferred);

    request
      .done(function (data, xhr) {

        self.onSuccess(data, xhr, options);
      })
      .fail(function (data, xhr) {

        self.onFailure(data, xhr, options);
      })
      .always(function () {

        delete self.executingRequests[requestData.queueID];
        self.checkQueue();
      });
  }
});

var AjaxTransport = WBSingleton.extend({

  'mixins': [
    WBBindableMixin,
    WBEventsMixin,
    AjaxRequestQueueMixin
  ],

  /**
    * Creates and sends an XMLHttpRequest
    * @param {string} url - url for the request
    * @param {object} options - request options
    * @param {string} options.type - request type/method, GET, POST, PUT, DELETE
    * @param {object} [options.data] - request data.  Automatically converted to url params for GET requests
    * @param {number} [options.timeout] - request timeout duration
    * @param {object} [options.headers] - request headers
    * @param {deferred} requestDeferred - request deferred object
    */
  'xhrRequest': function (url, options, requestDeferred) {

    var self = this;

    var async = true;
    var method = options.type;
    var data = options.data;

    // // move data to URL as params
    if (data && method === 'GET') {
      url = urlHelper.generateURI(url, data);
      // unset data so it is not used further down
      data = undefined;
    }

    // Open request
    var request = new XHR();

    // set handlers (BEFORE #OPEN)
    self.attachXhrListeners(request, requestDeferred);

    request.open(method, url, async);

    // setup timeout (AFTER #OPEN)
    if (options.timeout) {
      request.timeout = options.timeout;
    }

    // set headers (BEFORE #SEND)
    self.setupXhrHeaders(request, options.headers, data);

    requestDeferred.startTime = Date.now();

    data ? request.send(data) : request.send();

    // expose some useful things on the deferred request object:
    requestDeferred.url = url;
    requestDeferred.xhr = request;

    return requestDeferred;
  },

  /**
    * Sets up appropriate headers for an XMLHttpRequest
    * @param {XMLHttpRequest} request - XMLHttpRequest
    * @param {object} [headers] - custom headers
    * @param {object} [data] - request data, if present content-type application/json header will be set
    */
  'setupXhrHeaders': function (request, headers, data) {

    var weSpeakJSON = 'application/json; charset=utf-8';

    // set request headers
    if (headers) {
      for (var header in headers) {
        request.setRequestHeader(header.toLowerCase(), headers[header]);
      }
    }

    // Set the correct headers for content-type and accept
    // Note: these are case sensitive for the node XHR object, do not to lower them!
    if (data) {
      request.setRequestHeader('Content-Type', weSpeakJSON);
    }
    // Set accept header
    request.setRequestHeader('Accept', weSpeakJSON);
  },

  /**
    * Attaches event listeners to an XMLHttpRequest
    * @param {XMLHttpRequest} request - XMLHttpRequest
    * @param {requestDeferred} requestDeferred - request deferred
    */
  'attachXhrListeners': function (request, requestDeferred) {

    var self = this;

    // handlers
    request.addEventListener('progress', function (ev) {

      self.onXhrProgress(ev, request, requestDeferred);
    }, false);
    request.addEventListener('load', function (ev) {

      self.onXhrLoad(ev, request, requestDeferred);
    }, false);
    request.addEventListener('error', function (ev) {

      self.onXhrError(ev, request, requestDeferred);
    }, false);
    request.addEventListener('abort', function (ev) {

      self.onXhrAbort(ev, request, requestDeferred);
    }, false);
    request.addEventListener('timeout', function (ev) {

      self.onXhrTimeout(ev, request, requestDeferred);
    }, false);
  },

  /**
    * Handles rejecting or reolving request deferred
    * @param {event} ev - raw event object from XMLHttpRequest
    * @param {XMLHttpRequest} request - the originating XMLHttpRequest
    * @param {requestDeferred} requestDeferred - the request deferred object
    */
  'onXhrLoad': function (ev, request, requestDeferred) {

    var self = this;

    var isSuccess = parseInt(request.status / 100, 10) === 2;
    if (isSuccess) {
      self.triggerTiming(requestDeferred);
    }

    requestDeferred[isSuccess ? 'resolve' : 'reject'].call(requestDeferred, request.responseText, request);
  },

  'triggerTiming': function (requestDeferred) {

    var self = this;

    var now = Date.now();
    var requestTime = requestDeferred.startTime;
    var loadStart = requestDeferred.loadStartTime;
    requestDeferred.loadDurationTime = now - loadStart;
    requestDeferred.latencyTime = loadStart - requestTime;

    self.trigger('timing:io', {
      'start': requestTime,
      'end': now,
      'duration': now - requestTime,
      'latency': requestDeferred.latencyTime,
      'download': requestDeferred.loadDurationTime,
      'url': requestDeferred.url,
      'type': 'ajax'
    });
  },

  'onXhrProgress': function (ev, request, requestDeferred) {

    if (!requestDeferred.loadStarted) {
      requestDeferred.loadStartTime = Date.now();
      requestDeferred.loadStarted = true;
    }
  },

  /** Handles XMLHttpRequest error events */
  'onXhrError': function (ev, request, requestDeferred) {

    // console.log('onXhrError', ev);
    this.onXhrFail(ev, request, requestDeferred);
  },

  /** Handles XMLHttpRequest abort events */
  'onXhrAbort': function (ev, request, requestDeferred) {

    // console.log('onXhrAbort', ev);
    this.onXhrFail(ev, request, requestDeferred);
  },

  /** Handles XMLHttpRequest timeout events */
  'onXhrTimeout': function (ev, request, requestDeferred) {

    // console.log('onXhrTimeout', ev);
    this.onXhrFail(ev, request, requestDeferred);
  },

  /** Handles XMLHttpRequest failure events */
  'onXhrFail': function (ev, request, requestDeferred) {

    requestDeferred.reject(request.responseText, request);
  },

  /**
    * Main transport request method
    * @param {string} url - request url
    * @param {object} options - request options
    * @returns {deferred}
    */
  'ajax': function (url, options) {

    var self = this;
    var request = self.queueRequest(url, options, RequestDeferred);
    return request;
  },

  /** Handles successful ajax request responses */
  'onSuccess': function (data, xhr, options) {

    if (typeof data === 'string' && xhr.status !== 204) {
      data = SafeParse.json(data);
    }

    options.success && options.success(data, xhr);
  },

  /** Handles unsuccessful ajax request responses */
  'onFailure': function (data, xhr, options) {

    // this does not work with cross-domain firefox,
    // it will always return an empty string
    // yay mozilla!!
    var contentType = (xhr.getResponseHeader('content-type') || '').split(';')[0];
    if (typeof data === 'string' && (/application\/json/.test(contentType))) {
      data = SafeParse.json(xhr.responseText);
    }

    if (typeof options.error === 'function') {
      options.error(data, xhr);
    }
  }
});

module.exports = AjaxTransport;
},{"../../deferreds/RequestDeferred":41,"../../helpers/URL":45,"../../wunderbits/lib/SafeParse":111,"../mixins/RequestQueueMixin":53,"./NativeXMLHttpRequest":51,"wunderbits.core":12}],50:[function(_dereq_,module,exports){
(function (global){
'use strict';

/**
  * Returns browser WebSocket reference, or node.js WebSocket module ws
  * @module io/io/NativeWebSocket
  */

module.exports = global.WebSocket || _dereq_('ws');

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],51:[function(_dereq_,module,exports){
(function (global){
'use strict';

/**
  * Returns browser XMLHttpRequest reference, or node.js xmlhttprequest reference
  * @module io/io/NativeXMLHttpRequest
  */

module.exports = global.XMLHttpRequest || _dereq_('xmlhttprequest').XMLHttpRequest;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],52:[function(_dereq_,module,exports){
'use strict';

/**
  * @module io/io/WebSocket
  * @requires module:wunderbits.core/lib/assert
  * @requires module:wunderbits.core/WBEventEmitter
  * @requires module:helpers/URL
  * @requires module:magiconsole
  * @requires module:io/io/NativeWebSocket
  * @requires module:wunderbits/lib/bindAll
  * @extends module:wunderbits.core/WBEventEmitter
  */

var core = _dereq_('wunderbits.core');
var WBEventEmitter = core.WBEventEmitter;
var assert = core.lib.assert;

var URLHelper = _dereq_('../../helpers/URL');
var NativeWebSocket = _dereq_('./NativeWebSocket');
var bindAll = _dereq_('../../wunderbits/lib/bindAll');

var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:WEBSOCKET');

var _super = WBEventEmitter.prototype;

var WebSocketClass = WBEventEmitter.extend({

  /**
    * Was the socket connection close done by the client?
    */
  'clientClosed': false,

  'NativeWebSocketClass': NativeWebSocket,

  /** Holds reference to instance of native WebSocket */
  'socket': undefined,

  /**
    * Wunderlist API native WebSocket Module
    * @constructor
    * @alias module:io/io/WebSocket
    */
  'initialize': function (options) {

    var self = this;

    self.appState = options.appState;

    _super.initialize.apply(self, arguments);

    // TODO: remove this ugly piece of shit, we don't need more binds
    var fns = ['onSocketClose', 'onSocketError', 'onSocketMessage', 'onSocketOpen'];
    bindAll(self, fns);

    self.validateToken();
    self.connect();
    self.bindToAppState();
  },

  'destroy': function () {

    var self = this;

    self.close();
    self.unbindAll();
    self.destroyed = true;
  },

  'bindToAppState': function () {

    var self = this;

    if (self.appState) {
      self.unbindFrom(self.appState);
      self.bindTo(self.appState, 'change:online', function () {

        self[self.appState.isOnline() ? 'connect' : 'close']();
      });
    }
  },

  /** Validates that there is an access token */
  'validateToken': function () {

    assert.string(this.appState.attributes.accessToken, 'Cannot instantiate class without an auth token.');
  },

  /** Connects to Wunderlist API WebSocket */
  'connect': function () {

    var self = this;

    // close any prexising sockets
    self.socket && self.close();

    self.clientClosed = false;
    self.clearSocketTimeout();

    var config = self.appState.attributes;

    var params = {
      'client_id': config.clientID,
      'access_token': config.accessToken,
      'client_device_id': config.deviceID,
      'client_instance_id': config.instanceID
    };

    var host = self.appState.attributes.realtime.host;
    var url = URLHelper.generateURI(host, params);

    var NativeWebSocketClass = self.NativeWebSocketClass;
    self.socket = new NativeWebSocketClass(url);
    self.bindToSocket();
  },

  /**
    * Is the web socket really connected?
    */
  'isConnected': function () {

    var socket = this.socket;
    return !!(socket && socket.readyState === 1);
  },

  /**
    * Sends a message to the Wunderlist API through connected WebSocket
    * @param {string} message - Message to send.
    */
  'send': function (message) {

    this.socket.send(message);
  },

  /**
    * Close WebSocket connection if open.
    */
  'close': function () {

    var self = this;
    self.clientClosed = true;
    if (self.socket) {
      self.socket.close();
      self.socket = undefined;
    }
  },

  /** Binds to native WebSocket events: close, error, message, open */
  'bindToSocket': function () {

    var self = this;
    var socket = self.socket;

    socket.addEventListener('close', self.onSocketClose);
    socket.addEventListener('error', self.onSocketError);
    socket.addEventListener('message', self.onSocketMessage);
    socket.addEventListener('open', self.onSocketOpen);

    self.trackTimeout();
  },

  /**
    * Timout pending socket connection after _timeout duration.
    */
  'trackTimeout': function () {

    var self = this;
    var timeout = self.appState.attributes.webSocketTimeout;

    var start = Date.now();

    var socketTimeoutLoop = function () {

      if (self.socket && self.socket.readyState === 0) {
        if (Date.now() - start < timeout) {
          self.socketTimeout = setTimeout(socketTimeoutLoop, 1000);
        }
        else {
          self.onSocketTimeout();
          if (self.socket) {
            self.socket.close();
            self.socket = undefined;
          }
        }
      }
    };
    socketTimeoutLoop();
  },

  /**
    * Clear socketTimeout timer
    */
  'clearSocketTimeout': function () {

    var self = this;
    self.socketTimeout && clearTimeout(self.socketTimeout);
  },

  /**
    * @fires module:WebSocket#timeout
    */
  'onSocketTimeout': function (ms) {

    var self = this;

    self.clearSocketTimeout();
    localConsole.error('timeout', ms);
    /**
      * @event module:io/io/WebSocket#timeout
      */
    self.trigger('timeout');
  },

  /**
    * @fires module:WebSocket#error
    */
  'onSocketError': function (e) {

    var self = this;

    self.clearSocketTimeout();
    localConsole.error('error', e);
    /**
      * @event module:io/io/WebSocket#error
      * @type {event}
      */
    self.trigger('error', e);
  },

  /**
    * @fires module:WebSocket#open
    */
  'onSocketOpen': function (e) {

    var self = this;

    localConsole.info('opened', e);
    /**
      * @event module:io/io/WebSocket#open
      * @type {event}
      */
    self.trigger('open', e);
  },

  /**
    * @fires module:WebSocket#close
    */
  'onSocketClose': function (e) {

    var self = this;

    self.clearSocketTimeout();
    self.socket = undefined;
    localConsole.info('closed', e);
    /**
      * @event module:io/io/WebSocket#close
      * @type {event}
      */
    self.trigger('close', e);

    /**
      * @todo REMOVE THIS, THIS IS A HACK WHILE PLAY FRAMEWORK IS BROKEN
      */
    if (!self.clientClosed && self.appState.isOnline()) {

      setTimeout(function () {

        !self.destroyed && self.connect();
      }, 1000);
    }
  },

  /**
    * @fires module:WebSocket#message
    */
  'onSocketMessage': function (e) {

    var self = this;
    /**
      * @event module:io/io/WebSocket#message
      * @type {event}
      */
    self.trigger('message', e);
  }
});

module.exports = WebSocketClass;

},{"../../helpers/URL":45,"../../wunderbits/lib/bindAll":112,"./NativeWebSocket":50,"magiconsole":2,"wunderbits.core":12}],53:[function(_dereq_,module,exports){
'use strict';

/**
  * Request queue mixin for throttling http and rest socket requests
  * @module io/mixins/RequestQueueMixin
  * @extends wunderbits/WBMixin
  * @requires validators/SchemaValidator
  */

var core = _dereq_('wunderbits.core');
var createUID = core.lib.createUID;
var WBMixin = core.WBMixin;

module.exports = WBMixin.extend({

  /**
    * Maximum number of open ajax requests.
    * @type {number}
    */
  'maxRequests': 5,

  /**
    * Queue of pending ajax requests
    * @type {array}
    */
  'requestsQueue': [],

  /**
    * Hash of currently executing ajax requests
    * @type {object}
    */
  'executingRequests': {},

  /** Resets queues*/
  'reset': function () {

    var self = this;
    self.requestsQueue = [];
    self.executingRequests = {};
  },

  /** Checks request queue for pending requests and flushes if allowed*/
  'checkQueue': function () {

    var self = this;
    var requests = Object.keys(self.executingRequests).length;
    var requestData;

    if (requests < self.maxRequests) {
      requestData = self.requestsQueue.shift();
      requestData && self.executeRequest(requestData);
    }
  },

  /**
    * Queues a request and creates request's deffered object.
    * @param {string} url - request URL
    * @param {object} options - request options
    * @param {constructor} RequestDeferredClass - request deferred contructor
    * @returns {deferred}
    */
  'queueRequest': function (url, options, RequestDeferredClass) {

    var self = this;
    var deferred = new RequestDeferredClass();

    self.requestsQueue.push({

      'deferred': deferred,
      'url': url,
      'options': options,
      'queueID': createUID()
    });

    self.checkQueue();

    return deferred;
  },

  'executeRequest': function (requestData) {

    throw new Error('You must override RequestQueueMixin#executeRequest!', requestData);

    // // Example from AjaxTransport#executeRequest
    // var self = this;

    // var url = requestData.url;
    // var options = requestData.options;
    // var deferred = requestData.deferred;

    // self.executingRequests[requestData.queueID] = requestData;

    // var request = self.xhrRequest(url, {

    //   'type': options.type,
    //   'data': options.data,
    //   'headers': options.headers,
    //   'timeout': options.timeout
    // }, deferred);

    // request
    //   .done(function (data, xhr) {

    //     self.onSuccess(data, xhr, options);
    //   })
    //   .fail(function (data, xhr) {

    //     self.onFailure(data, xhr, options);
    //   })
    //   .always(function () {

    //     delete self.executingRequests[requestData.queueID];
    //     self.checkQueue();
    //   });
  }
});

},{"wunderbits.core":12}],54:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('wunderbits.core');
var WBDeferred = core.WBDeferred;
var WBStateModel = core.WBStateModel;
var clone = core.lib.clone;
var WBOnlineStatus = _dereq_('../wunderbits/WBOnlineStatus');

var _super = WBStateModel.prototype;
var ApplicationState = WBStateModel.extend({

  'defaults': {
    'api': {
      'host': 'https://a.wunderlist.com/api',
    },
    'realtime': {
      'host': 'wss://socket.wunderlist.com:8443/api/v1/sync'
    },
    'accessToken': undefined,
    'clientID': undefined,
    'debug': false,
    'online': true,
    'webSocketTimeout': 15 * 1000,
    'maxHttpRequests': 5,
    'checkHealth': true
  },

  'initialize': function () {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.initialized = new WBDeferred();

    setTimeout(function () {

      if (self.destroyed) {
        return;
      }

      // Hack until wb.core is updated with correct initialize chains
      self.watchOnlineState();
      self.initialized.resolve();
    });
  },

  'destroy': function () {

    var self = this;

    self.onlineState && self.onlineState.destroy();
    _super.destroy.apply(self, arguments);
  },

  'watchOnlineState': function () {

    var self = this;

    if (self.onlineState) {
      self.unbindFrom(self.onlineState);
      self.onlineState.destroy();
    }

    self.onlineState = new WBOnlineStatus({
      'config': self.toJSON()
    });

    self.set('online', self.onlineState.isOnline());

    self.bindTo(self.onlineState, 'online', 'onOnline');
    self.bindTo(self.onlineState, 'offline', 'onOffline');
  },

  'onOnline': function () {

    this.set('online', true);
  },

  'onOffline': function () {

    this.set('online', false);
  },

  'isOnline': function () {

    return !!this.attributes.online;
  },

  'toJSON': function () {

    return clone(this.attributes);
  }
});

module.exports = ApplicationState;
},{"../wunderbits/WBOnlineStatus":110,"wunderbits.core":12}],55:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('wunderbits.core');
var clone = core.lib.clone;
var extend = core.lib.extend;

var SchemaTypes = _dereq_('./SchemaTypes');

module.exports = {
  'id': SchemaTypes.id,
  'task_id': SchemaTypes.id,
  'list_id': SchemaTypes.id,
  'user_id': SchemaTypes.id,

  'revision': SchemaTypes.int,
  'type': SchemaTypes.str,

  'created_at': SchemaTypes.ISODate,
  'updated_at': SchemaTypes.ISODate,

  'extend': function (obj) {
    return extend(clone(this), obj);
  }
};

},{"./SchemaTypes":63,"wunderbits.core":12}],56:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');

module.exports = {
  'id': SchemaTypes.id,
  'title': SchemaTypes.str,
  'list_ids': SchemaTypes.arr,
  'user_id': SchemaTypes.id,
  'created_at': SchemaTypes.ISODate,
  'updated_at': SchemaTypes.ISODate,
  'revision': SchemaTypes.int,
  'type': SchemaTypes.str
};
},{"./SchemaTypes":63}],57:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'created_by_id': SchemaTypes.id,
  'list_type': SchemaTypes.str,
  'title': SchemaTypes.str
});

},{"./BaseSchema":55,"./SchemaTypes":63}],58:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'sender_id': SchemaTypes.id,
  'state': SchemaTypes.str,
  'owner': SchemaTypes.bool,
});

},{"./BaseSchema":55,"./SchemaTypes":63}],59:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'content': SchemaTypes.str
});

},{"./BaseSchema":55,"./SchemaTypes":63}],60:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');

module.exports = {
  'id': SchemaTypes.id
};

},{"./SchemaTypes":63}],61:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'values': SchemaTypes.arr
});

},{"./BaseSchema":55,"./SchemaTypes":63}],62:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'date': SchemaTypes.ISODate
});

},{"./BaseSchema":55,"./SchemaTypes":63}],63:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  'id': 'integer',
  'int': 'integer',
  'bool': 'boolean',
  'arr': 'array',
  'str': 'string',
  'ISODate': 'ISODate'
};

},{}],64:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'user_id': SchemaTypes.id,
  'provider_id': SchemaTypes.str,
  'provider_type': SchemaTypes.str
});

},{"./BaseSchema":55,"./SchemaTypes":63}],65:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'key': SchemaTypes.str,
  'value': SchemaTypes.str
});

},{"./BaseSchema":55,"./SchemaTypes":63}],66:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'completed': SchemaTypes.bool,
  'completed_at': SchemaTypes.ISODate,
  'completed_by_id': SchemaTypes.id,

  'created_by_id': SchemaTypes.id,
  'title': SchemaTypes.str
});

},{"./BaseSchema":55,"./SchemaTypes":63}],67:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'assignee_id': SchemaTypes.id,

  'completed': SchemaTypes.bool,
  'completed_at': SchemaTypes.ISODate,
  'completed_by_id': SchemaTypes.id,

  'created_by_id': SchemaTypes.id,

  'due_date': SchemaTypes.ISODate,

  'starred': SchemaTypes.bool,

  'title': SchemaTypes.str
});

},{"./BaseSchema":55,"./SchemaTypes":63}],68:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'read': SchemaTypes.bool,
  'text': SchemaTypes.str
});

},{"./BaseSchema":55,"./SchemaTypes":63}],69:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');

module.exports = {
  'id': SchemaTypes.id,
  'name': SchemaTypes.str,
  'organization_id': SchemaTypes.id,
  'created_at': SchemaTypes.ISODate,
  'updated_at': SchemaTypes.ISODate,
  'revision': SchemaTypes.int,
  'team_type': SchemaTypes.str,
  'type': SchemaTypes.str
};

},{"./SchemaTypes":63}],70:[function(_dereq_,module,exports){
'use strict';

var SchemaTypes = _dereq_('./SchemaTypes');
var BaseSchema = _dereq_('./BaseSchema');

module.exports = BaseSchema.extend({
  'name': SchemaTypes.str,
  'email': SchemaTypes.str,
  'pro': SchemaTypes.bool
});

},{"./BaseSchema":55,"./SchemaTypes":63}],71:[function(_dereq_,module,exports){
'use strict';

var PositionSchema = _dereq_('./Position');

module.exports = {
  'list': _dereq_('./List'),
  'folder': _dereq_('./Folder'),
  'membership': _dereq_('./Membership'),
  'note': _dereq_('./Note'),
  'reminder': _dereq_('./Reminder'),
  'setting': _dereq_('./Setting'),
  'service': _dereq_('./Service'),
  'subtask': _dereq_('./Subtask'),
  'task': _dereq_('./Task'),
  'task_comment': _dereq_('./TaskComment'),
  'user': _dereq_('./User'),
  'team': _dereq_('./Team'),
  'organization': _dereq_('./Organization'),
  'list_position': PositionSchema,
  'subtask_position': PositionSchema,
  'task_position': PositionSchema
};
},{"./Folder":56,"./List":57,"./Membership":58,"./Note":59,"./Organization":60,"./Position":61,"./Reminder":62,"./Service":64,"./Setting":65,"./Subtask":66,"./Task":67,"./TaskComment":68,"./Team":69,"./User":70}],72:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides access to HTML string last 100 activities
  * @module services/Activities
  * @extends module:services/Conversations
  * @requires module:services/Conversations

  * @example <caption>Get HTML page with 100 latest activities</caption>
    var ActivitiesService = require('services/Activities');
    var activities = new ActivitiesService();
    activities.all({
        'style': 'desktop',
        'tz_offset': -8
      })
      .done(function (data, statusCode) {
        console.log(data.html);
      })
      .fail(function () {
        // ...
      });
  */

var ConversationsService = _dereq_('./Conversations');

module.exports = ConversationsService.extend({
  'baseUrl': '/activities',
  'type': 'activities'
});

},{"./Conversations":74}],73:[function(_dereq_,module,exports){
'use strict';

/**
  * @module services/AuthenticatedService
  * @extends module:services/Service
  * @requires module:services/Service
  */

var core = _dereq_('wunderbits.core');
var assert = core.lib.assert;

var BaseService = _dereq_('./Service');

var _super = BaseService.prototype;

module.exports = BaseService.extend({

  /**
    * Base class for Wunderlist API service modules that require authentication.
    * @constructor
    * @alias module:services/AuthenticatedService
    */
  'initialize': function () {
    var self = this;
    _super.initialize.apply(self, arguments);
    self.validateAccessParams();
  },

  /**
    * Checks that clientID and accessToken are available
    */
  'validateAccessParams': function () {

    var self = this;
    var config = self.appState.attributes;
    assert.string(config.clientID, 'This service requires a client ID.');
    assert.string(config.accessToken, 'This service requires an access token.');
  }
});

},{"./Service":93,"wunderbits.core":12}],74:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides access to HTML string last 100 conversations
  * @module services/Conversations
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Get HTML page with 100 latest conversations</caption>
    var Conversations = require('services/Conversations');
    var conversations = new ConversationsService();
    conversations.all({
        'style': 'desktop',
        'tz_offset': -8
      })
      .done(function (data, statusCode) {
        console.log(data.html);
      })
      .fail(function () {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/conversations',
  'type': 'conversations',

  'all': function (params, requestID) {

    var self = this;
    return self.get(self.baseUrl, params, requestID).promise();
  }
});

},{"./AuthenticatedService":73}],75:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides access to the export service
  * @module services/Export
  * @extends module:services/ServiceGetOnly
  * @requires module:services/ServiceGetOnly
  */

var ServiceGetOnly = _dereq_('./ServiceGetOnly');

module.exports = ServiceGetOnly.extend({

  'baseUrl': '/export',
  'type': 'export',

  'all': function (requestID) {

    var self = this;
    return self.get(self.baseUrl, undefined, requestID, 300000).promise();
  }
});

},{"./ServiceGetOnly":94}],76:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides access to user's features
  * @module services/Features
  * @extends module:services/ServiceGetOnly
  * @requires module:services/ServiceGetOnly
  */

var ServiceGetOnly = _dereq_('./ServiceGetOnly');

module.exports = ServiceGetOnly.extend({

  'baseUrl': '/features',

  'type': 'feature'
});

},{"./ServiceGetOnly":94}],77:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to files data.
  * @module services/Files
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Files service</caption>
    var FilesService = require('services/Files');
    var files = new FilesService();

  * @example <caption>Get files for a task</caption>
    var taskID = 78987;
    files.forTask(taskID)
      .done(function (filesData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get files for a list</caption>
    var listID = 87987;
    files.forList(listID)
      .done(function (filesData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific file</caption>
    var fileID = 34958737;
    files.getID(fileID)
      .done(function (fileData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a file</caption>
    var fileData = {
      'upload_id': 458748574,
      'task_id': 4958,
      'file_name': 'awesome file.zip'
    };
    notes.create(noteData)
      .done(function (noteData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a file</caption>
    var fileID = 3487348374;
    var revision = 45;
    notes.deleteID(fileID, revision)
      .always(function (resp, statusCode) {
        // ...
      });
  */

var core = _dereq_('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:FILES');

var AuthenticatedService = _dereq_('./AuthenticatedService');
var _super = AuthenticatedService.prototype;

module.exports = AuthenticatedService.extend({

  'apiVersion': 2,
  'baseUrl': '/files',
  'type': 'file',

  'create': function (data, requestID) {

    var self = this;

    try {
      self.validateCreateData(data);
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    var request = _super.create.call(self, data, requestID);
    return request.promise();
  },

  'validateCreateData': function (data) {

    data = data || {};

    var hasData = Object.keys(data).length;
    var required = ' required for file creation';
    assert(hasData, 'data' + required);
    assert.number(data.task_id, 'data.task_id' + required);
  }
});

},{"./AuthenticatedService":73,"magiconsole":2,"wunderbits.core":12}],78:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides access for fetching the user's ical feed url
  * @module services/Products
  * @extends module:services/ServiceGetOnly
  * @requires module:services/ServiceGetOnly
  */

var ServiceGetOnly = _dereq_('./ServiceGetOnly');

module.exports = ServiceGetOnly.extend({

  'baseUrl': '/ical/feed',
  'type': 'ical_feed',

  'getURL': function (requestID) {

    var self = this;
    return self.get(self.baseUrl, undefined, requestID).promise();
  }
});

},{"./ServiceGetOnly":94}],79:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to the import endpoint.
  * @module services/Import
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/import',
  'type': 'import',

  'create': function (data, requestID) {

    var self = this;
    return self.post(self.baseUrl, data, requestID, 300000).promise();
  }
});

},{"./AuthenticatedService":73}],80:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to list positions.
  * @module services/ListPositions
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the ListPositions service</caption>
    var ListPositionsService = require('services/ListPositions');
    var listPositions = new ListPositionsService();


  * @example <caption>Get all list positions</caption>
    var ListPositions = require('services/ListPositions');
    var listPositions = new ListPositions();
    listPositions.all()
      .done(function (listPositions, statusCode) {
        //...
      })
      .fail(function (resp, code) {
        //...
      });

  * @example <caption>Update a lists positions object</caption>
    var listPositionsID = 678;
    var listPositionsRevision = 6;
    var updateData = {
      'values': [123,345,567]
    };
    listPositions.update(listPositionsID, listPositionsRevision, updateData)
      .done(function (listPositionsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */


var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/list_positions',
  'type': 'list_position'
});

},{"./AuthenticatedService":73}],81:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to users data.
  * @module services/Users
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Users service</caption>
    var UsersService = require('services/Users');
    var users = new UsersService();

  * @example <caption>Fetch the users this logged in user can access</caption>
    users.all()
      .done(function (usersData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/list_reminders_collections',
  'type': 'list_reminders_collection'
});

},{"./AuthenticatedService":73}],82:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to list data.
  * @module services/Lists
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Lists service</caption>
    var ListsService = require('services/Lists');
    var lists = new ListsService();

  * @example <caption>Get all lists for a user_id</caption>
    var userID = 984587;
    lists.forUser(listID)
      .done(function (listData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific list</caption>
    vat listID = 777;
    lists.getID(listID)
      .done(function (listData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a list</caption>
    lists.create({
      'title': 'Bad Movies'
    })
    .done(function (listData, statusCode) {
      // ...
    })
    .fail(function (resp, code) {
      // ...
    });

  * @example <caption>Update a list</caption>
    var listID = 777;
    var listRevision = 5;
    var updateData = {
      'title': 'Good Bad Movies',
    };

    lists.update(listID, listRevision, updateData)
      .done(function (listData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a list</caption>
    var listID = 777;
    var listRevision = 5;
    lists.deleteID(listID, listRevision)
      .always(function (resp, code) {
        // ...
      });
  */

var core = _dereq_('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:LISTS');

var MembershipsService = _dereq_('./Memberships');
var AuthenticatedService = _dereq_('./AuthenticatedService');

var _super = AuthenticatedService.prototype;
module.exports = AuthenticatedService.extend({

  'baseUrl': '/lists',

  'type': 'list',


  'initialize': function (options) {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.membershipsService = new MembershipsService(options);
  },

  /**
    * Create a list.
    * @param {object} data - List creation data.
    * @param {string} data.title - List title.
    * @param {string} [requestID] - User supplied Request ID. Autogenerated if not supplied.
    * @returns {promise} Promise of request deferred.
    */
  'create': function (data) {

    var self = this;
    try {
      self.validateCreateData(data);
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    var request = _super.create.apply(self, arguments);
    return request.promise();
  },

  /**
    * Returns current user's accepted lists only
    */
  'accepted': function () {

    var self = this;
    var deferred = new WBDeferred();

    self.membershipsService.mine()
      .done(function (myMemberships) {

        var acceptedMemberships = myMemberships.filter(function (membership) {

          return membership.state === 'accepted';
        });

        var acceptedIDs = acceptedMemberships.map(function (acceptedMembership) {

          return acceptedMembership.list_id;
        });

        self.all()
          .done(function (allLists) {

            var myLists = allLists.filter(function (list) {

              return acceptedIDs.indexOf(list.id) > -1;
            });

            deferred.resolve(myLists);
          })
          .fail(deferred.reject, deferred);
      })
      .fail(deferred.reject, deferred);

    return deferred.promise();
  },

  /**
    * Validates subtask creation data.
    * @param {object} data - Subtask data.
    */
  'validateCreateData': function (data) {

    data = data || {};
    assert(data.title, 'Title is required for list creation.');
  }
});

},{"./AuthenticatedService":73,"./Memberships":83,"magiconsole":2,"wunderbits.core":12}],83:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to memberships data.
  * @module services/Memberships
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Memberships service</caption>
    var MembershipsService = require('services/Memberships');
    var memberships = new MembershipsService();

  * @example <caption>Get all memberships for a user</caption>
    var userID = 5687;
    memberships.forUser(userID)
      .done(function (memberhipsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get all memberships for a list</caption>
    var listID = 56879;
    memberships.forList(listID)
      .done(function (memberhipsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Invite a user to a list</caption>
    var membershipData = {
      'list_id': 5687,
      'user_id': 4340598
    };
    memberships.create(membershipData)
      .done(function (newMembership, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Invite an email address to a list</caption>
    var membershipData = {
      'email': 'TheDarkKnight@arkham.asylum',
      'user_id': 4340598
    };
    memberships.create(membershipData)
      .done(function (newMembership, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Accept a pending membership</caption>
    var membershipID = 569859;
    var membershipRevision = 0;
    var acceptData = {
      'state': 'accepted'
    };
    memberships.update(membershipID, membershipRevision, acceptData)
      .done(function (membershipData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a membership</caption>
    var membershipID = 569859;
    var membershipRevision = 0;
    memberships.delete(membershipID, membershipRevision)
      .done(function (data, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var core = _dereq_('wunderbits.core');
var WBDeferred = core.WBDeferred;

var UserService = _dereq_('./User');
var AuthenticatedService = _dereq_('./AuthenticatedService');

var _super = AuthenticatedService.prototype;
module.exports = AuthenticatedService.extend({
  'baseUrl': '/memberships',
  'type': 'membership',

  'initialize': function (options) {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.userService = new UserService(options);
  },

  'mine': function () {

    var self = this;
    var deferred = new WBDeferred();

    self.userService.all()
      .done(function (userData) {

        self.forUser(userData.id)
          .done(deferred.resolve, deferred)
          .fail(deferred.reject, deferred);
      })
      .fail(deferred.reject, deferred);

    return deferred.promise();
  }
});

},{"./AuthenticatedService":73,"./User":106,"wunderbits.core":12}],84:[function(_dereq_,module,exports){
'use strict';

/**
  * Base mixin for service mixins.
  * @module services/Mixins/BaseServiceMixin
  * @extends wunderbits/WBMixin
  * @requires validators/SchemaValidator
  */

var core = _dereq_('wunderbits.core');
var WBMixin = core.WBMixin;

var SchemaValidator = _dereq_('../../validators/SchemaValidator');

module.exports = WBMixin.extend({
  /**
    * Passes data to be sent to the API through validators/SchemaValidator to validate data attribute types
    * @param {object} data - hash of key value pairs to be sent as part of request
    * @param {string} type - the type of the data e.g. 'task', 'note', etc.
    */
  'validateData': function (data, type) {
    SchemaValidator.validateData(data, type);
  }
});

},{"../../validators/SchemaValidator":109,"wunderbits.core":12}],85:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides convenience method for creating resources
  * @module services/Mixin/ServiceCreate
  * @requires module:wunderbits/WBMixin
  * @extends module:wunderbits/WBMixin
  */

var core = _dereq_('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:CREATE');

var BaseServiceMixin = _dereq_('./BaseServiceMixin');

module.exports = BaseServiceMixin.extend({

  /**
    * Creates a new resource instance view the type's baseURL
    * @param {object} data - Data for the thing being created
    * @param {string} [requestID] - Optional client supplied request id
    *                               (will be auto generated otherwise)
    * @returns {deferred} request - Request deferred object.
    */
  'create': function (data, requestID) {

    var self = this;

    var hasData = data && Object.keys(data).length;

    try {
      assert(hasData, 'Creation requires data.');
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    data = self.cleanCreateData(data);

    try {
      self.validateData(data, self.type);
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    return self.post(self.baseUrl, data, requestID);
  },

  'cleanCreateData': function (data) {

    for (var key in data) {
      if (data[key] === null || data[key] === undefined) {
        delete data[key];
      }
    }

    return data;
  }
});

},{"./BaseServiceMixin":84,"magiconsole":2,"wunderbits.core":12}],86:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides convenience delete methods for working with Wunderlist API endpoints.
  * @module services/Mixin/ServiceDelete
  * @requires module:helpers/URL
  * @requires module:wunderbits/WBMixin
  * @extends module:wunderbits/WBMixin
  */

var core = _dereq_('wunderbits.core');
var WBMixin = core.WBMixin;
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:DELETE');

var URLHelper = _dereq_('../../helpers/URL');

module.exports = WBMixin.extend({

  /**
    * Deletes an id from a resource path.
    * @param {number} id - Id of the thing to delete.
    * @param {number} revision - Current locally stored revision of the thing to delete.
    * @param {string} [requestID] - Client supplied request ID
    */
  'deleteID': function (id, revision, requestID) {

    try {
      assert.number(id, 'Deletion requires an id.');
      assert.number(revision, 'Deletion requires a revision.');
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    var params = {
      'revision': revision
    };

    var paramString = URLHelper.compileParams(params);

    var self = this;
    return self['delete'](self.baseUrl + '/' + id + paramString, undefined, requestID);
  }
});

},{"../../helpers/URL":45,"magiconsole":2,"wunderbits.core":12}],87:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides convenience methods for working with Wunderlist API endpoints.
  * @module services/Mixin/ServiceGet
  * @requires module:wunderbits/WBMixin
  * @extends module:wunderbits/WBMixin
  */

var core = _dereq_('wunderbits.core');
var WBMixin = core.WBMixin;

module.exports = WBMixin.extend({

  /**
    * Performs a GET using the id as part of the URI
    * @param {number} id - the id being fetched
    * @param {string} [requestID] - Client supplied request ID
    */
  'getID': function (id, requestID) {

    var self = this;
    return self.get(self.baseUrl + '/' + id, undefined, requestID);
  },

  /**
    * Performs a GET using an arbitrary attribute and its id as params (?attribute=id)
    * @param {string} url
    * @param {string} attribute - the attribute
    * @param {number|string} value - the attribute value
    * @param {string} [requestID] - Client supplied request ID
    */
  'getItemsForAttribute': function (url, attribute, value, requestID) {

    var self = this;
    var data = {};

    data[attribute] = value;

    return self.get(url, data, requestID).promise();
  },

  /**
    * Performs a GET for a user ID on the resource.
    * @param {number} userId - The user id.
    * @param {string} [requestID] - Client supplied request ID
    */
  'forUser': function (userId, requestID) {

    var self = this;
    return self.getItemsForAttribute(self.baseUrl, 'user_id', userId, requestID);
  },

  /**
    * Performs a GET for a task ID on the resource.
    * @param {number} taskId - The task ID.
    * @param {string} [requestID] - Client supplied request ID
    */
  'forTask': function (taskId, requestID) {

    var self = this;
    return self.getItemsForAttribute(self.baseUrl, 'task_id', taskId, requestID);
  },

  /**
    * Performs a GET for a list ID on the resource.
    * @param {number} listId - The list ID.
    * @param {string} [requestID] - Client supplied request ID
    */
  'forList': function (listId, requestID) {

    var self = this;
    return self.getItemsForAttribute(self.baseUrl, 'list_id', listId, requestID);
  },

  /**
    * Perform a GET for all data for a resource without any params.
    * @param {string} [requestID] - Client supplied request ID
    */
  'all': function (requestID) {

    var self = this;
    return self.get(self.baseUrl, undefined, requestID).promise();
  },

  /**
    * Perform a GET for all data for a resource for all lists
    * @param {string} [requestID] - Client supplied request ID
    */
  'forAllLists': function (requestID) {

    var self = this;
    return self.get(self.baseUrl + '/lists', undefined, requestID);
  },

  /**
    * Perform a GET for all data for a resource for all tasks scoped to a list id
    * @param {number} listId - The list ID.
    * @param {string} [requestID] - Client supplied request ID
    */
  'forAllTasksForList': function (listId, requestID) {

    var self = this;
    return self.getItemsForAttribute(self.baseUrl + '/tasks', 'list_id', listId, requestID);
  }
});

},{"wunderbits.core":12}],88:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides update convenience methods for working with Wunderlist API endpoints.
  * @module services/Mixin/ServiceUpdate
  * @requires module:helpers/URL
  * @requires module:wunderbits/WBMixin
  * @extends module:wunderbits/WBMixin
  */

var core = _dereq_('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:UPDATE');

var BaseServiceMixin = _dereq_('./BaseServiceMixin');

module.exports = BaseServiceMixin.extend({

  /**
    * Convenience method for sending resource updates.
    * Handles converting nulls and undefineds to a remove hash.
    * @param {number} id - Id of the thing to update.
    * @param {number} revision - Last known revision of the thing to update.
    * @param {object} updateData - The updates to send to the server.
    * @param {string} [requestID] - Client supplied request ID
    */
  'update': function (id, revision, updateData, requestID) {

    var self = this;
    var hasData = updateData && Object.keys(updateData).length;

    try {
      assert.number(id, 'Updating a resource requires an id of type number.');
      assert.number(revision, 'Updating a resource requires a revision of type number.');
      assert(hasData, 'Updating a resource requires data to be sent.');
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0);
    }

    updateData.revision = revision;

    self.validateData(updateData, self.type);

    updateData = self.prepareDataForPatch(updateData);

    return self.patch(self.baseUrl + '/' + id, updateData, requestID);
  },

  /**
    * Iterates updateData for null and undefined keys and moves them to the remove array.
    * @param {object} updateDate - The update data.
    */
  'prepareDataForPatch': function (updateData) {

    var removals = [];
    var value;

    for (var key in updateData) {
      value = updateData[key];
      if (value === null || value === undefined) {
        removals.push(key);
        delete updateData[key];
      }
    }

    if (removals.length) {
      updateData.remove = removals;
    }
    return updateData;
  }
});

},{"./BaseServiceMixin":84,"magiconsole":2,"wunderbits.core":12}],89:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to note data.
  * @module services/Notes
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Notes service</caption>
    var NotesService = require('services/Notes');
    var notes = new NotesService();

  * @example <caption>Get notes for a task</caption>
    var taskID = 78987;
    notes.forTask(taskID)
      .done(function (notesData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get notes for a list</caption>
    var listID = 87987;
    notes.forList(listID)
      .done(function (notesData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific note</caption>
    var noteID = 34958737;
    notes.getID(noteID)
      .done(function (noteData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a note</caption>
    var noteData = {
      'task_id': 458748574,
      'content': '2 + 2 = 5'
    };
    notes.create(noteData)
      .done(function (noteData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a note</caption>
    var noteID = 3487348374;
    var revision = 45;
    notes.deleteID(noteID, revision)
      .always(function (resp, statusCode) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/notes',
  'type': 'note',

  /**
    * Allows fetching notes for a list.
    * @param {string} listId - The list to fetch.
    * @param {boolean} [completed] - Fetch notes under completed tasks when TRUE
    * @param {string} [requestID] - User supplied Request ID. Autogenerated if not supplied.
    */
  'forList': function (listId, completed, requestID) {

    var self = this;

    var request = self.get(self.baseUrl, {
      'list_id': listId,
      'completed_tasks': !!completed
    }, requestID);

    return request.promise();
  },
});

},{"./AuthenticatedService":73}],90:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to file preview data.
  * @module services/Previews
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Previews service</caption>
    var PreviewsService = require('services/Previews');
    var previews = new PreviewsService();

  * @example <caption>Get preview for a file</caption>
    var fileID = 87987;
    previews.getPreview(fileID)
      .done(function (previewData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');
module.exports = AuthenticatedService.extend({

  'baseUrl': '/previews',
  'type': 'preview',

  // GET a.wunderlist.com/api/v1/files/:id/preview?platform=mac&size=retina
  'getPreview': function (id, platform, size, requestID) {

    var self = this;

    var params = {
      'file_id': id,
      'platform': platform,
      'size': size
    };

    return self.get(self.baseUrl, params, requestID);
  }
});

},{"./AuthenticatedService":73}],91:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to reminder data.
  * @module services/Reminders
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Reminders service</caption>
    var RemindersService = require('services/Reminders');
    var reminders = new RemindersService();

  * @example <caption>Get reminders for a task</caption>
    var taskID = 349587;
    reminders.forTask(taskID)
      .done(function (remindersData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get reminders for a list</caption>
    var listID = 349587;
    reminders.forList(listID)
      .done(function (remindersData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific reminder</caption>
    var reminderID = 34958734958;
    reminder.getID(reminderID)
      .done(function (reminderData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a reminder</caption>
    var reminderData = {
      'task_id': 59191,
      'date': '2013-08-30T08:29:46.203Z'
    };
    reminders.create(reminderData)
      .done(function (reminderData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Update a reminder</caption>
    var reminderID = 349587;
    var reminderRevision = 23;
    var reminderUpdateData = {
      'date': '2275-08-30T08:29:46.203Z'
    };
    reminders.update(reminderID, reminderRevision, reminderUpdateData)
      .done(function (reminderData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a reminder</caption>
    var reminderID = 2395872394;
    reminders.deleteID(reminderID)
      .always(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/reminders',
  'type': 'reminder',

  /**
    * Allows fetching reminders for a list.
    * @param {string} listId - The list to fetch.
    * @param {boolean} [completed] - Fetch reminders under completed tasks when TRUE
    * @param {string} [requestID] - User supplied Request ID. Autogenerated if not supplied.
    */
  'forList': function (listId, completed, requestID) {

    var self = this;

    var request = self.get(self.baseUrl, {
      'list_id': listId,
      'completed_tasks': !!completed
    }, requestID);

    return request.promise();
  },
});

},{"./AuthenticatedService":73}],92:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to root.
  * @module services/Root
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Root service</caption>
    var RootService = require('services/Root');
    var root = new RootService();

  * @example <caption>Get a user's root object</caption>
    root.all()
      .done(function (rootData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/root',
  'type': 'root'
});

},{"./AuthenticatedService":73}],93:[function(_dereq_,module,exports){
'use strict';

/**
  * @module services/Service

  * @requires module:wunderbits.core/WBEventEmitter

  * @requires module:io/IO

  * @requires module:services/Mixin/ServiceGet
  * @requires module:services/Mixin/ServiceDelete
  * @requires module:services/Mixin/ServiceCreate
  * @requires module:services/Mixin/ServiceUpdate

  * @extends module:wunderbits.core/WBEventEmitter

  * @mixes module:services/Mixin/ServiceGet
  * @mixes module:services/Mixin/ServiceDelete
  * @mixes module:services/Mixin/ServiceCreate
  * @mixes module:services/Mixin/ServiceUpdate
  */

var core = _dereq_('wunderbits.core');
var WBEventEmitter = core.WBEventEmitter;
var assert = core.lib.assert;

var ApplicationState = _dereq_('../models/ApplicationState');
var IOHttp = _dereq_('../io/IO');

var ServiceCreate = _dereq_('./Mixins/ServiceCreate');
var ServiceDelete = _dereq_('./Mixins/ServiceDelete');
var ServiceGet = _dereq_('./Mixins/ServiceGet');
var ServiceUpdate = _dereq_('./Mixins/ServiceUpdate');

var verbs = ['get', 'post', 'put', 'patch', 'delete'];

var _super = WBEventEmitter.prototype;

var BaseService = WBEventEmitter.extend({

  'mixins': [
    ServiceCreate,
    ServiceDelete,
    ServiceGet,
    ServiceUpdate
  ],

  /**
    * The service's base path. For example '/tasks' will become 'https://a.wunderlist.com/api/v1/tasks' when an HTTP request is made.
    * @abstract
    * @type {string}
    */
  'baseUrl': undefined,

  /**
    * The API version the service should use.
    * @type {number}
    */
  'apiVersion': 1,

  /**
    * The service's resource type. For examples 'Task' for services/Tasks
    * @abstract
    * @type {string}
    */
  'type': undefined,

  /**
   * io helper
   */
  'io': undefined,

  /**
    * DELETE crud delete
    * @method
    */
  'delete': undefined,

  /**
    * GET crud read
    * @method
    */
  'get': undefined,

  /**
    * PATCH crud update
    * @method
    */
  'patch': undefined,

  /**
    * POST crud create
    * @method
    */
  'post': undefined,

  /**
    * PUT crud update
    * @method
    */
  'put': undefined,

  /**
    * Base class for Wunderlist API service modules.
    * @constructor
    * @param {object} [options] - Class initialization options.
    * @param {boolean} [options.websocket] - Proxy CRUD operations over a WebSocket.
    * @alias module:services/Service
    */
  'initialize': function (options) {

    var self = this;

    _super.initialize.apply(self, arguments);

    self.options = options = options || {};
    self.appState = options.appState;

    self.checkAppState();

    self.baseUrl = '/v' + self.apiVersion + self.baseUrl;

    if (self.options.websocket) {
      self.setupSocketInterfaces();
    }
    else {
      self.setupRestInterfaces();
    }
  },

  'setupRestInterfaces': function () {

    var self = this;

    var io;

    if (self.options.httpIO) {
      io = self.options.httpIO;
    }
    else {
      io = new IOHttp({
        'config': self.appState.toJSON()
      });
    }

    var http = self.io = io;

    verbs.forEach(function (verb) {

      self[verb] = http.io[verb];
    });

    self.bindTo(self.io, 'unauthorized', function () {

      !self.destroyed && self.trigger('unauthorized');
    });
  },

  /**
    * Allows service to create its own local appstate if one is not passed
    * in initialization options
    */
  'checkAppState': function () {

    var self = this;

    if (!self.appState && self.options.config) {
      self.appState = new ApplicationState(self.options.config);
      self.options.appState = self.appState;
    }
  },

  /**
    * Overrides default HTTP crud interfaces with RestSocket interfaces.
    */
  'setupSocketInterfaces': function () {

    var self = this;
    var socket = self.options.restSocket;

    assert(socket, 'No RestSocket instance available.');

    self.io = socket;

    verbs.forEach(function (verb) {

      self[verb] = self.io[verb];
    });
  },

  /**
    * Method to destroy and clean up instance.
    */
  'destroy': function () {

    var self = this;

    // clear all the bindings
    self.unbindAll();

    // delete all properties
    // make sure a destroyed object is not keeping other
    // objects alive by reference
    function killEverything (obj) {
      for (var key in obj) {
        obj[key] = undefined;
      }
    }
    killEverything(self);

    // flag as destroyed, so objects internal methods
    // can optionally check this before execution
    self.destroyed = true;
  },

  /** TRUE when instance has been destroyed **/
  'destroyed': false
});

module.exports = BaseService;

},{"../io/IO":46,"../models/ApplicationState":54,"./Mixins/ServiceCreate":85,"./Mixins/ServiceDelete":86,"./Mixins/ServiceGet":87,"./Mixins/ServiceUpdate":88,"wunderbits.core":12}],94:[function(_dereq_,module,exports){
'use strict';

/**
  * @module services/ServiceGetOnly
  * @requires module:services/Service
  * @requires module:services/Mixin/ServiceGet
  * @mixes module:services/Mixin/ServiceGet
  * @extends module:services/Service
  */

var core = _dereq_('wunderbits.core');
var assert = core.lib.assert;

var BaseService = _dereq_('./Service');
var ServiceGet = _dereq_('./Mixins/ServiceGet');

var IOHttp = _dereq_('../io/IO');

var notAllowed = function () {
  throw new Error ('Method not allowed for this service.');
};

module.exports = BaseService.extend({

  'mixins': [
    ServiceGet
  ],

  'setupRestInterfaces': function () {

    var self = this;

    var http = self.io = new IOHttp({
      'config': self.appState.toJSON()
    });

    self.get = http.io.get;
  },

  /**
    * Overrides default HTTP crud interfaces with RestSocket interfaces.
    */
  'setupSocketInterfaces': function () {

    var self = this;

    var socket = self.options.restSocket;

    assert(socket, 'No RestSocket instance available.');

    self.io = socket;
    self.get = self.io.get;
  },

  'delete': notAllowed,
  'patch': notAllowed,
  'post': notAllowed,
  'put': notAllowed
});

},{"../io/IO":46,"./Mixins/ServiceGet":87,"./Service":93,"wunderbits.core":12}],95:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides access to oauth services
  * @module services/Services
  * @extends module:services/ServiceGetOnly
  * @requires module:services/ServiceGetOnly
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/services',
  'type': 'service'
});

},{"./AuthenticatedService":73}],96:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to user settings.
  * @module services/Settings
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Settings service</caption>
    var SetttingsService = require('services/Settings');
    var settings = new SetttingsService();

  * @example <caption>Get all of a user's settings</caption>
    settings.all()
      .done(function (settingsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific setting</caption>
    var settingID = 5458787;
    settings.getID(settingID)
      .done(function (settingData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a setting</caption>
    var settingData = {
      'key': 'difficulty',
      'value': 'hard mode'
    };
    settings.create(settingData)
      .done(function (settingData, statusCode) {

      })
      .fail(function (resp, code) {

      });

  * @example <caption>Update a setting</caption>
    var settingID = 349587;
    var settingRevision = 87;
    var settingUpdateData = {
      'value': 'insanity'
    };

    settings.update(settingID, settingRevision, settingUpdateData)
      .done(function (settingData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a setting</caption>
    var settingID = 349587;
    var settingRevision = 88;
    settings.deleteID(settingID, settingRevision)
      .always(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/settings',
  'type': 'setting'
});

},{"./AuthenticatedService":73}],97:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to task positions.
  * @module services/SubtaskPositions
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the SubtaskPositions service</caption>
    var SubtaskPositionsService = require('services/SubtaskPositions');
    var subtaskPositions = new SubtaskPositionsService();

  * @example <caption>Get positions for a task's subtasks</caption>
    var taskID = 123987;
    subtaskPositions.forTask(taskID)
      .done(function (subtaskPositionsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get subtasks positions for all tasks in a list</caption>
    var listID = 123987;
    subtaskPositions.forList(listID)
      .done(function (subtaskPositionsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific subtask position object</caption>
    var subtaskPositionID = 239487;
    subtaskPositions.getID(subtaskPositionID)
      .done(function (subtaskPositionData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Update positions for a task's subtasks</caption>
    var subtaskPositionsID = 349587;
    var subtaskPositionsRevision = 23;
    var updateData = {
      'values': [2234,45645,76567,567978]
    };
    subtaskPositions.update(subtaskPositionsID, subtaskPositionsRevision, updateData)
      .done(function (subtaskPositionsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/subtask_positions',
  'type': 'subtask_position',

  /**
    * Allows fetching subtask_positions for a list.
    * @param {string} listId - The list to fetch.
    * @param {boolean} [completed] - Fetch subtask_positions under completed tasks when TRUE
    * @param {string} [requestID] - User supplied Request ID. Autogenerated if not supplied.
    */
  'forList': function (listId, completed, requestID) {

    var self = this;

    var request = self.get(self.baseUrl, {
      'list_id': listId,
      'completed_tasks': !!completed
    }, requestID);

    return request.promise();
  },
});

},{"./AuthenticatedService":73}],98:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to subtasks data.
  * @module services/Subtasks
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

* @example <caption>Create an instance of the Subtasks service</caption>
    var SubtasksService = require('services/Subtasks');
    var subtasks = new SubtasksService();

  * @example <caption>Get all uncompleted subtasks for a list</caption>
    var listID = 666;
    subtasks.forList(listID)
      .done(function (subtasksData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get completed subtasks for a list</caption>
    var listID = 3456
    var completed = true;
    subtasks.forList(listID, completed)
      .done(function (subtasksData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get all uncompleted subtasks for a task</caption>
    var taskID = 666;
    subtasks.forTask(taskID)
      .done(function (subtasksData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get completed subtasks for a task</caption>
    var taskID = 3456
    var completed = true;
    subtasks.forTask(taskID, completed)
      .done(function (subtasksData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific subtask</caption>
    vat subtaskID = 777;
    subtasks.getID(subtaskID)
      .done(function (subtaskData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a subtask</caption>
    subtasks.create({
      'task_id': 8675309
      'title': 'Call Jenny'
    })
    .done(function (subtaskData, statusCode) {
      // ...
    })
    .fail(function (resp, code) {
      // ...
    });

  * @example <caption>Update a subtask</caption>
    var subtaskID = 777;
    var subtaskRevision = 5;
    var updateData = {
      'title': 'Change the world'
    };
    subtasks.update(subtaskID, subtaskRevision, updateData)
      .done(function (subtaskData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a subtask</caption>
    var subtaskID = 777;
    var subtaskRevision = 5;
    subtasks.deleteID(subtaskID, subtaskRevision)
      .always(function (resp, code) {
        // ...
      });
  */

var core = _dereq_('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:SUBTASKS');

var AuthenticatedService = _dereq_('./AuthenticatedService');

var _super = AuthenticatedService.prototype;
module.exports = AuthenticatedService.extend({

  'baseUrl': '/subtasks',

  'type': 'subtask',

   /**
    * Create a subtask.
    * @param {object} data - Subtask creation data.
    * @param {integer} data.task_id - Task ID which subtask belongs to.
    * @param {string} data.title - Subtask title. Maximum length is 255 characters.
    * @param {boolean} [data.completed] - Is subtask completed?
    * @param {string} [requestID] - User supplied Request ID. Autogenerated if not supplied.
    * @returns {promise} Promise of request deferred.
    */
  'create': function (data) {

    var self = this;
    try {
      self.validateCreateData(data);
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    var request = _super.create.apply(self, arguments);
    return request.promise();
  },

  /**
    * Allows fetching either all or just uncompleted subtasks for a list.
    * @param {string} listId - The list to fetch.
    * @param {boolean} [completed] - Fetch for completed tasks when TRUE
    * @param {string} [requestID] - User supplied Request ID. Autogenerated if not supplied.
    */
  'forList': function (listId, completed, requestID) {

    var self = this;

    var request = self.get(self.baseUrl, {
      'list_id': listId,
      'completed_tasks': !!completed
    }, requestID);

    return request.promise();
  },

  /**
    * Validates subtask creation data.
    * @param {object} data - Subtask data.
    */
  'validateCreateData': function (data) {

    data = data || {};

    var hasData = Object.keys(data).length;
    var required = ' required for subtask creation';
    assert(hasData, 'data' + required);
    assert.number(data.task_id, 'data.task_id' + required);
    assert.string(data.title, 'data.title' + required);
  }
});

},{"./AuthenticatedService":73,"magiconsole":2,"wunderbits.core":12}],99:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to task comments.
  * @module services/TaskComments
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the TaskComments service</caption>
    var TaskCommentsService = require('services/TaskComments');
    var taskComments = new TaskCommentsService();

  * @example <caption>Get all comments for a task</caption>
    var taskID = 239487;
    taskComments.forTask(taskID)
      .done(function (taskCommentsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get all task comments for all tasks in a list</caption>
    var listID = 239487;
    taskComments.forList(listID)
      .done(function (taskCommentsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a task comment</caption>
    taskComments.create({
      'task_id': 349587,
      'text': 'Hello world!'
    })
    .done(function (taskCommentData, statusCode) {
      // ...
    })
    .fail(function (resp, code) {
      // ...
    });

  * @example <caption>Mark a task comment as having been read</caption>
    var taskCommentID = 2394872;
    var taskCommentRevision = 1;
    var readData = {
      'read': true
    };
    taskComments.update(taskCommentID, taskCommentRevision, readData)
      .done(function (taskCommentData, statusCode) {
        // ...
      })
      .fail(fucntion (resp, code) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/task_comments',
  'type': 'task_comment'
});

},{"./AuthenticatedService":73}],100:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to task comments states
  * @module services/TaskCommentsStates
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the TaskCommentsStates service</caption>
    var TaskCommentsStatesService = require('services/TaskCommentsStates');
    var taskCommentsStates = new TaskCommentsStatesService();

  * @example <caption>Get the comments states for a list</caption>
    var listID = 239487;
    taskCommentsStates.forList(listID)
      .done(function (taskCommentsStatesData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/task_comments_states',
  'type': 'task_comments_state'
});

},{"./AuthenticatedService":73}],101:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to task positions.
  * @module services/TaskPositions
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the TaskPositions service</caption>
    var TaskPositionsService = require('services/TaskPositions');
    var taskPositions = new TaskPositionsService();

  * @example <caption>Get task positions for a list</caption>
    var listID = 123987;
    taskPositions.forList(listID)
      .done(function (taskPositionsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific task position object</caption>
    var taskPositionID = 239487;
    taskPositions.getID(taskPositionID)
      .done(function (taskPositionData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Update positions for a list's tasks</caption>
    var taskPositionsID = 349587;
    var taskPositionsRevision = 23;
    var updateData = {
      'values': [2234,45645,76567,567978]
    };
    taskPositions.update(taskPositionsID, taskPositionsRevision, updateData)
      .done(function (taskPositionsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/task_positions',
  'type': 'task_position'
});

},{"./AuthenticatedService":73}],102:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to tasks data.
  * @module services/Tasks
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Tasks service</caption>
    var TasksService = require('services/Tasks');
    var tasks = new TasksService();

  * @example <caption>Get all uncompleted tasks for a list</caption>
    var listID = 666;
    tasks.forList(listID)
      .done(function (tasksData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get completed tasks for a list</caption>
    var listID = 3456;
    var completed = true;
    tasks.forList(listID, completed)
      .done(function (tasks, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific task</caption>
    vat taskID = 777;
    tasks.getID(taskID)
      .done(function (taskData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a task</caption>
    tasks.create({
      'list_id': 8675309
      'title': 'Call Jenny'
    })
    .done(function (taskData, statusCode) {
      // ...
    })
    .fail(function (resp, code) {
      // ...
    });

  * @example <caption>Update a task</caption>
    var taskID = 777;
    var taskRevision = 5;
    var updateData = {
      'title': 'Change the world',
      'starred': true,
      'due_data': undefined
    };

    tasks.update(taskID, revision, updateData)
      .done(function (taskData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a task</caption>
    var taskID = 777;
    var taskRevision = 5;
    tasks.deleteID(taskID, taskRevision)
      .always(function (resp, code) {
        // ...
      });
  */

var core = _dereq_('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:TASKS');

var AuthenticatedService = _dereq_('./AuthenticatedService');

var _super = AuthenticatedService.prototype;
module.exports = AuthenticatedService.extend({

  'baseUrl': '/tasks',

  'type': 'task',

  /**
    * Allows fetching either all or just uncompleted tasks for a list.
    * @param {string} listId - The list to fetch.
    * @param {boolean} completed - Fetch completed tasks or not.
    * @param {string} [requestID] - User supplied Request ID. Autogenerated if not supplied.
    */
  'forList': function (listId, completed, requestID) {

    var self = this;

    var request = self.get(self.baseUrl, {

      'list_id': listId,
      'completed': !!completed
    }, requestID);

    return request.promise();
  },

  /**
    * Create a task.
    * @param {object} data - Task data.
    * @param {integer} data.list_id - List ID in which to create task.
    * @param {string} data.title - Task title.
    * @param {integer} [data.assignee_id] - User task is assigned to.
    * @param {boolean} [data.completed] - Is task completed?
    * @param {string} [data.due_date] - Task due date formatted as an ISO8601 date.
    * @param {boolean} [data.starred] - Is task starred?
    * @param {string} [requestID] - User supplied Request ID. Autogenerated if not supplied.
    * @returns {promise} Promise of request deferred.
    */
  'create': function (data) {

    var self = this;
    try {
      self.validateCreateData(data);
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    var request = _super.create.apply(self, arguments);
    return request.promise();
  },

  /**
    * Validates task creation data.
    * @param {object} data - Task data.
    */
  'validateCreateData': function (data) {

    data = data || {};

    var hasData = Object.keys(data).length;
    var required = ' required for task creation';
    assert(hasData, 'data' + required);
    assert.number(data.list_id, 'data.list_id' + required);
    assert.string(data.title, 'data.title' + required);
  }
});

},{"./AuthenticatedService":73,"magiconsole":2,"wunderbits.core":12}],103:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to tasks_count data.
  * @module services/TasksCount
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the TasksCount service</caption>
    var TasksCountService = require('services/TasksCount');
    var taskCounts = new TasksCountService();

  * @example <caption>Get a list's task counts</caption>
    var listID = 4349587;
    taskCounts.forList(listID)
      .done(function (taskCounts, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/lists/tasks_count',
  'type': 'tasks_count'
});

},{"./AuthenticatedService":73}],104:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides access to unread counts for Activities and Comments
  * @module services/UnreadCounts
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Get unread counts for Activities and Comments</caption>
    var UnreadCountsService = require('services/UnreadCounts');
    var unreadCounts = new UnreadCountsService();
    unreadCounts.all()
      .done(function (data, statusCode) {
        console.log(data.comments);
        console.log(data.activities);
      })
      .fail(function () {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/unread_activity_counts',
  'type': 'unread_activities_count'
});

},{"./AuthenticatedService":73}],105:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to uploads data.
  * @module services/Uploads
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Uploads service</caption>
    var UploadsService = require('services/Uploads');
    var uploads = new FilesService();

  * @example <caption>Create a upload</caption>

    uploads.create()
      .done(function (uploadData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Update a upload</caption>
    var uploadID = 777;
    var uploadRevision = 2398;
    var updateData = {
      'state': 'finished'
    };
    uploads.update(uploadID, uploadRevision, updateData)
      .done(function (uploadData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */


var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/uploads',
  'type': 'upload',

  // upload creation does not require data, but preserving
  'create': function (data, requestID) {

    var self = this;
    return self.post(self.baseUrl, data, requestID);
  },

  'getPart': function (id, partNumber, requestID) {

    var self = this;

    var params = {
      'part_number': partNumber
    };

    return self.get(self.baseUrl + '/' + id + '/parts', params, requestID);
  },

  'finish': function (id, requestID) {

    var self = this;

    var params = {
      'state': 'finished'
    };

    return self.patch(self.baseUrl + '/' + id, params, requestID);
  }
});
},{"./AuthenticatedService":73}],106:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to user data for
  * the currently signed in user.
  * @module services/User
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the User service</caption>
    var UserService = require('services/User');
    var user = new UserService();

  * @example <caption>Fetch all info for the currently logged in user</caption>
    user.all()
      .done(function (userData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var core = _dereq_('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:USER');

var AuthenticatedService = _dereq_('./AuthenticatedService');
module.exports = AuthenticatedService.extend({
  'baseUrl': '/user',
  'type': 'user',

  'update': function (revision, updateData, requestID) {

    var self = this;
    var hasData = updateData && Object.keys(updateData).length;

    try {
      assert.number(revision, 'Updating a user requires a revision of type number.');
      assert(hasData, 'Updating a user requires data to be sent.');
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    updateData.revision = revision;

    try {
      self.validateData(updateData, self.type);
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0);
    }

    updateData = self.prepareDataForPatch(updateData);

    return self.patch(self.baseUrl, updateData, requestID);
  },

  'changeEmail': function (newEmail, password, requestID) {

    var self = this;

    var data = {
      'email': newEmail,
      'password': password
    };

    return self.patch(self.baseUrl + '/email', data, requestID);
  },

  'changePassword': function (newPassword, currentPassword, requestID) {

    var self = this;

    var updateData = {
      'password': newPassword,
      'old_password': currentPassword
    };

    return self.patch(self.baseUrl + '/password', updateData, requestID);
  },

  'deleteSelf': function (password, requestID) {

    var self = this;

    var params = {
      'password': password
    };

    return self['delete'](self.baseUrl, params, requestID);
  }
});

},{"./AuthenticatedService":73,"magiconsole":2,"wunderbits.core":12}],107:[function(_dereq_,module,exports){
'use strict';

/**
  * Provides methods for easy access to users data.
  * @module services/Users
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Users service</caption>
    var UsersService = require('services/Users');
    var users = new UsersService();

  * @example <caption>Fetch the users this logged in user can access</caption>
    users.all()
      .done(function (usersData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = _dereq_('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/users',
  'type': 'user'
});

},{"./AuthenticatedService":73}],108:[function(_dereq_,module,exports){
'use strict';

var ServiceGetOnly = _dereq_('./ServiceGetOnly');

var services = {
  'activities': _dereq_('./Activities'),
  'conversations': _dereq_('./Conversations'),
  'export': _dereq_('./Export'),
  'features': _dereq_('./Features'),
  'files': _dereq_('./Files'),
  'import': _dereq_('./Import'),
  'ical_feed': _dereq_('./IcalFeed'),
  'list_positions': _dereq_('./ListPositions'),
  'list_reminders_collections': _dereq_('./ListRemindersCollections'),
  'lists': _dereq_('./Lists'),
  'memberships': _dereq_('./Memberships'),
  'notes': _dereq_('./Notes'),
  'previews': _dereq_('./Previews'),
  'reminders': _dereq_('./Reminders'),
  'root': _dereq_('./Root'),
  // Services.js in order not confuse dependency tree with folder services/index.js
  'services': _dereq_('./Services.js'),
  'settings': _dereq_('./Settings'),
  'subtask_positions': _dereq_('./SubtaskPositions'),
  'subtasks': _dereq_('./Subtasks'),
  'task_comments': _dereq_('./TaskComments'),
  'task_comments_states': _dereq_('./TaskCommentsStates'),
  'task_positions': _dereq_('./TaskPositions'),
  'tasks': _dereq_('./Tasks'),
  'tasks_counts': _dereq_('./TasksCounts'),
  'unread_activities_counts': _dereq_('./UnreadActivitiesCounts'),
  'uploads': _dereq_('./Uploads'),
  'user': _dereq_('./User'),
  'users': _dereq_('./Users')
};

var revisionedEndpoints = [
  // 'file',
  'list',
  // 'folder',
  // 'list_position',
  // 'membership',
  // 'note',
  // 'reminder',
  // 'service',
  // 'setting',
  // 'subscription',
  // 'subtask',
  // 'subtask_position',
  'task'
  // 'task_comment',
  // 'task_position',
  // 'upload',
  // 'user'
];

revisionedEndpoints.forEach(function (type) {

  var revisionEndpoint = type + '_revisions';
  services[revisionEndpoint] = ServiceGetOnly.extend({
    'baseUrl': '/' + revisionEndpoint,
    'type': revisionEndpoint
  });
});

module.exports = services;

},{"./Activities":72,"./Conversations":74,"./Export":75,"./Features":76,"./Files":77,"./IcalFeed":78,"./Import":79,"./ListPositions":80,"./ListRemindersCollections":81,"./Lists":82,"./Memberships":83,"./Notes":89,"./Previews":90,"./Reminders":91,"./Root":92,"./ServiceGetOnly":94,"./Services.js":95,"./Settings":96,"./SubtaskPositions":97,"./Subtasks":98,"./TaskComments":99,"./TaskCommentsStates":100,"./TaskPositions":101,"./Tasks":102,"./TasksCounts":103,"./UnreadActivitiesCounts":104,"./Uploads":105,"./User":106,"./Users":107}],109:[function(_dereq_,module,exports){
'use strict';

/**
  * @module validators/SchemaValidator
  * @extends wunderbits/WBSingleton
  * @requires module:schema/List
  * @requires module:schema/Subtask
  * @requires module:schema/Task
  */

var core = _dereq_('wunderbits.core');
var WBSingleton = core.WBSingleton;

var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:SCHEMAVALIDATOR');

var _schemas = _dereq_('../schemas');

var _validatorByType = {
  'array': 'isArray',
  'integer': 'isInteger',
  'boolean': 'isBoolean',
  'string': 'isString',
  'ISODate': 'isISODate'
};

var SchemaValidator = WBSingleton.extend({

  /**
    * Validates a data object based on a schema
    * @param {object}
    */
  'validateData': function (data, type) {

    var self = this;
    var isAllDataIsValid = true;
    var dataType, validtor, isValid, value;

    var schema = _schemas[type];

    if (!schema) {
      localConsole.warn('No data schema for type "' + type + '"');
      return true;
    }

    for (var key in data) {

      isValid = undefined;
      dataType = schema[key];

      if (!dataType) {
        localConsole.warn('No validation set for key', key, 'for', type);
      }

      value = data[key];
      validtor = self[_validatorByType[dataType]];

      if (validtor) {
        isValid = validtor.call(self, value);
        if (!isValid) {
          localConsole.warn(type + ' value ' + value + ' (' + typeof value + ') for key "' + key + '"" did not pass validation for type ' + dataType);
          isAllDataIsValid = false;
        }
        else {
          // localConsole.debug('Value ' + value + ' (' + typeof value + ') for key "' + key + '"" passed validation for type ' + dataType);
        }
      }
    }

    return isAllDataIsValid;
  },

  /**
    * Returns true if is an Array
    * @param {object} variable - The thing to check for Arrayness
    */
  'isArray': function (variable) {

    return Array.isArray(variable);
  },

  /**
    * Returns true if is a Boolean
    * @param {object} variable - The thing to check for Booleaness
    */
  'isBoolean': function (variable) {

    return variable === false || variable === true;
  },

  /**
    * Returns true if is an Integer
    * @param {object} variable - The thing to check for Integerness
    */
  'isInteger': function (variable) {

    // http://stackoverflow.com/questions/3885817/how-to-check-if-a-number-is-float-or-integer
    return typeof variable === 'number' && parseFloat(variable) === parseInt(variable, 10) && !isNaN(variable);
  },

  /**
    * Returns true if is a String
    * @param {object} variable - The thing to check for Stringness
    */
  'isString': function (variable) {

    return typeof variable === 'string';
  },

  /**
    * Returns true if is an ISO Date string
    * @param {object} variable - The thing to check for ISO Dateness
    */
  'isISODate': function (variable) {

    var self = this;

    // do not even regex if not a string
    if (!self.isString(variable)) {
      return false;
    }

    var ISODate = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-2])T(0[0-9]|1[0-9]|2[0-3])(:([0-5][0-9])){2}(\.\d{3})?Z$/;
    return ISODate.test(variable);
  }
});

module.exports = SchemaValidator;

},{"../schemas":71,"magiconsole":2,"wunderbits.core":12}],110:[function(_dereq_,module,exports){
(function (global){
'use strict';


// Network connectivity monitor.
// Based on http://robertnyman.com/html5/offline/online-offline-events.html

var core = _dereq_('wunderbits.core');
var WBEventEmitter = core.WBEventEmitter;

var HealthCheck = _dereq_('../helpers/HealthCheck');

var navigator = global.navigator || { 'onLine': true };

var WBOnlineStatus = WBEventEmitter.extend({

  'online': null,

  'initialize': function (options) {

    var self = this;
    var document = global.document;

    self.online = navigator.onLine;

    if (global.addEventListener) {
      // normal browsers
      global.addEventListener('online', self.onOnline.bind(self), false);
      global.addEventListener('offline', self.onOffline.bind(self), false);
    }
    // ie ?
    else if (document) {
      var body = document.body;
      body.ononline = self.isOnline;
      body.onoffline = self.isOffline;
    }

    options.config.checkHealth && self.bindToApiHealth(options);
  },

  'destroy': function () {

    HealthCheck.destroy();
  },

  'bindToApiHealth': function (options) {

    var self = this;

    HealthCheck.init(options);

    self.bindTo(HealthCheck, 'healthy', 'onOnline');
    self.bindTo(HealthCheck, 'unhealthy', 'onOffline');
  },

  'isOnline': function () {

    return this.online;
  },

  'onOnline': function () {

    var self = this;
    self.online = true;
    self.trigger('online');
  },

  'onOffline': function () {

    var self = this;
    self.online = false;
    self.trigger('offline');
  }
});

module.exports = WBOnlineStatus;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../helpers/HealthCheck":43,"wunderbits.core":12}],111:[function(_dereq_,module,exports){
'use strict';

/**
  * Parse different data types to things
  * @module wunderbits/lib/SafeParse
  * @extends module:wunderbits.core/WBSingleton
  * @requires module:wunderbits.core/WBSingleton
  * @requires module:wunderbits/lib/console
  */

var core = _dereq_('wunderbits.core');
var WBSingleton = core.WBSingleton;

var MagiConsole = _dereq_('magiconsole');
var localConsole = new MagiConsole('SDK:SAFEPARSE');

var SafeParse = WBSingleton.extend({

  /**
    * Apptempts to parse a json sring to an object without throwing
    * unhandled errors.  Returns undefined if unable to parse json string.
    */
  'json': function (jsonString) {

    try {
      return JSON.parse(jsonString);
    } catch (e) {
      localConsole.warn('Unable to parse "' + jsonString + '"');
    }
    return;
  }
});

module.exports = SafeParse;
},{"magiconsole":2,"wunderbits.core":12}],112:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('wunderbits.core');
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

},{"wunderbits.core":12}],113:[function(_dereq_,module,exports){
'use strict';

/**
  * @module wunderlist/Wunderlist

  * @requires module:wunderbits.core/WBEventEmitter
  * @requires module:wunderbits/lib/dependencies

  * @requires module:services/Lists
  * @requires module:services/Memberships
  * @requires module:services/Notes
  * @requires module:services/Reminders
  * @requires module:services/Settings
  * @requires module:services/Subtasks
  * @requires module:services/Tasks
  * @requires module:services/UserEvents
  * @requires module:services/Activities
  * @requires module:services/Conversations
  * @requires module:services/UnreadCounts

  * @requires module:io/RestSocket
  *
  * @extends module:wunderbits.core/WBEventEmitter

  * @example <caption>Create an instance of the main Wunderlist class</caption>
    var WunderlistSDK = require('wunderlist/Wunderlist');

    // Returns an instance of the Wunderlist SDK setup with the correct client ID and user access token
    // and sets up a single WebSocket connection for REST over socket proxying
    var wunderlistSDK = new WunderlistSDK({
      'accessToken': 'a user token',
      'clientID': 'your application id'
    });

    wunderlistSDK.initialized.done(function () {
      // Where handleListData and handleError are functions
      // 'http' here can be replaced with 'socket' to use a WebSocket connection for all requests
      wunderlistSDK.http.lists.all()
        // handleListData will be called with the object parsed from the response JSON
        .done(handleListData)
        // handleError will be called with the error/event
        .fail(handleError);
    });

  */

var core = _dereq_('wunderbits.core');
var WBEventEmitter = core.WBEventEmitter;
var WBDeferred = core.WBDeferred;
var extend = core.lib.extend;

var AjaxTransport = _dereq_('../io/io/AjaxTransport');
var config = _dereq_('../config/default');
var ApplicationStateModel = _dereq_('../models/ApplicationState');
var IOHttp = _dereq_('../io/IO');
var RestSocket = _dereq_('../io/RestSocket');
var PlatformHeaders = _dereq_('../helpers/PlatformHeaders');
var ServiceClasses = _dereq_('../services');

var MagiConsole = _dereq_('magiconsole');

var _super = WBEventEmitter.prototype;

var Wunderlist = WBEventEmitter.extend({

  /**
    * @todo revisit in the future and remove,
    * auth will probably only be available through OAuth.
    */
  'auth': undefined,

  /**
    * Deferred object for tracking initialization success or failure.
    * @type {deferred}
    */
  'state': undefined,

  /**
    * Flag to denote network connectivity.
    * Note: this flag is only to denote a network connection, not API status.
    */
  'online': undefined,

  /**
    * State promise for attaching to initialization events.  Promise of state.
    * @type {promise}
    */
  'initialized': undefined,

  /**
    * Holds references to instances of API HTTP service modules once Wunderlist initialization is completed and successful.
    * @type {object}
    * @property {instance} [lists] - HTTP Instance of {@link module:services/Lists}
    * @property {instance} [memberships] - HTTP Instance of {@link module:services/Memberships}
    * @property {instance} [notes]- HTTP Instance of {@link module:services/Notes}
    * @property {instance} [reminders] - HTTP Instance of {@link module:services/Reminders}
    * @property {instance} [settings] - HTTP Instance of {@link module:services/Settings}
    * @property {instance} [subtasks] - HTTP Instance of {@link module:services/Subtasks}
    * @property {instance} [tasks] - HTTP Instance of {@link module:services/Tasks}
    * @property {instance} [userEvents] - HTTP Instance of {@link module:services/UserEvents}
    */
  'http': undefined,

  /**
    * Holds references to instances of API WebSocket service modules once Wunderlist initialization is completed and successful.
    * @type {object}
    * @property {instance} [lists] - WebSocket Instance of {@link module:services/Lists}
    * @property {instance} [memberships] - WebSocket Instance of {@link module:services/Memberships}
    * @property {instance} [notes]- WebSocket Instance of {@link module:services/Notes}
    * @property {instance} [reminders] - WebSocket Instance of {@link module:services/Reminders}
    * @property {instance} [settings] - WebSocket Instance of {@link module:services/Settings}
    * @property {instance} [subtasks] - WebSocket Instance of {@link module:services/Subtasks}
    * @property {instance} [tasks] - WebSocket Instance of {@link module:services/Tasks}
    * @property {instance} [userEvents] - WebSocket Instance of {@link module:services/UserEvents}
    */
  'socket': undefined,

  /**
    * Main interface to Wunderlist API service modules.
    * @constructor
    * @param {object} options - Class initialization options.
    * @param {string} options.clientID - Client ID is required.
    * @param {string} options.accessToken - Wunderlist access token.
    * @param {array} [options.services] - Services to be initialize.
    *     If not present, all service modules will be initialized.
    *     ex: 'services': ['lists', 'tasks']
    * @param {boolean} [options.debug] - Enable logging
    * @alias module:wunderlist/Wunderlist
    */
  'initialize': function (options) {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.options = options = extend(config, options || {});

    self.setupLogging(self.options);

    self.validateOptions();

    self.appState = new ApplicationStateModel(options);

    // initialise PlatformHeader
    PlatformHeaders.init(options);

    var state = self.state = new WBDeferred();
    self.initialized = self.state.promise();

    self.online = self.appState.isOnline();

    self.start()
      .done(state.resolveWith, state, self)
      .fail(state.reject, state);
  },

  'setupLogging': function (options) {

    options.logLevel && MagiConsole.setLevel(options.logLevel);
    options.logPattern && MagiConsole.setPattern(options.logPattern);
  },

  /**
    * Returns true once self.initialized is resolved.
    * @type {boolean}
    */
  'isInitialized': function () {

    var self = this;
    return !!(self.initialized && self.initialized.state() === 'resolved');
  },

  /**
    * Calls services initialization if/once authorized
    * @returns {promise}
    */
  'start': function () {

    var self = this;
    var promise;

    promise = self.getServices();

    // watch online state
    self.bindTo(self.appState, 'change:online', 'onOnlineOffline');

    // report timings
    self.bindTo(AjaxTransport, 'timing:io', 'onIOTiming');

    return promise;
  },

  /**
    * Set self.online state and trigger exposed online/offline event
    */
  'onOnlineOffline': function () {

    var self = this;
    self.online = self.appState.isOnline();
    self.trigger(self.online ? 'online' : 'offline');
  },

  'onIOTiming': function (ioTimingData) {

    var self = this;
    self.trigger('timing:io', ioTimingData);
  },

  /**
    * Creates instances of service modules according to initialization options.
    * @param {array} [services] - Array of services to initialize.
    * Default is initialize all services.
    * @returns {promise} Hash of initialized services.
    */
  'getServices': function () {

    var self = this;

    var compiledServices = {
      'http': {},
      'socket': {}
    };
    var service, services, Klass;
    var deferred = new WBDeferred();

    var accessToken = self.appState.attributes.accessToken;

    self.createSocket(accessToken).done(function createServices () {

      // clear old services
      self.http = undefined;
      self.socket = undefined;

      // from args, options, or default to all
      services = services || self.options.services || Object.keys(ServiceClasses);

      self.httpIO = new IOHttp({
        'config': self.appState.toJSON()
      });

      for (var i = 0, len = services.length; i < len; i++) {
        service = services[i];
        Klass = ServiceClasses[service];

        // http service
        compiledServices.http[service] = new Klass({
          'appState': self.appState,
          'httpIO': self.httpIO
        });
        self.bindTo(compiledServices.http[service], 'unauthorized', self.onUnauthorized);

        // socket service
        compiledServices.socket[service] = new Klass({
          'websocket': true,
          'restSocket': self.restSocket,
          'appState': self.appState
        });
      }

      self.http = compiledServices.http;
      self.socket = compiledServices.socket;

      deferred.resolve(compiledServices);
    });

    return deferred.promise();
  },

  'isSocketOnline': function () {

    var self = this;

    var restSocket = self.restSocket;
    var socket = restSocket && restSocket.socket;
    var webSocketConnected = !!(socket && socket.isConnected());

    return webSocketConnected;
  },

  /**
    * Returns self.socket or self.http depending on self.restSocket.socket.connected
    */
  'getOutlet': function () {

    var self = this;

    var webSocketConnected = self.isSocketOnline();
    var forcedHttp = !!self.options.forceHTTP;

    return (webSocketConnected && !forcedHttp) ? self.socket : self.http;
  },

  /**
    * Creates an instance of RestSocket using the current appState configuration
    * @fires module:wunderlist/Wunderlist#event
    * @returns {promise} Promise of WebSocket ready deferred
    */
  'createSocket': function () {

    var self = this;

    self.restSocket && self.unbindFrom(self.restSocket);

    var restSocket = new RestSocket({
      'appState': self.appState,
      'config': self.options
    });
    self.restSocket = restSocket;

    self.bindTo(restSocket, 'event', function (data) {

      /**
        * Realtime events messages event.
        * @event module:wunderlist/Wunderlist#event
        * @type {object}
        */
      self.trigger('event', data);
    });

    self.bindTo(restSocket, 'desktopNotification', function (data) {

      /**
        * Realtime desktop notifications.
        * @event module:wunderlist/Wunderlist#desktopNotification
        * @type {object}
        */
      self.trigger('desktopNotification', data);
    });

    self.bindTo(restSocket, 'unauthorized', self.onUnauthorized);
    self.bindTo(restSocket, 'timing:io', 'onIOTiming');

    return restSocket.ready.promise();
  },

  /**
    * Destroys instance of Wunderlist on unauthorized event.
    */
  'onUnauthorized': function () {

    var self = this;
    self.trigger('unauthorized');
    self.destroy();
  },

  /**
    * Method to destroy and clean up instance.
    */
  'destroy': function () {

    var self = this;

    // kill the socket
    self.restSocket && self.restSocket.destroy();

    // clear all the bindings
    self.unbindAll();

    // destroy all the services
    var protocols = ['http', 'socket'];
    protocols.forEach(function (protocol) {

      var theService;
      for (var service in self[protocol]) {
        theService = self[protocol][service];
        theService.destroy && theService.destroy();
      }
      self[protocol] = undefined;
    });

    self.appState.destroy();

    // delete all properties
    // make sure a destroyed object is not keeping other
    // objects alive by reference
    function killEverything (obj) {
      for (var key in obj) {
        obj[key] = undefined;
      }
    }
    killEverything(self);

    // flag as destroyed, so objects internal methods
    // can optionally check this before execution
    self.destroyed = true;
  },

  /** TRUE when instance has been destroyed */
  'destroyed': false,

  /**
    * Validates initialization options
    * @returns {boolean} True if options are valid
    */
  'validateOptions': function () {

    var self = this;
    var options = self.options || {};

    var validAuthCredentials = !!options.accessToken;
    if (!options.clientID || !validAuthCredentials) {
      throw new Error('Cannot initialize the Wunderlist SDK without a Client ID or auth credentials');
    }
  },

  'cancelInflightCreate': function (requestID, onlineID, revision) {

    var self = this;

    var restSocket = self.restSocket;
    var httpIO = self.httpIO;
    restSocket && restSocket.cancelInflightCreate(requestID, onlineID, revision);
    httpIO && httpIO.cancelInflightCreate(requestID, onlineID, revision);
  }
}, {
  'services': ServiceClasses,
  'headers': PlatformHeaders
});

module.exports = Wunderlist;

},{"../config/default":40,"../helpers/PlatformHeaders":44,"../io/IO":46,"../io/RestSocket":48,"../io/io/AjaxTransport":49,"../models/ApplicationState":54,"../services":108,"magiconsole":2,"wunderbits.core":12}]},{},[113])
//@ sourceMappingURL=wunderlist.sdk.map
(113)
});
