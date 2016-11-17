var cloudrail = require("cloudrail-si");
cloudrail.Settings.setKey(process.env.CLOUDRAIL_API_KEY);
var callback_url = "http://localhost:3000/link/callback/";

module.exports = {
    test: function (event, context, cb) {
        context.callbackWaitsForEmptyEventLoop = false

        var storage_client  = new cloudrail.services.Dropbox(//connect url (browser must redirect here)
            function (url, state, auth_cb){
                cb(null, {
                    url: url
                })
                console.log(">>>>> ACTIVE HANDLES")
                console.dir(process._getActiveHandles())
                console.log(">>>>> ACTIVE REQUESTS")
                console.dir(process._getActiveRequests())
                auth_cb(new Error('test'))
            }
            , process.env.OAUTH_DROPBOX_CLIENT_KEY, process.env.OAUTH_DROPBOX_CLIENT_SECRET, callback_url + 'dropbox' , Date.now().toString());

        //the authenticator won't get called until a method is called on the client, so lets do that now
        storage_client.login(function(err){
            console.log(">>GETUSERLOGIN RESULT")
            console.log(arguments)
        });

    }
}