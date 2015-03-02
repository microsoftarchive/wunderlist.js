describe('deferreds/RestSocketRequestDeferred Unit', function () {

  'use strict';

  var RequestDeferred = require('deferreds/RestSocketRequestDeferred');

  describe('#initialize', function () {

    it ('should setup timing properties on object', function () {

      var request = new RequestDeferred();

      var properties = [
        'endTime',
        'requestID',
        'uri'
      ];

      properties.forEach(function (property) {

        expect(property in request).to.be.true;
      });
    });
  });
});