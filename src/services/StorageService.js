//require('dotenv').config();
var q = require('q'),
    kloudless = require('kloudless')(process.env.KLOUDLESS_API_KEY),
    JWTokenService = require('./JWTokenService'),
    DBService = require('./DBService'),
    KloudlessService = require('./KloudlessService'),
    fs = require('fs'),
    tmp = require('tmp'),
    AWS = require('aws-sdk'),
    s3 = new AWS.S3({apiVersion: '2006-03-01'})


//ALL MEthods in here should support Kloudless storage and s3 storage transparently.

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Kloudless related storage methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var StorageService = module.exports;


StorageService.book_filename = function(book){
    var filename = book.authors[0]
    if(book.series_name){
        filename += ` - ${book.series_name}`
    }
    if(book.series_number){
        filename += ` - ${book.series_number}`
    }
    filename += ` - ${book.title}`
    return filename
}

StorageService.move_to_perm_storage = function(credential, book){

    //filename
    var filename = StorageService.book_filename(book) + book.storage_format
    return KloudlessService.fileMove(credential.service_id, book.storage_identifier, credential.library_folder.id, filename)
}

StorageService.download_book_tmp = function(db_client, filename, credential_id, storage_identifier){
    //TODO: this function should also handle downloading books from S3.

    return q(db_client.first()
        .from('credentials')
        .where('id', credential_id))
        .then(function(credential){

            var tmpDir = tmp.dirSync()

            //we need to keep the filename intact because we'll be sending it to Calibre to detect metadata.
            var filepath = tmpDir.name + '/' + filename;
            var writeStream = fs.createWriteStream(filepath);
            console.log('WRITING TO File: ', filepath);
            return [
                    KloudlessService.fileContents(credential.service_id, storage_identifier, writeStream)
                        .then(function(){
                            console.log("FINISHED DOWNLOADING FILE")
                            return filepath
                        }),
                    credential
                ]

        })


}

StorageService.get_user_storage = function(token){

    console.log("GET STORAGE QUTOAS")
    return q.spread([JWTokenService.verify(token), DBService.get()],
        function(auth, db_client){
            console.log(auth)
            return q(db_client.select()
                .from('credentials')
                .where('user_id', auth.uid))
                .then(function(credentials){
                    console.log("Found credentials for user", auth.uid, credentials);
                    var credential_info_promises = credentials.map(function(cred){
                        var deferred = q.defer();

                        console.log("Requesting Quota", cred.service_type, cred.service_id);
                        console.log(process.env.KLOUDLESS_API_KEY);
                        kloudless.accounts.get({account_id: cred.service_id,
                            queryParams: {
                                retrieve_full: true
                            }}, function(err, service_info){
                            if(err) return deferred.reject(err);

                            console.log("Credential info:", service_info)
                            deferred.resolve({credential: cred, service_info: service_info});
                        });

                        return deferred.promise
                    });

                    return q.all(credential_info_promises)
                })
        })
}

StorageService.get_download_link = function(book, user_id, db_client){
    //check if the book storage_type is populated, if not, then we need to return
    if(!book.storage_type || !book.storage_identifier){
        return q.reject(new Error('Could not find storage'))
    }
    else if(book.storage_type == 'quietthyme'){
        //book is stored in S3, lets get it from there.
        //storage_identifier for s3 is bucket/key

        return q.resolve("https://s3.amazonaws.com/" + encodeURI(book.storage_identifier))
    }
    else{
        //TODO: handle storage download requests from other services.
        //throw new Error("Storage service download not supported yet.")


        //find the credential for this book
        return db_client.first()
            .from('credentials')
            .where({
                user_id: user_id,
                id: book.credential_id
            })
            .then(function(credential){
                return KloudlessService.linkCreate(credential.service_id, book.storage_identifier)
            })
            .then(function(data){

                console.log("REDIRECT LINK", data)
                return data.url

            })

    }
}

StorageService.upload_file = function(filepath, bucket, key){
    var deferred = q.defer();

    fs.readFile(filepath, function (err, data) {
        if (err) deferred.reject(new Error('Could not find file'))

        var base64data = new Buffer(data, 'binary').toString('base64');
        s3.putObject({
            Bucket: bucket,
            Key: key,
            Body: base64data
        },function (resp) {
            console.log(arguments);
            console.log('Successfully uploaded package.');
            deferred.resolve({bucket: bucket, key: key});
        });

    })
    return deferred.promise;

}

//content identifiers are publically readable.
// eg. HASH1234/image/cover/bookname.png
// HASH1234/library/bookname.epub
StorageService.create_content_identifier = function(file_type, user_id, filename, extension){
    return storage_user_hash(user_id) + '/' + storage_identifier_from_filename(filename, file_type) + extension
}


//upload identifiers are for temporary file storage, before the files are processed and moved to content bucket or storage
//provider

//eg. HASH1234/cred_id/book_id/bookname.epub
//eg. HASH1234/cred_id/NEW/bookname.epub #bookid NEW is reserved for books which have to be processed/parsed first
StorageService.create_upload_identifier = function(user_id, cred_id, book_id, filename, extension){
    return storage_user_hash(user_id) + '/' + user_id + '/' + cred_id + '/' + (book_id || 'NEW') + '/' + filename + extension
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper/Shared private methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//this method takes a user_id (1, 2, etc) and hash's it so it can be used to serve publically accessible content in a
//semi-secure way.
function storage_user_hash(user_id){
    var data = user_id + process.env.STORAGE_SALT;
    var crypto = require('crypto');
    return crypto.createHash('md5').update(data).digest("hex")
}

function storage_identifier_from_filename(filename, type){
    if(type == 'image'){
        return 'images/' + filename;
    }
    return "library/"+ filename;
};




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
