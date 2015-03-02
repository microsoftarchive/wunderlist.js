describe('services/Mixins/ServiceUpdate Unit', function () {

  'use strict';

  var ServiceUpdateMixin = require('services/Mixins/ServiceUpdate');
  var UpdateMixinInstance;

  beforeEach(function () {

    UpdateMixinInstance = {};
    ServiceUpdateMixin.applyTo(UpdateMixinInstance);
  });

  describe('#update', function () {

    it ('should reject but not throw if no id in arguments', function () {

      var result;
      expect(function () {
        result = UpdateMixinInstance.update(null, 123, {'foo': 'bar'});
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('Updating a resource requires an id of type number.');
        expect(code).to.equal(0);
      });
    });

    it ('should reject but not throw if no revision in arguments', function () {

      var result;
      expect(function () {
        result = UpdateMixinInstance.update(123, null, {'foo': 'bar'});
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('Updating a resource requires a revision of type number.');
        expect(code).to.equal(0);
      });
    });

    it ('should reject but not throw if no data in arguments', function () {

      var result;
      expect(function () {
        result = UpdateMixinInstance.update(123, 123, null);
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('Updating a resource requires data to be sent.');
        expect(code).to.equal(0);
      });
    });

    it ('should inject revision into updateData', function () {

      var patchData;
      var id = 111;
      var revision = 222;

      var Instance = {
        'patch': function (url, data) {

          patchData = data;
        }
      };

      ServiceUpdateMixin.applyTo(Instance);

      var spy = sinon.spy(Instance, 'patch');

      Instance.update(id, revision, {'foo': 'bar'});

      expect(spy).to.have.been.called;
      expect(patchData.revision).to.equal(revision);
    });
  });

  describe('#prepareDataForPatch', function () {

    it ('should remove nulls and undefineds from update hash and move to remove array', function () {

      var data = {

        'foo': null,
        'bar': undefined
      };

      var patchData = UpdateMixinInstance.prepareDataForPatch(data);

      expect('foo' in patchData).to.be.false;
      expect('bar' in patchData).to.be.false;

      expect('remove' in patchData).to.be.true;

      expect(patchData.remove).to.contain('foo');
      expect(patchData.remove).to.contain('bar');
    });
  });
});