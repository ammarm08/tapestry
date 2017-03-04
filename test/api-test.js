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

const app = require('../lib/index.js')(require('../lib/defaults/config.js')),
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
  let port = 4873;
  let server = app.listen(port);
  let registryUrl = `http://localhost:${port}/`;

  const npm = new npmClient();
  const user = {
    username: 'testuser',
    password: 'testpass',
    email: 'test@email.com'
  }

  before(done => {
    execPromise(`if [ ! -d ./storage ]; then mkdir ./storage; fi`).then(() => {
      return execPromise(`npm set registry ${registryUrl}`);
    }).then(() => done())
    .catch(err => done(err));
  });

  after(done => {
    execPromise(`rm -rf ./storage`).then(() => {
      return execPromise(`mkdir ./storage`);
    }).then(() => {
      server.close();
      done();
    });
  });

  it ('should point npm to the private registry', done => {
    execPromise(`npm get registry`)
    .then(stdout => {
      stdout.trim().should.equal(registryUrl);
      done();
    }).catch(err => done(err));
  });

  // TODO: npm adduser -- test wonky inputs, already logged-in user, etc
  it('"npm adduser": should add and log in user to private registry', done => {
    npm.adduser(registryUrl, {auth: user}, (err, data, raw, res) => {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

  // TODO: npm whoami -- test unlogged-in user
  it('"npm whoami": should return the name of the logged in user from the private registry', done => {
    npm.whoami(registryUrl, {auth: user}, (err, res) => {
      if (err) {
        done(err);
      } else {
        res.should.equal(user.username);
        done();
      }
    });
  });

  it('"npm whoami": should not return an unauthorized user', done => {
    npm.whoami(registryUrl, {auth: {}}, (err, res) => {
      if (err) {
        should.exist(err);
        done();
      } else {
        should.not.exist(res);
        done();
      }
    });
  });

  // TODO: npm logout -- test logged in user + unlogged-in user

  // TODO: npm publish -- folder/tarball

  // TODO: npm unpublish -- folder/tarball

  // TODO: npm install -- folder/tarball

});
