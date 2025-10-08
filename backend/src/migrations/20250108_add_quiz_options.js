exports.up = function(knex) {
  return knex.schema.alterTable('cards', table => {
    table.jsonb('options').nullable();
    table.integer('correct_option').nullable();
    table.boolean('is_quiz').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('cards', table => {
    table.dropColumn('options');
    table.dropColumn('correct_option');
    table.dropColumn('is_quiz');
  });
};