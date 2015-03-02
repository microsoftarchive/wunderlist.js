'use strict';

var SchemaTypes = require('./SchemaTypes');
var BaseSchema = require('./BaseSchema');

module.exports = BaseSchema.extend({
  'assignee_id': SchemaTypes.id,

  'completed': SchemaTypes.bool,
  'completed_at': SchemaTypes.ISODate,
  'completed_by_id': SchemaTypes.id,

  'created_by_id': SchemaTypes.id,

  'due_date': SchemaTypes.ISODate,

  'starred': SchemaTypes.bool,

  'title': SchemaTypes.str
});
