describe('services/Conversations Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  // var runtime = require('application/runtime');
  var ConversationsClass = require('services/Conversations');

  var config = require('../../config');
  var ApplicationState = require('models/ApplicationState');

  var conversations, options, appState;
  beforeEach(function () {

    appState = new ApplicationState(config);
    options = {
      'appState': appState
    };

    appState.set({
      'clientID': 'abc',
      'accessToken': 'efg'
    });

    conversations = new ConversationsClass(options);
  });

  describe('#all', function () {

    it ('should call get with the passed options', function () {

      conversations.get = sinon.stub().returns(new WBDeferred());

      var requestID = '129387123l1k2j3';
      var data = {
        'style': 'desktop',
        'tz_offset': -8
      };

      conversations.all(data, requestID);

      expect(conversations.get).to.have.been.calledOnce;
      var args = conversations.get.firstCall.args;
      expect(args[1]).to.equal(data);
      expect(args[2]).to.equal(requestID);
    });
  });
});