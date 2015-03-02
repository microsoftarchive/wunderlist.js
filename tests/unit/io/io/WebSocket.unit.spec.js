describe('io/io/WebSocket Unit', function () {

  'use strict';

  var bindAll = require('wunderbits/lib/bindAll');
  var WebSocketClass = require('io/io/WebSocket');

  var config = require('../../../config');
  var ApplicationState = require('models/ApplicationState');

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

  var WebSocket, appState;
  beforeEach(function () {

    appState = new ApplicationState(config);

    // disable token check and automatic connecting
    var OverClass = WebSocketClass.extend({
      'initialize': function () {

        var self = this;
        WebSocketClass.__super__.initialize.apply(self, arguments);
        self.appState = appState;

        // TODO: remove this ugly piece of shit, we don't need more binds
        var fns = ['onSocketClose', 'onSocketError', 'onSocketMessage', 'onSocketOpen'];
        bindAll(self, fns);
      }
    });

    WebSocket = new OverClass();
  });

  afterEach(function () {
    WebSocket.close();
  });

  describe('#destroy', function () {

    it ('should close and destroy itself', function () {

      var closeSpy = sinon.spy(WebSocket, 'close');
      var unbindSpy = sinon.spy(WebSocket, 'unbindAll');

      WebSocket.destroy();

      expect(closeSpy).to.have.been.called;
      expect(unbindSpy).to.have.been.called;
      expect(WebSocket.destroyed).to.be.true;
    });
  });

  describe('#bindToAppState', function () {

    it ('should bind to appState online/offline events', function () {

      appState.set('online', true);

      sinon.spy(WebSocket, 'connect');
      sinon.spy(WebSocket, 'close');

      WebSocket.bindToAppState();

      appState.set('online', false);
      expect(WebSocket.close).to.have.been.calledOnce;

      appState.set('online', true);
      expect(WebSocket.connect).to.have.been.calledOnce;

      WebSocket.close();
    });
  });

  describe('#connect', function () {

    it('should close any existing socket connection', function () {

      var closeSpy = sinon.spy(WebSocket, 'close');
      WebSocket.socket = {
        'close': sinon.spy()
      };

      // console.log(WebSocket);

      WebSocket.connect();
      expect(closeSpy).to.have.been.calledOnce;
    });

    it('should clear any existing socketTimeout timers', function () {

      var closeSpy = sinon.spy(WebSocket, 'close');
      var clearSpy = sinon.spy(WebSocket, 'clearSocketTimeout');
      WebSocket.socket = {
        'close': sinon.spy()
      };
      WebSocket.socketTimeout = 1;

      // console.log(WebSocket);

      WebSocket.connect();
      expect(closeSpy).to.have.been.calledOnce;
      expect(clearSpy).to.have.been.calledOnce;
    });
  });

  describe('#isConnected', function () {

    it ('should return false if no self.socket', function () {

      WebSocket.socket = undefined;
      WebSocket.isConnected().should.be.false;
    });

    it ('should return false if socket.readyState !== 1', function () {

      WebSocket.socket = {
        'readyState': 0,
        'close': function () {}
      };
      WebSocket.isConnected().should.be.false;
    });

    it ('should return true of socket.readyState === 1', function () {

      WebSocket.socket = {
        'readyState': 1,
        'close': function () {}
      };
      WebSocket.isConnected().should.be.true;
    });
  });

  describe('#send', function () {

    it('should call send on self.socket', function () {

      var spy = sinon.spy();

      WebSocket.socket = {
        'send': spy
      };

      var message = '123';

      WebSocket.send(message);

      expect(spy).to.have.been.calledWith(message);

      WebSocket.socket = undefined;
    });
  });

  describe('#close', function () {

    it('should call close on self.socket', function () {

      var spy = sinon.spy();

      WebSocket.socket = {
        'close': spy
      };

      WebSocket.close();

      expect(spy).to.have.been.called;

      WebSocket.socket = undefined;
    });
  });

  describe('#trackTimeout', function () {

    var clock, spy;
    beforeEach(function () {

      spy = sinon.spy();
      clock = sinon.useFakeTimers();

      WebSocket.socket = {
        'readyState': 0,
        'close': function () {}
      };

      WebSocket.connect = function () {};
      WebSocket.on('timeout', spy);

      WebSocket.trackTimeout();
    });

    afterEach(function () {
      clock.restore();
    });

    it('it should trigger "timeout" if socket not moved from state 0 after 2 seconds', function () {

      clock.tick(2500);
      expect(spy).to.have.been.calledOnce;
    });

    it('should not trigger "timeout" if socket moved from state 0 before 2 seconds', function () {

      setTimeout(function () {

        WebSocket.socket.readyState = 1;
      }, 500);

      clock.tick(2500);

      expect(spy).to.not.have.been.called;
    });
  });

  describe('#onSocketClose', function () {

    it('should trigger "close" and pass event object', function (done) {

      var spy = sinon.spy();

      WebSocket.connect = sinon.spy();

      var data = {
        'foo': 'bar'
      };

      WebSocket.on('close', function (e) {

        spy(e);
      });

      WebSocket.onSocketClose(data);

      expect(spy).to.have.been.calledWith(data);

      setTimeout(function () {

        expect(WebSocket.connect).to.have.been.calledOnce;
        done();
      }, 1500);
    });
  });

  describe('#onSocketError', function () {

    it('should trigger "error" and pass event object', function () {

      var spy = sinon.spy();

      var data = {
        'foo': 'bar'
      };

      WebSocket.on('error', function (e) {

        spy(e);
      });

      WebSocket.onSocketError(data);

      expect(spy).to.have.been.calledWith(data);
    });
  });

  describe('#onSocketMessage', function () {

    it('should trigger "message" and pass event object', function () {

      var spy = sinon.spy();

      var data = {
        'foo': 'bar'
      };

      WebSocket.on('message', function (e) {

        spy(e);
      });

      WebSocket.onSocketMessage(data);

      expect(spy).to.have.been.calledWith(data);
    });
  });

  describe('#onSocketOpen', function () {

    it('should trigger "open" and pass event object', function () {

      var spy = sinon.spy();

      var data = {
        'foo': 'bar'
      };

      WebSocket.on('open', function (e) {

        spy(e);
      });

      WebSocket.onSocketOpen(data);

      expect(spy).to.have.been.calledWith(data);
    });
  });

  describe('#onSocketTimeout', function () {

    it('should trigger "timeout"', function () {

      var spy = sinon.spy();

      var data = {
        'foo': 'bar'
      };

      WebSocket.on('timeout', function (e) {

        spy(e);
      });

      WebSocket.onSocketTimeout(data);

      expect(spy).to.have.been.called;
    });
  });

  describe('#validateToken', function () {

    it ('should throw if runtime.accessToken is undefined', function () {

      appState.set('accessToken', undefined);

      expect(function () {

        WebSocket.validateToken();
      }).to.throw('Cannot instantiate class without an auth token.');
    });

    it ('should not throw if runtime.accessToken is defined', function () {

      appState.set('accessToken', '' + Math.random());

      expect(function () {

        WebSocket.validateToken();
      }).to.not.throw();
    });
  });
});