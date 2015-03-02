describe('services/Previews Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  var PreviewsClass = require('services/Previews');

  var ApplicationState = require('models/ApplicationState');
  var config = require('../../config');

  var previews, appState, options;
  beforeEach(function () {

    appState = new ApplicationState(config);

    options = {
      'appState': appState
    };

    appState.set({
      'clientID': 'abc',
      'accessToken': 'efg'
    });

    previews = new PreviewsClass(options);
  });

  describe('#getPreview', function () {

    it ('should get the correct url with params for a file preview', function () {

      previews.get = sinon.stub().returns(new WBDeferred());

      var id = '120398u';
      var platform = 'space';
      var size = 'ginormous';
      var requestID = '120398i1lkj';

      previews.getPreview(id, platform, size, requestID);

      expect(previews.get).to.have.been.calledOnce;

      var args = previews.get.firstCall.args;

      expect(args[0]).to.equal(previews.baseUrl);
      expect(args[1].file_id).to.equal(id);
      expect(args[1].platform).to.equal(platform);
      expect(args[1].size).to.equal(size);
      expect(args[2]).to.equal(requestID);
    });
  });
});