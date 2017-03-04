'use strict;'

const assert = require('assert'),
      defaultConfig = require('./defaults/config.js');

const PROPS = {
  'user': ['add', 'verify'],
  'storage': ['has', 'write', 'delete'],
  'install': [],
  'publish': [] 
}

const validateConfig = (config) => {
  const conf = Object.assign({}, defaultConfig, config);

  Object.keys(PROPS).forEach(attr => {
    assert(conf[attr], `configuration must include "${attr}" attribute. see docs.`);

    if (attr === 'install') {
      assert(conf.install.uplinks, `Install config must include an "uplinks" attribute [Array]`);
      assert(Array.isArray(conf.install.uplinks), '"uplinks" must be an Array');

      for (let uplink of conf.install.uplinks) {
        assert(typeof uplink === 'object' && !Array.isArray(uplink), 'each uplink must be an object');
        assert(uplink.url, 'each uplink object must have a "url" attribute [String] that specifies the uplink url');
        assert(typeof uplink.url === 'string', '"uplink.url" must be a string');
        assert(uplink.users, 'each uplink object must have a "users" attribute [Array] that grants user privileges. An empty array indicates access to all users');
        assert(Array.isArray(uplink.users), '"uplink.users" must be an array. An empty array indicates access to all users');
      }
    }

    if (attr === 'publish') {
      assert(conf.publish.local_prefix, 'publish config must include a "local_prefix" attribute [String] to indicate required naming conventions for private packages');
      assert(typeof conf.publish.local_prefix === 'string', '"publish.local_prefix" must be a string');
      assert(conf.publish.users, 'publish config must include a "users" attribute [Array] to indicate which users have publishing privileges. An empty array indicates access to all users');
      assert(Array.isArray(conf.publish.users), '"publish.users" must be an Array');
    }

    const properties = PROPS[attr];
    properties.forEach(prop => {
      assert(conf[attr][prop], `${attr} config must include a "${prop}" attribute [Promise]`);
      assert(conf[attr][prop] instanceof Promise || conf[attr][prop] instanceof Function, `"${attr}" must be a Promise`);
    });

  });

  return conf;
}

module.exports = {
  validateConfig: validateConfig
}
