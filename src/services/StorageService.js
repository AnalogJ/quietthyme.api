//require('dotenv').config();
var q = require('q'),
    kloudless = require('kloudless')(process.env.KLOUDLESS_API_KEY),
    JWTokenService = require('./JWTokenService'),
    DBService = require('./DBService')



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Kloudless related storage methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.get_storage_quotas = function(token){

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
