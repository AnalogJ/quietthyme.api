require('dotenv').config();
var q = require('q');
var kloudless = require('kloudless')(process.env.KLOUDLESS_API_KEY);


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