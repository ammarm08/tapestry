'use strict;'

const assert = require('assert'),
      defaultConfig = require('./defaults/config.js');

const validateConfig = (config) => {
  const conf = Object.assign({}, defaultConfig, config);

  assert(conf.user, 'configuration must include "user" attribute. see docs.');
  assert(conf.storage, 'configuration must include "storage" attribute. see docs.');
  assert(conf.install, 'configuration must include "install" attribute. see docs.');
  assert(conf.publish, 'configuration must include "publish" attribute. see docs.');

  assert(conf.user.verify, 'user config must include a "verify" attribute [Promise]');
  assert(conf.user.add, 'user config must include an "add" attribute [Promise]');
  assert(conf.user.verify instanceof Promise || conf.user.verify instanceof Function, '"verify" must be a Promise');
  assert(conf.user.add instanceof Promise || conf.user.add instanceof Function, '"add" must be a Promise');

  assert(conf.storage.has, 'storage config must include a "has" attribute [Promise]');
  assert(conf.storage.write, 'storage config must include an "write" attribute [Promise]');
  assert(conf.storage.delete, 'storage config must include an "delete" attribute [Promise]');
  assert(conf.storage.has instanceof Promise || conf.storage.has instanceof Function, '"has" must be a Promise');
  assert(conf.storage.write instanceof Promise || conf.storage.write instanceof Function, '"write" must be a Promise');
  assert(conf.storage.delete instanceof Promise || conf.storage.delete instanceof Function, '"delete" must be a Promise');

  assert(conf.install.uplinks, 'install config must include an "uplinks" attribute [Array]');
  assert(Array.isArray(conf.install.uplinks), '"uplinks" must be an Array');

  for (let uplink of conf.install.uplinks) {
    assert(typeof uplink === 'object' && !Array.isArray(uplink), 'each uplink must be an object');
    assert(uplink.url, 'each uplink object must have a "url" attribute [String] that specifies the uplink url');
    assert(typeof uplink.url === 'string', '"uplink.url" must be a string');
    assert(uplink.users, 'each uplink object must have a "users" attribute [Array] that grants user privileges. An empty array indicates access to all users');
    assert(Array.isArray(uplink.users), '"uplink.users" must be an array. An empty array indicates access to all users');
  }

  assert(conf.publish.local_prefix, 'publish config must include a "local_prefix" attribute [String] to indicate required naming conventions for private packages');
  assert(typeof conf.publish.local_prefix === 'string', '"publish.local_prefix" must be a string');
  assert(conf.publish.users, 'publish config must include a "users" attribute [Array] to indicate which users have publishing privileges. An empty array indicates access to all users');
  assert(Array.isArray(conf.publish.users), '"publish.users" must be an Array');

  return conf;
}

module.exports = {
  validateConfig: validateConfig
}
