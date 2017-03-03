'use strict';

const Promise = require('bluebird'),
      fs = require('fs'),
      Readable = require('stream').Readable;

const hasTarball = Promise.coroutine(function * (tarball_name, package_name) {
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
  has: hasTarball,
  write: writeTarball,
  delete: deleteTarball
}
