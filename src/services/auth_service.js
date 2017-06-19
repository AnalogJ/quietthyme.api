'use strict';
/**
 * In the Data Browser, set the Class Permissions for these 2 classes to
 *   disallow public access for Get/Find/Create/Update/Delete operations.
 * Only the master key should be able to query or write to these classes.
 *
 */
var q = require('q');
const debug = require('debug')('quietthyme:AuthService');
var SecurityService = require('./security_service');
var DBService = require('./db_service')
var DBSchemas = require('../common/db_schemas')
var authService = exports;

authService.createEmailUser = function(name, email, password){
    return q.spread([SecurityService.generate_catalog_token(), SecurityService.hash_password(password)],
        function(catalog_token, password_hash){
            return DBService.createUser(DBSchemas.User({
                "name": name,
                "email": email,
                "password_hash": password_hash,
                "catalog_token": catalog_token
            }))
        })
};

authService.createCalibreUser = function(db_client, library_uuid){
    return SecurityService.generate_catalog_token()
        .then(function(catalog_token){
            return db_client('users')
                .insert({
                    "library_uuid": library_uuid,
                    "catalog_token": catalog_token
                })
        })
};
