'use strict';

var SchemaTypes = require('./SchemaTypes');
var BaseSchema = require('./BaseSchema');

module.exports = BaseSchema.extend({
  'completed': SchemaTypes.bool,
  'completed_at': SchemaTypes.ISODate,
  'completed_by_id': SchemaTypes.id,

  'created_by_id': SchemaTypes.id,
  'title': SchemaTypes.str
});
