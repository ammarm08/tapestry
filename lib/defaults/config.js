'use strict';

// default configurations if user doesn't pass any

const config = module.exports = {};

config.user = require('./auth.js');
config.install = require('./install.js');
config.publish = require('./publish.js');

config.storage = {
  has: function () {

  },

  write: function () {

  },

  delete: function () {

  }
}


