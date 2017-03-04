'use strict';

const Cookies = require('cookies'),
      Promise = require('bluebird'),
      Error = require('http-errors');

function coroutine (fn) {
  const cr = Promise.coroutine(fn);
  return function coroutineFn (req, res, next) {
    cr(req, res, next).catch(next);
  }
}

module.exports = function (app, config) {
  app.get('/-/whoami', coroutine(function * (req, res, next) {
    let token, verified_user;

    if (req.remote_user) {
      return res.status(200).json({ username: req.remote_user.name });
    }

    token = req.headers.authorization && req.headers.authorization.split('Bearer ').pop();
    try {
      verified_user = yield config.user.verify(token);
    } catch (e) {
      console.error(e.message);
      return next(Error(401, e.message));
    }

    return res.status(200).json({ username: verified_user, token: token });
  }));

  app.post('/_session', Cookies.express(), coroutine(function * (req, res, next) {
    res.cookies.set('AuthSession', String(Math.random()), {
      expires: new Date(Date.now() + (10 * 60 * 60 * 1000)) // 10h
    });

    return res.status(201).json({ ok: true, name: req.remote_user.name, roles: [] });
  }));

  app.get('/-/user/:db_user', coroutine(function * (req, res, next) {
    return res.status(200).json({ok: `you are authenticated as "${req.remote_user.name}"`});
  }));

  app.put('/-/user/:db_user/:rev?/:revision?', coroutine(function * (req, res, next) {
    let token;

    // check if already logged in ...
    token = req.headers.authorization && req.headers.authorization.split('Bearer ').pop();
    if (token) {
      try {
        yield config.user.verify(token);
        return res.status(201).json({ok: `you are already logged in`, token: token});
      } catch (e) {
        console.error(e.message);
        return next(Error(422, 'user already logged in but token invalid. try logging out first.'));
      }
    }

    // otherwise, add user
    try {
      token = yield config.user.add(req.body.name, req.body.password, req.body.email);
      return res.status(201).json({ok: `user ${req.body.name} created`, token: token});
    } catch (e) {
      console.error(e.message);
      return next(Error(422, 'user could not be created'));
    }
  }));
}


