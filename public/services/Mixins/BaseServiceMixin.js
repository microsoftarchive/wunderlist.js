'use strict';

/**
  * Base mixin for service mixins.
  * @module services/Mixins/BaseServiceMixin
  * @extends wunderbits/WBMixin
  * @requires validators/SchemaValidator
  */

var core = require('wunderbits.core');
var WBMixin = core.WBMixin;

var SchemaValidator = require('../../validators/SchemaValidator');

module.exports = WBMixin.extend({
  /**
    * Passes data to be sent to the API through validators/SchemaValidator to validate data attribute types
    * @param {object} data - hash of key value pairs to be sent as part of request
    * @param {string} type - the type of the data e.g. 'task', 'note', etc.
    */
  'validateData': function (data, type) {
    SchemaValidator.validateData(data, type);
  }
});
