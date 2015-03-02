describe('io/io/ajax Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;
  var WBEventEmitter = core.WBEventEmitter;

  var AjaxClass = require('io/io/AjaxTransport');
  var ajaxInstance = AjaxClass;

  afterEach(function () {

    ajaxInstance.reset();
  });

  describe('#reset', function () {

    it ('should reset requestsQueue and executingRequests', function () {

      ajaxInstance.requestsQueue = [1,2,3,];
      ajaxInstance.executingRequests = {a:1, b:2};
      ajaxInstance.reset();

      expect(ajaxInstance.requestsQueue.length).to.equal(0);
      expect(Object.keys(ajaxInstance.executingRequests).length).to.equal(0);
    });
  });

  describe('#xhrRequest', function () {

    it ('should setup data as params on the request URL and unset data for GET requests', function () {

      var deferred = new WBDeferred();
      var request = ajaxInstance.xhrRequest('http://foo.xyz/bar', {
        'type': 'GET',
        'data': {
          'foo': 'bar'
        }
      }, deferred);

      expect(request.url).to.equal('http://foo.xyz/bar?foo=bar');
    });

    it ('should be possible to set a timeout for the request via options', function () {

      var timeout = 34893;

      var deferred = new WBDeferred();
      var request = ajaxInstance.xhrRequest('http://foo.xyz/bar', {
        'type': 'GET',
        'data': {
          'foo': 'bar'
        },
        'timeout': timeout
      }, deferred);

      expect(request.xhr.timeout).to.equal(timeout);
    });
  });

  describe('#attachXhrListeners', function () {

    it ('should attach event handlers to passed in request object', function () {

      var failEvents = ['error', 'abort', 'timeout'];

      var MockRequest = WBEventEmitter.extend({
        'addEventListener': function () {

          var self = this;
          self.on.apply(self, arguments);
        }
      });

      var request = new MockRequest();

      var deferred = {
        'resolve': function () {},
        'reject': function () {}
      };

      ajaxInstance.attachXhrListeners(request, deferred);

      var failSpy = sinon.spy(ajaxInstance, 'onXhrFail');
      failEvents.forEach(function (eventName) {

        request.trigger(eventName);
      });
      expect(failSpy.callCount).to.equal(3);

      var loadSpy = sinon.spy(ajaxInstance, 'onXhrLoad');
      request.trigger('load');
      expect(loadSpy).to.have.been.calledOnce;

      var progressSpy = sinon.spy(ajaxInstance, 'onXhrProgress');
      request.trigger('progress');
      expect(progressSpy).to.have.been.calledOnce;
    });
  });

  describe('#onXhrLoad', function () {

    it ('should resolve a deferred if request.status is of 2XX', function () {

      var resolveSpy = sinon.spy();
      var rejectSpy = sinon.spy();
      var deferred = {
        'resolve': resolveSpy,
        'reject': rejectSpy
      };

      ajaxInstance.onXhrLoad(null, {'status': 234}, deferred);

      expect(resolveSpy).to.have.been.calledOnce;
      expect(rejectSpy).to.not.have.been.called;
    });
  });

  describe('#executeRequest', function () {

    var xhrRequest = ajaxInstance.xhrRequest;

    beforeEach(function () {

      xhrRequest = ajaxInstance.xhrRequest;
    });

    afterEach(function () {

      ajaxInstance.xhrRequest = xhrRequest;
    });

    it ('should call onFailure when request fails', function () {

      var data = {};
      var xhr = {
        'getResponseHeader': sinon.stub(),
        'responseText': 'foobar'
      };

      var deferred = new WBDeferred().reject(data, xhr);
      ajaxInstance.xhrRequest = sinon.stub().returns(deferred.promise());

      var failureSpy = sinon.spy(ajaxInstance, 'onFailure');

      ajaxInstance.executeRequest({
        'options': {}
      });

      expect(failureSpy).to.have.been.calledOnce;

      failureSpy.restore();
    });
  });

  describe('#queueRequest', function () {

    it ('should queue up requests', function () {

      // override checkQueue to do nothing
      var checkQueueSpy = sinon.spy();
      var OverClass = AjaxClass.extend({
        'checkQueue': checkQueueSpy
      });

      var thisInstance = OverClass;

      thisInstance.queueRequest('/foo/bar', {}, WBDeferred);
      thisInstance.queueRequest('/bar/foo', {}, WBDeferred);

      expect(thisInstance.requestsQueue.length).to.equal(2);
      expect(checkQueueSpy.callCount).to.equal(2);
      expect(thisInstance.requestsQueue[0].queueID).to.not.equal(thisInstance.requestsQueue[1].queueID);
    });
  });

  describe('#checkQueue', function () {

    it ('should pop off a queued request from the queue if executingRequests < maxRequests', function () {

      var executeRequestSpy = sinon.spy();
      var OverClass = AjaxClass.extend({
        'executeRequest': executeRequestSpy
      });

      var thisInstance = OverClass;

      thisInstance.maxRequests = 3;

      thisInstance.requestsQueue = [{}, {}];

      thisInstance.executingRequests = {'a': {}, 'b': {}};

      thisInstance.checkQueue();

      expect(executeRequestSpy).to.have.been.calledOnce;
      expect(thisInstance.requestsQueue.length).to.equal(1);
    });

    it ('should not pop off a queued request from the queue if executingRequests >= maxRequests', function () {

      var executeRequestSpy = sinon.spy();
      var OverClass = AjaxClass.extend({
        'executeRequest': executeRequestSpy
      });

      var thisInstance = OverClass;

      thisInstance.maxRequests = 2;

      thisInstance.requestsQueue = [{}, {}];

      thisInstance.executingRequests = {'a': {}, 'b': {}};

      thisInstance.checkQueue();

      expect(executeRequestSpy).to.not.have.been.calledOnce;
      expect(thisInstance.requestsQueue.length).to.equal(2);
    });
  });

  describe('#ajax', function () {

    it ('should call #onSuccess when request is resolved', function () {

      var fakeRequest = new WBDeferred();
      var data = {'foo': 'bar'};
      var xhr = {};
      var url = '/foo/bar';
      var options = {};

      var OverClass = AjaxClass.extend({
        'xhrRequest': function () {

          return fakeRequest;
        }
      });

      var thisInstance = OverClass;

      var successSpy = sinon.spy(thisInstance, 'onSuccess');

      thisInstance.ajax(url, options);

      fakeRequest.resolve(data, xhr);

      expect(successSpy).to.have.been.called;

      var args = successSpy.firstCall.args;

      expect(args[0]).to.deep.equal(data);
      expect(args[1]).to.equal(xhr);
      expect(args[2]).to.deep.equal(options);
    });
  });

  describe('#onSuccess', function () {

    it ('should parse json string and pass to options.success', function () {

      var successSpy = sinon.spy();

      var obj = {
        'foo': 'bar'
      };

      var str = JSON.stringify(obj);

      var xhr = {};

      var options = {
        'success': successSpy
      };


      ajaxInstance.onSuccess(str, xhr, options);

      var spyArgs = successSpy.args[0];

      var callData = spyArgs[0];
      var callXhr = spyArgs[1];

      expect(successSpy).to.have.been.called;
      expect(callData.foo).to.equal(obj.foo);
      expect(callXhr).to.equal(xhr);
    });
  });

  describe('#onFailure', function () {

    it ('should call options.error with arguments', function () {

      var errorSpy = sinon.spy();

      var obj = {
        'error': 'you suck'
      };

      var str = JSON.stringify(obj);

      var xhr = {
        'getResponseHeader': function (type) {
          if (type === 'content-type') {
            return 'application/json';
          }
        },

        'responseText': str
      };

      var options = {
        'error': errorSpy
      };

      ajaxInstance.onFailure(str, xhr, options);

      var spyArgs = errorSpy.args[0];

      var callData = spyArgs[0];
      var callXhr = spyArgs[1];

      expect(errorSpy).to.have.been.called;
      expect(callData.foo).to.equal(obj.foo);
      expect(callXhr).to.equal(xhr);
    });
  });
});