'use strict';
const debug = require('debug')('quietthyme:PipelineMetadataService')
var ParseExternalService = require('./ParseExternalService')
var Constants = require('../common/constants')
/*#######################################################################
 *#######################################################################
 * The Metadata pipeline service is used to retieve book data from various sources asynchronously. Once the data has been
 * retrieved, the flatten_data_sets method is run to merge the data into a single parsed book that we can use to update
 * the book data in waterline.
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
 *#######################################################################
 *#######################################################################
 * */

var q = require('q')

var PipelineMetadataService = module.exports;
PipelineMetadataService.flatten_data_sets = function(current_sources, raw_data_sets_promises){
    //given a bunch of data sets and the current book sources, determine which data should be updated.
    //promises will need to be unwrapped, as they may have failed, we just need to worry about completed data_sets
    var data_sets = [];
    raw_data_sets_promises.forEach(function (result) {
        if (result.state === "fulfilled") {
            data_sets.push(result.value);
        } else {
            console.error("Skipping data_set which finished processing with an error: "+ result.reason);
        }
    })

    var parsed_book = {};
    var image_pipeline = [];
    //for each dataset, loop though all the properties (book fields/attributes)
    //if the source of the data_set has a lower priority than the current_source, add it to the parsed_book object
    //and update the current source.
    data_sets.forEach(function(data_set){
        var type = data_set._type;
        var data_set_type = Constants.metadata_data_set_types[type];
        delete data_set._type;

        for(var prop in data_set){
            var current_prop_type = Constants.metadata_data_set_types[current_sources[prop] || ""]
            //exceptions for special properties (images)
            if(prop == "image"){
                //add to the image pipeline.
                if(data_set.image.identifier){
                    image_pipeline.push({_type:type, url: data_set.image.identifier})
                }
                else if(data_set.image.promise){
                    image_pipeline.push({_type:type, promise: data_set.image.promise})
                }
            }
            else if(prop == "filename_ids"){
                //make sure the parsed_book has an array if it doesnt already.
                parsed_book[prop] = (parsed_book[prop] || []).concat(data_set[prop] || []);
            }
            else if((!current_prop_type || data_set_type.priority < current_prop_type.priority) && data_set[prop]){
                parsed_book[prop] = data_set[prop];
                current_sources[prop] = type;
            }
        }


    })
    //cleanup flattened dataset
    //make sure that the entries in the filename_ids are distinct.
    if(parsed_book.filename_ids){
        parsed_book.filename_ids = _.uniq(parsed_book.filename_ids);
    }

    return [current_sources, parsed_book, image_pipeline];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Embedded Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Attempts to guess what the title and author of the book is using the cleaned filename.
 * @param cleaned_filename
 * @returns {{_type:string, title: string, authors: array}}
 */
PipelineMetadataService.generate_file_data_set = function(cleaned_filename){
    var parsed_data = ParseExternalService.parse_filename(cleaned_filename);
    parsed_data['_type'] = 'file';
    parsed_data['filename_ids'] = [cleaned_filename];
    return parsed_data;
}

PipelineMetadataService.generate_existing_filename_ids = function(filename_ids){
    return {filename_ids: filename_ids, _type: 'file'};
}

PipelineMetadataService.generate_embedded_opf_data_set = function(opf_metadata_path){
    return ParseExternalService.read_opf_file(opf_metadata_path)
        .then(function(parsed_book){
            parsed_book['_type'] = 'embedded';
            return parsed_book;
        })

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Goodreads Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
PipelineMetadataService.generate_goodreads_data_set = function(goodreads_book_id) {
    var goodreads = require('goodreads.js');
    var provider = new goodreads.provider({
        'client_key': process.env.OAUTH_GOODREADS_CLIENT_KEY,
        'client_secret': process.env.OAUTH_GOODREADS_CLIENT_SECRET
    });
    return provider.CreateClient()
        .delay(1000) //delay 500 milliseconds between goodreads api calls?
        .then(function (client) {
            //var search_query = title.split(' ').join('+') + ' - ' + author.split(' ').join('+');
            return client.BookShow(goodreads_book_id);
        })
        .then(function (goodreads_book) {
            var parsed_book = ParseExternalService.parse_goodreads_book_details(goodreads_book);
            parsed_book['_type'] = "goodreads"
            return q(parsed_book);
        })
}


PipelineMetadataService.generate_goodreads_data_set_by_isbn = function(isbn) {
    var goodreads = require('goodreads.js');
    var provider = new goodreads.provider({
        'client_key': process.env.OAUTH_GOODREADS_CLIENT_KEY,
        'client_secret': process.env.OAUTH_GOODREADS_CLIENT_SECRET
    });
    return provider.CreateClient()
        .then(function (client) {
            //var search_query = title.split(' ').join('+') + ' - ' + author.split(' ').join('+');
            return client.BookIsbnToId(isbn)
        })
        .then(function(goodreads_id){
            debug("Found Goodreads book id: %s", goodreads_id)
            return PipelineMetadataService.generate_goodreads_data_set(goodreads_id)
        })
}


PipelineMetadataService.generate_goodreads_data_set_by_title_author = function(title, author) {

    title = title.replace(/-/g, '')
    author = author.replace(/-/g, '')
    var clean_title_author = (title + ' - ' + author).replace(/ *\([^)]*\) */g, "").replace(/ *\[[^\]]*\] */g, "");
    debug("Searching for Goodreads book id by title and author: %s", clean_title_author)
    var goodreads = require('goodreads.js');
    var provider = new goodreads.provider({
        'client_key': process.env.OAUTH_GOODREADS_CLIENT_KEY,
        'client_secret': process.env.OAUTH_GOODREADS_CLIENT_SECRET
    });
    return provider.CreateClient()
        .then(function (client) {
            //var search_query = title.split(' ').join('+') + ' - ' + author.split(' ').join('+');
            return client.SearchBooks(clean_title_author)
        })
        .then(function(data){
            return data.GoodreadsResponse.search[0].results[0].work[0].best_book[0].id[0]['_']
        })
        .then(function(goodreads_id){
            debug("Found Goodreads book id: %s", goodreads_id)
            return PipelineMetadataService.generate_goodreads_data_set(goodreads_id)
        })
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// OPF Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
PipelineMetadataService.generate_opf_data_set = function(opf_metadata, metadata_storage_cloud_file, storage_type){
    var parsed_book = ParseExternalService.parse_opf_data(opf_metadata);
    parsed_book['_type'] = 'opf';
    if(metadata_storage_cloud_file && storage_type){
        parsed_book['metadata'] = {
            identifier: metadata_storage_cloud_file.identifier,
            parent_identifier: metadata_storage_cloud_file.parent_identifier,
            storage_type: storage_type
        };
    }
    return parsed_book;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// API Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

PipelineMetadataService.generate_api_data_set = function(api_metadata,type){
    var parsed_book = ParseExternalService.parse_api_metadata(api_metadata);
    parsed_book['_type'] = type || 'api';
    return parsed_book;
}