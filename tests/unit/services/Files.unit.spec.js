describe('services/Files Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  // var runtime = require('application/runtime');
  var FilesClass = require('services/Files');

  var ApplicationState = require('models/ApplicationState');
  var config = require('../../config');

  var files, appState, options;
  beforeEach(function () {

    appState = new ApplicationState(config);

    options = {
      'appState': appState
    };

    appState.set({
      'clientID': 'abc',
      'accessToken': 'efg'
    });

    files = new FilesClass(options);
  });


  describe('#create', function () {

    var OverClass;

    before(function () {

      OverClass = FilesClass.extend({
        'post': function () {
          return new WBDeferred(options);
        }
      });
    });

    it ('should reject but not throw if missing create data', function () {

      var files = new OverClass(options);
      var validateSpy = sinon.spy(files, 'validateCreateData');

      var result;
      expect(function () {

        result = files.create();
      }).to.not.throw();

      result.always(function (resp, code) {

        console.debug(resp);

        expect(resp.errors[0]).to.contain('data required for file creation');
        expect(code).to.equal(0);
      });

      expect(result.state()).to.equal('rejected');

      validateSpy.should.have.been.called;
      validateSpy.should.have.thrown();
    });

    it ('should reject but not throw if missing task_id', function () {

      var files = new OverClass(options);
      var validateSpy = sinon.spy(files, 'validateCreateData');

      var result;
      expect(function () {
        result = files.create({
          'upload_id': 123
        });
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('data.task_id required for file creation');
        expect(code).to.equal(0);
      });

      validateSpy.should.have.been.called;
      validateSpy.should.have.thrown();
    });

    it ('should call post if data includes a task_id', function () {

      var files = new OverClass(options);
      var validateSpy = sinon.spy(files, 'validateCreateData');
      var postSpy = sinon.spy(files, 'post');

      expect(function () {
        files.create({
          'task_id': 1234,
          'upload_id': 3498349
        });
      }).to.not.throw();

      postSpy.should.have.been.called;
      validateSpy.should.have.been.called;

      postSpy.restore();
      validateSpy.restore();
    });

    it ('should include local_created_at when present for a create', function () {

      var files = new OverClass(options);
      var validateSpy = sinon.spy(files, 'validateCreateData');
      var postSpy = sinon.spy(files, 'post');

      var localCreatedAt = 'lol-now?';

      expect(function () {
        files.create({
          'task_id': 1234,
          'upload_id': 3498349,
          'local_created_at': localCreatedAt
        });
      }).to.not.throw();

      postSpy.should.have.been.called;
      validateSpy.should.have.been.called;

      var args = postSpy.firstCall.args;
      expect(args[1].local_created_at).to.equal(localCreatedAt);

      postSpy.restore();
      validateSpy.restore();
    });
  });
});