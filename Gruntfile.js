module.exports = function (grunt) {

  'use strict';

  // Run in force mode to not die on individual error
  var env = process.env.ENV || 'dev';
  if (env === 'dev') {
    grunt.option('force', true);
    grunt.option('stack', true);
  }

  // load task definitions
  if ('TRAVIS' in process.env) {
    grunt.option('force', false);
  }

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-complexity');

  function config (name) {
    return grunt.file.readJSON('./grunt/configs/' + name + '.json');
  }

  grunt.initConfig({

    // Linting
    'jshint': config('jshint'),
    'complexity': config('complexity'),
    'plato': config('plato'),

    'notify_hooks': {
      'options': {
        'enabled': true,
        'title': 'Wunderlist'
      }
    }
  });

  // Linter
  grunt.registerTask('lint', ['jshint', 'complexity']);

  // Default task
  grunt.registerTask('default', ['lint']);
};
