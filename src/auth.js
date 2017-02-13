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
                    token: JWTokenService.issue({uid: user.uid })
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

    //to authenticate to QuietThyme all you need is a calibre library id.
    calibre: function(event, context, cb){
        console.log('calibre auth ');
        // if no library_uuid is present, throw an error.
        if(!event.query.library_uuid) {
            console.log('No calibre library_uuid present', event.query.library_uuid)
            return new HttpError('No calibre library_uuid present', 500)
        }


        return DBService.get()
            .then(function(db_client) {
                var user_query = db_client.first()
                    .from('users')
                    .where('library_uuid', event.query.library_uuid)

                return user_query
                    .then(function(user){
                        if(user){
                            console.log('found user');
                            return user;
                        }
                        else{

                            return AuthService.createCalibreUser(db_client, event)
                        }
                    })
            })

            .then(function(user){
                console.log(">>>>> DESTROYING DB")
                DBService.destroy().then(function(){
                    console.dir(user)

                    return cb(null, {
                        user: user,
                        token: JWTokenService.issue({uid: user.uid })
                    })

                })


            })
            .fail(function(err){
                console.log(">>>> FINISHED DB TRANSACTION WITH ERROR")
                console.log('failed to login via calibre library')
                console.log(err.toString())
                cb(null, err.toString())
            })
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