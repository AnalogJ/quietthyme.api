var Ajv = require('ajv');
var userSchema = {
  additionalProperties: false,
  properties: {
    uid: { type: 'string' },
    first_name: { type: 'string' },
    last_name: { type: 'string' },
    email: { type: 'string' },
    password_hash: { type: 'string' },
    plan: {
      enum: ['none', 'basic', 'reader', 'library'],
      default: 'none',
    },
    library_uuid: {
      type: ['string', 'null'],
      default: null,
    },
    catalog_token: { type: 'string' },
    stripe_sub_id: {
      type: ['string', 'null'],
      default: null,
    },
    push_notifications: { type: 'object', default: {} },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

var credentialSchema = {
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    user_id: { type: 'string' },
    service_type: { type: 'string' },
    service_id: { type: 'string' },
    name: { type: ['string', 'null'], default: null },
    email: { type: ['string', 'null'], default: null },
    oauth: { type: 'object' },
    root_folder: { type: 'object', default: {} }, //this is the service specific "QuietThyme" folder that all sub folders are created in.
    library_folder: { type: 'object', default: {} }, //this is "library" folder that all author folders are created in.
    blackhole_folder: { type: 'object', default: {} }, //this is "blackhole" folder that pending books should be copied into.

    event_cursor: { type: ['string', 'null'], default: null },
    calibre_location_code: {
      enum: [null, 'main', 'A', 'B'], //this location code is used by the calibre plugin to determine which storage providers are available (main, a, b)
      default: null,
    },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

var bookSchema = {
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    user_id: { type: 'string' },
    credential_id: { type: 'string' },
    storage_size: { type: 'number' },
    storage_identifier: { type: 'string' },
    storage_filename: { type: 'string' },
    storage_format: { type: 'string' },
    storage_type: { type: 'string' },

    title: { type: 'string' },
    average_rating: { type: ['number', 'null'], default: null },
    ratings_count: { type: ['number', 'null'], default: null },
    user_rating: { type: ['number', 'null'], default: null },
    num_pages: { type: ['number', 'null'], default: null },
    short_summary: { type: ['string', 'null'], default: null },
    publisher: { type: ['string', 'null'], default: null },
    published_date: {
      type: 'string',
      format: 'date-time',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      default: [],
    },
    authors: {
      //prefer author names to be unsorted ("firstname lastname" not "lastname, firstname")
      type: 'array',
      items: { type: 'string' },
    },
    primary_author: { type: ['string', 'null'], default: null },
    last_modified: { type: ['string', 'null'], format: 'date-time' },
    user_categories: { type: 'object', default: {} },
    user_metadata: { type: 'object', default: {} },
    series_name: { type: ['string', 'null'], default: null },
    series_number: { type: ['number', 'null'], default: null },

    // isbn & isbn13 identifiers
    isbn: { type: ['string', 'null'], default: null },
    isbn10: { type: ['string', 'null'], default: null },
    drm_type: { type: ['string', 'null'], default: null },

    //identifiers
    calibre_id: { type: ['string', 'null'], default: null },
    amazon_id: { type: ['string', 'null'], default: null },
    google_id: { type: ['string', 'null'], default: null },
    goodreads_id: { type: ['string', 'null'], default: null },
    ffiction_id: { type: ['string', 'null'], default: null },
    barnesnoble_id: { type: ['string', 'null'], default: null },

    // cover art urls
    cover: { type: ['string', 'null'], default: null }, //Image is always stored on AWS, identifier does not have leading '/', and is made up of 'bucket_name/s3_key'
    thumb: { type: ['string', 'null'], default: null },

    //sources determines when and how book_data_sets update the actual book.
    //each field in the book has a source (where the data came from).
    //If the data is manually entered, it is assumed to be of the highest calibre, otherwise it can be overriden
    sources: { type: 'object', default: {} },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

var createClasses = new Ajv({ useDefaults: true, removeAdditional: true }); // options can be passed, e.g. {allErrors: true}

var validateCreateUser = createClasses.compile(userSchema);
var validateCreateBook = createClasses.compile(bookSchema);
var validateCreateCredential = createClasses.compile(credentialSchema);

var updateClasses = new Ajv({ removeAdditional: true }); // options can be passed, e.g. {allErrors: true}

var validateUpdateUser = updateClasses.compile(userSchema);
var validateUpdateBook = updateClasses.compile(bookSchema);
var validateUpdateCredential = updateClasses.compile(credentialSchema);

module.exports = {
  createUser: function(user) {
    if (!validateCreateUser(user)) {
      throw new Error(
        'User is invalid: ' + JSON.stringify(validateCreateUser.errors)
      );
    }
    return user;
  },
  createBook: function(book) {
    if (!validateCreateBook(book)) {
      throw new Error(
        'Book is invalid: ' + JSON.stringify(validateCreateBook.errors)
      );
    }
    return book;
  },
  createCredential: function(cred) {
    if (!validateCreateCredential(cred)) {
      throw new Error(
        'Cred is invalid: ' + JSON.stringify(validateCreateCredential.errors)
      );
    }
    return cred;
  },
  updateUser: function(user) {
    if (!validateUpdateUser(user)) {
      throw new Error(
        'User is invalid: ' + JSON.stringify(validateUpdateUser.errors)
      );
    }
    return user;
  },
  updateBook: function(book) {
    if (!validateUpdateBook(book)) {
      throw new Error(
        'Book is invalid: ' + JSON.stringify(validateUpdateBook.errors)
      );
    }
    return book;
  },
  updateCredential: function(cred) {
    if (!validateUpdateCredential(cred)) {
      throw new Error(
        'Cred is invalid: ' + JSON.stringify(validateUpdateCredential.errors)
      );
    }
    return cred;
  },
};
