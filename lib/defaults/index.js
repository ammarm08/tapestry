'use strict';

// default configurations if user doesn't pass any

const config = module.exports = {};

config.user = require('./auth.js');
config.install = require('./install.js');
config.publish = require('./publish.js');
config.storage = require('./storage.js');


/*

// 
//
//    DOCUMENTATION: CONFIGURATION OBJECT REQUIREMENTS
//
//

config.user = {
  verify: (token) => Promise((resolve, reject) => ...) verify if token matches valid user. resolve w/ user name
  add: (u, pw, email) => Promise((resolve, reject) => ...) if necessary, add new user. resolve w/ user token
}

config.install = {
  uplinks: [ { url: 'https://registrynpmjs.org', users: [] }, ... ] -- if users list empty, install privs for all logged-in users
}

config.publish = {
  local_prefix: 'local-' -- no package whose name isn't prefixed with 'local-' will be published
  users: [] -- if users list empty, publish privs for all logged-in users
}

config.storage = {
  has: (tarball_name, package_name) => Promise((resolve, reject) => ...) check if pkg exists. resolve with true/false
  write: (tarball, tarball_name, package_name) => Promise((resolve, reject) => ... ) write pkg if possible
  delete: (tarball_name, package_name) => Promise((resolve, reject) => ... ) delete pkg if possible
}

*/
