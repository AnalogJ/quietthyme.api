var q = require('q');
// from http://www.dancorman.com/knex-your-sql-best-friend/
var knex        = null;

module.exports = {
    initialize: function(){
        knex = require('knex')({
            client: 'postgresql',
            connection: process.env.PG_CONNECTION_STRING,
            pool: {
                min: 0,
                max: 2
            },
            migrations: {
                tableName: 'knex_migrations'
            }
        });

        knex.client.initializePool(knex.client.config)
        return q(knex)
    },
    destroy: function(){
        knex.destroy()
    }
};

// knex.migrate.latest([config]);