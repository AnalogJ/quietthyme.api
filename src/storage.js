require('dotenv').config();
var StorageService = require('./services/StorageService');
var DBService = require('./services/DBService');
var JWTokenService = require('./services/JWTokenService');
var KloudlessService = require('./services/KloudlessService');
var Helpers = require('./common/helpers')
var q = require('q');


var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'})

module.exports = {

    //this function will store credentials created by kloudless on the front-end.
    link: function(event, context, cb) {
        // // TODO: VALIDATE the token before saving. https://developers.kloudless.com/docs/v1/authentication

        q.spread([JWTokenService.verify(event.token), DBService.get()],
            function(auth, db_client){

                console.log("AUTH DATA", auth)
                return db_client('credentials')
                    .returning(['id', 'service_id','service_type'])
                    .insert({
                        "user_id": auth.uid,
                        "service_type": event.body.account.service,
                        "service_id": event.body.account.id,
                        "email": event.body.account.account,
                        "oauth": event.body

                    })
                    .then(function(new_cred){
                        //now we have to create the required QuietThyme folders.

                        return KloudlessService.folderCreate(new_cred.service_id,'QuietThyme','root')
                            .then(function(root_folder){
                                console.log("ROOT FOLDER", root_folder)
                                return[
                                    q(root_folder),
                                    KloudlessService.folderCreate(new_cred.service_id,'library',root_folder.id),
                                    KloudlessService.folderCreate(new_cred.service_id,'blackhole',root_folder.id)
                                ]
                            })
                            .spread(function(root_folder, library_folder, blackhole_folder){
                                console.log(root_folder, library_folder, blackhole_folder)

                                return db_client('credentials')
                                    .where('id', '=', new_cred.id)
                                    .update({
                                        'root_folder_id': root_folder.id, //this is the service specific "QuietThyme" folder that all sub folders are created in.
                                        'library_folder_id': library_folder.id, //this is "library" folder that all author folders are created in.
                                        'blackhole_folder_id': blackhole_folder.id
                                    })
                            })

                    })
            })
            .then(function(user){
                return {
                    service_type: event.body.account.service
                }
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
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

        //TODO: due to issues with kloudless library, we're not actually getting quota info yet.
        StorageService.get_storage_quotas(event.token)
            .then(function(credentials){
                return credentials.map(function(cred){
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
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },

    prepare_book: function (event, context, cb) {
        // this function will create the Author folder for this book, in storage_type specfied

        var params = {Bucket: process.env.QUIETTHYME_UPLOAD_BUCKET, Key: 'key', Expires: 60};
        var url = s3.getSignedUrl('getObject', params);
        console.log('The URL is', url); // expires in 60 seconds
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    },

    prepare_thumb: function (event, context, cb) {
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    },


    upload_book: function (event, context, cb) {
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    },
    upload_thumb: function (event, context, cb) {
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    }
}