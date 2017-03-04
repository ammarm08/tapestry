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

const express = require('express'),
      bodyParser = require('body-parser'),
      compression = require('compression'),
      app = express(),
      utils = require('./utils.js');


// Attach middlewares
app.use(compression());
app.use('/*', bodyParser.json({limit: '10mb'}));
app.use('/*', bodyParser.urlencoded({extended: false, limit: '10mb'}));



// Routes

module.exports = function (config) {
  config = utils.validateConfig(config);

  // test route
  app.get('/', (req, res, next) => res.json({message: 'hi'}));

  // user routes
  require('./user_routes')(app, config);
  require('./package_routes')(app, config);

  // TBD: tags, stars, adding versions


  // err handler
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
