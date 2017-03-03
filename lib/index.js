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
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const Readable = require('stream').Readable;
const Cookies = require('cookies');
const app = express();
const assert = require('assert');
const Error = require('http-errors');

function wrap (fn) {
  const cr = Promise.coroutine(fn);
  return function coroutineFn (req, res, next) {
    cr(req, res, next).catch(next);
  }
}

app.disable('x-powered-by');
app.set('etag', false);


// Attach middlewares
app.use(compression());
app.use('/*', bodyParser.json({limit: '10mb'}));
app.use('/*', bodyParser.urlencoded({extended: false, limit: '10mb'}));

// Routes
module.exports = function (config) {
  // TODO: validate config


  app.get('/', (req, res, next) => res.json({message: 'hi'}));

  app.get('/-/whoami', wrap(function * (req, res, next) {
    let token, verified_user;

    if (req.remote_user) {
      return res.status(200).json({ username: req.remote_user.name });
    }

    token = req.headers.authorization && req.headers.authorization.split('Bearer ').pop();
    try {
      verified_user = yield config.user.verify(token);
    } catch (e) {
      console.error(e.message);
      return next(Error(401, 'user unauthorized on registry'));
    }

    return res.status(200).json({ username: verified_user, token: token });
  }));

  app.get('/:package/:version?', wrap(function * (req, res, next) {
    // npm version <package-name> -> returns version of package in registry

    // (1) public or local?
    // latest or specific?
        // latest -> get latest version or throw error if not found
        // specific -> either get specific or throw error if not found
  }));

  app.get('/:package/-/:filename', wrap(function * (req, res, next) {
    // npm install

    // after getting tarball
    // res.header('Content-Type', 'application/octet-stream');
    // tarstream.pipe(res);
  }));

  app.get('/-/all/:anything?', wrap(function * (req, res, next) {
    // TBD: search packages?
  }));

  app.post('/_session', Cookies.express(), wrap(function * (req, res, next) {
    res.cookies.set('AuthSession', String(Math.random()), {
      expires: new Date(Date.now() + (10 * 60 * 60 * 1000)) // 10h
    });

    return res.status(201).json({ ok: true, name: req.remote_user.name, roles: [] });
  }));

  app.get('/-/user/:db_user', wrap(function * (req, res, next) {
    return res.status(200).json({ok: `you are authenticated as "${req.remote_user.name}"`});
  }));

  app.put('/-/user/:db_user/:rev?/:revision?', wrap(function * (req, res, next) {
    let token;

    // check if already logged in ...
    token = req.headers.authorization && req.headers.authorization.split('Bearer ').pop();
    if (token) {
      try {
        yield config.user.verify(token);
        return res.status(201).json({ok: `you are already logged in`, token: token});
      } catch (e) {
        console.error(e.message);
        return next(Error(422, 'user already logged in but token invalid. try logging out first.'));
      }
    }

    // otherwise, add user
    try {
      token = yield config.user.add(`${req.body.name}:${req.body.password}`);
      return res.status(201).json({ok: `user ${req.body.name} created`, token: token});
    } catch (e) {
      console.error(e.message);
      return next(Error(422, 'user could not be created'));
    }
  }));

  app.put('/:package/:rev?/:revision?', wrap(function * (req, res, next) {
    const package_name = req.params.package;
    const metadata = req.body;
    let tarball_name, tarball;

    // validate incoming data
    try {
      assert(typeof metadata === 'object', 'bad package type');
      assert(!Array.isArray(metadata), 'bad package type');
      assert(metadata.name === package_name, 'package names in params and in body do not match');
    } catch (e) {
      console.error(e.message);
      return next(Error(422, e.message));
    }
    
    tarball_name = Object.keys(metadata._attachments)[0];
    tarball = metadata._attachments[tarball_name];

    // write tarball to storage
    try {
      yield config.storage.write(tarball, tarball_name, package_name);
    } catch (e) {
      console.error(e.message);
      return next(Error(422, e.message));
    }

    return res.status(200).json({ok: `package "${package_name}" published to private registry`});
  }));

  app.delete('/:package/-rev/*', wrap(function * (req, res, next) {
    // npm unpublish <package-name>
  }));

  app.delete('/:package/-/:filename/-rev/:revision', wrap(function * (req, res, next) {
    // npm unpublish  <tarball-name>
  }));

  app.put('/:package/-/:filename/*', wrap(function * (req, res, next) {
    // npm publish <tarball>
  }));

  // TBD: tags, stars, adding versions


  // Attach final handler
  app.use((err, req, res, next) => {
    if (err.status) {
      console.error('[ TAPESTRY ]', err.message);
      return res.status(err.status).json(err.message);
    } else {
      res.status(404);
    }
  });

  return app;
}
