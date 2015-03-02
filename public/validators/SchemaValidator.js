'use strict';

/**
  * @module validators/SchemaValidator
  * @extends wunderbits/WBSingleton
  * @requires module:schema/List
  * @requires module:schema/Subtask
  * @requires module:schema/Task
  */

var core = require('wunderbits.core');
var WBSingleton = core.WBSingleton;

var MagiConsole = require('magiconsole');
var localConsole = new MagiConsole('SDK:SCHEMAVALIDATOR');

var _schemas = require('../schemas');

var _validatorByType = {
  'array': 'isArray',
  'integer': 'isInteger',
  'boolean': 'isBoolean',
  'string': 'isString',
  'ISODate': 'isISODate'
};

var SchemaValidator = WBSingleton.extend({

  /**
    * Validates a data object based on a schema
    * @param {object}
    */
  'validateData': function (data, type) {

    var self = this;
    var isAllDataIsValid = true;
    var dataType, validtor, isValid, value;

    var schema = _schemas[type];

    if (!schema) {
      localConsole.warn('No data schema for type "' + type + '"');
      return true;
    }

    for (var key in data) {

      isValid = undefined;
      dataType = schema[key];

      if (!dataType) {
        localConsole.warn('No validation set for key', key, 'for', type);
      }

      value = data[key];
      validtor = self[_validatorByType[dataType]];

      if (validtor) {
        isValid = validtor.call(self, value);
        if (!isValid) {
          localConsole.warn(type + ' value ' + value + ' (' + typeof value + ') for key "' + key + '"" did not pass validation for type ' + dataType);
          isAllDataIsValid = false;
        }
        else {
          // localConsole.debug('Value ' + value + ' (' + typeof value + ') for key "' + key + '"" passed validation for type ' + dataType);
        }
      }
    }

    return isAllDataIsValid;
  },

  /**
    * Returns true if is an Array
    * @param {object} variable - The thing to check for Arrayness
    */
  'isArray': function (variable) {

    return Array.isArray(variable);
  },

  /**
    * Returns true if is a Boolean
    * @param {object} variable - The thing to check for Booleaness
    */
  'isBoolean': function (variable) {

    return variable === false || variable === true;
  },

  /**
    * Returns true if is an Integer
    * @param {object} variable - The thing to check for Integerness
    */
  'isInteger': function (variable) {

    // http://stackoverflow.com/questions/3885817/how-to-check-if-a-number-is-float-or-integer
    return typeof variable === 'number' && parseFloat(variable) === parseInt(variable, 10) && !isNaN(variable);
  },

  /**
    * Returns true if is a String
    * @param {object} variable - The thing to check for Stringness
    */
  'isString': function (variable) {

    return typeof variable === 'string';
  },

  /**
    * Returns true if is an ISO Date string
    * @param {object} variable - The thing to check for ISO Dateness
    */
  'isISODate': function (variable) {

    var self = this;

    // do not even regex if not a string
    if (!self.isString(variable)) {
      return false;
    }

    var ISODate = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-2])T(0[0-9]|1[0-9]|2[0-3])(:([0-5][0-9])){2}(\.\d{3})?Z$/;
    return ISODate.test(variable);
  }
});

module.exports = SchemaValidator;
