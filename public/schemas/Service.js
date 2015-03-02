'use strict';

var SchemaTypes = require('./SchemaTypes');
var BaseSchema = require('./BaseSchema');

module.exports = BaseSchema.extend({
  'user_id': SchemaTypes.id,
  'provider_id': SchemaTypes.str,
  'provider_type': SchemaTypes.str
});
