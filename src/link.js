// 'use strict';
// const debug = require('debug')('quietthyme:link');
//
// var cloudrail = require("cloudrail-si");
// var blocked = require('blocked');
// // var q = require('q');
// // var uuid = require('node-uuid');
// var callback_url = "https://api.quietthyme.com/beta/callback/";
// // var DBService = require('./services/db_service.js');
// // var Constants = require('./common/constants');
//
//
// function makeService(name, redirectReceiver, state) {
//     var service;
//     switch (name) {
//         case "dropbox":
//             service = new cloudrail.services.Dropbox(
//                 redirectReceiver,
//                 process.env.OAUTH_DROPBOX_CLIENT_KEY,
//                 process.env.OAUTH_DROPBOX_CLIENT_SECRET,
//                 callback_url + 'dropbox', // Make sure your Dropbox app has this set as an allowed redirect URI
//                 state
//             );
//             break;
//         case "onedrive":
//             service = new cloudrail.services.OneDrive(
//                 redirectReceiver,
//                 process.env.OAUTH_SKYDRIVE_CLIENT_KEY,
//                 process.env.OAUTH_SKYDRIVE_CLIENT_SECRET,
//                 callback_url + 'onedrive',  // Make sure your OneDrive app has this set as an allowed redirect URI
//                 state
//             );
//             break;
//         // More services from CloudStorage can be added here, the services above are just examples
//         default: throw new Error("Unrecognized service");
//     }
//     return service;
// }
//
// module.exports = {
//
//     connect: function(event, context, cb){
//         context.callbackWaitsForEmptyEventLoop = false; //this is because service.exit doesn't actually complete.
//         var timer = blocked(fn, options);
//
//         let serviceName = event.path.serviceType;
//         let redirectReceiver = (url, state, callback) => {
//             cb(null, {
//                 url: url
//             })
//         };
//         let service = makeService(serviceName, redirectReceiver, "state"); // You can change the last parameter if you need to identify incoming redirects
//         return service.getUserLogin(); // Start login. Won't complete since the redirectReceiver never calls its callback
//     },
//     callback:function(event, context, callback){
//
//         return callback(null, {
//             'test':'teststring',
//             event: event
//         });
//
//         // Use this code if you don't use the http event with the LAMBDA-PROXY integration
//         // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
//     }
//
//
// };
// //
// //
// // module.exports = {
// //     connect: function(event, context, cb){
// //         var redirectReceiver = function(url, state, callback) {
// //             console.log(url)
// //             cb(null, {
// //                 url: url
// //             })
// //         };
// //         var service = makeService(event.path.serviceType, redirectReceiver, "state"); // You can change the last parameter if you need to identify incoming redirects
// //         service.getUserLogin();
// //     },
// //     callback: function(event, context, cb){
// //         var serviceName = event.path.serviceType;
// //         var redirectReceiver = function(url, state, callback) {
// //             var query_str = Object.keys(event.query).map(function(key) {
// //                 return key + '=' + event.query[key];
// //             }).join('&');
// //
// //             var callback_full_url = callback_url + event.path.serviceType + '?' + query_str;
// //             console.log(">>> FULL CALLBACK_URL");
// //             console.log(callback_full_url)
// //             callback(undefined, callback_full_url)
// //         };
// //
// //         var service = makeService(event.path.serviceType, redirectReceiver, "state");
// //         service.getUserLogin(function(err){
// //             if (err) {
// //                 console.log(">>> LOGIN ERROR")
// //                 console.log(err.stack)
// //                 return cb(null, err);
// //             }
// //
// //             // Now we are logged in, let's respond with the files in root
// //             service.getChildren("/", function(err, children){
// //                 if (err){
// //                     console.log(">>> CHILDREN ERROR")
// //                     console.log(err.stack)
// //                     return cb(null, err);
// //                 }
// //                 var childrenNames = [];
// //                 for (var ndx in children) {
// //                     childrenNames.push(children[ndx].name);
// //                 }
// //                 console.log(children)
// //                 cb(null, children)
// //             });
// //         });
// //     }
// //
// //
// //     // connect: function (event, context, cb) {
// //     //     context.callbackWaitsForEmptyEventLoop = false
// //     //
// //     //     function authenticator(url, state, auth_cb){
// //     //         DBService.get()
// //     //             .then(function(db_client){
// //     //                 return db_client('login_sessions').insert(
// //     //                     {
// //     //                         id: state_uuid,
// //     //                         auth_data:state
// //     //                     })
// //     //                     .then(function(){
// //     //                         return DBService.destroy()
// //     //                     })
// //     //                     .then(function(){
// //     //                         return cb(null, {
// //     //                             url: url
// //     //                         })
// //     //                     })
// //     //                     .then(function(){
// //     //                         console.log(">>>>> ACTIVE HANDLES")
// //     //                         console.dir(process._getActiveHandles())
// //     //                         console.log(">>>>> ACTIVE REQUESTS")
// //     //                         console.dir(process._getActiveRequests())
// //     //                     })
// //     //                     .catch(function(err){
// //     //                         return cb(null, err.toString());
// //     //                     })
// //     //             })
// //     //     }
// //     //
// //     //     var state_uuid = 'state'//uuid.v4();
// //     //     var storage_client = null;
// //     //
// //     //     if (event.path.serviceType == 'dropbox') {
// //     //         storage_client = new cloudrail.services.Dropbox(//connect url (browser must redirect here)
// //     //             authenticator
// //     //             , process.env.OAUTH_DROPBOX_CLIENT_KEY, process.env.OAUTH_DROPBOX_CLIENT_SECRET, callback_url + event.path.serviceType ,state_uuid);
// //     //     }
// //     //     else if (event.path.serviceType == 'google') {
// //     //         storage_client = new cloudrail.services.GoogleDrive(//connect url (browser must redirect here)
// //     //             authenticator
// //     //             , process.env.OAUTH_GOOGLE_CLIENT_KEY, process.env.OAUTH_GOOGLE_CLIENT_SECRET, callback_url + event.path.serviceType ,state_uuid);
// //     //     }
// //     //     else if (event.path.serviceType == 'box') {
// //     //         storage_client = new cloudrail.services.Box(//connect url (browser must redirect here)
// //     //             authenticator
// //     //             , process.env.OAUTH_BOX_CLIENT_KEY, process.env.OAUTH_BOX_CLIENT_SECRET, callback_url + event.path.serviceType ,state_uuid);
// //     //     }
// //     //     else if (event.path.serviceType == 'skydrive') {
// //     //         storage_client = new cloudrail.services.OneDrive(//connect url (browser must redirect here)
// //     //             authenticator
// //     //             , process.env.OAUTH_SKYDRIVE_CLIENT_KEY, process.env.OAUTH_SKYDRIVE_CLIENT_SECRET, callback_url + event.path.serviceType ,state_uuid);
// //     //     }
// //     //
// //     //     //the authenticator won't get called until a method is called on the client, so lets do that now
// //     //     storage_client.getUserLogin(function(err){});
// //     // },
// //     // callback: function(event, context, cb){
// //     //     context.callbackWaitsForEmptyEventLoop = false
// //     //
// //     //     function authenticator(url,state,auth_cb){
// //     //         var query_str = Object.keys(event.query).map(function(key) {
// //     //             return key + '=' + event.query[key];
// //     //         }).join('&');
// //     //
// //     //         var callback_full_url = callback_url + event.path.serviceType + '?' + query_str;
// //     //         console.log(">>> GEN CALLBACK_URL");
// //     //         console.log(callback_full_url)
// //     //         auth_cb(undefined, callback_full_url)
// //     //     }
// //     //
// //     //
// //     //     var storage_client = null;
// //     //     if (event.path.serviceType == 'dropbox') {
// //     //         storage_client = new cloudrail.services.Dropbox(//connect url (browser must redirect here)
// //     //             authenticator
// //     //             , process.env.OAUTH_DROPBOX_CLIENT_KEY, process.env.OAUTH_DROPBOX_CLIENT_SECRET, callback_url + event.path.serviceType, 'state');
// //     //     }
// //     //     else if (event.path.serviceType == 'google') {
// //     //         storage_client = new cloudrail.services.GoogleDrive(//connect url (browser must redirect here)
// //     //             authenticator
// //     //             , process.env.OAUTH_GOOGLE_CLIENT_KEY, process.env.OAUTH_GOOGLE_CLIENT_SECRET, callback_url + event.path.serviceType ,'state');
// //     //     }
// //     //     else if (event.path.serviceType == 'box') {
// //     //         storage_client = new cloudrail.services.Box(//connect url (browser must redirect here)
// //     //             authenticator
// //     //             , process.env.OAUTH_BOX_CLIENT_KEY, process.env.OAUTH_BOX_CLIENT_SECRET, callback_url + event.path.serviceType ,'state');
// //     //     }
// //     //     else if (event.path.serviceType == 'skydrive') {
// //     //         storage_client = new cloudrail.services.OneDrive(//connect url (browser must redirect here)
// //     //             authenticator
// //     //             , process.env.OAUTH_SKYDRIVE_CLIENT_KEY, process.env.OAUTH_SKYDRIVE_CLIENT_SECRET, callback_url + event.path.serviceType ,'state');
// //     //     }
// //     //     console.log(">>> STORAGE_CLINT CREATED..");
// //     //
// //     //     // DBService.get()
// //     //     //     .then(function(db_client) {
// //     //     //         return db_client.table('login_sessions').first().where({id: event.query.state})
// //     //     //     })
// //     //     //     .then(function(db_row_data){
// //     //     //         console.log("AUTH DATA:")
// //     //     //         console.dir(db_row_data.auth_data)
// //     //             var deferred = q.defer();
// //     //             storage_client.getUserLogin(function(res_err){
// //     //                 console.log(">> FINISHED RESUME LOGIN")
// //     //                 console.dir(arguments)
// //     //                 if(res_err) return deferred.reject(res_err);
// //     //
// //     //                 console.log("TRYING TO SAVE OAUTH keys");
// //     //                 deferred.resolve({
// //     //                     oauth: storage_client.saveAsString()
// //     //                 });
// //     //                 //
// //     //                 // storage_client.getUserLogin(function(id_err, userId){
// //     //                 //     console.log(">> FINISHED getUserLogin")
// //     //                 //     console.dir(arguments)
// //     //                 //     if(id_err) return deferred.reject(id_err);
// //     //                 //
// //     //                 //     deferred.resolve({
// //     //                 //         id: userId,
// //     //                 //         data: storage_client.saveAsString()
// //     //                 //     })
// //     //                 // })
// //     //             });
// //     //             return deferred.promise
// //     //         // })
// //     //         .then(function(data){
// //     //             // console.log(">>>>> DESTROYING DB")
// //     //             // return DBService.destroy().then(function(){
// //     //             //     console.log(">>>> FINISHED DB TRANSACTION SUCCESSFULLY")
// //     //             //     console.dir(data)
// //     //
// //     //                 return cb(null, data)
// //     //
// //     //             // })
// //     //         })
// //     //         .fail(function(err){
// //     //             console.log(">>>> FINISHED DB TRANSACTION WITH ERROR")
// //     //             console.log(err.toString())
// //     //             console.log(err.stack)
// //     //             cb(null, err.toString())
// //     //         })
// //     //         .done()
// //     // }
// // }