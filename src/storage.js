'use strict';
const debug = require('debug')('quietthyme:storage');

var StorageService = require('./services/storage_service');
var DBService = require('./services/db_service');
var JWTokenService = require('./services/jwt_token_service');
var KloudlessService = require('./services/kloudless_service');
var Utilities = require('./common/utilities');
var q = require('q');
var Constants = require('./common/constants');
var nconf = require('./common/nconf');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports = {
  //this function will store credentials created by kloudless on the front-end.
  link: function(event, context, cb) {
    // // TODO: VALIDATE the token before saving. https://developers.kloudless.com/docs/v1/authentication

    JWTokenService.verify(event.token)
      .then(function(auth) {
        return DBService.createCredential(
          {
            user_id: auth.uid,
            service_type: event.body.account.service,
            service_id: event.body.account.id.toString(),
            email: event.body.account.account,
            oauth: event.body,
          },
          ['id', 'service_type']
        ).then(function(new_cred) {
          //now we have to create notification webhooks, the QuietThyme folder & subfolders and README.md document
          return KloudlessService.folderCreate(
            event.body.account.id,
            'QuietThyme',
            'root',
            event.body.account.service
          )
            .then(function(root_folder) {
              return [
                q(root_folder),
                KloudlessService.folderCreate(
                  event.body.account.id,
                  'library',
                  root_folder.id,
                  event.body.account.service
                ),
                KloudlessService.folderCreate(
                  event.body.account.id,
                  'blackhole',
                  root_folder.id,
                  event.body.account.service
                ),
              ];
            })
            .spread(function(root_folder, library_folder, blackhole_folder) {
              debug(
                'root_folder: %s, library_folder: %s, blackhole_folder: %s',
                root_folder,
                library_folder,
                blackhole_folder
              );

              return DBService.updateCredential(new_cred.id, {
                root_folder: {
                  id: root_folder.id,
                  raw_id: root_folder.raw_id,
                  path_id: root_folder.path_id,
                }, //this is the service specific "QuietThyme" folder that all sub folders are created in.
                library_folder: {
                  id: library_folder.id,
                  raw_id: library_folder.raw_id,
                  path_id: library_folder.path_id,
                }, //this is "library" folder that all author folders are created in.
                blackhole_folder: {
                  id: blackhole_folder.id,
                  raw_id: blackhole_folder.raw_id,
                  path_id: blackhole_folder.path_id,
                },
              });
            });
        });
      })
      .then(function(user) {
        return {
          service_type: event.body.account.service,
        };
      })
      .then(Utilities.successHandler(cb))
      .fail(Utilities.errorHandler(cb))
      .done();
  },

  status: function(event, context, cb) {
    //res.setHeader('Cache-Control', 'public, max-age=31557600');
    var user_calibre_id_promise = q({});
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
      .then(function(credentials) {
        return credentials.map(function(credential_storage_info) {
          var storage = {
            device_name: credential_storage_info.credential.service_type,
            prefix: credential_storage_info.credential.service_type + '://',
            storage_type: credential_storage_info.credential.service_type,
            storage_id: credential_storage_info.credential.id,
            free_space:
              credential_storage_info.service_info.quota.total -
              credential_storage_info.service_info.quota.used, //quota_info.total_bytes - quota_info.used_bytes,
            total_space: credential_storage_info.service_info.quota.total,
            location_code:
              credential_storage_info.credential.calibre_location_code,
          };

          if (event.query.source == 'calibre') {
            storage['last_library_uuid'] = event.query.library_uuid;
            storage['calibre_version'] = '2.6.0';
          }
          return storage;
        });
      })
      .then(function(credential_quotas) {
        if (event.query.source != 'calibre') {
          debug('User storage quotas %o', credential_quotas);
          return credential_quotas;
        }

        //calculate the amount of space free.

        var status_obj = {
          settings: {
            main: {
              device_store_uuid: '113a769a-cade-11e4-8731-1681e6b88ec1',
              device_name: 'QuietThyme ' + nconf.get('STAGE'),
              prefix: 'quietthyme://',
              storage_type: 'quietthyme',
              storage_id: 'quietthyme',
              location_code: 'main',
              last_library_uuid: event.query.library_uuid,
              free_space: 0,
              total_space: 1000000,
              calibre_version: '2.6.0',
              date_last_connected: '2014-12-18T16:24:59.541905+00:00',
            },
            //'B': None, not stored
          },
        };
        var location_codes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (var ndx in credential_quotas) {
          //
          var location_code = location_codes[ndx];
          var location_settings = credential_quotas[ndx];
          location_settings['location_code'] = location_code;
          location_settings['date_last_connected'] =
            '2014-12-18T16:24:59.541905+00:00';
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
        debug('Calibre User storage quotas %o', status_obj);
        return status_obj;
      })
      .then(Utilities.successHandler(cb))
      .fail(Utilities.errorHandler(cb))
      .done();
  },

  // determine what kind of signedUrl we are sending back. If this is the web we need to use a postSignedUrl, for calibre a getSignedUrl call is enough.
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#createPresignedPost-property
  // this function generates a signed url for the upload bucket, which can be used by clients (calibre, web) to upload book files to s3
  // All books sent with source == "Web" are "NEW" books, while all books sent via "calibre" are existing books and need to be verified in WebUI.
  prepare_book: function(event, context, cb) {
    // this function will create the Author folder for this book, in storage_type specfied
    // TODO: this function shoulc check if the book file already exists.
    JWTokenService.verify(event.token)
      .then(function(auth) {
        //if this is a book to be uploaded via webUI it must be new, so we can skip alot of steps.
        if (event.query.source == 'web') {
          //we still need to check the credential sent is tied to the current user.
          return DBService.findCredentialById(
            event.body.storage_id,
            auth.uid
          ).then(function(credential) {
            var key =
              StorageService.create_upload_folder_identifier(
                auth.uid,
                credential.id,
                'NEW'
              ) + '/';
            var params = {
              Bucket: Constants.buckets.upload,
              Expires: 60 * 60, //1 hour in seconds
              Conditions: [['starts-with', '$key', encodeURI(key)]],
            };

            //TODO: we shoudl figure out if we can use a post policy for both Calibre and WebUI.
            // eg. Policy can be left active for 10 minutes at a time without any lambda requests, if we put reasonable size limits in place.
            var policy = s3.createPresignedPost(params);
            policy.fields.key = key;
            return policy;
          });
        } else {
          return q.spread(
            [
              DBService.findCredentialById(event.body.storage_id, auth.uid),
              DBService.findBookById(event.body.book_id, auth.uid),
            ],
            function(credential, book) {
              var key = StorageService.create_upload_identifier(
                auth.uid,
                credential.id,
                book.id,
                event.body.storage_filename,
                event.body.storage_format
              );

              var book_data = {
                credential_id: credential.id, //this will be the correct 'eventual' storage location, after processing
                storage_type: 'quietthyme', //temporary storage type.
                storage_identifier:
                  Constants.buckets.upload + '/' + encodeURI(key), //this is the temporary file path in s3, it will almost immediately be stored in s3.
                storage_size: event.body.storage_size,
                storage_filename: event.body.storage_filename,
                storage_format: event.body.storage_format,
              };

              return DBService.updateBook(
                book.id,
                auth.uid,
                book_data,
                true
              ).then(function() {
                var params = {
                  Bucket: Constants.buckets.upload,
                  Key: key,
                  Expires: 60,
                };

                return {
                  book_data: book_data,
                  upload_url: s3.getSignedUrl('putObject', params),
                };
              });
            }
          );
        }
      })
      .then(Utilities.successHandler(cb))
      .fail(Utilities.errorHandler(cb))
      .done();
  },

  //this function generates a signed url for the conten bucket, which can be used by clients (calibre, web) to upload cover/thumbnail images to s3
  prepare_cover: function(event, context, cb) {
    // this function will create the Author folder for this book, in storage_type specfied
    // TODO: this function should handle quietthyme storage creds
    JWTokenService.verify(event.token)
      .then(function(auth) {
        return DBService.findBookById(
          event.body.book_id,
          auth.uid
        ).then(function(book) {
          var key = StorageService.create_content_identifier(
            'cover',
            auth.uid,
            event.body.filename,
            event.body.format
          );

          var book_data = {
            cover: Constants.buckets.content + '/' + encodeURI(key),
          };

          return DBService.updateBook(
            book.id,
            auth.uid,
            book_data,
            true
          ).then(function() {
            var params = {
              Bucket: Constants.buckets.content,
              Key: key,
              Expires: 60,
            };
            var payload = {
              book_data: book_data,
              upload_url: s3.getSignedUrl('putObject', params),
            };
            return payload;
          });
        });
      })
      .then(Utilities.successHandler(cb))
      .fail(Utilities.errorHandler(cb))
      .done();
  },

  download: function(event, context, cb) {
    // unfortunately, due to http://stackoverflow.com/questions/18539403/chrome-cancels-cors-xhr-upon-http-302-redirect
    // and http://stackoverflow.com/questions/34949492/cors-request-with-preflight-and-redirect-disallowed-workarounds
    // we can't just redirect th user, we need to return the link location, and have the app do the redirect.

    JWTokenService.verify(event.token)
      .then(function(auth) {
        return DBService.findBookById(event.path.id, auth.uid)
          .then(function(book) {
            return StorageService.get_download_link(book, auth.uid);
          })
          .then(function(link) {
            var payload = {
              url: link,
            };
            debug('download link for book: %o', payload);
            return payload;
          });
      })
      .then(Utilities.successHandler(cb))
      .fail(Utilities.errorHandler(cb))
      .done();
  },
};
