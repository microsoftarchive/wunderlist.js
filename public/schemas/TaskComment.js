'use strict';

var SchemaTypes = require('./SchemaTypes');
var BaseSchema = require('./BaseSchema');

module.exports = BaseSchema.extend({
  'read': SchemaTypes.bool,
  'text': SchemaTypes.str
});
