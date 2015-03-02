describe('services/Uploads Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  // var runtime = require('application/runtime');
  var UploadsClass = require('services/Uploads');

  var ApplicationState = require('models/ApplicationState');
  var config = require('../../config');

  var uploads, appState, options;
  beforeEach(function () {

    appState = new ApplicationState(config);

    options = {
      'appState': appState
    };

    appState.set({
      'clientID': 'abc',
      'accessToken': 'efg'
    });

    uploads = new UploadsClass(options);
  });


  describe('#create', function () {

    var OverClass;

    before(function () {

      OverClass = UploadsClass.extend({
        'post': function () {
          return new WBDeferred(options);
        }
      });
    });

    it ('should not throw if no data in create arguments', function () {

      var instance = new OverClass(options);
      sinon.spy(instance, 'post');

      expect(function () {

        instance.create();
      }).to.not.throw();

      expect(instance.post).to.have.been.calledOnce;
    });
  });

  describe('#getPart', function () {

    it ('should form a proper get request for the upload part', function () {

      uploads.get = sinon.stub().returns(new WBDeferred());

      var id = 129387;
      var part = 23;
      var requestID = '12039812lk31j20398';

      var expectedUrl = uploads.baseUrl + '/' + id + '/parts';

      uploads.getPart(id, part, requestID);

      expect(uploads.get).to.have.been.calledOnce;

      var args = uploads.get.firstCall.args;
      expect(args[0]).to.equal(expectedUrl);
      expect(args[1].part_number).to.equal(part);
      expect(args[2]).to.equal(requestID);
    });
  });

  describe('#finish', function () {

    it ('should patch the correct url with the correct data to finish an upload', function () {

      uploads.patch = sinon.stub().returns(new WBDeferred());

      var id = 129387;
      var requestID = '12039812lk31j20398';

      var expectedUrl = uploads.baseUrl + '/' + id;

      uploads.finish(id, requestID);

      expect(uploads.patch).to.have.been.calledOnce;

      var args = uploads.patch.firstCall.args;
      expect(args[0]).to.equal(expectedUrl);
      expect(args[1].state).to.equal('finished');
      expect(args[2]).to.equal(requestID);
    });
  });
});