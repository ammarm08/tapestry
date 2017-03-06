'use strict';

const assert = require('assert'),
      Promise = require('bluebird'),
      NpmRegistry = require('npm-registry-client'),
      npm_client = new NpmRegistry(),
      Error = require('http-errors');

function coroutine (fn) {
  const cr = Promise.coroutine(fn);
  return function coroutineFn (req, res, next) {
    cr(req, res, next).catch(next);
  }
}

npm_client.get_version = function (uri, params) {
  return new Promise((resolve, reject) => {
    npm_client.get(uri, params, (err, data) => {
      reject(err);
      resolve(data);
    });
  });
}

function buildPackageData (name, version, tarball) {
  const obj = {
    _id: name,
    _rev: 'figure-me-out',
    description: name,
    'dist-tags': {},
    versions: {},
    readme: '\n',
    maintainers: [],
    license: 'UNLICENSED',
    readmeFilename: 'README.md',
    _attachments: {}
  }

  obj.versions[version] = {
    name: name,
    version: version,
    description: name,
    _id: `${name}@${version}`,
    _shasum: 'also-figure-me-out',
    _from: '.',
    _npmUser: {},
    dist: {
      _shasum: 'another-thing',
      tarball: tarball
    }
  }

  return obj;
}

module.exports = function (app, config) {
  app.get('/:package/:version?', coroutine(function * (req, res, next) {
    const package_name = req.params.package;
    const version = req.params.version;

    // check local
    let localData;
    try {
      localData = yield config.storage.has(package_name, version);
      return res.status(200).json(buildPackageData(localData.name, localData.version, localData.tarball));
    } catch (e) {
      console.error(e.message);
    }

    // check upstreams. grab specific version or latest

    // otherwise return error
    return next(Error(422, 'package not found in private registry nor in any upstreams'));
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
