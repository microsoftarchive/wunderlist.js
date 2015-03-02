describe('wunderbits/lib/SafeParse Unit', function () {

  'use strict';

  var SafeParse = require('wunderbits/lib/SafeParse');

  describe('#json', function () {

    it ('should not throw an error if not valid json', function () {

      var result;

      expect(function () {

        result = SafeParse.json('sdlfkjsdlfkj');
      }).to.not.throw();

      expect(result).to.be.undefined;
    });
  });

});