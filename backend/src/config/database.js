const knex = require('knex');

const config = {
  client: 'postgresql',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: '../migrations',
    tableName: 'knex_migrations'
  }
};

const db = knex(config);

module.exports = db;