'use strict';
const debug = require('debug')('quietthyme:auth');

var q = require('q'),
  nconf = require('./common/nconf'),
  HttpError = require('./common/http_error'),
  DBService = require('./services/db_service'),
  AuthService = require('./services/auth_service'),
  MailchimpService = require('./services/mailchimp_service'),
  JWTokenService = require('./services/jwt_token_service'),
  SecurityService = require('./services/security_service'),
  Utilities = require('./common/utilities'),
  kloudless = require('kloudless')(nconf.get('KLOUDLESS_API_KEY'));

var AuthEndpoint = module.exports;

AuthEndpoint.router = function(event, context, cb) {
  debug('AuthEndpoint router event: %o', event);
  if (event.pathParameters.action == 'login' && event.httpMethod == 'POST') {
    AuthEndpoint.login(event, context, cb);
  } else if (event.pathParameters.action == 'register' && event.httpMethod == 'POST') {
    AuthEndpoint.register(event, context, cb);
  } else if (event.pathParameters.action == 'status' && event.httpMethod == 'GET') {
    AuthEndpoint.status(event, context, cb);
  } else {
    Utilities.errorHandler(cb, context)(
      new Error(`Unknown API endpoint: ${event.pathParameters.action}`)
    );
  }
};

AuthEndpoint.register = function(event, context, cb) {
  //this function should check if an existing user with registered email already exists.
  return DBService.findUserByEmail(event.body.email)
    .then(function(user) {
      if (user) {
        debug('User already exists, cant re-register');
        throw 'User already exists';
      } else {
        return AuthService.createEmailUser(
          event.body.first_name,
          event.body.last_name,
          event.body.email,
          event.body.password
        );
      }
    })
    .then(function(user) {
      debug('Newly created user: %o', user);

      return MailchimpService.subscribeUser(
        user.email,
        user.first_name,
        user.last_name,
        user.uid
      ).then(function() {
        return {
          token: JWTokenService.issueFromUser(user),
        };
      });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb, context))
    .done();
};
AuthEndpoint.login = function(event, context, cb) {
  //this function should check if an existing user with registered email already exists.
  return DBService.findUserByEmail(event.body.email)
    .then(function(user) {
      if (user) {
        return SecurityService.compare_password(
          event.body.password,
          user.password_hash
        ).then(function(matched) {
          if (matched) {
            return user;
          } else {
            throw new Error('Email or Password is incorrect');
          }
        });
      } else {
        throw new Error('Email or Password is incorrect');
      }
    })
    .then(function(user) {
      return {
        token: JWTokenService.issueFromUser(user),
      };
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb, context))
    .done();
};
//this function should check the status of a JWT Token for validity
AuthEndpoint.status = function(event, context, cb) {
  JWTokenService.verify(event.token)
    .then(function(auth_data) {
      return { valid: true };
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb, context))
    .done();
};
