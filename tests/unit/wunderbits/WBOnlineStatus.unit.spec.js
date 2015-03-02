describe('wunderbits/WBonlineStatus Unit', function () {

  'use strict';

  var WBOnlineStatus = require('wunderbits/WBOnlineStatus');
  var config = require('../../config');

  var WBOnlineStatusInstance;

  beforeEach(function () {
    WBOnlineStatusInstance = new WBOnlineStatus({
      'config': config
    });
  });

  afterEach(function () {

    WBOnlineStatusInstance.destroy();
  });

  describe('onOnline', function () {

    it ('should trigger "online" event on self', function () {

      var spy = sinon.spy();
      WBOnlineStatusInstance.on('online', spy);
      WBOnlineStatusInstance.onOnline();
      expect(spy).to.have.been.calledOnce;
      expect(WBOnlineStatusInstance.online).to.be.true;
    });
  });

  describe('onOffline', function () {

    it ('should trigger "offline" event on self', function () {

      var spy = sinon.spy();
      WBOnlineStatusInstance.on('offline', spy);
      WBOnlineStatusInstance.onOffline();
      expect(spy).to.have.been.calledOnce;
      expect(WBOnlineStatusInstance.online).to.be.false;
    });
  });
});