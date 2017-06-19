'use strict';
const debug = require('debug')('quietthyme:DBService');
var q = require('q');
var Constants = require('../common/constants');
var nconf = require('../common/nconf');
var uuid = require('node-uuid');

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

var docClient = new AWS.DynamoDB.DocumentClient({
    convertEmptyValues: true
});

var dbService = exports;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// General Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

dbService.listTables = function(){
    var db_deferred = q.defer();
    var db = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    db.listTables(function(err, data) {
        if (err)  return db_deferred.reject(err);

        return db_deferred.resolve(data.TableNames);
    });
    return db_deferred.promise
}

dbService.createTable = function(params){
    var db_deferred = q.defer();
    var db = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    db.createTable(params, function(err, data) {
        if (err)  return db_deferred.reject(err);
        return db_deferred.resolve(data);
    });
    return db_deferred.promise
}

dbService.deleteTable = function(params){
    var db_deferred = q.defer();
    var db = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    db.deleteTable(params, function(err, data) {
        if (err)  return db_deferred.reject(err);
        return db_deferred.resolve(data);
    });
    return db_deferred.promise
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// User Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

dbService.findUserById = function(user_id){
    var params = {
        TableName : Constants.tables.users,
        KeyConditionExpression: "user_id = :user_id",
        ExpressionAttributeValues: {
            ":user_id": user_id
        }
    };
    var db_deferred = q.defer();
    docClient.query(params, function(err, data) {
        if (err)  return db_deferred.reject(err);

        return db_deferred.resolve(data.Items[0]);
    });
    return db_deferred.promise
}

dbService.findUserByEmail = function(email){
    var params = {
        TableName : Constants.tables.users,
        IndexName: 'emailIndex',
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
            ":email": email
        }
    };
    var db_deferred = q.defer();
    docClient.query(params, function(err, data) {
        if (err)  return db_deferred.reject(err);

        return db_deferred.resolve(data.Items[0]);
    });
    return db_deferred.promise
}

dbService.findUserByCatalogToken = function(catalog_token){
    var params = {
        TableName : Constants.tables.users,
        IndexName: 'catalogIndex',
        KeyConditionExpression: "catalog_token = :catalog_token",
        ExpressionAttributeValues: {
            ":catalog_token": catalog_token
        }
    };
    var db_deferred = q.defer();
    docClient.query(params, function(err, data) {
        if (err)  return db_deferred.reject(err);

        return db_deferred.resolve(data.Items[0]);
    });
    return db_deferred.promise
}

dbService.createUser = function(user /* DBSchema.User */){
    user.user_id = uuid.v4()
    var params = {
        TableName:Constants.tables.users,
        Item: user
    };
    var db_deferred = q.defer();
    docClient.put(params, function(err, data) {
        if (err)  return db_deferred.reject(err);
        delete user.password_hash;
        delete user.stripe_sub_id;
        return db_deferred.resolve(user);
    });
    return db_deferred.promise
}

dbService.updateUserPlan = function(user_id, plan, stripe_sub_id){
    var params = {
        TableName:Constants.tables.users,
        Key: { user_id : user_id },
        UpdateExpression: 'set #plan = :plan, #stripe_sub_id = :stripe_sub_id',
        ExpressionAttributeNames: {'#plan' : 'plan', '#stripe_sub_id': 'stripe_sub_id'},
        ExpressionAttributeValues: {
            ':plan' : plan,
            ':stripe_sub_id': stripe_sub_id
        }
    };
    var db_deferred = q.defer();
    docClient.update(params, function(err, data) {
        if (err)  return db_deferred.reject(err);
        return db_deferred.resolve(data);
    });
    return db_deferred.promise
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Credential Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

dbService.createCredential = function(credential /* DBSchema.Credential */){
    credential.id = uuid.v4()

    var params = {
        TableName:Constants.tables.credentials,
        Item: credential
    };
    var db_deferred = q.defer();
    docClient.put(params, function(err, data) {
        if (err)  return db_deferred.reject(err);
        return db_deferred.resolve(credential);
    });
    return db_deferred.promise
};

dbService.findCredentialById = function(credential_id){
    var params = {
        TableName : Constants.tables.credentials,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
            ":id": credential_id
        }
    };
    var db_deferred = q.defer();
    docClient.query(params, function(err, data) {
        if (err)  return db_deferred.reject(err);
        return db_deferred.resolve(data.Items[0]);
    });
    return db_deferred.promise
};

dbService.updateCredential = function(credential_id, update_data){
    var update_expression = [];
    var expression_attribute_names = {};
    var expression_attribute_values = {};
    for(var prop in update_data){
        update_expression.push('#' + prop + ' = :' + prop)
        expression_attribute_names['#'+prop] = prop;
        expression_attribute_values[':'+prop] = update_data[prop]
    }

    var params = {
        TableName:Constants.tables.credentials,
        Key: { id : credential_id },
        UpdateExpression: 'set ' + update_expression.join(', '),
        ExpressionAttributeNames: expression_attribute_names,
        ExpressionAttributeValues: expression_attribute_values
    };
    var db_deferred = q.defer();
    docClient.update(params, function(err, data) {
        if (err)  return db_deferred.reject(err);
        return db_deferred.resolve(data);
    });
    return db_deferred.promise
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Book Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

dbService.createBook = function(book /* DBSchema.Book */){
    book.id = uuid.v4();

    var params = {
        TableName:Constants.tables.books,
        Item: book
    };
    var db_deferred = q.defer();
    docClient.put(params, function(err, data) {
        if (err)  return db_deferred.reject(err);
        return db_deferred.resolve(book);
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