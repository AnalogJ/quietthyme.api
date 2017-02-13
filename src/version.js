'use strict';
require('dotenv').config();

module.exports.handler = (event, context, callback) => {

    var kloudless = require('kloudless')(process.env.KLOUDLESS_API_KEY);

    kloudless.folders.create({
        account_id: '231987328',
        parent_id: 'root',
        name: 'QUIETTHYME'
    }, function(err, res){
        if (err) return callback(err, null)
        return callback(null, res)
    })


    // var versionInfo = {
    //     'deploySha': process.env.DEPLOY_SHA
    // }
    //
    // return callback(null, versionInfo);

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
