var Ajv = require('ajv');
var ajv = new Ajv({ useDefaults: true, removeAdditional: true }); // options can be passed, e.g. {allErrors: true}


var userSchema = {
    "additionalProperties": false,
    "properties": {
        "user_id": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "number" },
        "password_hash": { "type": "number" },
        "plan": {
            'enum': ['none','basic','reader','library'],
            'default': 'none'
        },
        "library_uuid": { "type": "string" },
        "catalog_token": { "type": "string" },
        "stripe_sub_id": { "type": "string" },
    }
};


var credentialSchema = {
    "additionalProperties": false,
    "properties": {
        "user_id": { "type": "string" },
        "service_type": { "type": "string" },
        "service_id": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string" },
        "oauth": { "type": "object" },
        "root_folder": { "type": "object" }, //this is the service specific "QuietThyme" folder that all sub folders are created in.
        "library_folder": { "type": "object" }, //this is "library" folder that all author folders are created in.
        "blackhole_folder": { "type": "object" }, //this is "blackhole" folder that pending books should be copied into.

        "event_cursor": { "type": "string" },
        "calibre_location_code": {
            'enum': ['main','A','B'], //this location code is used by the calibre plugin to determine which storage providers are available (main, a, b)
            'default': 'none'
        }
    }
};

var bookSchema = {
    "additionalProperties": false,
    "properties": {
        "user_id": { "type": "string" },
        "credential_id": { "type": "string" },
        "storage_size": { "type": "number" },
        "storage_identifier": { "type": "string" },
        "storage_filename": { "type": "string" },
        "storage_format": { "type": "string" },


        "title": { "type": "string" },
        "average_rating": { "type": "number" },
        "ratings_count": { "type": "string" },
        "user_rating": { "type": "string" },
        "num_pages": { "type": "string" },
        "short_summary": { "type": "string" },
        "publisher": { "type": "string" },
        "published_date": {
            "type": "string",
            "format": "date"
        },
        "tags": {
            "type": "array",
            "items": { "type": "string" }
        },
        "authors": { //prefer author names to be unsorted ("firstname lastname" not "lastname, firstname")
            "type": "array",
            "items": { "type": "string" }
        },
        "last_modified": { "type": "string", "format": "date" },
        "user_categories": { "type": "object" },
        "user_metadata": { "type": "object" },
        "series_name": { "type": "string" },
        "series_number": { "type": "number" },

        // isbn & isbn13 identifiers
        "isbn": { "type": "string" },
        "isbn10": { "type": "string" },
        "drm_type": { "type": "string" },

        //identifiers
        "calibre_id": { "type": "string" },
        "amazon_id": { "type": "string" },
        "google_id": { "type": "string" },
        "goodreads_id": { "type": "string" },
        "ffiction_id": { "type": "string" },
        "barnesnoble_id": { "type": "string" },

        // cover art urls
        "cover": { "type": "string" }, //Image is always stored on AWS, identifier does not have leading '/', and is made up of 'bucket_name/s3_key'
        "thumb": { "type": "string" },

        //sources determines when and how book_data_sets update the actual book.
        //each field in the book has a source (where the data came from).
        //If the data is manually entered, it is assumed to be of the highest calibre, otherwise it can be overriden
        'sources': {"type": "object"}
    }
};



var validateUser = ajv.compile(userSchema);
var validateBook = ajv.compile(bookSchema);
var validateCredential = ajv.compile(credentialSchema);


module.exports = {
    User: validateUser,
    Book: validateBook,
    Credential: validateCredential
}