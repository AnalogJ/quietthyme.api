'use strict';
const debug = require('debug')('quietthyme:hook');

var crypto = require('crypto');
var q = require('q');
var DBService = require('./services/db_service');
var KloudlessService = require('./services/kloudless_service');
var MailService = require('./services/mail_service');
var Utilities = require('./common/utilities');
var Constants = require('./common/constants');
var path = require('path');
var nconf = require('./common/nconf');
var aws = require('aws-sdk');
var lambda = new aws.Lambda();

var HookEndpoint = module.exports;

HookEndpoint.router = function(event, context, cb) {
  debug('HookEndpoint router event: %o', event);
  if (
    event.pathParameters.action == 'kloudless' &&
    event.httpMethod == 'POST'
  ) {
    HookEndpoint.kloudless(event, context, cb);
  } else if (event.pathParameters.action == 'mailchimp') {
    HookEndpoint.mailchimp(event, context, cb);
  } else {
    Utilities.errorHandler(cb)(
      new Error(`Unknown API endpoint: ${event.pathParameters.action}`)
    );
  }
};

HookEndpoint.kloudless = function(event, context, cb) {
  //check if this is a valid callback.
  debug('Kloudless hook data: %o', event);
  var kloudless_signature_header = event.headers['X-Kloudless-Signature'];
  if (!kloudless_signature_header) {
    console.error('invalid - missing x-kloudless-signature header');
    return cb({ statusCode: 400, body: 'Invalid webhook request' }, null);
  }

  //immediately validate if this is an authenticated callback.
  var hash = crypto
    .createHmac('SHA256', nconf.get('KLOUDLESS_API_KEY'))
    .update(event.body || '')
    .digest('base64');
  if (hash != kloudless_signature_header) {
    console.error(
      'invalid - signature headers dont match',
      hash,
      kloudless_signature_header
    );
    return cb({ statusCode: 400, body: 'Invalid signatures dont match' }, null);
  }

  if (!event.body) {
    //this is a test request, just return an empty payload.
    return cb(null, {
      statusCode: 200,
      body: nconf.get('KLOUDLESS_API_ID'),
    });
  }
  console.log('Processing Kloudless events:', event.body);
  //retrieve the current cursor and and then do a request for the latest events
  //http://docs.aws.amazon.com/amazondynamodb/latest/gettingstartedguide/GettingStarted.NodeJs.03.html#GettingStarted.NodeJs.03.05
  //https://en.wikipedia.org/wiki/Read-modify-write
  DBService.atomicCredentialCursorEvents(event.body.split('=')[1], 5)
    .spread(function(events, credential) {
      console.log(
        `Processing ${credential.service_type} events from credential: ${credential.id}`
      );

      var blackhole_folder = credential.blackhole_folder;
      //begin filtering the events, and start invoking new lambda's

      // folder events with metadata that we have available
      var filtered_events = events.objects.filter(function(kl_event) {
        //we only care about add, move, copy actions (all others are ignorable)
        if (
          !(
            kl_event.type == 'add' ||
            kl_event.type == 'move' ||
            kl_event.type == 'copy'
          )
        ) {
          debug(
            'SKIPPING (invalid type): %s %s %o',
            kl_event.type,
            kl_event.metadata.path || kl_event.metadata.name,
            kl_event.metadata
          );
          return false;
        }

        if (kl_event.metadata.type != 'file') {
          debug(
            'SKIPPING (not a file): %s %s',
            kl_event.metadata.type,
            kl_event.metadata.path || kl_event.metadata.name
          );
          return false;
        }

        //we only care about certain file extensions (ones we can process)
        var ext = path.extname(kl_event.metadata.name).split('.').join(''); //safe way to remove '.' prefix, even on empty string.

        if (!Constants.file_extensions[ext]) {
          //lets log the files that we don't process in the blackhole folder
          console.error(
            'SKIPPING (invalid ext):',
            ext,
            kl_event.account,
            kl_event.metadata.path || kl_event.metadata.name
          );
          return false;
        }

        //we're left with only the files that were added, moved, copied, but we don't yet know where they are located. thats the next step.
        return true;
      });

      // we still need to validate that the events are in the blackhole folder. Unfortunately events are not guaranteed to contain the
      // ancestors of the file, so we'll need to look the ancestors up for each file, and filter out any files that are in a
      // subdirectory of the blackhole folder

      //we're not going to do this in parallel because then we'd probalby hit rate limits on kloudless & the upstream cloud api.
      // so instead we'll process each file (and its ancestors one by one)
      return (filtered_events
          .reduce(function(blackhole_filtered_events, kl_event) {
            if (
              kl_event.metadata.parent.id == blackhole_folder.id ||
              kl_event.metadata.parent.id == blackhole_folder.path_id
            ) {
              //this must be pathid, not raw_id.
              //this file was directly placed in the blackhole folder, we need to keep it.
              return blackhole_filtered_events.then(function(arr) {
                arr.push(kl_event);
                return arr;
              });
            } else {
              // we have to look up the file's ancestors, which will happen async, and then determine if one of the ancestor folders is the blackhole folder.
              return blackhole_filtered_events.then(function(arr) {
                return KloudlessService.folderAncestors(
                  credential.service_id,
                  kl_event.metadata.parent.id
                )
                  .then(function(ancestors_arr) {
                    for (let ancestor of ancestors_arr) {
                      if (
                        ancestor.id == blackhole_folder.id ||
                        ancestor.id == blackhole_folder.path_id
                      ) {
                        //this must be pathid, not raw_id.
                        arr.push(kl_event);
                        return arr;
                      }
                    }

                    // could not find an ancestor that matched the blackhole folder. skipping event.
                    debug(
                      'SKIPPING (no ancestor in blackhole folder): %s %o %o',
                      kl_event.metadata.path || kl_event.metadata.name,
                      ancestors_arr,
                      kl_event
                    );
                    return arr;
                  })
                  .fail(function(err) {
                    console.error(
                      "An error occurred while attempting to retrieve this books ancestors. We can't continue so we'll skip it and process it again later"
                    );
                    console.error('The failed event was:', kl_event);
                    console.error('The error message was::', err);

                    return arr;
                  });
              });
            }
          }, q([]))
          //TODO: cleanup empty directories on a schedule.

          .then(function(filtered_events) {
            // we should trigger new lambda invocations for each event we find.
            // http://stackoverflow.com/a/31745774
            var promises = filtered_events.map(function(kl_event) {
              var deferred = q.defer();
              console.info(
                'Added file to Queue:',
                kl_event.account,
                kl_event.metadata.path || kl_event.metadata.name
              );
              lambda.invoke(
                {
                  FunctionName:
                    'quietthyme-api-' +
                    nconf.get('STAGE') +
                    '-queueprocessunknownbook',
                  Payload: JSON.stringify(
                    {
                      credential_id: credential.id,
                      storage_identifier: kl_event.metadata.id,
                      filename: kl_event.metadata.name,
                    },
                    null,
                    2
                  ),
                  InvocationType: 'Event',
                },
                function(err, data) {
                  if (err) return deferred.reject(err);
                  return deferred.resolve(data.Payload);
                }
              );
              return deferred.promise;
            });

            return q.allSettled(promises);
          }) );
    })
    .then(function(promises) {
      console.dir(promises);
      //response should always be kloudless API id.
      return {
        statusCode: 200,
        body: nconf.get('KLOUDLESS_API_ID'),
      };
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};

HookEndpoint.mailchimp = function(event, context, cb) {
  //check if this is a valid callback.
  debug('Mailchimp hook data: %o', event);

  var promise = q({}); //this is the mailchimp validator.
  if (event.httpMethod == 'POST') {
    promise = promise
      .then(function() {
        //a new user subcribed to the mailchimp mailing list, lets send them the welcome email.
        var parsed = require('querystring').parse(event.body);
        return MailService.welcomeEmail(
          parsed['data[email]'],
          parsed['data[merges][FNAME]']
        )
        .then(function(info) {
          console.info('Sent welcome email to:' + parsed['data[email]']);
          debug('Mailgun response: %o', info);
        })
        .catch(function(err) {
          console.error(
            "An error occurred while attempting to send welcome email to new Mailchimp subscriber. Can't continue so we'll skip email"
          );
          console.error('The failed email was:', parsed['data[email]']);
          console.error('The error message was:', err);
        });
      })

  }
  promise
    .then(function() {
      return {
        statusCode: 200,
        body: '',
      };
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};

//TODO: stripe callback should be handled here.
