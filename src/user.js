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
  stripe = require('stripe')(nconf.get('STRIPE_SECRET_KEY')),
  webPush = require('web-push'),
  GlobalHandler = require('./common/global_handler');

webPush.setVapidDetails(
  'mailto:hello@quietthyme.com',
  nconf.get('PUSH_NOTIFY_PUBLIC_KEY'),
  nconf.get('PUSH_NOTIFY_PRIVATE_KEY')
);

var UserEndpoint = module.exports;

UserEndpoint.router = GlobalHandler.wrap(function(event, context, cb) {
  debug('UserEndpoint router event: %o', event);
  if (event.pathParameters.action == 'plan' && event.httpMethod == 'POST') {
    UserEndpoint.plan(event, context, cb);
  } else if (event.pathParameters.action == 'update' && event.httpMethod == 'POST') {
    UserEndpoint.update(event, context, cb);
  } else if (event.pathParameters.action == 'catalog' && event.httpMethod == 'POST') {
    UserEndpoint.catalogRegen(event, context, cb);
  } else if (event.pathParameters.action == 'password' && event.httpMethod == 'POST') {
    UserEndpoint.password(event, context, cb);
  } else if (
    event.pathParameters.action == 'pushnotify/subscribe' &&
    event.httpMethod == 'POST'
  ) {
    UserEndpoint.pushNotifySubscribe(event, context, cb);
  } else if (event.pathParameters.action == 'pushnotify/test' && event.httpMethod == 'POST') {
    UserEndpoint.pushNotifyTest(event, context, cb);
  } else {
    Utilities.errorHandler(cb)(
      new Error(`Unknown API endpoint: ${event.pathParameters.action}`)
    );
  }
})

UserEndpoint.update = function(event, context, cb) {
  //This method will update the allowed fields on the User object, and store them in the database.
  JWTokenService.verify(event.token)
    .then(function(auth) {
      //can only be used to update teh following fields:  "name", "library_uuid", "catalog_token", all other fields ignored.
      return DBService.updateUser(auth.uid, event.body, true).then(function(
        user_data
      ) {
        //return the new token
        debug('Updated token: %o', user_data);
        return {
          token: JWTokenService.issueFromUser(user_data),
        };
      });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};

UserEndpoint.catalogRegen = function(event, context, cb) {
  q
    .all([
      JWTokenService.verify(event.token),
      SecurityService.generate_catalog_token(),
    ])
    .spread(function(auth, new_catalog_token) {
      //can only be used to update teh following fields:  "name", "library_uuid", "catalog_token", all other fields ignored.
      return DBService.updateUser(
        auth.uid,
        { catalog_token: new_catalog_token },
        true
      ).then(function(user_data) {
        //return the new token
        debug('Updated token: %o', user_data);
        return {
          token: JWTokenService.issueFromUser(user_data),
        };
      });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};

UserEndpoint.password = function(event, context, cb) {
  JWTokenService.verify(event.token)
    .then(function(auth) {
      return DBService.findUserById(auth.uid)
        .then(function(user) {
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
        .then(function() {
          //the old password matches, now lets update the user password.
          return SecurityService.hash_password(event.body.newPassword);
        })
        .then(function(hashed_password) {
          //can only be used to update teh following fields:  "name", "library_uuid", "catalog_token", all other fields ignored.
          return DBService.updateUser(
            auth.uid,
            { password_hash: hashed_password },
            true,
            ['password_hash']
          );
        });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};

UserEndpoint.plan = function(event, context, cb) {
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
                first_name: user_data.first_name,
                last_name: user_data.last_name,
                email: user_data.email,
              }),
            };
          });
      });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};

UserEndpoint.pushNotifySubscribe = function(event, context, cb) {
  //This method will download the
  JWTokenService.verify(event.token)
    .then(function(auth) {
      return DBService.updateUser(
        auth.uid,
        { push_notifications: event.body },
        true,
        ['push_notifications']
      ).then(function(user_data) {
        //return the new token
        debug('Updated user_data: %o', user_data);
        return {};
      });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};

UserEndpoint.pushNotifyTest = function(event, context, cb) {
  //This method will download the
  JWTokenService.verify(event.token)
    .then(function(auth) {
      return DBService.findUserById(auth.uid)
        .then(function(user) {
          const payload = JSON.stringify({
            title: 'Welcome',
            body: 'Thank you for enabling push notifications',
            icon: '/assets/favicon/favicon_144.png',
            data:{
              test: true
            }
          });

          return webPush.sendNotification(user.push_notifications, payload, {
            TTL: 3600, // 1sec * 60 * 60 = 1h
          });
        })
        .then(function() {
          return {};
        });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};
