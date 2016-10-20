var cloudrail = require("cloudrail-si");
cloudrail.Settings.setKey(process.env.CLOUDRAIL_API_KEY);
var callback_url = "http://localhost:3000/link/callback/";

module.exports = {
    test: function (event, context, cb) {
        // context.callbackWaitsForEmptyEventLoop = false

        var storage_client  = new cloudrail.services.Dropbox(//connect url (browser must redirect here)
            function (url, state, auth_cb){
                cb(null, {
                    url: url
                })
            }
            , process.env.OAUTH_DROPBOX_CLIENT_KEY, process.env.OAUTH_DROPBOX_CLIENT_SECRET, callback_url + 'dropbox' , Date.now().toString());

        //the authenticator won't get called until a method is called on the client, so lets do that now
        storage_client.getUserLogin(function(err){});
        // return deferred.promise
        //     .then(function(url){
        //         console.log(">>>>> SUCCESS")
        //
        //
        //         cb(null, url)
        //         console.log(">>>>> ACTIVE HANDLES BEFORE")
        //         console.dir(process._getActiveHandles())
        //         console.log(">>>>> ACTIVE REQUESTS BEFORE")
        //         console.dir(process._getActiveRequests())
        //     })
        //     .fail(function(err){
        //         console.log(">>>>> ERROR")
        //
        //         cb(null, err.toString())
        //     })
    },
    test_bluebird: function (event, context, cb){
        // console.log('hello~~~');
        //
        // Promise
        //     .delay(3000)
        //     .then(function(){
        //         cb(null, {})
        //     })
        //
        // //.timeout(900)
        // .catch(function(err){
        //     cb(err, err.stack)
        // });

    }
}