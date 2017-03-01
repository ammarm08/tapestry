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
  // npm whoami -> returns username of user who ran npm login
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
  // npm publish -> writes package to storage then returns affirmative message
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
