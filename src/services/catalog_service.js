'use strict';
const debug = require('debug')('quietthyme:CatalogService');

var XMLSchema = require("xml-schema");
var schemas = require('../common/catalog_schemas');
var DBService = require('../services/db_service');
var Base64Service = require('../services/base64_service');
var Constants = require('../common/constants');
var nconf = require('../common/nconf');
//private methods
function web_endpoint(){
    return 'https://' + (nconf.get('STAGE') == 'master' ? 'www' : 'beta') + '.quietthyme.com'
}
module.exports.web_endpoint = web_endpoint;

function api_endpoint(){
    return 'https://api.quietthyme.com/'+nconf.get('STAGE') + '/catalog'
}

function self_link(token, path, type){
    return {
        rel: 'self',
        href: token_endpoint(token) + (path || ''),
        title: 'Current Page',
        type: 'application/atom+xml;profile=opds-catalog'+ (type || ';kind=acquisition')
    };
}


//public methods

module.exports.page_suffix = function(page){
    return (page || page === 0) ? ('?page='+ page) : ''
};

//BASE
function token_endpoint(token){
    return api_endpoint() + '/' + token
}
module.exports.token_endpoint = token_endpoint;


//token is the catalog token
// id is required
// current_path is required (url after the catalog token in path, shoudl include `/`)
function common_feed(feed_type, token, id, current_path, next_path, page, limit ){
    var common =  {
        id: id,
        title: "QuietThyme - Home",
        authors: {
            name: "Jason Kulatunga",
            uri: web_endpoint(),
            email: "support@quietthyme.com"
        },
        updated: new Date(),
        icon: web_endpoint() + '/favicon.png',
        links: [
            {
                rel: "search",
                href: token_endpoint(token) + "/search_definition",
                type: "application/opensearchdescription+xml",
                title: "QuietThyme Catalog Search"
            },
            {
                rel: "alternate",
                href: web_endpoint(),
                type: "text/html",
                title: "HTML Page"
            },
            {
                rel: "start",
                href: token_endpoint(token),
                type: "application/atom+xml;profile=opds-catalog;kind=navigation",
                title: "Catalog Start Page"
            },
            //All catalogs should specify their current page.
            self_link(token, current_path, feed_type)
        ]
    };

    if(next_path){
        common.link.push({
            rel: "next",
            type: "application/atom+xml;profile=opds-catalog;kind=acquisition",
            href: token_endpoint(token) + next_path,
            title: "Next Page"
        })
    }

    // if(page != null && limit != null){
    //     common.itemsperpage = limit;
    //     common.startindex = (page * limit) + 1
    // }
    return common
}

module.exports.common_feed = common_feed;


module.exports.acquisition_feed = function acquisition_feed(token, id, current_path, next_path, page, limit ){
    return common_feed(';kind=acquisition', token, id, current_path, next_path, page, limit)
};

module.exports.navigation_feed = function acquisition_feed(token, id, current_path, next_path, page, limit ){
    return common_feed('kind=navigation', token, id, current_path, next_path, page, limit)
};

module.exports.search_description_feed = function search_description_feed(token){

    return {
        image: web_endpoint() + '/favicon.ico',
        url: {
            template: token_endpoint(token) + '/search?query={searchTerms}&amp;page={startPage?}'
        }
    }
};


// Create an opds feed
module.exports.toXML = function(feed, type) {
    if(!type) {type = 'FEED'}
    var opdsSchema = new XMLSchema(schemas[type]);

    return opdsSchema.generate(feed, {
        version: '1.0',
        encoding: 'UTF-8',
        standalone: true,
        pretty: true
    });
};


module.exports.findUserByToken = DBService.findUserByCatalogToken

//page and limit are optional
module.exports.generatePaginatedBookQuery = function(user_id, limit, page){
    return DBService.findBooks(user_id,{},page,limit)
};


module.exports.generatePaginatedSeriesQuery = function(db_client, user_id, limit, page){

    var series_query =  db_client('books')
        .distinct('series_name')
        .whereNotNull('series_name')
        .where({user_id: 1});

    if(page || page === 0){
        series_query.limit(limit);
        series_query.offset(page * limit)
    }

    return series_query;
};

module.exports.seriesToPartialEntry = function (id, token, series_name){
    return {
        updated: new Date(),
            id: id + ':series:' + Base64Service.urlEncode(series_name),
        title: series_name,
        content: 'Books in ' + series_name,
        links: [
            {
                type: 'application/atom+xml;profile=opds-catalog;kind=acquisition',
                rel: 'http://opds-spec.org/featured',
                href: token_endpoint(token) + '/in_series/' + Base64Service.urlEncode(series_name)
            }
        ]
    }
};

function bookToBaseEntry(id, token, book){

    var storage_extension = (book.storage_format[0] == '.' ? book.storage_format.substr(1) : book.storage_format );

    var entry = {
        id: id +':' + book.id,
        title: book.title,
        isbn: book.isbn || book.isbn10,
        authors: book.authors ? book.authors.map(function(author){
            return {
                name: author,
                uri: token_endpoint(token) + '/by_author/' + Base64Service.urlEncode(author)
            }
        }) : [],
        published: book.published_date,
        issued: book.published_date,
        updated: book.updated_at,
        summary: book.short_summary,
        categories: book.tags ? book.tags.map(function(tag){
            return {
                term: tag,
                label: tag,
                scheme: token_endpoint(token) + '/tagged_with/' + Base64Service.urlEncode(tag)
            }
        }) : [],
        links: [
            {
                type:'image/jpeg',
                rel: 'http://opds-spec.org/image',
                href: "https://s3.amazonaws.com/" + book.cover
            },
            {
                type:'image/jpeg',
                rel: 'http://opds-spec.org/image/thumbnail',
                href: "https://s3.amazonaws.com/" + book.cover
            },
            {
                type: Constants.file_extensions[storage_extension].mimetype,
                href: token_endpoint(token) + '/download/' + book.id,
                rel: 'http://opds-spec.org/acquisition'
            }
        ]
    };

    if(book.goodreads_id){
        entry.links.push({
            type: 'text/html',
            href: 'https://www.goodreads.com/book/show/' + book.goodreads_id,
            title: 'View on Goodreads',
            rel: 'alternate'
        })
    }
    //todo add links to other identifiers
    return entry
}



module.exports.bookToPartialEntry = function(id, token, book){
    var entry = bookToBaseEntry(id, token, book);
    entry.links.push({
        type: 'application/atom+xml;type=entry;profile=opds-catalog',
        href: token_endpoint(token) + '/book/'+book.id,
        title: 'Full entry',
        rel: 'alternate'
    });
    return entry
};


module.exports.bookToFullEntry = function(id, token, book, path){
    var opds_entry = bookToBaseEntry(id, token, book, path);
    opds_entry.publisher = book.publisher;
    opds_entry.content = book.short_summary;

    if(book.series_name){
        opds_entry.links.push({
            type: 'application/atom+xml;profile=opds-catalog;kind=acquisition',
            href: token_endpoint(token) + '/in_series/' + Base64Service.urlEncode(book.series_name),
            title: 'In the same series',
            rel: 'related'
        })
    }
    book.authors.forEach(function(author){
        opds_entry.links.push({
            type: 'application/atom+xml;profile=opds-catalog;kind=acquisition',
            href: token_endpoint(token) + '/by_author/' + Base64Service.urlEncode(author),
            title: 'More books by ' + author,
            rel: 'related'
        })
    });
    opds_entry.links.push({
        type: 'application/atom+xml;type=entry;profile=opds-catalog',
        href: token_endpoint(token) + path,
        rel: 'self'
    });
    return opds_entry
};
