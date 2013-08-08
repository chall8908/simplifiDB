module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.name %> v<%= pkg.version %> by <%= pkg.author %>\n'  +
              ' * Packaged on <%= grunt.template.today("yyyy-mm-dd") %>\n'         +
              ' * License: <%= pkg.license %>\n'                                +
              ' * https://github.com/chall8908/easy_db\n'                       +
              ' */\n'
    },
    concat: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        src:[ 'src/*.js' ],
        dest: '<%= pkg.main %>'
      }
    },
    jshint: {
      // define the files to lint
      files: ['gruntfile.js', 'src/*.js']
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      build: {
        src: '<%= pkg.main %>',
        dest: '<%= pkg.main.split(".").join(".min.") %>'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('package', ['jshint', 'concat', 'uglify']);
  grunt.registerTask('default', ['package']);

};
