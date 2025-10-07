exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('username', 100).unique().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('tokens_used').defaultTo(0);
    table.integer('daily_token_limit').defaultTo(10000);
    
    table.index(['email']);
    table.index(['username']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};