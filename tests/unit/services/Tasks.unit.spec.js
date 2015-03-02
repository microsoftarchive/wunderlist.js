describe('services/Tasks Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  // var runtime = require('application/runtime');
  var TasksClass = require('services/Tasks');

  var ApplicationState = require('models/ApplicationState');
  var config = require('../../config');

  var appState, options;
  beforeEach(function () {

    appState = new ApplicationState(config);

    options = {
      'appState': appState
    };

    appState.set({
      'clientID': 'abc',
      'accessToken': 'efg'
    });
  });

  describe('#forList', function () {

    it ('should call self.get with completed data attribute defaulted to false if not passed as TRUE', function () {

      var listId = 123;

      var OverClass = TasksClass.extend({
        'get': function () {
          return new WBDeferred();
        }
      });

      var tasks = new OverClass(options);

      var getSpy = sinon.spy(tasks, 'get');

      tasks.forList(listId);

      var data = getSpy.args[0][1];

      data.list_id.should.equal(listId);
      data.completed.should.be.false;
    });

    it ('should call self.get with completed data attribute set to TRUE if passed as TRUE', function () {

      var listId = 123;

      var OverClass = TasksClass.extend({
        'get': function () {
          return new WBDeferred();
        }
      });

      var tasks = new OverClass(options);

      var getSpy = sinon.spy(tasks, 'get');

      tasks.forList(listId, true);

      var data = getSpy.args[0][1];

      data.list_id.should.equal(listId);
      data.completed.should.be.true;
    });
  });

  describe('#create', function () {

    it ('should reject but not throw if missing create data', function () {

      var OverClass = TasksClass.extend({
        'post': function () {
          return new WBDeferred(options);
        }
      });

      var tasks = new OverClass(options);
      var validateSpy = sinon.spy(tasks, 'validateCreateData');

      var result;
      expect(function () {

        result = tasks.create();
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('data required for task creation');
        expect(code).to.equal(0);
      });

      expect(result.state()).to.equal('rejected');

      validateSpy.should.have.been.calledOnce;
      validateSpy.should.have.thrown();
    });

    it ('should reject but not throw if missing list_id', function () {

      var OverClass = TasksClass.extend({
        'post': function () {
          return new WBDeferred();
        }
      });

      var tasks = new OverClass(options);
      var validateSpy = sinon.spy(tasks, 'validateCreateData');

      var result;
      expect(function () {
        result = tasks.create({
          'title': 'foobar'
        });
      }).to.not.throw();

      result.always(function (resp, code) {

        expect(resp.errors[0]).to.contain('data.list_id required for task creation');
        expect(code).to.equal(0);
      });

      validateSpy.should.have.been.called;
      validateSpy.should.have.thrown();
    });

    it ('should reject but not throw if missing a title', function () {

      var OverClass = TasksClass.extend({
        'post': function () {
          return new WBDeferred();
        }
      });

      var tasks = new OverClass(options);
      var validateSpy = sinon.spy(tasks, 'validateCreateData');

      var result;
      expect(function () {
        result = tasks.create({
          'list_id': 1233
        });
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('data.title required for task creation');
        expect(code).to.equal(0);
      });

      validateSpy.should.have.been.called;
      validateSpy.should.have.thrown();
    });

    it ('should not throw data includes at least a list_id and title', function () {

      var OverClass = TasksClass.extend({
        'post': function () {
          return new WBDeferred();
        }
      });

      var tasks = new OverClass(options);
      var validateSpy = sinon.spy(tasks, 'validateCreateData');
      var postSpy = sinon.spy(tasks, 'post');

      expect(function () {
        tasks.create({
          'list_id': 1234,
          'title': 'barfoo'
        });
      }).to.not.throw();

      validateSpy.should.have.been.calledOnce;
      postSpy.should.have.been.calledOnce;
    });
  });
});