exports.up = function(knex) {
  return knex.schema.createTable('decks', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('category', 100);
    table.integer('difficulty_level').defaultTo(1);
    table.boolean('ai_generated').defaultTo(false);
    table.text('source_prompt');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_studied');
    
    table.index(['user_id']);
    table.index(['category']);
    table.index(['difficulty_level']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('decks');
};