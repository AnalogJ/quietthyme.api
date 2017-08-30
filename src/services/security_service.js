'use strict';
const debug = require('debug')('quietthyme:SecurityService');
var xkcdPassword = require('xkcd-password');
var q = require('q');
var bcrypt = require('bcryptjs');

// These methods are related to verifying users and hashing passwords.
module.exports.hash_password = function(password) {
  if (!password) {
    return q.reject('Password cannot be empty');
  }

  var deferred = q.defer();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return deferred.reject(err);

    bcrypt.hash(password, salt, function(err, hash) {
      if (err) return deferred.reject(err);
      return deferred.resolve(hash);
    });
  });

  return deferred.promise;
};

module.exports.compare_password = function(attempted_password, existing_hash) {
  var deferred = q.defer();

  bcrypt.compare(attempted_password, existing_hash, function(
    err,
    isPasswordMatch
  ) {
    if (err) return deferred.reject(err);
    return deferred.resolve(isPasswordMatch);
  });

  return deferred.promise;
};

module.exports.generate_catalog_token = function() {
  var pw = new xkcdPassword();
  var options = {
    numWords: 4,
    minLength: 5,
    maxLength: 8,
  };
  var deferred = q.defer();
  pw.generate(options, function(err, result) {
    if (err) {
      return deferred.reject(err);
    }
    return deferred.resolve(result.join('-'));
  });
  return deferred.promise;
};
