'use strict';

const assert = require('assert'),
      Promise = require('bluebird'),
      Error = require('http-errors');

function coroutine (fn) {
  const cr = Promise.coroutine(fn);
  return function coroutineFn (req, res, next) {
    cr(req, res, next).catch(next);
  }
}

module.exports = function (app, config) {
  app.get('/:package/:version?', coroutine(function * (req, res, next) {
    // npm version <package-name> -> returns version of package in registry

    // (1) public or local?
    // latest or specific?
        // latest -> get latest version or throw error if not found
        // specific -> either get specific or throw error if not found
  }));

  app.get('/:package/-/:filename', coroutine(function * (req, res, next) {
    // npm install

    // after getting tarball
    // res.header('Content-Type', 'application/octet-stream');
    // tarstream.pipe(res);
  }));

  app.get('/-/all/:anything?', coroutine(function * (req, res, next) {
    // TBD: search packages?
  }));

  app.put('/:package/:rev?/:revision?', coroutine(function * (req, res, next) {
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

  app.delete('/:package/-rev/*', coroutine(function * (req, res, next) {
    // npm unpublish <package-name>
  }));

  app.put('/:package/-/:filename/*', coroutine(function * (req, res, next) {
    // npm publish <tarball>
  }));

  app.delete('/:package/-/:filename/-rev/:revision', coroutine(function * (req, res, next) {
    // npm unpublish  <tarball-name>
  }));
}
