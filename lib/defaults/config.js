'use strict';

// default configurations if user doesn't pass any

const config = module.exports = {};

config.user = require('./auth.js');

config.storage = {
  has: function () {

  },

  write: function () {

  },

  delete: function () {

  }
}

config.install = {
  uplinks: [
    { name: 'https://registry.npmjs.org', users: [] }
  ]
}

config.publish = {
  local_prefix: 'local-',
  users: []
}
