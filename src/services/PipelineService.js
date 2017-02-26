var q = require('q');

var pipelineService = exports;


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

pipelineService.find_or_create_with_pipeline = function(primary_criteria,criteria_sets, metadata_pipeline,image_pipeline, opts){
    if(!primary_criteria || (!primary_criteria.id && !primary_criteria.owner)){
        console.log(new Error("one of the primary criteria is required."))
        return q.reject(new Error("one of the primary criteria is required."))
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

    if(!util.isArray(criteria_sets)){
        if(criteria_sets){
            criteria_sets = [criteria_sets];
        }
        else{
            criteria_sets = [];
        }
    }

    //#############################################################################
    //Configure Criteria
    //#############################################################################
    var criteria = extend(true,{},primary_criteria)
    var create_criteria = extend(true, {sources:{}},primary_criteria);

    if(!criteria.id){
        //No book id is given ,so try to use secondary criteria to find the book.

        var or_conditions = criteria_sets;
        //Attempt to find additional criteria from provided data_sets
        var primary_dataset = _.where(metadata_pipeline,{'_type' : "api"})[0] || _.where(metadata_pipeline,{'_type' : "calibre"})[0] || _.where(metadata_pipeline,{'_type' : "opf"})[0];
        if(primary_dataset){
            //populate query with or conditions.
            if(primary_dataset.goodreads_id){
                or_conditions.push({goodreads_id:primary_dataset.goodreads_id})
                create_criteria.goodreads_id = primary_dataset.goodreads_id
                create_criteria.sources['goodreads_id'] = primary_dataset['_type']
            }
            if(primary_dataset.amazon_id){
                or_conditions.push({amazon_id:primary_dataset.amazon_id})
                create_criteria.amazon_id = primary_dataset.amazon_id
                create_criteria.sources['amazon_id'] = primary_dataset['_type']
            }
            if(primary_dataset.barnesnoble_id){
                or_conditions.push({barnesnoble_id:primary_dataset.barnesnoble_id})
                create_criteria.barnesnoble_id = primary_dataset.barnesnoble_id
                create_criteria.sources['barnesnoble_id'] = primary_dataset['_type']
            }
            if(primary_dataset.google_id){
                or_conditions.push({google_id:primary_dataset.google_id})
                create_criteria.google_id = primary_dataset.google_id
                create_criteria.sources['google_id'] = primary_dataset['_type']
            }
            if(primary_dataset.ffiction_id){
                or_conditions.push({ffiction_id:primary_dataset.ffiction_id})
                create_criteria.ffiction_id = primary_dataset.ffiction_id
                create_criteria.sources['ffiction_id'] = primary_dataset['_type']
            }
            if(primary_dataset.calibre_id){
                or_conditions.push({calibre_id:primary_dataset.calibre_id})
                create_criteria.calibre_id = primary_dataset.calibre_id
                create_criteria.sources['calibre_id'] = primary_dataset['_type']
            }
            if(primary_dataset.isbn){
                or_conditions.push({isbn:primary_dataset.isbn})
                create_criteria.isbn = primary_dataset.isbn
                create_criteria.sources['isbn'] = primary_dataset['_type']

            }
            if(primary_dataset.isbn10){
                or_conditions.push({isbn10:primary_dataset.isbn10})
                create_criteria.isbn10 = primary_dataset.isbn10
                create_criteria.sources['isbn10'] = primary_dataset['_type']
            }
        }
        //Finalize criteria
        if(or_conditions.length > 1){
            criteria.or = or_conditions;

        }
        else if(or_conditions.length == 1){
            criteria = extend(criteria, or_conditions[0])
        }
        else if(or_conditions.length == 0){
            return q.reject(new Error("No book find criteria specified. Invalid."));
        }
    }


    //#############################################################################
    //Search for Book
    //#############################################################################
    var bookPromise = Book.findOrCreate(criteria, create_criteria);
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
                metadata_pipeline.push(MetadataPipelineService.generate_goodreads_data_set(book.goodreads_id))
            }
            else if(book.isbn){
                metadata_pipeline.push(MetadataPipelineService.generate_goodreads_data_set_by_isbn(book.isbn))
            }


            //each promise can return a single data_set object (with a matching type) or an arrary of promises
            return q.allSettled(metadata_pipeline)

            //#############################################################################
            //Flatten these data_sets (results) and determine which data is actually needed
            //#############################################################################
                .then(function(processed_data_sets){
                    //flatten processed_data_sets promises
                    return MetadataPipelineService.flatten_data_sets(book.sources ||{}, processed_data_sets);
                })
        })
        //#############################################################################
        //Take the flattened data_sets and generate promises for authors, series, coverart, and final parsed book data.
        //#############################################################################
        .spread(function(current_sources, flattened_data, add_image_pipeline){
            image_pipeline = image_pipeline.concat(add_image_pipeline);
            //generate additional image data_sets
            if(flattened_data.isbn){
                image_pipeline.push(ImagePipelineService.generate_openlibrary_data_set(flattened_data.isbn))
                image_pipeline.push(ImagePipelineService.generate_amazon_data_set(flattened_data.isbn))
            }


            if(flattened_data.authors) {
                //Generate author promises.
                var externalAuthorPromises = [];
                flattened_data.authors.forEach(function (author_data_set) {

                    var promise = null;
                    var search_criteria = []
                    for (var prop in author_data_set){
                        var criteria = {};
                        criteria[prop] = author_data_set[prop];
                        search_criteria.push(criteria);

                    }
                    promise = Author.findOrCreate({or:search_criteria}, author_data_set)

                    //if (author_data_set.author_link) {
                    //    promise = External.findOrCreate(author_data_set.author_link, author_data_set.author_link)
                    //        .then(function (external_link) {
                    //            //now we have an object that links to a Goodreads Object, find the associated Author.
                    //            return Author.findOrCreate({
                    //                    or: [
                    //                        {author_link: external_link.id},
                    //                        {name: author_data_set.name}
                    //                    ]
                    //                },
                    //                {
                    //                    author_link: external_link.id,
                    //                    name: author_data_set.name
                    //                }
                    //            )
                    //                .then(function (author) {
                    //                    if (!author.author_link) {
                    //                        //if we found an author without the author link, like one created via a book title, populate it here.
                    //                        author.author_link = external_link.id;
                    //                        return author.save();
                    //                    }
                    //                    else {
                    //                        return author;
                    //                    }
                    //                })
                    //        });
                    //}
                    //else {
                    //    promise = Author.findOrCreate(author_data_set, author_data_set)
                    //}

                    externalAuthorPromises.push(promise)
                });
            }
            delete flattened_data.authors;

            //TODO: remove series promise, no longer used
            //Create all links and associated models.
            var externalSeriesPromise = q(null);

            var externalImagePromise = qCombinators
                .fallback(ImagePipelineService.process_image_pipeline(current_sources, image_pipeline))
                .then(function(resp){
                    if(resp.data && resp.headers){
                        console.log("IMAGE data")

                        return bookPromise.then(
                            function(book){
                                var storage_identifier = StorageService.create_storage_identifier_from_filename(HashIdService.encrypt(book.id, 'book') + '.jpg','image');
                                return User.findOne(book.owner)
                                    .then(function(user){
                                        return user.store_file(resp.data, resp.headers['content-type'], storage_identifier)
                                    })
                            })
                            .fail(function(err){
                                console.log("FAILED", err)
                            })
                    }
                    else if(resp.identifier){
                        console.log("IMAGE identifier")

                        //manually uploaded files are already stored in azure, no need to move them.
                        return resp.identifier;
                    }

                })

            delete flattened_data.image;


            //Populate this data in the database.
            return q.allSettled([
                bookPromise,
                current_sources,
                flattened_data,
                q.allSettled(externalAuthorPromises),
                externalSeriesPromise,
                externalImagePromise
            ])

        })
        .spread(_populate_book_with_parsed_data);

}


// Private functions
function _populate_book_with_parsed_data(bookPromise,sourcesPromise, parsed_bookPromise, authorPromises,externalSeriesPromise, coverPromise){

    var parsed_book = parsed_bookPromise.value;

    parsed_book.sources = sourcesPromise.value;
    if(authorPromises.state === "fulfilled"){
        var author_ids = authorPromises.value.reduce(function(prev, curr, ndx, arr){
            if(curr.state === "fulfilled"){
                prev.push(curr.value.id);
                return prev;
            }

        },[])
        parsed_book.authors = author_ids;
    }

    if(externalSeriesPromise.state === "fulfilled" && externalSeriesPromise.value){
        parsed_book.series_link = externalSeriesPromise.value.id;
    }

    if(coverPromise.state === "fulfilled" && coverPromise.value){
        console.log("COVER FUFILLED",coverPromise.value);
        parsed_book.image = coverPromise.value;
    }

    //TODO: once https://github.com/balderdashy/waterline/issues/352#issuecomment-49052500 is fixed, do a save here.
    return Book.update(bookPromise.value.id, parsed_book)
        .then(function(book_update){
            return book_update[0]; //return the book, not an array.
        })
}