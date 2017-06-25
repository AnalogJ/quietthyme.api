'use strict';
const debug = require('debug')('quietthyme:PipelineService');
var q = require('q');
var util = require('util');
var extend = require('node.extend');
var _ = require('lodash');
var qCombinators = require('q-combinators');
var PipelineMetadataService = require('./pipeline_metadata_service');
var PipelineImageService = require('./pipeline_image_service');
var StorageService = require('./storage_service');
var DBService = require('./db_service');
var DBSchemas = require('../common/db_schemas');
var crypto = require('crypto');
var toMarkdown = require('to-markdown');
var Constants = require('../common/constants')
q.longStackSupport = true;


var PipelineService = module.exports;


/*
 * Reusable method to check if a book exists for the specified criteria_sets (which are merged into a criteria)
 * if the criteria specified finds a book, then return it, otherwise use the data_sets to generate the book body
 * Don't attempt to populate the book's values here. that's done in the _populate_book_with_parsed_data method
 *
 * criteria_sets will be merged in an 'or' clause.
 *
 * Supported metadata_pipeline data set types:
 *      opf - data retrived from opf file
 *      file - data retrieved from book filename.  (eg. author name - title.epub)
 *      manual - data set manually by user.
 *      calibre - data retrieved from calibre database
 *      embedded - data retrieved from embedded book metadata (eg. book spines, pdf attributes)
 *      goodreads - data retrived from goodreads service
 *      google - data retrived from google books
 *      amazon - data retrieved from goodreads.
 *
 *
 * metadata_pipeline should be preloaded with data_sets, such as opf and filename
 *
 *
 *
 * Supported image_pipleine data set type:
 *      goodreads - cover retrieved from goodreads
 *      amazon - cover retrieved from amazon
 *      file - cover retreived from filesystem
 *      manual - cover manulally uploaded by user
 *      calibre - cover retrived from calibre database sync.
 *      embedded - cover retrieved from embedded book metadata (eg. cover.jpg inside epub, pdf first page)
 *      openlibrary - cover retrieved from openlibrary by isbn.
 * */

PipelineService.create_with_pipeline = function(primary_criteria, metadata_pipeline, image_pipeline, opts){

    debug("Metadata pipeline initial content: %o", metadata_pipeline);
    if(!primary_criteria || (!primary_criteria.user_id)){
        console.error("the primary criteria is required.");
        return q.reject(new Error("the primary criteria is required."))
    }

    opts = opts || {};

    if(!util.isArray(metadata_pipeline)){
        if(metadata_pipeline){
            metadata_pipeline = [metadata_pipeline];
        }
        else{
            metadata_pipeline = [];
        }
    }
    if(!util.isArray(image_pipeline)){
        if(image_pipeline){
            image_pipeline = [image_pipeline];
        }
        else{
            image_pipeline = [];
        }
    }

    //#############################################################################
    //Configure Criteria
    //#############################################################################
    var create_criteria = extend(true, {sources:{}},primary_criteria);

    //Attempt to find additional criteria from provided data_sets
    var primary_dataset = _.find(metadata_pipeline,{'_type' : "api"}) ||
        _.find(metadata_pipeline,{'_type' : "calibre"}) ||
        _.find(metadata_pipeline,{'_type' : "opf"}) ||
        _.find(metadata_pipeline,{'_type' : "embedded"});

    if(primary_dataset){
        //populate query with or conditions.
        if(primary_dataset.goodreads_id){
            create_criteria.goodreads_id = primary_dataset.goodreads_id;
            create_criteria.sources['goodreads_id'] = primary_dataset['_type'];
        }
        if(primary_dataset.amazon_id){
            create_criteria.amazon_id = primary_dataset.amazon_id;
            create_criteria.sources['amazon_id'] = primary_dataset['_type'];
        }
        if(primary_dataset.barnesnoble_id){
            create_criteria.barnesnoble_id = primary_dataset.barnesnoble_id;
            create_criteria.sources['barnesnoble_id'] = primary_dataset['_type'];
        }
        if(primary_dataset.ffiction_id){
            create_criteria.ffiction_id = primary_dataset.ffiction_id;
            create_criteria.sources['ffiction_id'] = primary_dataset['_type'];
        }
        if(primary_dataset.calibre_id){
            create_criteria.calibre_id = primary_dataset.calibre_id;
            create_criteria.sources['calibre_id'] = primary_dataset['_type'];
        }
        if(primary_dataset.isbn){
            create_criteria.isbn = primary_dataset.isbn;
            create_criteria.sources['isbn'] = primary_dataset['_type'];

        }
        if(primary_dataset.isbn10){
            create_criteria.isbn10 = primary_dataset.isbn10;
            create_criteria.sources['isbn10'] = primary_dataset['_type'];
        }

        //
        if(
            (!(primary_dataset.isbn ||primary_dataset.isbn10 || primary_dataset.goodreads_id))
            && (!(primary_dataset.short_summary && primary_dataset.tags && primary_dataset.tags.length && primary_dataset.cover))
            && (primary_dataset.title && primary_dataset.authors && primary_dataset.authors.length )){
            //embedded book info doesnt have isbn or goodreads id
            //embedded book info doesnt have a summary tags or cover art.
            //lookup the book by name.
            metadata_pipeline.push(PipelineMetadataService.generate_goodreads_data_set_by_title_author(primary_dataset.title, primary_dataset.authors[0]));
        }
    }

    //#############################################################################
    //Initialize Book
    //#############################################################################
    var bookPromise = q(create_criteria);
    //#############################################################################
    //Retrieve Book data from external/secondary sources
    //#############################################################################
    return bookPromise
        .then(function(book){
            //at this point the book is either:
            //1. a newly created book with only only identifiers,
            //2. an existing book that needs to be populated.

            //generate  additional metadata_data_sets

            //TODO: make this data_set have a fallback, incase the id version fails.
            if(book.goodreads_id){
                metadata_pipeline.push(PipelineMetadataService.generate_goodreads_data_set(book.goodreads_id));
            }
            else if(book.isbn || book.isbn10){
                metadata_pipeline.push(PipelineMetadataService.generate_goodreads_data_set_by_isbn(book.isbn || book.isbn10));
            }

            //each promise can return a single data_set object (with a matching type) or an arrary of promises
            return q.allSettled(metadata_pipeline)

            //#############################################################################
            //Flatten these data_sets (results) and determine which data is actually needed
            //#############################################################################
                .then(function(processed_data_sets){
                    //flatten processed_data_sets promises
                    return PipelineMetadataService.flatten_data_sets(book.sources ||{}, processed_data_sets);
                })
        })
        //#############################################################################
        //Take the flattened data_sets and generate promises for authors, series, coverart, and final parsed book data.
        //#############################################################################
        .spread(function(current_sources, flattened_data, add_image_pipeline){
            image_pipeline = image_pipeline.concat(add_image_pipeline);


            //TODO: for testing lets raise an erorr here!!
            // console.dir(current_sources)
            // console.dir(flattened_data)
            // throw "RAISING ERROR FOR TESTING!!"


            //generate additional image data_sets
            if(flattened_data.isbn || flattened_data.isbn10){
                image_pipeline.push(PipelineImageService.generate_openlibrary_data_set(flattened_data.isbn || flattened_data.isbn10));
                image_pipeline.push(PipelineImageService.generate_amazon_data_set(flattened_data.isbn || flattened_data.isbn10))
            }


            // if(flattened_data.authors) {
            //     //Generate author promises.
            //     var externalAuthorPromises = [];
            //     flattened_data.authors.forEach(function (author_data_set) {
            //
            //         var promise = null;
            //         var search_criteria = []
            //         for (var prop in author_data_set){
            //             var criteria = {};
            //             criteria[prop] = author_data_set[prop];
            //             search_criteria.push(criteria);
            //
            //         }
            //         promise = Author.findOrCreate({or:search_criteria}, author_data_set)
            //
            //         //if (author_data_set.author_link) {
            //         //    promise = External.findOrCreate(author_data_set.author_link, author_data_set.author_link)
            //         //        .then(function (external_link) {
            //         //            //now we have an object that links to a Goodreads Object, find the associated Author.
            //         //            return Author.findOrCreate({
            //         //                    or: [
            //         //                        {author_link: external_link.id},
            //         //                        {name: author_data_set.name}
            //         //                    ]
            //         //                },
            //         //                {
            //         //                    author_link: external_link.id,
            //         //                    name: author_data_set.name
            //         //                }
            //         //            )
            //         //                .then(function (author) {
            //         //                    if (!author.author_link) {
            //         //                        //if we found an author without the author link, like one created via a book title, populate it here.
            //         //                        author.author_link = external_link.id;
            //         //                        return author.save();
            //         //                    }
            //         //                    else {
            //         //                        return author;
            //         //                    }
            //         //                })
            //         //        });
            //         //}
            //         //else {
            //         //    promise = Author.findOrCreate(author_data_set, author_data_set)
            //         //}
            //
            //         externalAuthorPromises.push(promise)
            //     });
            // }
            // delete flattened_data.authors;
            //
            // //TODO: remove series promise, no longer used
            // //Create all links and associated models.
            // var externalSeriesPromise = q(null);

            var externalImagePromise = qCombinators
                .fallback(PipelineImageService.process_image_pipeline(current_sources, image_pipeline))
                .then(function(resp){
                    if(resp.data){
                        return bookPromise.then(
                            function(book){
                                //we dont know the book's actual final name at this point, so lets just store the coverart to a HASH.jpg file in S3.
                                var image_key = StorageService.create_content_identifier('cover', book.user_id, crypto.randomBytes(20).toString('hex'), '.jpg');

                                return StorageService.upload_file_from_stream(resp.data,'.jpg', Constants.buckets.content, image_key)
                            })
                    }
                    else if(resp.identifier){
                        //manually uploaded files are already stored in azure, no need to move them.
                        return resp.identifier;
                    }

                });

            delete flattened_data.image;


            //Populate this data in the database.
            return q.allSettled([
                bookPromise,
                current_sources,
                flattened_data,
                externalImagePromise
            ])

        })
        .spread(_populate_book_with_parsed_data);

};


// Private functions
function _populate_book_with_parsed_data(bookPromise,sourcesPromise, parsed_bookPromise, coverPromise){
    function ISODateString(d){
        if(typeof(d) == 'string'){
            d = new Date(d)
        }
        function pad(n){return n<10 ? '0'+n : n}
        return d.getUTCFullYear()+'-'
            + pad(d.getUTCMonth()+1)+'-'
            + pad(d.getUTCDate())+'T'
            + pad(d.getUTCHours())+':'
            + pad(d.getUTCMinutes())+':'
            + pad(d.getUTCSeconds())+'Z'
    }

    var parsed_book = parsed_bookPromise.value;

    parsed_book.sources = sourcesPromise.value;
    // if(authorPromises.state === "fulfilled"){
    //     var author_ids = authorPromises.value.reduce(function(prev, curr, ndx, arr){
    //         if(curr.state === "fulfilled"){
    //             prev.push(curr.value.id);
    //             return prev;
    //         }
    //
    //     },[])
    //     parsed_book.authors = author_ids;
    // }
    //
    // if(externalSeriesPromise.state === "fulfilled" && externalSeriesPromise.value){
    //     parsed_book.series_link = externalSeriesPromise.value.id;
    // }

    if(coverPromise.state === "fulfilled" && coverPromise.value){
        parsed_book.cover = coverPromise.value.bucket +  '/' + coverPromise.value.key;
    }

    var final_book = extend(true, bookPromise.value,parsed_book);

    //cleanup book
    final_book.short_summary = final_book.short_summary ? toMarkdown(final_book.short_summary, {converters: [{
        filter: 'div',
        replacement: function (innerHTML) { return innerHTML }
    }]}) : null;

    if(typeof final_book.published_date !== 'string'){
        final_book.published_date = ISODateString(final_book.published_date)
    }
    if(typeof final_book.last_modified !== 'string'){
        final_book.last_modified = ISODateString(final_book.last_modified)
    }

    console.info("Merged final book data: ", final_book);
    // throw "RAISING ERROR FOR TESTING!!"

    return DBService.createBook(DBSchemas.Book(final_book))
}