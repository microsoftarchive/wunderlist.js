'use strict';

var SchemaTypes = require('./SchemaTypes');
var BaseSchema = require('./BaseSchema');

module.exports = BaseSchema.extend({
  'sender_id': SchemaTypes.id,
  'state': SchemaTypes.str,
  'owner': SchemaTypes.bool,
});
