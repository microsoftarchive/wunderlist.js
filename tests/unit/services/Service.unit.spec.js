describe('service/Service Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  var ServiceClass = require('services/Service');
  var HttpClass = require('io/IO');
  var RestSocketClass = require('io/RestSocket');

  var ApplicationState = require('models/ApplicationState');
  var config = require('../../config');

  var SocketClass, Service, options, appState;
  beforeEach(function () {

    appState = new ApplicationState(config);
    options = {
      'appState': appState
    };

    // remove auto connect behavior
    SocketClass = RestSocketClass.extend({

      'initialize': function () {

        var self = this;
        self.ready = new WBDeferred();
        RestSocketClass.__super__.initialize.apply(self, arguments);
      }
    });

    Service = new ServiceClass(options);
  });

  describe('provides', function () {

    it('should provide IO', function () {

      expect(Service.io).to.be.instanceOf(HttpClass);

      ['post', 'get', 'delete', 'patch', 'put'].forEach(function (op) {

        expect(Service[op]).to.be.a.function;
      });
    });

    it('should pipe unauthorized from self.id', function () {

      var spy = sinon.spy();

      Service.on('unauthorized', function () {
        spy();
      });

      Service.io.trigger('unauthorized');

      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('mixes in', function () {

    it('should mixin ServiceGet', function () {

      [
        'getItemsForAttribute',
        'forUser',
        'forTask',
        'forList',
        'all',
        'forAllLists',
        'forAllTasksForList'
      ].forEach(function (method) {

        expect(Service[method]).to.be.a.function;
      });

    });
  }),

  describe('#initialize', function () {

    it ('should be possible initialize io as a RestSocket interface', function (done) {

      var socket = new SocketClass(options);

      // pretend socket connected
      socket.ready.resolve();

      socket.ready.done(function () {

        var service = new ServiceClass({
          'websocket': true,
          'appState': appState,
          'restSocket': socket
        });

        expect(service.io).to.be.instanceOf(SocketClass);

        ['post', 'get', 'delete', 'patch', 'put'].forEach(function (op) {

          expect(service[op]).to.equal(socket[op]);
        });

        // cleanup
        socket.close();
        done();
      });
    });
  });

  describe('#setupSocketInterfaces', function () {

    it ('should throw error if this.options.restSocket not available', function () {

      Service.options.restSocket = undefined;

      expect(function () {
        Service.setupSocketInterfaces();
      }).to.throw('No RestSocket instance available.');
    });
  });

  describe('#checkAppState', function () {

    it ('should create an appState model if one is not present', function () {

      Service.appState = undefined;
      Service.options = {
        'config': config
      };

      Service.checkAppState();

      expect(Service.appState).to.not.be.undefined;
    });
  });

  describe('#destroy', function () {

    it ('should destroy the whole instance and leave only self.destroyed', function () {

      var someInstance = new ServiceClass(options);
      var keys = Object.keys(someInstance);

      var unbindSpy = sinon.spy(someInstance, 'unbindAll');

      someInstance.destroy();

      for (var key in keys) {
        expect(someInstance[key]).to.be.undefined;
      }
      expect(someInstance.destroyed).to.be.true;

      expect(unbindSpy).to.have.been.called;
    });
  });
});