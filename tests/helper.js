'use strict';

function check (done, fn) {
  try {
    fn();
    done();
  } catch (e) {
    done(e);
  }
}

var chai, context;

// if running on a CJS environment
if (typeof require !== 'undefined') {
  // load chai & sinon in the global context
  chai = require('chai');
  global.sinon = require('sinon');
  chai.use(require('sinon-chai'));
  global.check = check;

  // mock location
  global.location = {
    'protocol': 'http:',
    'host': 'www.wunderlist.com'
  };

  context = global;
}
// otherwise, this must be a browser
else {
  chai = window.chai;
  window.mocha.ui('bdd');
  context = window;
}

// expose bdd helpers from chai
context.expect = chai.expect;
chai.should();
