describe('io/IOBase Unit', function () {

  'use strict';

  var IOClass = require('io/IOBase');

  var config = require('../../config');
  var ApplicationState = require('models/ApplicationState');

  var IO, options, appState;
  beforeEach(function () {

    appState = new ApplicationState(config);

    options = {
      'config': appState.toJSON()
    };

    IO = new (IOClass.extend({
      'routes': {
        'example': [
          'foo/bar/123'
        ]
      }
    }))(options);
  });

  describe('#resolveUrl', function () {

    it ('should just return the url if it is an absolute url', function () {

      var urls = [
        'http://google.com',
        'https://net.net'
      ];

      urls.forEach(function (url) {

        var result = IO.resolveUrl(url);
        expect(result).to.equal(url);
      });
    });

    it ('should resolve from public/urls if not yet resolved and exists in the urls hash', function () {

      // see mocks/urls.mock.js

      var url = '/foo/bar/123';
      var result = IO.resolveUrl(url);

      expect(result).to.equal('http://example.com/foo/bar/123');
    });
  });

  describe('#extendHeaders', function () {

    it ('should not extend headers with authorization if not a WL url', function () {

      var url = 'https://example.com/la/la/la/la/la';
      var headers = {
        'foo': 'bar'
      };

      var authSpy = sinon.spy(IO, 'setAuthorization');

      IO.extendHeaders(headers, url);

      expect(authSpy).to.not.have.been.called;

      IO.setAuthorization.restore();
    });

    it ('should not throw if no headers passed in', function () {

      var spy = sinon.spy();

      try {
        IO.extendHeaders(undefined, '/foo/bar');
      }
      catch (e) {
        spy(e);
      }

      expect(spy).to.not.have.been.called;
    });
  });

  describe('IO Verbs', function () {

    it ('should throw if called without a url', function () {

      var spy = sinon.spy();

      try {
        IO.io.post();
      }
      catch (e) {
        spy(e);
      }

      expect(spy).to.have.been.called;
    });

    it ('should convert data object to query params for get requests', function () {

      var ioSpy = sinon.spy(IO, 'io');

      var url = '/foo/bar';

      var resolvedURL = IO.resolveUrl(url);

      IO.io.get('/foo/bar', {
        'foo': 'bar'
      });

      var args = ioSpy.firstCall.args;
      var urlArg = args[0];

      expect(urlArg).to.equal(resolvedURL + '?foo=bar');

      IO.io.restore();
    });
  });
});