'use strict';
/* eslint-disable */

/**
 * api-test.js
 * ------------------------------------------------------
 *
 * Mocha tests for Tapestry
 *
 * ------------------------------------------------------
 */

const app = require('../lib/index.js'),
      request = require('supertest'),
      should = require('should'),
      exec = require('child_process').exec,
      join = require('path').join; 

const execPromise = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err);
      else if (stdout) resolve(stdout);
      else if (stderr) reject(stderr);
      else resolve();
    });
  });
}

require('should-http');

describe('Server starts', () => {
  let port = 8473;
  let server = app.listen(port);

  before(done => {
    execPromise(`bash ${join(__dirname, '../lib/helpers/set_registry.sh')} http://localhost:${port}/`)
    .then(() => done())
    .catch(err => done(err));
  });

  after(done => {
    server.close(done);
  });

  it ('should point npm to the private registry', done => {
    execPromise(`npm get registry`)
    .then(stdout => {
      stdout.trim().should.equal(`http://localhost:${port}/`);
      done();
    }).catch(err => done(err));
  });


});
