'use strict';

var SchemaTypes = require('./SchemaTypes');
var BaseSchema = require('./BaseSchema');

module.exports = BaseSchema.extend({
  'key': SchemaTypes.str,
  'value': SchemaTypes.str
});
