describe('services/Lists Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  var ListsClass = require('services/Lists');

  var config = require('../../config');
  var ApplicationState = require('models/ApplicationState');

  var options, appState;
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

  describe('#validateCreateData', function () {

    it ('should throw if missing create data', function () {

      var OverClass = ListsClass.extend({
        'post': function () {

          return new WBDeferred();
        }
      });

      var lists = new OverClass(options);

      var validateSpy = sinon.spy(lists, 'validateCreateData');

      try {
        lists.create();
      }
      catch (e) {
        //
      }

      validateSpy.should.have.been.called;
      validateSpy.should.have.thrown();
    });

    it ('should throw if missing a title', function () {

      var OverClass = ListsClass.extend({
        'post': function () {

          return new WBDeferred();
        }
      });

      var lists = new OverClass(options);

      var validateSpy = sinon.spy(lists, 'validateCreateData');

      try {
        lists.create({
          'attr': 'val'
        });
      }
      catch (e) {
        //
      }

      validateSpy.should.have.been.called;
      validateSpy.should.have.thrown();
    });

    it ('should not throw data includes at least a title', function () {

      var OverClass = ListsClass.extend({
        'post': function () {

          return new WBDeferred();
        }
      });

      var lists = new OverClass(options);

      var validateSpy = sinon.spy(lists, 'validateCreateData');

      try {
        lists.create({
          'title': 'barfoo'
        });
      }
      catch (e) {
        //
      }

      validateSpy.should.have.been.called;
      validateSpy.should.not.have.thrown();
    });
  });
});