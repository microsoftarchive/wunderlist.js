'use strict';

var SchemaTypes = require('./SchemaTypes');
var BaseSchema = require('./BaseSchema');

module.exports = BaseSchema.extend({
  'name': SchemaTypes.str,
  'email': SchemaTypes.str,
  'pro': SchemaTypes.bool
});
