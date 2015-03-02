describe('io/RestSocket Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var size = core.lib.size;
  var WBEventEmitter = core.WBEventEmitter;
  var WBDeferred = core.WBDeferred;

  var SchemaValidator = require('validators/SchemaValidator');

  var RestSocketClass = require('io/RestSocket');

  var config = require('../../config');
  var ApplicationState = require('models/ApplicationState');

  var RestSocket, OverClass, options, appState;

  beforeEach(function () {

    appState = new ApplicationState(config);

    options = {
      'appState': appState
    };

    // disable automatic websocket creation (for unit testing)
    OverClass = RestSocketClass.extend({
      'initialize': RestSocketClass.__super__.initialize
    });

    RestSocket = new OverClass(options);

    RestSocket.appState = appState;
  });

  describe('#destroy', function () {

    it ('should close and destroy native socket class', function () {

      var nativeSocketDestroy = sinon.spy();
      var unbindSpy = sinon.spy(RestSocket, 'unbindAll');

      RestSocket.socket = {
        'destroy': nativeSocketDestroy
      };

      RestSocket.destroy();

      expect(nativeSocketDestroy).to.have.been.called;
      expect(unbindSpy).to.have.been.called;
      expect(RestSocket.destroyed).to.be.true;
    });
  });

  describe('#wrapVerbs', function () {

    it ('should force all rest verbs to be called in the correct context always', function () {

      var spy = RestSocket.get = sinon.stub();

      RestSocket.wrapVerbs();

      var fn = RestSocket.get;

      fn();

      expect(spy).to.be.calledOn(RestSocket);
    });
  });

  describe('#pollForTimeouts', function () {

    it ('should poll #checkForRequestTimeouts every 1 second', function () {

      var clock = sinon.useFakeTimers();

      RestSocket.checkForRequestTimeouts = sinon.spy();
      RestSocket.pollForTimeouts();

      clock.tick(2500);
      clock.restore();

      expect(RestSocket.checkForRequestTimeouts).to.have.been.calledTwice;
    });
  });

  describe('#checkStillAuthorized', function () {

    it('should trigger unauthorized on error status code 401', function () {

      var spy = sinon.spy();

      RestSocket.on('unauthorized', spy);

      RestSocket.checkStillAuthorized(401);

      expect(spy).to.have.been.called;
    });
  });

  describe('#close', function () {

    it('should call close on self.socket', function () {

      var spy = sinon.spy();

      RestSocket.socket = {
        'close': spy
      };

      RestSocket.close();

      expect(spy).to.have.been.called;

      RestSocket.socket = undefined;
    });
  });

  describe('#bindToSocket', function () {

    it ('should bind to self.socket "message" events', function () {

      var socket = new WBEventEmitter();

      var RestSocket = new OverClass(options);

      var messageSpy = sinon.spy(RestSocket, 'onMessage');

      RestSocket.socket = socket;
      RestSocket.bindToSocket();

      socket.trigger('message', {
        'data': JSON.stringify({
          'body': JSON.stringify({
            'foo': 'bar'
          })
        })
      });

      expect(messageSpy).to.have.been.called;

      RestSocket.unbindFrom(RestSocket.socket);
      RestSocket.socket = undefined;
      RestSocket.onMessage.restore();
    });
  });

  describe('#onSocketConnect', function () {

    it ('should trigger connected event', function () {

      var spy = sinon.spy();

      RestSocket.getSocketHealth = sinon.stub().returns(new WBDeferred().resolve());

      RestSocket.on('connected', spy);
      RestSocket.onSocketConnect();

      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('#pollHealth', function () {

    it ('should call #getSocketHealth ever 15 seconds while connected to socket', function () {

      var clock = sinon.useFakeTimers();

      RestSocket.connected = true;
      RestSocket.getSocketHealth = sinon.stub().returns(new WBDeferred().resolve());

      RestSocket.pollHealth();

      clock.tick(31000);
      clock.restore();

      expect(RestSocket.getSocketHealth).to.have.been.calledTwice;
    });

    it ('should call #cancelPollHealth if no longer connected', function () {

      var clock = sinon.useFakeTimers();

      RestSocket.connected = false;
      RestSocket.cancelPollHealth = sinon.spy();

      RestSocket.pollHealth();

      clock.tick(16000);
      clock.restore();

      expect(RestSocket.cancelPollHealth).to.have.been.calledTwice;
    });
  });

  describe('#getSocketHealth', function () {

    it ('should make a health request', function () {

      var requestSpy = sinon.stub(RestSocket, 'request');
      requestSpy.returns(new WBDeferred().resolve().promise());

      var result = RestSocket.getSocketHealth();

      expect(requestSpy).to.have.been.calledOnce;
      var args = requestSpy.firstCall.args;
      for(var i=0, len=4; i < len; i++) {
        expect(args[i]).to.be.undefined;
      }
      expect(args[4]).to.equal('health');
      expect(result.state()).to.equal('resolved');
    });
  });

  describe('#handleMessage', function () {

    it ('it should trigger CRUD operation event if present in message data', function () {

      var instance = new OverClass(options);

      var op = 'update';

      var data = {

        'foo': 'bar',
        'operation': op
      };

      var triggerSpy = sinon.spy();

      instance.on(op, triggerSpy);

      instance.handleMessage(data);

      expect(triggerSpy).to.have.been.called;

    });
  });

  describe('#handleDesktopNotification', function () {

    it ('should trigger desktopNotification event', function () {

      var spy = sinon.spy();

      RestSocket.on('desktopNotification', spy);
      RestSocket.handleDesktopNotification();

      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('#socketRequest', function () {

    it('should add a socketRequest deffered to self.requests, and seend message to self.socket', function () {

      var request = new WBDeferred();
      var spy = sinon.spy();
      var message = 'foobar';

      appState.set('online', true);

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return true;}
      };

      RestSocket.socketRequest(request, 'POST', '/unit', message);

      expect(spy).to.have.been.called;
      expect(size(RestSocket.requests)).to.equal(1);

      // cleanup
      RestSocket.socket = undefined;
      RestSocket.requests = {};
    });

    it ('should send message.body JSON as a string', function () {

      var spy = sinon.spy();
      var data = {
        'foo': 'bar',
        'bool': false,
        'undefined':undefined,
        'null': null,
        'num': 123
      };
      var request = new WBDeferred();

      var stringified = JSON.stringify(data);

      appState.set('online', true);

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return true;}
      };

      RestSocket.socketRequest(request, 'POST', '/unit', data);

      var args = spy.firstCall.args;
      var message = JSON.parse(args[0]);

      expect(spy).to.have.been.called;
      expect(args[0]).to.be.a.string;
      expect(message.body).to.equal(stringified);

      // cleanup
      RestSocket.socket = undefined;
      RestSocket.requests = {};
    });

    it('should reject the socketRequest if the client is not online', function () {

      appState.set('online', false);

      var request = new WBDeferred();

      var spy = sinon.spy();
      var message = 'foobar';

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return true;}
      };

      RestSocket.socketRequest(request, 'POST', '/unit', message);

      var failSpy = sinon.spy();
      request.fail(failSpy);

      var failArgs = failSpy.firstCall.args;
      var failResponse = failArgs[0];
      var failCode = failArgs[1];

      expect(spy).to.not.have.been.called;
      expect(size(RestSocket.requests)).to.equal(1);
      expect(request.state()).to.equal('rejected');
      expect(failSpy).to.have.been.called;
      expect(failResponse.errors[0]).to.equal('no websocket connection available');
      expect(failCode).to.equal(0);

      // cleanup
      RestSocket.socket = undefined;
      RestSocket.requests = {};
    });

    it('should reject the socketRequest if the WebSocket is not connected', function () {

      var spy = sinon.spy();
      var message = 'foobar';
      var request = new WBDeferred();

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return false;}
      };

      RestSocket.socketRequest(request, 'POST', '/unit', message);

      var failSpy = sinon.spy();
      request.fail(failSpy);

      var failArgs = failSpy.firstCall.args;
      var failResponse = failArgs[0];
      var failCode = failArgs[1];

      expect(spy).to.not.have.been.called;
      expect(size(RestSocket.requests)).to.equal(1);
      expect(request.state()).to.equal('rejected');
      expect(failSpy).to.have.been.called;
      expect(failResponse.errors[0]).to.equal('no websocket connection available');
      expect(failCode).to.equal(0);

      // cleanup
      RestSocket.socket = undefined;
      RestSocket.requests = {};
    });

    it('should not immediately reject the socketRequest if the WebSocket is connected', function () {

      var spy = sinon.spy();
      var message = 'foobar';
      var request = new WBDeferred();

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return true;}
      };

      RestSocket.socketRequest(request, 'POST', '/unit', message);

      var failSpy = sinon.spy();
      request.fail(failSpy);

      var successSpy = sinon.spy();
      request.done(successSpy);

      expect(spy).to.have.been.called;
      expect(size(RestSocket.requests)).to.equal(1);
      expect(request.state()).to.equal('pending');
      expect(failSpy).to.not.have.been.called;
      expect(successSpy).to.not.have.been.called;

      // cleanup
      RestSocket.socket = undefined;
      RestSocket.requests = {};
    });
  });

  describe('#compileHeaders', function () {

    it('should allow config.extendHeaders to extend the headers object', function () {

      RestSocket.config = {
        'extendHeaders': function (h) {
          h.foobar = 'bazbazbaz';
        }
      };

      var headers = RestSocket.compileHeaders('123');

      expect(headers.foobar).to.equal('bazbazbaz');
    });
  });

  describe('#requestWrapper', function () {

    it('should release a request when RestSocket class is ready', function () {

      var spy = sinon.spy();
      var message = 'foobar';

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return true;}
      };

      RestSocket.ready = new WBDeferred();
      RestSocket.requestWrapper('POST', '/unit', message);
      RestSocket.ready.resolve();

      expect(spy).to.have.been.called;
      expect(size(RestSocket.requests)).to.equal(1);

      // cleanup
      RestSocket.ready = new WBDeferred();
      RestSocket.socket = undefined;
      RestSocket.requests = {};
    });
  });

  describe('#onSocketFalure', function () {

    it ('should cancel request if websocket emits an error event', function () {

      RestSocket.socket = new WBEventEmitter();
      RestSocket.bindToSocket();

      var requestID = '111';

      var successSpy = sinon.spy();
      var failSpy = sinon.spy();

      var request = new WBDeferred();
      request
        .done(successSpy)
        .fail(failSpy);

      RestSocket.requests = {};

      var now = Date.now();
      var then = now - RestSocket.timeout;

      request.startTime = then;
      request.requestID = requestID;

      RestSocket.requests[requestID] = request;

      RestSocket.socket.trigger('error');

      var args = failSpy.firstCall.args;
      var failureStatus = args[1];
      var failureBody = args[0];

      expect(successSpy).to.not.have.been.called;
      expect(failSpy).to.have.been.called;
      expect(failureStatus).to.equal(0);
      expect(failureBody.errors && failureBody.errors[0]).to.equal('websocket connection lost');
    });

    it ('should cancel request if websocket emits an close event', function () {

      RestSocket.socket = new WBEventEmitter();
      RestSocket.bindToSocket();

      var requestID = '111';

      var successSpy = sinon.spy();
      var failSpy = sinon.spy();

      var request = new WBDeferred();
      request
        .done(successSpy)
        .fail(failSpy);

      RestSocket.requests = {};

      var now = Date.now();
      var then = now - RestSocket.timeout;

      request.startTime = then;
      request.requestID = requestID;

      RestSocket.requests[requestID] = request;

      RestSocket.socket.trigger('close');

      var args = failSpy.firstCall.args;
      var failureStatus = args[1];
      var failureBody = args[0];

      expect(successSpy).to.not.have.been.called;
      expect(failSpy).to.have.been.called;
      expect(failureStatus).to.equal(0);
      expect(failureBody.errors && failureBody.errors[0]).to.equal('websocket connection lost');
    });
  });

  describe('#checkForRequestTimeouts', function () {

    it ('should iterate over self.requests and reject requests if timedout', function () {

      var requestID = '111';
      var requestID2 = '222';

      var successSpy = sinon.spy();
      var failSpy = sinon.spy();
      var successSpy2 = sinon.spy();
      var failSpy2 = sinon.spy();

      var request = new WBDeferred();
      request
        .done(successSpy)
        .fail(failSpy);

      var request2 =  new WBDeferred();
      request2
        .done(successSpy2)
        .fail(failSpy2);

      RestSocket.requests = {};

      var now = Date.now();
      var then = now - RestSocket.timeout;

      request2.startTime = request.startTime = then;

      request.requestID = requestID;
      request2.requestID = requestID2;

      RestSocket.requests[requestID] = request;
      RestSocket.requests[requestID2] = request2;

      RestSocket.checkForRequestTimeouts();

      var args = failSpy.firstCall.args;
      var failureStatus = args[1];
      var failureBody = args[0];

      expect(successSpy).to.not.have.been.called;
      expect(failSpy).to.have.been.called;
      expect(failureStatus).to.equal(408);
      expect(failureBody.errors && failureBody.errors[0]).to.equal('request timedout locally due to no response in ' + RestSocket.timeout);

      expect(successSpy2).to.not.have.been.called;
      expect(failSpy2).to.have.been.called;
    });

    it ('should iterate over self.requests and do nothing if not timedout', function () {

      var requestID = '111';

      var successSpy = sinon.spy();
      var failSpy = sinon.spy();

      var request = new WBDeferred();
      request
        .done(successSpy)
        .fail(failSpy);

      RestSocket.requests = {};

      var now = Date.now();
      var then = now - (RestSocket.timeout / 2);

      request.startTime = then;
      request.requestID = requestID;

      RestSocket.requests[requestID] = request;

      RestSocket.checkForRequestTimeouts();

      expect(successSpy).to.not.have.been.called;
      expect(failSpy).to.not.have.been.called;
    });
  });

  describe('#delete', function () {

    it ('should call #requestWrapper with the method DELETE and correct URI', function () {

      var spy = sinon.spy();
      var deleteSpy = sinon.spy(RestSocket, 'requestWrapper');
      var path = '/foo';

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return true;}
      };

      RestSocket.ready = new WBDeferred();
      RestSocket['delete'](path);
      RestSocket.ready.resolve();

      var args = deleteSpy.args[0];
      var method = args[0];
      var uri = args[1];
      var data = args[2];

      expect(method).to.equal('DELETE');
      expect(uri).to.equal(path);
      expect(data).to.be.undefined;

      expect(spy).to.have.been.called;
      expect(size(RestSocket.requests)).to.equal(1);

      // cleanup
      RestSocket.ready = new WBDeferred();
      RestSocket.socket = undefined;
      RestSocket.requests = {};
      RestSocket.requestWrapper.restore();
    });
  });

  describe('#get', function () {

    it ('should call #requestWrapper with the method GET and correct URI', function () {

      var spy = sinon.spy();
      var deleteSpy = sinon.spy(RestSocket, 'requestWrapper');
      var path = '/foo';
      var data = {
        'foo': 'bar'
      };

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return true;}
      };

      RestSocket.ready = new WBDeferred();
      RestSocket.get(path, data);
      RestSocket.ready.resolve();

      var args = deleteSpy.args[0];
      var method = args[0];
      var uri = args[1];
      var argData = args[2];

      expect(method).to.equal('GET');
      expect(uri).to.equal('/foo?foo=bar');
      expect(argData).to.be.undefined;

      expect(spy).to.have.been.called;
      expect(size(RestSocket.requests)).to.equal(1);

      // cleanup
      RestSocket.ready = new WBDeferred();
      RestSocket.socket = undefined;
      RestSocket.requests = {};
      RestSocket.requestWrapper.restore();
    });
  });

  describe('#patch', function () {

    it ('should call #requestWrapper with the method PATCH, correct URI, and data', function () {

      var spy = sinon.spy();
      var deleteSpy = sinon.spy(RestSocket, 'requestWrapper');
      var path = '/foo';
      var data = {
        'bar': 'foo'
      };

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return true;}
      };

      RestSocket.ready = new WBDeferred();
      RestSocket.patch(path, data);
      RestSocket.ready.resolve();

      var args = deleteSpy.args[0];
      var method = args[0];
      var uri = args[1];
      var argData = args[2];

      expect(method).to.equal('PATCH');
      expect(uri).to.equal(path);
      expect(argData.bar).to.equal(data.bar);

      expect(spy).to.have.been.called;
      expect(size(RestSocket.requests)).to.equal(1);

      // cleanup
      RestSocket.ready = new WBDeferred();
      RestSocket.socket = undefined;
      RestSocket.requests = {};
      RestSocket.requestWrapper.restore();
    });
  });

  describe('#post', function () {

    it ('should call #requestWrapper with the method POST, correct URI, and data', function () {

      var spy = sinon.spy();
      var deleteSpy = sinon.spy(RestSocket, 'requestWrapper');
      var path = '/foo';
      var data = {
        'bar': 'foo'
      };

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return true;}
      };

      RestSocket.ready = new WBDeferred();
      RestSocket.post(path, data);
      RestSocket.ready.resolve();

      var args = deleteSpy.args[0];
      var method = args[0];
      var uri = args[1];
      var argData = args[2];

      expect(method).to.equal('POST');
      expect(uri).to.equal(path);
      expect(argData.bar).to.equal(data.bar);

      expect(spy).to.have.been.called;
      expect(size(RestSocket.requests)).to.equal(1);

      // cleanup
      RestSocket.ready = new WBDeferred();
      RestSocket.socket = undefined;
      RestSocket.requests = {};
      RestSocket.requestWrapper.restore();
    });
  });

  describe('#put', function () {

    it ('should call #requestWrapper with the method PUT, correct URI, and data', function () {

      var spy = sinon.spy();
      var deleteSpy = sinon.spy(RestSocket, 'requestWrapper');
      var path = '/foo';
      var data = {
        'bar': 'foo'
      };

      RestSocket.requests = {};
      RestSocket.socket = {
        'send': spy,
        'isConnected': function () {return true;},
      };

      RestSocket.ready = new WBDeferred();
      RestSocket.put(path, data);
      RestSocket.ready.resolve();

      var args = deleteSpy.args[0];
      var method = args[0];
      var uri = args[1];
      var argData = args[2];

      expect(method).to.equal('PUT');
      expect(uri).to.equal(path);
      expect(argData.bar).to.equal(data.bar);

      expect(spy).to.have.been.called;
      expect(size(RestSocket.requests)).to.equal(1);

      // cleanup
      RestSocket.ready = new WBDeferred();
      RestSocket.socket = undefined;
      RestSocket.requests = {};
      RestSocket.requestWrapper.restore();
    });
  });

  describe('#onMessage', function () {

    it('should route message to #handleRequest if message maps to a request sent by this client', function () {

      var handleRequestSpy = sinon.spy(RestSocket, 'handleRequest');
      var handleMessegeSpy = sinon.spy(RestSocket, 'handleMessage');

      var requestID = '123lk12j3';
      var request = new WBDeferred();
      RestSocket.requests[requestID] = request;

      var hahnMessage = JSON.stringify({
        'headers': {
          'x-client-request-id': requestID
        },
        'type': 'request'
      });

      RestSocket.onMessage({

        'data': hahnMessage
      });

      expect(handleRequestSpy).to.have.been.called;
      expect(handleMessegeSpy).to.not.have.been.called;

      var args = handleRequestSpy.firstCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.deep.equal(JSON.parse(hahnMessage));
      expect(args[2]).to.equal(requestID);

      // cleanup
      RestSocket.requests = {};
      RestSocket.handleRequest.restore();
      RestSocket.handleMessage.restore();
    });

    it ('should route message to #handleHealthRequest if of type health and maps to a request', function () {

      var handleHealthrequestSpy = sinon.spy(RestSocket, 'handleHealthRequest');

      var requestID = '123lk12j3';
      var request = new WBDeferred();
      RestSocket.requests[requestID] = request;

      var hahnMessage = JSON.stringify({
        'headers': {
          'x-client-request-id': requestID
        },
        'type': 'health'
      });

      RestSocket.onMessage({

        'data': hahnMessage
      });

      expect(handleHealthrequestSpy).to.have.been.called;

      var args = handleHealthrequestSpy.firstCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.deep.equal(JSON.parse(hahnMessage));
      expect(args[2]).to.equal(requestID);

      // cleanup
      RestSocket.requests = {};
      handleHealthrequestSpy.restore();
    });

    it('should route message to #handleMessage if message does not map to a request sent by this client', function () {


      var handleRequestSpy = sinon.spy(RestSocket, 'handleRequest');
      var handleMessegeSpy = sinon.spy(RestSocket, 'handleMessage');

      RestSocket.requests = {};

      RestSocket.onMessage({

        'data': JSON.stringify({
          'headers': {
            'x-client-request-id': '123'
          }
        })
      });

      expect(handleRequestSpy).to.not.have.been.called;
      expect(handleMessegeSpy).to.have.been.called;

      // cleanup
      RestSocket.requests = {};
      RestSocket.handleRequest.restore();
      RestSocket.handleMessage.restore();
    });

    it('should route message to #handleDesktopNotification if message is a desktop_notification', function () {


      var handleRequestSpy = sinon.spy(RestSocket, 'handleRequest');
      var handleDesktopNotificationSpy = sinon.spy(RestSocket, 'handleDesktopNotification');

      RestSocket.requests = {};

      RestSocket.onMessage({

        'data': JSON.stringify({
          'headers': {
            'x-client-request-id': '123'
          },
          'type': 'desktop_notification'
        })
      });

      expect(handleRequestSpy).to.not.have.been.called;
      expect(handleDesktopNotificationSpy).to.have.been.called;

      // cleanup
      RestSocket.requests = {};
      RestSocket.handleRequest.restore();
      RestSocket.handleDesktopNotification.restore();
    });

    it('should route message to #handleMessage if message is a mutation', function () {


      var handleRequestSpy = sinon.spy(RestSocket, 'handleRequest');
      var handleMessageSpy = sinon.spy(RestSocket, 'handleMessage');

      RestSocket.requests = {};

      RestSocket.onMessage({

        'data': JSON.stringify({
          'headers': {
            'x-client-request-id': '123'
          },
          'type': 'mutation',
          'subject': {
            'type': 'task'
          },
          'version': 1
        })
      });

      expect(handleRequestSpy).to.not.have.been.called;
      expect(handleMessageSpy).to.have.been.called;

      // cleanup
      RestSocket.requests = {};
      RestSocket.handleRequest.restore();
      RestSocket.handleMessage.restore();
    });
  });

  describe('#isCorrectMutationVersion', function () {

    it ('should return false if mutation is vertsion 2 and endpoint is not a version 2 endpoint in SDK', function () {

      var data = {
        'subject': {
          'type': 'task'
        },
        'version': 2
      };

      expect(RestSocket.isCorrectMutationVersion(data)).to.be.false;
    });

    it ('should return true if mutation is vertsion 1 and endpoint is not a version 2 endpoint in SDK', function () {

      var data = {
        'subject': {
          'type': 'task'
        },
        'version': 1
      };

      expect(RestSocket.isCorrectMutationVersion(data)).to.be.true;
    });

    it ('should return true if mutation is version 1 and endpoint can be a version 2 endpoint in SDK', function () {

      var data = {
        'subject': {
          'type': 'file'
        },
        'version': 1
      };

      expect(RestSocket.isCorrectMutationVersion(data)).to.be.true;
    });

    it ('should return true if mutation is vertsion 2 and endpoint is a version 2 endpoint in SDK', function () {

      var data = {
        'subject': {
          'type': 'file'
        },
        'version': 2
      };

      expect(RestSocket.isCorrectMutationVersion(data)).to.be.true;
    });
  });

  describe('#generateUID', function () {

    it ('should generate a unique id for use by requests', function () {

      var id;
      for (var i=0; i < 10000; i++) {

        id = RestSocket.generateUID();
        expect(RestSocket.requests[id]).to.be.undefined;
        RestSocket.requests[id] = 1;
      }

      // cleanup
      RestSocket.requests = {};
    });
  });

  describe('#handleRequest', function () {

    it ('should resolve request deferred if data.status is 2XX', function () {

      var request = new WBDeferred();

      var data = {
        'status': 231 // TROLL
      };

      var resolveSpy = sinon.spy(request, 'resolve');
      var rejectSpy = sinon.spy(request, 'reject');

      RestSocket.handleRequest(request, data);

      expect(resolveSpy).to.have.been.calledOnce;
      expect(resolveSpy).to.have.been.calledOn(request);
      expect(rejectSpy).to.not.have.been.called;
    });

    it ('should reject request deferred if data.status is NOT 2XX', function () {

      var request = new WBDeferred();

      var data = {
        'status': 587 // TROLL
      };

      var resolveSpy = sinon.spy(request, 'resolve');
      var rejectSpy = sinon.spy(request, 'reject');

      RestSocket.handleRequest(request, data);

      expect(resolveSpy).to.not.have.been.called;
      expect(rejectSpy).to.have.been.calledOnce;
      expect(rejectSpy).to.have.been.calledOn(request);
    });

    it ('should resolve request with the correct argument order', function () {

      var request = new WBDeferred();
      var response = {'key': 'value'};
      var status = 287;

      var data = {
        'body': response,
        'status': status
      };

      var resolveSpy = sinon.spy();
      var rejectSpy = sinon.spy();

      request
        .done(resolveSpy)
        .fail(rejectSpy);

      RestSocket.handleRequest(request, data);

      expect(resolveSpy).to.have.been.called;
      expect(rejectSpy).to.not.have.been.called;

      var doneArgs = resolveSpy.firstCall.args;
      var doneResponse = doneArgs[0];
      var doneStatus = doneArgs[1];

      expect(doneResponse).to.equal(response);
      expect(doneStatus).to.equal(status);
    });

    it ('should reject request with the correct argument order', function () {

      var request = new WBDeferred();

      var response = {'key': 'value'};
      var status = 567;

      var data = {
        'body': response,
        'status': status
      };

      var resolveSpy = sinon.spy();
      var rejectSpy = sinon.spy();

      request
        .done(resolveSpy)
        .fail(rejectSpy);

      RestSocket.handleRequest(request, data);

      expect(resolveSpy).to.not.have.been.called;
      expect(rejectSpy).to.have.been.called;

      var failArgs = rejectSpy.firstCall.args;
      var failResponse = failArgs[0];
      var failStatus = failArgs[1];

      expect(failResponse).to.equal(response);
      expect(failStatus).to.equal(status);
    });

    it ('should try to validate response body if an array', function () {

      var spy = sinon.spy(SchemaValidator, 'validateData');

      var request = new WBDeferred();

      var data = {
        'status': 200,
        'body': [{
          'id': 123,
          'type': 'foo'
        }]
      };

      RestSocket.handleRequest(request, data);

      expect(spy).to.have.been.calledOnce;
      spy.restore();
    });

    it ('should try to validate response body if when not an array', function () {

      var spy = sinon.spy(SchemaValidator, 'validateData');

      var request = new WBDeferred();

      var data = {
        'status': 200,
        'body': {
          'id': 123,
          'type': 'foo'
        }
      };

      RestSocket.handleRequest(request, data);

      expect(spy).to.have.been.calledOnce;
      spy.restore();
    });

    it ('should cleanup self.requests via passed in requestID', function () {

      var requestID = '120398u1lk32j';
      var request = new WBDeferred();

      RestSocket.requests[requestID] = request;

      RestSocket.handleRequest(request, {}, requestID);

      expect(RestSocket.requests[requestID]).to.be.undefined;
    });
  });

  describe('#handleHealthRequest', function () {

    it ('should resolve request when data.body.healthy is true', function () {

      var request = new WBDeferred();
      var data = {
        'body': {
          'healthy': true
        }
      };

      var requestID = '129387123lk1j2301928u3';

      RestSocket.handleHealthRequest(request, data, requestID);

      expect(request.state()).to.equal('resolved');
    });

    it ('should reject request when data.body.healthy is falsy', function () {

      var request = new WBDeferred();
      var data = {};

      var requestID = '129387123lk1j2301928u3';

      RestSocket.handleHealthRequest(request, data, requestID);

      expect(request.state()).to.equal('rejected');
    });
  });

  describe('#normalizeHeaders', function () {

    it ('should normalize header keys to all lowercase', function () {

      var headers = {
        'HALLO': 'foobar',
        'hello': 'moobar'
      };

      var normalized = RestSocket.normalizeHeaders(headers);

      for (var key in headers) {
        expect(normalized[key.toLowerCase()]).to.equal(headers[key]);
      }
    });
  });

  describe('#cancelInflightCreate', function () {

    it ('should resolve the pending request for the requestID', function () {

      var requestID = 'asdflkasdjflkj';
      var request = new WBDeferred();

      RestSocket.requests[requestID] = request;

      var requestSpy = sinon.spy();

      request.done(requestSpy, requestSpy);

      RestSocket.cancelInflightCreate(requestID);

      expect(requestSpy).to.have.been.calledOnce;

      var args = requestSpy.firstCall.args;
      expect(args[0]).to.be.an.object;
      expect(args[1]).to.equal(200);

      expect(RestSocket.requests[requestID]).to.be.undefined;
    });
  });
});