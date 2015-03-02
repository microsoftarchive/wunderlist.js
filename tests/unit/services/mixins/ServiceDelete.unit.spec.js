describe('services/Mixins/ServiceDelete Unit', function () {

  'use strict';

  var ServiceDeleteMixin = require('services/Mixins/ServiceDelete');
  var DeleteMixinInstance;

  beforeEach(function () {

    DeleteMixinInstance = {};
    ServiceDeleteMixin.applyTo(DeleteMixinInstance);
  });

  describe('#deleteID', function () {

    it ('should reject but not throw if no id in arguments', function () {

      var result;
      expect(function () {

        result = DeleteMixinInstance.deleteID(null, 123);
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('Deletion requires an id.');
        expect(code).to.equal(0);
      });
    });

    it ('should reject but not throw if no revision in arguments', function () {

      var result;
      expect(function () {
        result = DeleteMixinInstance.deleteID(123, null);
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('Deletion requires a revision.');
        expect(code).to.equal(0);
      });
    });

    it ('should not throw if revision and id in arguments', function () {

      DeleteMixinInstance['delete'] = function () {};

      var spy = sinon.spy(DeleteMixinInstance, 'deleteID');

      try {
        DeleteMixinInstance.deleteID(123, 345);
      }
      catch (e) {
        //
      }

      expect(spy).to.not.have.thrown();

      DeleteMixinInstance['delete'] = undefined;
      DeleteMixinInstance.deleteID.restore();
    });

    it ('should compile revision into params string', function () {

      DeleteMixinInstance['delete'] = function () {};

      DeleteMixinInstance.baseUrl = 'foobar';

      var spy = sinon.spy(DeleteMixinInstance, 'deleteID');
      var deleteSpy = sinon.spy(DeleteMixinInstance, 'delete');

      try {
        DeleteMixinInstance.deleteID(123, 456);
      }
      catch (e) {
        //
      }

      expect(deleteSpy.args[0][0]).to.equal('foobar/123?revision=456');
      expect(spy).to.not.have.thrown();

      DeleteMixinInstance['delete'] = undefined;
      DeleteMixinInstance.baseUrl = undefined;
      DeleteMixinInstance.deleteID.restore();
    });
  });
});