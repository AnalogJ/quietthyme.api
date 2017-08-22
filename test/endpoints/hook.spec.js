// var hookHandler = require('../../src/hook');
// var DBService = require('../../src/services/db_service');
// var SecurityService = require('../../src/services/security_service');
// var DBSchemas = require('../../src/common/db_schemas');
// var should = require('should');
//
// describe('Hook Endpoints', function () {
//     describe('#kloudless()', function () {
//         before(function(done){
//             var user = {
//                 "name": 'testplan',
//                 "email": 'kloudless-hook-user@example.com',
//                 "password_hash": 'testplanhash',
//                 "catalog_token": 'testplanhook'
//             };
//             DBService.createUser(DBSchemas.User(user))
//                 .then(function(user_data){
//                     var credential = {
//                         "user_id": user_data.uid,
//                         "service_type": 'dropbox',
//                         "service_id": '231987328',
//                         "email": 'test2@test.com',
//                         "oauth": {"test":"TEst"}
//                     };
//                     return DBService.createCredential(DBSchemas.Credential(credential))
//
//                 })
//                 .then(function(){})
//                 .delay(1000)//wait 1 sec for secondary index to catch up.
//                 .then(done, done);
//         });
//
//         it('should return an error if the kloudless header is missing', function(done){
//             var event={
//                 headers:{}
//             }
//             var context={};
//             function callback(ctx, data){
//                 ctx.should.eql({ statusCode: 400, body: 'Invalid webhook request' } )
//                 should.not.exist(data);
//                 done()
//             }
//             hookHandler.kloudless(event, context, callback)
//         })
//
//         it('should return an error if the kloudless header has invalid signature', function(done){
//             var event={
//                 headers:{'X-Kloudless-Signature': 'pQbFcs+MJ1uEXABcAk1qh/Etrf7kg7QQHA1Pb5XagbM='},
//                 body: 'hello=world'
//             }
//             var context={};
//             function callback(ctx, data){
//                 ctx.should.eql({ statusCode: 400, body: "Invalid signatures dont match" } )
//                 should.not.exist(data);
//                 done()
//             }
//             hookHandler.kloudless(event, context, callback)
//         })
//
//         it('should correctly process a kloudless hook @nock', function (done) {
//             this.timeout(5000)
//             var event={
//                 resource: '/hook/kloudless',
//                 path: '/beta/hook/kloudless',
//                 httpMethod: 'POST',
//                 headers: {
//                     'X-Kloudless-Signature': 'pQbFcs+MJ1uEXABcAk1qh/Etrf7kg7QQHA1Pb5XagbM='
//                 },
//                 queryStringParameters: null,
//                 pathParameters: null,
//                 stageVariables: null,
//                 requestContext: {
//                     path: '/beta/hook/kloudless',
//                     accountId: '450541372000',
//                     resourceId: 'c198qe',
//                     stage: 'beta',
//                     requestId: '92f3897f-594c-11e7-ade6-e1e35f9f920b',
//                     identity: {
//                         cognitoIdentityPoolId: null,
//                         accountId: null,
//                         cognitoIdentityId: null,
//                         caller: null,
//                         apiKey: '',
//                         sourceIp: '52.34.116.0',
//                         accessKey: null,
//                         cognitoAuthenticationType: null,
//                         cognitoAuthenticationProvider: null,
//                         userArn: null,
//                         userAgent: 'kloudless-webhook/1.0',
//                         user: null
//                     },
//                     resourcePath: '/hook/kloudless',
//                     httpMethod: 'POST',
//                     apiId: 'dhfadwcgih'
//                 },
//                 body: 'account=231987328',
//                 isBase64Encoded: false
//             };
//             var context={};
//             function callback(ctx, data){
//                 should.not.exist(ctx)
//                 data.should.eql( { statusCode: 200, body: '123' });
//                 done()
//             }
//             hookHandler.kloudless(event, context, callback)
//         })
//     })
// })
