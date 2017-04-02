'use strict';
const debug = require('debug')('quietthyme:auth');

var q = require('q'),
    HttpError = require('./common/HttpError'),
    DBService = require('./services/DBService'),
    AuthService = require('./services/AuthService'),
    JWTokenService = require('./services/JWTokenService'),
    SecurityService = require('./services/SecurityService'),
    Helpers = require('./common/helpers'),
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

                        if(user_data.stripe_sub_id){
                            //already have a subscription id, lets update their plan
                            return stripe.subscriptions.update(user_data.stripe_sub_id, {
                                plan: event.body.planId
                            })
                        }
                        else {
                            //lets create a stripe customer and associate the token with it.
                            return stripe.customers.create({
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
                                .then(function(subscription){
                                    return db_client('users')
                                        .where({uid:user_data.uid})
                                        .update({stripe_sub_id: subscription.id})
                                })
                        }
                    })
            })
            .then(function(){
                //TODO: this should send back a new token with updated plan.
                return {}
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    }
}