'use strict';
require('dotenv').config();
var q = require('q'),
    HttpError = require('./common/HttpError'),
    DBService = require('./services/DBService'),
    AuthService = require('./services/AuthService'),
    JWTokenService = require('./services/JWTokenService'),
    SecurityService = require('./services/SecurityService'),
    Helpers = require('./common/helpers'),
    kloudless = require('kloudless')(process.env.KLOUDLESS_API_KEY);

module.exports = {
    register: function(event, context, cb){

        //this function should check if an existing user with registered email already exists.
        return DBService.get()
            .then(function(db_client) {
                var user_query = db_client.first()
                    .from('users')
                    .where('email', event.body.email)

                return user_query
                    .then(function(user){
                        if(user){
                            console.log('user already exists, cant re-register');
                            throw 'User already exists'
                        }
                        else{
                            return AuthService.createEmailUser(db_client, event.body.name, event.body.email, event.body.password)
                        }
                    })
            })

            .then(function(user){
                console.log("NEWLY CREATED USER:",user);
                return {
                    token: JWTokenService.issue({uid: user[0].uid })
                }
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()

    },
    login: function(event, context, cb) {
        //this function should check if an existing user with registered email already exists.
        return DBService.get()
            .then(function(db_client) {
                var user_query = db_client.first()
                    .from('users')
                    .where('email', event.body.email)

                return user_query
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
            })
            .then(function(user){
                return {
                    token: JWTokenService.issue({uid: user.uid })
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
}