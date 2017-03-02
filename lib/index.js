'use strict';

// Load environment files before anything else
require('dotenv').config({
  path: require('path').join(__dirname, '../.env')
});

// Set new env for production so comparison doesnt need to be made a ton
if (process.env.NODE_ENV === 'production') {
  process.env.PRODUCTION = true;
} else {
  process.env.DEV = true;
}

// TODO: throw assertion error of expected env vars not found!!!!

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const crypto = require('crypto');
const Cookies = require('cookies');
const app = express();

// PLACEHOLDER USER DB
const users = {};

function encrypt (text) {
  const cipher = crypto.createCipher(process.env.CRYPT_ALGO, process.env.CRYPT_PASS);

  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt (text) {
  const decipher = crypto.createDecipher(process.env.CRYPT_ALGO, process.env.CRYPT_PASS);

  let dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

app.disable('x-powered-by');
app.set('etag', false);


// Attach middlewares
app.use(compression());
app.use('/*', bodyParser.json({limit: '10mb'}));
app.use('/*', bodyParser.urlencoded({extended: false, limit: '10mb'}));

// Routes
app.get('/', (req, res, next) => res.json({message: 'hi'}));

app.get('/-/whoami', (req, res, next) => {
  if (req.remote_user) {
    next({ username: req.remote_user.name });
  }

  // otherwise
  const token = req.headers.authorization.split('Bearer ').pop();
  if (token) {
    const credentials = decrypt(token).split(':');
    req.remote_user = { name: credentials[0] };
    next({ username: req.remote_user.name, token: token });
  }
});

app.get('/:package/:version?', (req, res, next) => {
  // npm version <package-name> -> returns version of package in registry
});

app.get('/:package/-/:filename', (req, res, next) => {
  // TBD:
});

app.get('/-/all/:anything?', (req, res, next) => {
  // TBD: search packages?
});

app.post('/_session', Cookies.express(), (req, res, next) => {
  res.cookies.set('AuthSession', String(Math.random()), {
    expires: new Date(Date.now() + (10 * 60 * 60 * 1000)) // 10h
  });

  next({ ok: true, name: req.remote_user.name, roles: [] });
});

app.get('/-/user/:db_user', (req, res, next) => {
  res.status(200);
  next({ok: `you are authenticated as "${req.remote_user.name}"`});
});

app.put('/-/user/:db_user/:rev?/:revision?', (req, res, next) => {
  // create token
  let token;
  if (req.body.name && req.body.password) {
    token = encrypt(`${req.body.name}:${req.body.password}`);
  }

  // already logged in?
  if (req.remote_user && req.remote_user.name) {
    res.status(201);
    next({ok: `you are authenticated as ${req.remote_user.name}`, token: token});
  }

  // already registered?
  if (req.body.name in users && decrypt(users[req.body.name]) === req.body.password) {
    res.status(200);
    req.remote_user = { name: req.body.name };
    next({ok: `you are authenticated as ${req.remote_user.name}`, token: token});
  }

  // otherwise create user
  users[req.body.name] = token;
  req.remote_user = req.body.name;
  res.status(201);
  return next({ok: `user ${req.body.name} created`, token: token});
});

app.put('/:package/:rev?/:revision?', (req, res, next) => {
  const name = req.params.package;
  const metadata = req.body;

  if (typeof metadata !== 'object' || Array.isArray(metadata) || metadata.name !== name) {
    next({status: 422, message: 'bad incoming package'});
  }

  metadata['dist-tags'] = metadata['dist-tags'] || {};
  metadata['versions'] = metadata['versions'] || {};

  if (req.params._rev) {
    // change the version in storage
    /*
    validate metadata.versions and metadata.dist-tags (need to be objects)
    - normalize package -> need versions dist-tags _distfiles _attachments and _uplinks objs in package + pkg._rev |== 0-0000000000000000
    - updateFn -> go through each version in json.versions. if metadata doesnt have that version, delete that version from json, then delete every _attachments[file].version of ver
    - write package -> json._rev = increment leading version number + '-' + pseudorandombytes(8).toString('hex')
    - write json (stringify value null tab)
    */
  } else {
    // add the package to storage
    /*
    - create json (thread-safe?)
    - (TODO later: ES-like indexing for future searchability)
    */
  }

  if (typeof metadata._attachments !== 'object' || typeof metadata.versions !== 'object' || Array.isArray(metadata._attachments) || Array.isArray(metadata.versions)) {
    next({status: 400, message: 'unsupported registry call: attachments and versions of unsupported type'});
  }

  const tarball = Object.keys(metadata._attachments)[0];
  const version = Object.keys(metadata.versions)[0];

  // create tarball, then create version, then merge dist-tags, then 201 done :)
  /*
  tarball name validation (filename utils -- name can't be package.json or __proto__ -- storage needs an entry for name)
  tarball upstream -- EEXISTS (tarball present 409), ENOENT (package exists?) -- normalize package, update fn (_attachments[filename] = {shasum: shasum.digest('hex')})
  */
  /*
  normalize package, update fn (json.readme = metadata.readme. if json already has that version 409. if tarball shasums are different 400. set _attachments[tarball].version
  set json.versions[version], tag_version(json, version, tag), localList.add)
  normalize package, update fn (delete all dist-tags that are in json but not in metadata. json.versions[current_tag] doesnt exist 404. tag_version(json, tags[t], tag))
  */


  // adding/changing package logic...
  /*
  metadata._attachments needs to be an object of a single key
  metadata.versions needs to be an object of a single key

  get tarball name (first key in _attachments)
  create tarball based on this name
  get version (first key in versions)
  get readme (that version's 'readme' attribute)
  create version
  add tags from metadata[dist-tags]
  finally, return 201 with ok
  */

});

app.delete('/:package/-rev/*', (req, res, next) => {
  // npm unpublish <package-name>
});

app.delete('/:package/-/:filename/-rev/:revision', (req, res, next) => {
  // npm unpublish  <tarball-name>
});

app.put('/:package/-/:filename/*', (req, res, next) => {
  // npm publish <tarball>
});

// TBD: tags, stars, adding versions


// Attach final handler
app.use((msg, req, res, next) => {
  if (msg && !msg.status) {
    res.json(msg);
  } else if (msg.status) {
    console.error('[ TAPESTRY ]', msg);
    return res.sendStatus(msg.status);
  } else {
    res.sendStatus(404);
  }

});


// Export the application so it can be used elsewhere
module.exports = app;
