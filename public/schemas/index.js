'use strict';

var PositionSchema = require('./Position');

module.exports = {
  'list': require('./List'),
  'folder': require('./Folder'),
  'membership': require('./Membership'),
  'note': require('./Note'),
  'reminder': require('./Reminder'),
  'setting': require('./Setting'),
  'service': require('./Service'),
  'subtask': require('./Subtask'),
  'task': require('./Task'),
  'task_comment': require('./TaskComment'),
  'user': require('./User'),
  'team': require('./Team'),
  'organization': require('./Organization'),
  'list_position': PositionSchema,
  'subtask_position': PositionSchema,
  'task_position': PositionSchema
};