'use strict';
require('dotenv').config();
var crypto = require('crypto');
var q = require('q')
var DBService = require('./services/DBService');
var KloudlessService = require('./services/KloudlessService');
var Helpers = require('./common/helpers')

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
                .spread(function(events, credential){
                    //store the new cursor in the db
                    return db_client.where({id:credential.id}).update({event_cursor:events.cursor})
                        .then(function(){
                            return events;
                        })
                })
        })
        .then(function(events){
            //begin filtering the events, and start invoking new lambda's

            //TODO: add code to filer out events we can ignore, and then invoke.



            //response should always be kloudless API id.
            return cb(null, {
                statusCode: 200,
                body: process.env.KLOUDLESS_API_ID
            });
        })
        .then(Helpers.successHandler(cb))
        .fail(Helpers.errorHandler(cb))
        .done()





};
