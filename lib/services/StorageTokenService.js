/**
 * In the Data Browser, set the Class Permissions for these 2 classes to
 *   disallow public access for Get/Find/Create/Update/Delete operations.
 * Only the master key should be able to query or write to these classes.
 *
 */
var q = require('q');

var StorageTokenRequest = sails.config.Parse.Object.extend("StorageTokenRequest");


var tokenService = exports;
tokenService.StorageTokenRequest = StorageTokenRequest;
tokenService.createTokenRequest = function(user_id, storage_type){
	console.log('token request', user_id);
	var tokenRequest = new StorageTokenRequest();
	tokenRequest.setACL(SecurityService.adminOnlyAcl());
	tokenRequest.set('user', user_id);
	tokenRequest.set('storage_type', storage_type);
	return tokenRequest.save(null, { useMasterKey: true })
};


tokenService.acceptTokenRequest = function(req, service_type, cb){
	var query = new sails.config.Parse.Query('StorageTokenRequest');
	//sails.config.Parse.Cloud.useMasterKey();
	return q(query.get(req.query.state,{ useMasterKey: true }))
		.then(function(obj) {
			console.log('Destroy the StorageTokenRequest before continuing.');
			var user_id = obj.get('user')
			var genericProvider = sails.config.filefog.provider(service_type);
			return obj.destroy({ useMasterKey: true })
				.then(function() {
					// Validate & Exchange the code parameter for an access token from GitHub
					console.log('Exchange the token.')
					return genericProvider.oAuthGetAccessToken(req.query.code || req.body.code)
				})
				.then(function (oauth) {
					return genericProvider.getClient(oauth)
						.then(function(client){
							return client.accountInfo()
								.then(function(account_info){
									console.log('oauth data:',JSON.stringify(oauth));
									//throw "error";
									return cb(client, user_id, service_type, oauth, account_info)
								})
						})

				})
		})
}