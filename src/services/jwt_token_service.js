'use strict';
const debug = require('debug')('quietthyme:JWTokenService');
/**
 * jwToken
 *
 * @description :: JSON Webtoken Service for sails
 * @help        :: See https://github.com/auth0/node-jsonwebtoken
 * http://sailsjs.org/#!/documentation/concepts/Services
 * http://thesabbir.com/how-to-use-json-web-token-authentication-with-sails-js/
 */

var jwt = require('jsonwebtoken'),
  q = require('q'),
  HttpError = require('../common/http_error'),
  nconf = require('../common/nconf'),
  tokenSecret = nconf.get('ENCRYPTION_JWT_PASSPHRASE');

var jwtTokenService = module.exports;

jwtTokenService.issueFromUser = function(user_data, type) {
  return jwtTokenService.issue(
    {
      uid: user_data.uid,
      plan: user_data.plan,
      catalog_token: user_data.catalog_token,
      first_name: user_data.first_name,
      last_name: user_data.last_name,
      email: user_data.email,
    },
    type
  );
};

// Generates a token from supplied payload
jwtTokenService.issue = function(payload, type) {
  debug('Creating JWT: %o', payload);
  return jwt.sign(
    payload,
    tokenSecret, // Token Secret that we sign it with
    {
      expiresIn: type == 'calibre' ? '7d' : '3h', // Web expires in 3 hours, Calibre in 7days
    }
  );
};

// Verifies token on a request
jwtTokenService.verify = function(token) {
  var deferred = q.defer();
  jwt.verify(token, tokenSecret, function(err, decoded) {
    if (err) {
      err.code = 401;
      return deferred.reject(err);
    }
    return deferred.resolve(decoded);
  });
  return deferred.promise;
};

//should only be used by GlobalHandler for logging, insecure
jwtTokenService.decodeSync = function(token){
  return jwt.decode(token);
}