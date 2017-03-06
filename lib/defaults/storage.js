'use strict';

const Promise = require('bluebird'),
      fs = require('fs'),
      semver = require('semver'),
      Readable = require('stream').Readable;

const readdirAsync = (path) => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, function (err, files) {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

const hasPackage = Promise.coroutine(function * (package_name, version) {
  let versions = [];

  // if package dir not found locally
  if (!fs.existsSync(`./storage/${package_name}`)) {
    throw Error('ENOENT: no package registered with that name locally');
  }

  // if specific version not found
  if (version && !fs.existsSync(`./storage/${package_name}/${package_name}-${version}.tgz`)) {
    throw Error('ENOENT: no package of that version found locally');
  }

  // otherwise find latest version
  if (version === undefined || !version) {
    const files = yield readdirAsync(`./storage/${package_name}`);
    if (!files || !files.length) throw Error('ENOENT: no package registered with that name locally');

    versions = files.map(f => f.split('-').pop().replace('.tgz', ''));
    version = versions.sort((a, b) => semver.gt(a, b))[0];
  }

  return {
    name: package_name,
    version: version,
    tarball: `./storage/${package_name}/${package_name}-${version}.tgz`
  }
});

const getTarball = Promise.coroutine(function * (tarball_name, package_name) {
  // implement
});

const writeTarball = Promise.coroutine(function * (tarball, tarball_name, package_name) {
  let tarball_stream, fs_writestream, count;

  // reject duplicates
  if (fs.existsSync(`./storage/${package_name}/${tarball_name}`)) {
    throw Error('EEXIST: tarball already exists')
  }

  // ensure folder
  if (!fs.existsSync(`./storage/${package_name}`)) {
    fs.mkdirSync(`./storage/${package_name}`);
  }

  // stream to file, resolve on finish, reject errors
  fs_writestream = fs.createWriteStream(`./storage/${package_name}/${tarball_name}`);

  fs_writestream.on('error', () => {
    throw Error('EPIPE: writestream error');
  });

  fs_writestream.on('finish', () => {
    return true;
  });

  // push data to read-end
  tarball_stream = Readable();
  count = 0;
  tarball_stream._read = () => {
    tarball_stream.push(tarball.data[count++]);
    if (count >= tarball.data.length) tarball_stream.push(null);
  }

  // pipe to write-end
  tarball_stream.pipe(fs_writestream);
});

const deleteTarball = Promise.coroutine(function * (tarball_name, package_name) {
  // implement
});

module.exports = {
  has: hasPackage,
  get: getTarball,
  write: writeTarball,
  delete: deleteTarball
}
