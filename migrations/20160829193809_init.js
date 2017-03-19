
exports.up = function(knex, Promise) {
    return Promise.all([

        knex.schema.createTable('users', function(table) {
            table.increments('uid').primary();

            table.string('name').nullable();
            table.string('email').nullable().unique();
            table.string('password_hash').nullable(); //salt is automatically included

            table.enum('plan',['basic','reader','library']).notNullable().defaultTo('basic');

            table.string('library_uuid').nullable().unique();

            table.string('catalog_token').nullable().unique();

            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        }),

        knex.schema.createTable('credentials', function(table) {
            table.increments('id').primary();
            table.integer('user_id')
                .notNullable()
                .references('uid')
                .inTable('users');
            table.string('service_type').notNullable();
            table.string('service_id').notNullable();
            table.string('name');
            table.string('email');
            table.json('oauth');
            table.json('root_folder'); //this is the service specific "QuietThyme" folder that all sub folders are created in.
            table.json('library_folder'); //this is "library" folder that all author folders are created in.
            table.json('blackhole_folder'); //this is "blackhole" folder that pending books should be copied into.

            table.string('event_cursor')
            table.unique(['service_type', 'service_id']);

            table.enum('calibre_location_code',['main','A','B']); //this location code is used by the calibre plugin to determine which storage providers are available (main, a, b)

            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        }),

        knex.schema.createTable('books', function(table){
            table.increments('id').primary();
            table.integer('user_id')
                .notNullable()
                .references('uid')
                .inTable('users');
            table.integer('credential_id')
                .references('id')
                .inTable('credentials');

            //these storage_* entries + credential_id will be loaded on initial creation.
            table.string('storage_type'); //this is duplicated in the credential_id, but allows us to create nice urls.
            table.integer('storage_size'); //size in bytes.
            table.string('storage_identifier'); // if this is quietthyme storage, storage path will be 'bucket_name/s3_key'
            table.string('storage_filename'); //just used to generate a nice looking file path.
            table.string('storage_format'); //this storage format includes the . prefix


            table.string('title');
            table.float('average_rating');
            table.integer('ratings_count');
            table.float('user_rating');
            table.text('short_summary');
            table.string('publisher');
            table.date('published_date');
            table.specificType('tags', 'text[]');
            table.specificType('authors', 'text[]'); //prefer author names to be unsorted ("firstname lastname" not "lastname, firstname")
            table.date('last_modified');

            table.json('user_categories');
            table.json('user_metadata');

            table.string('series_name');
            table.integer('series_number');

            // isbn & isbn13 identifiers
            table.string('isbn');
            table.string('isbn10');

            table.string('drm_type');

            //identifiers
            table.string('calibre_id');
            table.string('amazon_id');
            table.string('google_id');
            table.string('goodreads_id');
            table.string('ffiction_id');
            table.string('barnesnoble_id');

            // cover art urls
            table.string('cover'); //Image is always stored on AWS, identifier does not have leading '/', and is made up of 'bucket_name/s3_key'
            table.string('thumb'); // for future use. should always be null.


            //sources determines when and how book_data_sets update the actual book.
            //each field in the book has a source (where the data came from).
            //If the data is manually entered, it is assumed to be of the highest calibre, otherwise it can be overriden

            table.json('sources');

            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('books'),
        knex.schema.dropTable('credentials'),
        knex.schema.dropTable('users'),
    ])
};
