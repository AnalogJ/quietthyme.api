
exports.up = function(knex, Promise) {
    return Promise.all([

        knex.schema.createTable('login_sessions', function(table) {
            table.string('id').primary();
            table.text('auth_data');
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('login_sessions'),
    ])
};
