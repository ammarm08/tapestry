'use strict';

const app = require('./lib')();
const port = process.env.PORT || 4873;


// Start the server

app.listen(port, () => {
  if (process.env.DEV) {
    console.info('[ TAPESTRY ] HTTP server listening on port ' + port);
    console.info(`[ TAPESTRY ] Server running with node version: ${process.version} `);
  }

  process.emit('ready');
});
