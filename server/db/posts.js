'use strict';
var _ = require('lodash');
var config = require(__dirname + '/../config');
var couch = require(__dirname + '/couch');
var dbName = config.couchdb.name;
var recordType = 'posts';

var posts = {};
module.exports = posts;

posts.all = function(limit, startkey, cb) {
  var filter = {};
  filter.limit = limit ? Number(limit) : 10;
  if (startkey) filter.startkey = startkey;
  couch.view(dbName, recordType, filter, function(err, result) {
    delete result.total_rows;
    result.next_startkey = result.rows[result.rows.length - 1].key;
    result.next_startkey_docid = result.rows[result.rows.length - 1].id; 
    result.rows = _.first(result.rows, filter.limit - 1);
    cb(err, result);
  });
};

posts.find = function(postId, cb) {
  var filter = {};
  filter.limit = 1;
  filter.key = Number(postId);
  couch.get(postId, null, function(err, result) {
    if (err || !result || result.type !== 'post') {
      err = new Error('Post not found.');
      result = undefined;
    }
    return cb(err, result);
  });
};

var defaultViewLimit = Number(10);

posts.byThread = function(parentPostId, query, cb) {
  // limit, startkey, startkey_docid, endkey, endkey_docid,
  var limit = query.limit;
  var startkey = query.startkey;
  var startkey_docid = query.startkey_docid;
  var endkey = query.endkey;
  var endkey_docid = query.endkey_docid;

  var filter = {};
  filter.startkey = [parentPostId, null];
  filter.endkey = [parentPostId, {}];
  filter.include_docs = true;
  if (startkey && startkey_docid) {
    // 2nd key is timestamps.created, a timestamp. query as a Number.
    startkey[1] = Number(startkey[1]);
    filter.startkey = startkey;
    filter.startkey_docid = startkey_docid;
  }
  else if (endkey && endkey_docid) {
    endkey[1] = Number(endkey[1]);
    filter.endkey = endkey;
    filter.endkey_docid = endkey_docid;
  }

  limit = limit ? Number(limit) : defaultViewLimit;

  // +1 for couch pagination
  filter.limit = limit + 1;
  couch.view(dbName, recordType + 'ByThread', filter, function(err, docs) {
    if (!err && docs && docs.rows.length > 0) {
      delete docs.total_rows;
      delete docs.offset;
      docs.next_startkey = docs.rows[docs.rows.length - 1].key;
      docs.next_startkey_docid = docs.rows[docs.rows.length - 1].id; 
      docs.rows = _.map(_.first(docs.rows, limit), function(row) {
        return row.doc;
      });
    }
    cb(err, docs);
  });
};