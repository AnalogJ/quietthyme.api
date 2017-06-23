'use strict';
const debug = require('debug')('quietthyme:auth');

var q = require('q'),
    nconf = require('./common/nconf'),
    HttpError = require('./common/http_error'),
    DBService = require('./services/db_service'),
    AuthService = require('./services/auth_service'),
    JWTokenService = require('./services/jwt_token_service'),
    SecurityService = require('./services/security_service'),
    Helpers = require('./common/helpers'),
    kloudless = require('kloudless')(nconf.get('KLOUDLESS_API_KEY'));

module.exports = {
    register: function(event, context, cb){

        //this function should check if an existing user with registered email already exists.
        return DBService.findUserByEmail(event.body.email)
            .then(function(user){
                if(user){
                    console.error('User already exists, cant re-register');
                    throw 'User already exists'
                }
                else{
                    return AuthService.createEmailUser(event.body.name, event.body.email, event.body.password)
                }
            })

            .then(function(user){
                debug("Newly created user: %o", user);
                return {
                    token: JWTokenService.issue({
                        uid: user.uid,
                        plan: user.plan,
                        catalog_token: user.catalog_token,
                        name: user.name,
                        email: user.email
                    })
                }
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()

    },
    login: function(event, context, cb) {
        //this function should check if an existing user with registered email already exists.
        return DBService.findUserByEmail(event.body.email)
            .then(function(user){
                if(user){
                    return SecurityService.compare_password(event.body.password, user.password_hash)
                        .then(function(matched){
                            if(matched){
                                return user
                            }
                            else{
                                throw new Error("Email or Password is incorrect")
                            }
                        })
                }
                else{
                    throw new Error("Email or Password is incorrect")
                }
            })
            .then(function(user){
                return {
                    token: JWTokenService.issue({
                        uid: user.uid,
                        plan: user.plan,
                        catalog_token: user.catalog_token,
                        name: user.name,
                        email: user.email
                    })
                }
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },
    //this function should check the status of a JWT Token for validity
    status: function (event, context, cb) {
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    }
};