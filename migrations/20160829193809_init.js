
exports.up = function(knex, Promise) {
    return Promise.all([

        knex.schema.createTable('users', function(table) {
            table.increments('uid').primary();
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
            table.string('series_name');
            table.integer('series_number');
            table.string('isbn');
            table.string('isbn10');
            table.integer('num_pages');
            table.float('average_rating');
            table.integer('ratings_count');
            table.string('publisher');
            table.date('published_date');
            //tags should be an array
            table.json('tags');
            table.string('short_summary');
            table.string('drm_type');

            //object:
            // name
            // alias
            // goodreads_id
            // ffiction_id
            // amazon_id
            // google_id
            // barnesnobel_id
            table.json('authors');

            // cover art urls
            table.string('cover');
            table.string('thumb');

            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('books'),
        knex.schema.dropTable('credentials'),
        knex.schema.dropTable('users')
    ])
};
