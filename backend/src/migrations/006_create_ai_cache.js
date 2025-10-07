exports.up = function(knex) {
  return knex.schema.createTable('ai_cache', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('cache_key', 255).unique().notNullable();
    table.string('request_type', 50);
    table.string('request_hash', 255);
    table.text('response');
    table.integer('tokens_used');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    
    table.index(['cache_key']);
    table.index(['request_type']);
    table.index(['expires_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ai_cache');
};