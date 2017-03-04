# Tapestry

A private NPM registry scaffold because Sinopia is awesome but unmaintained.

By default, Tapestry stores user auth info (hashed passwords) & packages (versioned tarballs) in filesystem, publishes only to the private registry (and not anything else upstream), and installs from npmjs.org if package not found locally.

But the more useful part is that Tapestry is highly configurable: write packages to your S3 bucket: use your own auth server to authenticate users; list multiple upstream registries to install from; only allow the publishing of packages of a specific prefix; set publish and install privileging, etc.

Custom configuration MUST be defined with the following interface:

```js
config.user = {
  verify: (token) => Promise((resolve, reject) => ...) // verify if token matches valid user. resolve w/ user name
  add: (u, pw, email) => Promise((resolve, reject) => ...) // if necessary, add new user. resolve w/ user token
}

config.install = {
  uplinks: [ { url: 'https://registrynpmjs.org', users: [] }, ... ] // if users list empty, install privs for all logged-in users
}

config.publish = {
  local_prefix: 'local-' // no package whose name isn't prefixed with 'local-' will be published
  users: [] // if users list empty, publish privs for all logged-in users
}

config.storage = {
  has: (tarball_name, package_name) => Promise((resolve, reject) => ...) // check if pkg exists. resolve with true/false
  write: (tarball, tarball_name, package_name) => Promise((resolve, reject) => ... ) // write pkg if possible
  delete: (tarball_name, package_name) => Promise((resolve, reject) => ... ) // delete pkg if possible
}
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
