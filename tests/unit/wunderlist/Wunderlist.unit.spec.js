describe('wunderlist/Wunderlist (main interface) Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var extend = core.lib.extend;
  var WBDeferred = core.WBDeferred;

  var Console = global.console;
  var MagiConsole = require('magiconsole');

  // var runtime = require('application/runtime');
  var WunderlistClass = require('wunderlist/Wunderlist');
  var WebSocketClass = require('io/io/WebSocket');

  var ApplicationState = require('models/ApplicationState');
  var config = require('../../config');

  var FakeWebSocket;
  var NativeWebSocketClass = WebSocketClass.prototype.NativeWebSocketClass;
  before(function () {

    var noop = function () {};
    FakeWebSocket = WebSocketClass.prototype.NativeWebSocketClass = noop;
    FakeWebSocket.prototype = {
      'send': noop ,
      'addEventListener': noop,
      'close': noop
    };
  });

  after(function () {
    WebSocketClass.prototype.NativeWebSocketClass = NativeWebSocketClass;
  });

  var OverClass;
  beforeEach(function () {

    // override initialize behavior for unit tests
    // that need work outside of default class init behaviors
    OverClass = WunderlistClass.extend({
      'initialize': function (options) {

        var self = this;
        WunderlistClass.__super__.initialize.apply(self, arguments);

        self.options = options;

        self.appState = new ApplicationState(options);
      }
    });
  });

  afterEach(function () {

    MagiConsole.reset();
  });

  describe('#initialize', function () {

    it('should not be possible to initialize the Wunderlist SDK without a token or login credentials', function () {

      expect(function () {

        new WunderlistClass();
      }).to.throw('Cannot initialize the Wunderlist SDK without a Client ID or auth credentials');
    });

    it('should set appState.clientID and appState.accessToken to passed options values', function () {

      var clientID = '12039812lk3j1l2k3j';
      var accessToken = 'weoiruweoiruweoiruweoiruweoiruweoiruweoiruwoeiru';

      var OverClass = WunderlistClass.extend({

        'getServices': function () {

          return new WBDeferred().promise();
        },

        'login': function () {

          return new WBDeferred().promise();
        }
      });

      var wunderlist = new OverClass({
        'clientID': clientID,
        'accessToken': accessToken,
        'config': config
      });

      var appState = wunderlist.appState.attributes;

      expect(appState.clientID).to.equal(clientID);
      expect(appState.accessToken).to.equal(accessToken);
    });

    it('should call #start and when returned deferred is resolved it should resolve self.state', function () {

      var clientID = '12039812lk3j1l2k3j';
      var accessToken = 'weoiruweoiruweoiruweoiruweoiruweoiruweoiruwoeiru';

      var startDeferred = new WBDeferred();

      var OverClass = WunderlistClass.extend({
        'start': function () {
          return startDeferred.resolve().promise();
        }
      });

      var someInstance = new OverClass({
        'clientID': clientID,
        'accessToken': accessToken,
        'config': config
      });

      expect(someInstance.state.state()).to.equal('resolved');
    });

    it('should call #start and when returned deferred is rejected it should reject self.state', function () {

      var clientID = '12039812lk3j1l2k3j';
      var accessToken = 'weoiruweoiruweoiruweoiruweoiruweoiruweoiruwoeiru';

      var startDeferred = new WBDeferred();

      var OverClass = WunderlistClass.extend({
        'start': function () {
          return startDeferred.reject().promise();
        }
      });

      var someInstance = new OverClass({
        'clientID': clientID,
        'accessToken': accessToken,
        'config': config
      });

      expect(someInstance.state.state()).to.equal('rejected');
    });
  });

  describe('#setupLogging', function () {

    it ('should setup MagiConsole from cofiguration options', function () {

      var consoleSpy = sinon.spy(Console, 'error');

      var instance = new OverClass(config);
      instance.setupLogging({
        'logLevel': '*',
        'logPattern': '*'
      });

      var localConsole = new MagiConsole('foobar');
      localConsole.error('i should call real console');

      expect(consoleSpy).to.have.been.calledOnce;

      consoleSpy.restore();
    });
  });

  describe('#isInitialized', function () {

    it ('should return false if self.initialized is not set', function () {

      var wunderlist = new OverClass(extend({
        'clientID': 123,
        'accessToken': 'abc',
        'config': config
      }, config));

      expect(wunderlist.isInitialized()).to.be.false;
    });

    it ('should return false if initialized is not resolved', function () {

      var wunderlist = new OverClass(extend({
        'clientID': 123,
        'accessToken': 'abc',
        'config': config
      }, config));

      wunderlist.initialized = {
        'state': function () {
          return 'pending';
        }
      };

      expect(wunderlist.isInitialized()).to.be.false;
    });

    it ('should return true if initialized is resolved', function () {

      var wunderlist = new OverClass(extend({
        'clientID': 123,
        'accessToken': 'abc',
        'config': config
      }, config));

      wunderlist.initialized = {
        'state': function () {
          return 'resolved';
        }
      };

      expect(wunderlist.isInitialized()).to.be.true;
    });
  });

  describe('#start', function () {

    it ('should call #getServices when self.options.accessToken is present', function () {

      var ThisOverClass = OverClass.extend({
        'getServices': function () {
          return new WBDeferred().promise();
        }
      });

      var wunderlist = new ThisOverClass(extend({
        'clientID': 123,
        'accessToken': 'abc',
        'config': config
      }, config));

      var getServicesSpy = sinon.spy(wunderlist, 'getServices');

      wunderlist.start();

      expect(getServicesSpy).to.have.been.called;

      wunderlist.unbindAll();
    });
  });

  describe('#onOnlineOffline', function () {

    it ('should trigger "online" if appState.isOnline() is true', function () {

      var wunderlist = new OverClass(extend({
        'clientID': 123,
        'accessToken': 'abc',
        'config': config
      }, config));

      wunderlist.appState.set('online', true);

      var onlineSpy = sinon.spy();
      wunderlist.on('online', onlineSpy);

      wunderlist.onOnlineOffline();

      expect(onlineSpy).to.have.been.calledOnce;
    });

    it ('should trigger "offline" if runtime.online is false', function () {

      var wunderlist = new OverClass(extend({
        'clientID': 123,
        'accessToken': 'abc',
        'config': config
      }, config));

      wunderlist.appState.set('online', false);

      var offlineSpy = sinon.spy();
      wunderlist.on('offline', offlineSpy);

      wunderlist.onOnlineOffline();

      expect(offlineSpy).to.have.been.calledOnce;
    });
  });

  describe('#onIOTiming', function () {

    it ('should trigger timing:io on self', function () {

      var wunderlist = new OverClass(extend({
        'clientID': 123,
        'accessToken': 'abc',
        'config': config
      }, config));

      var spy = sinon.spy();

      wunderlist.on('timing:io', spy);

      wunderlist.onIOTiming();

      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('#getServices', function () {

    var services = [
      'files',
      'list_positions',
      'lists',
      'memberships',
      'notes',
      'reminders',
      'settings',
      'subtasks',
      'subtask_positions',
      'tasks',
      'task_comments',
      'task_positions',
      'tasks_counts',
      'uploads',
      'user',
      'users',
      'activities',
      'conversations',
      'unread_activities_counts'
    ];

    it ('should compile default services once #createSocket deferred is resolved', function () {

      var ThisOverClass = OverClass.extend({
        'createSocket': function () {

          this.restSocket = {};
          return new WBDeferred().resolve().promise();
        }
      });

      var wunderlist = new ThisOverClass(extend({
        'clientID': '123',
        'accessToken': 'abc',
        'config': config
      }, config));

      var result = wunderlist.getServices();

      expect(result.state()).to.equal('resolved');

      services.forEach(function (service) {

        expect(wunderlist.http[service]).to.not.be.undefined;
        expect(wunderlist.socket[service]).to.not.be.undefined;
      });
    });
  });

  describe('#getOutlet', function () {

    it ('should return reference to socket services when socket exists and is connected', function () {

      var wunderlist = new OverClass(config);

      var socket = {};
      var http = {};

      wunderlist.socket = socket;
      wunderlist.http = http;

      wunderlist.restSocket = {
        'socket': {
          'isConnected': function () {return true;}
        }
      };

      var outlet = wunderlist.getOutlet();

      expect(outlet).to.equal(socket);
      expect(outlet).to.not.equal(http);
    });

    it ('should return reference to http services when RestSocket does not exist', function () {

      var wunderlist = new OverClass(config);

      var socket = {};
      var http = {};

      wunderlist.socket = socket;
      wunderlist.http = http;

      var outlet = wunderlist.getOutlet();

      expect(outlet).to.equal(http);
      expect(outlet).to.not.equal(socket);
    });

    it ('should return reference to http services when the WebSocket does not exist', function () {

      var wunderlist = new OverClass(config);

      var socket = {};
      var http = {};

      wunderlist.socket = socket;
      wunderlist.http = http;

      var outlet = wunderlist.getOutlet();

      expect(outlet).to.equal(http);
      expect(outlet).to.not.equal(socket);
    });

    it ('should return reference to http services when the WebSocket is not connected', function () {

      var wunderlist = new OverClass(config);

      var socket = {};
      var http = {};

      wunderlist.socket = socket;
      wunderlist.http = http;

      wunderlist.restSocket = {
        'socket': {
          'isConnected': function () {return false;}
        }
      };

      var outlet = wunderlist.getOutlet();

      expect(outlet).to.equal(http);
      expect(outlet).to.not.equal(socket);
    });

    it('should return reference to http services, if forced in constructor options', function () {

      var wunderlist = new OverClass(extend({
        'forceHTTP': true
      }, config));

      var socket = {};
      var http = {};

      wunderlist.socket = socket;
      wunderlist.http = http;

      var outlet = wunderlist.getOutlet();

      expect(outlet).to.equal(http);
      expect(outlet).to.not.equal(socket);
    });
  });

  describe('#createSocket', function () {

    it('should add an instance of RestSocket to runtime', function () {

      var wunderlist = new OverClass(extend({
        'accessToken': 'foobar'
      }, config));

      wunderlist.createSocket();

      expect(wunderlist.restSocket).to.not.be.undefined;
    });

    it('should bindTo runtime.socket "event" events and trigger on self', function () {

      var wunderlist = new OverClass(extend({
        'accessToken': 'foobar'
      }, config));

      wunderlist.createSocket();

      var spy = sinon.spy();
      wunderlist.on('event', spy);

      expect(wunderlist.restSocket).to.not.be.undefined;

      wunderlist.restSocket.trigger('event');

      expect(spy).to.have.been.called;
    });
  });

  describe('#validateOptions', function () {

    var invalidError = 'Cannot initialize the Wunderlist SDK without a Client ID or auth credentials';

    it('should throw if nothing in self.options', function () {

      expect(function () {

        var wunderlist = new OverClass({
          'api': {
            'host': 'foobar'
          }
        });
        wunderlist.validateOptions();
      }).to.throw(invalidError);
    });

    it('should throw if clientID not in self.options', function () {

      expect(function () {

        var localConfig = extend({}, config, {
          'accessToken': 123
        });

        delete localConfig.clientID;

        var wunderlist = new OverClass(localConfig);

        wunderlist.validateOptions();
      }).to.throw(invalidError);
    });

    it('should throw if accessToken not in options', function () {

      expect(function () {
        var wunderlist = new OverClass(extend({}, config, {
          'clientID': 1234
        }));

        wunderlist.validateOptions();
      }).to.throw(invalidError);
    });

    it('should not throw if accessToken and clientID are present in self.options', function () {

      expect(function () {

        var WunderlistClass = new OverClass(extend({
          'clientID': 1234,
          'accessToken': 5432
        }, config));

        WunderlistClass.validateOptions();
      }).to.not.throw();
    });
  });

  describe('#destroy', function () {

    it ('should destroy the whole instance and leave only self.destroyed', function () {

      var socketCloseSpy = sinon.spy();
      var socketDestroySpy = sinon.spy();

      var someInstance = new OverClass(extend({
        'clientID': 1234,
        'accessToken': 5432
      }, config));

      someInstance.restSocket = {
        'close': socketCloseSpy,
        'destroy': socketDestroySpy
      };

      var serviceDestroySpy = sinon.spy();
      someInstance.http = {
        'someService': {
          'destroy': serviceDestroySpy
        }
      };

      var keys = Object.keys(someInstance);

      var unbindSpy = sinon.spy(someInstance, 'unbindAll');

      someInstance.destroy();

      for (var key in keys) {
        expect(someInstance[key]).to.be.undefined;
      }

      expect(someInstance.destroyed).to.be.true;
      expect(unbindSpy).to.have.been.called;
      expect(socketDestroySpy).to.have.been.called;
      expect(serviceDestroySpy).to.have.been.called;
    });
  });

  describe('#onUnauthorized', function () {

    it('should trigger unauthorized on self and then destroy self', function () {

      var someInstance = new OverClass(extend({
        'clientID': 1234,
        'accessToken': 5432
      }, config));

      var triggerSpy = sinon.spy();
      someInstance.on('unauthorized', triggerSpy);

      var destroySpy = sinon.spy(someInstance, 'destroy');

      someInstance.onUnauthorized();

      expect(triggerSpy).to.have.been.called;
      expect(destroySpy).to.have.been.called;
    });
  });

  describe('#cancelInflightCreate', function () {

    it ('should call #cancelInflightCreate on current instances of http and socket io', function () {

      var requestID = 'as0df98asdlfkj';

      var instance = new OverClass();

      instance.httpIO = {
        'cancelInflightCreate': sinon.stub()
      };
      instance.restSocket = {
        'cancelInflightCreate': sinon.stub()
      };

      instance.cancelInflightCreate(requestID);

      ['httpIO', 'restSocket'].forEach(function (prop) {

        var spy = instance[prop].cancelInflightCreate;

        expect(spy).to.have.been.calledOnce;
        var args = spy.firstCall.args;
        expect(args[0]).to.equal(requestID);
      });
    });
  });
});
