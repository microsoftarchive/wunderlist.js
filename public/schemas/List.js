'use strict';

var SchemaTypes = require('./SchemaTypes');
var BaseSchema = require('./BaseSchema');

module.exports = BaseSchema.extend({
  'created_by_id': SchemaTypes.id,
  'list_type': SchemaTypes.str,
  'title': SchemaTypes.str
});
