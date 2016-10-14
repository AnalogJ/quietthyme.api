
exports.up = function(knex, Promise) {
    return Promise.all([

        knex.schema.table('users', function (table) {

            table.string('username');
            table.string('password');

            table.string('library_uuid');

            table.string('catalog_token');
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('users', function (table) {
            table.dropColumn('username');
            table.dropColumn('password');
            table.dropColumn('library_uuid');
            table.dropColumn('catalog_token');
        })
    ])
};
