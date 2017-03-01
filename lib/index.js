'use strict';

// Set new env for production so comparison doesnt need to be made a ton
if (process.env.NODE_ENV === 'production') {
  process.env.PRODUCTION = true;
} else {
  process.env.DEV = true;
}

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.disable('x-powered-by');
app.set('etag', false);


// Attach middlewares
app.use('/', bodyParser.json({limit: '10mb'}));
app.use('/', bodyParser.urlencoded({extended: false, limit: '10mb'}));

app.get('/', (req, res, next) => res.json({message: 'hi'}));

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
