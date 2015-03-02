describe('services/Mixins/ServiceCreate Unit', function () {

  'use strict';

  var ServiceCreateMixin = require('services/Mixins/ServiceCreate');
  var CreateMixinInstance;

  beforeEach(function () {

    CreateMixinInstance = {};
    ServiceCreateMixin.applyTo(CreateMixinInstance);
  });

  describe('#create', function () {

    it ('should reject but not throw if no data in arguments', function () {

      var result;
      expect(function () {

        result = CreateMixinInstance.create(null, 123);
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('Creation requires data.');
        expect(code).to.equal(0);
      });
    });

    it ('should reject but not throw if data has no attributes', function () {

      var result;
      expect(function () {

        result = CreateMixinInstance.create({}, 123);
      }).to.not.throw();

      result.always(function (resp, code) {
        expect(resp.errors[0]).to.contain('Creation requires data.');
        expect(code).to.equal(0);
      });
    });

    it ('should not throw if data has attributes', function () {

      CreateMixinInstance.post = function () {};

      var spy = sinon.spy(CreateMixinInstance, 'create');
      var postSpy = sinon.spy(CreateMixinInstance, 'post');

      try {
        CreateMixinInstance.create({'foo': 'bar'}, 123);
      }
      catch (e) {
        //
      }

      expect(postSpy).to.have.been.called;
      expect(spy).to.not.have.thrown();

      // cleanup
      CreateMixinInstance.create.restore();
      CreateMixinInstance.post.restore();
      CreateMixinInstance.post = undefined;
    });

    it('should remove undefined and null attributes', function () {

      var createSpy = CreateMixinInstance.post = sinon.spy();

      var data = {
        'foo': 'bar',
        'bad': null,
        'still_bad': undefined
      };

      CreateMixinInstance.create(data, undefined);

      var args = createSpy.firstCall.args;

      var postedData = args[1];

      var expected = {
        'foo': 'bar'
      };

      expect(createSpy).to.have.been.calledOnce;
      expect(postedData).to.deep.equal(expected);
    });
  });
});