'use strict';
require('dotenv').config();
var crypto = require('crypto');
var q = require('q')
var DBService = require('./services/DBService');
var KloudlessService = require('./services/KloudlessService');
var Helpers = require('./common/helpers');
var Constants = require('./common/constants')
var path = require('path')

var aws = require('aws-sdk');
var lambda = new aws.Lambda();

module.exports.kloudless = function(event, context, cb){


    //check if this is a valid callback.
    console.dir(event)
    var kloudless_signature_header = event.headers['X-Kloudless-Signature']
    if(!kloudless_signature_header){
        console.log('invalid - missing x-kloudless-signature header')
        return cb({statusCode: 400, body:'Invalid webhook request'}, null)
    }

    //immediately validate if this is an authenticated callback.
    var hash = crypto.createHmac('SHA256', process.env.KLOUDLESS_API_KEY).update(event.body || '').digest('base64');
    if(hash != kloudless_signature_header){
        console.log('invalid - signature headers dont match', hash, kloudless_signature_header);
        return cb({statusCode: 400, body:'Invalid signatures dont match'}, null)
    }

    if(!event.body){
        //this is a test request, just return an empty payload.
        return cb(null, {
            statusCode: 200,
            body: process.env.KLOUDLESS_API_ID
        });
    }


    //retrieve the current cursor and and then do a request for the latest events
    DBService.get()
        .then(function(db_client){
            return db_client.first()
                .from('credentials')
                .where({
                    service_id: event.body.split('=')[1],
                })
                .then(function(credential){
                    return [KloudlessService.eventsGet(credential.service_id, credential.event_cursor), credential]
                })
                .spread(function(kloudless_events, credential){
                    //store the new cursor in the db
                    return [db_client('credentials')
                        .where({id:credential.id})
                        .update({event_cursor: kloudless_events.cursor})
                        .then(function(){
                            console.log("UPDATED CURSOR:",credential.event_cursor,  kloudless_events.cursor)
                            return kloudless_events;
                        }), credential.blackhole_folder_id]
                })
        })
        .spread(function(events, blackhole_folder_id){
            //begin filtering the events, and start invoking new lambda's

            var filtered_events = events.objects.filter(function(kl_event){
                //we only care about add, move, copy actions (all others are ignorable)
                if (!(kl_event.type == 'add' || kl_event.type == 'move' || kl_event.type == 'copy')){
                    console.log("SKIPPING (invalid type):", kl_event.account, kl_event.metadata.path)
                    return false;
                }

                //we only care about files in the blackhole_folder that we can download
                if (!(kl_event.metadata.type == 'file' && kl_event.metadata.parent.id == blackhole_folder_id && kl_event.metadata.downloadable)){
                    console.log("SKIPPING (invalid file/parent):", kl_event.account, kl_event.metadata.path)

                    //TODO: debugging
                    console.log('blackhole_folder_id',blackhole_folder_id)
                    console.dir(JSON.stringify(kl_event))
                    return false;
                }

                //we only care about certain file extensions (ones we can process)
                var ext = path.extname(kl_event.metadata.name).split('.').join('') //safe way to remove '.' prefix, even on empty string.

                if(!Constants.file_extensions[ext]){
                    //lets log the files that we don't process in the blackhole folde.r
                    console.log("SKIPPING (invalid ext):", kl_event.account, kl_event.metadata.path)
                    return false
                }

                //we're left with only the books that were added, moved, copied into the blackhole folder.
                return true
            })

            // we should trigger new lambda invocations for each event we find.
            // http://stackoverflow.com/a/31745774
            var promises = filtered_events.map(function(kl_event){
                var deferred = q.defer();
                console.log("QUEUED:", kl_event.account, kl_event.metadata.path)
                lambda.invoke({
                    FunctionName: 'quietthyme-api-' + process.env.STAGE + '-queueprocessunknownbook',
                    Payload: JSON.stringify(event, null, 2),
                    InvocationType: 'Event'
                }, function(err, data) {
                    if (err) return deferred.reject(err);
                    return deferred.resolve(data.Payload);
                })
                return deferred.promise
            })

            return q.allSettled(promises)
        })
        .then(function(){
            //response should always be kloudless API id.
            return {
                statusCode: 200,
                body: process.env.KLOUDLESS_API_ID
            };
        })
        .then(Helpers.successHandler(cb))
        .fail(Helpers.errorHandler(cb))
        .done()





};
