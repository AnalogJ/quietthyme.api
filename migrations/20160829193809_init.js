
exports.up = function(knex, Promise) {
    return Promise.all([

        knex.schema.createTable('users', function(table) {
            table.increments('uid').primary();
            table.string('email').nullable().unique();
            table.string('password_hash').nullable(); //salt is automatically included

            table.enum('plan',['basic','reader','library']).notNullable().defaultTo('basic');

            table.string('library_uuid').nullable().unique();

            table.string('catalog_token').nullable().unique();

            table.timestamps();
        }),

        knex.schema.createTable('credentials', function(table) {
            table.increments('id').primary();
            table.integer('user_id')
                .references('uid')
                .inTable('users');
            table.string('service_type');
            table.string('service_id');
            table.string('name');
            table.string('email');
            table.json('oauth');
            table.timestamps();
        }),

        knex.schema.createTable('books', function(table){
            table.increments('id').primary();
            table.integer('user_id')
                .references('uid')
                .inTable('users');
            table.integer('credential_id')
                .references('id')
                .inTable('credentials');

            table.string('title');
            table.float('average_rating');
            table.string('short_summary');
            table.string('publisher');
            table.date('published_date');
            table.json('tags');
            table.json('authors');
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
            table.string('cover');
            table.string('thumb');

            table.timestamps();
        }),

        knex.schema.createTable('login_sessions', function(table) {
            table.string('id').primary();
            table.text('auth_data');
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('books'),
        knex.schema.dropTable('credentials'),
        knex.schema.dropTable('users'),
        knex.schema.dropTable('login_sessions')
    ])
};
