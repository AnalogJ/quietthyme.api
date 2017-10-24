'use strict';
const debug = require('debug')('quietthyme:book');
var JWTokenService = require('./services/jwt_token_service'),
  DBService = require('./services/db_service'),
  StorageService = require('./services/storage_service'),
  HttpError = require('./common/http_error'),
  Utilities = require('./common/utilities'),
  PipelineMetadataService = require('./services/pipeline_metadata_service'),
  PipelineService = require('./services/pipeline_service'),
  q = require('q'),
  toMarkdown = require('to-markdown'),
  GlobalHandler = require('./common/global_handler');

var BookEndpoint = module.exports;

BookEndpoint.router = GlobalHandler.wrap(function(event, context, cb) {
  debug('UserEndpoint router event: %o', event);
  if (event.httpMethod == 'POST' && event.pathParameters.id) {
    BookEndpoint.edit(event, context, cb);
  } else if (event.httpMethod == 'POST') {
    BookEndpoint.create(event, context, cb);
  } else if (event.httpMethod == 'GET') {
    BookEndpoint.find(event, context, cb);
  } else if (event.httpMethod == 'DELETE' && event.pathParameters.id) {
    BookEndpoint.destroy(event, context, cb);
  } else {
    Utilities.errorHandler(cb)(
      new Error(`Unknown API endpoint: ${event.pathParameters.action}`)
    );
  }
})

BookEndpoint.create = function(event, context, cb) {
  JWTokenService.verify(event.token)
    .then(function(auth) {
      debug('Create book params: %o', event.pathParameters);
      debug('Create book query: %o', event.queryStringParameters);
      debug('Create book body: %s', event.body);

      if (!event.queryStringParameters || !event.queryStringParameters.source) {
        console.error(
          'No source present, dont know where this book is from',
          event.queryStringParameters.source
        );
        throw new HttpError(
          'No source present, dont know where this book is from. Should be calibre or web',
          500
        );
      }

      var primary_criteria = { user_id: auth.uid };
      var metadata_pipeline = [
        PipelineMetadataService.generate_api_data_set(
          event.body,
          event.queryStringParameters.source || 'api'
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
};
BookEndpoint.find = function(event, context, cb) {
  JWTokenService.verify(event.token)
    .then(function(auth) {
      if (!event.queryStringParameters || !event.queryStringParameters.storage_id) {
        console.warn(
          'No storage_id present, returning books from all storage providers.',
          event.queryStringParameters.storage_id
        );
      }

      var book_query = null;

      if (event.queryStringParameters.id) {
        book_query = DBService.findBookById(event.queryStringParameters.id, auth.uid);
      } else {
        var condition = {};
        if (event.queryStringParameters.storage_id) {
          condition['credential_id'] = event.queryStringParameters.storage_id;
        }
        book_query = DBService.findBooks(
          auth.uid,
          condition,
          event.queryStringParameters.page,
          50,
          event.queryStringParameters.sort || 'title'
        );
      }
      return book_query;
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};

BookEndpoint.edit = function(event, context, cb) {
  JWTokenService.verify(event.token)
    .then(function(auth) {
      debug('Edit book params: %o', event.pathParameters);
      debug('Edit book query: %o', event.queryStringParameters);
      debug('Edit book body: %s', event.body);

      if (!event.queryStringParameters || !event.queryStringParameters.source) {
        console.error(
          'No source present, dont know where this book is from',
          event.queryStringParameters.source
        );
        throw new HttpError(
          'No source present, dont know where this book is from',
          500
        );
      }


      //find the existing book.
      //update teh fields that were passed in.
      //TODO editing a book should also edit hte book storage name (title, author, series info)
      return DBService.findBookById(event.pathParameters.id, auth.uid)
        .then(function(book){

          var updateData = {};
          var sources = book.sources;
          for(var prop in event.body){
            if(event.body[prop] != book[prop]){
              //properties are not the same, we need to update the book
              updateData[prop] = event.body[prop];

              if(prop == 'authors'){
                updateData[prop] = Utilities.compactArray(updateData[prop])
              }
              sources[prop] = event.queryStringParameters.source
            }
          }

          if(updateData){
            updateData.sources = sources;

            if(updateData.authors){
              updateData.primary_author = updateData.authors[0]
            }

            return DBService.updateBook(book.id, auth.uid, updateData, true)
          }
          else{
            //nothign to update, exit.
            return book
          }
        })
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};

BookEndpoint.destroy = function(event, context, cb) {
  JWTokenService.verify(event.token)
    .then(function(auth) {
      if (!event.pathParameters || !event.pathParameters.id) {
        console.error('No book specified', event.pathParameters.id);
        throw new HttpError('No book specified', 500);
      }

      // determine if we should delete from book storage as well.
      var deletePromise = q({})
      if(event.queryStringParameters.deleteStorage){
        deletePromise = DBService.findBookById(event.pathParameters.id, auth.uid)
          .then(function(book){
            return StorageService.delete_book_storage(book.storage_type, book.storage_identifier, book.credential_id)
              .then(function(){
                //delete the book cover art.
                if(book.cover){
                  return StorageService.delete_book_coverart(book.cover);
                }
                else{
                  return {}
                }
              })
          })

        //TODO: delete the book cover art.
      }
      return deletePromise.then(function(){
        return DBService.deleteBookById(event.pathParameters.id, auth.uid)
      });
    })
    .then(Utilities.successHandler(cb))
    .fail(Utilities.errorHandler(cb))
    .done();
};
