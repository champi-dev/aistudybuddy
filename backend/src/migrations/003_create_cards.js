exports.up = function(knex) {
  return knex.schema.createTable('cards', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('deck_id').references('id').inTable('decks').onDelete('CASCADE');
    table.text('front').notNullable();
    table.text('back').notNullable();
    table.text('hint_1');
    table.text('hint_2');
    table.text('hint_3');
    table.text('explanation');
    table.integer('difficulty').defaultTo(1);
    table.string('ai_cache_key', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['deck_id']);
    table.index(['difficulty']);
    table.index(['ai_cache_key']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cards');
};