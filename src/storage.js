require('dotenv').config();
var StorageService = require('./services/StorageService');
var DBService = require('./services/DBService');
var JWTokenService = require('./services/JWTokenService');
var q = require('q');

module.exports = {

    //this function will store credentials created by kloudless on the front-end.
    link: function(event, context, cb) {
        // // TODO: VALIDATE the token before saving. https://developers.kloudless.com/docs/v1/authentication

        q.spread([JWTokenService.verify(event.token), DBService.get()],
            function(auth, db_client){

                console.log("AUTH DATA", auth)
                return db_client('credentials')
                    .insert({
                        "user_id": auth.uid,
                        "service_type": event.body.account.service,
                        "service_id": event.body.account.id,
                        "email": event.body.account.account,
                        "oauth": event.body

                    })
            })
            .then(function(user){
                console.log(">>>>> DESTROYING DB")
                DBService.destroy().then(function(){
                    return cb(null, {
                        service_type: event.body.account.service
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
        console.log("STATUS============================QUERY")
        console.log(event.query)
        console.log("STATUS============================PARAMS")
        console.log(event.path)
        console.log("STATUS============================HEADERS")
        console.log(event.headers)
        //res.setHeader('Cache-Control', 'public, max-age=31557600');
        var user_calibre_id_promise = q({})
        //TODO: this code was commented out because the library_uuid can be None. so we need to write code to handle this later.
        //if(req.user.calibre_id && req.user.calibre_id != req.query.library_uuid){
        //    sails.log.debug('The calibre library_uuid is does not match the user calibre_id', req.user.calibre_id, req.query.library_uuid)
        //    return res.json({
        //        'success': false,
        //        'error_msg': 'This Calibre libary is a already associated with a different QuietThyme account. If you would like to remove this lock, configure this plugin in Calibre'
        //    })
        //}
        //else if(!req.user.calibre_id){
        //    //the calibre_id has not been set,
        //    sails.log.debug('Setting the calibre_id', req.query.library_uuid)
        //    user_calibre_id_promise = User.update(req.user.id, {calibre_id:req.query.library_uuid})
        //}

        StorageService.get_storage_quotas(event.token, function(cred, quota_info){
            return {
                'device_name': cred.service_type,
                'prefix': cred.service_type +'://',
                'storage_type': cred.service_type,
                'last_library_uuid': event.query.library_uuid,
                'free_space': 0, //quota_info.total_bytes - quota_info.used_bytes,
                'total_space': 1000000, //quota_info.total_bytes,
                'calibre_version': '2.6.0'
            }

        })
            .then(function(credential_quotas){
                console.log("USER AND CREDENTIALS", credential_quotas)
                //calculate the amount of space free.

                var status_obj = {
                    'settings': {
                        'main': {
                            'device_store_uuid': '113a769a-cade-11e4-8731-1681e6b88ec1',
                            'device_name': 'QuietThyme '+ process.env.NODE_ENV,
                            'prefix': 'quietthyme://',
                            'storage_type': 'quietthyme',
                            'location_code': 'main',
                            'last_library_uuid': event.query.library_uuid,
                            'free_space': 0,
                            'total_space': 1000000,
                            'calibre_version': '2.6.0',
                            'date_last_connected': '2014-12-18T16:24:59.541905+00:00'
                        }
                        //'B': None, not stored
                    }
                };
                var location_codes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                for(var ndx in credential_quotas){
                    //
                    var location_code = location_codes[ndx]
                    var location_settings = credential_quotas[ndx];
                    location_settings['location_code'] = location_code;
                    location_settings['date_last_connected'] = '2014-12-18T16:24:59.541905+00:00'
                    status_obj.settings[location_code] = location_settings;
                }
                /*
                 'A': {
                 'device_store_uuid': '113a70d2-cade-11f4-8731-1681e6b88ec1',
                 'device_name': 'Dropbox',
                 'prefix': 'dropbox://',
                 'storage_type': 'dropbox',
                 'location_code': 'A',
                 'last_library_uuid': req.query.library_uuid,
                 'free_space': 100,
                 'total_space': 10000,
                 'calibre_version': '2.6.0',
                 'date_last_connected': '2014-12-18T16:24:59.541905+00:00'
                 }
                 * */
                console.log("RESPONSE STATUS", status_obj)
                return status_obj
            })
            .then(function(status_obj){
                console.log(">>>>> DESTROYING DB", status_obj)
                DBService.destroy().then(function(){
                    return cb(null, status_obj)
                })
            })
            .fail(function(err){
                console.log(">>>> FINISHED DB TRANSACTION WITH ERROR")
                console.log(err.toString())
                cb(null, err.toString())
            })
            .done()
    },
    upload: function (event, context, cb) {
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    },
    thumb_upload: function (event, context, cb) {
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    }
}