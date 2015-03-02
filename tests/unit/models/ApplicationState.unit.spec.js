describe('models/ApplicationState Unit', function () {

  'use strict';

  var ApplicationState = require('models/ApplicationState');
  var config = require('../../config');

  var appState;

  beforeEach(function (done) {

    appState = new ApplicationState(config);
    appState.initialized.done(function () {

      done();
    });
  });

  describe('#initialize', function () {

    it ('should call #watchOnlineState', function (done) {

      sinon.spy(ApplicationState.prototype, 'watchOnlineState');

      var appState = new ApplicationState(config);

      setTimeout(function () {

        expect(appState.watchOnlineState).to.have.been.calledOnce;
        ApplicationState.prototype.watchOnlineState.restore();
        done();
      }, 100);
    });
  });

  describe('#watchOnlineState', function () {

    it ('should unbindFrom onlineState if already exists', function () {

      sinon.spy(appState, 'unbindFrom');

      appState.watchOnlineState();

      expect(appState.unbindFrom).to.have.been.calledOnce;
    });
  });

  describe('#onOnline', function () {

    it ('should set model attribute online to true', function () {

      appState.set('online', false);

      appState.onOnline();

      expect(appState.attributes.online).to.be.true;
    });
  });

  describe('#onOffline', function () {

    it ('should set model attribute online to true', function () {

      appState.set('online', true);

      appState.onOffline();

      expect(appState.attributes.online).to.be.false;
    });
  });

});