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
    HttpError = require('../errors/HttpError'),
    tokenSecret = process.env.ENCRYPTION_JWT_PASSPHRASE;

// Generates a token from supplied payload
module.exports.issue = function(payload) {
    console.log('CREATING JWT,', payload)
    return jwt.sign(
        payload,
        tokenSecret, // Token Secret that we sign it with
        {
            expiresInMinutes : 180 // Token Expire time
        }
    );
};

// Verifies token on a request
module.exports.verify = function(event, callback) {
    var deferred = q.defer();
    var token;

    if (event.headers && event.headers.Authorization) {
        var parts = event.headers.Authorization.split(' ');
        if (parts.length == 2) {
            var scheme = parts[0],
                credentials = parts[1];

            if (/^Bearer$/i.test(scheme)) {
                token = credentials;
            }
        } else {
            deferred.reject(new HttpError('Format is Authorization: Bearer [token]', 401));
        }
    } else if (event.param('token')) {
        token = event.param('token');
    }

    if(!token){
        deferred.reject(new HttpError( 'No Authorization header was found', 401));
    }
    else{
        jwt.verify(
            token, // The token to be verified
            tokenSecret, // Same token we used to sign
            {}, // No Option, for more see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
            function(err, decrypted_token){
                if (err) {
                    deferred.reject(new HttpError('Invalid Token!', 401));
                }
                console.log('Verified JWT, ', decrypted_token);
                deferred.resolve(decrypted_token) // This is the decrypted token or the payload you provided
            }
        );
    }
    
    return deferred.promise
};