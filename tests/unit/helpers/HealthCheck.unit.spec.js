describe('helpers/HealthCheck Unit', function () {

  'use strict';

  var HealthCheck = require('helpers/HealthCheck');

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  describe('#checkApiHealth', function () {

    var _io;
    beforeEach(function () {

      _io = HealthCheck.io;
    });

    afterEach(function () {

      HealthCheck.io = _io;
    });

    it ('should trigger "healthy" if healthy', function () {

      // mock healthy return
      HealthCheck.io = {
        'get': sinon.stub().returns(new WBDeferred().resolve())
      };

      var healthySpy = sinon.spy();
      HealthCheck.on('healthy', healthySpy, healthySpy);

      HealthCheck.checkApiHealth();

      expect(healthySpy).to.have.been.calledOnce;
    });

    it ('should trigger "unhealthy" if healthy', function () {

      // mock healthy return
      HealthCheck.io = {
        'get': sinon.stub().returns(new WBDeferred().reject())
      };

      var healthySpy = sinon.spy();
      HealthCheck.on('unhealthy', healthySpy, healthySpy);

      HealthCheck.checkApiHealth();

      expect(healthySpy).to.have.been.calledOnce;
    });
  });

  describe('#startPolling', function () {

    var _checkApiHealth;
    beforeEach(function () {

      _checkApiHealth = HealthCheck.checkApiHealth;
      HealthCheck.checkApiHealth = sinon.spy();
    });

    afterEach(function () {

      HealthCheck.checkApiHealth = _checkApiHealth;
      clearInterval(HealthCheck.poller);
    });

    it ('should call #checkApiHealth every 15 seconds', function () {

      var clock = sinon.useFakeTimers();

      HealthCheck.startPolling();

      clock.tick(35000);
      clock.restore();

      expect(HealthCheck.checkApiHealth).to.have.been.calledTwice;
    });
  });
});