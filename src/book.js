'use strict';
require('dotenv').config();
var JWTokenService = require('./services/JWTokenService'),
    DBService = require('./services/DBService'),
    HttpError = require('./common/HttpError'),
    Helpers = require('./common/helpers'),
    q = require('q'),
    toMarkdown = require('to-markdown');
module.exports = {
    create: function (event, context, cb) {

        q.spread([JWTokenService.verify(event.token), DBService.get()],
            function(auth, db_client) {

                console.log("CREATE BOOK ============================PARAMS")
                console.log(event.path)
                console.log("CREATE BOOK ============================QUERY")
                console.log(event.query)
                console.log("CREATE BOOK ============================BODY")
                console.log(event.body)

                if(!event.query.source){
                    console.log('No source present, dont know where this book is from', event.query.source)
                    throw new HttpError('No source present, dont know where this book is from. Should always be calibre', 500)
                }

                ///TODO: validate that the book properties match the database columns.
                var book_data = event.body;
                book_data.user_id = auth.uid;
                book_data.short_summary = toMarkdown(book_data.short_summary, {converters: [{
                    filter: 'div',
                    replacement: function (innerHTML) { return innerHTML }
                }]})
                return db_client('books')
                    .returning('id')
                    .insert(book_data)
            })
            .then(function(book_result){
                return {id: book_result[0]}
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },
    find: function (event, context, cb) {
        q.spread([JWTokenService.verify(event.token), DBService.get()],
            function(auth, db_client) {

                if(!event.query.storage_id) {
                    console.warn('No storage_id present, returning books from all storage providers.', event.query.storage_id)
                }

                var condition = {'user_id': auth.uid}

                var book_query = null

                if(event.query.id){
                    condition['id'] = event.query.id;
                    book_query = db_client.first()
                        .from('books')
                        .where(condition)
                }
                else{
                    if(event.query.storage_id){
                        condition['credential_id'] = event.query.storage_id;
                    }

                    book_query = db_client.select()
                        .from('books')
                        .where(condition)

                    if(event.query.page || event.query.page === 0){
                        book_query.limit(50);
                        book_query.offset(event.query.page * 50)
                    }
                }

                return book_query
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
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },

    destroy: function (event, context, cb) {
        //TODO: we should destroy book storage as well.
        q.spread([JWTokenService.verify(event.token), DBService.get()],
            function(auth, db_client) {

                if(!event.path.id){
                    console.log('No book specified', event.path.id)
                    throw new HttpError('No book specified', 500)
                }

                var book_data = event.body;
                book_data.user_id = auth.uid;

                return db_client('books')
                    .where({
                        user_id: auth.uid,
                        id: event.path.id
                    })
                    .del()

            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    }
}