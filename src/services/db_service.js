'use strict';
const debug = require('debug')('quietthyme:DBService');
var q = require('q');
var Constants = require('../common/constants');
var nconf = require('../common/nconf');
// from http://www.dancorman.com/knex-your-sql-best-friend/
// http://blog.rowanudell.com/database-connections-in-lambda/
// http://theburningmonk.com/2016/05/aws-lambda-constant-timeout-when-using-bluebird-promise/ - ugh is this the reason that cloudrails is timing out?1

var AWS = require("aws-sdk");

if(!nconf.get('STAGE')){
    throw new Error('STAGE not provided!');
}
if(nconf.get('STAGE') == 'test'){
    AWS.config.update({
        endpoint: "http://"+nconf.get('TEST_DATABASE_HOSTNAME')+":6001"
    });
}

var docClient = new AWS.DynamoDB.DocumentClient();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// General Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function listTables(){
    var db_deferred = q.defer();
    var db = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    db.listTables(function(err, data) {
        if (err)  return db_deferred.reject(err);

        return db_deferred.resolve(data.TableNames);
    });
    return db_deferred.promise
}
module.exports.listTables = listTables;

function populateTables(){
    var db_deferred = q.defer();
    var db = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    db.listTables(function(err, data) {
        if (err)  return db_deferred.reject(err);

        return db_deferred.resolve(data.TableNames);
    });
    return db_deferred.promise
}
module.exports.populateTables = populateTables;




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// User Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function findUser(email){
    var params = {
        TableName : Constants.tables.users,
        KeyConditionExpression: "ServiceType = :serviceType and Username = :username",
        ExpressionAttributeValues: {
            ":serviceType":auth.ServiceType,
            ":username": auth.Username
        }
    };
    var db_deferred = q.defer();
    docClient.query(params, function(err, data) {
        if (err)  return db_deferred.reject(err);

        return db_deferred.resolve(data.Items[0]);
    });
    return db_deferred.promise
}







// var knex_config = require('../../knexfile.js');
// var knex        = null;
//
// module.exports = {
//     get: function(){
//         if(knex){
//             return q(knex)
//         }
//         else{
//             knex = require('knex')(knex_config[process.env.STAGE]);
//             knex.client.initializePool(knex.client.config);
//             return q(knex)
//         }
//     },
//     destroy: function(){
//         if(knex){
//             return knex.destroy()
//                 .then(function(){
//                     knex = null
//                 })
//         }
//         else{
//             return q({})
//         }
//     }
// };

// knex.migrate.latest([config]);