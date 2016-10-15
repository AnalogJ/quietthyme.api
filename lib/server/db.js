var q = require('q');
// from http://www.dancorman.com/knex-your-sql-best-friend/
// http://blog.rowanudell.com/database-connections-in-lambda/
var knex_config = require('../../knexfile.js');
var knex        = require('knex')(knex_config[process.env.NODE_ENV]);

module.exports = {
    get: function(){
        return q(knex)
    },
    destroy: function(){
        return knex.destroy()
    }
};

// knex.migrate.latest([config]);