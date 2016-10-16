var q = require('q'),
    HttpError = require('../errors/HttpError'),
    DBService = require('../services/DBService'),
    AuthService = require('../services/AuthService'),
    JWTokenService = require('../services/JWTokenService')

module.exports = {
    register: function(event, context, cb){
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    },
    login: function(event, context, cb) {
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    },

    //to authenticate to QuietThyme all you need is a calibre library id.
    calibre: function(event, context, cb){
        console.log('calibre auth ');
        // if no library_uuid is present, throw an error.
        if(!event.query.library_uuid) {
            console.debug('No calibre library_uuid present', event.query.library_uuid)
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
                        token: JWTokenService.issue({id: user.id })
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

    status: function (event, context, cb) {
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    }
}