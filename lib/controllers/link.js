var cloudrail = require("cloudrail-si");
cloudrail.Settings.setKey(process.env.CLOUDRAIL_API_KEY);
var q = require('q');
var uuid = require('node-uuid');
var callback_url = "http://localhost:3000/link/callback/";
var db = require('../server/db.js')


module.exports = {
    connect: function (event, context, cb) {
        context.callbackWaitsForEmptyEventLoop = false
        db.get()
            .then(function(db_client){
                var deferred = q.defer();
                var state_uuid = uuid.v4();
                var storage_client = new cloudrail.services.Dropbox(//connect url (browser must redirect here)
                    function authenticator(url, state, auth_cb){
                        db_client('login_sessions').insert(
                            {
                                id: state_uuid,
                                auth_data:state
                            })
                            .then(function(){
                                return deferred.resolve({
                                    url: url
                                })
                            })
                            .catch(function(err){
                                deferred.reject(err);
                            })
                    }, process.env.OAUTH_DROPBOX_CLIENT_KEY, process.env.OAUTH_DROPBOX_CLIENT_SECRET, callback_url + 'dropbox' ,state_uuid);

                //the authenticator won't get called until a method is called on the client, so lets do that now
                storage_client.getUserLogin(function(err){});
                return deferred.promise
            })
            .then(function(data){
                console.log(">>>>> DESTROYING DB")
                return cb(null, data)
            })
            .fail(function(err){
                console.log(">>>> FINISHED DB TRANSACTION WITH ERROR")
                console.log(err.toString())
                cb(null, err.toString())
            })
            .done()
    },
    callback: function(event, context, cb){
        
        db.get()
            .then(function(db_client) {
                return db_client.table('login_sessions').first('auth_data').where({id: event.query.state})
            })
            .then(function(db_row_data){
                var storage_client = new cloudrail.services.Dropbox(function(url,state,auth_cb){
                    var query_str = Object.keys(event.query).map(function(key) {
                        return key + '=' + obj[key];
                    }).join('&');

                    var callback_full_url = callback_url + event.path.serviceType + '?' + query_str
                    auth_cb(undefined, callback_full_url );
                }, process.env.OAUTH_DROPBOX_CLIENT_KEY, process.env.OAUTH_DROPBOX_CLIENT_SECRET, callback_url + event.path.serviceType ,undefined);

                var deferred = q.defer();
                storage_client.resumeLogin(db_row_data.auth_data,function(return_err){
                    if(return_err) return deferred.reject(return_err);

                    client.getIdentifier(function(id_err, userId){
                        if(id_err) return deferred.reject(id_err);

                        deferred.resolve({
                            id: userId
                        })
                    })
                });
                return deferred.promise
            })
            .then(function(data){
                cb(null, data)
            })
            .fail(function(err){
                cb(null, err.toString())
            })
            .done()
    }
}