'use strict';

const crypto = require('crypto'),
      assert = require('assert'),
      Promise = require('bluebird');

assert(process.env.CRYPT_ALGO, 'encryption algorithm must be specified as process.env.CRYPT_ALGO');
assert(process.env.CRYPT_PASS, 'encryption secret must be specified as process.env.CRYPT_PASS');

const USERS = {};

const encrypt = (text) => {
  const cipher = crypto.createCipher(process.env.CRYPT_ALGO, process.env.CRYPT_PASS);
  let token = cipher.update(text, 'utf8', 'hex');
  token += cipher.final('hex');
  return token;
};

const decrypt = (token) => {
  const decipher = crypto.createDecipher(process.env.CRYPT_ALGO, process.env.CRYPT_PASS);
  let dec = decipher.update(token, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

/**
 *
 * Add user to whatever user storage scheme you are using.
 * Must return a Promise that resolves with a token that 
 * npm uses for future authentication.
 *
 * @param {String} unsafeToken
 *    Token to encrypt (or otherwise use), of form `${username}:${password}`
 *
 * @param {String} email
 *    User-provided email address
 *
 * @return {Promise that must resolve with an encrypted token}
 */
const addUser = Promise.coroutine(function * (unsafeToken, email) {
  let token, user;

  try {
    token = encrypt(unsafeToken);
  } catch (e) {
    throw (e);
  }

  user = unsafeToken.split(':')[0];
  USERS[user] = token;
  return token;
});


/**
 *
 * Check user token against user storage scheme.
 * Must return a Promise that resolves with username
 *
 * @param {String} unsafeToken
 *    Token to encrypt (or otherwise use), of form `${username}:${password}`
 *
 * @param {String} email
 *    User-provided email address
 *
 * @return {Promise that must resolve with the token's username}
 */
const verifyUser = Promise.coroutine(function * (token) {
  let dec;
  try {
    dec = decrypt(token);
  } catch (e) {
    throw (e);
  }

  return dec.split(':')[0]; // [ username, password ]
});



module.exports = {
  add: addUser,
  verify: verifyUser
}
