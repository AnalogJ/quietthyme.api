'use strict';
require('dotenv').config();
var StorageService = require('./services/StorageService');
var DBService = require('./services/DBService');
var KloudlessService = require('./services/KloudlessService');
var ParseExternalService = require('./services/ParseExternalService');
var Helpers = require('./common/helpers')
var q = require('q');
var path = require('path')
var exec = require('child_process').exec;

module.exports = {

    //must handle 2 types of events:
    // - books uploaded via webui to bucketname/USERHASH/user_id/cred_id/NEW/filename
    // (DONE) - books uploaded via calibre to bucketname/USERHASH/user_id/cred_id/book_id/filename

    // if its a new book, we need to process it, if its a calibre book we just need to move it to correct location
    process_s3_uploaded_book: function (event, context, cb) {
        var upload_key = event.Records[0].s3.object.key;
        var upload_bucket = event.Records[0].s3.bucket.name;

        var upload_key_parts = upload_key.split('/');
        //ignore the userhash.h
        var user_id = upload_key_parts[1];
        var cred_id = upload_key_parts[2];
        var book_id = upload_key_parts[3];
        var dirty_filename = upload_key_parts[4];


        //check if the book is a new book
        var is_new_book = (book_id == 'NEW');

        //check if the book destination is quietthyme storage
        var is_quietthyme_storage = (cred_id == '0');


        if(is_new_book){
            return cb(new Error("Not Implemented. New books cannot be processed yet."), null)
            // newly uploaded books should only be
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
                    credential.library_folder.id,
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
    },


    // this function gets called in 2 cases.
    //
    // 1. a book is added to a blackhole folder.
    // 2. a book is NEW book (manually uploaded via the WebUI) and is stored in upload bucket. (triggered by storage.process_book method)
    //
    // Then the following steps will occur:
    // will determine the book's current location. (source_storage_type, source_storage_identifier)
    // will determine the book's destination location (dest_storage_type, dest_storage_identifier)
    //
    process_unknown_book: function(event, context, cb){
        console.log("JUST TESTING UNKONWN HOOK", event)

        DBService.get()
            .then(function(db_client){
                return StorageService.download_book_tmp(db_client, event.filename, event.credential_id, event.storage_identifier)

            })
            .spread(function(book_path, credential){
                console.log("WE've DOWNLOADED THE BOOK, elts get metadata from it, then process it");

                var tmp_folder = path.dirname(book_path);
                var book_ext = path.extname(book_path);
                var book_filename = path.basename(book_path, book_ext);

                var opf_path = tmp_folder + '/'+ book_filename + '.opf';
                var cover_path = tmp_folder + '/'+ book_filename + '.jpeg';


                var deferred = q.defer();
                //var parentDir = path.resolve(process.cwd(), '../opt/calibre-2.80.0/');
                exec(`opt/calibre-2.80.0/ebook-meta "${book_path}" --to-opf="${opf_path}" --get-cover="${cover_path}"`, {}, function(err, stdout, stderr) {
                    if (err) return deferred.reject(err);
                    console.log(`stdout: ${stdout}`);
                    console.log(`stderr: ${stderr}`);
                    return deferred.resolve({
                        opf_path: opf_path,
                        cover_path: cover_path,
                        book_filename: book_filename
                    })
                });
                return deferred.promise
                    .then(function(paths){

                        //parse opf file and create a book
                        //upload book
                        var image_key = StorageService.create_content_identifier('image', credential.user_id, paths.book_filename, '.jpeg')

                        return [
                            StorageService.upload_file(paths.cover_path, process.env.QUIETTHYME_CONTENT_BUCKET, image_key),
                            ParseExternalService.read_opf_file(paths.opf_path)
                        ]

                    })
            })
            .spread(function(cover_data, opf_data){
                console.log("COVERDATA", cover_data)
                console.log("OPF_DATA", opf_data)
            })

            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    }
}

