'use strict';
const debug = require('debug')('quietthyme:hook');

var crypto = require('crypto');
var q = require('q');
var DBService = require('./services/db_service');
var KloudlessService = require('./services/kloudless_service');
var Utilities = require('./common/utilities');
var Constants = require('./common/constants');
var path = require('path');
var nconf = require('./common/nconf');
var aws = require('aws-sdk');
var lambda = new aws.Lambda();

module.exports.kloudless = function(event, context, cb){


    //check if this is a valid callback.
    debug("Kloudless hook data: %o", event);
    var kloudless_signature_header = event.headers['X-Kloudless-Signature'];
    if(!kloudless_signature_header){
        console.error('invalid - missing x-kloudless-signature header');
        return cb({statusCode: 400, body:'Invalid webhook request'}, null)
    }

    //immediately validate if this is an authenticated callback.
    var hash = crypto.createHmac('SHA256', nconf.get('KLOUDLESS_API_KEY')).update(event.body || '').digest('base64');
    if(hash != kloudless_signature_header){
        console.error('invalid - signature headers dont match', hash, kloudless_signature_header);
        return cb({statusCode: 400, body:'Invalid signatures dont match'}, null)
    }

    if(!event.body){
        //this is a test request, just return an empty payload.
        return cb(null, {
            statusCode: 200,
            body: nconf.get('KLOUDLESS_API_ID')
        });
    }


    //retrieve the current cursor and and then do a request for the latest events
    //http://docs.aws.amazon.com/amazondynamodb/latest/gettingstartedguide/GettingStarted.NodeJs.03.html#GettingStarted.NodeJs.03.05
    //https://en.wikipedia.org/wiki/Read-modify-write
    DBService.atomicCredentialCursorEvents(event.body.split('=')[1], 5)
        .spread(function(events, credential){
            var blackhole_folder = credential.blackhole_folder;
            //begin filtering the events, and start invoking new lambda's

            var filtered_events = events.objects.filter(function(kl_event){
                //we only care about add, move, copy actions (all others are ignorable)
                if (!(kl_event.type == 'add' || kl_event.type == 'move' || kl_event.type == 'copy')){
                    debug("SKIPPING (invalid type): %s %s", kl_event.account, kl_event.metadata.path);
                    return false;
                }

                //we only care about files in the blackhole_folder that we can download
                if (!(kl_event.metadata.type == 'file' && kl_event.metadata.downloadable &&
                    (kl_event.metadata.parent.id == blackhole_folder.id || kl_event.metadata.parent.id == blackhole_folder.path_id))){
                    debug("SKIPPING (invalid file/parent): %s %s", kl_event.account, kl_event.metadata.path);
                    return false;
                }

                //we only care about certain file extensions (ones we can process)
                var ext = path.extname(kl_event.metadata.name).split('.').join(''); //safe way to remove '.' prefix, even on empty string.

                if(!Constants.file_extensions[ext]){
                    //lets log the files that we don't process in the blackhole folder
                    console.error("SKIPPING (invalid ext):", kl_event.account, kl_event.metadata.path);
                    return false
                }

                //we're left with only the books that were added, moved, copied into the blackhole folder.
                return true
            });

            // we should trigger new lambda invocations for each event we find.
            // http://stackoverflow.com/a/31745774
            var promises = filtered_events.map(function(kl_event){
                var deferred = q.defer();
                console.info("Added file to Queue:", kl_event.account, kl_event.metadata.path);
                lambda.invoke({
                    FunctionName: 'quietthyme-api-' + nconf.get('STAGE') + '-queueprocessunknownbook',
                    Payload: JSON.stringify({
                        credential_id: credential.id,
                        storage_identifier: kl_event.metadata.id,
                        filename: kl_event.metadata.name
                    }, null, 2),
                    InvocationType: 'Event'
                }, function(err, data) {
                    if (err) return deferred.reject(err);
                    return deferred.resolve(data.Payload);
                });
                return deferred.promise
            });

            return q.allSettled(promises)
        })
        .then(function(promises){
            console.dir(promises);
            //response should always be kloudless API id.
            return {
                statusCode: 200,
                body: nconf.get('KLOUDLESS_API_ID')
            };
        })
        .then(Utilities.successHandler(cb))
        .fail(Utilities.errorHandler(cb))
        .done()
};


f