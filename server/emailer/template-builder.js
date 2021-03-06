/* jshint node: true */
'use strict';

var path = require('path');
var doT = require('dot');
var fs = require('fs');
var config = require(path.join(__dirname, '..', '..', 'config')).emailer;

var templateFile = function(filename) {
  return fs.readFileSync(path.join(__dirname, 'templates', filename));
};

exports.recoverAccount = function(params) {
  var template = doT.template(templateFile('recover-account.html'));
  return {
    from: config.sender,
    to: params.email,
    subject: '[EpochTalk] Account Recovery',
    html: template({ username: params.username, resetUrl: params.reset_url })
  };
};

exports.recoverSuccess = function(params) {
  var template = doT.template(templateFile('recover-success.html'));
  return {
    from: config.sender,
    to: params.email,
    subject: '[EpochTalk] Account Recovery Success',
    html: template({ username: params.username, forumUrl: params.forum_url })
  };
};

exports.confirmAccount = function(params) {
  var template = doT.template(templateFile('confirm-account.html'));
  return {
    from: config.sender,
    to: params.email,
    subject: '[EpochTalk] Account Confirmation',
    html: template({ username: params.username, confirmUrl: params.confirm_url })
  };
};
