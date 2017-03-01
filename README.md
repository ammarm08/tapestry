# Tapestry

A private NPM registry scaffold because Sinopia is awesome but buggy/unmaintained.

Configuration? 100%! You're the developer!

## TO-DO:

Everything.

## IDEAL USAGE:

```js

// custom config, otherwise inits tapestry with barebone defaults

const config = module.exports = {};

config.auth = someAuthenticationScheme
config.storage = someStorageScheme

// ...


const tapestry = require('tapestry')(config);
```
