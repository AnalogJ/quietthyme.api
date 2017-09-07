'use strict';
const debug = require('debug')('quietthyme:auth');

var q = require('q'),
  HttpError = require('./common/http_error'),
  DBService = require('./services/db_service'),
  AuthService = require('./services/auth_service'),
  JWTokenService = require('./services/jwt_token_service'),
  SecurityService = require('./services/security_service'),
  Utilities = require('./common/utilities'),
  nconf = require('./common/nconf'),
  stripe = require('stripe')(nconf.get('STRIPE_SECRET_KEY'));

var UserEndpoint = module.exports

UserEndpoint.router = function(event, context, cb){
  debug('UserEndpoint router event: %o', event)
  if(event.path.action == 'plan' && event.method == 'POST'){
    UserEndpoint.plan(event,context, cb)
  }
  else if(event.path.action == 'update' && event.method == 'POST'){
    UserEndpoint.update(event, context, cb)
  }
  else if(event.path.action == 'catalog' && event.method == 'POST'){
    UserEndpoint.catalogRegen(event, context, cb)
  }
  else if(event.path.action == 'password' && event.method == 'POST'){
    UserEndpoint.password(event, context, cb)
  }
  else{
    Utilities.errorHandler(cb)(new Error(`Unknown API endpoint: ${event.path.action}`))
  }
}

UserEndpoint.update = function (event, context, cb){
  //This method will update the allowed fields on the User object, and store them in the database.
  JWTokenService.verify(event.token)
    .then(function(auth) {

      //can only be used to update teh following fields:  "name", "library_uuid", "catalog_token", all other fields ignored.
      return DBService.updateUser(
        auth.uid,
        event.body,
        true
      )
      .then(function(user_data) {
        //return the new token
        debug('Updated token: %o', user_data);
        return {
          token: JWTokenService.issue({
            uid: user_data.uid,
            plan: user_data.plan,
            catalog_token: user_data.catalog_token,
            name: user_data.name,
            email: user_data.email,
          }),
        };
      });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
}


UserEndpoint.catalogRegen = function (event, context, cb){
  q.all([JWTokenService.verify(event.token), SecurityService.generate_catalog_token()])
    .spread(function(auth, new_catalog_token) {

      //can only be used to update teh following fields:  "name", "library_uuid", "catalog_token", all other fields ignored.
      return DBService.updateUser(
        auth.uid,
        {catalog_token: new_catalog_token},
        true
      )
        .then(function(user_data) {
          //return the new token
          debug('Updated token: %o', user_data);
          return {
            token: JWTokenService.issue({
              uid: user_data.uid,
              plan: user_data.plan,
              catalog_token: user_data.catalog_token,
              name: user_data.name,
              email: user_data.email,
            }),
          };
        });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
}

UserEndpoint.password = function (event, context, cb){
  JWTokenService.verify(event.token)
    .then(function(auth) {
      return DBService.findUserById(auth.uid)
        .then(function(user){
          //validate that the old password is correct
          return SecurityService.compare_password(
            event.body.oldPassword,
            user.password_hash
          ).then(function(matched) {
            if (matched) {
              return user;
            } else {
              throw new Error('Email or Password is incorrect');
            }
          });
        })
        .then(function(){
          //the old password matches, now lets update the user password.
          return SecurityService.hash_password(event.body.newPassword)
        })
        .then(function(hashed_password){
          //can only be used to update teh following fields:  "name", "library_uuid", "catalog_token", all other fields ignored.
          return DBService.updateUser(
            auth.uid,
            {password_hash: hashed_password},
            true
          )
        })
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
}

UserEndpoint.plan = function (event, context, cb) {
  //This method will download the
  JWTokenService.verify(event.token)
    .then(function(auth) {
      //find the user to determine if they have a stripe customer id already
      return DBService.findUserById(auth.uid).then(function(user_data) {
        //we have a valid user/auth data.
        var promise = null;

        if (user_data.stripe_sub_id) {
          //already have a subscription id, lets update their plan
          promise = stripe.subscriptions.update(user_data.stripe_sub_id, {
            plan: event.body.planId,
          });
        } else {
          //lets create a stripe customer and associate the token with it.
          promise = stripe.customers
            .create({
              email: user_data.email,
              source: event.body.token.id,
              metadata: {
                user_id: user_data.uid,
              },
            })
            .then(function(customer) {
              return stripe.subscriptions.create({
                customer: customer.id,
                plan: event.body.planId,
              });
            });
        }

        return promise
          .then(function(subscription) {
            return DBService.updateUserPlan(
              user_data.uid,
              event.body.planId.split('_')[0],
              subscription.id
            );
          })
          .then(function() {
            //return the new token
            debug('Updated token: %o', user_data);
            return {
              token: JWTokenService.issue({
                uid: user_data.uid,
                plan: event.body.planId.split('_')[0],
                catalog_token: user_data.catalog_token,
                name: user_data.name,
                email: user_data.email,
              }),
            };
          });
      });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
}

