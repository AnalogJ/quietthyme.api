'use strict';
const debug = require('debug')('quietthyme:KloudlessService');
var q = require('q');
var nconf = require('../common/nconf');
var kloudless = require('kloudless')(nconf.get('KLOUDLESS_API_KEY'));
var request = require('request');

var kloudlessService = exports;

kloudlessService.folderCreate = function(
  account_id,
  name,
  parent_id,
  service_type
) {
  if (
    service_type == 'dropbox' &&
    parent_id == 'root' &&
    name == 'QuietThyme'
  ) {
    //dropbox app is sandboxed, no need to create a QuietThyme folder.
    return q({ id: 'root', raw_id: 'root', path_id: 'root' });
  }

  var deferred = q.defer();
  kloudless.folders.create(
    {
      account_id: account_id,
      parent_id: parent_id || 'root',
      name: name,
    },
    function(err, res) {
      if (err) return deferred.reject(err);
      return deferred.resolve(res);
    }
  );

  if (service_type == 'dropbox') {
    //the kloudless dropbox integration has 2 different identifiers, 1 for the DB static ID and one for the path ID.
    //we have to generate both.
    return deferred.promise.then(function(folder_metadata) {
      console.info('Converting Dropbox Id:', folder_metadata.path);
      return kloudlessService
        .convertId(account_id, folder_metadata.path)
        .then(function(convert_data) {
          debug('Conversion response: %o', convert_data);
          folder_metadata.path_id = convert_data.id;
          return folder_metadata;
        });
    });
  } else {
    return deferred.promise;
  }
};

kloudlessService.folderGet = function(account_id, folder_identifier) {
  var deferred = q.defer();
  kloudless.folders.get(
    { account_id: account_id, folder_id: folder_identifier },
    function(err, res) {
      if (err) return deferred.reject(err);
      return deferred.resolve(res);
    }
  );

  return deferred.promise;
};

kloudlessService.fileUpload = function(
  bearer_token,
  account_id,
  filename,
  parent_id,
  storage_identifier
) {
  var deferred = q.defer();

  //the kloudless-node sdk has issues with file uploads, and is missing ability to pass only url param to endpoint
  var options = {
    url:
      'https://api.kloudless.com/v1/accounts/' + account_id + '/storage/files',
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + bearer_token,
    },
    json: {
      name: filename,
      parent_id: parent_id,
      url: 'https://s3.amazonaws.com/' + storage_identifier,
    },
  };
  //TODO: should we use  "X-Kloudless-Async: true" header to ensure that large file uploads
  //dont time out? https://developers.kloudless.com/docs/v1/storage#files-upload-a-file
  request(options, function(error, response, body) {
    if (error) {
      return deferred.reject(error);
    }
    return deferred.resolve(body);
  });

  return deferred.promise;
};

kloudlessService.fileContents = function(
  account_id,
  file_identifier,
  out_filestream
) {
  var deferred = q.defer();
  var options = {
    url:
      'https://api.kloudless.com/v1/accounts/' +
      account_id +
      '/storage/files/' +
      file_identifier +
      '/contents',
    method: 'GET',
    headers: {
      Authorization: 'ApiKey ' + nconf.get('KLOUDLESS_API_KEY'),
    },
  };
  request(options).pipe(out_filestream).on('finish', function() {
    return deferred.resolve({});
  });

  return deferred.promise;
};

kloudlessService.fileMove = function(
  account_id,
  identifier,
  dest_parent_id,
  dest_filename
) {
  var payload = {
    account_id: account_id,
    file_id: identifier,
    parent_id: dest_parent_id,
  };
  if (dest_filename) {
    payload['name'] = dest_filename;
  }
  var deferred = q.defer();
  kloudless.files.move(payload, function(err, res) {
    if (err) return deferred.reject(err);
    return deferred.resolve(res);
  });
  return deferred.promise;
};

kloudlessService.convertId = function(account_id, identifier, type) {
  var deferred = q.defer();

  //the kloudless encrypts & encodes the service id into their own.
  var options = {
    url:
      'https://api.kloudless.com/v1/accounts/' +
      account_id +
      '/storage/convert_id',
    method: 'POST',
    headers: {
      Authorization: 'ApiKey ' + nconf.get('KLOUDLESS_API_KEY'),
    },
    json: {
      raw_id: identifier,
      type: type || 'folder',
    },
  };

  request(options, function(error, response, body) {
    if (error) {
      return deferred.reject(error);
    }
    return deferred.resolve(body);
  });

  return deferred.promise;
};

kloudlessService.eventsGet = function(account_id, event_cursor) {
  debug(
    'Get Kloudless events from account (%s) at cursor: %s',
    account_id,
    event_cursor
  );
  var deferred = q.defer();
  kloudless.events.get(
    {
      account_id: account_id,
      queryParams: {
        cursor: event_cursor || 'after-auth',
      },
    },
    function(err, res) {
      if (err) return deferred.reject(err);
      return deferred.resolve(res);
    }
  );
  return deferred.promise;
};

kloudlessService.linkCreate = function(account_id, file_id) {
  var deferred = q.defer();
  kloudless.links.create(
    {
      account_id: account_id,
      file_id: file_id,
      direct: true,

      // queryParams: {
      //     //TODO: set expiry to 10 minutes
      //     //expiration: ISO 8601 timestamp specifying when the link expires.
      // }
    },
    function(err, res) {
      if (err) return deferred.reject(err);
      return deferred.resolve(res);
    }
  );
  return deferred.promise;
};

//Get the folder's ancestors, all the way back to the root.
// if response.ancestors is ever populated, we're just going to concat that with the current list and return
kloudlessService.folderAncestors = function(
  account_id,
  folder_id,
  ancestors_list
) {
  if (!ancestors_list) {
    ancestors_list = [];
  }
  return kloudlessService
    .genericRetry(kloudlessService.folderGet, [account_id, folder_id])
    .then(function(res) {
      if (res.ancestors) {
        console.log('Found ancestors list, returning');
        return ancestors_list.concat(res.ancestors);
      } else if (res.parent) {
        ancestors_list.push(res.parent);

        if (res.parent.id != 'root') {
          return kloudlessService.folderAncestors(
            account_id,
            res.parent.id,
            ancestors_list
          );
        } else {
          //the parent of this folder is root, we can return the current list
          return ancestors_list;
        }
      }

      return ancestors_list;
    });
};

// Generic Kloudless retry method.
kloudlessService.genericRetry = function(
  kloudlessServicePromiseFunction,
  functionArgs,
  retry
) {
  if (typeof retry === 'undefined') {
    retry = 5;
  }

  var promise = kloudlessServicePromiseFunction.apply(
    kloudlessService,
    functionArgs
  );

  return promise.fail(function(err) {
    //check if this is a retry-able error, with a
    var response = err.raw.response;
    // console.log("error:", JSON.stringify(err));
    console.log(`type: ${err.type}, statusCode: ${response.statusCode}`);

    if (
      err.type == 'KloudlessAPIError' &&
      response.statusCode == 429 &&
      retry >= 0
    ) {
      //we should retry this request, after the Retry-After header has elapsed.

      //Retry-After: If the error is due to rate limiting, this provides the time in seconds to
      // wait before retrying the request. If the upstream service does not provide this information,
      // this header will not be present. The status code for this error response will be 429.
      var seconds = response.headers['retry-after'] | 0; //convert to integer
      if (seconds == 0) {
        seconds = 1; //wait one second if the retry-after header is not present.
      }
      console.log(
        `Retrying fileMove request. Retries left: #${retry}, Waiting ${seconds} seconds`
      );
      return q.delay(seconds * 1000).then(function() {
        return kloudlessService.genericRetry(
          kloudlessServicePromiseFunction,
          functionArgs,
          retry - 1
        );
      });
    } else {
      return q.reject(err);
    }
  });
};
