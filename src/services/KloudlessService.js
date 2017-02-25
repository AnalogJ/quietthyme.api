//require('dotenv').config();
var q = require('q');
var kloudless = require('kloudless')(process.env.KLOUDLESS_API_KEY);
var request = require('request');

var kloudlessService = exports;

kloudlessService.folderCreate = function(account_id, name, parent_id, service_type){
    if(service_type == 'dropbox' && parent_id == 'root' && name == 'QuietThyme'){
        //dropbox app is sandboxed, no need to create a QuietThyme folder.
        return q({id: 'root', raw_id: 'root', path_id: 'root'})
    }

    var deferred = q.defer();
    kloudless.folders.create({
        account_id: account_id,
        parent_id: parent_id || 'root',
        name: name
    }, function(err, res){
        if (err) return deferred.reject(err);
        return deferred.resolve(res)
    })

    if(service_type == 'dropbox'){
        //the kloudless dropbox integration has 2 different identifiers, 1 for the DB static ID and one for the path ID.
        //we have to generate both.
        return deferred.promise
            .then(function(folder_metadata){
                console.log("CONVERTING ID FOR DROPBOX:", folder_metadata.path)
                return kloudlessService.convertId(account_id, folder_metadata.path)
                    .then(function(convert_data){
                        console.log("CONVERT RESPONSE", convert_data)
                        folder_metadata.path_id = convert_data.id;
                        return folder_metadata;
                    })
            })
    }
    else{
        return deferred.promise;
    }
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
};

kloudlessService.convertId = function(account_id, identifier, type){
    var deferred = q.defer();

    //the kloudless encrypts & encodes the service id into their own.
    var options = {
        url: 'https://api.kloudless.com/v1/accounts/'+account_id + '/storage/convert_id',
        method: 'POST',
        headers: {
            'Authorization': 'ApiKey ' + process.env.KLOUDLESS_API_KEY
        },
        json: {
            raw_id: identifier,
            type: type || 'folder'
        }
    };

    request(options, function (error, response, body) {
        if(error){
            return deferred.reject(error)
        }
        return deferred.resolve(body)
    });

    return deferred.promise;
};

kloudlessService.eventsGet = function(account_id, event_cursor){
    console.log("KLOUDLESS EVENTS GET REQUEST:", account_id, event_cursor)
    var deferred = q.defer();
    kloudless.events.get({
        account_id: account_id,
        cursor: event_cursor ||'after-auth'
    }, function(err, res){
        if (err) return deferred.reject(err);
        return deferred.resolve(res)
    })
    return deferred.promise;
}

kloudlessService.linkCreate = function(account_id, file_id){
    var deferred = q.defer();
    kloudless.links.create({
        account_id: account_id,
        file_id: file_id,
        direct: true

        // queryParams: {
        //     //TODO: set expiry to 10 minutes
        //     //expiration: ISO 8601 timestamp specifying when the link expires.
        // }
    }, function(err, res){
        if (err) return deferred.reject(err);
        return deferred.resolve(res)
    })
    return deferred.promise;
}