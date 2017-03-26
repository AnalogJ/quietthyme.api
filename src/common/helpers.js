'use strict';
var DBService = require('../services/DBService')
const debug = require('debug')('quietthyme:helpers')

module.exports = {


    successHandler: function(cb){
        var _cb = cb;
        return function(resp_data){
            debug("Returning Successful data: %o", resp_data)
            DBService.destroy().then(function(){
                return _cb(null, resp_data)
            })
        }
    },


    /*
    * Error handler can be used as follows:
    * var Helpers = require('../helpers');
    * Helpers.errorHandler(cb)(err)
    * or
    * Promise.fail(Helpers.errorHandler(cb))
    *
    * */
    errorHandler: function(cb){
        var _cb = cb;
        return function(err){
            if (typeof err === 'string'){
                //this is a string error message, wrap it in an error obj
                err = new Error(err)
            }
            else if(!err instanceof Error){
                //this is an object or something other than an error obj
                //do nothing for now.
            }

            if(!err.status && !err.code){
                err.code = 400;
            }

            var whitelisted_props = Object.getOwnPropertyNames(err)
            if (process.env.STAGE != 'beta'){
                whitelisted_props = ["message","status"]
            }

            console.error("Inside Error Handler:");
            console.dir(err) //make sure we log the full error message

            //prepend the error code infront of the message, so that it will be caught by the
            //serverless/lambda regex for errors
            err.message = `[${err.code}] ${err.message}`

            //added cleanup method for database, so that we dont timeout in Lambda
            console.error("Returning Failure data:", err)
            return DBService.destroy().then(function(){
                return _cb(JSON.stringify(err, whitelisted_props),null);
            })
        }
    }
}