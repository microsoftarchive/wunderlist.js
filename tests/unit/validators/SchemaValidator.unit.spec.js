describe('validators/SchemaValidator Unit', function () {

  'use strict';

  var SchemaValidator = require('validators/SchemaValidator');

  describe('#validateData', function () {

    it ('should return true if data for type is all valid', function () {

      var data = {
        'id': 1233,
        'title': 'sldkfj'
      };

      expect(SchemaValidator.validateData(data, 'task')).to.be.true;
    });

    it ('should return false if any data for type is invalid', function () {

      var data = {
        'id': '123',
        'title': 'sldkfj'
      };

      expect(SchemaValidator.validateData(data, 'task')).to.be.false;
    });

  });

  describe('#isArray', function () {

    it ('should return true for an array', function () {

      var arr = [];
      expect(SchemaValidator.isArray(arr)).to.be.true;
    });

    it ('should return false for not array things', function () {

      var things = ['sdf', {}, '', undefined, null, 1, /sdlfkj/, true, false];

      things.forEach(function (thing) {

        expect(SchemaValidator.isArray(thing)).to.be.false;
      });
    });
  });

  describe('#isBoolean', function () {

    it ('should return true for booleans', function () {

      var bools = [true, false];
      bools.forEach(function (bool) {

        expect(SchemaValidator.isBoolean(bool)).to.be.true;
      });
    });

    it ('should return false for not booleans', function () {

      var things = ['sdf', {}, '', undefined, null, 1, /sdlfkj/];
      things.forEach(function (thing) {

        expect(SchemaValidator.isBoolean(thing)).to.be.false;
      });
    });
  });

  describe('#isInteger', function () {

    it('it should return true for Integers', function () {

      var validIntegers = [0, 1, 2, 1000, -298347, -23948293847, 129837192837918237];

      validIntegers.forEach(function (someInt) {

        expect(SchemaValidator.isInteger(someInt)).to.be.true;
      });
    });

    it('it should return false for things that are not Integers', function () {

      var invalidIntegers = [
        0.123,
        '123123',
        {},
        null,
        undefined,
        true,
        false,
        1E234,
        -1212323.12031802938
      ];

      invalidIntegers.forEach(function (someInt) {

        expect(SchemaValidator.isInteger(someInt)).to.be.false;
      });
    });
  });

  describe('#isString', function () {

    it ('should return true for Strings', function () {

      var validStrings = [
        '',
        '10938102938',
        '12093lskdjflskdfjlsijf'
      ];

      validStrings.forEach(function (someString) {

        expect(SchemaValidator.isString(someString)).to.be.true;
      });
    });

    it ('should return false for things that are not Strings', function () {

      var validStrings = [
        0,
        0.10938102938,
        true,
        false,
        null,
        undefined,
        1E234,
        function () {}
      ];

      validStrings.forEach(function (someString) {

        expect(SchemaValidator.isString(someString)).to.be.false;
      });
    });
  });

  describe('#isISODate', function () {

    it ('should return true for valid ISO Dates', function () {

      var validDates = [
        '2013-08-30T08:00:13.273Z',
        '2013-12-30T19:36:00.273Z',
        '0613-01-01T08:36:13.000Z',
        '4013-05-10T22:36:10.273Z',
        '2013-08-30T08:00:13Z'
      ];

      validDates.forEach(function (someISOString) {

        expect(SchemaValidator.isISODate(someISOString)).to.be.true;
      });
    });

    it ('should return false for invalid ISO Dates', function () {

      var invalidDates = [
        '2013-13-30T08:00:13.273Z',
        '2013-08-50T08:00:13.273Z',
        '2013-08-30T25:00:13.273Z',
        '2013-08-30T08:61:13.273Z',
        '2013-08-30T08:00:99.273Z',
        '2013-08-30T08:00:13.Z',
        '2013-12-30',
        {},
        '',
        123123,
        12313.0,
        undefined,
        false,
        true,
        null,
        function () {}
      ];

      invalidDates.forEach(function (someISOString) {

        expect(SchemaValidator.isISODate(someISOString)).to.be.false;
      });
    });
  });
});