'use strict';

// Set new env for production so comparison doesnt need to be made a ton
if (process.env.NODE_ENV === 'production') {
  process.env.PRODUCTION = true;
} else {
  process.env.DEV = true;
}

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const app = express();

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

app.post('/_session', (req, res, next) => {
  // TBD: authentication route? ... req.remote_user
});

app.put('/-/user/:db_user/:rev?/:revision?', (req, res, next) => {
  // TBD: add user
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


// Attach error handler
app.use((err, req, res, next) => {
  if (err) {
    console.error('[ MCI-REGISTRY ]', err);
    return res.sendStatus(err.status || 400);
  }
  res.sendStatus(404);
});


// Export the application so it can be used elsewhere
module.exports = app;
