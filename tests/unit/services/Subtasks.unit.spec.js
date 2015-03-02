describe('services/Subtasks Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  // var runtime = require('application/runtime');
  var SubtasksClass = require('services/Subtasks');

  var ApplicationState = require('models/ApplicationState');
  var config = require('../../config');

  var appState = new ApplicationState(config);
  appState.set({
    'clientID': 'abc',
    'accessToken': 'efg'
  });

  var options = {
    'appState': appState
  };

  describe('#forList', function () {

    it ('should call self.get with completed data attribute defaulted to false if not passed as TRUE', function () {

      var listId = 123;

      var OverClass = SubtasksClass.extend({
        'get': function () {
          return new WBDeferred();
        }
      });

      var tasks = new OverClass(options);

      var getSpy = sinon.spy(tasks, 'get');

      tasks.forList(listId);

      var data = getSpy.args[0][1];

      data.list_id.should.equal(listId);
      data.completed_tasks.should.be.false;
    });

    it ('should call self.get with completed data attribute set to TRUE if passed as TRUE', function () {

      var listId = 123;

      var OverClass = SubtasksClass.extend({
        'get': function () {
          return new WBDeferred();
        }
      });

      var tasks = new OverClass(options);

      var getSpy = sinon.spy(tasks, 'get');

      tasks.forList(listId, true);

      var data = getSpy.args[0][1];

      data.list_id.should.equal(listId);
      data.completed_tasks.should.be.true;
    });
  });

  describe('#create', function () {

    it ('should reject but not throw if missing data', function () {

      var OverClass = SubtasksClass.extend({
        'post': function () {
          return new WBDeferred();
        }
      });

      var subtasks = new OverClass(options);
      var validateSpy = sinon.spy(subtasks, 'validateCreateData');

      var result;
      expect(function () {
        result = subtasks.create();
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('data required for subtask creation');
        expect(code).to.equal(0);
      });

      expect(result.state()).to.equal('rejected');

      validateSpy.should.have.been.called;
      validateSpy.should.have.thrown();
    });

    it ('should reject but not throw if missing task_id', function () {

      var OverClass = SubtasksClass.extend({
        'post': function () {
          return new WBDeferred();
        }
      });

      var subtasks = new OverClass(options);
      var validateSpy = sinon.spy(subtasks, 'validateCreateData');

      var result;
      expect(function () {
        result = subtasks.create({
          'title': 'foobar'
        });
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('data.task_id required for subtask creation');
        expect(code).to.equal(0);
      });

      expect(result.state()).to.equal('rejected');

      validateSpy.should.have.been.called;
      validateSpy.should.have.thrown();
    });

    it ('should reject but not throw if missing a title', function () {

      var OverClass = SubtasksClass.extend({
        'post': function () {
          return new WBDeferred();
        }
      });

      var tasks = new OverClass(options);
      var validateSpy = sinon.spy(tasks, 'validateCreateData');

      var result;
      expect(function () {
        result = tasks.create({
          'task_id': 123
        });
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('data.title required for subtask creation');
        expect(code).to.equal(0);
      });

      expect(result.state()).to.equal('rejected');

      validateSpy.should.have.been.called;
      validateSpy.should.have.thrown();
    });

    it ('should not throw data includes at least a task_id and title', function () {

      var OverClass = SubtasksClass.extend({
        'post': function () {
          return new WBDeferred();
        }
      });

      var tasks = new OverClass(options);
      var validateSpy = sinon.spy(tasks, 'validateCreateData');
      var postSpy = sinon.spy(tasks, 'post');

      expect(function () {

        tasks.create({
          'title': 'barfoo',
          'task_id': 123
        });
      }).to.not.throw();

      validateSpy.should.have.been.calledOnce;
      postSpy.should.have.been.calledOnce;
    });
  });
});