describe('deferreds/RequestDeferred Unit', function () {

  'use strict';

  var RequestDeferred = require('deferreds/RequestDeferred');

  describe('#initialize', function () {

    it ('should set up self.error and self.loadStarted', function () {

      var request = new RequestDeferred();
      expect(request.error).to.equal(request.fail);
      expect(request.loadStarted).to.be.false;
    });

    it ('should setup timing properties on object', function () {

      var request = new RequestDeferred();

      var properties = [
        'loadDurationTime',
        'loadStarted',
        'loadStartTime',
        'latencyTime',
        'startTime',
        'url',
        'xhr'
      ];

      properties.forEach(function (property) {

        expect(property in request).to.be.true;
      });
    });
  });
});