describe('service/ServiceGetOnly Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  var ServiceClass = require('services/ServiceGetOnly');
  var HttpClass = require('io/IO');
  var RestSocketClass = require('io/RestSocket');

  var config = require('../../config');
  var ApplicationState = require('models/ApplicationState');

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

    it('should provide GET IO', function () {

      expect(Service.io).to.be.instanceOf(HttpClass);

      ['get'].forEach(function (op) {

        expect(Service[op]).to.be.a.function;
      });
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

          expect(service[op]).to.be.a.function;
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

    it ('should not throw if this.options.restSocket is available', function () {

      Service.options.restSocket = new SocketClass();

      expect(function () {

        Service.setupSocketInterfaces();
      }).to.not.throw();
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

  describe('Not Allowed', function () {

    ['delete', 'patch', 'post', 'put'].forEach(function (method) {
      it ('should throw for ' + method, function () {

        expect(function () {

          Service[method]();
        }).to.throw('Method not allowed for this service.');
      });
    });

    it ('should not throw for get', function () {

      expect(function () {

        Service.get('/foo/bar');
      }).to.not.throw();
    });
  });
});