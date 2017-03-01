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
      npmClient = require('npm-registry-client'),
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
  let registryUrl = `http://localhost:${port}/`;

  const npm = new npmClient();
  const user = {
    username: 'testuser',
    password: 'testpass',
    email: 'test@email.com'
  }

  before(done => {
    execPromise(`npm set registry ${registryUrl}`)
    .then(() => done())
    .catch(err => done(err));
  });

  after(done => {
    execPromise(`npm logout`)
    .then(stdout => server.close(done))
    .catch(err => server.close(done));
  });

  it ('should point npm to the private registry', done => {
    execPromise(`npm get registry`)
    .then(stdout => {
      stdout.trim().should.equal(registryUrl);
      done();
    }).catch(err => done(err));
  });

  it('should add and log in user to private registry', done => {
    npm.adduser(registryUrl, {auth: user}, (err, data, raw, res) => {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

});
