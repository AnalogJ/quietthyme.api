var Ajv = require('ajv');
var ajv = new Ajv({ useDefaults: true, removeAdditional: true }); // options can be passed, e.g. {allErrors: true}


var userSchema = {
    "additionalProperties": false,
    "properties": {
        "user_id": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string" },
        "password_hash": { "type": "string" },
        "plan": {
            'enum': ['none','basic','reader','library'],
            'default': 'none'
        },
        "library_uuid": {
            "type": "string",
            "default": ""
        },
        "catalog_token": { "type": "string" },
        "stripe_sub_id": {
            "type": "string",
            "default": ''
        },
    }
};


var credentialSchema = {
    "additionalProperties": false,
    "properties": {
        "id": { "type": "string" },
        "user_id": { "type": "string" },
        "service_type": { "type": "string" },
        "service_id": { "type": "string" },
        "name": { "type": "string", "default": "" },
        "email": { "type": "string", "default": "" },
        "oauth": { "type": "object" },
        "root_folder": { "type": "object", "default": {} }, //this is the service specific "QuietThyme" folder that all sub folders are created in.
        "library_folder": { "type": "object", "default": {} }, //this is "library" folder that all author folders are created in.
        "blackhole_folder": { "type": "object", "default": {} }, //this is "blackhole" folder that pending books should be copied into.

        "event_cursor": { "type": "string", "default": "" },
        "calibre_location_code": {
            'enum': [null, 'main','A','B'], //this location code is used by the calibre plugin to determine which storage providers are available (main, a, b)
            'default': null
        }
    }
};

var bookSchema = {
    "additionalProperties": false,
    "properties": {
        "id": { "type": "string" },
        "user_id": { "type": "string" },
        "credential_id": { "type": "string" },
        "storage_size": { "type": "number" },
        "storage_identifier": { "type": "string" },
        "storage_filename": { "type": "string" },
        "storage_format": { "type": "string" },

        "title": { "type": "string" },
        "average_rating": { "type": "number", "default": 0 },
        "ratings_count": { "type": "string", "default": "" },
        "user_rating": { "type": "string", "default": "" },
        "num_pages": { "type": "string", "default": "" },
        "short_summary": { "type": "string", "default": "" },
        "publisher": { "type": "string", "default": "" },
        "published_date": {
            "type": "string",
            "format": "date"
        },
        "tags": {
            "type": "array",
            "items": { "type": "string" },
            "default": []
        },
        "authors": { //prefer author names to be unsorted ("firstname lastname" not "lastname, firstname")
            "type": "array",
            "items": { "type": "string" }
        },
        "last_modified": { "type": "string", "format": "date" },
        "user_categories": { "type": "object", "default": {} },
        "user_metadata": { "type": "object", "default": {} },
        "series_name": { "type": "string", "default": "" },
        "series_number": { "type": "number", "default": 0 },

        // isbn & isbn13 identifiers
        "isbn": { "type": "string", "default": "" },
        "isbn10": { "type": "string", "default": "" },
        "drm_type": { "type": "string", "default": "" },

        //identifiers
        "calibre_id": { "type": "string", "default": "" },
        "amazon_id": { "type": "string", "default": "" },
        "google_id": { "type": "string", "default": "" },
        "goodreads_id": { "type": "string", "default": "" },
        "ffiction_id": { "type": "string", "default": "" },
        "barnesnoble_id": { "type": "string", "default": "" },

        // cover art urls
        "cover": { "type": "string", "default": "" }, //Image is always stored on AWS, identifier does not have leading '/', and is made up of 'bucket_name/s3_key'
        "thumb": { "type": "string", "default": "" },

        //sources determines when and how book_data_sets update the actual book.
        //each field in the book has a source (where the data came from).
        //If the data is manually entered, it is assumed to be of the highest calibre, otherwise it can be overriden
        'sources': {"type": "object", "default": {}}
    }
};



var validateUser = ajv.compile(userSchema);
var validateBook = ajv.compile(bookSchema);
var validateCredential = ajv.compile(credentialSchema);


module.exports = {
    User: function(user){
        if(!validateUser(user)){
            throw new Error("User is invalid: " + JSON.stringify(validateUser.errors))
        }
        return user
    },
    Book: function(book){
        if(!validateBook(book)){
            throw new Error("Book is invalid: " + JSON.stringify(validateBook.errors))
        }
        return book
    },
    Credential: function(cred){
        if(!validateCredential(cred)){
            throw new Error("Cred is invalid: " + JSON.stringify(validateCredential.errors))
        }
        return cred
    }
}