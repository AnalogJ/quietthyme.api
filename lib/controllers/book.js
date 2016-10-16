var JWTokenService = require('../services/JWTokenService'),
    DBService = require('../services/DBService')
module.exports = {
    create: function (event, context, cb) {


        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    },
    find: function (event, context, cb) {
        JWTokenService.verify(event)
            .then(function(token){
                if(!event.query.storage_type) {
                    console.warn('No storage_type present, returning books from all storage providers.', event.query.service_type)
                }

                return DBService.get()
                    .then(function(db_client){
                        var book_query = db_client.select()
                            .from('books')
                            .where('user_id', token.id)

                        if(event.query.storage_type){
                            book_query.where('owner', event.query.storage_type);
                        }


                        if(event.query.page || event.query.page === 0){
                            book_query.limit(50);
                            book_query.offset(event.query.page * 50)
                        }
                        else{
                            //no pagination. force max limit
                            book_query.limit(1000)
                        }
                        return book_query
                    })
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
            .then(function(books){
                console.log(">>>>> DESTROYING DB")
                DBService.destroy().then(function(){
                    console.dir(books)

                    return cb(null, books)

                })


            })
            .fail(function(err){
                console.log(">>>> FINISHED DB TRANSACTION WITH ERROR")
                console.log(err.toString())
                cb(null, err.toString())
            })
            .done()
    },
    destroy: function (event, context, cb) {
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    }
}