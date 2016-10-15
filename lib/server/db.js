var q = require('q');
// from http://www.dancorman.com/knex-your-sql-best-friend/
var knex        = null;
var knex_config = require('../../knexfile.js');

module.exports = {
    initialize: function(){
        knex = require('knex')(knex_config[process.env.NODE_ENV]);

        knex.client.initializePool(knex.client.config)
        return q(knex)
    },
    destroy: function(){
        return knex.destroy()
    }
};

// knex.migrate.latest([config]);