'use strict';
/**
 * In the Data Browser, set the Class Permissions for these 2 classes to
 *   disallow public access for Get/Find/Create/Update/Delete operations.
 * Only the master key should be able to query or write to these classes.
 *
 */
var q = require('q');
const debug = require('debug')('quietthyme:AuthService');
var SecurityService = require('./SecurityService');

var authService = exports;

authService.createEmailUser = function(db_client, name, email, password){
    return q.spread([SecurityService.generate_catalog_token(), SecurityService.hash_password(password)],
        function(catalog_token, password_hash){
            return db_client('users')
                .returning(['uid', 'catalog_token','email'])
                .insert({
                    "name": name,
                    "email": email,
                    "password_hash": password_hash,
                    "catalog_token": catalog_token
                })
        })
};

authService.createCalibreUser = function(db_client, library_uuid){
    return SecurityService.generate_catalog_token()
        .then(function(catalog_token){
            return db_client('users')
                .insert({
                    "library_uuid": library_uuid,
                    "catalog_token": catalog_token
                })
        })
};


//
// authService.findUser = function(user_id){
//     var user_query = new sails.config.Parse.Query(sails.config.Parse.User);
//
//     return q(user_query.get(user_id,{ useMasterKey: true }));
// }
//
// //TODO: fix this function as a USER is required for this to work, only create/update credentials, DONT create new users.
// authService.upsertUserAndCredential = function(user_id, service_id, service_username, service_type, oauth_data, account_data, options){
//
//     /////////////////////////////////////////////////////
//     // Helper Functions
//     /////////////////////////////////////////////////////
//
//     //function createUserAndCredentialPromise(){
//     //    var user = new sails.config.Parse.User();
//     //
//     //    user.set("name", account_data.displayName);
//     //    user.set("email", account_data.email);
//     //    user.set("username", service_username || account_data.email || service_id);
//     //
//     //    var password = new Buffer(24);
//     //
//     //    _.times(24, function(i) {
//     //        password.set(i, _.random(0, 255));
//     //    });
//     //    user.set("password", password.toString('base64'));
//     //
//     //
//     //    return user.signUp()
//     //        .then(function(user){
//     //            return createCredentialPromise(user)
//     //        })
//     //}
//
//     function createCredentialPromise(_user_id){
//         var cred = new Credential();
//         cred.set('user', ParseService.pointer('_User',_user_id));
//         cred.set('service_type', service_type);
//         cred.set('service_username', service_username);
//         cred.set('service_id', service_id);
//         cred.set('oauth_data', oauth_data);
//         if(options){
//             cred.set('options', options)
//         }
//         cred.setACL(SecurityService.adminOnlyAcl());
//         // Use the master key because TokenStorage objects should be protected.
//         return cred.save(null, { useMasterKey: true })
//             .then(function(){
//                 return _user_id;
//             })
//     }
//
//     /////////////////////////////////////////////////////
//     // Authenticate vs Associate
//     /////////////////////////////////////////////////////
//     var authenticationPromise = null;
//     if(user_id){
//         console.log('user already exists, associate');
//         authenticationPromise = createCredentialPromise(user_id);
//     }
//     else{
//         throw "could not find token, should never get here."
//         //var query = new sails.config.Parse.Query(Credential);
//         //query.equalTo('service_id', service_id);
//         //query.equalTo('service_type', service_type);
//         //query.ascending('createdAt');
//         //
//         //console.log('Check if this service_id has previously logged in, using the master key')
//         //authenticationPromise = query.first({ useMasterKey: true })
//         //    .then(function(credential) {
//         //        console.log('cred', credential);
//         //        // Business Logic Functions
//         //        if (credential) {
//         //            //found crednetial, lookup the user in the database and return.
//         //            return credential.get('user');
//         //        }
//         //        else{
//         //            //no credential found. lookup the user by email if possible.
//         //            if(account_data.email){
//         //                var user_email_query = new sails.config.Parse.Query(sails.config.Parse.User);
//         //                user_email_query.equalTo('email', account_data.email);
//         //
//         //                return user_email_query.first({ useMasterKey: true })
//         //                    .then(function(user){
//         //                        if(user){
//         //                            return createCredentialPromise(user)
//         //                        }
//         //                        else{
//         //                            //create user and crednetial
//         //                            return createUserAndCredentialPromise()
//         //                        }
//         //                    })
//         //            }
//         //            else{
//         //                //create user and crednetial
//         //                return createUserAndCredentialPromise()
//         //            }
//         //        }
//         //    })
//     }
//     /////////////////////////////////////////////////////
//     // Complete
//     /////////////////////////////////////////////////////
//     return authenticationPromise
//
//         .then(function(user){
//             //login
//             return user
//         },function(err){
//             console.log("CATCHALL ERROR CALLED", err);
//             throw err;
//         })
//
// }