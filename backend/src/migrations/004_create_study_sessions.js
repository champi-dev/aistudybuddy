exports.up = function(knex) {
  return knex.schema.createTable('study_sessions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('deck_id').references('id').inTable('decks').onDelete('CASCADE');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.integer('cards_studied').defaultTo(0);
    table.integer('correct_answers').defaultTo(0);
    table.integer('avg_response_time');
    
    table.index(['user_id']);
    table.index(['deck_id']);
    table.index(['started_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('study_sessions');
};