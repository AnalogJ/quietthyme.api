//require('dotenv').config();
var q = require('q');
var kloudless = require('kloudless')(process.env.KLOUDLESS_API_KEY);
var request = require('request');

var kloudlessService = exports;

kloudlessService.folderCreate = function(account_id, name, parent_id){
    var deferred = q.defer();
    kloudless.folders.create({
        account_id: account_id,
        parent_id: parent_id || 'root',
        name: name
    }, function(err, res){
        if (err) return deferred.reject(err);
        return deferred.resolve(res)
    })
    return deferred.promise;
}

kloudlessService.fileUpload = function(bearer_token, account_id, filename, parent_id, storage_identifier){
    var deferred = q.defer();

    //the kloudless-node sdk has issues with file uploads, and is missing ability to pass only url param to endpoint


    var options = {
        url: 'https://api.kloudless.com/v1/accounts/'+account_id + '/storage/files',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + bearer_token
        },
        json: {
            name: filename,
            parent_id: parent_id,
            url: 'https://s3.amazonaws.com/' + storage_identifier
        }

    };

    request(options, function (error, response, body) {
        if(error){
            return deferred.reject(error)
        }
        return deferred.resolve(body)
    });

    return deferred.promise;
}