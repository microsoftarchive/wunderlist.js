describe('services/mixins/AuthenticatedService Unit', function () {

  'use strict';

  // var runtime = require('application/runtime');
  var AuthenticatedServiceClass = require('services/AuthenticatedService');

  var AuthenticatedService;

  var ApplicationState = require('models/ApplicationState');

  var config = require('../../config');

  var options, appState;
  beforeEach(function () {

    appState = new ApplicationState(config);

    options = {
      'appState': appState
    };

    // override initialize autmatigic
    var OverClass = AuthenticatedServiceClass.extend({
      'initialize': AuthenticatedServiceClass.__super__.initialize
    });

    AuthenticatedService =  new OverClass(options);
  });

  describe('#validateAccessParams', function () {

    it('should throw if no self.options.clientID', function () {

      var oldID = AuthenticatedService.options.clientID;

      appState.set('clientID', undefined);
      appState.set('accessToken', 'sdflkj');

      expect(function () {

        AuthenticatedService.validateAccessParams();
      }).to.throw('This service requires a client ID.');

      AuthenticatedService.options.clientID = oldID;
    });

    it('should throw if no runtime.accessToken', function () {

      appState.set('clientID', 'sdflksjf');
      appState.set('accessToken', undefined);

      expect(function () {

        AuthenticatedService.validateAccessParams();
      }).to.throw('This service requires an access token.');
    });
  });

  describe('#initialize', function () {

    it('should throw from calling #validateAccessParams when no runtime.clientID or not runtime.accessToken', function () {

      var spy = sinon.spy();

      appState.set({
        'clientID': undefined,
        'accessToken':  undefined
      });

      var service;

      try {
        service = new AuthenticatedServiceClass(options);
      }
      catch (e) {
        spy();
      }

      expect(spy).to.have.been.called;
    });
  });
});