// Update with your config settings.

module.exports = {
  beta: {
    client: 'postgresql',
    connection: process.env.PG_CONNECTION_STRING,
    pool: {
      min: 0,
      max: 1
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  master: {
    client: 'postgresql',
    connection: process.env.PG_CONNECTION_STRING,
    pool: {
      min: 0,
      max: 1
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
