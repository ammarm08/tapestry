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
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const Readable = require('stream').Readable;
const Cookies = require('cookies');
const app = express();
const assert = require('assert');
const Error = require('http-errors');

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
    return res.status(200).json({ username: req.remote_user.name });
  }

  // otherwise
  if ('authorization' in req.headers) {
    const token = req.headers.authorization.split('Bearer ').pop()
    const credentials = decrypt(token).split(':');
    req.remote_user = { name: credentials[0] };
    return res.status(200).json({ username: req.remote_user.name, token: token });
  } else {
    next(Error(401, 'user unauthorized on registry'));
  }
});

app.get('/:package/:version?', (req, res, next) => {
  // npm version <package-name> -> returns version of package in registry
  const name = req.params.package;
  const version = req.params.version;
  const uplinks = ['https://registry.npmjs.org'];
  const local = 'mci-';

  // local!
  if (name.substr(0, local.substr(0, local.length))) {
    fs.readdirAsync(`./storage/${name}`).then(files => {
      let latest = null;

      for (let file of files) {
        if (version !== undefined && file.replace(/[-a-zA-Z.]+/gi, '') === version.replace(/[.]/gi, '')) {
          return next(version);
        } else {
          latest = Math.max(parseInt(latest.replace(/[-a-zA-Z.]+/gi, ''), 10) || null, parseInt(file.replace(/[-a-zA-Z.]+/gi, ''), 10));
        }
      }

    }).catch(err => next(Error(404, 'package not found')));
  }

  // (1) public or local?
  // latest or specific?
      // latest -> get latest version or throw error if not found
      // specific -> either get specific or throw error if not found
});

app.get('/:package/-/:filename', (req, res, next) => {
  // npm install

  // after getting tarball
  // res.header('Content-Type', 'application/octet-stream');
  // tarstream.pipe(res);
});

app.get('/-/all/:anything?', (req, res, next) => {
  // TBD: search packages?
});

app.post('/_session', Cookies.express(), (req, res, next) => {
  res.cookies.set('AuthSession', String(Math.random()), {
    expires: new Date(Date.now() + (10 * 60 * 60 * 1000)) // 10h
  });

  return res.status(201).json({ ok: true, name: req.remote_user.name, roles: [] });
});

app.get('/-/user/:db_user', (req, res, next) => {
  return res.status(200).json({ok: `you are authenticated as "${req.remote_user.name}"`});
});

app.put('/-/user/:db_user/:rev?/:revision?', (req, res, next) => {
  // create token
  let token;
  if (req.body.name && req.body.password) {
    token = encrypt(`${req.body.name}:${req.body.password}`);
  }

  // already logged in?
  if (req.remote_user && req.remote_user.name) {
    return res.status(201).json({ok: `you are authenticated as ${req.remote_user.name}`, token: token});
  }

  // already registered?
  if (req.body.name in users && decrypt(users[req.body.name]) === req.body.password) {
    req.remote_user = { name: req.body.name };
    return res.status(200).json({ok: `you are authenticated as ${req.remote_user.name}`, token: token});
  }

  // otherwise create user
  users[req.body.name] = token;
  req.remote_user = req.body.name;
  return res.status(201).json({ok: `user ${req.body.name} created`, token: token});
});

app.put('/:package/:rev?/:revision?', (req, res, next) => {
  const name = req.params.package;
  const metadata = req.body;

  let tarball_name, tarball, tarstream, writestream, count;

  try {
    // validate data
    assert(typeof metadata === 'object', 'bad package type');
    assert(!Array.isArray(metadata), 'bad package type');
    assert(metadata.name === name, 'bad package type');

    tarball_name = Object.keys(metadata._attachments)[0];
    tarball = metadata._attachments[tarball_name];

    // make sure dir exists for tarball
    if (!fs.existsSync(`./storage/${name}`)) fs.mkdirSync(`./storage/${name}`);

    // avoid overwrites
    assert(!fs.existsSync(`./storage/${name}/${tarball_name}`), 'package of that version already exists. bump up the version and try again.');
  } catch (e) {
    switch (e.message) {
      case 'bad package type':
        return next(Error(422, e.message));
      case 'package of that version already exists. bump up the version and try again.':
        return next(Error(409, e.message));
      default:
        return next(Error(422, e.message));
    }
  }

  // stream to file, respond on finish
  writestream = fs.createWriteStream(`./storage/${name}/${tarball_name}`);
  writestream.on('error', () => next(Error(422, 'error writing tarball')));
  writestream.on('finish', () => {
    return res.status(200).json({ok: `package "${name}" published to private registry`});
  });

  // push data to read end
  tarstream = Readable();
  count = 0;
  tarstream._read = () => {
    tarstream.push(tarball.data[count++]);
    if (count >= tarball.data.length) tarstream.push(null);
  }

  // pipe to write end
  tarstream.pipe(writestream);

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
app.use((err, req, res, next) => {
  if (err.status) {
    console.error('[ TAPESTRY ]', err.message);
    return res.status(err.status).json(err.message);
  } else {
    res.status(404);
  }
});


// Export the application so it can be used elsewhere
module.exports = app;
