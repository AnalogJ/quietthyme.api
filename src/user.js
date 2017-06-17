'use strict';
const debug = require('debug')('quietthyme:auth');

var q = require('q'),
    HttpError = require('./common/http_error'),
    DBService = require('./services/db_service'),
    AuthService = require('./services/auth_service'),
    JWTokenService = require('./services/jwt_token_service'),
    SecurityService = require('./services/security_service'),
    Helpers = require('./common/helpers'),
    nconf = require('./common/nconf'),
    stripe = require('stripe')(nconf.get('STRIPE_SECRET_KEY'));

module.exports = {
    plan: function(event, context, cb){

        //This method will download the
        q.spread([JWTokenService.verify(event.token), DBService.get()],
            function(auth, db_client){

                //find the user to determine if they have a stripe customer id already
                return db_client.first()
                    .from('users')
                    .where('uid', auth.uid)
                    .then(function(user_data){
                        //we have a valid user/auth data.
                        var promise = null;

                        if(user_data.stripe_sub_id){
                            //already have a subscription id, lets update their plan
                            promise = stripe.subscriptions.update(user_data.stripe_sub_id, {
                                plan: event.body.planId
                            })
                        }
                        else {
                            //lets create a stripe customer and associate the token with it.
                            promise = stripe.customers.create({
                                email: user_data.email,
                                source: event.body.token.id,
                                metadata: {
                                    user_id: user_data.uid
                                }
                            })
                                .then(function(customer){

                                    return stripe.subscriptions.create({
                                            customer: customer.id,
                                            plan: event.body.planId
                                        })
                                })
                        }


                        return promise
                            .then(function(subscription){
                                return db_client('users')
                                    .where({uid:user_data.uid})
                                    .update({
                                        plan: event.body.planId.split('_')[0],
                                        stripe_sub_id: subscription.id
                                    })
                            })
                            .then(function(){
                                //return the new token
                                debug("Updated token: %o", user_data);
                                return {
                                    token: JWTokenService.issue({
                                        uid: user_data.uid,
                                        plan: event.body.planId.split('_')[0],
                                        catalog_token: user_data.catalog_token,
                                        name: user_data.name,
                                        email: user_data.email
                                    })
                                }
                            })
                    })
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    }
}