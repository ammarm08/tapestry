# Tapestry

A private NPM registry scaffold because Sinopia is awesome but buggy/unmaintained.

Default configuration:
- user "database" is a JSON file with user:hashed_pwd key-value pairs
- package "storage" in filesystem (versioned tarballs)
- can only publish to private registry, not to any upstream repositories
- only packages prefixed with "local-" get written to private registry
- any user who has successfully logged in can install and publish packages

To customize, you can define your own configuration as long as it has the following interface.

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

Next: package installing and unpublishing.

Next still: all the nuanced npm use cases.


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
