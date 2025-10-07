exports.up = function(knex) {
  return knex.schema.createTable('card_attempts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('session_id').references('id').inTable('study_sessions').onDelete('CASCADE');
    table.uuid('card_id').references('id').inTable('cards').onDelete('CASCADE');
    table.text('user_answer');
    table.boolean('is_correct');
    table.integer('hints_used').defaultTo(0);
    table.integer('time_spent');
    table.timestamp('attempted_at').defaultTo(knex.fn.now());
    
    table.index(['session_id']);
    table.index(['card_id']);
    table.index(['attempted_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('card_attempts');
};