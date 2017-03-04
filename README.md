# Tapestry

A private NPM registry scaffold because Sinopia is awesome but unmaintained.

By default, Tapestry stores user auth info (hashed passwords) & packages (versioned tarballs) in filesystem, publishes only to the private registry (and not anything else upstream), and installs from npmjs.org if package not found locally.

But the more useful part is that Tapestry is highly configurable: write packages to your S3 bucket: use your own auth server to authenticate users; list multiple upstream registries to install from; only allow the publishing of packages of a specific prefix; set publish and install privileging, etc.

Custom configuration MUST be defined with the following interface:

```js
config.user
  .verify (token) => { /* ... returns a Promise resolving with the username */ },
  .add (username, password, email) => { /* ... returns a Promise resolving with an encrypted token for auth purposes */ },

config.storage
  .has (tarball_name, package_name) => { /* ... returns a Promise that resolves on find, rejects on no find */ },
  .write (tarball, tarball_name, package_name) => { /* ... persist tarball stream somewhere, resolve Promise on write, reject on no write */ },
  .delete (tarball_name, package_name) => {/* ... returns a Promise that resolves on delete, rejects on no delete */}

config.publish
   .local_prefix: 'local-' // [STRING] -> all packages in private registry (whether to install or publish) require this prefix,
   .users: [] // [ARRAY] -> list of usernames to allow publish access. empty Array means all logged-in users have publish access

config.install
   .uplinks: [{}, {}] // [ARRAY] -> { url: 'https://registry.npmjs.org', users: ['users', 'with', 'install', 'access'] }
```

## TO-DO:

Currenty working: user login, whoami, and package publishing.

Pending: package installing and unpublishing.

Next still: all the nuanced npm use cases. edge cases. ouch.


## IDEAL USAGE:

```js

// launch registry using default configuration

const tapestry = require('tapestry')();
tapestry.listen(process.env.PORT)

```

```bash

# points npm client to your registry
npm set registry <registry_endpoint>

# or npm adduser
npm login

# Username: 
# Password:
# Email ( ... ) :

# publishes package if that version doesn't already exist in private registry
npm publish

# installs local package if found
npm install --save local-tool

# installs upstream package
npm install --save express

```
