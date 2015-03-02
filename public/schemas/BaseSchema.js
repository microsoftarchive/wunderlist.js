'use strict';

var core = require('wunderbits.core');
var clone = core.lib.clone;
var extend = core.lib.extend;

var SchemaTypes = require('./SchemaTypes');

module.exports = {
  'id': SchemaTypes.id,
  'task_id': SchemaTypes.id,
  'list_id': SchemaTypes.id,
  'user_id': SchemaTypes.id,

  'revision': SchemaTypes.int,
  'type': SchemaTypes.str,

  'created_at': SchemaTypes.ISODate,
  'updated_at': SchemaTypes.ISODate,

  'extend': function (obj) {
    return extend(clone(this), obj);
  }
};
