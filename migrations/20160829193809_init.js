
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
            table.string('root_folder_id'); //this is the service specific "QuietThyme" folder that all sub folders are created in.
            table.string('library_folder_id'); //this is "library" folder that all author folders are created in.
            table.string('blackhole_folder_id'); //this is "blackhole" folder that pending books should be copied into.



            table.unique(['service_type', 'service_id']);

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

            table.string('title');
            table.float('average_rating');
            table.text('short_summary');
            table.string('publisher');
            table.date('published_date');
            table.specificType('tags', 'text[]');
            table.specificType('authors', 'text[]');
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
            table.string('storage_type');
            table.string('cover');
            table.string('thumb');

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
