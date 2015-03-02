'use strict';

var SchemaTypes = require('./SchemaTypes');

module.exports = {
  'id': SchemaTypes.id,
  'title': SchemaTypes.str,
  'list_ids': SchemaTypes.arr,
  'user_id': SchemaTypes.id,
  'created_at': SchemaTypes.ISODate,
  'updated_at': SchemaTypes.ISODate,
  'revision': SchemaTypes.int,
  'type': SchemaTypes.str
};