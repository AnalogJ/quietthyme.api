'use strict';
require('dotenv').config();
var crypto = require('crypto');
var HttpError = require('./common/HttpError');

module.exports.kloudless = (event, context, callback) => {

    //this function should do the following:
    //immediately validate if this is an authenticated callback.
    //retrieve the current cursor and and then do a request for the latest events
    //store the new cursor in the db
    //begin filtering the events, and start invoking new lambda's


    //check if this is a valid callback.
    var kloudless_signature_header = event.headers['X-Kloudless-Signature']
    if(!kloudless_signature_header){
        console.log('invalid - missing x-kloudless-signature header')
        return callback(new Error('[400] Invalid webhook request'))
    }

    var crypto = require('crypto');
    var hash = crypto.createHmac('SHA256', process.env.KLOUDLESS_API_KEY).update(event.body).digest('base64');

    if(hash != kloudless_signature_header){
        console.log('invalid - signature headers dont match', hash, kloudless_signature_header);
        return callback(new Error('[400] Invalid webhook request'))
    }





    //response should always be kloudless API id.
    return callback(null, {
        statusCode: 200,
        body: process.env.KLOUDLESS_API_ID
    });
};
