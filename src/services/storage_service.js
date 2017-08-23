'use strict';
const debug = require('debug')('quietthyme:StorageService');
var q = require('q'),
  nconf = require('../common/nconf'),
  kloudless = require('kloudless')(nconf.get('KLOUDLESS_API_KEY')),
  JWTokenService = require('./jwt_token_service'),
  DBService = require('./db_service'),
  KloudlessService = require('./kloudless_service'),
  Constants = require('../common/constants'),
  path = require('path'),
  fs = require('fs'),
  tmp = require('tmp'),
  AWS = require('aws-sdk');

if (!nconf.get('STAGE')) {
  throw new Error('STAGE not provided!');
}
var config = { apiVersion: '2006-03-01' };
if (nconf.get('STAGE') == 'test') {
  config.s3ForcePathStyle = true;
  config.endpoint = new AWS.Endpoint(
    'http://' + nconf.get('TEST_S3_HOSTNAME') + ':4569'
  );
}

var s3 = new AWS.S3(config);

//ALL MEthods in here should support Kloudless storage and s3 storage transparently.

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Kloudless related storage methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var StorageService = module.exports;

StorageService.clean_filename = function(filename) {
  return filename.replace(/[^0-9a-zA-Z_\s-]/gi, '');
};

StorageService.book_filename = function(book) {
  var filename = book.authors[0];
  if (book.series_name) {
    filename += ` - ${book.series_name}`;
  }
  if (book.series_number) {
    filename += ` - ${book.series_number}`;
  }
  filename += ` - ${book.title}`;

  filename = StorageService.clean_filename(filename);
  return filename;
};


//Move a book between blackhole directory and library directory on Kloudless cloud provider storage.
StorageService.move_to_perm_storage = function(credential, book) {
  //filename
  var filename = StorageService.book_filename(book) + book.storage_format;
  return KloudlessService.fileMoveRetry(
    credential.service_id,
    book.storage_identifier,
    credential.library_folder.id,
    filename
  );
};

//move a book from upload bucket to content bucket.
StorageService.move_to_quietthyme_perm_storage = function(upload_identifier, content_bucket, content_key){

  var deferred = q.defer();
  var params = {
    Bucket: content_bucket,
    CopySource: `/${upload_identifier}`,
    Key: content_key
  };
  s3.copyObject(params, function(err, data) {
    if (err) {deferred.reject(err)}
    deferred.resolve({id: `${content_bucket}/${content_key}`}); //must return the same syntax as KloudlessService.fileUpload
  });
  return deferred.promise;

}

//Download a file from cloud provider into local /tmp directory for processing.
StorageService.download_book_tmp = function(
  filename,
  credential_id,
  storage_identifier
) {
  //TODO: this function should also handle downloading books from S3.

  return DBService.findCredentialById(credential_id).then(function(credential) {
    var tmpDir = tmp.dirSync();

    //we need to keep the filename intact because we'll be sending it to Calibre to detect metadata.
    var filepath = tmpDir.name + '/' + filename;
    var writeStream = fs.createWriteStream(filepath);
    return [
      KloudlessService.fileContents(
        credential.service_id,
        storage_identifier,
        writeStream
      ).then(function() {
        return filepath;
      }),
      credential,
    ];
  });
};

//get storage status for all the user's cloud storages
StorageService.get_user_storage = function(token) {
  return JWTokenService.verify(token).then(function(auth) {
    return DBService.findCredentialsByUserId(auth.uid).then(function(
      credentials
    ) {
      debug('Found credentials for user: %s', auth.uid);
      var credential_info_promises = credentials.map(function(cred) {
        var deferred = q.defer();

        console.info('Requesting Quota', cred.service_type, cred.service_id);
        kloudless.accounts.get(
          {
            account_id: cred.service_id,
            queryParams: {
              retrieve_full: true,
            },
          },
          function(err, service_info) {
            if (err) return deferred.reject(err);

            console.info('Credential info:', service_info);
            deferred.resolve({ credential: cred, service_info: service_info });
          }
        );

        return deferred.promise;
      });

      return q.all(credential_info_promises);
    });
  });
};


//generate link to a cloud storage/s3 bucket file. Useful when downloading books.
StorageService.get_download_link = function(book, user_id) {
  //check if the book storage_type is populated, if not, then we need to return
  if (!book.storage_type || !book.storage_identifier) {
    return q.reject(new Error('Could not find storage'));
  } else if (book.storage_type == 'quietthyme') {
    //book is stored in S3, lets get it from there.
    //storage_identifier for s3 is bucket/key

    return q.resolve(
      'https://s3.amazonaws.com/' + encodeURI(book.storage_identifier)
    );
  } else {
    //TODO: handle storage download requests from other services.
    //throw new Error("Storage service download not supported yet.")

    //find the credential for this book
    return DBService.findCredentialById(book.credential_id, user_id)
      .then(function(credential) {
        return KloudlessService.linkCreate(
          credential.service_id,
          book.storage_identifier
        );
      })
      .then(function(data) {
        debug('Book download link: %o', data);
        return data.url;
      });
  }
};

//upload a file from local directory to s3.
StorageService.upload_file_from_path = function(filepath, bucket, key) {
  console.info('Uploading file from ' + filepath, bucket, key);
  if (!filepath) {
    return q.reject(new Error('No filepath specified'));
  }
  if (!fs.existsSync(filepath)) {
    return q.reject(new Error('File not found'));
  }

  var filestream = fs.createReadStream(filepath);

  var ext = path.extname(filepath).split('.').join(''); //safe way to remove '.' prefix, even on empty string.

  return StorageService.upload_file_from_stream(filestream, ext, bucket, key);
};

StorageService.upload_file_from_stream = function(
  filestream,
  ext,
  bucket,
  key
) {
  var deferred = q.defer();

  var payload = {
    Bucket: bucket,
    Key: key,
    Body: filestream,
    ContentEncoding: 'base64',
  };

  if (Constants.image_extensions[ext]) {
    payload.Metadata = {
      'Content-Type ': Constants.image_extensions[ext].mimetype,
    };
  } else if (Constants.file_extensions[ext]) {
    payload.Metadata = {
      'Content-Type ': Constants.file_extensions[ext].mimetype,
    };
  }

  s3.putObject(payload, function(resp) {
    console.info('Successfully uploaded package.', bucket + '/' + key);
    deferred.resolve({ bucket: bucket, key: key });
  });

  return deferred.promise;
};

//content identifiers are publically readable.
// eg. HASH1234/image/cover/bookname.png
// HASH1234/library/bookname.epub
StorageService.create_content_identifier = function(
  file_type,
  user_id,
  filename,
  extension
) {
  return (
    storage_user_hash(user_id) +
    '/' +
    storage_identifier_from_filename(filename, file_type) +
    extension
  );
};

//upload identifiers are for temporary file storage, before the files are processed and moved to content bucket or storage
//provider

//eg. HASH1234/cred_id/book_id/bookname.epub
//eg. HASH1234/cred_id/NEW/bookname.epub #bookid NEW is reserved for books which have to be processed/parsed first
StorageService.create_upload_identifier = function(
  user_id,
  cred_id,
  book_id,
  filename,
  extension
) {
  return (
    storage_user_hash(user_id) +
    '/' +
    user_id +
    '/' +
    cred_id +
    '/' +
    (book_id || 'NEW') +
    '/' +
    filename +
    extension
  );
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper/Shared private methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//this method takes a user_id (1, 2, etc) and hash's it so it can be used to serve publically accessible content in a
//semi-secure way.
function storage_user_hash(user_id) {
  var data = user_id + nconf.get('STORAGE_SALT');
  var crypto = require('crypto');
  return crypto.createHash('md5').update(data).digest('hex');
}

function storage_identifier_from_filename(filename, type) {
  if (type == 'image') {
    //generic images
    return 'images/' + filename;
  } else if (type == 'cover') {
    return 'covers/' + filename;
  }
  return 'library/' + filename;
}
//
////TODO:download the file to adata buffer?
//exports.download_file_in_container = function(storage_full_identifier){
//
////    var deferred = q.defer();
////    var storageAccount = sails.config.nconf.get("AZURE:ACCOUNT_NAME");
////    var storageAccessKey = sails.config.nconf.get("AZURE:ACCESS_KEY");
////
////    var blobService = azure.createBlobService(storageAccount, storageAccessKey);
////
////    storage_identifier_parts = storage_full_identifier.split('/');
////    storage_container = storage_full_identifier.slice(0,1);
////    storage_identifier = storage_full_identifier.slice(1).join('/');
////
////    blobService.getBlobProperties(storage_container, storage_identifier, function (err, blobInfo) {
////        if (err === null) {
////            res.header('content-type', blobInfo.contentType);
////            res.header('content-disposition', 'attachment; filename=' + blobInfo.metadata.filename);
////            blobClient.getBlobToStream(containerName, req.params.id, res, function () { });
////        } else {
////            helpers.renderError(res);
////        }
////    });
//}
