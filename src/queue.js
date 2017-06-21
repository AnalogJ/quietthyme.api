'use strict';
const debug = require('debug')('quietthyme:queue');

var StorageService = require('./services/storage_service');
var DBService = require('./services/db_service');
var KloudlessService = require('./services/kloudless_service');
var PipelineMetadataService = require('./services/pipeline_metadata_service');
var PipelineImageService = require('./services/pipeline_image_service');
var PipelineService = require('./services/pipeline_service');
var Helpers = require('./common/helpers');
var q = require('q');
var path = require('path');
var exec = require('child_process').exec;
var fs = require("fs");

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
            return cb(new Error("Not Implemented. New books cannot be processed yet."), null);
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
                    DBService.findCredentialById(cred_id, user_id)
                ]
            })
            .spread(function(book, credential){
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
                                'storage_type': credential.service_type,
                                'storage_identifier': kloudless_upload_resp['id']
                            })
                    });
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
        return StorageService.download_book_tmp(event.filename, event.credential_id, event.storage_identifier)
            .spread(function(book_path, credential){
                //We've downloaded the book, lets get metadata from it, then process it

                var tmp_folder = path.dirname(book_path);
                var book_ext = path.extname(book_path);
                var book_filename = path.basename(book_path, book_ext);

                var opf_path = tmp_folder + '/'+ book_filename + '.opf';
                var cover_path = tmp_folder + '/'+ book_filename + '.jpeg';

                debug("Begin processing book: %s", book_path);

                var deferred = q.defer();
                //var parentDir = path.resolve(process.cwd(), '../opt/calibre-2.80.0/');
                exec(`opt/calibre-2.80.0/ebook-meta "${book_path}" --to-opf="${opf_path}" --get-cover="${cover_path}"`, {}, function(err, stdout, stderr) {
                    if (err) return deferred.reject(err);
                    if(stdout) debug("calibre metadata extract stdout: %s", stdout);
                    if(stderr) console.error(`calibre metadata extract stderr: ${stderr}`);
                    return deferred.resolve({
                        opf_path: opf_path,
                        cover_path: cover_path,
                        book_filename: book_filename
                    })
                });
                return deferred.promise
                    .then(function(paths){

                        //parse opf file and create a book
                        return PipelineMetadataService.generate_embedded_opf_data_set(paths.opf_path)
                            .then(function(embedded_opf){
                                var primary_criteria = {
                                    //required criteria
                                    user_id: credential.user_id,

                                    //optional criteria
                                    credential_id: credential.id,
                                    storage_type: credential.service_type,
                                    storage_identifier: event.storage_identifier,
                                    storage_filename: path.basename(event.filename, path.extname(event.filename)),
                                    storage_format: path.extname(event.filename),
                                    storage_size: fs.statSync(book_path).size
                                };
                                var metadata_pipeline = [embedded_opf];
                                var image_pipeline = [PipelineImageService.generate_file_data_set('embedded', paths.cover_path)];
                                return PipelineService.create_with_pipeline(primary_criteria,
                                    metadata_pipeline,
                                    image_pipeline)
                            })
                    })
                    .then(function(inserted_books){

                        //at this point the book data is stored in the Database, and the cover art has been uploaded to S3 already.
                        // we just need to move the book to permanent storage.

                        debug("Inserted Book: %o", inserted_books);
                        return q.allSettled([inserted_books[0], StorageService.move_to_perm_storage(credential, inserted_books[0])])
                    })


            })
            .spread(function(book_data_promise, book_storage_promise){
                var book_data = book_data_promise.value;
                var book_storage_identifier = book_storage_promise.value;


                console.info("Book storage identifier:", book_storage_identifier);

                //update book with new storage information and cover info.
                var update_data = {
                    storage_identifier: book_storage_identifier.id,
                    storage_filename: path.basename(book_storage_identifier.name, book_data.storage_format)
                };

                return db_client('books')
                    .where('id', '=', book_data.id)
                    .update(update_data)
            })
            .then(function(){
                return {}
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    }
};

