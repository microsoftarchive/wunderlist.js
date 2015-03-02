describe('io/IO Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  var IOClass = require('io/IO');
  var config = require('../../config');
  var ApplicationState = require('models/ApplicationState');
  var SchemaValidator = require('validators/SchemaValidator');

  var IO, appState, options;

  beforeEach(function () {

    appState = new ApplicationState(config);

    config = appState.toJSON();

    options = {
      'config': config
    };

    IO = new IOClass(options);
  });

  // just a couple of sanity checks, are the routes compiled from our local mock?
  // do they work as expected?
  describe('#routes', function () {

    it('should compile routes to a hash maping hosts to route matching regexes for fast lookup', function () {

      expect(IO.routes[appState.attributes.api.host]).to.not.be.undefined;
    });
  });

  describe('resolveUrl', function () {

    it('should resolve relative user/authenticate route to fully qualified URL', function () {

      var resolvedUrl = IO.resolveUrl('/v1/authenticate');
      resolvedUrl.should.equal(appState.attributes.api.host + '/v1/authenticate');
    });
  });

  describe('#setAuthorization', function () {

    it ('should set x-access-token and x-client-id', function () {

      config.accessToken = 'sdlfkjsldfkj';

      var headers = {};

      IO.setAuthorization(headers, '/blah');

      expect(headers['x-access-token']).to.equal(config.accessToken);
    });
  });

  describe('#extendHeaders', function () {

    it ('should not set x-access-token, but set x-client-id on authenticate routes', function () {

      var accessToken = 'sdlfkjsldfkj';
      var clientID = '2092093809830980983098';

      config.accessToken = accessToken;
      config.clientID = clientID;

      var headers = {};

      IO.extendHeaders(headers, '/v1/authenticate');

      expect(headers['x-access-token']).to.be.undefined;
      expect(headers['x-client-id']).to.equal(clientID);
    });

    it('should execute config.extendHeaders', function () {

      var spy = IO.config.extendHeaders = sinon.spy();
      var headers = {'foo': 'bar'};
      IO.extendHeaders(headers);

      expect(spy).to.have.been.calledOnce;
    });

    it('should allow config.extendHeaders to extend the headers object', function () {

      IO.config.extendHeaders = function (h) {
        h.foobar = 'bazbazbaz';
      };

      var headers = {};
      IO.extendHeaders(headers);

      expect(headers.foobar).to.equal('bazbazbaz');
    });
  });

  describe('#requestWrapper', function () {

    it ('should call some IO method with x-client-request-id set if called with a requestID passed', function () {

      var method = 'patch';
      var path = '/foo/bar';
      var data = {
        'foo': 'bar'
      };
      var requestID = '123';
      var IOInstance = new IOClass(options);
      var patchSpy = sinon.spy(IOInstance.io, '_patch');

      IOInstance.requestWrapper(method, path, data, requestID);

      expect(patchSpy).to.have.been.called;

      var args = patchSpy.firstCall.args;
      var headers = args[2];

      expect(headers['x-client-request-id']).to.equal(requestID);
    });

    it ('should generate a requestID for the request if no requestID provided in arguments', function () {

      var method = 'patch';
      var path = '/foo/bar';
      var data = {
        'foo': 'bar'
      };

      var IOInstance = new IOClass(options);
      var patchSpy = sinon.spy(IOInstance.io, '_patch');

      IOInstance.requestWrapper(method, path, data);

      expect(patchSpy).to.have.been.called;

      var args = patchSpy.firstCall.args;
      var headers = args[2];

      expect(headers['x-client-request-id']).to.not.be.undefined;
    });

    it ('should resolve with the correct argument order', function () {

      var response = {'key': 'value'};
      var status = 666;
      var xhr = {
        'status': status
      };

      var method = 'NUKE';

      var IOInstance = new IOClass(options);

      IOInstance.io._NUKE = function () {

        return new WBDeferred().resolve(response, xhr);
      };

      var request = IOInstance.requestWrapper(method, '/nowhere', {});

      var doneSpy = sinon.spy();
      var failSpy = sinon.spy();

      request
        .done(doneSpy)
        .fail(failSpy);

      expect(doneSpy).to.have.been.called;
      expect(failSpy).to.not.have.been.called;

      var successArgs = doneSpy.firstCall.args;
      var successResponse = successArgs[0];
      var successStatus = successArgs[1];

      expect(successResponse).to.equal(response);
      expect(successStatus).to.equal(status);
    });

    it ('should reject with the correct argument order', function () {

      var response = {'key': 'value'};
      var status = 666;
      var xhr = {
        'status': status,
        'response': {
          'data': response
        }
      };

      var method = 'NUKE';

      var IOInstance = new IOClass(options);

      IOInstance.io._NUKE = function () {

        return new WBDeferred().reject(response, xhr);
      };

      var request = IOInstance.requestWrapper(method, '/nowhere', {});

      var doneSpy = sinon.spy();
      var failSpy = sinon.spy();

      request
        .done(doneSpy)
        .fail(failSpy);

      expect(doneSpy).to.not.have.been.called;
      expect(failSpy).to.have.been.called;

      var failArgs = failSpy.firstCall.args;
      var failResponse = failArgs[0];
      var failStatus = failArgs[1];

      expect(failResponse).to.equal(response);
      expect(failStatus).to.equal(status);
    });

    it ('should try validate data in response when array', function () {

      var validateSpy = sinon.spy(SchemaValidator, 'validateData');

      IO.io._patch = sinon.stub().returns(new WBDeferred().resolve(
        [{
          'id': 123,
          'type': 'foo'
        }],

        {
          'status': 200
        }
      ));

      IO.requestWrapper('patch', '/foo/bar', {'foo': 'bar'});

      expect(validateSpy).to.have.been.calledOnce;

      validateSpy.restore();
    });

    it ('should try validate data in response when not array', function () {

      var validateSpy = sinon.spy(SchemaValidator, 'validateData');

      IO.io._patch = sinon.stub().returns(new WBDeferred().resolve(
        {
          'id': 123,
          'type': 'foo'
        },

        {
          'status': 200
        }
      ));

      IO.requestWrapper('patch', '/foo/bar', {'foo': 'bar'});

      expect(validateSpy).to.have.been.calledOnce;

      validateSpy.restore();
    });

    it ('should trigger unauthorized if status code is 401', function () {

      IO.io._patch = sinon.stub().returns(new WBDeferred().reject({}, {'status': 401}));

      var spy = sinon.spy();

      IO.on('unauthorized', spy);

      IO.requestWrapper('patch', '/foo/bar', {'foo': 'bar'});

      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('#cancelInflightCreate', function () {

    it ('should resolve the pending request for the requestID', function () {

      var requestID = 'asdflkasdjflkj';
      var request = new WBDeferred();

      IO.requests[requestID] = request;

      var requestSpy = sinon.spy();

      request.done(requestSpy, requestSpy);

      IO.cancelInflightCreate(requestID);

      expect(requestSpy).to.have.been.calledOnce;

      var args = requestSpy.firstCall.args;
      expect(args[0]).to.be.an.object;
      expect(args[1]).to.equal(200);

      expect(IO.requests[requestID]).to.be.undefined;
    });
  });
});
