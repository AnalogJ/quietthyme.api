var cloudrail = require("cloudrail-si");
cloudrail.Settings.setKey(process.env.CLOUDRAIL_API_KEY);
var q = require('q');
var uuid = require('node-uuid');
var callback_url = "https://api.quietthyme.com/dev/callback/";
var DBService = require('../services/DBService.js');
var Constants = require('../constants');





module.exports = {
    connect: function (event, context, cb) {
        context.callbackWaitsForEmptyEventLoop = false

        function authenticator(url, state, auth_cb){
            DBService.get()
                .then(function(db_client){
                    return db_client('login_sessions').insert(
                        {
                            id: state_uuid,
                            auth_data:state
                        })
                        .then(function(){
                            return DBService.destroy()
                        })
                        .then(function(){
                            return cb(null, {
                                url: url
                            })
                        })
                        .then(function(){
                            console.log(">>>>> ACTIVE HANDLES")
                            console.dir(process._getActiveHandles())
                            console.log(">>>>> ACTIVE REQUESTS")
                            console.dir(process._getActiveRequests())
                        })
                        .catch(function(err){
                            return cb(null, err.toString());
                        })
                })
        }

        var state_uuid = uuid.v4();
        var storage_client = null;

        if (event.path.serviceType == 'dropbox') {
            storage_client = new cloudrail.services.Dropbox(//connect url (browser must redirect here)
                authenticator
                , process.env.OAUTH_DROPBOX_CLIENT_KEY, process.env.OAUTH_DROPBOX_CLIENT_SECRET, callback_url + event.path.serviceType ,state_uuid);
        }
        else if (event.path.serviceType == 'google') {
            storage_client = new cloudrail.services.GoogleDrive(//connect url (browser must redirect here)
                authenticator
                , process.env.OAUTH_GOOGLE_CLIENT_KEY, process.env.OAUTH_GOOGLE_CLIENT_SECRET, callback_url + event.path.serviceType ,state_uuid);
        }
        else if (event.path.serviceType == 'box') {
            storage_client = new cloudrail.services.Box(//connect url (browser must redirect here)
                authenticator
                , process.env.OAUTH_BOX_CLIENT_KEY, process.env.OAUTH_BOX_CLIENT_SECRET, callback_url + event.path.serviceType ,state_uuid);
        }
        else if (event.path.serviceType == 'skydrive') {
            storage_client = new cloudrail.services.OneDrive(//connect url (browser must redirect here)
                authenticator
                , process.env.OAUTH_SKYDRIVE_CLIENT_KEY, process.env.OAUTH_SKYDRIVE_CLIENT_SECRET, callback_url + event.path.serviceType ,state_uuid);
        }

        //the authenticator won't get called until a method is called on the client, so lets do that now
        storage_client.getUserLogin(function(err){});
    },
    callback: function(event, context, cb){
        context.callbackWaitsForEmptyEventLoop = false

        function authenticator(url,state,auth_cb){
            var query_str = Object.keys(event.query).map(function(key) {
                return key + '=' + event.query[key];
            }).join('&');

            var callback_full_url = callback_url + event.path.serviceType + '?' + query_str;
            console.log(">>> GEN CALLBACK_URL");
            console.log(callback_full_url)
            auth_cb(undefined, callback_full_url)
        }


        var storage_client = null;
        if (event.path.serviceType == 'dropbox') {
            storage_client = new cloudrail.services.Dropbox(//connect url (browser must redirect here)
                authenticator
                , process.env.OAUTH_DROPBOX_CLIENT_KEY, process.env.OAUTH_DROPBOX_CLIENT_SECRET, callback_url + event.path.serviceType, 'state');
        }
        else if (event.path.serviceType == 'google') {
            storage_client = new cloudrail.services.GoogleDrive(//connect url (browser must redirect here)
                authenticator
                , process.env.OAUTH_GOOGLE_CLIENT_KEY, process.env.OAUTH_GOOGLE_CLIENT_SECRET, callback_url + event.path.serviceType ,'state');
        }
        else if (event.path.serviceType == 'box') {
            storage_client = new cloudrail.services.Box(//connect url (browser must redirect here)
                authenticator
                , process.env.OAUTH_BOX_CLIENT_KEY, process.env.OAUTH_BOX_CLIENT_SECRET, callback_url + event.path.serviceType ,'state');
        }
        else if (event.path.serviceType == 'skydrive') {
            storage_client = new cloudrail.services.OneDrive(//connect url (browser must redirect here)
                authenticator
                , process.env.OAUTH_SKYDRIVE_CLIENT_KEY, process.env.OAUTH_SKYDRIVE_CLIENT_SECRET, callback_url + event.path.serviceType ,'state');
        }
        console.log(">>> STORAGE_CLINT CREATED..");

        // DBService.get()
        //     .then(function(db_client) {
        //         return db_client.table('login_sessions').first().where({id: event.query.state})
        //     })
        //     .then(function(db_row_data){
        //         console.log("AUTH DATA:")
        //         console.dir(db_row_data.auth_data)
                var deferred = q.defer();
                storage_client.getUserLogin(function(res_err){
                    console.log(">> FINISHED RESUME LOGIN")
                    console.dir(arguments)
                    if(res_err) return deferred.reject(res_err);

                    console.log("TRYING TO SAVE OAUTH keys");
                    deferred.resolve({
                        oauth: storage_client.saveAsString()
                    });
                    //
                    // storage_client.getUserLogin(function(id_err, userId){
                    //     console.log(">> FINISHED getUserLogin")
                    //     console.dir(arguments)
                    //     if(id_err) return deferred.reject(id_err);
                    //
                    //     deferred.resolve({
                    //         id: userId,
                    //         data: storage_client.saveAsString()
                    //     })
                    // })
                });
                return deferred.promise
            // })
            .then(function(data){
                // console.log(">>>>> DESTROYING DB")
                // return DBService.destroy().then(function(){
                //     console.log(">>>> FINISHED DB TRANSACTION SUCCESSFULLY")
                //     console.dir(data)

                    return cb(null, data)

                // })
            })
            .fail(function(err){
                console.log(">>>> FINISHED DB TRANSACTION WITH ERROR")
                console.log(err.toString())
                console.log(err.stack)
                cb(null, err.toString())
            })
            .done()
    }
}