# Tapestry

A private NPM registry scaffold because Sinopia is awesome but buggy/unmaintained.

Configuration? 100%! You're the developer!

## TO-DO:

Everything.

## IDEAL USAGE:

```js

// custom config, otherwise inits tapestry with barebone defaults
const config = module.exports = {};

config.auth = (username, password, email) => {
  // maybe you want to authenticate against some internal endpoint
  request(someUrl, {auth: {username: username, password: password}})
  .then(() => username);
  .catch(() => false);
}

config.storage = {
  // where STORE is some naive DB
  has: (pkg) => STORE.includes(pkg),
  add: (pkg) => STORE.push(pkg),
  remove: (pkg) => STORE.delete(pkg)
}

config.packages = {
  public: {
    pattern: '*',
    access: ['names', 'of', 'users'],
    publish: ['names', 'of', 'users']
  },
  private: {
    pattern: 'local-*',
    access: ['names', 'of', 'users'],
    publish: ['names', 'of', 'users']
  }
}

// ...


const tapestry = require('tapestry')(config);
```
