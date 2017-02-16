'use strict';
require('dotenv').config();

module.exports.handler = (event, context, callback) => {

    var versionInfo = {
        'deploySha': process.env.DEPLOY_SHA
    }

    return callback(null, versionInfo);
};
