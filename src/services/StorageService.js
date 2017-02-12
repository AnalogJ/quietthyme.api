require('dotenv').config();
var q = require('q'),
    kloudless = require('kloudless')(process.env.KLOUDLESS_API_KEY),
    JWTokenService = require('./JWTokenService'),
    DBService = require('./DBService')



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Filefog releated storage methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.get_storage_quotas = function(token, quota_transform_callback){
    if(!quota_transform_callback){
        quota_transform_callback = function(storage_type, quota_info){
            return [storage_type, quota_info]
        }
    }

    return q.spread([JWTokenService.verify(token), DBService.get()],
        function(auth, db_client){
            db_client.select()
                .from('credentials')
                .where('user_id', auth.uid)

                .then(function(credentials){
                    console.log("Found credentials for user", auth.uid, credentials.length);
                    var storage_info_promises = credentials.map(function(cred){


                        var deferred = q.defer();

                        console.log("Requesting Quota", cred.service_type, cred.service_id);
                        kloudless.accounts.get({account_id: cred.service_id, retrieve_full: true}, function(err, cred_info){
                            if(err) return deferred.reject(err);

                            console.log("Credential info:", cred_info)
                            deferred.resolve(quota_transform_callback(cred, cred_info));
                        });

                        return deferred.promise
                    });
                    return q.all(storage_info_promises)

            })
        })
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper/Shared private methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



module.exports.create_storage_identifier_from_filename = function(filename, type){
    if(type == 'image'){
        return 'images/' + filename;
    }
    return "files/"+ filename;
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
