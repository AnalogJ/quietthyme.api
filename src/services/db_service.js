'use strict';
const debug = require('debug')('quietthyme:DBService');
var q = require('q');
var Constants = require('../common/constants');
var Utilities = require('../common/utilities');
var nconf = require('../common/nconf');
var uuid = require('node-uuid');
var Base64Service = require('./base64_service');
var KloudlessService = require('./kloudless_service');
var DBSchemas = require('../common/db_schemas');

// from http://www.dancorman.com/knex-your-sql-best-friend/
// http://blog.rowanudell.com/database-connections-in-lambda/
// http://theburningmonk.com/2016/05/aws-lambda-constant-timeout-when-using-bluebird-promise/ - ugh is this the reason that cloudrails is timing out?1

var AWS = require('aws-sdk');

if (!nconf.get('STAGE')) {
  throw new Error('STAGE not provided!');
}
if (nconf.get('STAGE') == 'test') {
  AWS.config.update({
    endpoint: 'http://' + nconf.get('TEST_DYNAMODB_HOSTNAME') + ':6001',
  });
}

var docClient = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true,
});

var dbService = exports;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// General Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

dbService.listTables = function() {
  var db_deferred = q.defer();
  var db = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
  db.listTables(function(err, data) {
    if (err) return db_deferred.reject(err);

    return db_deferred.resolve(data.TableNames);
  });
  return db_deferred.promise;
};

dbService.createTable = function(params) {
  if (nconf.get('STAGE') != 'test') {
    throw new Error('Creating tables is only allowed in test environment.');
  }
  var db_deferred = q.defer();
  var db = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
  db.createTable(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(data);
  });
  return db_deferred.promise;
};

dbService.deleteTable = function(params) {
  if (nconf.get('STAGE') != 'test') {
    throw new Error('Deleting tables is only allowed in test environment.');
  }
  var db_deferred = q.defer();
  var db = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
  db.deleteTable(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(data);
  });
  return db_deferred.promise;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// User Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

dbService.findUserById = function(uid) {
  var params = {
    TableName: Constants.tables.users,
    KeyConditionExpression: 'uid = :uid',
    ExpressionAttributeValues: {
      ':uid': uid,
    },
  };
  var db_deferred = q.defer();
  docClient.query(params, function(err, data) {
    if (err) return db_deferred.reject(err);

    return db_deferred.resolve(data.Items[0]);
  });
  return db_deferred.promise;
};

dbService.findUserByEmail = function(email) {
  var params = {
    TableName: Constants.tables.users,
    IndexName: 'emailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email,
    },
  };
  var db_deferred = q.defer();
  docClient.query(params, function(err, data) {
    if (err) return db_deferred.reject(err);

    return db_deferred.resolve(data.Items[0]);
  });
  return db_deferred.promise;
};

dbService.findUserByCatalogToken = function(catalog_token) {
  var params = {
    TableName: Constants.tables.users,
    IndexName: 'catalogIndex',
    KeyConditionExpression: 'catalog_token = :catalog_token',
    ExpressionAttributeValues: {
      ':catalog_token': catalog_token,
    },
  };
  var db_deferred = q.defer();
  docClient.query(params, function(err, data) {
    if (err) return db_deferred.reject(err);

    return db_deferred.resolve(data.Items[0]);
  });
  return db_deferred.promise;
};

dbService.createUser = function(user) {
  try {
    user = DBSchemas.createUser(Utilities.stripEmpty(user));
  } catch (e) {
    return q.reject(e);
  }

  user.uid = uuid.v4();
  user.created_at = Utilities.ISODateString(new Date());
  user.updated_at = Utilities.ISODateString(new Date());
  var params = {
    TableName: Constants.tables.users,
    Item: user,
  };
  var db_deferred = q.defer();
  docClient.put(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    delete user.password_hash;
    delete user.stripe_sub_id;
    return db_deferred.resolve(user);
  });
  return db_deferred.promise;
};

dbService.updateUserPlan = function(uid, plan, stripe_sub_id) {
  var params = {
    TableName: Constants.tables.users,
    Key: { uid: uid },
    UpdateExpression:
      'set #plan = :plan, #stripe_sub_id = :stripe_sub_id, #updated_at = :updated_at',
    ExpressionAttributeNames: {
      '#plan': 'plan',
      '#stripe_sub_id': 'stripe_sub_id',
      '#updated_at': 'updated_at',
    },
    ExpressionAttributeValues: {
      ':plan': plan,
      ':stripe_sub_id': stripe_sub_id,
      ':updated_at': Utilities.ISODateString(new Date()),
    },
  };
  var db_deferred = q.defer();
  docClient.update(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(data);
  });
  return db_deferred.promise;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Credential Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var quietThymeStorageCredential = {
  id: 'quietthyme',
  service_type: 'quietthyme',
  service_id: 'quietthyme',
  oauth: {}
}

dbService.createCredential = function(credential /* DBSchema.Credential */) {
  try {
    credential = DBSchemas.createCredential(Utilities.stripEmpty(credential));
  } catch (e) {
    return q.reject(e);
  }

  credential.id = uuid.v4();
  credential.created_at = Utilities.ISODateString(new Date());
  credential.updated_at = Utilities.ISODateString(new Date());
  var params = {
    TableName: Constants.tables.credentials,
    Item: credential,
  };
  var db_deferred = q.defer();
  docClient.put(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(credential);
  });
  return db_deferred.promise;
};

dbService.findCredentialById = function(
  credential_id,
  user_id /* optional, but recommended */
) {
  //handle "quietthyme" credentials (always 0)
  if(credential_id == 'quietthyme'){
    return q(quietThymeStorageCredential)
  }

  var params = {
    TableName: Constants.tables.credentials,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': credential_id,
    },
  };
  if (user_id) {
    params.FilterExpression = 'user_id = :user_id';
    params.ExpressionAttributeValues[':user_id'] = user_id;
  }

  var db_deferred = q.defer();
  docClient.query(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(data.Items[0]);
  });
  return db_deferred.promise;
};

dbService.findCredentialByServiceId = function(service_id) {
  if(service_id == 'quietthyme'){
    return q(quietThymeStorageCredential)
  }
  var params = {
    TableName: Constants.tables.credentials,
    IndexName: 'serviceIdIndex',
    KeyConditionExpression: 'service_id = :service_id',
    ExpressionAttributeValues: {
      ':service_id': service_id,
    },
  };

  var db_deferred = q.defer();
  docClient.query(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(data.Items[0]);
  });
  return db_deferred.promise;
};

dbService.findCredentialsByUserId = function(user_id) {
  var params = {
    TableName: Constants.tables.credentials,
    IndexName: 'userIdIndex',
    KeyConditionExpression: 'user_id = :user_id',
    ExpressionAttributeValues: {
      ':user_id': user_id,
      // ":empty": ''
    },
  };

  var db_deferred = q.defer();
  docClient.query(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(data.Items);
  });
  return db_deferred.promise;
};

dbService.updateCredential = function(
  credential_id,
  update_data,
  return_values,
  conditional_update_data
) {
  try {
    update_data = DBSchemas.updateCredential(Utilities.stripEmpty(update_data));
  } catch (e) {
    return q.reject(e);
  }

  update_data.updated_at = Utilities.ISODateString(new Date());
  var update_expression = [];
  var expression_attribute_names = {};
  var expression_attribute_values = {};
  for (var prop in update_data) {
    update_expression.push('#' + prop + ' = :' + prop);
    expression_attribute_names['#' + prop] = prop;
    expression_attribute_values[':' + prop] = update_data[prop];
  }

  var params = {
    TableName: Constants.tables.credentials,
    Key: { id: credential_id },
    UpdateExpression: 'set ' + update_expression.join(', '),
    ExpressionAttributeNames: expression_attribute_names,
    ExpressionAttributeValues: expression_attribute_values,
  };
  if (return_values) {
    params.ReturnValues = 'ALL_NEW';
  }
  if (conditional_update_data) {
    // we're attempting to do an atomic write. ie, we need to make sure that the data we're updating hasn't changed
    // from under us.

    var condition_expression = [];
    for (var prop in conditional_update_data) {
      condition_expression.push('#cond' + prop + ' = :cond' + prop);
      expression_attribute_names['#cond' + prop] = prop;
      expression_attribute_values[':cond' + prop] =
        conditional_update_data[prop];
    }

    params.ConditionExpression = condition_expression.join(', ');
  }

  var db_deferred = q.defer();
  docClient.update(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(data.Attributes ? data.Attributes : {});
  });
  return db_deferred.promise;
};

dbService.atomicCredentialCursorEvents = function(serviceId, maxRetries) {
  if (maxRetries == 0) {
    debug('Error. Maximum retry limit reached');
    return q.reject('Error. Maximum retry limit reached');
  }

  return dbService
    .findCredentialByServiceId(serviceId)
    .then(function(credential) {
      return [
        KloudlessService.eventsGet(
          credential.service_id,
          credential.event_cursor
        ),
        credential,
      ];
    })
    .spread(function(kloudless_events, credential) {
      //store the new cursor in the db, only if we have the latest cursor.
      return [
        dbService
          .updateCredential(
            credential.id,
            { event_cursor: kloudless_events.cursor },
            true,
            { event_cursor: credential.event_cursor }
          )
          .then(function() {
            debug(
              'Attempting (%s) to update cursor from %s to %s',
              maxRetries,
              credential.event_cursor,
              kloudless_events.cursor
            );
            return kloudless_events;
          }),
        credential,
      ];
    })
    .fail(function(err) {
      debug('An error occured while updating cursor', err);
      return dbService.atomicCredentialCursorEvents(serviceId, maxRetries - 1);
    });
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Book Table Methods
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

dbService.createBook = function(book /* DBSchema.Book */) {
  try {
    book = DBSchemas.createBook(Utilities.stripEmpty(book));
  } catch (e) {
    return q.reject(e);
  }

  book.id = uuid.v4();
  book.created_at = Utilities.ISODateString(new Date());
  book.updated_at = Utilities.ISODateString(new Date());
  var params = {
    TableName: Constants.tables.books,
    Item: book,
  };
  var db_deferred = q.defer();
  docClient.put(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(book);
  });
  return db_deferred.promise;
};

dbService.findBookById = function(
  book_id,
  user_id /* optional, but recommended */
) {
  var params = {
    TableName: Constants.tables.books,
    KeyConditionExpression: 'id = :id AND user_id = :user_id',
    ExpressionAttributeValues: {
      ':id': book_id,
      ':user_id': user_id,
    },
  };
  var db_deferred = q.defer();
  docClient.query(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(data.Items[0]);
  });
  return db_deferred.promise;
};

dbService.findBooksByUserId = function(user_id) {
  // var params = {
  //     TableName : Constants.tables.books,
  //     KeyConditionExpression: "user_id = :user_id",
  //     ExpressionAttributeValues: {
  //         ":user_id": user_id
  //     }
  // };
  //
  // var db_deferred = q.defer();
  // docClient.query(params, function(err, data) {
  //     if (err)  return db_deferred.reject(err);
  //     return db_deferred.resolve(data.Items);
  // });
  // return db_deferred.promise
  return dbService.findBooks(user_id);
};

/*
This is the main function for retrieving books.
filter_data can be simple or complex.

simple_filter_data = {"storage_identifier" = "test-storage/identifier"}

complex_filter_data = {"authors":{"CONTAINS": "Jim Smith"}}


 */
dbService.findBooks = function(
  user_id,
  filter_data,
  page,
  limit,
  sort_by,
  reverse_direction
) {
  filter_data = filter_data || {};
  var filter_expression = [];
  var expression_attribute_names = {};
  var expression_attribute_values = {
    ':user_id': user_id,
  };
  for (var attribute_name in filter_data) {
    //handle complex queries
    var comparison = '=';
    if (typeof filter_data[attribute_name] === 'object') {
      var comparison = Object.keys(filter_data[attribute_name])[0];
      filter_expression.push(
        `${comparison}(#${attribute_name}, :${attribute_name})`
      );
    } else {
      filter_expression.push(
        `#${attribute_name} ${comparison} :${attribute_name}`
      );
    }

    expression_attribute_names['#' + attribute_name] = attribute_name;
    expression_attribute_values[':' + attribute_name] =
      comparison == '='
        ? filter_data[attribute_name]
        : filter_data[attribute_name][comparison];
  }

  var params = {
    TableName: Constants.tables.books,
    KeyConditionExpression: 'user_id = :user_id',
    ExpressionAttributeValues: expression_attribute_values,
    Limit: 20,
  };
  if (filter_data && Object.keys(filter_data).length != 0) {
    params.ExpressionAttributeValues = expression_attribute_values;
    params.ExpressionAttributeNames = expression_attribute_names;
    params.FilterExpression = filter_expression.join(' and ');
  }

  if (page) {
    //page should be a base64 url encoded JSON blob, lets decode it.
    params.ExclusiveStartKey = JSON.parse(Base64Service.urlDecode(page));
  }

  if (limit != null) {
    params.Limit = limit;
  }

  if (reverse_direction) {
    params.ScanIndexForward = false;
  }

  if (sort_by) {
    params.IndexName = sort_by + 'Sort';
  }

  var db_deferred = q.defer();
  docClient.query(params, function(err, data) {
    if (err) return db_deferred.reject(err);

    //transform data.
    var payload = {
      Items: data.Items,
      LastEvaluatedKey: Base64Service.urlEncode(
        JSON.stringify(data.LastEvaluatedKey)
      ),
    };

    return db_deferred.resolve(payload);
  });
  return db_deferred.promise;
};

dbService.updateBook = function(book_id, user_id, update_data, return_values) {
  try {
    update_data = DBSchemas.updateBook(Utilities.stripEmpty(update_data));
  } catch (e) {
    return q.reject(e);
  }

  update_data.updated_at = Utilities.ISODateString(new Date());
  var update_expression = [];
  var expression_attribute_names = {};
  var expression_attribute_values = {};
  for (var prop in update_data) {
    update_expression.push('#' + prop + ' = :' + prop);
    expression_attribute_names['#' + prop] = prop;
    expression_attribute_values[':' + prop] = update_data[prop];
  }

  var params = {
    TableName: Constants.tables.books,
    Key: { id: book_id, user_id: user_id },
    UpdateExpression: 'set ' + update_expression.join(', '),
    ExpressionAttributeNames: expression_attribute_names,
    ExpressionAttributeValues: expression_attribute_values,
  };
  if (return_values) {
    params.ReturnValues = 'ALL_NEW';
  }

  var db_deferred = q.defer();
  docClient.update(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(data.Attributes ? data.Attributes : {});
  });
  return db_deferred.promise;
};

dbService.deleteBookById = function(book_id, user_id) {
  var params = {
    TableName: Constants.tables.books,
    Key: {
      id: book_id,
      user_id: user_id,
    },
    // KeyConditionExpression: "id = :id AND user_id = :user_id",
    // ExpressionAttributeValues: {
    //     ":id": book_id,
    //     ":user_id": user_id
    // }
  };
  var db_deferred = q.defer();
  docClient.delete(params, function(err, data) {
    if (err) return db_deferred.reject(err);
    return db_deferred.resolve(data);
  });
  return db_deferred.promise;
};
