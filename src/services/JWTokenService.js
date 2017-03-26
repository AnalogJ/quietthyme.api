'use strict';
const debug = require('debug')('quietthyme:JWTokenService')
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
    HttpError = require('../common/HttpError'),
    tokenSecret = process.env.ENCRYPTION_JWT_PASSPHRASE;

// Generates a token from supplied payload
module.exports.issue = function(payload) {
    debug('Creating JWT: %o', payload)
    return jwt.sign(
        payload,
        tokenSecret, // Token Secret that we sign it with
        {
            expiresIn : "3h" // Token expires in 3 hours
        }
    );
};

// Verifies token on a request
module.exports.verify = function(token) {
    var deferred = q.defer();
    jwt.verify(token, tokenSecret, function(err, decoded) {
        if (err) {
            err.code = 401
            return deferred.reject(err);
        }
        return deferred.resolve(decoded);
    });
    return deferred.promise
};