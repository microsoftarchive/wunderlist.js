'use strict';

var SchemaTypes = require('./SchemaTypes');

module.exports = {
  'id': SchemaTypes.id,
  'name': SchemaTypes.str,
  'organization_id': SchemaTypes.id,
  'created_at': SchemaTypes.ISODate,
  'updated_at': SchemaTypes.ISODate,
  'revision': SchemaTypes.int,
  'team_type': SchemaTypes.str,
  'type': SchemaTypes.str
};
