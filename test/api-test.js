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

const app = require('../lib/index.js');
const request = require('supertest');
const should = require('should');
const exec = require('child_process').exec;

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

const npmLogin = (u, pw, e) => {
  const credentials = {
    'Username: ': `${u}\n`,
    'Password: ': `${pw}\n`,
    'Email: (this IS public) ': `${e}\n`
  }

  return new Promise((resolve, reject) => {
    const proc = exec('npm login');
    proc.stdin.setEncoding('utf-8');

    let stdout = '';
    proc.stdout.on('data', chunk => {
      stdout += chunk;

      if (stdout in credentials) {
        proc.stdin.write(credentials[stdout]);
        stdout = '';
      }
    });

    let stderr = '';
    proc.stderr.on('data', chunk => {
      stderr += chunk;
    });

    proc.on('error', reject);

    proc.on('close', code => {
      if (code === 0) resolve(stdout);
      else reject(stderr);
    });
  });
}

require('should-http');

describe('Server starts', () => {
  // fire up Server

  // point registry to port of Server
  // npm add fake user



  // tests -- npm whoami

  // tests -- npm adduser

  // tests -- npm publish

  // tests -- npm install

  // etc -- see lib/index for all routes to check
});
