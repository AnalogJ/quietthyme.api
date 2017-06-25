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
module.exports = {
    create: function (event, context, cb) {

        JWTokenService.verify(event.token)
            .then(function(auth) {

                debug("Create book params: %o", event.path);
                debug("Create book query: %o", event.query);
                debug("Create book body: %s", event.body);

                if(!event.query.source){
                    console.error('No source present, dont know where this book is from', event.query.source);
                    throw new HttpError('No source present, dont know where this book is from. Should always be calibre', 500)
                }



                var primary_criteria = {user_id: auth.uid};
                var metadata_pipeline = [PipelineMetadataService.generate_api_data_set(event.body, event.query.source || 'api')];
                var image_pipeline = [];
                return PipelineService.create_with_pipeline(primary_criteria,
                    metadata_pipeline,
                    image_pipeline);


                // ///TODO: validate that the book properties match the database columns.
                // var book_data = event.body;
                // book_data.user_id = auth.uid;
                // book_data.short_summary = toMarkdown(book_data.short_summary, {converters: [{
                //     filter: 'div',
                //     replacement: function (innerHTML) { return innerHTML }
                // }]})
                // return db_client('books')
                //     .returning('id')
                //     .insert(book_data)
            })
            .then(function(book_result){
                return {id: book_result.id}
            })
            .then(Utilities.successHandler(cb))
            .fail(Utilities.errorHandler(cb))
            .done()
    },
    find: function (event, context, cb) {
        JWTokenService.verify(event.token)
            .then(function(auth) {

                if(!event.query.storage_id) {
                    console.warn('No storage_id present, returning books from all storage providers.', event.query.storage_id)
                }

                var book_query = null;

                if(event.query.id){
                    book_query = DBService.findBookById(event.query.id, auth.uid);
                }
                else{
                    var condition = {};
                    if(event.query.storage_id){
                        condition['credential_id'] = event.query.storage_id;
                    }
                    book_query = DBService.findBooks(auth.uid, condition, event.query.page, 50, 'title');
                }

                return book_query;
                // .then(function(books){
                //     //todo: possibly filter out books that dont have a bookstorage.
                //     return res.json({success:true, data:books});
                // })
                // .fail(function(err){
                //     sails.log.error("An error occured while retrieving books.", err, err.stack);
                //     return res.status(500).json({success:false, error_msg:err})
                // })
                // .done()
            })
            .then(Utilities.successHandler(cb))
            .fail(Utilities.errorHandler(cb))
            .done()
    },

    destroy: function (event, context, cb) {
        //TODO: we should destroy book storage as well.
        JWTokenService.verify(event.token)
            .then(function(auth) {
                if(!event.path.id){
                    console.error('No book specified', event.path.id);
                    throw new HttpError('No book specified', 500)
                }
                var book_data = event.body;
                book_data.user_id = auth.uid;
                return DBService.deleteBookById(event.path.id, auth.uid)
            })
            .then(Utilities.successHandler(cb))
            .fail(Utilities.errorHandler(cb))
            .done()
    }
};

