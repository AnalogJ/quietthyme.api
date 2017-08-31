'use strict';
const debug = require('debug')('quietthyme:book');
var JWTokenService = require('./services/jwt_token_service'),
  DBService = require('./services/db_service'),
  HttpError = require('./common/http_error'),
  Utilities = require('./common/utilities'),
  PipelineMetadataService = require('./services/pipeline_metadata_service'),
  PipelineService = require('./services/pipeline_service'),
  q = require('q'),
  toMarkdown = require('to-markdown');

var BookEndpoint = module.exports

BookEndpoint.router = function(event, context, cb){
  debug('UserEndpoint router event: %o', event)
  if(event.method == 'POST'){
    BookEndpoint.create(event,context, cb)
  }
  else if(event.method == 'GET'){
    BookEndpoint.find(event, context, cb)
  }
  else if(event.method == 'DELETE' && event.path.id){
    BookEndpoint.destroy(event, context, cb)
  }
  else{
    Utilities.errorHandler(cb)(new Error(`Unknown API endpoint: ${event.path.action}`))
  }
}



BookEndpoint.create = function(event, context, cb) {
  JWTokenService.verify(event.token)
    .then(function(auth) {
      debug('Create book params: %o', event.path);
      debug('Create book query: %o', event.query);
      debug('Create book body: %s', event.body);

      if (!event.query.source) {
        console.error(
          'No source present, dont know where this book is from',
          event.query.source
        );
        throw new HttpError(
          'No source present, dont know where this book is from. Should always be calibre',
          500
        );
      }

      var primary_criteria = { user_id: auth.uid };
      var metadata_pipeline = [
        PipelineMetadataService.generate_api_data_set(
          event.body,
          event.query.source || 'api'
        ),
      ];
      var image_pipeline = [];
      return PipelineService.create_with_pipeline(
        primary_criteria,
        metadata_pipeline,
        image_pipeline
      );

    })
    .then(function(book_result) {
      return { id: book_result.id };
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
}
BookEndpoint.find = function(event, context, cb) {
  JWTokenService.verify(event.token)
    .then(function(auth) {
      if (!event.query.storage_id) {
        console.warn(
          'No storage_id present, returning books from all storage providers.',
          event.query.storage_id
        );
      }

      var book_query = null;

      if (event.query.id) {
        book_query = DBService.findBookById(event.query.id, auth.uid);
      } else {
        var condition = {};
        if (event.query.storage_id) {
          condition['credential_id'] = event.query.storage_id;
        }
        book_query = DBService.findBooks(
          auth.uid,
          condition,
          event.query.page,
          50,
          'title'
        );
      }
      return book_query;
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
}

BookEndpoint.destroy = function(event, context, cb) {
  //TODO: we should destroy book storage as well.
  JWTokenService.verify(event.token)
    .then(function(auth) {
      if (!event.path.id) {
        console.error('No book specified', event.path.id);
        throw new HttpError('No book specified', 500);
      }
      var book_data = event.body;
      book_data.user_id = auth.uid;
      return DBService.deleteBookById(event.path.id, auth.uid);
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
}

