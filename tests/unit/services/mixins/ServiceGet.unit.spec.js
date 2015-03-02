describe('services/Mixins/ServiceGet Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  var ServiceGetMixin = require('services/Mixins/ServiceGet');
  var GetMixinInstance;

  beforeEach(function () {

    GetMixinInstance = {};
    ServiceGetMixin.applyTo(GetMixinInstance);
  });

  describe('#getID', function () {

    it ('should call #get with id appended to the baseUrl', function () {

      var id = 'bar';

      GetMixinInstance.baseUrl = '/foo';

      GetMixinInstance.get = function () {

        return new WBDeferred();
      };

      var spy = sinon.spy(GetMixinInstance, 'get');

      GetMixinInstance.getID(id);

      var args = spy.args[0];
      expect(args[0]).to.equal('/foo/bar');

      // cleanup
      GetMixinInstance.get.restore();
      GetMixinInstance.get = undefined;
      GetMixinInstance.baseUrl = undefined;
    });

  });

  describe('#getItemsForAttribute', function () {

    it ('should call #get with attribute and id', function () {

      var attr = 'foo';
      var val = 'bar';

      GetMixinInstance.get = function () {

        return new WBDeferred();
      };

      var spy = sinon.spy(GetMixinInstance, 'get');

      GetMixinInstance.getItemsForAttribute(null, attr, val);

      var data = spy.args[0][1];

      expect(data[attr]).to.equal(val);

      // cleanup
      GetMixinInstance.get.restore();
      GetMixinInstance.get = undefined;
    });
  });

  describe('#forUser', function () {

    it ('should call #getItemsForAttribute with the correct user data hash', function () {

      var userId = 123;

      GetMixinInstance.get = function () {

        return new WBDeferred();
      };

      var spy = sinon.spy(GetMixinInstance, 'get');

      GetMixinInstance.forUser(userId);

      var data = spy.args[0][1];

      expect(data.user_id).to.equal(userId);

      // cleanup
      GetMixinInstance.get.restore();
      GetMixinInstance.get = undefined;
    });
  });

  describe('#forTask', function () {

    it ('should call #getItemsForAttribute with the correct task data hash', function () {

      var taskId = 123;

      GetMixinInstance.get = function () {

        return new WBDeferred();
      };

      var spy = sinon.spy(GetMixinInstance, 'get');

      GetMixinInstance.forTask(taskId);

      var data = spy.args[0][1];

      expect(data.task_id).to.equal(taskId);

      // cleanup
      GetMixinInstance.get.restore();
      GetMixinInstance.get = undefined;
    });
  });

  describe('#forList', function () {

    it ('should call #getItemsForAttribute with the correct list data hash', function () {

      var listId = 123;

      GetMixinInstance.get = function () {

        return new WBDeferred();
      };

      var spy = sinon.spy(GetMixinInstance, 'get');

      GetMixinInstance.forList(listId);

      var data = spy.args[0][1];

      expect(data.list_id).to.equal(listId);

      // cleanup
      GetMixinInstance.get.restore();
      GetMixinInstance.get = undefined;
    });
  });

  describe('#forAllTasksForList', function () {

    it ('should call #getItemsForAttribute with the correct url and list data hash', function () {

      var listId = 123;

      GetMixinInstance.baseUrl = '/path';

      GetMixinInstance.get = function () {

        return new WBDeferred();
      };

      var spy = sinon.spy(GetMixinInstance, 'getItemsForAttribute');

      GetMixinInstance.forAllTasksForList(listId);

      var url = spy.args[0][0];
      var attr = spy.args[0][1];
      var val = spy.args[0][2];

      expect(url).to.equal('/path/tasks');
      expect(attr).to.equal('list_id');
      expect(val).to.equal(listId);

      // cleanup
      GetMixinInstance.getItemsForAttribute.restore();
      GetMixinInstance.get = undefined;
      GetMixinInstance.baseUrl = undefined;
    });
  });

  describe('#all', function () {

    it ('should call self.get with self.baseUrl', function () {

      var basePath = '/path';

      GetMixinInstance.baseUrl = basePath;

      GetMixinInstance.get = function () {

        return new WBDeferred();
      };

      var spy = sinon.spy(GetMixinInstance, 'get');

      GetMixinInstance.all();

      var url = spy.args[0][0];

      expect(url).to.equal(basePath);

      // cleanup
      GetMixinInstance.baseUrl = undefined;
      GetMixinInstance.get.restore();
      GetMixinInstance.get = undefined;
    });
  });

  describe('#forAllLists', function () {

    it ('should call self.get with self.baseUrl + \'lists\'', function () {

      var basePath = '/path';

      GetMixinInstance.baseUrl = basePath;

      GetMixinInstance.get = function () {

        return new WBDeferred();
      };

      var spy = sinon.spy(GetMixinInstance, 'get');

      GetMixinInstance.forAllLists();

      var url = spy.args[0][0];

      expect(url).to.equal(basePath + '/lists');

      // cleanup
      GetMixinInstance.baseUrl = undefined;
      GetMixinInstance.get.restore();
      GetMixinInstance.get = undefined;
    });
  });
});