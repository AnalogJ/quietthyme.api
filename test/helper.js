//todo: create any missing tables using before hook of mocha. clean up all tables after.
var should = require('should');
var DBService = require('../src/services/db_service')
var nconf = require('../src/common/nconf');

before(function(done){


    // These tables should match the tabels in cloudformation-resources.yml
    var usersTable = {
        AttributeDefinitions: [
            {
                AttributeName: "user_id",
                AttributeType: "S"
            },
            {
                AttributeName: "email",
                AttributeType: "S"
            },
            {
                AttributeName: "catalog_token",
                AttributeType: "S"
            }
        ],
        KeySchema: [
            {
                AttributeName: "user_id",
                KeyType: "HASH"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        },
        GlobalSecondaryIndexes: [
            {
                IndexName: "emailIndex",
                KeySchema: [
                    {
                        AttributeName: "email",
                        KeyType: "HASH"
                    }
                ],
                Projection: {
                    ProjectionType: "ALL"
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2
                },
            },
            {
                IndexName: "catalogIndex",
                KeySchema: [
                    {
                        AttributeName: "catalog_token",
                        KeyType: "HASH"
                    }
                ],
                Projection: {
                    ProjectionType: "ALL"
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2
                },
            }
        ],
        TableName: 'quietthyme-api-' + nconf.get('STAGE') + '-users'
    };

    var credsTable = {
        AttributeDefinitions: [
            {
                AttributeName: "id",
                AttributeType: "S"
            },{
                AttributeName: "service_id",
                AttributeType: "S"
            }
        ],
        KeySchema: [
            {
                AttributeName: "id",
                KeyType: "HASH"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        },
        GlobalSecondaryIndexes: [
            {
                IndexName: "serviceIdIndex",
                KeySchema: [
                    {
                        AttributeName: "service_id",
                        KeyType: "HASH"
                    }
                ],
                Projection: {
                    ProjectionType: "ALL"
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2
                },
            }
        ],
        TableName: 'quietthyme-api-' + nconf.get('STAGE') + '-credentials'
    };

    var booksTable = {
        AttributeDefinitions: [
            {
                AttributeName: "user_id",
                AttributeType: "S"
            },
            {
                AttributeName: "book_id",
                AttributeType: "S"
            }
        ],
        KeySchema: [
            {
                AttributeName: "user_id",
                KeyType: "HASH"
            },
            {
                AttributeName: "book_id",
                KeyType: "RANGE"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        },
        TableName: 'quietthyme-api-' + nconf.get('STAGE') + '-books'
    };

    DBService.createTable(usersTable)
        // .fail(function(){
        //     console.log("Users Table already exists")
        // })
        .then(function(){
            return DBService.createTable(credsTable)
        })
        // .fail(function(){
        //     console.log("Creds Table already exists")
        // })
        .then(function(){
            return DBService.createTable(booksTable)
        })
        // .fail(function(){
        //     console.log("Books Table already exists")
        // })
        .then(function(){})
        .then(done, done);
});

after(function(done) {
    var usersTable = {
        TableName: 'quietthyme-api-' + nconf.get('STAGE') + '-users'
    };

    var credsTable = {
        TableName: 'quietthyme-api-' + nconf.get('STAGE') + '-credentials'
    };

    var booksTable = {
        TableName: 'quietthyme-api-' + nconf.get('STAGE') + '-books'
    };

    DBService.deleteTable(usersTable)
        .fail(function(){
            console.log("Could not delete Users Table")
        })
        .then(function(){
            return DBService.deleteTable(credsTable)
        })
        .fail(function(){
            console.log("Could not delete Creds Table")
        })
        .then(function(){
            return DBService.deleteTable(booksTable)
        })
        .fail(function(){
            console.log("Could not delete Books Table")
        })
        .then(function(){})
        .then(done, done);
});

