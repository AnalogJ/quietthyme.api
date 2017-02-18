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

                return db_client('credentials')
                    .insert({
                        "user_id": auth.uid,
                        "service_type": event.body.account.service,
                        "service_id": event.body.account.id,
                        "email": event.body.account.account,
                        "oauth": event.body

                    },['id', 'service_type'])
                    .then(function(new_cred){
                        //now we have to create notification webhooks, the QuietThyme folder & subfolders and README.md document
                        var root_folder_promise = null;
                        if(event.body.account.service == 'dropbox'){
                            //dropbox app is sandboxed.
                            root_folder_promise = q({id: 'root'})
                        }
                        else{
                            root_folder_promise = KloudlessService.folderCreate(event.body.account.id,'QuietThyme','root')
                        }
                        return root_folder_promise
                            .then(function(root_folder){
                                return[
                                    q(root_folder),
                                    KloudlessService.folderCreate(event.body.account.id,'library',root_folder.id),
                                    KloudlessService.folderCreate(event.body.account.id,'blackhole',root_folder.id)
                                ]
                            })
                            .spread(function(root_folder, library_folder, blackhole_folder){
                                console.log(root_folder, library_folder, blackhole_folder)

                                return db_client('credentials')
                                    .where('id', '=', new_cred[0].id)
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
        StorageService.get_user_storage(event.token)
            .then(function(credentials){

                console.log("FOUND CREDENTIALS", credentials)
                return credentials.map(function(credential_storage_info){
                    return {
                        'device_name': credential_storage_info.credential.service_type,
                        'prefix': credential_storage_info.credential.service_type +'://',
                        'storage_type': credential_storage_info.credential.service_type,
                        'storage_id': credential_storage_info.credential.id,
                        'last_library_uuid': event.query.library_uuid,
                        'free_space': credential_storage_info.service_info.quota.total - credential_storage_info.service_info.quota.used,  //quota_info.total_bytes - quota_info.used_bytes,
                        'total_space': credential_storage_info.service_info.quota.total,
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
                            'storage_id': 0,
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
        // TODO: this function shoulc check if the book file already exists.
        // TODO: this function should handle quietthyme storage creds
        q.spread([JWTokenService.verify(event.token), DBService.get()],
            function(auth, db_client){
                return q.spread([
                    db_client.first()
                    .from('credentials')
                    .where({
                        user_id: auth.uid,
                        id: event.body.storage_id
                    }),
                    db_client.first()
                        .from('books')
                        .where({
                            user_id: auth.uid,
                            id: event.body.book_id
                        }),
                ], function(credential, book){
                    var key = StorageService.create_upload_identifier(auth.uid, credential.id, book.id, event.body.storage_filename, event.body.storage_format);

                    var book_data = {
                        'credential_id': credential.id, //this will be the correct 'eventual' storage location, after processing
                        'storage_type': 'quietthyme',
                        'storage_identifier': process.env.QUIETTHYME_UPLOAD_BUCKET + '/' + encodeURI(key), //this is the temporary file path in s3, it will almost immediately be stored in s3.
                        'storage_size': event.body.storage_size,
                        'storage_filename': event.body.storage_filename,
                        'storage_format': event.body.storage_format
                    }

                    return db_client('books')
                        .where('id', '=', book.id)
                        .update(book_data)
                        .then(function(){
                            var params = {Bucket: process.env.QUIETTHYME_UPLOAD_BUCKET, Key: key, Expires: 60};
                            console.log("PARAMS", params)
                            var payload = {
                                book_data: book_data,
                                upload_url: s3.getSignedUrl('putObject', params)
                            }
                            console.log(payload)
                            return payload
                        })
                })
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()

    },

    prepare_cover: function (event, context, cb) {
        // this function will create the Author folder for this book, in storage_type specfied
        // TODO: this function should handle quietthyme storage creds
        q.spread([JWTokenService.verify(event.token), DBService.get()],
            function(auth, db_client){
                return db_client.first()
                    .from('books')
                    .where({
                        user_id: auth.uid,
                        id: event.body.book_id
                    })
                    .then(function(book){
                        var key = StorageService.create_content_identifier('image', auth.uid, event.body.filename, event.body.format);

                        var book_data = {
                            'cover': process.env.QUIETTHYME_CONTENT_BUCKET + '/' + encodeURI(key)
                        }

                        return db_client('books')
                            .where('id', '=', book.id)
                            .update(book_data)
                            .then(function(){
                                var params = {Bucket: process.env.QUIETTHYME_CONTENT_BUCKET, Key: key, Expires: 60};
                                console.log("PARAMS", params)
                                var payload = {book_data: book_data, upload_url: s3.getSignedUrl('putObject', params)}
                                console.log(payload)
                                return payload
                            })
                    })
            })

            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },

    download: function(event, context, cb){

        q.spread([JWTokenService.verify(event.token), DBService.get()],
            function(auth, db_client){
                return db_client.first()
                    .from('books')
                    .where({
                        user_id: auth.uid,
                        id: event.path.id
                    })
                    .then(function(book){
                        var payload = {
                            headers: {
                                "Location": null
                            }
                        };
                        //check if the book storage_type is populated, if not, then we need to return
                        if(!book.storage_type || !book.storage_identifier){
                            return q.reject(new Error('Could not find storage'))
                        }
                        else if(book.storage_type == 'quietthyme'){
                            //book is stored in S3, lets get it from there.
                            //storage_identifier for s3 is bucket/key

                            payload.headers.Location = "https://s3.amazonaws.com/" + encodeURI(book.storage_identifier)
                            console.log(payload)
                            return payload
                        }
                        else{
                            //TODO: handle storage download requests from other services.
                            //throw new Error("Storage service download not supported yet.")


                            //find the credential for this book
                            return db_client.first()
                                    .from('credentials')
                                    .where({
                                        user_id: auth.uid,
                                        id: book.credential_id
                                    })
                                .then(function(credential){
                                    return KloudlessService.linkCreate(credential.service_id, book.storage_identifier)
                                })
                                .then(function(data){

                                    console.log("REDIRECT LINK", data)
                                    payload.headers.Location = data.url
                                    return payload

                                })

                        }
                    })
            })

            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()

    },

    //must handle 2 types of events:
    // - books uploaded via webui to bucketname/USERHASH/user_id/cred_id/NEW/filename
    // - books uploaded via calibre to bucketname/USERHASH/user_id/cred_id/book_id/filename

    // if its a new book, we need to process it, if its a calibre book we just need to move it to correct location
    process_book: function (event, context, cb) {
        var upload_key = event.Records[0].s3.object.key
        var upload_bucket = event.Records[0].s3.bucket.name

        var upload_key_parts = upload_key.split('/');
        //ignore the userhash.
        var user_id = upload_key_parts[1];
        var cred_id = upload_key_parts[2];
        var book_id = upload_key_parts[3];
        var dirty_filename = upload_key_parts[4];


        //check if the book is a new book a book
        var is_new_book = (book_id == 'NEW');

        //check if the book lives on quietthyme storage
        var is_quietthyme_storage = (cred_id == '0');


        if(is_new_book){
            return cb(new Error("Not Implemented. New books cannot be processed yet."), null)
        }

        if(is_quietthyme_storage){
            return cb(new Error("Not Implemented. New quietthyme storage cannot be processed yet."), null)
        }

        DBService.get()
            .then(function(db_client){
                return [db_client.first()
                    .from('books')
                    .where({
                        user_id: user_id,
                        id: book_id,
                        credential_id: cred_id
                    }),
                    db_client.first()
                        .from('credentials')
                        .where({
                            user_id: user_id,
                            id: cred_id
                        }),
                    db_client
                    ]
            })
            .spread(function(book, credential, db_client){
                // //now we have book information and credential info, lets generate the new book filename.
                // var clean_filename = book.authors[0]
                // if(book.series){
                //     clean_filename += ' - ' + book.series
                // }
                // if(book.series_number){
                //     clean_filename += ' - ' + book.series_number
                // }
                // clean_filename += ' - ' + book.title


                //(bearer_token, account_id, filename, parent_id, storage_identifier){
                return KloudlessService.fileUpload(
                        credential.oauth.access_token,
                        credential.service_id,
                        book.storage_filename + book.storage_format,
                        credential.library_folder_id,
                        book.storage_identifier
                    )
                    .then(function(kloudless_upload_resp){
                        return db_client('books')
                            .where('id', '=', book.id)
                            .update({
                                'storage_type':credential.service_type,
                                'storage_identifier': kloudless_upload_resp['id']
                            })
                    })
                //TODO mark the file as can be deleted.
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()

    }
};