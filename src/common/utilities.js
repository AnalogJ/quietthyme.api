'use strict';
const debug = require('debug')('quietthyme:utilities');
const nconf = require('./nconf');
var _ = require('lodash');
module.exports = {
  ISODateString: function(d) {
    if (!d) {
      return '';
    }
    if (typeof d == 'string') {
      d = new Date(d);
    }
    function pad(n) {
      return n < 10 ? '0' + n : n;
    }
    return (
      d.getUTCFullYear() +
      '-' +
      pad(d.getUTCMonth() + 1) +
      '-' +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      ':' +
      pad(d.getUTCMinutes()) +
      ':' +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  },

  stripEmpty: function(object) {
    return _.omitBy(object, function(i) {
      return i === null || i === '';
    });
  },

  successHandler: function(cb) {
    var _cb = cb;
    return function(resp_data) {
      debug('Returning Successful data: %o', resp_data);
      return _cb(null, resp_data);
    };
  },

  /*
    * Error handler can be used as follows:
    * var Helpers = require('../helpers');
    * Helpers.errorHandler(cb)(err)
    * or
    * Promise.fail(Helpers.errorHandler(cb))
    *
    * */
  errorHandler: function(cb) {
    var _cb = cb;
    return function(err) {
      if (typeof err === 'string') {
        //this is a string error message, wrap it in an error obj
        err = new Error(err);
      } else if (err.code == 'ValidationException') {
        // this is a DynamoDB error.
        var newErr = new Error(
          'An error occurred while communicating with the Database.'
        );
        newErr.code = err.statusCode;
        newErr.stack = err.stack;

        err = newErr;
      } else if (!err instanceof Error) {
        //this is an object or something other than an error obj
        //do nothing for now.
      }
      try {
        if (!err.status && !err.code) {
          err.code = 400;
        }

        //prepend the error code infront of the message, so that it will be caught by the
        //serverless/lambda regex for errors

        err.message = `[${err.code}] ${err.message}`;
      } catch (e) {
        //you cant set the .message/.code on some Error types (like AssertionError)
        err = new Error(`[400] ${err.message}`);
        err.code = 400;
      }

      var whitelisted_props = Object.getOwnPropertyNames(err);
      if (nconf.get('STAGE') != 'beta') {
        whitelisted_props = ['message', 'status'];
      }

      //added cleanup method for database, so that we dont timeout in Lambda
      debug('Returning Failure data: %o', err);
      return _cb(JSON.stringify(err, whitelisted_props), null);
    };
  },
};
