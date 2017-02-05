var q = require('q');


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Filefog releated storage methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//list of storage_types that are enabled.
module.exports.storage_types = ['dropbox','google','box','skydrive'];

module.exports.get_storage_client = function(storage_type,user_id,credential){
    var genericProvider = sails.config.filefog.provider(storage_type);
    var genericClient = null;
    if(genericProvider.getConfig().interfaces.indexOf("oauth") != -1){

        var credential_promise = q(credential);
        if(!credential){
            var query = new sails.config.Parse.Query('Credential');
            query.equalTo('user', ParseService.pointer('_User',user_id));
            query.equalTo('service_type',storage_type);
            credential_promise = query.first({ useMasterKey: true })
        }
        genericClient = credential_promise
            .then(function(credential){
                if(SecurityService.is_oauth_token_expired(credential)){
                    sails.log.verbose("credential exipred, refreshing")
                    return genericProvider.oAuthRefreshAccessToken(credential.get('oauth_data'))
                        .then(function(refreshed_oauth_data){
                            credential.set('oauth_data',refreshed_oauth_data);
                            return credential.save(null,{ useMasterKey: true });
                        })
                        .then(function(refreshed_credential){
                            return genericProvider.getClient(refreshed_credential.get('oauth_data'), refreshed_credential.get('options') || {})
                        })
                }
                else{
                    return genericProvider.getClient(credential.get('oauth_data'), credential.get('options') || {})
                }
            });
    }

    return genericClient;
}


module.exports.get_storage_quotas = function(user_id, quota_transform_callback){
    if(!quota_transform_callback){
        quota_transform_callback = function(storage_type, quota_info){
            return [storage_type, quota_info]
        }
    }

    var credential_query = new sails.config.Parse.Query('Credential');
    credential_query.equalTo('user', ParseService.pointer('_User',user_id));
    return q(credential_query.find({ useMasterKey: true }))
        .then(function(credentials){
            console.log("Found credentials for user", user_id, credentials.length);
            var storage_info_promises = credentials.map(function(cred){
                return StorageService.get_storage_client(cred.get('service_type'), user_id, cred)
                    .then(function(client){
                        sails.log.debug('Request Quota', cred.get('service_type'));
                        return client.checkQuota()
                    })
                    .then(function(quota_info){
                        sails.log.debug('GOT QUOTA',cred.get('service_type'), quota_info);

                        return quota_transform_callback(cred, quota_info);

                    })
            });
            return q.all(storage_info_promises)
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
