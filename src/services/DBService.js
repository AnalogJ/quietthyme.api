var q = require('q');
// from http://www.dancorman.com/knex-your-sql-best-friend/
// http://blog.rowanudell.com/database-connections-in-lambda/
// http://theburningmonk.com/2016/05/aws-lambda-constant-timeout-when-using-bluebird-promise/ - ugh is this the reason that cloudrails is timing out?1

var knex_config = require('../../knexfile.js');
var knex        = null;

module.exports = {
    get: function(){
        if(knex){
            return q(knex)
        }
        else{
            knex = require('knex')(knex_config[process.env.STAGE]);
            knex.client.initializePool(knex.client.config);
            return q(knex)
        }
    },
    destroy: function(){
        if(knex){
            return knex.destroy()
                .then(function(){
                    knex = null
                })
        }
        else{
            return q({})
        }
    }
};

// knex.migrate.latest([config]);