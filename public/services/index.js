'use strict';

var ServiceGetOnly = require('./ServiceGetOnly');

var services = {
  'activities': require('./Activities'),
  'conversations': require('./Conversations'),
  'export': require('./Export'),
  'features': require('./Features'),
  'files': require('./Files'),
  'import': require('./Import'),
  'ical_feed': require('./IcalFeed'),
  'list_positions': require('./ListPositions'),
  'list_reminders_collections': require('./ListRemindersCollections'),
  'lists': require('./Lists'),
  'memberships': require('./Memberships'),
  'notes': require('./Notes'),
  'previews': require('./Previews'),
  'reminders': require('./Reminders'),
  'root': require('./Root'),
  // Services.js in order not confuse dependency tree with folder services/index.js
  'services': require('./Services.js'),
  'settings': require('./Settings'),
  'subtask_positions': require('./SubtaskPositions'),
  'subtasks': require('./Subtasks'),
  'task_comments': require('./TaskComments'),
  'task_comments_states': require('./TaskCommentsStates'),
  'task_positions': require('./TaskPositions'),
  'tasks': require('./Tasks'),
  'tasks_counts': require('./TasksCounts'),
  'unread_activities_counts': require('./UnreadActivitiesCounts'),
  'uploads': require('./Uploads'),
  'user': require('./User'),
  'users': require('./Users')
};

var revisionedEndpoints = [
  // 'file',
  'list',
  // 'folder',
  // 'list_position',
  // 'membership',
  // 'note',
  // 'reminder',
  // 'service',
  // 'setting',
  // 'subscription',
  // 'subtask',
  // 'subtask_position',
  'task'
  // 'task_comment',
  // 'task_position',
  // 'upload',
  // 'user'
];

revisionedEndpoints.forEach(function (type) {

  var revisionEndpoint = type + '_revisions';
  services[revisionEndpoint] = ServiceGetOnly.extend({
    'baseUrl': '/' + revisionEndpoint,
    'type': revisionEndpoint
  });
});

module.exports = services;
