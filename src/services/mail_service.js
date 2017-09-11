'use strict';
var nodemailer = require('nodemailer');
var q = require('q');
var mg = require('nodemailer-mailgun-transport');
var nconf = require('../common/nconf');
var handlebars = require('handlebars');
var Constants = require('../common/constants');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');

// This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
var auth = {
  auth: {
    api_key: nconf.get('MAILGUN_API_KEY'),
    domain: 'mg.quietthyme.com',
  },
};

var nodemailerMailgun = nodemailer.createTransport(mg(auth));

var mailService = module.exports;

mailService.welcomeEmail = function(recipientEmail, firstName) {
  return mailService.sendEmail(
    'welcome',
    recipientEmail,
    'Welcome to the QuietThyme Beta!',
    { first_name: firstName }
  );
};

mailService.sendEmail = function(template, recipientEmail, subject, context) {
  if(!recipientEmail){
    return q.reject(new Error('recipient email is empty'))
  }

  var contextObject = _.merge(
    {
      web_domain: Constants.web_domain,
    },
    context || {}
  );

  var templateDir = path.join(__dirname, `../templates/${template}.html.hbs`);
  if(!fs.existsSync(templateDir)){
    return q.reject(new Error('template does not exist'))
  }

  var deferred = q.defer();
  nodemailerMailgun.sendMail(
    {
      from: '"Jason from QuietThyme" <hello@quietthyme.com>',
      to: recipientEmail, // An array if you have multiple recipients.
      subject: subject,
      template: {
        name: templateDir,
        engine: 'handlebars',
        context: contextObject,
      },
    },
    function(err, info) {
      if (err) return deferred.reject(err);
      return deferred.resolve(info);
    }
  );
  return deferred.promise;
};
