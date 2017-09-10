'use strict';
const debug = require('debug')('quietthyme:MailchimpService');
var q = require('q');
var nconf = require('../common/nconf');
var Mailchimp = require('mailchimp-api-v3')
var crypto = require('crypto');
var mailchimpService = module.exports;

mailchimpService.subscribeUser = function(
  email,
  first_name,
  last_name,
  user_id
) {
  if (nconf.get('STAGE') == 'test') {
    return q({})
  }

  var mailchimp = new Mailchimp(nconf.get("MAILCHIMP_API_KEY"));

  var hash = crypto.createHash('md5').update(email.toLowerCase()).digest("hex");
  var subscribePromise = mailchimp.put(`/lists/${nconf.get("MAILCHIMP_LIST_ID")}/members/${hash}`, {
    email_address: email,
    status: 'subscribed',
    merge_fields: {
      FNAME: first_name,
      LNAME: last_name,
      USERID: user_id
    }
  }).catch(function(){
    debug('could not add user to mailchimp list.');
    return {} //do nothing if an error occurs
  })

  return q(subscribePromise);
}